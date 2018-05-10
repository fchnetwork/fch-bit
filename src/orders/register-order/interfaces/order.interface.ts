import { Document } from 'mongoose';

export interface Order extends Document {
  readonly name: string;
  readonly age: number;
  readonly breed: string;
}
