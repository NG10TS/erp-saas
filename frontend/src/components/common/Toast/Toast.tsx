import React from 'react';
import { Toaster, toast as hotToast } from 'react-hot-toast';

export const ToastProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  return (
    <>
      {children}
      <Toaster
        position="top-right"
        toastOptions={{
          duration: 4000,
          style: {
            background: '#ffffff',
            color: '#0f172a',
            border: '1px solid #d1fae5',
            borderRadius: '18px',
            padding: '12px 16px',
            boxShadow: '0 12px 35px -12px rgba(15, 23, 42, 0.18)',
          },
          success: {
            iconTheme: {
              primary: '#10b981',
              secondary: '#ffffff',
            },
          },
          error: {
            style: {
              border: '1px solid #fecaca',
            },
            iconTheme: {
              primary: '#ef4444',
              secondary: '#ffffff',
            },
          },
        }}
      />
    </>
  );
};

export const toast = hotToast;
