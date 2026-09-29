from typing import List, Optional
from sqlalchemy.orm import Session
from fastapi import HTTPException, status
from backend.models import Reward, RewardStatus


def get_rewards(db: Session, status_filter: Optional[RewardStatus] = None) -> List[Reward]:
    query = db.query(Reward)
    if status_filter:
        query = query.filter(Reward.status == status_filter)
    return query.order_by(Reward.created_at.desc()).all()


def get_reward_by_id(db: Session, reward_id: str) -> Optional[Reward]:
    return db.query(Reward).filter(Reward.id == reward_id).first()


def create_reward(
    db: Session,
    finding_id: str,
    recipient_id: str,
    amount: str,
    currency: str = "ETH",
    status: RewardStatus = RewardStatus.PENDING
) -> Reward:
    reward = Reward(
        finding_id=finding_id,
        recipient_id=recipient_id,
        amount=amount,
        currency=currency,
        status=status,
        transaction_hash=None
    )
    db.add(reward)
    db.commit()
    db.refresh(reward)
    return reward


def update_reward_status(
    db: Session,
    reward_id: str,
    status: RewardStatus,
    transaction_hash: Optional[str] = None
) -> Reward:
    reward = get_reward_by_id(db, reward_id)
    if not reward:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Reward not found"
        )
    reward.status = status
    if transaction_hash:
        reward.transaction_hash = transaction_hash
    db.commit()
    db.refresh(reward)
    return reward
