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
