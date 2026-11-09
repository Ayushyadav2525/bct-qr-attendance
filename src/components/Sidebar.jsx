import React from 'react';
import { NavLink } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import {
  LayoutDashboard,
  QrCode,
  ScanLine,
  Users,
  GraduationCap,
  BookOpen,
  ClipboardCheck,
  BarChart3,
  ShieldCheck,
  LogOut,
  X,
  UserCheck,
  Settings as SettingsIcon
} from 'lucide-react';

export const Sidebar = ({ isOpen, onClose }) => {
  const { currentUser, logout } = useAuth();

  const role = currentUser?.role || 'admin';

  return (
    <>
      {isOpen && <div className="sidebar-overlay" onClick={onClose} />}

      <aside className={`sidebar ${isOpen ? 'open' : ''}`}>
        <div className="sidebar-header">
          <div className="sidebar-logo-icon">
            <QrCode size={22} />
          </div>
          <div style={{ flex: 1 }}>
            <span className="sidebar-title">EduAttend QR</span>
            <span className="sidebar-subtitle">Classroom Management</span>
          </div>
          <button
            onClick={onClose}
            className="btn btn-outline btn-sm mobile-close"
            style={{ display: 'none', color: '#94a3b8', border: 'none', background: 'transparent' }}
          >
            <X size={20} />
          </button>
        </div>

        <div className="sidebar-nav">
          {/* Admin Navigation */}
          {role === 'admin' && (
            <>
              <div className="nav-section-label">Institutional Overview</div>
              <NavLink to="/admin" className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`} onClick={onClose}>
                <LayoutDashboard size={18} />
                <span>Admin Dashboard</span>
              </NavLink>

              <div className="nav-section-label">Academic Directories</div>
              <NavLink to="/students" className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`} onClick={onClose}>
                <Users size={18} />
                <span>Students Directory</span>
              </NavLink>
              <NavLink to="/teachers" className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`} onClick={onClose}>
                <UserCheck size={18} />
                <span>Faculty Directory</span>
              </NavLink>
              <NavLink to="/classes" className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`} onClick={onClose}>
                <BookOpen size={18} />
                <span>Classes & Subjects</span>
              </NavLink>

              <div className="nav-section-label">Attendance Control</div>
              <NavLink to="/records" className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`} onClick={onClose}>
                <ClipboardCheck size={18} />
                <span>All Attendance Records</span>
              </NavLink>
              <NavLink to="/qr-generator" className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`} onClick={onClose}>
                <QrCode size={18} />
                <span>QR Sessions Hub</span>
              </NavLink>

              <div className="nav-section-label">Intelligence & Verification</div>
              <NavLink to="/analytics" className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`} onClick={onClose}>
                <BarChart3 size={18} />
                <span>Analytics & Reports</span>
              </NavLink>
              <NavLink to="/blockchain-demo" className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`} onClick={onClose}>
                <ShieldCheck size={18} />
                <span>Blockchain Verification</span>
              </NavLink>

              <div className="nav-section-label">Administration</div>
              <NavLink to="/settings" className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`} onClick={onClose}>
                <SettingsIcon size={18} />
                <span>System Settings</span>
              </NavLink>
              <NavLink to="/profile" className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`} onClick={onClose}>
                <Users size={18} />
                <span>Admin Profile</span>
              </NavLink>
            </>
          )}

          {/* Teacher Navigation */}
          {role === 'teacher' && (
            <>
              <div className="nav-section-label">Faculty Portal</div>
              <NavLink to="/teacher" className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`} onClick={onClose}>
                <LayoutDashboard size={18} />
                <span>Teacher Dashboard</span>
              </NavLink>

              <div className="nav-section-label">My Teaching Scope</div>
              <NavLink to="/classes" className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`} onClick={onClose}>
                <BookOpen size={18} />
                <span>My Classes</span>
              </NavLink>
              <NavLink to="/students" className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`} onClick={onClose}>
                <Users size={18} />
                <span>My Students</span>
              </NavLink>

              <div className="nav-section-label">Classroom Attendance</div>
              <NavLink to="/qr-generator" className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`} onClick={onClose}>
                <QrCode size={18} />
                <span>Generate QR Code</span>
              </NavLink>
              <NavLink to="/records" className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`} onClick={onClose}>
                <ClipboardCheck size={18} />
                <span>Attendance Records</span>
              </NavLink>

              <div className="nav-section-label">Reports & Verification</div>
              <NavLink to="/analytics" className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`} onClick={onClose}>
                <BarChart3 size={18} />
                <span>Subject Reports</span>
              </NavLink>
              <NavLink to="/blockchain-demo" className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`} onClick={onClose}>
                <ShieldCheck size={18} />
                <span>Blockchain Verification</span>
              </NavLink>
              <NavLink to="/profile" className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`} onClick={onClose}>
                <Users size={18} />
                <span>My Profile</span>
              </NavLink>
            </>
          )}

          {/* Student Navigation */}
          {role === 'student' && (
            <>
              <div className="nav-section-label">Student Portal</div>
              <NavLink to="/student" className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`} onClick={onClose}>
                <LayoutDashboard size={18} />
                <span>Student Dashboard</span>
              </NavLink>

              <div className="nav-section-label">Attendance Actions</div>
              <NavLink to="/qr-scanner" className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`} onClick={onClose}>
                <ScanLine size={18} />
                <span>Scan QR Attendance</span>
              </NavLink>
              <NavLink to="/records" className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`} onClick={onClose}>
                <ClipboardCheck size={18} />
                <span>My Attendance Records</span>
              </NavLink>

              <div className="nav-section-label">Verification & Account</div>
              <NavLink to="/blockchain-demo" className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`} onClick={onClose}>
                <ShieldCheck size={18} />
                <span>Blockchain Verification</span>
              </NavLink>
              <NavLink to="/profile" className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`} onClick={onClose}>
                <Users size={18} />
                <span>My Profile</span>
              </NavLink>
            </>
          )}
        </div>

        <div className="sidebar-footer">
          <button onClick={logout} className="btn-logout">
            <LogOut size={16} />
            <span>Sign Out ({role})</span>
          </button>
        </div>

        <style>{`
          @media (max-width: 900px) {
            .mobile-close {
              display: inline-flex !important;
            }
          }
        `}</style>
      </aside>
    </>
  );
};
