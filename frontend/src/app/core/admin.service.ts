import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../environments/environment';
import { DashboardData, MenuItem } from './models';

export interface ItemInput {
  category_id: number;
  name: string;
  description: string | null;
  price: number;
  image_url: string | null;
  points_reward: number;
}

@Injectable({ providedIn: 'root' })
export class AdminService {
  private http = inject(HttpClient);
  private base = environment.apiUrl;

  getDashboard() {
    return this.http.get<DashboardData>(`${this.base}/admin/dashboard`);
  }

  createCategory(body: { name: string; sort_order: number }) {
    return this.http.post(`${this.base}/admin/menu/categories`, body);
  }

  createItem(body: ItemInput) {
    return this.http.post<{ item: MenuItem }>(`${this.base}/admin/menu/items`, body);
  }

  updateItem(id: number, body: Partial<ItemInput>) {
    return this.http.patch<{ item: MenuItem }>(`${this.base}/admin/menu/items/${id}`, body);
  }

  setAvailability(id: number, isAvailable: boolean) {
    return this.http.patch<{ item: MenuItem }>(`${this.base}/admin/menu/items/${id}/availability`, {
      is_available: isAvailable,
    });
  }

  deleteItem(id: number) {
    return this.http.delete<void>(`${this.base}/admin/menu/items/${id}`);
  }
}