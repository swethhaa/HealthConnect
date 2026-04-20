import sqlite3
import uuid
from datetime import datetime, timedelta
import random

def create_comprehensive_demo_data():
    conn = sqlite3.connect('health_monitoring.db')
    cursor = conn.cursor()

    # Clear existing data
    cursor.execute('DELETE FROM health_data')
    cursor.execute('DELETE FROM doctor_patients')
    cursor.execute('DELETE FROM users')

    # Sample doctors
    doctors = [
        {
            'id': str(uuid.uuid4()),
            'username': 'dr_smith',
            'password': 'doctor123',
            'role': 'doctor',
            'full_name': 'Dr. John Smith'
        },
        {
            'id': str(uuid.uuid4()),
            'username': 'dr_patel',
            'password': 'doctor123',
            'role': 'doctor',
            'full_name': 'Dr. Priya Patel'
        }
    ]

    # Sample patients with diverse health conditions
    patients = [
        {
            'id': str(uuid.uuid4()),
            'username': 'raj_kumar',
            'password': 'patient123',
            'role': 'patient',
            'full_name': 'Raj Kumar',
            'condition': 'Hypertension'
        },
        {
            'id': str(uuid.uuid4()),
            'username': 'meera_sharma',
            'password': 'patient123',
            'role': 'patient',
            'full_name': 'Meera Sharma',
            'condition': 'Diabetes'
        },
        {
            'id': str(uuid.uuid4()),
            'username': 'arun_kumar',
            'password': 'patient123',
            'role': 'patient',
            'full_name': 'Arun Kumar',
            'condition': 'Healthy'
        },
        {
            'id': str(uuid.uuid4()),
            'username': 'lakshmi_devi',
            'password': 'patient123',
            'role': 'patient',
            'full_name': 'Lakshmi Devi',
            'condition': 'Fever'
        },
        {
            'id': str(uuid.uuid4()),
            'username': 'suresh_babu',
            'password': 'patient123',
            'role': 'patient',
            'full_name': 'Suresh Babu',
            'condition': 'Respiratory'
        }
    ]

    # Insert doctors
    for doctor in doctors:
        cursor.execute('''
            INSERT INTO users (id, username, password, role, full_name)
            VALUES (?, ?, ?, ?, ?)
        ''', (doctor['id'], doctor['username'], doctor['password'], doctor['role'], doctor['full_name']))
        print(f"✓ Created doctor: {doctor['full_name']} ({doctor['username']})")

    # Insert patients
    for patient in patients:
        cursor.execute('''
            INSERT INTO users (id, username, password, role, full_name)
            VALUES (?, ?, ?, ?, ?)
        ''', (patient['id'], patient['username'], patient['password'], patient['role'], patient['full_name']))
        print(f"✓ Created patient: {patient['full_name']} ({patient['username']}) - {patient['condition']}")

    # Create doctor-patient mappings
    doctor_patient_mappings = [
        (doctors[0]['id'], patients[0]['id']),  # Dr. Smith -> Raj Kumar
        (doctors[0]['id'], patients[1]['id']),  # Dr. Smith -> Meera Sharma
        (doctors[0]['id'], patients[2]['id']),  # Dr. Smith -> Arun Kumar
        (doctors[1]['id'], patients[3]['id']),  # Dr. Patel -> Lakshmi Devi
        (doctors[1]['id'], patients[4]['id']),  # Dr. Patel -> Suresh Babu
    ]

    for doctor_id, patient_id in doctor_patient_mappings:
        cursor.execute('''
            INSERT INTO doctor_patients (id, doctor_id, patient_id)
            VALUES (?, ?, ?)
        ''', (str(uuid.uuid4()), doctor_id, patient_id))

    print("✓ Created doctor-patient assignments")

    # Generate comprehensive health data for each patient
    base_time = datetime.now() - timedelta(days=7)

    # Raj Kumar - Hypertension (High Risk)
    print("Generating data for Raj Kumar (Hypertension)...")
    for i in range(20):
        timestamp = base_time + timedelta(hours=i*2)
        cursor.execute('''
            INSERT INTO health_data (user_id, heart_rate, spo2, temperature, systolic, diastolic, glucose, risk_level, timestamp)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
        ''', (
            patients[0]['id'],
            random.randint(85, 105),  # High heart rate
            random.randint(92, 96),   # Normal SPO2
            round(random.uniform(36.8, 37.5), 1),  # Normal temp
            random.randint(155, 175), # High systolic
            random.randint(95, 105),  # High diastolic
            random.randint(90, 110),  # Normal glucose
            'High',
            timestamp
        ))

    # Meera Sharma - Diabetes (Medium Risk)
    print("Generating data for Meera Sharma (Diabetes)...")
    for i in range(20):
        timestamp = base_time + timedelta(hours=i*2)
        cursor.execute('''
            INSERT INTO health_data (user_id, heart_rate, spo2, temperature, systolic, diastolic, glucose, risk_level, timestamp)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
        ''', (
            patients[1]['id'],
            random.randint(70, 85),   # Normal heart rate
            random.randint(95, 98),   # Good SPO2
            round(random.uniform(36.5, 37.2), 1),  # Normal temp
            random.randint(130, 145), # Slightly high systolic
            random.randint(80, 90),   # Normal diastolic
            random.randint(140, 180), # High glucose
            'Medium',
            timestamp
        ))

    # Arun Kumar - Healthy (Low Risk)
    print("Generating data for Arun Kumar (Healthy)...")
    for i in range(20):
        timestamp = base_time + timedelta(hours=i*2)
        cursor.execute('''
            INSERT INTO health_data (user_id, heart_rate, spo2, temperature, systolic, diastolic, glucose, risk_level, timestamp)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
        ''', (
            patients[2]['id'],
            random.randint(65, 75),   # Normal heart rate
            random.randint(97, 99),   # Excellent SPO2
            round(random.uniform(36.2, 36.8), 1),  # Normal temp
            random.randint(110, 125), # Normal systolic
            random.randint(70, 80),   # Normal diastolic
            random.randint(80, 100),  # Normal glucose
            'Low',
            timestamp
        ))

    # Lakshmi Devi - Fever (Medium Risk)
    print("Generating data for Lakshmi Devi (Fever)...")
    for i in range(20):
        timestamp = base_time + timedelta(hours=i*2)
        # Simulate fever that comes down over time
        temp_variation = 39.5 - (i * 0.1) if i < 10 else 37.5 + random.uniform(-0.3, 0.3)
        cursor.execute('''
            INSERT INTO health_data (user_id, heart_rate, spo2, temperature, systolic, diastolic, glucose, risk_level, timestamp)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
        ''', (
            patients[3]['id'],
            random.randint(80, 95),   # Slightly elevated heart rate
            random.randint(93, 97),   # Normal SPO2
            round(max(36.5, min(40.0, temp_variation)), 1),  # Fever temp
            random.randint(115, 135), # Normal systolic
            random.randint(75, 85),   # Normal diastolic
            random.randint(85, 105),  # Normal glucose
            'Medium',
            timestamp
        ))

    # Suresh Babu - Respiratory (High Risk)
    print("Generating data for Suresh Babu (Respiratory)...")
    for i in range(20):
        timestamp = base_time + timedelta(hours=i*2)
        cursor.execute('''
            INSERT INTO health_data (user_id, heart_rate, spo2, temperature, systolic, diastolic, glucose, risk_level, timestamp)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
        ''', (
            patients[4]['id'],
            random.randint(90, 110),  # High heart rate
            random.randint(85, 92),   # Low SPO2
            round(random.uniform(37.5, 38.5), 1),  # Slightly elevated temp
            random.randint(125, 145), # Elevated systolic
            random.randint(80, 95),   # Normal diastolic
            random.randint(95, 115),  # Normal glucose
            'High',
            timestamp
        ))

    conn.commit()
    conn.close()

    print("✓ Generated comprehensive health data for all patients")
    print("\n" + "="*60)
    print("COMPREHENSIVE DEMO DATA CREATED SUCCESSFULLY!")
    print("="*60)
    print("\nDOCTOR ACCOUNTS:")
    for doctor in doctors:
        print(f"  Name: {doctor['full_name']}")
        print(f"  Username: {doctor['username']}")
        print(f"  Password: {doctor['password']}")
        print()

    print("PATIENT ACCOUNTS:")
    for patient in patients:
        print(f"  Name: {patient['full_name']}")
        print(f"  Username: {patient['username']}")
        print(f"  Password: {patient['password']}")
        print(f"  Condition: {patient['condition']}")
        print()

    print("ASSIGNMENTS:")
    print("  Dr. John Smith -> Raj Kumar (Hypertension), Meera Sharma (Diabetes), Arun Kumar (Healthy)")
    print("  Dr. Priya Patel -> Lakshmi Devi (Fever), Suresh Babu (Respiratory)")
    print("\nSAMPLE HEALTH DATA GENERATED:")
    print("  • 20 readings per patient over 7 days")
    print("  • Realistic vital signs based on conditions")
    print("  • Proper risk level calculations")
    print("\nYou can now login and generate reports!")

if __name__ == '__main__':
    create_comprehensive_demo_data()