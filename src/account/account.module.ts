import { Module } from '@nestjs/common';
import { DatabaseModule } from '../database/database.module';
import { AccountController } from './account.controller';
import { BalanceService } from './services/balance.service';

@Module({
  imports: [DatabaseModule],
  controllers: [AccountController],
  components: [BalanceService],
})
export class AccountModule {}