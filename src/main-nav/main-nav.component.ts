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
  // Tracks whether the left section (e.g., dashboard) should be shown
  showLeftSection = false;

  // Tracks whether the logout button should be displayed
  showLogout: boolean = false;

  // Tracks the state of the hamburger menu
  isMenuOpen = false;

  constructor(private router: Router, public authService: AuthService) { }

  ngOnInit(): void {
    this.router.events.subscribe((event) => {
      if (event instanceof NavigationEnd) {
        // Show the logout button and left section if the URL contains '/dashboard'
        this.showLeftSection = event.url.includes('/dashboard');
        this.showLogout = event.url.includes('/dashboard');

        // Close the hamburger menu when navigating to a new route
        this.isMenuOpen = false;
      }
    });
  }

  /**
   * Toggles the state of the hamburger menu.
   */
  toggleMenu(): void {
    this.isMenuOpen = !this.isMenuOpen; // Toggle the menu state
  }

  /**
   * Checks if the user is logged in.
   */
  get isLoggedIn(): boolean {
    return this.authService.isLoggedIn; // Delegate to the AuthService
  }

  /**
   * Signs out the user by calling the AuthService's signOut method.
   */
  signout(): void {
    this.authService.signOut(); // Delegate to the AuthService
  }
}
