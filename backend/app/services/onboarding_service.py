"""
Onboarding Service
Business logic for wizard progress persistence and plan assignment.
"""
from datetime import datetime
from typing import Dict, Any, List, Optional
from uuid import UUID
import logging

from sqlalchemy.orm import Session

from app.models.onboarding_progress import OnboardingProgress
from app.models.business import Business
from app.schemas.onboarding import (
    Plan, PlanFeature, PlanTier,
    OnboardingProgressSave, OnboardingCompleteRequest,
)

logger = logging.getLogger(__name__)

# ── Plan catalogue ─────────────────────────────────────────────────────────────

PLANS: List[Plan] = [
    Plan(
        id=PlanTier.FREE,
        name="Free",
        price_usd=0,
        description="Para comenzar a conocer el sistema",
        badge=None,
        recommended=False,
        features=[
            PlanFeature(label="1 usuario",          included=True,  limit="1"),
            PlanFeature(label="Productos",           included=True,  limit="50"),
            PlanFeature(label="Facturas / mes",      included=True,  limit="50"),
            PlanFeature(label="Facturación SRI",     included=True),
            PlanFeature(label="Clientes ilimitados", included=False),
            PlanFeature(label="WhatsApp",            included=False),
            PlanFeature(label="Reportes Excel",      included=False),
            PlanFeature(label="Soporte prioritario", included=False),
        ],
    ),
    Plan(
        id=PlanTier.PRO,
        name="Pro",
        price_usd=49,
        description="Para negocios en crecimiento",
        badge="Más popular",
        recommended=True,
        features=[
            PlanFeature(label="3 usuarios",          included=True,  limit="3"),
            PlanFeature(label="Productos",           included=True,  limit="500"),
            PlanFeature(label="Facturas / mes",      included=True,  limit="200"),
            PlanFeature(label="Facturación SRI",     included=True),
            PlanFeature(label="Clientes ilimitados", included=True),
            PlanFeature(label="WhatsApp",            included=True),
            PlanFeature(label="Reportes Excel",      included=True),
            PlanFeature(label="Soporte prioritario", included=False),
        ],
    ),
    Plan(
        id=PlanTier.BUSINESS,
        name="Business",
        price_usd=99,
        description="Para empresas con alto volumen",
        badge=None,
        recommended=False,
        features=[
            PlanFeature(label="10 usuarios",         included=True,  limit="10"),
            PlanFeature(label="Productos",           included=True,  limit="Ilimitado"),
            PlanFeature(label="Facturas / mes",      included=True,  limit="Ilimitado"),
            PlanFeature(label="Facturación SRI",     included=True),
            PlanFeature(label="Clientes ilimitados", included=True),
            PlanFeature(label="WhatsApp",            included=True),
            PlanFeature(label="Reportes Excel",      included=True),
            PlanFeature(label="Soporte prioritario", included=True),
        ],
    ),
]

# Map plan tier → business limits
PLAN_LIMITS: Dict[str, Dict] = {
    "free":     {"max_users": 1,  "max_products": 50,   "max_invoices_monthly": 50},
    "pro":      {"max_users": 3,  "max_products": 500,  "max_invoices_monthly": 200},
    "business": {"max_users": 10, "max_products": 99999, "max_invoices_monthly": 99999},
}


