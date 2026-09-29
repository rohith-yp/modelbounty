from typing import Optional, List
from datetime import datetime
from pydantic import BaseModel, Field
from backend.models import (
    UserRole,
    BountyStatus,
    FindingSeverity,
    FindingStatus,
    ValidationDecision,
    RewardStatus
)


# --- User Schemas ---
class UserBase(BaseModel):
    wallet_address: Optional[str] = None
    display_name: str = Field(..., min_length=1, max_length=100)
    role: UserRole = UserRole.RESEARCHER


class UserCreate(UserBase):
    pass


class UserResponse(UserBase):
    id: str
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True


# --- Bounty Schemas ---
class BountyBase(BaseModel):
    title: str = Field(..., min_length=1, max_length=200)
    description: str = Field(..., min_length=1)
    model_name: str = Field(..., min_length=1, max_length=100)
    model_version: str = Field("1.0.0", max_length=50)
    category: str = Field(..., min_length=1, max_length=100)
    reward: str = Field(..., min_length=1, max_length=50)
    status: BountyStatus = BountyStatus.ACTIVE
    expected_behavior: Optional[str] = None
    testing_requirements: Optional[str] = None


class BountyCreate(BountyBase):
    owner_id: str


class BountyUpdate(BaseModel):
    title: Optional[str] = None
    description: Optional[str] = None
    model_name: Optional[str] = None
    model_version: Optional[str] = None
    category: Optional[str] = None
    reward: Optional[str] = None
    status: Optional[BountyStatus] = None
    expected_behavior: Optional[str] = None
    testing_requirements: Optional[str] = None


class BountyResponse(BountyBase):
    id: str
    owner_id: str
    created_at: datetime
    updated_at: datetime
    finding_count: Optional[int] = 0

    class Config:
        from_attributes = True


# --- Finding Schemas ---
class FindingBase(BaseModel):
    finding_title: str = Field(..., min_length=1, max_length=200)
    severity: FindingSeverity = FindingSeverity.MEDIUM
    what_happened: str = Field(..., min_length=1)
    evidence: str = Field(..., min_length=1)
    reproduction_steps: str = Field(..., min_length=1)
    expected_behavior: Optional[str] = None
    actual_behavior: Optional[str] = None


class FindingCreate(FindingBase):
    bounty_id: str
    researcher_id: str
    reward: Optional[str] = None


class FindingUpdate(BaseModel):
    finding_title: Optional[str] = None
    severity: Optional[FindingSeverity] = None
    what_happened: Optional[str] = None
    evidence: Optional[str] = None
    reproduction_steps: Optional[str] = None
    status: Optional[FindingStatus] = None


class FindingResponse(FindingBase):
    id: str
    bounty_id: str
    researcher_id: str
    status: FindingStatus
    reward: str
    created_at: datetime
    updated_at: datetime
    bounty_title: Optional[str] = None
    model_name: Optional[str] = None
    researcher_name: Optional[str] = None

    class Config:
        from_attributes = True


# --- Validation Schemas ---
class ValidationCreate(BaseModel):
    validator_id: str = "user-validator"
    comment: Optional[str] = None


class ValidationResponse(BaseModel):
    id: str
    finding_id: str
    validator_id: str
    decision: ValidationDecision
    comment: Optional[str]
    created_at: datetime

    class Config:
        from_attributes = True


# --- Reward Schemas ---
class RewardResponse(BaseModel):
    id: str
    finding_id: str
    recipient_id: str
    amount: str
    currency: str
    status: RewardStatus
    transaction_hash: Optional[str]
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True


# --- Analysis Schemas ---
class AIAnalysisResponse(BaseModel):
    id: str
    finding_id: str
    provider: str
    model: str
    analysis_type: str
    result: str
    confidence: Optional[float]
    created_at: datetime

    class Config:
        from_attributes = True


class MLAnalysisResponse(BaseModel):
    id: str
    bounty_id: str
    model_type: str
    framework: str
    model_version: str
    analysis_type: str
    result: str
    metrics: Optional[str]
    created_at: datetime

    class Config:
        from_attributes = True


# --- Dashboard Stats Schema ---
class DashboardStats(BaseModel):
    active_bounties: int
    total_bounties: int
    total_findings: int
    pending_findings: int
    approved_findings: int
    rejected_findings: int
    total_rewards: str
    distributed_rewards: str
    verification_rate: str


# --- Integration Health Schema ---
class IntegrationStatus(BaseModel):
    database: str
    llm: str
    ml: str
    blockchain: str


class HealthResponse(BaseModel):
    status: str
