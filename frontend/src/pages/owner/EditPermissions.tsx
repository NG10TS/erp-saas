import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ArrowLeft,
  Shield,
  Save,
  X,
  AlertTriangle,
  RefreshCw,
  CheckCircle2,
  Loader2,
  User,
  Mail,
  ChevronRight,
  Info,
} from 'lucide-react';
import { PermissionMatrix } from '@/components/common/PermissionMatrix';
import { useBusinessUsers } from '@/hooks/useBusinessUsers';
import { useToast } from '@/hooks/useToast';
import { handleError } from '@/utils/error-handler';
import { cn } from '@/lib/utils';

// ─── Types ──────────────────────────────────────────────────────────
type SaveStatus = 'idle' | 'saving' | 'saved' | 'error';

// ─── Skeleton Loader ────────────────────────────────────────────────
const Skeleton: React.FC = () => (
  <div className="space-y-6 animate-pulse">
    <div className="flex items-center gap-4">
      <div className="w-10 h-10 bg-slate-100 rounded-xl" />
      <div className="space-y-2 flex-1">
        <div className="h-6 bg-slate-100 rounded-lg w-48" />
        <div className="h-4 bg-slate-100 rounded-lg w-64" />
      </div>
    </div>
    <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6 space-y-4">
      {[...Array(5)].map((_, i) => (
        <div key={i} className="h-20 bg-slate-50 rounded-xl" />
      ))}
    </div>
  </div>
);

// ─── Error State ────────────────────────────────────────────────────
const ErrorState: React.FC<{ message: string; onRetry: () => void; onBack: () => void }> = ({
  message,
  onRetry,
  onBack,
}) => (
  <motion.div
    initial={{ opacity: 0, scale: 0.95 }}
    animate={{ opacity: 1, scale: 1 }}
    className="max-w-md mx-auto text-center py-16"
  >
    <div className="w-16 h-16 mx-auto mb-4 bg-red-100 rounded-full flex items-center justify-center">
      <AlertTriangle className="w-8 h-8 text-red-500" />
    </div>
    <h2 className="text-xl font-semibold text-slate-800 mb-2">Error al cargar permisos</h2>
    <p className="text-slate-500 text-sm mb-6">{message}</p>
    <div className="flex gap-3 justify-center">
      <button
        onClick={onBack}
        className="px-4 py-2 border border-slate-300 text-slate-700 rounded-xl hover:bg-slate-50 transition-colors text-sm font-medium"
      >
        Volver a empleados
      </button>
      <button
        onClick={onRetry}
        className="px-4 py-2 bg-emerald-600 text-white rounded-xl hover:bg-emerald-700 transition-colors text-sm font-medium flex items-center gap-2"
      >
        <RefreshCw className="w-4 h-4" />
        Reintentar
      </button>
    </div>
  </motion.div>
);

// ─── Not Found State ────────────────────────────────────────────────
const NotFoundState: React.FC<{ onBack: () => void }> = ({ onBack }) => (
  <motion.div
    initial={{ opacity: 0, scale: 0.95 }}
    animate={{ opacity: 1, scale: 1 }}
    className="max-w-md mx-auto text-center py-16"
  >
    <div className="w-16 h-16 mx-auto mb-4 bg-slate-100 rounded-full flex items-center justify-center">
      <User className="w-8 h-8 text-slate-400" />
    </div>
    <h2 className="text-xl font-semibold text-slate-800 mb-2">Empleado no encontrado</h2>
    <p className="text-slate-500 text-sm mb-6">El usuario que buscas no existe o fue eliminado.</p>
    <button
      onClick={onBack}
      className="px-4 py-2 bg-emerald-600 text-white rounded-xl hover:bg-emerald-700 transition-colors text-sm font-medium"
    >
      Volver a empleados
    </button>
  </motion.div>
);

