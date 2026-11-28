import { Injectable, inject, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { tap } from 'rxjs';
import { environment } from '../../environments/environment';
import { PointsEntry, PointsSummary } from './models';

@Injectable({ providedIn: 'root' })
export class PointsService {
  private http = inject(HttpClient);

  readonly balance = signal<number | null>(null);
  readonly history = signal<PointsEntry[]>([]);

  load() {
    return this.http.get<PointsSummary>(`${environment.apiUrl}/points`).pipe(
      tap((res) => {
        this.balance.set(res.balance);
        this.history.set(res.history);
      })
    );
  }

  refresh() {
    this.load().subscribe({ error: () => {} });
  }

  reset() {
    this.balance.set(null);
    this.history.set([]);
  }
}