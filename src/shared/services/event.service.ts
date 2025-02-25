import { Injectable } from '@angular/core';
import { AngularFirestore, AngularFirestoreCollection, AngularFirestoreDocument } from '@angular/fire/compat/firestore';
import { Observable, of } from 'rxjs';
import { map, catchError } from 'rxjs/operators';


export interface EventDTO {
  id?: string;
  title: string;
  description: string;
  startDateTime: string;
  endDateTime: string;
  price?: number;
  photoURL?: string;
  photos?: string[];
  createdAt: string;
}

@Injectable({ providedIn: 'root' })
export class EventService {
  private eventsCollection: AngularFirestoreCollection<EventDTO>;

  constructor(private afs: AngularFirestore) {
    this.eventsCollection = this.afs.collection<EventDTO>('events');
  }

  getEvents(): Observable<EventDTO[]> {
    return this.eventsCollection.snapshotChanges().pipe(
      map(actions =>
        actions.map(a => {
          const data = a.payload.doc.data() as EventDTO;
          const id = a.payload.doc.id;
          return { id, ...data };
        })
      ),
      catchError(this.handleError<EventDTO[]>('getEvents', []))
    );
  }

  getEvent$(id: string): Observable<EventDTO | undefined> {
    return this.afs.doc<EventDTO>(`events/${id}`).valueChanges().pipe(
      catchError(this.handleError<EventDTO>('getEvent', undefined))
    );
  }

  createEvent(eventData: EventDTO): Promise<any> {
    return this.eventsCollection.add(eventData)
      .catch(error => this.handlePromiseError<any>('createEvent', error));
  }

  updateEvent(eventId: string, eventData: EventDTO): Promise<void> {
    const eventDoc: AngularFirestoreDocument<EventDTO> = this.afs.doc<EventDTO>(`events/${eventId}`);
    return eventDoc.update(eventData)
      .catch(error => this.handlePromiseError<void>('updateEvent', error));
  }

  deleteEvent(eventId: string): Promise<void> {
    const eventDoc: AngularFirestoreDocument<EventDTO> = this.afs.doc<EventDTO>(`events/${eventId}`);
    return eventDoc.delete()
      .catch(error => this.handlePromiseError<void>('deleteEvent', error));
  }

  private handleError<T>(operation = 'operation', result?: T) {
    return (error: any): Observable<T> => {
      console.error(`${operation} failed: ${error.message}`);
      return of(result as T);
    };
  }

  private handlePromiseError<T>(operation = 'operation', error: any): Promise<T> {
    console.error(`${operation} failed: ${error.message}`);
    return Promise.reject(error);
  }
}
