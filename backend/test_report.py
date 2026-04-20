import requests
import json

# Get patient ID for Raj Kumar
response = requests.get('http://localhost:5001/get-patients')
patients = response.json()
raj_kumar = next(p for p in patients if p['full_name'] == 'Raj Kumar')
print(f'Patient ID for Raj Kumar: {raj_kumar["id"]}')

# Generate English report
print('\n=== ENGLISH REPORT ===')
report_response = requests.get(f'http://localhost:5001/generate-report?patient_id={raj_kumar["id"]}&language=English')
english_report = report_response.json()
print(json.dumps(english_report, indent=2, ensure_ascii=False))

# Generate Tamil report
print('\n=== TAMIL REPORT ===')
tamil_response = requests.get(f'http://localhost:5001/generate-report?patient_id={raj_kumar["id"]}&language=Tamil')
tamil_report = tamil_response.json()
print(json.dumps(tamil_report, indent=2, ensure_ascii=False))