require('dotenv').config();

import { NestFactory } from '@nestjs/core';
import { ApplicationModule } from './app.module';
import { SwapModule } from './swap/swap.module';
import { SwapTemplateModule } from './swap-template/swap-template.module';
import { SwapService } from './swap/swap.service';
import { SwapErc20Service } from './swap/swap.erc20.service';
import { OppositeSwapService } from './swap/opposite-swap.service';
import { OppositeSwapErc20Service } from './swap/opposite-swap.erc20.service';
import { SwapTemplateService } from './swap-template/swap-template.service';

async function bootstrap() {
  const app = await NestFactory.create(ApplicationModule);
  if (process.env.swapEventListener === 'true') {
    const swapTemplateService = app.select(SwapTemplateModule).get(SwapTemplateService);

    const depositTemplate = await swapTemplateService.findById(process.env.depositSwapTemplateIndex);
    // Checking if deposit swap template exist. If not we are not starting event listeners
    if (Number(depositTemplate.owner) !== 0) {
      const swapService = app.select(SwapModule).get(SwapService);
      await swapService.swapEventListener(depositTemplate);
    }

    const depositErc20Template = await swapTemplateService.findById(process.env.depositErc20SwapTemplateIndex);
    // Checking if deposit swap template exist. If not we are not starting event listeners
    if (Number(depositErc20Template.owner) !== 0) {
      const swapErc20Service = app.select(SwapModule).get(SwapErc20Service);
       await swapErc20Service.swapEventListener(depositErc20Template);
    }

    const withdrawalTemplate = await swapTemplateService.findById(process.env.withdrawalSwapTemplateIndex);
    // Checking if withdrawal swap template exist. If not we are not starting event listeners
    if (Number(withdrawalTemplate.owner) !== 0) {
      const oppositeSwapService = app.select(SwapModule).get(OppositeSwapService);
      await oppositeSwapService.swapEventListener(withdrawalTemplate);
    }

    const withdrawalErc20Template = await swapTemplateService.findById(process.env.withdrawalErc20SwapTemplateIndex);
    // Checking if withdrawal swap template exist. If not we are not starting event listeners
    if (Number(withdrawalErc20Template.owner) !== 0) {
      const oppositeErc20SwapService = app.select(SwapModule).get(OppositeSwapErc20Service);
      await oppositeErc20SwapService.swapEventListener(withdrawalErc20Template);
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
