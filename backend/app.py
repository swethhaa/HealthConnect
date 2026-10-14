import sqlite3
import re
import math
import numbers
import secrets
import threading
import time
from functools import wraps
from flask import Flask, request, jsonify, g
from flask_cors import CORS
from datetime import datetime
import os
import uuid
from simulation_config import (
    ABNORMAL_RANGES,
    NORMAL_RANGES,
    RISK_THRESHOLDS,
    SIMULATION_INTERVAL_MAX_SECONDS,
    SIMULATION_INTERVAL_MIN_SECONDS,
    generate_reading,
)

app = Flask(__name__)
CORS(app)

DB_PATH = os.environ.get(
    "HEALTHCONNECT_DB_PATH",
    "health_monitoring.db",
)
AUTH_SESSIONS = {}
SIMULATIONS = {}
SIMULATION_LOCK = threading.Lock()

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
            source TEXT NOT NULL DEFAULT 'unknown',
            simulation_mode TEXT,
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
    health_columns = {
        row["name"] for row in cursor.execute("PRAGMA table_info(health_data)")
    }
    if "source" not in health_columns:
        cursor.execute(
            "ALTER TABLE health_data ADD COLUMN source TEXT NOT NULL DEFAULT 'unknown'"
        )
    if "simulation_mode" not in health_columns:
        cursor.execute("ALTER TABLE health_data ADD COLUMN simulation_mode TEXT")
    conn.commit()
    conn.close()

init_db()


def authenticated(role=None):
    def decorator(view):
        @wraps(view)
        def wrapped(*args, **kwargs):
            authorization = request.headers.get("Authorization", "")
            scheme, _, token = authorization.partition(" ")
            session = AUTH_SESSIONS.get(token) if scheme.lower() == "bearer" else None
            if session and session["expires_at"] <= time.time():
                AUTH_SESSIONS.pop(token, None)
                session = None
            if not session:
                return jsonify({"error": "Authentication required"}), 401
            if role and session["role"] != role:
                return jsonify({"error": "This account is not permitted to perform this action"}), 403
            g.current_user = session
            return view(*args, **kwargs)
        return wrapped
    return decorator


def can_access_patient(patient_id):
    current_user = g.current_user
    if current_user["role"] == "patient":
        return patient_id == current_user["id"]
    if current_user["role"] != "doctor":
        return False
    conn = get_db_connection()
    assignment = conn.execute(
        "SELECT 1 FROM doctor_patients WHERE doctor_id = ? AND patient_id = ?",
        (current_user["id"], patient_id),
    ).fetchone()
    conn.close()
    return assignment is not None


def authorized_patient_id(requested_id):
    current_user = g.current_user
    if current_user["role"] == "patient":
        if requested_id and requested_id != current_user["id"]:
            return None
        return current_user["id"]
    if requested_id and can_access_patient(requested_id):
        return requested_id
    return None


# --- Auth Endpoints ---

