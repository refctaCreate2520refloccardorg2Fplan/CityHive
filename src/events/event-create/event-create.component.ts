import { Component } from '@angular/core';
import { EventService, EventDTO } from '../../shared/services/event.service';

@Component({
  selector: 'app-event-create',
  templateUrl: './event-create.component.html',
  styleUrls: ['./event-create.component.scss']
})
export class EventCreateComponent {
  newEvent: EventDTO = {
    id: '',
    title: '',
    description: '',
    startDateTime: '',
    endDateTime: '',
    price: undefined,
    isApproved: false,
    archived: false,
    createdAt: '',
    organizerId: '',
    category: 'Výstava',
    place: 'Bambuľkovo'
  };

  participantLimit: number | undefined;
  isPriceVoluntary = false;

  categories = ['Výstava', 'Koncerty', 'Festivaly', 'Kino', 'Besedy a prednášky', 'Mestské slávnosti', 'Tematické festivaly'];
  places = ['Bambuľkovo', 'Kino'];

  constructor(private eventService: EventService) { }

  preventNegative(event: KeyboardEvent) {
    const forbiddenKeys = ['-', '+', 'e', 'E'];
    if (forbiddenKeys.includes(event.key)) {
      event.preventDefault();
    }
  }

  createEvent() {
    // Validate price
    if (!this.isPriceVoluntary) {
      if (typeof this.newEvent.price === 'undefined' || this.newEvent.price < 0) {
        alert('Prosím zadajte platnú cenu alebo označte ako dobrovoľné');
        return;
      }
    }

    const eventData: EventDTO = {
      ...this.newEvent,
      price: this.isPriceVoluntary ? undefined : this.newEvent.price,
    
    };

    // Existing validations
    if (!eventData.title) {
      alert('Názov je povinný');
      return;
    }

    if (!eventData.startDateTime || !eventData.endDateTime) {
      alert('Počiatočný a konečný dátum sú povinné');
      return;
    }

    this.eventService.createEvent(eventData).then(() => {
      alert('Udalosť vytvorená (čaká na schválenie adminom)');
      this.resetForm();
    });
  }

  private resetForm() {
    this.newEvent = {
      id: '',
      title: '',
      description: '',
      startDateTime: '',
      endDateTime: '',
      price: undefined,
      isApproved: false,
      archived: false,
      createdAt: '',
      organizerId: '',
      category: 'Výstava',
      place: 'Bambuľkovo'
    };
    this.participantLimit = undefined;
    this.isPriceVoluntary = false;
  }
}
