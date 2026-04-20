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
      const res = await axios.post('http://localhost:5000/login', { username, password });
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
      <div className="glass-card auth-card">
        <div style={{ textAlign: 'center', marginBottom: '1.5rem' }}>
          <Activity size={32} color="var(--primary)" style={{ margin: '0 auto 0.75rem' }} />
          <h2 className="gradient-text">Welcome Back</h2>
          <p style={{ color: 'var(--text-muted)' }}>Health Monitoring System</p>
        </div>
        <form onSubmit={handleSubmit}>
          <input 
            type="text" 
            placeholder="Username" 
            value={username} 
            onChange={(e) => setUsername(e.target.value)} 
            required 
          />
          <input 
            type="password" 
            placeholder="Password" 
            value={password} 
            onChange={(e) => setPassword(e.target.value)} 
            required 
          />
          <button type="submit">Login</button>
        </form>
        <p style={{ textAlign: 'center', marginTop: '1rem', fontSize: '0.875rem' }}>
          Don't have an account? <Link to="/signup" style={{ color: 'var(--primary)', textDecoration: 'none' }}>Sign Up</Link>
        </p>
      </div>
    </div>
  );
};

export default Login;
