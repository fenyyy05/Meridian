class StruggleDetector:
    def detect(self, topics_data: list) -> list:
        results = []
        for topic in topics_data:
            completion_rate = topic.get('completion_rate', 1.0)
            postpone_count = topic.get('postpone_count', 0)
            time_spent_mins = topic.get('time_spent_mins', 0)
            expected_time_mins = topic.get('expected_time_mins', 30)
            avg_focus_score = topic.get('avg_focus_score', 5.0)
            confidence_level = topic.get('confidence_level', 5.0)
            repeat_sessions = topic.get('repeat_sessions', 0)
            
            # Normalizations
            normalized_postpone_count = min(postpone_count / 5.0, 1.0)
            normalized_time_spent = min((time_spent_mins / max(expected_time_mins, 1)) - 1.0, 1.0) if time_spent_mins > expected_time_mins else 0.0
            normalized_repeat_sessions = min(repeat_sessions / 3.0, 1.0)
            
            struggle_score = (
                (1 - completion_rate) * 0.25 +
                normalized_postpone_count * 0.20 +
                normalized_time_spent * 0.15 +
                (1 - avg_focus_score / 5.0) * 0.15 +
                (1 - confidence_level / 5.0) * 0.15 +
                normalized_repeat_sessions * 0.10
            )
            
            if struggle_score >= 0.65:
                level = 'HIGH'
            elif struggle_score >= 0.35:
                level = 'MEDIUM'
            else:
                level = 'LOW'
                
            reasons = []
            if completion_rate < 0.5:
                reasons.append("Low completion rate")
            if postpone_count >= 3:
                reasons.append("Frequently postponed")
            if time_spent_mins > expected_time_mins * 1.5:
                reasons.append("Taking longer than expected")
            if avg_focus_score < 3.0:
                reasons.append("Low focus scores")
            if confidence_level < 3.0:
                reasons.append("Low self-reported confidence")
                
            results.append({
                "topic_id": topic.get("topic_id"),
                "topic_name": topic.get("topic_name", "Unknown Topic"),
                "struggle_score": float(struggle_score),
                "struggle_level": level,
                "reasons": reasons
            })
            
        return results

detector = StruggleDetector()
