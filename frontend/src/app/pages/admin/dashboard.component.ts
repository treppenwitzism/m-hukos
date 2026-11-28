import { Component, DestroyRef, inject, signal } from '@angular/core';
import { CurrencyPipe, DatePipe } from '@angular/common';
import { AdminService } from '../../core/admin.service';
import { DashboardData } from '../../core/models';
import { errorMessage } from '../../core/http-error';
import { statusName } from '../../core/order-utils';

@Component({
  selector: 'app-admin-dashboard',
  imports: [CurrencyPipe, DatePipe],
  template: `
    <div class="page">
      <div class="head">
        <h1>Dashboard</h1>
        <button type="button" class="secondary" [disabled]="loading()" (click)="load()">Refresh</button>
      </div>

      @if (error()) {
        <p class="error" role="alert">{{ error() }}</p>
      }

      @if (data(); as d) {
        <div class="tiles">
          <div class="tile"><span>Orders today</span><strong>{{ d.orders_today }}</strong></div>
          <div class="tile">
            <span>Sales today</span>
            <strong>{{ d.sales_today | currency: 'PHP' : 'symbol-narrow' : '1.0-2' }}</strong>
          </div>
          <div class="tile"><span>Paid, awaiting pickup</span><strong>{{ d.awaiting_pickup }}</strong></div>
        </div>

        <div class="cols">
          <section class="panel wide" aria-label="Recent orders">
            <strong>Recent orders</strong>
            <div class="scroll">
              <table>
                <thead>
                  <tr><th>Order</th><th>Customer</th><th>Pickup</th><th>Status</th><th class="right">Total</th></tr>
                </thead>
                <tbody>
                  @for (o of d.recent_orders; track o.id) {
                    <tr>
                      <td>#{{ o.id }}</td>
                      <td>{{ o.customer_name }}</td>
                      <td>
                        @if (o.scheduled_for) {
                          {{ o.scheduled_for | date: 'EEE d, h:mm a' }}
                        } @else {
                          ASAP
                        }
                      </td>
                      <td><span [class]="'status s-' + o.status">{{ name(o.status) }}</span></td>
                      <td class="right">{{ o.total | currency: 'PHP' : 'symbol-narrow' : '1.0-2' }}</td>
                    </tr>
                  } @empty {
                    <tr><td colspan="5" class="empty">No orders yet.</td></tr>
                  }
                </tbody>
              </table>
            </div>
          </section>

          <section class="panel" aria-label="Upcoming scheduled pickups">
            <strong>Upcoming scheduled pickups</strong>
            @for (s of d.upcoming_scheduled; track s.id) {
              <div class="sched">
                <div class="sched-text">
                  <strong>{{ s.scheduled_for | date: 'EEE d, h:mm a' }}</strong>
                  <span>{{ s.customer_name }}</span>
                </div>
                <div class="sched-side">
                  <span>#{{ s.id }}</span>
                  <span [class]="'status s-' + s.status">{{ name(s.status) }}</span>
                </div>
              </div>
            } @empty {
              <p class="empty">Nothing scheduled in the next 7 days.</p>
            }
          </section>
        </div>
      } @else if (loading()) {
        <p class="empty">Loading...</p>
      }
    </div>
  `,
  styles: `
    .page { display: flex; flex-direction: column; gap: 24px; }
    .head { display: flex; flex-wrap: wrap; gap: 12px; justify-content: space-between; align-items: center; }
    h1 { margin: 0; font-size: 24px; }
    .secondary { min-height: 44px; padding: 0 16px; border: 1.5px solid #3d4450; border-radius: 8px; background: #fff;
                 font-size: 14px; cursor: pointer; }
    .error { color: #b3261e; margin: 0; }
    .tiles { display: flex; flex-wrap: wrap; gap: 16px; }
    .tile { flex: 1 1 180px; border: 1.5px solid #3d4450; border-radius: 8px; padding: 16px; display: flex;
            flex-direction: column; gap: 4px; }
    .tile span { font-size: 13px; color: #5c6470; }
    .tile strong { font-size: 28px; }
    .cols { display: flex; flex-wrap: wrap; gap: 24px; align-items: flex-start; }
    .panel { flex: 1 1 260px; min-width: 0; border: 1.5px solid #3d4450; border-radius: 8px; padding: 16px;
             display: flex; flex-direction: column; gap: 12px; }
    .panel.wide { flex: 2 1 420px; }
    .scroll { overflow-x: auto; }
    table { width: 100%; border-collapse: collapse; font-size: 14px; }
    th { text-align: left; color: #5c6470; font-size: 13px; padding: 8px; border-bottom: 1.5px solid #3d4450; font-weight: 600; }
    td { padding: 10px 8px; border-bottom: 1.5px solid #d5d9e0; }
    tr:last-child td { border-bottom: 0; }
    .right { text-align: right; }
    .empty { color: #5c6470; font-size: 14px; margin: 0; text-align: center; }
    .sched { display: flex; justify-content: space-between; gap: 12px; border-bottom: 1.5px solid #d5d9e0;
             padding-bottom: 8px; font-size: 14px; }
    .sched:last-child { border-bottom: 0; padding-bottom: 0; }
    .sched-text { display: flex; flex-direction: column; }
    .sched-text span { font-size: 13px; color: #5c6470; }
    .sched-side { display: flex; flex-direction: column; align-items: flex-end; gap: 4px; }
  `,
})
export class AdminDashboardComponent {
  private admin = inject(AdminService);
  private destroyRef = inject(DestroyRef);

  readonly name = statusName;

  data = signal<DashboardData | null>(null);
  loading = signal(true);
  error = signal('');

  constructor() {
    this.load();

    const timer = setInterval(() => this.load(true), 30000);
    this.destroyRef.onDestroy(() => clearInterval(timer));
  }

  load(silent = false) {
    if (!silent) this.loading.set(true);
    this.admin.getDashboard().subscribe({
      next: (d) => {
        this.data.set(d);
        this.error.set('');
        this.loading.set(false);
      },
      error: (err) => {
        if (!silent) this.error.set(errorMessage(err));
        this.loading.set(false);
      },
    });
  }
}