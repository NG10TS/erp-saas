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
  sri_environment: 'test' | 'production';
  sri_emisor_type: string;
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
  current_storage_mb: number;
  max_users: number;
  max_products: number;
  max_invoices_monthly: number;
  max_storage_mb: number;
  is_active: boolean;
  is_verified: boolean;
  onboarding_completed: boolean;
  created_at: string;
  updated_at: string;
}

export interface BusinessUpdate {
  business_name?: string;
  commercial_name?: string;
  email?: string;
  phone?: string;
  address?: string;
  settings?: Partial<Business['settings']>;
}

export interface SriConfigUpdate {
  sri_environment: 'test' | 'production';
  sri_emisor_type: string;
  sri_resolution_number?: string;
}

export interface WhatsAppConfigUpdate {
  whatsapp_business_phone: string;
  whatsapp_business_id: string;
  whatsapp_access_token: string;
}

export interface CertificateUpload {
  certificate: string;
  password: string;
}