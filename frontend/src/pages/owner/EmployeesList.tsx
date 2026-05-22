import React, { useState, useCallback, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Plus,
  Edit,
  Trash2,
  Power,
  Search,
  Users,
  Shield,
  MoreHorizontal,
  RefreshCw,
  X,
  UserPlus,
  Sliders,
  ArrowUpDown,
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { DataTable } from '@/components/common/DataTable';
import { ConfirmDialog } from '@/components/common/ConfirmDialog';
import { useBusinessUsers } from '@/hooks/useBusinessUsers';
import { useToast } from '@/hooks/useToast';
import type { User } from '@/types/permissions';
import { debounce } from 'lodash';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';

// ─── Role Definitions ──────────────────────────────────────────────
const ROLE_DEFINITIONS: Record<string, { label: string; color: string; bgColor: string; iconColor: string }> = {
  admin:    { label: 'Admin',    color: 'text-purple-700', bgColor: 'bg-purple-50',  iconColor: 'bg-purple-100 text-purple-600' },
  manager:  { label: 'Gerente',  color: 'text-blue-700',   bgColor: 'bg-blue-50',    iconColor: 'bg-blue-100 text-blue-600' },
  seller:   { label: 'Vendedor', color: 'text-emerald-700', bgColor: 'bg-emerald-50', iconColor: 'bg-emerald-100 text-emerald-600' },
  viewer:   { label: 'Solo lectura', color: 'text-slate-600', bgColor: 'bg-slate-100',  iconColor: 'bg-slate-100 text-slate-500' },
  accountant: { label: 'Contador', color: 'text-amber-700', bgColor: 'bg-amber-50',  iconColor: 'bg-amber-100 text-amber-600' },
};

// ─── Skeleton ──────────────────────────────────────────────────────
const Skeleton: React.FC = () => (
  <div className="space-y-3 animate-pulse">
    {[...Array(5)].map((_, i) => (
      <div key={i} className="h-16 bg-slate-50 rounded-xl" />
    ))}
  </div>
);

// ─── Empty State ───────────────────────────────────────────────────
const EmptyState: React.FC<{ hasFilters: boolean; onClear: () => void; onCreate: () => void }> = ({
  hasFilters,
  onClear,
  onCreate,
}) => (
  <motion.div
    initial={{ opacity: 0, y: 10 }}
    animate={{ opacity: 1, y: 0 }}
    className="text-center py-16"
  >
    <div className="w-16 h-16 mx-auto mb-4 bg-slate-100 rounded-2xl flex items-center justify-center">
      <Users className="w-8 h-8 text-slate-400" />
    </div>
    <h3 className="text-lg font-semibold text-slate-800 mb-1">
      {hasFilters ? 'Sin resultados' : 'No hay empleados'}
    </h3>
    <p className="text-slate-500 text-sm mb-6 max-w-xs mx-auto">
      {hasFilters
        ? 'No se encontraron empleados con los filtros actuales. Prueba con otros criterios.'
        : 'Aún no has creado ningún empleado. Crea el primero para empezar a gestionar tu equipo.'}
    </p>
    {hasFilters ? (
      <button
        onClick={onClear}
        className="px-4 py-2 text-sm font-medium text-slate-600 hover:text-slate-800 hover:bg-slate-100 rounded-xl transition-colors"
      >
        Limpiar filtros
      </button>
    ) : (
      <button
        onClick={onCreate}
        className="inline-flex items-center gap-2 px-4 py-2.5 bg-emerald-600 text-white rounded-xl hover:bg-emerald-700 transition-colors text-sm font-semibold shadow-sm shadow-emerald-200"
      >
        <UserPlus className="w-4 h-4" />
        Crear primer empleado
      </button>
    )}
  </motion.div>
);

// ─── Main Component ─────────────────────────────────────────────────
export const EmployeesList: React.FC = () => {
  const navigate = useNavigate();
  const toast = useToast();

  // State
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);
  const [searchTerm, setSearchTerm] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState<string>('');
  const [showFilters, setShowFilters] = useState(false);
  const [confirmDialog, setConfirmDialog] = useState<{
    open: boolean;
    userId?: string;
    action?: 'delete' | 'deactivate' | 'activate';
    userName?: string;
  }>({ open: false });

  // Queries
  const { useUsers, useToggleStatus, useDeleteUser } = useBusinessUsers();
  const { data: users = [], isLoading, refetch } = useUsers({
    skip: (page - 1) * limit,
    limit,
    role: roleFilter || undefined,
    search: debouncedSearch || undefined,
  });
  const { mutate: toggleStatus, isPending: isToggling } = useToggleStatus();
  const { mutate: deleteUser, isPending: isDeleting } = useDeleteUser();

  // Debounced search
  const debouncedSearchHandler = useCallback(
    debounce((value: string) => setDebouncedSearch(value), 400),
    []
  );

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(e.target.value);
    debouncedSearchHandler(e.target.value);
    setPage(1);
  };

  const clearFilters = () => {
    setSearchTerm('');
    setDebouncedSearch('');
    setRoleFilter('');
    setPage(1);
  };

  const hasActiveFilters = searchTerm !== '' || roleFilter !== '';

  // ─── Actions ──────────────────────────────────────────────────
  const handleToggleStatus = useCallback((user: User) => {
    setConfirmDialog({
      open: true,
      userId: user.id,
      action: user.is_active ? 'deactivate' : 'activate',
      userName: `${user.first_name} ${user.last_name}`,
    });
  }, []);

  const handleDeleteUser = useCallback((user: User) => {
    setConfirmDialog({
      open: true,
      userId: user.id,
      action: 'delete',
      userName: `${user.first_name} ${user.last_name}`,
    });
  }, []);

  const handleConfirmDialog = () => {
    const { userId, action } = confirmDialog;
    if (!userId || !action) return;

    if (action === 'delete') {
      deleteUser(userId, {
        onSuccess: () => {
          toast.success('Empleado eliminado correctamente');
          refetch(); // ✅ Refrescar lista
          setPage(1); // Volver a página 1
        },
        onError: () => toast.error('No se pudo eliminar al empleado'),
      });
    } else {
      const isActive = action === 'activate';
      toggleStatus(
        { userId, isActive },
        {
          onSuccess: () => {
            toast.success(isActive ? 'Empleado activado' : 'Empleado desactivado');
            refetch(); // ✅ Refrescar lista
          },
          onError: () => toast.error('Error al cambiar el estado'),
        }
      );
    }
    setConfirmDialog({ open: false });
  };

  // ─── Table Columns ────────────────────────────────────────────
  const columns = useMemo(() => [
    {
      key: 'email' as const,
      label: 'Empleado',
      render: (_: any, row: User) => {
        const initials = `${row.first_name?.[0] || ''}${row.last_name?.[0] || ''}`.toUpperCase();
        return (
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-emerald-100 flex items-center justify-center text-emerald-700 font-semibold text-sm flex-shrink-0">
              {initials || '?'}
            </div>
            <div className="min-w-0">
              <p className="font-medium text-slate-800 truncate">
                {row.first_name} {row.last_name}
              </p>
              <p className="text-xs text-slate-500 truncate">{row.email}</p>
            </div>
          </div>
        );
      },
      sortable: true,
    },
    {
      key: 'role' as const,
      label: 'Rol',
      render: (role: string) => {
        const def = ROLE_DEFINITIONS[role] || { label: role, color: 'text-slate-600', bgColor: 'bg-slate-100' };
        return (
          <span className={cn('inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold capitalize', def.bgColor, def.color)}>
            <Shield className="w-3 h-3" />
            {def.label}
          </span>
        );
      },
      sortable: true,
    },
    {
      key: 'is_active' as const,
      label: 'Estado',
      render: (isActive: boolean) => (
        <span
          className={cn(
            'inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium',
            isActive ? 'bg-emerald-50 text-emerald-700' : 'bg-slate-100 text-slate-500'
          )}
        >
          <span className={cn('w-1.5 h-1.5 rounded-full', isActive ? 'bg-emerald-500' : 'bg-slate-400')} />
          {isActive ? 'Activo' : 'Inactivo'}
        </span>
      ),
    },
    {
      key: 'created_at' as const,
      label: 'Fecha de registro',
      render: (date: string) => (
        <span className="text-sm text-slate-500">
          {format(new Date(date), "dd MMM yyyy", { locale: es })}
        </span>
      ),
    },
  ], []);

  // ─── Render ────────────────────────────────────────────────────
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.25, ease: 'easeOut' }}
      className="max-w-6xl mx-auto space-y-6"
    >
      {/* ─── Header ─────────────────────────────────────────────── */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-emerald-100 rounded-xl flex items-center justify-center">
            <Users className="w-5 h-5 text-emerald-600" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-slate-800 tracking-tight">Empleados</h1>
            <p className="text-slate-500 text-sm">
              {users.length > 0
                ? `${users.length} empleado${users.length !== 1 ? 's' : ''} en tu equipo`
                : 'Gestiona el acceso y roles de tu equipo'}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => refetch()}
            className="p-2.5 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-xl transition-colors"
            title="Actualizar lista"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
          <button
            onClick={() => navigate('/app/owner/employees/create')}
            className="inline-flex items-center gap-2 px-4 py-2.5 bg-emerald-600 text-white rounded-xl hover:bg-emerald-700 transition-all font-semibold text-sm shadow-sm shadow-emerald-200"
          >
            <UserPlus className="w-4 h-4" />
            Nuevo empleado
          </button>
        </div>
      </div>

      {/* ─── Filters ────────────────────────────────────────────── */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="p-4 flex flex-col sm:flex-row gap-3">
          {/* Search */}
          <div className="relative flex-1">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              type="text"
              placeholder="Buscar por nombre o email..."
              value={searchTerm}
              onChange={handleSearchChange}
              className="w-full pl-10 pr-10 py-2.5 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all bg-white"
            />
            {searchTerm && (
              <button
                onClick={() => { setSearchTerm(''); setDebouncedSearch(''); setPage(1); }}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>

          {/* Role Filter */}
          <div className="relative">
            <select
              value={roleFilter}
              onChange={(e) => { setRoleFilter(e.target.value); setPage(1); }}
              className="appearance-none pl-4 pr-10 py-2.5 border border-slate-200 rounded-xl text-sm bg-white focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all cursor-pointer"
            >
              <option value="">Todos los roles</option>
              <option value="admin">Administrador</option>
              <option value="manager">Gerente</option>
              <option value="seller">Vendedor</option>
              <option value="viewer">Solo lectura</option>
              <option value="accountant">Contador</option>
            </select>
          </div>

          {/* Clear Filters */}
          {hasActiveFilters && (
            <button
              onClick={clearFilters}
              className="px-4 py-2.5 text-sm font-medium text-slate-500 hover:text-slate-700 hover:bg-slate-100 rounded-xl transition-colors flex items-center gap-1.5"
            >
              <X className="w-3.5 h-3.5" />
              Limpiar filtros
            </button>
          )}
        </div>

        {/* Active Filters Indicator */}
        {hasActiveFilters && (
          <div className="px-4 pb-3 flex flex-wrap gap-2">
            {searchTerm && (
              <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-slate-100 text-slate-600 rounded-lg text-xs font-medium">
                <Search className="w-3 h-3" />
                "{searchTerm}"
                <button onClick={() => { setSearchTerm(''); setDebouncedSearch(''); }} className="ml-1 hover:text-slate-800">
                  <X className="w-3 h-3" />
                </button>
              </span>
            )}
            {roleFilter && (
              <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-slate-100 text-slate-600 rounded-lg text-xs font-medium">
                <Shield className="w-3 h-3" />
                Rol: {ROLE_DEFINITIONS[roleFilter]?.label || roleFilter}
                <button onClick={() => setRoleFilter('')} className="ml-1 hover:text-slate-800">
                  <X className="w-3 h-3" />
                </button>
              </span>
            )}
          </div>
        )}
      </div>

      {/* ─── Table / States ─────────────────────────────────────── */}
      {isLoading ? (
        <Skeleton />
      ) : users.length === 0 ? (
        <EmptyState
          hasFilters={hasActiveFilters}
          onClear={clearFilters}
          onCreate={() => navigate('/app/owner/employees/create')}
        />
      ) : (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
          <DataTable
            data={users}
            columns={columns}
            pagination={{ page, limit, total: users.length, onPageChange: setPage, onLimitChange: setLimit }}
            actions={(row: User) => (
              <div className="flex items-center gap-1">
                <button
                  onClick={() => navigate(`/app/owner/employees/${row.id}/permissions`)}
                  className="p-2 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-all"
                  title="Editar permisos"
                >
                  <Shield className="w-4 h-4" />
                </button>
                <button
                  onClick={() => handleToggleStatus(row)}
                  className={cn(
                    'p-2 rounded-lg transition-all',
                    row.is_active
                      ? 'text-slate-400 hover:text-amber-600 hover:bg-amber-50'
                      : 'text-slate-400 hover:text-emerald-600 hover:bg-emerald-50'
                  )}
                  title={row.is_active ? 'Desactivar' : 'Activar'}
                >
                  <Power className="w-4 h-4" />
                </button>
                <button
                  onClick={() => handleDeleteUser(row)}
                  className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-all"
                  title="Eliminar"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            )}
          />
        </div>
      )}

      {/* ─── Confirm Dialog ─────────────────────────────────────── */}
      <ConfirmDialog
        open={confirmDialog.open}
        title={
          confirmDialog.action === 'delete'
            ? 'Eliminar empleado'
            : confirmDialog.action === 'deactivate'
              ? 'Desactivar empleado'
              : 'Activar empleado'
        }
        message={
          confirmDialog.action === 'delete'
            ? `¿Estás seguro de eliminar a ${confirmDialog.userName}? Esta acción no se puede revertir y perderá acceso al sistema.`
            : confirmDialog.action === 'deactivate'
              ? `¿Desactivar a ${confirmDialog.userName}? No podrá acceder al sistema hasta que lo vuelvas a activar.`
              : `¿Activar a ${confirmDialog.userName}? Recuperará el acceso al sistema con sus permisos actuales.`
        }
        confirmText={
          confirmDialog.action === 'delete' ? 'Eliminar' : confirmDialog.action === 'deactivate' ? 'Desactivar' : 'Activar'
        }
        variant={confirmDialog.action === 'delete' ? 'danger' : 'warning'}
        loading={isDeleting || isToggling}
        onConfirm={handleConfirmDialog}
        onCancel={() => setConfirmDialog({ open: false })}
      />
    </motion.div>
  );
};

export default EmployeesList;