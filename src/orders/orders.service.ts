import { TransferDto } from './../transactions/dto/transfer.dto';
import { UpdateOrderDto } from './dto/update-order.dto';
import { Model } from 'mongoose';
import { Component, Inject } from '@nestjs/common';
import { Order } from './interfaces/order.interface';
import { RegisterOrderDto } from './dto/register-order.dto';
import * as Moment from 'moment';
const Web3 = require('web3');

@Component()
export class OrdersService {
  web3: any;

  constructor(@Inject('OrderModelToken') private readonly orderModel: Model<Order>) {
    this.web3 = this.initWeb3();
  }

  initWeb3 = () => {
    return new Web3( new Web3.providers.HttpProvider(process.env.httpProvider));
  }

  async create(data): Promise<Order> {
    const registerOrderData: RegisterOrderDto = {
      type: data.type,
      orderId: data.orderId,
      timestamp: Moment(new Date()).unix(),
      accountIndex: data.accountKey,
      customerAddress: data.receiverAddress,
      amount: data.amount,
      tokenANS: data.tokenANS || '',
      transaction: {
        id: '',
        status: 'Pending',
        logs: [],
        receipt: {},
      },
    };
    const registeredOrder = new this.orderModel(registerOrderData);
    // TODO: implement logic when connect with node
    return await registeredOrder.save();
  }

  async findAll(): Promise<Order[]> {
    return await this.orderModel.find().exec();
  }

  async findById(id): Promise<Order> {
    return await this.orderModel.findById(id).exec();
  }

  async update(data: any): Promise<Order> {
    const order = await this.orderModel.findOneAndUpdate({_id: data._id}, {transaction: {id: data.transactionId, status: data.status}}, (err, doc) => {
      return doc;
    });
    return order;
  }
}
