import { tokensABI } from './../abi/tokens';
import { Component } from '@nestjs/common';
import { Contract } from 'web3/types';

const Web3 = require('web3');

import { Observable } from 'rxjs/Observable';
import 'rxjs/add/observable/timer';

import { registrationBodyTemplate, validateAerAccountSwap, calcTokenAmount } from '../shared/helpers/swap-utils';
import { SwapStorageService } from './swap-storage.service';
import { OpenAtomicSwapERC20 } from './../abi/OpenAtomicSwapERC20';
import { CounterAtomicSwapERC20 } from './../abi/CounterAtomicSwapERC20';
import { SwapTemplate } from './../swap-template/interfaces/swap-template.interface';
import { TokenType } from './../swap/interfaces/swap.interface';
import { TokenService } from '../shared/token/token.service';
import { AerumNameService } from '../shared/aerum-name-service/aerum-name.service';

@Component()
export class OppositeSwapErc20Service {
  private transactionHashList = []
  private web3: any;
  private ethWeb3: any;
  private templateRateDecimals: number;

  constructor(private readonly swapStorageService: SwapStorageService,
    private readonly tokenService: TokenService,
    private readonly aerumNameService: AerumNameService) {
    this.web3 = new Web3(new Web3.providers.HttpProvider(process.env.aerumHttpProvider));
    this.ethWeb3 = new Web3(new Web3.providers.HttpProvider(process.env.ethHttpProvider));
    this.templateRateDecimals = Number(process.env.templateRateDecimals);
  }

  /**
   * Registrates open, close and expire event listners
   * @param {SwapTemplate} template - swap template
   */
  async swapEventListener(template: SwapTemplate) {
    const openAtomicSwapERC20Contract = new this.web3.eth.Contract(OpenAtomicSwapERC20, process.env.AerOpenAtomicSwapERC20);
    const counterAtomicSwapERC20Contract = new this.ethWeb3.eth.Contract(CounterAtomicSwapERC20, process.env.EthCounterAtomicSwapERC20);

    const aerCurrentBlock = await this.web3.eth.getBlockNumber();
    console.log('erc20 opposite swap >>>> current block aerum', aerCurrentBlock);

    const erc20CurrentBlock = await this.ethWeb3.eth.getBlockNumber();
    console.log('erc20 opposite swap >>>> current block eth', erc20CurrentBlock);

    const normalizedTemplate =  await this.aerumNameService.normalizeTemplate(template);

    // Open events registration
    Observable.timer(0, 10000)
      .subscribe(_ => {
        openAtomicSwapERC20Contract.getPastEvents('Open', { fromBlock: aerCurrentBlock - 1, toBlock: 'latest' }, (error, txs) => {
          if(!txs) { return; }
          txs.forEach(res => {
            if(this.transactionHashList.findIndex(h => h === res.transactionHash) !== -1) {
              return;
            }
            this.transactionHashList.push(res.transactionHash);
            registrationBodyTemplate(aerCurrentBlock, error, res,
              async () => await this.openHandler(openAtomicSwapERC20Contract, counterAtomicSwapERC20Contract, normalizedTemplate, res));
          });
        })
      });

    // Expire events registration
    Observable.timer(0, 10000)
      .subscribe(_ => {
        openAtomicSwapERC20Contract.getPastEvents('Expire', { fromBlock: aerCurrentBlock - 1, toBlock: 'latest' }, (error, txs) => {
          if(!txs) { return; }
          txs.forEach(res => {
            if(this.transactionHashList.findIndex(h => h === res.transactionHash) !== -1) {
              return;
            }
            this.transactionHashList.push(res.transactionHash);
            registrationBodyTemplate(aerCurrentBlock, error, res,
              async () => await this.expireHandler(counterAtomicSwapERC20Contract, normalizedTemplate, res));
          });
        })
      });

    // Close events registration
    Observable.timer(0, 10000)
      .subscribe(_ => {
        counterAtomicSwapERC20Contract.getPastEvents('Close', { fromBlock: erc20CurrentBlock - 1, toBlock: 'latest' }, (error, txs) => {
          if(!txs) { return; }
          txs.forEach(res => {
            if(this.transactionHashList.findIndex(h => h === res.transactionHash) !== -1) {
              return;
            }
            this.transactionHashList.push(res.transactionHash);
            registrationBodyTemplate(erc20CurrentBlock, error, res,
              async () => await this.closeHandler(openAtomicSwapERC20Contract, normalizedTemplate, res));
          });
        })
      });
  }

