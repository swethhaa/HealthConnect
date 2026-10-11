import React, { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import { useUser } from '../context/UserContext';
import { Cpu, Plus, Wifi, WifiOff } from 'lucide-react';

const DeviceManagement = () => {
  const { user } = useUser();
  const [devices, setDevices] = useState([]);
  const [newDevice, setNewDevice] = useState('');

  const fetchDevices = useCallback(async () => {
    try {
      const res = await axios.get(`http://localhost:5001/get-devices?user_id=${user.id}`);
      setDevices(res.data);
    } catch (err) { 
      console.error('Error fetching devices:', err); 
    }
  }, [user.id]);

  useEffect(() => {
    fetchDevices();
  }, [fetchDevices]);

  const addDevice = async (e) => {
    e.preventDefault();
    if (!newDevice.trim()) return;
    try {
      await axios.post('http://localhost:5001/add-device', { name: newDevice, user_id: user.id });
      setNewDevice('');
      fetchDevices();
    } catch (err) { 
      console.error('Error adding device:', err); 
    }
  };

  return (
    <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
      
      {/* Page Header */}
      <div className="page-header">
        <div>
          <h1 className="page-title">Telemetry Hardware Unit Management</h1>
          <p className="page-subtitle">
            Configure vital sign monitoring IoT kits assigned to your clinical profile
          </p>
        </div>
      </div>

      {/* Registration Card */}
      <div className="card" style={{ marginBottom: '2rem', maxWidth: '600px' }}>
        <h3 style={{ margin: '0 0 0.85rem 0', fontSize: '1.05rem', fontWeight: 600, color: 'var(--text-main)' }}>
          Register Telemetry Hardware Kit
        </h3>
        <form onSubmit={addDevice} style={{ display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
          <div style={{ flex: 1 }}>
            <input 
              type="text" 
              placeholder="e.g. Rural Health Pulse Kit #1" 
              value={newDevice}
              onChange={(e) => setNewDevice(e.target.value)}
              style={{ marginBottom: 0 }}
              required
            />
          </div>
          <button 
            type="submit" 
            className="btn-primary" 
            style={{ width: 'auto', whiteSpace: 'nowrap', padding: '0.65rem 1.15rem' }}
          >
            <Plus size={16} /> Register Kit
          </button>
        </form>
      </div>

      {/* Registered Devices Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '1.25rem' }}>
        {devices.map((device) => (
          <div key={device.id} className="card">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1rem' }}>
              <div style={{ 
                width: '38px', 
                height: '38px', 
                borderRadius: '8px', 
                background: 'var(--primary-light)', 
                border: '1px solid var(--border)',
                display: 'flex', 
                alignItems: 'center', 
                justifyContent: 'center',
                color: 'var(--primary-deep)'
              }}>
                <Cpu size={20} />
              </div>
              
              <span className={`badge ${device.status === 'online' ? 'badge-success' : 'badge-danger'}`} style={{ fontSize: '0.72rem' }}>
                {device.status === 'online' ? <Wifi size={11} /> : <WifiOff size={11} />}
                {device.status.toUpperCase()}
              </span>
            </div>

            <h4 style={{ margin: '0 0 0.35rem 0', fontSize: '0.98rem', fontWeight: 600, color: 'var(--text-main)' }}>
              {device.name}
            </h4>
            <p style={{ margin: 0, fontSize: '0.75rem', color: 'var(--text-muted)', fontFamily: 'monospace' }}>
              UUID: {device.id}
            </p>
          </div>
        ))}

        {devices.length === 0 && (
          <div className="card" style={{ gridColumn: '1 / -1', textAlign: 'center', padding: '3rem', color: 'var(--text-muted)' }}>
            <Cpu size={28} color="var(--text-muted)" style={{ margin: '0 auto 0.5rem' }} />
            <p style={{ margin: 0, fontSize: '0.9rem' }}>No hardware monitoring kits registered for this profile yet.</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default DeviceManagement;
