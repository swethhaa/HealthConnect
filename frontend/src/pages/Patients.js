import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { Search, User, AlertTriangle, X, FileText } from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { useUser } from '../context/UserContext';

const Patients = () => {
  const { user } = useUser();
  const [patients, setPatients] = useState([]);
  const [search, setSearch] = useState('');
  const [selectedPatient, setSelectedPatient] = useState(null);
  const [history, setHistory] = useState([]);
  const [loadingHistory, setLoadingHistory] = useState(false);
  const [reportLanguage, setReportLanguage] = useState('English');

  useEffect(() => {
    fetchPatients();
  }, []);

  const fetchPatients = async () => {
    try {
      const res = await axios.get(`http://localhost:5001/get-assigned-patients?doctor_id=${user.id}`);
      const patientsWithRisk = await Promise.all(res.data.map(async (p) => {
        const riskRes = await axios.get(`http://localhost:5001/alerts?user_id=${p.id}`);
        return { ...p, risk: riskRes.data.current_risk, alerts: riskRes.data.alerts };
      }));
      setPatients(patientsWithRisk);
    } catch (err) { console.error(err); }
  };

  const fetchHistory = async (patient) => {
    setLoadingHistory(true);
    setSelectedPatient(patient);
    try {
      const res = await axios.get(`http://localhost:5001/get-data?user_id=${patient.id}`);
      setHistory(res.data.reverse());
    } catch (err) { console.error(err); }
    setLoadingHistory(false);
  };

  const filteredPatients = patients.filter(p => 
    p.full_name.toLowerCase().includes(search.toLowerCase())
  );

  const generateReport = async (patient) => {
    try {
      const res = await axios.get(`http://localhost:5001/generate-report?patient_id=${patient.id}&language=${reportLanguage}`);
      alert(`Report generated for ${patient.full_name} in ${reportLanguage}`);
      console.log('Report:', res.data);
    } catch (err) {
      alert('Error generating report');
      console.error(err);
    }
  };

  return (
    <div>
      <header style={{ marginBottom: '2rem', borderBottom: '1px solid var(--border)', paddingBottom: '1rem' }}>
        <h1 style={{ margin: 0, fontSize: '1.6rem', color: 'var(--text-main)', fontWeight: 700 }}>
          Assigned Patient Directory
        </h1>
        <p style={{ margin: '0.25rem 0 0 0', color: 'var(--text-muted)', fontSize: '0.9rem' }}>
          Clinical records and vital telemetry monitoring for your registered patients
        </p>
      </header>

      <div style={{ marginBottom: '1.75rem', position: 'relative', maxWidth: '480px' }}>
        <Search size={18} style={{ position: 'absolute', left: '0.875rem', top: '0.75rem', color: 'var(--text-muted)' }} />
        <input 
          type="text" 
          placeholder="Search patients by full name or ID..." 
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          style={{ paddingLeft: '2.5rem', marginBottom: 0 }}
        />
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '1.25rem' }}>
        {filteredPatients.map((patient) => (
          <div key={patient.id} className="card" style={{ 
            borderLeft: `4px solid ${patient.risk === 'High' ? 'var(--danger)' : patient.risk === 'Medium' ? 'var(--warning)' : 'var(--success)'}` 
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                <div style={{ width: '40px', height: '40px', borderRadius: '8px', background: 'var(--primary-subtle)', border: '1px solid var(--primary-light)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <User size={20} color="var(--primary)" />
                </div>
                <div>
                  <h4 style={{ margin: 0, fontSize: '1rem', color: 'var(--text-main)' }}>{patient.full_name}</h4>
                  <p style={{ margin: '0.15rem 0 0 0', fontSize: '0.75rem', color: 'var(--text-muted)' }}>ID: {patient.id.slice(0,8)}</p>
                </div>
              </div>
              <span className={`risk-${patient.risk}`} style={{ fontSize: '0.85rem', fontWeight: 700 }}>
                {patient.risk.toUpperCase()}
              </span>
            </div>

            {patient.alerts.length > 0 && (
              <div style={{ background: 'var(--danger-light)', border: '1px solid var(--danger-border)', padding: '0.65rem 0.85rem', borderRadius: '0.5rem', marginBottom: '1rem' }}>
                {patient.alerts.map((a, i) => (
                  <p key={i} style={{ margin: 0, fontSize: '0.8rem', color: 'var(--danger)', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                    <AlertTriangle size={14} /> {a}
                  </p>
                ))}
              </div>
            )}

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.625rem' }}>
              <button 
                onClick={() => fetchHistory(patient)}
                style={{ 
                  background: 'var(--bg-body)', 
                  color: 'var(--text-main)', 
                  border: '1px solid var(--border)', 
                  fontSize: '0.85rem', 
                  width: '100%',
                  fontWeight: 600 
                }}
              >
                View History
              </button>
              <button 
                onClick={() => generateReport(patient)}
                style={{ 
                  background: 'var(--primary)', 
                  color: '#ffffff', 
                  fontSize: '0.85rem', 
                  width: '100%', 
                  display: 'flex', 
                  alignItems: 'center', 
                  justifyContent: 'center', 
                  gap: '0.4rem',
                  fontWeight: 600 
                }}
              >
                <FileText size={16} />
                Generate Report
              </button>
            </div>
          </div>
        ))}

        {filteredPatients.length === 0 && (
          <div className="card" style={{ gridColumn: '1/-1', textAlign: 'center', padding: '3.5rem 1.5rem', color: 'var(--text-muted)' }}>
            <p style={{ fontSize: '1rem', fontWeight: 600, color: 'var(--text-main)', marginBottom: '0.5rem' }}>No assigned patients found.</p>
            <p style={{ fontSize: '0.875rem', margin: 0 }}>Navigate to "Assign Patients" to map unassigned patients to your roster.</p>
          </div>
        )}
      </div>

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
            
            <h2 style={{ margin: '0 0 0.25rem 0', fontSize: '1.35rem', color: 'var(--text-main)' }}>
              {selectedPatient.full_name} &mdash; Full Clinical History
            </h2>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', marginBottom: '1.5rem' }}>
              Patient ID: {selectedPatient.id}
            </p>

            {loadingHistory ? (
              <p style={{ color: 'var(--text-muted)' }}>Loading records...</p>
            ) : (
              <>
                <div style={{ height: '280px', marginBottom: '2rem', padding: '1rem 0', background: 'var(--bg-body)', borderRadius: '0.5rem', border: '1px solid var(--border)' }}>
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={history}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                      <XAxis dataKey="timestamp" tick={{fill: '#64748b', fontSize: 11}} tickFormatter={(t) => new Date(t).toLocaleTimeString()} />
                      <YAxis tick={{fill: '#64748b', fontSize: 11}} />
                      <Tooltip contentStyle={{ background: '#ffffff', border: '1px solid #cbd5e1', borderRadius: '0.5rem', color: '#0f172a', fontSize: '0.85rem' }} />
                      <Line type="monotone" dataKey="heart_rate" stroke="#dc2626" name="Heart Rate (BPM)" dot={false} strokeWidth={2} />
                      <Line type="monotone" dataKey="spo2" stroke="#0284c7" name="SpO2 (%)" dot={false} strokeWidth={2} />
                      <Line type="monotone" dataKey="temperature" stroke="#d97706" name="Temp (°C)" dot={false} strokeWidth={2} />
                    </LineChart>
                  </ResponsiveContainer>
                </div>

                <div style={{ overflowX: 'auto' }}>
                  <table>
                    <thead>
                      <tr>
                        <th style={{ textAlign: 'left' }}>Date & Time</th>
                        <th style={{ textAlign: 'left' }}>Heart Rate (BPM)</th>
                        <th style={{ textAlign: 'left' }}>SpO2 (%)</th>
                        <th style={{ textAlign: 'left' }}>Temp (°C)</th>
                        <th style={{ textAlign: 'left' }}>BP (mmHg)</th>
                        <th style={{ textAlign: 'left' }}>Risk Level</th>
                      </tr>
                    </thead>
                    <tbody>
                      {history.slice().reverse().map((d, i) => (
                        <tr key={i}>
                          <td>{new Date(d.timestamp).toLocaleString()}</td>
                          <td style={{ fontWeight: 600 }}>{d.heart_rate}</td>
                          <td style={{ fontWeight: 600 }}>{d.spo2}</td>
                          <td style={{ fontWeight: 600 }}>{d.temperature}</td>
                          <td style={{ fontWeight: 600 }}>{d.systolic}/{d.diastolic}</td>
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

export default Patients;
