// src/app/public-calendar/public-calendar.component.ts
import { Component, OnInit } from '@angular/core';
import { EventService, EventDTO } from '../shared/services/event.service';

@Component({
  selector: 'app-public-calendar',
  templateUrl: './public-calendar.component.html',
  styleUrls: ['./public-calendar.component.scss']
})
export class PublicCalendarComponent implements OnInit {
  events: EventDTO[] = [];

  constructor(private eventService: EventService) { }

  ngOnInit(): void {
    this.eventService.getApprovedEvents().subscribe(evs => {
      this.events = evs;
    });
  }
}
