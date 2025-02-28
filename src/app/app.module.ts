import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { AppRoutingModule } from './app-routing.module';
import { AppComponent } from './app.component';

// Import AngularFire compat modules
import { AngularFireModule } from '@angular/fire/compat';
import { AngularFireAuthModule } from '@angular/fire/compat/auth';
import { AngularFirestoreModule } from '@angular/fire/compat/firestore';
import { AngularFireStorageModule } from '@angular/fire/compat/storage';
import { AngularFireDatabaseModule } from '@angular/fire/compat/database';

// Import Firebase environment configuration
import { environment } from '../environment/environment'
import { RouterModule } from '@angular/router';
import { MainPageComponent } from '../main-page/main-page.component';
import { MainNavComponent } from '../main-nav/main-nav.component';
import { DashboardComponent } from '../dashboard/dashboard/dashboard.component';
import { CalendarComponent } from '../calendar/calendar.component';
import { EmailverificationComponent } from '../dashboard/emailverification/emailverification.component';
import { ForgotpasswordComponent } from '../dashboard/forgotpassword/forgotpassword.component';
import { LoginComponent } from '../dashboard/login/login.component';
import { RegisterComponent } from '../dashboard/register/register.component';
import { EventCreateComponent } from '../events/event-create/event-create.component';
import { EventDetailComponent } from '../events/event-detail/event-detail.component';
import { EventsListComponent } from '../events/events-list/events-list.component';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { HttpClientModule } from '@angular/common/http';
import { CommonModule, DatePipe } from '@angular/common';
import { PublicCalendarComponent } from '../public-calendar/public-calendar.component';
import { OrganizerCalendarComponent } from '../organizer-calendar/organizer-calendar.component';
import { OrganizerGuard } from '../shared/guards/organizer.guard';
import { AdminComponent } from '../admin/admin.component';
import { AdminGuard } from '../shared/guards/admin.guard';
import { AuthGuard } from '../shared/guards/auth.guard';
import { StanSaOrganizatoromComponent } from '../organizator/stan-sa-organizatorom/stan-sa-organizatorom.component';

@NgModule({
  declarations: [
    AppComponent,
    MainNavComponent,
    DashboardComponent,
    EmailverificationComponent,
    ForgotpasswordComponent,
    LoginComponent,
    RegisterComponent,
    EventCreateComponent,
    CalendarComponent,
    EventDetailComponent,
    EventCreateComponent,
    EventsListComponent,
    OrganizerCalendarComponent,
    PublicCalendarComponent,
    AdminComponent,
    StanSaOrganizatoromComponent,



    // Declare additional components here
  ],
  imports: [
    BrowserModule,
    AppRoutingModule,
    FormsModule,
    HttpClientModule,
    CommonModule,
    DatePipe,
    ReactiveFormsModule,
    AngularFireModule.initializeApp(environment.firebaseConfig),
    AngularFireAuthModule,
    AngularFirestoreModule,
    AngularFireStorageModule,
    AngularFireDatabaseModule,
    RouterModule.forRoot([
      { path: '', redirectTo: '/MainPage', pathMatch: 'full' },
      {
        path: 'MainPage', component: MainPageComponent
      },
      {
        path: 'login', component: LoginComponent
      },
      {
        path: 'register', component: RegisterComponent
      },
      {
        path: 'dashboard', component: DashboardComponent
      },
      {
        path: 'emailverification', component: EmailverificationComponent
      },
      {
        path: 'forgot-password', component: ForgotpasswordComponent
      },
      {
        path: 'calendar', component: CalendarComponent
      },
      {
        path: 'events', component: EventsListComponent
      },
      {
        path: 'create-event', component: EventCreateComponent
      },
      {
        path: 'events/:id', component: EventDetailComponent
      },
      { path: 'public-calendar', component: PublicCalendarComponent },
      { path: 'organizer-calendar', component: OrganizerCalendarComponent },
      { path: 'admin', component: AdminComponent, canActivate: [AdminGuard] },
      { path: 'Stan-Sa-Organizatorom', component: StanSaOrganizatoromComponent },

    ]),
  ],
  providers: [],
  bootstrap: [AppComponent]
})
export class AppModule { }
