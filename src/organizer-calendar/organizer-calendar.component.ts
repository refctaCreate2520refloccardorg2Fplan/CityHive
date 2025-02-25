// src/app/organizer-calendar/organizer-calendar.component.ts
import { Component, OnInit } from '@angular/core';
import { EventService, EventDTO } from '../shared/services/event.service';
import { AuthService } from '../shared/services/auth.service';

@Component({
  selector: 'app-organizer-calendar',
  templateUrl: './organizer-calendar.component.html',
  styleUrls: ['./organizer-calendar.component.scss']
})
export class OrganizerCalendarComponent implements OnInit {
  allEvents: EventDTO[] = [];
  currentUserId: string | null = null;

  newEvent: EventDTO = {
    id: '',
    title: '',
    description: '',
    startDateTime: '',
    endDateTime: '',
    price: 0,
    isApproved: false,
    archived: false,
    createdAt: '',
    organizerId: ''
  };

  constructor(private eventService: EventService, private authService: AuthService) { }

  async ngOnInit() {
    this.currentUserId = await this.authService.getCurrentUserId();
    this.eventService.getAllEvents().subscribe(evs => {
      this.allEvents = evs;
    });
  }

  canEdit(evt: EventDTO): boolean {
    return evt.organizerId === this.currentUserId;
  }

  createEvent() {
    if (!this.currentUserId) {
      alert('Musíte byť prihlásený');
      return;
    }
    if (!this.newEvent.title) {
      alert('Title is required');
      return;
    }
    if (!this.newEvent.startDateTime || !this.newEvent.endDateTime) {
      alert('Start / End is required');
      return;
    }

    this.newEvent.isApproved = false;
    this.newEvent.organizerId = this.currentUserId;

    this.eventService.createEvent(this.newEvent).then(() => {
      alert('Event created, awaiting admin approval.');
      // reset
      this.newEvent = {
        id: '',
        title: '',
        description: '',
        startDateTime: '',
        endDateTime: '',
        price: 0,
        isApproved: false,
        archived: false,
        createdAt: '',
        organizerId: this.currentUserId ?? undefined
      };
    });
  }

  editEvent(evt: EventDTO) {
    if (!this.canEdit(evt)) {
      alert('Nemôžete upravovať cudzie eventy');
      return;
    }
    alert(`Implement edit logic for event with ID = ${evt.id}`);
  }
}
