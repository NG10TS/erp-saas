// src/components/onboarding/OnboardingProgress.tsx
// Updated to show 5 steps: Negocio, Producto, Cliente, Plan, Venta
import React from 'react';
import { motion } from 'framer-motion';
import { Check } from 'lucide-react';

interface OnboardingProgressProps {
  currentStep: number;   // 0-based index matching the wizard
  totalSteps:  number;   // 7 total (0 Welcome … 6 Success)
}

// Steps 1-5 are the "real" ones shown in the progress bar
const STEPS = [
  { index: 1, label: 'Negocio', emoji: '🏢' },
  { index: 2, label: 'Producto', emoji: '📦' },
  { index: 3, label: 'Cliente', emoji: '👤' },
  { index: 4, label: 'Plan',    emoji: '⚡' },
  { index: 5, label: 'Venta',   emoji: '💰' },
];

export const OnboardingProgress: React.FC<OnboardingProgressProps> = ({
  currentStep,
}) => {
  // Map wizard step (1-5) to a 0-100% progress value
  const progress = Math.min(((currentStep - 1) / (STEPS.length - 1)) * 100, 100);

  return (
    <div className="w-full max-w-2xl mx-auto mb-8">
      {/* Bar */}
      <div className="mb-5">
        <div className="flex justify-between text-xs text-gray-500 mb-1.5">
          <span>Configurando tu negocio</span>
          <span>{Math.round(progress)}%</span>
        </div>
        <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
          <motion.div
            className="h-full bg-gradient-to-r from-primary-500 to-primary-600 rounded-full"
            initial={{ width: 0 }}
            animate={{ width: `${progress}%` }}
            transition={{ duration: 0.45, ease: 'easeOut' }}
          />
        </div>
      </div>

      {/* Step dots */}
      <div className="flex items-center justify-between relative">
        {/* Connector line behind the dots */}
        <div className="absolute left-0 right-0 top-5 h-0.5 bg-gray-200 -z-0" />

        {STEPS.map((step) => {
          const isDone    = currentStep > step.index;
          const isCurrent = currentStep === step.index;

          return (
            <div key={step.index} className="flex flex-col items-center z-10">
              <motion.div
                animate={{
                  scale: isCurrent ? 1.15 : 1,
                  backgroundColor: isDone
                    ? '#4caf50'
                    : isCurrent
                    ? '#4caf50'
                    : '#e5e7eb',
                }}
                transition={{ duration: 0.25 }}
                className="w-10 h-10 rounded-full flex items-center justify-center text-lg shadow-sm"
              >
                {isDone ? (
                  <Check className="w-4 h-4 text-white stroke-[3]" />
                ) : (
                  <span className={isCurrent ? 'text-white' : 'text-gray-500'}>
                    {step.emoji}
                  </span>
                )}
              </motion.div>
              <span
                className={`text-xs mt-2 font-medium hidden md:block transition-colors ${
                  isCurrent ? 'text-primary-600' :
                  isDone    ? 'text-gray-500'    : 'text-gray-400'
                }`}
              >
                {step.label}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
};