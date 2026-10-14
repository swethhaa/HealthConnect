import argparse
import getpass
import os
import sys
import time

import requests


DEFAULT_URL = os.environ.get("HEALTHCONNECT_API_URL", "http://127.0.0.1:5001")


def parse_args():
    parser = argparse.ArgumentParser(
        description="Control HealthConnect's synthetic patient sensor simulation."
    )
    parser.add_argument("--url", default=DEFAULT_URL, help="Flask API base URL")
    parser.add_argument(
        "--mode",
        choices=("normal", "abnormal"),
        default="normal",
        help="Synthetic reading mode (default: normal)",
    )
    parser.add_argument(
        "--interval",
        type=int,
        default=5,
        help="Seconds between readings (5-3600; default: 5)",
    )
    return parser.parse_args()


def simulate():
    args = parse_args()
    if not 5 <= args.interval <= 3600:
        print("Interval must be between 5 and 3600 seconds.")
        return 2

    base_url = args.url.rstrip("/")
    print("=" * 58)
    print("HEALTHCONNECT SYNTHETIC HEALTH SENSOR SIMULATOR")
    print("SIMULATION ONLY — NO PHYSICAL SENSOR IS CONNECTED")
    print(f"Server: {base_url} | Mode: {args.mode} | Interval: {args.interval}s")
    print("=" * 58)

    username = input("Patient username: ").strip()
    password = getpass.getpass("Patient password: ")
    session = requests.Session()
    try:
        login_response = session.post(
            f"{base_url}/login",
            json={"username": username, "password": password},
            timeout=5,
        )
        if login_response.status_code != 200:
            print(f"Login failed: {login_response.json().get('error', login_response.reason)}")
            return 1
        login = login_response.json()
        if login.get("user", {}).get("role") != "patient":
            print("The simulator can only be started for a patient account.")
            return 1
        session.headers["Authorization"] = f"Bearer {login['token']}"
        print(f"Connected as patient {login['user']['full_name']}.")

        response = session.post(
            f"{base_url}/simulation/start",
            json={"mode": args.mode, "interval_seconds": args.interval},
            timeout=5,
        )
        if response.status_code != 202:
            print(f"Could not start simulation: {response.json().get('error', response.reason)}")
            return 1
        print("Simulation started. Press Ctrl+C to stop it.")

        last_reading_at = None
        while True:
            time.sleep(min(args.interval, 10))
            response = session.get(f"{base_url}/simulation/status", timeout=5)
            response.raise_for_status()
            status = response.json()
            if status.get("last_reading_at") != last_reading_at and status.get("last_reading_at"):
                last_reading_at = status["last_reading_at"]
                print(
                    f"[{last_reading_at}] Synthetic {status['mode']} reading stored "
                    f"(backend risk: {status.get('last_risk_level', 'pending')})"
                )
            if status.get("status") == "error":
                print(f"Simulation stopped due to a backend error: {status.get('error')}")
                return 1
            if status.get("status") == "stopped":
                print("Simulation was stopped from the dashboard.")
                return 0
    except KeyboardInterrupt:
        print("\nStopping the synthetic simulator...")
        try:
            response = session.post(f"{base_url}/simulation/stop", timeout=5)
            response.raise_for_status()
            print("Simulation stopped.")
        except requests.RequestException as error:
            print(f"Could not confirm the stop request: {error}")
            return 1
        return 0
    except requests.ConnectionError as error:
        print(f"Cannot connect to Flask at {base_url}: {error}")
        print("Start the backend first with: python app.py")
        return 1
    except requests.RequestException as error:
        print(f"Simulator API request failed: {error}")
        return 1


if __name__ == "__main__":
    sys.exit(simulate())
