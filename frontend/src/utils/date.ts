import { format, parseISO, differenceInDays, differenceInHours, isToday, isYesterday, isThisWeek } from 'date-fns';
import { es } from 'date-fns/locale';

export const date = {
  format: (date: string | Date, formatStr: string = 'dd/MM/yyyy'): string => {
    const d = typeof date === 'string' ? parseISO(date) : date;
    return format(d, formatStr, { locale: es });
  },
  
  formatDateTime: (date: string | Date): string => {
    const d = typeof date === 'string' ? parseISO(date) : date;
    return format(d, "dd/MM/yyyy 'a las' HH:mm", { locale: es });
  },
  
  formatRelative: (date: string | Date): string => {
    const d = typeof date === 'string' ? parseISO(date) : date;
    const now = new Date();
    
    if (isToday(d)) {
      return `hoy a las ${format(d, 'HH:mm')}`;
    }
    if (isYesterday(d)) {
      return `ayer a las ${format(d, 'HH:mm')}`;
    }
    if (isThisWeek(d)) {
      return format(d, "EEEE 'a las' HH:mm", { locale: es });
    }
    return format(d, "dd/MM/yyyy 'a las' HH:mm", { locale: es });
  },
  
  fromNow: (date: string | Date): string => {
    const d = typeof date === 'string' ? parseISO(date) : date;
    const now = new Date();
    const daysDiff = differenceInDays(now, d);
    const hoursDiff = differenceInHours(now, d);
    
    if (daysDiff === 0) {
      if (hoursDiff === 0) return 'hace unos momentos';
      if (hoursDiff === 1) return 'hace 1 hora';
      return `hace ${hoursDiff} horas`;
    }
    if (daysDiff === 1) return 'hace 1 día';
    if (daysDiff < 7) return `hace ${daysDiff} días`;
    return format(d, "dd/MM/yyyy");
  },
  
  getWeekRange: (date: Date = new Date()): { start: Date; end: Date } => {
    const start = new Date(date);
    start.setDate(start.getDate() - start.getDay());
    start.setHours(0, 0, 0, 0);
    
    const end = new Date(start);
    end.setDate(end.getDate() + 6);
    end.setHours(23, 59, 59, 999);
    
    return { start, end };
  },
  
  getMonthRange: (date: Date = new Date()): { start: Date; end: Date } => {
    const start = new Date(date.getFullYear(), date.getMonth(), 1);
    const end = new Date(date.getFullYear(), date.getMonth() + 1, 0, 23, 59, 59, 999);
    return { start, end };
  },
};