import * as mongoose from 'mongoose';

export const OrderSchema = new mongoose.Schema({
  amount: Number,
  assetID: String,
  orderID: String,
});
