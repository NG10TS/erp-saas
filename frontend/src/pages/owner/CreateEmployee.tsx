// src/pages/owner/CreateEmployee.tsx
import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import {
  Copy,
  CheckCircle,
  Mail,
  User,
  Phone,
  Briefcase,
  AlertCircle,
  ArrowLeft,
  Eye,
  EyeOff,
  Info,
  Check,
  FileText,
  Shield,
  UserPlus,
  RefreshCw,
  ChevronRight,
  Send,
  Sparkles,
  Loader2,
  Building2,
  Key,
  ClipboardCheck,
} from 'lucide-react';
import { useBusinessUsers } from '@/hooks/useBusinessUsers';
import { useToast } from '@/hooks/useToast';
import { FormInput } from '@/components/common/FormInput';
import { PhoneInputWhatsApp } from '@/components/common/PhoneInputWhatsApp';
import { cn } from '@/lib/utils';
import { handleError } from '@/utils/error-handler';

// ─── Schema ────────────────────────────────────────────────────────
const createEmployeeSchema = z.object({
  email: z.string().email('Correo electrónico inválido'),
  first_name: z.string().min(2, 'Mínimo 2 caracteres').max(50, 'Máximo 50 caracteres'),
  last_name: z.string().min(2, 'Mínimo 2 caracteres').max(50, 'Máximo 50 caracteres'),
  phone: z
    .string()
    .regex(/^\+\d{10,15}$/, 'Número de teléfono inválido')
    .optional()
    .or(z.literal('')),
  role: z.enum(['admin', 'manager', 'seller', 'viewer', 'accountant']),
  send_welcome_email: z.boolean().default(true),
});

type CreateEmployeeForm = z.infer<typeof createEmployeeSchema>;

// ─── Role Definitions ──────────────────────────────────────────────
const roleDetails: Record<string, { label: string; description: string; color: string; icon: any; bgColor: string }> = {
  admin: {
    label: 'Admin',
    description: 'Gestión diaria · Empleados · Reportes',
    color: 'text-purple-700',
    bgColor: 'bg-purple-50',
    icon: Shield,
  },
  manager: {
    label: 'Gerente',
    description: 'Supervisar ventas · Aprobar descuentos · Reportes',
    color: 'text-blue-700',
    bgColor: 'bg-blue-50',
    icon: Briefcase,
  },
  seller: {
    label: 'Vendedor',
    description: 'Crear ventas · Ver clientes · Consultar stock',
    color: 'text-emerald-700',
    bgColor: 'bg-emerald-50',
    icon: User,
  },
  accountant: {
    label: 'Contador',
    description: 'Facturación SRI · Reportes fiscales · Impuestos',
    color: 'text-amber-700',
    bgColor: 'bg-amber-50',
    icon: FileText,
  },
  viewer: {
    label: 'Solo lectura',
    description: 'Consultas · Dashboard · Sin permisos de edición',
    color: 'text-slate-600',
    bgColor: 'bg-slate-100',
    icon: Eye,
  },
};

// ─── Success Screen ────────────────────────────────────────────────
interface SuccessScreenProps {
  employee: { name: string; email: string; role: string };
  password: string;
  showPassword: boolean;
  setShowPassword: (v: boolean) => void;
  copied: boolean;
  onCopy: () => void;
  onViewEmployees: () => void;
  onCreateAnother: () => void;
}

