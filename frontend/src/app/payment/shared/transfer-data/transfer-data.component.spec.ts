import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { TransferDataComponent } from './transfer-data.component';

describe('TransferDataComponent', () => {
  let component: TransferDataComponent;
  let fixture: ComponentFixture<TransferDataComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ TransferDataComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(TransferDataComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