  // Handler for open events
  private async openHandler(openAtomicSwapERC20Contract: Contract, counterAtomicSwapERC20Contract: Contract, template: SwapTemplate, res) {
    const hash = res.returnValues._hash;
    const aerumAccounts = await this.web3.eth.getAccounts();
    const aerumAccount = aerumAccounts[process.env.privateAerNodeAddressIndex];

    const ethAccounts = await this.ethWeb3.eth.getAccounts();
    const ethAccount = ethAccounts[process.env.privateEthNodeAddressIndex];

    this.swapStorageService.findById(hash).then(async (swapExists) => {
      // If swap already exists in database, just skip it
      if (swapExists) {
        console.log('erc20 opposite swap open >>>>> swap with specified hash already exist', hash);
        return;
      }
      try {
        console.log('erc20 opposite swap open >>>>> not found record in db for swap');
        const checkRes = await openAtomicSwapERC20Contract.methods.check(hash).call();
        const withdrawTrader = checkRes.withdrawTrader.toLowerCase();
        if(withdrawTrader !== template.offchainAccount) {
          console.log('erc20 opposite swap open >>>>> template trader doesn\'t match swap trader. skipping');
          return;
        }
        const exchangeRate = template.rate / Math.pow(10, this.templateRateDecimals);
        const timelock = Number(checkRes.timelock);
        const erc20Value = Number(checkRes.erc20Value);

        if (validateAerAccountSwap(withdrawTrader, erc20Value, timelock, exchangeRate)) {

          //TODO: ADD NAME SERVICE
          const aerErc20Token = await this.tokenService.getAerNetworkTokenInfo(template.offchainAsset, aerumAccount);
          const ethErc20Token = await this.tokenService.getEthNetworkTokenInfo(template.onchainAsset, ethAccount);

          const value = calcTokenAmount(erc20Value, aerErc20Token.decimals, ethErc20Token.decimals, exchangeRate);

          // Adding swap model to database
          this.swapStorageService.create(hash, timelock, value, ethAccount, withdrawTrader, null, TokenType.Erc20);
          console.log('erc20 opposite swap open >>>>> adding swap model to db');

          // Opening swap in counter swap contract
          const tokenContract = new this.ethWeb3.eth.Contract(tokensABI, template.onchainAsset, {from: ethAccount, gas: 4000000});
          await tokenContract.methods.approve(process.env.EthCounterAtomicSwapERC20, value).send({from: ethAccount, gas: 4000000});
          const erc20Res = await counterAtomicSwapERC20Contract.methods.open(hash, value, template.onchainAsset, timelock).send({from: ethAccount, gas: 4000000})
          console.log('erc20 opposite swap open >>>>> counter swap erc20 contract opened', JSON.stringify(erc20Res));
          
          // Updating swap with open status
          this.swapStorageService.updateById(hash, {status: 'open'});
        } else {
          console.log('erc20 opposite swap open >>>>> ERROR during swap validation', JSON.stringify({
            withdrawTrader: withdrawTrader,
            value: erc20Value,
            timelock: timelock,
            exchangeRate: exchangeRate
          }));
        }
      } catch(err) {
        console.log('erc20 opposite swap open >>>>> ERROR while opening swap contract', err);
      }
    });
  }

  // Handler for expire events
  private async expireHandler(counterAtomicSwapERC20Contract: Contract, template: SwapTemplate, res) {
    const hash = res.returnValues._hash;
    const ethAccounts = await this.ethWeb3.eth.getAccounts();
    const ethAccount = ethAccounts[process.env.privateEthNodeAddressIndex];

    this.swapStorageService.findById(hash).then(async (swap) => {
      if(!swap) {
        console.log("erc20 opposite swap expire >>>>> swap is null. skipping");
        return;
      }
      if(swap.withdrawTrader !== template.offchainAccount) {
        console.log('erc20 opposite swap expire >>>>> template trader doesn\'t match swap trader. skipping');
        return;
      }
      if (swap.status === 'open') {
        try {
          await counterAtomicSwapERC20Contract.methods.expire(hash).send({from: ethAccount, gas: 4000000});
          this.swapStorageService.updateById(hash, {status: 'expired'});
          console.log('erc20 opposite swap expire >>>>> counter swap erc20 contract expired');
        } catch(err) {
          console.log('erc20 opposite swap expire >>>>> ERROR while expiring counter swap contract', err);
        }
      }
    });
  }

  // Handler for close events
  private async closeHandler(openAtomicSwapERC20Contract: Contract, template: SwapTemplate, res) {
    const aerumAccounts = await this.web3.eth.getAccounts();
    const hash = res.returnValues._hash;
    const secretKey = res.returnValues._secretKey;

    this.swapStorageService.findById(hash).then(async (swap) => {
      if(!swap) {
        console.log("erc20 opposite swap close >>>>> swap is null. skipping");
        return;
      }
      if(swap.withdrawTrader !== template.offchainAccount) {
        console.log('erc20 opposite swap close >>>>> template trader doesn\'t match swap trader. skipping');
        return;
      }
      if (swap.status === 'open') {
        try {
          await openAtomicSwapERC20Contract.methods.close(hash, secretKey).send({from: aerumAccounts[process.env.privateAerNodeAddressIndex], gas: 4000000});
          this.swapStorageService.updateById(hash, {status: 'closed'});
          console.log('erc20 opposite swap close >>>>> swap erc20 contract closed');
        } catch(err) {
          console.log('erc20 opposite swap close >>>>> ERROR while closing swap contract', err);
        }
      }
    });
  }
}