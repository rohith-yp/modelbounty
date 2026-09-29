from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.orm import Session
from sqlalchemy import text

from backend.database import get_db
from backend.models import BountyStatus, FindingStatus, FindingSeverity, RewardStatus
from backend.schemas import (
    UserCreate,
    UserResponse,
    BountyCreate,
    BountyUpdate,
    BountyResponse,
    FindingCreate,
    FindingUpdate,
    FindingResponse,
    ValidationCreate,
    ValidationResponse,
    RewardResponse,
    DashboardStats,
    IntegrationStatus,
    HealthResponse,
    AIAnalysisResponse,
)
from backend.services import (
    user_service,
    bounty_service,
    finding_service,
    validation_service,
    reward_service,
    dashboard_service,
    ai_service,
    ml_service,
    blockchain_service
)

api_router = APIRouter(prefix="/api")


# --- Health & Integrations ---
@api_router.get("/health", response_model=HealthResponse)
def api_health():
    return {"status": "ok"}


@api_router.get("/integrations/status", response_model=IntegrationStatus)
def integration_status(db: Session = Depends(get_db)):
    db_status = "connected"
    try:
        db.execute(text("SELECT 1"))
    except Exception:
        db_status = "error"

    return {
        "database": db_status,
        "llm": ai_service.AIService.get_status(),
        "ml": ml_service.MLService.get_status(),
        "blockchain": blockchain_service.BlockchainService.get_status()
    }


# --- Dashboard ---
@api_router.get("/dashboard/stats", response_model=DashboardStats)
def get_dashboard_stats(db: Session = Depends(get_db)):
    return dashboard_service.calculate_dashboard_stats(db)


# --- Users ---
@api_router.get("/users", response_model=List[UserResponse])
def list_users(skip: int = 0, limit: int = 100, db: Session = Depends(get_db)):
    return user_service.get_users(db, skip=skip, limit=limit)


@api_router.post("/users", response_model=UserResponse, status_code=status.HTTP_201_CREATED)
def create_user(user_in: UserCreate, db: Session = Depends(get_db)):
    return user_service.create_user(db, user_in)


@api_router.get("/users/{user_id}", response_model=UserResponse)
def get_user_detail(user_id: str, db: Session = Depends(get_db)):
    user = user_service.get_user(db, user_id)
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    return user


@api_router.get("/users/{user_id}/findings", response_model=List[FindingResponse])
def get_user_findings(user_id: str, db: Session = Depends(get_db)):
    findings = finding_service.get_researcher_findings(db, user_id)
    res = []
    for f in findings:
        resp = FindingResponse.model_validate(f)
        resp.bounty_title = f.bounty.title if f.bounty else None
        resp.model_name = f.bounty.model_name if f.bounty else None
        resp.researcher_name = f.researcher.display_name if f.researcher else None
        res.append(resp)
    return res


@api_router.get("/users/{user_id}/bounties", response_model=List[BountyResponse])
def get_user_bounties(user_id: str, db: Session = Depends(get_db)):
    bounties = bounty_service.get_owner_bounties(db, user_id)
    res = []
    for b in bounties:
        resp = BountyResponse.model_validate(b)
        resp.finding_count = len(b.findings)
        res.append(resp)
    return res


# --- Bounties ---
@api_router.get("/bounties", response_model=List[BountyResponse])
def list_bounties(
    status: Optional[BountyStatus] = None,
    category: Optional[str] = None,
    owner_id: Optional[str] = None,
    db: Session = Depends(get_db)
):
    bounties = bounty_service.get_bounties(
        db, status_filter=status, category=category, owner_id=owner_id
    )
    res = []
    for b in bounties:
        resp = BountyResponse.model_validate(b)
        resp.finding_count = len(b.findings)
        res.append(resp)
    return res


@api_router.get("/bounties/{bounty_id}", response_model=BountyResponse)
def get_bounty(bounty_id: str, db: Session = Depends(get_db)):
    bounty = bounty_service.get_bounty(db, bounty_id)
    if not bounty:
        raise HTTPException(status_code=404, detail="Bounty not found")
    resp = BountyResponse.model_validate(bounty)
    resp.finding_count = len(bounty.findings)
    return resp


