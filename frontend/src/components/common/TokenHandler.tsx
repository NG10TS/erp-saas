// frontend/src/components/common/TokenHandler.tsx
import { useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useAuthStore } from '@/store/slices/authSlice';

export const TokenHandler: React.FC = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const initializeAuth = useAuthStore((state) => state.initializeAuth);

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const token = params.get('token');

    if (token) {
      console.log('🔑 TokenHandler - Token capturado en URL, guardando en localStorage');
      localStorage.setItem('access_token', token);
      console.log('✅ Token guardado en localStorage');
      
      // Inicializar autenticación con el nuevo token
      console.log('📡 Llamando a initializeAuth...');
      initializeAuth();
      
      // Limpiar la URL (remover el token)
      const newUrl = location.pathname;
      console.log('🔄 Limpiando URL a:', newUrl);
      navigate(newUrl, { replace: true });
    }
  }, [location, navigate, initializeAuth]);

  return null;
};