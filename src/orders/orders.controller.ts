import { Controller, Get, Post, Body, Param } from '@nestjs/common';
import { RegisterOrderDto } from './dto/register-order.dto';
import { OrdersService } from './orders.service';
import { Order } from './interfaces/order.interface';

@Controller('orders')
export class OrdersController {
  constructor(private readonly registerOrderService: OrdersService) {}

  @Post()
  async create(@Body() registerOrderDto: RegisterOrderDto) {
    this.registerOrderService.create(registerOrderDto);
  }

  @Get()
  async findAll(): Promise<Order[]> {
    return this.registerOrderService.findAll();
  }
}
