import { Component, inject } from '@angular/core';
import { RouterLink } from '@angular/router';
import { AuthService } from '../../core/auth.service';

@Component({
  selector: 'app-home',
  imports: [RouterLink],
  template: `
    <main style="max-width: 380px; margin: 0 auto; padding: 24px 16px; font-family: system-ui, sans-serif">
      <h1>Home (placeholder)</h1>
      @if (auth.user(); as user) {
        <p>Logged in as <strong>{{ user.name }}</strong> ({{ user.role }})</p>
        <button type="button" (click)="auth.logout()">Log out</button>
      } @else {
        <p>You are browsing as a guest.</p>
        <a routerLink="/login">Log in or register</a>
      }
    </main>
  `,
})
export class HomeComponent {
  auth = inject(AuthService);
}