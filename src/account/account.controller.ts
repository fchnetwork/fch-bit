const Web3 = require('web3');
import { Controller, Get, Post, Put, Body, Param } from '@nestjs/common';
import { AccountTokenService } from './services/account-token.service';
import { AccountService } from './services/account.service';

enum Status {
  Failed = 0,
  Successful = 1
}

@Controller('account')
export class AccountController {
  web3: any;

  constructor(private readonly accountService: AccountService,
    private readonly accountTokenService: AccountTokenService
  ) {
    this.web3 = this.initWeb3();
  }

  initWeb3 = () => {
    return new Web3(new Web3.providers.WebsocketProvider(process.env.aerumProvider));
  }

  @Get(':id/balance')
  async getBalance(@Param() params): Promise<any> {
    return this.accountService.getBalance(params.id);
  }

  @Get(':id/token-balance/:address')
  async getTokenBalance(@Param() params): Promise<any> {
    return this.accountService.getTokenBalance(params.id, params.address);
  }

  @Get('addresses')
  async getAddresses(): Promise<any> {
    return this.accountService.getAddresses();
  }

  @Get('request-faucet-token/:address')
  async requestFaucetToken(@Param() params): Promise<any> {
    if(!params.address || !(await this.web3.utils.isAddress(params.address))) {
      return { status: Status.Failed };
    }
    const token = await this.accountTokenService.getAccountToken(params.address);
    return { token: token, status: Status.Successful };
  }

  @Post('request-faucet')
  async requestFaucet(@Body() body): Promise<any> {
    const token = body.token;
    if(!token) {
      return { status: Status.Failed };
    }
    if(!this.accountTokenService.isTokenValid(token)) {
      return { status: Status.Failed };
    }
    try {
      const requested = await this.accountTokenService.requestFaucet(token);
      return { status: !!requested ? Status.Successful:  Status.Failed };
    } catch (error) {
      return { status: Status.Failed };
    }
  }
}
