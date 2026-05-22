export const currency = {
  format: (value: number): string => {
    return new Intl.NumberFormat('es-EC', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(value);
  },
  
  parse: (value: string): number => {
    const cleaned = value.replace(/[^\d.-]/g, '');
    return parseFloat(cleaned) || 0;
  },
  
  calculateTotal: (items: Array<{ quantity: number; price: number; discount?: number }>): number => {
    return items.reduce((total, item) => {
      const subtotal = item.quantity * item.price;
      const discount = item.discount || 0;
      return total + subtotal - discount;
    }, 0);
  },
  
  calculateIVA: (subtotal: number, rate: number = 15): number => {
    return subtotal * (rate / 100);
  },
  
  calculateTotalWithIVA: (subtotal: number, rate: number = 15): number => {
    return subtotal + currency.calculateIVA(subtotal, rate);
  },
};