@app.route('/signup', methods=['POST'])
def signup():
    data = request.get_json(silent=True)
    if not isinstance(data, dict):
        return jsonify({"error": "A JSON registration is required"}), 400
    if any(not isinstance(data.get(field), str) or not data[field].strip()
           for field in ("username", "full_name", "role")):
        return jsonify({"error": "Username, full name, and role are required"}), 400
    if data["role"] not in ("patient", "doctor"):
        return jsonify({"error": "Role must be patient or doctor"}), 400
    print(f"Signup attempt: {data.get('username')} as {data.get('role')}")

    password = data.get('password')
    if (not isinstance(password, str) or len(password) < 8
            or not re.search(r'[A-Z]', password)
            or not re.search(r'[a-z]', password)
            or not re.search(r'[^A-Za-z0-9]', password)):
        return jsonify({
            "error": "Password must be at least 8 characters and include an uppercase letter, a lowercase letter, and a special character."
        }), 400
    
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
    data = request.get_json(silent=True)
    if not isinstance(data, dict):
        return jsonify({"error": "A JSON login request is required"}), 400
    if not isinstance(data.get("username"), str) or not isinstance(data.get("password"), str):
        return jsonify({"error": "Username and password are required"}), 400
    print(f"Login attempt: {data.get('username')}")
    conn = get_db_connection()
    user = conn.execute('SELECT * FROM users WHERE username = ? AND password = ?', 
                        (data['username'], data['password'])).fetchone()
    conn.close()
    if user:
        user_dict = dict(user)
        token = secrets.token_urlsafe(32)
        AUTH_SESSIONS[token] = {
            "id": user_dict["id"],
            "role": user_dict["role"],
            "expires_at": time.time() + 12 * 60 * 60,
        }
        user_dict.pop("password", None)
        print(f"Login successful: {user_dict['username']} (Role: {user_dict['role']})")
        return jsonify({"user": user_dict, "token": token})
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

    if hr > RISK_THRESHOLDS["heart_rate"]["high"] or hr < RISK_THRESHOLDS["heart_rate"]["low"]:
        score += 1
    if spo2 < RISK_THRESHOLDS["spo2"]["low_below"]: score += 2
    if spo2 < RISK_THRESHOLDS["spo2"]["critical_below"]: score += 3
    if (
        temp > RISK_THRESHOLDS["temperature"]["high_above"]
        or temp < RISK_THRESHOLDS["temperature"]["low_below"]
    ):
        score += 1
    if (
        sys > RISK_THRESHOLDS["systolic"]["high_above"]
        or dia > RISK_THRESHOLDS["diastolic"]["high_above"]
    ):
        score += 2
    if (
        glu > RISK_THRESHOLDS["glucose"]["high_above"]
        or glu < RISK_THRESHOLDS["glucose"]["low_below"]
    ):
        score += 1

    if score >= 4: return "High"
    if score >= 2: return "Medium"
    return "Low"


def validate_reading(data):
    fields = {
        "heart_rate": (60, 20, 250, True),
        "spo2": (98, 50, 100, True),
        "temperature": (37.0, 25.0, 45.0, False),
        "systolic": (120, 50, 300, True),
        "diastolic": (80, 30, 200, True),
        "glucose": (90, 20, 1000, True),
    }
    values = {}
    for name, (default, minimum, maximum, integer) in fields.items():
        value = data.get(name, default)
        if isinstance(value, bool) or not isinstance(value, numbers.Real):
            raise ValueError(f"{name} must be a number")
        if value < minimum or value > maximum or not math.isfinite(float(value)):
            raise ValueError(f"{name} must be between {minimum} and {maximum}")
        if integer and not float(value).is_integer():
            raise ValueError(f"{name} must be a whole number")
        values[name] = int(value) if integer else float(value)
    if values["systolic"] <= values["diastolic"]:
        raise ValueError("systolic must be greater than diastolic")
    return values


def store_health_reading(user_id, data, source="recorded", simulation_mode=None):
    values = validate_reading(data)
    risk_level = analyze_risk(values)
    timestamp = datetime.now().isoformat(sep=" ", timespec="seconds")
    conn = get_db_connection()
    try:
        conn.execute(
            """INSERT INTO health_data
               (user_id, heart_rate, spo2, temperature, systolic, diastolic, glucose,
                risk_level, timestamp, source, simulation_mode)
               VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)""",
            (
                user_id,
                values["heart_rate"],
                values["spo2"],
                values["temperature"],
                values["systolic"],
                values["diastolic"],
                values["glucose"],
                risk_level,
                timestamp,
                source,
                simulation_mode,
            ),
        )
        conn.commit()
    finally:
        conn.close()
    return {"risk_level": risk_level, "timestamp": timestamp}


@app.route('/upload-data', methods=['POST'])
@authenticated(role="patient")
def upload_data():
    data = request.get_json(silent=True)
    if not isinstance(data, dict):
        return jsonify({"error": "A JSON reading is required"}), 400
    requested_id = data.get("user_id")
    if requested_id and requested_id != g.current_user["id"]:
        return jsonify({"error": "Patients can only upload readings for their own account"}), 403
    try:
        result = store_health_reading(g.current_user["id"], data)
    except ValueError as error:
        return jsonify({"error": str(error)}), 400
    return jsonify({"message": "Data stored", **result})

