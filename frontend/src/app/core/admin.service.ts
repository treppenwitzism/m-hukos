import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../environments/environment';
import { DashboardData } from './models';

@Injectable({ providedIn: 'root' })
export class AdminService {
  private http = inject(HttpClient);
  private base = environment.apiUrl;

  getDashboard() {
    return this.http.get<DashboardData>(`${this.base}/admin/dashboard`);
  }
}