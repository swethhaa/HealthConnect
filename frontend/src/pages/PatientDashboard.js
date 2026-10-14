import React, { useEffect, useState, useCallback } from "react";
import api from "../api";
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
  const [trendData, setTrendData] = useState([]);
  const [alerts, setAlerts] = useState([]);
  const [risk, setRisk] = useState("Low");
  const [devices, setDevices] = useState([]);
  const [timeFilter, setTimeFilter] = useState("7 Days");
  const [loadingData, setLoadingData] = useState(true);
  const [dataError, setDataError] = useState('');
  const [simulation, setSimulation] = useState(null);
  const [simulationMode, setSimulationMode] = useState('normal');
  const [simulationInterval, setSimulationInterval] = useState(5);
  const [simulationLoading, setSimulationLoading] = useState(false);
  const [simulationError, setSimulationError] = useState('');

  const fetchData = useCallback(async () => {
    setDataError('');
    try {
      const [latestResponse, trendResponse] = await Promise.all([
        api.get('/get-data', { params: { user_id: user.id } }),
        api.get('/get-data', { params: { user_id: user.id, period: timeFilter } }),
      ]);
      setData(latestResponse.data);
      setTrendData(trendResponse.data.filter((item) => Number.isFinite(Date.parse(item.timestamp))));
    } catch (err) { 
      console.error('Error fetching patient vitals data:', err); 
      setDataError(err.response?.data?.error || 'Unable to load health readings. Please try again.');
    } finally {
      setLoadingData(false);
    }
  }, [user.id, timeFilter]);

  const fetchAlerts = useCallback(async () => {
    try {
      const res = await api.get('/alerts', { params: { user_id: user.id } });
      setAlerts(res.data.alerts || []);
      setRisk(res.data.current_risk || "Low");
    } catch (err) { 
      console.error('Error fetching patient alerts:', err); 
    }
  }, [user.id]);

  const fetchDevices = useCallback(async () => {
    try {
      const res = await api.get('/get-devices', { params: { user_id: user.id } });
      setDevices(res.data || []);
    } catch (err) { 
      console.error('Error fetching patient devices:', err); 
    }
  }, [user.id]);

  const fetchSimulationStatus = useCallback(async () => {
    try {
      const res = await api.get('/simulation/status');
      setSimulation(res.data);
      if (res.data.status === 'running') {
        setSimulationMode(res.data.mode);
        setSimulationInterval(res.data.interval_seconds);
      }
      if (res.data.status === 'error') {
        setSimulationError(res.data.error || 'The simulator stopped unexpectedly.');
      }
    } catch (err) {
      setSimulationError(err.response?.data?.error || 'Unable to read simulator status.');
    }
  }, []);

  useEffect(() => {
    fetchData();
    fetchAlerts();
    fetchDevices();
    fetchSimulationStatus();

    const interval = setInterval(() => {
      fetchData();
      fetchAlerts();
      fetchSimulationStatus();
    }, 10000);

    return () => clearInterval(interval);
  }, [fetchData, fetchAlerts, fetchDevices, fetchSimulationStatus]);

  const controlSimulation = async (action) => {
    setSimulationLoading(true);
    setSimulationError('');
    try {
      const response = action === 'start'
        ? await api.post('/simulation/start', {
          mode: simulationMode,
          interval_seconds: Number(simulationInterval),
        })
        : await api.post('/simulation/stop');
      setSimulation(response.data);
      fetchData();
      fetchAlerts();
    } catch (err) {
      setSimulationError(err.response?.data?.error || 'Unable to update the simulation. Please try again.');
    } finally {
      setSimulationLoading(false);
      fetchSimulationStatus();
    }
  };

  const latest = data[0] || {};
  const latestDate = latest.timestamp ? new Date(latest.timestamp) : null;
  const lastUpdatedText = latestDate && Number.isFinite(latestDate.getTime())
    ? latestDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })
    : 'No data';
  const filteredHistory = trendData;

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
          <span className={`badge ${simulation?.status === 'running' ? 'badge-success' : 'badge-warning'}`}>
            <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: simulation?.status === 'running' ? 'var(--success)' : 'var(--warning)' }} />
            {simulation?.status === 'running' ? 'Synthetic Simulation Active' : simulation ? 'Simulation Stopped' : 'Checking simulation status…'}
          </span>
          <div style={{ fontSize: '0.82rem', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
            <Clock size={14} /> Last sync: <strong>{lastUpdatedText}</strong>
          </div>
        </div>
      </div>

      <section
        className="card"
        style={{
          marginBottom: '1.5rem',
          border: `1px solid ${simulation?.mode === 'abnormal' && simulation.status === 'running' ? 'var(--danger-border)' : 'var(--border)'}`,
          background: simulation?.mode === 'abnormal' && simulation.status === 'running' ? 'var(--danger-light)' : undefined,
        }}
      >
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '1rem', flexWrap: 'wrap' }}>
          <div>
            <h2 style={{ margin: '0 0 0.4rem', fontSize: '1rem', color: 'var(--text-main)' }}>
              SIMULATION MODE — NO PHYSICAL SENSOR CONNECTED
            </h2>
            <p style={{ margin: 0, color: 'var(--text-muted)', fontSize: '0.82rem', maxWidth: '680px' }}>
              All generated values are synthetic demonstration data, not medical measurements or diagnoses.
              The backend calculates risk from each stored reading.
            </p>
            {simulation?.mode === 'abnormal' && simulation.status === 'running' && (
              <span className="badge badge-danger" style={{ marginTop: '0.65rem' }}>
                ABNORMAL SYNTHETIC READINGS ACTIVE
              </span>
            )}
          </div>
          <span className={`badge ${simulation?.status === 'running' ? 'badge-success' : simulation?.status === 'error' ? 'badge-danger' : 'badge-warning'}`}>
            {simulation?.status === 'running' ? 'RUNNING' : simulation?.status === 'error' ? 'ERROR' : simulation ? 'STOPPED' : 'CHECKING STATUS'}
          </span>
        </div>

        <div style={{ display: 'flex', alignItems: 'end', gap: '0.75rem', flexWrap: 'wrap', marginTop: '1rem' }}>
          <label style={{ display: 'grid', gap: '0.3rem', fontSize: '0.78rem', fontWeight: 600, color: 'var(--text-secondary)' }}>
            Simulation profile
            <select
              value={simulationMode}
              onChange={(event) => setSimulationMode(event.target.value)}
              disabled={simulationLoading || simulation?.status === 'running'}
              style={{ marginBottom: 0 }}
            >
              <option value="normal">Normal</option>
              <option value="abnormal">Abnormal (demonstration alert)</option>
            </select>
          </label>
          <label style={{ display: 'grid', gap: '0.3rem', fontSize: '0.78rem', fontWeight: 600, color: 'var(--text-secondary)' }}>
            Interval (seconds)
            <input
              type="number"
              min={simulation?.interval_bounds?.minimum || 5}
              max={simulation?.interval_bounds?.maximum || 3600}
              step="1"
              value={simulationInterval}
              onChange={(event) => setSimulationInterval(event.target.value)}
              disabled={simulationLoading || simulation?.status === 'running'}
              style={{ width: '140px', marginBottom: 0 }}
            />
          </label>
          {simulation?.status === 'running' ? (
            <button type="button" className="btn-secondary" onClick={() => controlSimulation('stop')} disabled={simulationLoading}>
              {simulationLoading ? 'Stopping…' : 'Stop simulation'}
            </button>
          ) : (
            <button type="button" className="btn-primary" onClick={() => controlSimulation('start')} disabled={simulationLoading}>
              {simulationLoading ? 'Starting…' : 'Start simulation'}
            </button>
          )}
          <span style={{ color: 'var(--text-muted)', fontSize: '0.8rem' }}>
            Last successful reading: {simulation?.last_reading_at || 'None yet'}
          </span>
        </div>
        {simulationError && (
          <p role="alert" style={{ margin: '0.8rem 0 0', color: 'var(--danger)', fontSize: '0.85rem' }}>
            {simulationError}
          </p>
        )}
        {simulation?.mode === 'abnormal' && (
          <p style={{ margin: '0.75rem 0 0', color: 'var(--text-secondary)', fontSize: '0.8rem' }}>
            {simulation.status === 'running'
              ? 'Demo profile: elevated heart rate, temperature, blood pressure and glucose with reduced SpO₂. Stop the simulation before switching profiles.'
              : 'Abnormal demo profile selected: elevated heart rate, temperature, blood pressure and glucose with reduced SpO₂. Start the simulation to generate synthetic alerts.'}
          </p>
        )}
      </section>

      {latest.source === 'unknown' && (
        <div style={{ marginBottom: '1rem', padding: '0.8rem 1rem', border: '1px solid var(--warning-border)', borderRadius: '8px', color: 'var(--text-main)', background: 'var(--warning-light)', fontSize: '0.85rem' }}>
          This legacy reading has no recorded origin. It is not presented as a verified physical measurement.
        </div>
      )}
      {dataError && (
        <div role="alert" style={{ marginBottom: '1rem', padding: '0.8rem 1rem', border: '1px solid var(--danger-border)', borderRadius: '8px', color: 'var(--danger)', background: 'var(--danger-light)' }}>
          {dataError}
        </div>
      )}

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
            {trendData.some((item) => item.simulated || item.unverified) && (
              <p style={{ margin: '0.35rem 0 0', fontSize: '0.78rem', color: 'var(--warning)' }}>
                Synthetic readings and/or legacy readings with unverified origin are included in this trend.
              </p>
            )}
          </div>

          {/* Time Filter Tabs */}
          <div className="filter-tabs">
            {['Today', '7 Days', '30 Days'].map((filter) => (
              <button
                key={filter}
                type="button"
                onClick={() => {
                  setLoadingData(true);
                  setTimeFilter(filter);
                }}
                className={`filter-tab ${timeFilter === filter ? 'active' : ''}`}
              >
                {filter}
              </button>
            ))}
          </div>
        </div>

        {loadingData ? (
          <div role="status" style={{ padding: '3rem 1.5rem', textAlign: 'center', color: 'var(--text-muted)' }}>Loading readings…</div>
        ) : filteredHistory.length > 0 ? (
          <div style={{ height: '320px', width: '100%' }}>
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={filteredHistory}>
                <CartesianGrid strokeDasharray="3 3" stroke="#D7E7E9" />
                <XAxis 
                  dataKey="timestamp" 
                  tick={{ fill: '#8A9A9E', fontSize: 11 }} 
                  tickFormatter={(t) => {
                    const date = new Date(t);
                    return timeFilter === 'Today'
                      ? date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
                      : date.toLocaleString([], { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
                  }}
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
