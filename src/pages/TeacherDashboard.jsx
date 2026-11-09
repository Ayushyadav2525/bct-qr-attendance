import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useAttendance } from '../context/AttendanceContext';
import { Card } from '../components/Card';
import { Badge } from '../components/Badge';
import { exportAttendanceToCSV } from '../services/exportCsv';
import {
  QrCode,
  BookOpen,
  Users,
  CheckCircle2,
  Clock,
  Download,
  PlusCircle,
  Calendar,
  ExternalLink,
  ChevronRight
} from 'lucide-react';

export const TeacherDashboard = () => {
  const { currentUser } = useAuth();
  const { classes, subjects, sessions, records, closeSession } = useAttendance();
  const navigate = useNavigate();

  // Filter subjects taught by this teacher (or all for demo)
  const teacherSubjects = subjects.filter(
    (s) => !currentUser?.id || s.teacherId === currentUser.id || currentUser.role === 'admin'
  );

  // Active sessions created by this teacher or in general
  const activeSessions = sessions.filter((s) => (s.status || '').toUpperCase() === 'OPEN' || s.status === 'Active');

  // Filter attendance records for this teacher's subjects
  const teacherRecords = records.filter((r) =>
    teacherSubjects.some((s) => s.id === r.subjectId)
  );

  const todayStr = new Date().toISOString().split('T')[0];
  const todayRecords = teacherRecords.filter((r) => r.date === todayStr);

  const handleExportCSV = () => {
    exportAttendanceToCSV(teacherRecords, `Teacher_Attendance_Report_${todayStr}.csv`);
  };

  return (
    <div>
      {/* Top Banner */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.75rem', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <h1 style={{ fontSize: '1.65rem', fontWeight: 800, color: 'var(--text-main)', letterSpacing: '-0.02em' }}>
            Faculty Lecture Dashboard
          </h1>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.88rem', marginTop: '0.2rem' }}>
            Welcome back, {currentUser?.name || 'Professor'}. Manage classroom QR check-ins and review student attendance.
          </p>
        </div>
        <div style={{ display: 'flex', gap: '0.75rem' }}>
          <button onClick={handleExportCSV} className="btn btn-outline btn-sm">
            <Download size={16} />
            <span>Export CSV</span>
          </button>
          <Link to="/qr-generator" className="btn btn-primary btn-sm">
            <QrCode size={16} />
            <span>Launch QR Attendance</span>
          </Link>
        </div>
      </div>

      {/* Metric Cards */}
      <div className="stat-grid">
        <div className="stat-card">
          <div>
            <div className="stat-label">Assigned Classes</div>
            <div className="stat-value">{teacherSubjects.length || 2}</div>
            <div className="stat-trend" style={{ color: 'var(--primary)' }}>
              CS-4A & IT-6A Batches
            </div>
          </div>
          <div className="stat-icon" style={{ backgroundColor: '#eff6ff', color: 'var(--primary)' }}>
            <BookOpen size={24} />
          </div>
        </div>

        <div className="stat-card">
          <div>
            <div className="stat-label">Total Student Reach</div>
            <div className="stat-value">84</div>
            <div className="stat-trend" style={{ color: 'var(--success)' }}>
              <Users size={14} /> Enrolled across courses
            </div>
          </div>
          <div className="stat-icon" style={{ backgroundColor: '#f0fdf4', color: 'var(--success)' }}>
            <Users size={24} />
          </div>
        </div>

        <div className="stat-card">
          <div>
            <div className="stat-label">Today's Check-ins</div>
            <div className="stat-value">{todayRecords.length}</div>
            <div className="stat-trend" style={{ color: 'var(--info)' }}>
              <CheckCircle2 size={14} /> Recorded via QR scan
            </div>
          </div>
          <div className="stat-icon" style={{ backgroundColor: '#f0f9ff', color: 'var(--info)' }}>
            <CheckCircle2 size={24} />
          </div>
        </div>

        <div className="stat-card">
          <div>
            <div className="stat-label">Active QR Sessions</div>
            <div className="stat-value" style={{ color: activeSessions.length > 0 ? 'var(--success)' : 'var(--text-muted)' }}>
              {activeSessions.length}
            </div>
            <div className="stat-trend" style={{ color: activeSessions.length > 0 ? 'var(--success)' : 'var(--text-muted)' }}>
              {activeSessions.length > 0 ? 'Live check-in open' : 'No active session'}
            </div>
          </div>
          <div className="stat-icon" style={{ backgroundColor: activeSessions.length > 0 ? '#ecfdf5' : '#f1f5f9', color: activeSessions.length > 0 ? 'var(--success)' : '#94a3b8' }}>
            <QrCode size={24} />
          </div>
        </div>
      </div>

      {/* Active Session Callout if any */}
      {activeSessions.length > 0 && (
        <div style={{
          backgroundColor: '#eff6ff',
          border: '1px solid #bfdbfe',
          borderRadius: 'var(--radius-lg)',
          padding: '1.25rem 1.5rem',
          marginBottom: '1.75rem',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: '1rem'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
            <div style={{
              width: '44px',
              height: '44px',
              borderRadius: '10px',
              backgroundColor: '#2563eb',
              color: '#fff',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}>
              <QrCode size={24} />
            </div>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <h4 style={{ margin: 0, fontSize: '1rem', color: '#1e3a8a' }}>
                  Live Session Active: {activeSessions[0].subjectName}
                </h4>
                <Badge variant="success">Broadcasting QR</Badge>
              </div>
              <p style={{ margin: '0.2rem 0 0', fontSize: '0.82rem', color: '#1d4ed8' }}>
                Class: {activeSessions[0].className} • Token: <strong>{activeSessions[0].token}</strong> • {activeSessions[0].attendeeCount || 0} students scanned
              </p>
            </div>
          </div>
          <div style={{ display: 'flex', gap: '0.5rem' }}>
            <Link to="/qr-generator" className="btn btn-primary btn-sm">
              <span>View QR Display</span>
              <ExternalLink size={14} />
            </Link>
            <button
              onClick={() => closeSession(activeSessions[0].id)}
              className="btn btn-outline btn-sm"
              style={{ color: 'var(--danger)', borderColor: 'var(--danger-border)' }}
            >
              Expire Now
            </button>
          </div>
        </div>
      )}

      {/* Grid: Assigned Classes & Live Records Feed */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(420px, 1fr))', gap: '1.5rem' }}>
        {/* Assigned Courses */}
        <Card
          title="Assigned Courses & Lecture Schedule"
          subtitle="Classes registered under your faculty portfolio"
          icon={BookOpen}
          action={
            <Link to="/qr-generator" className="btn btn-outline btn-sm">
              <PlusCircle size={14} />
              <span>Launch Session</span>
            </Link>
          }
        >
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
            {teacherSubjects.map((sub) => (
              <div
                key={sub.id}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: '1rem',
                  border: '1px solid var(--border-color)',
                  borderRadius: 'var(--radius-md)',
                  backgroundColor: '#fff',
                  transition: 'var(--transition)'
                }}
              >
                <div>
                  <div style={{ fontWeight: 600, fontSize: '0.92rem', color: 'var(--text-main)' }}>
                    {sub.name}
                  </div>
                  <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginTop: '0.2rem' }}>
                    Code: <strong>{sub.code}</strong> • Batch: CS-4th Sem (Sec A)
                  </div>
                </div>
                <Link
                  to="/qr-generator"
                  className="btn btn-outline btn-sm"
                  style={{ fontSize: '0.78rem' }}
                >
                  <span>QR Code</span>
                  <ChevronRight size={14} />
                </Link>
              </div>
            ))}
          </div>
        </Card>

        {/* Live Attendance Records Feed */}
        <Card
          title="Live Attendance Feed"
          subtitle="Recent student check-ins for your subjects"
          icon={Clock}
          action={
            <Link to="/records" className="btn btn-outline btn-sm">
              <span>View All</span>
              <ChevronRight size={14} />
            </Link>
          }
        >
          <div className="table-responsive" style={{ border: 'none' }}>
            <table className="data-table">
              <thead>
                <tr>
                  <th>Student</th>
                  <th>Subject</th>
                  <th>Time</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {teacherRecords.length === 0 ? (
                  <tr>
                    <td colSpan={4} style={{ textAlign: 'center', color: 'var(--text-muted)' }}>
                      No attendance scans recorded yet. Launch a QR session to get started.
                    </td>
                  </tr>
                ) : (
                  teacherRecords.slice(0, 6).map((rec) => (
                    <tr key={rec.id}>
                      <td>
                        <div style={{ fontWeight: 600 }}>{rec.studentName}</div>
                        <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>{rec.rollNo}</div>
                      </td>
                      <td style={{ fontSize: '0.82rem' }}>{rec.subjectName}</td>
                      <td style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>{rec.time}</td>
                      <td>
                        <Badge variant={rec.status === 'Present' ? 'success' : rec.status === 'Late' ? 'warning' : 'danger'}>
                          {rec.status}
                        </Badge>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </Card>
      </div>
    </div>
  );
};
