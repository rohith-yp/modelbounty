from typing import Dict, Any


class ModelLoader:
    """Safe model loader placeholder. Does not load or execute untrusted local binaries."""

    @staticmethod
    def load_model(framework: str, model_id: str) -> Dict[str, Any]:
        return {
            "status": "NOT_IMPLEMENTED",
            "framework": framework,
            "model_id": model_id,
            "message": "Model binary execution is disabled in the prototype stage"
        }
