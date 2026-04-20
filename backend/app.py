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
    conn.commit()
    conn.close()

init_db()

# --- Auth Endpoints ---

@app.route('/signup', methods=['POST'])
def signup():
    data = request.json
    print(f"Signup attempt: {data.get('username')} as {data.get('role')}")
    uid = str(uuid.uuid4())
    conn = get_db_connection()
    try:
        conn.execute('INSERT INTO users (id, username, password, role, full_name) VALUES (?, ?, ?, ?, ?)',
                     (uid, data['username'], data['password'], data['role'], data['full_name']))
        conn.commit()
        print(f"Signup successful: {data.get('username')}")
        return jsonify({"message": "User created", "user": {"id": uid, "role": data['role'], "full_name": data['full_name']}})
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

if __name__ == '__main__':
    print(f"Starting server... Database: {os.path.abspath(DB_PATH)}")
    app.run(debug=True, port=5000)
