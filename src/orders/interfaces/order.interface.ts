import { Document } from 'mongoose';

export interface Order extends Document {
  type: string;
  assetId: string;
  orderId: string;
  timestamp: number;
  accountIndex: number;
  customerAddress: string;
  amount: number;
  tokenANS: string;
  transaction: {
    id: string;
    status: string;
    logs: [{}];
    receipt: {},
  };
}
