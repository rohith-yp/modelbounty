from sqlalchemy.orm import Session
from fastapi import Depends
from backend.database import get_db

__all__ = ["get_db"]
