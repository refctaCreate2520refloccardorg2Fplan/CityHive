import { Injectable, NgZone, Injector, runInInjectionContext } from '@angular/core';
import * as auth from 'firebase/auth';
import { AngularFireAuth } from '@angular/fire/compat/auth';
import { AngularFirestore, AngularFirestoreDocument } from '@angular/fire/compat/firestore';
import { Router } from '@angular/router';
import { Observable, from, of } from 'rxjs';
import { map, switchMap } from 'rxjs/operators';
import { HttpClient } from '@angular/common/http';

export enum UserRole {
  User = 'user',
  Admin = 'admin'
}

export interface User {
  uid: string;
  email: string;
  displayName: string;
  photoURL: string;
  emailVerified?: boolean;
  role: UserRole; // Use the UserRole enum here
}

@Injectable({
  providedIn: 'root',
})
export class AuthService {
  userData: any;

  constructor(
    private afs: AngularFirestore,
    private afAuth: AngularFireAuth,
    private router: Router,
    private ngZone: NgZone,
    private http: HttpClient,
    private injector: Injector // Make sure Injector is injected
  ) {
    this.afAuth.authState.subscribe((user) => {
      if (user) {
        this.userData = user;
        localStorage.setItem('user', JSON.stringify(this.userData));
        runInInjectionContext(this.injector, () => { // Keep runInInjectionContext here as well
          this.updateRoleInLocalStorage(user.uid);
        });
      } else {
        localStorage.setItem('user', 'null');
        localStorage.removeItem('role'); // Clear role from local storage on logout
      }
    });
  }

  private async updateRoleInLocalStorage(uid: string): Promise<void> {
    try {
      const userDoc = await this.afs.doc<User>(`users/${uid}`).get().toPromise();
      if (userDoc && userDoc.exists) {
        const userData = userDoc.data();
        if (userData && userData.role) {
          localStorage.setItem('role', userData.role);
        } else {
          localStorage.removeItem('role'); // Remove role if not found in Firestore
        }
      } else {
        localStorage.removeItem('role'); // Remove role if user doc not found
      }
    } catch (error) {
      console.error('Error fetching user role from Firestore:', error);
      localStorage.removeItem('role'); // Remove role on error
    }
  }


  async getCurrentUser(): Promise<any> {
    return await this.afAuth.currentUser;
  }

  async getCurrentUserId(): Promise<string | null> {
    const user = await this.afAuth.currentUser;
    return user ? user.uid : null;
  }

  async getCurrentUserDisplayName(): Promise<string | null> {
    const user = await this.afAuth.currentUser;
    return user ? user.displayName : null;
  }

  async getCurrentUserPhotoUrl(): Promise<string | null> {
    const user = await this.afAuth.currentUser;
    return user ? user.photoURL : null;
  }

  getCurrentUserRole(): Observable<UserRole | null> {
    return from(this.afAuth.currentUser).pipe(
      map((user) => (user ? user.uid : null)),
      switchMap((uid) => {
        if (uid) {
          return runInInjectionContext(this.injector, () => { // Wrap Firestore call in isAdmin()
            return this.afs.doc(`users/${uid}`).get().pipe( // Modified to .get() and map
              map((doc) => (doc.exists ? doc.data() : null))
            );
          });
        } else {
          return of(null);
        }
      }),
      map((userData: any) => (userData ? userData.role : null))
    );
  }

  isAdmin(): Observable<boolean> {
    return this.afAuth.authState.pipe(
      switchMap((user) => {
        if (user) {
          console.log('Fetching user role for UID:', user.uid);
          return runInInjectionContext(this.injector, () => { // Wrap Firestore call in isAdmin()
            return this.afs.doc(`users/${user.uid}`).valueChanges(); // Line 114 - Now wrapped
          });
        } else {
          console.log('No user logged in');
          return of(null);
        }
      }),
      map((userData: any) => {
        const isAdmin = !!userData && userData.role === 'admin';
        console.log('Is Admin from Firestore:', isAdmin);
        return isAdmin;
      })
    );
  }

  isAdminFromLocalStorage(): boolean {
    const role = localStorage.getItem('role');
    const isAdmin = role === 'admin';
    console.log('Is Admin from Local Storage:', isAdmin);
    return isAdmin;
  }


  login(email: string, password: string): Promise<any> {
    return this.afAuth.signInWithEmailAndPassword(email, password)
      .then(() => {
        this.router.navigate(['dashboard']);
      })
      .catch((error: any) => {
        window.alert(error.message);
      });
  }

  register(email: string, password: string): Promise<any> {
    return this.afAuth.createUserWithEmailAndPassword(email, password)
      .then((result) => {
        this.sendVerificationMail();
        this.setUserData(result.user);
      })
      .catch((error: any) => {
        window.alert(error.message);
      });
  }

  sendVerificationMail(): Promise<void> {
    return this.afAuth.currentUser
      .then((u: any) => u.sendEmailVerification())
      .then(() => {
        this.router.navigate(['verify-email-address']);
      });
  }

  forgotPassword(passwordResetEmail: string): Promise<void> {
    return this.afAuth.sendPasswordResetEmail(passwordResetEmail)
      .then(() => {
        window.alert('Password reset email sent, check your inbox.');
      })
      .catch((error: any) => {
        window.alert(error);
      });
  }

  get isLoggedIn(): boolean {
    const user = JSON.parse(localStorage.getItem('user') || 'null');
    return user !== null;
  }

  loginWithGoogle(): Promise<any> {
    return this.authLogin(new auth.GoogleAuthProvider()).then(() => {
      this.router.navigate(['dashboard']);
    });
  }

  authLogin(provider: any): Promise<any> {
    return this.afAuth.signInWithPopup(provider)
      .then((result) => {
        this.router.navigate(['dashboard']);
        this.setUserData(result.user);
      })
      .catch((error: any) => {
        window.alert(error);
      });
  }

  async setUserData(user: any): Promise<void> {
    return runInInjectionContext(this.injector, async () => {
      const userRef: AngularFirestoreDocument<User> = this.afs.doc(`users/${user.uid}`);

      // Attempt to read existing user data
      const docSnapshot = await userRef.get().toPromise();
      const existingData = docSnapshot && docSnapshot.exists ? docSnapshot.data() : null;
      // Preserve role if it exists and is set to 'admin'
      const role: UserRole = existingData && existingData.role === 'admin' ? UserRole.Admin : UserRole.User; // Use UserRole enum

      const userData: User = {
        uid: user.uid,
        email: user.email,
        displayName: user.displayName,
        photoURL: user.photoURL,
        role: role
      };

      return userRef
        .set(userData, { merge: true })
        .then(() => {
          console.log('User document updated successfully!');
          localStorage.setItem('role', role); // Store role in local storage here after successful Firestore update
        })
        .catch((error: any) => {
          console.error('Error writing user document: ', error);
        });
    });
  }


  signOut(): Promise<void> {
    return this.afAuth.signOut().then(() => {
      localStorage.removeItem('user');
      localStorage.removeItem('role'); // Clear role on sign out
      this.router.navigate(['']);
    });
  }

  async updateProfile(displayName: string, photoURL: string): Promise<void> {
    const user = await this.afAuth.currentUser;
    if (user) {
      try {
        await user.updateProfile({ displayName, photoURL });
        await this.setUserData(user);
      } catch (error: any) {
        console.error('Error updating profile: ', error);
      }
    } else {
      console.error('No user logged in.');
    }
  }

}
