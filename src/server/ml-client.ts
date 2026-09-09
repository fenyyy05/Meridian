/**
 * ML Service Client
 * Communicates with the FastAPI ML service for predictions and recommendations.
 * Falls back gracefully when the ML service is unavailable.
 */

const ML_SERVICE_URL = process.env.ML_SERVICE_URL || "http://localhost:8000";
const ML_TIMEOUT = 1500; // 1.5 seconds

interface DistractionPredictInput {
  hour_of_day: number;
  day_of_week: number;
  recent_distraction_count: number;
  recent_distraction_duration_min: number;
  prev_session_duration_min: number;
  prev_focus_score: number;
  interruption_count: number;
  task_difficulty: number;
  historical_completion_rate: number;
  postponed_task_count: number;
  recent_productivity_score: number;
  recent_unfinished_tasks: number;
}

interface DistractionPredictOutput {
  risk_level: "LOW" | "MEDIUM" | "HIGH";
  probability: number;
  confidence_scores: { LOW: number; MEDIUM: number; HIGH: number };
  explanation: string;
  top_features: string[];
  model_version: string;
}

interface TopicActivity {
  topic_id: string;
  topic_name: string;
  subject_name: string;
  completion_rate: number;
  postpone_count: number;
  total_time_minutes: number;
  avg_focus_score: number;
  confidence_level: number;
  session_count: number;
}

interface StruggleResult {
  topic_id: string;
  topic_name: string;
  subject_name: string;
  struggle_level: "LOW" | "MEDIUM" | "HIGH";
  struggle_score: number;
  reasons: string[];
}

interface ResourceRecommendInput {
  query: string;
  subject?: string;
  topic?: string;
  struggle_level?: string;
  completed_resource_ids?: string[];
  top_k?: number;
}

interface ResourceRecommendation {
  resource_id: string;
  title: string;
  similarity_score: number;
  reason: string;
}

// Simple in-memory cache
const cache = new Map<string, { data: unknown; expiry: number }>();
const CACHE_TTL = 5 * 60 * 1000; // 5 minutes

function getCached<T>(key: string): T | null {
  const entry = cache.get(key);
  if (entry && entry.expiry > Date.now()) {
    return entry.data as T;
  }
  cache.delete(key);
  return null;
}

function setCache(key: string, data: unknown): void {
  cache.set(key, { data, expiry: Date.now() + CACHE_TTL });
}

async function mlFetch<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<T | null> {
  try {
    // In production, if ML_SERVICE_URL is localhost, skip the fetch to prevent latency
    if (process.env.NODE_ENV === 'production' && ML_SERVICE_URL.includes("localhost")) {
      return null;
    }

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), ML_TIMEOUT);

    const response = await fetch(`${ML_SERVICE_URL}${endpoint}`, {
      ...options,
      signal: controller.signal,
      headers: {
        "Content-Type": "application/json",
        ...options.headers,
      },
    });

    clearTimeout(timeout);

    if (!response.ok) {
      console.error(
        `ML service error: ${response.status} ${response.statusText}`
      );
      return null;
    }

    return (await response.json()) as T;
  } catch (error) {
    if (error instanceof Error && error.name === "AbortError") {
      console.error("ML service request timed out");
    } else {
      console.error("ML service unavailable:", error);
    }
    return null;
  }
}

