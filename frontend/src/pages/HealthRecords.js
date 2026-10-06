import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useUser } from '../context/UserContext';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import { Table, BarChart2 } from 'lucide-react';

const HealthRecords = () => {
  const { user } = useUser();
  const [data, setData] = useState([]);
  const [view, setView] = useState('chart');

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const res = await axios.get(`http://localhost:5001/get-data?user_id=${user.id}`);
      setData(res.data.reverse()); // Reverse for chronological chart
    } catch (err) { console.error(err); }
  };

  return (
    <div>
      <header style={{ marginBottom: '2rem', borderBottom: '1px solid var(--border)', paddingBottom: '1rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <h1 style={{ margin: 0, fontSize: '1.6rem', color: 'var(--text-main)', fontWeight: 700 }}>
            Health Records & Telemetry History
          </h1>
          <p style={{ margin: '0.25rem 0 0 0', color: 'var(--text-muted)', fontSize: '0.9rem' }}>
            Historical longitudinal review of vital sign parameters
          </p>
        </div>
        
        {/* Toggle Switcher */}
        <div style={{ background: 'var(--border-subtle)', padding: '0.25rem', borderRadius: '0.5rem', display: 'flex', gap: '0.25rem', border: '1px solid var(--border)' }}>
          <button 
            onClick={() => setView('chart')} 
            style={{ 
              background: view === 'chart' ? 'var(--bg-surface)' : 'transparent',
              color: view === 'chart' ? 'var(--primary)' : 'var(--text-muted)',
              border: view === 'chart' ? '1px solid var(--border)' : 'none',
              padding: '0.4rem 0.85rem', 
              width: 'auto',
              display: 'flex',
              alignItems: 'center',
              gap: '0.4rem',
              fontSize: '0.85rem',
              fontWeight: 600,
              boxShadow: view === 'chart' ? '0 1px 2px rgba(0,0,0,0.05)' : 'none'
            }}
          >
            <BarChart2 size={16} /> Graphical View
          </button>
          <button 
            onClick={() => setView('table')} 
            style={{ 
              background: view === 'table' ? 'var(--bg-surface)' : 'transparent',
              color: view === 'table' ? 'var(--primary)' : 'var(--text-muted)',
              border: view === 'table' ? '1px solid var(--border)' : 'none',
              padding: '0.4rem 0.85rem', 
              width: 'auto',
              display: 'flex',
              alignItems: 'center',
              gap: '0.4rem',
              fontSize: '0.85rem',
              fontWeight: 600,
              boxShadow: view === 'table' ? '0 1px 2px rgba(0,0,0,0.05)' : 'none'
            }}
          >
            <Table size={16} /> Data Log Table
          </button>
        </div>
      </header>

      {view === 'chart' ? (
        <div className="card" style={{ height: '480px', padding: '1.5rem' }}>
          <h3 style={{ margin: '0 0 1rem 0', fontSize: '1.05rem', color: 'var(--text-main)', fontWeight: 600 }}>
            Vital Signs Telemetry Timeline
          </h3>
          <ResponsiveContainer width="100%" height="90%">
            <LineChart data={data}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
              <XAxis dataKey="timestamp" tick={{fill: '#64748b', fontSize: 11}} tickFormatter={(t) => new Date(t).toLocaleTimeString()} />
              <YAxis tick={{fill: '#64748b', fontSize: 11}} />
              <Tooltip 
                contentStyle={{ background: '#ffffff', border: '1px solid #cbd5e1', borderRadius: '0.5rem', color: '#0f172a', fontSize: '0.85rem' }}
              />
              <Legend wrapperStyle={{ paddingTop: '10px' }} />
              <Line type="monotone" dataKey="heart_rate" stroke="#dc2626" name="Heart Rate (BPM)" dot={false} strokeWidth={2} />
              <Line type="monotone" dataKey="spo2" stroke="#0284c7" name="Blood Oxygen SpO2 (%)" dot={false} strokeWidth={2} />
              <Line type="monotone" dataKey="temperature" stroke="#d97706" name="Temperature (°C)" dot={false} strokeWidth={2} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      ) : (
        <div className="card" style={{ overflowX: 'auto', padding: 0 }}>
          <table>
            <thead>
              <tr>
                <th style={{ textAlign: 'left' }}>Timestamp</th>
                <th style={{ textAlign: 'left' }}>Heart Rate</th>
                <th style={{ textAlign: 'left' }}>Blood Oxygen (SpO2)</th>
                <th style={{ textAlign: 'left' }}>Body Temp</th>
                <th style={{ textAlign: 'left' }}>Blood Pressure</th>
                <th style={{ textAlign: 'left' }}>Glucose</th>
                <th style={{ textAlign: 'left' }}>Triage Risk Level</th>
              </tr>
            </thead>
            <tbody>
              {data.slice().reverse().map((d, i) => (
                <tr key={i}>
                  <td>{new Date(d.timestamp).toLocaleString()}</td>
                  <td style={{ fontWeight: 600 }}>{d.heart_rate} BPM</td>
                  <td style={{ fontWeight: 600 }}>{d.spo2}%</td>
                  <td style={{ fontWeight: 600 }}>{d.temperature}°C</td>
                  <td style={{ fontWeight: 600 }}>{d.systolic ? `${d.systolic}/${d.diastolic}` : '--'} mmHg</td>
                  <td style={{ fontWeight: 600 }}>{d.glucose || '--'} mg/dL</td>
                  <td className={`risk-${d.risk_level}`}>{d.risk_level}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

export default HealthRecords;
