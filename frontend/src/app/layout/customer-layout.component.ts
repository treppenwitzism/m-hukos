import { Component, effect, inject, untracked } from '@angular/core';
import { RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { AuthService } from '../core/auth.service';
import { CartService } from '../core/cart.service';
import { RESTAURANT_NAME } from '../core/app-info';
import { PointsService } from '../core/points.service';

@Component({
    selector: 'app-customer-layout',
    imports: [RouterOutlet, RouterLink, RouterLinkActive],
    template: `
    <div class="shell">
      <header>
        <strong>{{ name }}</strong>
        <div class="right">
          @if (auth.user(); as user) {
            @if (points.balance() !== null) {
            <a routerLink="/account" class="pill">{{ points.balance() }} pts</a>
            }
            <button type="button" class="link" (click)="auth.logout()">Log out</button>
          } @else {
            <a routerLink="/login" class="link">Log in</a>
          }
          <a routerLink="/checkout" class="cart">Cart ({{ cart.count() }})</a>
        </div>
      </header>

      <main>
        <router-outlet />
      </main>

      <nav aria-label="Main">
        <a routerLink="/" routerLinkActive="active" [routerLinkActiveOptions]="{ exact: true }">Menu</a>
        <a routerLink="/orders" routerLinkActive="active">Orders</a>
        <a routerLink="/account" routerLinkActive="active">Points</a>
      </nav>
    </div>
  `,
    styles: `
    .shell { max-width: 560px; margin: 0 auto; min-height: 100dvh; display: flex; flex-direction: column;
             font-family: system-ui, sans-serif; color: #1f2328; background: #fff; }
    header { position: sticky; top: 0; z-index: 10; background: #fff; display: flex; align-items: center;
             justify-content: space-between; gap: 8px; min-height: 60px; padding: 0 16px;
             border-bottom: 1.5px solid #3d4450; }
    .right { display: flex; align-items: center; gap: 8px; }
    a.pill { color: inherit; text-decoration: none; }
    .pill { padding: 6px 12px; border: 1.5px solid #3d4450; border-radius: 999px; font-size: 13px; white-space: nowrap; }
    .link { background: none; border: 0; padding: 0 4px; min-height: 44px; font-size: 13px; color: #2b5fd9;
            text-decoration: underline; cursor: pointer; display: inline-flex; align-items: center; }
    .cart { min-height: 44px; padding: 0 14px; border-radius: 8px; background: #2b5fd9; color: #fff;
            font-weight: 600; font-size: 14px; text-decoration: none; display: inline-flex; align-items: center; white-space: nowrap; }
    main { flex: 1; }
    nav { position: sticky; bottom: 0; display: flex; background: #fff; border-top: 1.5px solid #3d4450; }
    nav a { flex: 1; min-height: 60px; display: flex; align-items: center; justify-content: center;
            font-size: 13px; color: #5c6470; text-decoration: none; }
    nav a.active { color: #1f2328; font-weight: 700; }
  `,
})
export class CustomerLayoutComponent {
    auth = inject(AuthService);
    cart = inject(CartService);
    name = RESTAURANT_NAME;
    points = inject(PointsService);

    constructor() {
        effect(() => {
            const loggedIn = this.auth.isLoggedIn();
            untracked(() => (loggedIn ? this.points.refresh() : this.points.reset()));
        });
    }
}