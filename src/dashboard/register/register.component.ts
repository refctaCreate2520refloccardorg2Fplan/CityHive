import { Component } from '@angular/core';
import { AuthService } from '../../shared/services/auth.service';

@Component({
  selector: 'app-register',
  templateUrl: './register.component.html',
  styleUrls: ['./register.component.scss']
})
export class RegisterComponent {
  name: string = '';       // New field for the user's name (displayName)
  email: string = '';
  password: string = '';
  confirmPassword: string = '';

  constructor(private authService: AuthService) { }

  onRegister(): void {
    if (this.password !== this.confirmPassword) {
      window.alert('Passwords do not match.');
      return;
    }
    // Pass the user's name along with email and password to the AuthService
    this.authService.register(this.email, this.password, this.name);
  }
}
