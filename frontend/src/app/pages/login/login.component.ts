import { Component, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { AuthService } from '../../core/auth.service';
import { errorMessage } from '../../core/http-error';

@Component({
  selector: 'app-login',
  imports: [ReactiveFormsModule],
  template: `
    <main class="page">
      <h1>Welcome</h1>

      <div class="tabs">
        <button type="button" [class.active]="mode() === 'login'" (click)="setMode('login')">Log in</button>
        <button type="button" [class.active]="mode() === 'register'" (click)="setMode('register')">Register</button>
      </div>

      <form [formGroup]="form" (ngSubmit)="submit()">
        @if (mode() === 'register') {
          <label>Name <input formControlName="name" autocomplete="name" /></label>
        }
        <label>Email <input type="email" formControlName="email" autocomplete="email" /></label>
        <label>
          Password
          <input type="password" formControlName="password"
                 [autocomplete]="mode() === 'login' ? 'current-password' : 'new-password'" />
        </label>
        @if (mode() === 'register') {
          <small>At least 8 characters.</small>
        }

        @if (error()) {
          <p class="error" role="alert">{{ error() }}</p>
        }

        <button type="submit" class="primary" [disabled]="busy()">
          {{ mode() === 'login' ? 'Log in' : 'Create account' }}
        </button>
      </form>
    </main>
  `,
  styles: `
    .page { max-width: 380px; margin: 0 auto; padding: 24px 16px; font-family: system-ui, sans-serif; }
    .tabs { display: flex; gap: 8px; margin-bottom: 16px; }
    .tabs button { flex: 1; min-height: 44px; border: 1.5px solid #3d4450; background: #fff; border-radius: 8px; }
    .tabs button.active { background: #1f2328; color: #fff; }
    form { display: flex; flex-direction: column; gap: 12px; }
    label { display: flex; flex-direction: column; gap: 4px; font-size: 14px; }
    input { min-height: 44px; padding: 0 12px; border: 1.5px solid #3d4450; border-radius: 8px; font-size: 16px; }
    .primary { min-height: 52px; border: 0; border-radius: 8px; background: #2b5fd9; color: #fff; font-weight: 600; font-size: 16px; }
    .primary:disabled { opacity: 0.6; }
    .error { color: #b3261e; margin: 0; }
  `,
})
export class LoginComponent {
  private fb = inject(FormBuilder);
  private auth = inject(AuthService);
  private router = inject(Router);
  private route = inject(ActivatedRoute);

  mode = signal<'login' | 'register'>('login');
  error = signal('');
  busy = signal(false);

  form = this.fb.nonNullable.group({
    name: [''],
    email: ['', [Validators.required, Validators.email]],
    password: ['', [Validators.required, Validators.minLength(8)]],
  });

  setMode(mode: 'login' | 'register') {
    this.mode.set(mode);
    this.error.set('');
  }

  submit() {
    this.error.set('');
    const v = this.form.getRawValue();

    if (this.form.invalid || (this.mode() === 'register' && !v.name.trim())) {
      this.error.set('Please fill in all fields. The password needs at least 8 characters.');
      return;
    }

    this.busy.set(true);
    const request =
      this.mode() === 'login'
        ? this.auth.login({ email: v.email, password: v.password })
        : this.auth.register({ name: v.name, email: v.email, password: v.password });

    request.subscribe({
      next: () => {
        const returnUrl = this.route.snapshot.queryParamMap.get('returnUrl');
        const role = this.auth.role();
        this.router.navigateByUrl(returnUrl || (role === 'staff' ? '/staff' : '/'));
      },
      error: (err) => {
        this.error.set(errorMessage(err));
        this.busy.set(false);
      },
    });
  }
}