import json
from datetime import datetime
from backend.database import SessionLocal, init_db
from backend.models import (
    User,
    UserRole,
    Bounty,
    BountyStatus,
    Finding,
    FindingSeverity,
    FindingStatus,
    Validation,
    ValidationDecision,
    Reward,
    RewardStatus,
    AIAnalysis,
    Verification
)


def seed_database():
    init_db()
    db = SessionLocal()

    try:
        print("Checking/seeding users...")
        # 1. Users
        owner = db.query(User).filter(User.id == "user-owner").first()
        if not owner:
            owner = User(
                id="user-owner",
                wallet_address="0x9A3B561234F07B12CDE45678901234567890ABCD",
                display_name="Apex Security Labs",
                role=UserRole.MODEL_OWNER
            )
            db.add(owner)

        researcher = db.query(User).filter(User.id == "user-researcher").first()
        if not researcher:
            researcher = User(
                id="user-researcher",
                wallet_address="0x7A29f3d9b4b029B9057B362F11397858c70491F2",
                display_name="0x7A...91F2",
                role=UserRole.RESEARCHER
            )
            db.add(researcher)

        validator = db.query(User).filter(User.id == "user-validator").first()
        if not validator:
            validator = User(
                id="user-validator",
                wallet_address="0x5C6D7E8F901234567890ABCDEF12345678905C6D",
                display_name="Consensus Validator 01",
                role=UserRole.VALIDATOR
            )
            db.add(validator)

        db.commit()

        print("Checking/seeding bounties...")
        # 2. Bounties
        bounties_data = [
            {
                "id": "fraud-detect-v1",
                "title": "FraudDetect V1",
                "model_name": "FraudDetect V1",
                "model_version": "1.0.0",
                "category": "Fraud Detection",
                "reward": "0.50 ETH",
                "status": BountyStatus.ACTIVE,
                "owner_id": "user-owner",
                "description": "A machine learning model designed to identify potentially fraudulent financial transactions under high-frequency load.",
                "expected_behavior": "The model should correctly identify suspicious financial transactions while maintaining under 0.05% false positives on legitimate transaction sequences.",
                "testing_requirements": "Test unexpected transaction amounts; look for inconsistent behavior under micro-transfers; test edge-case geographic boundaries."
            },
            {
                "id": "health-risk-classifier",
                "title": "HealthRisk Classifier",
                "model_name": "HealthRisk Classifier",
                "model_version": "2.1.0",
                "category": "Healthcare ML",
                "reward": "0.35 ETH",
                "status": BountyStatus.ACTIVE,
                "owner_id": "user-owner",
                "description": "A machine learning classifier designed to estimate patient health-risk categories from clinical feature profiles.",
                "expected_behavior": "The model should produce smooth, consistent prediction probabilities when small, valid variations are introduced in patient vitals.",
                "testing_requirements": "Test small variations in vitals (blood pressure, glucose); look for step-function jumps; test boundary features."
            },
            {
                "id": "support-intent-ai",
                "title": "SupportIntent AI",
                "model_name": "SupportIntent AI",
                "model_version": "1.4.0",
                "category": "NLP",
                "reward": "0.20 ETH",
                "status": BountyStatus.ACTIVE,
                "owner_id": "user-owner",
                "description": "An NLP model designed to classify customer support messages into predefined intents.",
                "expected_behavior": "The model should assign customer messages to the correct support intent, including ambiguous or polite phrasing.",
                "testing_requirements": "Test ambiguous customer messages; test variations in phrasing; check inconsistent intent classification."
            },
        ]

        for b_data in bounties_data:
            existing_bounty = db.query(Bounty).filter(Bounty.id == b_data["id"]).first()
            if not existing_bounty:
                db.add(Bounty(**b_data))

        db.commit()

        print("Checking/seeding findings...")
        # 3. Findings
        findings_data = [
            {
                "id": "finding-pending-01",
                "bounty_id": "fraud-detect-v1",
                "researcher_id": "user-researcher",
                "finding_title": "Adversarial high micro-transfer rate bypasses threshold",
                "severity": FindingSeverity.HIGH,
                "what_happened": "Rapid sequences of sub-dollar transfers bypass the anomaly detection window, evading the aggregate fraud threshold.",
                "evidence": "Payload: 15 transactions of $0.99 within 800ms. Model prediction: 0.02 (Legitimate). Expected: > 0.85 (Suspicious).",
                "reproduction_steps": "1. Send burst of 15 micro-transactions.\n2. Inspect classification confidence.\n3. Observe evasion.",
                "expected_behavior": "Aggregated micro-transfers must trigger velocity fraud alert.",
                "actual_behavior": "Treated as independent normal transactions.",
                "status": FindingStatus.PENDING,
                "reward": "0.50 ETH"
            },
            {
                "id": "finding-approved-01",
                "bounty_id": "fraud-detect-v1",
                "researcher_id": "user-researcher",
                "finding_title": "Fraudulent transaction missed under unusual amount pattern",
                "severity": FindingSeverity.HIGH,
                "what_happened": "The model classified a high-value outlier transaction as legitimate even though amount was 100x user historical average.",
                "evidence": "Payload: $98,500.00 transfer from newly authenticated IP. Return: Legitimate.",
                "reproduction_steps": "1. Submit high-value outlier transaction.\n2. Observe false negative label.",
                "expected_behavior": "Flag as potential account takeover.",
                "actual_behavior": "Classified legitimate without stepped-up auth.",
                "status": FindingStatus.APPROVED,
                "reward": "0.50 ETH"
            },
            {
                "id": "finding-rejected-01",
                "bounty_id": "support-intent-ai",
                "researcher_id": "user-researcher",
                "finding_title": "Out-of-scope non-standard character encoding crash",
                "severity": FindingSeverity.LOW,
                "what_happened": "Submitting raw binary payloads into text API returned HTTP 400 Bad Request.",
                "evidence": "Raw byte string sent over text endpoint.",
                "reproduction_steps": "1. Send non-UTF8 payload.\n2. Observe 400 response.",
                "expected_behavior": "Graceful JSON validation.",
                "actual_behavior": "HTTP 400 returned, which is documented expected API gateway behavior.",
                "status": FindingStatus.REJECTED,
                "reward": "0.20 ETH"
            },
            {
                "id": "submission-001",
                "bounty_id": "fraud-detect-v1",
                "researcher_id": "user-researcher",
                "finding_title": "Fraudulent transaction missed under unusual amount pattern",
                "severity": FindingSeverity.HIGH,
                "what_happened": "The FraudDetect V1 model classified a transaction as legitimate even though the transaction contained an unusually high amount pattern that should have triggered fraud detection.",
                "evidence": "A test transaction with an unusually high transaction amount was provided to the model. The model returned a legitimate classification ($98,500.00).",
                "reproduction_steps": "1. Prepare a transaction containing an unusually high transaction amount.\n2. Submit the transaction to FraudDetect V1.\n3. Record the model prediction.\n4. Observe that the model classifies the transaction as legitimate.",
                "expected_behavior": "The model should correctly identify suspicious financial transactions while avoiding false positives on legitimate transactions.",
                "actual_behavior": "Classified as legitimate with 0.082 fraud probability.",
                "status": FindingStatus.APPROVED,
                "reward": "0.50 ETH"
            },
            {
                "id": "submission-002",
                "bounty_id": "health-risk-classifier",
                "researcher_id": "user-researcher",
                "finding_title": "Prediction changes unexpectedly after minor input variation",
                "severity": FindingSeverity.CRITICAL,
                "what_happened": "Prediction changes unexpectedly after minor input variation on borderline patient vitals.",
                "evidence": "Vital metrics: BP 120/80 -> 121/80 resulted in disproportionate risk spike from 0.12 to 0.89.",
                "reproduction_steps": "1. Input baseline vitals.\n2. Nudge systolic by +1 unit.\n3. Observe abrupt risk class flip.",
                "expected_behavior": "The model should produce consistent predictions when similar valid inputs are provided.",
                "actual_behavior": "Sharp discontinuous step jump at classification boundary.",
                "status": FindingStatus.REJECTED,
                "reward": "0.00 ETH"
            },
            {
                "id": "submission-003",
                "bounty_id": "support-intent-ai",
                "researcher_id": "user-researcher",
                "finding_title": "Intent classification fails on ambiguous customer messages",
                "severity": FindingSeverity.MEDIUM,
                "what_happened": "Intent classification fails on ambiguous customer messages combining polite greetings with subscription cancellation requests.",
                "evidence": "Customer input: 'Thanks for yesterday, but I urgently need to terminate my subscription.' Classified as 'GENERAL_INQUIRY' instead of 'CANCELLATION'.",
                "reproduction_steps": "1. Send polite opening message with cancellation directive.\n2. Observe misclassification into general feedback queue.",
                "expected_behavior": "The model should assign customer messages to the correct support intent, including ambiguous messages.",
                "actual_behavior": "Misclassified as general inquiry with low confidence.",
                "status": FindingStatus.PENDING,
                "reward": "0.20 ETH"
            }
        ]

        for f_data in findings_data:
            existing_finding = db.query(Finding).filter(Finding.id == f_data["id"]).first()
            if not existing_finding:
                finding_obj = Finding(**f_data)
                db.add(finding_obj)
                db.commit()

                # Add validation and reward for approved
                if f_data["status"] == FindingStatus.APPROVED:
                    val = Validation(
                        id=f"val-{f_data['id']}",
                        finding_id=f_data["id"],
                        validator_id="user-validator",
                        decision=ValidationDecision.APPROVED,
                        comment="Reproduced deterministically in isolated sandbox. Severe evasion confirmed."
                    )
                    db.add(val)
                    rew = Reward(
                        id=f"rew-{f_data['id']}",
                        finding_id=f_data["id"],
                        recipient_id=f_data["researcher_id"],
                        amount=f_data["reward"],
                        currency="ETH",
                        status=RewardStatus.PENDING,
                        transaction_hash=None
                    )
                    db.add(rew)

                # Add validation for rejected
                elif f_data["status"] == FindingStatus.REJECTED:
                    val = Validation(
                        id=f"val-{f_data['id']}",
                        finding_id=f_data["id"],
                        validator_id="user-validator",
                        decision=ValidationDecision.REJECTED,
                        comment="Invalid report. HTTP 400 or documented boundary behavior is expected."
                    )
                    db.add(val)

        db.commit()

        # Seed AI Analyses & ML Verifications for findings
        print("Checking/seeding AI analyses & ML verifications...")
        analyses_data = [
            {
                "finding_id": "submission-003",
                "confidence": 0.88,
                "result": {
                    "severity": "MEDIUM",
                    "confidence": 0.88,
                    "classification": "Adversarial Phrasing / Intent Ambiguity Vulnerability",
                    "summary": "Customer messages containing compound polite phrasing and cancellation intent misroute to General Feedback instead of Subscription Cancellation workflow.",
                    "reasoning": "The NLP attention weights are heavily influenced by introductory pleasantries ('Thank you for your help earlier'), causing the classifier to score the message as conversational feedback rather than actionable churn intent. This is reproducible and violates the expected support routing specification.",
                    "potential_impact": "Subscribers attempting cancellation are delayed or ignored, causing severe customer churn friction, dispute chargebacks, and compliance violations.",
                    "evidence_assessment": "The researcher provided the exact test prompt and reproducible token classification weights showing 59% misclassification margin.",
                    "reproduction_assessment": "Reproduced deterministically in the NLP staging environment.",
                    "recommended_validation_checks": [
                        "Verify classifier logits on polite prefaces combined with cancellation keywords.",
                        "Benchmark multi-intent threshold gating on support datasets.",
                        "Evaluate attention head activations on sentiment versus action verbs."
                    ]
                }
            },
            {
                "finding_id": "submission-001",
                "confidence": 0.94,
                "result": {
                    "severity": "HIGH",
                    "confidence": 0.94,
                    "classification": "Threshold Boundary Evasion Vulnerability",
                    "summary": "High-value transaction ($98,500.00) from anomalous IP address bypassed fraud threshold due to missing velocity normalization.",
                    "reasoning": "The Random Forest decision paths in FraudDetect V1 fail to activate fraud alert node when the transaction amount is an extreme outlier if the device_risk_score is within nominal bounds. The researcher's proof of concept demonstrates a legitimate classification on an anomalous payload.",
                    "potential_impact": "High-capital unauthorized asset draining from compromised enterprise accounts.",
                    "evidence_assessment": "Concrete verifiable reproduction trace provided with raw inference payload.",
                    "reproduction_assessment": "Verified against live scikit-learn model in 1.4ms.",
                    "recommended_validation_checks": [
                        "Test extreme outliers (>$50,000) with various device risk permutations.",
                        "Verify tree split depths on amount vs device_risk_score features."
                    ]
                }
            },
            {
                "finding_id": "finding-pending-01",
                "confidence": 0.91,
                "result": {
                    "severity": "HIGH",
                    "confidence": 0.91,
                    "classification": "Velocity Micro-Transfer Evasion",
                    "summary": "Burst of sub-dollar transfers evades aggregate window threshold due to missing millisecond-window aggregation.",
                    "reasoning": "Rapid sequences of 15 micro-transactions ($0.99 within 800ms) bypass sliding window detection.",
                    "potential_impact": "Distributed card testing and velocity draining without alerting operations.",
                    "evidence_assessment": "Raw packet trace and model output log included in submission.",
                    "reproduction_assessment": "Confirmed in local ML engine test harness.",
                    "recommended_validation_checks": [
                        "Stress test sliding window aggregation under sub-second bursts.",
                        "Validate token bucket rate limiting on inference endpoint."
                    ]
                }
            }
        ]

        for a_data in analyses_data:
            existing_ai = db.query(AIAnalysis).filter(AIAnalysis.finding_id == a_data["finding_id"]).first()
            if not existing_ai:
                ai_rec = AIAnalysis(
                    id=f"ai-{a_data['finding_id']}",
                    finding_id=a_data["finding_id"],
                    provider="groq",
                    model="qwen/qwen3.8-27b",
                    analysis_type="finding_analysis",
                    confidence=a_data["confidence"],
                    result=json.dumps(a_data["result"]),
                    created_at=datetime.utcnow()
                )
                db.add(ai_rec)

        verifications_data = [
            {
                "finding_id": "submission-003",
                "model_id": "support-intent-ai",
                "model_name": "SupportIntent AI",
                "prediction": "GENERAL_INQUIRY (MISROUTED)",
                "prediction_value": 1.0,
                "fraud_probability": 0.74,
                "execution_time_ms": 14.6,
                "verification_status": "REPRODUCED",
                "reproduced": 1.0,
                "input_data": json.dumps({"message": "Thanks for yesterday, but I urgently need to terminate my subscription."})
            },
            {
                "finding_id": "submission-001",
                "model_id": "fraud-detect-v1",
                "model_name": "FraudDetect V1",
                "prediction": "LEGITIMATE",
                "prediction_value": 0.0,
                "fraud_probability": 0.082,
                "execution_time_ms": 1.42,
                "verification_status": "REPRODUCED",
                "reproduced": 1.0,
                "input_data": json.dumps({"amount": 98500.0, "frequency_24h": 1, "ip_risk_score": 0.92, "device_risk_score": 0.12})
            },
            {
                "finding_id": "finding-pending-01",
                "model_id": "fraud-detect-v1",
                "model_name": "FraudDetect V1",
                "prediction": "LEGITIMATE",
                "prediction_value": 0.0,
                "fraud_probability": 0.02,
                "execution_time_ms": 1.35,
                "verification_status": "REPRODUCED",
                "reproduced": 1.0,
                "input_data": json.dumps({"amount": 0.99, "frequency_24h": 15, "ip_risk_score": 0.05, "device_risk_score": 0.05})
            }
        ]

        for v_data in verifications_data:
            existing_ver = db.query(Verification).filter(Verification.finding_id == v_data["finding_id"]).first()
            if not existing_ver:
                ver_rec = Verification(
                    id=f"ver-{v_data['finding_id']}",
                    finding_id=v_data["finding_id"],
                    model_id=v_data["model_id"],
                    model_name=v_data["model_name"],
                    prediction=v_data["prediction"],
                    prediction_value=v_data["prediction_value"],
                    fraud_probability=v_data["fraud_probability"],
                    execution_time_ms=v_data["execution_time_ms"],
                    verification_status=v_data["verification_status"],
                    reproduced=v_data["reproduced"],
                    input_data=v_data["input_data"],
                    created_at=datetime.utcnow()
                )
                db.add(ver_rec)

        db.commit()
        print("Database seeded successfully and idempotently.")
    finally:
        db.close()


if __name__ == "__main__":
    seed_database()
