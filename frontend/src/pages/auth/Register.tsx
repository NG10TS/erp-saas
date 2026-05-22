// src/pages/auth/Register.tsx
import React, { useState, useMemo, useEffect, useCallback } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuthStore } from '@/store/slices/authSlice';
import {
  EyeIcon,
  EyeSlashIcon,
  ArrowLeftIcon,
  ArrowRightIcon,
  CheckIcon,
  BuildingOffice2Icon,
  UserIcon,
  CheckCircleIcon,
  EnvelopeIcon,
  PhoneIcon,
  MapPinIcon,
  LockClosedIcon,
  AtSymbolIcon,
  DocumentTextIcon,
  BuildingStorefrontIcon,
  SparklesIcon,
  ShieldCheckIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
} from '@heroicons/react/24/outline';
import { COUNTRIES } from '@/utils/constants';
import toast from 'react-hot-toast';
import { cn } from '@/lib/utils';
import { FormInput } from '@/components/common/FormInput';

// Imágenes para el carrusel
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

// Validador de fortaleza de contraseña
const getPasswordStrength = (password: string): { score: number; label: string; color: string } => {
  let score = 0;
  if (password.length >= 6) score++;
  if (password.length >= 8) score++;
  if (/[A-Z]/.test(password)) score++;
  if (/[0-9]/.test(password)) score++;
  if (/[^A-Za-z0-9]/.test(password)) score++;

  if (score <= 1) return { score: 1, label: 'Débil', color: 'bg-red-500' };
  if (score <= 2) return { score: 2, label: 'Regular', color: 'bg-orange-500' };
  if (score <= 3) return { score: 3, label: 'Buena', color: 'bg-yellow-500' };
  if (score <= 4) return { score: 4, label: 'Fuerte', color: 'bg-emerald-500' };
  return { score: 5, label: 'Muy fuerte', color: 'bg-emerald-600' };
};

const registerSchema = z.object({
  ruc: z.string().length(13, 'RUC debe tener 13 dígitos').regex(/^\d+$/, 'Solo números'),
  business_name: z.string().min(3, 'Mínimo 3 caracteres'),
  commercial_name: z.string().optional(),
  business_email: z.string().email('Email inválido'),
  business_phone: z.string().min(10, 'Teléfono inválido'),
  address: z.string().optional(),
  country: z.string().default('EC'),
  email: z.string().email('Email inválido'),
  username: z.string().min(3, 'Mínimo 3 caracteres'),
  password: z.string().min(6, 'Mínimo 6 caracteres').max(72, 'Máximo 72 caracteres'),
  confirm_password: z.string(),
  first_name: z.string().min(2, 'Mínimo 2 caracteres'),
  last_name: z.string().min(2, 'Mínimo 2 caracteres'),
  phone: z.string().min(10, 'Teléfono inválido'),
}).refine((data) => data.password === data.confirm_password, {
  message: 'Las contraseñas no coinciden',
  path: ['confirm_password'],
});

type RegisterFormData = z.infer<typeof registerSchema>;

const steps = [
  { id: 'business', title: 'Negocio', description: 'Datos de tu empresa', icon: BuildingOffice2Icon },
  { id: 'user', title: 'Usuario', description: 'Tu información personal', icon: UserIcon },
  { id: 'complete', title: 'Confirmar', description: 'Revisa y finaliza', icon: CheckCircleIcon },
];

