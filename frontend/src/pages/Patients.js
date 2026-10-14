import React, { useEffect, useState, useCallback } from 'react';
import api from '../api';
import { Search, User, AlertTriangle, X, FileText, ChevronRight } from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

const Patients = () => {
  const [patients, setPatients] = useState([]);
  const [search, setSearch] = useState('');
  const [selectedPatient, setSelectedPatient] = useState(null);
  const [history, setHistory] = useState([]);
  const [loadingHistory, setLoadingHistory] = useState(false);
  const [reportLanguage, setReportLanguage] = useState('English');

  const fetchPatients = useCallback(async () => {
    try {
      const res = await api.get('/get-assigned-patients');
      const patientsWithRisk = await Promise.all(res.data.map(async (p) => {
        const riskRes = await api.get('/alerts', { params: { user_id: p.id } });
        return { ...p, risk: riskRes.data.current_risk, alerts: riskRes.data.alerts };
      }));
      setPatients(patientsWithRisk);
    } catch (err) { 
      console.error('Error fetching assigned patients:', err); 
    }
  }, []);

  useEffect(() => {
    fetchPatients();
  }, [fetchPatients]);

  const fetchHistory = async (patient) => {
    setLoadingHistory(true);
    setSelectedPatient(patient);
    try {
      const res = await api.get('/get-data', { params: { user_id: patient.id } });
      setHistory(res.data.reverse());
    } catch (err) { 
      console.error('Error fetching patient clinical history:', err); 
    }
    setLoadingHistory(false);
  };

  const filteredPatients = patients.filter(p => 
    p.full_name.toLowerCase().includes(search.toLowerCase()) ||
    p.id.toLowerCase().includes(search.toLowerCase())
  );

  const generateReport = async (patient) => {
    try {
      const res = await api.get('/generate-report', {
        params: { patient_id: patient.id, language: reportLanguage },
      });
      alert(`Report generated for ${patient.full_name} in ${reportLanguage}!`);
      console.log('Report:', res.data);
    } catch (err) {
      alert('Error generating report');
      console.error(err);
    }
  };

  const getStatusBadge = (risk) => {
    if (risk === 'High') return { label: 'High Risk', class: 'badge-danger' };
    if (risk === 'Medium') return { label: 'Attention', class: 'badge-warning' };
    return { label: 'Normal', class: 'badge-success' };
  };

  return (
    <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
      
      {/* Page Header */}
      <div className="page-header">
        <div>
          <h1 className="page-title">Assigned Patient Directory</h1>
          <p className="page-subtitle">
            Patients currently registered under your clinical surveillance
          </p>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
          <span style={{ fontSize: '0.82rem', fontWeight: 600, color: 'var(--text-secondary)' }}>Report Language:</span>
          <select 
            value={reportLanguage} 
            onChange={(e) => setReportLanguage(e.target.value)}
            style={{ 
              marginBottom: 0, 
              width: 'auto',
              padding: '0.45rem 1.6rem 0.45rem 0.75rem', 
              fontSize: '0.82rem', 
              fontWeight: 600,
              background: 'var(--bg-surface)'
            }}
          >
            <option value="English">English</option>
            <option value="Tamil">Tamil (தமிழ்)</option>
          </select>
        </div>
      </div>

      {/* Search Input */}
      <div className="card" style={{ marginBottom: '1.5rem', padding: '1rem 1.25rem' }}>
        <div className="search-box" style={{ maxWidth: '420px' }}>
          <Search size={16} color="var(--text-muted)" />
          <input 
            type="text" 
            placeholder="Search patients by name or ID..." 
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
      </div>

      {/* Patients Table Panel */}
      <section className="card" style={{ padding: 0, overflow: 'hidden' }}>
        <div style={{ padding: '1rem 1.25rem', borderBottom: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <h3 style={{ margin: 0, fontSize: '1rem', fontWeight: 600, color: 'var(--text-main)' }}>
            Assigned Cohort ({filteredPatients.length})
          </h3>
        </div>

        <div style={{ overflowX: 'auto' }}>
          <table>
            <thead>
              <tr>
                <th style={{ textAlign: 'left' }}>Patient Information</th>
                <th style={{ textAlign: 'left' }}>Clinical Triage Status</th>
                <th style={{ textAlign: 'left' }}>Active Alerts</th>
                <th style={{ textAlign: 'right' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredPatients.map((patient) => {
                const badge = getStatusBadge(patient.risk);
                return (
                  <tr key={patient.id}>
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                        <div style={{ 
                          width: '36px', 
                          height: '36px', 
                          borderRadius: '6px', 
                          background: 'var(--primary-light)', 
                          color: 'var(--primary-deep)',
                          display: 'flex', 
                          alignItems: 'center', 
                          justifyContent: 'center',
                          fontWeight: 600,
                          fontSize: '0.88rem'
                        }}>
                          {patient.full_name ? patient.full_name.charAt(0).toUpperCase() : <User size={16} />}
                        </div>
                        <div>
                          <div style={{ fontWeight: 600, color: 'var(--text-main)', fontSize: '0.9rem' }}>{patient.full_name}</div>
                          <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontFamily: 'monospace' }}>ID: {patient.id.slice(0, 10)}</div>
                        </div>
                      </div>
                    </td>

                    <td>
                      <span className={`badge ${badge.class}`}>
                        {badge.label}
                      </span>
                    </td>

                    <td>
                      {patient.alerts && patient.alerts.length > 0 ? (
                        <div style={{ display: 'flex', gap: '0.35rem', flexWrap: 'wrap' }}>
                          {patient.alerts.map((a, i) => (
                            <span key={i} className="badge badge-danger" style={{ fontSize: '0.72rem', padding: '0.15rem 0.45rem' }}>
                              <AlertTriangle size={11} /> {a}
                            </span>
                          ))}
                        </div>
                      ) : (
                        <span style={{ fontSize: '0.82rem', color: 'var(--success)', fontWeight: 500 }}>
                          Normal Range
                        </span>
                      )}
                    </td>

                    <td style={{ textAlign: 'right' }}>
                      <div style={{ display: 'inline-flex', gap: '0.5rem' }}>
                        <button 
                          type="button"
                          onClick={() => fetchHistory(patient)} 
                          className="btn-secondary" 
                          style={{ padding: '0.35rem 0.75rem', fontSize: '0.8rem' }}
                        >
                          Telemetry <ChevronRight size={13} />
                        </button>
                        <button 
                          type="button"
                          onClick={() => generateReport(patient)} 
                          className="btn-outline" 
                          style={{ padding: '0.35rem 0.75rem', fontSize: '0.8rem' }}
                          title="Generate Clinical Report"
                        >
                          <FileText size={13} /> Report ({reportLanguage})
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}

              {filteredPatients.length === 0 && (
                <tr>
                  <td colSpan="4" style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-muted)' }}>
                    No assigned patients found matching criteria.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </section>

      {/* Selected Patient Drawer / Modal */}
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
          <div className="card" style={{ width: '100%', maxWidth: '820px', maxHeight: '90vh', overflowY: 'auto', position: 'relative', padding: '1.75rem' }}>
            <button 
              type="button"
              onClick={() => setSelectedPatient(null)}
              style={{ position: 'absolute', right: '1.25rem', top: '1.25rem', width: '32px', height: '32px', borderRadius: '6px', background: 'var(--bg-body)', border: '1px solid var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-muted)', cursor: 'pointer', padding: 0 }}
            >
              <X size={16} />
            </button>

            <h2 style={{ margin: '0 0 0.25rem 0', fontSize: '1.3rem', fontWeight: 700 }}>
              {selectedPatient.full_name} &mdash; Clinical Telemetry History
            </h2>
            <p style={{ margin: '0 0 1.25rem 0', color: 'var(--text-muted)', fontSize: '0.82rem', fontFamily: 'monospace' }}>
              Patient ID: {selectedPatient.id}
            </p>

            {loadingHistory ? (
              <p style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-muted)' }}>Loading records...</p>
            ) : (
              <div>
                <div style={{ height: '260px', marginBottom: '1.25rem', background: 'var(--bg-body)', padding: '0.75rem', borderRadius: '8px', border: '1px solid var(--border)' }}>
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={history}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#D7E7E9" />
                      <XAxis dataKey="timestamp" tick={{ fill: '#8A9A9E', fontSize: 10 }} tickFormatter={(t) => new Date(t).toLocaleTimeString([], { hour:'2-digit', minute:'2-digit' })} />
                      <YAxis tick={{ fill: '#8A9A9E', fontSize: 10 }} />
                      <Tooltip contentStyle={{ background: '#FFFFFF', borderRadius: '6px', border: '1px solid var(--border)', fontSize: '0.82rem' }} />
                      <Line type="monotone" dataKey="heart_rate" stroke="#D94848" strokeWidth={2} name="Heart Rate" dot={false} />
                      <Line type="monotone" dataKey="spo2" stroke="#109DA6" strokeWidth={2} name="SpO2" dot={false} />
                      <Line type="monotone" dataKey="temperature" stroke="#D9822B" strokeWidth={2} name="Temp" dot={false} />
                    </LineChart>
                  </ResponsiveContainer>
                </div>

                <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.5rem' }}>
                  <button 
                    type="button"
                    onClick={() => generateReport(selectedPatient)} 
                    className="btn-primary"
                    style={{ padding: '0.55rem 1rem' }}
                  >
                    <FileText size={15} /> Generate {reportLanguage} Report
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default Patients;
