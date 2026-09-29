from typing import Dict, Any, Optional
from backend.blockchain.wallet import WalletManager
from backend.blockchain.contract import ContractManager


class BlockchainService:
    @staticmethod
    def get_status() -> str:
        if ContractManager.is_configured():
            return "configured"
        return "not_configured"

    @staticmethod
    def connect_wallet(address: str) -> Dict[str, Any]:
        return WalletManager.connect_wallet(address)

    @staticmethod
    def verify_wallet(address: str, signature: Optional[str] = None) -> Dict[str, Any]:
        return WalletManager.verify_wallet(address, signature)

    @staticmethod
    def create_on_chain_bounty(bounty_id: str, reward: str) -> Dict[str, Any]:
        return ContractManager.create_on_chain_bounty(bounty_id, reward)

    @staticmethod
    def approve_reward(finding_id: str, recipient: str, amount: str) -> Dict[str, Any]:
        return ContractManager.approve_reward(finding_id, recipient, amount)
