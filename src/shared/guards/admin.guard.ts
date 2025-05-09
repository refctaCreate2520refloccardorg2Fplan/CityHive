import { Injectable } from '@angular/core';
import { CanActivate, Router } from '@angular/router';
import { AuthService, UserRole } from '../services/auth.service';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';

@Injectable({ providedIn: 'root' })
export class AdminGuard implements CanActivate {
  constructor(private authService: AuthService, private router: Router) { }

  canActivate(): Observable<boolean> {
    return this.authService.getCurrentUserRole().pipe(
      map(role => {
        if (role === UserRole.Admin) {
          return true;
        } else {
          this.router.navigate(['/']);
          return false;
        }
      })
    );
  }
}
