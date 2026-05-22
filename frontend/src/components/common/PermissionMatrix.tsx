// src/components/common/PermissionMatrix.tsx
import React from 'react';
import { motion } from 'framer-motion';

// ✅ Traducciones SOLO para mostrar (no afectan las claves)
const LABEL_TRANSLATIONS: Record<string, string> = {
  // Categorías
  'products': 'Productos', 'sales': 'Ventas', 'customers': 'Clientes',
  'invoices': 'Facturas', 'reports': 'Reportes', 'settings': 'Configuración',
  'users': 'Usuarios', 'categories': 'Categorías', 'whatsapp': 'WhatsApp',
  'dashboard': 'Dashboard', 'inventory': 'Inventario', 'business': 'Negocio',
  'audit': 'Auditoría',
  // Permisos
  'create': 'Crear', 'read': 'Ver', 'update': 'Editar', 'delete': 'Eliminar',
  'export': 'Exportar', 'view': 'Consultar', 'send': 'Enviar',
  'adjust': 'Ajustar', 'financial': 'Financiero',
  'change_role': 'Cambiar rol', 'void': 'Anular', 'download': 'Descargar',
  'view_others': 'Ver otros', 'configure_templates': 'Configurar plantillas',
};

/** Traduce una clave al español para mostrar */
const t = (key: string): string => LABEL_TRANSLATIONS[key] || key;

interface PermissionMatrixProps {
  permissions: Record<string, boolean>;
  schema: Record<string, string[]>;
  onToggle: (permission: string, value: boolean) => void;
  disabled?: boolean;
}

export const PermissionMatrix: React.FC<PermissionMatrixProps> = ({
  permissions,
  schema,
  onToggle,
  disabled = false,
}) => {
  const groupedByCategory = Object.entries(schema).map(([category, perms]) => ({
    category,
    permissions: perms.map((perm) => `${category}.${perm}`),
  }));

  const isChecked = (key: string): boolean => permissions[key] === true;
  const categoryAllChecked = (perms: string[]) => perms.length > 0 && perms.every(p => isChecked(p));
  const categorySomeChecked = (perms: string[]) => perms.some(p => isChecked(p));
  const categoryCheckedCount = (perms: string[]) => perms.filter(p => isChecked(p)).length;

  const toggleCategory = (perms: string[], checked: boolean) => {
    perms.forEach((p) => {
      if (isChecked(p) !== checked) onToggle(p, checked);
    });
  };

  return (
    <div className="space-y-4">
      {groupedByCategory.length === 0 && (
        <div className="text-center py-8 text-slate-400">No hay permisos disponibles</div>
      )}

      {groupedByCategory.map(({ category, permissions: perms }, idx) => {
        const allChecked = categoryAllChecked(perms);
        const someChecked = categorySomeChecked(perms);
        const checkedCount = categoryCheckedCount(perms);

        return (
          <motion.div
            key={category}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: idx * 0.1 }}
            className="border border-slate-200 rounded-lg p-4 hover:border-slate-300 transition-colors"
          >
            {/* Category Header */}
            <div className="flex items-center gap-3 mb-3">
              <input
                type="checkbox"
                id={`category-${category}`}
                checked={allChecked}
                ref={(el) => {
                  if (el) el.indeterminate = someChecked && !allChecked;
                }}
                onChange={(e) => toggleCategory(perms, e.target.checked)}
                disabled={disabled}
                className="w-4 h-4 rounded border-slate-300 text-emerald-600 focus:ring-emerald-500 cursor-pointer"
              />
              <label
                htmlFor={`category-${category}`}
                className="text-sm font-semibold text-slate-900 capitalize cursor-pointer flex-1 select-none"
              >
                {t(category)}  {/* ✅ Traducido */}
              </label>
              <span className="text-xs text-slate-500 font-medium">
                {checkedCount} / {perms.length}
              </span>
            </div>

            {/* Category Permissions */}
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2 pl-7">
              {perms.map((perm) => {
                const permName = perm.split('.')[1];
                const checked = isChecked(perm);

                return (
                  <label
                    key={perm}
                    className={`
                      flex items-center gap-2 cursor-pointer px-2 py-1.5 rounded-lg transition-colors select-none
                      ${disabled ? 'opacity-50 cursor-not-allowed' : 'hover:bg-slate-50'}
                      ${checked ? 'bg-emerald-50/50' : ''}
                    `}
                  >
                    <input
                      type="checkbox"
                      checked={checked}
                      onChange={(e) => onToggle(perm, e.target.checked)}
                      disabled={disabled}
                      className="w-4 h-4 rounded border-slate-300 text-emerald-600 focus:ring-emerald-500 cursor-pointer"
                    />
                    <span className={`text-sm ${checked ? 'text-emerald-700 font-medium' : 'text-slate-600'}`}>
                      {t(permName)}  {/* ✅ Traducido */}
                    </span>
                  </label>
                );
              })}
            </div>
          </motion.div>
        );
      })}
    </div>
  );
};

export default PermissionMatrix;