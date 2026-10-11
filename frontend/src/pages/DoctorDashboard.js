import React, { useEffect, useState, useCallback } from 'react';
import axios from 'axios';
import { 
  User, 
  AlertTriangle, 
  Activity, 
  X, 
  Search, 
  Clock, 
  Heart, 
  Droplets, 
  Thermometer, 
  Zap, 
  CheckCircle2
} from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

const DoctorDashboard = () => {
  const [patients, setPatients] = useState([]);
  const [search, setSearch] = useState('');
  const [filterRisk, setFilterRisk] = useState('ALL');
  const [selectedPatient, setSelectedPatient] = useState(null);
  const [history, setHistory] = useState([]);
  const [loadingHistory, setLoadingHistory] = useState(false);

  const fetchPatients = useCallback(async () => {
    try {
      const res = await axios.get('http://localhost:5001/get-patients');
      const patientsWithRisk = await Promise.all(res.data.map(async (p) => {
        const riskRes = await axios.get(`http://localhost:5001/alerts?user_id=${p.id}`);
        const dataRes = await axios.get(`http://localhost:5001/get-data?user_id=${p.id}`);
        const latestData = dataRes.data && dataRes.data.length > 0 ? dataRes.data[0] : null;
        return { 
          ...p, 
          risk: riskRes.data.current_risk || 'Low', 
          alerts: riskRes.data.alerts || [],
          latestVitals: latestData
        };
      }));
      setPatients(patientsWithRisk);
    } catch (err) { 
      console.error('Error fetching patient directory:', err); 
    }
  }, []);

  useEffect(() => {
    fetchPatients();
    const interval = setInterval(fetchPatients, 10000);
    return () => clearInterval(interval);
  }, [fetchPatients]);

  const fetchHistory = async (patient) => {
    setLoadingHistory(true);
    setSelectedPatient(patient);
    try {
      const res = await axios.get(`http://localhost:5001/get-data?user_id=${patient.id}`);
      setHistory(res.data.reverse());
    } catch (err) { 
      console.error('Error fetching patient clinical history:', err); 
    }
    setLoadingHistory(false);
  };

  const stats = {
    total: patients.length,
    attention: patients.filter(p => p.risk === 'High' || p.risk === 'Medium').length,
    high: patients.filter(p => p.risk === 'High').length,
    normal: patients.filter(p => p.risk === 'Low').length
  };

  const filteredPatients = patients.filter(p => {
    const matchesSearch = p.full_name.toLowerCase().includes(search.toLowerCase()) || 
                          p.id.toLowerCase().includes(search.toLowerCase());
    const matchesRisk = filterRisk === 'ALL' || p.risk === filterRisk;
    return matchesSearch && matchesRisk;
  });

  const getStatusBadge = (risk) => {
    if (risk === 'High') return { label: 'High Risk', class: 'badge-danger' };
    if (risk === 'Medium') return { label: 'Attention', class: 'badge-warning' };
    return { label: 'Normal', class: 'badge-success' };
  };

  return (
    <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
      
      {/* 1. Page Header Panel */}
      <div className="page-header">
        <div>
          <h1 className="page-title">Healthcare Provider Patient Portal</h1>
          <p className="page-subtitle">
            Rural Clinical Monitoring & Patient Triage System
          </p>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <span className="badge badge-success">
            <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: 'var(--success)' }} />
            Telemetry Stream Active
          </span>
        </div>
      </div>

      {/* 2. Overview Statistics */}
      <div className="stats-grid">
        <div className="stat-card" style={{ borderLeft: '4px solid var(--primary-deep)' }}>
          <span className="stat-label">Total Registered Patients</span>
          <span className="stat-value">{stats.total}</span>
        </div>
        <div className="stat-card" style={{ borderLeft: '4px solid var(--warning)' }}>
          <span className="stat-label">Requires Attention</span>
          <span className="stat-value" style={{ color: 'var(--warning)' }}>{stats.attention}</span>
        </div>
        <div className="stat-card" style={{ borderLeft: '4px solid var(--danger)' }}>
          <span className="stat-label">High Risk Priority</span>
          <span className="stat-value" style={{ color: 'var(--danger)' }}>{stats.high}</span>
        </div>
        <div className="stat-card" style={{ borderLeft: '4px solid var(--success)' }}>
          <span className="stat-label">Normal / Stable</span>
          <span className="stat-value" style={{ color: 'var(--success)' }}>{stats.normal}</span>
        </div>
      </div>

      {/* 3. Search & Risk Filter Controls */}
      <div className="card" style={{ marginBottom: '1.5rem', padding: '1rem 1.25rem' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
          
          {/* Search Box */}
          <div className="search-box" style={{ flex: 1, minWidth: '260px', maxWidth: '440px' }}>
            <Search size={16} color="var(--text-muted)" />
            <input 
              type="text" 
              placeholder="Search patients by name or ID..." 
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>

          {/* Filter Tabs */}
          <div className="filter-tabs">
            {[
              { id: 'ALL', label: 'All Patients' },
              { id: 'High', label: 'High Risk' },
              { id: 'Medium', label: 'Attention' },
              { id: 'Low', label: 'Normal' }
            ].map(f => (
              <button
                key={f.id}
                type="button"
                onClick={() => setFilterRisk(f.id)}
                className={`filter-tab ${filterRisk === f.id ? 'active' : ''}`}
              >
                {f.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* 4. Patient Triage List Table */}
      <section className="card" style={{ padding: 0, overflow: 'hidden', marginBottom: '1.5rem' }}>
        <div style={{ padding: '1rem 1.25rem', borderBottom: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <h3 style={{ margin: 0, fontSize: '1rem', color: 'var(--text-main)', fontWeight: 600 }}>
            Patient Triage Queue ({filteredPatients.length})
          </h3>
          <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
            Auto-refreshes every 10 seconds
          </span>
        </div>

        <div style={{ overflowX: 'auto' }}>
          <table>
            <thead>
              <tr>
                <th style={{ textAlign: 'left' }}>Patient Details</th>
                <th style={{ textAlign: 'left' }}>Triage Status</th>
                <th style={{ textAlign: 'left' }}>Latest Vital Reading</th>
                <th style={{ textAlign: 'left' }}>Active Alerts</th>
                <th style={{ textAlign: 'left' }}>Last Updated</th>
                <th style={{ textAlign: 'right' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredPatients.map((patient) => {
                const status = getStatusBadge(patient.risk);
                const latest = patient.latestVitals;
                const lastUpdated = latest && latest.timestamp 
                  ? new Date(latest.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
                  : 'No data';

                return (
                  <tr key={patient.id}>
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
                        <div style={{ 
                          width: '34px', 
                          height: '34px', 
                          borderRadius: '6px', 
                          background: 'var(--primary-light)', 
                          border: '1px solid var(--border)', 
                          display: 'flex', 
                          alignItems: 'center', 
                          justifyContent: 'center',
                          color: 'var(--primary-deep)',
                          fontWeight: 600,
                          fontSize: '0.85rem'
                        }}>
                          {patient.full_name ? patient.full_name.charAt(0).toUpperCase() : <User size={16} />}
                        </div>
                        <div>
                          <div style={{ fontWeight: 600, color: 'var(--text-main)', fontSize: '0.9rem' }}>{patient.full_name}</div>
                          <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontFamily: 'monospace' }}>ID: {patient.id.slice(0, 8)}</div>
                        </div>
                      </div>
                    </td>

                    <td>
                      <span className={`badge ${status.class}`}>
                        {status.label}
                      </span>
                    </td>

                    <td>
                      {latest ? (
                        <div style={{ fontSize: '0.85rem', color: 'var(--text-main)' }}>
                          <strong>{latest.heart_rate || '--'}</strong> BPM &bull; <strong>{latest.spo2 || '--'}%</strong> SpO₂ &bull; <strong>{latest.temperature || '--'}°C</strong>
                        </div>
                      ) : (
                        <span style={{ fontSize: '0.82rem', color: 'var(--text-muted)' }}>No readings recorded</span>
                      )}
                    </td>

                    <td>
                      {patient.alerts.length > 0 ? (
                        <div style={{ display: 'flex', gap: '0.3rem', flexWrap: 'wrap' }}>
                          {patient.alerts.map((a, i) => (
                            <span key={i} className="badge badge-danger" style={{ fontSize: '0.72rem', padding: '0.15rem 0.45rem' }}>
                              <AlertTriangle size={11} /> {a}
                            </span>
                          ))}
                        </div>
                      ) : (
                        <span style={{ fontSize: '0.8rem', color: 'var(--success)', fontWeight: 500, display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                          <CheckCircle2 size={13} color="var(--success)" /> None
                        </span>
                      )}
                    </td>

                    <td style={{ fontSize: '0.82rem', color: 'var(--text-muted)' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
                        <Clock size={12} /> {lastUpdated}
                      </div>
                    </td>

                    <td style={{ textAlign: 'right' }}>
                      <button
                        type="button"
                        onClick={() => fetchHistory(patient)}
                        className="btn-secondary"
                        style={{ padding: '0.35rem 0.75rem', fontSize: '0.8rem' }}
                      >
                        View Details
                      </button>
                    </td>
                  </tr>
                );
              })}

              {filteredPatients.length === 0 && (
                <tr>
                  <td colSpan="6" style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-muted)' }}>
                    No patients match your search or selected risk filter.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </section>

      {/* 5. Patient Details & Clinical Telemetry Modal */}
      {selectedPatient && (
        <div style={{ 
          position: 'fixed', 
          inset: 0, 
          background: 'rgba(52, 69, 74, 0.45)', 
          backdropFilter: 'blur(2px)', 
          display: 'flex', 
          alignItems: 'center', 
          justifyContent: 'center', 
          zIndex: 1000, 
          padding: '1.5rem' 
        }}>
          <div className="card" style={{ width: '100%', maxWidth: '920px', maxHeight: '90vh', overflowY: 'auto', position: 'relative', padding: '1.75rem' }}>
            
            {/* Close Button */}
            <button 
              type="button"
              onClick={() => setSelectedPatient(null)}
              style={{ 
                position: 'absolute', 
                right: '1.25rem', 
                top: '1.25rem', 
                width: 'auto', 
                background: 'var(--bg-body)', 
                border: '1px solid var(--border)',
                color: 'var(--text-muted)',
                padding: '0.35rem',
                borderRadius: '6px'
              }}
            >
              <X size={18} />
            </button>
            
            {/* Patient Header */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', borderBottom: '1px solid var(--border)', paddingBottom: '1rem', marginBottom: '1.25rem' }}>
              <div>
                <h2 style={{ margin: 0, fontSize: '1.3rem', color: 'var(--text-main)', fontWeight: 700 }}>
                  {selectedPatient.full_name}
                </h2>
                <p style={{ margin: '0.2rem 0 0 0', color: 'var(--text-muted)', fontSize: '0.85rem' }}>
                  Patient ID: <span style={{ fontFamily: 'monospace', fontWeight: 600 }}>{selectedPatient.id}</span>
                </p>
              </div>

              {(() => {
                const status = getStatusBadge(selectedPatient.risk);
                return (
                  <span className={`badge ${status.class}`} style={{ marginRight: '2.5rem', fontSize: '0.8rem', padding: '0.3rem 0.75rem' }}>
                    {status.label}
                  </span>
                );
              })()}
            </div>

            {loadingHistory ? (
              <p style={{ color: 'var(--text-muted)', padding: '2rem', textAlign: 'center' }}>Loading clinical records...</p>
            ) : (
              <>
                {/* Active Alerts in Modal */}
                {selectedPatient.alerts && selectedPatient.alerts.length > 0 && (
                  <div style={{ background: 'var(--danger-light)', border: '1px solid var(--danger-border)', padding: '0.75rem 1rem', borderRadius: '8px', marginBottom: '1.25rem' }}>
                    <h4 style={{ margin: '0 0 0.35rem 0', fontSize: '0.85rem', color: 'var(--danger)', display: 'flex', alignItems: 'center', gap: '0.35rem', fontWeight: 700 }}>
                      <AlertTriangle size={15} /> Clinical Warnings Detected
                    </h4>
                    <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                      {selectedPatient.alerts.map((a, i) => (
                        <span key={i} style={{ fontSize: '0.82rem', color: 'var(--danger)', fontWeight: 600 }}>
                          &bull; {a}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {/* Most Recent Telemetry Reading */}
                {history.length > 0 && (
                  <div style={{ marginBottom: '1.5rem' }}>
                    <h4 style={{ margin: '0 0 0.75rem 0', fontSize: '0.95rem', color: 'var(--text-main)', fontWeight: 600 }}>
                      Most Recent Telemetry Reading
                    </h4>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))', gap: '0.75rem' }}>
                      <ModalVitalCard icon={Heart} label="Heart Rate" value={history[history.length - 1].heart_rate} unit="BPM" color="#D94848" />
                      <ModalVitalCard icon={Droplets} label="SpO2" value={history[history.length - 1].spo2} unit="%" color="#109DA6" />
                      <ModalVitalCard icon={Thermometer} label="Body Temp" value={history[history.length - 1].temperature} unit="°C" color="#D9822B" />
                      <ModalVitalCard icon={Activity} label="Blood Pressure" value={history[history.length - 1].systolic ? `${history[history.length - 1].systolic}/${history[history.length - 1].diastolic}` : '--'} unit="mmHg" color="#087F87" />
                      <ModalVitalCard icon={Zap} label="Glucose" value={history[history.length - 1].glucose} unit="mg/dL" color="#6B5B95" />
                    </div>
                  </div>
                )}

                {/* Longitudinal Vital Telemetry Chart */}
                <div style={{ height: '260px', marginBottom: '1.5rem', padding: '0.85rem', background: 'var(--bg-body)', borderRadius: '8px', border: '1px solid var(--border)' }}>
                  <h4 style={{ margin: '0 0 0.5rem 0', fontSize: '0.85rem', color: 'var(--text-secondary)', fontWeight: 600 }}>
                    Longitudinal Telemetry Trend Curve
                  </h4>
                  <ResponsiveContainer width="100%" height="82%">
                    <LineChart data={history}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#D7E7E9" />
                      <XAxis dataKey="timestamp" tick={{ fill: '#8A9A9E', fontSize: 10 }} tickFormatter={(t) => new Date(t).toLocaleTimeString([], { hour:'2-digit', minute:'2-digit' })} />
                      <YAxis tick={{ fill: '#8A9A9E', fontSize: 10 }} />
                      <Tooltip contentStyle={{ background: '#FFFFFF', border: '1px solid var(--border)', borderRadius: '6px', fontSize: '0.82rem' }} />
                      <Line type="monotone" dataKey="heart_rate" stroke="#D94848" name="Heart Rate (BPM)" dot={false} strokeWidth={2} />
                      <Line type="monotone" dataKey="spo2" stroke="#109DA6" name="SpO2 (%)" dot={false} strokeWidth={2} />
                      <Line type="monotone" dataKey="temperature" stroke="#D9822B" name="Temp (°C)" dot={false} strokeWidth={2} />
                    </LineChart>
                  </ResponsiveContainer>
                </div>

                {/* Recorded Telemetry Logs Table */}
                <h4 style={{ margin: '0 0 0.65rem 0', fontSize: '0.92rem', color: 'var(--text-main)', fontWeight: 600 }}>
                  Recorded Telemetry Logs ({history.length})
                </h4>
                <div style={{ overflowX: 'auto', maxHeight: '200px', overflowY: 'auto' }}>
                  <table>
                    <thead>
                      <tr>
                        <th style={{ textAlign: 'left' }}>Time</th>
                        <th style={{ textAlign: 'left' }}>Heart Rate</th>
                        <th style={{ textAlign: 'left' }}>SpO2</th>
                        <th style={{ textAlign: 'left' }}>Temperature</th>
                        <th style={{ textAlign: 'left' }}>Blood Pressure</th>
                        <th style={{ textAlign: 'left' }}>Glucose</th>
                        <th style={{ textAlign: 'left' }}>Classification</th>
                      </tr>
                    </thead>
                    <tbody>
                      {history.slice().reverse().map((d, i) => (
                        <tr key={i}>
                          <td>{new Date(d.timestamp).toLocaleString()}</td>
                          <td style={{ fontWeight: 600 }}>{d.heart_rate} BPM</td>
                          <td style={{ fontWeight: 600 }}>{d.spo2}%</td>
                          <td style={{ fontWeight: 600 }}>{d.temperature}°C</td>
                          <td style={{ fontWeight: 600 }}>{d.systolic ? `${d.systolic}/${d.diastolic}` : '--'}</td>
                          <td style={{ fontWeight: 600 }}>{d.glucose || '--'} mg/dL</td>
                          <td>
                            <span className={`badge ${d.risk_level === 'High' ? 'badge-danger' : d.risk_level === 'Medium' ? 'badge-warning' : 'badge-success'}`}>
                              {d.risk_level}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

const ModalVitalCard = ({ icon: Icon, label, value, unit, color }) => (
  <div style={{ padding: '0.75rem 0.85rem', background: 'var(--bg-body)', border: '1px solid var(--border)', borderRadius: '6px' }}>
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.2rem' }}>
      <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)', fontWeight: 600, textTransform: 'uppercase' }}>{label}</span>
      <Icon size={14} color={color} />
    </div>
    <div style={{ fontSize: '1.15rem', fontWeight: 700, color: 'var(--text-main)' }}>
      {value !== null && value !== undefined ? value : '--'}
      <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 500, marginLeft: '0.25rem' }}>{unit}</span>
    </div>
  </div>
);

export default DoctorDashboard;
