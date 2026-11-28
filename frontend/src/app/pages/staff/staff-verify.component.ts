import { Component, DestroyRef, ElementRef, inject, signal, viewChild } from '@angular/core';
import { CurrencyPipe, DatePipe } from '@angular/common';
import { ActivatedRoute } from '@angular/router';
import jsQR from 'jsqr';
import { StaffService } from '../../core/staff.service';
import { Order, StaffLookup } from '../../core/models';
import { errorMessage } from '../../core/http-error';

function extractToken(text: string): string | null {
  const match = text.match(/[a-f0-9]{48}/i);
  return match ? match[0].toLowerCase() : null;
}

@Component({
  selector: 'app-staff-verify',
  imports: [CurrencyPipe, DatePipe],
  template: `
    <main class="page">
      <section class="scanner" aria-label="Scanner">
        <h1>Scan a QR code</h1>

        <div class="camera">
          <video #video playsinline muted [class.off]="!scanning()"></video>
          @if (!scanning()) {
            <span class="camera-off">Camera is off</span>
          }
        </div>

        @if (cameraError()) {
          <p class="error" role="alert">{{ cameraError() }}</p>
        }

        <p class="help">
          Point the camera at the customer's QR code. A code scanned with a phone's own camera opens this page directly.
        </p>

        @if (scanning()) {
          <button type="button" class="secondary" (click)="stopCamera()">Stop camera</button>
        } @else {
          <button type="button" class="primary" (click)="startCamera()">
            {{ result() || handedOver() || problem() ? 'Scan next code' : 'Start camera' }}
          </button>
        }

        <form class="manual" (submit)="$event.preventDefault(); useManual(code.value); code.value = ''">
          <input #code placeholder="Or paste the code or link" aria-label="Code or link" />
          <button type="submit" class="secondary">Look up</button>
        </form>
      </section>

      <section class="output" aria-label="Scan result">
        @if (loading()) {
          <p class="note">Looking up the order...</p>
        } @else if (handedOver(); as done) {
          <div class="banner ok" role="status">
            <strong>Order #{{ done.id }} handed over.</strong>
            <span>This code cannot be used again.</span>
          </div>
        } @else if (problem()) {
          <div class="banner bad" role="alert">{{ problem() }}</div>
        } @else if (result(); as r) {
          @switch (r.state) {
            @case ('ready') {
              <div class="card">
                <div class="top">
                  <strong class="big">Order #{{ r.order.id }}</strong>
                  <span class="pill">{{ r.payment_due ? 'Payment due' : 'Ready for pickup' }}</span>
                </div>
                <div class="rows">
                  <div><span>Customer</span><strong>{{ r.customer.name }}</strong></div>
                  <div>
                    <span>Pickup</span>
                    <strong>
                      @if (r.order.scheduled_for) {
                        {{ r.order.scheduled_for | date: 'EEE d MMM, h:mm a' }}
                      } @else {
                        As soon as possible
                      }
                    </strong>
                  </div>
                  <div><span>Code valid until</span><strong>{{ r.expires_at | date: 'EEE d MMM, h:mm a' }}</strong></div>
                </div>
                <div class="lines">
                  @for (i of r.order.items; track i.id) {
                    <div><span>{{ i.quantity }} × {{ i.name }}</span>
                      <span>{{ i.line_total | currency: 'PHP' : 'symbol-narrow' : '1.0-2' }}</span></div>
                  }
                  <div class="total">
                    <span>{{ r.payment_due ? 'Total to collect' : 'Total (paid)' }}</span>
                    <span>{{ r.order.total | currency: 'PHP' : 'symbol-narrow' : '1.0-2' }}</span>
                  </div>
                </div>
                @if (redeemError()) {
                  <p class="error" role="alert">{{ redeemError() }}</p>
                }
                <button type="button" class="confirm" [disabled]="redeeming()" (click)="redeem()">
                  @if (r.payment_due) {
                    Collect {{ r.amount_due | currency: 'PHP' : 'symbol-narrow' : '1.0-2' }} and hand over
                  } @else {
                    Confirm handover
                  }
                </button>
              </div>
            }
            @case ('redeemed') {
              <div class="banner bad">
                Already handed over
                @if (r.redeemed_at) { at {{ r.redeemed_at | date: 'h:mm a' }} }.
                This code cannot be used again.
              </div>
            }
            @case ('expired') {
              <div class="banner bad">This QR code has expired.</div>
            }
            @case ('cancelled') {
              <div class="banner bad">This order was cancelled. Do not hand anything over.</div>
            }
          }
        } @else {
          <p class="note">Scan a code to see the order here.</p>
        }
      </section>
    </main>
  `,
  styles: `
    .page { flex: 1; width: 100%; max-width: 1100px; margin: 0 auto; box-sizing: border-box; padding: 24px;
            display: flex; flex-wrap: wrap; gap: 24px; align-items: flex-start; }
    .scanner { flex: 1 1 360px; min-width: 0; display: flex; flex-direction: column; gap: 12px; }
    .output { flex: 1 1 420px; min-width: 0; display: flex; flex-direction: column; gap: 16px; }
    h1 { margin: 0; font-size: 20px; }
    .camera { position: relative; min-height: 320px; border: 1.5px dashed #8a93a1; border-radius: 8px; background: #e4e7ec;
              display: flex; align-items: center; justify-content: center; overflow: hidden; }
    video { width: 100%; max-height: 420px; object-fit: cover; }
    video.off { display: none; }
    .camera-off { font-size: 14px; color: #5c6470; }
    .help { margin: 0; font-size: 14px; line-height: 1.5; color: #5c6470; }
    .manual { display: flex; gap: 8px; }
    .manual input { flex: 1; min-width: 0; height: 44px; padding: 0 12px; border: 1.5px solid #3d4450; border-radius: 8px; font-size: 14px; }
    .primary { min-height: 48px; border: 0; border-radius: 8px; background: #2b5fd9; color: #fff; font-weight: 600; font-size: 15px; cursor: pointer; }
    .secondary { min-height: 44px; padding: 0 16px; border: 1.5px solid #3d4450; border-radius: 8px; background: #fff; font-weight: 600; font-size: 14px; cursor: pointer; }
    .note { color: #5c6470; margin: 0; }
    .error { color: #b3261e; margin: 0; font-size: 14px; }
    .banner { border: 1.5px dashed #3d4450; border-radius: 8px; padding: 14px; font-size: 15px; display: flex; flex-direction: column; gap: 4px; }
    .banner.ok { border-style: solid; border-color: #1a7f37; background: #e6f4ea; color: #1a7f37; }
    .banner.bad { background: #fdecea; border-color: #b3261e; color: #b3261e; }
    .card { border: 1.5px solid #3d4450; border-radius: 8px; padding: 16px; display: flex; flex-direction: column; gap: 12px; }
    .top { display: flex; justify-content: space-between; align-items: center; }
    .big { font-size: 18px; }
    .pill { padding: 6px 12px; border: 1.5px solid #3d4450; border-radius: 999px; font-size: 13px; font-weight: 600; }
    .rows, .lines { display: flex; flex-direction: column; gap: 6px; font-size: 14px; }
    .rows > div, .lines > div { display: flex; justify-content: space-between; gap: 12px; }
    .rows span { color: #5c6470; }
    .lines { border-top: 1.5px solid #d5d9e0; padding-top: 12px; font-size: 15px; }
    .lines .total { font-weight: 700; border-top: 1.5px solid #3d4450; padding-top: 8px; }
    .confirm { min-height: 56px; border: 0; border-radius: 8px; background: #2b5fd9; color: #fff; font-weight: 600; font-size: 17px; cursor: pointer; }
    .confirm:disabled { opacity: 0.6; cursor: default; }
  `,
})
export class StaffVerifyComponent {
  private route = inject(ActivatedRoute);
  private staff = inject(StaffService);
  private destroyRef = inject(DestroyRef);

