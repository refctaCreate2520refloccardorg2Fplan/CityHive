import { ComponentFixture, TestBed } from '@angular/core/testing';

import { AdminOrganizerChatComponent } from './admin-organizer-chat.component';

describe('AdminOrganizerChatComponent', () => {
  let component: AdminOrganizerChatComponent;
  let fixture: ComponentFixture<AdminOrganizerChatComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AdminOrganizerChatComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(AdminOrganizerChatComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
