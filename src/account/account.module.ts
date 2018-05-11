import { Module } from '@nestjs/common';
import { DatabaseModule } from '../database/database.module';
import { AccountController } from './account.controller';
import { AccountService } from './services/account.service';

@Module({
  imports: [DatabaseModule],
  controllers: [AccountController],
  components: [AccountService],
})
export class AccountModule {}