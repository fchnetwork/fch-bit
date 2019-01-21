import { Model } from 'mongoose';
import { Component, Inject } from '@nestjs/common';
import { Account } from '../interfaces/account.interface';
import { TransactionsService } from '../../transactions/services/transactions.service';
import * as Moment from 'moment';
import * as Jwt from 'jwt-simple';
const Web3 = require('web3');

@Component()
export class AccountTokenService {
  derivationPath: string = "m/44'/60'/0'/0/0";
  web3: any;

  constructor(
    @Inject('AccountModelToken') private readonly accountModel: Model<Account>,
    private transactionsService: TransactionsService
  ) {
    this.web3 = this.initWeb3();
  }

  initWeb3 = () => {
    return new Web3( new Web3.providers.WebsocketProvider(process.env.aerumProvider));
  }

  async getAccountToken(address: string) {  
    const account = await this.accountModel.findOne({ address: address });
    if(account) {
      return account.token;
    }
    const timestamp = Moment().add(5, 'minutes').unix();
    const payload = { address: address, timestamp: timestamp };
    const privateKey = process.env.tokenPrivateKey;
    const token = Jwt.encode(payload, privateKey);
    
    const registeredOrder = new this.accountModel({
      address: address,
      token: token,
      faucetRequested: false
    });
    await registeredOrder.save();
    return token;
  }

  isTokenValid(token: string): boolean {
    const privateKey = process.env.tokenPrivateKey;
    let payload;
    try{
      payload = Jwt.decode(token, privateKey);
    } catch(err) {
      return false;
    }
    if(!payload || !payload.timestamp || !payload.address) {
      return false;
    }
    const timestamp = Moment.unix(payload.timestamp);
    return timestamp > Moment();
  }

  async requestFaucet(token: string): Promise<boolean> {
    const privateKey = process.env.tokenPrivateKey;
    const payload = Jwt.decode(token, privateKey);
    const address = payload.address;
    const account = await this.accountModel.findOne({ address: address });
    if(account.faucetRequested) {
      return false;
    }

    const faucetAmount = process.env.accountFaucetAmount;
    await this.transactionsService.requestFaucetForAccount(address, faucetAmount);

    account.faucetRequested = true;
    await account.save();
    return true;
  }
}
