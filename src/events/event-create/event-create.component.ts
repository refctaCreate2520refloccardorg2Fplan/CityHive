// src/app/events/event-create/event-create.component.ts
import { Component } from '@angular/core';
import { Router } from '@angular/router';
import { AngularFireStorage } from '@angular/fire/compat/storage';
import { finalize } from 'rxjs/operators';

import { EventService, EventDTO } from '../../shared/services/event.service';
import { AuthService } from '../../shared/services/auth.service';

@Component({
  selector: 'app-event-create',
  templateUrl: './event-create.component.html',
  styleUrls: ['./event-create.component.css']
})
export class EventCreateComponent {
  newEvent: EventDTO = {
    title: '',
    description: '',
    startDateTime: '',
    endDateTime: '',
    price: 0,
    photoURL: '',
    photos: [],
    createdAt: ''
  };

  uploadingPhoto = false;
  uploadProgress = 0;
  photoPreviewURL = '';

  constructor(
    private eventService: EventService,
    private router: Router,
    private storage: AngularFireStorage,
    public authService: AuthService
  ) { }

  createEvent(): void {
    if (!this.newEvent.title ||
      !this.newEvent.description ||
      !this.newEvent.startDateTime ||
      !this.newEvent.endDateTime) {
      alert('Please fill in all required fields.');
      return;
    }

    if (this.uploadingPhoto) {
      alert('Please wait for the photo upload to complete.');
      return;
    }

    this.newEvent.createdAt = new Date().toISOString();

    this.eventService.createEvent(this.newEvent)
      .then(() => {
        alert('Event created successfully!');
        this.router.navigate(['/events']);
      })
      .catch(error => {
        console.error(error);
        alert('Failed to create event.');
      });
  }

  onFileChange(event: any): void {
    const file = event.target.files[0];
    if (file) {
      this.uploadPhotoToStorage(file);
    }
  }

  uploadPhotoToStorage(file: File): void {
    this.uploadingPhoto = true;
    const filePath = `events-photos/${Date.now()}_${file.name}`;
    const fileRef = this.storage.ref(filePath);
    const uploadTask = this.storage.upload(filePath, file);

    uploadTask.percentageChanges().subscribe(percent => {
      this.uploadProgress = Math.round(percent || 0);
    });

    uploadTask.snapshotChanges().pipe(
      finalize(() => {
        fileRef.getDownloadURL().subscribe(url => {
          this.newEvent.photoURL = url;
          this.photoPreviewURL = url;
          this.uploadingPhoto = false;
        });
      })
    ).subscribe();
  }

  cancelCreate(): void {
    this.router.navigate(['/events']);
  }
}
