import { Component, computed, inject, signal } from '@angular/core';
import { Observable } from 'rxjs';
import { AdminService, ItemInput } from '../../core/admin.service';
import { MenuService } from '../../core/menu.service';
import { Category, MenuItem } from '../../core/models';
import { errorMessage } from '../../core/http-error';

@Component({
  selector: 'app-admin-menu',
  template: `
    <div class="page">
      <div class="head">
        <h1>Menu</h1>
        <div class="head-actions">
          <button type="button" class="secondary" (click)="openCategory()">Add category</button>
          <button type="button" class="primary" [disabled]="categories().length === 0" (click)="openNew()">
            Add item
          </button>
        </div>
      </div>

      @if (message()) {
        <p class="ok" role="status">{{ message() }}</p>
      }
      @if (error()) {
        <p class="error" role="alert">{{ error() }}</p>
      }

      <div class="chips">
        <button type="button" [class.active]="selected() === null" (click)="selected.set(null)">All</button>
        @for (c of categories(); track c.id) {
          <button type="button" [class.active]="selected() === c.id" (click)="selected.set(c.id)">{{ c.name }}</button>
        }
      </div>

      <div class="cols">
        <section class="table-wrap" aria-label="Menu items">
          @if (loading()) {
            <p class="empty">Loading the menu...</p>
          } @else if (categories().length === 0) {
            <p class="empty">No categories yet. Add a category first, then add dishes to it.</p>
          } @else {
            <div class="scroll">
              <table>
                <thead>
                  <tr>
                    <th>Item</th><th>Category</th><th>Price</th><th>Points</th><th>Available</th><th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  @for (row of rows(); track row.item.id) {
                    <tr [class.off]="!row.item.is_available">
                      <td>
                        <div class="name">
                          @if (row.item.image_url) {
                            <img [src]="row.item.image_url" alt="" />
                          } @else {
                            <span class="thumb" aria-hidden="true"></span>
                          }
                          <strong>{{ row.item.name }}</strong>
                        </div>
                      </td>
                      <td>{{ row.category }}</td>
                      <td>
                        <input class="price" type="number" min="0" step="0.01" #priceInput
                               [value]="row.item.price" [attr.aria-label]="'Price for ' + row.item.name"
                               [disabled]="busy()" (change)="changePrice(row.item, priceInput)" />
                      </td>
                      <td>{{ row.item.points_reward > 0 ? '+' + row.item.points_reward : '–' }}</td>
                      <td>
                        <label class="switch">
                          <input type="checkbox" role="switch" [checked]="row.item.is_available" [disabled]="busy()"
                                 (change)="toggle(row.item, $any($event.target).checked)" />
                          {{ row.item.is_available ? 'Yes' : 'No' }}
                        </label>
                      </td>
                      <td class="actions">
                        <button type="button" class="small" (click)="openEdit(row.item)">Edit</button>
                        <button type="button" class="small danger" [disabled]="busy()" (click)="remove(row.item)">Remove</button>
                      </td>
                    </tr>
                  } @empty {
                    <tr><td colspan="6" class="empty">No dishes here yet.</td></tr>
                  }
                </tbody>
              </table>
            </div>
          }
        </section>

        @if (panel(); as p) {
          <section class="panel" aria-label="Edit item">
            @if (p === 'category') {
              <strong>New category</strong>
              <form (submit)="$event.preventDefault(); saveCategory()">
                <label>Name
                  <input [value]="fName()" (input)="fName.set($any($event.target).value)" placeholder="For example Desserts" />
                </label>
                @if (formError()) { <p class="error" role="alert">{{ formError() }}</p> }
                <div class="panel-actions">
                  <button type="button" class="secondary" (click)="closePanel()">Cancel</button>
                  <button type="submit" class="primary" [disabled]="busy()">Save category</button>
                </div>
              </form>
            } @else {
              <strong>{{ p === 'new' ? 'New item' : 'Edit item' }}</strong>
              <form (submit)="$event.preventDefault(); saveItem()">
                <label>Name
                  <input [value]="fName()" (input)="fName.set($any($event.target).value)" />
                </label>
                <label>Category
                  <select (change)="onCategory($any($event.target).value)">
                    @for (c of categories(); track c.id) {
                      <option [value]="c.id" [selected]="c.id === fCategory()">{{ c.name }}</option>
                    }
                  </select>
                </label>
                <label>Price (₱)
                  <input type="number" min="0" step="0.01" [value]="fPrice()" (input)="fPrice.set($any($event.target).value)" />
                </label>
                <label>Points reward (per dish, 0 for none)
                  <input type="number" min="0" step="1" [value]="fPoints()" (input)="fPoints.set($any($event.target).value)" />
                </label>
                <label>Description
                  <textarea rows="3" [value]="fDescription()" (input)="fDescription.set($any($event.target).value)"></textarea>
                </label>
                <label>Image link (optional)
                  <input [value]="fImage()" (input)="fImage.set($any($event.target).value)" placeholder="https://..." />
                </label>
                @if (formError()) { <p class="error" role="alert">{{ formError() }}</p> }
                <div class="panel-actions">
                  <button type="button" class="secondary" (click)="closePanel()">Cancel</button>
                  <button type="submit" class="primary" [disabled]="busy()">Save item</button>
                </div>
              </form>
            }
          </section>
        }
      </div>
    </div>
  `,
  styles: `
    .page { display: flex; flex-direction: column; gap: 16px; }
    .head { display: flex; flex-wrap: wrap; gap: 12px; justify-content: space-between; align-items: center; }
    .head-actions { display: flex; gap: 8px; }
    h1 { margin: 0; font-size: 24px; }
    .ok { color: #1a7f37; margin: 0; }
    .error { color: #b3261e; margin: 0; }
    .chips { display: flex; gap: 8px; flex-wrap: wrap; }
    .chips button { min-height: 44px; padding: 0 16px; border: 1.5px solid #3d4450; border-radius: 999px;
                    background: #fff; font-size: 14px; cursor: pointer; }
    .chips button.active { background: #1f2328; border-color: #1f2328; color: #fff; font-weight: 600; }
    .cols { display: flex; flex-wrap: wrap; gap: 24px; align-items: flex-start; }
    .table-wrap { flex: 2 1 520px; min-width: 0; border: 1.5px solid #3d4450; border-radius: 8px; padding: 8px 16px; }
    .scroll { overflow-x: auto; }
    table { width: 100%; border-collapse: collapse; font-size: 14px; }
    th { text-align: left; color: #5c6470; font-size: 13px; padding: 8px; border-bottom: 1.5px solid #3d4450; font-weight: 600; }
    td { padding: 8px; border-bottom: 1.5px solid #d5d9e0; vertical-align: middle; }
    tr:last-child td { border-bottom: 0; }
    tr.off { background: #f4f5f7; color: #5c6470; }
    .name { display: flex; align-items: center; gap: 10px; }
    .thumb, .name img { width: 32px; height: 32px; border-radius: 6px; background: #e4e7ec; flex: none; object-fit: cover; }
    .price { width: 96px; height: 40px; padding: 0 8px; border: 1.5px solid #3d4450; border-radius: 8px; font-size: 14px; text-align: right; }
    .switch { display: inline-flex; align-items: center; gap: 8px; min-height: 44px; cursor: pointer; }
    .switch input { width: 20px; height: 20px; }
    .actions { white-space: nowrap; }
    .small { min-height: 40px; padding: 0 12px; border: 1.5px solid #3d4450; border-radius: 8px; background: #fff; font-size: 13px; cursor: pointer; }
    .danger { color: #b3261e; border-color: #b3261e; }
    .empty { color: #5c6470; text-align: center; padding: 16px 0; margin: 0; }
    .panel { flex: 1 1 280px; min-width: 0; border: 1.5px solid #3d4450; border-radius: 8px; padding: 16px;
             display: flex; flex-direction: column; gap: 12px; }
    form { display: flex; flex-direction: column; gap: 12px; }
    label { display: flex; flex-direction: column; gap: 4px; font-size: 13px; color: #5c6470; }
    label input, label select, label textarea { padding: 10px 12px; border: 1.5px solid #3d4450; border-radius: 8px;
                                                 font: inherit; font-size: 15px; color: #1f2328; background: #fff; }
    label input, label select { height: 44px; padding-top: 0; padding-bottom: 0; }
    .panel-actions { display: flex; gap: 8px; }
    .panel-actions button { flex: 1; }
    .primary { min-height: 44px; padding: 0 16px; border: 0; border-radius: 8px; background: #2b5fd9; color: #fff; font-weight: 600; font-size: 14px; cursor: pointer; }
    .secondary { min-height: 44px; padding: 0 16px; border: 1.5px solid #3d4450; border-radius: 8px; background: #fff; font-size: 14px; cursor: pointer; }
    button:disabled { opacity: 0.5; cursor: default; }
  `,
})
export class AdminMenuComponent {
  private admin = inject(AdminService);
  private menuService = inject(MenuService);