export async function predictDistractionRisk(
  input: DistractionPredictInput
): Promise<DistractionPredictOutput | null> {
  const cacheKey = `distraction:${JSON.stringify(input)}`;
  const cached = getCached<DistractionPredictOutput>(cacheKey);
  if (cached) return cached;

  const result = await mlFetch<DistractionPredictOutput>(
    "/predict/distraction-risk",
    {
      method: "POST",
      body: JSON.stringify(input),
    }
  );

  if (result) {
    setCache(cacheKey, result);
    return result;
  }

  // Heuristic Fallback — multi-factor scoring
  let score = 0; // 0-100, higher = more distracted
  const hour = input.hour_of_day;
  const topFeatures: string[] = [];

  // Time of day factor (0-25 points)
  if (hour >= 22 || hour < 5) {
    score += 25; topFeatures.push("Very late hours");
  } else if (hour >= 20) {
    score += 18; topFeatures.push("Evening hours");
  } else if (hour >= 13 && hour <= 15) {
    score += 12; topFeatures.push("Post-lunch dip");
  } else if (hour >= 6 && hour <= 11) {
    score += 3; // Morning is usually best
  } else {
    score += 8;
  }

  // Day of week factor (0-10 points)
  const dayOfWeek = input.day_of_week;
  if (dayOfWeek === 0 || dayOfWeek === 6) {
    score += 8; topFeatures.push("Weekend");
  } else if (dayOfWeek === 5) {
    score += 5; topFeatures.push("Friday wind-down");
  }

  // Recent distraction history (0-20 points)
  if (input.recent_distraction_count > 5) {
    score += 20; topFeatures.push("High recent distraction count");
  } else if (input.recent_distraction_count > 2) {
    score += 12; topFeatures.push("Moderate recent distractions");
  } else {
    score += input.recent_distraction_count * 3;
  }

  // Previous focus score inverse (0-15 points)
  const focusPenalty = Math.max(0, Math.round((100 - input.prev_focus_score) * 0.15));
  score += focusPenalty;
  if (input.prev_focus_score < 50) topFeatures.push("Low recent focus score");

  // Task overload (0-15 points)
  if (input.recent_unfinished_tasks > 8) {
    score += 15; topFeatures.push("High task backlog");
  } else if (input.recent_unfinished_tasks > 4) {
    score += 10; topFeatures.push("Growing task backlog");
  } else {
    score += input.recent_unfinished_tasks * 2;
  }

  // Completion rate inverse (0-10 points)
  const completionPenalty = Math.round((1 - input.historical_completion_rate) * 10);
  score += completionPenalty;

  // Interruptions (0-5 points)
  score += Math.min(5, input.interruption_count * 2);

  // Clamp to 0-100
  score = Math.max(0, Math.min(100, score));

  let risk_level: "LOW" | "MEDIUM" | "HIGH";
  if (score >= 55) {
    risk_level = "HIGH";
  } else if (score >= 30) {
    risk_level = "MEDIUM";
  } else {
    risk_level = "LOW";
  }

  const probability = Math.round(score) / 100;

  const explanations: Record<string, string> = {
    HIGH: `Elevated risk (${score}/100). Key factors: ${topFeatures.slice(0, 2).join(", ") || "multiple signals"}.`,
    MEDIUM: `Moderate risk (${score}/100). Watch out for: ${topFeatures.slice(0, 2).join(", ") || "mild signals"}.`,
    LOW: `Low risk (${score}/100). Conditions look good for focused study.`,
  };

  return {
    risk_level,
    probability,
    confidence_scores: {
      LOW: risk_level === "LOW" ? 0.7 : 0.15,
      MEDIUM: risk_level === "MEDIUM" ? 0.6 : 0.2,
      HIGH: risk_level === "HIGH" ? 0.7 : 0.15,
    },
    explanation: explanations[risk_level],
    top_features: topFeatures.slice(0, 3),
    model_version: "heuristic-v2"
  };
}

export async function detectStruggleAreas(
  topics: TopicActivity[]
): Promise<StruggleResult[] | null> {
  const result = await mlFetch<{ topics: StruggleResult[] }>(
    "/predict/topic-struggle",
    {
      method: "POST",
      body: JSON.stringify({ topics }),
    }
  );

  if (result) return result.topics;

  // Heuristic Fallback
  const fallbackTopics: StruggleResult[] = topics.map(t => {
    let level: "LOW" | "MEDIUM" | "HIGH" = "LOW";
    let score = 0.1;
    const reasons: string[] = [];
    
    if (t.completion_rate < 0.3 && t.session_count > 1) {
      level = "HIGH";
      score = 0.9;
      reasons.push("Low completion rate relative to sessions");
    } else if (t.postpone_count > 3) {
      level = "MEDIUM";
      score = 0.6;
      reasons.push("Tasks frequently postponed");
    }
    
    return {
      topic_id: t.topic_id,
      topic_name: t.topic_name,
      subject_name: t.subject_name,
      struggle_level: level,
      struggle_score: score,
      reasons: reasons.length ? reasons : ["No immediate struggles detected."]
    };
  });
  
  return fallbackTopics.length > 0 ? fallbackTopics : [];
}

export async function getResourceRecommendations(
  input: ResourceRecommendInput
): Promise<ResourceRecommendation[] | null> {
  const result = await mlFetch<{ recommendations: ResourceRecommendation[] }>(
    "/recommend/resources",
    {
      method: "POST",
      body: JSON.stringify(input),
    }
  );

  return result?.recommendations ?? null;
}

export async function checkMLHealth(): Promise<boolean> {
  const result = await mlFetch<{ status: string }>("/health");
  return result?.status === "healthy";
}

export type {
  DistractionPredictInput,
  DistractionPredictOutput,
  TopicActivity,
  StruggleResult,
  ResourceRecommendInput,
  ResourceRecommendation,
};
