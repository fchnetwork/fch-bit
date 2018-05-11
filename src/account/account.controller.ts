import { Controller, Get, Post, Put, Body, Param } from '@nestjs/common';

import { BalanceService } from './services/balance.service';

@Controller('account')
export class AccountController {
  constructor(private readonly balanceService: BalanceService) {}

  @Get(':id/balance')
  async getBalance(@Param() params): Promise<any> {
    return this.balanceService.getBalance(params.id);
  }
}
