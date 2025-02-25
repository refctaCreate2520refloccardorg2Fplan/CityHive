// src/app/dashboard/dashboard.component.ts
import { Component, OnInit } from '@angular/core';
import { AuthService } from '../../shared/services/auth.service';
import { OrganizerRequestService, OrganizerRequest } from '../../shared/services/organizer-request.service';

@Component({
  selector: 'app-dashboard',
  templateUrl: './dashboard.component.html',
  styleUrls: ['./dashboard.component.scss']
})
export class DashboardComponent implements OnInit {
  isRequestModalOpen = false;

  organizerRequestData = {
    groupName: '',
    members: '',
    contact: ''
  };

  currentUserId: string | null = null;

  constructor(
    private authService: AuthService,
    private organizerRequestService: OrganizerRequestService
  ) { }

  async ngOnInit() {
    this.currentUserId = await this.authService.getCurrentUserId();
  }

  openRequestModal() {
    this.isRequestModalOpen = true;
  }

  closeRequestModal() {
    this.isRequestModalOpen = false;
  }

  submitOrganizerRequest() {
    if (!this.currentUserId) {
      alert('Musíte byť prihlásený');
      return;
    }
    const req: OrganizerRequest = {
      userId: this.currentUserId,
      groupName: this.organizerRequestData.groupName,
      members: this.organizerRequestData.members,
      contact: this.organizerRequestData.contact,
      approved: false
    };
    this.organizerRequestService.createRequest(req).then(() => {
      alert('Žiadosť odoslaná. Čakajte na schválenie admina.');
      this.closeRequestModal();
      this.organizerRequestData = { groupName: '', members: '', contact: '' };
    }).catch(err => {
      console.error(err);
      alert('Chyba pri odosielaní žiadosti.');
    });
  }
}