const SuccessScreen: React.FC<SuccessScreenProps> = ({
  employee,
  password,
  showPassword,
  setShowPassword,
  copied,
  onCopy,
  onViewEmployees,
  onCreateAnother,
}) => {
  const role = roleDetails[employee.role];
  const RoleIcon = role?.icon || Shield;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="max-w-lg mx-auto"
    >
      <div className="bg-white rounded-2xl shadow-xl border border-slate-100 overflow-hidden">
        {/* Success Header */}
        <div className="px-6 py-10 text-center bg-gradient-to-b from-emerald-50 via-emerald-50/50 to-white">
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ type: 'spring', stiffness: 200, damping: 20 }}
            className="relative"
          >
            <div className="w-20 h-20 bg-emerald-100 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-sm">
              <CheckCircle className="w-10 h-10 text-emerald-600" />
            </div>
            {/* Decorative dots */}
            <Sparkles className="absolute -top-2 -right-2 w-6 h-6 text-amber-400" />
          </motion.div>
          <h2 className="text-2xl font-bold text-slate-800 mb-2">¡Empleado creado!</h2>
          <p className="text-slate-500 text-sm max-w-xs mx-auto">
            La cuenta ha sido configurada correctamente y los permisos asignados según su rol.
          </p>
        </div>

        {/* Employee Summary */}
        <div className="px-6 pb-6 space-y-4">
          <div className="bg-slate-50 rounded-xl p-4 space-y-3">
            <div className="flex items-center justify-between text-sm">
              <span className="text-slate-500 flex items-center gap-2">
                <User className="w-4 h-4" />
                Nombre
              </span>
              <span className="font-semibold text-slate-800">{employee.name}</span>
            </div>
            <div className="flex items-center justify-between text-sm">
              <span className="text-slate-500 flex items-center gap-2">
                <Mail className="w-4 h-4" />
                Email
              </span>
              <span className="font-medium text-slate-800">{employee.email}</span>
            </div>
            <div className="flex items-center justify-between text-sm">
              <span className="text-slate-500 flex items-center gap-2">
                <Shield className="w-4 h-4" />
                Rol
              </span>
              <span className={cn(
                'inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold',
                role?.bgColor,
                role?.color
              )}>
                <RoleIcon className="w-3.5 h-3.5" />
                {role?.label}
              </span>
            </div>
          </div>

          {/* Password Card */}
          <div className="bg-amber-50/50 border border-amber-200/50 rounded-xl p-4">
            <div className="flex items-center gap-2 mb-3">
              <Key className="w-4 h-4 text-amber-600" />
              <label className="text-sm font-semibold text-amber-800">Contraseña temporal</label>
            </div>
            <div className="flex gap-2">
              <div className="flex-1 relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  readOnly
                  className="w-full px-4 py-2.5 bg-white border border-amber-200 rounded-xl font-mono text-sm tracking-wider pr-10 focus:outline-none focus:ring-2 focus:ring-amber-500/20"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-amber-400 hover:text-amber-600 transition-colors"
                  aria-label={showPassword ? 'Ocultar contraseña' : 'Mostrar contraseña'}
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
              <button
                onClick={onCopy}
                className={cn(
                  'px-4 py-2.5 rounded-xl transition-all flex items-center gap-2 font-medium text-sm',
                  copied
                    ? 'bg-emerald-100 text-emerald-700'
                    : 'bg-amber-100 text-amber-700 hover:bg-amber-200'
                )}
              >
                {copied ? (
                  <>
                    <ClipboardCheck className="w-4 h-4" />
                    <span>Copiada</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-4 h-4" />
                    <span>Copiar</span>
                  </>
                )}
              </button>
            </div>
            <div className="mt-2 flex items-start gap-2 text-xs text-amber-700">
              <AlertCircle className="w-3.5 h-3.5 mt-0.5 flex-shrink-0" />
              <span>Esta contraseña es temporal. El empleado deberá cambiarla en su primer inicio de sesión.</span>
            </div>
          </div>

          {/* Actions */}
          <div className="flex gap-3 pt-2">
            <button
              onClick={onViewEmployees}
              className="flex-1 px-4 py-3 border border-slate-300 text-slate-700 rounded-xl hover:bg-slate-50 transition-all font-medium text-sm"
            >
              Ver empleados
            </button>
            <button
              onClick={onCreateAnother}
              className="flex-1 px-4 py-3 bg-emerald-600 text-white rounded-xl hover:bg-emerald-700 transition-all font-semibold text-sm shadow-sm shadow-emerald-200 flex items-center justify-center gap-2"
            >
              <RefreshCw className="w-4 h-4" />
              Crear otro
            </button>
          </div>
        </div>
      </div>
    </motion.div>
  );
};

