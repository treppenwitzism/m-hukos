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