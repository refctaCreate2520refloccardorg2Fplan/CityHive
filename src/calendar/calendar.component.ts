import { Component, OnInit, OnDestroy, ChangeDetectionStrategy, ChangeDetectorRef, Injector } from '@angular/core';
import { CommonModule, DatePipe } from '@angular/common';
import { AngularFirestore } from '@angular/fire/compat/firestore';
import { AuthService } from '../shared/services/auth.service';
import { Observable, Subscription } from 'rxjs';
import { FormsModule } from '@angular/forms';

interface Event {
  title: string;
  startDateTime: string;
  endDateTime: string;
  createdAt: string;
}

interface DayData {
  date: Date;
  hasEvents: boolean;
  events: Event[];
  isToday?: boolean;
  isCurrentMonth: boolean;
  isWeekend: boolean;
}

@Component({
  selector: 'app-calendar',
  templateUrl: './calendar.component.html',
  styleUrls: ['./calendar.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  providers: [DatePipe]
})
export class CalendarComponent implements OnInit, OnDestroy {
  currentDate = new Date();
  daysInMonth: DayData[] = [];
  selectedDayEvents: Event[] = [];
  newEventTitle: string = '';
  newEventStartDate: string = '';
  newEventStartTime: string = '09:00';
  newEventEndDate: string = '';
  newEventEndTime: string = '10:00';

  isAdmin$: Observable<boolean>;

  selectedDay: DayData | null = null;
  hourSlots: string[] = [];
  isHourViewActive: boolean = false;
  allEvents: Event[] = [];

  private eventsSubscription!: Subscription;

  constructor(
    private afs: AngularFirestore,
    private authService: AuthService,
    private datePipe: DatePipe,
    private injector: Injector,
    private cdr: ChangeDetectorRef
  ) {
    this.isAdmin$ = this.authService.isAdmin();
    this.newEventStartDate = this.datePipe.transform(this.currentDate, 'yyyy-MM-dd') || '';
    this.newEventEndDate = this.datePipe.transform(this.currentDate, 'yyyy-MM-dd') || '';
  }

  ngOnInit(): void {
    this.generateCalendar();
    this.generateHourSlots();

    this.eventsSubscription = this.afs
      .collection<Event>('events')
      .valueChanges({ idField: 'id' })
      .subscribe((events: Event[]) => {
        this.allEvents = events;
        this.assignEventsToCalendar();
      });
  }

  ngOnDestroy(): void {
    if (this.eventsSubscription) {
      this.eventsSubscription.unsubscribe();
    }
  }

  generateCalendar(): void {
    const year = this.currentDate.getFullYear();
    const month = this.currentDate.getMonth();
    const firstDayOfMonth = new Date(year, month, 1);
    const lastDayOfMonth = new Date(year, month + 1, 0);
    const today = new Date();
    const firstDayOfGrid = new Date(firstDayOfMonth);
    const startDayOfWeek = firstDayOfGrid.getDay(); 
    const daysToSubtract = (startDayOfWeek + 6) % 7; 
    firstDayOfGrid.setDate(firstDayOfGrid.getDate() - daysToSubtract);
    const lastDayOfGrid = new Date(lastDayOfMonth);
    const endDayOfWeek = lastDayOfGrid.getDay();
    const daysToAdd = (7 - endDayOfWeek) % 7;
    lastDayOfGrid.setDate(lastDayOfGrid.getDate() + daysToAdd);

    this.daysInMonth = [];
    let current = new Date(firstDayOfGrid);
    while (current <= lastDayOfGrid) {
      const date = new Date(current);
      const isCurrentMonth = date.getMonth() === month;
      const isToday = date.toDateString() === today.toDateString();
      const dayOfWeek = date.getDay();
      const isWeekend = dayOfWeek === 0 || dayOfWeek === 6;

      this.daysInMonth.push({
        date,
        hasEvents: false,
        events: [],
        isToday,
        isCurrentMonth,
        isWeekend
      });

      current.setDate(current.getDate() + 1);
    }
    this.assignEventsToCalendar();
  }

  private assignEventsToCalendar(): void {
    for (const day of this.daysInMonth) {
      const dayDate = day.date;
      day.events = this.allEvents.filter((event) => {
        const eventStart = new Date(event.startDateTime);
        const eventEnd = new Date(event.endDateTime);
        return (
          eventStart.toDateString() === dayDate.toDateString() ||
          eventEnd.toDateString() === dayDate.toDateString() ||
          (eventStart < dayDate && eventEnd > dayDate)
        );
      });
      day.hasEvents = day.events.length > 0;
    }

    if (this.selectedDay) {
      const matchingDay = this.daysInMonth.find(d =>
        d.date.toDateString() === this.selectedDay?.date.toDateString()
      );
      this.selectedDayEvents = matchingDay ? matchingDay.events : [];
    }

    this.cdr.markForCheck();
  }

  generateHourSlots(): void {
    this.hourSlots = [];
    for (let i = 0; i < 24; i++) {
      this.hourSlots.push(`${String(i).padStart(2, '0')}:00`);
    }
  }

  nextMonth(): void {
    this.currentDate = new Date(
      this.currentDate.getFullYear(),
      this.currentDate.getMonth() + 1,
      1
    );
    this.clearSelection();
    this.generateCalendar();
  }

  previousMonth(): void {
    this.currentDate = new Date(
      this.currentDate.getFullYear(),
      this.currentDate.getMonth() - 1,
      1
    );
    this.clearSelection();
    this.generateCalendar();
  }

  selectDay(day: DayData): void {
    this.selectedDay = day;
    this.selectedDayEvents = day.events;
    this.isHourViewActive = true;
  }

  backToCalendarView(): void {
    this.clearSelection();
  }

  private clearSelection(): void {
    this.isHourViewActive = false;
    this.selectedDay = null;
    this.selectedDayEvents = [];
  }

  addEvent(): void {
    if (!this.newEventTitle) {
      alert('Please enter an event title.');
      return;
    }

    this.isAdmin$.subscribe((isAdmin) => {
      if (!isAdmin) {
        alert('You must be an admin to add events.');
        return;
      }

      const startDate = new Date(this.newEventStartDate);
      const [startHour, startMinute] = this.newEventStartTime.split(':');
      startDate.setHours(parseInt(startHour, 10), parseInt(startMinute, 10), 0, 0);

      const endDate = new Date(this.newEventEndDate);
      const [endHour, endMinute] = this.newEventEndTime.split(':');
      endDate.setHours(parseInt(endHour, 10), parseInt(endMinute, 10), 0, 0);

      if (endDate <= startDate) {
        alert('End date/time must be after start date/time.');
        return;
      }

      const newEvent: Event = {
        title: this.newEventTitle,
        startDateTime: startDate.toISOString(),
        endDateTime: endDate.toISOString(),
        createdAt: new Date().toISOString()
      };

      this.afs
        .collection<Event>('events')
        .add(newEvent)
        .then(() => {
          alert('Event added successfully!');
          this.resetForm();
        })
        .catch((error) => {
          console.error('Error adding event: ', error);
          alert('Error adding event.');
        });
    });
  }

  private resetForm(): void {
    this.newEventTitle = '';
    this.newEventStartDate = this.datePipe.transform(this.currentDate, 'yyyy-MM-dd') || '';
    this.newEventStartTime = '09:00';
    this.newEventEndDate = this.datePipe.transform(this.currentDate, 'yyyy-MM-dd') || '';
    this.newEventEndTime = '10:00';
  }

  getHourFromDateTime(dateTimeString: string): string {
    const date = new Date(dateTimeString);
    return String(date.getHours()).padStart(2, '0');
  }
}
