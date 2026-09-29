from typing import List, Optional
from sqlalchemy.orm import Session
from fastapi import HTTPException, status
from backend.models import Bounty, BountyStatus, User
from backend.schemas import BountyCreate, BountyUpdate


def get_bounties(
    db: Session,
    status_filter: Optional[BountyStatus] = None,
    category: Optional[str] = None,
    owner_id: Optional[str] = None
) -> List[Bounty]:
    query = db.query(Bounty)
    if status_filter:
        query = query.filter(Bounty.status == status_filter)
    if category:
        query = query.filter(Bounty.category.ilike(f"%{category}%"))
    if owner_id:
        query = query.filter(Bounty.owner_id == owner_id)
    return query.order_by(Bounty.created_at.desc()).all()


def get_bounty(db: Session, bounty_id: str) -> Optional[Bounty]:
    return db.query(Bounty).filter(Bounty.id == bounty_id).first()


def create_bounty(db: Session, bounty_in: BountyCreate) -> Bounty:
    owner = db.query(User).filter(User.id == bounty_in.owner_id).first()
    if not owner:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Bounty owner user not found"
        )

    bounty = Bounty(
        title=bounty_in.title,
        description=bounty_in.description,
        model_name=bounty_in.model_name,
        model_version=bounty_in.model_version,
        category=bounty_in.category,
        reward=bounty_in.reward,
        status=bounty_in.status,
        owner_id=bounty_in.owner_id,
        expected_behavior=bounty_in.expected_behavior,
        testing_requirements=bounty_in.testing_requirements
    )
    db.add(bounty)
    db.commit()
    db.refresh(bounty)
    return bounty


def update_bounty(db: Session, bounty_id: str, bounty_in: BountyUpdate) -> Bounty:
    bounty = get_bounty(db, bounty_id)
    if not bounty:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Bounty not found"
        )

    update_data = bounty_in.model_dump(exclude_unset=True)
    for field, val in update_data.items():
        setattr(bounty, field, val)

    db.commit()
    db.refresh(bounty)
    return bounty


def delete_bounty(db: Session, bounty_id: str) -> None:
    bounty = get_bounty(db, bounty_id)
    if not bounty:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Bounty not found"
        )
    db.delete(bounty)
    db.commit()


def get_owner_bounties(db: Session, owner_id: str) -> List[Bounty]:
    owner = db.query(User).filter(User.id == owner_id).first()
    if not owner:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found"
        )
    return db.query(Bounty).filter(Bounty.owner_id == owner_id).all()
