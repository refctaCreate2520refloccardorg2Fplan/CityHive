import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, RouterModule } from '@angular/router';
import { AngularFirestore } from '@angular/fire/compat/firestore';
import { Observable, of } from 'rxjs';
import { switchMap } from 'rxjs/operators';
import { AngularFireModule } from '@angular/fire/compat';
import { AngularFirestoreModule } from '@angular/fire/compat/firestore';
import { EventDTO } from '../../shared/services/event.service';

// Define an interface for event data

@Component({
  selector: 'app-event-detail',
  templateUrl: './event-detail.component.html',
  styleUrls: ['./event-detail.component.css']
})
export class EventDetailComponent implements OnInit {
  event$!: Observable<EventDTO | undefined>;

  constructor(public route: ActivatedRoute, public afs: AngularFirestore) { }

  ngOnInit(): void {
    this.event$ = this.route.paramMap.pipe(
      switchMap(params => {
        const eventId = params.get('id');
        return eventId
          ? this.afs.doc<EventDTO>(`events/${eventId}`).valueChanges()
          : of(undefined);
      })
    );
  }
}
