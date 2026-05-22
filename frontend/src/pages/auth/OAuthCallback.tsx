// frontend/src/pages/auth/OAuthCallback.tsx
import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Loader2 } from 'lucide-react';

export const OAuthCallback = () => {
  const navigate = useNavigate();
  const [error, setError] = useState<string | null>(null);
  
  useEffect(() => {
    console.log('🔍 OAuthCallback - URL:', window.location.href);
    
    const params = new URLSearchParams(window.location.search);
    const token = params.get('token');
    const errorParam = params.get('error');
    
    console.log('🔍 Token encontrado:', token ? 'Sí' : 'No');
    
    if (token) {
      console.log('✅ Token recibido en OAuthCallback');
      localStorage.setItem('access_token', token);
      localStorage.removeItem('auth-storage');
      
      // Dar tiempo para que se sincronicen antes de navegar
      setTimeout(() => {
        window.location.href = '/app/dashboard';
      }, 100);
    } else if (errorParam) {
      console.error('❌ Error OAuth:', errorParam);
      setError(errorParam);
      
      // Redirigir después de 3 segundos
      setTimeout(() => {
        navigate('/login', { replace: true });
      }, 3000);
    } else {
      console.error('❌ No token found in OAuth callback');
      navigate('/login', { replace: true });
    }
  }, [navigate]);
  
  if (error) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-red-50 to-white">
        <div className="text-center bg-white p-8 rounded-2xl shadow-lg max-w-md">
          <div className="w-16 h-16 rounded-full bg-red-100 flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </div>
          <h2 className="text-xl font-bold text-gray-900 mb-2">Error de autenticación</h2>
          <p className="text-gray-600 mb-4">
            {error === 'access_denied' && 'Acceso denegado por Google'}
            {error === 'invalid_state' && 'Solicitud de seguridad inválida'}
            {error === 'server_error' && 'Error del servidor'}
            {!['access_denied', 'invalid_state', 'server_error'].includes(error) && error}
          </p>
          <p className="text-sm text-gray-500">Redirigiendo a inicio de sesión...</p>
        </div>
      </div>
    );
  }
  
  return (
    <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-emerald-50 to-white">
      <div className="text-center">
        <Loader2 className="w-12 h-12 text-emerald-500 animate-spin mx-auto mb-4" />
        <p className="text-gray-600 font-medium">Iniciando sesión...</p>
        <p className="text-sm text-gray-500 mt-2">Por favor, espera un momento</p>
      </div>
    </div>
  );
};