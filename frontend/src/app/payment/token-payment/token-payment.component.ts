import { Component, OnInit, OnDestroy } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { PaymentsService } from '../services/payments.service';
import { environment } from '../../../environments/environment'

@Component({
  selector: 'custom-token-payment',
  templateUrl: './token-payment.component.html',
  styleUrls: ['./token-payment.component.css']
})
export class TokenPaymentComponent implements OnInit, OnDestroy {
  paramsSub: any;
  buttonDisabled = true;
  paymentType = 'Token';
  itemName = 'Longboard';
  itemId = '2';
  value = '3';
  accountKey = '1';
  contractAddress = '0x8dc2df9d07dabb444ed78de93542cd5d6355b403';

  constructor(
    private route: ActivatedRoute,
    private paymentsService: PaymentsService
  ) { }

  ngOnInit() {
    this.paramsSub = this.route.queryParams.subscribe(params => {
      if (params.query) {
        const parsed = JSON.parse(params.query);
        console.log(parsed);
        this.itemName = parsed.itemName || '';
        this.itemId = parsed.itemId || '';
        this.value = parsed.value || '';
        this.accountKey = parsed.accountKey || '';
        this.contractAddress = parsed.tokenContractAddress || '';
        this.buttonDisabled = false;
      }
    });
  }

  redirect(res) {
    const query = {
      orderId: res._id,
      to: res.merchantAlias,
      assetAddress: 1,
      amount: res.amount,
      contractAddress: res.contractAddress,
      returnUrl: environment.returnUrl,
      returnUrlFailed: environment.returnUrlFailed
    };
    window.location.href = `${environment.walletURL}/external/transaction?query=${JSON.stringify(query)}`;
  }

  pay() {
    this.paymentsService.createPayment(this.value, this.itemId, this.accountKey, this.contractAddress).subscribe((res) => {
      console.log(res);
      this.redirect(res);
    });
  }

  ngOnDestroy() {
    this.paramsSub.unsubscribe();
  }

}
