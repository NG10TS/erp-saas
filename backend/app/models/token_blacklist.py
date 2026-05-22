"""
Token Blacklist model
Used to invalidate JWT tokens on logout and refresh rotation.
"""
import uuid
from datetime import datetime
from sqlalchemy import Column, String, DateTime, ForeignKey, Index
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship

from app.db.base_class import Base


class TokenBlacklist(Base):
    """
    Stores revoked JWT tokens.

    A token is considered revoked if its JTI (JWT ID) exists in this table
    and has not yet expired. Expired rows are cleaned up periodically by Celery.
    """
    __tablename__ = "token_blacklist"

    __table_args__ = (
        Index("ix_token_blacklist_jti", "jti", unique=True),
        Index("ix_token_blacklist_expires_at", "expires_at"),
        Index("ix_token_blacklist_user_id", "user_id"),
    )

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)

    # JWT ID claim — unique identifier of the token
    jti = Column(String(64), nullable=False, unique=True)

    # "access" or "refresh"
    token_type = Column(String(10), nullable=False, default="access")

    # Owner of the revoked token
    user_id = Column(
        UUID(as_uuid=True),
        ForeignKey("users.id", ondelete="CASCADE"),
        nullable=False,
    )

    # When the token itself expires (used for cleanup)
    expires_at = Column(DateTime, nullable=False)

    # When it was revoked
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)

    # Relationship (lazy loading — avoid extra query on every check)
    user = relationship("User", lazy="raise")

    def __repr__(self) -> str:
        return f"<TokenBlacklist jti={self.jti[:8]}... type={self.token_type}>"

    @property
    def is_expired(self) -> bool:
        """True if the underlying token has expired (row can be deleted)"""
        return datetime.utcnow() > self.expires_at