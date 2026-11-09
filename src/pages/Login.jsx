import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { QrCode, Lock, Mail, Eye, EyeOff, ShieldCheck, UserCheck, GraduationCap, ArrowRight } from 'lucide-react';

export const Login = () => {
  const { loginCustom, loginAsRole } = useAuth();
  const navigate = useNavigate();

  const [role, setRole] = useState('admin');
  const [email, setEmail] = useState('admin@demo.edu');
  const [password, setPassword] = useState('password123');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');

  const handleRoleSelect = (selectedRole) => {
    setRole(selectedRole);
    if (selectedRole === 'admin') setEmail('admin@demo.edu');
    else if (selectedRole === 'teacher') setEmail('teacher@demo.edu');
    else if (selectedRole === 'student') setEmail('student@demo.edu');
    setError('');
  };

  const handleDirectDemoLogin = async (targetRole) => {
    await loginAsRole(targetRole);
    if (targetRole === 'admin') navigate('/admin');
    else if (targetRole === 'teacher') navigate('/teacher');
    else if (targetRole === 'student') navigate('/student');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!email || !password) {
      setError('Please provide your college email and password.');
      return;
    }
    const res = await loginCustom(email, password, role);
    if (res.success) {
      if (role === 'admin') navigate('/admin');
      else if (role === 'teacher') navigate('/teacher');
      else if (role === 'student') navigate('/student');
    } else {
      setError(res.error);
    }
  };

  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: '#f1f5f9',
      padding: '2rem 1rem'
    }}>
      <div style={{
        width: '100%',
        maxWidth: '460px',
        backgroundColor: '#ffffff',
        borderRadius: '16px',
        boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.08), 0 8px 10px -6px rgba(0, 0, 0, 0.04)',
        border: '1px solid #e2e8f0',
        overflow: 'hidden'
      }}>
        {/* Top Header */}
        <div style={{
          padding: '2.25rem 2rem 1.5rem',
          textAlign: 'center',
          borderBottom: '1px solid #f1f5f9'
        }}>
          <div style={{
            width: '56px',
            height: '56px',
            margin: '0 auto 1rem',
            backgroundColor: '#eff6ff',
            color: 'var(--primary)',
            borderRadius: '14px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            border: '1px solid #bfdbfe'
          }}>
            <QrCode size={30} />
          </div>
          <h2 style={{ fontSize: '1.45rem', fontWeight: 800, color: '#0f172a', letterSpacing: '-0.02em' }}>
            EduAttend Portal
          </h2>
          <p style={{ fontSize: '0.86rem', color: '#64748b', marginTop: '0.35rem' }}>
            QR-Based Classroom Attendance & Verification System
          </p>

          <div style={{
            marginTop: '0.75rem',
            display: 'inline-flex',
            alignItems: 'center',
            gap: '0.35rem',
            fontSize: '0.74rem',
            fontWeight: 600,
            padding: '0.25rem 0.75rem',
            borderRadius: '9999px',
            backgroundColor: '#eff6ff',
            color: '#1d4ed8',
            border: '1px solid #bfdbfe'
          }}>
            <ShieldCheck size={13} />
            DEMO MODE — LocalStorage Persistence
          </div>
        </div>

        {/* Quick Demo Selector */}
        <div style={{ padding: '1.25rem 2rem 0.5rem', backgroundColor: '#f8fafc', borderBottom: '1px solid #e2e8f0' }}>
          <div style={{ fontSize: '0.76rem', fontWeight: 600, color: '#64748b', marginBottom: '0.65rem', textTransform: 'uppercase' }}>
            Instant One-Click Demo Access
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '0.5rem' }}>
            <button
              type="button"
              onClick={() => handleDirectDemoLogin('admin')}
              className={`btn btn-sm ${role === 'admin' ? 'btn-primary' : 'btn-outline'}`}
              style={{ fontSize: '0.78rem', display: 'flex', flexDirection: 'column', padding: '0.6rem 0.4rem', gap: '4px' }}
            >
              <ShieldCheck size={16} />
              <span>Admin</span>
            </button>
            <button
              type="button"
              onClick={() => handleDirectDemoLogin('teacher')}
              className={`btn btn-sm ${role === 'teacher' ? 'btn-primary' : 'btn-outline'}`}
              style={{ fontSize: '0.78rem', display: 'flex', flexDirection: 'column', padding: '0.6rem 0.4rem', gap: '4px' }}
            >
              <UserCheck size={16} />
              <span>Teacher</span>
            </button>
            <button
              type="button"
              onClick={() => handleDirectDemoLogin('student')}
              className={`btn btn-sm ${role === 'student' ? 'btn-primary' : 'btn-outline'}`}
              style={{ fontSize: '0.78rem', display: 'flex', flexDirection: 'column', padding: '0.6rem 0.4rem', gap: '4px' }}
            >
              <GraduationCap size={16} />
              <span>Student</span>
            </button>
          </div>
        </div>

        {/* Standard Login Form */}
        <form onSubmit={handleSubmit} style={{ padding: '1.75rem 2rem' }}>
          {error && (
            <div style={{
              padding: '0.65rem 0.85rem',
              borderRadius: '8px',
              backgroundColor: '#fef2f2',
              color: '#b91c1c',
              fontSize: '0.82rem',
              border: '1px solid #fecaca',
              marginBottom: '1rem'
            }}>
              {error}
            </div>
          )}

          <div className="form-group">
            <label className="form-label" htmlFor="email-input">College Email</label>
            <div style={{ position: 'relative' }}>
              <Mail size={16} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: '#94a3b8' }} />
              <input
                id="email-input"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="name@demo.edu"
                className="form-control"
                style={{ paddingLeft: '38px' }}
                required
              />
            </div>
          </div>

          <div className="form-group">
            <label className="form-label" htmlFor="password-input">Password</label>
            <div style={{ position: 'relative' }}>
              <Lock size={16} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: '#94a3b8' }} />
              <input
                id="password-input"
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="form-control"
                style={{ paddingLeft: '38px', paddingRight: '38px' }}
                required
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                style={{
                  position: 'absolute',
                  right: '10px',
                  top: '50%',
                  transform: 'translateY(-50%)',
                  background: 'none',
                  border: 'none',
                  cursor: 'pointer',
                  color: '#94a3b8'
                }}
                aria-label={showPassword ? 'Hide password' : 'Show password'}
              >
                {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
          </div>

          <div className="form-group" style={{ marginBottom: '1.5rem' }}>
            <label className="form-label">Selected Role Context</label>
            <select
              value={role}
              onChange={(e) => handleRoleSelect(e.target.value)}
              className="form-control form-select"
            >
              <option value="admin">College Administrator (Full Privileges)</option>
              <option value="teacher">Faculty / Lecturer (Session Generator)</option>
              <option value="student">Student (Scanner & Attendance Log)</option>
            </select>
          </div>

          <button
            type="submit"
            className="btn btn-primary"
            style={{ width: '100%', padding: '0.75rem', fontSize: '0.95rem', fontWeight: 600 }}
          >
            <span>Sign In to Dashboard</span>
            <ArrowRight size={16} />
          </button>
        </form>

        <div style={{
          padding: '1rem 2rem',
          backgroundColor: '#f8fafc',
          borderTop: '1px solid #e2e8f0',
          textAlign: 'center',
          fontSize: '0.76rem',
          color: '#64748b'
        }}>
          Simulated frontend demo environment. No password authentication required.
        </div>
      </div>
    </div>
  );
};
