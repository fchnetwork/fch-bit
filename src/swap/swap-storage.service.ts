import { Component, Inject } from '@nestjs/common';
import { Swap } from './interfaces/swap.interface';
import { RegisterSwapDto } from './dto/register-swap.dto';
import { Model } from 'mongoose'; 

@Component()
export class SwapStorageService {
  constructor( @Inject('SwapModelToken') private readonly swapModel: Model<Swap>) {
  }

  async create(swapId?, timelock?, value?, ethTrader?, withdrawTrader?, secretKey?): Promise<Swap> {
    const registerSwapData: RegisterSwapDto = {
      swapId,
      timelock,
      value,
      ethTrader,
      withdrawTrader,
      secretKey,
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

  async updateById(swapId, set): Promise<any> {
    return this.swapModel.findOneAndUpdate({swapId: swapId}, {$set: set}, {new: true}).exec();
  }

  async updateByCondition(condition, set): Promise<any> {
    return this.swapModel.findOneAndUpdate(condition, {$set: set}, {new: true}).exec();
  }
}
