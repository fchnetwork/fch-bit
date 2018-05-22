export class UpdateOrderDto {
  readonly txHash: string;
  readonly orderId: string;
  readonly from: string;
  readonly to: string;
  readonly blockHash?: string;
}
