import { Component, computed, inject, signal } from '@angular/core';
import { CurrencyPipe, DatePipe } from '@angular/common';
import { Router, RouterLink } from '@angular/router';
import { CartService, MAX_QUANTITY } from '../../core/cart.service';
import { MenuService } from '../../core/menu.service';
import { OrderService, CreateOrderBody } from '../../core/order.service';
import { PaymentMethod } from '../../core/models';
import { errorMessage } from '../../core/http-error';
import { environment } from '../../../environments/environment';

@Component({
    selector: 'app-checkout',
    imports: [RouterLink, CurrencyPipe, DatePipe],
    template: `
    <div class="page">
        <h1>Review order</h1>

        @if (menuError()) {
          <p class="error" role="alert">{{ menuError() }}</p>
          <button type="button" class="secondary" (click)="loadMenu()">Try again</button>
        } @else if (cart.lines().length === 0) {
          <p class="note">Your cart is empty.</p>
          <a routerLink="/" class="primary">Browse the menu</a>
        } @else {
          <section class="lines" aria-label="Items">
            @for (line of cart.lines(); track line.id) {
              <div class="line" [class.bad]="isProblem(line.id)">
                <div class="line-info">
                  <strong>{{ line.name }}</strong>
                  @if (isProblem(line.id)) {
                    <span class="warn">No longer available. Remove it to continue.</span>
                  }
                </div>
                <div class="stepper">
                  <button type="button" [attr.aria-label]="'Remove one ' + line.name"
                          (click)="cart.setQuantity(line.id, line.quantity - 1)">−</button>
                  <span>{{ line.quantity }}</span>
                  <button type="button" [attr.aria-label]="'Add one ' + line.name"
                          [disabled]="line.quantity >= maxQuantity"
                          (click)="cart.setQuantity(line.id, line.quantity + 1)">+</button>
                </div>
                <span class="price">{{ line.price * line.quantity | currency: 'PHP' : 'symbol-narrow' : '1.0-2' }}</span>
              </div>
            }
          </section>

          <fieldset class="box">
            <legend>Pickup time</legend>
            <label class="radio">
              <input type="radio" name="pickup" [checked]="pickup() === 'asap'" (change)="setPickup('asap')" />
              As soon as possible
            </label>
            <label class="radio">
              <input type="radio" name="pickup" [checked]="pickup() === 'later'"
                     [disabled]="!onlineEnabled" (change)="setPickup('later')" />
              Schedule for later
            </label>

            @if (pickup() === 'later') {
              <div class="when">
                <input type="date" [min]="today" [value]="date()" aria-label="Pickup date"
                       (change)="onDate($any($event.target).value)" />
                <select aria-label="Pickup time" [disabled]="slotsLoading() || slots().length === 0"
                        (change)="slot.set($any($event.target).value)">
                  <option value="" [selected]="slot() === ''">Choose a time</option>
                  @for (s of slots(); track s) {
                    <option [value]="s" [selected]="s === slot()">{{ s | date: 'h:mm a' }}</option>
                  }
                </select>
              </div>
              @if (slotsLoading()) {
                <span class="hint">Loading times...</span>
              } @else if (slotsError()) {
                <span class="hint error">{{ slotsError() }}</span>
              } @else if (date() && slots().length === 0) {
                <span class="hint">No pickup times available on this date.</span>
              }
            }

            @if (!onlineEnabled) {
              <span class="hint">Scheduled orders need online payment, which is coming soon.</span>
            } @else {
              <span class="hint">Scheduled orders must be paid online with PayMongo.</span>
            }
          </fieldset>

          <section class="totals" aria-label="Totals">
            <div><span>Subtotal</span><span>{{ cart.subtotal() | currency: 'PHP' : 'symbol-narrow' : '1.0-2' }}</span></div>
            <div class="grand">
              <span>Total</span><span>{{ cart.subtotal() | currency: 'PHP' : 'symbol-narrow' : '1.0-2' }}</span>
            </div>
            @if (pointsPreview() > 0) {
              <span class="reward">You will earn {{ pointsPreview() }} points once this order is paid.</span>
            }
          </section>

          @if (error()) {
            <p class="error" role="alert">{{ error() }}</p>
          }

          <footer class="actions">
            <button type="button" class="primary" [disabled]="!canOrder() || isScheduled()" (click)="place('counter')">
              Pay at the counter
            </button>
            <button type="button" class="secondary" [disabled]="!canOrder() || !onlineEnabled" (click)="place('paymongo')">
              Pay online with PayMongo
            </button>
            <span class="hint center">
              @if (onlineEnabled) {
                Pay online by card or e-wallet on PayMongo's page.
              } @else {
                Online payment is coming soon.
              }
            </span>
          </footer>
        }
    </div>
  `,
    styles: `
    .page { padding: 16px; display: flex; flex-direction: column; gap: 16px; }
    h1 { margin: 0; font-size: 20px; }
    .note { text-align: center; color: #5c6470; margin: 24px 0 0; }
    .error { color: #b3261e; margin: 0; }
    .hint { font-size: 12px; color: #5c6470; }
    .hint.error { color: #b3261e; }
    .hint.center { text-align: center; }
    .lines { display: flex; flex-direction: column; gap: 8px; }
    .line { display: flex; align-items: center; gap: 12px; border-bottom: 1.5px solid #d5d9e0; padding-bottom: 8px; }
    .line.bad { background: #fdecea; }
    .line-info { flex: 1; min-width: 0; display: flex; flex-direction: column; gap: 2px; font-size: 15px; }
    .warn { font-size: 12px; color: #b3261e; }
    .price { width: 72px; text-align: right; font-size: 15px; }
    .stepper { display: flex; align-items: center; border: 1.5px solid #3d4450; border-radius: 8px; }
    .stepper button { width: 44px; height: 44px; border: 0; background: #fff; font-size: 18px; cursor: pointer; border-radius: 8px; }
    .stepper button:disabled { color: #c5cad3; cursor: default; }
    .stepper span { min-width: 24px; text-align: center; font-weight: 600; }
    .box { margin: 0; padding: 12px; border: 1.5px solid #3d4450; border-radius: 8px; display: flex; flex-direction: column; gap: 8px; }
    legend { padding: 0 6px; font-weight: 600; font-size: 14px; }
    .radio { display: flex; align-items: center; gap: 10px; min-height: 44px; font-size: 15px; }
    .radio input { width: 20px; height: 20px; }
    .when { display: flex; gap: 8px; }
    .when input, .when select { flex: 1; min-width: 0; height: 44px; padding: 0 10px; border: 1.5px solid #3d4450;
                                border-radius: 8px; font-size: 14px; background: #fff; }
    .totals { display: flex; flex-direction: column; gap: 6px; font-size: 14px; }
    .totals > div { display: flex; justify-content: space-between; }
    .grand { font-size: 17px; font-weight: 700; border-top: 1.5px solid #3d4450; padding-top: 8px; }
    .reward { font-size: 13px; color: #1a7f37; font-weight: 600; }
    .actions { display: flex; flex-direction: column; gap: 8px; }
    .primary { min-height: 52px; border: 0; border-radius: 8px; background: #2b5fd9; color: #fff; font-weight: 600;
               font-size: 16px; cursor: pointer; display: inline-flex; align-items: center; justify-content: center;
               text-decoration: none; }
    .secondary { min-height: 48px; border: 1.5px solid #3d4450; border-radius: 8px; background: #fff; font-weight: 600;
                 font-size: 15px; cursor: pointer; }
    button:disabled { opacity: 0.5; cursor: default; }
  `,
})
export class CheckoutComponent {
    cart = inject(CartService);
    private menuService = inject(MenuService);
    private orderService = inject(OrderService);
    private router = inject(Router);

