import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { AuthProvider } from './contexts/AuthContext';
import ProtectedRoute from './components/ProtectedRoute';
import Layout from './components/Layout';

import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import AriaChat from './pages/AriaChat';
import Calendar from './pages/Calendar';
import RelationshipPulse from './pages/RelationshipPulse';
import Habits from './pages/Habits';
import Profile from './pages/Profile';

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          {/* Public Route */}
          <Route path="/login" element={<Login />} />

          {/* Protected Routes */}
          <Route
            path="/"
            element={
              <ProtectedRoute>
                <Layout>
                  <Dashboard />
                </Layout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/aria"
            element={
              <ProtectedRoute>
                <Layout>
                  <AriaChat />
                </Layout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/calendar"
            element={
              <ProtectedRoute>
                <Layout>
                  <Calendar />
                </Layout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/pulse"
            element={
              <ProtectedRoute>
                <Layout>
                  <RelationshipPulse />
                </Layout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/habits"
            element={
              <ProtectedRoute>
                <Layout>
                  <Habits />
                </Layout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/profile"
            element={
              <ProtectedRoute>
                <Layout>
                  <Profile />
                </Layout>
              </ProtectedRoute>
            }
          />

          {/* Fallback */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
      <Toaster 
        position="top-right" 
        toastOptions={{ 
          style: { 
            fontFamily: 'Inter, sans-serif', 
            borderRadius: '12px',
            fontSize: '0.9rem',
            background: '#ffffff',
            color: '#1E293B',
            boxShadow: '0 4px 12px rgba(167, 139, 250, 0.15)',
            border: '1px solid rgba(167, 139, 250, 0.15)',
          } 
        }} 
      />
    </AuthProvider>
  );
}
