// frontend/src/components/layout/RootLayout.tsx
import React from 'react';
import { Outlet } from 'react-router-dom';
import { TokenHandler } from '@/components/common/TokenHandler';
import { useAuthStore } from '@/store/slices/authSlice';

export const RootLayout: React.FC = () => {
  const { isLoading } = useAuthStore();

  // Opcional: muestra un loader global mientras se inicializa la autenticación
  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="w-8 h-8 border-4 border-emerald-600 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <>
      <TokenHandler />
      <Outlet />
    </>
  );
};