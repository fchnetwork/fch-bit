import { UpdateOrderDto } from './dto/update-order.dto';
import { Model } from 'mongoose';
import { Component, Inject } from '@nestjs/common';
import { Order } from './interfaces/order.interface';
import { RegisterOrderDto } from './dto/register-order.dto';
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

  async create(registerOrderDto: RegisterOrderDto): Promise<Order> {
    const registeredOrder = new this.orderModel(registerOrderDto);
    // TODO: implement logic when connect with node
    return await registeredOrder.save();
  }

  async findAll(): Promise<Order[]> {
    return await this.orderModel.find().exec();
  }

  async findById(id): Promise<Order> {
    return await this.orderModel.findById(id).exec();
  }

  async update(data: UpdateOrderDto): Promise<Order> {
    const order = await this.orderModel.findOneAndUpdate({_id: data._id}, {orderId: data.orderId}, (err, doc) => {
      return doc;
    });
    return order;
  }
}
