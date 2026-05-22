import React from 'react';
import { cn } from '@/lib/utils';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost';
  size?: 'sm' | 'md' | 'lg';
  loading?: boolean;
  icon?: React.ReactNode;
  iconPosition?: 'left' | 'right';
  fullWidth?: boolean;
}

export const Button: React.FC<ButtonProps> = ({
  children,
  variant = 'primary',
  size = 'md',
  loading,
  icon: Icon,
  iconPosition = 'left',
  fullWidth,
  className,
  disabled,
  ...props
}) => {
  const variants = {
    primary: 'bg-primary-600 text-white hover:bg-primary-700 shadow-lg shadow-primary-600/20 hover:shadow-primary-600/30',
    secondary: 'bg-secondary-600 text-white hover:bg-secondary-700 shadow-lg shadow-secondary-600/20',
    outline: 'border-2 border-gray-200 text-gray-700 hover:border-primary-500 hover:text-primary-600 hover:bg-primary-50',
    ghost: 'text-gray-600 hover:text-gray-900 hover:bg-gray-100',
  };
  
  const sizes = {
    sm: 'px-4 py-2 text-sm rounded-lg',
    md: 'px-6 py-3 text-base rounded-xl',
    lg: 'px-8 py-4 text-lg rounded-2xl',
  };

  return (
    <button
      className={cn(
        "relative font-semibold transition-all duration-200",
        "disabled:opacity-50 disabled:cursor-not-allowed",
        "focus:outline-none focus:ring-4 focus:ring-primary-500/20",
        variants[variant],
        sizes[size],
        fullWidth && "w-full",
        className
      )}
      disabled={loading || disabled}
      {...props}
    >
      <div className="flex items-center justify-center gap-2">
        {loading ? (
          <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
        ) : (
          <>
            {Icon && iconPosition === 'left' && Icon}
            {children}
            {Icon && iconPosition === 'right' && Icon}
          </>
        )}
      </div>
    </button>
  );
};
