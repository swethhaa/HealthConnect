import React, { useEffect, useState, useCallback } from 'react';
import axios from 'axios';
import { useUser } from '../context/UserContext';
import { Plus, Check, Loader, UserPlus, Users } from 'lucide-react';

const AddPatients = () => {
  const { user } = useUser();
  const [availablePatients, setAvailablePatients] = useState([]);
  const [assignedPatients, setAssignedPatients] = useState([]);
  const [addingPatientId, setAddingPatientId] = useState(null);
  const [message, setMessage] = useState('');

  const fetchAvailablePatients = useCallback(async () => {
    try {
      const res = await axios.get(`http://localhost:5001/get-available-patients?doctor_id=${user.id}`);
      setAvailablePatients(res.data);
    } catch (err) {
      console.error(err);
      setMessage('Error fetching available patients');
    }
  }, [user.id]);

  const fetchAssignedPatients = useCallback(async () => {
    try {
      const res = await axios.get(`http://localhost:5001/get-assigned-patients?doctor_id=${user.id}`);
      setAssignedPatients(res.data);
    } catch (err) {
      console.error(err);
    }
  }, [user.id]);

  useEffect(() => {
    fetchAvailablePatients();
    fetchAssignedPatients();
  }, [fetchAvailablePatients, fetchAssignedPatients]);

  const addPatientToDoctor = async (patientId) => {
    setAddingPatientId(patientId);
    try {
      await axios.post('http://localhost:5001/add-patient-to-doctor', {
        doctor_id: user.id,
        patient_id: patientId
      });
      setMessage('Patient successfully assigned to your panel.');
      setTimeout(() => setMessage(''), 3000);
      fetchAvailablePatients();
      fetchAssignedPatients();
    } catch (err) {
      setMessage(err.response?.data?.error || 'Error adding patient');
      setTimeout(() => setMessage(''), 3000);
    }
    setAddingPatientId(null);
  };

  return (
    <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
      
      {/* Page Header */}
      <div className="page-header">
        <div>
          <h1 className="page-title">Assign Patients to Clinical Panel</h1>
          <p className="page-subtitle">
            Assign unallocated rural patients to your clinical surveillance queue
          </p>
        </div>
      </div>

      {message && (
        <div style={{ 
          background: 'var(--success-light)', 
          border: '1px solid var(--success-border)', 
          color: 'var(--success)', 
          padding: '0.75rem 1.25rem', 
          borderRadius: '8px', 
          marginBottom: '1.25rem',
          fontSize: '0.88rem',
          fontWeight: 600,
          display: 'flex',
          alignItems: 'center',
          gap: '0.5rem'
        }}>
          <Check size={16} /> {message}
        </div>
      )}

      <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 1.2fr) minmax(0, 1fr)', gap: '1.5rem' }}>
        
        {/* Available to Assign Panel */}
        <div className="card">
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', marginBottom: '1.25rem', paddingBottom: '0.75rem', borderBottom: '1px solid var(--border)' }}>
            <div style={{ width: '32px', height: '32px', borderRadius: '6px', background: 'var(--primary-light)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <UserPlus size={16} color="var(--primary-deep)" />
            </div>
            <div>
              <h2 style={{ margin: 0, fontSize: '1.1rem', fontWeight: 600, color: 'var(--text-main)' }}>
                Available Unassigned Patients ({availablePatients.length})
              </h2>
              <p style={{ margin: 0, fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                Patients awaiting provider assignment
              </p>
            </div>
          </div>

          {availablePatients.length > 0 ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              {availablePatients.map((patient) => (
                <div key={patient.id} style={{ 
                  display: 'flex', 
                  justifyContent: 'space-between', 
                  alignItems: 'center', 
                  padding: '0.85rem 1rem', 
                  background: 'var(--bg-body)', 
                  border: '1px solid var(--border)', 
                  borderRadius: '8px' 
                }}>
                  <div>
                    <div style={{ fontWeight: 600, fontSize: '0.9rem', color: 'var(--text-main)' }}>{patient.full_name}</div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontFamily: 'monospace' }}>ID: {patient.id.slice(0, 10)}</div>
                  </div>

                  <button 
                    type="button"
                    onClick={() => addPatientToDoctor(patient.id)}
                    disabled={addingPatientId === patient.id}
                    className="btn-primary"
                    style={{ padding: '0.45rem 0.85rem', fontSize: '0.8rem' }}
                  >
                    {addingPatientId === patient.id ? (
                      <>
                        <Loader size={13} className="animate-spin" /> Adding...
                      </>
                    ) : (
                      <>
                        <Plus size={14} /> Assign to Panel
                      </>
                    )}
                  </button>
                </div>
              ))}
            </div>
          ) : (
            <div style={{ padding: '2.5rem 1.5rem', textAlign: 'center', background: 'var(--bg-body)', borderRadius: '8px', border: '1px solid var(--border)' }}>
              <Check size={28} color="var(--success)" style={{ margin: '0 auto 0.35rem' }} />
              <p style={{ margin: 0, color: 'var(--text-muted)', fontSize: '0.88rem' }}>
                All registered patients are currently assigned to providers.
              </p>
            </div>
          )}
        </div>

        {/* Currently Assigned Panel */}
        <div className="card">
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', marginBottom: '1.25rem', paddingBottom: '0.75rem', borderBottom: '1px solid var(--border)' }}>
            <div style={{ width: '32px', height: '32px', borderRadius: '6px', background: 'var(--primary-light)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Users size={16} color="var(--primary-deep)" />
            </div>
            <div>
              <h2 style={{ margin: 0, fontSize: '1.1rem', fontWeight: 600, color: 'var(--text-main)' }}>
                Your Assigned Panel ({assignedPatients.length})
              </h2>
              <p style={{ margin: 0, fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                Active patients under your direct surveillance
              </p>
            </div>
          </div>

          {assignedPatients.length > 0 ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.65rem' }}>
              {assignedPatients.map((patient) => (
                <div key={patient.id} style={{ 
                  display: 'flex', 
                  alignItems: 'center', 
                  justifyContent: 'space-between',
                  padding: '0.75rem 1rem', 
                  background: 'var(--bg-body)', 
                  border: '1px solid var(--border)', 
                  borderRadius: '8px' 
                }}>
                  <div>
                    <div style={{ fontWeight: 600, fontSize: '0.88rem', color: 'var(--text-main)' }}>{patient.full_name}</div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontFamily: 'monospace' }}>ID: {patient.id.slice(0, 8)}</div>
                  </div>
                  <span className="badge badge-success" style={{ fontSize: '0.72rem' }}>
                    <Check size={11} /> Assigned
                  </span>
                </div>
              ))}
            </div>
          ) : (
            <div style={{ padding: '2.5rem 1.5rem', textAlign: 'center', background: 'var(--bg-body)', borderRadius: '8px', border: '1px solid var(--border)' }}>
              <p style={{ margin: 0, color: 'var(--text-muted)', fontSize: '0.85rem' }}>
                No patients assigned yet. Use the left column to add patients.
              </p>
            </div>
          )}
        </div>

      </div>
    </div>
  );
};

export default AddPatients;
