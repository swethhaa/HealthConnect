import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useUser } from '../context/UserContext';
import { Cpu, Plus, CheckCircle, WifiOff } from 'lucide-react';

const DeviceManagement = () => {
  const { user } = useUser();
  const [devices, setDevices] = useState([]);
  const [newDevice, setNewDevice] = useState('');

  useEffect(() => {
    fetchDevices();
  }, []);

  const fetchDevices = async () => {
    try {
      const res = await axios.get(`http://localhost:5001/get-devices?user_id=${user.id}`);
      setDevices(res.data);
    } catch (err) { console.error(err); }
  };

  const addDevice = async (e) => {
    e.preventDefault();
    try {
      await axios.post('http://localhost:5001/add-device', { name: newDevice, user_id: user.id });
      setNewDevice('');
      fetchDevices();
    } catch (err) { console.error(err); }
  };

  return (
    <div>
      <header style={{ marginBottom: '2rem', borderBottom: '1px solid var(--border)', paddingBottom: '1rem' }}>
        <h1 style={{ margin: 0, fontSize: '1.6rem', color: 'var(--text-main)', fontWeight: 700 }}>
          Telemetry Kit Device Management
        </h1>
        <p style={{ margin: '0.25rem 0 0 0', color: 'var(--text-muted)', fontSize: '0.9rem' }}>
          Register and configure vital sign hardware units assigned to your profile
        </p>
      </header>

      <div className="card" style={{ marginBottom: '2rem', maxWidth: '600px' }}>
        <h3 style={{ margin: '0 0 1rem 0', fontSize: '1.05rem', color: 'var(--text-main)', fontWeight: 600 }}>
          Register Telemetry Unit
        </h3>
        <form onSubmit={addDevice} style={{ display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
          <div style={{ flex: 1 }}>
            <input 
              type="text" 
              placeholder="Device Identifier (e.g. Rural Health Pulse Kit #1)" 
              value={newDevice}
              onChange={(e) => setNewDevice(e.target.value)}
              style={{ marginBottom: 0 }}
              required
            />
          </div>
          <button type="submit" style={{ width: 'auto', display: 'flex', alignItems: 'center', gap: '0.4rem', whiteSpace: 'nowrap', padding: '0.65rem 1.1rem' }}>
            <Plus size={16} /> Register Kit
          </button>
        </form>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '1.25rem' }}>
        {devices.map((device) => (
          <div key={device.id} className="card">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1rem' }}>
              <div style={{ 
                width: '42px', 
                height: '42px', 
                borderRadius: '8px', 
                background: 'var(--primary-subtle)', 
                border: '1px solid var(--primary-light)',
                display: 'flex', 
                alignItems: 'center', 
                justifyContent: 'center' 
              }}>
                <Cpu size={22} color="var(--primary)" />
              </div>
              <span style={{ 
                fontSize: '0.75rem', 
                padding: '0.25rem 0.65rem', 
                borderRadius: '99px',
                background: device.status === 'online' ? 'var(--success-light)' : 'var(--border-subtle)',
                color: device.status === 'online' ? 'var(--success)' : 'var(--text-muted)',
                border: `1px solid ${device.status === 'online' ? 'var(--success-border)' : 'var(--border)'}`,
                display: 'flex',
                alignItems: 'center',
                gap: '0.35rem',
                fontWeight: 600
              }}>
                {device.status === 'online' ? <CheckCircle size={12} /> : <WifiOff size={12} />}
                {device.status.toUpperCase()}
              </span>
            </div>
            <h4 style={{ margin: '0 0 0.35rem 0', fontSize: '1rem', color: 'var(--text-main)' }}>{device.name}</h4>
            <p style={{ margin: 0, fontSize: '0.75rem', color: 'var(--text-muted)', wordBreak: 'break-all', fontFamily: 'monospace' }}>
              UUID: {device.id}
            </p>
          </div>
        ))}
        {devices.length === 0 && (
          <div className="card" style={{ gridColumn: '1/-1', textAlign: 'center', padding: '3rem', color: 'var(--text-muted)' }}>
            <p style={{ margin: 0, fontSize: '0.9rem' }}>No hardware monitoring kits registered for this profile yet.</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default DeviceManagement;
