from typing import Optional, List
from sqlalchemy.orm import Session
from fastapi import HTTPException, status
from backend.models import (
    Finding,
    FindingStatus,
    Validation,
    ValidationDecision,
    Reward,
    RewardStatus,
    User
)


def approve_finding(
    db: Session,
    finding_id: str,
    validator_id: str,
    comment: Optional[str] = None
) -> Finding:
    # 1. Find finding
    from backend.services.finding_service import get_finding
    finding = get_finding(db, finding_id)
    if not finding:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Finding not found"
        )

    # 2. Ensure status allows validation & prevent duplicate validation
    if finding.status == FindingStatus.APPROVED:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="Finding is already approved"
        )
    if finding.status == FindingStatus.REJECTED:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="Finding is already rejected and cannot be approved"
        )

    # Verify validator exists
    validator = db.query(User).filter(User.id == validator_id).first()
    if not validator:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Validator user not found"
        )

    # 3. Update status to APPROVED
    finding.status = FindingStatus.APPROVED

    # 4. Create Validation record
    validation = Validation(
        finding_id=finding.id,
        validator_id=validator_id,
        decision=ValidationDecision.APPROVED,
        comment=comment
    )
    db.add(validation)

    # 5. Create Reward record with status = PENDING (Do NOT send blockchain transaction)
    existing_reward = db.query(Reward).filter(Reward.finding_id == finding.id).first()
    if not existing_reward:
        reward = Reward(
            finding_id=finding.id,
            recipient_id=finding.researcher_id,
            amount=finding.reward,
            currency="ETH",
            status=RewardStatus.PENDING,
            transaction_hash=None
        )
        db.add(reward)

    db.commit()
    db.refresh(finding)
    return finding


def reject_finding(
    db: Session,
    finding_id: str,
    validator_id: str,
    comment: Optional[str] = None
) -> Finding:
    # 1. Find finding
    from backend.services.finding_service import get_finding
    finding = get_finding(db, finding_id)
    if not finding:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Finding not found"
        )

    # 2. Ensure status allows validation & prevent duplicate validation
    if finding.status == FindingStatus.APPROVED:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="Finding is already approved and cannot be rejected"
        )
    if finding.status == FindingStatus.REJECTED:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="Finding is already rejected"
        )

    # Verify validator exists
    validator = db.query(User).filter(User.id == validator_id).first()
    if not validator:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Validator user not found"
        )

    # 3. Update status to REJECTED
    finding.status = FindingStatus.REJECTED

    # 4. Create Validation record
    validation = Validation(
        finding_id=finding.id,
        validator_id=validator_id,
        decision=ValidationDecision.REJECTED,
        comment=comment
    )
    db.add(validation)

    # 5. Do NOT create a distributed reward
    db.commit()
    db.refresh(finding)
    return finding


def get_validations_for_finding(db: Session, finding_id: str) -> List[Validation]:
    return db.query(Validation).filter(Validation.finding_id == finding_id).all()