    readonly onlineEnabled = environment.onlinePaymentsEnabled;
    readonly maxQuantity = MAX_QUANTITY;
    readonly today = new Date().toLocaleDateString('en-CA'); // YYYY-MM-DD local time

    menuLoaded = signal(false);
    menuError = signal('');
    availableIds = signal<Set<number>>(new Set());

    pickup = signal<'asap' | 'later'>('asap');
    date = signal('');
    slots = signal<string[]>([]);
    slot = signal('');
    slotsLoading = signal(false);
    slotsError = signal('');

    submitting = signal(false);
    error = signal('');

    isScheduled = computed(() => this.pickup() === 'later');

    problemIds = computed(() =>
        this.menuLoaded()
            ? new Set(this.cart.lines().filter((l) => !this.availableIds().has(l.id)).map((l) => l.id))
            : new Set<number>()
    );

    pointsPreview = computed(() =>
        this.cart.lines().reduce((sum, l) => sum + l.points_reward * l.quantity, 0)
    );

    canOrder = computed(
        () =>
            this.menuLoaded() &&
            this.cart.lines().length > 0 &&
            this.problemIds().size === 0 &&
            (!this.isScheduled() || !!this.slot()) &&
            !this.submitting()
    );

    constructor() {
        this.loadMenu();
    }

    isProblem(id: number): boolean {
        return this.problemIds().has(id);
    }

    loadMenu() {
        this.menuError.set('');
        this.menuService.getMenu().subscribe({
            next: (categories) => {
                const items = categories.flatMap((c) => c.items);
                this.cart.syncWithMenu(items);
                this.availableIds.set(new Set(items.filter((i) => i.is_available).map((i) => i.id)));
                this.menuLoaded.set(true);
            },
            error: (err) => this.menuError.set(errorMessage(err)),
        });
    }

    setPickup(mode: 'asap' | 'later') {
        this.pickup.set(mode);
        this.error.set('');
        if (mode === 'later' && !this.date()) {
            this.date.set(this.today);
            this.loadSlots();
        }
    }

    onDate(value: string) {
        this.date.set(value);
        this.loadSlots();
    }

    loadSlots() {
        const date = this.date();
        if (!date) return;
        this.slot.set('');
        this.slots.set([]);
        this.slotsError.set('');
        this.slotsLoading.set(true);
        this.orderService.pickupSlots(date).subscribe({
            next: (res) => {
                if (this.date() !== date) return;
                this.slots.set(res.slots);
                this.slotsLoading.set(false);
            },
            error: (err) => {
                this.slotsError.set(errorMessage(err));
                this.slotsLoading.set(false);
            },
        });
    }

    place(method: PaymentMethod) {
        if (!this.canOrder()) return;
        this.submitting.set(true);
        this.error.set('');

        const body: CreateOrderBody = {
            items: this.cart.lines().map((l) => ({ menu_item_id: l.id, quantity: l.quantity })),
            payment_method: method,
            ...(this.isScheduled() ? { scheduled_for: this.slot() } : {}),
        };

        this.orderService.createOrder(body).subscribe({
            next: (res) => {
                this.cart.clear();
                this.submitting.set(false);
                this.router.navigate(['/orders', res.order.id]);
            },
            error: (err) => {
                this.error.set(errorMessage(err));
                this.submitting.set(false);
            },
        });
    }
}