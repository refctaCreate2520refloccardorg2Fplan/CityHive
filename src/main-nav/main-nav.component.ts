import { Component, OnInit } from '@angular/core';
import { AuthService } from '../shared/services/auth.service';
import { NavigationEnd, Router } from '@angular/router';

@Component({
  selector: 'app-main-nav',
  standalone: false,
  templateUrl: './main-nav.component.html',
  styleUrls: ['./main-nav.component.scss']
})
export class MainNavComponent implements OnInit {
  showLeftSection = false;
  showLogout: boolean = false;

  constructor(private router: Router, public authService: AuthService) { }

  ngOnInit(): void {
    this.router.events.subscribe(event => {
      if (event instanceof NavigationEnd) {
        // Ak sa URL obsahuje '/dashboard', nastavíme showLogout na true.
        this.showLeftSection = event.url.includes('/dashboard');
        this.showLogout = event.url.includes('/dashboard');
      }
    });
  }

  get isLoggedIn(): boolean {
    return this.authService.isLoggedIn;
  }

  signout() {
    this.authService.signOut()
  }
}
