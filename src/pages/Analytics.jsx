import React from 'react';
import { useAttendance } from '../context/AttendanceContext';
import { Card } from '../components/Card';
import { Badge } from '../components/Badge';
import {
  BarChart3,
  TrendingUp,
  PieChart as PieIcon,
  AlertTriangle,
  CheckCircle,
  Users,
  Award
} from 'lucide-react';
import {
  ResponsiveContainer,
  LineChart,
  Line,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  CartesianGrid
} from 'recharts';

export const Analytics = () => {
  const { metrics, records, students, subjects, classes } = useAttendance();

  // Weekly Trend
  const weeklyTrends = [
    { day: 'Mon', CS4A: 92, CS4B: 88, IT6A: 85, overall: 89 },
    { day: 'Tue', CS4A: 95, CS4B: 84, IT6A: 90, overall: 90 },
    { day: 'Wed', CS4A: 88, CS4B: 79, IT6A: 88, overall: 85 },
    { day: 'Thu', CS4A: 96, CS4B: 92, IT6A: 94, overall: 94 },
    { day: 'Fri', CS4A: 90, CS4B: 86, IT6A: 89, overall: 88 },
  ];

  // Subject-wise attendance comparison
  const subjectComparison = [
    { name: 'Blockchain (CS401)', present: 94, absent: 6 },
    { name: 'DBMS (CS402)', present: 88, absent: 12 },
    { name: 'Networks (CS403)', present: 84, absent: 16 },
    { name: 'OS (CS404)', present: 91, absent: 9 },
    { name: 'ML (IT601)', present: 89, absent: 11 },
  ];

  // Status Distribution (Present vs Late vs Absent)
  const presentCount = records.filter((r) => r.status === 'Present').length || 4;
  const lateCount = records.filter((r) => r.status === 'Late').length || 1;
  const absentCount = records.filter((r) => r.status === 'Absent').length || 1;

  const distributionData = [
    { name: 'Present On-Time', value: presentCount, color: '#10b981' },
    { name: 'Late Check-in', value: lateCount, color: '#f59e0b' },
    { name: 'Absent / Missed', value: absentCount, color: '#ef4444' },
  ];

  // Students below 75%
  const atRiskStudents = students.filter((s) => (s.attendancePct || 85) < 75);

  return (
    <div>
      <div style={{ marginBottom: '1.75rem' }}>
        <h1 style={{ fontSize: '1.65rem', fontWeight: 800, color: 'var(--text-main)', letterSpacing: '-0.02em' }}>
          Attendance Intelligence & Analytics
        </h1>
        <p style={{ color: 'var(--text-muted)', fontSize: '0.88rem', marginTop: '0.2rem' }}>
          Statistical insights into student participation rates, course performance comparisons, and compliance trends.
        </p>
      </div>

      {/* Metric Cards */}
      <div className="stat-grid">
        <div className="stat-card">
          <div>
            <div className="stat-label">Campus Attendance Index</div>
            <div className="stat-value" style={{ color: 'var(--primary)' }}>
              {metrics.overallPercentage}%
            </div>
            <div className="stat-trend" style={{ color: 'var(--success)' }}>
              <TrendingUp size={14} /> +3.2% vs last semester
            </div>
          </div>
          <div className="stat-icon" style={{ backgroundColor: '#eff6ff', color: 'var(--primary)' }}>
            <Award size={24} />
          </div>
        </div>

        <div className="stat-card">
          <div>
            <div className="stat-label">Total Verified Scans</div>
            <div className="stat-value">{metrics.totalRecords}</div>
            <div className="stat-trend" style={{ color: 'var(--info)' }}>
              Recorded in local ledger
            </div>
          </div>
          <div className="stat-icon" style={{ backgroundColor: '#f0fdf4', color: 'var(--success)' }}>
            <CheckCircle size={24} />
          </div>
        </div>

        <div className="stat-card">
          <div>
            <div className="stat-label">Students at Risk (&lt;75%)</div>
            <div className="stat-value" style={{ color: 'var(--danger)' }}>
              {atRiskStudents.length}
            </div>
            <div className="stat-trend" style={{ color: 'var(--danger)' }}>
              Action required
            </div>
          </div>
          <div className="stat-icon" style={{ backgroundColor: '#fef2f2', color: 'var(--danger)' }}>
            <AlertTriangle size={24} />
          </div>
        </div>

        <div className="stat-card">
          <div>
            <div className="stat-label">Active Monitored Batches</div>
            <div className="stat-value">{metrics.totalClasses}</div>
            <div className="stat-trend" style={{ color: 'var(--text-muted)' }}>
              {metrics.totalSubjects} active courses
            </div>
          </div>
          <div className="stat-icon" style={{ backgroundColor: '#f8fafc', color: '#475569' }}>
            <Users size={24} />
          </div>
        </div>
      </div>

      {/* Row 1: Weekly Multi-Class Trends */}
      <div style={{ marginBottom: '1.75rem' }}>
        <Card
          title="Daily Attendance Trends by Department"
          subtitle="Comparative weekday attendance performance across major classes"
          icon={TrendingUp}
        >
          <div style={{ width: '100%', height: '280px', marginTop: '1rem' }}>
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={weeklyTrends}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                <XAxis dataKey="day" stroke="#94a3b8" fontSize={12} tickLine={false} />
                <YAxis stroke="#94a3b8" fontSize={12} domain={[70, 100]} tickLine={false} />
                <Tooltip
                  contentStyle={{ backgroundColor: '#fff', borderRadius: '8px', border: '1px solid #e2e8f0' }}
                />
                <Legend />
                <Line type="monotone" dataKey="CS4A" stroke="#2563eb" strokeWidth={3} name="CS - Sec A" />
                <Line type="monotone" dataKey="CS4B" stroke="#0ea5e9" strokeWidth={2} name="CS - Sec B" />
                <Line type="monotone" dataKey="IT6A" stroke="#8b5cf6" strokeWidth={2} name="IT - 6th Sem" />
                <Line type="monotone" dataKey="overall" stroke="#10b981" strokeWidth={2} strokeDasharray="5 5" name="Campus Avg" />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </Card>
      </div>

      {/* Row 2: Subject-wise Comparison & Status Donut */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(400px, 1fr))', gap: '1.5rem', marginBottom: '1.75rem' }}>
        {/* Subject Comparison */}
        <Card
          title="Course Attendance Comparison"
          subtitle="Attendance percentage per academic course"
          icon={BarChart3}
        >
          <div style={{ width: '100%', height: '260px', marginTop: '1rem' }}>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={subjectComparison} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#e2e8f0" />
                <XAxis type="number" domain={[0, 100]} stroke="#94a3b8" fontSize={12} tickLine={false} />
                <YAxis dataKey="name" type="category" stroke="#94a3b8" fontSize={11} width={130} tickLine={false} />
                <Tooltip
                  contentStyle={{ backgroundColor: '#fff', borderRadius: '8px', border: '1px solid #e2e8f0' }}
                />
                <Bar dataKey="present" fill="#3b82f6" radius={[0, 6, 6, 0]} name="Present %" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Card>

        {/* Present vs Late vs Absent Distribution */}
        <Card
          title="Attendance Distribution Breakdown"
          subtitle="Proportion of verified on-time, late, and absent records"
          icon={PieIcon}
        >
          <div style={{ width: '100%', height: '260px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={distributionData}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={90}
                  paddingAngle={5}
                  dataKey="value"
                >
                  {distributionData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{ backgroundColor: '#fff', borderRadius: '8px', border: '1px solid #e2e8f0' }}
                />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </Card>
      </div>

      {/* Row 3: At Risk Students Table */}
      <Card
        title="Students Below 75% Attendance Threshold"
        subtitle="Identified for academic advisory and notification"
        icon={AlertTriangle}
      >
        <div className="table-responsive" style={{ border: 'none' }}>
          <table className="data-table">
            <thead>
              <tr>
                <th>Student ID</th>
                <th>Name</th>
                <th>Class</th>
                <th>Current Attendance</th>
                <th>Shortage Impact</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              {atRiskStudents.length === 0 ? (
                <tr>
                  <td colSpan={6} style={{ textAlign: 'center', color: 'var(--text-muted)' }}>
                    All students are currently in good academic standing (&gt;75%).
                  </td>
                </tr>
              ) : (
                atRiskStudents.map((st) => (
                  <tr key={st.id}>
                    <td>
                      <span style={{ fontFamily: 'monospace', fontWeight: 600 }}>{st.rollNo}</span>
                    </td>
                    <td style={{ fontWeight: 600 }}>{st.name}</td>
                    <td>{st.className}</td>
                    <td>
                      <span style={{ color: 'var(--danger)', fontWeight: 700 }}>{st.attendancePct}%</span>
                    </td>
                    <td>
                      <Badge variant="danger">Detention Risk</Badge>
                    </td>
                    <td>
                      <button
                        onClick={() => alert(`Warning letter generated for ${st.name} (${st.rollNo}).`)}
                        className="btn btn-outline btn-sm"
                        style={{ fontSize: '0.76rem' }}
                      >
                        Issue Warning Notice
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
};
