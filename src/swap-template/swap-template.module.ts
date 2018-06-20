import { Module } from '@nestjs/common';
import { SwapTemplateController } from './swap-template.controller';
import { SwapTemplateService } from './swap-template.service';
import { DatabaseModule } from '../database/database.module';

@Module({
  imports: [DatabaseModule],
  controllers: [SwapTemplateController],
  components: [SwapTemplateService],
})
export class SwapTemplateModule {}