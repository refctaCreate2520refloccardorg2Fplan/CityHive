import { Component, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { FormControl } from '@angular/forms';
import { AngularFirestore } from '@angular/fire/compat/firestore';
import { switchMap, map, catchError } from 'rxjs/operators';
import { combineLatest, Observable, of } from 'rxjs';
import { EventService, EventDTO } from '../../shared/services/event.service';
import { AuthService } from '../../shared/services/auth.service';

interface Comment {
  id: string;
  text: string;
  userId: string;
  userName: string;
  userPhotoUrl: string;
  timestamp: Date;
  replies?: Reply[];
}

interface Reply {
  text: string;
  userId: string;
  userName: string;
  userPhotoUrl: string;
  timestamp: Date;
}

@Component({
  selector: 'app-event-detail',
  templateUrl: './event-detail.component.html',
  styleUrls: ['./event-detail.component.scss']
})
export class EventDetailComponent implements OnInit {
  event?: EventDTO;
  comments: Comment[] = [];
  newCommentText = new FormControl('');
  replyText = new FormControl('');

  // Authentication properties: will be updated from AuthService's auth state
  userId: string | null = null;
  userName: string | null = null;
  userPhotoURL: string | null = null;

  constructor(
    private route: ActivatedRoute,
    private eventService: EventService,
    private firestore: AngularFirestore,
    private authService: AuthService
  ) { }

  ngOnInit(): void {
    // Subscribe to authentication state so that the latest user info is used.
    this.authService.afAuth.authState.subscribe(user => {
      if (user) {
        this.userId = user.uid;
        this.userName = user.displayName;
        this.userPhotoURL = user.photoURL;
      } else {
        this.userId = null;
        this.userName = null;
        this.userPhotoURL = null;
      }
    });
    this.loadEventAndComments();
  }

  private loadEventAndComments(): void {
    this.route.paramMap.pipe(
      switchMap(params => {
        const eventId = params.get('id');
        return this.eventService.getAllEvents();
      })
    ).subscribe({
      next: (allEvents) => {
        const eventId = this.route.snapshot.paramMap.get('id');
        this.event = allEvents.find(e => e.id === eventId);

        if (eventId) {
          this.fetchComments(eventId).subscribe(comments => {
            this.comments = comments;
          });
        }
      },
      error: (err) => console.error('Error loading event:', err)
    });
  }

  fetchComments(eventId: string): Observable<Comment[]> {
    return this.firestore.collection('events').doc(eventId)
      .collection('comments', ref => ref.orderBy('timestamp', 'desc'))
      .snapshotChanges()
      .pipe(
        switchMap(commentSnapshots => {
          if (commentSnapshots.length === 0) return of([]);

          return combineLatest(
            commentSnapshots.map(snapshot => {
              const commentId = snapshot.payload.doc.id;
              const commentData = snapshot.payload.doc.data() as Comment;

              return this.firestore.collection('events').doc(eventId)
                .collection('comments').doc(commentId)
                .collection('replies', ref => ref.orderBy('timestamp'))
                .snapshotChanges()
                .pipe(
                  map(replySnapshots => ({
                    ...this.processComment(commentData, commentId),
                    replies: this.processReplies(replySnapshots)
                  }))
                );
            })
          );
        }),
        catchError(error => {
          console.error('Error fetching comments:', error);
          return of([]);
        })
      );
  }

  private processComment(commentData: any, commentId: string): Comment {
    return {
      ...commentData,
      id: commentId,
      timestamp: this.convertFirestoreDate(commentData.timestamp)
    };
  }

  private processReplies(replySnapshots: any[]): Reply[] {
    return replySnapshots.map(replySnapshot => {
      const replyData = replySnapshot.payload.doc.data();
      return {
        ...replyData,
        timestamp: this.convertFirestoreDate(replyData.timestamp)
      };
    });
  }

  private convertFirestoreDate(timestamp: any): Date {
    return timestamp?.toDate ? timestamp.toDate() : new Date(timestamp);
  }

  addComment(): void {
    const eventId = this.route.snapshot.paramMap.get('id');
    if (!eventId || !this.userId) return;

    const commentText = this.newCommentText.value?.trim();
    if (!commentText) return;

    const newComment = {
      text: commentText,
      userId: this.userId,
      userName: this.userName,
      userPhotoUrl: this.userPhotoURL,
      timestamp: new Date()
    };

    this.firestore.collection('events').doc(eventId)
      .collection('comments').add(newComment)
      .then(() => this.newCommentText.reset())
      .catch(err => console.error('Error adding comment:', err));
  }

  addReply(commentId: string): void {
    const eventId = this.route.snapshot.paramMap.get('id');
    if (!eventId || !this.userId) return;

    const replyText = this.replyText.value?.trim();
    if (!replyText) return;

    const newReply = {
      text: replyText,
      userId: this.userId,
      userName: this.userName,
      userPhotoUrl: this.userPhotoURL,
      timestamp: new Date()
    };

    this.firestore.collection('events').doc(eventId)
      .collection('comments').doc(commentId)
      .collection('replies').add(newReply)
      .then(() => this.replyText.reset())
      .catch(err => console.error('Error adding reply:', err));
  }
}
