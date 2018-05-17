import { Controller, Get, Post, Put, Body, Param, UseGuards } from '@nestjs/common';
import { TransactionsService } from './services/transactions.service';
import { TransferDto } from './dto/transfer.dto';
import { CallTransactionGuard, CallTransactionTokenGuard } from './transactions.guard';

@Controller('transaction')
export class TransactionsController {
  constructor(private readonly transactionsService: TransactionsService) {}

  @Post('eth')
  @UseGuards(CallTransactionGuard)
  async transfer(@Body() transferEthDto: TransferDto) {
    return await this.transactionsService.transfer(transferEthDto);
  }

  @Post('tokens')
  @UseGuards(CallTransactionTokenGuard)
  async transferTokens(@Body() transferEthTokenDto: TransferDto) {
    return await this.transactionsService.transferTokens(transferEthTokenDto);
  }
}
