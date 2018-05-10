import * as mongoose from 'mongoose';

export const OrderSchema = new mongoose.Schema({
  amount: Number,
  assetId: String,
  orderId: String,
});
