import sqlite3

conn = sqlite3.connect('health_monitoring.db')
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

# Check API endpoint
print('\n=== TESTING API ENDPOINTS ===')
import requests

try:
    # Test get-patients endpoint
    response = requests.get('http://localhost:5001/get-patients')
    print(f'GET /get-patients: {response.status_code}')
    print(f'  Patients returned: {len(response.json())}')
    
    # Test get-data endpoint for a patient
    if response.json():
        patient_id = response.json()[0]['id']
        data_response = requests.get(f'http://localhost:5001/get-data?user_id={patient_id}')
        print(f'GET /get-data?user_id={patient_id[:8]}...: {data_response.status_code}')
        print(f'  Health records returned: {len(data_response.json())}')
except Exception as e:
    print(f'Error testing API: {e}')

conn.close()