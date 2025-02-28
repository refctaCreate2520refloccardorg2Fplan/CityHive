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
  // Uchováva hodnoty slidera pre jednotlivé udalosti (id -> percento záujmu)
  interestRatings: { [id: string]: number } = {};

  constructor(private eventService: EventService, private router: Router) { }

  ngOnInit(): void {
    this.eventService.getAllEvents().subscribe(data => {
      this.events = data;
      // Inicializácia default hodnoty (50 %) pre každú udalosť, ak nie je definovaná hodnota záujmu
      this.events.forEach(e => {
        if (e.id) {
          this.interestRatings[e.id] = e.interestRating !== undefined ? e.interestRating : 50;
        }
      });
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

  // Metóda, ktorá aktualizuje hodnotu slidera lokálne aj v databáze Firebase
  onInterestChange(event: Event, eventId: string): void {
    const input = event.target as HTMLInputElement;
    const value = +input.value;
    this.interestRatings[eventId] = value;
    this.eventService.updateInterest(eventId, value)
      .then(() => console.log('Hodnota záujmu bola úspešne uložená'))
      .catch(error => console.error('Chyba pri ukladaní hodnoty záujmu:', error));
  }

  getGoogleCalendarUrl(e: EventDTO): string {
    const start = new Date(e.startDateTime);
    const end = new Date(e.endDateTime);
    const formatDate = (date: Date): string => {
      // Formát: YYYYMMDDTHHMMSSZ
      return date.toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z';
    };
    const startStr = formatDate(start);
    const endStr = formatDate(end);
    const details = encodeURIComponent(e.description || '');
    // Ak máte v DTO napríklad aj lokalitu, použite ju – inak nechajte prázdne
    const location = encodeURIComponent((e as any).location || '');
    const text = encodeURIComponent(e.title);
    return `https://calendar.google.com/calendar/render?action=TEMPLATE&text=${text}&dates=${startStr}/${endStr}&details=${details}&location=${location}`;
  }
}
