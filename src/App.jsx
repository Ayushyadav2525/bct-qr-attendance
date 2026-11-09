import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { AttendanceProvider } from './context/AttendanceContext';
import { DashboardLayout } from './layouts/DashboardLayout';

import { Login } from './pages/Login';
import { AdminDashboard } from './pages/AdminDashboard';
import { TeacherDashboard } from './pages/TeacherDashboard';
import { StudentDashboard } from './pages/StudentDashboard';
import { QRGenerator } from './pages/QRGenerator';
import { QRScanner } from './pages/QRScanner';
import { StudentsManagement } from './pages/StudentsManagement';
import { TeachersManagement } from './pages/TeachersManagement';
import { ClassesManagement } from './pages/ClassesManagement';
import { AttendanceRecords } from './pages/AttendanceRecords';
import { Analytics } from './pages/Analytics';
import { BlockchainDemo } from './pages/BlockchainDemo';
import { UserProfile } from './pages/UserProfile';
import { Settings } from './pages/Settings';

// Role-based Route Guard
const RoleProtectedRoute = ({ allowedRoles, children }) => {
  const { currentUser } = useAuth();
  if (!currentUser) {
    return <Navigate to="/login" replace />;
  }
  if (allowedRoles && !allowedRoles.includes(currentUser.role)) {
    // Redirect unauthorized navigation to authorized home
    if (currentUser.role === 'teacher') return <Navigate to="/teacher" replace />;
    if (currentUser.role === 'student') return <Navigate to="/student" replace />;
    return <Navigate to="/admin" replace />;
  }
  return children;
};

// Default index redirection based on active role
const RoleHomeRedirect = () => {
  const { currentUser } = useAuth();
  if (!currentUser) return <Navigate to="/login" replace />;
  if (currentUser.role === 'teacher') return <Navigate to="/teacher" replace />;
  if (currentUser.role === 'student') return <Navigate to="/student" replace />;
  return <Navigate to="/admin" replace />;
};

export function App() {
  return (
    <AuthProvider>
      <AttendanceProvider>
        <BrowserRouter>
          <Routes>
            <Route path="/login" element={<Login />} />

            <Route
              path="/"
              element={
                <RoleProtectedRoute>
                  <DashboardLayout />
                </RoleProtectedRoute>
              }
            >
              <Route index element={<RoleHomeRedirect />} />
              <Route path="admin" element={<RoleProtectedRoute allowedRoles={['admin']}><AdminDashboard /></RoleProtectedRoute>} />
              <Route path="teacher" element={<RoleProtectedRoute allowedRoles={['teacher', 'admin']}><TeacherDashboard /></RoleProtectedRoute>} />
              <Route path="student" element={<RoleProtectedRoute allowedRoles={['student', 'admin']}><StudentDashboard /></RoleProtectedRoute>} />
              <Route path="qr-generator" element={<RoleProtectedRoute allowedRoles={['teacher', 'admin']}><QRGenerator /></RoleProtectedRoute>} />
              <Route path="qr-scanner" element={<RoleProtectedRoute allowedRoles={['student', 'admin']}><QRScanner /></RoleProtectedRoute>} />
              <Route path="students" element={<RoleProtectedRoute allowedRoles={['admin', 'teacher']}><StudentsManagement /></RoleProtectedRoute>} />
              <Route path="teachers" element={<RoleProtectedRoute allowedRoles={['admin']}><TeachersManagement /></RoleProtectedRoute>} />
              <Route path="classes" element={<RoleProtectedRoute allowedRoles={['admin', 'teacher']}><ClassesManagement /></RoleProtectedRoute>} />
              <Route path="records" element={<RoleProtectedRoute allowedRoles={['admin', 'teacher', 'student']}><AttendanceRecords /></RoleProtectedRoute>} />
              <Route path="analytics" element={<RoleProtectedRoute allowedRoles={['admin', 'teacher']}><Analytics /></RoleProtectedRoute>} />
              <Route path="blockchain-demo" element={<RoleProtectedRoute allowedRoles={['admin', 'teacher', 'student']}><BlockchainDemo /></RoleProtectedRoute>} />
              <Route path="profile" element={<RoleProtectedRoute allowedRoles={['admin', 'teacher', 'student']}><UserProfile /></RoleProtectedRoute>} />
              <Route path="settings" element={<RoleProtectedRoute allowedRoles={['admin']}><Settings /></RoleProtectedRoute>} />
            </Route>

            {/* Catch-all */}
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </BrowserRouter>
      </AttendanceProvider>
    </AuthProvider>
  );
}

export default App;
