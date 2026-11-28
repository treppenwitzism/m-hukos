import { Component, inject } from '@angular/core';
import { RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { AuthService } from '../core/auth.service';
import { RESTAURANT_NAME } from '../core/app-info';

@Component({
  selector: 'app-admin-layout',
  imports: [RouterOutlet, RouterLink, RouterLinkActive],
  template: `
    <div class="shell">
      <nav aria-label="Admin">
        <strong class="brand">{{ name }}</strong>
        <a routerLink="/admin" routerLinkActive="active" [routerLinkActiveOptions]="{ exact: true }">Dashboard</a>
        <a routerLink="/admin/menu" routerLinkActive="active">Menu</a>
        <a routerLink="/admin/orders" routerLinkActive="active">Orders</a>
        <a routerLink="/admin/reviews" routerLinkActive="active">Reviews</a>
        <a routerLink="/admin/users" routerLinkActive="active">Users and points</a>

        <div class="spacer"></div>

        <a routerLink="/staff" class="muted">Staff screen</a>
        <a routerLink="/" class="muted">View the site</a>
        <button type="button" class="muted" (click)="auth.logout()">Log out</button>
        <span class="who">Signed in as {{ auth.user()?.name }}</span>
      </nav>

      <main>
        <router-outlet />
      </main>
    </div>
  `,
  styles: `
    .shell { display: flex; flex-wrap: wrap; min-height: 100dvh; font-family: system-ui, sans-serif;
             color: #1f2328; background: #fff; }
    nav { flex: 0 0 220px; box-sizing: border-box; padding: 20px 16px; border-right: 1.5px solid #3d4450;
          background: #f4f5f7; display: flex; flex-direction: column; gap: 6px; }
    .brand { font-size: 16px; padding: 0 8px 12px; }
    nav a, nav button { min-height: 44px; display: flex; align-items: center; padding: 0 12px; border-radius: 8px;
                        font-size: 14px; color: #1f2328; text-decoration: none; background: none; border: 0;
                        cursor: pointer; text-align: left; font-family: inherit; }
    nav a.active { background: #1f2328; color: #fff; font-weight: 600; }
    nav .muted { color: #5c6470; }
    .spacer { flex: 1; min-height: 16px; }
    .who { font-size: 12px; color: #5c6470; padding: 8px 12px 0; }
    main { flex: 999 1 560px; min-width: 0; box-sizing: border-box; padding: 24px; }

    @media (max-width: 800px) {
      nav { flex-basis: 100%; flex-direction: row; flex-wrap: wrap; border-right: 0;
            border-bottom: 1.5px solid #3d4450; padding: 12px; }
      .brand { width: 100%; padding-bottom: 4px; }
      .spacer, .who { display: none; }
    }
  `,
})
export class AdminLayoutComponent {
  auth = inject(AuthService);
  name = RESTAURANT_NAME;
}