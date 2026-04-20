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
              <div className="glass-card">
                <h2 className="gradient-text">Alerts & Notifications</h2>
                <p>No new system alerts.</p>
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