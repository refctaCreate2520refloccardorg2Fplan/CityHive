import { Component } from '@angular/core';
import { AuthService } from '../shared/services/auth.service';

@Component({
  selector: 'app-main-nav',
  standalone: false,
  templateUrl: './main-nav.component.html',
  styleUrl: './main-nav.component.scss'
})
export class MainNavComponent {

  constructor(public authService: AuthService) { }

  get isLoggedIn(): boolean {
    return this.authService.isLoggedIn;
  }
}
