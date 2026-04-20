import sqlite3
import uuid
from datetime import datetime

def create_dummy_users():
    conn = sqlite3.connect('health_monitoring.db')
    cursor = conn.cursor()

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

    # Sample patients
    patients = [
        {
            'id': str(uuid.uuid4()),
            'username': 'patient1',
            'password': 'patient123',
            'role': 'patient',
            'full_name': 'Raj Kumar'
        },
        {
            'id': str(uuid.uuid4()),
            'username': 'patient2',
            'password': 'patient123',
            'role': 'patient',
            'full_name': 'Meera Sharma'
        },
        {
            'id': str(uuid.uuid4()),
            'username': 'patient3',
            'password': 'patient123',
            'role': 'patient',
            'full_name': 'Arun Kumar'
        },
        {
            'id': str(uuid.uuid4()),
            'username': 'patient4',
            'password': 'patient123',
            'role': 'patient',
            'full_name': 'Lakshmi Devi'
        },
        {
            'id': str(uuid.uuid4()),
            'username': 'patient5',
            'password': 'patient123',
            'role': 'patient',
            'full_name': 'Suresh Babu'
        }
    ]

    # Insert doctors
    for doctor in doctors:
        try:
            cursor.execute('''
                INSERT INTO users (id, username, password, role, full_name)
                VALUES (?, ?, ?, ?, ?)
            ''', (doctor['id'], doctor['username'], doctor['password'], doctor['role'], doctor['full_name']))
            print(f"✓ Created doctor: {doctor['full_name']} (username: {doctor['username']})")
        except sqlite3.IntegrityError:
            print(f"⚠ Doctor {doctor['username']} already exists")

    # Insert patients
    for patient in patients:
        try:
            cursor.execute('''
                INSERT INTO users (id, username, password, role, full_name)
                VALUES (?, ?, ?, ?, ?)
            ''', (patient['id'], patient['username'], patient['password'], patient['role'], patient['full_name']))
            print(f"✓ Created patient: {patient['full_name']} (username: {patient['username']})")
        except sqlite3.IntegrityError:
            print(f"⚠ Patient {patient['username']} already exists")

    # Create doctor-patient mappings
    doctor_patient_mappings = [
        (doctors[0]['id'], patients[0]['id']),  # Dr. Smith -> Raj Kumar
        (doctors[0]['id'], patients[1]['id']),  # Dr. Smith -> Meera Sharma
        (doctors[0]['id'], patients[2]['id']),  # Dr. Smith -> Arun Kumar
        (doctors[1]['id'], patients[3]['id']),  # Dr. Patel -> Lakshmi Devi
        (doctors[1]['id'], patients[4]['id']),  # Dr. Patel -> Suresh Babu
    ]

    for doctor_id, patient_id in doctor_patient_mappings:
        try:
            cursor.execute('''
                INSERT INTO doctor_patients (id, doctor_id, patient_id)
                VALUES (?, ?, ?)
            ''', (str(uuid.uuid4()), doctor_id, patient_id))
            print(f"✓ Assigned patient to doctor")
        except sqlite3.IntegrityError:
            print("⚠ Patient already assigned to this doctor")

    # Add some sample health data for patients
    sample_health_data = [
        # Raj Kumar (High risk)
        (patients[0]['id'], 95, 85, 39.2, 160, 95, 180, 'High'),
        (patients[0]['id'], 92, 88, 38.8, 155, 92, 175, 'High'),
        (patients[0]['id'], 98, 82, 39.5, 165, 98, 185, 'High'),

        # Meera Sharma (Medium risk)
        (patients[1]['id'], 78, 96, 37.1, 135, 85, 120, 'Medium'),
        (patients[1]['id'], 82, 94, 37.3, 138, 88, 125, 'Medium'),
        (patients[1]['id'], 75, 97, 36.9, 132, 82, 118, 'Medium'),

        # Arun Kumar (Low risk)
        (patients[2]['id'], 72, 98, 36.5, 118, 75, 95, 'Low'),
        (patients[2]['id'], 70, 99, 36.3, 115, 72, 92, 'Low'),
        (patients[2]['id'], 74, 97, 36.7, 120, 78, 98, 'Low'),

        # Lakshmi Devi (Medium risk)
        (patients[3]['id'], 85, 93, 37.8, 145, 90, 140, 'Medium'),
        (patients[3]['id'], 88, 91, 38.1, 148, 93, 145, 'Medium'),

        # Suresh Babu (Low risk)
        (patients[4]['id'], 68, 99, 36.2, 125, 80, 105, 'Low'),
        (patients[4]['id'], 71, 98, 36.4, 122, 77, 102, 'Low'),
    ]

    for patient_id, heart_rate, spo2, temp, sys, dia, glucose, risk in sample_health_data:
        cursor.execute('''
            INSERT INTO health_data (user_id, heart_rate, spo2, temperature, systolic, diastolic, glucose, risk_level, timestamp)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
        ''', (patient_id, heart_rate, spo2, temp, sys, dia, glucose, risk, datetime.now()))

    print("✓ Added sample health data for patients")

    conn.commit()
    conn.close()

    print("\n" + "="*50)
    print("DUMMY USERS CREATED SUCCESSFULLY!")
    print("="*50)
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
        print()

    print("ASSIGNMENTS:")
    print("  Dr. John Smith -> Raj Kumar, Meera Sharma, Arun Kumar")
    print("  Dr. Priya Patel -> Lakshmi Devi, Suresh Babu")
    print("\nYou can now login with these credentials!")

if __name__ == '__main__':
    create_dummy_users()