@app.route('/get-data', methods=['GET'])
@authenticated()
def get_data():
    user_id = authorized_patient_id(request.args.get("user_id"))
    if not user_id:
        return jsonify({"error": "Patient not found or access denied"}), 403
    period = request.args.get("period")
    conn = get_db_connection()
    if period:
        period_days = {"Today": 1, "7 Days": 7, "30 Days": 30}
        bucket_minutes = {"Today": 5, "7 Days": 15, "30 Days": 60}
        if period not in period_days:
            conn.close()
            return jsonify({"error": "period must be Today, 7 Days, or 30 Days"}), 400
        end = datetime.now()
        start = end
        if period == "Today":
            start = start.replace(hour=0, minute=0, second=0, microsecond=0)
        else:
            start = start.timestamp() - period_days[period] * 86400
            start = datetime.fromtimestamp(start)
        rows = conn.execute(
            """SELECT MAX(id) AS id, user_id, ROUND(AVG(heart_rate), 1) AS heart_rate,
                      ROUND(AVG(spo2), 1) AS spo2, ROUND(AVG(temperature), 1) AS temperature,
                      ROUND(AVG(systolic), 1) AS systolic, ROUND(AVG(diastolic), 1) AS diastolic,
                      ROUND(AVG(glucose), 1) AS glucose, MAX(timestamp) AS timestamp,
                      MAX(source = 'simulation') AS simulated,
                      MAX(source = 'unknown') AS unverified,
                      CASE WHEN SUM(simulation_mode = 'abnormal') > 0 THEN 'abnormal'
                           WHEN SUM(simulation_mode = 'normal') > 0 THEN 'normal' ELSE NULL END AS simulation_mode,
                      COUNT(*) AS reading_count
               FROM health_data
               WHERE user_id = ? AND timestamp >= ? AND timestamp <= ?
               GROUP BY CAST(strftime('%s', timestamp) AS INTEGER) / ?
               ORDER BY timestamp ASC""",
            (
                user_id,
                start.isoformat(sep=" ", timespec="seconds"),
                end.isoformat(sep=" ", timespec="seconds"),
                bucket_minutes[period] * 60,
            ),
        ).fetchall()
    else:
        rows = conn.execute(
            "SELECT * FROM health_data WHERE user_id = ? ORDER BY timestamp DESC, id DESC LIMIT 50",
            (user_id,),
        ).fetchall()
    conn.close()
    return jsonify([dict(row) for row in rows])

@app.route('/get-patients', methods=['GET'])
@authenticated(role="doctor")
def get_patients():
    conn = get_db_connection()
    rows = conn.execute(
        """SELECT u.id, u.full_name, u.role FROM users u
           INNER JOIN doctor_patients dp ON dp.patient_id = u.id
           WHERE dp.doctor_id = ? AND u.role = 'patient'""",
        (g.current_user["id"],),
    ).fetchall()
    conn.close()
    return jsonify([dict(row) for row in rows])

@app.route('/get-devices', methods=['GET'])
@authenticated(role="patient")
def get_devices():
    user_id = request.args.get("user_id")
    if user_id and user_id != g.current_user["id"]:
        return jsonify({"error": "Patients can only view their own devices"}), 403
    conn = get_db_connection()
    rows = conn.execute(
        "SELECT * FROM devices WHERE user_id = ?", (g.current_user["id"],)
    ).fetchall()
    conn.close()
    return jsonify([dict(row) for row in rows])

@app.route('/add-device', methods=['POST'])
@authenticated(role="patient")
def add_device():
    data = request.get_json(silent=True)
    if not isinstance(data, dict):
        return jsonify({"error": "A JSON device is required"}), 400
    if not isinstance(data.get("name"), str) or not data["name"].strip():
        return jsonify({"error": "A device name is required"}), 400
    if data.get("user_id") and data["user_id"] != g.current_user["id"]:
        return jsonify({"error": "Patients can only add devices to their own account"}), 403
    conn = get_db_connection()
    conn.execute('INSERT INTO devices (id, name, status, user_id) VALUES (?, ?, ?, ?)',
                 (str(uuid.uuid4()), data["name"].strip(), "online", g.current_user["id"]))
    conn.commit()
    conn.close()
    return jsonify({"message": "Device added"})

