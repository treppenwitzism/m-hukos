import { Injectable, computed, inject, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import { catchError, of, tap } from 'rxjs';
import { environment } from '../../environments/environment';
import { AuthResponse, User } from './models';

const TOKEN_KEY = 'token';

@Injectable({ providedIn: 'root' })
export class AuthService {
  private http = inject(HttpClient);
  private router = inject(Router);

  private tokenSignal = signal<string | null>(localStorage.getItem(TOKEN_KEY));

  readonly user = signal<User | null>(null);
  readonly isLoggedIn = computed(() => !!this.tokenSignal());
  readonly role = computed(() => this.user()?.role ?? null);

  get token(): string | null {
    return this.tokenSignal();
  }

  register(body: { name: string; email: string; password: string }) {
    return this.http
      .post<AuthResponse>(`${environment.apiUrl}/auth/register`, body)
      .pipe(tap((res) => this.setSession(res)));
  }

  login(body: { email: string; password: string }) {
    return this.http
      .post<AuthResponse>(`${environment.apiUrl}/auth/login`, body)
      .pipe(tap((res) => this.setSession(res)));
  }

  logout() {
    this.clearSession();
    this.router.navigate(['/login']);
  }

  loadUser() {
    if (!this.token) return of(null);
    return this.http.get<{ user: User }>(`${environment.apiUrl}/auth/me`).pipe(
      tap((res) => this.user.set(res.user)),
      catchError(() => {
        this.clearSession(); // expired or invalid token
        return of(null);
      })
    );
  }

  sessionExpired() {
    if (this.isLoggedIn()) this.logout();
  }

  private setSession(res: AuthResponse) {
    localStorage.setItem(TOKEN_KEY, res.token);
    this.tokenSignal.set(res.token);
    this.user.set(res.user);
  }

  private clearSession() {
    localStorage.removeItem(TOKEN_KEY);
    this.tokenSignal.set(null);
    this.user.set(null);
  }
}