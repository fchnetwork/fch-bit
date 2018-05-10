import { Controller, Get, Post, Body, Param } from '@nestjs/common';
import { RegisterOrderDto } from './dto/register-order.dto';
import { OrdersService } from './orders.service';
import { Order } from './interfaces/order.interface';

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

  @Get()
  async findAll(): Promise<Order[]> {
    return this.ordersService.findAll();
  }

  @Get(':id')
  async findById(@Param() params): Promise<Order> {
    return this.ordersService.findById(params.id);
  }
}