@app.route('/alerts', methods=['GET'])
@authenticated()
def alerts():
    user_id = authorized_patient_id(request.args.get("user_id"))
    if not user_id:
        return jsonify({"error": "Patient not found or access denied"}), 403
    conn = get_db_connection()
    row = conn.execute(
        "SELECT * FROM health_data WHERE user_id = ? ORDER BY timestamp DESC, id DESC LIMIT 1",
        (user_id,),
    ).fetchone()
    conn.close()

    alerts_list = []
    if row:
        if (
            row["heart_rate"] > RISK_THRESHOLDS["heart_rate"]["high"]
            or row["heart_rate"] < RISK_THRESHOLDS["heart_rate"]["low"]
        ):
            alerts_list.append("Heart rate outside configured range")
        if row["spo2"] < RISK_THRESHOLDS["spo2"]["low_below"]:
            alerts_list.append("Low SpO2")
        if row["temperature"] > RISK_THRESHOLDS["temperature"]["high_above"]:
            alerts_list.append("Fever Detected")
        if row["temperature"] < RISK_THRESHOLDS["temperature"]["low_below"]:
            alerts_list.append("Low Body Temperature")
        if (
            row["systolic"] > RISK_THRESHOLDS["systolic"]["high_above"]
            or row["diastolic"] > RISK_THRESHOLDS["diastolic"]["high_above"]
        ):
            alerts_list.append("High Blood Pressure")
        if row["glucose"] > RISK_THRESHOLDS["glucose"]["high_above"]:
            alerts_list.append("High Glucose")
        if row["glucose"] < RISK_THRESHOLDS["glucose"]["low_below"]:
            alerts_list.append("Low Glucose")

    return jsonify({"alerts": alerts_list, "current_risk": row['risk_level'] if row else "Unknown"})


def simulation_worker(user_id, mode, interval, stop_event):
    while not stop_event.is_set():
        try:
            result = store_health_reading(
                user_id, generate_reading(mode), source="simulation", simulation_mode=mode
            )
            with SIMULATION_LOCK:
                state = SIMULATIONS.get(user_id)
                if state and state["stop_event"] is stop_event:
                    state["last_reading_at"] = result["timestamp"]
                    state["last_risk_level"] = result["risk_level"]
                    state["error"] = None
            print(
                f"[{result['timestamp']}] Synthetic {mode} reading stored for "
                f"{user_id[:8]}... (risk: {result['risk_level']})"
            )
        except (sqlite3.Error, ValueError) as error:
            with SIMULATION_LOCK:
                state = SIMULATIONS.get(user_id)
                if state and state["stop_event"] is stop_event:
                    state["status"] = "error"
                    state["error"] = str(error)
            print(f"Simulation error for {user_id[:8]}...: {error}")
            return
        if stop_event.wait(interval):
            break

    with SIMULATION_LOCK:
        state = SIMULATIONS.get(user_id)
        if state and state["stop_event"] is stop_event and state["status"] != "error":
            state["status"] = "stopped"


def simulation_status(user_id):
    with SIMULATION_LOCK:
        state = SIMULATIONS.get(user_id)
        if not state:
            return {
                "status": "stopped",
                "mode": "normal",
                "interval_seconds": SIMULATION_INTERVAL_MIN_SECONDS,
                "last_reading_at": None,
                "last_risk_level": None,
                "error": None,
            }
        return {
            "status": state["status"],
            "mode": state["mode"],
            "interval_seconds": state["interval_seconds"],
            "last_reading_at": state["last_reading_at"],
            "last_risk_level": state["last_risk_level"],
            "error": state["error"],
        }


@app.route("/simulation/status", methods=["GET"])
@authenticated(role="patient")
def get_simulation_status():
    return jsonify({
        **simulation_status(g.current_user["id"]),
        "synthetic": True,
        "interval_bounds": {
            "minimum": SIMULATION_INTERVAL_MIN_SECONDS,
            "maximum": SIMULATION_INTERVAL_MAX_SECONDS,
        },
        "ranges": {"normal": NORMAL_RANGES, "abnormal": ABNORMAL_RANGES},
        "risk_thresholds": RISK_THRESHOLDS,
    })


