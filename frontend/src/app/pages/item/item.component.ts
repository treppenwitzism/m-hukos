import { Component, computed, inject, signal } from '@angular/core';
import { CurrencyPipe, DatePipe } from '@angular/common';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { AuthService } from '../../core/auth.service';
import { CartService, MAX_QUANTITY } from '../../core/cart.service';
import { MenuService } from '../../core/menu.service';
import { ReviewService } from '../../core/review.service';
import { ItemReviews, MenuItem, MyReviewStatus } from '../../core/models';
import { errorMessage } from '../../core/http-error';


@Component({
  selector: 'app-item',
  imports: [RouterLink, CurrencyPipe, DatePipe],
  template: `
    <div class="page">
      <a routerLink="/" class="back">&lt; Menu</a>

      @if (loading()) {
        <p class="note">Loading...</p>
      } @else if (error()) {
        <p class="note error" role="alert">{{ error() }}</p>
      } @else if (!item()) {
        <p class="note">Dish not found.</p>
      } @else {
        @let dish = item()!;

        <div class="photo">
          @if (dish.image_url) {
            <img [src]="dish.image_url" [alt]="dish.name" />
          } @else {
            <span>No photo yet</span>
          }
        </div>

        <section class="details">
          <div class="title">
            <h1>{{ dish.name }}</h1>
            <strong>{{ dish.price | currency: 'PHP' : 'symbol-narrow' : '1.0-2' }}</strong>
          </div>

          <div class="rating">
            @if (data().summary.count > 0) {
              <span class="stars">{{ stars(data().summary.average ?? 0) }}</span>
              {{ data().summary.average }} average · {{ data().summary.count }}
              {{ data().summary.count === 1 ? 'review' : 'reviews' }}
            } @else {
              No reviews yet
            }
          </div>

          @if (dish.description) {
            <p class="desc">{{ dish.description }}</p>
          }
          @if (dish.points_reward > 0) {
            <p class="reward">Earn +{{ dish.points_reward }} points for each one you buy.</p>
          }

          @if (dish.is_available) {
            <div class="buy">
              <div class="stepper">
                <button type="button" aria-label="Decrease quantity" (click)="changeQuantity(-1)">−</button>
                <span>{{ quantity() }}</span>
                <button type="button" aria-label="Increase quantity" (click)="changeQuantity(1)">+</button>
              </div>
              <button type="button" class="add" (click)="addToCart(dish)">
                {{ added() ? 'Added ✓' : 'Add to cart · ' + (total() | currency: 'PHP' : 'symbol-narrow' : '1.0-2') }}
              </button>
            </div>
          } @else {
            <p class="unavailable">This dish is unavailable right now.</p>
          }
        </section>

        <section class="reviews">
          <div class="reviews-head">
            <h2>Reviews</h2>
            @if (!auth.isLoggedIn()) {
              <a routerLink="/login" [queryParams]="{ returnUrl: '/item/' + dish.id }">Log in to review</a>
            } @else if (mine(); as status) {
              @if (!status.review && status.can_review && !formOpen()) {
                <button type="button" class="link" (click)="openForm()">Write a review</button>
              }
            }
          </div>

          @if (auth.isLoggedIn() && mine(); as status) {
            @if (!status.review && !status.can_review) {
              <p class="note-small">You can review this dish after you have picked it up.</p>
            }
            @if (status.review; as own) {
              @if (!formOpen()) {
                <div class="review own">
                  <div class="review-top">
                    <strong>Your review</strong><span class="stars">{{ stars(own.rating) }}</span>
                  </div>
                  @if (own.comment) {
                    <span class="comment">{{ own.comment }}</span>
                  }
                  <div class="own-actions">
                    <button type="button" class="link" (click)="openForm()">Edit</button>
                    <button type="button" class="link danger" (click)="deleteReview(own.id)">Delete</button>
                  </div>
                </div>
              }
            }
          }

          @if (formOpen()) {
            <form class="form" (submit)="$event.preventDefault(); submit()">
              <div class="stars-input" role="radiogroup" aria-label="Rating">
                @for (n of [1, 2, 3, 4, 5]; track n) {
                  <button type="button" role="radio" [attr.aria-checked]="rating() === n"
                          [attr.aria-label]="n + (n === 1 ? ' star' : ' stars')"
                          [class.on]="n <= rating()" (click)="rating.set(n)">★</button>
                }
              </div>
              <textarea rows="3" maxlength="500" placeholder="Tell others what you thought (optional)"
                        [value]="comment()" (input)="comment.set($any($event.target).value)"></textarea>
              @if (formError()) {
                <p class="error" role="alert">{{ formError() }}</p>
              }
              <div class="form-actions">
                <button type="button" class="secondary" (click)="formOpen.set(false)">Cancel</button>
                <button type="submit" class="add" [disabled]="saving()">Save review</button>
              </div>
            </form>
          }

          @if (reviewsError()) {
            <p class="error" role="alert">{{ reviewsError() }}</p>
          }

          @for (r of data().reviews; track r.id) {
            <div class="review">
              <div class="review-top">
                <strong>{{ r.author }}</strong><span class="stars">{{ stars(r.rating) }}</span>
              </div>
              @if (r.comment) {
                <span class="comment">{{ r.comment }}</span>
              }
              <span class="date">{{ r.created_at | date: 'mediumDate' }}</span>
            </div>
          } @empty {
            <p class="note-small">Be the first to review this dish.</p>
          }
        </section>
      }
    </div>
  `,
  styles: `
    .page { padding-bottom: 16px; }
    .back { display: inline-flex; align-items: center; min-height: 44px; padding: 0 16px; font-size: 15px; }
    .note { text-align: center; color: #5c6470; margin: 24px 16px; }
    .note-small { font-size: 13px; color: #5c6470; margin: 0 0 8px; }
    .error { color: #b3261e; margin: 0; }
    .photo { height: 200px; background: #e4e7ec; display: flex; align-items: center; justify-content: center;
             font-size: 13px; color: #5c6470; }
    .photo img { width: 100%; height: 100%; object-fit: cover; }
    .details { padding: 16px; display: flex; flex-direction: column; gap: 8px; }
    .title { display: flex; justify-content: space-between; align-items: baseline; gap: 12px; }
    h1 { margin: 0; font-size: 20px; }
    h2 { margin: 0; font-size: 16px; }
    .rating { font-size: 14px; color: #5c6470; }
    .stars { color: #b7791f; letter-spacing: 1px; }
    .desc { margin: 0; font-size: 14px; line-height: 1.5; color: #5c6470; }
    .reward { margin: 0; font-size: 13px; color: #1a7f37; font-weight: 600; }
    .unavailable { margin: 0; padding: 12px; border: 1.5px dashed #5c6470; border-radius: 8px; font-size: 14px; }
    .buy { display: flex; align-items: center; gap: 12px; margin-top: 8px; }
    .stepper { display: flex; align-items: center; border: 1.5px solid #3d4450; border-radius: 8px; }
    .stepper button { width: 44px; height: 44px; border: 0; background: #fff; font-size: 20px; cursor: pointer; }
    .stepper span { width: 28px; text-align: center; font-weight: 600; }
    .add { flex: 1; min-height: 48px; border: 0; border-radius: 8px; background: #2b5fd9; color: #fff;
           font-weight: 600; font-size: 15px; cursor: pointer; }
    .add:disabled { opacity: 0.6; }
    .secondary { min-height: 48px; padding: 0 20px; border: 1.5px solid #3d4450; border-radius: 8px; background: #fff; cursor: pointer; }
    .reviews { padding: 0 16px; display: flex; flex-direction: column; gap: 12px; }
    .reviews-head { display: flex; justify-content: space-between; align-items: center; min-height: 44px; }
    .link { background: none; border: 0; min-height: 44px; padding: 0 4px; font-size: 14px; color: #2b5fd9;
            text-decoration: underline; cursor: pointer; }
    .danger { color: #b3261e; }
    .review { border: 1.5px solid #3d4450; border-radius: 8px; padding: 12px; display: flex; flex-direction: column; gap: 4px; }
    .review.own { background: #f4f5f7; }
    .review-top { display: flex; justify-content: space-between; font-size: 14px; }
    .comment { font-size: 13px; color: #1f2328; white-space: pre-wrap; }
    .date { font-size: 12px; color: #5c6470; }
    .own-actions { display: flex; gap: 8px; }
    .form { border: 1.5px solid #3d4450; border-radius: 8px; padding: 12px; display: flex; flex-direction: column; gap: 12px; }
    .stars-input { display: flex; gap: 4px; }
    .stars-input button { width: 44px; height: 44px; border: 0; background: none; font-size: 28px; color: #c5cad3; cursor: pointer; }
    .stars-input button.on { color: #b7791f; }
    textarea { padding: 10px 12px; border: 1.5px solid #3d4450; border-radius: 8px; font: inherit; font-size: 15px; resize: vertical; }
    .form-actions { display: flex; gap: 8px; }
    .form-actions .add { flex: 1; }
  `,
})
export class ItemComponent {
  private route = inject(ActivatedRoute);
  private menuService = inject(MenuService);
  private reviewService = inject(ReviewService);
  auth = inject(AuthService);
  cart = inject(CartService);

