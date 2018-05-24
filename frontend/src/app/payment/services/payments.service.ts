import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';


const httpOptions = {
  headers: new HttpHeaders().set('Content-Type', 'application/json').append('Access-Control-Allow-Origin', '*')
};


@Injectable({
  providedIn: 'root'
})
export class PaymentsService {
  middlewareUrl = 'http://localhost:3001';

  constructor(
    public http: HttpClient
  ) { }

  getOrders() {
    return this.http.get<any>(`${this.middlewareUrl}/orders`);
  }

  createPayment(amount, assetId, accountKey, contractAddress) {
    const data = {
      'amount': `${amount}`,
      'assetId': `${assetId}`,
      'accountKey': `${accountKey}`,
      'contractAddress': `${contractAddress}`
    };
    return this.http.post<any>(`${this.middlewareUrl}/transaction/payment`, data);
  }

  update(orderId, txHash, from, to) {
    const data = {
      'orderId': `${orderId}`,
      'txHash': `${txHash}`,
      'from': `${from}`,
      'to': `${to}`
    };
    return this.http.put<any>(`${this.middlewareUrl}/orders`, data);
  }
}
