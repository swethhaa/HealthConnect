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
      <header style={{ marginBottom: '2rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h1 className="gradient-text" style={{ margin: 0 }}>Health Records</h1>
          <p style={{ color: 'var(--text-muted)' }}>Historical analysis of your vitals</p>
        </div>
        <div className="glass-card" style={{ padding: '0.5rem', display: 'flex', gap: '0.5rem' }}>
          <button 
            onClick={() => setView('chart')} 
            style={{ 
              background: view === 'chart' ? 'var(--primary)' : 'transparent',
              padding: '0.5rem 1rem', width: 'auto'
            }}
          >
            <BarChart2 size={18} />
          </button>
          <button 
            onClick={() => setView('table')} 
            style={{ 
              background: view === 'table' ? 'var(--primary)' : 'transparent',
              padding: '0.5rem 1rem', width: 'auto'
            }}
          >
            <Table size={18} />
          </button>
        </div>
      </header>

      {view === 'chart' ? (
        <div className="glass-card" style={{ height: '500px', padding: '2rem' }}>
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={data}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" />
              <XAxis dataKey="timestamp" tick={{fill: '#a7f3d0', fontSize: 10}} tickFormatter={(t) => new Date(t).toLocaleTimeString()} />
              <YAxis tick={{fill: '#a7f3d0'}} />
              <Tooltip 
                contentStyle={{ background: '#064e3b', border: '1px solid var(--glass-border)', borderRadius: '1rem' }}
                itemStyle={{ color: '#fff' }}
              />
              <Legend />
              <Line type="monotone" dataKey="heart_rate" stroke="#ef4444" name="HR" dot={false} strokeWidth={2} />
              <Line type="monotone" dataKey="spo2" stroke="#3b82f6" name="SpO2" dot={false} strokeWidth={2} />
              <Line type="monotone" dataKey="temperature" stroke="#f59e0b" name="Temp" dot={false} strokeWidth={2} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      ) : (
        <div className="glass-card" style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr>
                <th style={{ textAlign: 'left', padding: '1rem', color: 'var(--text-muted)' }}>Timestamp</th>
                <th style={{ textAlign: 'left', padding: '1rem', color: 'var(--text-muted)' }}>Heart Rate</th>
                <th style={{ textAlign: 'left', padding: '1rem', color: 'var(--text-muted)' }}>SpO2</th>
                <th style={{ textAlign: 'left', padding: '1rem', color: 'var(--text-muted)' }}>Temp</th>
                <th style={{ textAlign: 'left', padding: '1rem', color: 'var(--text-muted)' }}>Risk</th>
              </tr>
            </thead>
            <tbody>
              {data.slice().reverse().map((d, i) => (
                <tr key={i} style={{ borderTop: '1px solid var(--glass-border)' }}>
                  <td style={{ padding: '1rem' }}>{new Date(d.timestamp).toLocaleString()}</td>
                  <td style={{ padding: '1rem' }}>{d.heart_rate} BPM</td>
                  <td style={{ padding: '1rem' }}>{d.spo2}%</td>
                  <td style={{ padding: '1rem' }}>{d.temperature}°C</td>
                  <td style={{ padding: '1rem' }} className={`risk-${d.risk_level}`}>{d.risk_level}</td>
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
