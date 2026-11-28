import { Component, computed, inject, signal } from '@angular/core';
import { CurrencyPipe } from '@angular/common';
import { MenuService } from '../../core/menu.service';
import { CartService, MAX_QUANTITY } from '../../core/cart.service';
import { Category } from '../../core/models';
import { errorMessage } from '../../core/http-error';
import { RouterLink } from '@angular/router';

@Component({
    selector: 'app-menu',
    imports: [CurrencyPipe, RouterLink],
    template: `
    <div class="page">
      <input class="search" type="search" placeholder="Search the menu" aria-label="Search the menu"
             [value]="search()" (input)="onSearch($event)" />

      <div class="chips">
        <button type="button" [class.active]="selectedCategory() === null" (click)="selectedCategory.set(null)">All</button>
        @for (c of chips(); track c.id) {
          <button type="button" [class.active]="selectedCategory() === c.id" (click)="selectedCategory.set(c.id)">
            {{ c.name }}
          </button>
        }
      </div>

      @if (loading()) {
        <p class="note">Loading the menu...</p>
      } @else if (error()) {
        <p class="note error" role="alert">{{ error() }}</p>
        <button type="button" class="retry" (click)="load()">Try again</button>
      } @else if (items().length === 0) {
        <p class="note">No dishes match your search.</p>
      } @else {
        @for (item of items(); track item.id) {
          <article class="card" [class.off]="!item.is_available">
            <a class="photo" [routerLink]="['/item', item.id]">
            @if (item.image_url) {
                <img [src]="item.image_url" [alt]="item.name" />
            } @else {
                <span>Photo</span>
                }
            </a>
            <div class="info">
              <a class="name" [routerLink]="['/item', item.id]"><strong>{{ item.name }}</strong></a>
              @if (item.description) {
                <span class="desc">{{ item.description }}</span>
              }
              <span class="meta">
                @if (item.review_count) {
                  ★ {{ item.avg_rating }} ({{ item.review_count }})
                }
                @if (item.points_reward > 0) {
                  <span class="reward">+{{ item.points_reward }} pts</span>
                }
              </span>
              <div class="row">
                <strong>{{ item.price | currency: 'PHP' : 'symbol-narrow' : '1.0-2' }}</strong>
                @if (item.is_available) {
                  @if (cart.quantityOf(item.id) === 0) {
                    <button type="button" class="add" (click)="cart.add(item)">Add</button>
                  } @else {
                    <div class="stepper">
                      <button type="button" [attr.aria-label]="'Remove one ' + item.name"
                              (click)="cart.setQuantity(item.id, cart.quantityOf(item.id) - 1)">−</button>
                      <span aria-live="polite">{{ cart.quantityOf(item.id) }}</span>
                      <button type="button" [attr.aria-label]="'Add one ' + item.name"
                              [disabled]="cart.quantityOf(item.id) >= maxQuantity"
                              (click)="cart.add(item)">+</button>
                    </div>
                  }
                } @else {
                  <button type="button" class="add" disabled>Unavailable</button>
                }
              </div>
            </div>
          </article>
        }
      }
    </div>
  `,
    styles: `
    .stepper { display: flex; align-items: center; border: 1.5px solid #3d4450; border-radius: 8px; }
    .stepper button { width: 44px; height: 44px; border: 0; background: #fff; font-size: 20px; cursor: pointer; border-radius: 8px; }
    .stepper button:disabled { color: #c5cad3; cursor: default; }
    .stepper span { min-width: 28px; text-align: center; font-weight: 600; }
    .name, .photo { color: inherit; text-decoration: none; }
    .page { padding: 12px 16px; display: flex; flex-direction: column; gap: 12px; }
    .search { height: 44px; padding: 0 12px; border: 1.5px solid #3d4450; border-radius: 8px; font-size: 15px; }
    .chips { display: flex; gap: 8px; overflow-x: auto; padding-bottom: 2px; }
    .chips button { flex: none; min-height: 44px; padding: 0 16px; border: 1.5px solid #3d4450; border-radius: 999px;
                    background: #fff; font-size: 14px; cursor: pointer; }
    .chips button.active { background: #1f2328; border-color: #1f2328; color: #fff; font-weight: 600; }
    .card { display: flex; gap: 12px; padding: 12px; border: 1.5px solid #3d4450; border-radius: 8px; }
    .card.off { background: #f4f5f7; border-color: #8a93a1; color: #5c6470; }
    .photo { width: 80px; height: 80px; flex: none; border-radius: 6px; overflow: hidden; background: #e4e7ec;
             display: flex; align-items: center; justify-content: center; font-size: 12px; color: #5c6470; }
    .photo img { width: 100%; height: 100%; object-fit: cover; }
    .info { flex: 1; min-width: 0; display: flex; flex-direction: column; gap: 2px; }
    .desc { font-size: 13px; color: #5c6470; }
    .meta { font-size: 12px; color: #5c6470; display: flex; gap: 8px; }
    .reward { color: #1a7f37; font-weight: 600; }
    .row { display: flex; align-items: center; justify-content: space-between; margin-top: auto; gap: 8px; }
    .add { min-height: 44px; padding: 0 20px; border: 0; border-radius: 8px; background: #2b5fd9; color: #fff;
           font-weight: 600; font-size: 15px; cursor: pointer; }
    .add:disabled { background: #fff; color: #5c6470; border: 1.5px dashed #5c6470; font-size: 13px; padding: 0 14px; cursor: default; }
    .note { text-align: center; color: #5c6470; margin: 24px 0 0; }
    .error { color: #b3261e; }
    .retry { align-self: center; min-height: 44px; padding: 0 20px; border: 1.5px solid #3d4450; border-radius: 8px; background: #fff; }
  `,
})
export class MenuComponent {
    private menuService = inject(MenuService);
    cart = inject(CartService);
    maxQuantity = MAX_QUANTITY;

    categories = signal<Category[]>([]);
    loading = signal(true);
    error = signal('');
    selectedCategory = signal<number | null>(null);
    search = signal('');

    chips = computed(() => this.categories().filter((c) => c.items.length > 0));

    items = computed(() => {
        const q = this.search().trim().toLowerCase();
        const selected = this.selectedCategory();
        return this.categories()
            .filter((c) => selected === null || c.id === selected)
            .flatMap((c) => c.items)
            .filter(
                (i) => !q || i.name.toLowerCase().includes(q) || (i.description ?? '').toLowerCase().includes(q)
            );
    });

    constructor() {
        this.load();
    }

    load() {
        this.loading.set(true);
        this.error.set('');
        this.menuService.getMenu().subscribe({
            next: (categories) => {
                this.categories.set(categories);
                this.loading.set(false);
            },
            error: (err) => {
                this.error.set(errorMessage(err));
                this.loading.set(false);
            },
        });
    }

    onSearch(event: Event) {
        this.search.set((event.target as HTMLInputElement).value);
    }
}