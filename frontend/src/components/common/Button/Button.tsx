import React from 'react';
import { clsx } from 'clsx';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'outline' | 'danger' | 'success' | 'ghost';
  size?: 'sm' | 'md' | 'lg';
  loading?: boolean;
  fullWidth?: boolean;
  icon?: React.ReactNode;
  iconPosition?: 'left' | 'right';
}

export const Button: React.FC<ButtonProps> = ({
  children,
  variant = 'primary',
  size = 'md',
  loading = false,
  fullWidth = false,
  icon,
  iconPosition = 'left',
  className,
  disabled,
  ...props
}) => {
  const baseStyles = 'inline-flex items-center justify-center gap-2 font-medium rounded-2xl transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none active:scale-[0.99]';
  
  const variants = {
    primary: 'bg-emerald-500 text-white shadow-sm hover:bg-emerald-600 hover:shadow-medium focus:ring-emerald-500',
    secondary: 'bg-emerald-50 text-emerald-700 hover:bg-emerald-100 focus:ring-emerald-300',
    outline: 'border border-emerald-200 bg-white text-emerald-700 hover:border-emerald-300 hover:bg-emerald-50 focus:ring-emerald-300',
    danger: 'bg-red-500 text-white shadow-sm hover:bg-red-600 hover:shadow-medium focus:ring-red-400',
    success: 'bg-emerald-600 text-white shadow-sm hover:bg-emerald-700 hover:shadow-medium focus:ring-emerald-500',
    ghost: 'bg-transparent text-gray-600 hover:bg-gray-100 hover:text-gray-900 focus:ring-gray-300',
  };
  
  const sizes = {
    sm: 'px-3 py-2 text-sm',
    md: 'px-4 py-2.5 text-sm',
    lg: 'px-6 py-3 text-base',
  };
  
  return (
    <button
      className={clsx(
        baseStyles,
        variants[variant],
        sizes[size],
        fullWidth && 'w-full',
        className
      )}
      disabled={disabled || loading}
      {...props}
    >
      {loading && (
        <svg className="h-4 w-4 animate-spin text-current" fill="none" viewBox="0 0 24 24" aria-hidden="true">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
        </svg>
      )}
      {icon && iconPosition === 'left' && !loading && <span aria-hidden="true">{icon}</span>}
      {children}
      {icon && iconPosition === 'right' && !loading && <span aria-hidden="true">{icon}</span>}
    </button>
  );
};
