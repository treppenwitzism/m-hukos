import { Component, inject, signal } from '@angular/core';
import { DatePipe } from '@angular/common';
import { RouterLink } from '@angular/router';
import { AuthService } from '../../core/auth.service';
import { PointsService } from '../../core/points.service';
import { errorMessage } from '../../core/http-error';

@Component({
  selector: 'app-account',
  imports: [DatePipe, RouterLink],
  template: `
    <div class="page">
      <h1>Points and account</h1>

      <section class="balance" aria-label="Points balance">
        <span class="label">Your points</span>
        <strong class="big">{{ points.balance() ?? '–' }}</strong>
        <span class="label center">
          Earn points on every dish marked "+ pts" once your order is paid. Ways to spend your points are coming soon.
        </span>
      </section>

      <section class="history" aria-label="Points history">
        <strong>History</strong>
        @if (loading()) {
          <p class="note">Loading...</p>
        } @else if (error()) {
          <p class="error" role="alert">{{ error() }}</p>
          <button type="button" class="secondary" (click)="load()">Try again</button>
        } @else if (points.history().length === 0) {
          <p class="note">No points yet. Order a dish with a "+ pts" label to start earning.</p>
          <a routerLink="/" class="link">Browse the menu</a>
        } @else {
          @for (entry of points.history(); track entry.id) {
            <div class="entry">
              <div class="entry-text">
                <span>{{ entry.reason }}</span>
                <span class="date">{{ entry.created_at | date: 'EEE d MMM y' }}</span>
              </div>
              <strong [class.gain]="entry.amount > 0">{{ signed(entry.amount) }}</strong>
            </div>
          }
        }
      </section>

      @if (auth.user(); as user) {
        <section class="details" aria-label="Account details">
          <div><span>Name</span><strong>{{ user.name }}</strong></div>
          <div><span>Email</span><strong>{{ user.email }}</strong></div>
        </section>
      }

      <button type="button" class="secondary logout" (click)="auth.logout()">Log out</button>
    </div>
  `,
  styles: `
    .page { padding: 16px; display: flex; flex-direction: column; gap: 16px; }
    h1 { margin: 0; font-size: 20px; }
    .balance { border: 1.5px solid #3d4450; border-radius: 8px; padding: 20px 16px; display: flex;
               flex-direction: column; align-items: center; gap: 4px; }
    .label { font-size: 13px; color: #5c6470; }
    .center { text-align: center; }
    .big { font-size: 40px; line-height: 1.1; }
    .history { display: flex; flex-direction: column; gap: 8px; font-size: 15px; }
    .entry { display: flex; justify-content: space-between; align-items: center; gap: 12px;
             border-bottom: 1.5px solid #d5d9e0; padding-bottom: 8px; }
    .entry-text { display: flex; flex-direction: column; font-size: 14px; }
    .date { font-size: 12px; color: #5c6470; }
    .gain { color: #1a7f37; }
    .note { color: #5c6470; margin: 0; font-size: 14px; }
    .error { color: #b3261e; margin: 0; }
    .link { min-height: 44px; display: inline-flex; align-items: center; font-size: 14px; }
    .details { border: 1.5px solid #3d4450; border-radius: 8px; padding: 12px; display: flex;
               flex-direction: column; gap: 8px; font-size: 14px; }
    .details > div { display: flex; justify-content: space-between; gap: 12px; }
    .details span { color: #5c6470; }
    .secondary { min-height: 48px; border: 1.5px solid #3d4450; border-radius: 8px; background: #fff;
                 color: #1f2328; font-weight: 600; font-size: 15px; cursor: pointer; }
    .logout { margin-top: 8px; }
  `,
})
export class AccountComponent {
  auth = inject(AuthService);
  points = inject(PointsService);

  loading = signal(true);
  error = signal('');

  constructor() {
    this.load();
  }

  load() {
    this.loading.set(true);
    this.error.set('');
    this.points.load().subscribe({
      next: () => this.loading.set(false),
      error: (err) => {
        this.error.set(errorMessage(err));
        this.loading.set(false);
      },
    });
  }

  signed(amount: number): string {
    return amount > 0 ? `+${amount}` : `−${Math.abs(amount)}`;
  }
}