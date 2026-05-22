import React from 'react';
import { clsx } from 'clsx';

interface LoadingProps {
  size?: 'sm' | 'md' | 'lg';
  fullScreen?: boolean;
  text?: string;
}

export const Loading: React.FC<LoadingProps> = ({
  size = 'md',
  fullScreen = false,
  text = '',
}) => {
  const sizes = {
    sm: 'w-5 h-5',
    md: 'w-8 h-8',
    lg: 'w-12 h-12',
  };

  const spinner = (
    <div className="flex flex-col items-center justify-center space-y-3">
      <div
        className={clsx(
          'animate-spin rounded-full border-4 border-gray-200 border-t-emerald-500',
          sizes[size]
        )}
      />
      {text ? <p className="text-sm text-gray-500">{text}</p> : null}
    </div>
  );

  if (fullScreen) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-white/80 backdrop-blur-sm">
        {spinner}
      </div>
    );
  }

  return spinner;
};
