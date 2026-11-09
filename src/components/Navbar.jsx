import React from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { Menu, LogOut, ShieldCheck, RefreshCw } from 'lucide-react';
import { useAttendance } from '../context/AttendanceContext';

export const Navbar = ({ onToggleSidebar }) => {
  const { currentUser, loginAsRole, logout } = useAuth();
  const { resetAllData } = useAttendance();
  const navigate = useNavigate();

  const handleRoleChange = (e) => {
    const role = e.target.value;
    loginAsRole(role);
    if (role === 'admin') navigate('/admin');
    else if (role === 'teacher') navigate('/teacher');
    else if (role === 'student') navigate('/student');
  };

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <header className="top-nav">
      <div className="nav-left">
        <button
          onClick={onToggleSidebar}
          className="btn btn-outline btn-sm mobile-menu-btn"
          style={{ display: 'none', padding: '0.4rem' }}
          id="toggle-sidebar-btn"
          aria-label="Toggle Navigation Menu"
        >
          <Menu size={18} />
        </button>
        <span className="nav-title" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <span>QR-Attendance Campus</span>
          <span className={`badge ${localStorage.getItem('qr_att_token') ? 'badge-success' : 'badge-info'}`} style={{ fontSize: '0.68rem', fontWeight: 600 }}>
            {localStorage.getItem('qr_att_token') ? 'Live Backend Mode' : 'Demo Mode'}
          </span>
        </span>
      </div>

      <div className="nav-right">
        {/* Quick Demo Role Switcher - only when no authenticated backend token is active */}
        {!localStorage.getItem('qr_att_token') && (
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)', fontWeight: 500 }}>
              View As:
            </span>
            <select
              value={currentUser?.role || 'admin'}
              onChange={handleRoleChange}
              className="form-control form-select"
              style={{
                padding: '0.3rem 0.65rem',
                fontSize: '0.82rem',
                fontWeight: 600,
                width: 'auto',
                cursor: 'pointer',
                borderColor: 'var(--primary-border)',
                backgroundColor: 'var(--primary-light)',
                color: 'var(--primary)',
              }}
              title="Switch demo persona"
            >
              <option value="admin">Admin (Arthur)</option>
              <option value="teacher">Teacher (Dr. Vance)</option>
              <option value="student">Student (Alex)</option>
            </select>
          </div>
        )}

        {/* Reset Demo Data Button */}
        <button
          onClick={resetAllData}
          className="btn btn-outline btn-sm"
          title="Reset demo data to initial factory state"
          style={{ padding: '0.35rem 0.65rem', fontSize: '0.78rem', display: 'flex', gap: '4px' }}
        >
          <RefreshCw size={13} />
          <span>Reset Demo</span>
        </button>

        {/* User Card */}
        {currentUser && (
          <div className="user-badge">
            <div className="user-avatar">{currentUser.avatar || currentUser.name.charAt(0)}</div>
            <div className="user-info">
              <span className="user-name">{currentUser.name}</span>
              <span className="user-role-label">{currentUser.role}</span>
            </div>
          </div>
        )}

        <button
          onClick={handleLogout}
          className="btn btn-outline btn-sm"
          title="Logout"
          style={{ padding: '0.4rem 0.65rem', color: 'var(--danger)', borderColor: 'var(--danger-border)' }}
        >
          <LogOut size={15} />
        </button>
      </div>

      <style>{`
        @media (max-width: 900px) {
          .mobile-menu-btn {
            display: inline-flex !important;
          }
          .user-info {
            display: none;
          }
        }
      `}</style>
    </header>
  );
};
