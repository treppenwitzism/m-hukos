import { Component, computed, inject, signal } from '@angular/core';
import { CurrencyPipe, DatePipe } from '@angular/common';
import { AdminService } from '../../core/admin.service';
import { AdminOrderDetail, AdminOrderRow, AdminOrdersPage, OrderStatus, PaymentMethod } from '../../core/models';
import { errorMessage } from '../../core/http-error';
import { statusName } from '../../core/order-utils';

const PAGE_SIZE = 20;

@Component({
  selector: 'app-admin-orders',
  imports: [CurrencyPipe, DatePipe],
  template: `
    <div class="page">
      <div class="head">
        <h1>Orders</h1>
        <button type="button" class="secondary" [disabled]="loading()" (click)="load()">Refresh</button>
      </div>

      <div class="filters">
        <div class="chips">
          @for (s of statuses; track s ?? 'all') {
            <button type="button" [class.active]="status() === s" (click)="setStatus(s)">
              {{ s ? name(s) : 'All' }}
            </button>
          }
        </div>
        <label class="check">
          <input type="checkbox" [checked]="scheduledOnly()" (change)="setScheduled($any($event.target).checked)" />
          Scheduled orders only
        </label>
      </div>

      @if (error()) {
        <p class="error" role="alert">{{ error() }}</p>
      }

      <div class="cols">
        <section class="table-wrap" aria-label="Orders">
          @if (data(); as d) {
            <div class="scroll">
              <table>
                <thead>
                  <tr>
                    <th>Order</th><th>Customer</th><th>Placed</th><th>Pickup</th>
                    <th>Payment</th><th>Status</th><th class="right">Total</th>
                  </tr>
                </thead>
                <tbody>
                  @for (o of d.orders; track o.id) {
                    <tr [class.selected]="o.id === selectedId()" (click)="select(o)">
                      <td><button type="button" class="link">#{{ o.id }}</button></td>
                      <td>{{ o.customer_name }}</td>
                      <td>{{ o.created_at | date: 'd MMM, h:mm a' }}</td>
                      <td>
                        @if (o.scheduled_for) {
                          {{ o.scheduled_for | date: 'EEE d, h:mm a' }}
                        } @else {
                          ASAP
                        }
                      </td>
                      <td>{{ payment(o.payment_method) }}</td>
                      <td><span [class]="'status s-' + o.status">{{ name(o.status) }}</span></td>
                      <td class="right">{{ o.total | currency: 'PHP' : 'symbol-narrow' : '1.0-2' }}</td>
                    </tr>
                  } @empty {
                    <tr><td colspan="7" class="empty">No orders match these filters.</td></tr>
                  }
                </tbody>
              </table>
            </div>

            @if (d.total > 0) {
              <div class="pager">
                <span>Showing {{ from() }}–{{ to() }} of {{ d.total }}</span>
                <div>
                  <button type="button" class="secondary" [disabled]="page() === 0" (click)="goTo(page() - 1)">Previous</button>
                  <button type="button" class="secondary" [disabled]="to() >= d.total" (click)="goTo(page() + 1)">Next</button>
                </div>
              </div>
            }
          } @else if (loading()) {
            <p class="empty">Loading orders...</p>
          }
        </section>

        @if (selectedId() !== null) {
          <section class="panel" aria-label="Order details">
            @if (detailLoading()) {
              <p class="empty">Loading...</p>
            } @else if (detailError()) {
              <p class="error" role="alert">{{ detailError() }}</p>
            } @else if (detail(); as d) {
              <div class="panel-head">
                <strong class="big">Order #{{ d.order.id }}</strong>
                <span [class]="'status s-' + d.order.status">{{ name(d.order.status) }}</span>
              </div>

              <div class="rows">
                <div><span>Customer</span><strong>{{ d.customer?.name ?? 'Unknown' }}</strong></div>
                @if (d.customer) {
                  <div><span>Email</span><strong>{{ d.customer.email }}</strong></div>
                }
                <div><span>Placed</span><strong>{{ d.order.created_at | date: 'EEE d MMM, h:mm a' }}</strong></div>
                <div>
                  <span>Pickup</span>
                  <strong>
                    @if (d.order.scheduled_for) {
                      {{ d.order.scheduled_for | date: 'EEE d MMM, h:mm a' }}
                    } @else {
                      As soon as possible
                    }
                  </strong>
                </div>
                <div><span>Payment</span><strong>{{ payment(d.order.payment_method ?? null) }}</strong></div>
                @if (d.qr) {
                  <div>
                    <span>QR code</span>
                    <strong>
                      @if (d.qr.redeemed_at) {
                        Used {{ d.qr.redeemed_at | date: 'd MMM, h:mm a' }}
                      } @else {
                        Valid until {{ d.qr.expires_at | date: 'd MMM, h:mm a' }}
                      }
                    </strong>
                  </div>
                }
                @if (d.order.points_earned) {
                  <div><span>Points earned</span><strong>+{{ d.order.points_earned }}</strong></div>
                }
              </div>

              <div class="lines">
                @for (i of d.order.items; track i.id) {
                  <div>
                    <span>{{ i.quantity }} × {{ i.name }}</span>
                    <span>{{ i.line_total | currency: 'PHP' : 'symbol-narrow' : '1.0-2' }}</span>
                  </div>
                }
                <div class="total">
                  <span>Total</span><span>{{ d.order.total | currency: 'PHP' : 'symbol-narrow' : '1.0-2' }}</span>
                </div>
              </div>

              <button type="button" class="secondary" (click)="closeDetail()">Close</button>
            }
          </section>
        }
      </div>
    </div>
  `,
  styles: `
    .page { display: flex; flex-direction: column; gap: 16px; }
    .head { display: flex; flex-wrap: wrap; gap: 12px; justify-content: space-between; align-items: center; }
    h1 { margin: 0; font-size: 24px; }
    .filters { display: flex; flex-wrap: wrap; gap: 12px 24px; align-items: center; }
    .chips { display: flex; gap: 8px; flex-wrap: wrap; }
    .chips button { min-height: 44px; padding: 0 16px; border: 1.5px solid #3d4450; border-radius: 999px;
                    background: #fff; font-size: 14px; cursor: pointer; }
    .chips button.active { background: #1f2328; border-color: #1f2328; color: #fff; font-weight: 600; }
    .check { display: inline-flex; align-items: center; gap: 8px; min-height: 44px; font-size: 14px; cursor: pointer; }
    .check input { width: 20px; height: 20px; }
    .error { color: #b3261e; margin: 0; }
    .cols { display: flex; flex-wrap: wrap; gap: 24px; align-items: flex-start; }
    .table-wrap { flex: 2 1 560px; min-width: 0; border: 1.5px solid #3d4450; border-radius: 8px; padding: 8px 16px; }
    .scroll { overflow-x: auto; }
    table { width: 100%; border-collapse: collapse; font-size: 14px; }
    th { text-align: left; color: #5c6470; font-size: 13px; padding: 8px; border-bottom: 1.5px solid #3d4450; font-weight: 600; white-space: nowrap; }
    td { padding: 10px 8px; border-bottom: 1.5px solid #d5d9e0; white-space: nowrap; }
    tbody tr { cursor: pointer; }
    tbody tr:hover { background: #f4f5f7; }
    tr.selected { background: #e8eefc; }
    tr:last-child td { border-bottom: 0; }
    .right { text-align: right; }
    .link { background: none; border: 0; padding: 0; color: #2b5fd9; font-size: 14px; text-decoration: underline; cursor: pointer; }
    .empty { color: #5c6470; text-align: center; padding: 16px 0; margin: 0; font-size: 14px; }
    .pager { display: flex; flex-wrap: wrap; gap: 8px; justify-content: space-between; align-items: center;
             padding: 12px 0 4px; font-size: 13px; color: #5c6470; }
    .pager div { display: flex; gap: 8px; }
    .panel { flex: 1 1 300px; min-width: 0; border: 1.5px solid #3d4450; border-radius: 8px; padding: 16px;
             display: flex; flex-direction: column; gap: 12px; }
    .panel-head { display: flex; justify-content: space-between; align-items: center; }
    .big { font-size: 18px; }
    .rows, .lines { display: flex; flex-direction: column; gap: 6px; font-size: 14px; }
    .rows > div, .lines > div { display: flex; justify-content: space-between; gap: 12px; }
    .rows span { color: #5c6470; }
    .lines { border-top: 1.5px solid #d5d9e0; padding-top: 12px; font-size: 15px; }
    .lines .total { font-weight: 700; border-top: 1.5px solid #3d4450; padding-top: 8px; }
    .secondary { min-height: 44px; padding: 0 16px; border: 1.5px solid #3d4450; border-radius: 8px; background: #fff; font-size: 14px; cursor: pointer; }
    button:disabled { opacity: 0.5; cursor: default; }
  `,
})
export class AdminOrdersComponent {
  private admin = inject(AdminService);

