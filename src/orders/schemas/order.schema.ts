import * as mongoose from 'mongoose';

export const OrderSchema = new mongoose.Schema({
  type: String,
  orderId: String,
  timestamp: Number,
  accountIndex: Number,
  customerAddress: String,
  amount: Number,
  tokenANS: String,
  transaction: {
    id: String,
    status: String,
    logs: Array,
    receipt: Object,
  },
});
