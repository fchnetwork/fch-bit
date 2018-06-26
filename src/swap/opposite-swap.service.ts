import { Component } from '@nestjs/common';
import { Contract } from 'web3/types';
import { SwapStorageService } from './swap-storage.service';
import { OpenAtomicSwapERC20 } from './../abi/OpenAtomicSwapERC20';
import { CounterAtomicSwapEther } from './../abi/CounterAtomicSwapEther';
import { SwapTemplate } from './../swap-template/interfaces/swap-template.interface';
import * as Moment from 'moment';
const Web3 = require('web3');

@Component()
export class OppositeSwapService {
  web3: any;
  rinkebyWeb3: any;

  minutes: number;
  minValue: number;
  maxValue: number;
  tokenDigits: number;
  presetExchangeRate: number;
  etherDigits = 18;
  templateRateDecimals = 18;

  constructor(private readonly swapStorageService: SwapStorageService) {
    this.web3 = new Web3(new Web3.providers.WebsocketProvider(process.env.aerumProvider));
    this.rinkebyWeb3 = new Web3(new Web3.providers.WebsocketProvider(process.env.rinkebyProvider));

    this.minutes = Number(process.env.minutes);
    this.minValue = Number(process.env.minValueSwap);
    this.maxValue = Number(process.env.maxValueSwap);
    this.tokenDigits = Number(process.env.presetTokenDigits);
    this.presetExchangeRate = Number(process.env.presetExchangeRateSwap);
  }

  async swapEventListener(template: SwapTemplate) {
    const openAtomicSwapERC20Contract = new this.web3.eth.Contract(OpenAtomicSwapERC20, process.env.AerOpenAtomicSwapERC20);
    const counterAtomicSwapEtherContract = new this.rinkebyWeb3.eth.Contract(CounterAtomicSwapEther, process.env.RinCounterAtomicSwapETH);

    const aerCurrentBlock = await this.web3.eth.getBlockNumber();
    console.log('opposite swap >>>> current block aerum', aerCurrentBlock);

    const rinCurrentBlock = await this.rinkebyWeb3.eth.getBlockNumber();
    console.log('opposite swap >>>> current block rinkeby', rinCurrentBlock);

    // Open events registration
    openAtomicSwapERC20Contract.events.Open({ fromBlock: aerCurrentBlock - 1 }, (error, res) => {
      this.registrationBodyTemplate(aerCurrentBlock, error, res,
        async () => await this.openHandler(openAtomicSwapERC20Contract, counterAtomicSwapEtherContract, template, res));
    });

    // Expire events registration
    openAtomicSwapERC20Contract.events.Expire({ fromBlock: aerCurrentBlock - 1 }, (error, res) => {
      this.registrationBodyTemplate(aerCurrentBlock, error, res,
        async () => await this.expireHandler(counterAtomicSwapEtherContract, res));
    });

    // Close events registration
    counterAtomicSwapEtherContract.events.Close({ fromBlock: rinCurrentBlock - 1 }, (error, res) => {
      this.registrationBodyTemplate(rinCurrentBlock, error, res,
        async () => await this.closeHandler(openAtomicSwapERC20Contract, res));
    });
  }

  private async registrationBodyTemplate(currentBlock, error, res, handler) {
    if(error) {
      console.log(error);
    } else if(res.blockNumber >= currentBlock) {
      try {
        await handler();
      } catch (err) {
        console.log('opposite swap registration >>>> ERROR in event handler', error);
      }
    } else {
      console.log('opposite swap registration >>>> received old event for block', res.blockNumber)
    }
  }

