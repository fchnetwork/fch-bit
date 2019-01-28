import { tokensABI } from './../abi/tokens';
import { Component } from '@nestjs/common';
import { Contract } from 'web3/types';

const Web3 = require('web3');

import { Observable } from 'rxjs/Observable';
import 'rxjs/add/observable/timer';

import { registrationBodyTemplate, validateEthAccountSwap, calcTokenAmount } from '../shared/helpers/swap-utils';
import { SwapStorageService } from './swap-storage.service';
import { OpenAtomicSwapEther } from '../abi/OpenAtomicSwapEther';
import { CounterAtomicSwapERC20 } from './../abi/CounterAtomicSwapERC20';
import { SwapTemplate } from './../swap-template/interfaces/swap-template.interface';
import { TokenType } from './../swap/interfaces/swap.interface';
import { TokenService } from '../shared/token/token.service';
import { AerumNameService } from '../shared/aerum-name-service/aerum-name.service';

@Component()
export class SwapService {
  private transactionHashList = []
  private web3: any;
  private ethWeb3: any;
  private etherDigits = 18;
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
    const openAtomicSwapEthContract = new this.ethWeb3.eth.Contract(OpenAtomicSwapEther, process.env.EthOpenAtomicSwapEther);
    const counterAtomicSwapERC20Contract = new this.web3.eth.Contract(CounterAtomicSwapERC20, process.env.AerCounterAtomicSwapERC20);

    const ethCurrentBlock = await this.ethWeb3.eth.getBlockNumber();
    console.log('swap >>>> current block eth', ethCurrentBlock);

    const aerCurrentBlock = await this.web3.eth.getBlockNumber();
    console.log('swap >>>> current block aerum', aerCurrentBlock);

    const normalizedTemplate =  await this.aerumNameService.normalizeTemplate(template);

    // Open events registration
    Observable.timer(0, 10000)
      .subscribe(_ => {
        openAtomicSwapEthContract.getPastEvents('Open', { fromBlock: ethCurrentBlock - 1, toBlock: 'latest' }, (error, txs) => {
          if(!txs) { return; }
          txs.forEach(res => {
            if(this.transactionHashList.findIndex(h => h === res.transactionHash) !== -1) {
              return;
            }
            this.transactionHashList.push(res.transactionHash);
            registrationBodyTemplate(ethCurrentBlock, error, res,
              async () => await this.openHandler(openAtomicSwapEthContract, counterAtomicSwapERC20Contract, normalizedTemplate, res));
          });
        })
    })

    // Expire events registration
    Observable.timer(0, 10000)
      .subscribe(_ => {
        openAtomicSwapEthContract.getPastEvents('Expire', { fromBlock: ethCurrentBlock - 1, toBlock: 'latest' }, (error, txs) => {
          if(!txs) { return; }
          txs.forEach(res => {
            if(this.transactionHashList.findIndex(h => h === res.transactionHash) !== -1) {
              return;
            }
            this.transactionHashList.push(res.transactionHash);
            registrationBodyTemplate(ethCurrentBlock, error, res,
              async () => await this.expireHandler(counterAtomicSwapERC20Contract, normalizedTemplate, res));
          });
        })
    })

