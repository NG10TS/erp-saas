// src/data/countries.ts

export interface Country {
  iso: string;
  name: string;
  dialCode: string;
  flag: string;
  maxDigits: number;
  pattern: number[]; // Grupos de dígitos para formateo
  placeholder: string;
}

/**
 * Catálogo de países con reglas de formateo para números telefónicos.
 * Cada país define su código de marcado internacional, bandera,
 * cantidad máxima de dígitos y patrón de agrupación visual.
 */
export const countries: Country[] = [
  {
    iso: 'EC',
    name: 'Ecuador',
    dialCode: '+593',
    flag: '🇪🇨',
    maxDigits: 9,
    pattern: [2, 3, 4],      // +593 XX XXX XXXX
    placeholder: '+593 99 999 9999',
  },
  {
    iso: 'US',
    name: 'Estados Unidos',
    dialCode: '+1',
    flag: '🇺🇸',
    maxDigits: 10,
    pattern: [3, 3, 4],      // +1 XXX XXX XXXX
    placeholder: '+1 555 123 4567',
  },
  {
    iso: 'MX',
    name: 'México',
    dialCode: '+52',
    flag: '🇲🇽',
    maxDigits: 10,
    pattern: [2, 4, 4],      // +52 XX XXXX XXXX
    placeholder: '+52 55 1234 5678',
  },
  {
    iso: 'CO',
    name: 'Colombia',
    dialCode: '+57',
    flag: '🇨🇴',
    maxDigits: 10,
    pattern: [3, 3, 4],      // +57 XXX XXX XXXX
    placeholder: '+57 320 123 4567',
  },
  {
    iso: 'PE',
    name: 'Perú',
    dialCode: '+51',
    flag: '🇵🇪',
    maxDigits: 9,
    pattern: [2, 3, 4],      // +51 XX XXX XXXX
    placeholder: '+51 99 999 9999',
  },
  {
    iso: 'AR',
    name: 'Argentina',
    dialCode: '+54',
    flag: '🇦🇷',
    maxDigits: 10,
    pattern: [4, 3, 3],      // +54 XXXX XXX XXX
    placeholder: '+54 1123 456 789',
  },
  {
    iso: 'CL',
    name: 'Chile',
    dialCode: '+56',
    flag: '🇨🇱',
    maxDigits: 9,
    pattern: [1, 4, 4],      // +56 X XXXX XXXX
    placeholder: '+56 9 1234 5678',
  },
  {
    iso: 'ES',
    name: 'España',
    dialCode: '+34',
    flag: '🇪🇸',
    maxDigits: 9,
    pattern: [3, 3, 3],      // +34 XXX XXX XXX
    placeholder: '+34 612 345 678',
  },
  {
    iso: 'BR',
    name: 'Brasil',
    dialCode: '+55',
    flag: '🇧🇷',
    maxDigits: 11,
    pattern: [2, 5, 4],      // +55 XX XXXXX XXXX
    placeholder: '+55 11 91234 5678',
  },
];

/**
 * País por defecto (Ecuador)
 */
export const DEFAULT_COUNTRY = countries[0];