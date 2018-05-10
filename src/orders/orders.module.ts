import { Module } from '@nestjs/common';
import { DatabaseModule } from '../database/database.module';
import { RegisterOrderModule } from './register-order/register-order.module';
import { GetReceiptModule } from './get-receipt/get-receipt.module';

@Module({
  imports: [
    DatabaseModule,
    RegisterOrderModule,
    GetReceiptModule,
  ],
})
export class OrdersModule {}
