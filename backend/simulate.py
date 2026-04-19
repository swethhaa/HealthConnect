import requests
import random
import time

print("="*40)
print("   HEALTH SENSOR SIMULATOR (ESP32)   ")
print("   Simulating real-time data flow    ")
print("="*40)

def simulate():
    while True:
        try:
            # Fetch all patients to simulate data for
            response = requests.get("http://127.0.0.1:5000/get-patients")
            if response.status_code == 200:
                patients = response.json()
                # Always include default_patient for fallback
                patient_ids = [p['id'] for p in patients]
                if "default_patient" not in patient_ids:
                    patient_ids.append("default_patient")
                
                for pid in patient_ids:
                    data = {
                        "user_id": pid,
                        "heart_rate": random.randint(55, 110),
                        "spo2": random.randint(88, 100),
                        "temperature": round(random.uniform(36.5, 39.5), 1),
                        "systolic": random.randint(110, 160),
                        "diastolic": random.randint(70, 100),
                        "glucose": random.randint(70, 160)
                    }
                    
                    res = requests.post("http://127.0.0.1:5000/upload-data", json=data)
                    if res.status_code == 200:
                        print(f"[{time.strftime('%H:%M:%S')}] Data Sent for {pid[:8]}...: Risk {res.json().get('risk_level')}")
            
        except Exception as e:
            print("Error in simulation loop:", e)

        time.sleep(5)

if __name__ == "__main__":
    simulate()
