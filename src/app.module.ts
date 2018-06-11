import { Module, MiddlewaresConsumer, NestModule, RequestMethod } from '@nestjs/common';
import { OrdersModule } from './orders/orders.module';
import { SwapModule } from './swap/swap.module';
import { TransactionsModule } from './transactions/transactions.module';
import { AccountModule } from './account/account.module';
import { CorsMiddleware } from './cors.middleware';
require('dotenv').config({path: '../.env'})
@Module({
  imports: [
    OrdersModule,
    SwapModule,
    TransactionsModule,
    AccountModule,
  ],
})
// export class ApplicationModule{}
export class ApplicationModule implements NestModule {
  configure(consumer: MiddlewaresConsumer): void {
      consumer.apply(CorsMiddleware).forRoutes(
          { path: '***' },
      );
  }
}