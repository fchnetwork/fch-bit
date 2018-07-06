import { Module } from '@nestjs/common';
import { SwapController } from './swap.controller';
import { SwapService } from './swap.service';
import { SwapStorageService } from './swap-storage.service';
import { TokenService } from './../shared/token/token.service';
import { AerumNameService } from './../shared/aerum-name-service/aerum-name.service';
import { SwapErc20Service } from './swap.erc20.service';
import { OppositeSwapService } from './opposite-swap.service';
import { OppositeSwapErc20Service } from './opposite-swap.erc20.service';
import { swapProviders } from './swap.providers';
import { DatabaseModule } from '../database/database.module';
import { AccountService } from '../account/services/account.service';

@Module({
  imports: [DatabaseModule],
  controllers: [SwapController],
  components: [SwapService, SwapStorageService, TokenService, AerumNameService, OppositeSwapService, OppositeSwapErc20Service, SwapErc20Service, AccountService, ...swapProviders],
})
export class SwapModule {}