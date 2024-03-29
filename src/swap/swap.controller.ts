import { Controller, Get, Post, Put, Body, Param } from '@nestjs/common';

import { SwapStorageService } from './swap-storage.service';
import { Swap } from './interfaces/swap.interface';
// DTO's
import { RegisterSwapDto } from './dto/register-swap.dto';
import { UpdateSwapDto } from './dto/update-swap.dto';

@Controller('swap')
export class SwapController {
  constructor(private readonly swapStorageService: SwapStorageService) {}

  @Post()
  async create(@Body() registerSwapDto: RegisterSwapDto) {
    return await this.swapStorageService.create(registerSwapDto);
  }

  // @Put()
  // async update(@Body() updateSwapDto: UpdateSwapDto): Promise<Swap> {
  //   return await this.swapService.update(updateSwapDto);
  // }

  @Get()
  async findAll(): Promise<Swap[]> {
    return this.swapStorageService.findAll();
  }

  @Get(':swapId')
  async findById(@Param() params): Promise<Swap> {
    return this.swapStorageService.findById(params.swapId);
  }
}
