import { Component, Inject } from '@nestjs/common';
const Web3 = require('web3');

@Component()
export class BalanceService {
  web3: any;

  constructor() {
    this.web3 = this.initWeb3();
  }

  initWeb3 = () => {
    return new Web3( new Web3.providers.HttpProvider(process.env.httpProvider));
  }

  async getBalance(acc): Promise<any> {
    // console.log(this.web3.eth.getAccounts());
    const accounts = await this.web3.eth.getAccounts();
    console.log(accounts);
    const address = accounts[acc];
    const isAddress = await this.web3.utils.isAddress(address);
    if (isAddress) {
      const balance = await this.web3.eth.getBalance(address).then((res) => {
        return `${this.web3.utils.fromWei(res, 'ether')} aero`;
      }).catch((err) => {
        return err;
      });
      return balance;
    } else {
      return 'Wrong aerum address';
    }
  }
}
