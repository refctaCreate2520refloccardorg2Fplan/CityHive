import { Component } from '@angular/core';
import { MatDialogRef } from '@angular/material/dialog';
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
  selectedMainImage: File | null = null; // Hlavný obrázok
  selectedAdditionalImages: File[] = [];  // Dodatočné obrázky

  categories = ['Výstava', 'Koncerty', 'Festivaly', 'Kino', 'Besedy a prednášky', 'Mestské slávnosti', 'Tematické festivaly'];
  places = ['Bambuľkovo', 'Kino'];

  constructor(
    private eventService: EventService,
    private dialogRef: MatDialogRef<EventCreateComponent>
  ) { }

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

  async createEvent() {
    if (!this.isPriceVoluntary) {
      if (typeof this.newEvent.price === 'undefined' || this.newEvent.price < 0) {
        alert('Prosím zadajte platnú cenu alebo označte ako dobrovoľné');
        return;
      }
    }

    try {
      // Vytvorenie udalosti a získanie ID udalosti
      const eventId = await this.eventService.createEvent(this.newEvent);

      // Nahrávanie hlavného obrázka (ak bol vybraný)
      let mainImageUrl = '';
      if (this.selectedMainImage && eventId) {
        mainImageUrl = await this.eventService.uploadEventImage(this.selectedMainImage, eventId);
      }

      // Nahrávanie dodatočných obrázkov
      const additionalImages: string[] = [];
      if (this.selectedAdditionalImages.length > 0 && eventId) {
        for (let file of this.selectedAdditionalImages) {
          const url = await this.eventService.uploadEventImage(file, eventId);
          additionalImages.push(url);
        }
      }

      // Aktualizácia udalosti s URL obrázkov
      await this.eventService.updateEvent({
        ...this.newEvent,
        id: eventId,
        photoURL: mainImageUrl || undefined,
        photos: additionalImages.length ? additionalImages : undefined
      });

      alert('Udalosť vytvorená (čaká na schválenie adminom)');
      this.resetForm();
      this.dialogRef.close(true);
    } catch (error: any) {
      console.error('Chyba pri vytváraní udalosti:', error);
      alert('Chyba pri vytváraní udalosti: ' + error.message);
    }
  }

  closeDialog() {
    this.dialogRef.close();
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
    this.selectedMainImage = null;
    this.selectedAdditionalImages = [];
  }
}
