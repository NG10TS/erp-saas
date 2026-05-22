import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import type { PlanTier } from '@/types/onboarding';
import type { Customer } from '@/types/customer';
import type { Product } from '@/types/product';
import type { Sale } from '@/types/sale';

interface OnboardingBusiness {
  id?: string;
  business_name?: string;
  ruc?: string;
  phone?: string;
  email?: string;
  address?: string;
}

interface OnboardingState {
  business: OnboardingBusiness | null;
  product: Product | null;
  customer: Customer | null;
  sale: Sale | null;
  currentStep: number;
  completed: boolean;
  businessCreated: boolean;
  productCreated: boolean;
  customerCreated: boolean;
  saleCreated: boolean;
  selectedPlan: PlanTier | null;
  isSubmitting: boolean;
  errors: Record<string, string>;
  setBusiness: (data: OnboardingBusiness | null) => void;
  setProduct: (data: Product | null) => void;
  setCustomer: (data: Customer | null) => void;
  setSale: (data: Sale | null) => void;
  setCurrentStep: (step: number) => void;
  setCompleted: (completed: boolean) => void;
  setBusinessCreated: (created: boolean) => void;
  setProductCreated: (created: boolean) => void;
  setCustomerCreated: (created: boolean) => void;
  setSaleCreated: (created: boolean) => void;
  setSelectedPlan: (plan: PlanTier | null) => void;
  setIsSubmitting: (v: boolean) => void;
  setError: (key: string, error: string) => void;
  clearErrors: () => void;
  reset: () => void;
  canProceed: () => boolean;
  getProgress: () => number;
}

const INITIAL: Omit<
  OnboardingState,
  | 'setBusiness'
  | 'setProduct'
  | 'setCustomer'
  | 'setSale'
  | 'setCurrentStep'
  | 'setCompleted'
  | 'setBusinessCreated'
  | 'setProductCreated'
  | 'setCustomerCreated'
  | 'setSaleCreated'
  | 'setSelectedPlan'
  | 'setIsSubmitting'
  | 'setError'
  | 'clearErrors'
  | 'reset'
  | 'canProceed'
  | 'getProgress'
> = {
  business: null,
  product: null,
  customer: null,
  sale: null,
  currentStep: 0,
  completed: false,
  businessCreated: false,
  productCreated: false,
  customerCreated: false,
  saleCreated: false,
  selectedPlan: null,
  isSubmitting: false,
  errors: {},
};

export const useOnboardingStore = create<OnboardingState>()(
  persist(
    (set, get) => ({
      ...INITIAL,

      setBusiness: (data) => set({ business: data }),
      setProduct: (data) => set({ product: data }),
      setCustomer: (data) => set({ customer: data }),
      setSale: (data) => set({ sale: data }),
      setCurrentStep: (step) => set({ currentStep: step }),
      setCompleted: (completed) => set({ completed }),
      setBusinessCreated: (created) => set({ businessCreated: created }),
      setProductCreated: (created) => set({ productCreated: created }),
      setCustomerCreated: (created) => set({ customerCreated: created }),
      setSaleCreated: (created) => set({ saleCreated: created }),
      setSelectedPlan: (plan) => set({ selectedPlan: plan }),
      setIsSubmitting: (v) => set({ isSubmitting: v }),
      setError: (key, error) => set((s) => ({ errors: { ...s.errors, [key]: error } })),
      clearErrors: () => set({ errors: {} }),

      reset: () => set({ ...INITIAL }),

      canProceed: () => {
        const s = get();
        switch (s.currentStep) {
          case 1:
            return !!s.businessCreated;
          case 2:
            return !!s.productCreated;
          case 3:
            return !!s.customerCreated;
          case 4:
            return !!s.selectedPlan;
          case 5:
            return !!s.saleCreated;
          default:
            return true;
        }
      },

      getProgress: () => {
        const s = get();
        const done = [
          s.businessCreated,
          s.productCreated,
          s.customerCreated,
          !!s.selectedPlan,
          s.saleCreated,
        ].filter(Boolean).length;
        return (done / 5) * 100;
      },
    }),
    {
      name: 'onboarding-storage',
      storage: createJSONStorage(() => localStorage),
      partialize: (s) => ({
        business: s.business,
        product: s.product,
        customer: s.customer,
        sale: s.sale,
        currentStep: s.currentStep,
        completed: s.completed,
        businessCreated: s.businessCreated,
        productCreated: s.productCreated,
        customerCreated: s.customerCreated,
        saleCreated: s.saleCreated,
        selectedPlan: s.selectedPlan,
      }),
    }
  )
);
