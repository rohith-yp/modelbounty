import re
from sqlalchemy.orm import Session
from backend.models import Bounty, BountyStatus, Finding, FindingStatus, Reward, RewardStatus
from backend.schemas import DashboardStats


def calculate_dashboard_stats(db: Session) -> DashboardStats:
    total_bounties = db.query(Bounty).count()
    active_bounties = db.query(Bounty).filter(Bounty.status == BountyStatus.ACTIVE).count()

    total_findings = db.query(Finding).count()
    pending_findings = db.query(Finding).filter(Finding.status == FindingStatus.PENDING).count()
    approved_findings = db.query(Finding).filter(Finding.status == FindingStatus.APPROVED).count()
    rejected_findings = db.query(Finding).filter(Finding.status == FindingStatus.REJECTED).count()

    # Calculate total rewards from all bounties
    total_eth = 0.0
    for bounty in db.query(Bounty).all():
        match = re.search(r"([0-9]+(?:\.[0-9]+)?)", bounty.reward or "")
        if match:
            try:
                total_eth += float(match.group(1))
            except ValueError:
                pass

    # Calculate distributed rewards from distributed / approved rewards
    distributed_eth = 0.0
    for reward in db.query(Reward).filter(Reward.status.in_([RewardStatus.DISTRIBUTED, RewardStatus.PENDING])).all():
        match = re.search(r"([0-9]+(?:\.[0-9]+)?)", reward.amount or "")
        if match:
            try:
                distributed_eth += float(match.group(1))
            except ValueError:
                pass

    # Verification rate = approved / (approved + rejected)
    decided_findings = approved_findings + rejected_findings
    if decided_findings > 0:
        rate = round((approved_findings / decided_findings) * 100)
        verification_rate = f"{rate}%"
    else:
        verification_rate = "0%"

    return DashboardStats(
        active_bounties=active_bounties,
        total_bounties=total_bounties,
        total_findings=total_findings,
        pending_findings=pending_findings,
        approved_findings=approved_findings,
        rejected_findings=rejected_findings,
        total_rewards=f"{total_eth:.2f} ETH",
        distributed_rewards=f"{distributed_eth:.2f} ETH",
        verification_rate=verification_rate
    )
