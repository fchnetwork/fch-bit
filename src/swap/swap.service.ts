import { tokensABI } from './../abi/tokens';
import { TransferDto } from './../transactions/dto/transfer.dto';
import { UpdateSwapDto } from './dto/update-swap.dto';
import { Model } from 'mongoose';
import { Component, Inject } from '@nestjs/common';
import { Swap } from './interfaces/swap.interface';
import { RegisterSwapDto } from './dto/register-swap.dto';
import * as Moment from 'moment';
import { AccountService } from '../account/services/account.service';
const Web3 = require('web3');

@Component()
export class SwapService {
  web3: any;

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
      status: 'open',
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

  async update(body): Promise<any> {
    // body.swapId, body.timelock, body.value, body.ethTrader, body.withdrawTrader, body.seckretKey
    return new Promise((resolve, reject) => {
      const updatedTransaction = this.swapModel.findOneAndUpdate({swapId: body.swapId}, {secretKey: body.secretKey, status: body.status})
        .then((res) => {
          this.swapModel.findOne({swapId: body.swapId}).then((itemRes) => {
            resolve(itemRes);
          });
        });
    });

  }
}
