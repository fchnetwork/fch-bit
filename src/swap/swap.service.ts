import { tokensABI } from './../abi/tokens';
import { TransferDto } from './../transactions/dto/transfer.dto';
import { UpdateSwapDto } from './dto/update-swap.dto';
import { Model } from 'mongoose';
import { Component, Inject } from '@nestjs/common';
import { Swap } from './interfaces/swap.interface';
import { RegisterSwapDto } from './dto/register-swap.dto';
import * as Moment from 'moment';
import { AccountService } from '../account/services/account.service';
import { AtomicSwapEther } from './../abi/AtomicSwapEther';
import { AtomicSwapERC20 } from './../abi/AtomicSwapERC20';
const Web3 = require('web3');

@Component()
export class SwapService {
  web3: any;
  rinkebyWeb3: any;
  constructor(
    @Inject('SwapModelToken') private readonly swapModel: Model<Swap>,
    private accountService: AccountService,
  ) {
    this.web3 = this.initWeb3();
  }

  initWeb3 = () => {
    return new Web3( new Web3.providers.WebsocketProvider(process.env.httpProvider));
  }

  async create(data): Promise<Swap> {
    const registerSwapData: RegisterSwapDto = {
      swapId: data.swapId,
      timelock: data.timelock,
      value: data.value,
      ethTrader: data.ethTrader,
      withdrawTrader: data.withdrawTrader,
      secretKey: data.secretKey,
      status: 'pending',
    };
    const registeredSwap = new this.swapModel(registerSwapData);
    return await registeredSwap.save();
  }

  async findAll(): Promise<Swap[]> {
    return await this.swapModel.find().exec();
  }

  async findById(id): Promise<Swap> {
    return await this.swapModel.findOne({swapId: id}).exec();
  }

  async update(swapId, secretKey, status): Promise<any> {
    // body.swapId, body.timelock, body.value, body.ethTrader, body.withdrawTrader, body.seckretKey
    return new Promise((resolve, reject) => {
      const updatedTransaction = this.swapModel.findOneAndUpdate({swapId}, {secretKey, status})
        .then((res) => {
          this.swapModel.findOne({swapId}).then((itemRes) => {
            resolve(itemRes);
          });
        });
    });

  }

  swapEventListener() {
    this.rinkebyWeb3 = new Web3( new Web3.providers.WebsocketProvider(process.env.rinkebyProvider));
    const atomicSwapERC20Contract = new this.rinkebyWeb3.eth.Contract(AtomicSwapERC20, process.env.AtomicSwapERC20);
    const atomicSwapEtherAddress = new this.rinkebyWeb3.eth.Contract(AtomicSwapEther, process.env.AtomicSwapEtherAddress);
    atomicSwapEtherAddress.events.allEvents({}, { fromBlock: 0, toBlock: 'latest' }, (error, res) => {
      if (error) {
        console.log(error);
      } else {
        console.log(res);
      }
    });
    atomicSwapERC20Contract.events.allEvents({}, { fromBlock: 0, toBlock: 'latest' }, (error, res) => {
      if (error) {
        console.log(error);
      } else {
        console.log(res);
      }
    });
    this.listenOpen(atomicSwapEtherAddress, atomicSwapERC20Contract);
    this.listenExpire(atomicSwapEtherAddress);
    this.listenClose(atomicSwapERC20Contract, atomicSwapEtherAddress);

    console.log('swap event listening');
  }

  listenOpen(atomicSwapEtherAddress, atomicSwapERC20Contract){
    atomicSwapEtherAddress.events.Open({}, { fromBlock: 0, toBlock: 'latest' }, (error, res) => {
      if (error) {
        console.log(error);
      } else {
        console.log(res);
        const minValue = 2;
        const maxValue = 10;
        const presetTimelock = 10999;
        const timelock = res.timelock;
        const presetExchangeRate = 0.1;
        const exchangeRate = 0.2;
        const value = res.value;
        const withdrawTrader = res.withdrawTrader;
        const hash = res.hash;
        if (value > minValue && value < maxValue && timelock === presetTimelock && exchangeRate >= presetExchangeRate) {
          atomicSwapERC20Contract.open(hash, value, process.env.AtomicSwapERC20, withdrawTrader, timelock);
          this.update(hash, null, 'open');
        }
      }
    });
  }

  listenExpire(contract){
    contract.events.Expire({}, { fromBlock: 0, toBlock: 'latest' }, (error, res) => {
      if (error) {
        console.log(error);
      } else {
        const hash = res.hash;
        this.swapModel.findOneAndUpdate({swapId: hash, status: 'open'}, {status: 'expired'})
        .then((respond) => {
          this.swapModel.findOne({swapId: hash}).then((itemRes) => {
            console.log(respond);
          });
        });
      }
    });
  }

  listenClose(contract, atomicSwapEtherAddress){
    contract.events.Close({}, { fromBlock: 0, toBlock: 'latest' }, (error, res) => {
      if (error) {
        console.log(error);
      } else {
        const hash = res.hash;
        const secretKey = res.secretKey;
        this.swapModel.findOneAndUpdate({swapId: hash, status: 'open'}, {secretKey})
        .then((respond) => {
          this.swapModel.findOne({swapId: hash}).then((itemRes) => {
            console.log(respond);
            atomicSwapEtherAddress.close(hash, secretKey).then((methodRes) => {
              this.swapModel.findOneAndUpdate({swapId: hash, status: 'open'}, {status: 'closed'});
            });
          });
        });
      }
    });
  }


}
