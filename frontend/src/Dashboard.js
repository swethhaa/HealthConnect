import React, { useEffect, useState } from "react";
import axios from "axios";

function Dashboard() {
  const [data, setData] = useState([]);
  const [alerts, setAlerts] = useState([]);
  const [currentRisk, setCurrentRisk] = useState("Low");

  useEffect(() => {
    const interval = setInterval(() => {
      fetchData();
      fetchAlerts();
    }, 5000);
    fetchData();
    fetchAlerts();
    return () => clearInterval(interval);
  }, []);

  const fetchData = async () => {
    try {
      const res = await axios.get("http://127.0.0.1:5000/get-data");
      setData(res.data);
    } catch (err) {
      console.error("Error fetching data", err);
    }
  };

  const fetchAlerts = async () => {
    try {
      const res = await axios.get("http://127.0.0.1:5000/alerts");
      setAlerts(res.data.alerts);
      setCurrentRisk(res.data.current_risk);
    } catch (err) {
      console.error("Error fetching alerts", err);
    }
  };

  const latest = data[0] || {};

  return (
    <div className="dashboard-container">
      <header style={{ marginBottom: '3rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h1 className="gradient-text" style={{ margin: 0, fontSize: '2.5rem' }}>Rural Health Monitor</h1>
          <p style={{ color: 'var(--text-muted)', margin: '0.5rem 0 0 0' }}>IoT-Enabled Real-time Patient Surveillance</p>
        </div>
        <div className={`alert-badge alert-${currentRisk.toLowerCase()}`}>
          <span className={`risk-indicator risk-${currentRisk}`}></span>
          Risk Level: {currentRisk}
        </div>
      </header>

      <div className="stats-grid">
        <StatCard label="Heart Rate" value={latest.heart_rate} unit="BPM" />
        <StatCard label="SpO2" value={latest.spo2} unit="%" />
        <StatCard label="Temperature" value={latest.temperature} unit="°C" />
        <StatCard label="Blood Pressure" value={latest.systolic ? `${latest.systolic}/${latest.diastolic}` : '--'} unit="mmHg" />
        <StatCard label="Glucose" value={latest.glucose} unit="mg/dL" />
      </div>

      {alerts.length > 0 && (
        <div className="glass-card" style={{ marginBottom: '2rem', borderLeft: '4px solid var(--danger)' }}>
          <h3 style={{ margin: '0 0 1rem 0', color: 'var(--danger)' }}>Critical Alerts</h3>
          <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>

            {alerts.map((a, i) => (
              <span key={i} className="alert-badge alert-high">{a}</span>
            ))}
          </div>
        </div>
      )}

      <div className="glass-card table-container">
        <h3 style={{ margin: '0 0 1.5rem 0' }}>Recent History</h3>
        <table>
          <thead>
            <tr>
              <th>Timestamp</th>
              <th>HR</th>
              <th>SpO2</th>
              <th>Temp</th>
              <th>BP</th>
              <th>Glucose</th>
              <th>Risk</th>
            </tr>
          </thead>
          <tbody>
            {data.map((d, i) => (
              <tr key={i}>
                <td style={{ color: 'var(--text-muted)', fontSize: '0.875rem' }}>{new Date(d.timestamp).toLocaleTimeString()}</td>
                <td>{d.heart_rate}</td>
                <td>{d.spo2}</td>
                <td>{d.temperature}°C</td>
                <td>{d.systolic}/{d.diastolic}</td>
                <td>{d.glucose}</td>
                <td>
                    <span className={`risk-indicator risk-${d.risk_level}`} style={{ marginRight: '8px' }}></span>
                    {d.risk_level}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function StatCard({ label, value, unit }) {
  return (
    <div className="glass-card stat-card">
      <span className="stat-label">{label}</span>
      <div className="stat-value">
        {value || '--'}
        <span className="stat-unit">{unit}</span>
      </div>
    </div>
  );
}

export default Dashboard;