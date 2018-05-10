import * as mongoose from 'mongoose';

export const OrderSchema = new mongoose.Schema({
  name: String,
  age: Number,
  breed: String,
});
