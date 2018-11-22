import { Component } from '@nestjs/common';
import { Contract } from 'web3/types';

const Web3 = require('web3');

import { registrationBodyTemplate, validateAerAccountSwap, calcEthAmount } from '../shared/helpers/swap-utils';
import { SwapStorageService } from './swap-storage.service';
import { OpenAtomicSwapERC20 } from './../abi/OpenAtomicSwapERC20';
import { CounterAtomicSwapEther } from './../abi/CounterAtomicSwapEther';
import { SwapTemplate } from './../swap-template/interfaces/swap-template.interface';
import { TokenType } from './../swap/interfaces/swap.interface';
import { AerumNameService } from '../shared/aerum-name-service/aerum-name.service';

@Component()
export class OppositeSwapService {
  web3: any;
  ethWeb3: any;

  tokenDigits: number;
  etherDigits = 18;
  templateRateDecimals = 18;

  constructor(private readonly swapStorageService: SwapStorageService,
    private readonly aerumNameService: AerumNameService) {
    this.web3 = new Web3(new Web3.providers.WebsocketProvider(process.env.aerumProvider));
    this.ethWeb3 = new Web3(new Web3.providers.WebsocketProvider(process.env.ethProvider));

    this.tokenDigits = Number(process.env.presetTokenDigits);
  }

  /**
   * Registrates open, close and expire event listners
   * @param {SwapTemplate} template - swap template
   */
  async swapEventListener(template: SwapTemplate) {
    const openAtomicSwapERC20Contract = new this.web3.eth.Contract(OpenAtomicSwapERC20, process.env.AerOpenAtomicSwapERC20);
    const counterAtomicSwapEtherContract = new this.ethWeb3.eth.Contract(CounterAtomicSwapEther, process.env.EthCounterAtomicSwapETH);

    const aerCurrentBlock = await this.web3.eth.getBlockNumber();
    console.log('opposite swap >>>> current block aerum', aerCurrentBlock);

    const ethCurrentBlock = await this.ethWeb3.eth.getBlockNumber();
    console.log('opposite swap >>>> current block eth', ethCurrentBlock);

    const normalizedTemplate =  await this.aerumNameService.normalizeTemplate(template);

    // Open events registration
    openAtomicSwapERC20Contract.events.Open({ fromBlock: aerCurrentBlock - 1 }, (error, res) => {
      registrationBodyTemplate(aerCurrentBlock, error, res,
        async () => await this.openHandler(openAtomicSwapERC20Contract, counterAtomicSwapEtherContract, normalizedTemplate, res));
    });

    // Expire events registration
    openAtomicSwapERC20Contract.events.Expire({ fromBlock: aerCurrentBlock - 1 }, (error, res) => {
      registrationBodyTemplate(aerCurrentBlock, error, res,
        async () => await this.expireHandler(counterAtomicSwapEtherContract, normalizedTemplate, res));
    });

    // Close events registration
    counterAtomicSwapEtherContract.events.Close({ fromBlock: ethCurrentBlock - 1 }, (error, res) => {
      registrationBodyTemplate(ethCurrentBlock, error, res,
        async () => await this.closeHandler(openAtomicSwapERC20Contract, normalizedTemplate, res));
    });
  }

  // Handler for expire events
  private async openHandler(openAtomicSwapERC20Contract: Contract, counterAtomicSwapEtherContract: Contract, template: SwapTemplate, res) {
    const hash = res.returnValues._hash;
    const ethAccounts = await this.ethWeb3.eth.getAccounts();
    const ethAccount = ethAccounts[process.env.privateEthNodeAddressIndex];

    this.swapStorageService.findById(hash).then(async (swapExists) => {
      // If swap already exists in database, just skip it
      if (swapExists) {
        console.log('opposite swap open >>>>> swap with specified hash already exist', hash);
        return;
      }
      try {
        console.log('opposite swap open >>>>> not found record in db for swap');
        const checkRes = await openAtomicSwapERC20Contract.methods.check(hash).call();
        const withdrawTrader = checkRes.withdrawTrader.toLowerCase();
        if(withdrawTrader !== template.offchainAccount) {
          console.log('opposite swap open >>>>> template trader doesn\'t match swap trader. skipping');
          return;
        }
        const exchangeRate = template.rate / Math.pow(10, this.templateRateDecimals);
        const timelock = Number(checkRes.timelock);
        const erc20Value = Number(checkRes.erc20Value);

        if (validateAerAccountSwap(withdrawTrader, erc20Value, timelock, exchangeRate)) {
          const value = calcEthAmount(erc20Value, this.tokenDigits, exchangeRate); //TODO Change Token Digits to take from contract
          // Adding swap model to database
          this.swapStorageService.create(hash, timelock, value, ethAccount, withdrawTrader, null, TokenType.Eth);
          console.log('opposite swap open >>>>> adding swap model to db');
          // Opening swap in counter swap contract
          var ethRes = await counterAtomicSwapEtherContract.methods.open(hash, timelock).send({value: value, from: ethAccount, gas: 4000000});
          console.log('opposite swap open >>>>> counter swap ether contract opened', JSON.stringify(ethRes));
          // Updating swap with open status
          this.swapStorageService.updateById(hash, {status: 'open'});
        } else {
          console.log('opposite swap open >>>>> ERROR during swap validation', JSON.stringify({
            withdrawTrader: withdrawTrader,
            value: erc20Value,
            timelock: timelock,
            exchangeRate: exchangeRate
          }));
        }
      } catch(err) {
        console.log('opposite swap open >>>>> ERROR while opening counter swap contract', err);
      }
    });
  }

  // Handler for expire events
  private async expireHandler(counterAtomicSwapEtherContract: Contract, template: SwapTemplate, res) {
    const hash = res.returnValues._hash;
    const ethAccounts = await this.ethWeb3.eth.getAccounts();
    const ethAccount = ethAccounts[process.env.privateEthNodeAddressIndex];
    
    this.swapStorageService.findById(hash).then(async (swap) => {
      if(!swap) {
        console.log("opposite swap expire >>>>> swap is null. skipping");
        return;
      }
      if(swap.withdrawTrader !== template.offchainAccount) {
        console.log('opposite swap expire >>>>> template trader doesn\'t match swap trader. skipping');
        return;
      }
      if (swap.status === 'open') {
        try {
          await counterAtomicSwapEtherContract.methods.expire(hash).send({from: ethAccount, gas: 4000000});
          this.swapStorageService.updateById(hash, {status: 'expired'});
          console.log('opposite swap expire >>>>> counter swap ether contract expired');
        } catch(err) {
          console.log('opposite swap expire >>>>> ERROR while expiring counter swap contract', err);
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
        console.log("opposite swap close >>>>> swap is null. skipping");
        return;
      }
      if(swap.withdrawTrader !== template.offchainAccount) {
        console.log('opposite swap close >>>>> template trader doesn\'t match swap trader. skipping');
        return;
      }
      if (swap.status === 'open') {
        try {
          await openAtomicSwapERC20Contract.methods.close(hash, secretKey).send({from: aerumAccounts[process.env.privateAerNodeAddressIndex], gas: 4000000});
          this.swapStorageService.updateById(hash, {status: 'closed'});
          console.log('opposite swap close >>>>> swap erc20 contract closed');
        } catch(err) {
          console.log('opposite swap close >>>>> ERROR while closing swap contract', err);
        }
      }
    });
  }
}