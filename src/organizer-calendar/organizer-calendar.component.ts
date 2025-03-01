import { Component, OnInit } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { EventService, EventDTO } from '../shared/services/event.service';
import { AuthService } from '../shared/services/auth.service';
import { EventCreateComponent } from '../events/event-create/event-create.component'; // Upravte cestu podľa štruktúry projektu
import { EventEditComponent } from '../events/event-edit/event-edit.component';     // Upravte cestu podľa štruktúry projektu

@Component({
  selector: 'app-organizer-calendar',
  templateUrl: './organizer-calendar.component.html',
  styleUrls: ['./organizer-calendar.component.scss']
})
export class OrganizerCalendarComponent implements OnInit {
  allEvents: EventDTO[] = [];
  currentUserId: string | null = null;

  constructor(
    private eventService: EventService,
    private authService: AuthService,
    private dialog: MatDialog
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

  openCreateEventDialog() {
    const dialogRef = this.dialog.open(EventCreateComponent, {
      width: '60vw', // Adjust width as needed for responsiveness
      maxWidth: '600px',  // Optional:  Set a maximum width
      panelClass: 'custom-dialog-container' // Add a custom class to the dialog panel
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        // Po úspešnom vytvorení udalosti aktualizujeme zoznam udalostí
        this.loadEvents();
      }
    });
  }

  editEvent(evt: EventDTO) {
    if (!this.canEdit(evt)) {
      alert('Nemôžete upravovať cudzie udalosti');
      return;
    }
    const dialogRef = this.dialog.open(EventEditComponent, {
      width: '600px',
      data: { event: evt }
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        // Po úspešnej úprave udalosti aktualizujeme zoznam udalostí
        this.loadEvents();
      }
    });
  }
}
