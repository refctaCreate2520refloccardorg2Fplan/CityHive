import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { EventService, EventDTO } from '../../shared/services/event.service';

@Component({
  selector: 'app-events-list',
  templateUrl: './events-list.component.html',
  styleUrls: ['./events-list.component.scss']
})
export class EventsListComponent implements OnInit {
  events: EventDTO[] = [];
  filteredEvents: EventDTO[] = [];
  searchQuery = '';

  constructor(private eventService: EventService, private router: Router) { }

  ngOnInit(): void {
    this.eventService.getAllEvents().subscribe(data => {
      this.events = data;
      this.filterEvents();
    });
  }

  filterEvents(): void {
    if (!this.searchQuery) {
      this.filteredEvents = [...this.events];
    } else {
      const query = this.searchQuery.toLowerCase();
      this.filteredEvents = this.events.filter(evt => {
        const titleLower = evt.title.toLowerCase();
        const descLower = evt.description ? evt.description.toLowerCase() : '';
        return titleLower.includes(query) || descLower.includes(query);
      });
    }
  }

  goToEvent(eventId: string): void {
    this.router.navigate(['/events', eventId]);
  }
}
