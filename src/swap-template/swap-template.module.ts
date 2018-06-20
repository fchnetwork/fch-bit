import { Module } from '@nestjs/common';
import { SwapTemplateService } from './swap-template.service';
import { DatabaseModule } from '../database/database.module';

@Module({
  imports: [DatabaseModule],
  components: [SwapTemplateService],
})
export class SwapTemplateModule {}