// ─── Main Component ─────────────────────────────────────────────────
export const CreateEmployee: React.FC = () => {
  const navigate = useNavigate();
  const toast = useToast();

  // State
  const [createdPassword, setCreatedPassword] = useState<string | null>(null);
  const [showPassword, setShowPassword] = useState(false);
  const [copied, setCopied] = useState(false);
  const [createdEmployee, setCreatedEmployee] = useState<any>(null);
  const [showRoleInfo, setShowRoleInfo] = useState(false);

  // Mutation
  const { useCreateUser } = useBusinessUsers();
  const { mutate: createUser, isPending } = useCreateUser();

  // Form
  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors, isValid },
    reset,
  } = useForm<CreateEmployeeForm>({
    resolver: zodResolver(createEmployeeSchema),
    defaultValues: {
      role: 'seller',
      phone: '+593',
      send_welcome_email: true,
    },
    mode: 'onChange',
  });

  const watchedRole = watch('role');
  const watchedPhone = watch('phone');

  // ─── Handlers ──────────────────────────────────────────────────
  const onSubmit = useCallback((data: CreateEmployeeForm) => {
    createUser(data, {
      onSuccess: (response: any) => {
        setCreatedPassword(response.password);
        setCreatedEmployee({
          name: `${data.first_name} ${data.last_name}`,
          email: data.email,
          role: data.role,
        });
        reset();
      },
      onError: (error) => handleError(error, 'Error al crear empleado'),
    });
  }, [createUser, reset]);

  const copyToClipboard = useCallback(() => {
    if (createdPassword) {
      navigator.clipboard.writeText(createdPassword);
      setCopied(true);
      toast.success('Contraseña copiada al portapapeles');
      setTimeout(() => setCopied(false), 2500);
    }
  }, [createdPassword, toast]);

  const resetForm = useCallback(() => {
    setCreatedPassword(null);
    setCreatedEmployee(null);
    setCopied(false);
    setShowPassword(false);
    setShowRoleInfo(false);
  }, []);

  // ─── Keyboard shortcut ────────────────────────────────────────
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'Enter' && isValid && !isPending) {
        e.preventDefault();
        handleSubmit(onSubmit)();
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [isValid, isPending, handleSubmit, onSubmit]);

  // ─── Success Screen ────────────────────────────────────────────
  if (createdPassword && createdEmployee) {
    return (
      <SuccessScreen
        employee={createdEmployee}
        password={createdPassword}
        showPassword={showPassword}
        setShowPassword={setShowPassword}
        copied={copied}
        onCopy={copyToClipboard}
        onViewEmployees={() => navigate('/app/owner/employees')}
        onCreateAnother={resetForm}
      />
    );
  }

  // ─── Form Screen ──────────────────────────────────────────────
  const role = roleDetails[watchedRole];
  const RoleIcon = role?.icon || Shield;

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.25, ease: 'easeOut' }}
      className="max-w-lg mx-auto"
    >
      <div className="bg-white rounded-2xl shadow-lg border border-slate-100 overflow-hidden">
        {/* Header */}
        <div className="px-6 pt-6 pb-4 border-b border-slate-100 bg-gradient-to-r from-slate-50 to-white">
          <button
            onClick={() => navigate('/app/owner/employees')}
            className="text-slate-400 hover:text-slate-600 transition-colors mb-3 flex items-center gap-1.5 text-sm group"
          >
            <ArrowLeft className="w-4 h-4 group-hover:-translate-x-0.5 transition-transform" />
            Volver a empleados
          </button>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-emerald-100 rounded-xl flex items-center justify-center">
              <UserPlus className="w-5 h-5 text-emerald-600" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-slate-800 tracking-tight">Crear empleado</h1>
              <p className="text-slate-500 text-sm">Ingresa los datos del nuevo miembro del equipo</p>
            </div>
          </div>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit(onSubmit)} className="p-6 space-y-5">
          {/* Email */}
          <FormInput
            label="Correo electrónico"
            icon={Mail}
            type="email"
            required
            {...register('email')}
            error={errors.email?.message}
            placeholder="ejemplo@tuempresa.com"
            helper="Se enviarán las credenciales a este correo"
          />

          {/* Name & Last Name */}
          <div className="grid grid-cols-2 gap-4">
            <FormInput
              label="Nombre"
              icon={User}
              required
              {...register('first_name')}
              error={errors.first_name?.message}
              placeholder="Juan"
            />
            <FormInput
              label="Apellido"
              icon={User}
              required
              {...register('last_name')}
              error={errors.last_name?.message}
              placeholder="Pérez"
            />
          </div>

          {/* Phone */}
          <div>
            <label className="mb-1.5 block text-sm font-medium text-gray-700">
              Teléfono
              <span className="ml-1 text-xs text-gray-400 font-normal">(WhatsApp)</span>
            </label>
            <div
              className={cn(
                'relative rounded-2xl border bg-white py-3.5 pl-12 pr-4 transition-all duration-200',
                'focus-within:ring-2',
                errors.phone
                  ? 'border-red-300 bg-red-50/50 focus-within:border-red-500 focus-within:ring-red-500/20'
                  : 'border-gray-200 hover:border-emerald-200 focus-within:border-emerald-500 focus-within:ring-emerald-500/20'
              )}
            >
              <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-4">
                <Phone className="h-5 w-5 text-gray-400" />
              </div>
              <PhoneInputWhatsApp
                value={watchedPhone || '+593'}
                onChange={(val) => setValue('phone', val, { shouldValidate: true })}
                error={!!errors.phone}
                disabled={isPending}
              />
            </div>
            {errors.phone && (
              <p className="mt-1.5 text-sm text-red-500 flex items-center gap-1">
                <AlertCircle className="w-3.5 h-3.5" />
                {errors.phone.message}
              </p>
            )}
          </div>

          {/* Role Selector */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="block text-sm font-medium text-gray-700">
                Rol
                <span className="ml-0.5 text-red-500">*</span>
              </label>
              <button
                type="button"
                onClick={() => setShowRoleInfo(!showRoleInfo)}
                className="text-xs text-emerald-600 hover:text-emerald-700 flex items-center gap-1 transition-colors"
              >
                <Info className="w-3.5 h-3.5" />
                {showRoleInfo ? 'Ocultar detalles' : 'Ver detalles de roles'}
              </button>
            </div>

            <div className="relative">
              <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-4">
                <Briefcase className="h-5 w-5 text-gray-400" />
              </div>
              <select
                {...register('role')}
                className={cn(
                  'w-full rounded-2xl border bg-white py-3.5 text-gray-900 pl-12 pr-10',
                  'transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-emerald-500/20',
                  'border-gray-200 hover:border-emerald-200 focus:border-emerald-500',
                  'appearance-none cursor-pointer'
                )}
              >
                {Object.entries(roleDetails).map(([value, { label, description }]) => (
                  <option key={value} value={value}>
                    {label} – {description}
                  </option>
                ))}
              </select>
              <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-4">
                <ChevronRight className="h-4 w-4 text-gray-400 rotate-90" />
              </div>
            </div>

            {/* Role Badge */}
            <div className="mt-2 flex items-center gap-2">
              <span className="text-xs text-gray-500">Permisos:</span>
              <span className={cn(
                'inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium',
                role?.bgColor,
                role?.color
              )}>
                <RoleIcon className="w-3.5 h-3.5" />
                {role?.description}
              </span>
            </div>

            {/* Role Info Panel */}
            <AnimatePresence>
              {showRoleInfo && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  className="overflow-hidden"
                >
                  <div className="mt-3 bg-slate-50 rounded-xl p-4 space-y-2">
                    <p className="text-xs font-semibold text-slate-700 mb-2">Resumen de roles:</p>
                    {Object.entries(roleDetails).map(([key, r]) => {
                      const Icon = r.icon;
                      return (
                        <div key={key} className="flex items-start gap-2 text-xs">
                          <Icon className="w-3.5 h-3.5 mt-0.5 text-slate-400" />
                          <div>
                            <span className="font-medium text-slate-700">{r.label}:</span>
                            <span className="text-slate-500 ml-1">{r.description}</span>
                          </div>
                        </div>
                      );
                    })}
                    <p className="text-xs text-slate-400 mt-2 pt-2 border-t border-slate-200">
                      Puedes personalizar los permisos después de crear el empleado.
                    </p>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Welcome Email Toggle */}
          <div className="flex items-start gap-3 py-2 px-4 bg-slate-50 rounded-xl">
            <input
              type="checkbox"
              id="send_welcome_email"
              {...register('send_welcome_email')}
              className="w-4 h-4 text-emerald-600 rounded border-gray-300 focus:ring-emerald-500 mt-0.5"
            />
            <div>
              <label htmlFor="send_welcome_email" className="text-sm font-medium text-gray-700 cursor-pointer">
                Enviar correo de bienvenida
              </label>
              <p className="text-xs text-gray-500 mt-0.5">
                El empleado recibirá un email con su usuario y contraseña temporal.
              </p>
            </div>
            <Send className="w-4 h-4 text-gray-300 ml-auto" />
          </div>

          <hr className="border-slate-100" />

          {/* Actions */}
          <div className="flex gap-3 pt-1">
            <button
              type="button"
              onClick={() => navigate('/app/owner/employees')}
              disabled={isPending}
              className="flex-1 px-4 py-3 border border-gray-300 text-gray-700 rounded-xl hover:bg-gray-50 hover:border-gray-400 transition-all font-medium text-sm disabled:opacity-50"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={isPending || !isValid}
              className={cn(
                'flex-1 px-4 py-3 rounded-xl transition-all font-semibold text-sm flex items-center justify-center gap-2',
                isValid && !isPending
                  ? 'bg-emerald-600 text-white hover:bg-emerald-700 shadow-sm shadow-emerald-200'
                  : 'bg-slate-100 text-slate-400 cursor-not-allowed'
              )}
            >
              {isPending ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Creando...
                </>
              ) : (
                <>
                  <UserPlus className="w-4 h-4" />
                  Crear empleado
                </>
              )}
            </button>
          </div>

          {/* Footer note */}
          <div className="flex items-center justify-center gap-1.5 text-xs text-gray-400">
            <Info className="w-3 h-3" />
            <span>Nombre de usuario generado automáticamente</span>
          </div>
        </form>
      </div>
    </motion.div>
  );
};

export default CreateEmployee;