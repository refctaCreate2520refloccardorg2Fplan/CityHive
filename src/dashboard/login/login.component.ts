import { Component } from '@angular/core';
import { AuthService } from '../../shared/services/auth.service';
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

  constructor(private authService: AuthService) { }

  onLogin() {
    this.authService.login(this.email, this.password)
      .catch(error => {
        alert(error.message);
      });
  }

  onGoogleLogin() {
    this.authService.loginWithGoogle()
  }
}
