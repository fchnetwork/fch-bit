import { Module } from '@nestjs/common';
import { DatabaseModule } from '../database/database.module';
import { GetAddressesModule } from './get-adresses/get-addresses.module';
import { GetBalanceModule } from './get-balance/get-balance.module';
import { GetTokenBalanceModule } from './get-token-balance/get-token-balance.module';

@Module({
  imports: [
    DatabaseModule,
    GetAddressesModule,
    GetBalanceModule,
    GetTokenBalanceModule,
  ],
})
export class AccountModule {}
