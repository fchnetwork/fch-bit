import { Controller, Get, Post, Put, Body, Param, UseGuards } from '@nestjs/common';
import { TransactionsService } from './services/transactions.service';
import { TransferDto } from './dto/transfer.dto';
import { CallTransactionGuard, CallTransactionTokenGuard } from './transactions.guard';
import { PaymentDto } from './dto/payment.dto';

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

  @Post('payment')
  // @UseGuards(CallTransactionTokenGuard)
  async payment(@Body() paymentDto: PaymentDto) {
    return await this.transactionsService.payment(paymentDto);
  }

  @Post('token-payment')
  // @UseGuards(CallTransactionTokenGuard)
  async tokenPayment(@Body() paymentDto: PaymentDto) {
    return await this.transactionsService.tokenPayment(paymentDto);
  }
}
