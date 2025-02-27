// src/app/events/event-detail/event-detail.component.ts
import { Component, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { EventService, EventDTO } from '../../shared/services/event.service';
import { switchMap } from 'rxjs/operators';
import { Observable } from 'rxjs';

@Component({
  selector: 'app-event-detail',
  templateUrl: './event-detail.component.html',
  styleUrls: ['./event-detail.component.scss']
})
export class EventDetailComponent implements OnInit {
  event?: EventDTO;

  constructor(
    private route: ActivatedRoute,
    private eventService: EventService
  ) { }

  ngOnInit(): void {
    this.route.paramMap.pipe(
      switchMap(params => {
        const eventId = params.get('id');
        return this.eventService.getAllEvents();
      })
    ).subscribe(all => {
      const eventId = this.route.snapshot.paramMap.get('id');
      this.event = all.find(e => e.id === eventId);
    });
  }
}