class OnboardingService:
    """Manage onboarding progress for a user"""

    def __init__(self, db: Session):
        self.db = db

    # ─────────────────────────────────────────────────────────────────────────
    # Read
    # ─────────────────────────────────────────────────────────────────────────

    def get_progress(self, user_id: UUID) -> Optional[OnboardingProgress]:
        """Return the user's current onboarding record, or None if not started."""
        return (
            self.db.query(OnboardingProgress)
            .filter(OnboardingProgress.user_id == user_id)
            .first()
        )

    def get_plans(self) -> List[Plan]:
        """Return available subscription plans."""
        return PLANS

    # ─────────────────────────────────────────────────────────────────────────
    # Write
    # ─────────────────────────────────────────────────────────────────────────

    def save_progress(
        self, user_id: UUID, payload: OnboardingProgressSave
    ) -> OnboardingProgress:
        """
        Upsert the onboarding progress for a user.

        If data already exists the step_data is deep-merged so partial
        updates from any step don't wipe out other steps' data.

        Args:
            user_id: User UUID
            payload: Frontend-sent progress snapshot

        Returns:
            Updated OnboardingProgress record
        """
        progress = self.get_progress(user_id)

        if progress is None:
            progress = OnboardingProgress(user_id=user_id, step_data={}, completed_steps=[])
            self.db.add(progress)

        # Deep-merge step_data so steps don't overwrite each other
        merged = {**(progress.step_data or {}), **(payload.step_data or {})}
        progress.step_data = merged

        # Merge completed steps (union)
        existing_steps = set(progress.completed_steps or [])
        new_steps = set(payload.completed_steps or [])
        progress.completed_steps = sorted(existing_steps | new_steps)

        progress.current_step = payload.current_step

        if payload.selected_plan:
            progress.selected_plan = payload.selected_plan.value

        progress.updated_at = datetime.utcnow()

        try:
            self.db.commit()
            self.db.refresh(progress)
            logger.info(f"Onboarding progress saved: user={user_id} step={payload.current_step}")
        except Exception as e:
            self.db.rollback()
            logger.error(f"Error saving onboarding progress: {e}")
            raise

        return progress

    def select_plan(self, user_id: UUID, plan: PlanTier) -> OnboardingProgress:
        """
        Save plan selection without advancing the step.

        Also updates the Business record's limits immediately so that the
        new limits are enforced even before the user finishes onboarding.
        """
        progress = self.get_progress(user_id)
        if progress is None:
            progress = OnboardingProgress(user_id=user_id, step_data={}, completed_steps=[])
            self.db.add(progress)

        progress.selected_plan = plan.value
        progress.updated_at = datetime.utcnow()

        # Apply limits to the Business immediately
        self._apply_plan_to_business(user_id, plan.value)

        self.db.commit()
        self.db.refresh(progress)
        return progress

    def complete_onboarding(
        self, user_id: UUID, req: OnboardingCompleteRequest
    ) -> OnboardingProgress:
        """
        Mark onboarding as completed and apply plan limits.

        Args:
            user_id: User UUID
            req:     Contains the final selected plan

        Returns:
            Completed OnboardingProgress record
        """
        progress = self.get_progress(user_id)
        if progress is None:
            progress = OnboardingProgress(user_id=user_id, step_data={}, completed_steps=[])
            self.db.add(progress)

        progress.is_completed = True
        progress.completed_at = datetime.utcnow()
        progress.selected_plan = req.selected_plan.value
        progress.updated_at = datetime.utcnow()

        self._apply_plan_to_business(user_id, req.selected_plan.value)

        self.db.commit()
        self.db.refresh(progress)
        logger.info(
            f"Onboarding completed: user={user_id} plan={req.selected_plan.value}"
        )
        return progress

    def reset_progress(self, user_id: UUID) -> None:
        """Delete progress so user can redo the onboarding (admin/dev use)."""
        self.db.query(OnboardingProgress).filter(
            OnboardingProgress.user_id == user_id
        ).delete()
        self.db.commit()

    # ─────────────────────────────────────────────────────────────────────────
    # Private
    # ─────────────────────────────────────────────────────────────────────────

    def _apply_plan_to_business(self, user_id: UUID, plan: str) -> None:
        """Update the Business record's limits based on the chosen plan."""
        from app.models.user import User

        user = self.db.query(User).filter(User.id == user_id).first()
        if not user or not user.business_id:
            return

        business = self.db.query(Business).filter(
            Business.id == user.business_id
        ).first()
        if not business:
            return

        limits = PLAN_LIMITS.get(plan, PLAN_LIMITS["free"])
        business.subscription_plan = plan
        for key, val in limits.items():
            if hasattr(business, key):
                setattr(business, key, val)

        logger.info(f"Plan applied to business {business.id}: {plan}")