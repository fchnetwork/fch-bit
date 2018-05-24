import { RouterModule, Routes } from '@angular/router';
import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { PaymentComponent } from './payment/payment.component';
import { EthPaymentComponent } from './payment/eth-payment/eth-payment.component';
import { TokenPaymentComponent } from './payment/token-payment/token-payment.component';
import { SuccessComponent } from './payment/success/success.component';
import { FailedComponent } from './payment/failed/failed.component';

const routes: Routes = [
  { path: '', redirectTo: '/payment/aero', pathMatch: 'full' },
  { path: 'payment',
    component: PaymentComponent,
    children: [
      {
        path: '',
        redirectTo: 'aero',
        pathMatch: 'full'
      },
      {
        path: 'aero',
        component: EthPaymentComponent
      },
      {
        path: 'token',
        component: TokenPaymentComponent
      },
      {
        path: '**',
        redirectTo: 'aero',
      },
    ]
  },
  {
    path: 'success',
    component: SuccessComponent
  },
  {
    path: 'failed',
    component: FailedComponent
  },
  {
    path: '**',
    redirectTo: '/payment/aero'
  },
];

@NgModule({
  imports: [
    CommonModule,
    RouterModule.forRoot(routes)
  ],
  declarations: [],
  exports: [
    RouterModule
  ]
})
export class AppRoutingModule { }
