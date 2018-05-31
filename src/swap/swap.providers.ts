import { Connection } from 'mongoose';
import { SwapSchema } from './schemas/swap.schema';

export const swapProviders = [
  {
    provide: 'SwapModelToken',
    useFactory: (connection: Connection) => connection.model('Swap', SwapSchema),
    inject: ['DbConnectionToken'],
  },
];
