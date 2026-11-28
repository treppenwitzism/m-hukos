import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../environments/environment';
import { Order, StaffLookup } from './models';

@Injectable({ providedIn: 'root' })
export class StaffService {
  private http = inject(HttpClient);
  private base = environment.apiUrl;

  lookup(token: string) {
    return this.http.get<StaffLookup>(`${this.base}/staff/qr/${token}`);
  }

  redeem(token: string) {
    return this.http.post<{ order: Order }>(`${this.base}/staff/qr/${token}/redeem`, {});
  }
}