// src/app/shared/services/event.service.ts
import { Injectable } from '@angular/core';
import { AngularFirestore } from '@angular/fire/compat/firestore';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';

export interface EventDTO {
  id?: string;
  title: string;
  description?: string;
  startDateTime: string;
  endDateTime: string;
  price?: number;
  isApproved?: boolean;
  archived?: boolean;
  createdAt?: string;
  organizerId?: string;

  photoURL?: string;
  photos?: string[];
}

@Injectable({ providedIn: 'root' })
export class EventService {
  constructor(private afs: AngularFirestore) { }

  getAllEvents(): Observable<EventDTO[]> {
    return this.afs.collection<EventDTO>('events').snapshotChanges().pipe(
      map(actions => actions.map(a => {
        const data = a.payload.doc.data()!;
        const id = a.payload.doc.id;
        return { id, ...data };
      }))
    );
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

  createEvent(eventData: EventDTO): Promise<void> {
    const newId = this.afs.createId();
    return this.afs.collection('events').doc(newId).set({
      ...eventData,
      id: newId,
      archived: eventData.archived ?? false,
      isApproved: eventData.isApproved ?? false,
      createdAt: new Date().toISOString()
    });
  }

  approveEvent(eventId: string, isApproved: boolean): Promise<void> {
    return this.afs.collection('events').doc(eventId).update({ isApproved });
  }

  archiveEvent(eventId: string, archived: boolean): Promise<void> {
    return this.afs.collection('events').doc(eventId).update({ archived });
  }

  // Príklad - ak potrebujete získať userov
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
