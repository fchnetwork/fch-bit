import { Component, OnInit, OnDestroy } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { PaymentsService } from '../services/payments.service';

@Component({
  selector: 'custom-success',
  templateUrl: './success.component.html',
  styleUrls: ['./success.component.css']
})
export class SuccessComponent implements OnInit, OnDestroy {
  buttonDisabled = true;
  loading = true;
  success = false;
  error = 'Failed';
  paramsSub: any;
  orderId: string;
  txHash: string;
  from: string;
  to: string;
  constructor(
    public route: ActivatedRoute,
    private paymentsService: PaymentsService
  ) { }

  ngOnInit() {
    this.paramsSub = this.route.queryParams.subscribe(params => {
      if (params.query) {
        const parsed = JSON.parse(params.query);
        this.orderId = parsed.orderId || '';
        this.txHash = parsed.txHash || '';
        this.from = parsed.from || '';
        this.to = parsed.to || '';
        this.update();
        this.buttonDisabled = false;
      }
    });
  }

  redirect() {
    const query = {
      'orderId': `${this.orderId}`
    };
    window.location.href = `http://dev.aerum.net?query=${query}`;
  }

  update() {
    this.loading = true;
    this.paymentsService.update(this.orderId, this.txHash, this.from, this.to).subscribe((res) => {
      this.loading = false;
      if (res._id) {
        this.success = true;
      } else if (res.status === 'failed') {
        this.error = res.text;
      }
    });
  }

  ngOnDestroy() {
    this.paramsSub.unsubscribe();
  }

}
