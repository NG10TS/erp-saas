// frontend/src/components/reports/ExportButton.tsx
import React, { useState } from 'react';
import { Download } from 'lucide-react';
import toast from 'react-hot-toast';
import { apiClient } from '@/lib/api-client';

type ReportType = 'sales_excel' | 'inventory_csv';

interface Props {
  reportType: ReportType;
  /** Additional query params, e.g. { start_date: '2024-01-01', end_date: '2024-01-31' } */
  filters?: Record<string, string | undefined>;
  /** Label shown on the button */
  label?: string;
  /** Optional button class override */
  className?: string;
}

const ENDPOINTS: Record<ReportType, { url: string; mime: string; ext: string }> = {
  sales_excel: {
    url:  '/reports/sales/export',
    mime: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    ext:  'xlsx',
  },
  inventory_csv: {
    url:  '/reports/inventory/export',
    mime: 'text/csv',
    ext:  'csv',
  },
};

const DEFAULT_LABELS: Record<ReportType, string> = {
  sales_excel:   'Exportar Excel',
  inventory_csv: 'Exportar CSV',
};

export const ExportButton: React.FC<Props> = ({
  reportType,
  filters,
  label,
  className,
}) => {
  const [isLoading, setIsLoading] = useState(false);
  const { url, mime, ext } = ENDPOINTS[reportType];

  const handleExport = async () => {
    setIsLoading(true);
    const toastId = toast.loading('Generando reporte...');

    try {
      const response = await apiClient.get(url, {
        params:       filters,
        responseType: 'blob',
      });

      // Extract filename from Content-Disposition header if available
      const disposition = response.headers['content-disposition'] || '';
      const match       = disposition.match(/filename="?([^"]+)"?/);
      const filename    = match?.[1] ?? `reporte_${Date.now()}.${ext}`;

      // Trigger browser download
      const blob    = new Blob([response.data], { type: mime });
      const blobUrl = URL.createObjectURL(blob);
      const link    = document.createElement('a');
      link.href     = blobUrl;
      link.download = filename;
      document.body.appendChild(link);
      link.click();
      link.remove();
      URL.revokeObjectURL(blobUrl);

      toast.success('Reporte descargado', { id: toastId });
    } catch (err: unknown) {
      const message =
        err instanceof Error ? err.message : 'Error al descargar el reporte';
      toast.error(message, { id: toastId });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <button
      onClick={handleExport}
      disabled={isLoading}
      className={
        className ??
        `inline-flex items-center gap-2 px-4 py-2 text-sm font-medium
         bg-white border border-gray-300 rounded-lg text-gray-700
         hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed
         transition-colors`
      }
    >
      {isLoading ? (
        <span className="w-4 h-4 border-2 border-gray-400 border-t-transparent rounded-full animate-spin" />
      ) : (
        <Download size={16} />
      )}
      {isLoading ? 'Generando...' : (label ?? DEFAULT_LABELS[reportType])}
    </button>
  );
};
