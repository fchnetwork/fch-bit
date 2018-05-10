import { Module } from '@nestjs/common';
import { DatabaseModule } from '../database/database.module';
import { TransferAeroModule } from './transfer-aero/transfer-aero.module';
import { TransferAeroTokenModule } from './transfer-aero-token/transfer-aero-token.module';
import { TransferEtherModule } from './transfer-ether/transfer-ether.module';
import { TransferEthTokenModule } from './transfer-eth-token/transfer-eth-token.module';

@Module({
  imports: [
    DatabaseModule,
    TransferAeroModule,
    TransferAeroTokenModule,
    TransferEtherModule,
    TransferEthTokenModule,
  ],
})
export class TransactionsModule {}
