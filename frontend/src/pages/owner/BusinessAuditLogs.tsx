import React, { useState, useMemo, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Eye,
  Filter,
  X,
  ChevronLeft,
  ChevronRight,
  Search,
  Clock,
  User,
  Activity,
  FolderTree,
  MapPin,
  ArrowUpDown,
  Download,
  Sliders,
  FileText,
  Shield,
  LogIn,
  LogOut,
  Plus,
  Edit,
  Trash2,
  AlertCircle,
} from 'lucide-react';
import { useBusinessUsers } from '@/hooks/useBusinessUsers';
import type { AuditLog } from '@/types/permissions';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { cn } from '@/lib/utils';

// ─── Constants ─────────────────────────────────────────────────────
const ACTION_DEFINITIONS: Record<string, { label: string; color: string; bgColor: string; icon: React.FC<{ className?: string }> }> = {
  CREATE:                 { label: 'Creación',     color: 'text-emerald-700', bgColor: 'bg-emerald-50',  icon: Plus },
  UPDATE:                 { label: 'Actualización', color: 'text-blue-700',   bgColor: 'bg-blue-50',    icon: Edit },
  DELETE:                 { label: 'Eliminación',  color: 'text-red-700',    bgColor: 'bg-red-50',     icon: Trash2 },
  LOGIN:                  { label: 'Inicio sesión', color: 'text-purple-700', bgColor: 'bg-purple-50',  icon: LogIn },
  LOGOUT:                 { label: 'Cierre sesión', color: 'text-slate-600', bgColor: 'bg-slate-100',  icon: LogOut },
  EXPORT:                 { label: 'Exportación',  color: 'text-amber-700',  bgColor: 'bg-amber-50',   icon: Download },
  CREATE_USER:            { label: 'Crear empleado', color: 'text-emerald-700', bgColor: 'bg-emerald-50', icon: User },
  CHANGE_ROLE:            { label: 'Cambio de rol',  color: 'text-blue-700',   bgColor: 'bg-blue-50',   icon: Shield },
  TOGGLE_USER_STATUS:     { label: 'Cambio estado',  color: 'text-amber-700', bgColor: 'bg-amber-50',  icon: Activity },
  ASSIGN_CUSTOM_PERMISSIONS: { label: 'Permisos',   color: 'text-indigo-700', bgColor: 'bg-indigo-50', icon: Sliders },
};

// ─── Skeleton ──────────────────────────────────────────────────────
const Skeleton: React.FC = () => (
  <div className="space-y-3 animate-pulse">
    <div className="h-12 bg-slate-100 rounded-xl" />
    {[...Array(6)].map((_, i) => (
      <div key={i} className="h-16 bg-slate-50 rounded-xl" />
    ))}
  </div>
);

// ─── Empty State ───────────────────────────────────────────────────
const EmptyState: React.FC<{ hasFilters: boolean; onClear: () => void }> = ({ hasFilters, onClear }) => (
  <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="text-center py-16">
    <div className="w-16 h-16 mx-auto mb-4 bg-slate-100 rounded-2xl flex items-center justify-center">
      <FileText className="w-8 h-8 text-slate-400" />
    </div>
    <h3 className="text-lg font-semibold text-slate-800 mb-1">
      {hasFilters ? 'Sin resultados' : 'Sin actividad registrada'}
    </h3>
    <p className="text-slate-500 text-sm mb-6 max-w-xs mx-auto">
      {hasFilters
        ? 'No se encontraron registros con los filtros actuales.'
        : 'Aún no hay actividad de auditoría en tu negocio.'}
    </p>
    {hasFilters && (
      <button onClick={onClear} className="px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-100 rounded-xl transition-colors">
        Limpiar filtros
      </button>
    )}
  </motion.div>
);

// ─── Action Badge ──────────────────────────────────────────────────
const ActionBadge: React.FC<{ action: string }> = ({ action }) => {
  const def = ACTION_DEFINITIONS[action] || { label: action, color: 'text-slate-600', bgColor: 'bg-slate-100', icon: Activity };
  const Icon = def.icon;
  return (
    <span className={cn('inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold', def.bgColor, def.color)}>
      <Icon className="w-3.5 h-3.5" />
      {def.label}
    </span>
  );
};

