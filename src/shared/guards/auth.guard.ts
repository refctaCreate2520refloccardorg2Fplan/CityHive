import { Injectable } from '@angular/core';
import { CanActivate, Router } from '@angular/router';
import { map, take } from 'rxjs/operators'; // Import RxJS operators
import { AuthService } from '../services/auth.service';

@Injectable({
  providedIn: 'root'
})
export class AuthGuard implements CanActivate {
  constructor(private authService: AuthService, private router: Router) {}

  canActivate() {
    return this.authService.isLoggedIn().pipe(
      take(1), // Take only the first emitted value
      map(user => {
        if (user) {
          return true; // Allow access
        } else {
          this.router.navigate(['/login']); // Redirect to login
          return false;
        }
      })
    );
  }
}