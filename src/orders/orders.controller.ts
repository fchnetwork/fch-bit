import { Controller, Get, Post, Put, Body, Param } from '@nestjs/common';

import { OrdersService } from './orders.service';
import { Order } from './interfaces/order.interface';
// DTO's
import { RegisterOrderDto } from './dto/register-order.dto';
import { UpdateOrderDto } from './dto/update-order.dto';

@Controller('orders')
export class OrdersController {
  constructor(private readonly ordersService: OrdersService) {}

  @Post()
  async create(@Body() registerOrderDto: RegisterOrderDto) {
    const order = await this.ordersService.create(registerOrderDto);
    return {
      status: 'OK',
      paymentId: order._id,
      assetId: order.assetId,
      amount: order.amount,
    };
  }

  @Put()
  async update(@Body() body: UpdateOrderDto): Promise<Order> {
    return await this.ordersService.update(body.orderId, body.txHash, body.from, body.to);
  }

  @Get()
  async findAll(): Promise<Order[]> {
    return this.ordersService.findAll();
  }

  @Get(':id')
  async findById(@Param() params): Promise<Order> {
    return this.ordersService.findById(params.id);
  }
}