  // Handler for expire events
  private async openHandler(openAtomicSwapERC20Contract: Contract, counterAtomicSwapEtherContract: Contract, template: SwapTemplate, res) {
    const hash = res.returnValues._hash;
    const ethAccounts = await this.rinkebyWeb3.eth.getAccounts();
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
        const exchangeRate = template.rate / Math.pow(10, this.templateRateDecimals);
        const timelock = Number(checkRes.timelock);
        const erc20Value = Number(checkRes.erc20Value);
        const withdrawTrader = checkRes.withdrawTrader;

        if (this.validateSwap(withdrawTrader, erc20Value, timelock, exchangeRate)) {
          const value = this.calcValue(erc20Value, exchangeRate);
          // Adding swap model to database
          this.swapStorageService.create(hash, timelock, value, ethAccount, withdrawTrader, null);
          console.log('opposite swap open >>>>> adding swap model to db');
          // Opening swap in counter swap contract
          var erc2Res = await counterAtomicSwapEtherContract.methods.open(hash, timelock).send({value: value, from: ethAccount, gas: 4000000});
          console.log('opposite swap open >>>>> counter swap ether contract opened', JSON.stringify(erc2Res));
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

  private async accountExists(withdrawTrader): Promise<boolean> {
    return (await this.web3.eth.getAccounts()).some(account => account === withdrawTrader);
  }

  private calcValue(value: number, exchangeRate: number): number {
    value = value / Math.pow(10, this.tokenDigits);
    value = value * exchangeRate;
    const result = Web3.utils.toWei(value.toString(), 'ether');
    return result;
  }

  private validateSwap(withdrawTrader: string, value: number, timelock: number, exchangeRate: number) : boolean {
    const presettimeLock = Moment(new Date()).add(this.minutes, 'm').unix();
    return this.accountExists(withdrawTrader) && value >= this.minValue && value <= this.maxValue && timelock > presettimeLock && exchangeRate > 0;
  }

  // Handler for expire events
  private async expireHandler(counterAtomicSwapEtherContract: Contract, res) {
    const hash = res.returnValues._hash;
    const ethAccounts = await this.rinkebyWeb3.eth.getAccounts();
    const ethAccount = ethAccounts[process.env.privateEthNodeAddressIndex];
    
    this.swapStorageService.findById(hash).then(async (swap) => {
      if (swap.status === 'open') {
        try {
          await counterAtomicSwapEtherContract.methods.expire(hash).send({from: ethAccount, gas: 4000000});
          this.swapStorageService.updateById(hash, {status: 'expired'});
        } catch(err) {
          console.log('opposite swap expire >>>>> ERROR while expiring counter swap contract', err);
        }
      }
    });
  }

  // Handler for close events
  private async closeHandler(openAtomicSwapERC20Contract: Contract, res) {
    const aerumAccounts = await this.web3.eth.getAccounts();
    const aerumAccount = aerumAccounts[process.env.privateAerNodeAddressIndex];

    const hash = res.returnValues._hash;
    const secretKey = res.returnValues._secretKey;
    this.swapStorageService.findById(hash).then(async (swap) => {
      if (swap.status === 'open') {
        try {
          await openAtomicSwapERC20Contract.methods.close(hash, secretKey).send({from: aerumAccount, gas: 4000000});
          this.swapStorageService.updateById(hash, {status: 'closed'});
        } catch(err) {
          console.log('opposite swap close >>>>> ERROR while closing swap contract', err);
        }
      }
    });
  }

  /* //TODO: Test methods. Remove after testing.
  async testAccounts() {
    // JUST FOR TESTING
    this.web3.eth.accounts.wallet.add({
      privateKey: '',
      address: ''
    });

    this.rinkebyWeb3.eth.accounts.wallet.add({
      privateKey: '',
      address: ''
    });
  }

  async testOpen() {
    const key = '0x96a995655bffe188c9823a2f914641a32dcbb1b28e8586bd29af291db7dcd4e7';
    const hash = this.web3.utils.keccak256(key);
    const account = '';
    const timelock = Moment(new Date()).add(this.minutes + 1, 'm').unix();
    const openAtomicSwapERC20Contract = new this.web3.eth.Contract(OpenAtomicSwapERC20, process.env.AerOpenAtomicSwapERC20);

    try{
      const tokenContract = new this.web3.eth.Contract(tokensABI, '0xF9dB08499738771222C72C2Dfae0500bae3F0950',{from: account, gas: 4000000});
      await tokenContract.methods.approve(process.env.AerOpenAtomicSwapERC20, 1).send({from: account, gas: 4000000});
      await openAtomicSwapERC20Contract.methods.open(hash, 1, '0xF9dB08499738771222C72C2Dfae0500bae3F0950', account, timelock).send({from: account, gas: 4000000});
    }catch(err){
      console.log(err);
    }
  }

  async testExpire(){
    const key = '0x96a995655bffe188c9823a2f914641a32dcbb1b28e8586bd29af291db7dcd4e7';
    const hash = this.web3.utils.keccak256(key);
    const account = '';
    const openAtomicSwapERC20Contract = new this.web3.eth.Contract(OpenAtomicSwapERC20, process.env.AerOpenAtomicSwapERC20);

    try {
      const expire = await openAtomicSwapERC20Contract.methods.expire(hash).send({from: account, gas: 4000000});
    } catch(err) {
      console.log(err);
    }
  }

  async testClose(){
    const key = '0x96a995655bffe188c9823a2f914641a32dcbb1b28e8586bd29af291db7dcd4e7';
    const hash = this.web3.utils.keccak256(key);
    const counterAtomicSwapEtherContract = new this.rinkebyWeb3.eth.Contract(CounterAtomicSwapEther, process.env.RinCounterAtomicSwapETH);
    const account = '';

    try {
      const close = await counterAtomicSwapEtherContract.methods.close(hash, key).send({from: account, gas: 4000000, gasPrice: 4000000000});
    } catch(err) {
      console.log(err);
    }
  }
  */
}