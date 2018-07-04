import { TokenType } from './../interfaces/swap.interface';

export class RegisterSwapDto {
  swapId: string;
  timelock: number;
  value: number;
  ethTrader: string;
  withdrawTrader: string;
  secretKey: string;
  status: string;
  tokenType: TokenType
}
