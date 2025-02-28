import { Component, OnInit } from '@angular/core';
import { EventService } from '../shared/services/event.service';
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
    title: '',
    startDateTime: '',
    endDateTime: '',
    category: '',
    place: '',
    price: undefined, // Initialize as undefined
    description: '',
    isApproved: false,
    archived: false,
    organizerId: ''
  };

  constructor(
    private eventService: EventService,
    private authService: AuthService
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

  async createEvent() {
    if (!this.validateForm()) return;

    const sanitizedEvent = this.prepareEventData();

    try {
      await this.eventService.createEvent(sanitizedEvent);
      this.handleSuccess();
    } catch (error) {
      this.handleError(error);
    }
  }

  private validateForm(): boolean {
    if (!this.currentUserId) {
      alert('Musíte byť prihlásený');
      return false;
    }
    if (!this.newEvent.title) {
      alert('Názov je povinný');
      return false;
    }
    if (!this.newEvent.startDateTime || !this.newEvent.endDateTime) {
      alert('Dátum začiatku a konca je povinný');
      return false;
    }
    return true;
  }

  private prepareEventData(): EventDTO {
    return {
      ...this.newEvent,
      organizerId: this.currentUserId!,
      isApproved: false,
      price: typeof this.newEvent.price === 'number' ? this.newEvent.price : undefined
    };
  }

  private handleSuccess() {
    alert('Udalosť vytvorená, čaká na schválenie administrátorom.');
    this.resetForm();
    this.loadEvents();
  }

  private handleError(error: any) {
    console.error('Chyba pri vytváraní udalosti:', error);
    alert('Chyba pri vytváraní udalosti: ' + error.message);
  }

  private resetForm() {
    this.newEvent = {
      title: '',
      startDateTime: '',
      endDateTime: '',
      category: '',
      place: '',
      price: undefined,
      description: '',
      isApproved: false,
      archived: false,
      organizerId: this.currentUserId || ''
    };
  }

  private sanitizeData(data: EventDTO): object {
    return Object.fromEntries(
      Object.entries(data)
        .filter(([_, v]) => v !== undefined && v !== null)
        .map(([k, v]) => [k, k === 'price' ? Number(v) || undefined : v])
    );
  }

  editEvent(evt: EventDTO) {
    if (!this.canEdit(evt)) {
      alert('Nemôžete upravovať cudzie udalosti');
      return;
    }
    alert(`Editácia udalosti ID: ${evt.id} bude implementovaná neskôr`);
  }
}

export interface EventDTO {
  id?: string;
  title: string;
  description?: string;
  startDateTime: string;
  endDateTime: string;
  price?: number; // Remove '| null' here
  isApproved?: boolean;
  archived?: boolean;
  createdAt?: string;
  organizerId?: string;
  photoURL?: string;
  photos?: string[];
  interestRating?: number;
  category: string;
  place: string;
}
