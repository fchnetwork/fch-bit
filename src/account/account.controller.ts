import { Controller, Get, Post, Put, Body, Param } from '@nestjs/common';
import { AccountService } from './services/account.service';

@Controller('account')
export class AccountController {
  constructor(private readonly accountService: AccountService) {}

  @Get(':id/balance')
  async getBalance(@Param() params): Promise<any> {
    return this.accountService.getBalance(params.id);
  }

  @Get(':id/token-balance/:address')
  async getTokenBalance(@Param() params): Promise<any> {
    return this.accountService.getTokenBalance(params.id, params.address);
  }

  @Get('addresses')
  async getAddresses(): Promise<any> {
    return this.accountService.getAddresses();
  }
}