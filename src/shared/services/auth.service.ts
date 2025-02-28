import { Injectable, NgZone, Injector, runInInjectionContext } from '@angular/core';
import * as auth from 'firebase/auth';
import { AngularFireAuth } from '@angular/fire/compat/auth';
import { AngularFirestore, AngularFirestoreDocument } from '@angular/fire/compat/firestore';
import { Router } from '@angular/router';
import { Observable, of } from 'rxjs';
import { map, switchMap } from 'rxjs/operators';

export enum UserRole {
  User = 'user',
  Organizer = 'organizer',
  Admin = 'admin'
}

export interface User {
  uid: string;
  email: string;
  displayName: string;
  photoURL: string;
  role: UserRole;
  emailVerified?: boolean;
}

@Injectable({ providedIn: 'root' })
export class AuthService {
  userData: any;

  constructor(
    public afs: AngularFirestore,
    public afAuth: AngularFireAuth,
    private router: Router,
    private ngZone: NgZone,
    private injector: Injector
  ) {
    this.afAuth.authState.subscribe((user) => {
      if (user) {
        this.userData = user;
        localStorage.setItem('user', JSON.stringify(this.userData));
        runInInjectionContext(this.injector, () => {
          this.updateRoleInLocalStorage(user.uid);
        });
      } else {
        localStorage.setItem('user', 'null');
        localStorage.removeItem('role');
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
          localStorage.removeItem('role');
        }
      } else {
        localStorage.removeItem('role');
      }
    } catch (error) {
      console.error('Error fetching user role from Firestore:', error);
      localStorage.removeItem('role');
    }
  }

  public async assignRoleToUser(uid: string, newRole: UserRole): Promise<void> {
    return runInInjectionContext(this.injector, async () => {
      try {
        const userRef: AngularFirestoreDocument<User> = this.afs.doc(`users/${uid}`);
        const docSnapshot = await userRef.get().toPromise();
        if (docSnapshot?.exists) {
          await userRef.update({ role: newRole });
          console.log(`Role ${newRole} assigned to user with UID: ${uid}`);
          const currentUser = JSON.parse(localStorage.getItem('user') || 'null');
          if (currentUser && currentUser.uid === uid) {
            localStorage.setItem('role', newRole);
          }
        } else {
          console.error('Cannot assign role: user does not exist in Firestore');
        }
      } catch (error) {
        console.error('Error assigning role:', error);
      }
    });
  }

  async getCurrentUser(): Promise<any> {
    return await this.afAuth.currentUser;
  }

  async getCurrentUserId(): Promise<string | null> {
    const user = await this.afAuth.currentUser;
    return user ? user.uid : null;
  }

  // New observable-based login check
  isLoggedIn$(): Observable<boolean> {
    return this.afAuth.authState.pipe(
      map(user => !!user)
    );
  }

  // Updated to use authState and valueChanges() for reactive role checking
  getCurrentUserRole(): Observable<UserRole | null> {
    return this.afAuth.authState.pipe(
      switchMap(user => {
        if (user) {
          return this.afs.doc<User>(`users/${user.uid}`).valueChanges();
        } else {
          return of(null);
        }
      }),
      map(userData => (userData ? userData.role : null))
    );
  }

  isAdmin(): Observable<boolean> {
    return this.afAuth.authState.pipe(
      switchMap(user => {
        if (user) {
          return this.afs.doc(`users/${user.uid}`).valueChanges();
        } else {
          return of(null);
        }
      }),
      map((userData: any) => {
        return !!userData && userData.role === UserRole.Admin;
      })
    );
  }

  isAdminFromLocalStorage(): boolean {
    const role = localStorage.getItem('role');
    return role === UserRole.Admin;
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

  // Updated register to accept displayName
  register(email: string, password: string, displayName: string): Promise<any> {
    return this.afAuth.createUserWithEmailAndPassword(email, password)
      .then(async (result) => {
        if (result.user) {
          await result.user.updateProfile({
            displayName: displayName,
            photoURL: result.user.photoURL || ''
          });
          this.sendVerificationMail();
          this.setUserData(result.user);
        }
      })
      .catch((error: any) => {
        window.alert(error.message);
      });
  }

  sendVerificationMail(): Promise<void> {
    return this.afAuth.currentUser
      .then((u: any) => u.sendEmailVerification())
      .then(() => {
        this.router.navigate(['emailverification']);
      });
  }

  forgotPassword(passwordResetEmail: string): Promise<void> {
    return this.afAuth.sendPasswordResetEmail(passwordResetEmail)
      .then(() => {
        window.alert('Password reset email sent.');
      })
      .catch((error: any) => {
        window.alert(error);
      });
  }

  // Synchronous getter for legacy usage (not used by guards in this solution)
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
      const docSnapshot = await userRef.get().toPromise();
      const existingData = docSnapshot && docSnapshot.exists ? docSnapshot.data() : null;
      // Default role is 'user' if none exists
      let role = (existingData && existingData.role) ? existingData.role : UserRole.User;
      const userData: User = {
        uid: user.uid,
        email: user.email,
        displayName: user.displayName,
        photoURL: user.photoURL,
        role
      };
      return userRef.set(userData, { merge: true }).then(() => {
        console.log('User document updated!');
        localStorage.setItem('role', role);
      });
    });
  }

  signOut(): Promise<void> {
    return this.afAuth.signOut().then(() => {
      localStorage.removeItem('user');
      localStorage.removeItem('role');
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
