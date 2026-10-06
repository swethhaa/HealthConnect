import React, { useEffect, useState } from "react";
import axios from "axios";
import { useUser } from "../context/UserContext";
import { 
  Heart, 
  Droplets, 
  Thermometer, 
  Activity, 
  Zap, 
  AlertTriangle, 
  CheckCircle2, 
  Cpu, 
  Clock, 
  Calendar,
  User,
  ShieldAlert,
  Wifi,
  WifiOff
} from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

const PatientDashboard = () => {
  const { user } = useUser();
  const [data, setData] = useState([]);
  const [alerts, setAlerts] = useState([]);
  const [risk, setRisk] = useState("Low");
  const [devices, setDevices] = useState([]);
  const [timeFilter, setTimeFilter] = useState("7 Days");

  useEffect(() => {
    fetchData();
    fetchAlerts();
    fetchDevices();

    const interval = setInterval(() => {
      fetchData();
      fetchAlerts();
      fetchDevices();
    }, 5000);

    return () => clearInterval(interval);
  }, []);

  const fetchData = async () => {
    try {
      const res = await axios.get(`http://localhost:5001/get-data?user_id=${user.id}`);
      setData(res.data);
    } catch (err) { 
      console.error('Error fetching patient vitals data:', err); 
    }
  };

  const fetchAlerts = async () => {
    try {
      const res = await axios.get(`http://localhost:5001/alerts?user_id=${user.id}`);
      setAlerts(res.data.alerts || []);
      setRisk(res.data.current_risk || "Low");
    } catch (err) { 
      console.error('Error fetching patient alerts:', err); 
    }
  };

  const fetchDevices = async () => {
    try {
      const res = await axios.get(`http://localhost:5001/get-devices?user_id=${user.id}`);
      setDevices(res.data || []);
    } catch (err) { 
      console.error('Error fetching patient devices:', err); 
    }
  };

  const latest = data[0] || {};
  const lastUpdatedText = latest.timestamp 
    ? new Date(latest.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }) 
    : 'No data';

  // Filter historical data for chart
  const getFilteredData = () => {
    if (!data.length) return [];
    const now = new Date();
    
    return data.filter(item => {
      const itemDate = new Date(item.timestamp);
      if (timeFilter === 'Today') {
        return itemDate.toDateString() === now.toDateString();
      } else if (timeFilter === '7 Days') {
        const sevenDaysAgo = new Date();
        sevenDaysAgo.setDate(now.getDate() - 7);
        return itemDate >= sevenDaysAgo;
      } else if (timeFilter === '30 Days') {
        const thirtyDaysAgo = new Date();
        thirtyDaysAgo.setDate(now.getDate() - 30);
        return itemDate >= thirtyDaysAgo;
      }
      return true;
    }).slice().reverse(); // Reverse for chronological line chart
  };

  const filteredHistory = getFilteredData();

  // Vital Status Determination Helpers
  const getHeartRateStatus = (hr) => {
    if (!hr) return { text: '--', color: 'var(--text-muted)' };
    if (hr > 100 || hr < 60) return { text: 'Attention', color: 'var(--warning)' };
    return { text: 'Normal', color: 'var(--success)' };
  };

  const getSpo2Status = (spo2) => {
    if (!spo2) return { text: '--', color: 'var(--text-muted)' };
    if (spo2 < 92) return { text: 'Critical', color: 'var(--danger)' };
    if (spo2 < 94) return { text: 'Attention', color: 'var(--warning)' };
    return { text: 'Normal', color: 'var(--success)' };
  };

  const getTempStatus = (temp) => {
    if (!temp) return { text: '--', color: 'var(--text-muted)' };
    if (temp > 38.0) return { text: 'Fever', color: 'var(--danger)' };
    if (temp < 35.0) return { text: 'Low Temp', color: 'var(--warning)' };
    return { text: 'Normal', color: 'var(--success)' };
  };

  const getBpStatus = (sys, dia) => {
    if (!sys) return { text: '--', color: 'var(--text-muted)' };
    if (sys > 140 || dia > 90) return { text: 'Elevated', color: 'var(--danger)' };
    if (sys > 125 || dia > 85) return { text: 'Attention', color: 'var(--warning)' };
    return { text: 'Normal', color: 'var(--success)' };
  };

  const getGlucoseStatus = (glu) => {
    if (!glu) return { text: '--', color: 'var(--text-muted)' };
    if (glu > 140 || glu < 70) return { text: 'Attention', color: 'var(--warning)' };
    return { text: 'Normal', color: 'var(--success)' };
  };

  const getRiskStyle = (level) => {
    if (level === 'High') return { bg: 'var(--danger-light)', border: 'var(--danger-border)', color: 'var(--danger)', label: 'High Risk' };
    if (level === 'Medium') return { bg: 'var(--warning-light)', border: 'var(--warning-border)', color: 'var(--warning)', label: 'Medium Risk' };
    return { bg: 'var(--success-light)', border: 'var(--success-border)', color: 'var(--success)', label: 'Low Risk' };
  };

  const riskStyle = getRiskStyle(risk);

  return (
    <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
      
      {/* 1. Patient Profile & Status Banner */}
      <header className="card" style={{ marginBottom: '1.5rem', padding: '1.25rem 1.5rem' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
            <div style={{ 
              width: '46px', 
              height: '46px', 
              borderRadius: '10px', 
              background: 'var(--primary-subtle)', 
              border: '1px solid var(--primary-light)',
              display: 'flex', 
              alignItems: 'center', 
              justifyContent: 'center' 
            }}>
              <User size={24} color="var(--primary)" />
            </div>
            <div>
              <h1 style={{ margin: 0, fontSize: '1.4rem', color: 'var(--text-main)', fontWeight: 700 }}>
                {user.full_name}
              </h1>
              <p style={{ margin: '0.15rem 0 0 0', color: 'var(--text-muted)', fontSize: '0.85rem' }}>
                Patient ID: <span style={{ fontFamily: 'monospace', fontWeight: 600 }}>{user.id}</span> &bull; Telemetry Surveillance
              </p>
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
            <div style={{ 
              display: 'flex', 
              alignItems: 'center', 
              gap: '0.4rem', 
              padding: '0.4rem 0.85rem', 
              background: 'var(--success-light)', 
              border: '1px solid var(--success-border)', 
              borderRadius: '99px',
              fontSize: '0.8rem',
              color: 'var(--success)',
              fontWeight: 600
            }}>
              <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: 'var(--success)' }}></span>
              Telemetry Active
            </div>
            <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
              <Clock size={14} /> Last sync: <strong>{lastUpdatedText}</strong>
            </div>
          </div>
        </div>
      </header>

      {/* 5. Alerts Section (Prominently placed at the top if present) */}
      {alerts.length > 0 && (
        <div style={{ marginBottom: '1.5rem' }}>
          <div style={{ 
            background: 'var(--danger-light)', 
            border: '1px solid var(--danger-border)', 
            borderRadius: '0.75rem', 
            padding: '1.25rem' 
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.625rem', marginBottom: '0.75rem' }}>
              <ShieldAlert size={22} color="var(--danger)" />
              <h3 style={{ margin: 0, fontSize: '1.05rem', color: 'var(--danger)', fontWeight: 700 }}>
                Active Clinical Alerts
              </h3>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', marginBottom: '0.75rem' }}>
              {alerts.map((alertText, i) => (
                <div 
                  key={i} 
                  style={{ 
                    display: 'flex', 
                    alignItems: 'center', 
                    gap: '0.5rem', 
                    fontSize: '0.9rem', 
                    color: 'var(--danger)', 
                    fontWeight: 600 
                  }}
                >
                  <AlertTriangle size={16} />
                  {alertText} &mdash; parameter outside expected clinical bounds.
                </div>
              ))}
            </div>
            <p style={{ margin: 0, fontSize: '0.75rem', color: 'var(--text-muted)' }}>
              * Alerts indicate vital parameters exceeding baseline ranges. Please notify your attending healthcare provider if symptoms worsen.
            </p>
          </div>
        </div>
      )}

      {/* 2. Current Vital Signs Grid */}
      <section style={{ marginBottom: '1.5rem' }}>
        <h2 style={{ margin: '0 0 1rem 0', fontSize: '1.15rem', color: 'var(--text-main)', fontWeight: 700 }}>
          Current Vital Signs
        </h2>
        <div className="stats-grid">
          <VitalCard 
            icon={Heart} 
            label="Heart Rate" 
            value={latest.heart_rate} 
            unit="BPM" 
            color="#dc2626" 
            status={getHeartRateStatus(latest.heart_rate)}
            timestamp={lastUpdatedText}
          />
          <VitalCard 
            icon={Droplets} 
            label="Blood Oxygen (SpO₂)" 
            value={latest.spo2} 
            unit="%" 
            color="#0284c7" 
            status={getSpo2Status(latest.spo2)}
            timestamp={lastUpdatedText}
          />
          <VitalCard 
            icon={Thermometer} 
            label="Body Temperature" 
            value={latest.temperature} 
            unit="°C" 
            color="#d97706" 
            status={getTempStatus(latest.temperature)}
            timestamp={lastUpdatedText}
          />
          <VitalCard 
            icon={Activity} 
            label="Blood Pressure" 
            value={latest.systolic ? `${latest.systolic}/${latest.diastolic}` : null} 
            unit="mmHg" 
            color="#0d9488" 
            status={getBpStatus(latest.systolic, latest.diastolic)}
            timestamp={lastUpdatedText}
          />
          <VitalCard 
            icon={Zap} 
            label="Blood Glucose" 
            value={latest.glucose} 
            unit="mg/dL" 
            color="#7c3aed" 
            status={getGlucoseStatus(latest.glucose)}
            timestamp={lastUpdatedText}
          />
        </div>
      </section>

      {/* 3. Overall Health Risk & 6. Device Status Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 340px', gap: '1.5rem', marginBottom: '1.5rem' }}>
        
        {/* Overall Health Risk */}
        <div className="card">
          <h3 style={{ margin: '0 0 1rem 0', fontSize: '1.05rem', color: 'var(--text-main)', fontWeight: 700 }}>
            Overall Health Risk Assessment
          </h3>
          <div style={{ 
            display: 'flex', 
            alignItems: 'center', 
            gap: '1.25rem', 
            padding: '1.25rem 1.5rem', 
            background: riskStyle.bg, 
            border: `1px solid ${riskStyle.border}`, 
            borderRadius: '0.5rem' 
          }}>
            {risk === 'High' ? (
              <AlertTriangle size={34} color="var(--danger)" />
            ) : (
              <CheckCircle2 size={34} color={riskStyle.color} />
            )}
            <div>
              <div style={{ fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--text-muted)', fontWeight: 600 }}>
                Clinical Assessment Score
              </div>
              <p style={{ margin: '0.15rem 0', fontWeight: 700, fontSize: '1.3rem', color: riskStyle.color }}>
                {riskStyle.label}
              </p>
              <p style={{ margin: 0, color: 'var(--text-secondary)', fontSize: '0.85rem' }}>
                Classification based on standard medical threshold scoring from current telemetry readings.
              </p>
            </div>
          </div>
        </div>

        {/* 6. Connected Device Status */}
        <div className="card">
          <h3 style={{ margin: '0 0 1rem 0', fontSize: '1.05rem', color: 'var(--text-main)', fontWeight: 700 }}>
            Monitoring Kit Status
          </h3>
          {devices.length > 0 ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              {devices.map((dev) => (
                <div key={dev.id} style={{ 
                  padding: '0.75rem 1rem', 
                  background: 'var(--bg-body)', 
                  border: '1px solid var(--border)', 
                  borderRadius: '0.5rem' 
                }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.35rem' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontWeight: 600, fontSize: '0.9rem' }}>
                      <Cpu size={16} color="var(--primary)" />
                      {dev.name}
                    </div>
                    <span style={{ 
                      fontSize: '0.7rem', 
                      padding: '0.2rem 0.5rem', 
                      borderRadius: '99px',
                      background: dev.status === 'online' ? 'var(--success-light)' : 'var(--border-subtle)',
                      color: dev.status === 'online' ? 'var(--success)' : 'var(--text-muted)',
                      border: `1px solid ${dev.status === 'online' ? 'var(--success-border)' : 'var(--border)'}`,
                      fontWeight: 700,
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.25rem'
                    }}>
                      {dev.status === 'online' ? <Wifi size={10} /> : <WifiOff size={10} />}
                      {dev.status === 'online' ? 'CONNECTED' : 'DISCONNECTED'}
                    </span>
                  </div>
                  <p style={{ margin: 0, fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                    ID: {dev.id.slice(0, 12)}... &bull; Last data: {lastUpdatedText}
                  </p>
                </div>
              ))}
            </div>
          ) : (
            <div style={{ padding: '1rem', background: 'var(--bg-body)', borderRadius: '0.5rem', border: '1px solid var(--border-subtle)', textAlign: 'center' }}>
              <Cpu size={22} color="var(--text-muted)" style={{ margin: '0 auto 0.35rem' }} />
              <p style={{ margin: 0, fontSize: '0.85rem', color: 'var(--text-muted)' }}>
                No monitoring kit registered.
              </p>
            </div>
          )}
        </div>
      </div>

      {/* 4. Health History Charts with Filters */}
      <section className="card" style={{ padding: '1.5rem' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem', flexWrap: 'wrap', gap: '1rem' }}>
          <div>
            <h3 style={{ margin: 0, fontSize: '1.05rem', color: 'var(--text-main)', fontWeight: 700 }}>
              Telemetry Telehealth Trends
            </h3>
            <p style={{ margin: '0.2rem 0 0 0', fontSize: '0.85rem', color: 'var(--text-muted)' }}>
              Longitudinal tracking of heart rate, blood oxygen, and temperature
            </p>
          </div>

          {/* Time Filter Buttons */}
          <div style={{ background: 'var(--border-subtle)', padding: '0.2rem', borderRadius: '0.5rem', display: 'flex', gap: '0.25rem', border: '1px solid var(--border)' }}>
            {['Today', '7 Days', '30 Days'].map((filter) => (
              <button
                key={filter}
                onClick={() => setTimeFilter(filter)}
                style={{
                  background: timeFilter === filter ? 'var(--bg-surface)' : 'transparent',
                  color: timeFilter === filter ? 'var(--primary)' : 'var(--text-muted)',
                  border: timeFilter === filter ? '1px solid var(--border)' : 'none',
                  padding: '0.35rem 0.75rem',
                  fontSize: '0.8rem',
                  fontWeight: 600,
                  borderRadius: '0.375rem',
                  cursor: 'pointer',
                  width: 'auto',
                  boxShadow: timeFilter === filter ? '0 1px 2px rgba(0,0,0,0.05)' : 'none'
                }}
              >
                {filter}
              </button>
            ))}
          </div>
        </div>

        {filteredHistory.length > 0 ? (
          <div style={{ height: '320px', width: '100%' }}>
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={filteredHistory}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                <XAxis dataKey="timestamp" tick={{fill: '#64748b', fontSize: 11}} tickFormatter={(t) => new Date(t).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})} />
                <YAxis tick={{fill: '#64748b', fontSize: 11}} />
                <Tooltip contentStyle={{ background: '#ffffff', border: '1px solid #cbd5e1', borderRadius: '0.5rem', color: '#0f172a', fontSize: '0.85rem' }} />
                <Line type="monotone" dataKey="heart_rate" stroke="#dc2626" name="Heart Rate (BPM)" dot={false} strokeWidth={2} />
                <Line type="monotone" dataKey="spo2" stroke="#0284c7" name="SpO2 (%)" dot={false} strokeWidth={2} />
                <Line type="monotone" dataKey="temperature" stroke="#d97706" name="Temp (°C)" dot={false} strokeWidth={2} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        ) : (
          <div style={{ padding: '3rem 1.5rem', textAlign: 'center', background: 'var(--bg-body)', borderRadius: '0.5rem', border: '1px solid var(--border-subtle)' }}>
            <Calendar size={28} color="var(--text-muted)" style={{ margin: '0 auto 0.5rem' }} />
            <p style={{ margin: 0, color: 'var(--text-muted)', fontSize: '0.875rem' }}>
              No health telemetry records found for selected filter ({timeFilter}).
            </p>
          </div>
        )}
      </section>

    </div>
  );
};

// Vital Card Component
const VitalCard = ({ icon: Icon, label, value, unit, color, status, timestamp }) => (
  <div className="stat-card">
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
      <span className="stat-label">{label}</span>
      <div style={{ 
        width: '32px', 
        height: '32px', 
        borderRadius: '8px', 
        background: `${color}15`, 
        display: 'flex', 
        alignItems: 'center', 
        justifyContent: 'center' 
      }}>
        <Icon size={18} style={{ color }} />
      </div>
    </div>

    <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', marginTop: '0.5rem' }}>
      <div className="stat-value">
        {value !== null && value !== undefined ? value : '--'}
        <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)', fontWeight: 500, marginLeft: '0.35rem' }}>
          {unit}
        </span>
      </div>

      <span style={{ 
        fontSize: '0.75rem', 
        fontWeight: 700, 
        color: status.color,
        background: `${status.color}15`,
        padding: '0.15rem 0.5rem',
        borderRadius: '0.25rem'
      }}>
        {status.text}
      </span>
    </div>

    <div style={{ marginTop: '0.5rem', fontSize: '0.75rem', color: 'var(--text-muted)', borderTop: '1px solid var(--border-subtle)', paddingTop: '0.4rem', display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
      <Clock size={11} /> Updated: {timestamp}
    </div>
  </div>
);

export default PatientDashboard;
