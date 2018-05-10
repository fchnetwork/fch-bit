import { Connection } from 'mongoose';
import { OrderSchema } from './schemas/order.schema';

export const registerOrderProviders = [
  {
    provide: 'OrderModelToken',
    useFactory: (connection: Connection) => connection.model('Order', OrderSchema),
    inject: ['DbConnectionToken'],
  },
];
