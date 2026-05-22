import React, { useState, useMemo } from 'react';
import { ChevronLeft, ChevronRight, Search } from 'lucide-react';
import { motion } from 'framer-motion';

interface Column<T> {
  key: keyof T;
  label: string;
  render?: (value: any, row: T) => React.ReactNode;
  sortable?: boolean;
  className?: string;
}

interface DataTableProps<T> {
  data: T[];
  columns: Column<T>[];
  loading?: boolean;
  pagination?: {
    page: number;
    limit: number;
    total: number;
    onPageChange: (page: number) => void;
    onLimitChange: (limit: number) => void;
  };
  search?: {
    value: string;
    onChange: (value: string) => void;
    placeholder?: string;
  };
  onRowClick?: (row: T) => void;
  actions?: (row: T) => React.ReactNode;
  emptyMessage?: string;
}

const DataTableSkeleton = ({ columns }: { columns: Column<any>[] }) => (
  <div className="space-y-3">
    {Array.from({ length: 5 }).map((_, i) => (
      <div key={i} className="flex gap-4 h-12 bg-slate-100 rounded-lg animate-pulse" />
    ))}
  </div>
);

export const DataTable = React.forwardRef<HTMLDivElement, DataTableProps<any>>(
  (
    {
      data,
      columns,
      loading = false,
      pagination,
      search,
      onRowClick,
      actions,
      emptyMessage = 'No hay datos para mostrar',
    },
    ref
  ) => {
    const [sortKey, setSortKey] = useState<string | null>(null);
    const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');

    const handleSort = (key: string) => {
      if (sortKey === key) {
        setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
      } else {
        setSortKey(key);
        setSortOrder('asc');
      }
    };

    const sortedData = useMemo(() => {
      if (!sortKey || !data) return data;
      const sorted = [...data].sort((a: any, b: any) => {
        const aVal = a[sortKey];
        const bVal = b[sortKey];
        if (aVal < bVal) return sortOrder === 'asc' ? -1 : 1;
        if (aVal > bVal) return sortOrder === 'asc' ? 1 : -1;
        return 0;
      });
      return sorted;
    }, [data, sortKey, sortOrder]);

    if (loading) {
      return <DataTableSkeleton columns={columns} />;
    }

    if (!data || data.length === 0) {
      return (
        <div className="text-center py-12">
          <p className="text-slate-500">{emptyMessage}</p>
        </div>
      );
    }

    return (
      <div ref={ref} className="space-y-4">
        {search && (
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              type="text"
              placeholder={search.placeholder || 'Buscar...'}
              value={search.value}
              onChange={(e) => search.onChange(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
            />
          </div>
        )}

        <div className="overflow-x-auto rounded-lg border border-slate-200">
          <table className="w-full">
            <thead>
              <tr className="border-b border-slate-200 bg-slate-50">
                {columns.map((col) => (
                  <th
                    key={String(col.key)}
                    onClick={() => col.sortable && handleSort(String(col.key))}
                    className={`px-4 py-3 text-left text-sm font-semibold text-slate-900 ${
                      col.sortable ? 'cursor-pointer hover:bg-slate-100' : ''
                    } ${col.className || ''}`}
                  >
                    <div className="flex items-center gap-2">
                      {col.label}
                      {col.sortable && sortKey === String(col.key) && (
                        <span className="text-xs">{sortOrder === 'asc' ? '↑' : '↓'}</span>
                      )}
                    </div>
                  </th>
                ))}
                {actions && <th className="px-4 py-3 text-left text-sm font-semibold text-slate-900">Acciones</th>}
              </tr>
            </thead>
            <tbody>
              {sortedData.map((row, idx) => (
                <motion.tr
                  key={idx}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: idx * 0.05 }}
                  onClick={() => onRowClick?.(row)}
                  className={`border-b border-slate-100 hover:bg-slate-50 transition-colors ${
                    onRowClick ? 'cursor-pointer' : ''
                  }`}
                >
                  {columns.map((col) => (
                    <td
                      key={String(col.key)}
                      className={`px-4 py-3 text-sm text-slate-700 ${col.className || ''}`}
                    >
                      {col.render ? col.render(row[col.key], row) : String(row[col.key] || '')}
                    </td>
                  ))}
                  {actions && <td className="px-4 py-3 text-sm">{actions(row)}</td>}
                </motion.tr>
              ))}
            </tbody>
          </table>
        </div>

        {pagination && (
          <div className="flex items-center gap-2">
            <label className="text-sm text-slate-600">Mostrar:</label>

            <div className="relative">
              <select
                value={pagination.limit}
                onChange={(e) => pagination.onLimitChange(Number(e.target.value))}
                className="px-3 pr-8 py-1 border border-slate-200 rounded text-sm focus:ring-2 focus:ring-emerald-500 appearance-none"
              >
                <option value={10}>10</option>
                <option value={25}>25</option>
                <option value={50}>50</option>
              </select>

            </div>

            <span className="text-sm text-slate-600">
              de {pagination.total}
            </span>
          </div>
        )}
      </div>
    );
  }
);

DataTable.displayName = 'DataTable';
