require('dotenv').config();

import { NestFactory } from '@nestjs/core';
import { ApplicationModule } from './app.module';
import { SwapModule } from './swap/swap.module';
import { SwapTemplateModule } from './swap-template/swap-template.module';
import { SwapService } from './swap/swap.service';
import { SwapTemplateService } from './swap-template/swap-template.service';

async function bootstrap() {
  const app = await NestFactory.create(ApplicationModule);
  if (process.env.swapEventListener === 'true') {
    const swapTemplateService = app.select(SwapTemplateModule).get(SwapTemplateService);
    const template = await swapTemplateService.findById(process.env.depositSwapTemplateIndex);
    if(Number(template.owner) !== 0){
      const swapService = app.select(SwapModule).get(SwapService);
      swapService.swapEventListener(template);
    }
  }
  if(process.env.Production == true) {
    console.log("true ", process.env.Production)
    await app.listen(3001,"0.0.0.0");
  } else {
    console.log("false ", process.env.Production)
    await app.listen(3001);
  }
  console.log('App works on port 3001');
}
bootstrap();
