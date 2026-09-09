import pandas as pd
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.metrics.pairwise import cosine_similarity

class ResourceRecommender:
    def __init__(self):
        self.vectorizer = TfidfVectorizer(stop_words='english')
        self.resources = []
        self.tfidf_matrix = None
        self.is_initialized = False

    def load_resources(self, resources_list: list):
        self.resources = resources_list
        if not self.resources:
            self.is_initialized = False
            return
            
        texts = []
        for r in self.resources:
            text = f"{r.get('title', '')} {r.get('description', '')} {' '.join(r.get('tags', []))} {r.get('topic', '')} {r.get('subject', '')}"
            texts.append(text)
            
        self.tfidf_matrix = self.vectorizer.fit_transform(texts)
        self.is_initialized = True

    def recommend(self, query: str, subject: str = None, topic: str = None, struggle_level: str = 'LOW', completed_ids: list = None, top_k: int = 5):
        if not self.is_initialized:
            return []
            
        completed_ids = set(completed_ids or [])
        query_vec = self.vectorizer.transform([query])
        similarities = cosine_similarity(query_vec, self.tfidf_matrix)[0]
        
        scored_resources = []
        for idx, res in enumerate(self.resources):
            if res.get('id') in completed_ids:
                continue
                
            score = similarities[idx]
            reasons = []
            
            # Boosters
            if subject and res.get('subject') == subject:
                score += 0.2
                reasons.append("Matches your subject")
            if topic and res.get('topic') == topic:
                score += 0.3
                reasons.append("Matches your topic")
                
            # Content type matching based on struggle level (basic heuristic)
            if struggle_level == 'HIGH' and res.get('type') in ['video', 'interactive']:
                score += 0.15
                reasons.append("Recommended format for difficult topics")
                
            if score > 0:
                scored_resources.append({
                    "resource": res,
                    "score": float(score),
                    "reasons": reasons
                })
                
        scored_resources.sort(key=lambda x: x['score'], reverse=True)
        return scored_resources[:top_k]

recommender = ResourceRecommender()
