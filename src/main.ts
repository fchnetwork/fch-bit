require('dotenv').config();

import { NestFactory } from '@nestjs/core';
import { ApplicationModule } from './app.module';
import { SwapModule } from './swap/swap.module';
import { SwapService } from './swap/swap.service';

async function bootstrap() {
  const app = await NestFactory.create(ApplicationModule);
  if (process.env.swapEventListener === 'true') {
    const swapService = app.select(SwapModule).get(SwapService);
    swapService.swapEventListener();
  }

  await app.listen(3001);
  console.log('App works on port 3001');
}
bootstrap();
