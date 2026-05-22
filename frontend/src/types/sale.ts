export type SaleStatus = 'pending' | 'confirmed' | 'processing' | 'completed' | 'cancelled';
export type PaymentMethod = 'cash' | 'transfer' | 'card' | 'qr' | 'mixed';
export type PaymentStatus = 'pending' | 'partial' | 'paid' | 'refunded' | 'failed';

export interface SaleItem {
  id: string;
  product_id: string;
  nombre_producto: string;
  sku_producto?: string;
  cantidad: number;
  precio_unitario: number;
  descuento: number;
  subtotal: number;
  iva_porcentaje: number;
  iva_monto: number;
  ice_porcentaje: number;
  ice_monto: number;
}

export interface SaleItemCreate {
  product_id: string;
  cantidad: number;
  precio_unitario?: number;
  descuento?: number;
}

export interface Sale {
  id: string;
  business_id: string;
  numero_venta: string;
  fecha_venta: string;
  estado: SaleStatus;
  subtotal: number;
  descuento: number;
  iva: number;
  ice: number;
  total: number;
  metodo_pago: PaymentMethod;
  estado_pago: PaymentStatus;
  fecha_pago?: string;
  factura_id?: string;
  pdf_url?: string;
  tipo_comprobante?: 'CONSUMIDOR_FINAL' | 'FACTURA';
  customer_id?: string;
  customer_name?: string;
  customer_phone?: string;
  customer_email?: string;
  customer_identification?: string;
  notas?: string;
  notas_internas?: string;
  items: SaleItem[];
  created_at: string;
  created_by?: string;
  confirmado_en?: string;
  completado_en?: string;
  cancelado_en?: string;
  motivo_cancelacion?: string;
}

export interface SaleCreate {
  customer_id?: string;
  customer_phone?: string;
  customer_email?: string;
  tipo_comprobante?: 'CONSUMIDOR_FINAL' | 'FACTURA';
  items: SaleItemCreate[];
  metodo_pago?: PaymentMethod;
  descuento?: number;
  tipo_descuento?: 'percentage' | 'fixed';
  notas?: string;
  enviar_whatsapp?: boolean;
}

export interface SaleUpdate {
  estado?: SaleStatus;
  metodo_pago?: PaymentMethod;
  estado_pago?: PaymentStatus;
  notas?: string;
  notas_internas?: string;
  motivo_cancelacion?: string;
}

export interface SaleListResponse {
  id: string;
  numero_venta: string;
  fecha_venta: string;
  customer_name?: string;
  customer_phone?: string;
  estado: SaleStatus;
  total: number;
  estado_pago: PaymentStatus;
  factura_id?: string;
}
