import { Module } from '@nestjs/common';
import { SwapController } from './swap.controller';
import { SwapService } from './swap.service';
import { SwapModelService } from './swap-model.service';
import { OppositeSwapService } from './opposite-swap.service';
import { swapProviders } from './swap.providers';
import { DatabaseModule } from '../database/database.module';
import { AccountService } from '../account/services/account.service';

@Module({
  imports: [DatabaseModule],
  controllers: [SwapController],
  components: [SwapService, SwapModelService, OppositeSwapService, AccountService, ...swapProviders],
})
export class SwapModule {}