import { Component } from '@angular/core';
import { AuthService } from '../../shared/services/auth.service';
import { GoogleAuthService } from '../../shared/services/google-auth.service';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';

@Component({
  selector: 'app-login',
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.scss']
})
export class LoginComponent {
  email: string = '';
  password: string = '';
  isLoading = false;
  errorMessage = '';

  constructor(private authService: AuthService, private googleAuth: GoogleAuthService) { }

  // Handle email/password login
  onLogin() {
    this.authService.login(this.email, this.password)
      .catch(error => {
        alert(error.message);
      });
  }

  signInWithGoogle() {
    this.isLoading = true;
    this.errorMessage = '';

    this.googleAuth.signInWithGoogle()
      .then(() => {
        this.isLoading = false;
      })
      .catch((error) => {
        this.isLoading = false;
        this.errorMessage = error.message || 'An error occurred during Google sign-in';
        console.error('Google sign-in error:', error);
      });
  }

}
