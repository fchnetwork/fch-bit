import { Controller, Get, Post, Body, Param } from '@nestjs/common';
import { RegisterOrderDto } from './dto/register-order.dto';
import { RegisterOrderService } from './register-order.service';
import { Order } from './interfaces/order.interface';

@Controller('register-order')
export class RegisterOrderController {
  constructor(private readonly registerOrderService: RegisterOrderService) {}

  @Post()
  async create(@Body() registerOrderDto: RegisterOrderDto) {
    this.registerOrderService.create(registerOrderDto);
  }

  @Get()
  async findAll(): Promise<Order[]> {
    return this.registerOrderService.findAll();
  }
}
