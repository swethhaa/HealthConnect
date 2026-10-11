import React, { useEffect, useState, useCallback } from "react";
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
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';

const PatientDashboard = () => {
  const { user } = useUser();
  const [data, setData] = useState([]);
  const [alerts, setAlerts] = useState([]);
  const [risk, setRisk] = useState("Low");
  const [devices, setDevices] = useState([]);
  const [timeFilter, setTimeFilter] = useState("7 Days");

  const fetchData = useCallback(async () => {
    try {
      const res = await axios.get(`http://localhost:5001/get-data?user_id=${user.id}`);
      setData(res.data);
    } catch (err) { 
      console.error('Error fetching patient vitals data:', err); 
    }
  }, [user.id]);

  const fetchAlerts = useCallback(async () => {
    try {
      const res = await axios.get(`http://localhost:5001/alerts?user_id=${user.id}`);
      setAlerts(res.data.alerts || []);
      setRisk(res.data.current_risk || "Low");
    } catch (err) { 
      console.error('Error fetching patient alerts:', err); 
    }
  }, [user.id]);

  const fetchDevices = useCallback(async () => {
    try {
      const res = await axios.get(`http://localhost:5001/get-devices?user_id=${user.id}`);
      setDevices(res.data || []);
    } catch (err) { 
      console.error('Error fetching patient devices:', err); 
    }
  }, [user.id]);

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
  }, [fetchData, fetchAlerts, fetchDevices]);

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
    }).slice().reverse();
  };

  const filteredHistory = getFilteredData();

  // Vital Status Helpers
  const getHeartRateStatus = (hr) => {
    if (!hr) return { text: '--', badgeClass: 'badge-teal' };
    if (hr > 100 || hr < 60) return { text: 'Attention', badgeClass: 'badge-warning' };
    return { text: 'Normal', badgeClass: 'badge-success' };
  };

  const getSpo2Status = (spo2) => {
    if (!spo2) return { text: '--', badgeClass: 'badge-teal' };
    if (spo2 < 92) return { text: 'Critical', badgeClass: 'badge-danger' };
    if (spo2 < 94) return { text: 'Attention', badgeClass: 'badge-warning' };
    return { text: 'Normal', badgeClass: 'badge-success' };
  };

  const getTempStatus = (temp) => {
    if (!temp) return { text: '--', badgeClass: 'badge-teal' };
    if (temp > 38.0) return { text: 'Fever', badgeClass: 'badge-danger' };
    if (temp < 35.0) return { text: 'Low Temp', badgeClass: 'badge-warning' };
    return { text: 'Normal', badgeClass: 'badge-success' };
  };

  const getBpStatus = (sys, dia) => {
    if (!sys) return { text: '--', badgeClass: 'badge-teal' };
    if (sys > 140 || dia > 90) return { text: 'Elevated', badgeClass: 'badge-danger' };
    if (sys > 125 || dia > 85) return { text: 'Attention', badgeClass: 'badge-warning' };
    return { text: 'Normal', badgeClass: 'badge-success' };
  };

  const getGlucoseStatus = (glu) => {
    if (!glu) return { text: '--', badgeClass: 'badge-teal' };
    if (glu > 140 || glu < 70) return { text: 'Attention', badgeClass: 'badge-warning' };
    return { text: 'Normal', badgeClass: 'badge-success' };
  };

  const getRiskBadge = (level) => {
    if (level === 'High') return { label: 'High Risk', class: 'badge-danger' };
    if (level === 'Medium') return { label: 'Medium Risk', class: 'badge-warning' };
    return { label: 'Low Risk', class: 'badge-success' };
  };

  const riskBadge = getRiskBadge(risk);

  return (
    <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
      
      {/* 1. Patient Demographic Bar */}
      <div className="page-header">
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.85rem' }}>
          <div style={{ 
            width: '44px', 
            height: '44px', 
            borderRadius: '10px', 
            background: 'var(--primary-light)', 
            border: '1px solid var(--border)',
            display: 'flex', 
            alignItems: 'center', 
            justifyContent: 'center',
            color: 'var(--primary-deep)'
          }}>
            <User size={22} />
          </div>
          <div>
            <h1 className="page-title">{user.full_name}</h1>
            <p className="page-subtitle">
              Patient ID: <span style={{ fontFamily: 'monospace', fontWeight: 600 }}>{user.id}</span> &bull; Rural Health Telemetry
            </p>
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '0.85rem' }}>
          <span className="badge badge-success">
            <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: 'var(--success)' }} />
            Telemetry Active
          </span>
          <div style={{ fontSize: '0.82rem', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
            <Clock size={14} /> Last sync: <strong>{lastUpdatedText}</strong>
          </div>
        </div>
      </div>

      {/* 2. Active Clinical Alerts (if any) */}
      {alerts.length > 0 && (
        <div style={{ 
          background: 'var(--danger-light)', 
          border: '1px solid var(--danger-border)', 
          borderRadius: '10px', 
          padding: '1.1rem 1.4rem',
          marginBottom: '1.5rem'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.6rem' }}>
            <ShieldAlert size={18} color="var(--danger)" />
            <h3 style={{ margin: 0, fontSize: '0.95rem', color: 'var(--danger)', fontWeight: 700 }}>
              Active Clinical Alerts
            </h3>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem', marginBottom: '0.5rem' }}>
            {alerts.map((alertText, i) => (
              <div 
                key={i} 
                style={{ 
                  display: 'flex', 
                  alignItems: 'center', 
                  gap: '0.45rem', 
                  fontSize: '0.85rem', 
                  color: 'var(--danger)', 
                  fontWeight: 600 
                }}
              >
                <AlertTriangle size={14} />
                {alertText} &mdash; parameter outside designated baseline threshold.
              </div>
            ))}
          </div>
          <p style={{ margin: 0, fontSize: '0.75rem', color: 'var(--text-muted)' }}>
            * Clinical alerts indicate vital parameters exceeding nominal baseline ranges.
          </p>
        </div>
      )}

      {/* 3. Current Vital Signs Grid */}
      <section style={{ marginBottom: '1.5rem' }}>
        <div style={{ marginBottom: '0.85rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <h2 style={{ margin: 0, fontSize: '1.1rem', fontWeight: 700, color: 'var(--text-main)' }}>
            Current Vital Signs
          </h2>
          <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
            Updated in real-time
          </span>
        </div>

        <div className="stats-grid">
          <VitalCard 
            icon={Heart} 
            label="Heart Rate" 
            value={latest.heart_rate} 
            unit="BPM" 
            status={getHeartRateStatus(latest.heart_rate)}
            timestamp={lastUpdatedText}
            accentColor="#D94848"
          />
          <VitalCard 
            icon={Droplets} 
            label="Blood Oxygen (SpO₂)" 
            value={latest.spo2} 
            unit="%" 
            status={getSpo2Status(latest.spo2)}
            timestamp={lastUpdatedText}
            accentColor="#109DA6"
          />
          <VitalCard 
            icon={Thermometer} 
            label="Body Temperature" 
            value={latest.temperature} 
            unit="°C" 
            status={getTempStatus(latest.temperature)}
            timestamp={lastUpdatedText}
            accentColor="#D9822B"
          />
          <VitalCard 
            icon={Activity} 
            label="Blood Pressure" 
            value={latest.systolic ? `${latest.systolic}/${latest.diastolic}` : null} 
            unit="mmHg" 
            status={getBpStatus(latest.systolic, latest.diastolic)}
            timestamp={lastUpdatedText}
            accentColor="#087F87"
          />
          <VitalCard 
            icon={Zap} 
            label="Blood Glucose" 
            value={latest.glucose} 
            unit="mg/dL" 
            status={getGlucoseStatus(latest.glucose)}
            timestamp={lastUpdatedText}
            accentColor="#6B5B95"
          />
        </div>
      </section>

      {/* 4. Overall Health Risk & Connected Device Status */}
      <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 1.2fr) minmax(0, 1fr)', gap: '1.5rem', marginBottom: '1.5rem' }}>
        
        {/* Overall Health Risk Assessment */}
        <div className="card">
          <h3 style={{ margin: '0 0 1rem 0', fontSize: '1.05rem', fontWeight: 700, color: 'var(--text-main)' }}>
            Clinical Risk Assessment
          </h3>
          <div style={{ 
            display: 'flex', 
            alignItems: 'center', 
            gap: '1rem', 
            padding: '1.1rem 1.25rem', 
            background: 'var(--bg-body)', 
            border: '1px solid var(--border)', 
            borderRadius: '10px' 
          }}>
            <div style={{
              width: '42px',
              height: '42px',
              borderRadius: '8px',
              background: 'var(--bg-surface)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}>
              {risk === 'High' ? (
                <AlertTriangle size={24} color="var(--danger)" />
              ) : (
                <CheckCircle2 size={24} color="var(--success)" />
              )}
            </div>
            <div>
              <div style={{ fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.04em', color: 'var(--text-muted)', fontWeight: 600 }}>
                Current Classification
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginTop: '0.15rem' }}>
                <span style={{ fontSize: '1.25rem', fontWeight: 700, color: 'var(--text-main)' }}>
                  {risk} Risk
                </span>
                <span className={`badge ${riskBadge.class}`}>
                  {riskBadge.label}
                </span>
              </div>
              <p style={{ margin: '0.25rem 0 0 0', color: 'var(--text-secondary)', fontSize: '0.82rem' }}>
                Automated clinical scoring evaluated against active telemetry streams.
              </p>
            </div>
          </div>
        </div>

        {/* Connected Monitoring Kit Status */}
        <div className="card">
          <h3 style={{ margin: '0 0 1rem 0', fontSize: '1.05rem', fontWeight: 700, color: 'var(--text-main)' }}>
            Telemetry Hardware Units
          </h3>
          {devices.length > 0 ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.65rem' }}>
              {devices.map((dev) => (
                <div key={dev.id} style={{ 
                  padding: '0.75rem 1rem', 
                  background: 'var(--bg-body)', 
                  border: '1px solid var(--border)', 
                  borderRadius: '8px' 
                }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.25rem' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.45rem', fontWeight: 600, fontSize: '0.88rem' }}>
                      <Cpu size={16} color="var(--primary-deep)" />
                      {dev.name}
                    </div>
                    <span className={`badge ${dev.status === 'online' ? 'badge-success' : 'badge-danger'}`} style={{ fontSize: '0.7rem' }}>
                      {dev.status === 'online' ? <Wifi size={10} /> : <WifiOff size={10} />}
                      {dev.status === 'online' ? 'CONNECTED' : 'DISCONNECTED'}
                    </span>
                  </div>
                  <p style={{ margin: 0, fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                    ID: {dev.id.slice(0, 14)}... &bull; Sync: {lastUpdatedText}
                  </p>
                </div>
              ))}
            </div>
          ) : (
            <div style={{ padding: '1.5rem', background: 'var(--bg-body)', borderRadius: '8px', border: '1px solid var(--border)', textAlign: 'center' }}>
              <Cpu size={22} color="var(--text-muted)" style={{ margin: '0 auto 0.35rem' }} />
              <p style={{ margin: 0, fontSize: '0.82rem', color: 'var(--text-muted)' }}>
                No monitoring kit registered for this profile.
              </p>
            </div>
          )}
        </div>
      </div>

      {/* 5. Health History Charts with Filters */}
      <section className="card">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem', flexWrap: 'wrap', gap: '1rem' }}>
          <div>
            <h3 style={{ margin: 0, fontSize: '1.05rem', color: 'var(--text-main)', fontWeight: 700 }}>
              Longitudinal Telemetry Trends
            </h3>
            <p style={{ margin: '0.2rem 0 0 0', fontSize: '0.82rem', color: 'var(--text-muted)' }}>
              Historical progression of Heart Rate, Blood Oxygen (SpO₂), and Temperature
            </p>
          </div>

          {/* Time Filter Tabs */}
          <div className="filter-tabs">
            {['Today', '7 Days', '30 Days'].map((filter) => (
              <button
                key={filter}
                type="button"
                onClick={() => setTimeFilter(filter)}
                className={`filter-tab ${timeFilter === filter ? 'active' : ''}`}
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
                <CartesianGrid strokeDasharray="3 3" stroke="#D7E7E9" />
                <XAxis 
                  dataKey="timestamp" 
                  tick={{ fill: '#8A9A9E', fontSize: 11 }} 
                  tickFormatter={(t) => new Date(t).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} 
                />
                <YAxis tick={{ fill: '#8A9A9E', fontSize: 11 }} />
                <Tooltip 
                  contentStyle={{ 
                    background: '#FFFFFF', 
                    border: '1px solid var(--border)', 
                    borderRadius: '8px', 
                    boxShadow: '0 2px 8px rgba(0,0,0,0.06)', 
                    fontSize: '0.85rem' 
                  }} 
                />
                <Legend wrapperStyle={{ paddingTop: '10px' }} />
                <Line type="monotone" dataKey="heart_rate" stroke="#D94848" name="Heart Rate (BPM)" dot={false} strokeWidth={2} />
                <Line type="monotone" dataKey="spo2" stroke="#109DA6" name="SpO₂ (%)" dot={false} strokeWidth={2} />
                <Line type="monotone" dataKey="temperature" stroke="#D9822B" name="Temp (°C)" dot={false} strokeWidth={2} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        ) : (
          <div style={{ padding: '3rem 1.5rem', textAlign: 'center', background: 'var(--bg-body)', borderRadius: '8px', border: '1px solid var(--border)' }}>
            <Calendar size={26} color="var(--text-muted)" style={{ margin: '0 auto 0.5rem' }} />
            <p style={{ margin: 0, color: 'var(--text-muted)', fontSize: '0.85rem' }}>
              No telemetry records found for selected filter ({timeFilter}).
            </p>
          </div>
        )}
      </section>

    </div>
  );
};

// Clean Vital Stat Card Component
const VitalCard = ({ icon: Icon, label, value, unit, status, timestamp, accentColor }) => (
  <div className="stat-card">
    <div className="stat-card-header">
      <span className="stat-label">{label}</span>
      <div style={{ 
        width: '32px', 
        height: '32px', 
        borderRadius: '6px', 
        background: 'var(--primary-subtle)', 
        border: '1px solid var(--border)',
        display: 'flex', 
        alignItems: 'center', 
        justifyContent: 'center' 
      }}>
        <Icon size={16} color={accentColor} />
      </div>
    </div>

    <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', marginTop: '0.4rem' }}>
      <div className="stat-value">
        {value !== null && value !== undefined ? value : '--'}
        <span style={{ fontSize: '0.82rem', color: 'var(--text-muted)', fontWeight: 500, marginLeft: '0.3rem' }}>
          {unit}
        </span>
      </div>

      <span className={`badge ${status.badgeClass}`}>
        {status.text}
      </span>
    </div>

    <div style={{ 
      marginTop: '0.5rem', 
      fontSize: '0.74rem', 
      color: 'var(--text-muted)', 
      borderTop: '1px solid var(--border-subtle)', 
      paddingTop: '0.4rem', 
      display: 'flex', 
      alignItems: 'center', 
      gap: '0.25rem' 
    }}>
      <Clock size={12} /> Sync: {timestamp}
    </div>
  </div>
);

export default PatientDashboard;
