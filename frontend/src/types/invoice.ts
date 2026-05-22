export interface InvoiceDetail {
  id: string;
  product_id: string;
  product_name: string;
  product_sku?: string;
  quantity: number;
  unit_price: number;
  discount: number;
  total_price: number;
  iva_percentage: number;
  iva_amount: number;
  ice_percentage: number;
  ice_amount: number;
}

export interface Invoice {
  id: string;
  business_id: string;
  customer_id?: string;
  sale_id?: string;
  invoice_number: string;
  sequential: string;
  issue_date: string;
  authorization_date?: string;
  subtotal: number;
  discount: number;
  iva: number;
  ice: number;
  total: number;
  sri_status: 'draft' | 'pending' | 'sent' | 'authorized' | 'rejected' | 'cancelled';
  pdf_url?: string;
  xml_signed?: string;
  notes?: string;
  customer_name?: string;
  customer_identification?: string;
  details: InvoiceDetail[];
  created_at: string;
}

export interface InvoiceCreate {
  sale_id: string;
  notes?: string;
  send_whatsapp?: boolean;
}

export interface InvoiceListResponse {
  id: string;
  invoice_number: string;
  sequential: string;
  issue_date: string;
  customer_name?: string;
  total: number;
  sri_status: string;
  authorization_date?: string;
}

export interface SriStatusResponse {
  status: string;
  authorization_number?: string;
  authorization_date?: string;
  errors?: Array<{ message: string }>;
}