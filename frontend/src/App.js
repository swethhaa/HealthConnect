import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { UserProvider, useUser } from './context/UserContext';
import Layout from './components/Layout';
import Login from './pages/Login';
import Signup from './pages/Signup';
import PatientDashboard from './pages/PatientDashboard';
import DoctorDashboard from './pages/DoctorDashboard';
import Patients from './pages/Patients';
import HealthRecords from './pages/HealthRecords';
import DeviceManagement from './pages/DeviceManagement';
import AddPatients from './pages/AddPatients';
import ReportGeneration from './pages/ReportGeneration';
import { CheckCircle2 } from 'lucide-react';

const ProtectedRoute = ({ children, role }) => {
  const { user } = useUser();
  if (!user) return <Navigate to="/login" />;
  if (role && user.role !== role) return <Navigate to="/" />;
  return <Layout>{children}</Layout>;
};

function App() {
  return (
    <UserProvider>
      <Router>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/signup" element={<Signup />} />
          
          <Route path="/patient-dashboard" element={
            <ProtectedRoute role="patient">
              <PatientDashboard />
            </ProtectedRoute>
          } />
          
          <Route path="/doctor-dashboard" element={
            <ProtectedRoute role="doctor">
              <DoctorDashboard />
            </ProtectedRoute>
          } />

          <Route path="/patients" element={
            <ProtectedRoute role="doctor">
              <Patients />
            </ProtectedRoute>
          } />

          <Route path="/records" element={
            <ProtectedRoute role="patient">
              <HealthRecords />
            </ProtectedRoute>
          } />

          <Route path="/devices" element={
            <ProtectedRoute role="patient">
              <DeviceManagement />
            </ProtectedRoute>
          } />

          <Route path="/add-patients" element={
            <ProtectedRoute role="doctor">
              <AddPatients />
            </ProtectedRoute>
          } />

          <Route path="/generate-report" element={
            <ProtectedRoute role="patient">
              <ReportGeneration />
            </ProtectedRoute>
          } />

          <Route path="/alerts" element={
            <ProtectedRoute>
              <div>
                <header style={{ marginBottom: '2rem', borderBottom: '1px solid var(--border)', paddingBottom: '1rem' }}>
                  <h1 style={{ margin: 0, fontSize: '1.6rem', color: 'var(--text-main)', fontWeight: 700 }}>
                    System Alerts & Notifications
                  </h1>
                  <p style={{ margin: '0.25rem 0 0 0', color: 'var(--text-muted)', fontSize: '0.9rem' }}>
                    Centralized notification feed for critical vital events
                  </p>
                </header>
                <div className="card" style={{ padding: '3.5rem 2rem', textAlign: 'center' }}>
                  <div style={{ width: '48px', height: '48px', borderRadius: '50%', background: 'var(--success-light)', border: '1px solid var(--success-border)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 1rem' }}>
                    <CheckCircle2 size={24} color="var(--success)" />
                  </div>
                  <h3 style={{ margin: '0 0 0.5rem 0', fontSize: '1.1rem', color: 'var(--text-main)', fontWeight: 600 }}>
                    No Broadcast System Alerts
                  </h3>
                  <p style={{ margin: 0, color: 'var(--text-muted)', fontSize: '0.875rem' }}>
                    All patient telemetry streams are being monitored normally. Individual patient alerts will appear on your dashboard.
                  </p>
                </div>
              </div>
            </ProtectedRoute>
          } />

          <Route path="/" element={<Navigate to="/login" />} />
        </Routes>
      </Router>
    </UserProvider>
  );
}

export default App;