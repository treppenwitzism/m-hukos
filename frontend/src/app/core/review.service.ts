import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../environments/environment';
import { ItemReviews, MyReviewStatus, Review } from './models';

@Injectable({ providedIn: 'root' })
export class ReviewService {
  private http = inject(HttpClient);
  private base = environment.apiUrl;

  list(itemId: number) {
    return this.http.get<ItemReviews>(`${this.base}/menu/${itemId}/reviews`);
  }

  mine(itemId: number) {
    return this.http.get<MyReviewStatus>(`${this.base}/menu/${itemId}/reviews/mine`);
  }

  create(itemId: number, body: { rating: number; comment: string }) {
    return this.http.post<Review>(`${this.base}/menu/${itemId}/reviews`, body);
  }

  update(reviewId: number, body: { rating: number; comment: string }) {
    return this.http.patch<Review>(`${this.base}/reviews/${reviewId}`, body);
  }

  remove(reviewId: number) {
    return this.http.delete<void>(`${this.base}/reviews/${reviewId}`);
  }
}