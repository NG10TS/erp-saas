import type { UserRole } from './auth';

export interface User {
  id: string;
  business_id: string;
  email: string;
  username: string;
  first_name: string;
  last_name: string;
  phone?: string;
  role: UserRole;
  is_active: boolean;
  is_verified: boolean;
  last_login_at?: string;
  created_at: string;
  updated_at: string;
}

export interface UserCreate {
  email: string;
  username: string;
  password: string;
  first_name: string;
  last_name: string;
  phone?: string;
  role?: UserRole;
}

export interface UserUpdate {
  email?: string;
  first_name?: string;
  last_name?: string;
  phone?: string;
  role?: UserRole;
  is_active?: boolean;
}
