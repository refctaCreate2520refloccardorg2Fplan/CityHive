import { Component } from '@angular/core';
import { AuthService } from '../../shared/services/auth.service';

@Component({
  selector: 'app-dashboard',
  templateUrl: './dashboard.component.html',
  styleUrl: './dashboard.component.css'
})
export class DashboardComponent {
  userName: string = '';
  userEmail: string = '';

  constructor(private authService: AuthService) {
    this.authService.getCurrentUser().then(user => {
      if (user) {
        this.userName = user.displayName || 'Guest';
        this.userEmail = user.email || 'No email';
      }
    });
  }

  onLogout() {
    this.authService.signOut();
  }
}
