import os
import joblib
import numpy as np
import pandas as pd

from sklearn.model_selection import train_test_split
from sklearn.ensemble import RandomForestClassifier
from sklearn.metrics import (
    accuracy_score,
    precision_score,
    recall_score,
    f1_score,
    classification_report,
    confusion_matrix,
)

BASE_DIR = os.path.dirname(os.path.abspath(__file__))
DATA_DIR = os.path.join(BASE_DIR, "data")
MODEL_DIR = os.path.join(BASE_DIR, "models")

os.makedirs(DATA_DIR, exist_ok=True)
os.makedirs(MODEL_DIR, exist_ok=True)

DATA_PATH = os.path.join(DATA_DIR, "fraud_training_data.csv")
MODEL_PATH = os.path.join(MODEL_DIR, "fraud_model.joblib")

np.random.seed(42)

N = 10000

amount = np.random.lognormal(mean=4.5, sigma=1.0, size=N)
frequency_24h = np.random.poisson(lam=3, size=N)
account_age_days = np.random.randint(1, 2500, size=N)
ip_risk_score = np.random.uniform(0, 1, size=N)
device_risk_score = np.random.uniform(0, 1, size=N)
new_ip = np.random.binomial(1, 0.25, size=N)
international = np.random.binomial(1, 0.20, size=N)

risk_score = (
    (amount > 5000) * 1.5
    + (frequency_24h > 8) * 1.5
    + (account_age_days < 30) * 1.0
    + (ip_risk_score > 0.75) * 1.5
    + (device_risk_score > 0.75) * 1.0
    + new_ip * 1.0
    + international * 0.5
)

fraud = (risk_score >= 3.0).astype(int)

df = pd.DataFrame(
    {
        "amount": amount,
        "frequency_24h": frequency_24h,
        "account_age_days": account_age_days,
        "ip_risk_score": ip_risk_score,
        "device_risk_score": device_risk_score,
        "new_ip": new_ip,
        "international": international,
        "fraud": fraud,
    }
)

df.to_csv(DATA_PATH, index=False)

X = df.drop(columns=["fraud"])
y = df["fraud"]

X_train, X_test, y_train, y_test = train_test_split(
    X,
    y,
    test_size=0.20,
    random_state=42,
    stratify=y,
)

model = RandomForestClassifier(
    n_estimators=200,
    max_depth=10,
    random_state=42,
    n_jobs=-1,
)

model.fit(X_train, y_train)

predictions = model.predict(X_test)

accuracy = accuracy_score(y_test, predictions)
precision = precision_score(y_test, predictions, zero_division=0)
recall = recall_score(y_test, predictions, zero_division=0)
f1 = f1_score(y_test, predictions, zero_division=0)

joblib.dump(model, MODEL_PATH)

print("=" * 60)
print("MODELBOUNTY — FRAUDDETECT V1")
print("=" * 60)

print(f"Dataset: {DATA_PATH}")
print(f"Rows: {len(df)}")
print(f"Training samples: {len(X_train)}")
print(f"Testing samples: {len(X_test)}")

print("\nMODEL:")
print("Algorithm: Random Forest Classifier")
print("Version: FraudDetect V1")

print("\nEVALUATION:")
print(f"Accuracy : {accuracy:.4f}")
print(f"Precision: {precision:.4f}")
print(f"Recall   : {recall:.4f}")
print(f"F1 Score : {f1:.4f}")

print("\nCONFUSION MATRIX:")
print(confusion_matrix(y_test, predictions))

print("\nCLASSIFICATION REPORT:")
print(classification_report(y_test, predictions, zero_division=0))

print("\nMODEL SAVED:")
print(MODEL_PATH)

print("\nSTATUS: TRAINING SUCCESSFUL")
print("=" * 60)