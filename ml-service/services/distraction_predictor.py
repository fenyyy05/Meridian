import os
import json
import joblib
import numpy as np
from services.feature_engineering import transform_features

class DistractionPredictor:
    def __init__(self, model_dir: str = 'models'):
        self.model_path = os.path.join(model_dir, 'distraction_model.joblib')
        self.metadata_path = os.path.join(model_dir, 'model_metadata.json')
        self.model = None
        self.metadata = None
        self.feature_names = []
        self._load_model()
        
    def _load_model(self):
        if os.path.exists(self.model_path) and os.path.exists(self.metadata_path):
            self.model = joblib.load(self.model_path)
            with open(self.metadata_path, 'r') as f:
                self.metadata = json.load(f)
            self.feature_names = self.metadata.get('features', [])
            
    def is_loaded(self) -> bool:
        return self.model is not None

    def predict(self, feature_dict: dict):
        if not self.is_loaded():
            raise RuntimeError("Model is not loaded.")
            
        X = transform_features(feature_dict, self.feature_names)
        
        probas = self.model.predict_proba(X)[0]
        pred_class = int(np.argmax(probas))
        
        risk_map = {0: 'LOW', 1: 'MEDIUM', 2: 'HIGH'}
        risk_level = risk_map.get(pred_class, 'UNKNOWN')
        
        confidence_scores = {
            'LOW': float(probas[0]),
            'MEDIUM': float(probas[1]),
            'HIGH': float(probas[2])
        }
        
        # Simple feature importance logic
        top_features = []
        if hasattr(self.model.named_steps.get('classifier'), 'feature_importances_'):
            importances = self.model.named_steps['classifier'].feature_importances_
            indices = np.argsort(importances)[::-1]
            for i in indices[:3]:
                top_features.append(self.feature_names[i])
        elif hasattr(self.model.named_steps.get('classifier'), 'coef_'):
            coefs = np.abs(self.model.named_steps['classifier'].coef_[pred_class])
            indices = np.argsort(coefs)[::-1]
            for i in indices[:3]:
                top_features.append(self.feature_names[i])
        
        explanation = self._generate_explanation(risk_level, top_features, feature_dict)
        
        return {
            "risk_level": risk_level,
            "probability": float(probas[pred_class]),
            "confidence_scores": confidence_scores,
            "explanation": explanation,
            "top_features": top_features,
            "model_version": self.metadata.get("version", "unknown")
        }
        
    def _generate_explanation(self, risk_level: str, top_features: list, feature_dict: dict) -> str:
        if risk_level == 'LOW':
            return "Low distraction risk — your recent focus habits appear stable."
            
        desc_map = {
            'hour_of_day': f"the current time of day ({feature_dict.get('hour_of_day', 'unknown')}:00)",
            'recent_distraction_count': f"frequent recent distractions ({feature_dict.get('recent_distraction_count', 0)})",
            'interruption_count': f"frequent interruptions ({feature_dict.get('interruption_count', 0)})",
            'historical_completion_rate': f"a historical completion rate pattern",
            'postponed_task_count': f"several postponed tasks ({feature_dict.get('postponed_task_count', 0)})",
            'recent_unfinished_tasks': f"recent unfinished tasks ({feature_dict.get('recent_unfinished_tasks', 0)})",
            'task_difficulty': f"a high task difficulty rating",
            'prev_focus_score': f"a recent focus score of {feature_dict.get('prev_focus_score', 'unknown')}"
        }
        
        reasons = [desc_map.get(f, f.replace('_', ' ')) for f in top_features[:2]]
        
        if len(reasons) == 2:
            reasons_str = f"{reasons[0]} and {reasons[1]}"
        elif len(reasons) == 1:
            reasons_str = reasons[0]
        else:
            reasons_str = "several recent behavioral factors"
            
        return f"{risk_level.capitalize()} distraction risk — your recent sessions have been influenced by {reasons_str}."

predictor = DistractionPredictor()
