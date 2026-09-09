# Meridian ML Service

This service provides machine learning capabilities for the Meridian application.

## Setup

1. Install requirements:
   ```bash
   pip install -r requirements.txt
   ```

2. Generate synthetic training data:
   ```bash
   python data/generate_synthetic.py
   ```
   *(Disclaimer: This data is synthetic and used only for training the initial models. Do not use for real clinical or real behavioral conclusions without real data validation.)*

3. Train the model:
   ```bash
   python training/train_distraction_model.py
   ```

4. Run the API:
   ```bash
   uvicorn api.main:app --reload
   ```

## Endpoints

- `GET /health` - Health check and model status
- `POST /predict/distraction-risk` - Predict distraction risk from behavioral features
- `POST /predict/topic-struggle` - Detect struggle levels based on topic engagement
- `POST /recommend/resources` - Recommend resources based on query and context

See `/docs` for detailed Swagger documentation when the API is running.
