from typing import List, Optional
from sqlalchemy.orm import Session
from fastapi import HTTPException, status
from backend.models import User
from backend.schemas import UserCreate


def get_user(db: Session, user_id: str) -> Optional[User]:
    return db.query(User).filter(User.id == user_id).first()


def get_user_by_wallet(db: Session, wallet_address: str) -> Optional[User]:
    if not wallet_address:
        return None
    return db.query(User).filter(User.wallet_address == wallet_address).first()


def get_users(db: Session, skip: int = 0, limit: int = 100) -> List[User]:
    return db.query(User).offset(skip).limit(limit).all()


def create_user(db: Session, user_in: UserCreate) -> User:
    if user_in.wallet_address:
        existing = get_user_by_wallet(db, user_in.wallet_address)
        if existing:
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail="A user with this wallet address already exists"
            )

    user = User(
        wallet_address=user_in.wallet_address,
        display_name=user_in.display_name,
        role=user_in.role
    )
    db.add(user)
    db.commit()
    db.refresh(user)
    return user
