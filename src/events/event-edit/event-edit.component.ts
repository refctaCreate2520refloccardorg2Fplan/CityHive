import { Component, Inject } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { EventService, EventDTO } from '../../shared/services/event.service';

@Component({
  selector: 'app-event-edit',
  templateUrl: './event-edit.component.html',
  styleUrls: ['./event-edit.component.scss']
})
export class EventEditComponent {
  // Vytvoríme lokálnu kópiu udalosti, aby sa pôvodné dáta v dialógu nemenili pred potvrdením
  event: EventDTO = { ...this.data.event };

  // Premenné pre nové obrázky, ktoré sa majú nahrať
  newMainImage: File | null = null;
  newAdditionalImages: File[] = [];

  categories = ['Výstava', 'Koncerty', 'Festivaly', 'Kino', 'Besedy a prednášky', 'Mestské slávnosti', 'Tematické festivaly'];
  places = ['Bambuľkovo', 'Kino'];

  constructor(
    private eventService: EventService,
    private dialogRef: MatDialogRef<EventEditComponent>,
    @Inject(MAT_DIALOG_DATA) public data: { event: EventDTO }
  ) { }

  preventNegative(event: KeyboardEvent) {
    const forbiddenKeys = ['-', '+', 'e', 'E'];
    if (forbiddenKeys.includes(event.key)) {
      event.preventDefault();
    }
  }

  onNewMainImageSelected(event: any) {
    if (event.target.files && event.target.files.length) {
      this.newMainImage = event.target.files[0];
    }
  }

  onNewAdditionalImagesSelected(event: any) {
    if (event.target.files && event.target.files.length) {
      this.newAdditionalImages = Array.from(event.target.files);
    }
  }

  removeMainImage() {
    // Odstráni aktuálny hlavný obrázok
    this.event.photoURL = undefined;
  }

  removeAdditionalImage(index: number) {
    // Odstráni obrázok z poľa dodatočných obrázkov
    if (this.event.photos) {
      this.event.photos.splice(index, 1);
    }
  }

  async updateEvent() {
    // Základná validácia vstupov
    if (!this.event.title) {
      alert('Názov je povinný');
      return;
    }
    if (!this.event.startDateTime || !this.event.endDateTime) {
      alert('Počiatočný a konečný dátum sú povinné');
      return;
    }

    try {
      // Ak bol vybraný nový hlavný obrázok, nahrajeme ho a získame URL
      if (this.newMainImage && this.event.id) {
        const mainUrl = await this.eventService.uploadEventImage(this.newMainImage, this.event.id);
        this.event.photoURL = mainUrl;
      }
      // Ak boli vybraté nové dodatočné obrázky, nahrajeme ich a pripojíme k už existujúcim (ak sú)
      if (this.newAdditionalImages.length > 0 && this.event.id) {
        const additionalUrls: string[] = this.event.photos ? [...this.event.photos] : [];
        for (const file of this.newAdditionalImages) {
          const url = await this.eventService.uploadEventImage(file, this.event.id);
          additionalUrls.push(url);
        }
        this.event.photos = additionalUrls;
      }
      // Aktualizácia udalosti vo Firestore
      await this.eventService.updateEvent(this.event);
      alert('Udalosť upravená');
      this.dialogRef.close(true);
    } catch (error: any) {
      console.error('Chyba pri aktualizácii udalosti', error);
      alert('Chyba pri aktualizácii udalosti: ' + error.message);
    }
  }

  closeDialog() {
    this.dialogRef.close();
  }
}
