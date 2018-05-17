export class RegisterOrderDto {
  orderId: string;
  type: string;
  timestamp: number;
  accountIndex: number;
  customerAddress: string;
  amount: number;
  tokenANS: string;
  transaction: {
    id: string;
    status: string;
    logs: Array<object>;
    receipt: object;
  };
}
