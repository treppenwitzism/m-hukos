import { Component, inject } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { AuthService } from '../core/auth.service';
import { RESTAURANT_NAME } from '../core/app-info';

@Component({
  selector: 'app-staff-layout',
  imports: [RouterOutlet],
  template: `
    <div class="shell">
      <header>
        <strong>{{ name }} · Staff</strong>
        <div class="right">
          <span class="who">{{ auth.user()?.name }}</span>
          <button type="button" (click)="auth.logout()">Log out</button>
        </div>
      </header>
      <router-outlet />
    </div>
  `,
  styles: `
    .shell { min-height: 100dvh; display: flex; flex-direction: column; font-family: system-ui, sans-serif;
             color: #1f2328; background: #fff; }
    header { display: flex; flex-wrap: wrap; gap: 12px; align-items: center; justify-content: space-between;
             padding: 12px 24px; border-bottom: 1.5px solid #3d4450; }
    .right { display: flex; align-items: center; gap: 12px; }
    .who { font-size: 14px; color: #5c6470; }
    button { min-height: 44px; padding: 0 16px; border: 1.5px solid #3d4450; border-radius: 8px; background: #fff;
             font-size: 14px; cursor: pointer; }
  `,
})
export class StaffLayoutComponent {
  auth = inject(AuthService);
  name = RESTAURANT_NAME;
}