@api_router.post("/bounties", response_model=BountyResponse, status_code=status.HTTP_201_CREATED)
def create_bounty(bounty_in: BountyCreate, db: Session = Depends(get_db)):
    bounty = bounty_service.create_bounty(db, bounty_in)
    resp = BountyResponse.model_validate(bounty)
    resp.finding_count = 0
    return resp


@api_router.patch("/bounties/{bounty_id}", response_model=BountyResponse)
def update_bounty(bounty_id: str, bounty_in: BountyUpdate, db: Session = Depends(get_db)):
    bounty = bounty_service.update_bounty(db, bounty_id, bounty_in)
    resp = BountyResponse.model_validate(bounty)
    resp.finding_count = len(bounty.findings)
    return resp


@api_router.delete("/bounties/{bounty_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_bounty(bounty_id: str, db: Session = Depends(get_db)):
    bounty_service.delete_bounty(db, bounty_id)
    return None


# --- Findings ---
@api_router.get("/findings", response_model=List[FindingResponse])
def list_findings(
    status: Optional[FindingStatus] = None,
    bounty_id: Optional[str] = None,
    researcher_id: Optional[str] = None,
    severity: Optional[FindingSeverity] = None,
    db: Session = Depends(get_db)
):
    findings = finding_service.get_findings(
        db, status_filter=status, bounty_id=bounty_id, researcher_id=researcher_id, severity=severity
    )
    res = []
    for f in findings:
        resp = FindingResponse.model_validate(f)
        resp.bounty_title = f.bounty.title if f.bounty else None
        resp.model_name = f.bounty.model_name if f.bounty else None
        resp.researcher_name = f.researcher.display_name if f.researcher else None
        res.append(resp)
    return res


@api_router.get("/findings/{finding_id}", response_model=FindingResponse)
def get_finding(finding_id: str, db: Session = Depends(get_db)):
    finding = finding_service.get_finding(db, finding_id)
    if not finding:
        raise HTTPException(status_code=404, detail="Finding not found")
    resp = FindingResponse.model_validate(finding)
    resp.bounty_title = finding.bounty.title if finding.bounty else None
    resp.model_name = finding.bounty.model_name if finding.bounty else None
    resp.researcher_name = finding.researcher.display_name if finding.researcher else None
    return resp


@api_router.post("/findings", response_model=FindingResponse, status_code=status.HTTP_201_CREATED)
def submit_finding(finding_in: FindingCreate, db: Session = Depends(get_db)):
    finding = finding_service.create_finding(db, finding_in)
    resp = FindingResponse.model_validate(finding)
    resp.bounty_title = finding.bounty.title if finding.bounty else None
    resp.model_name = finding.bounty.model_name if finding.bounty else None
    resp.researcher_name = finding.researcher.display_name if finding.researcher else None
    return resp


@api_router.patch("/findings/{finding_id}", response_model=FindingResponse)
def update_finding(finding_id: str, finding_in: FindingUpdate, db: Session = Depends(get_db)):
    finding = finding_service.update_finding(db, finding_id, finding_in)
    resp = FindingResponse.model_validate(finding)
    resp.bounty_title = finding.bounty.title if finding.bounty else None
    resp.model_name = finding.bounty.model_name if finding.bounty else None
    resp.researcher_name = finding.researcher.display_name if finding.researcher else None
    return resp


@api_router.post("/findings/{finding_id}/approve", response_model=FindingResponse)
def approve_finding_endpoint(
    finding_id: str,
    validation_in: ValidationCreate,
    db: Session = Depends(get_db)
):
    finding = validation_service.approve_finding(
        db,
        finding_id=finding_id,
        validator_id=validation_in.validator_id,
        comment=validation_in.comment
    )
    resp = FindingResponse.model_validate(finding)
    resp.bounty_title = finding.bounty.title if finding.bounty else None
    resp.model_name = finding.bounty.model_name if finding.bounty else None
    resp.researcher_name = finding.researcher.display_name if finding.researcher else None
    return resp


@api_router.post("/findings/{finding_id}/reject", response_model=FindingResponse)
def reject_finding_endpoint(
    finding_id: str,
    validation_in: ValidationCreate,
    db: Session = Depends(get_db)
):
    finding = validation_service.reject_finding(
        db,
        finding_id=finding_id,
        validator_id=validation_in.validator_id,
        comment=validation_in.comment
    )
    resp = FindingResponse.model_validate(finding)
    resp.bounty_title = finding.bounty.title if finding.bounty else None
    resp.model_name = finding.bounty.model_name if finding.bounty else None
    resp.researcher_name = finding.researcher.display_name if finding.researcher else None
    return resp


# --- Validations ---
@api_router.get("/validations", response_model=List[ValidationResponse])
def list_validations(finding_id: Optional[str] = None, db: Session = Depends(get_db)):
    if finding_id:
        return validation_service.get_validations_for_finding(db, finding_id)
    from backend.models import Validation
    return db.query(Validation).order_by(Validation.created_at.desc()).all()


# --- Rewards ---
@api_router.get("/rewards", response_model=List[RewardResponse])
def list_rewards(status: Optional[RewardStatus] = None, db: Session = Depends(get_db)):
    return reward_service.get_rewards(db, status_filter=status)


# --- AI Endpoints ---
@api_router.get("/ai/status")
def ai_status():
    from backend.config import settings
    return {
        "status": "configured" if settings.GROQ_API_KEY else "not_configured",
        "provider": "groq",
        "model": getattr(settings, "GROQ_MODEL", "qwen/qwen3.8-27b"),
    }


@api_router.get("/findings/{finding_id}/ai-analysis")
def get_ai_analysis_endpoint(
    finding_id: str,
    history: bool = Query(False),
    db: Session = Depends(get_db),
):
    from backend.models import Finding, AIAnalysis
    finding = db.query(Finding).filter(Finding.id == finding_id).first()
    if not finding:
        raise HTTPException(status_code=404, detail=f"Finding '{finding_id}' not found")

    if history:
        analyses = (
            db.query(AIAnalysis)
            .filter(AIAnalysis.finding_id == finding_id)
            .order_by(AIAnalysis.created_at.asc())
            .all()
        )
        return analyses

    analysis = (
        db.query(AIAnalysis)
        .filter(AIAnalysis.finding_id == finding_id)
        .order_by(AIAnalysis.created_at.desc())
        .first()
    )
    if not analysis:
        raise HTTPException(
            status_code=404,
            detail=f"No AI analysis found for finding '{finding_id}'",
        )

    import json
    parsed_analysis = None
    try:
        parsed_analysis = json.loads(analysis.result)
    except Exception:
        pass

    return {
        "id": analysis.id,
        "finding_id": analysis.finding_id,
        "provider": analysis.provider,
        "model": analysis.model,
        "analysis_type": analysis.analysis_type,
        "result": analysis.result,
        "confidence": analysis.confidence,
        "created_at": analysis.created_at.isoformat() if hasattr(analysis.created_at, "isoformat") else str(analysis.created_at),
        "analysis": parsed_analysis,
    }


@api_router.post("/findings/{finding_id}/ai-analysis")
def run_ai_analysis_endpoint(
    finding_id: str,
    db: Session = Depends(get_db),
):
    from backend.models import Finding
    from backend.services.ai_service import AIService
    finding = db.query(Finding).filter(Finding.id == finding_id).first()
    if not finding:
        raise HTTPException(status_code=404, detail=f"Finding '{finding_id}' not found")

    try:
        analysis_record = AIService.analyze_finding(db, finding_id)
    except Exception as exc:
        msg = str(exc)
        if "rate limit" in msg.lower():
            raise HTTPException(status_code=429, detail="Groq AI rate limit reached.")
        if "configured" in msg.lower():
            raise HTTPException(status_code=503, detail="Groq AI is not configured.")
        raise HTTPException(status_code=502, detail="Groq AI service error.")

    import json
    parsed_analysis = None
    try:
        parsed_analysis = json.loads(analysis_record.result)
    except Exception:
        pass

    return {
        "id": analysis_record.id,
        "finding_id": analysis_record.finding_id,
        "provider": analysis_record.provider,
        "model": analysis_record.model,
        "analysis_type": analysis_record.analysis_type,
        "result": analysis_record.result,
        "confidence": analysis_record.confidence,
        "created_at": analysis_record.created_at.isoformat() if hasattr(analysis_record.created_at, "isoformat") else str(analysis_record.created_at),
        "analysis": parsed_analysis,
    }
