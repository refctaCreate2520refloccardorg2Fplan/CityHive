import { Component, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { EventService, EventDTO } from '../../shared/services/event.service';
import { switchMap, map, catchError } from 'rxjs/operators';
import { Observable, combineLatest, of } from 'rxjs';
import { AngularFirestore } from '@angular/fire/compat/firestore';
import { FormControl } from '@angular/forms';

interface Comment {
  id: string;
  text: string;
  userId: string;
  userName: string;
  userPhotoUrl: string;
  rating: number;
  timestamp: Date;
  replies?: Reply[];
}

interface Reply {
  text: string;
  userId: string;
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

  // These should come from your auth service
  userId: string | null = 'user123'; // Replace with actual user ID
  userName: string | null = 'John Doe'; // Replace with actual user name
  userPhotoURL: string | null = null; // Replace with actual photo URL

  constructor(
    private route: ActivatedRoute,
    private eventService: EventService,
    private firestore: AngularFirestore
  ) { }

  ngOnInit(): void {
    this.route.paramMap.pipe(
      switchMap(params => {
        const eventId = params.get('id');
        return this.eventService.getAllEvents();
      })
    ).subscribe(all => {
      const eventId = this.route.snapshot.paramMap.get('id');
      this.event = all.find(e => e.id === eventId);

      if (eventId) {
        this.fetchComments(eventId).subscribe(comments => {
          this.comments = comments;
        });
      }
    });
  }

  fetchComments(eventId: string): Observable<Comment[]> {
    return this.firestore.collection('events').doc(eventId).collection('comments', ref => ref.orderBy('timestamp', 'desc'))
      .snapshotChanges()
      .pipe(
        switchMap(commentSnapshots => {
          const commentDocs = commentSnapshots.map(snapshot => {
            const commentData = snapshot.payload.doc.data() as Comment;
            const commentId = snapshot.payload.doc.id;

            return this.firestore.collection('events').doc(eventId)
              .collection('comments').doc(commentId)
              .collection('replies', ref => ref.orderBy('timestamp'))
              .snapshotChanges()
              .pipe(
                map(replySnapshots => {
                  const replies = replySnapshots.map(replySnapshot => {
                    const replyData = replySnapshot.payload.doc.data() as Reply;
                    return {
                      ...replyData,
                      timestamp: replyData.timestamp instanceof Date ?
                        replyData.timestamp :
                        (replyData.timestamp as any).toDate()
                    };
                  });

                  return {
                    ...commentData,
                    id: commentId,
                    timestamp: commentData.timestamp instanceof Date ?
                      commentData.timestamp :
                      (commentData.timestamp as any).toDate(),
                    replies
                  };
                })
              );
          });

          return commentDocs.length ? combineLatest(commentDocs) : of([]);
        }),
        catchError(error => {
          console.error('Error fetching comments:', error);
          return of([]);
        })
      );
  }

  addComment() {
    const eventId = this.route.snapshot.paramMap.get('id');
    if (!eventId || !this.userId) return;

    const commentText = this.newCommentText.value?.trim();
    if (!commentText) return;

    this.firestore.collection('events').doc(eventId)
      .collection('comments').add({
        text: commentText,
        userId: this.userId,
        userName: this.userName,
        userPhotoUrl: this.userPhotoURL,
        timestamp: new Date(),
      }).then(() => {
        this.newCommentText.reset();
      }).catch(error => {
        console.error("Error adding comment: ", error);
      });
  }
}
