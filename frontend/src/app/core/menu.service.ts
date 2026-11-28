import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { map } from 'rxjs';
import { environment } from '../../environments/environment';
import { Category } from './models';

@Injectable({ providedIn: 'root' })
export class MenuService {
  private http = inject(HttpClient);

  getMenu() {
    return this.http
      .get<{ categories: Category[] }>(`${environment.apiUrl}/menu`)
      .pipe(map((res) => res.categories));
  }
}