import * as mongoose from 'mongoose';

export const SwapSchema = new mongoose.Schema({
  swapId: String,
  timelock: Number,
  value: Number,
  ethTrader: String,
  withdrawTrader: String,
  secretKey: String,
  status: String,
});
