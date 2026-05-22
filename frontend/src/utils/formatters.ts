import { format } from 'date-fns';
import { es } from 'date-fns/locale';

export const formatCurrency = (value: number | string | null | undefined): string => {
  if (value === null || value === undefined) return '$0.00';
  const num = typeof value === 'number' ? value : parseFloat(value);
  if (isNaN(num)) return '$0.00';
  
  return new Intl.NumberFormat('es-EC', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(num);
};

export const formatDate = (date: string | Date | null | undefined, formatStr: string = 'dd/MM/yyyy'): string => {
  if (!date) return 'No disponible';
  
  try {
    const d = typeof date === 'string' ? new Date(date) : date;
    if (isNaN(d.getTime())) return 'Fecha inválida';
    return format(d, formatStr, { locale: es });
  } catch (error) {
    return 'Fecha inválida';
  }
};

export const formatDateTime = (date: string | Date | null | undefined): string => {
  if (!date) return 'No disponible';
  
  try {
    const d = typeof date === 'string' ? new Date(date) : date;
    if (isNaN(d.getTime())) return 'Fecha inválida';
    return format(d, "dd/MM/yyyy 'a las' HH:mm", { locale: es });
  } catch (error) {
    return 'Fecha inválida';
  }
};

export const formatPhone = (phone: string): string => {
  if (!phone) return '';
  const cleaned = phone.replace(/\D/g, '');
  if (cleaned.length === 10) {
    return cleaned.replace(/(\d{3})(\d{3})(\d{4})/, '($1) $2-$3');
  }
  if (cleaned.length === 13 && cleaned.startsWith('593')) {
    return `+${cleaned.slice(0, 3)} ${cleaned.slice(3, 6)} ${cleaned.slice(6, 9)} ${cleaned.slice(9)}`;
  }
  return phone;
};

export const formatRUC = (ruc: string): string => {
  if (!ruc) return '';
  return ruc.replace(/(\d{3})(\d{3})(\d{3})(\d{4})/, '$1-$2-$3-$4');
};

export const formatCedula = (cedula: string): string => {
  if (!cedula) return '';
  return cedula.replace(/(\d{3})(\d{3})(\d{4})/, '$1-$2-$3');
};

export const truncate = (text: string, length: number = 50): string => {
  if (!text) return '';
  if (text.length <= length) return text;
  return text.substring(0, length) + '...';
};

export const capitalize = (text: string): string => {
  if (!text) return '';
  return text.charAt(0).toUpperCase() + text.slice(1).toLowerCase();
};

export const getInitials = (name: string): string => {
  if (!name) return '';
  return name
    .split(' ')
    .map(word => word[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);
};
// src/utils/formatters.ts (agregar esta función)
export const formatPrice = (value: any): string => {
  if (value === null || value === undefined) return '$0.00';
  
  // Convertir a número de forma segura
  let num: number;
  if (typeof value === 'number') {
    num = value;
  } else if (typeof value === 'string') {
    num = parseFloat(value);
  } else if (value.toString) {
    num = parseFloat(value.toString());
  } else {
    return '$0.00';
  }
  
  if (isNaN(num)) return '$0.00';
  
  return new Intl.NumberFormat('es-EC', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(num);
};

export const formatNumber = (value: any, decimals: number = 2): string => {
  if (value === null || value === undefined) return '0';
  
  let num: number;
  if (typeof value === 'number') {
    num = value;
  } else if (typeof value === 'string') {
    num = parseFloat(value);
  } else if (value.toString) {
    num = parseFloat(value.toString());
  } else {
    return '0';
  }
  
  if (isNaN(num)) return '0';
  
  return num.toFixed(decimals);
};