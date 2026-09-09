import os
import numpy as np
import pandas as pd

def generate_synthetic_data(num_samples=5000, output_path="data/synthetic_sessions.csv"):
    np.random.seed(42)
    
    # Features
    hour_of_day = np.random.choice(np.arange(24), size=num_samples, p=[0.02]*6 + [0.03]*4 + [0.05]*4 + [0.07]*6 + [0.04]*4)
    day_of_week = np.random.randint(0, 7, size=num_samples)
    recent_distraction_count = np.random.poisson(lam=3, size=num_samples)
    recent_distraction_duration_min = np.random.poisson(lam=recent_distraction_count * 2, size=num_samples) + np.random.randint(0, 5, size=num_samples)
    prev_session_duration_min = np.random.gamma(shape=2.0, scale=15.0, size=num_samples)
    prev_focus_score = np.clip(np.random.normal(loc=3.5, scale=1.0, size=num_samples), 1, 5)
    interruption_count = np.random.poisson(lam=1.5, size=num_samples)
    task_difficulty = np.random.randint(1, 6, size=num_samples)
    historical_completion_rate = np.random.beta(a=5, b=2, size=num_samples)
    postponed_task_count = np.random.poisson(lam=1, size=num_samples)
    recent_productivity_score = np.random.beta(a=6, b=3, size=num_samples)
    recent_unfinished_tasks = np.random.poisson(lam=0.5, size=num_samples)
    
    # Latent score calculation
    is_late_night = ((hour_of_day >= 22) | (hour_of_day <= 2)).astype(float)
    is_afternoon = ((hour_of_day >= 13) & (hour_of_day <= 16)).astype(float)
    is_morning = ((hour_of_day >= 6) & (hour_of_day <= 10)).astype(float)
    
    # Normalizations
    norm_recent_distractions = np.clip(recent_distraction_count / 15.0, 0, 1)
    norm_distraction_duration = np.clip(recent_distraction_duration_min / 60.0, 0, 1)
    norm_prev_session_duration = np.clip(prev_session_duration_min / 120.0, 0, 1)
    norm_prev_focus_score = prev_focus_score / 5.0
    norm_interruptions = np.clip(interruption_count / 10.0, 0, 1)
    norm_task_difficulty = task_difficulty / 5.0
    norm_postponed_tasks = np.clip(postponed_task_count / 20.0, 0, 1)
    norm_unfinished_tasks = np.clip(recent_unfinished_tasks / 10.0, 0, 1)
    
    noise = np.random.normal(0, 0.2, size=num_samples)
    
    latent = (
        + 0.15 * is_late_night
        + 0.10 * is_afternoon
        - 0.15 * is_morning
        + 0.20 * norm_recent_distractions
        + 0.10 * norm_distraction_duration
        - 0.10 * norm_prev_session_duration  
        - 0.15 * norm_prev_focus_score
        + 0.15 * norm_interruptions
        + 0.10 * norm_task_difficulty
        - 0.20 * historical_completion_rate
        + 0.10 * norm_postponed_tasks
        - 0.15 * recent_productivity_score
        + 0.10 * norm_unfinished_tasks
        + noise
    )
    
    # Convert latent score to probabilities and categories
    def get_risk(val):
        if val > 0.3: return 2  # HIGH
        if val > -0.1: return 1 # MEDIUM
        return 0                # LOW

    distraction_risk = np.vectorize(get_risk)(latent)
    
    df = pd.DataFrame({
        'hour_of_day': hour_of_day,
        'day_of_week': day_of_week,
        'recent_distraction_count': recent_distraction_count,
        'recent_distraction_duration_min': recent_distraction_duration_min,
        'prev_session_duration_min': prev_session_duration_min,
        'prev_focus_score': prev_focus_score,
        'interruption_count': interruption_count,
        'task_difficulty': task_difficulty,
        'historical_completion_rate': historical_completion_rate,
        'postponed_task_count': postponed_task_count,
        'recent_productivity_score': recent_productivity_score,
        'recent_unfinished_tasks': recent_unfinished_tasks,
        'distraction_risk': distraction_risk
    })
    
    os.makedirs(os.path.dirname(output_path), exist_ok=True)
    df.to_csv(output_path, index=False)
    print(f"Generated {num_samples} samples and saved to {output_path}")
    print(df['distraction_risk'].value_counts())

if __name__ == "__main__":
    generate_synthetic_data()
