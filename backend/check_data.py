import sqlite3
import getpass
import os
import requests

conn = sqlite3.connect(os.environ.get("HEALTHCONNECT_DB_PATH", "health_monitoring.db"))
cursor = conn.cursor()

# Check data counts
users = cursor.execute('SELECT COUNT(*) FROM users').fetchone()[0]
health_data = cursor.execute('SELECT COUNT(*) FROM health_data').fetchone()[0]
doctors = cursor.execute('SELECT COUNT(*) FROM users WHERE role = ?', ('doctor',)).fetchone()[0]
patients = cursor.execute('SELECT COUNT(*) FROM users WHERE role = ?', ('patient',)).fetchone()[0]

print(f'Total Users: {users}')
print(f'Doctors: {doctors}')
print(f'Patients: {patients}')
print(f'Health Records: {health_data}')

# Show sample data
print('\n=== SAMPLE HEALTH DATA ===')
data = cursor.execute('SELECT user_id, heart_rate, spo2, temperature, systolic, diastolic, glucose, risk_level FROM health_data LIMIT 5').fetchall()
for row in data:
    print(f'Patient: {row[0][:8]}... HR:{row[1]} SPO2:{row[2]} Temp:{row[3]} BP:{row[4]}/{row[5]} Glucose:{row[6]} Risk:{row[7]}')

# Check authenticated API access for the current patient.
print('\n=== TESTING AUTHENTICATED PATIENT API ===')
username = input("Patient username: ").strip()
password = getpass.getpass("Patient password: ")
try:
    session = requests.Session()
    response = session.post(
        "http://127.0.0.1:5001/login",
        json={"username": username, "password": password},
        timeout=5,
    )
    if response.status_code != 200:
        print(f'Login failed: {response.json().get("error", response.reason)}')
    elif response.json()["user"]["role"] != "patient":
        print("The data check requires a patient account.")
    else:
        session.headers["Authorization"] = f'Bearer {response.json()["token"]}'
        data_response = session.get(
            "http://127.0.0.1:5001/get-data",
            params={"user_id": response.json()["user"]["id"]},
            timeout=5,
        )
        print(f'GET /get-data: {data_response.status_code}')
        print(f'  Patient readings returned: {len(data_response.json())}')
except requests.RequestException as error:
    print(f'API check failed: {error}')

conn.close()