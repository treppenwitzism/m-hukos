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

export type OrderStatus = 'pending' | 'paid' | 'fulfilled' | 'expired' | 'cancelled';
export type PaymentMethod = 'counter' | 'paymongo';

export interface OrderItem {
  id: number;
  menu_item_id: number;
  name: string;
  quantity: number;
  unit_price: number;
  line_total: number;
}

export interface Order {
  id: number;
  user_id: number;
  status: OrderStatus;
  total: number;
  scheduled_for: string | null;
  created_at: string;
  payment_method?: PaymentMethod | null;
  items: OrderItem[];
  points_earned?: number;
}

export interface PickupSlots {
  date: string;
  slots: string[];
}

export interface OrderQr {
  token: string;
  url: string;
  expires_at: string;
  redeemed: boolean;
  order_status: OrderStatus;
  payment_due?: boolean;
}