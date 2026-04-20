import sqlite3
from flask import Flask, request, jsonify
from flask_cors import CORS
from datetime import datetime
import os
import uuid

app = Flask(__name__)
CORS(app)

DB_PATH = 'health_monitoring.db'

def get_db_connection():
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    return conn

def init_db():
    conn = get_db_connection()
    cursor = conn.cursor()
    # Users table
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS users (
            id TEXT PRIMARY KEY,
            username TEXT UNIQUE,
            password TEXT,
            role TEXT, -- 'patient' or 'doctor'
            full_name TEXT
        )
    ''')
    # Devices table
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS devices (
            id TEXT PRIMARY KEY,
            name TEXT,
            status TEXT, -- 'online', 'offline'
            user_id TEXT,
            FOREIGN KEY(user_id) REFERENCES users(id)
        )
    ''')
    # Health Data table (updated with user_id)
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS health_data (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            user_id TEXT,
            heart_rate INTEGER,
            spo2 INTEGER,
            temperature REAL,
            systolic INTEGER,
            diastolic INTEGER,
            glucose INTEGER,
            risk_level TEXT,
            timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY(user_id) REFERENCES users(id)
        )
    ''')
    # Doctor-Patient mapping table
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS doctor_patients (
            id TEXT PRIMARY KEY,
            doctor_id TEXT,
            patient_id TEXT,
            assigned_date DATETIME DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY(doctor_id) REFERENCES users(id),
            FOREIGN KEY(patient_id) REFERENCES users(id),
            UNIQUE(doctor_id, patient_id)
        )
    ''')
    conn.commit()
    conn.close()

init_db()

# --- Auth Endpoints ---

@app.route('/signup', methods=['POST'])
def signup():
    data = request.json
    print(f"Signup attempt: {data.get('username')} as {data.get('role')}")
    
    conn = get_db_connection()
    # Check if username already exists
    existing_user = conn.execute('SELECT * FROM users WHERE username = ?', (data['username'],)).fetchone()
    if existing_user:
        conn.close()
        return jsonify({"error": "Username already exists"}), 400
    
    uid = str(uuid.uuid4())
    try:
        conn.execute('INSERT INTO users (id, username, password, role, full_name) VALUES (?, ?, ?, ?, ?)',
                     (uid, data['username'], data['password'], data['role'], data['full_name']))
        conn.commit()
        print(f"Signup successful: {data.get('username')}")
        return jsonify({"message": "User created", "user": {"id": uid, "role": data['role'], "full_name": data['full_name']}})
    except sqlite3.IntegrityError as e:
        print(f"Signup failed (IntegrityError): {str(e)}")
        if "UNIQUE constraint failed: users.username" in str(e):
            return jsonify({"error": "Username already exists. Please choose a different one."}), 400
        return jsonify({"error": "Database error occurred during signup."}), 400
    except Exception as e:
        print(f"Signup failed: {str(e)}")
        return jsonify({"error": str(e)}), 400
    finally:
        conn.close()

@app.route('/login', methods=['POST'])
def login():
    data = request.json
    print(f"Login attempt: {data.get('username')}")
    conn = get_db_connection()
    user = conn.execute('SELECT * FROM users WHERE username = ? AND password = ?', 
                        (data['username'], data['password'])).fetchone()
    conn.close()
    if user:
        user_dict = dict(user)
        print(f"Login successful: {user_dict['username']} (Role: {user_dict['role']})")
        return jsonify({"user": user_dict})
    print(f"Login failed: Invalid credentials for {data.get('username')}")
    return jsonify({"error": "Invalid credentials"}), 401

# --- Health Data Endpoints ---

def analyze_risk(data):
    score = 0
    hr = data.get("heart_rate", 80)
    spo2 = data.get("spo2", 98)
    temp = data.get("temperature", 37.0)
    sys = data.get("systolic", 120)
    dia = data.get("diastolic", 80)
    glu = data.get("glucose", 90)

    if hr > 100 or hr < 60: score += 1
    if spo2 < 94: score += 2
    if spo2 < 90: score += 3
    if temp > 38.0 or temp < 35.0: score += 1
    if sys > 140 or dia > 90: score += 2
    if glu > 140 or glu < 70: score += 1

    if score >= 4: return "High"
    if score >= 2: return "Medium"
    return "Low"

@app.route('/upload-data', methods=['POST'])
def upload_data():
    data = request.json
    user_id = data.get("user_id", "default_patient") # For simulation fallback
    
    risk_level = analyze_risk(data)

    conn = get_db_connection()
    conn.execute("""INSERT INTO health_data (user_id, heart_rate, spo2, temperature, systolic, diastolic, glucose, risk_level, timestamp)
                    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)""",
                 (user_id, data.get("heart_rate"), data.get("spo2"), data.get("temperature"), 
                  data.get("systolic", 120), data.get("diastolic", 80), data.get("glucose", 90), 
                  risk_level, datetime.now()))
    conn.commit()
    conn.close()
    return jsonify({"message": "Data stored", "risk_level": risk_level})

