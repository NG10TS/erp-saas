export interface Customer {
  id: string;
  business_id: string;
  phone_number: string;
  name?: string;
  identification?: string;
  email?: string;
  address?: string;
  city?: string;
  province?: string;
  whatsapp_opted_in: boolean;
  total_purchases: number;
  total_spent: number;
  average_purchase: number;
  last_purchase_date?: string;
  first_purchase_date?: string;
  notes?: string;
  tags: string[];
  is_active: boolean;
  is_blocked: boolean;
  blocked_reason?: string;
  created_at: string;
  updated_at: string;
}

export interface CustomerCreate {
  phone_number: string;
  name?: string;
  identification?: string;
  email?: string;
  address?: string;
  city?: string;
  province?: string;
  notes?: string;
  tags?: string[];
}

export interface CustomerUpdate extends Partial<CustomerCreate> {
  is_active?: boolean;
  is_blocked?: boolean;
  blocked_reason?: string;
}

export interface CustomerListResponse {
  id: string;
  phone_number: string;
  name?: string;
  identification?: string;
  total_purchases: number;
  last_purchase_date?: string;
}