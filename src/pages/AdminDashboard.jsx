import React from 'react';
import { Link } from 'react-router-dom';
import { useAttendance } from '../context/AttendanceContext';
import { Card } from '../components/Card';
import { Badge } from '../components/Badge';
import {
  Users,
  UserCheck,
  BookOpen,
  CheckCircle,
  TrendingUp,
  Clock,
  ArrowRight,
  QrCode,
  ScanLine,
  ShieldCheck,
  AlertTriangle
} from 'lucide-react';
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  BarChart,
  Bar
} from 'recharts';

export const AdminDashboard = () => {
  const { metrics, sessions, records, students } = useAttendance();

  // Prepare trend data for charts
  const trendData = [
    { day: 'Mon', attendance: 88, rate: 92 },
    { day: 'Tue', attendance: 91, rate: 89 },
    { day: 'Wed', attendance: 84, rate: 86 },
    { day: 'Thu', attendance: 95, rate: 94 },
    { day: 'Fri', attendance: 89, rate: 88 },
    { day: 'Sat', attendance: 78, rate: 82 },
  ];

  const classData = [
    { name: 'CS-4A', rate: 91 },
    { name: 'CS-4B', rate: 84 },
    { name: 'IT-6A', rate: 89 },
    { name: 'AI-4A', rate: 95 },
  ];

  // At risk students (attendance < 75%)
  const atRiskStudents = students.filter((s) => (s.attendancePct || 80) < 75);

  return (
    <div>
      {/* Page Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.75rem', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <h1 style={{ fontSize: '1.65rem', fontWeight: 800, color: 'var(--text-main)', letterSpacing: '-0.02em' }}>
            College Administration Dashboard
          </h1>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.88rem', marginTop: '0.2rem' }}>
            Real-time overview of campus-wide classroom attendance, QR sessions, and faculty metrics.
          </p>
        </div>
        <div style={{ display: 'flex', gap: '0.75rem' }}>
          <Link to="/qr-generator" className="btn btn-primary btn-sm">
            <QrCode size={16} />
            <span>New QR Session</span>
          </Link>
          <Link to="/qr-scanner" className="btn btn-outline btn-sm">
            <ScanLine size={16} />
            <span>Test Scanner</span>
          </Link>
        </div>
      </div>

      {/* Metric Cards */}
      <div className="stat-grid">
        <div className="stat-card">
          <div>
            <div className="stat-label">Total Enrolled Students</div>
            <div className="stat-value">{metrics.totalStudents}</div>
            <div className="stat-trend" style={{ color: 'var(--success)' }}>
              <TrendingUp size={14} /> +4 enrolled this semester
            </div>
          </div>
          <div className="stat-icon" style={{ backgroundColor: '#eff6ff', color: 'var(--primary)' }}>
            <Users size={24} />
          </div>
        </div>

        <div className="stat-card">
          <div>
            <div className="stat-label">Active Faculty Members</div>
            <div className="stat-value">{metrics.totalTeachers}</div>
            <div className="stat-trend" style={{ color: 'var(--info)' }}>
              <CheckCircle size={14} /> 100% active sessions
            </div>
          </div>
          <div className="stat-icon" style={{ backgroundColor: '#f0fdf4', color: 'var(--success)' }}>
            <UserCheck size={24} />
          </div>
        </div>

        <div className="stat-card">
          <div>
            <div className="stat-label">Active Classes & Batches</div>
            <div className="stat-value">{metrics.totalClasses}</div>
            <div className="stat-trend" style={{ color: 'var(--text-muted)' }}>
              <span>{metrics.totalSubjects} assigned subjects</span>
            </div>
          </div>
          <div className="stat-icon" style={{ backgroundColor: '#fef3c7', color: '#d97706' }}>
            <BookOpen size={24} />
          </div>
        </div>

        <div className="stat-card">
          <div>
            <div className="stat-label">Overall Attendance Rate</div>
            <div className="stat-value" style={{ color: 'var(--primary)' }}>
              {metrics.overallPercentage}%
            </div>
            <div className="stat-trend" style={{ color: 'var(--success)' }}>
              <TrendingUp size={14} /> Meets academic standards
            </div>
          </div>
          <div className="stat-icon" style={{ backgroundColor: '#ede9fe', color: '#7c3aed' }}>
            <TrendingUp size={24} />
          </div>
        </div>
      </div>

      {/* Charts Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(400px, 1fr))', gap: '1.5rem', marginBottom: '1.75rem' }}>
        <Card
          title="Weekly Attendance Trend"
          subtitle="Real-time campus-wide attendance percentage by day"
          icon={TrendingUp}
        >
          <div style={{ width: '100%', height: '240px', marginTop: '1rem' }}>
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={trendData}>
                <defs>
                  <linearGradient id="colorAttendance" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#2563eb" stopOpacity={0.4}/>
                    <stop offset="95%" stopColor="#2563eb" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                <XAxis dataKey="day" stroke="#94a3b8" fontSize={12} tickLine={false} />
                <YAxis stroke="#94a3b8" fontSize={12} domain={[60, 100]} tickLine={false} />
                <Tooltip
                  contentStyle={{ backgroundColor: '#fff', borderRadius: '8px', border: '1px solid #e2e8f0', boxShadow: '0 4px 6px rgba(0,0,0,0.05)' }}
                />
                <Area type="monotone" dataKey="attendance" stroke="#2563eb" strokeWidth={3} fillOpacity={1} fill="url(#colorAttendance)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </Card>

        <Card
          title="Classroom Performance Comparison"
          subtitle="Average attendance rates across major departments"
          icon={BookOpen}
        >
          <div style={{ width: '100%', height: '240px', marginTop: '1rem' }}>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={classData}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                <XAxis dataKey="name" stroke="#94a3b8" fontSize={12} tickLine={false} />
                <YAxis stroke="#94a3b8" fontSize={12} domain={[0, 100]} tickLine={false} />
                <Tooltip
                  contentStyle={{ backgroundColor: '#fff', borderRadius: '8px', border: '1px solid #e2e8f0' }}
                />
                <Bar dataKey="rate" fill="#3b82f6" radius={[6, 6, 0, 0]} barSize={36} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Card>
      </div>

      {/* Two Column Layout: Recent Sessions & At-Risk Students */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(420px, 1fr))', gap: '1.5rem' }}>
        {/* Recent Attendance Sessions */}
        <Card
          title="Recent QR Attendance Sessions"
          subtitle="Live and recently closed classroom check-in windows"
          icon={Clock}
          action={
            <Link to="/records" className="btn btn-outline btn-sm">
              <span>All Logs</span>
              <ArrowRight size={14} />
            </Link>
          }
        >
          <div className="table-responsive" style={{ border: 'none' }}>
            <table className="data-table">
              <thead>
                <tr>
                  <th>Subject</th>
                  <th>Class</th>
                  <th>Faculty</th>
                  <th>Status</th>
                  <th>Attendees</th>
                </tr>
              </thead>
              <tbody>
                {sessions.slice(0, 5).map((ses) => (
                  <tr key={ses.id}>
                    <td>
                      <div style={{ fontWeight: 600 }}>{ses.subjectName}</div>
                      <div style={{ fontSize: '0.74rem', color: 'var(--text-muted)' }}>{ses.token}</div>
                    </td>
                    <td>{ses.className}</td>
                    <td>{ses.teacherName}</td>
                    <td>
                      <Badge variant={ses.status === 'Active' ? 'success' : 'neutral'}>
                        {ses.status}
                      </Badge>
                    </td>
                    <td style={{ fontWeight: 600 }}>{ses.attendeeCount || 0}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>

        {/* At-Risk Students Alerts (<75% attendance) */}
        <Card
          title="Attendance Threshold Alert"
          subtitle="Students below standard 75% semester requirement"
          icon={AlertTriangle}
          action={
            <Link to="/students" className="btn btn-outline btn-sm">
              <span>Manage</span>
            </Link>
          }
        >
          {atRiskStudents.length === 0 ? (
            <div className="empty-state" style={{ padding: '2rem 1rem' }}>
              <CheckCircle size={36} style={{ color: 'var(--success)', margin: '0 auto 0.5rem' }} />
              <p>All students currently meet the 75% attendance threshold.</p>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
              {atRiskStudents.map((st) => (
                <div
                  key={st.id}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '0.75rem 1rem',
                    borderRadius: 'var(--radius-md)',
                    border: '1px solid var(--danger-border)',
                    backgroundColor: 'var(--danger-bg)'
                  }}
                >
                  <div>
                    <div style={{ fontWeight: 600, fontSize: '0.88rem', color: '#991b1b' }}>
                      {st.name} ({st.rollNo})
                    </div>
                    <div style={{ fontSize: '0.76rem', color: '#b91c1c' }}>
                      {st.className} • {st.department}
                    </div>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <Badge variant="danger">{st.attendancePct}% Attendance</Badge>
                    <div style={{ fontSize: '0.72rem', color: '#dc2626', marginTop: '0.2rem' }}>
                      Notice Issued
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </Card>
      </div>
    </div>
  );
};
