import { Controller, Get, Post, Put, Body, Param, UseGuards } from '@nestjs/common';
import { TransactionsService } from './services/transactions.service';
import { TransferEthDto } from './dto/transfer-eth.dto';
import { CallTransactionGuard } from './transactions.guard';

@Controller('transaction')
export class TransactionsController {
  constructor(private readonly transactionsService: TransactionsService) {}

  @Post('eth')
  @UseGuards(CallTransactionGuard)
  async create(@Body() transferEthDto: TransferEthDto) {
    return await this.transactionsService.transferEth(transferEthDto);
  }
}
