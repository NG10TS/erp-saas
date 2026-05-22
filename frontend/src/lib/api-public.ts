// src/lib/api-public.ts
import axios from 'axios';

// Cliente para peticiones que NUNCA deben tener autenticación
export const publicApi = axios.create({
  baseURL: import.meta.env.VITE_API_URL || '/api/v1',
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// No agregar interceptores a este cliente
// Esto asegura que NUNCA se enviará un token automáticamente
