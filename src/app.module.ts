import { Module } from '@nestjs/common';
import { OrdersModule } from './orders/orders.module';
import { SwapModule } from './swap/swap.module';
import { TransactionsModule } from './transactions/transactions.module';
import { AccountModule } from './account/account.module';

@Module({
  imports: [
    OrdersModule,
    SwapModule,
    TransactionsModule,
    AccountModule,
  ],
})
export class ApplicationModule {}