  private id = Number(this.route.snapshot.paramMap.get('id'));

  item = signal<MenuItem | null>(null);
  loading = signal(true);
  error = signal('');

  quantity = signal(1);
  added = signal(false);
  total = computed(() => Math.round((this.item()?.price ?? 0) * 100 * this.quantity()) / 100);

  data = signal<ItemReviews>({ summary: { count: 0, average: null }, reviews: [] });
  mine = signal<MyReviewStatus | null>(null);
  reviewsError = signal('');

  formOpen = signal(false);
  rating = signal(0);
  comment = signal('');
  formError = signal('');
  saving = signal(false);

  constructor() {
    this.menuService.getItem(this.id).subscribe({
      next: (item) => {
        this.item.set(item);
        this.loading.set(false);
        if (item) this.loadReviews();
      },
      error: (err) => {
        this.error.set(errorMessage(err));
        this.loading.set(false);
      },
    });
  }

  stars(value: number): string {
    const n = Math.max(0, Math.min(5, Math.round(value)));
    return '★'.repeat(n) + '☆'.repeat(5 - n);
  }

  loadReviews() {
    this.reviewsError.set('');
    this.reviewService.list(this.id).subscribe({
      next: (d) => this.data.set(d),
      error: (err) => this.reviewsError.set(errorMessage(err)),
    });
    if (this.auth.isLoggedIn()) {
      this.reviewService.mine(this.id).subscribe({
        next: (m) => this.mine.set(m),
        error: () => this.mine.set(null),
      });
    }
  }

