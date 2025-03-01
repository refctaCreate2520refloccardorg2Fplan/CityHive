import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { OrganizerRequestService, OrganizerRequest } from '../../shared/services/organizer-request.service';
import { AuthService, UserRole } from '../../shared/services/auth.service';
import { Router } from '@angular/router';
import { AngularFirestore } from '@angular/fire/compat/firestore';
import { HttpClient } from '@angular/common/http';

@Component({
  selector: 'app-stan-sa-organizatorom',
  templateUrl: './stan-sa-organizatorom.component.html',
  styleUrls: ['./stan-sa-organizatorom.component.scss']
})
export class StanSaOrganizatoromComponent implements OnInit {
  organizerForm: FormGroup;
  isSubmitting: boolean = false;
  loggedIn: boolean = false;
  phoneVerified: boolean = false;
  smsCodeSent: boolean = false;
  verificationMessage: string = '';

  constructor(
    private fb: FormBuilder,
    private organizerRequestService: OrganizerRequestService,
    private authService: AuthService,
    public router: Router,
    private afs: AngularFirestore,
    private http: HttpClient // pre API volania na auto-vyplnenie údajov podľa IČO
  ) {
    this.organizerForm = this.fb.group({
      ico: ['', Validators.required],
      companyName: ['', Validators.required],
      email: ['', [Validators.required, Validators.email]],
      phone: ['', Validators.required],
      parkingSpaces: ['', Validators.required],
      groupName: ['', Validators.required],
      members: ['', Validators.required],
      contact: ['', Validators.required],
      customLinks: [''],
      attachments: [null],
      customTags: [''],
      customLocation: ['']
    });
  }

  ngOnInit(): void {
    this.authService.isLoggedIn$().subscribe(isLoggedIn => {
      this.loggedIn = isLoggedIn;
    });

    // Ak je používateľ už organizátor alebo admin, presmeruje sa
    this.authService.getCurrentUserRole().subscribe(role => {
      if (role === UserRole.Organizer || role === UserRole.Admin) {
        this.router.navigate(['/organizer-calendar']);
      }
    });
  }

  // Po zmene IČO zavoláme API na vyplnenie údajov
  fetchCompanyData() {
    const ico = this.organizerForm.get('ico')?.value;
    if (ico) {
      // Simulácia API volania – nahradiť URL reálnym endpointom
      this.http.get(`https://api.example.com/company/${ico}`).subscribe((data: any) => {
        if (data && data.companyName) {
          this.organizerForm.patchValue({
            companyName: data.companyName
          });
        }
      }, error => {
        console.error('Error fetching company data:', error);
      });
    }
  }

  // Simulovaný proces overenia telefónu pomocou SMS
  sendSmsCode() {
    const phone = this.organizerForm.get('phone')?.value;
    if (phone) {
      // V reálnom projekte integrujte Firebase Phone Auth s reCAPTCHA
      this.smsCodeSent = true;
      this.verificationMessage = 'SMS kód bol odoslaný. Zadajte ho pre overenie.';
    }
  }

  verifySmsCode(code: string) {
    // Simulácia – ak zadaný kód je "123456", overenie prebehlo
    if (code === '123456') {
      this.phoneVerified = true;
      this.verificationMessage = 'Telefón bolo overený.';
    } else {
      this.verificationMessage = 'Nesprávny kód. Skúste to znova.';
    }
  }

  submitRequest(): void {
    if (this.organizerForm.invalid || !this.phoneVerified) {
      alert('Vyplňte všetky povinné polia a overte telefón.');
      return;
    }
    const requestData: OrganizerRequest = {
      userId: this.authService.userData?.uid,
      groupName: this.organizerForm.value.groupName,
      members: this.organizerForm.value.members,
      contact: this.organizerForm.value.contact,
      approved: false
    };
    // Môžete uložiť aj ďalšie údaje (ico, companyName, email, phone, parkingSpaces, atď.)
    console.log('Dodatočné údaje:', {
      ico: this.organizerForm.value.ico,
      companyName: this.organizerForm.value.companyName,
      email: this.organizerForm.value.email,
      phone: this.organizerForm.value.phone,
      parkingSpaces: this.organizerForm.value.parkingSpaces,
      customLinks: this.organizerForm.value.customLinks,
      customTags: this.organizerForm.value.customTags,
      customLocation: this.organizerForm.value.customLocation
    });

    this.isSubmitting = true;
    this.organizerRequestService.createRequest(requestData)
      .then(() => {
        alert('Žiadosť odoslaná. Čakajte na schválenie.');
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
