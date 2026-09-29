"""
ModelBounty AI Analysis Engine.
Orchestrates finding context retrieval, prompt construction, Groq LLM invocation,
structured response validation, and database persistence in AIAnalysis.
"""

import json
import re
from datetime import datetime
from typing import Dict, Any, Optional, List
from sqlalchemy.orm import Session

from backend.models import Finding, Bounty, AIAnalysis
from backend.ai.prompts import SYSTEM_PROMPT, format_analysis_user_prompt
from backend.ai.llm_provider import (
    get_llm_provider,
    BaseLLMProvider,
    LLMNotConfiguredError,
    LLMMalformedOutputError
)


class FindingNotFoundError(Exception):
    """Raised when the specified finding ID does not exist in the database."""
    pass


class AIEngine:
    def __init__(self):
        self._provider: Optional[BaseLLMProvider] = None

    @property
    def provider(self) -> BaseLLMProvider:
        # Re-instantiate/get provider to pick up any runtime environment changes
        return get_llm_provider()

    def get_status(self) -> Dict[str, Any]:
        """Return the current AI provider configuration status without revealing secrets."""
        prov = self.provider
        if prov.is_configured():
            return {
                "status": "configured",
                "provider": prov.name,
                "model": prov.get_model()
            }
        return {
            "status": "not_configured",
            "provider": prov.name
        }

    def parse_and_validate_response(self, raw_text: str) -> Dict[str, Any]:
        """
        Parse raw LLM response, perform safe cleanup if wrapped in markdown,
        and validate against the required ModelBounty structured schema.
        """
        if not raw_text or not raw_text.strip():
            raise LLMMalformedOutputError("AI provider returned empty content")

        cleaned = raw_text.strip()
        # Strip markdown code blocks if present
        if cleaned.startswith("```"):
            cleaned = re.sub(r"^```(?:json)?\s*", "", cleaned)
            cleaned = re.sub(r"\s*```$", "", cleaned)
            cleaned = cleaned.strip()

        # Parse JSON
        try:
            data = json.loads(cleaned)
        except json.JSONDecodeError as err:
            # Attempt to extract JSON substring between first { and last }
            match = re.search(r"(\{.*\})", cleaned, re.DOTALL)
            if match:
                try:
                    data = json.loads(match.group(1))
                except json.JSONDecodeError:
                    raise LLMMalformedOutputError(f"Failed to parse JSON from AI response: {err}") from None
            else:
                raise LLMMalformedOutputError(f"AI response is not valid JSON: {err}") from None

        if not isinstance(data, dict):
            raise LLMMalformedOutputError("AI response JSON root must be an object")

        # Required fields validation
        # 1. severity
        raw_sev = str(data.get("severity", "")).strip().upper()
        valid_severities = {"LOW", "MEDIUM", "HIGH", "CRITICAL"}
        if raw_sev not in valid_severities:
            raise LLMMalformedOutputError(
                f"Invalid severity '{raw_sev}'. Must be one of {sorted(valid_severities)}"
            )
        data["severity"] = raw_sev

        # 2. confidence: numeric between 0.0 and 1.0
        raw_conf = data.get("confidence")
        if raw_conf is None or not isinstance(raw_conf, (int, float)):
            raise LLMMalformedOutputError("Confidence must be a numeric value")
        conf_float = float(raw_conf)
        if not (0.0 <= conf_float <= 1.0):
            raise LLMMalformedOutputError(
                f"Confidence value {conf_float} out of range; must be between 0.0 and 1.0"
            )
        data["confidence"] = round(conf_float, 4)

        # 3. Text fields validation
        for field in [
            "classification",
            "summary",
            "reasoning",
            "potential_impact",
            "evidence_assessment",
            "reproduction_assessment"
        ]:
            val = data.get(field)
            if not val or not str(val).strip():
                raise LLMMalformedOutputError(f"Missing or empty required field: '{field}'")
            data[field] = str(val).strip()

        # 4. recommended_validation_checks: must be a list
        checks = data.get("recommended_validation_checks")
        if checks is None:
            data["recommended_validation_checks"] = []
        elif not isinstance(checks, list):
            raise LLMMalformedOutputError("'recommended_validation_checks' must be a list of strings")
        else:
            data["recommended_validation_checks"] = [str(c).strip() for c in checks if str(c).strip()]

        return data

    def analyze_finding(self, db: Session, finding_id: str) -> AIAnalysis:
        """
        Execute finding analysis using the active Groq provider:
        1. Validate finding ID.
        2. Retrieve finding and associated bounty.
        3. Construct prompt.
        4. Call Groq through GroqProvider.
        5. Parse and validate structured output.
        6. Store in AIAnalysis table.
        7. Return stored record without altering finding status or rewards.
        """
        # 1. Retrieve finding
        finding = db.query(Finding).filter(Finding.id == finding_id).first()
        if not finding:
            raise FindingNotFoundError(f"Finding '{finding_id}' not found")

        # 2. Check provider readiness
        prov = self.provider
        if not prov.is_configured():
            raise LLMNotConfiguredError("AI analysis provider (Groq) is not configured")

        # 3. Retrieve bounty
        bounty = finding.bounty
        if not bounty and finding.bounty_id:
            bounty = db.query(Bounty).filter(Bounty.id == finding.bounty_id).first()

        finding_dict = {
            "finding_title": finding.finding_title or "",
            "severity": finding.severity.value if hasattr(finding.severity, "value") else str(finding.severity or "UNKNOWN"),
            "what_happened": finding.what_happened or "",
            "expected_behavior": finding.expected_behavior or "",
            "actual_behavior": finding.actual_behavior or "",
            "evidence": finding.evidence or "",
            "reproduction_steps": finding.reproduction_steps or ""
        }

        bounty_dict = {
            "title": bounty.title if bounty else "N/A",
            "model_name": bounty.model_name if bounty else "N/A",
            "model_version": bounty.model_version if bounty else "N/A",
            "category": bounty.category if bounty else "N/A",
            "description": bounty.description if bounty else "N/A",
            "expected_behavior": bounty.expected_behavior if bounty else "N/A",
            "testing_requirements": bounty.testing_requirements if bounty else "N/A"
        }

        # 4. Construct messages
        user_prompt = format_analysis_user_prompt(finding_dict, bounty_dict)
        messages = [
            {"role": "system", "content": SYSTEM_PROMPT},
            {"role": "user", "content": user_prompt}
        ]

        # 5. Call Groq
        raw_completion = prov.generate_chat_completion(
            messages=messages,
            temperature=0.1,
            max_tokens=2048,
            json_mode=True
        )

        # 6. Parse and validate structured JSON
        validated_analysis = self.parse_and_validate_response(raw_completion)

        # 7. Store in database
        analysis_record = AIAnalysis(
            finding_id=finding.id,
            provider=prov.name,
            model=prov.get_model(),
            analysis_type="finding_analysis",
            result=json.dumps(validated_analysis),
            confidence=validated_analysis["confidence"],
            created_at=datetime.utcnow()
        )
        db.add(analysis_record)
        db.commit()
        db.refresh(analysis_record)

        # CRITICAL INVARIANT: finding.status and finding.severity remain untouched!
        return analysis_record

    def get_latest_analysis(self, db: Session, finding_id: str) -> Optional[AIAnalysis]:
        """Retrieve the most recent AIAnalysis for a finding."""
        return (
            db.query(AIAnalysis)
            .filter(AIAnalysis.finding_id == finding_id)
            .order_by(AIAnalysis.created_at.desc())
            .first()
        )

    def get_analysis_history(self, db: Session, finding_id: str) -> List[AIAnalysis]:
        """Retrieve all historical AIAnalysis records for a finding in chronological order."""
        return (
            db.query(AIAnalysis)
            .filter(AIAnalysis.finding_id == finding_id)
            .order_by(AIAnalysis.created_at.desc())
            .all()
        )


ai_engine = AIEngine()
