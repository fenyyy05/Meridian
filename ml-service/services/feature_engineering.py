import numpy as np

def transform_features(data_dict: dict, expected_features: list) -> np.ndarray:
    """
    Transforms raw behavioral features into model-ready input.
    - Validates feature ranges
    - Handles missing values with defaults
    - Creates derived features if necessary
    """
    # Defaults in case of missing data
    defaults = {
        'hour_of_day': 12,
        'day_of_week': 3,
        'recent_distraction_count': 0,
        'recent_distraction_duration_min': 0,
        'prev_session_duration_min': 30,
        'prev_focus_score': 3.0,
        'interruption_count': 0,
        'task_difficulty': 3,
        'historical_completion_rate': 0.5,
        'postponed_task_count': 0,
        'recent_productivity_score': 0.5,
        'recent_unfinished_tasks': 0
    }
    
    processed_features = []
    for feature in expected_features:
        val = data_dict.get(feature)
        if val is None:
            val = defaults.get(feature, 0.0)
        
        # Some basic validations/clipping if needed
        if feature == 'hour_of_day':
            val = max(0, min(23, val))
        elif feature == 'day_of_week':
            val = max(0, min(6, val))
        elif feature in ['prev_focus_score', 'task_difficulty']:
            val = max(1, min(5, val))
        elif feature in ['historical_completion_rate', 'recent_productivity_score']:
            val = max(0.0, min(1.0, val))
            
        processed_features.append(float(val))
        
    return np.array([processed_features])
