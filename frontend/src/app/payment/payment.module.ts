import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { EthPaymentComponent } from './eth-payment/eth-payment.component';
import { TokenPaymentComponent } from './token-payment/token-payment.component';
import { SuccessComponent } from './success/success.component';
import { FailedComponent } from './failed/failed.component';
import { PaymentsService } from './services/payments.service';
import { PaymentComponent } from './payment.component';
import { TransferDataComponent } from './shared/transfer-data/transfer-data.component';
import { AppRoutingModule } from '../app-routing.module';
import {MatCardModule} from '@angular/material/card';
import {MatGridListModule} from '@angular/material/grid-list';
import {MatChipsModule} from '@angular/material/chips';
import {MatButtonModule} from '@angular/material/button';
import {MatDividerModule} from '@angular/material/divider';
import {MatListModule} from '@angular/material/list';
import { HttpClientModule } from '@angular/common/http';

@NgModule({
  imports: [
    CommonModule,
    AppRoutingModule,
    MatCardModule,
    MatGridListModule,
    MatChipsModule,
    MatButtonModule,
    MatDividerModule,
    MatListModule,
    HttpClientModule
  ],
  declarations: [
    EthPaymentComponent,
    TokenPaymentComponent,
    SuccessComponent,
    FailedComponent,
    PaymentComponent,
    TransferDataComponent
  ],
  providers: [PaymentsService],
  exports: [
    PaymentComponent,
  ],
})
export class PaymentModule { }
