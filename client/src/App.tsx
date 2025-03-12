import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { useState, useEffect } from 'react';
import { AuthProvider } from './context/AuthContext';
import { useAuth } from './context/AuthContext';
import './App.css';

// Layout components
import DashboardLayout from './components/layout/DashboardLayout';
import PublicLayout from './components/layout/PublicLayout';

// Pages
import Dashboard from './pages/Dashboard';
import Login from './pages/Login';
import ForgotPassword from './pages/ForgotPassword';
import ResetPassword from './pages/ResetPassword';
import Customers from './pages/customers/Customers';
import CustomerDetail from './pages/customers/CustomerDetail';
import NewCustomer from './pages/customers/NewCustomer';
import EditCustomer from './pages/customers/EditCustomer';
import Projects from './pages/projects/Projects';
import ProjectDetail from './pages/projects/ProjectDetail';
import NewProject from './pages/projects/NewProject';
import EditProject from './pages/projects/EditProject';
import Appointments from './pages/appointments/Appointments';
import AppointmentDetail from './pages/appointments/AppointmentDetail';
import NewAppointment from './pages/appointments/NewAppointment';
import EditAppointment from './pages/appointments/EditAppointment';
import Services from './pages/services/Services';
import ServiceDetail from './pages/services/ServiceDetail';
import NewService from './pages/services/NewService';
import EditService from './pages/services/EditService';
import Requests from './pages/requests/Requests';
import RequestDetail from './pages/requests/RequestDetail';
import Profile from './pages/Profile';
import Settings from './pages/Settings';
import SystemSettings from './pages/SystemSettings';
import BackupSettings from './pages/backupSettings';
import NotFound from './pages/NotFound';

// Protected Route component
const ProtectedRoute = ({ children }: { children: React.ReactNode }) => {
  const { user, loading } = useAuth();
  
  if (loading) {
    return <div className="loading">Loading...</div>;
  }
  
  if (!user) {
    return <Navigate to="/login" />;
  }
  
  return <>{children}</>;
};

const App = () => {
  return (
    <AuthProvider>
      <Router>
        <Routes>
          {/* Public routes */}
          <Route path="/" element={<PublicLayout />}>
            <Route index element={<Navigate to="/login" />} />
            <Route path="login" element={<Login />} />
            <Route path="forgot-password" element={<ForgotPassword />} />
            <Route path="reset-password/:token" element={<ResetPassword />} />
          </Route>
          
          {/* Protected dashboard routes */}
          <Route
            path="/dashboard"
            element={
              <ProtectedRoute>
                <DashboardLayout />
              </ProtectedRoute>
            }
          >
            <Route index element={<Dashboard />} />
            
            {/* Customer routes */}
            <Route path="kunden">
              <Route index element={<Customers />} />
              <Route path=":id" element={<CustomerDetail />} />
              <Route path="neu" element={<NewCustomer />} />
              <Route path=":id/edit" element={<EditCustomer />} />
            </Route>
            
            {/* Project routes */}
            <Route path="projekte">
              <Route index element={<Projects />} />
              <Route path=":id" element={<ProjectDetail />} />
              <Route path="neu" element={<NewProject />} />
              <Route path=":id/edit" element={<EditProject />} />
            </Route>
            
            {/* Appointment routes */}
            <Route path="termine">
              <Route index element={<Appointments />} />
              <Route path=":id" element={<AppointmentDetail />} />
              <Route path="neu" element={<NewAppointment />} />
              <Route path=":id/edit" element={<EditAppointment />} />
            </Route>
            
            {/* Service routes */}
            <Route path="dienste">
              <Route index element={<Services />} />
              <Route path=":id" element={<ServiceDetail />} />
              <Route path="neu" element={<NewService />} />
              <Route path=":id/edit" element={<EditService />} />
            </Route>
            
            {/* Request routes */}
            <Route path="requests">
              <Route index element={<Requests />} />
              <Route path=":id" element={<RequestDetail />} />
            </Route>
            
            {/* Profile and settings */}
            <Route path="profile" element={<Profile />} />
            <Route path="settings" element={<Settings />} />
            <Route path="settings/system" element={<SystemSettings />} />
            <Route path="settings/backup" element={<BackupSettings />} />
          </Route>
          
          {/* 404 route */}
          <Route path="*" element={<NotFound />} />
        </Routes>
      </Router>
    </AuthProvider>
  );
};

export default App;