"""Service layer for AI analysis orchestration."""

from typing import Dict, Any, Optional, List
from sqlalchemy.orm import Session
from backend.ai.ai_engine import ai_engine
from backend.models import AIAnalysis


class AIService:
    @staticmethod
    def get_status() -> Dict[str, Any]:
        """Return the current AI provider configuration status."""
        return ai_engine.get_status()

    @staticmethod
    def analyze_finding(db: Session, finding_id: str) -> AIAnalysis:
        """Analyze a finding using the configured Groq LLM provider."""
        return ai_engine.analyze_finding(db, finding_id)

    @staticmethod
    def get_latest_analysis(db: Session, finding_id: str) -> Optional[AIAnalysis]:
        """Fetch the most recent analysis record for a finding."""
        return ai_engine.get_latest_analysis(db, finding_id)

    @staticmethod
    def get_analysis_history(db: Session, finding_id: str) -> List[AIAnalysis]:
        """Fetch all historical analysis records for a finding."""
        return ai_engine.get_analysis_history(db, finding_id)