  changeQuantity(delta: number) {
    this.quantity.update((q) => Math.max(1, Math.min(MAX_QUANTITY, q + delta)));
  }

  addToCart(item: MenuItem) {
    this.cart.add(item, this.quantity());
    this.added.set(true);
    setTimeout(() => this.added.set(false), 1500);
  }

  openForm() {
    const existing = this.mine()?.review;
    this.rating.set(existing?.rating ?? 0);
    this.comment.set(existing?.comment ?? '');
    this.formError.set('');
    this.formOpen.set(true);
  }

  submit() {
    if (this.rating() < 1) {
      this.formError.set('Please choose a star rating.');
      return;
    }
    this.saving.set(true);
    this.formError.set('');

    const body = { rating: this.rating(), comment: this.comment() };
    const existing = this.mine()?.review;
    const request = existing
      ? this.reviewService.update(existing.id, body)
      : this.reviewService.create(this.id, body);

    request.subscribe({
      next: () => {
        this.saving.set(false);
        this.formOpen.set(false);
        this.loadReviews();
      },
      error: (err) => {
        this.formError.set(errorMessage(err));
        this.saving.set(false);
      },
    });
  }

  deleteReview(reviewId: number) {
    if (!confirm('Delete your review?')) return;
    this.reviewService.remove(reviewId).subscribe({
      next: () => this.loadReviews(),
      error: (err) => this.reviewsError.set(errorMessage(err)),
    });
  }
}