// src/components/common/Input.tsx
import React from 'react';
import { clsx } from 'clsx';

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  icon?: React.ReactNode;
  iconPosition?: 'left' | 'right';
  helper?: string;
}

export const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ label, error, icon, iconPosition = 'left', helper, className, ...props }, ref) => {
    return (
      <div className="w-full">
        {label && (
          <label className="block text-sm font-medium text-gray-700 mb-1">
            {label}
            {props.required && <span className="text-red-500 ml-0.5">*</span>}
          </label>
        )}
        <div className="relative">
          {icon && iconPosition === 'left' && (
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <span className="text-gray-400">{icon}</span>
            </div>
          )}
          <input
            ref={ref}
            className={clsx(
              'w-full px-4 py-3 border rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all',
              error ? 'border-red-500 bg-red-50' : 'border-gray-200 hover:border-gray-300',
              icon && iconPosition === 'left' && 'pl-10',
              icon && iconPosition === 'right' && 'pr-10',
              className
            )}
            {...props}
          />
          {icon && iconPosition === 'right' && (
            <div className="absolute inset-y-0 right-0 pr-3 flex items-center">
              <span className="text-gray-400">{icon}</span>
            </div>
          )}
        </div>
        {helper && !error && (
          <p className="mt-1 text-xs text-gray-400">{helper}</p>
        )}
        {error && (
          <p className="mt-1 text-sm text-red-500 flex items-center gap-1">
            <span className="text-xs">⚠️</span>
            {error}
          </p>
        )}
      </div>
    );
  }
);

Input.displayName = 'Input';