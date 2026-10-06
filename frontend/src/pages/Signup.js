import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import axios from 'axios';
import { Activity } from 'lucide-react';

const Signup = () => {
  const [formData, setFormData] = useState({
    username: '',
    password: '',
    full_name: '',
    role: 'patient'
  });
  const [error, setError] = useState(null);
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    console.log('Submitting signup...', formData);
    try {
      setError(null);
      const res = await axios.post('http://127.0.0.1:5001/signup', formData);
      console.log('Signup response:', res.data);
      alert('Account created successfully! Please sign in.');
      navigate('/login');
    } catch (err) {
      console.error('Signup error:', err);
      const message = err.response?.data?.error || err.message || 'Registration failed. Please try again.';
      setError(message);
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
            Create Account
          </h2>
          <p style={{ margin: 0, color: 'var(--text-muted)', fontSize: '0.875rem' }}>
            Rural Health Monitoring Network
          </p>
        </div>

        {error && (
          <div style={{ 
            background: 'var(--danger-light)', 
            color: 'var(--danger)', 
            padding: '0.75rem', 
            borderRadius: '0.5rem', 
            marginBottom: '1.25rem', 
            fontSize: '0.875rem', 
            textAlign: 'center', 
            border: '1px solid var(--danger-border)' 
          }}>
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <div style={{ marginBottom: '1rem' }}>
            <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '0.35rem' }}>
              Full Name
            </label>
            <input 
              type="text" 
              placeholder="e.g. Raj Kumar" 
              value={formData.full_name} 
              onChange={(e) => setFormData({...formData, full_name: e.target.value})} 
              required 
            />
          </div>

          <div style={{ marginBottom: '1rem' }}>
            <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '0.35rem' }}>
              Username
            </label>
            <input 
              type="text" 
              placeholder="Choose a username" 
              value={formData.username} 
              onChange={(e) => setFormData({...formData, username: e.target.value})} 
              required 
            />
          </div>

          <div style={{ marginBottom: '1.25rem' }}>
            <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '0.35rem' }}>
              Password
            </label>
            <input 
              type="password" 
              placeholder="Choose a password" 
              value={formData.password} 
              onChange={(e) => setFormData({...formData, password: e.target.value})} 
              required 
            />
          </div>

          <div style={{ marginBottom: '1.5rem' }}>
            <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '0.35rem' }}>
              Account Type
            </label>
            <div className="role-selector">
              <button 
                type="button"
                className={`role-option ${formData.role === 'patient' ? 'active' : ''}`}
                onClick={() => setFormData({...formData, role: 'patient'})}
              >
                Patient
              </button>
              <button 
                type="button"
                className={`role-option ${formData.role === 'doctor' ? 'active' : ''}`}
                onClick={() => setFormData({...formData, role: 'doctor'})}
              >
                Healthcare Worker / Doctor
              </button>
            </div>
          </div>

          <button type="submit" style={{ width: '100%', padding: '0.75rem' }}>
            Register Account
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
          Already registered?{' '}
          <Link to="/login" style={{ color: 'var(--primary)', textDecoration: 'none', fontWeight: 600 }}>
            Sign In
          </Link>
        </div>
      </div>
    </div>
  );
};

export default Signup;
