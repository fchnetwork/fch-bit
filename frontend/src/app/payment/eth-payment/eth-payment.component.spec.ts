import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { EthPaymentComponent } from './eth-payment.component';

describe('EthPaymentComponent', () => {
  let component: EthPaymentComponent;
  let fixture: ComponentFixture<EthPaymentComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ EthPaymentComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(EthPaymentComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
