import { Document } from 'mongoose';

export enum TokenType {
  Eth = 0,
  Erc20 = 1
}

export interface Swap extends Document {
  swapId: string;
  timelock: number;
  value: number;
  ethTrader: string;
  withdrawTrader: string;
  secretKey: string;
  status: string;
  tokenType: TokenType;
}
