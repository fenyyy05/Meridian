import os
import json
import joblib
import pandas as pd
from sklearn.model_selection import train_test_split
from sklearn.pipeline import Pipeline
from sklearn.preprocessing import StandardScaler
from sklearn.linear_model import LogisticRegression
from sklearn.ensemble import RandomForestClassifier
from sklearn.metrics import accuracy_score, precision_score, recall_score, f1_score, confusion_matrix

def train_model():
    data_path = 'data/synthetic_sessions.csv'
    if not os.path.exists(data_path):
        print(f"Dataset not found at {data_path}. Please run generate_synthetic.py first.")
        return

    print("Loading data...")
    df = pd.read_csv(data_path)
    
    X = df.drop('distraction_risk', axis=1)
    y = df['distraction_risk']
    features = X.columns.tolist()
    
    print("Splitting data...")
    X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.2, stratify=y, random_state=42)
    
    print("Training Logistic Regression...")
    lr_pipeline = Pipeline([
        ('scaler', StandardScaler()),
        ('classifier', LogisticRegression(C=1.0, solver='lbfgs', multi_class='multinomial', class_weight='balanced', max_iter=1000, random_state=42))
    ])
    lr_pipeline.fit(X_train, y_train)
    lr_preds = lr_pipeline.predict(X_test)
    lr_f1 = f1_score(y_test, lr_preds, average='macro')
    
    print("Training Random Forest...")
    rf_pipeline = Pipeline([
        ('scaler', StandardScaler()),
        ('classifier', RandomForestClassifier(n_estimators=200, max_depth=12, min_samples_split=5, min_samples_leaf=3, class_weight='balanced', n_jobs=-1, random_state=42))
    ])
    rf_pipeline.fit(X_train, y_train)
    rf_preds = rf_pipeline.predict(X_test)
    rf_f1 = f1_score(y_test, rf_preds, average='macro')
    
    print(f"Logistic Regression Macro F1: {lr_f1:.4f}")
    print(f"Random Forest Macro F1: {rf_f1:.4f}")
    
    if rf_f1 >= lr_f1:
        print("Selecting Random Forest as the better model.")
        best_model = rf_pipeline
        preds = rf_preds
        model_type = "RandomForestClassifier"
    else:
        print("Selecting Logistic Regression as the better model.")
        best_model = lr_pipeline
        preds = lr_preds
        model_type = "LogisticRegression"
        
    print("\nEvaluation Report for Best Model:")
    print(f"Accuracy: {accuracy_score(y_test, preds):.4f}")
    print(f"Precision (Macro): {precision_score(y_test, preds, average='macro'):.4f}")
    print(f"Recall (Macro): {recall_score(y_test, preds, average='macro'):.4f}")
    print(f"F1 (Macro): {f1_score(y_test, preds, average='macro'):.4f}")
    print("Confusion Matrix:")
    print(confusion_matrix(y_test, preds))
    
    os.makedirs('models', exist_ok=True)
    model_path = 'models/distraction_model.joblib'
    joblib.dump(best_model, model_path)
    
    metadata = {
        "features": features,
        "metrics": {
            "accuracy": float(accuracy_score(y_test, preds)),
            "f1_macro": float(f1_score(y_test, preds, average='macro'))
        },
        "model_type": model_type,
        "version": "1.0.0"
    }
    
    with open('models/model_metadata.json', 'w') as f:
        json.dump(metadata, f, indent=4)
        
    print(f"\nModel saved to {model_path}")
    print("Metadata saved to models/model_metadata.json")

if __name__ == "__main__":
    train_model()
