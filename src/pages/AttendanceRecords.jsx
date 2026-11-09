import React, { useState } from 'react';
import { useAttendance } from '../context/AttendanceContext';
import { exportAttendanceToCSV } from '../services/exportCsv';
import { Card } from '../components/Card';
import { Modal } from '../components/Modal';
import { Badge } from '../components/Badge';
import {
  ClipboardCheck,
  Search,
  Filter,
  Download,
  Eye,
  ShieldCheck,
  Calendar,
  CheckCircle2,
  XCircle,
  Clock
} from 'lucide-react';

export const AttendanceRecords = () => {
  const { records, classes, subjects } = useAttendance();

  const [search, setSearch] = useState('');
  const [filterClass, setFilterClass] = useState('all');
  const [filterSubject, setFilterSubject] = useState('all');
  const [filterStatus, setFilterStatus] = useState('all');
  const [selectedRecord, setSelectedRecord] = useState(null);

  // Filter records
  const filteredRecords = records.filter((r) => {
    const matchesSearch =
      r.studentName.toLowerCase().includes(search.toLowerCase()) ||
      r.rollNo.toLowerCase().includes(search.toLowerCase()) ||
      r.subjectName.toLowerCase().includes(search.toLowerCase());

    const matchesClass = filterClass === 'all' || r.classId === filterClass;
    const matchesSubject = filterSubject === 'all' || r.subjectId === filterSubject;
    const matchesStatus = filterStatus === 'all' || r.status === filterStatus;

    return matchesSearch && matchesClass && matchesSubject && matchesStatus;
  });

  const handleExport = () => {
    exportAttendanceToCSV(filteredRecords, `Attendance_Report_${new Date().toISOString().split('T')[0]}.csv`);
  };

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.75rem', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <h1 style={{ fontSize: '1.65rem', fontWeight: 800, color: 'var(--text-main)', letterSpacing: '-0.02em' }}>
            Campus Attendance Logs & Audit
          </h1>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.88rem', marginTop: '0.2rem' }}>
            Comprehensive ledger of all verified student check-ins, recorded QR scans, and attendance history.
          </p>
        </div>
        <button onClick={handleExport} className="btn btn-outline btn-sm">
          <Download size={16} />
          <span>Export Filtered to CSV</span>
        </button>
      </div>

      {/* Filter Toolbar */}
      <div className="toolbar">
        <div className="search-input-wrapper">
          <Search size={16} className="search-icon" />
          <input
            type="text"
            placeholder="Search by student name, roll number, or subject..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="form-control search-input"
          />
        </div>

        <div className="toolbar-group">
          {/* Class Filter */}
          <select
            value={filterClass}
            onChange={(e) => setFilterClass(e.target.value)}
            className="form-control form-select"
            style={{ width: 'auto' }}
          >
            <option value="all">All Classes</option>
            {classes.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>

          {/* Subject Filter */}
          <select
            value={filterSubject}
            onChange={(e) => setFilterSubject(e.target.value)}
            className="form-control form-select"
            style={{ width: 'auto' }}
          >
            <option value="all">All Subjects</option>
            {subjects.map((s) => (
              <option key={s.id} value={s.id}>
                {s.name}
              </option>
            ))}
          </select>

          {/* Status Filter */}
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="form-control form-select"
            style={{ width: 'auto' }}
          >
            <option value="all">All Statuses</option>
            <option value="Present">Present</option>
            <option value="Late">Late</option>
            <option value="Absent">Absent</option>
          </select>
        </div>
      </div>

      {/* Records Table */}
      <div className="table-responsive">
        <table className="data-table">
          <thead>
            <tr>
              <th>Record ID</th>
              <th>Student Details</th>
              <th>Course / Subject</th>
              <th>Class Batch</th>
              <th>Date & Time</th>
              <th>Status</th>
              <th>Method</th>
              <th style={{ textAlign: 'right' }}>Details</th>
            </tr>
          </thead>
          <tbody>
            {filteredRecords.length === 0 ? (
              <tr>
                <td colSpan={8} style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-muted)' }}>
                  No attendance records found matching filters.
                </td>
              </tr>
            ) : (
              filteredRecords.map((rec) => (
                <tr key={rec.id}>
                  <td>
                    <span style={{ fontFamily: 'monospace', fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                      {rec.id}
                    </span>
                  </td>
                  <td>
                    <div style={{ fontWeight: 600 }}>{rec.studentName}</div>
                    <div style={{ fontSize: '0.74rem', color: 'var(--primary)', fontWeight: 600 }}>{rec.rollNo}</div>
                  </td>
                  <td>
                    <div style={{ fontWeight: 500 }}>{rec.subjectName}</div>
                  </td>
                  <td>{rec.className}</td>
                  <td>
                    <div style={{ fontSize: '0.85rem' }}>{rec.lectureDate || rec.date}</div>
                    <div style={{ fontSize: '0.74rem', color: 'var(--text-muted)' }}>Scan: {rec.time}</div>
                    {rec.lectureStartTime && rec.lectureEndTime && (
                      <div style={{ fontSize: '0.72rem', color: 'var(--primary)', fontWeight: 600 }}>
                        Slot: {rec.lectureStartTime} – {rec.lectureEndTime}
                      </div>
                    )}
                  </td>
                  <td>
                    <Badge variant={rec.status === 'Present' ? 'success' : rec.status === 'Late' ? 'warning' : 'danger'}>
                      {rec.status}
                    </Badge>
                  </td>
                  <td>
                    <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>{rec.method}</span>
                  </td>
                  <td style={{ textAlign: 'right' }}>
                    <button
                      onClick={() => setSelectedRecord(rec)}
                      className="btn btn-outline btn-sm"
                      style={{ padding: '0.35rem 0.65rem' }}
                      title="View record audit details"
                    >
                      <Eye size={13} />
                      <span>Audit</span>
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Attendance Detail View Modal */}
      <Modal
        isOpen={Boolean(selectedRecord)}
        onClose={() => setSelectedRecord(null)}
        title="Attendance Record Audit"
      >
        {selectedRecord && (
          <div>
            <div className="modal-body">
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.25rem' }}>
                <div>
                  <h4 style={{ fontSize: '1.1rem', margin: 0, color: 'var(--text-main)' }}>
                    {selectedRecord.studentName}
                  </h4>
                  <span style={{ fontSize: '0.8rem', color: 'var(--primary)', fontWeight: 600 }}>
                    Roll No: {selectedRecord.rollNo}
                  </span>
                </div>
                <Badge variant={selectedRecord.status === 'Present' ? 'success' : 'warning'}>
                  {selectedRecord.status}
                </Badge>
              </div>

              <div style={{
                display: 'grid',
                gridTemplateColumns: '1fr 1fr',
                gap: '1rem',
                padding: '1rem',
                backgroundColor: '#f8fafc',
                borderRadius: 'var(--radius-md)',
                fontSize: '0.84rem',
                border: '1px solid var(--border-color)',
                marginBottom: '1.25rem'
              }}>
                <div>
                  <span style={{ color: 'var(--text-muted)', display: 'block', fontSize: '0.75rem' }}>Subject:</span>
                  <strong>{selectedRecord.subjectName}</strong>
                </div>
                <div>
                  <span style={{ color: 'var(--text-muted)', display: 'block', fontSize: '0.75rem' }}>Class:</span>
                  <strong>{selectedRecord.className}</strong>
                </div>
                <div>
                  <span style={{ color: 'var(--text-muted)', display: 'block', fontSize: '0.75rem' }}>Recorded Date:</span>
                  <strong>{selectedRecord.date}</strong>
                </div>
                <div>
                  <span style={{ color: 'var(--text-muted)', display: 'block', fontSize: '0.75rem' }}>Recorded Scan Time:</span>
                  <strong>{selectedRecord.time}</strong>
                </div>
                <div style={{ gridColumn: 'span 2' }}>
                  <span style={{ color: 'var(--text-muted)', display: 'block', fontSize: '0.75rem' }}>Lecture Schedule / Attendance Slot:</span>
                  <strong style={{ color: 'var(--primary)' }}>
                    {selectedRecord.lectureSchedule || (selectedRecord.lectureDate ? `${selectedRecord.lectureDate} (${selectedRecord.lectureStartTime || '10:00 AM'} - ${selectedRecord.lectureEndTime || '11:00 AM'})` : `${selectedRecord.date} (10:00 AM - 11:00 AM)`)}
                  </strong>
                </div>
                <div>
                  <span style={{ color: 'var(--text-muted)', display: 'block', fontSize: '0.75rem' }}>Verification Method:</span>
                  <strong>{selectedRecord.method}</strong>
                </div>
                <div>
                  <span style={{ color: 'var(--text-muted)', display: 'block', fontSize: '0.75rem' }}>Simulated Block:</span>
                  <strong style={{ fontFamily: 'monospace' }}>#{selectedRecord.blockNumber || 1845201}</strong>
                </div>
              </div>

              {/* Mock Blockchain Hash Verification */}
              <div style={{
                padding: '0.85rem',
                borderRadius: 'var(--radius-md)',
                backgroundColor: '#eff6ff',
                border: '1px solid #bfdbfe',
                fontSize: '0.8rem'
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', color: '#1e40af', fontWeight: 600, marginBottom: '0.25rem' }}>
                  <ShieldCheck size={16} />
                  <span>Cryptographic Proof (Demo Ledger)</span>
                </div>
                <p style={{ margin: '0 0 0.5rem', color: '#1d4ed8', fontSize: '0.75rem' }}>
                  Mock transaction hash generated for decentralized ledger verification:
                </p>
                <div style={{
                  padding: '0.5rem',
                  backgroundColor: '#fff',
                  borderRadius: '4px',
                  fontFamily: 'monospace',
                  fontSize: '0.75rem',
                  wordBreak: 'break-all',
                  color: 'var(--text-main)',
                  border: '1px solid #dbeafe'
                }}>
                  {selectedRecord.txHash}
                </div>
              </div>
            </div>

            <div className="modal-footer">
              <button onClick={() => setSelectedRecord(null)} className="btn btn-primary btn-sm">
                Close Audit View
              </button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
};
