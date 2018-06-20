import { Controller, Get, Post, Param } from '@nestjs/common';
import { SwapTemplateService } from './swap-template.service';
import { SwapTemplate, Chain } from './interfaces/swap-template.interface';
const Web3 = require('web3');

@Controller('swap-template')
export class SwapTemplateController {
  web3: any;
  constructor(private readonly swapTemplateService: SwapTemplateService) {
    this.web3 = this.initWeb3();
  }

  initWeb3 = () => {
    return new Web3(new Web3.providers.WebsocketProvider(process.env.aerumProvider));
  }

  @Get(':swapTemplateId')
  async findById(@Param() params): Promise<SwapTemplate> {
    const id = params.swapTemplateId;
    return this.swapTemplateService.findById(id);
  }
}
