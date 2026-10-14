import random


SIMULATION_INTERVAL_MIN_SECONDS = 5
SIMULATION_INTERVAL_MAX_SECONDS = 3600

NORMAL_RANGES = {
    "heart_rate": (65, 95),
    "spo2": (95, 100),
    "temperature": (36.4, 37.6),
    "systolic": (105, 130),
    "diastolic": (65, 85),
    "glucose": (75, 130),
}

ABNORMAL_RANGES = {
    "heart_rate": (118, 138),
    "spo2": (84, 91),
    "temperature": (38.5, 40.0),
    "systolic": (150, 180),
    "diastolic": (95, 115),
    "glucose": (160, 220),
}

RISK_THRESHOLDS = {
    "heart_rate": {"low": 60, "high": 100},
    "spo2": {"critical_below": 90, "low_below": 94},
    "temperature": {"low_below": 35.0, "high_above": 38.0},
    "systolic": {"high_above": 140},
    "diastolic": {"high_above": 90},
    "glucose": {"low_below": 70, "high_above": 140},
}


def generate_reading(mode):
    if mode not in ("normal", "abnormal"):
        raise ValueError("Simulation mode must be 'normal' or 'abnormal'.")

    ranges = NORMAL_RANGES if mode == "normal" else ABNORMAL_RANGES
    return {
        "heart_rate": random.randint(*ranges["heart_rate"]),
        "spo2": random.randint(*ranges["spo2"]),
        "temperature": round(random.uniform(*ranges["temperature"]), 1),
        "systolic": random.randint(*ranges["systolic"]),
        "diastolic": random.randint(*ranges["diastolic"]),
        "glucose": random.randint(*ranges["glucose"]),
    }