@app.route("/simulation/start", methods=["POST"])
@authenticated(role="patient")
def start_simulation():
    data = request.get_json(silent=True)
    if data is None:
        data = {}
    if not isinstance(data, dict):
        return jsonify({"error": "A JSON simulation configuration is required"}), 400
    mode = data.get("mode", "normal")
    interval = data.get("interval_seconds", SIMULATION_INTERVAL_MIN_SECONDS)
    if mode not in ("normal", "abnormal"):
        return jsonify({"error": "mode must be normal or abnormal"}), 400
    if (
        isinstance(interval, bool)
        or not isinstance(interval, numbers.Real)
        or not float(interval).is_integer()
        or interval < SIMULATION_INTERVAL_MIN_SECONDS
        or interval > SIMULATION_INTERVAL_MAX_SECONDS
    ):
        return jsonify({
            "error": f"interval_seconds must be a whole number from "
                     f"{SIMULATION_INTERVAL_MIN_SECONDS} to {SIMULATION_INTERVAL_MAX_SECONDS}"
        }), 400
    user_id = g.current_user["id"]
    with SIMULATION_LOCK:
        current = SIMULATIONS.get(user_id)
        if current and current["status"] == "running":
            return jsonify({"error": "Stop the current simulation before starting a new mode"}), 409
        stop_event = threading.Event()
        state = {
            "status": "running",
            "mode": mode,
            "interval_seconds": int(interval),
            "last_reading_at": None,
            "last_risk_level": None,
            "error": None,
            "stop_event": stop_event,
        }
        SIMULATIONS[user_id] = state
        worker = threading.Thread(
            target=simulation_worker,
            args=(user_id, mode, int(interval), stop_event),
            daemon=True,
            name=f"healthconnect-simulation-{user_id[:8]}",
        )
        state["thread"] = worker
        worker.start()
    print(f"Started {mode} synthetic simulation for {user_id[:8]}... every {int(interval)} seconds")
    return jsonify({"message": "Simulation started", **simulation_status(user_id)}), 202


@app.route("/simulation/stop", methods=["POST"])
@authenticated(role="patient")
def stop_simulation():
    user_id = g.current_user["id"]
    with SIMULATION_LOCK:
        state = SIMULATIONS.get(user_id)
        if state and state["status"] == "running":
            state["stop_event"].set()
            state["status"] = "stopped"
    return jsonify({"message": "Simulation stopped", **simulation_status(user_id)})


# --- Doctor-Patient Mapping Endpoints ---

