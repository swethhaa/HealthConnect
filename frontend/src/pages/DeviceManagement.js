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
      <header style={{ marginBottom: '2.5rem' }}>
        <h1 className="gradient-text" style={{ margin: 0, fontSize: '2rem' }}>Device Management</h1>
        <p style={{ color: 'var(--text-muted)' }}>Manage your IoT health monitoring kits</p>
      </header>

      <div className="glass-card" style={{ marginBottom: '2rem' }}>
        <h3 style={{ margin: '0 0 1.5rem 0' }}>Register New Device</h3>
        <form onSubmit={addDevice} style={{ display: 'flex', gap: '1rem' }}>
          <input 
            type="text" 
            placeholder="Device Name (e.g., Home Kit #1)" 
            value={newDevice}
            onChange={(e) => setNewDevice(e.target.value)}
            style={{ marginBottom: 0 }}
            required
          />
          <button type="submit" style={{ width: 'auto', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <Plus size={18} /> Add Device
          </button>
        </form>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '1.5rem' }}>
        {devices.map((device) => (
          <div key={device.id} className="glass-card">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1.5rem' }}>
              <div style={{ width: '48px', height: '48px', borderRadius: '1rem', background: 'var(--primary-light)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Cpu size={24} color="var(--primary)" />
              </div>
              <span style={{ 
                fontSize: '0.75rem', 
                padding: '0.25rem 0.75rem', 
                borderRadius: '99px',
                background: device.status === 'online' ? 'rgba(16,185,129,0.1)' : 'rgba(255,255,255,0.05)',
                color: device.status === 'online' ? 'var(--primary)' : 'var(--text-muted)',
                display: 'flex',
                alignItems: 'center',
                gap: '0.4rem'
              }}>
                {device.status === 'online' ? <CheckCircle size={12} /> : <WifiOff size={12} />}
                {device.status.toUpperCase()}
              </span>
            </div>
            <h4 style={{ margin: '0 0 0.5rem 0' }}>{device.name}</h4>
            <p style={{ margin: 0, fontSize: '0.75rem', color: 'var(--text-muted)', wordBreak: 'break-all' }}>UUID: {device.id}</p>
          </div>
        ))}
        {devices.length === 0 && (
          <div className="glass-card" style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-muted)' }}>
            No devices registered yet.
          </div>
        )}
      </div>
    </div>
  );
};

export default DeviceManagement;
