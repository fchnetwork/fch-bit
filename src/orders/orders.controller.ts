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
    };
  }

  @Put()
  async update(@Body() updateOrderDto: UpdateOrderDto): Promise<Order> {
    return this.ordersService.update(updateOrderDto);
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
