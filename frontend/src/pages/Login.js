import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import api from '../api';
import { useUser } from '../context/UserContext';
import { Activity } from 'lucide-react';

const Login = () => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const { login } = useUser();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e?.preventDefault();
    setLoading(true);
    try {
      const res = await api.post('/login', { username, password });
      if (res.data && res.data.user) {
        login(res.data.user, res.data.token);
        navigate(res.data.user.role === 'doctor' ? '/doctor-dashboard' : '/patient-dashboard');
      } else {
        alert('Login failed: Invalid response from server');
      }
    } catch (err) {
      console.error('Login error:', err);
      const message = err.response?.data?.error || 'Login failed. Please check your credentials.';
      alert(message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-container">
      <div className="auth-card">
        {/* Brand Header */}
        <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
          <div style={{ 
            width: '44px', 
            height: '44px', 
            borderRadius: '10px', 
            background: 'var(--primary-light)', 
            border: '1px solid var(--border)',
            display: 'flex', 
            alignItems: 'center', 
            justifyContent: 'center',
            margin: '0 auto 0.85rem'
          }}>
            <Activity size={24} color="var(--primary-deep)" />
          </div>
          <h1 style={{ margin: '0 0 0.35rem 0', fontSize: '1.45rem', fontWeight: 700, color: 'var(--text-main)' }}>
            HealthConnect
          </h1>
          <p style={{ margin: 0, color: 'var(--text-muted)', fontSize: '0.85rem' }}>
            Rural Health Monitoring & Telemetry Portal
          </p>
        </div>

        {/* Login Form */}
        <form onSubmit={handleSubmit}>
          <div style={{ marginBottom: '1.15rem' }}>
            <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '0.35rem' }}>
              Username
            </label>
            <input 
              type="text" 
              placeholder="Enter your username" 
              value={username} 
              onChange={(e) => setUsername(e.target.value)} 
              required 
            />
          </div>

          <div style={{ marginBottom: '1.25rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.35rem' }}>
              <label style={{ fontSize: '0.82rem', fontWeight: 600, color: 'var(--text-secondary)' }}>
                Password
              </label>
              <button 
                type="button" 
                onClick={() => alert('Please contact clinical administrator to reset credentials.')}
                style={{ 
                  background: 'none', 
                  border: 'none', 
                  padding: 0, 
                  color: 'var(--primary-deep)', 
                  fontSize: '0.8rem', 
                  cursor: 'pointer',
                  fontWeight: 500
                }}
              >
                Forgot Password?
              </button>
            </div>
            <input 
              type="password" 
              placeholder="••••••••" 
              value={password} 
              onChange={(e) => setPassword(e.target.value)} 
              required 
            />
          </div>

          <button 
            type="submit" 
            disabled={loading}
            className="btn-primary" 
            style={{ width: '100%', padding: '0.75rem', fontSize: '0.92rem' }}
          >
            {loading ? 'Signing In...' : 'Sign In'}
          </button>
        </form>

        {/* Register Prompt */}
        <div style={{ 
          textAlign: 'center', 
          marginTop: '1.5rem', 
          paddingTop: '1.25rem', 
          borderTop: '1px solid var(--border-subtle)',
          fontSize: '0.85rem',
          color: 'var(--text-muted)'
        }}>
          Don't have an account?{' '}
          <Link to="/signup" style={{ color: 'var(--primary-deep)', textDecoration: 'none', fontWeight: 600 }}>
            Register here
          </Link>
        </div>
      </div>
    </div>
  );
};

export default Login;
