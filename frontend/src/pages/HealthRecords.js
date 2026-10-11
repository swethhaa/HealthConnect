import React, { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import { useUser } from '../context/UserContext';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import { Table, BarChart2 } from 'lucide-react';

const HealthRecords = () => {
  const { user } = useUser();
  const [data, setData] = useState([]);
  const [view, setView] = useState('chart');

  const fetchData = useCallback(async () => {
    try {
      const res = await axios.get(`http://localhost:5001/get-data?user_id=${user.id}`);
      setData(res.data.reverse());
    } catch (err) { 
      console.error('Error fetching health records:', err); 
    }
  }, [user.id]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  return (
    <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
      
      {/* Page Header */}
      <div className="page-header">
        <div>
          <h1 className="page-title">Health Records & Telemetry Timeline</h1>
          <p className="page-subtitle">
            Historical longitudinal review of recorded vital sign parameters
          </p>
        </div>
        
        {/* View Switcher Tabs */}
        <div className="filter-tabs">
          <button 
            type="button"
            onClick={() => setView('chart')} 
            className={`filter-tab ${view === 'chart' ? 'active' : ''}`}
            style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem' }}
          >
            <BarChart2 size={15} /> Graphical View
          </button>
          <button 
            type="button"
            onClick={() => setView('table')} 
            className={`filter-tab ${view === 'table' ? 'active' : ''}`}
            style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem' }}
          >
            <Table size={15} /> Data Log Table
          </button>
        </div>
      </div>

      {view === 'chart' ? (
        <div className="card" style={{ height: '500px', padding: '1.5rem 1.75rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
            <h3 style={{ margin: 0, fontSize: '1.05rem', fontWeight: 600, color: 'var(--text-main)' }}>
              Vital Signs Telemetry Timeline
            </h3>
            <span style={{ fontSize: '0.82rem', color: 'var(--text-muted)' }}>
              {data.length} Total Data Points
            </span>
          </div>

          <ResponsiveContainer width="100%" height="88%">
            <LineChart data={data}>
              <CartesianGrid strokeDasharray="3 3" stroke="#D7E7E9" />
              <XAxis dataKey="timestamp" tick={{ fill: '#8A9A9E', fontSize: 11 }} tickFormatter={(t) => new Date(t).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} />
              <YAxis tick={{ fill: '#8A9A9E', fontSize: 11 }} />
              <Tooltip 
                contentStyle={{ background: '#FFFFFF', border: '1px solid var(--border)', borderRadius: '6px', fontSize: '0.85rem' }}
              />
              <Legend wrapperStyle={{ paddingTop: '10px' }} />
              <Line type="monotone" dataKey="heart_rate" stroke="#D94848" strokeWidth={2} name="Heart Rate (BPM)" dot={false} />
              <Line type="monotone" dataKey="spo2" stroke="#109DA6" strokeWidth={2} name="Blood Oxygen SpO2 (%)" dot={false} />
              <Line type="monotone" dataKey="temperature" stroke="#D9822B" strokeWidth={2} name="Temperature (°C)" dot={false} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      ) : (
        <div className="card" style={{ overflow: 'hidden', padding: 0 }}>
          <div style={{ padding: '1rem 1.25rem', borderBottom: '1px solid var(--border)' }}>
            <h3 style={{ margin: 0, fontSize: '1rem', fontWeight: 600, color: 'var(--text-main)' }}>
              Telemetry Recorded Readings ({data.length})
            </h3>
          </div>
          <div style={{ overflowX: 'auto' }}>
            <table>
              <thead>
                <tr>
                  <th style={{ textAlign: 'left' }}>Timestamp</th>
                  <th style={{ textAlign: 'left' }}>Heart Rate</th>
                  <th style={{ textAlign: 'left' }}>SpO2</th>
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
                    <td style={{ fontWeight: 600 }}>{d.systolic ? `${d.systolic}/${d.diastolic} mmHg` : '--'}</td>
                    <td style={{ fontWeight: 600 }}>{d.glucose ? `${d.glucose} mg/dL` : '--'}</td>
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
        </div>
      )}
    </div>
  );
};

export default HealthRecords;
