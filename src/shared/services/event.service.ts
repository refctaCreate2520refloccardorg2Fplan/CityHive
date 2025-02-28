import { Injectable } from '@angular/core';
import { AngularFirestore } from '@angular/fire/compat/firestore';
import { AngularFireStorage } from '@angular/fire/compat/storage';
import { Observable } from 'rxjs';
import { map, finalize } from 'rxjs/operators';

export interface EventDTO {
  id?: string;
  title: string;
  description?: string;
  startDateTime: string;
  endDateTime: string;
  price?: number;  // Ak nie je zadaná, môžeme použiť null
  isApproved?: boolean;
  archived?: boolean;
  createdAt?: string;
  organizerId?: string;
  photoURL?: string;  // Hlavný obrázok
  photos?: string[];  // Dodatočné obrázky
  interestRating?: number;
  category: string;
  place: string;
}

@Injectable({ providedIn: 'root' })
export class EventService {
  constructor(
    private afs: AngularFirestore,
    private storage: AngularFireStorage
  ) { }

  // Upravená funkcia sanitizeEventData – vráti objekt bez undefined hodnôt.
  private sanitizeEventData(data: EventDTO): any {
    const merged = {
      ...data,
      price: data.price !== null && data.price !== undefined ? Number(data.price) : null,
    };
    return Object.fromEntries(
      Object.entries(merged).filter(([_, v]) => v !== undefined)
    );
  }

  getAllEvents(): Observable<EventDTO[]> {
    return this.afs.collection<EventDTO>('events').snapshotChanges().pipe(
      map(actions => actions.map(a => {
        const data = a.payload.doc.data()!;
        const id = a.payload.doc.id;
        return {
          ...data,
          id,
          price: data.price !== null ? data.price : undefined
        };
      }))
    );
  }

  // Vytvorenie udalosti, vráti vygenerované ID udalosti
  createEvent(eventData: EventDTO): Promise<string> {
    const newId = this.afs.createId();
    const sanitizedData = this.sanitizeEventData({
      ...eventData,
      id: newId,
      archived: eventData.archived ?? false,
      isApproved: eventData.isApproved ?? false,
      createdAt: new Date().toISOString(),
    });

    return this.afs.collection('events').doc(newId).set(sanitizedData).then(() => newId);
  }

  updateEvent(eventData: EventDTO): Promise<void> {
    if (!eventData.id) {
      return Promise.reject(new Error("Event ID is required for updating."));
    }
    const sanitizedData = this.sanitizeEventData(eventData);
    return this.afs.collection('events').doc(eventData.id).update(sanitizedData);
  }

  // Nahrávanie jedného obrázka do Firebase Storage a vrátenie URL
  uploadEventImage(file: File, eventId: string): Promise<string> {
    const filePath = `events/${eventId}/${file.name}`;
    const fileRef = this.storage.ref(filePath);
    const task = this.storage.upload(filePath, file);
    return new Promise<string>((resolve, reject) => {
      task.snapshotChanges().pipe(
        finalize(() => {
          fileRef.getDownloadURL().subscribe(url => {
            resolve(url);
          }, err => reject(err));
        })
      ).subscribe();
    });
  }

  getApprovedEvents(): Observable<EventDTO[]> {
    return this.afs.collection<EventDTO>('events', ref =>
      ref.where('isApproved', '==', true).where('archived', '==', false)
    ).snapshotChanges().pipe(
      map(actions => actions.map(a => {
        const data = a.payload.doc.data()!;
        const id = a.payload.doc.id;
        return { id, ...data };
      }))
    );
  }

  approveEvent(eventId: string, isApproved: boolean): Promise<void> {
    return this.afs.collection('events').doc(eventId).update({ isApproved });
  }

  archiveEvent(eventId: string, archived: boolean): Promise<void> {
    return this.afs.collection('events').doc(eventId).update({ archived });
  }

  updateInterest(eventId: string, interestRating: number): Promise<void> {
    return this.afs.collection('events').doc(eventId).update({ interestRating });
  }

  getAllUsers(): Observable<any[]> {
    return this.afs.collection('users').snapshotChanges().pipe(
      map(actions => actions.map(a => {
        const data: any = a.payload.doc.data();
        const uid = a.payload.doc.id;
        return { uid, ...data };
      }))
    );
  }
}
