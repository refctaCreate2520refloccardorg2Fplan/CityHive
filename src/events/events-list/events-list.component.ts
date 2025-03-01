import { Component, OnInit, OnDestroy } from "@angular/core";
import { Router } from "@angular/router";
import { EventService } from "../../shared/services/event.service";
import { AngularFirestore } from "@angular/fire/compat/firestore";
import { AuthService } from "../../shared/services/auth.service";
import { Subscription } from "rxjs";
import { InterestEmailService, EventData } from "../../shared/services/interest-email.service";

// Rozšírený model udalosti s voliteľnými súradnicami
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
  lat?: number;
  lng?: number;
}

@Component({
  selector: "app-events-list",
  templateUrl: "./events-list.component.html",
  styleUrls: ["./events-list.component.scss"]
})
export class EventsListComponent implements OnInit, OnDestroy {
  selectedEvent: any = null;
  events: EventDTO[] = [];
  filteredEvents: EventDTO[] = [];
  searchQuery = "";
  interestRatings: { [id: string]: number } = {};

  eventsWithLikes: { id: string; totalLikes: number }[] = [];
  likesSubscriptions: { [eventId: string]: Subscription } = {};
  userLikes: { [eventId: string]: boolean } = {};
  userLikesSubscriptions: Subscription[] = [];

  categories = [
    "Výstava",
    "Koncerty",
    "Festivaly",
    "Kino",
    "Besedy a prednášky",
    "Mestské slávnosti",
    "Tematické festivaly"
  ];
  places = [
    'Csemadok',
    'Matica',
    'vlastivedne muzeum',
    'galantske osvietene stredisko',
    'renesancny kastiel',
    'MsKS',
    'galantsky neogoticky kastiel',
    'galantska kniznica',
    'kino'
  ];
  selectedCategory: string | null = null;
  selectedPlace: string | null = null;

  // Sledovanie, ktorá udalosť je hovernutá (pre zobrazenie mapy)
  hoveredEventId: string | null = null;



  constructor(
    private eventService: EventService,
    private router: Router,
    private firestore: AngularFirestore,
    public authService: AuthService,
    private interestEmailService: InterestEmailService
  ) { }

  ngOnInit(): void {
    this.eventService.getAllEvents().subscribe(data => {
      // Filtrácia iba schválených udalostí
      this.events = data.filter(e => e.isApproved);
      this.events.forEach(e => {
        if (e.id) {
          this.interestRatings[e.id] = e.interestRating !== undefined ? e.interestRating : 50;
        }
      });
      this.filterEvents();
      this.setupLikesSubscriptions();
      this.trackUserLikes();
    });
  }

  ngOnDestroy(): void {
    Object.values(this.likesSubscriptions).forEach(sub => sub.unsubscribe());
    this.userLikesSubscriptions.forEach(sub => sub.unsubscribe());
  }

  filterEvents(): void {
    const query = this.searchQuery.toLowerCase();
    this.filteredEvents = this.events.filter(event => {
      const matchesSearch =
        !query ||
        event.title.toLowerCase().includes(query) ||
        (event.description && event.description.toLowerCase().includes(query));

      const matchesCategory =
        !this.selectedCategory || event.category === this.selectedCategory;

      const matchesPlace =
        !this.selectedPlace || event.place === this.selectedPlace;

      return matchesSearch && matchesCategory && matchesPlace;
    });
  }

  toggleCategoryFilter(category: string): void {
    this.selectedCategory = this.selectedCategory === category ? null : category;
    this.filterEvents();
  }

  togglePlaceFilter(place: string): void {
    this.selectedPlace = this.selectedPlace === place ? null : place;
    this.filterEvents();
  }

  goToEvent(eventId: string): void {
    // Find the event in your data
    const event = this.filteredEvents.find(e => e.id === eventId);
    if (event) {
      this.selectedEvent = event;
      // Optional:  Navigate to a different route/page for the event details
      // this.router.navigate(['/event', eventId]);
    }
  }

