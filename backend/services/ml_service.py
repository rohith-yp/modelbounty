from typing import Dict, Any
from backend.ml.model_loader import ModelLoader
from backend.ml.model_analyzer import ModelAnalyzer


class MLService:
    @staticmethod
    def get_status() -> str:
        return "available"

    @staticmethod
    def test_perturbation(model_name: str, payload: str) -> Dict[str, Any]:
        return ModelAnalyzer.test_perturbation(model_name, payload)

    @staticmethod
    def load_model(framework: str, model_id: str) -> Dict[str, Any]:
        return ModelLoader.load_model(framework, model_id)