@app.route('/get-data', methods=['GET'])
def get_data():
    user_id = request.args.get("user_id")
    conn = get_db_connection()
    if user_id:
        rows = conn.execute("SELECT * FROM health_data WHERE user_id = ? ORDER BY timestamp DESC LIMIT 50", (user_id,)).fetchall()
    else:
        rows = conn.execute("SELECT * FROM health_data ORDER BY timestamp DESC LIMIT 50").fetchall()
    conn.close()
    return jsonify([dict(row) for row in rows])

@app.route('/get-patients', methods=['GET'])
def get_patients():
    conn = get_db_connection()
    rows = conn.execute("SELECT id, full_name, role FROM users WHERE role = 'patient'").fetchall()
    conn.close()
    return jsonify([dict(row) for row in rows])

@app.route('/get-devices', methods=['GET'])
def get_devices():
    user_id = request.args.get("user_id")
    conn = get_db_connection()
    if user_id:
        rows = conn.execute("SELECT * FROM devices WHERE user_id = ?", (user_id,)).fetchall()
    else:
        rows = conn.execute("SELECT * FROM devices").fetchall()
    conn.close()
    return jsonify([dict(row) for row in rows])

@app.route('/add-device', methods=['POST'])
def add_device():
    data = request.json
    conn = get_db_connection()
    conn.execute('INSERT INTO devices (id, name, status, user_id) VALUES (?, ?, ?, ?)',
                 (str(uuid.uuid4()), data['name'], 'online', data['user_id']))
    conn.commit()
    conn.close()
    return jsonify({"message": "Device added"})

@app.route('/alerts', methods=['GET'])
def alerts():
    user_id = request.args.get("user_id")
    conn = get_db_connection()
    if user_id:
        row = conn.execute("SELECT * FROM health_data WHERE user_id = ? ORDER BY timestamp DESC LIMIT 1", (user_id,)).fetchone()
    else:
        row = conn.execute("SELECT * FROM health_data ORDER BY timestamp DESC LIMIT 1").fetchone()
    conn.close()

    alerts_list = []
    if row:
        if row['heart_rate'] > 100: alerts_list.append("High Heart Rate")
        if row['spo2'] < 92: alerts_list.append("Low SpO2")
        if row['temperature'] > 38: alerts_list.append("Fever Detected")
        if row['systolic'] > 140: alerts_list.append("High Blood Pressure")

    return jsonify({"alerts": alerts_list, "current_risk": row['risk_level'] if row else "Unknown"})

# --- Doctor-Patient Mapping Endpoints ---

@app.route('/get-available-patients', methods=['GET'])
def get_available_patients():
    doctor_id = request.args.get("doctor_id")
    conn = get_db_connection()
    
    # Get all patients that are not yet assigned to this doctor
    rows = conn.execute("""
        SELECT id, full_name FROM users 
        WHERE role = 'patient' 
        AND id NOT IN (
            SELECT patient_id FROM doctor_patients WHERE doctor_id = ?
        )
    """, (doctor_id,)).fetchall()
    conn.close()
    return jsonify([dict(row) for row in rows])

@app.route('/add-patient-to-doctor', methods=['POST'])
def add_patient_to_doctor():
    data = request.json
    doctor_id = data.get("doctor_id")
    patient_id = data.get("patient_id")
    
    conn = get_db_connection()
    try:
        conn.execute("""INSERT INTO doctor_patients (id, doctor_id, patient_id) 
                        VALUES (?, ?, ?)""",
                     (str(uuid.uuid4()), doctor_id, patient_id))
        conn.commit()
        conn.close()
        return jsonify({"message": "Patient added successfully"})
    except sqlite3.IntegrityError:
        conn.close()
        return jsonify({"error": "Patient already assigned to this doctor"}), 400
    except Exception as e:
        conn.close()
        return jsonify({"error": str(e)}), 400

@app.route('/get-assigned-patients', methods=['GET'])
def get_assigned_patients():
    doctor_id = request.args.get("doctor_id")
    conn = get_db_connection()
    
    rows = conn.execute("""
        SELECT u.id, u.full_name, dp.assigned_date FROM users u
        INNER JOIN doctor_patients dp ON u.id = dp.patient_id
        WHERE dp.doctor_id = ?
        ORDER BY dp.assigned_date DESC
    """, (doctor_id,)).fetchall()
    conn.close()
    return jsonify([dict(row) for row in rows])

