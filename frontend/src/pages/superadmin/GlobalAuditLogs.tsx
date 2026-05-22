import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Eye, Download } from 'lucide-react';
import { DataTable } from '@/components/common/DataTable';
import { useAdmin } from '@/hooks/useAdmin';
import type { AuditLog } from '@/types/permissions';

export const GlobalAuditLogs: React.FC = () => {
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);
  const [actionFilter, setActionFilter] = useState<string | undefined>();
  const [selectedLog, setSelectedLog] = useState<AuditLog | null>(null);

  const { useGlobalAuditLogs } = useAdmin();

  const { data: logs = [], isLoading } = useGlobalAuditLogs({
    skip: (page - 1) * limit,
    limit,
    action: actionFilter,
  });

  const columns = [
    {
      key: 'created_at' as const,
      label: 'Fecha y hora',
      render: (date: string) => {
        const d = new Date(date);
        return d.toLocaleDateString('es-ES') + ' ' + d.toLocaleTimeString('es-ES');
      },
      sortable: true,
    },
    {
      key: 'business_id' as const,
      label: 'Negocio',
      className: 'font-mono text-xs',
    },
    {
      key: 'user' as const,
      label: 'Usuario',
      render: (user: any) =>
        user ? `${user.first_name} ${user.last_name}` : 'Sistema',
    },
    {
      key: 'action' as const,
      label: 'Acción',
      render: (action: string) => (
        <span className="px-2 py-1 bg-blue-100 text-blue-700 rounded text-xs font-medium">
          {action}
        </span>
      ),
      sortable: true,
    },
    {
      key: 'entity_type' as const,
      label: 'Entidad',
      render: (entityType: string) => (
        <span className="text-slate-700 capitalize">{entityType}</span>
      ),
    },
  ];

  const uniqueActions = [...new Set(logs.map((log) => log.action))] as string[];

  const handleExportCSV = () => {
    const headers = ['Fecha', 'Negocio', 'Usuario', 'Acción', 'Entidad', 'ID Entidad'];
    const rows = logs.map((log) => [
      new Date(log.created_at).toLocaleString('es-ES'),
      log.business_id || '',
      log.user ? `${log.user.first_name} ${log.user.last_name}` : 'Sistema',
      log.action,
      log.entity_type || '',
      log.entity_id || '',
    ]);

    const csv = [headers, ...rows].map((row) => row.join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `audit-logs-${new Date().toISOString().split('T')[0]}.csv`;
    document.body.appendChild(a);
    a.click();
    window.URL.revokeObjectURL(url);
    document.body.removeChild(a);
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-6"
    >
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-slate-900">Auditoría global</h1>
          <p className="text-slate-600 mt-1">
            Historial de cambios y actividades en toda la plataforma
          </p>
        </div>
        <button
          onClick={handleExportCSV}
          className="flex items-center gap-2 px-4 py-2 border border-slate-300 text-slate-700 rounded-lg hover:bg-slate-50 transition-colors"
        >
          <Download className="w-4 h-4" />
          Exportar CSV
        </button>
      </div>

      {/* Filter */}
      <select
        value={actionFilter || ''}
        onChange={(e) => setActionFilter(e.target.value || undefined)}
        className="px-4 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
      >
        <option value="">Todas las acciones</option>
        {uniqueActions.map((action) => (
          <option key={action} value={action}>
            {action}
          </option>
        ))}
      </select>

      {/* Table */}
      <DataTable
        data={logs}
        columns={columns}
        loading={isLoading}
        pagination={{
          page,
          limit,
          total: logs.length,
          onPageChange: setPage,
          onLimitChange: setLimit,
        }}
        actions={(row: AuditLog) => (
          <button
            onClick={() => setSelectedLog(row)}
            title="Ver detalles"
            className="p-2 text-emerald-600 hover:bg-emerald-50 rounded-lg transition-colors"
          >
            <Eye className="w-4 h-4" />
          </button>
        )}
      />

      {/* Detail Modal */}
      {selectedLog && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4"
          onClick={() => setSelectedLog(null)}
        >
          <motion.div
            initial={{ scale: 0.95, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="bg-white rounded-lg shadow-xl max-w-2xl w-full p-6 max-h-96 overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <h2 className="text-xl font-bold text-slate-900 mb-4">
              Detalles de la actividad
            </h2>

            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-slate-600">Acción</p>
                  <p className="font-mono text-slate-900">{selectedLog.action}</p>
                </div>
                <div>
                  <p className="text-sm text-slate-600">Negocio</p>
                  <p className="font-mono text-slate-900 text-xs">
                    {selectedLog.business_id}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-slate-600">Entidad</p>
                  <p className="font-mono text-slate-900">
                    {selectedLog.entity_type}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-slate-600">ID de Entidad</p>
                  <p className="font-mono text-slate-900 text-xs">
                    {selectedLog.entity_id}
                  </p>
                </div>
                <div className="col-span-2">
                  <p className="text-sm text-slate-600">Fecha</p>
                  <p className="text-slate-900">
                    {new Date(selectedLog.created_at).toLocaleString('es-ES')}
                  </p>
                </div>
              </div>

              {selectedLog.old_values && (
                <div>
                  <p className="text-sm font-semibold text-slate-900 mb-2">
                    Valores anteriores
                  </p>
                  <pre className="bg-slate-50 p-3 rounded text-xs overflow-x-auto">
                    {JSON.stringify(selectedLog.old_values, null, 2)}
                  </pre>
                </div>
              )}

              {selectedLog.new_values && (
                <div>
                  <p className="text-sm font-semibold text-slate-900 mb-2">
                    Valores nuevos
                  </p>
                  <pre className="bg-slate-50 p-3 rounded text-xs overflow-x-auto">
                    {JSON.stringify(selectedLog.new_values, null, 2)}
                  </pre>
                </div>
              )}
            </div>

            <button
              onClick={() => setSelectedLog(null)}
              className="mt-6 w-full px-4 py-2 border border-slate-300 text-slate-700 rounded-lg hover:bg-slate-50 transition-colors"
            >
              Cerrar
            </button>
          </motion.div>
        </motion.div>
      )}
    </motion.div>
  );
};
