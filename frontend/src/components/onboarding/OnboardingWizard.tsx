// src/components/onboarding/OnboardingWizard.tsx
// Wizard actualizado: 8 pasos (añadido SriConfigStep en paso 5)

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { OnboardingProgress } from './OnboardingProgress';
import { WelcomeStep }        from '@/components/onboarding/steps/WelcomeStep';
import { CreateBusinessStep } from '@/components/onboarding/steps/CreateBusinessStep';
import { CreateProductStep }  from '@/components/onboarding/steps/CreateProductStep';
import { CreateCustomerStep } from '@/components/onboarding/steps/CreateCustomerStep';
import { PlanSelectionStep }  from '@/components/onboarding/steps/PlanSelectionStep';
import { CreateSaleStep }     from '@/components/onboarding/steps/CreateSaleStep';
import { SuccessStep }        from '@/components/onboarding/steps/SuccessStep';
import { useOnboardingStore } from '@/store/slices/onboardingSlice';
import { SriConfigStep } from '@/components/onboarding/steps/SriConfigStep';

interface Props {
  onComplete: () => void;
  onSkip: () => void;
}

// Paso 0: Welcome
// Paso 1: Business
// Paso 2: Product
// Paso 3: Customer
// Paso 4: Plan
// Paso 5: SRI Config
// Paso 6: Sale
// Paso 7: Success
const TOTAL_STEPS = 8;

export const OnboardingWizard: React.FC<Props> = ({ onComplete, onSkip }) => {
  const { currentStep, setCurrentStep, completed } = useOnboardingStore();
  const [isLoading, setIsLoading] = useState(false);

  // Restaurar paso guardado
  useEffect(() => {
    const isCompleted = localStorage.getItem('onboarding_completed') === 'true';
    if (isCompleted) return;

    const savedStep = localStorage.getItem('onboarding_current_step');
    if (savedStep !== null) {
      const step = parseInt(savedStep, 10);
      if (!isNaN(step) && step >= 0 && step < TOTAL_STEPS) {
        setCurrentStep(step);
      }
    }
  }, [setCurrentStep]);

  // Persistir paso actual
  useEffect(() => {
    if (currentStep >= 0) {
      localStorage.setItem('onboarding_current_step', currentStep.toString());
    }
  }, [currentStep]);

  if (completed || localStorage.getItem('onboarding_completed') === 'true') return null;

  const handleNext = () => {
    if (currentStep < TOTAL_STEPS - 1) {
      setCurrentStep(currentStep + 1);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  const handleBack = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  const handleComplete = () => {
    localStorage.removeItem('onboarding_current_step');
    localStorage.setItem('onboarding_completed', 'true');
    onComplete();
  };

  const handleSkip = () => {
    localStorage.removeItem('onboarding_current_step');
    localStorage.setItem('onboarding_completed', 'true');
    onSkip();
  };

  // Mostrar barra de progreso en pasos intermedios (no en Welcome ni Success)
  const showProgress = currentStep > 0 && currentStep < TOTAL_STEPS - 1;

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 py-12 px-4">
      <div className="max-w-4xl mx-auto">

        {/* Botón reset (solo desarrollo) */}
        {import.meta.env.DEV && (
          <div className="flex justify-end mb-2">
            <button
              onClick={() => {
                localStorage.removeItem('onboarding_current_step');
                localStorage.removeItem('onboarding_completed');
                window.location.reload();
              }}
              className="text-xs text-red-500 hover:text-red-700 underline"
            >
              Reset Onboarding (Dev)
            </button>
          </div>
        )}

        {/* Botón saltar */}
        <div className="flex justify-end mb-4">
          <button
            onClick={handleSkip}
            className="text-gray-400 hover:text-gray-600 text-sm font-medium transition-colors"
          >
            Saltar configuración →
          </button>
        </div>

        {showProgress && (
          <OnboardingProgress currentStep={currentStep} totalSteps={TOTAL_STEPS} />
        )}

        <div className="bg-white rounded-2xl shadow-xl overflow-hidden">
          <AnimatePresence mode="wait">
            <motion.div
              key={currentStep}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.25 }}
            >
              {currentStep === 0 && <WelcomeStep onNext={handleNext} />}
              {currentStep === 1 && (
                <CreateBusinessStep
                  onNext={handleNext}
                  onBack={handleBack}
                  isLoading={isLoading}
                  setIsLoading={setIsLoading}
                />
              )}
              {currentStep === 2 && (
                <CreateProductStep
                  onNext={handleNext}
                  onBack={handleBack}
                  isLoading={isLoading}
                  setIsLoading={setIsLoading}
                />
              )}
              {currentStep === 3 && (
                <CreateCustomerStep onNext={handleNext} onBack={handleBack} />
              )}
              {currentStep === 4 && (
                <PlanSelectionStep onNext={handleNext} onBack={handleBack} />
              )}
              {currentStep === 5 && (
                <SriConfigStep onNext={handleNext} onBack={handleBack} />
              )}
              {currentStep === 6 && (
                <CreateSaleStep onNext={handleNext} onBack={handleBack} />
              )}
              {currentStep === 7 && (
                <SuccessStep onComplete={handleComplete} />
              )}
            </motion.div>
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
};