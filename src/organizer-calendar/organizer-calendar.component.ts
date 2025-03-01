import { Component, OnInit } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { EventService, EventDTO } from '../shared/services/event.service';
import { AuthService } from '../shared/services/auth.service';
import { EventEditComponent } from '../events/event-edit/event-edit.component';  // Uistite sa, že cesta zodpovedá

@Component({
  selector: 'app-organizer-calendar',
  templateUrl: './organizer-calendar.component.html',
  styleUrls: ['./organizer-calendar.component.scss']
})
export class OrganizerCalendarComponent implements OnInit {
  allEvents: EventDTO[] = [];
  currentUserId: string | null = null;
  showCreateEvent: boolean = false;  // Flag pre zobrazenie vytvorenia udalosti

  constructor(
    private eventService: EventService,
    private authService: AuthService,
    private dialog: MatDialog   // Injekcia MatDialog
  ) { }

  async ngOnInit() {
    this.currentUserId = await this.authService.getCurrentUserId();
    this.loadEvents();
  }

  private loadEvents() {
    this.eventService.getAllEvents().subscribe(evs => {
      this.allEvents = evs;
    });
  }

  canEdit(evt: EventDTO): boolean {
    return evt.organizerId === this.currentUserId;
  }

  toggleCreateEvent() {
    this.showCreateEvent = !this.showCreateEvent;
  }

  editEvent(evt: EventDTO) {
    if (!this.canEdit(evt)) {
      alert('Nemôžete upravovať cudzie udalosti');
      return;
    }
    // Otvorenie dialógu s komponentom EventEditComponent
    const dialogRef = this.dialog.open(EventEditComponent, {
      width: '600px',
      data: { event: evt }
    });
    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        // Po úspešnej úprave načítame udalosti opäť
        this.loadEvents();
      }
    });
  }
}