// ─── Main Component ─────────────────────────────────────────────────
export const BusinessAuditLogs: React.FC = () => {
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(15);
  const [actionFilter, setActionFilter] = useState<string>('');
  const [entityFilter, setEntityFilter] = useState<string>('');
  const [selectedLog, setSelectedLog] = useState<AuditLog | null>(null);

  const { useAuditLogs } = useBusinessUsers();
  const { data: logs = [], isLoading } = useAuditLogs({
    skip: (page - 1) * limit,
    limit,
    action: actionFilter || undefined,
    entity_type: entityFilter || undefined,
  });

  // Derived data
  const uniqueActions = useMemo(() => [...new Set(logs.map(l => l.action))].sort(), [logs]);
  const uniqueEntities = useMemo(() => [...new Set(logs.map(l => l.entity_type))].sort(), [logs]);
  const hasFilters = actionFilter !== '' || entityFilter !== '';

  const clearFilters = useCallback(() => {
    setActionFilter('');
    setEntityFilter('');
    setPage(1);
  }, []);

  const formatDate = (dateStr: string) => {
    return format(new Date(dateStr), "dd MMM yyyy, HH:mm:ss", { locale: es });
  };

  // ─── Render ────────────────────────────────────────────────────
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.25, ease: 'easeOut' }}
      className="max-w-7xl mx-auto space-y-6"
    >
      {/* ─── Header ──────────────────────────────────────────────── */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-amber-100 rounded-xl flex items-center justify-center">
            <FileText className="w-5 h-5 text-amber-600" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-slate-800 tracking-tight">Registro de auditoría</h1>
            <p className="text-slate-500 text-sm">
              Historial completo de cambios y accesos a tu negocio
            </p>
          </div>
        </div>
        {logs.length > 0 && (
          <span className="text-sm text-slate-500 bg-slate-50 px-3 py-1.5 rounded-full">
            {logs.length} registro{logs.length !== 1 ? 's' : ''}
          </span>
        )}
      </div>

      {/* ─── Filters Bar ──────────────────────────────────────────── */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-4">
        <div className="flex flex-col sm:flex-row gap-3">
          {/* Action Filter */}
          <div className="relative flex-1">
            <Activity className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <select
              value={actionFilter}
              onChange={(e) => { setActionFilter(e.target.value); setPage(1); }}
              className="w-full pl-10 pr-10 py-2.5 border border-slate-200 rounded-xl text-sm bg-white focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all appearance-none cursor-pointer"
            >
              <option value="">Todas las acciones</option>
              {uniqueActions.map(a => (
                <option key={a} value={a}>{ACTION_DEFINITIONS[a]?.label || a}</option>
              ))}
            </select>
          </div>

          {/* Entity Filter */}
          <div className="relative flex-1">
            <FolderTree className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <select
              value={entityFilter}
              onChange={(e) => { setEntityFilter(e.target.value); setPage(1); }}
              className="w-full pl-10 pr-10 py-2.5 border border-slate-200 rounded-xl text-sm bg-white focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all appearance-none cursor-pointer"
            >
              <option value="">Todas las entidades</option>
              {uniqueEntities.map(e => (
                <option key={e} value={e}>{e}</option>
              ))}
            </select>
          </div>

          {/* Clear Filters */}
          {hasFilters && (
            <button
              onClick={clearFilters}
              className="px-4 py-2.5 text-sm font-medium text-slate-500 hover:text-slate-700 hover:bg-slate-100 rounded-xl transition-colors flex items-center gap-1.5"
            >
              <X className="w-3.5 h-3.5" />
              Limpiar filtros
            </button>
          )}
        </div>

        {/* Active filter chips */}
        {hasFilters && (
          <div className="flex flex-wrap gap-2 mt-3 pt-3 border-t border-slate-100">
            {actionFilter && (
              <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-slate-100 text-slate-600 rounded-lg text-xs font-medium">
                <Activity className="w-3 h-3" />
                {ACTION_DEFINITIONS[actionFilter]?.label || actionFilter}
                <button onClick={() => setActionFilter('')} className="ml-1 hover:text-slate-800"><X className="w-3 h-3" /></button>
              </span>
            )}
            {entityFilter && (
              <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-slate-100 text-slate-600 rounded-lg text-xs font-medium">
                <FolderTree className="w-3 h-3" />
                {entityFilter}
                <button onClick={() => setEntityFilter('')} className="ml-1 hover:text-slate-800"><X className="w-3 h-3" /></button>
              </span>
            )}
          </div>
        )}
      </div>

      {/* ─── Content ──────────────────────────────────────────────── */}
      {isLoading ? (
        <Skeleton />
      ) : logs.length === 0 ? (
        <EmptyState hasFilters={hasFilters} onClear={clearFilters} />
      ) : (
        <>
          {/* Table */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-slate-100">
                <thead>
                  <tr className="bg-slate-50/50">
                    <th className="px-6 py-3.5 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">
                      <div className="flex items-center gap-1.5">
                        <Clock className="w-3.5 h-3.5" />
                        Fecha
                      </div>
                    </th>
                    <th className="px-6 py-3.5 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">
                      <div className="flex items-center gap-1.5">
                        <User className="w-3.5 h-3.5" />
                        Usuario
                      </div>
                    </th>
                    <th className="px-6 py-3.5 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">
                      <div className="flex items-center gap-1.5">
                        <Activity className="w-3.5 h-3.5" />
                        Acción
                      </div>
                    </th>
                    <th className="px-6 py-3.5 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider hidden md:table-cell">
                      <div className="flex items-center gap-1.5">
                        <FolderTree className="w-3.5 h-3.5" />
                        Entidad
                      </div>
                    </th>
                    <th className="px-6 py-3.5 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider hidden lg:table-cell">
                      <div className="flex items-center gap-1.5">
                        <MapPin className="w-3.5 h-3.5" />
                        IP
                      </div>
                    </th>
                    <th className="px-6 py-3.5 text-right text-xs font-semibold text-slate-500 uppercase tracking-wider w-20">
                      Acción
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                  {logs.map((log, index) => (
                    <motion.tr
                      key={log.id}
                      initial={{ opacity: 0, y: 8 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: index * 0.02 }}
                      className="hover:bg-slate-50/50 transition-colors group"
                    >
                      <td className="px-6 py-3.5 text-sm text-slate-600 whitespace-nowrap">
                        <span className="font-medium">{formatDate(log.created_at).split(',')[0]}</span>
                        <span className="text-slate-400 ml-1 text-xs hidden sm:inline">
                          {formatDate(log.created_at).split(',')[1]}
                        </span>
                      </td>
                      <td className="px-6 py-3.5">
                        <div className="flex items-center gap-2">
                          <div className="w-7 h-7 rounded-lg bg-slate-100 flex items-center justify-center text-slate-500 text-xs font-semibold flex-shrink-0">
                            {log.user ? `${log.user.first_name?.[0]}${log.user.last_name?.[0]}`.toUpperCase() : 'S'}
                          </div>
                          <span className="text-sm font-medium text-slate-800">
                            {log.user ? `${log.user.first_name} ${log.user.last_name}` : 'Sistema'}
                          </span>
                        </div>
                      </td>
                      <td className="px-6 py-3.5">
                        <ActionBadge action={log.action} />
                      </td>
                      <td className="px-6 py-3.5 text-sm text-slate-600 capitalize hidden md:table-cell">
                        {log.entity_type}
                      </td>
                      <td className="px-6 py-3.5 text-xs font-mono text-slate-400 hidden lg:table-cell">
                        {log.ip_address || '—'}
                      </td>
                      <td className="px-6 py-3.5 text-right">
                        <button
                          onClick={() => setSelectedLog(log)}
                          className="p-2 text-slate-400 hover:text-emerald-600 hover:bg-emerald-50 rounded-lg transition-all opacity-0 group-hover:opacity-100 focus:opacity-100"
                          aria-label="Ver detalles"
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                      </td>
                    </motion.tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            <div className="px-6 py-3 border-t border-slate-100 bg-slate-50/50 flex items-center justify-between">
              <div className="text-sm text-slate-500">
                Página {page} · {logs.length} registro{logs.length !== 1 ? 's' : ''}
              </div>
              <div className="flex items-center gap-1.5">
                <button
                  onClick={() => setPage(p => Math.max(1, p - 1))}
                  disabled={page === 1}
                  className="p-2 text-slate-500 hover:text-slate-700 hover:bg-white rounded-lg transition-all disabled:opacity-30 disabled:cursor-not-allowed border border-transparent hover:border-slate-200"
                  aria-label="Página anterior"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>
                <span className="px-3 py-1 text-sm font-medium text-slate-700 bg-white border border-slate-200 rounded-lg">
                  {page}
                </span>
                <button
                  onClick={() => setPage(p => p + 1)}
                  disabled={logs.length < limit}
                  className="p-2 text-slate-500 hover:text-slate-700 hover:bg-white rounded-lg transition-all disabled:opacity-30 disabled:cursor-not-allowed border border-transparent hover:border-slate-200"
                  aria-label="Página siguiente"
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
        </>
      )}

      {/* ─── Detail Modal ─────────────────────────────────────────── */}
      <AnimatePresence>
        {selectedLog && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4"
            onClick={() => setSelectedLog(null)}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              transition={{ type: 'spring', duration: 0.3 }}
              className="bg-white rounded-2xl shadow-xl max-w-2xl w-full max-h-[85vh] overflow-auto"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Modal Header */}
              <div className="sticky top-0 bg-white border-b border-slate-100 px-6 py-4 flex justify-between items-center z-10">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 bg-amber-100 rounded-xl flex items-center justify-center">
                    <FileText className="w-4.5 h-4.5 text-amber-600" />
                  </div>
                  <div>
                    <h2 className="text-lg font-semibold text-slate-800">Detalle del evento</h2>
                    <p className="text-xs text-slate-500">{formatDate(selectedLog.created_at)}</p>
                  </div>
                </div>
                <button
                  onClick={() => setSelectedLog(null)}
                  className="p-2 rounded-lg hover:bg-slate-100 transition-colors text-slate-400 hover:text-slate-600"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Modal Body */}
              <div className="p-6 space-y-6">
                {/* Summary Grid */}
                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-slate-50 rounded-xl p-3">
                    <p className="text-xs text-slate-500 mb-1">Acción</p>
                    <ActionBadge action={selectedLog.action} />
                  </div>
                  <div className="bg-slate-50 rounded-xl p-3">
                    <p className="text-xs text-slate-500 mb-1">Entidad</p>
                    <p className="text-sm font-medium text-slate-800 capitalize">{selectedLog.entity_type}</p>
                  </div>
                  <div className="bg-slate-50 rounded-xl p-3">
                    <p className="text-xs text-slate-500 mb-1">ID Entidad</p>
                    <code className="text-xs font-mono text-slate-700 bg-slate-200 px-1.5 py-0.5 rounded">{selectedLog.entity_id || '—'}</code>
                  </div>
                  <div className="bg-slate-50 rounded-xl p-3">
                    <p className="text-xs text-slate-500 mb-1">Dirección IP</p>
                    <code className="text-xs font-mono text-slate-700">{selectedLog.ip_address || '—'}</code>
                  </div>
                  {selectedLog.user && (
                    <div className="col-span-2 bg-slate-50 rounded-xl p-3">
                      <p className="text-xs text-slate-500 mb-1">Usuario</p>
                      <div className="flex items-center gap-2">
                        <div className="w-6 h-6 rounded-md bg-slate-200 flex items-center justify-center text-xs font-semibold text-slate-600">
                          {`${selectedLog.user.first_name?.[0]}${selectedLog.user.last_name?.[0]}`.toUpperCase()}
                        </div>
                        <span className="text-sm font-medium text-slate-800">
                          {selectedLog.user.first_name} {selectedLog.user.last_name}
                        </span>
                        <span className="text-xs text-slate-400">({selectedLog.user.email})</span>
                      </div>
                    </div>
                  )}
                </div>

                {/* Changes */}
                {(selectedLog.old_values || selectedLog.new_values) && (
                  <div className="space-y-4">
                    <h3 className="text-sm font-semibold text-slate-700 flex items-center gap-2">
                      <ArrowUpDown className="w-4 h-4" />
                      Cambios realizados
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {selectedLog.old_values && (
                        <div>
                          <p className="text-xs font-medium text-slate-500 mb-2 flex items-center gap-1.5">
                            <span className="w-2 h-2 rounded-full bg-red-400" />
                            Anterior
                          </p>
                          <pre className="bg-red-50/50 border border-red-100 p-3 rounded-xl text-xs overflow-auto max-h-40 font-mono text-slate-700">
                            {JSON.stringify(selectedLog.old_values, null, 2)}
                          </pre>
                        </div>
                      )}
                      {selectedLog.new_values && (
                        <div>
                          <p className="text-xs font-medium text-slate-500 mb-2 flex items-center gap-1.5">
                            <span className="w-2 h-2 rounded-full bg-emerald-400" />
                            Nuevo
                          </p>
                          <pre className="bg-emerald-50/50 border border-emerald-100 p-3 rounded-xl text-xs overflow-auto max-h-40 font-mono text-slate-700">
                            {JSON.stringify(selectedLog.new_values, null, 2)}
                          </pre>
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>

              {/* Modal Footer */}
              <div className="border-t border-slate-100 px-6 py-4 bg-slate-50/50 rounded-b-2xl flex justify-end">
                <button
                  onClick={() => setSelectedLog(null)}
                  className="px-5 py-2.5 bg-white border border-slate-300 text-slate-700 rounded-xl hover:bg-slate-50 transition-colors text-sm font-medium"
                >
                  Cerrar
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
};

export default BusinessAuditLogs;