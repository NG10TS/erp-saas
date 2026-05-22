import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { AlertCircle, Trash2 } from 'lucide-react';

type Variant = 'danger' | 'warning' | 'info';

interface ConfirmDialogProps {
  open: boolean;
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  onConfirm: () => void;
  onCancel: () => void;
  variant?: Variant;
  loading?: boolean;
}

const variantConfig: Record<Variant, { bg: string; text: string; button: string; icon: React.ReactNode }> = {
  danger: {
    bg: 'bg-red-50',
    text: 'text-red-900',
    button: 'bg-red-600 hover:bg-red-700 text-white',
    icon: <Trash2 className="w-6 h-6" />,
  },
  warning: {
    bg: 'bg-yellow-50',
    text: 'text-yellow-900',
    button: 'bg-yellow-600 hover:bg-yellow-700 text-white',
    icon: <AlertCircle className="w-6 h-6" />,
  },
  info: {
    bg: 'bg-blue-50',
    text: 'text-blue-900',
    button: 'bg-blue-600 hover:blue-yellow-700 text-white',
    icon: <AlertCircle className="w-6 h-6" />,
  },
};

export const ConfirmDialog: React.FC<ConfirmDialogProps> = ({
  open,
  title,
  message,
  confirmText = 'Confirmar',
  cancelText = 'Cancelar',
  onConfirm,
  onCancel,
  variant = 'warning',
  loading = false,
}) => {
  const config = variantConfig[variant];

  return (
    <AnimatePresence>
      {open && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onCancel}
            className="fixed inset-0 bg-black/50 z-40"
          />

          {/* Dialog */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4"
          >
            <div className={`bg-white rounded-lg shadow-xl max-w-md w-full p-6 ${config.bg}`}>
              {/* Icon */}
              <div className={`flex justify-center mb-4 text-red-600`}>{config.icon}</div>

              {/* Title */}
              <h2 className={`text-xl font-bold text-center ${config.text} mb-2`}>{title}</h2>

              {/* Message */}
              <p className={`text-center ${config.text} mb-6`}>{message}</p>

              {/* Actions */}
              <div className="flex gap-3">
                <button
                  onClick={onCancel}
                  disabled={loading}
                  className="flex-1 px-4 py-2 border border-slate-300 rounded-lg text-slate-700 hover:bg-slate-50 transition-colors disabled:opacity-50"
                >
                  {cancelText}
                </button>
                <button
                  onClick={onConfirm}
                  disabled={loading}
                  className={`flex-1 px-4 py-2 rounded-lg font-medium transition-colors disabled:opacity-50 ${config.button}`}
                >
                  {loading ? (
                    <span className="flex items-center justify-center gap-2">
                      <span className="animate-spin">⏳</span>
                      {confirmText}
                    </span>
                  ) : (
                    confirmText
                  )}
                </button>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};
