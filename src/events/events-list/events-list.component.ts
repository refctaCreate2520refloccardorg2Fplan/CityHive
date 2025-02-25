// src/app/events/events-list/events-list.component.ts
import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { EventDTO, EventService } from '../../shared/services/event.service';
import { AuthService } from '../../shared/services/auth.service';

@Component({
  selector: 'app-events-list',
  templateUrl: './events-list.component.html',
  styleUrls: ['./events-list.component.css']
})
export class EventsListComponent implements OnInit {
  events: EventDTO[] = [];
  filteredEvents: EventDTO[] = [];
  searchQuery: string = '';

  constructor(
    private eventService: EventService,
    private router: Router,
    public authService: AuthService
  ) { }

  ngOnInit(): void {
    this.eventService.getEvents().subscribe((data) => {
      this.events = data;
      this.filterEvents();
    });
  }

  filterEvents(): void {
    if (!this.searchQuery) {
      this.filteredEvents = [...this.events];
    } else {
      const query = this.searchQuery.toLowerCase();
      this.filteredEvents = this.events.filter((evt) => {
        return (
          evt.title.toLowerCase().includes(query) ||
          evt.description.toLowerCase().includes(query)
        );
      });
    }
  }

  goToCreateEvent(): void {
    this.router.navigate(['/create-event']);
  }

  goToEventDetail(eventId: string): void {
    alert(`Go to event detail with ID: ${eventId}`);
  }
}