  categories = signal<Category[]>([]);
  loading = signal(true);
  busy = signal(false);
  error = signal('');
  message = signal('');
  selected = signal<number | null>(null);

  panel = signal<'new' | 'edit' | 'category' | null>(null);
  formError = signal('');
  private editingId: number | null = null;

  fName = signal('');
  fCategory = signal<number | null>(null);
  fPrice = signal('');
  fPoints = signal('0');
  fDescription = signal('');
  fImage = signal('');

  rows = computed(() => {
    const sel = this.selected();
    return this.categories()
      .filter((c) => sel === null || c.id === sel)
      .flatMap((c) => c.items.map((item) => ({ item, category: c.name })));
  });

  constructor() {
    this.reload();
  }

  private reload() {
    this.menuService.getMenu().subscribe({
      next: (categories) => {
        this.categories.set(categories);
        this.loading.set(false);
        this.busy.set(false);
      },
      error: (err) => {
        this.error.set(errorMessage(err));
        this.loading.set(false);
        this.busy.set(false);
      },
    });
  }

  private run(request: Observable<unknown>, success: string, after?: () => void) {
    this.error.set('');
    this.message.set('');
    this.formError.set('');
    this.busy.set(true);
    request.subscribe({
      next: () => {
        this.message.set(success);
        after?.();
        this.reload();
      },
      error: (err) => {
        const text = errorMessage(err);
        if (this.panel()) this.formError.set(text);
        else this.error.set(text);
        this.reload(); 
      },
    });
  }

