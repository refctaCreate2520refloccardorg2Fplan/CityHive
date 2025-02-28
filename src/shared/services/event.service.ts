import { Injectable } from '@angular/core';
import { AngularFirestore } from '@angular/fire/compat/firestore';
import { Observable, BehaviorSubject } from 'rxjs';
import { map } from 'rxjs/operators';

export interface EventDTO {
  id?: string;
  title: string;
  description?: string;
  startDateTime: string;
  endDateTime: string;
  price?: number;  // Allow null for optional price
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

@Injectable({ providedIn: 'root' })
export class EventService {
  constructor(private afs: AngularFirestore) { }

  private sanitizeEventData(data: EventDTO): any {
    return {
      ...data,
      price: data.price !== null && data.price !== undefined ? Number(data.price) : null,
      // Remove undefined values
      ...Object.fromEntries(
        Object.entries(data).filter(([_, v]) => v !== undefined)
      )
    };
  }

  getAllEvents(): Observable<EventDTO[]> {
    return this.afs.collection<EventDTO>('events').snapshotChanges().pipe(
      map(actions => actions.map(a => {
        const data = a.payload.doc.data()!;
        const id = a.payload.doc.id;
        return {
          ...data,
          id,
          price: data.price !== null ? data.price : undefined  // Convert null back to undefined
        };
      }))
    );
  }

  createEvent(eventData: EventDTO): Promise<void> {
    const newId = this.afs.createId();
    const sanitizedData = this.sanitizeEventData({
      ...eventData,
      id: newId,
      archived: eventData.archived ?? false,
      isApproved: eventData.isApproved ?? false,
      createdAt: new Date().toISOString(),
    });

    // Firebase-friendly data with null instead of undefined
    const firebaseData = {
      ...sanitizedData,
      price: sanitizedData.price ?? null  // Store null in Firebase for "no price"
    };

    return this.afs.collection('events').doc(newId).set(firebaseData);
  }

  // Keep other methods the same
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
