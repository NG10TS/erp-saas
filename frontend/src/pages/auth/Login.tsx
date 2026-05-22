// src/pages/auth/Login.tsx
import React, { useState, useEffect, useCallback } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuthStore } from '@/store/slices/authSlice';
import {
  EyeIcon,
  EyeSlashIcon,
  EnvelopeIcon,
  LockClosedIcon,
  ArrowRightIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
} from '@heroicons/react/24/outline';
import { cn } from '@/lib/utils';

// Esquema de validación
const loginSchema = z.object({
  username: z.string().min(3, 'Usuario inválido'),
  password: z.string().min(6, 'Contraseña inválida'),
});

type LoginFormData = z.infer<typeof loginSchema>;
const API_URL = import.meta.env.VITE_API_URL || '/api/v1';

// Imágenes para el carrusel (puedes cambiarlas por las que prefieras)
const carouselImages = [
  {
    url: 'https://images.unsplash.com/photo-1556155092-490a1ba16284?ixlib=rb-4.0.3&auto=format&fit=crop&w=2070&q=80',
    alt: 'Oficina moderna con laptop',
  },
  {
    url: 'https://images.unsplash.com/photo-1556742049-0cfed4f6a45d?ixlib=rb-4.0.3&auto=format&fit=crop&w=2070&q=80',
    alt: 'Persona usando WhatsApp en móvil',
  },
  {
    url: 'https://images.unsplash.com/photo-1522071820081-009f0129c71c?ixlib=rb-4.0.3&auto=format&fit=crop&w=2070&q=80',
    alt: 'Equipo colaborando',
  },
  {
    url: 'https://images.unsplash.com/photo-1454165804606-c3d57bc86b40?ixlib=rb-4.0.3&auto=format&fit=crop&w=2070&q=80',
    alt: 'Dashboard de análisis',
  },
];

