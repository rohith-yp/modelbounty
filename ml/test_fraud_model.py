import os
import joblib
import pandas as pd

BASE_DIR = os.path.dirname(os.path.abspath(__file__))
MODEL_PATH = os.path.join(BASE_DIR, "models", "fraud_model.joblib")

print("=" * 60)
print("MODELBOUNTY — FRAUDDETECT V1 MODEL TEST")
print("=" * 60)

print("\nLoading model...")

if not os.path.exists(MODEL_PATH):
    raise FileNotFoundError(
        f"Model not found: {MODEL_PATH}"
    )

model = joblib.load(MODEL_PATH)

print("Model loaded successfully.")
print(f"Model type: {type(model).__name__}")

test_cases = [
    {
        "name": "Normal transaction",
        "amount": 120.0,
        "frequency_24h": 2,
        "account_age_days": 900,
        "ip_risk_score": 0.10,
        "device_risk_score": 0.15,
        "new_ip": 0,
        "international": 0,
    },
    {
        "name": "High-value suspicious transaction",
        "amount": 98500.0,
        "frequency_24h": 12,
        "account_age_days": 10,
        "ip_risk_score": 0.92,
        "device_risk_score": 0.88,
        "new_ip": 1,
        "international": 1,
    },
    {
        "name": "New IP with unusual frequency",
        "amount": 4500.0,
        "frequency_24h": 15,
        "account_age_days": 20,
        "ip_risk_score": 0.85,
        "device_risk_score": 0.40,
        "new_ip": 1,
        "international": 0,
    },
    {
        "name": "Low-risk transaction",
        "amount": 250.0,
        "frequency_24h": 3,
        "account_age_days": 700,
        "ip_risk_score": 0.12,
        "device_risk_score": 0.20,
        "new_ip": 0,
        "international": 0,
    },
]

for case in test_cases:
    input_data = pd.DataFrame(
        [
            {
                "amount": case["amount"],
                "frequency_24h": case["frequency_24h"],
                "account_age_days": case["account_age_days"],
                "ip_risk_score": case["ip_risk_score"],
                "device_risk_score": case["device_risk_score"],
                "new_ip": case["new_ip"],
                "international": case["international"],
            }
        ]
    )

    prediction = int(model.predict(input_data)[0])

    if hasattr(model, "predict_proba"):
        probability = float(model.predict_proba(input_data)[0][1])
    else:
        probability = None

    result = "FRAUD" if prediction == 1 else "LEGITIMATE"

    print("\n" + "-" * 60)
    print(f"Test: {case['name']}")
    print(f"Amount: ${case['amount']}")
    print(f"Frequency/24h: {case['frequency_24h']}")
    print(f"Account age: {case['account_age_days']} days")
    print(f"IP risk: {case['ip_risk_score']}")
    print(f"Device risk: {case['device_risk_score']}")
    print(f"New IP: {case['new_ip']}")
    print(f"International: {case['international']}")
    print(f"Prediction: {result}")

    if probability is not None:
        print(f"Fraud probability: {probability:.4f}")

print("\n" + "=" * 60)
print("MODEL TEST COMPLETED")
print("=" * 60)