import { Document } from 'mongoose';

export interface Account extends Document {
  address: string;
  token: string;
  faucetRequested: boolean;
}
