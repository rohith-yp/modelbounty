import enum
import uuid
from datetime import datetime
from sqlalchemy import (
    Column,
    String,
    Text,
    Enum,
    DateTime,
    ForeignKey,
    Float
)
from sqlalchemy.orm import relationship
from backend.database import Base


def generate_uuid() -> str:
    return str(uuid.uuid4())


class UserRole(str, enum.Enum):
    MODEL_OWNER = "MODEL_OWNER"
    RESEARCHER = "RESEARCHER"
    VALIDATOR = "VALIDATOR"
    ADMIN = "ADMIN"


class BountyStatus(str, enum.Enum):
    ACTIVE = "ACTIVE"
    PAUSED = "PAUSED"
    CLOSED = "CLOSED"


class FindingSeverity(str, enum.Enum):
    LOW = "LOW"
    MEDIUM = "MEDIUM"
    HIGH = "HIGH"
    CRITICAL = "CRITICAL"


class FindingStatus(str, enum.Enum):
    PENDING = "PENDING"
    UNDER_REVIEW = "UNDER_REVIEW"
    APPROVED = "APPROVED"
    REJECTED = "REJECTED"


class ValidationDecision(str, enum.Enum):
    APPROVED = "APPROVED"
    REJECTED = "REJECTED"


class RewardStatus(str, enum.Enum):
    PENDING = "PENDING"
    PROCESSING = "PROCESSING"
    DISTRIBUTED = "DISTRIBUTED"
    FAILED = "FAILED"


class User(Base):
    __tablename__ = "users"

    id = Column(String, primary_key=True, default=generate_uuid)
    wallet_address = Column(String, unique=True, nullable=True, index=True)
    display_name = Column(String, nullable=False)
    role = Column(Enum(UserRole), nullable=False, default=UserRole.RESEARCHER)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)

    # Relationships
    bounties = relationship("Bounty", back_populates="owner", cascade="all, delete-orphan")
    findings = relationship("Finding", back_populates="researcher", cascade="all, delete-orphan")
    validations = relationship("Validation", back_populates="validator", cascade="all, delete-orphan")
    rewards = relationship("Reward", back_populates="recipient", cascade="all, delete-orphan")


class Bounty(Base):
    __tablename__ = "bounties"

    id = Column(String, primary_key=True, default=generate_uuid)
    title = Column(String, nullable=False)
    description = Column(Text, nullable=False)
    model_name = Column(String, nullable=False)
    model_version = Column(String, default="1.0.0", nullable=False)
    category = Column(String, nullable=False)
    reward = Column(String, nullable=False)
    status = Column(Enum(BountyStatus), default=BountyStatus.ACTIVE, nullable=False, index=True)
    owner_id = Column(String, ForeignKey("users.id"), nullable=False)
    expected_behavior = Column(Text, nullable=True)
    testing_requirements = Column(Text, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)

    # Relationships
    owner = relationship("User", back_populates="bounties")
    findings = relationship("Finding", back_populates="bounty", cascade="all, delete-orphan")
    ml_analyses = relationship("MLAnalysis", back_populates="bounty", cascade="all, delete-orphan")


class Finding(Base):
    __tablename__ = "findings"

    id = Column(String, primary_key=True, default=generate_uuid)
    bounty_id = Column(String, ForeignKey("bounties.id"), nullable=False, index=True)
    researcher_id = Column(String, ForeignKey("users.id"), nullable=False, index=True)
    finding_title = Column(String, nullable=False)
    severity = Column(Enum(FindingSeverity), nullable=False, default=FindingSeverity.MEDIUM)
    what_happened = Column(Text, nullable=False)
    evidence = Column(Text, nullable=False)
    reproduction_steps = Column(Text, nullable=False)
    expected_behavior = Column(Text, nullable=True)
    actual_behavior = Column(Text, nullable=True)
    status = Column(Enum(FindingStatus), default=FindingStatus.PENDING, nullable=False, index=True)
    reward = Column(String, nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)

    # Relationships
    bounty = relationship("Bounty", back_populates="findings")
    researcher = relationship("User", back_populates="findings")
    validations = relationship("Validation", back_populates="finding", cascade="all, delete-orphan")
    rewards = relationship("Reward", back_populates="finding", cascade="all, delete-orphan")
    ai_analyses = relationship("AIAnalysis", back_populates="finding", cascade="all, delete-orphan")


class Validation(Base):
    __tablename__ = "validations"

    id = Column(String, primary_key=True, default=generate_uuid)
    finding_id = Column(String, ForeignKey("findings.id"), nullable=False, index=True)
    validator_id = Column(String, ForeignKey("users.id"), nullable=False)
    decision = Column(Enum(ValidationDecision), nullable=False)
    comment = Column(Text, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)

    # Relationships
    finding = relationship("Finding", back_populates="validations")
    validator = relationship("User", back_populates="validations")


class Reward(Base):
    __tablename__ = "rewards"

    id = Column(String, primary_key=True, default=generate_uuid)
    finding_id = Column(String, ForeignKey("findings.id"), nullable=False, index=True)
    recipient_id = Column(String, ForeignKey("users.id"), nullable=False)
    amount = Column(String, nullable=False)
    currency = Column(String, default="ETH", nullable=False)
    status = Column(Enum(RewardStatus), default=RewardStatus.PENDING, nullable=False, index=True)
    transaction_hash = Column(String, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)

    # Relationships
    finding = relationship("Finding", back_populates="rewards")
    recipient = relationship("User", back_populates="rewards")


class AIAnalysis(Base):
    __tablename__ = "ai_analyses"

    id = Column(String, primary_key=True, default=generate_uuid)
    finding_id = Column(String, ForeignKey("findings.id"), nullable=False, index=True)
    provider = Column(String, nullable=False)
    model = Column(String, nullable=False)
    analysis_type = Column(String, nullable=False)
    result = Column(Text, nullable=False)
    confidence = Column(Float, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)

    finding = relationship("Finding", back_populates="ai_analyses")


class MLAnalysis(Base):
    __tablename__ = "ml_analyses"

    id = Column(String, primary_key=True, default=generate_uuid)
    bounty_id = Column(String, ForeignKey("bounties.id"), nullable=False, index=True)
    model_type = Column(String, nullable=False)
    framework = Column(String, nullable=False)
    model_version = Column(String, nullable=False)
    analysis_type = Column(String, nullable=False)
    result = Column(Text, nullable=False)
    metrics = Column(Text, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)

    bounty = relationship("Bounty", back_populates="ml_analyses")
