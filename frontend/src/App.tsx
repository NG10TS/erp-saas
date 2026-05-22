import { useEffect } from 'react';
import { useAuthStore } from '@/store/slices/authSlice';
import { RouterProvider } from 'react-router-dom';
import { router } from './routes';

export const App = () => {
  const initializeAuth = useAuthStore((state) => state.initializeAuth);

  useEffect(() => {
    initializeAuth();
  }, []);

    return (
    <RouterProvider
      router={router}
      future={{
        v7_startTransition: true
      }}
    />
  );
};