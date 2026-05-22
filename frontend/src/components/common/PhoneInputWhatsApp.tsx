// src/components/common/PhoneInputWhatsApp.tsx
import React, {
  useState,
  useRef,
  useCallback,
  useEffect,
  useMemo,
} from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, ChevronDown, Check } from 'lucide-react';
import { countries, Country, DEFAULT_COUNTRY } from '@/data/countries';
import { cn } from '@/lib/utils';

interface PhoneInputWhatsAppProps {
  value: string;
  onChange: (value: string) => void;
  className?: string;
  disabled?: boolean;
  error?: boolean;
  placeholder?: string;
}

export const PhoneInputWhatsApp: React.FC<PhoneInputWhatsAppProps> = ({
  value,
  onChange,
  className = '',
  disabled = false,
  error = false,
  placeholder,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCountry, setSelectedCountry] = useState<Country>(DEFAULT_COUNTRY);
  const [focusedIndex, setFocusedIndex] = useState(-1);

  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLUListElement>(null);

  const localDigits = useMemo(() => {
    const digits = value.replace(/\D/g, '');
    const dialDigits = selectedCountry.dialCode.replace(/\D/g, '');
    if (digits.startsWith(dialDigits)) {
      return digits.slice(dialDigits.length);
    }
    return '';
  }, [value, selectedCountry.dialCode]);

  const formattedLocal = useMemo(() => {
    if (!localDigits) return '';
    let result = '';
    let digitIndex = 0;
    for (const groupSize of selectedCountry.pattern) {
      if (digitIndex >= localDigits.length) break;
      const chunk = localDigits.slice(digitIndex, digitIndex + groupSize);
      if (chunk.length > 0) {
        result += (result ? ' ' : '') + chunk;
        digitIndex += chunk.length;
      }
    }
    if (digitIndex < localDigits.length) {
      result += (result ? ' ' : '') + localDigits.slice(digitIndex);
    }
    return result;
  }, [localDigits, selectedCountry.pattern]);

  const displayValue = useMemo(() => {
    if (!formattedLocal) return selectedCountry.dialCode;
    return `${selectedCountry.dialCode} ${formattedLocal}`;
  }, [selectedCountry.dialCode, formattedLocal]);

  const filteredCountries = useMemo(() => {
    if (!searchTerm) return countries;
    const term = searchTerm.toLowerCase();
    return countries.filter(
      (c) =>
        c.name.toLowerCase().includes(term) ||
        c.dialCode.includes(term) ||
        c.iso.toLowerCase().includes(term)
    );
  }, [searchTerm]);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
        setSearchTerm('');
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  useEffect(() => {
    if (isOpen && searchInputRef.current) {
      setTimeout(() => searchInputRef.current?.focus(), 50);
    }
  }, [isOpen]);

  const createE164Value = useCallback(
    (rawDigits: string): string => {
      const truncated = rawDigits.replace(/\D/g, '').slice(0, selectedCountry.maxDigits);
      return `${selectedCountry.dialCode}${truncated}`;
    },
    [selectedCountry.dialCode, selectedCountry.maxDigits]
  );

  const handleInputChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const cursorPosition = e.target.selectionStart || 0;
      const valueBeforeCursor = displayValue.slice(0, cursorPosition);
      const digitsBeforeCursor = valueBeforeCursor.replace(/[^\d]/g, '').length;
      const currentLocalDigits = localDigits;
      const dialDigitsCount = selectedCountry.dialCode.replace(/[^\d]/g, '').length;

      let newLocalDigits = '';
      const rawWithoutFormat = e.target.value.replace(/[^\d]/g, '');
      if (rawWithoutFormat.length > dialDigitsCount) {
        newLocalDigits = rawWithoutFormat.slice(dialDigitsCount);
      }
      newLocalDigits = newLocalDigits.slice(0, selectedCountry.maxDigits);

      const newValue = createE164Value(newLocalDigits);

      const newFormattedLocal = formatLocalDigitsFn(newLocalDigits, selectedCountry.pattern);
      const newDisplayValue = newFormattedLocal
        ? `${selectedCountry.dialCode} ${newFormattedLocal}`
        : selectedCountry.dialCode;

      let newCursorPos = selectedCountry.dialCode.length + 1;
      let digitCount = 0;
      for (let i = 0; i < newFormattedLocal.length; i++) {
        if (newFormattedLocal[i] !== ' ') digitCount++;
        if (digitCount <= digitsBeforeCursor - dialDigitsCount) {
          newCursorPos = selectedCountry.dialCode.length + 1 + i + 1;
        }
      }
      if (newLocalDigits.length < currentLocalDigits.length) {
        newCursorPos = Math.min(newCursorPos, newDisplayValue.length);
      }

      onChange(newValue);

      requestAnimationFrame(() => {
        if (inputRef.current) {
          inputRef.current.setSelectionRange(newCursorPos, newCursorPos);
        }
      });
    },
    [displayValue, localDigits, selectedCountry, onChange, createE164Value]
  );

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLInputElement>) => {
      if (e.key === 'Backspace' || e.key === 'Delete') {
        const cursorPosition = inputRef.current?.selectionStart || 0;
        const valueBeforeCursor = displayValue.slice(0, cursorPosition);
        const digitsBeforeCursor = valueBeforeCursor.replace(/[^\d]/g, '').length;
        const dialDigitsCount = selectedCountry.dialCode.replace(/[^\d]/g, '').length;
        if (digitsBeforeCursor <= dialDigitsCount) {
          e.preventDefault();
        }
      }
    },
    [displayValue, selectedCountry.dialCode]
  );

  const handleCountrySelect = useCallback(
    (country: Country) => {
      setSelectedCountry(country);
      setIsOpen(false);
      setSearchTerm('');
      setFocusedIndex(-1);
      const newValue = localDigits
        ? `${country.dialCode}${localDigits.slice(0, country.maxDigits)}`
        : country.dialCode;
      onChange(newValue);
      setTimeout(() => inputRef.current?.focus(), 100);
    },
    [localDigits, onChange]
  );

  const handleDropdownKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (!isOpen) return;
      if (e.key === 'ArrowDown') {
        e.preventDefault();
        setFocusedIndex((prev) => (prev < filteredCountries.length - 1 ? prev + 1 : 0));
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        setFocusedIndex((prev) => (prev > 0 ? prev - 1 : filteredCountries.length - 1));
      } else if (e.key === 'Enter' && focusedIndex >= 0) {
        e.preventDefault();
        handleCountrySelect(filteredCountries[focusedIndex]);
      } else if (e.key === 'Escape') {
        setIsOpen(false);
        setSearchTerm('');
        inputRef.current?.focus();
      }
    },
    [isOpen, filteredCountries, focusedIndex, handleCountrySelect]
  );

  useEffect(() => {
    if (focusedIndex >= 0 && listRef.current) {
      const items = listRef.current.children;
      if (items[focusedIndex]) {
        (items[focusedIndex] as HTMLLIElement).scrollIntoView({
          block: 'nearest',
          behavior: 'smooth',
        });
      }
    }
  }, [focusedIndex]);

  const defaultPlaceholder = placeholder || '99 999 9999';

  return (
    <div ref={containerRef} className={`relative ${className}`}>
        {/* ✅ SIN BORDE, SIN FONDO - El wrapper externo ya tiene el estilo */}
        <div
        className={`
            flex items-center w-full !bg-transparent
            ${disabled ? 'opacity-50 cursor-not-allowed' : ''}
        `}
        style={{ background: 'transparent' }}
        >
        {/* Selector de país - SIN FONDO */}
        <button
            type="button"
            disabled={disabled}
            onClick={(e) => {
            e.preventDefault();
            if (!disabled) {
                setIsOpen(!isOpen);
                setFocusedIndex(-1);
                setSearchTerm('');
            }
            }}
            className="flex items-center gap-1.5 py-1 hover:opacity-70 transition-opacity shrink-0 bg-transparent"
            aria-label="Seleccionar país"
        >
            <span className="text-lg leading-none">{selectedCountry.flag}</span>
            <ChevronDown
            className={`w-3.5 h-3.5 text-gray-400 transition-transform ${
                isOpen ? 'rotate-180' : ''
            }`}
            />
        </button>

        {/* Input transparente */}
        <input
            ref={inputRef}
            type="tel"
            value={displayValue}
            onChange={handleInputChange}
            onKeyDown={handleKeyDown}
            disabled={disabled}
            placeholder={defaultPlaceholder}
            className="w-full py-0 text-gray-900 placeholder:text-gray-400 text-sm ml-1 outline-none border-none focus:outline-none focus:ring-0 focus:border-none !bg-transparent"
            style={{ outline: 'none', boxShadow: 'none', border: 'none', background: 'transparent' }}
            aria-label="Número de teléfono"
        />
        </div>
        {/* ... dropdown ... */}
    </div>
    );
};

function formatLocalDigitsFn(digits: string, pattern: number[]): string {
  let result = '';
  let digitIndex = 0;
  for (const groupSize of pattern) {
    if (digitIndex >= digits.length) break;
    const chunk = digits.slice(digitIndex, digitIndex + groupSize);
    if (chunk.length > 0) {
      result += (result ? ' ' : '') + chunk;
      digitIndex += chunk.length;
    }
  }
  if (digitIndex < digits.length) {
    result += (result ? ' ' : '') + digits.slice(digitIndex);
  }
  return result;
}

export default PhoneInputWhatsApp;