@app.route('/generate-report', methods=['GET'])
def generate_report():
    patient_id = request.args.get("patient_id")
    language = request.args.get("language", "English")  # English or Tamil
    
    conn = get_db_connection()
    
    # Get patient info
    patient = conn.execute("SELECT * FROM users WHERE id = ?", (patient_id,)).fetchone()
    
    # Get latest health data
    latest_data = conn.execute("""
        SELECT * FROM health_data WHERE user_id = ? 
        ORDER BY timestamp DESC LIMIT 1
    """, (patient_id,)).fetchone()
    
    # Get average readings (last 7 readings)
    health_records = conn.execute("""
        SELECT * FROM health_data WHERE user_id = ? 
        ORDER BY timestamp DESC LIMIT 7
    """, (patient_id,)).fetchall()
    
    conn.close()
    
    if not patient:
        return jsonify({"error": "Patient not found"}), 404
    
    # Calculate averages
    avg_hr = sum([r['heart_rate'] for r in health_records]) / len(health_records) if health_records else 0
    avg_spo2 = sum([r['spo2'] for r in health_records]) / len(health_records) if health_records else 0
    avg_temp = sum([r['temperature'] for r in health_records]) / len(health_records) if health_records else 0
    avg_sys = sum([r['systolic'] for r in health_records]) / len(health_records) if health_records else 0
    avg_dia = sum([r['diastolic'] for r in health_records]) / len(health_records) if health_records else 0
    avg_glucose = sum([r['glucose'] for r in health_records]) / len(health_records) if health_records else 0
    
    # Language dictionaries
    labels = {
        "English": {
            "title": "Health Report",
            "patient_name": "Patient Name",
            "patient_id": "Patient ID",
            "report_date": "Report Date",
            "heart_rate": "Heart Rate (BPM)",
            "spo2": "Blood Oxygen (SpO2) %",
            "temperature": "Temperature (°C)",
            "systolic": "Systolic BP (mmHg)",
            "diastolic": "Diastolic BP (mmHg)",
            "glucose": "Glucose (mg/dL)",
            "latest": "Latest Reading",
            "average": "7-Day Average",
            "risk_level": "Current Risk Level",
            "status": "Health Status",
            "recommendations": "Recommendations",
            "normal": "Normal",
            "monitor": "Monitor regularly",
            "consult": "Consult doctor"
        },
        "Tamil": {
            "title": "சுகாதார அறிக்கை",
            "patient_name": "நோயாளியின் பெயர்",
            "patient_id": "நோயாளி ID",
            "report_date": "அறிக்கை தேதி",
            "heart_rate": "இதய துடிப்பு (BPM)",
            "spo2": "இரத இராசியன் நிலை (SpO2) %",
            "temperature": "வெப்பநிலை (°C)",
            "systolic": "சிস்டலிக் BP (mmHg)",
            "diastolic": "டায়াস்টலிக் BP (mmHg)",
            "glucose": "குளுக்கோஸ் (mg/dL)",
            "latest": "சமீபத்திய வாசிப்பு",
            "average": "7 நாள் சராசரி",
            "risk_level": "தற்போதைய ঝுக்கம் நிலை",
            "status": "சுகாதார நிலை",
            "recommendations": "பரிந்துரைகள்",
            "normal": "சாதாரணமானது",
            "monitor": "தவறாமல் கண்காணிக்கவும்",
            "consult": "மருத்துவரை அணுகவும்"
        }
    }
    
    lang = labels.get(language, labels["English"])
    
    report = {
        "title": lang["title"],
        "patient": {
            "name": patient['full_name'],
            "id": patient_id
        },
        "report_date": datetime.now().strftime("%Y-%m-%d %H:%M"),
        "latest_reading": {
            lang["heart_rate"]: latest_data['heart_rate'] if latest_data else "--",
            lang["spo2"]: latest_data['spo2'] if latest_data else "--",
            lang["temperature"]: latest_data['temperature'] if latest_data else "--",
            lang["systolic"]: latest_data['systolic'] if latest_data else "--",
            lang["diastolic"]: latest_data['diastolic'] if latest_data else "--",
            lang["glucose"]: latest_data['glucose'] if latest_data else "--",
        },
        "average_7_days": {
            lang["heart_rate"]: round(avg_hr, 1),
            lang["spo2"]: round(avg_spo2, 1),
            lang["temperature"]: round(avg_temp, 1),
            lang["systolic"]: round(avg_sys, 1),
            lang["diastolic"]: round(avg_dia, 1),
            lang["glucose"]: round(avg_glucose, 1),
        },
        "risk_level": latest_data['risk_level'] if latest_data else "Unknown",
        "language": language
    }
    
    return jsonify(report)

if __name__ == '__main__':
    print(f"Starting server... Database: {os.path.abspath(DB_PATH)}")
    app.run(debug=True, host='0.0.0.0', port=5001)

