import { Component, OnInit, OnDestroy } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { PaymentsService } from '../services/payments.service';

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
  tokenContractAddress = '0x8dc2df9d07dabb444ed78de93542cd5d6355b403';

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

        this.buttonDisabled = false;
      }
    });
  }

  redirect() {
    // window.location.href = `http://dev.aerum.net?hash=${this.hash}`;
  }

  pay() {
    this.paymentsService.createPayment(this.value, this.itemId, this.accountKey, null).subscribe((res) => {
      console.log(res);
    });
  }

  ngOnDestroy() {
    this.paramsSub.unsubscribe();
  }

}
