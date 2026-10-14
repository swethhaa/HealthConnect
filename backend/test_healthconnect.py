import os
import sqlite3
import tempfile
import time
import unittest
from datetime import datetime, timedelta


_previous_db_path = os.environ.get("HEALTHCONNECT_DB_PATH")
_test_directory = tempfile.TemporaryDirectory(prefix="healthconnect-tests-")
os.environ["HEALTHCONNECT_DB_PATH"] = os.path.join(_test_directory.name, "test.db")

import app as backend


class HealthConnectApiTests(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        conn = backend.get_db_connection()
        conn.executemany(
            "INSERT INTO users (id, username, password, role, full_name) VALUES (?, ?, ?, ?, ?)",
            [
                ("patient-a", "patient-a", "DemoPass!1", "patient", "Demo Patient A"),
                ("patient-b", "patient-b", "DemoPass!1", "patient", "Demo Patient B"),
                ("doctor-a", "doctor-a", "DemoPass!1", "doctor", "Demo Doctor"),
            ],
        )
        conn.execute(
            "INSERT INTO doctor_patients (id, doctor_id, patient_id) VALUES (?, ?, ?)",
            ("assignment-a", "doctor-a", "patient-a"),
        )
        conn.commit()
        conn.close()

    @classmethod
    def tearDownClass(cls):
        for state in backend.SIMULATIONS.values():
            state["stop_event"].set()
            worker = state.get("thread")
            if worker:
                worker.join(timeout=1)
        backend.AUTH_SESSIONS.clear()
        backend.SIMULATIONS.clear()
        _test_directory.cleanup()
        if _previous_db_path is None:
            os.environ.pop("HEALTHCONNECT_DB_PATH", None)
        else:
            os.environ["HEALTHCONNECT_DB_PATH"] = _previous_db_path

    def setUp(self):
        self.client = backend.app.test_client()
        conn = backend.get_db_connection()
        conn.execute("DELETE FROM health_data WHERE user_id IN ('patient-a', 'patient-b')")
        conn.commit()
        conn.close()
        self.tokens = {}
        for username in ("patient-a", "patient-b", "doctor-a"):
            response = self.client.post(
                "/login", json={"username": username, "password": "DemoPass!1"}
            )
            self.assertEqual(response.status_code, 200)
            self.assertNotIn("password", response.json["user"])
            self.tokens[username] = response.json["token"]

    def auth(self, username):
        return {"Authorization": f"Bearer {self.tokens[username]}"}

    def test_patient_and_doctor_access_is_scoped(self):
        self.assertEqual(self.client.get("/get-data").status_code, 401)
        own = self.client.get(
            "/get-data?user_id=patient-a", headers=self.auth("patient-a")
        )
        other = self.client.get(
            "/get-data?user_id=patient-b", headers=self.auth("patient-a")
        )
        assigned = self.client.get(
            "/get-data?user_id=patient-a", headers=self.auth("doctor-a")
        )
        unassigned = self.client.get(
            "/get-data?user_id=patient-b", headers=self.auth("doctor-a")
        )
        private_report = self.client.get(
            "/generate-report?patient_id=patient-b",
            headers=self.auth("patient-a"),
        )
        self.assertEqual(own.status_code, 200)
        self.assertEqual(other.status_code, 403)
        self.assertEqual(assigned.status_code, 200)
        self.assertEqual(unassigned.status_code, 403)
        self.assertEqual(private_report.status_code, 403)
        directory = self.client.get("/get-patients", headers=self.auth("doctor-a"))
        self.assertEqual([item["id"] for item in directory.json], ["patient-a"])

    def test_upload_validation_and_period_report(self):
        reading = {
            "heart_rate": 78,
            "spo2": 98,
            "temperature": 36.9,
            "systolic": 118,
            "diastolic": 76,
            "glucose": 92,
        }
        response = self.client.post(
            "/upload-data", json=reading, headers=self.auth("patient-a")
        )
        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.json["risk_level"], "Low")
        spoofed = self.client.post(
            "/upload-data",
            json={**reading, "user_id": "patient-b"},
            headers=self.auth("patient-a"),
        )
        self.assertEqual(spoofed.status_code, 403)
        invalid = self.client.post(
            "/upload-data",
            json={**reading, "spo2": 101},
            headers=self.auth("patient-a"),
        )
        self.assertEqual(invalid.status_code, 400)

        conn = backend.get_db_connection()
        old_timestamp = (datetime.now() - timedelta(days=8)).isoformat(
            sep=" ", timespec="seconds"
        )
        conn.execute(
            """INSERT INTO health_data
               (user_id, heart_rate, spo2, temperature, systolic, diastolic, glucose,
                risk_level, timestamp, source)
               VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)""",
            ("patient-a", 150, 85, 39.5, 170, 105, 180, "High", old_timestamp, "recorded"),
        )
        conn.commit()
        conn.close()

        report = self.client.get(
            "/generate-report?patient_id=patient-a&period=7%20Days",
            headers=self.auth("patient-a"),
        )
        self.assertEqual(report.status_code, 200)
        self.assertEqual(report.json["reading_count"], 1)
        self.assertEqual(report.json["averages"]["Heart Rate (BPM)"], 78)
        self.assertEqual(report.json["average_period"], "7 Days")
        report_30_days = self.client.get(
            "/generate-report?patient_id=patient-a&period=30%20Days",
            headers=self.auth("patient-a"),
        )
        self.assertEqual(report_30_days.json["reading_count"], 2)
        self.assertEqual(report_30_days.json["averages"]["Heart Rate (BPM)"], 114)
        self.assertIsNone(report_30_days.json["average_7_days"])
        trends = self.client.get(
            "/get-data?user_id=patient-a&period=30%20Days",
            headers=self.auth("patient-a"),
        )
        self.assertEqual(trends.status_code, 200)
        self.assertEqual(sum(point["reading_count"] for point in trends.json), 2)
        self.assertEqual(
            self.client.get(
                "/get-data?period=Last%20Year", headers=self.auth("patient-a")
            ).status_code,
            400,
        )
        no_data = self.client.get(
            "/generate-report?period=Today", headers=self.auth("patient-b")
        )
        self.assertEqual(no_data.status_code, 200)
        self.assertEqual(no_data.json["reading_count"], 0)
        self.assertIsNone(no_data.json["averages"]["Heart Rate (BPM)"])

    def test_legacy_schema_migration_keeps_records_unverified(self):
        migration_path = os.path.join(_test_directory.name, "legacy.db")
        conn = sqlite3.connect(migration_path)
        conn.execute(
            """CREATE TABLE health_data (
                 id INTEGER PRIMARY KEY AUTOINCREMENT, user_id TEXT, heart_rate INTEGER,
                 spo2 INTEGER, temperature REAL, systolic INTEGER, diastolic INTEGER,
                 glucose INTEGER, risk_level TEXT, timestamp DATETIME
               )"""
        )
        conn.execute(
            """INSERT INTO health_data
               (user_id, heart_rate, spo2, temperature, systolic, diastolic,
                glucose, risk_level, timestamp)
               VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)""",
            ("legacy-user", 82, 97, 37.1, 120, 78, 95, "Low", "2020-01-01 12:00:00"),
        )
        conn.commit()
        conn.close()

        active_path = backend.DB_PATH
        try:
            backend.DB_PATH = migration_path
            backend.init_db()
            conn = backend.get_db_connection()
            row = conn.execute("SELECT * FROM health_data WHERE user_id = ?", ("legacy-user",)).fetchone()
            count = conn.execute("SELECT COUNT(*) FROM health_data").fetchone()[0]
            conn.close()
        finally:
            backend.DB_PATH = active_path

        self.assertEqual(count, 1)
        self.assertEqual(row["heart_rate"], 82)
        self.assertEqual(row["source"], "unknown")
        self.assertIsNone(row["simulation_mode"])

    def test_normal_and_abnormal_simulation_are_stored_and_scored(self):
        normal = self.client.post(
            "/simulation/start",
            json={"mode": "normal", "interval_seconds": 5},
            headers=self.auth("patient-a"),
        )
        self.assertEqual(normal.status_code, 202)
        duplicate = self.client.post(
            "/simulation/start",
            json={"mode": "abnormal", "interval_seconds": 5},
            headers=self.auth("patient-a"),
        )
        self.assertEqual(duplicate.status_code, 409)

        conn = backend.get_db_connection()
        deadline = time.time() + 3
        normal_row = None
        while time.time() < deadline and not normal_row:
            normal_row = conn.execute(
                "SELECT * FROM health_data WHERE user_id = ? AND source = 'simulation' ORDER BY id DESC LIMIT 1",
                ("patient-a",),
            ).fetchone()
            if not normal_row:
                time.sleep(0.05)
        self.assertIsNotNone(normal_row)
        self.assertEqual(normal_row["simulation_mode"], "normal")
        self.assertEqual(normal_row["risk_level"], "Low")
        self.client.post("/simulation/stop", headers=self.auth("patient-a"))

        abnormal = self.client.post(
            "/simulation/start",
            json={"mode": "abnormal", "interval_seconds": 5},
            headers=self.auth("patient-a"),
        )
        self.assertEqual(abnormal.status_code, 202)
        deadline = time.time() + 3
        abnormal_row = None
        while time.time() < deadline:
            abnormal_row = conn.execute(
                "SELECT * FROM health_data WHERE user_id = ? AND simulation_mode = 'abnormal' ORDER BY id DESC LIMIT 1",
                ("patient-a",),
            ).fetchone()
            if abnormal_row:
                break
            time.sleep(0.05)
        self.assertIsNotNone(abnormal_row)
        self.assertEqual(abnormal_row["source"], "simulation")
        self.assertEqual(abnormal_row["risk_level"], "High")
        alerts = self.client.get(
            "/alerts?user_id=patient-a", headers=self.auth("patient-a")
        )
        self.assertEqual(alerts.json["current_risk"], "High")
        self.assertGreaterEqual(len(alerts.json["alerts"]), 5)
        trend = self.client.get(
            "/get-data?user_id=patient-a&period=Today",
            headers=self.auth("patient-a"),
        )
        self.assertEqual(trend.status_code, 200)
        self.assertTrue(any(point["simulated"] for point in trend.json))
        self.client.post("/simulation/stop", headers=self.auth("patient-a"))
        conn.close()


if __name__ == "__main__":
    unittest.main()
