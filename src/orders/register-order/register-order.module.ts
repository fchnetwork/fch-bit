import { Module } from '@nestjs/common';
import { RegisterOrderController } from './register-order.controller';
import { RegisterOrderService } from './register-order.service';
import { registerOrderProviders } from './register-order.providers';
import { DatabaseModule } from '../../database/database.module';

@Module({
  imports: [DatabaseModule],
  controllers: [RegisterOrderController],
  components: [RegisterOrderService, ...registerOrderProviders],
})
export class RegisterOrderModule {}
