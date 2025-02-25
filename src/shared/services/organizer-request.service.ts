// src/app/shared/services/organizer-request.service.ts
import { Injectable } from '@angular/core';
import { AngularFirestore } from '@angular/fire/compat/firestore';
import { map } from 'rxjs/operators';
import { Observable } from 'rxjs';

export interface OrganizerRequest {
  id?: string;
  userId: string;
  groupName: string;
  members: string;
  contact: string;
  approved: boolean;
}

@Injectable({ providedIn: 'root' })
export class OrganizerRequestService {
  constructor(private afs: AngularFirestore) { }

  createRequest(req: OrganizerRequest): Promise<void> {
    const newId = this.afs.createId();
    return this.afs.collection('organizerRequests').doc(newId).set({
      ...req,
      id: newId,
      approved: false
    });
  }

  getAllRequests(): Observable<OrganizerRequest[]> {
    return this.afs.collection<OrganizerRequest>('organizerRequests').snapshotChanges().pipe(
      map(actions => actions.map(a => {
        const data = a.payload.doc.data()!;
        const id = a.payload.doc.id;
        return { id, ...data };
      }))
    );
  }

  approveRequest(id: string, approved: boolean): Promise<void> {
    return this.afs.collection('organizerRequests').doc(id).update({ approved });
  }

  deleteRequest(id: string): Promise<void> {
    return this.afs.collection('organizerRequests').doc(id).delete();
  }
}
