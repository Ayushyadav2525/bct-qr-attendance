import React from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useAttendance } from '../context/AttendanceContext';
import { Card } from '../components/Card';
import { Badge } from '../components/Badge';
import {
  ScanLine,
  User,
  BookOpen,
  CheckCircle,
  XCircle,
  AlertTriangle,
  Clock,
  ShieldCheck,
  TrendingUp,
  ArrowRight
} from 'lucide-react';

export const StudentDashboard = () => {
  const { currentUser } = useAuth();
  const { records, subjects } = useAttendance();

  // Find records matching current student (or default STU-001)
  const studentId = currentUser?.id || 'STU-001';
  const studentRecords = records.filter((r) => r.studentId === studentId);

  const attendedCount = studentRecords.filter((r) => r.status === 'Present' || r.status === 'Late').length;
  const missedCount = studentRecords.filter((r) => r.status === 'Absent').length;
  const totalClasses = attendedCount + missedCount;
  const attendanceRate = totalClasses > 0 ? Math.round((attendedCount / totalClasses) * 100) : 88;

  const isBelowThreshold = attendanceRate < 75;

  // Subject-wise attendance breakdown
  const subjectBreakdown = [
    { name: 'Blockchain Technology', code: 'CS401', attended: 14, total: 15, pct: 93 },
    { name: 'Database Management Systems', code: 'CS402', attended: 12, total: 14, pct: 85 },
    { name: 'Computer Networks', code: 'CS403', attended: 11, total: 13, pct: 84 },
    { name: 'Operating Systems', code: 'CS404', attended: 13, total: 14, pct: 92 },
  ];

  return (
    <div>
      {/* Top Banner */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.75rem', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <h1 style={{ fontSize: '1.65rem', fontWeight: 800, color: 'var(--text-main)', letterSpacing: '-0.02em' }}>
            Student Attendance Portal
          </h1>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.88rem', marginTop: '0.2rem' }}>
            Track your semester attendance, view subject breakdown, and scan classroom QR codes.
          </p>
        </div>
        <div>
          <Link to="/qr-scanner" className="btn btn-primary" style={{ padding: '0.65rem 1.25rem' }}>
            <ScanLine size={18} />
            <span>Scan Classroom QR</span>
          </Link>
        </div>
      </div>

      {/* Threshold Warning Banner if low */}
      {isBelowThreshold && (
        <div className="notice-banner notice-warning">
          <AlertTriangle size={20} style={{ color: '#d97706', flexShrink: 0 }} />
          <div>
            <strong>Attendance Warning:</strong> Your overall attendance is currently {attendanceRate}%, which is below the required 75% college threshold. Please attend upcoming lectures to avoid detention.
          </div>
        </div>
      )}

      {/* Profile & Overview Stats */}
      <div className="stat-grid">
        {/* Student Profile Card */}
        <div className="stat-card" style={{ gridColumn: 'span 1' }}>
          <div>
            <div className="stat-label">Student Profile</div>
            <div style={{ fontSize: '1.15rem', fontWeight: 700, color: 'var(--text-main)', marginTop: '0.2rem' }}>
              {currentUser?.name || 'Alex Johnson'}
            </div>
            <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginTop: '0.2rem' }}>
              Roll: <strong>{currentUser?.rollNo || 'CS2024-001'}</strong> • 4th Sem
            </div>
          </div>
          <div className="stat-icon" style={{ backgroundColor: '#eff6ff', color: 'var(--primary)' }}>
            <User size={24} />
          </div>
        </div>

        {/* Overall Percentage */}
        <div className="stat-card">
          <div>
            <div className="stat-label">Semester Attendance</div>
            <div className="stat-value" style={{ color: isBelowThreshold ? 'var(--danger)' : 'var(--primary)' }}>
              {attendanceRate}%
            </div>
            <div className="stat-trend" style={{ color: isBelowThreshold ? 'var(--danger)' : 'var(--success)' }}>
              {isBelowThreshold ? <AlertTriangle size={14} /> : <TrendingUp size={14} />}
              {isBelowThreshold ? 'Below 75% required' : 'Eligible for finals'}
            </div>
          </div>
          <div className="stat-icon" style={{ backgroundColor: isBelowThreshold ? 'var(--danger-bg)' : '#f0fdf4', color: isBelowThreshold ? 'var(--danger)' : 'var(--success)' }}>
            {isBelowThreshold ? <AlertTriangle size={24} /> : <CheckCircle size={24} />}
          </div>
        </div>

        {/* Classes Attended */}
        <div className="stat-card">
          <div>
            <div className="stat-label">Lectures Attended</div>
            <div className="stat-value" style={{ color: 'var(--success)' }}>
              {attendedCount || 50}
            </div>
            <div className="stat-trend" style={{ color: 'var(--text-muted)' }}>
              Verified via QR check-ins
            </div>
          </div>
          <div className="stat-icon" style={{ backgroundColor: '#ecfdf5', color: 'var(--success)' }}>
            <CheckCircle size={24} />
          </div>
        </div>

        {/* Classes Missed */}
        <div className="stat-card">
          <div>
            <div className="stat-label">Lectures Missed</div>
            <div className="stat-value" style={{ color: 'var(--danger)' }}>
              {missedCount || 6}
            </div>
            <div className="stat-trend" style={{ color: 'var(--text-muted)' }}>
              Recorded absences
            </div>
          </div>
          <div className="stat-icon" style={{ backgroundColor: '#fef2f2', color: 'var(--danger)' }}>
            <XCircle size={24} />
          </div>
        </div>
      </div>

      {/* Subject-Wise Breakdown & Recent Attendance */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(420px, 1fr))', gap: '1.5rem', marginBottom: '1.75rem' }}>
        {/* Subject-wise breakdown */}
        <Card
          title="Subject-wise Attendance Breakdown"
          subtitle="Attendance percentage per registered subject"
          icon={BookOpen}
        >
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.1rem', marginTop: '0.5rem' }}>
            {subjectBreakdown.map((sub, i) => (
              <div key={i}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.35rem' }}>
                  <span style={{ fontSize: '0.88rem', fontWeight: 600 }}>
                    {sub.name} <span style={{ color: 'var(--text-muted)', fontWeight: 400 }}>({sub.code})</span>
                  </span>
                  <span style={{ fontSize: '0.86rem', fontWeight: 700, color: sub.pct < 75 ? 'var(--danger)' : 'var(--primary)' }}>
                    {sub.pct}% ({sub.attended}/{sub.total})
                  </span>
                </div>
                <div style={{
                  width: '100%',
                  height: '8px',
                  backgroundColor: '#e2e8f0',
                  borderRadius: '9999px',
                  overflow: 'hidden'
                }}>
                  <div style={{
                    width: `${sub.pct}%`,
                    height: '100%',
                    backgroundColor: sub.pct < 75 ? 'var(--danger)' : '#2563eb',
                    borderRadius: '9999px',
                    transition: 'width 0.4s ease'
                  }} />
                </div>
              </div>
            ))}
          </div>
        </Card>

        {/* Recent Attendance Scans */}
        <Card
          title="Recent Attendance Log"
          subtitle="Your latest verified check-ins"
          icon={Clock}
          action={
            <Link to="/records" className="btn btn-outline btn-sm">
              <span>Full History</span>
              <ArrowRight size={14} />
            </Link>
          }
        >
          <div className="table-responsive" style={{ border: 'none' }}>
            <table className="data-table">
              <thead>
                <tr>
                  <th>Subject</th>
                  <th>Date & Time</th>
                  <th>Status</th>
                  <th>Ledger</th>
                </tr>
              </thead>
              <tbody>
                {studentRecords.length === 0 ? (
                  <tr>
                    <td colSpan={4} style={{ textAlign: 'center', color: 'var(--text-muted)' }}>
                      No attendance logged yet. Use the QR scanner to check into a class!
                    </td>
                  </tr>
                ) : (
                  studentRecords.slice(0, 5).map((rec) => (
                    <tr key={rec.id}>
                      <td>
                        <div style={{ fontWeight: 600 }}>{rec.subjectName}</div>
                        <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>{rec.method}</div>
                      </td>
                      <td style={{ fontSize: '0.82rem' }}>
                        <div>{rec.date}</div>
                        <div style={{ fontSize: '0.74rem', color: 'var(--text-muted)' }}>{rec.time}</div>
                      </td>
                      <td>
                        <Badge variant={rec.status === 'Present' ? 'success' : rec.status === 'Late' ? 'warning' : 'danger'}>
                          {rec.status}
                        </Badge>
                      </td>
                      <td>
                        <Link to="/blockchain-demo" title="Verify hash on mock ledger">
                          <Badge variant="neutral">
                            <ShieldCheck size={11} />
                            Verified
                          </Badge>
                        </Link>
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
