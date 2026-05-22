// src/utils/error-handler.ts
import toast from 'react-hot-toast';

/**
 * Extrae el mensaje de error del backend en cualquier formato conocido.
 * Centraliza TODA la lógica de extracción de errores.
 */
export const extractErrorMessage = (error: any, fallback = 'Error desconocido'): string => {
  const data = error?.response?.data;
  const status = error?.response?.status;

  // 1. Formato nuevo: { error: { message: "..." } }
  if (data?.error?.message) return data.error.message;

  // 2. Formato FastAPI: { detail: "..." }
  if (data?.detail) return data.detail;

  // 3. Formato simple: { message: "..." }
  if (data?.message) return data.message;

  // 4. String plano: "(400, 'Email ya registrado')"
  if (typeof data === 'string') {
    const match = data.match(/'([^']+)'/);
    if (match?.[1]) return match[1];
    return data;
  }

  // 5. Por código HTTP
  const statusMessages: Record<number, string> = {
    400: 'Datos inválidos',
    401: 'Sesión expirada. Inicia sesión nuevamente.',
    403: 'No tienes permiso para esta acción.',
    404: 'No encontrado.',
    409: 'El recurso ya existe.',
    422: 'Datos inválidos.',
    429: 'Demasiadas solicitudes. Espera.',
    500: 'Error del servidor.',
  };

  if (status && statusMessages[status]) return statusMessages[status];

  // 6. Fallback
  return error?.message || fallback;
};

/**
 * Muestra un toast de error. Úsalo directamente en onError.
 */
export const handleError = (error: any, fallback?: string): void => {
  const message = extractErrorMessage(error, fallback);
  console.error('Error:', message, error);
  toast.error(message);
};