import { Component, OnInit, OnDestroy } from '@angular/core';
import { AuthService, UserRole } from '../shared/services/auth.service';
import { EventService } from '../shared/services/event.service';
import { OrganizerRequestService, OrganizerRequest } from '../shared/services/organizer-request.service';
import { AngularFirestore } from '@angular/fire/compat/firestore';
import { Subscription } from 'rxjs';
import { map } from 'rxjs/operators';

export interface EventDTO {
  id?: string;
  title: string;
  description?: string;
  startDateTime: string;
  endDateTime: string;
  price?: number;
  isApproved?: boolean;
  archived?: boolean;
  createdAt?: string;
  organizerId?: string;
  photoURL?: string;
  photos?: string[];
  interestRating?: number;
  category: string;
  place: string;
}

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

interface ChatMessage {
  id?: string;
  senderId: string;
  senderName: string;
  message: string;
  timestamp: any;
}

interface Chat {
  id: string;
  conversationName?: string;  // Meno používateľa (organizátora)
  organizerName?: string;      // Alternatívne meno organizátora
  participants: string[];
  lastMessage?: string;
  updatedAt?: any;
}

@Component({
  selector: 'app-admin',
  templateUrl: './admin.component.html',
  styleUrls: ['./admin.component.scss']
})
export class AdminComponent implements OnInit, OnDestroy {
  public userRole = UserRole;

  users: AdminUser[] = [];
  events: EventDTO[] = [];
  organizerRequests: OrganizerRequest[] = [];
  chats: Chat[] = [];

  // Údaje pre vytvorenie eventu
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
    organizerId: '',
    category: '',
    place: '',
  };

  currentDate = new Date();
  daysInCalendar: CalendarDay[] = [];

  // Chat – vybraný chat, zoznam správ a premenná pre novú správu
  selectedChat: Chat | null = null;
  chatMessages: ChatMessage[] = [];
  newAdminMessage: string = '';
  private chatSub?: Subscription;

  constructor(
    public authService: AuthService, // authService je teraz public
    private eventService: EventService,
    private requestService: OrganizerRequestService,
    private afs: AngularFirestore
  ) { }

  ngOnInit(): void {
    this.loadUsers();
    this.loadEvents();
    this.loadRequests();
    this.loadChats();
  }

  ngOnDestroy(): void {
    if (this.chatSub) {
      this.chatSub.unsubscribe();
    }
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

  loadChats(): void {
    // Predpokladáme, že administrátor je prítomný v poli "participants".
    const adminUid = this.authService.userData ? this.authService.userData.uid : 'ADMIN_UID';
    this.afs.collection<Chat>('chats', ref => ref.where('participants', 'array-contains', adminUid))
      .snapshotChanges()
      .pipe(
        map(actions => actions.map(a => {
          const data = a.payload.doc.data() as Chat;
          const id = a.payload.doc.id;
          // Odstránime prípadnú existenciu 'id' v dátach a vytvoríme conversationName
          const { id: _ignore, ...rest } = data;
          const conversationName = data.conversationName || data.organizerName || "Unknown";
          return { ...rest, id, conversationName };
        }))
      )
      .subscribe(chats => {
        this.chats = chats;
      });
  }

  approveOrganizerRequest(req: OrganizerRequest): void {
    this.requestService.approveRequest(req.id!, true).then(() => {
      this.authService.assignRoleToUser(req.userId, UserRole.Organizer);
      this.requestService.deleteRequest(req.id!);
    });
  }

  setRole(user: AdminUser, role: UserRole): void {
    this.authService.assignRoleToUser(user.uid, role).then(() => {
      user.role = role;
    });
  }

  toggleApproval(evt: EventDTO): void {
    const newVal = !evt.isApproved;
    this.eventService.approveEvent(evt.id!, newVal);
    evt.isApproved = newVal;
  }

  toggleArchive(evt: EventDTO): void {
    const newVal = !evt.archived;
    this.eventService.archiveEvent(evt.id!, newVal);
    evt.archived = newVal;
  }

  createEvent(): void {
    if (!this.newEvent.title) {
      alert('Title is required');
      return;
    }
    if (!this.newEvent.startDateTime || !this.newEvent.endDateTime) {
      alert('Start / End is required');
      return;
    }
    // Administrátor vytvára event, takže ho automaticky schvaľuje.
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
        organizerId: '',
        category: '',
        place: '',
      };
    });
  }

  // Calendar methods
  prevMonth(): void {
    const y = this.currentDate.getFullYear();
    const m = this.currentDate.getMonth();
    this.currentDate = new Date(y, m - 1, 1);
    this.generateCalendar();
  }

  nextMonth(): void {
    const y = this.currentDate.getFullYear();
    const m = this.currentDate.getMonth();
    this.currentDate = new Date(y, m + 1, 1);
    this.generateCalendar();
  }

  generateCalendar(): void {
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

  toDateOnly(d: Date): Date {
    return new Date(d.getFullYear(), d.getMonth(), d.getDate());
  }

  // Chat methods pre administrátora
  openChat(chat: Chat): void {
    this.selectedChat = chat;
    if (this.chatSub) {
      this.chatSub.unsubscribe();
    }
    this.chatSub = this.afs.collection(`chats/${chat.id}/messages`, ref => ref.orderBy('timestamp'))
      .snapshotChanges()
      .pipe(
        map(actions => actions.map(a => {
          const data = a.payload.doc.data() as ChatMessage;
          const id = a.payload.doc.id;
          return { id, ...data };
        }))
      )
      .subscribe(msgs => {
        this.chatMessages = msgs;
      });
  }

  sendAdminMessage(): void {
    if (!this.newAdminMessage.trim() || !this.selectedChat) {
      return;
    }
    const adminUid = this.authService.userData ? this.authService.userData.uid : 'ADMIN_UID';
    const adminName = this.authService.userData ? this.authService.userData.displayName : 'Admin';
    const message: ChatMessage = {
      senderId: adminUid,
      senderName: adminName,
      message: this.newAdminMessage,
      timestamp: new Date()
    };
    this.afs.collection(`chats/${this.selectedChat.id}/messages`).add(message)
      .then(() => {
        this.newAdminMessage = '';
      })
      .catch(error => console.error('Error sending admin message:', error));
  }

  closeChat(): void {
    this.selectedChat = null;
    this.chatMessages = [];
    if (this.chatSub) {
      this.chatSub.unsubscribe();
    }
  }
}
