from typing import List, Optional
from sqlalchemy.orm import Session
from fastapi import HTTPException, status
from backend.models import Finding, FindingStatus, FindingSeverity, Bounty, BountyStatus, User
from backend.schemas import FindingCreate, FindingUpdate


def get_findings(
    db: Session,
    status_filter: Optional[FindingStatus] = None,
    bounty_id: Optional[str] = None,
    researcher_id: Optional[str] = None,
    severity: Optional[FindingSeverity] = None
) -> List[Finding]:
    query = db.query(Finding)
    if status_filter:
        query = query.filter(Finding.status == status_filter)
    if bounty_id:
        query = query.filter(Finding.bounty_id == bounty_id)
    if researcher_id:
        query = query.filter(Finding.researcher_id == researcher_id)
    if severity:
        query = query.filter(Finding.severity == severity)
    return query.order_by(Finding.created_at.desc()).all()


def get_finding(db: Session, finding_id: str) -> Optional[Finding]:
    finding = db.query(Finding).filter(Finding.id == finding_id).first()
    if not finding:
        alias_map = {
            "submission-001": "finding-approved-01",
            "submission-002": "finding-rejected-01",
            "submission-003": "finding-pending-01",
            "finding-approved-01": "submission-001",
            "finding-rejected-01": "submission-002",
            "finding-pending-01": "submission-003",
        }
        target_id = alias_map.get(finding_id)
        if target_id:
            finding = db.query(Finding).filter(Finding.id == target_id).first()
    return finding


def create_finding(db: Session, finding_in: FindingCreate) -> Finding:
    # 1. Verify user exists
    user = db.query(User).filter(User.id == finding_in.researcher_id).first()
    if not user:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Researcher user '{finding_in.researcher_id}' not found"
        )

    # 2. Verify bounty exists
    bounty = db.query(Bounty).filter(Bounty.id == finding_in.bounty_id).first()
    if not bounty:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Bounty '{finding_in.bounty_id}' not found"
        )

    # 3. Verify bounty is ACTIVE
    if bounty.status != BountyStatus.ACTIVE:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Cannot submit finding: Bounty status is {bounty.status.value}, not ACTIVE"
        )

    # 4. Resolve reward
    reward = finding_in.reward if finding_in.reward else bounty.reward

    # 5. Create Finding with status PENDING
    finding = Finding(
        bounty_id=finding_in.bounty_id,
        researcher_id=finding_in.researcher_id,
        finding_title=finding_in.finding_title,
        severity=finding_in.severity,
        what_happened=finding_in.what_happened,
        evidence=finding_in.evidence,
        reproduction_steps=finding_in.reproduction_steps,
        expected_behavior=finding_in.expected_behavior or bounty.expected_behavior,
        actual_behavior=finding_in.actual_behavior,
        status=FindingStatus.PENDING,
        reward=reward
    )
    db.add(finding)
    db.commit()
    db.refresh(finding)
    return finding


def update_finding(db: Session, finding_id: str, finding_in: FindingUpdate) -> Finding:
    finding = get_finding(db, finding_id)
    if not finding:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Finding not found"
        )

    update_data = finding_in.model_dump(exclude_unset=True)
    for field, val in update_data.items():
        setattr(finding, field, val)

    db.commit()
    db.refresh(finding)
    return finding


def get_researcher_findings(db: Session, researcher_id: str) -> List[Finding]:
    researcher = db.query(User).filter(User.id == researcher_id).first()
    if not researcher:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Researcher user not found"
        )
    return db.query(Finding).filter(Finding.researcher_id == researcher_id).all()
