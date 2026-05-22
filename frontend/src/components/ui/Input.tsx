import React, { forwardRef } from 'react';
import { cn } from '@/lib/utils';
import { motion, AnimatePresence } from 'framer-motion';
import { XMarkIcon, CheckCircleIcon } from '@heroicons/react/24/outline';

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  icon?: React.ComponentType<{ className?: string }>;
  success?: boolean;
  required?: boolean;
  helper?: string;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ 
    label, 
    error, 
    icon: Icon, 
    success, 
    required, 
    helper,
    className,
    id,
    ...props 
  }, ref) => {
    const [isFocused, setIsFocused] = React.useState(false);
    const inputId = id || `input-${Math.random().toString(36).substr(2, 9)}`;
    const hasValue = props.value && String(props.value).length > 0;

    return (
      <div className="space-y-1.5">
        {label && (
          <label 
            htmlFor={inputId}
            className="block text-sm font-medium text-gray-700"
          >
            {label}
            {required && <span className="text-red-500 ml-0.5">*</span>}
          </label>
        )}
        
        <div className="relative">
          {Icon && (
            <div className={cn(
              "absolute left-4 top-1/2 -translate-y-1/2 transition-colors duration-200",
              isFocused ? "text-primary-600" : error ? "text-red-400" : "text-gray-400"
            )}>
              <Icon className="w-5 h-5" />
            </div>
          )}
          
          <input
            ref={ref}
            id={inputId}
            onFocus={() => setIsFocused(true)}
            onBlur={() => setIsFocused(false)}
            className={cn(
              "w-full transition-all duration-200",
              "bg-white border-2 rounded-xl",
              "placeholder:text-gray-400",
              "focus:outline-none focus:ring-4",
              Icon ? "pl-11" : "pl-4",
              "pr-10",
              "py-3 text-base",
              error 
                ? "border-red-500 focus:border-red-500 focus:ring-red-500/10" 
                : success 
                ? "border-emerald-500 focus:border-emerald-500 focus:ring-emerald-500/10"
                : "border-gray-200 focus:border-primary-500 focus:ring-primary-500/10 hover:border-gray-300",
              className
            )}
            aria-invalid={!!error}
            aria-describedby={error ? `${inputId}-error` : helper ? `${inputId}-helper` : undefined}
            {...props}
          />
          
          <AnimatePresence>
            {success && !error && (
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                exit={{ scale: 0 }}
                className="absolute right-4 top-1/2 -translate-y-1/2 text-emerald-500"
              >
                <CheckCircleIcon className="w-5 h-5" />
              </motion.div>
            )}
          </AnimatePresence>
        </div>
        
        <AnimatePresence>
          {error && (
            <motion.p
              initial={{ opacity: 0, y: -4 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -4 }}
              id={`${inputId}-error`}
              className="text-sm text-red-500 flex items-center gap-1"
            >
              <XMarkIcon className="w-3.5 h-3.5" />
              {error}
            </motion.p>
          )}
          {helper && !error && (
            <p id={`${inputId}-helper`} className="text-xs text-gray-500">
              {helper}
            </p>
          )}
        </AnimatePresence>
      </div>
    );
  }
);

Input.displayName = 'Input';