import { Component } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { AuthService } from '../../shared/services/auth.service';

@Component({
  selector: 'app-forgotpassword',
  templateUrl: './forgotpassword.component.html',
  styleUrls: ['./forgotpassword.component.scss']
})
export class ForgotpasswordComponent {
  email: string = '';
  errorMessage: string = '';

  constructor(private authService: AuthService) { }

  onForgotPassword(): void {
    this.errorMessage = '';

    if (!this.email) {
      this.errorMessage = 'Please enter your email address';
      return;
    }

    this.authService.forgotPassword(this.email)
      .catch(error => {
        this.errorMessage = error.message;
      });
  }
}
