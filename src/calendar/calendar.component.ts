// src/app/calendar/calendar.component.ts
import { Component, OnInit } from '@angular/core';

interface DayData {
  date: Date;
  isToday: boolean;
  isCurrentMonth: boolean;
  isWeekend: boolean;
  hasEvents: boolean;
}

@Component({
  selector: 'app-calendar',
  templateUrl: './calendar.component.html',
  styleUrls: ['./calendar.component.css']
})
export class CalendarComponent implements OnInit {
  currentDate = new Date();
  daysInMonth: DayData[] = [];

  // For the form
  newEventTitle: string = '';
  newEventStartDate: string = '';
  newEventStartTime: string = '';
  newEventEndDate: string = '';
  newEventEndTime: string = '';

  // Example selection
  selectedDay: DayData | null = null;
  selectedDayEvents: any[] = [];

  ngOnInit(): void {
    // Default date for the add-event form
    this.newEventStartDate = this.formatDate(this.currentDate);
    this.newEventEndDate = this.formatDate(this.currentDate);
    this.generateCalendar();
  }

  generateCalendar(): void {
    const year = this.currentDate.getFullYear();
    const month = this.currentDate.getMonth();
    const totalDays = new Date(year, month + 1, 0).getDate();

    this.daysInMonth = [];
    const todayStr = new Date().toDateString();

    for (let day = 1; day <= totalDays; day++) {
      const dateObj = new Date(year, month, day);
      this.daysInMonth.push({
        date: dateObj,
        isToday: dateObj.toDateString() === todayStr,
        isCurrentMonth: true,
        isWeekend: [0, 6].includes(dateObj.getDay()),
        hasEvents: false
      });
    }
  }

  selectDay(day: DayData): void {
    this.selectedDay = day;
    // Stub: no real events
    this.selectedDayEvents = [];
  }

  addEvent(): void {
    if (!this.newEventTitle) {
      alert('Please enter an event title.');
      return;
    }
    alert(`Event Added:\nTitle: ${this.newEventTitle}`);
    this.newEventTitle = '';
  }

  formatDate(date: Date): string {
    // Return 'YYYY-MM-DD'
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  }
}
