export type UserRole =
  | 'owner'
  | 'admin'
  | 'manager'
  | 'seller'
  | 'viewer'
  | 'accountant';

export interface User {
  id: string;
  business_id?: string;
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

export interface Business {
  id: string;
  ruc: string;
  business_name: string;
  commercial_name?: string;
  email: string;
  phone?: string;
  address?: string;
  logo_url?: string;
  subscription_plan: 'free' | 'basic' | 'pro' | 'enterprise';
  subscription_status: string;
  sri_environment: 'test' | 'production' | '1' | '2';
  sri_emisor_type?: string;
  sri_has_digital_certificate: boolean;
  digital_certificate_expires_at?: string;
  whatsapp_business_phone?: string;
  whatsapp_business_id?: string;
  whatsapp_webhook_verified: boolean;
  settings: {
    language: string;
    timezone: string;
    currency: string;
    tax_included: boolean;
    whatsapp_auto_reply: boolean;
    notify_low_stock: boolean;
    low_stock_threshold: number;
  };
  current_users: number;
  current_products: number;
  current_invoices_month: number;
  current_storage_mb?: number;
  max_users: number;
  max_products: number;
  max_invoices_monthly: number;
  max_storage_mb?: number;
  is_active: boolean;
  is_verified?: boolean;
  onboarding_completed?: boolean;
  created_at: string;
  updated_at?: string;
}

export interface LoginRequest {
  username: string;
  password: string;
}

export interface RegisterRequest {
  ruc: string;
  business_name: string;
  commercial_name?: string;
  business_email: string;
  business_phone?: string;
  address?: string;
  email: string;
  username: string;
  password: string;
  first_name: string;
  last_name: string;
  phone?: string;
}

export interface AuthResponse {
  access_token: string;
  refresh_token: string;
  token_type: string;
  user: User;
  business: Business;
}

export interface ChangePasswordRequest {
  current_password: string;
  new_password: string;
  confirm_password: string;
}

export interface ForgotPasswordRequest {
  email: string;
}

export interface ResetPasswordRequest {
  token: string;
  new_password: string;
  confirm_password: string;
}
