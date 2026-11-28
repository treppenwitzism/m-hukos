import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { map } from 'rxjs';
import { environment } from '../../environments/environment';
import { Order, OrderQr, PaymentMethod, PickupSlots } from './models';

export interface CreateOrderBody {
  items: { menu_item_id: number; quantity: number }[];
  payment_method: PaymentMethod;
  scheduled_for?: string;
}

@Injectable({ providedIn: 'root' })
export class OrderService {
  private http = inject(HttpClient);
  private base = environment.apiUrl;

  createOrder(body: CreateOrderBody) {
    return this.http.post<{ order: Order }>(`${this.base}/orders`, body);
  }

  pickupSlots(date: string) {
    return this.http.get<PickupSlots>(`${this.base}/orders/pickup-slots`, { params: { date } });
  }

    list() {
    return this.http.get<{ orders: Order[] }>(`${this.base}/orders`).pipe(map((r) => r.orders));
  }

  get(id: number) {
    return this.http.get<{ order: Order }>(`${this.base}/orders/${id}`).pipe(map((r) => r.order));
  }

  cancel(id: number) {
    return this.http.post<{ order: Order }>(`${this.base}/orders/${id}/cancel`, {}).pipe(map((r) => r.order));
  }

  qr(id: number) {
    return this.http.get<{ qr: OrderQr }>(`${this.base}/orders/${id}/qr`).pipe(map((r) => r.qr));
  }
}