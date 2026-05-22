// src/components/common/FormInput.tsx
import React, { forwardRef, useState } from 'react';
import { EyeIcon, EyeSlashIcon } from '@heroicons/react/24/outline';
import { cn } from '@/lib/utils';

interface FormInputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label: string;
  icon?: React.ElementType;
  error?: string;
  showPasswordToggle?: boolean;
  helper?: string;
}

export const FormInput = forwardRef<HTMLInputElement, FormInputProps>(
  ({ label, icon: Icon, error, showPasswordToggle, type = 'text', helper, className, ...props }, ref) => {
    const [showPassword, setShowPassword] = useState(false);
    const inputType = showPasswordToggle && type === 'password' ? (showPassword ? 'text' : 'password') : type;

    return (
      <div>
        <label className="mb-1.5 block text-sm font-medium text-gray-700">
          {label}
          {props.required && <span className="ml-0.5 text-red-500">*</span>}
        </label>
        <div className="relative">
          {Icon && (
            <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-4">
              <Icon className="h-5 w-5 text-gray-400" />
            </div>
          )}
          <input
            ref={ref}
            type={inputType}
            className={cn(
              'w-full rounded-2xl border bg-white py-3.5 text-gray-900 placeholder:text-gray-400 shadow-xs',
              'transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-emerald-500/20',
              Icon ? 'pl-12' : 'pl-4',
              showPasswordToggle ? 'pr-12' : 'pr-4',
              error
                ? 'border-red-300 bg-red-50/50 focus:border-red-500'
                : 'border-gray-200 hover:border-emerald-200 focus:border-emerald-500',
              className
            )}
            {...props}
          />
          {showPasswordToggle && type === 'password' && (
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute inset-y-0 right-0 flex items-center pr-4 text-gray-400 hover:text-gray-600"
            >
              {showPassword ? <EyeSlashIcon className="h-5 w-5" /> : <EyeIcon className="h-5 w-5" />}
            </button>
          )}
        </div>
        {helper && !error && <p className="mt-1.5 text-xs text-gray-500">{helper}</p>}
        {error && <p className="mt-1.5 text-sm text-red-500">{error}</p>}
      </div>
    );
  }
);

FormInput.displayName = 'FormInput';
