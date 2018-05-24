export class RegisterOrderDto {
  type: string;
  assetId: string;
  timestamp: number;
  accountIndex: number;
  customerAddress?: string;
  amount: number;
  tokenANS?: string;
  contractAddress?: string;
  merchantAddress: string;
  transaction: {
    id: string;
    status: string;
    logs: Array<object>;
    receipt: object;
  };
}
