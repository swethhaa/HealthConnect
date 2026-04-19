import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { Search, User, AlertTriangle, X } from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

const Patients = () => {
  const [patients, setPatients] = useState([]);
  const [search, setSearch] = useState('');
  const [selectedPatient, setSelectedPatient] = useState(null);
  const [history, setHistory] = useState([]);
  const [loadingHistory, setLoadingHistory] = useState(false);

  useEffect(() => {
    fetchPatients();
  }, []);

  const fetchPatients = async () => {
    try {
      const res = await axios.get('http://127.0.0.1:5000/get-patients');
      const patientsWithRisk = await Promise.all(res.data.map(async (p) => {
        const riskRes = await axios.get(`http://127.0.0.1:5000/alerts?user_id=${p.id}`);
        return { ...p, risk: riskRes.data.current_risk, alerts: riskRes.data.alerts };
      }));
      setPatients(patientsWithRisk);
    } catch (err) { console.error(err); }
  };

  const fetchHistory = async (patient) => {
    setLoadingHistory(true);
    setSelectedPatient(patient);
    try {
      const res = await axios.get(`http://127.0.0.1:5000/get-data?user_id=${patient.id}`);
      setHistory(res.data.reverse());
    } catch (err) { console.error(err); }
    setLoadingHistory(false);
  };

  const filteredPatients = patients.filter(p => 
    p.full_name.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div>
      <header style={{ marginBottom: '2.5rem' }}>
        <h1 className="gradient-text" style={{ margin: 0, fontSize: '2rem' }}>Patient Directory</h1>
        <p style={{ color: 'var(--text-muted)' }}>Manage and view clinical records for all registered patients</p>
      </header>

      <div style={{ marginBottom: '2.5rem', position: 'relative' }}>
        <Search size={20} style={{ position: 'absolute', left: '1rem', top: '1rem', color: 'var(--text-muted)' }} />
        <input 
          type="text" 
          placeholder="Search patients by name or ID..." 
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          style={{ paddingLeft: '3rem' }}
        />
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '1.5rem' }}>
        {filteredPatients.map((patient) => (
          <div key={patient.id} className="glass-card" style={{ borderLeft: `4px solid ${patient.risk === 'High' ? 'var(--danger)' : patient.risk === 'Medium' ? 'var(--warning)' : 'var(--primary)'}` }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                <div style={{ width: '40px', height: '40px', borderRadius: '50%', background: 'var(--primary-light)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <User size={20} color="var(--primary)" />
                </div>
                <div>
                  <h4 style={{ margin: 0 }}>{patient.full_name}</h4>
                  <p style={{ margin: 0, fontSize: '0.75rem', color: 'var(--text-muted)' }}>ID: {patient.id.slice(0,8)}</p>
                </div>
              </div>
              <span className={`risk-${patient.risk}`} style={{ fontWeight: 700, fontSize: '0.875rem' }}>{patient.risk}</span>
            </div>

            {patient.alerts.length > 0 && (
              <div style={{ background: 'rgba(239, 68, 68, 0.1)', padding: '0.75rem', borderRadius: '0.75rem', marginBottom: '1rem' }}>
                {patient.alerts.map((a, i) => (
                  <p key={i} style={{ margin: 0, fontSize: '0.75rem', color: '#fca5a5', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <AlertTriangle size={12} /> {a}
                  </p>
                ))}
              </div>
            )}

            <button 
              onClick={() => fetchHistory(patient)}
              style={{ background: 'rgba(255,255,255,0.05)', color: '#fff', fontSize: '0.875rem' }}
            >
              View Clinical History
            </button>
          </div>
        ))}
        {filteredPatients.length === 0 && (
            <div style={{ gridColumn: '1/-1', textAlign: 'center', padding: '4rem', color: 'var(--text-muted)' }}>
                No patients found matching your search.
            </div>
        )}
      </div>

      {selectedPatient && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.8)', backdropFilter: 'blur(8px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: '2rem' }}>
          <div className="glass-card" style={{ width: '100%', maxWidth: '950px', maxHeight: '90vh', overflowY: 'auto', position: 'relative' }}>
            <button 
              onClick={() => setSelectedPatient(null)}
              style={{ position: 'absolute', right: '1.5rem', top: '1.5rem', width: 'auto', background: 'transparent', color: 'var(--text-muted)' }}
            >
              <X size={24} />
            </button>
            
            <h2 className="gradient-text">{selectedPatient.full_name}'s Full Clinical History</h2>
            <p style={{ color: 'var(--text-muted)', marginBottom: '2rem' }}>Patient ID: {selectedPatient.id}</p>

            {loadingHistory ? (
              <p>Loading records...</p>
            ) : (
              <>
                <div style={{ height: '300px', marginBottom: '2.5rem' }}>
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={history}>
                      <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" />
                      <XAxis dataKey="timestamp" tick={{fill: '#a7f3d0', fontSize: 10}} tickFormatter={(t) => new Date(t).toLocaleTimeString()} />
                      <YAxis tick={{fill: '#a7f3d0'}} />
                      <Tooltip contentStyle={{ background: '#064e3b', border: '1px solid var(--glass-border)', borderRadius: '1rem' }} />
                      <Line type="monotone" dataKey="heart_rate" stroke="#ef4444" name="HR" dot={false} strokeWidth={2} />
                      <Line type="monotone" dataKey="spo2" stroke="#3b82f6" name="SpO2" dot={false} strokeWidth={2} />
                      <Line type="monotone" dataKey="temperature" stroke="#f59e0b" name="Temp" dot={false} strokeWidth={2} />
                    </LineChart>
                  </ResponsiveContainer>
                </div>

                <div className="glass-card" style={{ padding: 0, overflowX: 'auto' }}>
                  <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                    <thead>
                      <tr style={{ background: 'rgba(255,255,255,0.03)' }}>
                        <th style={{ textAlign: 'left', padding: '1rem', color: 'var(--text-muted)', fontSize: '0.8rem' }}>Date & Time</th>
                        <th style={{ textAlign: 'left', padding: '1rem', color: 'var(--text-muted)', fontSize: '0.8rem' }}>HR (BPM)</th>
                        <th style={{ textAlign: 'left', padding: '1rem', color: 'var(--text-muted)', fontSize: '0.8rem' }}>SpO2 (%)</th>
                        <th style={{ textAlign: 'left', padding: '1rem', color: 'var(--text-muted)', fontSize: '0.8rem' }}>Temp (°C)</th>
                        <th style={{ textAlign: 'left', padding: '1rem', color: 'var(--text-muted)', fontSize: '0.8rem' }}>BP (mmHg)</th>
                        <th style={{ textAlign: 'left', padding: '1rem', color: 'var(--text-muted)', fontSize: '0.8rem' }}>Risk Level</th>
                      </tr>
                    </thead>
                    <tbody>
                      {history.slice().reverse().map((d, i) => (
                        <tr key={i} style={{ borderTop: '1px solid var(--glass-border)' }}>
                          <td style={{ padding: '0.875rem 1rem', fontSize: '0.8rem' }}>{new Date(d.timestamp).toLocaleString()}</td>
                          <td style={{ padding: '0.875rem 1rem' }}>{d.heart_rate}</td>
                          <td style={{ padding: '0.875rem 1rem' }}>{d.spo2}</td>
                          <td style={{ padding: '0.875rem 1rem' }}>{d.temperature}</td>
                          <td style={{ padding: '0.875rem 1rem' }}>{d.systolic}/{d.diastolic}</td>
                          <td style={{ padding: '0.875rem 1rem' }} className={`risk-${d.risk_level}`}>{d.risk_level}</td>
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