@app.route('/get-available-patients', methods=['GET'])
@authenticated(role="doctor")
def get_available_patients():
    doctor_id = g.current_user["id"]
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
@authenticated(role="doctor")
def add_patient_to_doctor():
    data = request.get_json(silent=True)
    if not isinstance(data, dict):
        return jsonify({"error": "A JSON patient assignment is required"}), 400
    doctor_id = g.current_user["id"]
    patient_id = data.get("patient_id")
    if not isinstance(patient_id, str):
        return jsonify({"error": "A patient ID is required"}), 400
    conn = get_db_connection()
    patient = conn.execute(
        "SELECT 1 FROM users WHERE id = ? AND role = 'patient'", (patient_id,)
    ).fetchone()
    conn.close()
    if not patient:
        return jsonify({"error": "Patient not found"}), 404
    
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
@authenticated(role="doctor")
def get_assigned_patients():
    doctor_id = g.current_user["id"]
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
@authenticated()
def generate_report():
    patient_id = authorized_patient_id(request.args.get("patient_id"))
    if not patient_id:
        return jsonify({"error": "Patient not found or access denied"}), 403
    language = request.args.get("language", "English")
    period = request.args.get("period", "7 Days")
    period_days = {"Today": 1, "7 Days": 7, "30 Days": 30}
    if language not in ("English", "Tamil"):
        return jsonify({"error": "language must be English or Tamil"}), 400
    if period not in period_days:
        return jsonify({"error": "period must be Today, 7 Days, or 30 Days"}), 400

    period_end = datetime.now()
    if period == "Today":
        period_start = period_end.replace(hour=0, minute=0, second=0, microsecond=0)
    else:
        period_start = datetime.fromtimestamp(
            period_end.timestamp() - period_days[period] * 86400
        )

    conn = get_db_connection()
    patient = conn.execute(
        "SELECT id, full_name, role FROM users WHERE id = ? AND role = 'patient'",
        (patient_id,),
    ).fetchone()
    latest_data = conn.execute(
        "SELECT * FROM health_data WHERE user_id = ? ORDER BY timestamp DESC, id DESC LIMIT 1",
        (patient_id,),
    ).fetchone()
    averages = conn.execute(
        """SELECT COUNT(*) AS reading_count,
                  AVG(heart_rate) AS heart_rate, AVG(spo2) AS spo2,
                  AVG(temperature) AS temperature, AVG(systolic) AS systolic,
                  AVG(diastolic) AS diastolic, AVG(glucose) AS glucose,
                  SUM(CASE WHEN source = 'simulation' THEN 1 ELSE 0 END) AS simulated_count,
                  SUM(CASE WHEN source = 'unknown' THEN 1 ELSE 0 END) AS unverified_count
           FROM health_data WHERE user_id = ? AND timestamp >= ? AND timestamp <= ?""",
        (
            patient_id,
            period_start.isoformat(sep=" ", timespec="seconds"),
            period_end.isoformat(sep=" ", timespec="seconds"),
        ),
    ).fetchone()
    conn.close()

    if not patient:
        return jsonify({"error": "Patient not found"}), 404

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
    
    lang = labels[language]
    
    report = {
        "title": lang["title"],
        "patient": {
            "name": patient['full_name'],
            "id": patient_id
        },
        "report_date": datetime.now().strftime("%Y-%m-%d %H:%M"),
        "latest_reading": {
            lang[name]: latest_data[name] if latest_data else None
            for name in ("heart_rate", "spo2", "temperature", "systolic", "diastolic", "glucose")
        },
        "latest_reading_timestamp": latest_data["timestamp"] if latest_data else None,
        "latest_reading_simulated": bool(latest_data and latest_data["source"] == "simulation"),
        "latest_simulation_mode": latest_data["simulation_mode"]
        if latest_data and latest_data["source"] == "simulation" else None,
        "averages": {
            lang[name]: round(averages[name], 1)
            if averages["reading_count"] and averages[name] is not None else None
            for name in ("heart_rate", "spo2", "temperature", "systolic", "diastolic", "glucose")
        },
        "average_7_days": {
            lang[name]: round(averages[name], 1)
            if averages["reading_count"] and averages[name] is not None else None
            for name in ("heart_rate", "spo2", "temperature", "systolic", "diastolic", "glucose")
        } if period == "7 Days" else None,
        "average_period": period,
        "period_start": period_start.strftime("%Y-%m-%d %H:%M"),
        "period_end": period_end.strftime("%Y-%m-%d %H:%M"),
        "reading_count": averages["reading_count"],
        "simulated_reading_count": averages["simulated_count"] or 0,
        "contains_unverified_data": bool(
            averages["unverified_count"] or
            (latest_data and latest_data["source"] == "unknown")
        ),
        "contains_simulated_data": bool(
            averages["simulated_count"] or
            (latest_data and latest_data["source"] == "simulation")
        ),
        "risk_level": latest_data["risk_level"] if latest_data else "Unknown",
        "language": language,
    }
    
    return jsonify(report)

@app.route("/logout", methods=["POST"])
@authenticated()
def logout():
    authorization = request.headers.get("Authorization", "")
    _, _, token = authorization.partition(" ")
    AUTH_SESSIONS.pop(token, None)
    return jsonify({"message": "Logged out"})


if __name__ == '__main__':
    print(f"Starting server... Database: {os.path.abspath(DB_PATH)}")
    app.run(debug=False, host='0.0.0.0', port=5001)