  changePrice(item: MenuItem, input: HTMLInputElement) {
    const price = Number(input.value);
    if (input.value.trim() === '' || !Number.isFinite(price) || price < 0) {
      this.error.set('Price must be a number, 0 or higher.');
      input.value = String(item.price);
      return;
    }
    if (price === item.price) return;
    this.run(this.admin.updateItem(item.id, { price }), `Price of ${item.name} is now ₱${price}.`);
  }

  toggle(item: MenuItem, available: boolean) {
    this.run(
      this.admin.setAvailability(item.id, available),
      `${item.name} is now ${available ? 'available' : 'unavailable'}.`
    );
  }

  remove(item: MenuItem) {
    if (!confirm(`Remove "${item.name}" from the menu? Past orders keep it.`)) return;
    this.run(this.admin.deleteItem(item.id), `${item.name} was removed.`, () => {
      if (this.editingId === item.id) this.closePanel();
    });
  }

  openCategory() {
    this.resetForm();
    this.panel.set('category');
  }

  openNew() {
    this.resetForm();
    this.fCategory.set(this.selected() ?? this.categories()[0]?.id ?? null);
    this.panel.set('new');
  }

  openEdit(item: MenuItem) {
    this.resetForm();
    this.editingId = item.id;
    this.fName.set(item.name);
    this.fCategory.set(item.category_id);
    this.fPrice.set(String(item.price));
    this.fPoints.set(String(item.points_reward ?? 0));
    this.fDescription.set(item.description ?? '');
    this.fImage.set(item.image_url ?? '');
    this.panel.set('edit');
  }

  closePanel() {
    this.panel.set(null);
    this.editingId = null;
    this.formError.set('');
  }

  onCategory(value: string) {
    this.fCategory.set(Number(value));
  }

  private resetForm() {
    this.editingId = null;
    this.formError.set('');
    this.fName.set('');
    this.fCategory.set(null);
    this.fPrice.set('');
    this.fPoints.set('0');
    this.fDescription.set('');
    this.fImage.set('');
  }

  saveCategory() {
    const name = this.fName().trim();
    if (!name) {
      this.formError.set('Please enter a name.');
      return;
    }
    const next = Math.max(0, ...this.categories().map((c) => c.sort_order)) + 1; 
    this.run(this.admin.createCategory({ name, sort_order: next }), `Category "${name}" added.`, () =>
      this.closePanel()
    );
  }

  saveItem() {
    const name = this.fName().trim();
    const price = Number(this.fPrice());
    const points = Number(this.fPoints() || 0);
    const category = this.fCategory();

    if (!name) return this.formError.set('Please enter a name.');
    if (category === null) return this.formError.set('Please choose a category.');
    if (this.fPrice().trim() === '' || !Number.isFinite(price) || price < 0) {
      return this.formError.set('Price must be a number, 0 or higher.');
    }
    if (!Number.isInteger(points) || points < 0) {
      return this.formError.set('Points reward must be a whole number, 0 or higher.');
    }

    const body: ItemInput = {
      category_id: category,
      name,
      description: this.fDescription().trim() || null,
      price,
      image_url: this.fImage().trim() || null,
      points_reward: points,
    };

    const request =
      this.panel() === 'edit' && this.editingId !== null
        ? this.admin.updateItem(this.editingId, body)
        : this.admin.createItem(body);

    this.run(request, `"${name}" saved.`, () => this.closePanel());
  }
}