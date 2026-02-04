import { ComponentFixture, TestBed } from '@angular/core/testing';

import { UserHierarchy } from './user-hierarchy';

describe('UserHierarchy', () => {
  let component: UserHierarchy;
  let fixture: ComponentFixture<UserHierarchy>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [UserHierarchy]
    })
    .compileComponents();

    fixture = TestBed.createComponent(UserHierarchy);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
