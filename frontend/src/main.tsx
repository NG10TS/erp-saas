import React from 'react';
import ReactDOM from 'react-dom/client';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ReactQueryDevtools } from '@tanstack/react-query-devtools';
import { ToastProvider } from '@/components/common/Toast/Toast';
import { HelmetProvider } from 'react-helmet-async';  // ← AGREGAR
import { App } from './App';
import '@/styles/globals.css';

const queryClient = new QueryClient();

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <HelmetProvider>  {/* ← ENVOLVER */}
      <QueryClientProvider client={queryClient}>
        <ToastProvider>
          <App />
        </ToastProvider>
        
      </QueryClientProvider>
    </HelmetProvider>
  </React.StrictMode>
);