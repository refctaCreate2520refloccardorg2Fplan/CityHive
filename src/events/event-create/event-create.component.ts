import { Component, EventEmitter, Output, OnInit } from '@angular/core';
import { EventService, EventDTO } from '../../shared/services/event.service';
import { AuthService } from '../../shared/services/auth.service';

interface Venue {
  name: string;
  address: string;
  lat: number;
  lng: number;
}

@Component({
  selector: 'app-event-create',
  templateUrl: './event-create.component.html',
  styleUrls: ['./event-create.component.scss']
})
export class EventCreateComponent implements OnInit {
  @Output() createFinished = new EventEmitter<boolean>();

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
    category: '',
    place: ''
  };

  participantLimit: number | undefined;
  isPriceVoluntary = false;
  selectedMainImage: File | null = null;
  selectedAdditionalImages: File[] = [];

  categories = ['Výstava', 'Koncerty', 'Festivaly', 'Kino', 'Besedy a prednášky', 'Mestské slávnosti', 'Tematické festivaly'];

  // Definícia preddefinovaných miest s adresou a súradnicami
  venues: Venue[] = [
    { name: 'Csemadok', address: 'Z. Kodalya 777, Galanta', lat: 48.2039, lng: 17.6593 },
    { name: 'Matica', address: 'Bratislavská 1458/71, 924 01 Galanta', lat: 48.2045, lng: 17.6600 },
    { name: 'vlastivedne muzeum', address: 'Hlavná ul. 976/8, 924 01 Galanta', lat: 48.2040, lng: 17.6605 },
    { name: 'galantske osvietene stredisko', address: 'Bratislavská 1458/71, Galanta', lat: 48.2030, lng: 17.6580 },
    { name: 'renesancny kastiel', address: 'ul. Esterházyovcov, Galanta', lat: 48.2025, lng: 17.6575 },
    { name: 'MsKS', address: 'Mierové námestie 942/3, Galanta', lat: 48.2035, lng: 17.6590 },
    { name: 'galantsky neogoticky kastiel', address: 'Parková 760, 924 01 Galanta', lat: 48.2040, lng: 17.6585 },
    { name: 'galantska kniznica', address: 'Mierové námestie 4, Galanta', lat: 48.2048, lng: 17.6598 },
    { name: 'kino', address: 'Mierové námestie 942/3, Galanta', lat: 48.2037, lng: 17.6587 }
  ];

  // Ak chcete, môžete vytvoriť getter pre zoznam názvov miest
  get places(): string[] {
    return this.venues.map(v => v.name);
  }

  constructor(
    private eventService: EventService,
    private authService: AuthService
  ) { }

  ngOnInit(): void {
    // Nastavíme predvolené miesto (prvý z ponuky)
    this.newEvent.place = this.venues[0].name;
    (this.newEvent as any).lat = this.venues[0].lat;
    (this.newEvent as any).lng = this.venues[0].lng;
  }

  preventNegative(event: KeyboardEvent) {
    const forbiddenKeys = ['-', '+', 'e', 'E'];
    if (forbiddenKeys.includes(event.key)) {
      event.preventDefault();
    }
  }

  onMainImageSelected(event: any) {
    if (event.target.files && event.target.files.length) {
      this.selectedMainImage = event.target.files[0];
    }
  }

  onAdditionalImagesSelected(event: any) {
    if (event.target.files && event.target.files.length) {
      this.selectedAdditionalImages = Array.from(event.target.files);
    }
  }

  // Upravená metóda – prijíma celý event, vykoná casting a získa value
  onVenueChange(event: Event) {
    const target = event.target as HTMLSelectElement;
    const value = target.value;
    const venue = this.venues.find(v => v.name === value);
    if (venue) {
      this.newEvent.place = venue.name;
      (this.newEvent as any).lat = venue.lat;
      (this.newEvent as any).lng = venue.lng;
    }
  }

  async createEvent() {
    if (!this.isPriceVoluntary) {
      if (typeof this.newEvent.price === 'undefined' || this.newEvent.price < 0) {
        alert('Prosím zadajte platnú cenu alebo označte ako dobrovoľné');
        return;
      }
    }

    try {
      const currentUserId = await this.authService.getCurrentUserId();
      this.newEvent.organizerId = currentUserId || '';

      const eventId = await this.eventService.createEvent(this.newEvent);

      let mainImageUrl = '';
      if (this.selectedMainImage && eventId) {
        mainImageUrl = await this.eventService.uploadEventImage(this.selectedMainImage, eventId);
      }

      const additionalImages: string[] = [];
      if (this.selectedAdditionalImages.length > 0 && eventId) {
        for (let file of this.selectedAdditionalImages) {
          const url = await this.eventService.uploadEventImage(file, eventId);
          additionalImages.push(url);
        }
      }

      await this.eventService.updateEvent({
        ...this.newEvent,
        id: eventId,
        photoURL: mainImageUrl || undefined,
        photos: additionalImages.length ? additionalImages : undefined
      });

      alert('Udalosť vytvorená (čaká na schválenie adminom)');
      this.resetForm();
      this.createFinished.emit(true);
    } catch (error: any) {
      console.error('Chyba pri vytváraní udalosti:', error);
      alert('Chyba pri vytváraní udalosti: ' + error.message);
    }
  }

  closeDialog() {
    this.createFinished.emit(false);
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
      place: this.venues[0].name
    };
    (this.newEvent as any).lat = this.venues[0].lat;
    (this.newEvent as any).lng = this.venues[0].lng;
    this.participantLimit = undefined;
    this.isPriceVoluntary = false;
    this.selectedMainImage = null;
    this.selectedAdditionalImages = [];
  }
}
