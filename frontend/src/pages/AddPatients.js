import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { useUser } from '../context/UserContext';
import { Plus, Check, Loader, UserCheck, UserPlus } from 'lucide-react';

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
      setMessage('Patient assigned successfully!');
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
      <header style={{ marginBottom: '2rem', borderBottom: '1px solid var(--border)', paddingBottom: '1rem' }}>
        <h1 style={{ margin: 0, fontSize: '1.6rem', color: 'var(--text-main)', fontWeight: 700 }}>
          Patient Assignment & Management
        </h1>
        <p style={{ margin: '0.25rem 0 0 0', color: 'var(--text-muted)', fontSize: '0.9rem' }}>
          Assign unallocated patients to your active clinical roster
        </p>
      </header>

      {message && (
        <div className="card" style={{ 
          marginBottom: '1.5rem', 
          padding: '0.875rem 1.25rem', 
          background: message.includes('successfully') ? 'var(--success-light)' : 'var(--danger-light)',
          borderLeft: `4px solid ${message.includes('successfully') ? 'var(--success)' : 'var(--danger)'}`
        }}>
          <p style={{ margin: 0, fontSize: '0.9rem', fontWeight: 600, color: message.includes('successfully') ? 'var(--success)' : 'var(--danger)' }}>
            {message}
          </p>
        </div>
      )}

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.75rem' }}>
        {/* Available Patients */}
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1.25rem' }}>
            <UserPlus size={20} color="var(--primary)" />
            <h2 style={{ margin: 0, fontSize: '1.15rem', color: 'var(--text-main)', fontWeight: 700 }}>
              Unassigned Patients
            </h2>
          </div>

          {availablePatients.length === 0 ? (
            <div className="card" style={{ padding: '2.5rem 1.5rem', textAlign: 'center', color: 'var(--text-muted)' }}>
              <p style={{ margin: 0, fontSize: '0.9rem' }}>All registered patients are currently assigned to doctors.</p>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.875rem' }}>
              {availablePatients.map((patient) => (
                <div key={patient.id} className="card" style={{ 
                  display: 'flex', 
                  justifyContent: 'space-between', 
                  alignItems: 'center',
                  padding: '1rem 1.25rem'
                }}>
                  <div>
                    <h4 style={{ margin: '0 0 0.2rem 0', fontSize: '0.95rem', color: 'var(--text-main)' }}>{patient.full_name}</h4>
                    <p style={{ margin: 0, fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                      ID: {patient.id.slice(0, 8)}
                    </p>
                  </div>
                  <button
                    onClick={() => addPatientToDoctor(patient.id)}
                    disabled={addingPatientId === patient.id}
                    style={{
                      background: addingPatientId === patient.id ? 'var(--primary-hover)' : 'var(--primary)',
                      border: 'none',
                      color: 'white',
                      padding: '0.45rem 0.9rem',
                      borderRadius: '0.375rem',
                      cursor: addingPatientId === patient.id ? 'not-allowed' : 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.4rem',
                      fontSize: '0.85rem',
                      width: 'auto',
                      fontWeight: 600
                    }}
                  >
                    {addingPatientId === patient.id ? (
                      <>
                        <Loader size={15} style={{ animation: 'spin 1s linear infinite' }} />
                        Assigning...
                      </>
                    ) : (
                      <>
                        <Plus size={15} />
                        Assign
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
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1.25rem' }}>
            <UserCheck size={20} color="var(--teal)" />
            <h2 style={{ margin: 0, fontSize: '1.15rem', color: 'var(--text-main)', fontWeight: 700 }}>
              My Roster Patients
            </h2>
          </div>

          {assignedPatients.length === 0 ? (
            <div className="card" style={{ padding: '2.5rem 1.5rem', textAlign: 'center', color: 'var(--text-muted)' }}>
              <p style={{ margin: 0, fontSize: '0.9rem' }}>No patients assigned to your clinical roster yet.</p>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.875rem' }}>
              {assignedPatients.map((patient) => (
                <div key={patient.id} className="card" style={{ 
                  display: 'flex', 
                  justifyContent: 'space-between', 
                  alignItems: 'center',
                  padding: '1rem 1.25rem',
                  borderLeft: '4px solid var(--teal)'
                }}>
                  <div>
                    <h4 style={{ margin: '0 0 0.2rem 0', fontSize: '0.95rem', color: 'var(--text-main)' }}>{patient.full_name}</h4>
                    <p style={{ margin: 0, fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                      Assigned Date: {new Date(patient.assigned_date).toLocaleDateString()}
                    </p>
                  </div>
                  <div style={{ 
                    width: '28px', 
                    height: '28px', 
                    borderRadius: '50%', 
                    background: 'var(--teal-light)', 
                    display: 'flex', 
                    alignItems: 'center', 
                    justifyContent: 'center' 
                  }}>
                    <Check size={16} color="var(--teal)" />
                  </div>
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
