import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { useUser } from '../context/UserContext';
import { Plus, Check, Loader } from 'lucide-react';

const AddPatients = () => {
  const { user } = useUser();
  const [availablePatients, setAvailablePatients] = useState([]);
  const [assignedPatients, setAssignedPatients] = useState([]);
  const [loading, setLoading] = useState(false);
  const [addingPatientId, setAddingPatientId] = useState(null);
  const [message, setMessage] = useState('');

  useEffect(() => {
    fetchAvailablePatients();
    fetchAssignedPatients();
  }, []);

  const fetchAvailablePatients = async () => {
    try {
      const res = await axios.get(`http://localhost:5001/get-available-patients?doctor_id=${user.id}`);
      setAvailablePatients(res.data);
    } catch (err) {
      console.error(err);
      setMessage('Error fetching available patients');
    }
  };

  const fetchAssignedPatients = async () => {
    try {
      const res = await axios.get(`http://localhost:5001/get-assigned-patients?doctor_id=${user.id}`);
      setAssignedPatients(res.data);
    } catch (err) {
      console.error(err);
    }
  };

  const addPatientToDoctor = async (patientId) => {
    setAddingPatientId(patientId);
    try {
      const res = await axios.post('http://localhost:5001/add-patient-to-doctor', {
        doctor_id: user.id,
        patient_id: patientId
      });
      setMessage('Patient added successfully!');
      setTimeout(() => setMessage(''), 3000);
      
      // Refresh lists
      fetchAvailablePatients();
      fetchAssignedPatients();
    } catch (err) {
      setMessage(err.response?.data?.error || 'Error adding patient');
      setTimeout(() => setMessage(''), 3000);
    }
    setAddingPatientId(null);
  };

  return (
    <div>
      <header style={{ marginBottom: '2.5rem' }}>
        <h1 className="gradient-text" style={{ margin: 0, fontSize: '2rem' }}>Manage Patients</h1>
        <p style={{ color: 'var(--text-muted)' }}>Add and manage your patient list</p>
      </header>

      {message && (
        <div className="glass-card" style={{ 
          marginBottom: '1.5rem', 
          padding: '1rem', 
          background: message.includes('successfully') ? 'rgba(16, 185, 129, 0.1)' : 'rgba(239, 68, 68, 0.1)',
          borderLeft: `4px solid ${message.includes('successfully') ? '#10b981' : '#ef4444'}`
        }}>
          <p style={{ margin: 0, color: message.includes('successfully') ? '#10b981' : '#fca5a5' }}>
            {message}
          </p>
        </div>
      )}

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '2rem' }}>
        {/* Available Patients */}
        <div>
          <h2 style={{ marginBottom: '1.5rem', fontSize: '1.25rem' }}>Available Patients</h2>
          {availablePatients.length === 0 ? (
            <div className="glass-card" style={{ padding: '2rem', textAlign: 'center' }}>
              <p style={{ color: 'var(--text-muted)', margin: 0 }}>All patients are already assigned</p>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              {availablePatients.map((patient) => (
                <div key={patient.id} className="glass-card" style={{ 
                  display: 'flex', 
                  justifyContent: 'space-between', 
                  alignItems: 'center',
                  padding: '1.25rem'
                }}>
                  <div>
                    <h4 style={{ margin: '0 0 0.25rem 0' }}>{patient.full_name}</h4>
                    <p style={{ margin: 0, fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                      ID: {patient.id.slice(0, 8)}
                    </p>
                  </div>
                  <button
                    onClick={() => addPatientToDoctor(patient.id)}
                    disabled={addingPatientId === patient.id}
                    style={{
                      background: addingPatientId === patient.id ? 'var(--primary-dark)' : 'var(--primary)',
                      border: 'none',
                      color: 'white',
                      padding: '0.5rem 1rem',
                      borderRadius: '0.5rem',
                      cursor: addingPatientId === patient.id ? 'not-allowed' : 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.5rem',
                      fontSize: '0.875rem'
                    }}
                  >
                    {addingPatientId === patient.id ? (
                      <>
                        <Loader size={16} style={{ animation: 'spin 1s linear infinite' }} />
                        Adding...
                      </>
                    ) : (
                      <>
                        <Plus size={16} />
                        Add
                      </>
                    )}
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Assigned Patients */}
        <div>
          <h2 style={{ marginBottom: '1.5rem', fontSize: '1.25rem' }}>My Patients</h2>
          {assignedPatients.length === 0 ? (
            <div className="glass-card" style={{ padding: '2rem', textAlign: 'center' }}>
              <p style={{ color: 'var(--text-muted)', margin: 0 }}>No patients assigned yet</p>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              {assignedPatients.map((patient) => (
                <div key={patient.id} className="glass-card" style={{ 
                  display: 'flex', 
                  justifyContent: 'space-between', 
                  alignItems: 'center',
                  padding: '1.25rem',
                  borderLeft: '4px solid var(--accent)'
                }}>
                  <div>
                    <h4 style={{ margin: '0 0 0.25rem 0' }}>{patient.full_name}</h4>
                    <p style={{ margin: 0, fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                      Assigned: {new Date(patient.assigned_date).toLocaleDateString()}
                    </p>
                  </div>
                  <Check size={20} style={{ color: 'var(--accent)' }} />
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      <style>{`
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
};

export default AddPatients;
