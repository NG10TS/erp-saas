export const validateRUC = (ruc: string): boolean => {
  if (!ruc) return false;
  const cleaned = ruc.replace(/\D/g, '');
  if (cleaned.length !== 13) return false;
  // Validación básica - en producción implementar algoritmo completo
  return /^\d+$/.test(cleaned);
};

export const validateCedula = (cedula: string): boolean => {
  if (!cedula) return false;
  const cleaned = cedula.replace(/\D/g, '');
  if (cleaned.length !== 10) return false;
  
  // Algoritmo de validación de cédula ecuatoriana
  const digits = cleaned.split('').map(Number);
  const province = parseInt(cleaned.substring(0, 2), 10);
  if (province < 1 || province > 24) return false;
  
  const thirdDigit = digits[2];
  if (thirdDigit > 5) return false;
  
  let sum = 0;
  for (let i = 0; i < 9; i++) {
    let value = digits[i] * (i % 2 === 0 ? 2 : 1);
    if (value > 9) value -= 9;
    sum += value;
  }
  
  const checkDigit = (10 - (sum % 10)) % 10;
  return checkDigit === digits[9];
};

export const validateEmail = (email: string): boolean => {
  const regex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
  return regex.test(email);
};

export const validatePhone = (phone: string): boolean => {
  const cleaned = phone.replace(/\D/g, '');
  return cleaned.length >= 9 && cleaned.length <= 10;
};

export const validateSKU = (sku: string): boolean => {
  return /^[A-Za-z0-9\-_]+$/.test(sku);
};

export const validatePositiveNumber = (value: number): boolean => {
  return value > 0;
};

export const validateNonNegative = (value: number): boolean => {
  return value >= 0;
};