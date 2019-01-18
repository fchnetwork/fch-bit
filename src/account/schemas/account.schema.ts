import * as mongoose from 'mongoose';

export const AccountSchema = new mongoose.Schema({
  address: String,
  token: String,
  faucetRequested: Boolean
});