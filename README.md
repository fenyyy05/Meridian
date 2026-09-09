# Meridian

> Find your direction. Make your time count.

Meridian is an **AI-Powered Adaptive Academic Productivity Platform**. It's not just another to-do app or pomodoro timer. Meridian uses machine learning to learn your study patterns, predict when you'll be distracted, detect struggle areas, and automatically generate optimal study schedules.

## Core Intelligence Loop

1. **Plan**: LLM-powered task decomposition breaks large tasks into actionable subtasks.
2. **Focus**: Epoch-based timer records deep work and tracks tab/window context switching as distractions.
3. **Track**: Collects continuous behavioral analytics per topic and session.
4. **Analyze**: Monitors productivity windows, completion rates, and focus quality.
5. **Predict**: Machine Learning (Random Forest) predicts distraction risk probability based on current context.
6. **Recommend**: Suggests targeted learning resources for topics you're struggling with using TF-IDF cosine similarity.
7. **Adapt**: Adjusts the dynamic daily schedule to optimize your productivity.

## Tech Stack

**Frontend & API (Next.js)**
- Next.js 16 (App Router, Server Actions)
- TypeScript
- Tailwind CSS v4 + shadcn/ui
- NextAuth.js v5 (Auth.js)
- Recharts for Analytics
- Prisma + PostgreSQL (Neon compatible)

**Machine Learning Service (FastAPI)**
- Python 3.12
- FastAPI + Uvicorn
- Scikit-learn (Random Forest, Logistic Regression, TF-IDF)
- Pandas & NumPy for feature engineering
- Joblib for model serialization

## Getting Started

### 1. Database Setup
Ensure you have a PostgreSQL database running or set up a Neon database.
Update the `.env` file with your `DATABASE_URL`.

Run Prisma migrations and seed the database:
```bash
npx prisma db push
npm run prisma:seed
```

### 2. Next.js Web App
Install dependencies and run the development server:
```bash
npm install
npm run dev
```
The app will be running at `http://localhost:3000`.

### 3. ML Service (FastAPI)
The ML service runs separately on port 8000. Next.js rewrites proxy requests to it seamlessly.

```bash
cd ml-service
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate
pip install -r requirements.txt

# Generate synthetic behavioral data and train the model
python data/generate_synthetic.py
python training/train_distraction_model.py

# Start the API
uvicorn api.main:app --reload
```

## Features Deep-Dive

### 1. Distraction Risk Model (Scikit-Learn)
Instead of static rules, Meridian trains a Random Forest classifier on your historical focus sessions. It looks at the time of day, recent interruptions, task difficulty, and completion rate to predict if you are at HIGH, MEDIUM, or LOW risk of distraction during your next focus block.

### 2. Generative Task Decomposition
By integrating with OpenAI (GPT-4o-mini), Meridian can take a vague task like "Write History Essay" and break it down into 5-6 actionable subtasks with estimated durations and difficulty scores, automatically creating them in your task list.

### 3. Adaptive Schedule Planner
The daily planner doesn't just block time. It looks at your `dailyGoalMinutes`, `preferredStudyStart`, and pending tasks, and fits them into optimal blocks.

### 4. Continuous Analytics
Tracks your actual study time, focus quality (1-5 self-rating), and system-detected distractions to form a holistic `ProductivitySnapshot` per day, powering the Analytics dashboard.

## Deployment

**Web App**: Deployable directly to Vercel. Ensure `DATABASE_URL`, `AUTH_SECRET`, `OPENAI_API_KEY`, and `ML_SERVICE_URL` are configured in the environment variables.

**ML Service**: Contains a `Dockerfile` for easy deployment to platforms like Render, Railway, or Google Cloud Run.
