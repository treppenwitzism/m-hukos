export type Role = 'customer' | 'staff' | 'admin';

export interface User {
  id: number;
  name: string;
  email: string;
  role: Role;
  points_balance?: number;
}

export interface AuthResponse {
  user: User;
  token: string;
}

export interface MenuItem {
  id: number;
  category_id: number;
  name: string;
  description: string | null;
  price: number;
  image_url: string | null;
  is_available: boolean;
  points_reward: number;
  avg_rating?: number | null;
  review_count?: number;
}

export interface Category {
  id: number;
  name: string;
  sort_order: number;
  items: MenuItem[];
}

export interface Review {
  id: number;
  rating: number;
  comment: string | null;
  created_at: string;
  author: string;
}

export interface MyReview {
  id: number;
  rating: number;
  comment: string | null;
  created_at: string;
}

export interface ItemReviews {
  summary: { count: number; average: number | null };
  reviews: Review[];
}

export interface MyReviewStatus {
  can_review: boolean;
  review: MyReview | null;
}