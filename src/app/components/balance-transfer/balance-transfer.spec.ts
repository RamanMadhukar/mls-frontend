import { ComponentFixture, TestBed } from '@angular/core/testing';

import { BalanceTransfer } from './balance-transfer';

describe('BalanceTransfer', () => {
  let component: BalanceTransfer;
  let fixture: ComponentFixture<BalanceTransfer>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [BalanceTransfer]
    })
    .compileComponents();

    fixture = TestBed.createComponent(BalanceTransfer);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
