// frontend/src/types/onboarding.ts

export type PlanTier = 'free' | 'pro' | 'business';

export interface Plan {
  id: PlanTier;
  name: string;
  price_usd: number;
  billing: string;
  description: string;
  features: PlanFeature[];
  recommended: boolean;
  badge?: string | null;
}

export interface PlanFeature {
  label: string;
  included: boolean;
  limit?: string | null;
}

export interface OnboardingProgress {
  current_step: number;
  completed_steps: number[];
  selected_plan: PlanTier | null;
  data: {
    business?: any;
    product?: any;
    customer?: any;
    sale?: any;
  };
  created_at: string;
  updated_at: string;
}

export interface OnboardingProgressCreate {
  current_step: number;
  completed_steps?: number[];
  selected_plan?: PlanTier | null;
  data?: Record<string, any>;
}

export interface OnboardingProgressUpdate {
  current_step?: number;
  completed_steps?: number[];
  selected_plan?: PlanTier | null;
  data?: Record<string, any>;
}

export interface OnboardingProgressResponse {
  id: string;
  user_id: string;
  current_step: number;
  completed_steps: number[];
  selected_plan: PlanTier | null;
  data: Record<string, any>;
  created_at: string;
  updated_at: string;
}