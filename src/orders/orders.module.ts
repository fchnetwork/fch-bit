import { Module } from '@nestjs/common';
import { OrdersController } from './orders.controller';
import { OrdersService } from './orders.service';
import { ordersProviders } from './orders.providers';
import { DatabaseModule } from '../database/database.module';
import { AccountService } from '../account/services/account.service';

@Module({
  imports: [DatabaseModule],
  controllers: [OrdersController],
  components: [OrdersService, AccountService, ...ordersProviders],
})
export class OrdersModule {}