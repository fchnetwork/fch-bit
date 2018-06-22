import { Controller, Get, Post, Put, Body, Param } from '@nestjs/common';

import { SwapModelService } from './swap-model.service';
import { Swap } from './interfaces/swap.interface';
// DTO's
import { RegisterSwapDto } from './dto/register-swap.dto';
import { UpdateSwapDto } from './dto/update-swap.dto';

@Controller('swap')
export class SwapController {
  constructor(private readonly swapModelService: SwapModelService) {}

  @Post()
  async create(@Body() registerSwapDto: RegisterSwapDto) {
    return await this.swapModelService.create(registerSwapDto);
  }

  // @Put()
  // async update(@Body() updateSwapDto: UpdateSwapDto): Promise<Swap> {
  //   return await this.swapService.update(updateSwapDto);
  // }

  @Get()
  async findAll(): Promise<Swap[]> {
    return this.swapModelService.findAll();
  }

  @Get(':swapId')
  async findById(@Param() params): Promise<Swap> {
    return this.swapModelService.findById(params.swapId);
  }
}
