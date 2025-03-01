import { Component, ElementRef, OnInit, ViewChild } from '@angular/core';
import { AngularFirestore } from '@angular/fire/compat/firestore';
import { AuthService } from '../shared/services/auth.service';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';

interface ChatMessage {
  id?: string;
  senderId: string;
  senderName: string;
  message: string;
  timestamp: any;
  isOwn?: boolean; // Add isOwn property
}

@Component({
  selector: 'app-admin-organizer-chat',
  templateUrl: './admin-organizer-chat.component.html',
  styleUrls: ['./admin-organizer-chat.component.scss']
})
export class AdminOrganizerChatComponent implements OnInit {
  chatMessages: ChatMessage[] = [];
  newMessage: string = '';
  chatRoomId: string = 'default-room'; // Pre prípad, že bude chat viazaný na konkrétnu udalosť
  currentUserId: string | null = null;
  currentUserName: string | null = null;

  constructor(private afs: AngularFirestore, private authService: AuthService) { }

  ngOnInit(): void {
    this.authService.getCurrentUser().then(user => {
      if (user) {
        this.currentUserId = user.uid;
        this.currentUserName = user.displayName;
      }
    });
    this.loadChatMessages();
  }

  @ViewChild('chatMessagesContainer')
  chatMessagesContainer!: ElementRef;

  ngAfterViewChecked() {
    this.scrollToBottom();
  }

  scrollToBottom(): void {
    try {
      this.chatMessagesContainer.nativeElement.scrollTop = this.chatMessagesContainer.nativeElement.scrollHeight;
    } catch (err) { }
  }

  loadChatMessages() {
    this.afs.collection<ChatMessage>(`chats/${this.chatRoomId}/messages`, ref => ref.orderBy('timestamp'))
      .snapshotChanges()
      .pipe(
        map(actions => actions.map(a => {
          const data = a.payload.doc.data() as ChatMessage;
          const id = a.payload.doc.id;
          const isOwn = data.senderId === this.currentUserId; // Determine if message is own
          return { id, ...data, isOwn };

        }))
      )
      .subscribe(messages => {
        this.chatMessages = messages;
      });
  }

  sendMessage() {
    if (!this.newMessage.trim() || !this.currentUserId) {
      return;
    }
    const message: ChatMessage = {
      senderId: this.currentUserId,
      senderName: this.currentUserName || 'Unknown',
      message: this.newMessage,
      timestamp: new Date()
    };
    this.afs.collection(`chats/${this.chatRoomId}/messages`).add(message)
      .then(() => {
        this.newMessage = '';
      })
      .catch(error => {
        console.error('Error sending message:', error);
      });
  }
}
