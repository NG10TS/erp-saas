export interface Product {
  id: string;
  business_id: string;
  sku?: string;
  barcode?: string;
  name: string;
  description?: string;
  category_id?: string;
  category_name?: string;
  
  precio_venta: number;
  precio_mayorista?: number;
  costo?: number;
  utilidad_porcentaje: number;
  
  impuesto_iva: number;
  codigo_iva_sri: string;
  tiene_ice: boolean;
  porcentaje_ice?: number;
  
  control_stock: boolean;
  stock_actual: number;
  stock_reservado: number;
  stock_disponible: number;
  stock_minimo: number;
  stock_maximo?: number;
  ubicacion?: string;
  
  es_servicio: boolean;
  is_active: boolean;
  
  imagen_url?: string;
  imagenes: string[];
  atributos: Record<string, any>;
  tags: string[];
  
  created_at: string;
  updated_at: string;
}

export interface ProductCreate {
  sku?: string;
  barcode?: string;
  name: string;
  description?: string;
  category_id?: string;
  precio_venta: number;
  precio_mayorista?: number;
  costo?: number;
  impuesto_iva?: number;
  codigo_iva_sri?: string;
  tiene_ice?: boolean;
  porcentaje_ice?: number;
  control_stock?: boolean;
  stock_actual?: number;
  stock_minimo?: number;
  stock_maximo?: number;
  ubicacion?: string;
  es_servicio?: boolean;
  imagen_url?: string;
  imagenes?: string[];
  atributos?: Record<string, any>;
  tags?: string[];
}

export interface ProductUpdate extends Partial<ProductCreate> {
  is_active?: boolean;
}

export interface StockAdjustment {
  cantidad: number;
  motivo: string;
  notas?: string;
}

export interface ProductListResponse {
  id: string;
  sku?: string;
  name: string;
  precio_venta: number;
  stock_actual: number;
  stock_disponible: number;
  stock_minimo?: number;
  category_name?: string;
  is_active: boolean;
  es_servicio: boolean;
  imagen_url?: string;
}
