import getpass
import json
import requests

username = input("Patient username: ").strip()
password = getpass.getpass("Patient password: ")
session = requests.Session()
login_response = session.post(
    "http://127.0.0.1:5001/login",
    json={"username": username, "password": password},
    timeout=5,
)
if login_response.status_code != 200:
    raise SystemExit(f'Login failed: {login_response.json().get("error", login_response.reason)}')
user = login_response.json()["user"]
if user["role"] != "patient":
    raise SystemExit("Report checks require a patient account.")
session.headers["Authorization"] = f'Bearer {login_response.json()["token"]}'
print(f'Checking reports for {user["full_name"]}.')

# Generate English report
print('\n=== ENGLISH REPORT ===')
report_response = session.get(
    "http://127.0.0.1:5001/generate-report",
    params={"patient_id": user["id"], "language": "English"},
    timeout=5,
)
report_response.raise_for_status()
english_report = report_response.json()
print(json.dumps(english_report, indent=2, ensure_ascii=False))

# Generate Tamil report
print('\n=== TAMIL REPORT ===')
tamil_response = session.get(
    "http://127.0.0.1:5001/generate-report",
    params={"patient_id": user["id"], "language": "Tamil"},
    timeout=5,
)
tamil_response.raise_for_status()
tamil_report = tamil_response.json()
print(json.dumps(tamil_report, indent=2, ensure_ascii=False))