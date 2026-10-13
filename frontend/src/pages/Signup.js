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
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      setError(null);
      await axios.post('http://127.0.0.1:5001/signup', formData);
      alert('Account created successfully! Please sign in.');
      navigate('/login');
    } catch (err) {
      console.error('Signup error:', err);
      const message = err.response?.data?.error || err.message || 'Registration failed. Please try again.';
      setError(message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-container">
      <div className="auth-card">
        {/* Brand Header */}
        <div style={{ textAlign: 'center', marginBottom: '1.75rem' }}>
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
            Create Account
          </h1>
          <p style={{ margin: 0, color: 'var(--text-muted)', fontSize: '0.85rem' }}>
            Rural Health Monitoring Network
          </p>
        </div>

        {error && (
          <div style={{ 
            background: 'var(--danger-light)', 
            color: 'var(--danger)', 
            padding: '0.65rem 0.85rem', 
            borderRadius: '6px', 
            marginBottom: '1.25rem', 
            fontSize: '0.85rem', 
            textAlign: 'center', 
            border: '1px solid var(--danger-border)',
            fontWeight: 500
          }}>
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <div style={{ marginBottom: '1rem' }}>
            <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '0.35rem' }}>
              Full Name
            </label>
            <input 
              type="text" 
              placeholder="e.g. Dr. John Smith or Raj Kumar" 
              value={formData.full_name} 
              onChange={(e) => setFormData({...formData, full_name: e.target.value})} 
              required 
            />
          </div>

          <div style={{ marginBottom: '1rem' }}>
            <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '0.35rem' }}>
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
            <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '0.35rem' }}>
              Password
            </label>
            <input 
              type="password" 
              placeholder="Choose a password" 
              value={formData.password} 
              onChange={(e) => setFormData({...formData, password: e.target.value})} 
              minLength={8}
              pattern="(?=.*[a-z])(?=.*[A-Z])(?=.*[^A-Za-z0-9]).{8,}"
              title="Use at least 8 characters, including an uppercase letter, a lowercase letter, and a special character."
              required 
            />
            <p style={{ margin: '0.35rem 0 0', color: 'var(--text-muted)', fontSize: '0.75rem' }}>
              At least 8 characters, with one uppercase letter, one lowercase letter, and one special character.
            </p>
          </div>

          {/* Account Role Selector */}
          <div style={{ marginBottom: '1.5rem' }}>
            <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '0.35rem' }}>
              Account Type
            </label>
            <div style={{ 
              display: 'flex', 
              background: 'var(--primary-subtle)', 
              padding: '0.25rem', 
              borderRadius: '6px',
              border: '1px solid var(--border)' 
            }}>
              <button 
                type="button"
                onClick={() => setFormData({...formData, role: 'patient'})}
                style={{ 
                  flex: 1,
                  padding: '0.5rem',
                  fontSize: '0.85rem',
                  fontWeight: 600,
                  background: formData.role === 'patient' ? '#FFFFFF' : 'transparent',
                  color: formData.role === 'patient' ? 'var(--primary-deep)' : 'var(--text-muted)',
                  border: 'none',
                  borderRadius: '4px',
                  boxShadow: formData.role === 'patient' ? '0 1px 3px rgba(0,0,0,0.06)' : 'none'
                }}
              >
                Patient
              </button>
              <button 
                type="button"
                onClick={() => setFormData({...formData, role: 'doctor'})}
                style={{ 
                  flex: 1,
                  padding: '0.5rem',
                  fontSize: '0.85rem',
                  fontWeight: 600,
                  background: formData.role === 'doctor' ? '#FFFFFF' : 'transparent',
                  color: formData.role === 'doctor' ? 'var(--primary-deep)' : 'var(--text-muted)',
                  border: 'none',
                  borderRadius: '4px',
                  boxShadow: formData.role === 'doctor' ? '0 1px 3px rgba(0,0,0,0.06)' : 'none'
                }}
              >
                Healthcare Provider
              </button>
            </div>
          </div>

          <button 
            type="submit" 
            disabled={loading}
            className="btn-primary" 
            style={{ width: '100%', padding: '0.75rem', fontSize: '0.92rem' }}
          >
            {loading ? 'Registering...' : 'Register Account'}
          </button>
        </form>

        <div style={{ 
          textAlign: 'center', 
          marginTop: '1.5rem', 
          paddingTop: '1.25rem', 
          borderTop: '1px solid var(--border-subtle)',
          fontSize: '0.85rem',
          color: 'var(--text-muted)'
        }}>
          Already registered?{' '}
          <Link to="/login" style={{ color: 'var(--primary-deep)', textDecoration: 'none', fontWeight: 600 }}>
            Sign In
          </Link>
        </div>
      </div>
    </div>
  );
};

export default Signup;
