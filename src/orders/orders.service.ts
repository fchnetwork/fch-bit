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
      assetId: data.assetId,
      timestamp: Moment(new Date()).unix(),
      accountIndex: data.accountKey,
      customerAddress: data.receiverAddress || '',
      amount: data.amount,
      tokenANS: data.tokenANS || '',
      contractAddress: data.contractAddress || 'aero payment',
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

  async update(orderId: any, txHash, from, to): Promise<any> {
    const transaction = await this.web3.eth.getTransaction(txHash);
    const order = await this.orderModel.findOne({_id: orderId});
    let status;
    console.log(transaction);
    console.log(this.web3.utils.toAscii( transaction.input ));
    if ((order.type === 'aero payment' || order.type === 'token payment') && transaction.from.toLowerCase() === from.toLowerCase() && transaction.to.toLowerCase() === to.toLowerCase() && String(transaction.value) === String(order.amount)) {
      status = 'success';
      console.log('works');
    } else {
      status = 'failed data verification';
    }
    const updatedTransaction = await this.orderModel.findOneAndUpdate({_id: orderId}, {transaction: {id: txHash, status}}, (err, doc) => {
      return doc;
    });
    return updatedTransaction;
  }
}
