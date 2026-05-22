import React, { forwardRef } from 'react';
import { cn } from '@/lib/utils';
import { ChevronDownIcon } from '@heroicons/react/24/outline';

interface SelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  label?: string;
  error?: string;
  options: { value: string; label: string }[];
  required?: boolean;
}

export const Select = forwardRef<HTMLSelectElement, SelectProps>(
  ({ label, error, options, required, className, id, ...props }, ref) => {
    const selectId = id || `select-${Math.random().toString(36).substr(2, 9)}`;
    
    return (
      <div className="space-y-1.5">
        {label && (
          <label htmlFor={selectId} className="block text-sm font-medium text-gray-700">
            {label}
            {required && <span className="text-red-500 ml-0.5">*</span>}
          </label>
        )}
        
        <div className="relative">
          <select
            ref={ref}
            id={selectId}
            className={cn(
              "w-full px-4 py-3 bg-white border-2 rounded-xl",
              "text-gray-900 appearance-none",
              "focus:outline-none focus:ring-4 focus:border-primary-500 focus:ring-primary-500/10",
              "transition-all duration-200",
              error ? "border-red-500" : "border-gray-200 hover:border-gray-300",
              className
            )}
            aria-invalid={!!error}
            aria-describedby={error ? `${selectId}-error` : undefined}
            {...props}
          >
            {options.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
          
          <ChevronDownIcon className="absolute right-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 pointer-events-none" />
        </div>
        
        {error && (
          <p id={`${selectId}-error`} className="text-sm text-red-500 flex items-center gap-1">
            <span className="w-1 h-1 rounded-full bg-red-500" />
            {error}
          </p>
        )}
      </div>
    );
  }
);

Select.displayName = 'Select';