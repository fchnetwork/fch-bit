export class TransferDto {
  readonly amount: string;
  readonly orderId: string;
  readonly accountKey: number;
  type: string;
  readonly receiverAddress: string;
  readonly tokenANS?: string;
  readonly contractAddress?: string;
}
