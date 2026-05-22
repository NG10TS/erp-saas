/**
 * Página de verificación de email
 * 
 * Maneja dos casos:
 * 1. Redirección directa desde el backend (con status en URL)
 * 2. Token en URL para verificación (redirige al backend)
 * 
 * @module VerifyEmail
 */

import React, { useEffect, useState, useCallback } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { 
  CheckCircleIcon, 
  XCircleIcon, 
  EnvelopeIcon, 
  ArrowPathIcon,
  ArrowLeftIcon 
} from '@heroicons/react/24/outline';
import { authApi } from '@/services/api/auth';
import toast from 'react-hot-toast';

// Configuración
const API_URL = import.meta.env.VITE_API_URL || '/api/v1';
const STORAGE_KEYS = {
  PENDING_EMAIL: 'pending_verification_email'
} as const;

// Estados posibles
type VerificationStatus = 'loading' | 'success' | 'error' | 'redirecting';

interface VerificationState {
  status: VerificationStatus;
  message: string;
}

/**
 * Componente de verificación de email
 * Maneja el flujo completo de verificación con redirección segura
 */
export const VerifyEmail: React.FC = () => {
  const navigate = useNavigate();
  const [state, setState] = useState<VerificationState>({
    status: 'loading',
    message: ''
  });
  const [email, setEmail] = useState<string>('');

  /**
   * Procesa la verificación desde la URL
   */
  const processVerification = useCallback(async () => {
    const urlParams = new URLSearchParams(window.location.search);
    const token = urlParams.get('token');
    const statusParam = urlParams.get('status');
    const messageParam = urlParams.get('message');

    // 1. Caso: Redirección exitosa desde backend
    if (statusParam === 'success') {
      setState({
        status: 'success',
        message: messageParam ? decodeURIComponent(messageParam) : 'Email verificado correctamente'
      });
      localStorage.removeItem(STORAGE_KEYS.PENDING_EMAIL);
      return;
    }

    // 2. Caso: Redirección de error desde backend
    if (statusParam === 'error') {
      setState({
        status: 'error',
        message: messageParam ? decodeURIComponent(messageParam) : 'Error al verificar el email'
      });
      return;
    }

    // 3. Caso: Token presente - redirigir al backend para procesar
    if (token) {
      setState({ status: 'redirecting', message: 'Verificando tu cuenta...' });
      // Redirección directa - el navegador maneja la respuesta
      window.location.href = `${API_URL}/auth/verify-email?token=${encodeURIComponent(token)}`;
      return;
    }

    // 4. Caso: Sin token ni status - error
    setState({
      status: 'error',
      message: 'Token de verificación no encontrado'
    });
  }, []);

  /**
   * Recupera email pendiente de verificación
   */
  useEffect(() => {
    const pendingEmail = localStorage.getItem(STORAGE_KEYS.PENDING_EMAIL);
    if (pendingEmail) {
      setEmail(pendingEmail);
    }
  }, []);

  /**
   * Inicia el proceso de verificación al montar el componente
   */
  useEffect(() => {
    processVerification();
  }, [processVerification]);

  /**
   * Reenvía el email de verificación
   */
  const handleResendVerification = useCallback(async () => {
    if (!email) {
      toast.error('No tenemos tu email. Por favor regístrate nuevamente.');
      navigate('/register');
      return;
    }

    try {
      await authApi.resendVerification(email);
      toast.success('Email de verificación reenviado. Revisa tu bandeja de entrada.', {
        duration: 5000,
        icon: '📧'
      });
    } catch (error) {
      toast.error('Error al reenviar la verificación. Por favor intenta nuevamente.');
    }
  }, [email, navigate]);

  /**
   * Renderiza el contenido según el estado
   */
  const renderContent = () => {
    switch (state.status) {
      case 'redirecting':
        return (
          <>
            <div className="w-20 h-20 mx-auto bg-primary-100 rounded-full flex items-center justify-center mb-6">
              <EnvelopeIcon className="w-10 h-10 text-primary-600 animate-pulse" />
            </div>
            <h2 className="text-2xl font-bold text-gray-900 mb-2">
              Verificando tu cuenta
            </h2>
            <p className="text-gray-500 mb-4">
              {state.message}
            </p>
            <div className="flex justify-center">
              <div className="w-8 h-8 border-4 border-primary-600 border-t-transparent rounded-full animate-spin" />
            </div>
          </>
        );

      case 'success':
        return (
          <>
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ type: 'spring', stiffness: 200, damping: 20 }}
              className="w-20 h-20 mx-auto bg-green-100 rounded-full flex items-center justify-center mb-6"
            >
              <CheckCircleIcon className="w-10 h-10 text-green-600" />
            </motion.div>
            <h2 className="text-2xl font-bold text-gray-900 mb-2">
              ¡Email verificado!
            </h2>
            <p className="text-gray-500 mb-6">
              {state.message}
            </p>
            <Link
              to="/login"
              className="inline-flex items-center justify-center w-full py-3 bg-gradient-to-r from-primary-600 to-primary-500 text-white rounded-xl font-semibold hover:shadow-lg transition-all"
            >
              Iniciar sesión
            </Link>
          </>
        );

      case 'error':
        return (
          <>
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ type: 'spring', stiffness: 200, damping: 20 }}
              className="w-20 h-20 mx-auto bg-red-100 rounded-full flex items-center justify-center mb-6"
            >
              <XCircleIcon className="w-10 h-10 text-red-600" />
            </motion.div>
            <h2 className="text-2xl font-bold text-gray-900 mb-2">
              Error de verificación
            </h2>
            <p className="text-gray-500 mb-6">
              {state.message}
            </p>
            <div className="space-y-3">
              <button
                onClick={handleResendVerification}
                className="inline-flex items-center justify-center w-full py-3 border border-primary-600 text-primary-600 rounded-xl font-semibold hover:bg-primary-50 transition-all gap-2"
              >
                <ArrowPathIcon className="w-5 h-5" />
                Reenviar email de verificación
              </button>
              <Link
                to="/register"
                className="inline-flex items-center justify-center w-full py-3 text-gray-500 hover:text-gray-700 transition-colors gap-2"
              >
                <ArrowLeftIcon className="w-4 h-4" />
                Crear nueva cuenta
              </Link>
            </div>
          </>
        );

      default:
        return (
          <>
            <div className="w-20 h-20 mx-auto bg-primary-100 rounded-full flex items-center justify-center mb-6">
              <EnvelopeIcon className="w-10 h-10 text-primary-600 animate-pulse" />
            </div>
            <h2 className="text-2xl font-bold text-gray-900 mb-2">
              Verificando tu email
            </h2>
            <p className="text-gray-500">
              Por favor espera mientras verificamos tu cuenta...
            </p>
          </>
        );
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-50 via-white to-secondary-50 flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="max-w-md w-full bg-white rounded-2xl shadow-xl p-8 text-center"
      >
        {renderContent()}
      </motion.div>
    </div>
  );
};

export default VerifyEmail;