    // Close events registration
    Observable.timer(0, 10000)
      .subscribe(_ => {
        counterAtomicSwapERC20Contract.getPastEvents('Close', { fromBlock: aerCurrentBlock - 1, toBlock: 'latest' }, (error, txs) => {
          if(!txs) { return; }
          txs.forEach(res => {
            if(this.transactionHashList.findIndex(h => h === res.transactionHash) !== -1) {
              return;
            }
            this.transactionHashList.push(res.transactionHash);
            registrationBodyTemplate(aerCurrentBlock, error, res,
              async () => await this.closeHandler(openAtomicSwapEthContract, normalizedTemplate, res));
          });
        })
    })
  }

  // Handler for open events
  private async openHandler(openAtomicSwapEthContract: Contract, counterAtomicSwapERC20Contract: Contract, template: SwapTemplate, res) {
    const hash = res.returnValues._hash;
    const aerumAccounts = await this.web3.eth.getAccounts();
    const aerumAccount = aerumAccounts[process.env.privateAerNodeAddressIndex];

    this.swapStorageService.findById(hash).then(async (swapExists) => {
      // If swap already exists in database, just skip it
      if (swapExists) {
        console.log('swap open >>>>> swap with specified hash already exist', hash);
        return;
      }
      try {
        console.log('swap open >>>>> not found record in db for swap');
        const checkRes = await openAtomicSwapEthContract.methods.check(hash).call();
        const withdrawTrader = checkRes.withdrawTrader.toLowerCase();
        if(withdrawTrader !== template.offchainAccount) {
          console.log('swap open >>>>> template trader doesn\'t match swap trader. skipping');
          return;
        }
        const exchangeRate = template.rate / Math.pow(10, this.templateRateDecimals);
        const timelock = Number(checkRes.timelock);
        const ethValue = Number(checkRes.value);

        if (validateEthAccountSwap(withdrawTrader, ethValue, timelock, exchangeRate)) {
          const aerErc20Token = await this.tokenService.getAerNetworkTokenInfo(template.onchainAsset, aerumAccount);
          const value = calcTokenAmount(ethValue, this.etherDigits, aerErc20Token.decimals, exchangeRate);

          // Adding swap model to database
          this.swapStorageService.create(hash, timelock, value, aerumAccount, withdrawTrader, null, TokenType.Eth);
          console.log('swap open >>>>> adding swap model to db');

          // Opening swap in counter swap contract
          const tokenContract = new this.web3.eth.Contract(tokensABI, template.onchainAsset, {from: aerumAccount, gas: 4000000});
          await tokenContract.methods.approve(process.env.AerCounterAtomicSwapERC20, value).send({from: aerumAccount, gas: 4000000});
          const erc20Res = await counterAtomicSwapERC20Contract.methods.open(hash, value, template.onchainAsset, timelock).send({from: aerumAccount, gas: 4000000})
          console.log('swap open >>>>> counter swap erc20 contract opened', JSON.stringify(erc20Res));
          
          // Updating swap with open status
          this.swapStorageService.updateById(hash, {status: 'open'});
        } else {
          console.log('swap open >>>>> ERROR during swap validation', JSON.stringify({
            withdrawTrader: withdrawTrader,
            value: ethValue,
            timelock: timelock,
            exchangeRate: exchangeRate
          }));
        }
      } catch(err) {
        console.log('swap open >>>>> ERROR while opening swap contract', err);
      }
    });
  }

  // Handler for expire events
  private async expireHandler(counterAtomicSwapERC20Contract: Contract, template: SwapTemplate, res) {
    const hash = res.returnValues._hash;
    const aerumAccounts = await this.web3.eth.getAccounts();
    const aerumAccount = aerumAccounts[process.env.privateAerNodeAddressIndex];

    this.swapStorageService.findById(hash).then(async (swap) => {
      if(!swap) {
        console.log("swap expire >>>>> swap is null. skipping");
        return;
      }
      if(swap.tokenType !== TokenType.Eth) {
        console.log("swap expire >>>>> received close event, tokenType does not match, skipping");
        return;
      }
      if(swap.withdrawTrader !== template.offchainAccount) {
        console.log('swap expire >>>>> template trader doesn\'t match swap trader. skipping');
        return;
      }
      if (swap.status === 'open') {
        try {
          await counterAtomicSwapERC20Contract.methods.expire(hash).send({from: aerumAccount, gas: 4000000});
          this.swapStorageService.updateById(hash, {status: 'expired'});
          console.log('swap expire >>>>> counter swap ERC20 contract expired');
        } catch(err) {
          console.log('swap expire >>>>> ERROR while expiring counter swap ERC20 contract', err);
        }
      }
    });
  }

  // Handler for close events
  private async closeHandler(openAtomicSwapEthContract: Contract, template: SwapTemplate, res) {
    const ethAccounts = await this.ethWeb3.eth.getAccounts();
    const ethAccount = ethAccounts[process.env.privateEthNodeAddressIndex];
    const hash = res.returnValues._hash;
    const secretKey = res.returnValues._secretKey;
    this.swapStorageService.findById(hash).then(async (swap) => {
      if(!swap){
        console.log("swap close >>>>> received close event, swap is null, skipping");
        return;
      }
      if(swap.tokenType !== TokenType.Eth) {
        console.log("swap close >>>>> received close event, tokenType does not match, skipping");
        return;
      }
      if(swap.withdrawTrader !== template.offchainAccount) {
        console.log('swap close >>>>> template trader doesn\'t match swap trader. skipping');
        return;
      }
      if (swap.status === 'open') {
        try {
          await openAtomicSwapEthContract.methods.close(hash, secretKey).send({from: ethAccount, gas: 4000000});
          this.swapStorageService.updateById(hash, {status: 'closed'});
          console.log('swap close >>>>> swap eth contract closed');
        } catch(err) {
          console.log('swap close >>>>> ERROR while closing swap contract', err);
        }
      }
    });
  }
}
