import { Injectable, computed, effect, signal } from '@angular/core';
import { MenuItem } from './models';

export interface CartLine {
  id: number;
  name: string;
  price: number;
  image_url: string | null;
  points_reward: number;
  quantity: number;
}

const STORAGE_KEY = 'cart';
const MAX_QUANTITY = 20; // keep in sync with MAX_QUANTITY in the backend order.service.js

@Injectable({ providedIn: 'root' })
export class CartService {
  readonly lines = signal<CartLine[]>(this.restore());

  readonly count = computed(() => this.lines().reduce((n, l) => n + l.quantity, 0));

  // For display only.
  readonly subtotal = computed(
    () => this.lines().reduce((sum, l) => sum + Math.round(l.price * 100) * l.quantity, 0) / 100
  );

  constructor() {
    effect(() => this.save(this.lines()));
  }

  quantityOf(id: number): number {
    return this.lines().find((l) => l.id === id)?.quantity ?? 0;
  }

  add(item: MenuItem) {
    const existing = this.lines().find((l) => l.id === item.id);
    if (existing) {
      this.setQuantity(item.id, existing.quantity + 1);
      return;
    }
    this.lines.update((lines) => [
      ...lines,
      {
        id: item.id,
        name: item.name,
        price: item.price,
        image_url: item.image_url,
        points_reward: item.points_reward,
        quantity: 1,
      },
    ]);
  }

  setQuantity(id: number, quantity: number) {
    if (quantity <= 0) {
      this.remove(id);
      return;
    }
    const clamped = Math.min(quantity, MAX_QUANTITY);
    this.lines.update((lines) => lines.map((l) => (l.id === id ? { ...l, quantity: clamped } : l)));
  }

  remove(id: number) {
    this.lines.update((lines) => lines.filter((l) => l.id !== id));
  }

  clear() {
    this.lines.set([]);
  }

  private restore(): CartLine[] {
    try {
      const data = JSON.parse(localStorage.getItem(STORAGE_KEY) ?? '[]');
      return Array.isArray(data) ? data : [];
    } catch {
      return [];
    }
  }

  private save(lines: CartLine[]) {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(lines));
    } catch {
    }
  }
}