  readonly name = statusName;
  readonly statuses: (OrderStatus | null)[] = [null, 'pending', 'paid', 'fulfilled', 'cancelled', 'expired'];

  status = signal<OrderStatus | null>(null);
  scheduledOnly = signal(false);
  page = signal(0);

  data = signal<AdminOrdersPage | null>(null);
  loading = signal(true);
  error = signal('');

  selectedId = signal<number | null>(null);
  detail = signal<AdminOrderDetail | null>(null);
  detailLoading = signal(false);
  detailError = signal('');

  from = computed(() => this.page() * PAGE_SIZE + 1);
  to = computed(() => Math.min(this.data()?.total ?? 0, (this.page() + 1) * PAGE_SIZE));

  constructor() {
    this.load();
  }

  payment(method: PaymentMethod | null): string {
    return method === 'counter' ? 'Counter' : method === 'paymongo' ? 'Online' : '–';
  }

  load() {
    this.loading.set(true);
    this.error.set('');
    this.admin
      .listOrders({
        status: this.status(),
        scheduled: this.scheduledOnly(),
        limit: PAGE_SIZE,
        offset: this.page() * PAGE_SIZE,
      })
      .subscribe({
        next: (d) => {
          this.data.set(d);
          this.loading.set(false);
        },
        error: (err) => {
          this.error.set(errorMessage(err));
          this.loading.set(false);
        },
      });
  }

  setStatus(status: OrderStatus | null) {
    this.status.set(status);
    this.page.set(0);
    this.load();
  }

  setScheduled(value: boolean) {
    this.scheduledOnly.set(value);
    this.page.set(0);
    this.load();
  }

  goTo(page: number) {
    this.page.set(Math.max(0, page));
    this.load();
  }

  select(row: AdminOrderRow) {
    this.selectedId.set(row.id);
    this.detail.set(null);
    this.detailError.set('');
    this.detailLoading.set(true);
    this.admin.getOrder(row.id).subscribe({
      next: (d) => {
        if (this.selectedId() !== row.id) return; 
        this.detail.set(d);
        this.detailLoading.set(false);
      },
      error: (err) => {
        this.detailError.set(errorMessage(err));
        this.detailLoading.set(false);
      },
    });
  }

  closeDetail() {
    this.selectedId.set(null);
    this.detail.set(null);
  }
}