export const Register: React.FC = () => {
  const navigate = useNavigate();
  const { register: registerUser, isLoading } = useAuthStore();
  const [currentStep, setCurrentStep] = useState(0);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [isAutoPlaying, setIsAutoPlaying] = useState(true);

  const {
    register,
    handleSubmit,
    formState: { errors },
    watch,
    setError,
  } = useForm<RegisterFormData>({
    resolver: zodResolver(registerSchema),
    defaultValues: { country: 'EC' },
    mode: 'onChange',
  });

  const watchedFields = watch();
  const password = watch('password') || '';
  const passwordStrength = useMemo(() => getPasswordStrength(password), [password]);

  const nextImage = useCallback(() => {
    setCurrentImageIndex((prev) => (prev + 1) % carouselImages.length);
  }, []);

  const prevImage = useCallback(() => {
    setCurrentImageIndex((prev) => (prev - 1 + carouselImages.length) % carouselImages.length);
  }, []);

  useEffect(() => {
    if (!isAutoPlaying) return;
    const interval = setInterval(nextImage, 5000);
    return () => clearInterval(interval);
  }, [isAutoPlaying, nextImage]);

  const isStep1Valid = watchedFields.ruc?.length === 13 &&
    watchedFields.business_name?.length >= 3 &&
    watchedFields.business_email?.includes('@') &&
    watchedFields.business_phone?.length >= 10;

  const isStep2Valid = watchedFields.first_name?.length >= 2 &&
    watchedFields.last_name?.length >= 2 &&
    watchedFields.email?.includes('@') &&
    watchedFields.username?.length >= 3 &&
    watchedFields.password?.length >= 6 &&
    watchedFields.password === watchedFields.confirm_password &&
    watchedFields.phone?.length >= 10;

  const canProceed = currentStep === 0 ? isStep1Valid : currentStep === 1 ? isStep2Valid : true;

  const onSubmit = async (data: RegisterFormData) => {
    try {
      setError('root', { type: 'manual', message: '' });

      await registerUser({
        ruc: data.ruc,
        business_name: data.business_name,
        commercial_name: data.commercial_name,
        business_email: data.business_email,
        business_phone: data.business_phone,
        address: data.address,
        email: data.email,
        username: data.username,
        password: data.password,
        first_name: data.first_name,
        last_name: data.last_name,
        phone: data.phone,
      });

      toast.success('¡Registro exitoso! Revisa tu correo para verificar tu cuenta.', { duration: 5000 });
      navigate('/login?registered=true');
    } catch (error: any) {
      console.error('Registration error:', error);

      if (error.response?.data?.detail) {
        const errorMessage = error.response.data.detail;

        if (errorMessage.includes('Email already registered')) {
          setError('email', { message: 'Este email ya está registrado' });
          toast.error('Email ya registrado', { duration: 5000, icon: '🔐' });
          navigate('/login');
        } else if (errorMessage.includes('Username already taken')) {
          setError('username', { message: 'Este nombre de usuario ya está en uso' });
          toast.error('Nombre de usuario no disponible');
        } else {
          toast.error(errorMessage);
        }
      } else {
        toast.error('Error en el registro. Por favor intenta nuevamente.');
      }
    }
  };

  const nextStep = () => {
    if (currentStep < steps.length - 1 && canProceed) {
      setCurrentStep(currentStep + 1);
    }
  };

  const prevStep = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  return (
    <div className="flex min-h-screen bg-white">
      {/* Columna izquierda: Carrusel de imágenes (50%) */}
      <div className="relative hidden w-1/2 overflow-hidden lg:block">
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
        <div className="absolute inset-0 bg-black/20" />

        <div className="absolute inset-x-0 bottom-8 z-10 flex justify-center gap-2">
          {carouselImages.map((_, index) => (
            <button
              key={index}
              onClick={() => {
                setCurrentImageIndex(index);
                setIsAutoPlaying(false);
                setTimeout(() => setIsAutoPlaying(true), 10000);
              }}
              className={cn(
                'h-2 w-2 rounded-full transition-all duration-300',
                index === currentImageIndex ? 'w-8 bg-white' : 'bg-white/50 hover:bg-white/80'
              )}
              aria-label={`Ir a imagen ${index + 1}`}
            />
          ))}
        </div>

        <button
          onClick={() => {
            prevImage();
            setIsAutoPlaying(false);
            setTimeout(() => setIsAutoPlaying(true), 10000);
          }}
          className="absolute left-4 top-1/2 z-10 -translate-y-1/2 rounded-full bg-white/20 p-2 text-white backdrop-blur-sm transition-all hover:bg-white/30"
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
        >
          <ChevronRightIcon className="h-6 w-6" />
        </button>
      </div>

      {/* ✅ Columna derecha: Formulario (50%) - CORREGIDA */}
      <div className="flex w-full flex-col overflow-y-auto px-6 py-12 lg:w-1/2 lg:px-12">
        
        {/* ✅ Botón de regreso al login */}
        <div className="mb-8 flex justify-center lg:justify-start">
          <Link
            to="/login"
            className="flex items-center gap-2 rounded-xl px-3 py-2 text-slate-500 transition-all hover:bg-emerald-50 hover:text-emerald-600 group"
          >
            <svg
              className="h-5 w-5 transition-transform group-hover:-translate-x-1"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M10 19l-7-7m0 0l7-7m-7 7h18"
              />
            </svg>
            <span className="text-sm font-medium">Volver al inicio de sesión</span>
          </Link>
        </div>

        {/* ✅ Mobile Logo (solo una vez) */}
        <div className="mb-8 flex items-center gap-2 lg:hidden">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-500">
            <SparklesIcon className="h-5 w-5 text-white" />
          </div>
          <span className="text-xl font-bold text-gray-900">ERP Conversacional</span>
        </div>

        {/* Contenedor del formulario */}
        <div className="mx-auto w-full max-w-xl">
          
          {/* Header */}
          <div className="mb-8">
            <h2 className="text-2xl font-bold text-gray-900">Crear cuenta</h2>
            <p className="text-gray-500">
              ¿Ya tienes una cuenta?{' '}
              <Link to="/login" className="font-medium text-emerald-600 hover:underline">
                Inicia sesión
              </Link>
            </p>
          </div>

          {/* Progress Steps */}
          <div className="mb-10">
            <div className="relative flex items-center justify-between">
              <div className="absolute left-0 right-0 top-5 mx-12 h-0.5 bg-gray-200" />
              <motion.div
                className="absolute left-0 top-5 mx-12 h-0.5 bg-emerald-500"
                initial={{ width: '0%' }}
                animate={{ width: `${(currentStep / (steps.length - 1)) * 100}%` }}
                transition={{ duration: 0.3 }}
              />

              {steps.map((step, index) => {
                const StepIcon = step.icon;
                const isActive = index === currentStep;
                const isCompleted = index < currentStep;

                return (
                  <div key={step.id} className="relative z-10 flex flex-col items-center">
                    <div
                      className={cn(
                        'flex h-10 w-10 items-center justify-center rounded-full border-2 transition-all duration-300',
                        isCompleted && 'border-emerald-500 bg-emerald-500 text-white',
                        isActive && 'border-emerald-500 bg-white text-emerald-500 shadow-lg shadow-emerald-500/20',
                        !isActive && !isCompleted && 'border-gray-200 bg-gray-200 text-gray-500'
                      )}
                    >
                      {isCompleted ? <CheckIcon className="h-5 w-5" /> : <StepIcon className="h-5 w-5" />}
                    </div>
                    <div className="mt-3 text-center">
                      <p className={cn('text-sm font-medium', isActive || isCompleted ? 'text-gray-900' : 'text-gray-400')}>
                        {step.title}
                      </p>
                      <p className="hidden text-xs text-gray-400 sm:block">{step.description}</p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Error Banner */}
          <AnimatePresence>
            {errors.root && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="mb-6 flex items-center gap-2 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-600"
              >
                <ShieldCheckIcon className="h-5 w-5 flex-shrink-0" />
                {errors.root.message}
              </motion.div>
            )}
          </AnimatePresence>

          {/* Form Card */}
          <div className="rounded-2xl border border-gray-100 bg-white p-6 shadow-xl lg:p-8">
            <form onSubmit={handleSubmit(onSubmit)}>
              <AnimatePresence mode="wait">
                {/* Step 1: Business Info */}
                {currentStep === 0 && (
                  <motion.div
                    key="step-0"
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -20 }}
                    transition={{ duration: 0.3 }}
                    className="space-y-5"
                  >
                    <div className="mb-6 flex items-center gap-3">
                      <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-emerald-100">
                        <BuildingOffice2Icon className="h-5 w-5 text-emerald-600" />
                      </div>
                      <div>
                        <h3 className="font-semibold text-gray-900">Datos del Negocio</h3>
                        <p className="text-sm text-gray-500">Información de tu empresa</p>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                      <FormInput
                        label="RUC"
                        icon={DocumentTextIcon}
                        required
                        {...register('ruc')}
                        error={errors.ruc?.message}
                        placeholder="1234567890001"
                        maxLength={13}
                      />
                      <div>
                        <label className="mb-1.5 block text-sm font-medium text-gray-700">
                          País<span className="ml-0.5 text-red-500">*</span>
                        </label>
                        <select
                          {...register('country')}
                          className="w-full rounded-xl border border-gray-200 bg-white px-4 py-3.5 text-gray-900 outline-none transition-all focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20"
                        >
                          {COUNTRIES.map((country) => (
                            <option key={country.code} value={country.code}>
                              {country.name}
                            </option>
                          ))}
                        </select>
                      </div>
                    </div>

                    <FormInput
                      label="Razón Social"
                      icon={BuildingOffice2Icon}
                      required
                      {...register('business_name')}
                      error={errors.business_name?.message}
                      placeholder="Mi Empresa S.A."
                    />

                    <FormInput
                      label="Nombre Comercial"
                      icon={BuildingStorefrontIcon}
                      {...register('commercial_name')}
                      placeholder="Mi Tienda"
                    />

                    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                      <FormInput
                        label="Email del Negocio"
                        icon={EnvelopeIcon}
                        type="email"
                        required
                        {...register('business_email')}
                        error={errors.business_email?.message}
                        placeholder="contacto@empresa.com"
                      />
                      <FormInput
                        label="Teléfono del Negocio"
                        icon={PhoneIcon}
                        required
                        {...register('business_phone')}
                        error={errors.business_phone?.message}
                        placeholder="0999999999"
                      />
                    </div>

                    <FormInput
                      label="Dirección"
                      icon={MapPinIcon}
                      {...register('address')}
                      placeholder="Av. Principal 123, Quito"
                    />
                  </motion.div>
                )}

                {/* Step 2: User Info */}
                {currentStep === 1 && (
                  <motion.div
                    key="step-1"
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -20 }}
                    transition={{ duration: 0.3 }}
                    className="space-y-5"
                  >
                    <div className="mb-6 flex items-center gap-3">
                      <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-emerald-100">
                        <UserIcon className="h-5 w-5 text-emerald-600" />
                      </div>
                      <div>
                        <h3 className="font-semibold text-gray-900">Tu Información</h3>
                        <p className="text-sm text-gray-500">Datos de acceso a tu cuenta</p>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                      <FormInput
                        label="Nombre"
                        icon={UserIcon}
                        required
                        {...register('first_name')}
                        error={errors.first_name?.message}
                        placeholder="Juan"
                      />
                      <FormInput
                        label="Apellido"
                        icon={UserIcon}
                        required
                        {...register('last_name')}
                        error={errors.last_name?.message}
                        placeholder="Pérez"
                      />
                    </div>

                    <FormInput
                      label="Email"
                      icon={EnvelopeIcon}
                      type="email"
                      required
                      {...register('email')}
                      error={errors.email?.message}
                      placeholder="juan@empresa.com"
                    />

                    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                      <FormInput
                        label="Usuario"
                        icon={AtSymbolIcon}
                        required
                        {...register('username')}
                        error={errors.username?.message}
                        placeholder="juan.perez"
                      />
                      <FormInput
                        label="Teléfono"
                        icon={PhoneIcon}
                        required
                        {...register('phone')}
                        error={errors.phone?.message}
                        placeholder="0999999999"
                      />
                    </div>

                    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                      <FormInput
                        label="Contraseña"
                        icon={LockClosedIcon}
                        type="password"
                        required
                        showPasswordToggle
                        {...register('password')}
                        error={errors.password?.message}
                        placeholder="********"
                      />
                      <FormInput
                        label="Confirmar Contraseña"
                        icon={LockClosedIcon}
                        type="password"
                        required
                        showPasswordToggle
                        {...register('confirm_password')}
                        error={errors.confirm_password?.message}
                        placeholder="********"
                      />
                    </div>

                    {password && (
                      <div className="-mt-2 space-y-1.5">
                        <div className="flex gap-1">
                          {[1, 2, 3, 4, 5].map((level) => (
                            <div
                              key={level}
                              className={cn(
                                'h-1 flex-1 rounded-full transition-colors',
                                level <= passwordStrength.score ? passwordStrength.color : 'bg-gray-200'
                              )}
                            />
                          ))}
                        </div>
                        <p className="text-xs text-gray-500">
                          Seguridad:{' '}
                          <span
                            className={cn(
                              'font-medium',
                              passwordStrength.score <= 2
                                ? 'text-red-500'
                                : passwordStrength.score <= 3
                                ? 'text-yellow-600'
                                : 'text-emerald-600'
                            )}
                          >
                            {passwordStrength.label}
                          </span>
                        </p>
                      </div>
                    )}
                  </motion.div>
                )}

                {/* Step 3: Confirmation */}
                {currentStep === 2 && (
                  <motion.div
                    key="step-2"
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -20 }}
                    transition={{ duration: 0.3 }}
                    className="space-y-6"
                  >
                    <div className="mb-8 text-center">
                      <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-emerald-100">
                        <CheckCircleIcon className="h-8 w-8 text-emerald-600" />
                      </div>
                      <h3 className="mb-2 text-xl font-semibold text-gray-900">¡Casi listo!</h3>
                      <p className="text-gray-500">Revisa que todos tus datos sean correctos</p>
                    </div>

                    <div className="space-y-4">
                      <div className="space-y-3 rounded-xl bg-gray-50 p-4">
                        <div className="mb-3 flex items-center gap-2 text-sm font-medium text-gray-900">
                          <BuildingOffice2Icon className="h-4 w-4 text-emerald-600" />
                          Datos del Negocio
                        </div>
                        <div className="grid grid-cols-2 gap-3 text-sm">
                          <div>
                            <p className="text-gray-500">RUC</p>
                            <p className="font-medium text-gray-900">{watchedFields.ruc}</p>
                          </div>
                          <div>
                            <p className="text-gray-500">País</p>
                            <p className="font-medium text-gray-900">
                              {COUNTRIES.find((c) => c.code === watchedFields.country)?.name}
                            </p>
                          </div>
                          <div className="col-span-2">
                            <p className="text-gray-500">Razón Social</p>
                            <p className="font-medium text-gray-900">{watchedFields.business_name}</p>
                          </div>
                          <div>
                            <p className="text-gray-500">Email</p>
                            <p className="font-medium text-gray-900">{watchedFields.business_email}</p>
                          </div>
                          <div>
                            <p className="text-gray-500">Teléfono</p>
                            <p className="font-medium text-gray-900">{watchedFields.business_phone}</p>
                          </div>
                        </div>
                      </div>

                      <div className="space-y-3 rounded-xl bg-gray-50 p-4">
                        <div className="mb-3 flex items-center gap-2 text-sm font-medium text-gray-900">
                          <UserIcon className="h-4 w-4 text-emerald-600" />
                          Tu Información
                        </div>
                        <div className="grid grid-cols-2 gap-3 text-sm">
                          <div>
                            <p className="text-gray-500">Nombre</p>
                            <p className="font-medium text-gray-900">
                              {watchedFields.first_name} {watchedFields.last_name}
                            </p>
                          </div>
                          <div>
                            <p className="text-gray-500">Usuario</p>
                            <p className="font-medium text-gray-900">@{watchedFields.username}</p>
                          </div>
                          <div>
                            <p className="text-gray-500">Email</p>
                            <p className="font-medium text-gray-900">{watchedFields.email}</p>
                          </div>
                          <div>
                            <p className="text-gray-500">Teléfono</p>
                            <p className="font-medium text-gray-900">{watchedFields.phone}</p>
                          </div>
                        </div>
                      </div>
                    </div>

                    <p className="text-center text-xs text-gray-400">
                      Al crear tu cuenta, aceptas nuestros{' '}
                      <Link to="/terms" className="text-emerald-600 hover:underline">
                        Términos de Servicio
                      </Link>{' '}
                      y{' '}
                      <Link to="/privacy" className="text-emerald-600 hover:underline">
                        Política de Privacidad
                      </Link>
                    </p>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Navigation */}
              <div className="mt-8 flex items-center justify-between border-t border-gray-100 pt-6">
                {currentStep > 0 ? (
                  <button
                    type="button"
                    onClick={prevStep}
                    className="flex items-center gap-2 px-5 py-2.5 font-medium text-gray-500 transition-colors hover:text-gray-700"
                  >
                    <ArrowLeftIcon className="h-4 w-4" />
                    Anterior
                  </button>
                ) : (
                  <div />
                )}

                {currentStep < steps.length - 1 ? (
                  <button
                    type="button"
                    onClick={nextStep}
                    disabled={!canProceed}
                    className={cn(
                      'flex items-center gap-2 rounded-xl px-6 py-3 font-semibold transition-all',
                      canProceed
                        ? 'bg-emerald-500 text-white shadow-lg shadow-emerald-500/20 hover:bg-emerald-600'
                        : 'cursor-not-allowed bg-gray-200 text-gray-400'
                    )}
                  >
                    Continuar
                    <ArrowRightIcon className="h-4 w-4" />
                  </button>
                ) : (
                  <button
                    type="submit"
                    disabled={isLoading}
                    className="flex items-center gap-2 rounded-xl bg-emerald-600 px-8 py-3 font-semibold text-white shadow-lg shadow-emerald-600/20 transition-all hover:bg-emerald-700 disabled:opacity-50"
                  >
                    {isLoading ? (
                      <>
                        <div className="h-5 w-5 animate-spin rounded-full border-2 border-white/30 border-t-white" />
                        Creando cuenta...
                      </>
                    ) : (
                      <>
                        Crear cuenta
                        <CheckCircleIcon className="h-5 w-5" />
                      </>
                    )}
                  </button>
                )}
              </div>
            </form>
          </div>

          {/* Security Badge */}
          <div className="mt-6 flex items-center justify-center gap-2 text-sm text-gray-400">
            <ShieldCheckIcon className="h-4 w-4" />
            <span>Tus datos están protegidos con encriptación SSL</span>
          </div>
        </div>
      </div>
    </div>
  );
};