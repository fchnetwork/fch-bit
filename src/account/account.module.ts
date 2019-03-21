import { Module } from '@nestjs/common';
import { DatabaseModule } from '../database/database.module';
import { ordersProviders } from './../orders/orders.providers';
import { AccountController } from './account.controller';
import { AccountService } from './services/account.service';
import { AccountTokenService } from './services/account-token.service';
import { accountsProviders } from './account.providers';
import { TransactionsService } from '../transactions/services/transactions.service';
import { OrdersService } from '../orders/orders.service';

@Module({
  imports: [DatabaseModule],
  controllers: [AccountController],
  components: [TransactionsService, OrdersService, AccountService, AccountTokenService, ...ordersProviders, ...accountsProviders],
})
export class AccountModule {}