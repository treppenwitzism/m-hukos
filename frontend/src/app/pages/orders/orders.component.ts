import { Component, inject, signal } from '@angular/core';
import { CurrencyPipe, DatePipe } from '@angular/common';
import { RouterLink } from '@angular/router';
import { OrderService } from '../../core/order.service';
import { Order } from '../../core/models';
import { errorMessage } from '../../core/http-error';
import { hasQr, itemsSummary, statusLabel } from '../../core/order-utils';

@Component({
  selector: 'app-orders',
  imports: [RouterLink, CurrencyPipe, DatePipe],
  template: `
    <div class="page">
      <h1>My orders</h1>

      @if (actionError()) {
        <p class="error" role="alert">{{ actionError() }}</p>
      }

      @if (loading()) {
        <p class="note">Loading your orders...</p>
      } @else if (error()) {
        <p class="error" role="alert">{{ error() }}</p>
        <button type="button" class="secondary" (click)="load()">Try again</button>
      } @else if (orders().length === 0) {
        <p class="note">You have no orders yet.</p>
        <a routerLink="/" class="primary">Browse the menu</a>
      } @else {
        @for (o of orders(); track o.id) {
          <article class="card" [class.off]="o.status === 'cancelled' || o.status === 'expired'">
            <div class="top">
              <a [routerLink]="['/orders', o.id]" class="title"><strong>Order #{{ o.id }}</strong></a>
              <span [class]="'status s-' + o.status">{{ label(o) }}</span>
            </div>
            <span class="meta">
              {{ o.created_at | date: 'EEE d MMM, h:mm a' }} ·
              @if (o.scheduled_for) {
                Scheduled for {{ o.scheduled_for | date: 'EEE d MMM, h:mm a' }}
              } @else {
                Pickup as soon as possible
              }
            </span>
            <span class="items">{{ summary(o) }}</span>
            <div class="bottom">
              <strong>{{ o.total | currency: 'PHP' : 'symbol-narrow' : '1.0-2' }}</strong>
              <div class="btns">
                @if (has(o)) {
                  <a [routerLink]="['/orders', o.id]" class="btn primary-sm">Show QR code</a>
                }
                @if (o.status === 'fulfilled') {
                  <a [routerLink]="['/orders', o.id]" class="btn secondary-sm">Review items</a>
                }
                @if (o.status === 'pending') {
                  <button type="button" class="btn secondary-sm" [disabled]="busyId() === o.id" (click)="cancel(o)">
                    Cancel
                  </button>
                  @if (o.payment_method !== 'counter') {
                    <button type="button" class="btn primary-sm" disabled title="Online payment is coming soon">
                      Pay now
                    </button>
                  }
                }
              </div>
            </div>
          </article>
        }
      }
    </div>
  `,
  styles: `
    .page { padding: 16px; display: flex; flex-direction: column; gap: 12px; }
    h1 { margin: 0; font-size: 20px; }
    .note { text-align: center; color: #5c6470; margin: 24px 0 0; }
    .error { color: #b3261e; margin: 0; }
    .card { border: 1.5px solid #3d4450; border-radius: 8px; padding: 12px; display: flex; flex-direction: column; gap: 8px; }
    .card.off { background: #f4f5f7; border-color: #8a93a1; color: #5c6470; }
    .top { display: flex; justify-content: space-between; align-items: center; }
    .title { color: inherit; text-decoration: none; font-size: 15px; }
    .meta { font-size: 13px; color: #5c6470; }
    .items { font-size: 14px; }
    .bottom { display: flex; justify-content: space-between; align-items: center; gap: 8px; }
    .btns { display: flex; gap: 8px; flex-wrap: wrap; justify-content: flex-end; }
    .btn { min-height: 44px; padding: 0 14px; border-radius: 8px; font-size: 14px; cursor: pointer;
           display: inline-flex; align-items: center; text-decoration: none; }
    .primary-sm { border: 0; background: #2b5fd9; color: #fff; font-weight: 600; }
    .secondary-sm { border: 1.5px solid #3d4450; background: #fff; color: #1f2328; }
    .btn:disabled { opacity: 0.5; cursor: default; }
    .primary { min-height: 52px; border-radius: 8px; background: #2b5fd9; color: #fff; font-weight: 600;
               display: flex; align-items: center; justify-content: center; text-decoration: none; }
    .secondary { min-height: 48px; border: 1.5px solid #3d4450; border-radius: 8px; background: #fff; cursor: pointer; }
  `,
})
export class OrdersComponent {
  private orderService = inject(OrderService);

  readonly label = statusLabel;
  readonly has = hasQr;
  readonly summary = itemsSummary;

  orders = signal<Order[]>([]);
  loading = signal(true);
  error = signal('');
  actionError = signal('');
  busyId = signal<number | null>(null);

  constructor() {
    this.load();
  }

  load() {
    this.loading.set(true);
    this.error.set('');
    this.orderService.list().subscribe({
      next: (orders) => {
        this.orders.set([...orders].sort((a, b) => b.id - a.id)); 
        this.loading.set(false);
      },
      error: (err) => {
        this.error.set(errorMessage(err));
        this.loading.set(false);
      },
    });
  }

  cancel(order: Order) {
    if (!confirm(`Cancel order #${order.id}?`)) return;
    this.actionError.set('');
    this.busyId.set(order.id);
    this.orderService.cancel(order.id).subscribe({
      next: (updated) => {
        this.orders.update((list) => list.map((o) => (o.id === updated.id ? updated : o)));
        this.busyId.set(null);
      },
      error: (err) => {
        this.actionError.set(errorMessage(err));
        this.busyId.set(null);
        this.load();
      },
    });
  }
}