// frontend/src/hooks/useOnboardingProgress.ts
/**
 * Hook for syncing onboarding progress with the backend.
 *
 * Usage:
 *   const { saveProgress, loadProgress, completeOnboarding, isLoading } = useOnboardingProgress();
 */
import { useState, useCallback } from 'react';
import apiClient from '@/lib/api-client';
import { useOnboardingStore } from '@/store/slices/onboardingSlice';
import type { PlanTier } from '@/types/onboarding';
import type { Product } from '@/types/product';
import type { Customer } from '@/types/customer';

interface SavePayload {
  current_step:    number;
  completed_steps: number[];
  step_data?:      Record<string, unknown>;
  selected_plan?:  PlanTier | null;
}

interface ProgressResponse {
  id:              string;
  current_step:    number;
  completed_steps: number[];
  selected_plan:   PlanTier | null;
  step_data:       Record<string, unknown>;
  is_completed:    boolean;
  updated_at:      string;
}

export const useOnboardingProgress = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [error,     setError]     = useState<string | null>(null);

  const store = useOnboardingStore();

  // ── Load existing progress from backend ──────────────────────────────────

  const loadProgress = useCallback(async (): Promise<ProgressResponse | null> => {
    setIsLoading(true);
    setError(null);
    try {
      const r = await apiClient.get<ProgressResponse | null>('/onboarding/progress');
      const data = r.data;

      if (data && !data.is_completed) {
        // Restore store from backend so user can resume on any device
        store.setCurrentStep(data.current_step);
        if (data.step_data?.business) store.setBusiness(data.step_data.business);
        if (data.step_data?.product)  store.setProduct(data.step_data.product as Product);
        if (data.step_data?.customer) store.setCustomer(data.step_data.customer as Customer);
        if (data.selected_plan)       store.setSelectedPlan(data.selected_plan);
      }

      return data;
    } catch (e) {
      // Non-fatal — fall back to localStorage state
      console.warn('Could not load onboarding progress from backend:', e);
      return null;
    } finally {
      setIsLoading(false);
    }
  }, [store]);

  // ── Save step progress ───────────────────────────────────────────────────

  const saveProgress = useCallback(async (payload: SavePayload): Promise<void> => {
    setIsLoading(true);
    setError(null);
    try {
      await apiClient.post('/onboarding/progress', payload);
    } catch (e) {
      // Non-fatal — data is also in localStorage via zustand/persist
      console.warn('Could not save onboarding progress to backend:', e);
    } finally {
      setIsLoading(false);
    }
  }, []);

  // ── Select plan ──────────────────────────────────────────────────────────

  const selectPlan = useCallback(async (plan: PlanTier): Promise<void> => {
    setIsLoading(true);
    setError(null);
    try {
      await apiClient.post('/onboarding/select-plan', { plan });
      store.setSelectedPlan(plan);
    } catch (e) {
      const msg = e instanceof Error ? e.message : 'Error al seleccionar plan';
      setError(msg);
      throw e;
    } finally {
      setIsLoading(false);
    }
  }, [store]);

  // ── Complete onboarding ──────────────────────────────────────────────────

  const completeOnboarding = useCallback(async (plan: PlanTier = 'free'): Promise<void> => {
    setIsLoading(true);
    setError(null);
    try {
      await apiClient.post('/onboarding/complete', { selected_plan: plan });
      store.setCompleted(true);
    } catch (e) {
      const msg = e instanceof Error ? e.message : 'Error al completar onboarding';
      setError(msg);
      throw e;
    } finally {
      setIsLoading(false);
    }
  }, [store]);

  return {
    isLoading,
    error,
    loadProgress,
    saveProgress,
    selectPlan,
    completeOnboarding,
  };
};
