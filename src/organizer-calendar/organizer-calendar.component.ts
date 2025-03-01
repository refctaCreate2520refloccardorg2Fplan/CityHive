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
  showCreateEvent: boolean = false;  // Flag to control the visibility

  constructor(
    private eventService: EventService,
    private authService: AuthService,
  ) { }

  async ngOnInit() {
    this.currentUserId = await this.authService.getCurrentUserId();
    this.loadEvents();
  }

  private loadEvents() {
    this.eventService.getAllEvents().subscribe(evs => {
      this.allEvents = evs;
    });
  }

  canEdit(evt: EventDTO): boolean {
    return evt.organizerId === this.currentUserId;
  }

  toggleCreateEvent() {
    this.showCreateEvent = !this.showCreateEvent;
  }

  editEvent(evt: EventDTO) {
    if (!this.canEdit(evt)) {
      alert('Nemôžete upravovať cudzie udalosti');
      return;
    }
    // ... your edit event logic ...
  }
}
