import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { AuthService } from '../../shared/services/auth.service';
import { AngularFireStorage } from '@angular/fire/compat/storage';
import { Observable } from 'rxjs';
import { finalize } from 'rxjs/operators';

@Component({
  selector: 'app-dashboard',
  templateUrl: './dashboard.component.html',
  styleUrls: ['./dashboard.component.scss']
})
export class DashboardComponent implements OnInit {
  // Pre nastavenia profilu
  userRole$: Observable<string | null>;
  showSettings: boolean = false;
  profileForm: FormGroup;
  selectedFile: File | null = null;

  // Pre organizer request (tlačidlo "Staň sa organizatorom")
  isOrganizerRequestModalOpen: boolean = false;
  organizerRequestData = {
    groupName: '',
    members: '',
    contact: ''
  };

  // Pre todo list (lokálne pole)
  newTodoTitle: string = '';
  todos: any[] = [];

  constructor(
    public authService: AuthService,
    private fb: FormBuilder,
    private storage: AngularFireStorage
  ) {
    this.profileForm = this.fb.group({
      displayName: ['', Validators.required]
    });
    this.userRole$ = this.authService.getCurrentUserRole();
  }

  ngOnInit(): void {
    if (this.authService.userData && this.authService.userData.displayName) {
      this.profileForm.patchValue({
        displayName: this.authService.userData.displayName
      });
    }
  }

  // Prepínanie nastavení profilu
  toggleSettings(): void {
    this.showSettings = !this.showSettings;
  }

  // Spracovanie drag & drop súboru
  onFileDropped(event: DragEvent): void {
    event.preventDefault();
    if (event.dataTransfer && event.dataTransfer.files.length > 0) {
      this.selectedFile = event.dataTransfer.files[0];
    }
  }

  // Zabránenie predvolenej akcii pre drag & drop
  preventDefault(event: Event): void {
    event.preventDefault();
  }

  // Spracovanie vybraného súboru cez input element
  onFileSelected(event: Event): void {
    const target = event.target as HTMLInputElement;
    if (target.files && target.files.length > 0) {
      this.selectedFile = target.files[0];
    }
  }

  // Nahratie profilového obrázka do Firebase Storage a získanie URL
  uploadProfilePicture(file: File): Promise<string> {
    return new Promise((resolve, reject) => {
      const userId = this.authService.userData ? this.authService.userData.uid : null;
      if (!userId) {
        reject('Používateľ nie je prihlásený');
        return;
      }
      const filePath = `profile_pictures/${userId}_${new Date().getTime()}`;
      const fileRef = this.storage.ref(filePath);
      const task = this.storage.upload(filePath, file);
      task.snapshotChanges().pipe(
        finalize(() => {
          fileRef.getDownloadURL().subscribe({
            next: (url) => resolve(url),
            error: (err) => reject(err)
          });
        })
      ).subscribe();
    });
  }

  // Aktualizácia profilu – zmena mena a voliteľne nahratie profilového obrázka
  async editProfile(): Promise<void> {
    const displayName = this.profileForm.value.displayName;
    let photoURL = this.authService.userData && this.authService.userData.photoURL
      ? this.authService.userData.photoURL
      : '';
    if (this.selectedFile) {
      try {
        photoURL = await this.uploadProfilePicture(this.selectedFile);
      } catch (error) {
        console.error('Error uploading file:', error);
      }
    }
    try {
      await this.authService.updateProfile(displayName, photoURL);
      alert('Profil bol úspešne aktualizovaný!');
    } catch (error) {
      alert('Chyba pri aktualizácii profilu.');
      console.error(error);
    }
  }

  // Funkcie pre organizátorskú žiadosť
  openOrganizerRequestModal(): void {
    this.isOrganizerRequestModalOpen = true;
  }

  closeOrganizerRequestModal(): void {
    this.isOrganizerRequestModalOpen = false;
  }

  submitOrganizerRequest(): void {
    if (!this.authService.userData) {
      alert("Musíte byť prihlásený");
      return;
    }
    // Tu by ste zavolali službu na spracovanie žiadosti; pre ukážku len zobrazíme hlásenie.
    alert("Žiadosť o organizátora odoslaná. Čakajte na schválenie.");
    this.closeOrganizerRequestModal();
    this.organizerRequestData = { groupName: '', members: '', contact: '' };
  }

  // --- Todo list funkcie ---
  addTodo(): void {
    if (!this.newTodoTitle.trim()) return;
    const newTodo = {
      id: Date.now(),
      title: this.newTodoTitle,
      completed: false
    };
    this.todos.push(newTodo);
    this.newTodoTitle = '';
  }

  updateTodo(todo: any): void {
    todo.completed = !todo.completed;
  }

  deleteTodo(todo: any): void {
    this.todos = this.todos.filter(t => t.id !== todo.id);
  }
}
