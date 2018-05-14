import { CanActivate, Guard, ExecutionContext } from '@nestjs/common';
import { AccountService } from '../account/services/account.service';

@Guard()
export class CallTransactionGuard implements CanActivate {
  constructor(
   private accountService: AccountService,
  ){}

  public async canActivate(request: any): Promise<any> {
    const balance = await this.accountService.getBalance(request.body.accountKey);
    if (balance > request.body.amount) {
      return true;
    } else {
      console.log('no enough money');
      return false;
    }
  }
}