  private video = viewChild.required<ElementRef<HTMLVideoElement>>('video');

  token = signal('');
  result = signal<StaffLookup | null>(null);
  loading = signal(false);
  problem = signal('');
  handedOver = signal<Order | null>(null);
  redeeming = signal(false);
  redeemError = signal('');

  scanning = signal(false);
  cameraError = signal('');

  private stream: MediaStream | null = null;
  private timer: number | undefined;
  private canvas = document.createElement('canvas');

  constructor() {
    const fromUrl = this.route.snapshot.paramMap.get('token');
    if (fromUrl) this.lookup(fromUrl);

    this.destroyRef.onDestroy(() => this.stopCamera());
  }

  async startCamera() {
    this.cameraError.set('');
    this.clearResult();
    try {
      this.stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'environment' } });
      const video = this.video().nativeElement;
      video.srcObject = this.stream;
      await video.play();
      this.scanning.set(true);
      this.tick();
    } catch {
      this.stopCamera();
      this.cameraError.set(
        'Could not start the camera. Allow camera access in the browser (it only works on https or localhost), or paste the code below.'
      );
    }
  }

  stopCamera() {
    clearTimeout(this.timer);
    this.stream?.getTracks().forEach((t) => t.stop());
    this.stream = null;
    this.scanning.set(false);
  }

  private tick = () => {
    if (!this.scanning()) return;
    const video = this.video().nativeElement;

    if (video.readyState === video.HAVE_ENOUGH_DATA && video.videoWidth > 0) {
      const scale = Math.min(1, 640 / video.videoWidth); 
      this.canvas.width = Math.round(video.videoWidth * scale);
      this.canvas.height = Math.round(video.videoHeight * scale);
      const ctx = this.canvas.getContext('2d', { willReadFrequently: true })!;
      ctx.drawImage(video, 0, 0, this.canvas.width, this.canvas.height);
      const image = ctx.getImageData(0, 0, this.canvas.width, this.canvas.height);
      const code = jsQR(image.data, image.width, image.height);

      const token = code ? extractToken(code.data) : null;
      if (token) {
        this.lookup(token);
        return;
      }
    }
    this.timer = window.setTimeout(this.tick, 150);
  };

  useManual(text: string) {
    const token = extractToken(text);
    if (!token) {
      this.clearResult();
      this.problem.set('That does not look like a valid code. Paste the full link or the 48-character code.');
      return;
    }
    this.lookup(token);
  }

  private clearResult() {
    this.result.set(null);
    this.problem.set('');
    this.handedOver.set(null);
    this.redeemError.set('');
  }

  private lookup(token: string) {
    this.stopCamera();
    this.clearResult();
    this.token.set(token);
    this.loading.set(true);
    this.staff.lookup(token).subscribe({
      next: (r) => {
        this.result.set(r);
        this.loading.set(false);
      },
      error: (err) => {
        this.problem.set(errorMessage(err));
        this.loading.set(false);
      },
    });
  }

  redeem() {
    this.redeeming.set(true);
    this.redeemError.set('');
    this.staff.redeem(this.token()).subscribe({
      next: (res) => {
        this.handedOver.set(res.order);
        this.result.set(null);
        this.redeeming.set(false);
      },
      error: (err) => {
        this.redeemError.set(errorMessage(err));
        this.redeeming.set(false);
        this.staff.lookup(this.token()).subscribe({ next: (r) => this.result.set(r), error: () => {} });
      },
    });
  }
}