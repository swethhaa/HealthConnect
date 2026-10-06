import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import axios from 'axios';
import { useUser } from '../context/UserContext';
import { Activity } from 'lucide-react';

const Login = () => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const { login } = useUser();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const res = await axios.post('http://127.0.0.1:5001/login', { username, password });
      if (res.data && res.data.user) {
        login(res.data.user);
        navigate(res.data.user.role === 'doctor' ? '/doctor-dashboard' : '/patient-dashboard');
      } else {
        console.error('Login response missing user data:', res.data);
        alert('Login failed: Invalid response from server');
      }
    } catch (err) {
      console.error('Login error:', err);
      const message = err.response?.data?.error || 'Login failed. Please check your credentials.';
      alert(message);
    }
  };

  return (
    <div className="auth-container">
      <div className="auth-card">
        <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
          <div style={{ 
            width: '48px', 
            height: '48px', 
            borderRadius: '12px', 
            background: 'var(--primary-subtle)', 
            border: '1px solid var(--primary-light)',
            display: 'flex', 
            alignItems: 'center', 
            justifyContent: 'center',
            margin: '0 auto 1rem'
          }}>
            <Activity size={26} color="var(--primary)" />
          </div>
          <h2 style={{ margin: '0 0 0.5rem 0', fontSize: '1.5rem', color: 'var(--text-main)', fontWeight: 700 }}>
            HealthConnect Portal
          </h2>
          <p style={{ margin: 0, color: 'var(--text-muted)', fontSize: '0.875rem' }}>
            Rural Health Monitoring System
          </p>
        </div>

        <form onSubmit={handleSubmit}>
          <div style={{ marginBottom: '1rem' }}>
            <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '0.35rem' }}>
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

          <div style={{ marginBottom: '1.5rem' }}>
            <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '0.35rem' }}>
              Password
            </label>
            <input 
              type="password" 
              placeholder="Enter your password" 
              value={password} 
              onChange={(e) => setPassword(e.target.value)} 
              required 
            />
          </div>

          <button type="submit" style={{ width: '100%', padding: '0.75rem' }}>
            Sign In
          </button>
        </form>

        <div style={{ 
          textAlign: 'center', 
          marginTop: '1.5rem', 
          paddingTop: '1.25rem', 
          borderTop: '1px solid var(--border-subtle)',
          fontSize: '0.875rem',
          color: 'var(--text-muted)'
        }}>
          Don't have an account?{' '}
          <Link to="/signup" style={{ color: 'var(--primary)', textDecoration: 'none', fontWeight: 600 }}>
            Register here
          </Link>
        </div>
      </div>
    </div>
  );
};

export default Login;
