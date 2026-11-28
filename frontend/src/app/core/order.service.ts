import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../environments/environment';
import { Order, PaymentMethod, PickupSlots } from './models';

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
}