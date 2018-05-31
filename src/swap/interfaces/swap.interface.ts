import { Document } from 'mongoose';

export interface Swap extends Document {
  swapId: string;
  timelock: number;
  value: number;
  ethTrader: string;
  withdrawTrader: string;
  secretKey: string;
  status: string;
}
