import { Component, Inject } from '@nestjs/common';
const Web3 = require('web3');

@Component()
export class AccountService {
  web3: any;

  constructor() {
    this.web3 = this.initWeb3();
  }

  initWeb3 = () => {
    return new Web3( new Web3.providers.HttpProvider(process.env.httpProvider));
  }

  async getAddresses() {
    const addresses = await this.web3.eth.getAccounts();
    return addresses;
  }

  async getBalance(acc): Promise<any> {
    const addresses = await this.getAddresses();
    const address = addresses[acc];
    const isAddress = await this.web3.utils.isAddress(address);
    if (isAddress) {
      const balance = await this.web3.eth.getBalance(address).then((res) => {
        return this.web3.utils.fromWei(res, 'ether');
      }).catch((err) => {
        return err;
      });
      return balance;
    } else {
      return 'Wrong aerum address';
    }
  }
}
