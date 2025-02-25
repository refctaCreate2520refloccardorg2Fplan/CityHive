// src/app/admin/admin.component.ts
import { Component, OnInit } from '@angular/core';
import { AuthService, UserRole } from '../shared/services/auth.service';
import { EventService, EventDTO } from '../shared/services/event.service';
import { OrganizerRequestService, OrganizerRequest } from '../shared/services/organizer-request.service';

interface AdminUser {
  uid: string;
  email: string;
  displayName: string;
  role: UserRole;
}

interface CalendarDay {
  date: Date;
  events: EventDTO[];
  isToday: boolean;
  isCurrentMonth: boolean;
}

@Component({
  selector: 'app-admin',
  templateUrl: './admin.component.html',
  styleUrls: ['./admin.component.scss']
})
export class AdminComponent implements OnInit {
  public userRole = UserRole;

  users: AdminUser[] = [];
  events: EventDTO[] = [];
  organizerRequests: OrganizerRequest[] = [];

  // Jednojazyčný event
  newEvent: EventDTO = {
    id: '',
    title: '',
    description: '',
    startDateTime: '',
    endDateTime: '',
    price: 0,
    isApproved: false,
    archived: false,
    createdAt: '',
    organizerId: ''
  };

  currentDate = new Date();
  daysInCalendar: CalendarDay[] = [];

  constructor(
    private authService: AuthService,
    private eventService: EventService,
    private requestService: OrganizerRequestService
  ) { }

  ngOnInit(): void {
    this.loadUsers();
    this.loadEvents();
    this.loadRequests();
  }

  loadUsers(): void {
    this.eventService.getAllUsers().subscribe(u => this.users = u);
  }

  loadEvents(): void {
    this.eventService.getAllEvents().subscribe(evs => {
      this.events = evs;
      this.generateCalendar();
    });
  }

  loadRequests(): void {
    this.requestService.getAllRequests().subscribe(reqs => {
      this.organizerRequests = reqs.filter(r => !r.approved);
    });
  }

  approveOrganizerRequest(req: OrganizerRequest) {
    this.requestService.approveRequest(req.id!, true).then(() => {
      this.authService.assignRoleToUser(req.userId, UserRole.Organizer);
      this.requestService.deleteRequest(req.id!);
    });
  }

  setRole(user: AdminUser, role: UserRole) {
    this.authService.assignRoleToUser(user.uid, role).then(() => {
      user.role = role;
    });
  }

  toggleApproval(evt: EventDTO) {
    const newVal = !evt.isApproved;
    this.eventService.approveEvent(evt.id!, newVal);
    evt.isApproved = newVal;
  }

  toggleArchive(evt: EventDTO) {
    const newVal = !evt.archived;
    this.eventService.archiveEvent(evt.id!, newVal);
    evt.archived = newVal;
  }

  createEvent() {
    if (!this.newEvent.title) {
      alert('Title is required');
      return;
    }
    if (!this.newEvent.startDateTime || !this.newEvent.endDateTime) {
      alert('Start / End is required');
      return;
    }
    // Admin => isApproved = true
    this.newEvent.isApproved = true;
    this.eventService.createEvent(this.newEvent).then(() => {
      alert('Created event');
      this.newEvent = {
        id: '',
        title: '',
        description: '',
        startDateTime: '',
        endDateTime: '',
        price: 0,
        isApproved: false,
        archived: false,
        createdAt: '',
        organizerId: ''
      };
    });
  }

  // Calendar stuff
  prevMonth() {
    const y = this.currentDate.getFullYear();
    const m = this.currentDate.getMonth();
    this.currentDate = new Date(y, m - 1, 1);
    this.generateCalendar();
  }

  nextMonth() {
    const y = this.currentDate.getFullYear();
    const m = this.currentDate.getMonth();
    this.currentDate = new Date(y, m + 1, 1);
    this.generateCalendar();
  }

  generateCalendar() {
    this.daysInCalendar = [];
    const y = this.currentDate.getFullYear();
    const m = this.currentDate.getMonth();

    const firstDayOfMonth = new Date(y, m, 1);
    const lastDayOfMonth = new Date(y, m + 1, 0);

    const startIndex = (firstDayOfMonth.getDay() + 6) % 7;
    const totalDays = lastDayOfMonth.getDate();
    for (let i = 0; i < startIndex; i++) {
      this.daysInCalendar.push({
        date: new Date(y, m, i - startIndex + 1),
        events: [],
        isToday: false,
        isCurrentMonth: false
      });
    }

    const todayStr = new Date().toDateString();
    for (let day = 1; day <= totalDays; day++) {
      const dateObj = new Date(y, m, day);
      const dateStr = dateObj.toDateString();
      const dayEvents = this.events.filter(evt => {
        const s = new Date(evt.startDateTime);
        const e = new Date(evt.endDateTime);
        return dateObj >= this.toDateOnly(s) && dateObj <= this.toDateOnly(e);
      });
      this.daysInCalendar.push({
        date: dateObj,
        events: dayEvents,
        isToday: dateStr === todayStr,
        isCurrentMonth: true
      });
    }
  }

  toDateOnly(d: Date) {
    return new Date(d.getFullYear(), d.getMonth(), d.getDate());
  }
}
