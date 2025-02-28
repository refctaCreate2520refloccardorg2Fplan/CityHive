import { Component, OnInit, OnDestroy } from '@angular/core'; // Pridaj OnDestroy
import { Router } from '@angular/router';
import { EventService, EventDTO } from '../../shared/services/event.service';
import { AngularFirestore } from '@angular/fire/compat/firestore'; // Import AngularFirestore
import { AuthService } from '../../shared/services/auth.service'; // Import AuthService
import { Subscription } from 'rxjs'; // Import Subscription

@Component({
  selector: 'app-events-list',
  templateUrl: './events-list.component.html',
  styleUrls: ['./events-list.component.scss']
})
export class EventsListComponent implements OnInit, OnDestroy { // Implementuj OnDestroy
  events: EventDTO[] = [];
  filteredEvents: EventDTO[] = [];
  searchQuery = '';
  interestRatings: { [id: string]: number } = {};

  // Nové vlastnosti pre lajky
  eventsWithLikes: { id: string; totalLikes: number }[] = [];
  likesSubscriptions: { [eventId: string]: Subscription } = {}; // Subscription pre kazdy event
  userLikes: { [eventId: string]: boolean } = {}; // Stav lajku pre uzivatela
  userLikesSubscriptions: Subscription[] = []; // Subscriptions pre stav lajku uzivatela

  constructor(
    private eventService: EventService,
    private router: Router,
    private firestore: AngularFirestore, // Inject AngularFirestore
    public authService: AuthService // Inject AuthService
  ) { }

  ngOnInit(): void {
    this.eventService.getAllEvents().subscribe(data => {
      this.events = data;
      this.events.forEach(e => {
        if (e.id) {
          this.interestRatings[e.id] = e.interestRating !== undefined ? e.interestRating : 50;
        }
      });
      this.filterEvents();
      this.setupLikesSubscriptions(); // Nastavíme subskripcie pre lajky po načítaní eventov
      this.trackUserLikes(); // Sledujeme, ci uzivatel lajkol eventy
    });
  }

  ngOnDestroy(): void { // Implementuj ngOnDestroy na odsubskribovanie
    // Odsubskribuj všetky subskripcie pre lajky, aby nedochádzalo k memory leakom
    Object.values(this.likesSubscriptions).forEach(sub => sub.unsubscribe());
    this.userLikesSubscriptions.forEach(sub => sub.unsubscribe());
  }

  filterEvents(): void {
    if (!this.searchQuery) {
      this.filteredEvents = [...this.events];
    } else {
      const query = this.searchQuery.toLowerCase();
      this.filteredEvents = this.events.filter(evt => {
        const titleLower = evt.title.toLowerCase();
        const descLower = evt.description ? evt.description.toLowerCase() : '';
        return titleLower.includes(query) || descLower.includes(query);
      });
    }
  }

  goToEvent(eventId: string): void {
    this.router.navigate(['/events', eventId]);
  }

  onInterestChange(event: Event, eventId: string): void {
    const input = event.target as HTMLInputElement;
    const value = +input.value;
    this.interestRatings[eventId] = value;
    this.eventService.updateInterest(eventId, value)
      .then(() => console.log('Hodnota záujmu bola úspešne uložená'))
      .catch(error => console.error('Chyba pri ukladaní hodnoty záujmu:', error));
  }

  getGoogleCalendarUrl(e: EventDTO): string {
    const start = new Date(e.startDateTime);
    const end = new Date(e.endDateTime);
    const formatDate = (date: Date): string => {
      return date.toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z';
    };
    const startStr = formatDate(start);
    const endStr = formatDate(end);
    const details = encodeURIComponent(e.description || '');
    const location = encodeURIComponent((e as any).location || '');
    const text = encodeURIComponent(e.title);
    return `https://calendar.google.com/calendar/render?action=TEMPLATE&text=${text}&dates=${startStr}/${endStr}&details=${details}&location=${location}`;
  }

  // ---------------------- Implementácia lajkov (prispôsobený kód) ----------------------

  setupLikesSubscriptions() {
    this.firestore.collection<EventDTO>('events') // Zmenené na 'events'
      .snapshotChanges()
      .subscribe(actions => {
        actions.forEach(eventAction => {
          const eventId = eventAction.payload.doc.id;
          if (!this.likesSubscriptions[eventId]) {
            this.likesSubscriptions[eventId] = this.firestore
              .collection('events') // Zmenené na 'events'
              .doc(eventId)
              .collection('likes') // Zmenené na 'likes'
              .snapshotChanges()
              .subscribe(likeActions => {
                const count = likeActions.length;
                const index = this.eventsWithLikes.findIndex(item => item.id === eventId);
                if (index > -1) {
                  this.eventsWithLikes[index].totalLikes = count; // Zmenené na totalLikes
                } else {
                  this.eventsWithLikes.push({ id: eventId, totalLikes: count }); // Zmenené na totalLikes
                }
              });
          }
        });
      });
  }

  trackUserLikes() {
    const sub = this.firestore.collection<EventDTO>('events') // Zmenené na 'events'
      .snapshotChanges()
      .subscribe(actions => {
        actions.forEach(eventAction => {
          const eventId = eventAction.payload.doc.id;
          const currentUid = this.authService.userData?.uid;
          if (currentUid) {
            const userLikeSub = this.firestore.collection('events') // Zmenené na 'events'
              .doc(eventId)
              .collection('likes') // Zmenené na 'likes'
              .doc(currentUid)
              .snapshotChanges()
              .subscribe(likeSnapshot => {
                this.userLikes[eventId] = likeSnapshot.payload.exists; // userLikes namiesto userVoted
              });
            this.userLikesSubscriptions.push(userLikeSub);
          }
        });
      });
    this.userLikesSubscriptions.push(sub);
  }

  async likeEvent(eventId: string) { // Zmenené na likeEvent
    if (this.authService.isLoggedIn) {
      try {
        const uid = await this.authService.getCurrentUserId();
        if (uid) {
          const likeRef = this.firestore
            .collection('events') // Zmenené na 'events'
            .doc(eventId)
            .collection('likes') // Zmenené na 'likes'
            .doc(uid);

          const likeDoc = await likeRef.get().toPromise();
          if (likeDoc && likeDoc.exists) {
            await likeRef.delete();
            console.log("Like removed successfully!"); // Zmenené na Like
          } else {
            await likeRef.set({ eventId, uid, timestamp: new Date() }); // eventId namiesto gameId
            console.log("Like recorded successfully!"); // Zmenené na Like
          }
        } else {
          console.error("User UID not found.");
        }
      } catch (error) {
        console.error("Error liking event:", error); // Zmenené na liking event
      }
    } else {
      console.error("User is not logged in.");
    }
  }

  getLikesCount(eventId: string): number {
    const eventLikes = this.eventsWithLikes.find(item => item.id === eventId);
    return eventLikes ? eventLikes.totalLikes : 0;
  }
}
