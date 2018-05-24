import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { TokenPaymentComponent } from './token-payment.component';

describe('TokenPaymentComponent', () => {
  let component: TokenPaymentComponent;
  let fixture: ComponentFixture<TokenPaymentComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ TokenPaymentComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(TokenPaymentComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
