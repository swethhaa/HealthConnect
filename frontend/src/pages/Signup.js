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
      alert('Signup successful! Please login.');
      navigate('/login');
    } catch (err) {
      console.error('Signup error:', err);
      const message = err.response?.data?.error || err.message || 'Signup failed. Please try again.';
      setError(message);
    }
  };

  return (
    <div className="auth-container">
      <div className="glass-card auth-card">
        <div style={{ textAlign: 'center', marginBottom: '1.5rem' }}>
          <Activity size={32} color="var(--primary)" style={{ margin: '0 auto 0.75rem' }} />
          <h2 className="gradient-text">Create Account</h2>
          <p style={{ color: 'var(--text-muted)' }}>Join the Rural Health Network</p>
        </div>
        {error && (
          <div style={{ background: 'rgba(239, 68, 68, 0.1)', color: '#ef4444', padding: '0.75rem', borderRadius: '0.75rem', marginBottom: '1rem', fontSize: '0.875rem', textAlign: 'center', border: '1px solid rgba(239, 68, 68, 0.2)' }}>
            {error}
          </div>
        )}
        <form onSubmit={handleSubmit}>
          <input 
            type="text" 
            placeholder="Full Name" 
            value={formData.full_name} 
            onChange={(e) => setFormData({...formData, full_name: e.target.value})} 
            required 
          />
          <input 
            type="text" 
            placeholder="Username" 
            value={formData.username} 
            onChange={(e) => setFormData({...formData, username: e.target.value})} 
            required 
          />
          <input 
            type="password" 
            placeholder="Password" 
            value={formData.password} 
            onChange={(e) => setFormData({...formData, password: e.target.value})} 
            required 
          />
          <div className="role-selector">
            <button 
              type="button"
              className={`role-option ${formData.role === 'patient' ? 'active' : ''}`}
              onClick={() => {
                console.log('Role selected: patient');
                setFormData({...formData, role: 'patient'});
              }}
            >
              Patient
            </button>
            <button 
              type="button"
              className={`role-option ${formData.role === 'doctor' ? 'active' : ''}`}
              onClick={() => {
                console.log('Role selected: doctor');
                setFormData({...formData, role: 'doctor'});
              }}
            >
              Doctor
            </button>
          </div>
          <button 
            type="submit" 
            style={{ position: 'relative', zIndex: 10 }}
            onClick={() => console.log('Sign up button clicked')}
          >
            Sign Up
          </button>
        </form>
        <p style={{ textAlign: 'center', marginTop: '1rem', fontSize: '0.875rem' }}>
          Already have an account? <Link to="/login" style={{ color: 'var(--primary)', textDecoration: 'none' }}>Login</Link>
        </p>
      </div>
    </div>
  );
};

export default Signup;
