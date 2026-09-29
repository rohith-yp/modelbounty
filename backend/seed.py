"""Idempotent database seeder for ModelBounty development."""
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
    RewardStatus
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
                "reproduction_steps": "1. Send burst of 15 micro-transactions.\\n2. Inspect classification confidence.\\n3. Observe evasion.",
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
                "reproduction_steps": "1. Submit high-value outlier transaction.\\n2. Observe false negative label.",
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
                "reproduction_steps": "1. Send non-UTF8 payload.\\n2. Observe 400 response.",
                "expected_behavior": "Graceful JSON validation.",
                "actual_behavior": "HTTP 400 returned, which is documented expected API gateway behavior.",
                "status": FindingStatus.REJECTED,
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
                        id="val-approved-01",
                        finding_id=f_data["id"],
                        validator_id="user-validator",
                        decision=ValidationDecision.APPROVED,
                        comment="Reproduced deterministically in isolated sandbox. Severe evasion confirmed."
                    )
                    db.add(val)
                    rew = Reward(
                        id="rew-approved-01",
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
                        id="val-rejected-01",
                        finding_id=f_data["id"],
                        validator_id="user-validator",
                        decision=ValidationDecision.REJECTED,
                        comment="Invalid report. HTTP 400 on binary input is normal API validation behavior."
                    )
                    db.add(val)

        db.commit()
        print("Database seeded successfully and idempotently.")
    finally:
        db.close()


if __name__ == "__main__":
    seed_database()