export const Login: React.FC = () => {
  const navigate = useNavigate();
  const { login, isLoading } = useAuthStore();
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [isAutoPlaying, setIsAutoPlaying] = useState(true);

  const {
    register,
    handleSubmit,
    formState: { errors, isValid },
  } = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
    mode: 'onChange',
  });

  // Lógica del carrusel automático
  const nextImage = useCallback(() => {
    setCurrentImageIndex((prev) => (prev + 1) % carouselImages.length);
  }, []);

  const prevImage = useCallback(() => {
    setCurrentImageIndex(
      (prev) => (prev - 1 + carouselImages.length) % carouselImages.length
    );
  }, []);

  useEffect(() => {
    if (!isAutoPlaying) return;
    const interval = setInterval(nextImage, 5000); // Cambio cada 5 segundos
    return () => clearInterval(interval);
  }, [isAutoPlaying, nextImage]);

  const onSubmit = async (data: LoginFormData) => {
    try {
      await login(data.username, data.password);
      if (rememberMe) {
        localStorage.setItem('rememberMe', 'true');
      }
      navigate('/app/dashboard');
    } catch (error) {
      // Error manejado por el store
    }
  };

  // Handlers para login social
  const handleGoogleLogin = () => {
    // Implementa tu lógica OAuth con Google
    window.location.href = `${API_URL}/auth/google`;
  };

  const handleGithubLogin = () => {
    // Implementa tu lógica OAuth con GitHub
    window.location.href = `${API_URL}/auth/github`;
  };

  return (
    <div className="flex min-h-screen bg-white">
      {/* Columna izquierda: Carrusel de imágenes (50%) */}
      <div className="relative hidden w-1/2 overflow-hidden lg:block">
        {/* Imagen actual con transición suave */}
        <AnimatePresence mode="wait">
          <motion.img
            key={currentImageIndex}
            src={carouselImages[currentImageIndex].url}
            alt={carouselImages[currentImageIndex].alt}
            className="absolute inset-0 h-full w-full object-cover"
            initial={{ opacity: 0, scale: 1.05 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            transition={{ duration: 0.7, ease: 'easeInOut' }}
          />
        </AnimatePresence>

        {/* Overlay sutil para mejorar legibilidad (por si hay texto encima) */}
        <div className="absolute inset-0 bg-black/20" />

        {/* Controles del carrusel */}
        <div className="absolute inset-x-0 bottom-8 z-10 flex justify-center gap-2">
          {carouselImages.map((_, index) => (
            <button
              key={index}
              onClick={() => {
                setCurrentImageIndex(index);
                setIsAutoPlaying(false);
                // Reactivar auto-play después de 10 segundos de inactividad
                setTimeout(() => setIsAutoPlaying(true), 10000);
              }}
              className={cn(
                'h-2 w-2 rounded-full transition-all duration-300',
                index === currentImageIndex
                  ? 'w-8 bg-white'
                  : 'bg-white/50 hover:bg-white/80'
              )}
              aria-label={`Ir a imagen ${index + 1}`}
            />
          ))}
        </div>

        {/* Flechas de navegación */}
        <button
          onClick={() => {
            prevImage();
            setIsAutoPlaying(false);
            setTimeout(() => setIsAutoPlaying(true), 10000);
          }}
          className="absolute left-4 top-1/2 z-10 -translate-y-1/2 rounded-full bg-white/20 p-2 text-white backdrop-blur-sm transition-all hover:bg-white/30"
          aria-label="Imagen anterior"
        >
          <ChevronLeftIcon className="h-6 w-6" />
        </button>
        <button
          onClick={() => {
            nextImage();
            setIsAutoPlaying(false);
            setTimeout(() => setIsAutoPlaying(true), 10000);
          }}
          className="absolute right-4 top-1/2 z-10 -translate-y-1/2 rounded-full bg-white/20 p-2 text-white backdrop-blur-sm transition-all hover:bg-white/30"
          aria-label="Imagen siguiente"
        >
          <ChevronRightIcon className="h-6 w-6" />
        </button>
      </div>

      {/* Columna derecha: Formulario (50%) */}
      <div className="flex w-full items-center justify-center px-6 py-12 lg:w-1/2 lg:px-12">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="w-full max-w-md"
        >
          {/* Logo / Ícono */}
          <div className="mb-8 flex justify-center lg:justify-start">
            <Link to="/" className="flex items-center gap-2 group">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-emerald-500 to-teal-500 text-white shadow-lg transition-transform group-hover:scale-105">
                <svg
                  className="h-6 w-6"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"
                  />
                </svg>
              </div>
              <div className="flex flex-col items-start">
                <span className="text-base font-bold text-slate-800">ERP Conversacional</span>
                <span className="text-xs text-slate-500">Ecuador</span>
              </div>
            </Link>
          </div>

          {/* Encabezado */}
          <div className="mb-8">
            <h1 className="text-3xl font-semibold tracking-tight text-gray-900">
              Iniciar sesión
            </h1>
            <p className="mt-2 text-sm text-gray-500">
              Ingresa tus credenciales para continuar
            </p>
          </div>

          {/* Formulario */}
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
            {/* Usuario / Email */}
            <div>
              <label className="mb-2 block text-sm font-medium text-gray-700">
                Usuario o correo
              </label>
              <div className="relative">
                <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-4">
                  <EnvelopeIcon className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  {...register('username')}
                  type="text"
                  autoComplete="username"
                  className={cn(
                    'w-full rounded-2xl border bg-white py-3.5 pl-12 pr-4 text-gray-900 placeholder:text-gray-400',
                    'transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-emerald-500/20',
                    errors.username
                      ? 'border-red-300 focus:border-red-500'
                      : 'border-gray-200 hover:border-gray-300 focus:border-emerald-500'
                  )}
                  placeholder="tu@email.com"
                />
              </div>
              {errors.username && (
                <p className="mt-1.5 text-sm text-red-500">
                  {errors.username.message}
                </p>
              )}
            </div>

            {/* Contraseña */}
            <div>
              <label className="mb-2 block text-sm font-medium text-gray-700">
                Contraseña
              </label>
              <div className="relative">
                <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-4">
                  <LockClosedIcon className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  {...register('password')}
                  type={showPassword ? 'text' : 'password'}
                  autoComplete="current-password"
                  className={cn(
                    'w-full rounded-2xl border bg-white py-3.5 pl-12 pr-12 text-gray-900 placeholder:text-gray-400',
                    'transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-emerald-500/20',
                    errors.password
                      ? 'border-red-300 focus:border-red-500'
                      : 'border-gray-200 hover:border-gray-300 focus:border-emerald-500'
                  )}
                  placeholder="••••••••"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 flex items-center pr-4 text-gray-400 hover:text-gray-600"
                >
                  {showPassword ? (
                    <EyeSlashIcon className="h-5 w-5" />
                  ) : (
                    <EyeIcon className="h-5 w-5" />
                  )}
                </button>
              </div>
              {errors.password && (
                <p className="mt-1.5 text-sm text-red-500">
                  {errors.password.message}
                </p>
              )}
            </div>

            {/* Opciones */}
            <div className="flex items-center justify-between">
              <label className="flex cursor-pointer items-center gap-2">
                <input
                  type="checkbox"
                  checked={rememberMe}
                  onChange={(e) => setRememberMe(e.target.checked)}
                  className="h-4 w-4 rounded border-gray-300 text-emerald-500 focus:ring-emerald-500"
                />
                <span className="text-sm text-gray-600">Recordarme</span>
              </label>
              <Link
                to="/forgot-password"
                className="text-sm font-medium text-emerald-600 hover:text-emerald-700"
              >
                ¿Olvidaste tu contraseña?
              </Link>
            </div>

            {/* Botón de envío */}
            <button
              type="submit"
              disabled={isLoading || !isValid}
              className={cn(
                'flex w-full items-center justify-center gap-2 rounded-2xl bg-emerald-500 py-3.5 font-medium text-white',
                'transition-all duration-200 hover:bg-emerald-600 focus:outline-none focus:ring-4 focus:ring-emerald-500/30',
                'disabled:cursor-not-allowed disabled:opacity-50'
              )}
            >
              {isLoading ? (
                <>
                  <div className="h-5 w-5 animate-spin rounded-full border-2 border-white border-t-transparent" />
                  <span>Iniciando sesión...</span>
                </>
              ) : (
                <>
                  <span>Iniciar sesión</span>
                  <ArrowRightIcon className="h-5 w-5" />
                </>
              )}
            </button>
          </form>

          {/* Separador */}
          <div className="relative my-8">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-gray-200" />
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="bg-white px-4 text-gray-500">o continúa con</span>
            </div>
          </div>

          {/* Login Social */}
          <div className="grid grid-cols-2 gap-4">
            <button
              type="button"
              onClick={handleGoogleLogin}
              className="flex items-center justify-center gap-3 rounded-2xl border border-gray-200 bg-white py-3.5 text-gray-700 transition-all hover:bg-gray-50"
            >
              <svg className="h-5 w-5" viewBox="0 0 24 24">
                <path
                  fill="#4285F4"
                  d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                />
                <path
                  fill="#34A853"
                  d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                />
                <path
                  fill="#FBBC05"
                  d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                />
                <path
                  fill="#EA4335"
                  d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                />
              </svg>
              <span className="text-sm font-medium">Google</span>
            </button>

            <button
              type="button"
              onClick={handleGithubLogin}
              className="flex items-center justify-center gap-3 rounded-2xl border border-gray-200 bg-white py-3.5 text-gray-700 transition-all hover:bg-gray-50"
            >
              <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 24 24">
                <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z" />
              </svg>
              <span className="text-sm font-medium">GitHub</span>
            </button>
          </div>

          {/* Link a registro */}
          <p className="mt-8 text-center text-sm text-gray-500">
            ¿No tienes una cuenta?{' '}
            <Link
              to="/register"
              className="font-medium text-emerald-600 hover:text-emerald-700"
            >
              Regístrate gratis
            </Link>
          </p>
        </motion.div>
      </div>
    </div>
  );
};
