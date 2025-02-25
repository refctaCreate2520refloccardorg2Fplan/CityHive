// src/app/events/event-create/event-create.component.ts
import { Component } from '@angular/core';
import { EventService, EventDTO } from '../../shared/services/event.service';

@Component({
  selector: 'app-event-create',
  templateUrl: './event-create.component.html',
  styleUrls: ['./event-create.component.css']
})
export class EventCreateComponent {
  // Jednojazyčný event
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

  constructor(private eventService: EventService) { }

  createEvent() {
    if (!this.newEvent.title) {
      alert('Title is required');
      return;
    }
    if (!this.newEvent.startDateTime || !this.newEvent.endDateTime) {
      alert('Start / End is required');
      return;
    }
    // Napr. bežný user => isApproved = false
    this.newEvent.isApproved = false;

    this.eventService.createEvent(this.newEvent).then(() => {
      alert('Event created (awaiting admin approval).');
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
        organizerId: ''
      };
    });
  }
}
