import { ordersProviders } from './../orders/orders.providers';
import { OrdersService } from './../orders/orders.service';
import { Module } from '@nestjs/common';
import { DatabaseModule } from '../database/database.module';
import { TransactionsController } from './transactions.controller';
import { TransactionsService } from './services/transactions.service';
import { AccountService } from '../account/services/account.service';

@Module({
  imports: [
    DatabaseModule,
  ],
  controllers: [TransactionsController],
  components: [TransactionsService, AccountService, OrdersService, ...ordersProviders],
})
export class TransactionsModule {}
