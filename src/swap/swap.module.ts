import { Module } from '@nestjs/common';
import { DatabaseModule } from '../database/database.module';
import { ValidateSwapModule } from './validate-swap/validate-swap.module';
import { FinalizeSwapModule } from './finalize-swap/finalize-swap.module';

@Module({
  imports: [
    DatabaseModule,
    ValidateSwapModule,
    FinalizeSwapModule,
  ],
})
export class SwapModule {}
