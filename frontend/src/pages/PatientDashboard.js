import React, { useEffect, useState } from "react";
import axios from "axios";
import { useUser } from "../context/UserContext";
import { Heart, Droplets, Thermometer, Activity, Zap } from 'lucide-react';

const PatientDashboard = () => {
  const { user } = useUser();
  const [data, setData] = useState([]);
  const [alerts, setAlerts] = useState([]);
  const [risk, setRisk] = useState("Low");

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
      const res = await axios.get(`http://localhost:5000/get-data?user_id=${user.id}`);
      setData(res.data);
    } catch (err) { console.error(err); }
  };

  const fetchAlerts = async () => {
    try {
      const res = await axios.get(`http://localhost:5000/alerts?user_id=${user.id}`);
      setAlerts(res.data.alerts);
      setRisk(res.data.current_risk);
    } catch (err) { console.error(err); }
  };

  const latest = data[0] || {};

  return (
    <div>
      <header style={{ marginBottom: '2.5rem' }}>
        <h1 className="gradient-text" style={{ margin: 0, fontSize: '2rem' }}>Welcome, {user.full_name}</h1>
        <p style={{ color: 'var(--text-muted)' }}>Real-time surveillance active</p>
      </header>

      <div className="stats-grid">
        <StatCard icon={Heart} label="Heart Rate" value={latest.heart_rate} unit="BPM" color="#ef4444" />
        <StatCard icon={Droplets} label="SpO2" value={latest.spo2} unit="%" color="#3b82f6" />
        <StatCard icon={Thermometer} label="Temp" value={latest.temperature} unit="°C" color="#f59e0b" />
        <StatCard icon={Activity} label="Blood Pressure" value={latest.systolic ? `${latest.systolic}/${latest.diastolic}` : '--'} unit="mmHg" color="#10b981" />
        <StatCard icon={Zap} label="Glucose" value={latest.glucose} unit="mg/dL" color="#8b5cf6" />
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 300px', gap: '1.5rem' }}>
        <div className="glass-card">
          <h3 style={{ margin: '0 0 1.5rem 0' }}>Health Status Summary</h3>
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', padding: '1.5rem', background: 'rgba(255,255,255,0.03)', borderRadius: '1rem' }}>
            <div className={`risk-indicator risk-${risk}`} style={{ width: '20px', height: '20px' }}></div>
            <div>
              <p style={{ margin: 0, fontWeight: 700, fontSize: '1.25rem' }}>Overall Risk: <span className={`risk-${risk}`}>{risk}</span></p>
              <p style={{ margin: 0, color: 'var(--text-muted)', fontSize: '0.875rem' }}>Analysis based on latest vitals and historical trends.</p>
            </div>
          </div>
        </div>

        <div className="glass-card">
          <h3 style={{ margin: '0 0 1rem 0' }}>Active Alerts</h3>
          {alerts.length > 0 ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
              {alerts.map((a, i) => (
                <div key={i} className="alert-badge" style={{ background: 'rgba(239, 68, 68, 0.1)', color: '#fca5a5', border: '1px solid rgba(239, 68, 68, 0.2)', padding: '0.75rem' }}>
                  {a}
                </div>
              ))}
            </div>
          ) : (
            <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem' }}>No critical alerts detected.</p>
          )}
        </div>
      </div>
    </div>
  );
};

const StatCard = ({ icon: Icon, label, value, unit, color }) => (
  <div className="glass-card stat-card">
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
      <span className="stat-label">{label}</span>
      <Icon size={18} style={{ color }} />
    </div>
    <div className="stat-value">
      {value || '--'}
      <span style={{ fontSize: '0.875rem', color: 'var(--text-muted)', fontWeight: 400, marginLeft: '0.25rem' }}>{unit}</span>
    </div>
  </div>
);

export default PatientDashboard;
