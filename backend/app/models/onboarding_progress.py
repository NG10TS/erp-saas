"""
OnboardingProgress model
Persists wizard state so users can resume on any device.
"""
import uuid
from datetime import datetime
from sqlalchemy import Column, String, Boolean, DateTime, Integer, ForeignKey, Index, Text
from sqlalchemy.dialects.postgresql import UUID, JSONB
from sqlalchemy.orm import relationship

from app.db.base_class import Base


class OnboardingProgress(Base):
    """
    Stores the current step and partial data for each user's onboarding.

    One row per user — upserted on every save.
    Deleted (or marked done) when onboarding is completed.
    """
    __tablename__ = "onboarding_progress"

    __table_args__ = (
        Index("ix_onboarding_progress_user_id", "user_id", unique=True),
    )

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)

    # Owner
    user_id = Column(
        UUID(as_uuid=True),
        ForeignKey("users.id", ondelete="CASCADE"),
        nullable=False,
        unique=True,
    )

    # Which step the user is currently on (0-based, matches frontend totalSteps)
    current_step = Column(Integer, nullable=False, default=0)

    # Which steps have been completed (list of step numbers stored as JSONB)
    # e.g. [0, 1, 2]
    completed_steps = Column(JSONB, nullable=False, default=list)

    # Selected plan
    selected_plan = Column(String(20), nullable=True)  # free | pro | business

    # Partial data collected during each step (merged on save)
    # Shape: { "business": {...}, "product": {...}, "customer": {...} }
    step_data = Column(JSONB, nullable=False, default=dict)

    # Whether the whole onboarding has been completed
    is_completed = Column(Boolean, nullable=False, default=False)
    completed_at = Column(DateTime, nullable=True)

    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    updated_at = Column(
        DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False
    )

    user = relationship("User", lazy="raise")

    def __repr__(self) -> str:
        return (
            f"<OnboardingProgress user={self.user_id} "
            f"step={self.current_step} done={self.is_completed}>"
        )