import React, { useEffect, useState } from 'react';
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
  const [filterRisk, setFilterRisk] = useState('ALL'); // ALL, High, Medium, Low
  const [selectedPatient, setSelectedPatient] = useState(null);
  const [history, setHistory] = useState([]);
  const [loadingHistory, setLoadingHistory] = useState(false);

  useEffect(() => {
    fetchPatients();
    const interval = setInterval(fetchPatients, 10000); // Update every 10s
    return () => clearInterval(interval);
  }, []);

  const fetchPatients = async () => {
    try {
      const res = await axios.get('http://localhost:5001/get-patients');
      const patientsWithRisk = await Promise.all(res.data.map(async (p) => {
        const riskRes = await axios.get(`http://localhost:5001/alerts?user_id=${p.id}`);
        // Fetch latest telemetry for timestamps
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
  };

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

  // Real statistics derived directly from backend data
  const stats = {
    total: patients.length,
    attention: patients.filter(p => p.risk === 'High' || p.risk === 'Medium').length,
    high: patients.filter(p => p.risk === 'High').length,
    normal: patients.filter(p => p.risk === 'Low').length
  };

  // Filtered patients list based on search and risk filter
  const filteredPatients = patients.filter(p => {
    const matchesSearch = p.full_name.toLowerCase().includes(search.toLowerCase()) || 
                          p.id.toLowerCase().includes(search.toLowerCase());
    const matchesRisk = filterRisk === 'ALL' || p.risk === filterRisk;
    return matchesSearch && matchesRisk;
  });

  const getStatusBadge = (risk) => {
    if (risk === 'High') {
      return { label: 'High Risk', bg: 'var(--danger-light)', border: 'var(--danger-border)', color: 'var(--danger)' };
    }
    if (risk === 'Medium') {
      return { label: 'Attention', bg: 'var(--warning-light)', border: 'var(--warning-border)', color: 'var(--warning)' };
    }
    return { label: 'Normal', bg: 'var(--success-light)', border: 'var(--success-border)', color: 'var(--success)' };
  };

  return (
    <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
      
      {/* Page Header */}
      <header className="card" style={{ marginBottom: '1.5rem', padding: '1.25rem 1.5rem' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
          <div>
            <h1 style={{ margin: 0, fontSize: '1.5rem', color: 'var(--text-main)', fontWeight: 700 }}>
              Healthcare Provider Patient Portal
            </h1>
            <p style={{ margin: '0.2rem 0 0 0', color: 'var(--text-muted)', fontSize: '0.875rem' }}>
              Rural Clinical Monitoring & Patient Triage System
            </p>
          </div>
          <div style={{ 
            display: 'flex', 
            alignItems: 'center', 
            gap: '0.4rem', 
            padding: '0.4rem 0.85rem', 
            background: 'var(--primary-subtle)', 
            border: '1px solid var(--primary-light)', 
            borderRadius: '99px',
            fontSize: '0.8rem',
            color: 'var(--primary)',
            fontWeight: 600
          }}>
            <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: 'var(--primary)' }}></span>
            Real-time Telemetry Active
          </div>
        </div>
      </header>

      {/* 1. Overview Statistics */}
      <div className="stats-grid" style={{ marginBottom: '1.5rem' }}>
        <div className="stat-card" style={{ borderLeft: '4px solid var(--primary)' }}>
          <span className="stat-label">Total Registered Patients</span>
          <span className="stat-value">{stats.total}</span>
        </div>
        <div className="stat-card" style={{ borderLeft: '4px solid var(--warning)' }}>
          <span className="stat-label">Patients Requiring Attention</span>
          <span className="stat-value" style={{ color: 'var(--warning)' }}>{stats.attention}</span>
        </div>
        <div className="stat-card" style={{ borderLeft: '4px solid var(--danger)' }}>
          <span className="stat-label">High Risk Priority</span>
          <span className="stat-value" style={{ color: 'var(--danger)' }}>{stats.high}</span>
        </div>
        <div className="stat-card" style={{ borderLeft: '4px solid var(--success)' }}>
          <span className="stat-label">Normal / Stable Patients</span>
          <span className="stat-value" style={{ color: 'var(--success)' }}>{stats.normal}</span>
        </div>
      </div>

      {/* Search & Risk Filter Controls */}
      <div className="card" style={{ marginBottom: '1.5rem', padding: '1.25rem' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
          
          {/* Search Input */}
          <div style={{ position: 'relative', flex: 1, minWidth: '260px' }}>
            <Search size={18} style={{ position: 'absolute', left: '0.85rem', top: '0.7rem', color: 'var(--text-muted)' }} />
            <input 
              type="text" 
              placeholder="Search patients by name or ID..." 
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              style={{ paddingLeft: '2.5rem', marginBottom: 0 }}
            />
          </div>

          {/* Filter Pills */}
          <div style={{ display: 'flex', gap: '0.35rem', background: 'var(--border-subtle)', padding: '0.25rem', borderRadius: '0.5rem', border: '1px solid var(--border)' }}>
            {[
              { id: 'ALL', label: 'All Patients' },
              { id: 'High', label: 'High Risk' },
              { id: 'Medium', label: 'Attention' },
              { id: 'Low', label: 'Normal' }
            ].map(f => (
              <button
                key={f.id}
                onClick={() => setFilterRisk(f.id)}
                style={{
                  background: filterRisk === f.id ? 'var(--bg-surface)' : 'transparent',
                  color: filterRisk === f.id ? 'var(--primary)' : 'var(--text-muted)',
                  border: filterRisk === f.id ? '1px solid var(--border)' : 'none',
                  padding: '0.4rem 0.85rem',
                  fontSize: '0.8rem',
                  fontWeight: 600,
                  borderRadius: '0.375rem',
                  cursor: 'pointer',
                  width: 'auto',
                  boxShadow: filterRisk === f.id ? '0 1px 2px rgba(0,0,0,0.05)' : 'none'
                }}
              >
                {f.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* 2 & 3. Patient List Table */}
      <section className="card" style={{ padding: 0, overflowX: 'auto', marginBottom: '1.5rem' }}>
        <div style={{ padding: '1rem 1.25rem', borderBottom: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <h3 style={{ margin: 0, fontSize: '1.05rem', color: 'var(--text-main)', fontWeight: 700 }}>
            Patient Triage List ({filteredPatients.length})
          </h3>
          <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
            Auto-refreshes every 10 seconds
          </span>
        </div>

        <table>
          <thead>
            <tr>
              <th style={{ textAlign: 'left' }}>Patient Details</th>
              <th style={{ textAlign: 'left' }}>Triage Status</th>
              <th style={{ textAlign: 'left' }}>Latest Vital Reading</th>
              <th style={{ textAlign: 'left' }}>Active Alerts</th>
              <th style={{ textAlign: 'left' }}>Last Updated</th>
              <th style={{ textAlign: 'right' }}>Action</th>
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
                      <div style={{ width: '36px', height: '36px', borderRadius: '8px', background: 'var(--primary-subtle)', border: '1px solid var(--primary-light)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <User size={18} color="var(--primary)" />
                      </div>
                      <div>
                        <div style={{ fontWeight: 600, color: 'var(--text-main)', fontSize: '0.9rem' }}>{patient.full_name}</div>
                        <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>ID: {patient.id.slice(0, 8)}</div>
                      </div>
                    </div>
                  </td>

                  <td>
                    <span style={{ 
                      fontSize: '0.75rem', 
                      fontWeight: 700, 
                      padding: '0.25rem 0.65rem', 
                      borderRadius: '0.375rem',
                      background: status.bg,
                      border: `1px solid ${status.border}`,
                      color: status.color,
                      display: 'inline-block'
                    }}>
                      {status.label}
                    </span>
                  </td>

                  <td>
                    {latest ? (
                      <div style={{ fontSize: '0.85rem', color: 'var(--text-main)' }}>
                        <strong>{latest.heart_rate || '--'}</strong> BPM &bull; <strong>{latest.spo2 || '--'}%</strong> SpO₂ &bull; <strong>{latest.temperature || '--'}°C</strong>
                      </div>
                    ) : (
                      <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>No readings recorded</span>
                    )}
                  </td>

                  <td>
                    {patient.alerts.length > 0 ? (
                      <div style={{ display: 'flex', gap: '0.35rem', flexWrap: 'wrap' }}>
                        {patient.alerts.map((a, i) => (
                          <span key={i} style={{ 
                            fontSize: '0.7rem', 
                            fontWeight: 600, 
                            color: 'var(--danger)', 
                            background: 'var(--danger-light)', 
                            padding: '0.15rem 0.45rem', 
                            borderRadius: '0.25rem',
                            border: '1px solid var(--danger-border)',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '0.25rem'
                          }}>
                            <AlertTriangle size={10} /> {a}
                          </span>
                        ))}
                      </div>
                    ) : (
                      <span style={{ fontSize: '0.8rem', color: 'var(--success)', fontWeight: 500, display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                        <CheckCircle2 size={13} color="var(--success)" /> None
                      </span>
                    )}
                  </td>

                  <td style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
                      <Clock size={12} /> {lastUpdated}
                    </div>
                  </td>

                  <td style={{ textAlign: 'right' }}>
                    <button
                      onClick={() => fetchHistory(patient)}
                      style={{
                        background: 'var(--primary-subtle)',
                        color: 'var(--primary)',
                        border: '1px solid var(--primary-light)',
                        padding: '0.35rem 0.75rem',
                        fontSize: '0.8rem',
                        fontWeight: 600,
                        width: 'auto'
                      }}
                    >
                      View Patient Details
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
      </section>

      {/* 4. Patient Details & Clinical Telemetry Modal */}
      {selectedPatient && (
        <div style={{ 
          position: 'fixed', 
          inset: 0, 
          background: 'rgba(15, 23, 42, 0.6)', 
          backdropFilter: 'blur(2px)', 
          display: 'flex', 
          alignItems: 'center', 
          justifyContent: 'center', 
          zIndex: 1000, 
          padding: '1.5rem' 
        }}>
          <div className="card" style={{ width: '100%', maxWidth: '950px', maxHeight: '90vh', overflowY: 'auto', position: 'relative', padding: '2rem' }}>
            
            {/* Close Button */}
            <button 
              onClick={() => setSelectedPatient(null)}
              style={{ 
                position: 'absolute', 
                right: '1.25rem', 
                top: '1.25rem', 
                width: 'auto', 
                background: 'var(--bg-body)', 
                border: '1px solid var(--border)',
                color: 'var(--text-muted)',
                padding: '0.4rem',
                borderRadius: '0.375rem'
              }}
            >
              <X size={20} />
            </button>
            
            {/* Patient Header */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', borderBottom: '1px solid var(--border)', paddingBottom: '1rem', marginBottom: '1.5rem' }}>
              <div>
                <h2 style={{ margin: 0, fontSize: '1.4rem', color: 'var(--text-main)', fontWeight: 700 }}>
                  {selectedPatient.full_name}
                </h2>
                <p style={{ margin: '0.2rem 0 0 0', color: 'var(--text-muted)', fontSize: '0.85rem' }}>
                  Patient ID: <span style={{ fontFamily: 'monospace', fontWeight: 600 }}>{selectedPatient.id}</span>
                </p>
              </div>

              {(() => {
                const status = getStatusBadge(selectedPatient.risk);
                return (
                  <span style={{ 
                    fontSize: '0.85rem', 
                    fontWeight: 700, 
                    padding: '0.35rem 0.85rem', 
                    borderRadius: '0.375rem',
                    background: status.bg,
                    border: `1px solid ${status.border}`,
                    color: status.color,
                    marginRight: '2rem'
                  }}>
                    {status.label}
                  </span>
                );
              })()}
            </div>

            {loadingHistory ? (
              <p style={{ color: 'var(--text-muted)', padding: '2rem', textAlign: 'center' }}>Loading clinical records...</p>
            ) : (
              <>
                {/* Active Alerts Banner inside Modal */}
                {selectedPatient.alerts && selectedPatient.alerts.length > 0 && (
                  <div style={{ background: 'var(--danger-light)', border: '1px solid var(--danger-border)', padding: '0.85rem 1rem', borderRadius: '0.5rem', marginBottom: '1.5rem' }}>
                    <h4 style={{ margin: '0 0 0.4rem 0', fontSize: '0.9rem', color: 'var(--danger)', display: 'flex', alignItems: 'center', gap: '0.4rem', fontWeight: 700 }}>
                      <AlertTriangle size={16} /> Clinical Warnings Detected
                    </h4>
                    <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                      {selectedPatient.alerts.map((a, i) => (
                        <span key={i} style={{ fontSize: '0.85rem', color: 'var(--danger)', fontWeight: 600 }}>
                          &bull; {a}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {/* Latest Vitals Grid inside Modal */}
                {history.length > 0 && (
                  <div style={{ marginBottom: '1.75rem' }}>
                    <h3 style={{ margin: '0 0 0.85rem 0', fontSize: '1.05rem', color: 'var(--text-main)', fontWeight: 700 }}>
                      Most Recent Telemetry Reading
                    </h3>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: '0.875rem' }}>
                      <ModalVitalCard icon={Heart} label="Heart Rate" value={history[history.length - 1].heart_rate} unit="BPM" color="#dc2626" />
                      <ModalVitalCard icon={Droplets} label="SpO2" value={history[history.length - 1].spo2} unit="%" color="#0284c7" />
                      <ModalVitalCard icon={Thermometer} label="Body Temp" value={history[history.length - 1].temperature} unit="°C" color="#d97706" />
                      <ModalVitalCard icon={Activity} label="Blood Pressure" value={history[history.length - 1].systolic ? `${history[history.length - 1].systolic}/${history[history.length - 1].diastolic}` : '--'} unit="mmHg" color="#0d9488" />
                      <ModalVitalCard icon={Zap} label="Glucose" value={history[history.length - 1].glucose} unit="mg/dL" color="#7c3aed" />
                    </div>
                  </div>
                )}

                {/* Interactive Telemetry Chart */}
                <div style={{ height: '280px', marginBottom: '1.75rem', padding: '1rem', background: 'var(--bg-body)', borderRadius: '0.5rem', border: '1px solid var(--border)' }}>
                  <h4 style={{ margin: '0 0 0.75rem 0', fontSize: '0.9rem', color: 'var(--text-main)', fontWeight: 600 }}>
                    Longitudinal Vital Telemetry Chart
                  </h4>
                  <ResponsiveContainer width="100%" height="80%">
                    <LineChart data={history}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                      <XAxis dataKey="timestamp" tick={{fill: '#64748b', fontSize: 11}} tickFormatter={(t) => new Date(t).toLocaleTimeString([], {hour:'2-digit', minute:'2-digit'})} />
                      <YAxis tick={{fill: '#64748b', fontSize: 11}} />
                      <Tooltip contentStyle={{ background: '#ffffff', border: '1px solid #cbd5e1', borderRadius: '0.5rem', color: '#0f172a', fontSize: '0.85rem' }} />
                      <Line type="monotone" dataKey="heart_rate" stroke="#dc2626" name="Heart Rate (BPM)" dot={false} strokeWidth={2} />
                      <Line type="monotone" dataKey="spo2" stroke="#0284c7" name="SpO2 (%)" dot={false} strokeWidth={2} />
                      <Line type="monotone" dataKey="temperature" stroke="#d97706" name="Temp (°C)" dot={false} strokeWidth={2} />
                    </LineChart>
                  </ResponsiveContainer>
                </div>

                {/* History Table */}
                <h4 style={{ margin: '0 0 0.75rem 0', fontSize: '0.95rem', color: 'var(--text-main)', fontWeight: 700 }}>
                  Recorded Telemetry Logs ({history.length})
                </h4>
                <div style={{ overflowX: 'auto' }}>
                  <table>
                    <thead>
                      <tr>
                        <th style={{ textAlign: 'left' }}>Recorded Time</th>
                        <th style={{ textAlign: 'left' }}>Heart Rate</th>
                        <th style={{ textAlign: 'left' }}>SpO2</th>
                        <th style={{ textAlign: 'left' }}>Temperature</th>
                        <th style={{ textAlign: 'left' }}>Blood Pressure</th>
                        <th style={{ textAlign: 'left' }}>Glucose</th>
                        <th style={{ textAlign: 'left' }}>Triage Classification</th>
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
                          <td className={`risk-${d.risk_level}`}>{d.risk_level}</td>
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
  <div style={{ padding: '0.75rem 0.85rem', background: 'var(--bg-body)', border: '1px solid var(--border)', borderRadius: '0.5rem' }}>
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.25rem' }}>
      <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)', fontWeight: 600, textTransform: 'uppercase' }}>{label}</span>
      <Icon size={14} style={{ color }} />
    </div>
    <div style={{ fontSize: '1.1rem', fontWeight: 700, color: 'var(--text-main)' }}>
      {value !== null && value !== undefined ? value : '--'}
      <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 500, marginLeft: '0.25rem' }}>{unit}</span>
    </div>
  </div>
);

export default DoctorDashboard;
