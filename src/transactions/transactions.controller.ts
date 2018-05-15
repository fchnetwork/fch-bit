import { Controller, Get, Post, Put, Body, Param, UseGuards } from '@nestjs/common';
import { TransactionsService } from './services/transactions.service';
import { TransferEthDto } from './dto/transfer-eth.dto';
import { CallTransactionGuard, CallTransactionTokenGuard } from './transactions.guard';
import { TransferEthTokenDto } from './dto/transfer-eth-token.dto';

@Controller('transaction')
export class TransactionsController {
  constructor(private readonly transactionsService: TransactionsService) {}

  @Post('eth')
  @UseGuards(CallTransactionGuard)
  async transfer(@Body() transferEthDto: TransferEthDto) {
    return await this.transactionsService.transfer(transferEthDto);
  }

  @Post('tokens')
  @UseGuards(CallTransactionTokenGuard)
  async transferTokens(@Body() transferEthTokenDto: TransferEthTokenDto) {
    return await this.transactionsService.transferTokens(transferEthTokenDto);
  }
}
