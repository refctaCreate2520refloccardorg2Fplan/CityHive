import { ComponentFixture, TestBed } from '@angular/core/testing';

import { StanSaOrganizatoromComponent } from './stan-sa-organizatorom.component';

describe('StanSaOrganizatoromComponent', () => {
  let component: StanSaOrganizatoromComponent;
  let fixture: ComponentFixture<StanSaOrganizatoromComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [StanSaOrganizatoromComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(StanSaOrganizatoromComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
