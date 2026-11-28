import { Component, DestroyRef, inject, signal } from '@angular/core';
import { CurrencyPipe, DatePipe } from '@angular/common';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { toDataURL } from 'qrcode';
import { OrderService } from '../../core/order.service';
import { Order, OrderQr } from '../../core/models';
import { errorMessage } from '../../core/http-error';
import { hasQr, statusLabel } from '../../core/order-utils';

@Component({
  selector: 'app-order-detail',
  imports: [RouterLink, CurrencyPipe, DatePipe],
  template: `
    <div class="page">
      <a routerLink="/orders" class="back">&lt; My orders</a>

      @if (loading()) {
        <p class="note">Loading...</p>
      } @else if (error()) {
        <p class="note error" role="alert">{{ error() }}</p>
      } @else if (order(); as o) {
        <div class="head">
          <h1>Order #{{ o.id }}</h1>
          <span [class]="'status s-' + o.status">{{ label(o) }}</span>
        </div>

        @if (has(o)) {
          <section class="qr-block">
            <strong>Show this code at the counter</strong>
            <span class="sub">Staff will scan it to hand over your order.</span>
            @if (o.status === 'pending') {
              <div class="due">
                Pay {{ o.total | currency: 'PHP' : 'symbol-narrow' : '1.0-2' }} at the counter when you collect.
              </div>
            }
            <div class="qr-frame">
              @if (qrImage()) {
                <img [src]="qrImage()" [alt]="'QR code for order ' + o.id" width="240" height="240" />
              } @else if (qrError()) {
                <span class="error">{{ qrError() }}</span>
              } @else {
                <span class="sub">Preparing your code...</span>
              }
            </div>
          </section>
        } @else if (o.status === 'fulfilled') {
          <p class="msg">This order was collected. Thank you!</p>
        } @else if (o.status === 'cancelled') {
          <p class="msg">This order was cancelled.</p>
        } @else if (o.status === 'expired') {
          <p class="msg">This order expired because it was not paid in time.</p>
        } @else {
          <p class="msg">Waiting for online payment.</p>
        }

        <section class="info">
          <div>
            <span>Pickup</span>
            <strong>
              @if (o.scheduled_for) {
                {{ o.scheduled_for | date: 'EEE d MMM, h:mm a' }}
              } @else {
                As soon as possible
              }
            </strong>
          </div>
          @if (has(o) && qr(); as code) {
            <div><span>Valid until</span><strong>{{ code.expires_at | date: 'EEE d MMM, h:mm a' }}</strong></div>
          }
          @if (o.points_earned) {
            <div><span>Points earned</span><strong>+{{ o.points_earned }}</strong></div>
          }
        </section>

        <details class="summary" open>
          <summary>Order summary</summary>
          <div class="lines">
            @for (i of o.items; track i.id) {
              <div class="line">
                <span>{{ i.quantity }} × {{ i.name }}</span>
                <span>{{ i.line_total | currency: 'PHP' : 'symbol-narrow' : '1.0-2' }}</span>
                @if (o.status === 'fulfilled') {
                  <a [routerLink]="['/item', i.menu_item_id]" class="review">Review</a>
                }
              </div>
            }
            <div class="line total">
              <span>Total</span><span>{{ o.total | currency: 'PHP' : 'symbol-narrow' : '1.0-2' }}</span>
            </div>
          </div>
        </details>

        <footer class="actions">
          <a routerLink="/orders" class="secondary">View my orders</a>
          <a routerLink="/" class="plain">Back to the menu</a>
        </footer>
      }
    </div>
  `,
  styles: `
    .page { padding: 0 16px 16px; display: flex; flex-direction: column; gap: 16px; }
    .back { display: inline-flex; align-items: center; min-height: 44px; font-size: 15px; }
    .note { text-align: center; color: #5c6470; margin: 24px 0; }
    .error { color: #b3261e; }
    .head { display: flex; justify-content: space-between; align-items: center; }
    h1 { margin: 0; font-size: 20px; }
    .qr-block { display: flex; flex-direction: column; align-items: center; gap: 8px; text-align: center; }
    .sub { font-size: 14px; color: #5c6470; }
    .due { padding: 10px 12px; border: 1.5px dashed #3d4450; border-radius: 8px; font-weight: 600; font-size: 14px; }
    .qr-frame { width: 264px; height: 264px; border: 1.5px solid #3d4450; border-radius: 8px; background: #fff;
                display: flex; align-items: center; justify-content: center; }
    .msg { margin: 0; padding: 16px; border: 1.5px dashed #3d4450; border-radius: 8px; text-align: center; }
    .info { border: 1.5px solid #3d4450; border-radius: 8px; padding: 12px; display: flex; flex-direction: column; gap: 8px; font-size: 14px; }
    .info > div { display: flex; justify-content: space-between; gap: 12px; }
    .info span { color: #5c6470; }
    .summary { border: 1.5px solid #3d4450; border-radius: 8px; padding: 0 12px; }
    summary { min-height: 44px; display: flex; align-items: center; font-size: 14px; font-weight: 600; cursor: pointer; }
    .lines { padding-bottom: 12px; display: flex; flex-direction: column; gap: 6px; font-size: 14px; }
    .line { display: flex; justify-content: space-between; gap: 12px; align-items: center; }
    .line span:first-child { flex: 1; }
    .line.total { font-weight: 700; border-top: 1.5px solid #3d4450; padding-top: 6px; }
    .review { font-size: 13px; }
    .actions { display: flex; flex-direction: column; gap: 8px; }
    .secondary { min-height: 48px; border: 1.5px solid #3d4450; border-radius: 8px; color: #1f2328; font-weight: 600;
                 display: flex; align-items: center; justify-content: center; text-decoration: none; }
    .plain { min-height: 44px; display: flex; align-items: center; justify-content: center; font-size: 14px; }
  `,
})
export class OrderDetailComponent {
  private route = inject(ActivatedRoute);
  private orderService = inject(OrderService);
  private destroyRef = inject(DestroyRef);

  private id = Number(this.route.snapshot.paramMap.get('id'));

  readonly label = statusLabel;
  readonly has = hasQr;

  order = signal<Order | null>(null);
  qr = signal<OrderQr | null>(null);
  qrImage = signal('');
  qrError = signal('');
  loading = signal(true);
  error = signal('');

  constructor() {
    this.load();

    const timer = setInterval(() => this.refresh(), 8000);
    this.destroyRef.onDestroy(() => clearInterval(timer));
  }

  private load() {
    this.orderService.get(this.id).subscribe({
      next: (order) => {
        this.order.set(order);
        this.loading.set(false);
        this.loadQr(order);
      },
      error: (err) => {
        this.error.set(errorMessage(err));
        this.loading.set(false);
      },
    });
  }

  private refresh() {
    const current = this.order();
    if (!current || !hasQr(current)) return;
    this.orderService.get(this.id).subscribe({
      next: (updated) => {
        this.order.set(updated);
        if (!hasQr(updated)) this.qrImage.set('');
      },
      error: () => {},
    });
  }

  private loadQr(order: Order) {
    if (!hasQr(order) || this.qrImage()) return;
    this.orderService.qr(this.id).subscribe({
      next: async (qr) => {
        this.qr.set(qr);
        this.qrImage.set(await toDataURL(qr.url, { width: 240, margin: 1 }));
      },
      error: (err) => this.qrError.set(errorMessage(err)),
    });
  }
}