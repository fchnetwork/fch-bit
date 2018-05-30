import { Component, OnInit, OnDestroy } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { PaymentsService } from '../services/payments.service';

@Component({
  selector: 'custom-eth-payment',
  templateUrl: './eth-payment.component.html',
  styleUrls: ['./eth-payment.component.css']
})
export class EthPaymentComponent implements OnInit, OnDestroy {
  paramsSub: any;
  buttonDisabled = true;
  paymentType = 'Aero';
  itemName = 'Kolobezka';
  itemId = '1';
  value = '2';
  accountKey = '1';

  constructor(
    private route: ActivatedRoute,
    private paymentsService: PaymentsService
  ) { }

  ngOnInit() {
    this.paramsSub = this.route.queryParams.subscribe(params => {
      if (params.query) {
        const parsed = JSON.parse(params.query);
        this.itemName = parsed.itemName || '';
        this.itemId = parsed.itemId || '';
        this.value = parsed.value || '';
        this.accountKey = parsed.accountKey || '';

        this.buttonDisabled = false;
      }
    });
  }

  redirect(res) {
    const query = {
      orderId: res._id,
      to: res.merchantAlias,
      assetAddress: 0,
      amount: res.amount,
      returnUrl: 'http://localhost:4300/success',
      returnUrlFailed: 'http://localhost:4300/failed'

    };
    window.location.href = `http://dev.aerum.net/external/transaction?query=${JSON.stringify(query)}`;
  }

  pay() {
    this.paymentsService.createPayment(this.value, this.itemId, this.accountKey, null).subscribe((res) => {
      this.redirect(res);
    });
  }

  ngOnDestroy() {
    this.paramsSub.unsubscribe();
  }

}

