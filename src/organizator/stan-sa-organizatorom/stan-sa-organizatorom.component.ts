import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { OrganizerRequestService, OrganizerRequest } from '../../shared/services/organizer-request.service';
import { AuthService } from '../../shared/services/auth.service';

@Component({
  selector: 'app-stan-sa-organizatorom',
  templateUrl: './stan-sa-organizatorom.component.html',
  styleUrls: ['./stan-sa-organizatorom.component.scss']
})
export class StanSaOrganizatoromComponent implements OnInit {
  organizerForm: FormGroup;
  isSubmitting: boolean = false;

  constructor(
    private fb: FormBuilder,
    private organizerRequestService: OrganizerRequestService,
    private authService: AuthService
  ) {
    this.organizerForm = this.fb.group({
      groupName: ['', Validators.required],
      members: ['', Validators.required],
      contact: ['', Validators.required]
    });
  }

  ngOnInit(): void {
    // Voliteľné: Ak chcete predvyplniť údaje alebo spraviť iné inicializačné operácie
  }

  submitRequest(): void {
    if (this.organizerForm.invalid) {
      return;
    }
    const requestData: OrganizerRequest = {
      userId: this.authService.userData?.uid,
      groupName: this.organizerForm.value.groupName,
      members: this.organizerForm.value.members,
      contact: this.organizerForm.value.contact,
      approved: false
    };

    this.isSubmitting = true;
    this.organizerRequestService.createRequest(requestData)
      .then(() => {
        alert('Žiadosť o organizátora bola odoslaná. Čakajte na schválenie.');
        this.organizerForm.reset();
        this.isSubmitting = false;
      })
      .catch(error => {
        console.error('Error submitting organizer request:', error);
        alert('Chyba pri odosielaní žiadosti.');
        this.isSubmitting = false;
      });
  }
}
