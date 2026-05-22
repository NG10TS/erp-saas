import React, { Fragment } from 'react';
import { Dialog, Transition } from '@headlessui/react';
import { XMarkIcon } from '@heroicons/react/24/outline';
import { clsx } from 'clsx';

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  description?: string;
  children: React.ReactNode;
  size?: 'sm' | 'md' | 'lg' | 'xl' | 'full';
  showCloseButton?: boolean;
  tone?: 'default' | 'danger';
  confirmLabel?: string;
  cancelLabel?: string;
  onConfirm?: () => void;
  isConfirming?: boolean;
}

const sizes = {
  sm: 'max-w-md',
  md: 'max-w-lg',
  lg: 'max-w-2xl',
  xl: 'max-w-4xl',
  full: 'max-w-[90vw]',
};

export const Modal: React.FC<ModalProps> = ({
  isOpen,
  onClose,
  title,
  description,
  children,
  size = 'md',
  showCloseButton = true,
  tone = 'default',
  confirmLabel,
  cancelLabel = 'Cancelar',
  onConfirm,
  isConfirming = false,
}) => {
  const isDanger = tone === 'danger';

  return (
    <Transition appear show={isOpen} as={Fragment}>
      <Dialog as="div" className="relative z-50" onClose={onClose}>
        <Transition.Child
          as={Fragment}
          enter="ease-out duration-300"
          enterFrom="opacity-0"
          enterTo="opacity-100"
          leave="ease-in duration-200"
          leaveFrom="opacity-100"
          leaveTo="opacity-0"
        >
          <div className="fixed inset-0 bg-gray-950/55 backdrop-blur-sm" />
        </Transition.Child>

        <div className="fixed inset-0 overflow-y-auto">
          <div className="flex min-h-full items-center justify-center p-4 text-center">
            <Transition.Child
              as={Fragment}
              enter="ease-out duration-300"
              enterFrom="opacity-0 scale-95"
              enterTo="opacity-100 scale-100"
              leave="ease-in duration-200"
              leaveFrom="opacity-100 scale-100"
              leaveTo="opacity-0 scale-95"
            >
              <Dialog.Panel
                className={clsx(
                  'w-full transform overflow-hidden rounded-2xl bg-white p-6 text-left align-middle shadow-xl transition-all',
                  sizes[size]
                )}
              >
                {showCloseButton && (
                  <button
                    onClick={onClose}
                    className="absolute right-4 top-4 rounded-full p-1 text-gray-400 transition-colors hover:bg-gray-100 hover:text-gray-700"
                    aria-label="Cerrar modal"
                  >
                    <XMarkIcon className="w-5 h-5" />
                  </button>
                )}
                
                {title && (
                  <Dialog.Title
                    as="h3"
                    className={clsx(
                      'mb-2 text-lg font-semibold leading-6',
                      isDanger ? 'text-red-700' : 'text-gray-900'
                    )}
                  >
                    {title}
                  </Dialog.Title>
                )}
                
                {description && (
                  <Dialog.Description className="text-sm text-gray-500 mb-4">
                    {description}
                  </Dialog.Description>
                )}
                
                {children}

                {onConfirm && (
                  <div className="mt-6 flex flex-col-reverse gap-3 border-t border-gray-100 pt-4 sm:flex-row sm:justify-end">
                    <button
                      type="button"
                      onClick={onClose}
                      className="rounded-2xl border border-gray-200 px-4 py-2.5 text-sm font-medium text-gray-600 transition-colors hover:bg-gray-50"
                    >
                      {cancelLabel}
                    </button>
                    <button
                      type="button"
                      onClick={onConfirm}
                      disabled={isConfirming}
                      className={clsx(
                        'inline-flex items-center justify-center rounded-2xl px-4 py-2.5 text-sm font-semibold text-white transition-all',
                        isDanger
                          ? 'bg-red-500 hover:bg-red-600'
                          : 'bg-emerald-500 hover:bg-emerald-600',
                        isConfirming && 'opacity-60'
                      )}
                    >
                      {isConfirming ? 'Procesando...' : confirmLabel || 'Confirmar'}
                    </button>
                  </div>
                )}
              </Dialog.Panel>
            </Transition.Child>
          </div>
        </div>
      </Dialog>
    </Transition>
  );
};
