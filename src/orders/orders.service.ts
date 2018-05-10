import { Model } from 'mongoose';
import { Component, Inject } from '@nestjs/common';
import { Order } from './interfaces/order.interface';
import { RegisterOrderDto } from './dto/register-order.dto';

@Component()
export class OrdersService {
  constructor(@Inject('OrderModelToken') private readonly orderModel: Model<Order>) {}

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
}
