export const COUNTRIES = [
  { code: 'EC', name: 'Ecuador', phoneCode: '+593' },
  { code: 'CO', name: 'Colombia', phoneCode: '+57' },
  { code: 'PE', name: 'Perú', phoneCode: '+51' },
  { code: 'CL', name: 'Chile', phoneCode: '+56' },
  { code: 'AR', name: 'Argentina', phoneCode: '+54' },
  { code: 'MX', name: 'México', phoneCode: '+52' },
  { code: 'US', name: 'Estados Unidos', phoneCode: '+1' },
];

export const CURRENCIES = [
  { code: 'USD', name: 'Dólar Americano', symbol: '$' },
  { code: 'COP', name: 'Peso Colombiano', symbol: '$' },
  { code: 'PEN', name: 'Sol Peruano', symbol: 'S/' },
  { code: 'CLP', name: 'Peso Chileno', symbol: '$' },
  { code: 'ARS', name: 'Peso Argentino', symbol: '$' },
  { code: 'MXN', name: 'Peso Mexicano', symbol: '$' },
];

export const PAYMENT_METHODS = [
  { value: 'cash', label: 'Efectivo', icon: '💰' },
  { value: 'transfer', label: 'Transferencia', icon: '🏦' },
  { value: 'card', label: 'Tarjeta', icon: '💳' },
  { value: 'qr', label: 'Código QR', icon: '📱' },
  { value: 'mixed', label: 'Mixto', icon: '🔄' },
];

export const SALE_STATUS = {
  pending: { label: 'Pendiente', color: 'warning' },
  confirmed: { label: 'Confirmada', color: 'info' },
  processing: { label: 'Procesando', color: 'secondary' },
  completed: { label: 'Completada', color: 'success' },
  cancelled: { label: 'Cancelada', color: 'error' },
};

export const INVOICE_STATUS = {
  draft: { label: 'Borrador', color: 'gray' },
  pending: { label: 'Pendiente', color: 'warning' },
  sent: { label: 'Enviado', color: 'info' },
  authorized: { label: 'Autorizado', color: 'success' },
  rejected: { label: 'Rechazado', color: 'error' },
  cancelled: { label: 'Anulado', color: 'gray' },
};

export const PRODUCT_CATEGORIES = [
  'Alimentos',
  'Bebidas',
  'Electrónica',
  'Ropa',
  'Calzado',
  'Hogar',
  'Salud',
  'Belleza',
  'Deportes',
  'Juguetes',
  'Libros',
  'Servicios',
  'Otros',
];

export const TAX_RATES = [
  { value: 0, label: '0%', code: '0' },
  { value: 12, label: '12%', code: '2' },
  { value: 14, label: '14%', code: '3' },
  { value: 15, label: '15%', code: '4' },
];