  getGoogleCalendarUrl(e: EventDTO): string {
    const formatDate = (date: Date): string => {
      return date.toISOString().replace(/[-:]/g, "").split(".")[0] + "Z";
    };

    const start = new Date(e.startDateTime);
    const end = new Date(e.endDateTime);
    const startStr = formatDate(start);
    const endStr = formatDate(end);
    const details = encodeURIComponent(e.description || "");
    const location = encodeURIComponent(e.place || "");
    const text = encodeURIComponent(e.title);
    return `https://calendar.google.com/calendar/render?action=TEMPLATE&text=${text}&dates=${startStr}/${endStr}&details=${details}&location=${location}`;
  }

  onInterestChange(event: Event, eventId: string): void {
    const input = event.target as HTMLInputElement;
    const value = +input.value;
    this.interestRatings[eventId] = value;
    this.eventService.updateInterest(eventId, value)
      .then(() => console.log("Hodnota záujmu bola úspešne uložená"))
      .catch(error => console.error("Chyba pri ukladaní hodnoty záujmu:", error));
  }

  setupLikesSubscriptions() {
    this.firestore.collection<EventDTO>("events")
      .snapshotChanges().subscribe(actions => {
        actions.forEach(eventAction => {
          const eventId = eventAction.payload.doc.id;
          if (!this.likesSubscriptions[eventId]) {
            this.likesSubscriptions[eventId] = this.firestore.collection("events")
              .doc(eventId).collection("likes")
              .snapshotChanges().subscribe(likeActions => {
                const count = likeActions.length;
                const index = this.eventsWithLikes.findIndex(item => item.id === eventId);
                if (index > -1) {
                  this.eventsWithLikes[index].totalLikes = count;
                } else {
                  this.eventsWithLikes.push({ id: eventId, totalLikes: count });
                }
              });
          }
        });
      });
  }

  trackUserLikes() {
    const sub = this.firestore.collection<EventDTO>("events")
      .snapshotChanges().subscribe(actions => {
        actions.forEach(eventAction => {
          const eventId = eventAction.payload.doc.id;
          const currentUid = this.authService.userData?.uid;
          if (currentUid) {
            const userLikeSub = this.firestore.collection("events")
              .doc(eventId).collection("likes")
              .doc(currentUid)
              .snapshotChanges().subscribe(likeSnapshot => {
                this.userLikes[eventId] = likeSnapshot.payload.exists;
              });
            this.userLikesSubscriptions.push(userLikeSub);
          }
        });
      });
    this.userLikesSubscriptions.push(sub);
  }

  async likeEvent(eventId: string) {
    if (!this.authService.isLoggedIn) {
      console.error("User is not logged in.");
      return;
    }
    try {
      const uid = await this.authService.getCurrentUserId();
      const email = this.authService.userData?.email;
      if (uid && email) {
        const likeRef = this.firestore.collection("events")
          .doc(eventId).collection("likes")
          .doc(uid);
        const likeDoc = await likeRef.get().toPromise();
        if (likeDoc && likeDoc.exists) {
          await likeRef.delete();
          console.log("Like removed successfully!");
        } else {
          await likeRef.set({ eventId, uid, email, timestamp: new Date() });
          console.log("Like recorded successfully!");
          const eventData: EventData = {
            title: this.events.find(e => e.id === eventId)?.title || "",
            description: this.events.find(e => e.id === eventId)?.description,
            startDateTime: this.events.find(e => e.id === eventId)?.startDateTime || "",
            endDateTime: this.events.find(e => e.id === eventId)?.endDateTime || "",
            location: this.events.find(e => e.id === eventId)?.place || ""
          };
          this.interestEmailService.sendInterestEmail(email, eventData)
            .then(response => console.log("Email odoslaný úspešne", response))
            .catch(error => console.error("Chyba pri odosielaní emailu:", error));
        }
      } else {
        console.error("User UID alebo email nie sú k dispozícii.");
      }
    } catch (error) {
      console.error("Error liking event:", error);
    }
  }

  getLikesCount(eventId: string): number {
    const eventLikes = this.eventsWithLikes.find(item => item.id === eventId);
    return eventLikes ? eventLikes.totalLikes : 0;
  }

  // Metódy na zobrazenie mapy pri hoverovaní
  onMouseEnter(event: EventDTO) {
    this.hoveredEventId = event.id || null;
  }

  onMouseLeave() {
    this.hoveredEventId = null;
  }
}
