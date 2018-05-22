import * as mongoose from 'mongoose';

export const OrderSchema = new mongoose.Schema({
  type: String,
  assetId: String,
  orderId: String,
  timestamp: Number,
  accountIndex: Number,
  customerAddress: String,
  amount: Number,
  tokenANS: String,
  contractAddress: String,
  transaction: {
    id: String,
    status: String,
    logs: Array,
    receipt: Object,
  },
});