// ─── Main Component ─────────────────────────────────────────────────
export const EditPermissions: React.FC = () => {
  const { userId } = useParams<{ userId: string }>();
  const navigate = useNavigate();
  const toast = useToast();

  // State
  const [permissions, setPermissions] = useState<Record<string, boolean>>({});
  const [initialPermissions, setInitialPermissions] = useState<Record<string, boolean>>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [saveStatus, setSaveStatus] = useState<SaveStatus>('idle');
  const [hasChanges, setHasChanges] = useState(false);

  // Queries
  const { useUser, usePermissionsSchema, useAssignPermissions } = useBusinessUsers();
  const { data: user, isLoading: userLoading } = useUser(userId!);
  const { data: schema = {}, isLoading: schemaLoading } = usePermissionsSchema();
  const { mutate: assignPermissions, isPending } = useAssignPermissions();

  // ─── Load permissions ──────────────────────────────────────────
  const loadPermissions = useCallback(async () => {
    if (!userId) return;
    setLoading(true);
    setError(null);
    try {
      const token = localStorage.getItem('access_token');
      const res = await fetch(`/api/v1/business/users/${userId}/permissions`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) throw new Error(`Error ${res.status}`);

      const data = await res.json();
      const flat: Record<string, boolean> = {};

      if (data && typeof data === 'object') {
        Object.entries(data).forEach(([k, v]) => {
          flat[k] = v as boolean;
        });
      }

      // Fill missing permissions from schema
      Object.entries(schema).forEach(([cat, perms]) => {
        (perms as string[]).forEach((p) => {
          const key = `${cat}.${p}`;
          if (!(key in flat)) flat[key] = false;
        });
      });

      setPermissions(flat);
      setInitialPermissions(flat);
      setHasChanges(false);
    } catch (err: any) {
      setError(err.message || 'Error desconocido');
    } finally {
      setLoading(false);
    }
  }, [userId, schema]);

  useEffect(() => {
    loadPermissions();
  }, [loadPermissions]);

  // ─── Track changes ─────────────────────────────────────────────
  const handleToggle = useCallback((perm: string, val: boolean) => {
    setPermissions((prev) => {
      const next = { ...prev, [perm]: val };
      // Compare with initial to detect changes
      const changed = Object.keys(next).some((k) => next[k] !== initialPermissions[k]);
      setHasChanges(changed);
      return next;
    });
  }, [initialPermissions]);

  // ─── Save ──────────────────────────────────────────────────────
  const handleSave = useCallback(() => {
    if (!userId) return;
    setSaveStatus('saving');
    assignPermissions(
      { userId, permissions },
      {
        onSuccess: () => {
          setSaveStatus('saved');
          setInitialPermissions({ ...permissions });
          setHasChanges(false);
          toast.success('Permisos actualizados correctamente');
          // Auto-navigate after short delay
          setTimeout(() => navigate('/app/owner/employees'), 1000);
        },
        onError: (e) => {
          setSaveStatus('error');
          handleError(e, 'Error al guardar permisos');
          setTimeout(() => setSaveStatus('idle'), 3000);
        },
      }
    );
  }, [userId, permissions, assignPermissions, navigate, toast]);

  // ─── Keyboard shortcut ─────────────────────────────────────────
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 's') {
        e.preventDefault();
        if (hasChanges && !isPending) handleSave();
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [hasChanges, isPending, handleSave]);

  // ─── Render States ─────────────────────────────────────────────
  if (userLoading || schemaLoading || loading) return <Skeleton />;
  if (error) return <ErrorState message={error} onRetry={loadPermissions} onBack={() => navigate('/app/owner/employees')} />;
  if (!user) return <NotFoundState onBack={() => navigate('/app/owner/employees')} />;

  const isLoading = isPending || saveStatus === 'saving';
  const totalPermissions = Object.keys(permissions).length;
  const enabledPermissions = Object.values(permissions).filter(Boolean).length;

  // ─── Main Render ───────────────────────────────────────────────
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.25, ease: 'easeOut' }}
      className="max-w-5xl mx-auto space-y-6"
    >
      {/* ─── Header ─────────────────────────────────────────────── */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex items-center gap-3">
          <button
            onClick={() => navigate('/app/owner/employees')}
            className="p-2 -ml-2 hover:bg-slate-100 rounded-xl transition-colors text-slate-400 hover:text-slate-600"
            aria-label="Volver a empleados"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Editar permisos</h1>
            <div className="flex items-center gap-2 mt-1">
              <div className="flex items-center gap-1.5 text-sm text-slate-500">
                <User className="w-3.5 h-3.5" />
                <span className="font-medium text-slate-700">
                  {user.first_name} {user.last_name}
                </span>
              </div>
              <ChevronRight className="w-3.5 h-3.5 text-slate-300" />
              <div className="flex items-center gap-1.5 text-sm text-slate-500">
                <Mail className="w-3.5 h-3.5" />
                <span>{user.email}</span>
              </div>
              {user.role && (
                <>
                  <ChevronRight className="w-3.5 h-3.5 text-slate-300" />
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-slate-100 text-slate-600 capitalize">
                    <Shield className="w-3 h-3" />
                    {user.role}
                  </span>
                </>
              )}
            </div>
          </div>
        </div>

        {/* Save Status Badge */}
        <div className="flex items-center gap-2">
          {hasChanges && (
            <span className="text-xs text-amber-600 bg-amber-50 px-2 py-1 rounded-full font-medium flex items-center gap-1">
              <Info className="w-3 h-3" />
              Cambios sin guardar
            </span>
          )}
          <span className="text-xs text-slate-400 bg-slate-50 px-2 py-1 rounded-full">
            {enabledPermissions}/{totalPermissions} activos
          </span>
        </div>
      </div>

      {/* ─── Stats Cards ────────────────────────────────────────── */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          { label: 'Total permisos', value: totalPermissions, icon: Shield, color: 'text-slate-600 bg-slate-50' },
          { label: 'Activos', value: enabledPermissions, icon: CheckCircle2, color: 'text-emerald-600 bg-emerald-50' },
          { label: 'Inactivos', value: totalPermissions - enabledPermissions, icon: X, color: 'text-slate-400 bg-slate-50' },
          { label: 'Categorías', value: Object.keys(schema).length, icon: ChevronRight, color: 'text-blue-600 bg-blue-50' },
        ].map((stat) => (
          <div key={stat.label} className={`${stat.color} rounded-xl p-3 flex items-center gap-3`}>
            <stat.icon className="w-5 h-5 opacity-70" />
            <div>
              <p className="text-2xl font-bold">{stat.value}</p>
              <p className="text-xs opacity-70">{stat.label}</p>
            </div>
          </div>
        ))}
      </div>

      {/* ─── Permission Matrix ──────────────────────────────────── */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-100 bg-slate-50/50">
          <h2 className="font-semibold text-slate-800 flex items-center gap-2">
            <Shield className="w-4 h-4 text-emerald-500" />
            Matriz de permisos
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Marca las acciones que este empleado puede realizar. Los cambios se guardan manualmente.
          </p>
        </div>
        <div className="p-6">
          <PermissionMatrix
            permissions={permissions}
            schema={schema}
            onToggle={handleToggle}
            disabled={isLoading}
          />
        </div>
      </div>

      {/* ─── Sticky Bottom Bar ──────────────────────────────────── */}
      <div className="sticky bottom-4 z-10">
        <motion.div
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          className="bg-white rounded-2xl shadow-lg border border-slate-200 p-4 flex items-center justify-between gap-4"
        >
          <div className="text-sm text-slate-500">
            {hasChanges ? (
              <span className="text-amber-600 flex items-center gap-1.5">
                <Info className="w-4 h-4" />
                Tienes cambios sin guardar
              </span>
            ) : saveStatus === 'saved' ? (
              <span className="text-emerald-600 flex items-center gap-1.5">
                <CheckCircle2 className="w-4 h-4" />
                Permisos guardados correctamente
              </span>
            ) : (
              <span className="flex items-center gap-1.5">
                <Shield className="w-4 h-4" />
                {enabledPermissions} de {totalPermissions} permisos activos
              </span>
            )}
          </div>
          <div className="flex items-center gap-2">
            
            <button
              onClick={() => navigate('/app/owner/employees')}
              disabled={isLoading}
              className="px-5 py-2.5 text-sm font-medium text-slate-600 hover:text-slate-800 hover:bg-slate-100 rounded-xl transition-all border border-transparent hover:border-slate-200 disabled:opacity-50"
            >
              Cancelar
            </button>
            <button
              onClick={handleSave}
              disabled={!hasChanges || isLoading}
              className={cn(
                'px-5 py-2 text-sm font-semibold rounded-xl transition-all flex items-center gap-2',
                hasChanges && !isLoading
                  ? 'bg-emerald-600 text-white hover:bg-emerald-700 shadow-sm shadow-emerald-200'
                  : 'bg-slate-100 text-slate-400 cursor-not-allowed'
              )}
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Guardando...
                </>
              ) : saveStatus === 'saved' ? (
                <>
                  <CheckCircle2 className="w-4 h-4" />
                  ¡Guardado!
                </>
              ) : (
                <>
                  <Save className="w-4 h-4" />
                  Guardar cambios
                </>
              )}
            </button>
          </div>
        </motion.div>
      </div>

      {/* Keyboard shortcut hint */}
      <p className="text-center text-xs text-slate-400 pb-2">
        Tip: Presiona <kbd className="px-1.5 py-0.5 bg-slate-100 rounded text-xs font-mono">⌘S</kbd> para guardar rápidamente
      </p>
    </motion.div>
  );
};

export default EditPermissions;