import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useAttendance } from '../context/AttendanceContext';
import { useAuth } from '../context/AuthContext';
import { Card } from '../components/Card';
import { Badge } from '../components/Badge';
import { Modal } from '../components/Modal';
import { QRCodeCanvas } from 'qrcode.react';
import {
  QrCode,
  Download,
  Clock,
  Play,
  StopCircle,
  Copy,
  Check,
  Info,
  Users,
  ShieldCheck,
  Sparkles,
  Calendar,
  Eye,
  CheckCircle2,
  RefreshCw
} from 'lucide-react';

export const QRGenerator = () => {
  const { classes, subjects, sessions, createSession, closeSession, getSessionAttendance, addToast } = useAttendance();
  const { currentUser } = useAuth();

  const [selectedClassId, setSelectedClassId] = useState('');
  const [selectedSubjectId, setSelectedSubjectId] = useState('');
  const [durationMinutes, setDurationMinutes] = useState(15);

  // Lecture Schedule / Attendance Time Slot states
  const [lectureDate, setLectureDate] = useState(() => {
    const today = new Date();
    return today.toISOString().split('T')[0];
  });
  const [lectureStartTime, setLectureStartTime] = useState('10:00');
  const [lectureEndTime, setLectureEndTime] = useState('11:00');

  const [activeSession, setActiveSession] = useState(null);
  const [timeLeft, setTimeLeft] = useState(null);
  const [copied, setCopied] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Attendance summary modal & live attendee list states
  const [isAttendanceModalOpen, setIsAttendanceModalOpen] = useState(false);
  const [checkedInStudents, setCheckedInStudents] = useState([]);
  const [totalEnrolled, setTotalEnrolled] = useState(0);
  const [checkedInCount, setCheckedInCount] = useState(0);
  const [notCheckedInCount, setNotCheckedInCount] = useState(0);
  const [isLoadingAttendance, setIsLoadingAttendance] = useState(false);

  const qrCanvasRef = useRef(null);

  // Helper to determine if a session is currently OPEN
  const isOpenStatus = (status) => {
    const s = String(status || '').toUpperCase();
    return s === 'OPEN' || s === 'ACTIVE';
  };

  // Helper to parse time string into minutes for comparison
  const parseTimeToMinutes = (timeStr) => {
    if (!timeStr) return 0;
    const s = String(timeStr).trim();
    const match12 = s.match(/^(\d{1,2}):(\d{2})\s*([apAP][mM])?$/);
    if (match12) {
      let hours = parseInt(match12[1], 10);
      const minutes = parseInt(match12[2], 10);
      const period = match12[3]?.toUpperCase();
      if (period === 'PM' && hours < 12) hours += 12;
      if (period === 'AM' && hours === 12) hours = 0;
      return hours * 60 + minutes;
    }
    const [h, m] = s.split(':').map((v) => parseInt(v, 10));
    return (h || 0) * 60 + (m || 0);
  };

  // Validate that end time is later than start time
  const validateTimes = (start, end) => {
    return parseTimeToMinutes(end) > parseTimeToMinutes(start);
  };

  // Format 24h time ("10:00", "13:00") to 12h AM/PM ("10:00 AM", "01:00 PM")
  const formatTimeDisplay = (timeStr) => {
    if (!timeStr) return '';
    if (timeStr.toUpperCase().includes('AM') || timeStr.toUpperCase().includes('PM')) {
      return timeStr;
    }
    const [h, m] = timeStr.split(':').map(Number);
    if (isNaN(h)) return timeStr;
    const period = h >= 12 ? 'PM' : 'AM';
    const displayH = h % 12 === 0 ? 12 : h % 12;
    return `${displayH.toString().padStart(2, '0')}:${(m || 0).toString().padStart(2, '0')} ${period}`;
  };

  // Format date ("2026-11-02") to ("02 November 2026")
  const formatDateDisplay = (dateStr) => {
    if (!dateStr) return 'Today';
    try {
      const d = new Date(dateStr + 'T00:00:00');
      if (isNaN(d.getTime())) return dateStr;
      return d.toLocaleDateString('en-GB', { day: '2-digit', month: 'long', year: 'numeric' });
    } catch (e) {
      return dateStr;
    }
  };

  // Subjects belonging strictly to the selected class
  const filteredSubjects = subjects.filter((s) => !selectedClassId || !s.classId || s.classId === selectedClassId);

  // Sync class selection
  useEffect(() => {
    if (classes.length > 0) {
      const exists = classes.some((c) => c.id === selectedClassId);
      if (!selectedClassId || !exists) {
        setSelectedClassId(classes[0].id);
      }
    }
  }, [classes, selectedClassId]);

  // Sync subject selection whenever selectedClassId or filteredSubjects changes
  useEffect(() => {
    if (filteredSubjects.length > 0) {
      const isCurrentValid = filteredSubjects.some((s) => s.id === selectedSubjectId);
      if (!selectedSubjectId || !isCurrentValid) {
        setSelectedSubjectId(filteredSubjects[0].id);
      }
    } else {
      setSelectedSubjectId('');
    }
  }, [filteredSubjects, selectedClassId, selectedSubjectId]);

  // Pick first OPEN session if available
  useEffect(() => {
    const live = sessions.find((s) => isOpenStatus(s.status));
    if (live) {
      setActiveSession(live);
    } else if (activeSession && !isOpenStatus(activeSession.status)) {
      setActiveSession(null);
    }
  }, [sessions]);

  // Live countdown timer using backend's actual expiresAt timestamp with robust UTC parsing
  useEffect(() => {
    if (!activeSession || !isOpenStatus(activeSession.status)) {
      setTimeLeft(null);
      return;
    }

    const updateTimer = () => {
      const now = Date.now();
      let expiryTime;

      if (typeof activeSession.expiresAt === 'number') {
        expiryTime = activeSession.expiresAt;
      } else {
        const iso = String(activeSession.expiresAt || '').trim().replace(' ', 'T');
        // Guarantee UTC timezone parsing across all engines
        const utcIso = iso.endsWith('Z') || iso.includes('+') ? iso : iso + 'Z';
        expiryTime = new Date(utcIso).getTime();
      }

      const diff = expiryTime - now;

      if (isNaN(diff) || diff <= 0) {
        setTimeLeft('Expired');
        if (activeSession.id) {
          closeSession(activeSession.id);
        }
        setActiveSession(null);
      } else {
        const m = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
        const s = Math.floor((diff % (1000 * 60)) / 1000);
        setTimeLeft(`${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`);
      }
    };

    updateTimer();
    const interval = setInterval(updateTimer, 1000);
    return () => clearInterval(interval);
  }, [activeSession, closeSession]);

  // Live attendance polling: fetch real database attendance records every 3 seconds while session is active
  const fetchSessionAttendanceData = useCallback(async (sessionId) => {
    if (!sessionId) return;
    try {
      const res = await getSessionAttendance(sessionId);
      if (res) {
        if (Array.isArray(res.students)) {
          setCheckedInStudents(res.students);
        }
        if (typeof res.totalEnrolled === 'number') {
          setTotalEnrolled(res.totalEnrolled);
        }
        if (typeof res.checkedInCount === 'number') {
          setCheckedInCount(res.checkedInCount);
          setActiveSession((prev) => (prev && prev.id === sessionId ? { ...prev, attendeeCount: res.checkedInCount } : prev));
        }
        if (typeof res.notCheckedInCount === 'number') {
          setNotCheckedInCount(res.notCheckedInCount);
        }
        if (res.session && !isOpenStatus(res.session.status)) {
          setActiveSession((prev) => (prev ? { ...prev, status: res.session.status } : null));
        }
      }
    } catch (err) {
      console.warn('Error fetching live session attendance:', err);
    }
  }, [getSessionAttendance]);

  useEffect(() => {
    if (!activeSession || !isOpenStatus(activeSession.status)) {
      return;
    }

    // Initial fetch
    fetchSessionAttendanceData(activeSession.id);

    // Sensible polling every 3 seconds while QR session is active
    const pollInterval = setInterval(() => {
      fetchSessionAttendanceData(activeSession.id);
    }, 3000);

    return () => clearInterval(pollInterval);
  }, [activeSession?.id, activeSession?.status, fetchSessionAttendanceData]);

  const handleCreate = async (e) => {
    e.preventDefault();
    const cls = classes.find((c) => c.id === selectedClassId);
    const sub = filteredSubjects.find((s) => s.id === selectedSubjectId);

    if (!cls || !sub) {
      addToast('Please select a valid class and subject before generating.', 'error');
      return;
    }

    // Validate that end time is strictly later than start time
    if (!validateTimes(lectureStartTime, lectureEndTime)) {
      addToast('Lecture End Time must be later than Lecture Start Time (e.g., 10:00 AM to 11:00 AM).', 'error');
      return;
    }

    const formattedDate = formatDateDisplay(lectureDate);
    const formattedStart = formatTimeDisplay(lectureStartTime);
    const formattedEnd = formatTimeDisplay(lectureEndTime);

    setIsSubmitting(true);
    try {
      const session = await createSession({
        classId: cls.id,
        className: cls.name,
        subjectId: sub.id,
        subjectName: sub.name,
        teacherId: currentUser?.id || 'TCH-001',
        teacherName: currentUser?.name || 'Faculty Instructor',
        durationMinutes: Number(durationMinutes),
        lectureDate: formattedDate,
        lectureStartTime: formattedStart,
        lectureEndTime: formattedEnd,
      });

      // Generate and display QR code ONLY after the backend confirms that the session is OPEN
      if (session && isOpenStatus(session.status)) {
        setActiveSession(session);
        // Pre-fetch fresh attendee data
        fetchSessionAttendanceData(session.id);
      } else {
        setActiveSession(null);
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleExpire = async () => {
    if (activeSession) {
      await closeSession(activeSession.id);
      setActiveSession(null);
      setTimeLeft(null);
    }
  };

  const handleOpenAttendanceModal = async () => {
    setIsAttendanceModalOpen(true);
    if (activeSession) {
      setIsLoadingAttendance(true);
      try {
        await fetchSessionAttendanceData(activeSession.id);
      } finally {
        setIsLoadingAttendance(false);
      }
    }
  };

  const handleDownloadQR = () => {
    const canvas = document.getElementById('qr-canvas-element');
    if (!canvas) {
      addToast('QR Canvas not rendered yet.', 'error');
      return;
    }
    const pngUrl = canvas.toDataURL('image/png');
    const downloadLink = document.createElement('a');
    downloadLink.href = pngUrl;
    downloadLink.download = `QR_${activeSession?.subjectName || 'Attendance'}_${Date.now()}.png`;
    document.body.appendChild(downloadLink);
    downloadLink.click();
    document.body.removeChild(downloadLink);
    addToast('QR Code image downloaded successfully!', 'success');
  };

  const handleCopyToken = () => {
    if (activeSession) {
      navigator.clipboard.writeText(activeSession.token);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
      addToast('Session token copied to clipboard!', 'info');
    }
  };

  return (
    <div>
      <div style={{ marginBottom: '1.75rem' }}>
        <h1 style={{ fontSize: '1.65rem', fontWeight: 800, color: 'var(--text-main)', letterSpacing: '-0.02em' }}>
          QR Code Attendance Generator
        </h1>
        <p style={{ color: 'var(--text-muted)', fontSize: '0.88rem', marginTop: '0.2rem' }}>
          Broadcast a dynamic QR code for in-class attendance. Students scan with their smartphone or webcam to mark presence.
        </p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(380px, 1fr))', gap: '1.75rem', alignItems: 'start' }}>
        {/* Session Creator Form */}
        <Card
          title="Configure Attendance Session"
          subtitle="Select classroom parameters and timer"
          icon={Play}
        >
          <form onSubmit={handleCreate}>
            <div className="form-group">
              <label className="form-label" htmlFor="select-class">Target Class / Section</label>
              <select
                id="select-class"
                value={selectedClassId}
                onChange={(e) => setSelectedClassId(e.target.value)}
                className="form-control form-select"
                required
              >
                {classes.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name} ({c.department})
                  </option>
                ))}
              </select>
            </div>

            <div className="form-group">
              <label className="form-label" htmlFor="select-subject">Subject / Course</label>
              <select
                id="select-subject"
                value={selectedSubjectId}
                onChange={(e) => setSelectedSubjectId(e.target.value)}
                className="form-control form-select"
                required
              >
                {filteredSubjects.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.name} ({s.code})
                  </option>
                ))}
              </select>
            </div>

            <div className="form-group">
              <label className="form-label" htmlFor="select-duration">Session Validity Duration</label>
              <select
                id="select-duration"
                value={durationMinutes}
                onChange={(e) => setDurationMinutes(e.target.value)}
                className="form-control form-select"
              >
                <option value={5}>5 Minutes (Quick Pop Quiz)</option>
                <option value={10}>10 Minutes (Standard Class Start)</option>
                <option value={15}>15 Minutes (Recommended)</option>
                <option value={30}>30 Minutes</option>
                <option value={60}>60 Minutes (Full Lecture Window)</option>
              </select>
            </div>

            {/* Lecture Schedule / Attendance Time Slot Section */}
            <div style={{
              marginTop: '1.25rem',
              marginBottom: '1rem',
              padding: '1rem',
              borderRadius: 'var(--radius-md)',
              backgroundColor: '#f8fafc',
              border: '1px solid var(--border-color)',
            }}>
              <div style={{
                fontWeight: 700,
                color: 'var(--text-main)',
                marginBottom: '0.85rem',
                display: 'flex',
                alignItems: 'center',
                gap: '0.45rem',
                fontSize: '0.88rem'
              }}>
                <Calendar size={16} style={{ color: 'var(--primary)' }} />
                <span>Lecture Schedule / Attendance Time Slot</span>
              </div>

              <div className="form-group" style={{ marginBottom: '0.75rem' }}>
                <label className="form-label" htmlFor="lecture-date" style={{ fontSize: '0.8rem' }}>
                  Lecture Date
                </label>
                <input
                  id="lecture-date"
                  type="date"
                  className="form-control"
                  value={lectureDate}
                  onChange={(e) => setLectureDate(e.target.value)}
                  required
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
                <div className="form-group" style={{ marginBottom: 0 }}>
                  <label className="form-label" htmlFor="lecture-start-time" style={{ fontSize: '0.8rem' }}>
                    Start Time
                  </label>
                  <input
                    id="lecture-start-time"
                    type="time"
                    className="form-control"
                    value={lectureStartTime}
                    onChange={(e) => setLectureStartTime(e.target.value)}
                    required
                  />
                </div>
                <div className="form-group" style={{ marginBottom: 0 }}>
                  <label className="form-label" htmlFor="lecture-end-time" style={{ fontSize: '0.8rem' }}>
                    End Time
                  </label>
                  <input
                    id="lecture-end-time"
                    type="time"
                    className="form-control"
                    value={lectureEndTime}
                    onChange={(e) => setLectureEndTime(e.target.value)}
                    required
                  />
                </div>
              </div>

              <div style={{ fontSize: '0.74rem', color: 'var(--text-muted)', marginTop: '0.5rem' }}>
                Lecture duration is independent from QR scan validity (e.g. 10:00 AM – 11:00 AM class with 15 min QR window).
              </div>
            </div>

            <div style={{ marginTop: '1.5rem', display: 'flex', gap: '0.75rem' }}>
              <button
                type="submit"
                className="btn btn-primary"
                style={{ flex: 1, padding: '0.75rem' }}
                disabled={isSubmitting}
              >
                <QrCode size={18} />
                <span>{isSubmitting ? 'Creating Live QR...' : 'Generate New Live QR'}</span>
              </button>

              {activeSession && isOpenStatus(activeSession.status) && (
                <button
                  type="button"
                  onClick={handleExpire}
                  className="btn btn-outline"
                  style={{ color: 'var(--danger)', borderColor: 'var(--danger-border)' }}
                >
                  <StopCircle size={18} />
                  <span>Stop Active</span>
                </button>
              )}
            </div>
          </form>

          {/* Guidelines Box */}
          <div style={{
            marginTop: '1.5rem',
            padding: '1rem',
            borderRadius: 'var(--radius-md)',
            backgroundColor: '#f8fafc',
            border: '1px solid var(--border-color)',
            fontSize: '0.82rem',
            color: 'var(--text-muted)'
          }}>
            <div style={{ fontWeight: 600, color: 'var(--text-main)', marginBottom: '0.4rem', display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
              <Info size={15} className="text-primary" />
              Faculty In-Class Protocol
            </div>
            <ul style={{ paddingLeft: '1.25rem', lineHeight: '1.6' }}>
              <li>Project this screen onto the classroom projector.</li>
              <li>Students scan the QR code via their student portal.</li>
              <li>The anti-proxy algorithm rejects scans after session expiry.</li>
              <li>Duplicate scans by the same student are automatically blocked.</li>
            </ul>
          </div>
        </Card>

        {/* Live QR Code Display Card */}
        <Card
          title="Classroom Projection Display"
          subtitle={activeSession && isOpenStatus(activeSession.status) ? `Active Session: ${activeSession.subjectName}` : 'No active session generated yet'}
          icon={QrCode}
        >
          {activeSession && isOpenStatus(activeSession.status) && activeSession.token ? (
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center', padding: '1rem 0' }}>
              {/* Countdown Timer Badge for QR Validity */}
              <div style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.5rem',
                padding: '0.5rem 1.25rem',
                borderRadius: '9999px',
                backgroundColor: timeLeft === 'Expired' ? 'var(--danger-bg)' : '#eff6ff',
                color: timeLeft === 'Expired' ? 'var(--danger)' : 'var(--primary)',
                fontWeight: 700,
                fontSize: '1.1rem',
                marginBottom: '0.85rem',
                border: '1px solid currentColor'
              }}>
                <Clock size={20} />
                <span>QR Validity Remaining: {timeLeft || 'Calculating...'}</span>
              </div>

              {/* Lecture Schedule Pill: Displayed clearly and separately from QR validity */}
              <div style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.85rem',
                padding: '0.45rem 1rem',
                borderRadius: 'var(--radius-md)',
                backgroundColor: '#f8fafc',
                border: '1px solid var(--border-color)',
                marginBottom: '1.25rem',
                fontSize: '0.84rem',
                color: 'var(--text-main)',
                boxShadow: 'var(--shadow-sm)',
                flexWrap: 'wrap',
                justifyContent: 'center'
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', fontWeight: 600 }}>
                  <Calendar size={15} style={{ color: 'var(--primary)' }} />
                  <span>Date: {activeSession.lectureDate || formatDateDisplay(lectureDate)}</span>
                </div>
                <span style={{ color: 'var(--border-color)' }}>|</span>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', fontWeight: 600 }}>
                  <Clock size={15} style={{ color: 'var(--primary)' }} />
                  <span>Lecture Slot: {activeSession.lectureStartTime || '10:00 AM'} – {activeSession.lectureEndTime || '11:00 AM'}</span>
                </div>
              </div>

              {/* Scannable Canvas QR */}
              <div style={{
                padding: '1.25rem',
                backgroundColor: '#ffffff',
                borderRadius: '16px',
                boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.1), 0 8px 10px -6px rgba(0, 0, 0, 0.05)',
                border: '1px solid #e2e8f0',
                marginBottom: '1.25rem'
              }}>
                <QRCodeCanvas
                  id="qr-canvas-element"
                  value={activeSession.token}
                  size={260}
                  level="H"
                  includeMargin={true}
                />
              </div>

              <div style={{ marginBottom: '1rem' }}>
                <h3 style={{ fontSize: '1.2rem', fontWeight: 700, color: 'var(--text-main)' }}>
                  {activeSession.subjectName}
                </h3>
                <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginTop: '0.2rem' }}>
                  {activeSession.className} • Instructor: {activeSession.teacherName}
                </p>
              </div>

              {/* Clickable Live Attendance Summary Pill */}
              <button
                type="button"
                id="students-checked-in-trigger"
                onClick={handleOpenAttendanceModal}
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '0.55rem',
                  padding: '0.5rem 1.15rem',
                  borderRadius: 'var(--radius-md)',
                  backgroundColor: '#f0fdf4',
                  color: '#15803d',
                  fontSize: '0.88rem',
                  fontWeight: 600,
                  border: '1.5px solid #86efac',
                  marginBottom: '1.25rem',
                  cursor: 'pointer',
                  transition: 'var(--transition)',
                  boxShadow: '0 1px 3px rgba(0, 0, 0, 0.04)'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.backgroundColor = '#dcfce7';
                  e.currentTarget.style.borderColor = '#4ade80';
                  e.currentTarget.style.transform = 'translateY(-1px)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundColor = '#f0fdf4';
                  e.currentTarget.style.borderColor = '#86efac';
                  e.currentTarget.style.transform = 'translateY(0)';
                }}
                title="Click to view live student attendance list"
              >
                <Users size={16} />
                <span>{activeSession.attendeeCount || checkedInCount || 0} Students Checked In</span>
                <span style={{
                  fontSize: '0.72rem',
                  fontWeight: 700,
                  backgroundColor: '#bbf7d0',
                  color: '#14532d',
                  padding: '0.15rem 0.5rem',
                  borderRadius: '9999px',
                  marginLeft: '0.2rem'
                }}>
                  View Live List
                </span>
              </button>

              {/* Token & Actions */}
              <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem',
                backgroundColor: '#f1f5f9',
                padding: '0.5rem 0.85rem',
                borderRadius: 'var(--radius-md)',
                fontSize: '0.8rem',
                color: 'var(--text-muted)',
                marginBottom: '1.25rem',
                maxWidth: '360px',
                width: '100%',
                justifyContent: 'space-between'
              }}>
                <span style={{ fontFamily: 'monospace', fontWeight: 600 }}>{activeSession.token}</span>
                <button
                  onClick={handleCopyToken}
                  className="btn btn-outline btn-sm"
                  style={{ padding: '0.25rem 0.5rem', fontSize: '0.75rem', gap: '3px' }}
                >
                  {copied ? <Check size={13} /> : <Copy size={13} />}
                  <span>{copied ? 'Copied' : 'Copy'}</span>
                </button>
              </div>

              {/* Action Buttons */}
              <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap', justifyContent: 'center' }}>
                <button onClick={handleDownloadQR} className="btn btn-primary btn-sm">
                  <Download size={15} />
                  <span>Download QR (.PNG)</span>
                </button>
                <button onClick={handleExpire} className="btn btn-outline btn-sm" style={{ color: 'var(--danger)', borderColor: 'var(--danger-border)' }}>
                  <StopCircle size={15} />
                  <span>Expire Session</span>
                </button>
              </div>
            </div>
          ) : (
            <div className="empty-state">
              <QrCode className="empty-icon" />
              <h4>No Active Session Displayed</h4>
              <p style={{ maxWidth: '300px', margin: '0.5rem auto 1rem', fontSize: '0.85rem' }}>
                Select a class and subject on the left, set the lecture schedule, then click <strong>"Generate New Live QR"</strong> to broadcast.
              </p>
            </div>
          )}
        </Card>
      </div>

      {/* Live Attendance Summary Modal */}
      <Modal
        isOpen={isAttendanceModalOpen}
        onClose={() => setIsAttendanceModalOpen(false)}
        title="Live Student Attendance Summary"
        maxWidth="780px"
      >
        {activeSession && (
          <div className="modal-body" style={{ padding: '1.25rem' }}>
            {/* Session Context Banner */}
            <div style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              padding: '0.85rem 1rem',
              borderRadius: 'var(--radius-md)',
              backgroundColor: '#f8fafc',
              border: '1px solid var(--border-color)',
              marginBottom: '1.25rem',
              flexWrap: 'wrap',
              gap: '0.75rem'
            }}>
              <div>
                <div style={{ fontWeight: 700, fontSize: '1.05rem', color: 'var(--text-main)' }}>
                  {activeSession.subjectName}
                </div>
                <div style={{ fontSize: '0.82rem', color: 'var(--text-muted)', marginTop: '0.2rem' }}>
                  {activeSession.className} • Schedule: <strong style={{ color: 'var(--primary)' }}>{activeSession.lectureDate || formatDateDisplay(lectureDate)} ({activeSession.lectureStartTime || '10:00 AM'} – {activeSession.lectureEndTime || '11:00 AM'})</strong>
                </div>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <Badge variant={isOpenStatus(activeSession.status) ? 'success' : 'default'}>
                  {isOpenStatus(activeSession.status) ? '● Live Feed Active' : activeSession.status}
                </Badge>
              </div>
            </div>

            {/* Attendance Metric Summary Cards */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '1rem', marginBottom: '1.5rem' }}>
              <div style={{
                padding: '0.9rem',
                borderRadius: 'var(--radius-md)',
                backgroundColor: '#f1f5f9',
                border: '1px solid #e2e8f0',
                textAlign: 'center'
              }}>
                <div style={{ fontSize: '1.45rem', fontWeight: 800, color: 'var(--text-main)' }}>
                  {totalEnrolled}
                </div>
                <div style={{ fontSize: '0.76rem', color: 'var(--text-muted)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                  Total Enrolled
                </div>
              </div>

              <div style={{
                padding: '0.9rem',
                borderRadius: 'var(--radius-md)',
                backgroundColor: '#f0fdf4',
                border: '1px solid #bbf7d0',
                textAlign: 'center'
              }}>
                <div style={{ fontSize: '1.45rem', fontWeight: 800, color: '#16a34a' }}>
                  {checkedInStudents.length}
                </div>
                <div style={{ fontSize: '0.76rem', color: '#15803d', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                  Checked In
                </div>
              </div>

              <div style={{
                padding: '0.9rem',
                borderRadius: 'var(--radius-md)',
                backgroundColor: '#fffbeb',
                border: '1px solid #fde68a',
                textAlign: 'center'
              }}>
                <div style={{ fontSize: '1.45rem', fontWeight: 800, color: '#d97706' }}>
                  {Math.max(0, totalEnrolled - checkedInStudents.length)}
                </div>
                <div style={{ fontSize: '0.76rem', color: '#b45309', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                  Not Checked In
                </div>
              </div>
            </div>

            {/* Live Student Table */}
            <div className="table-responsive" style={{ maxHeight: '360px', overflowY: 'auto' }}>
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Roll Number</th>
                    <th>Student Name</th>
                    <th>Subject</th>
                    <th>Scan Time</th>
                    <th>Attendance Status</th>
                  </tr>
                </thead>
                <tbody>
                  {checkedInStudents.length === 0 ? (
                    <tr>
                      <td colSpan={5} style={{ textAlign: 'center', padding: '2.75rem 1rem' }}>
                        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.45rem' }}>
                          <Users size={32} style={{ color: 'var(--text-light)', opacity: 0.5 }} />
                          <div style={{ fontWeight: 600, color: 'var(--text-main)', fontSize: '0.95rem' }}>
                            No students have checked in yet.
                          </div>
                          <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                            Students scanning the projected QR code will appear here automatically in real time.
                          </div>
                        </div>
                      </td>
                    </tr>
                  ) : (
                    checkedInStudents.map((stu, idx) => (
                      <tr key={stu.id || stu.recordId || idx}>
                        <td>
                          <span style={{ fontFamily: 'monospace', fontWeight: 700, color: 'var(--primary)', fontSize: '0.88rem' }}>
                            {stu.rollNo}
                          </span>
                        </td>
                        <td>
                          <div style={{ fontWeight: 600, color: 'var(--text-main)' }}>{stu.studentName}</div>
                        </td>
                        <td>
                          <span style={{ fontSize: '0.85rem' }}>{stu.subject || activeSession.subjectName}</span>
                        </td>
                        <td>
                          <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>{stu.scanTime}</span>
                        </td>
                        <td>
                          <Badge variant={stu.status === 'Present' ? 'success' : stu.status === 'Late' ? 'warning' : 'danger'}>
                            {stu.status}
                          </Badge>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>

            <div style={{ marginTop: '1rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.78rem', color: 'var(--text-muted)' }}>
              <span>
                {isOpenStatus(activeSession.status) ? 'Live feed updating every 3 seconds' : 'Session is inactive'}
              </span>
              <button
                type="button"
                onClick={() => fetchSessionAttendanceData(activeSession.id)}
                className="btn btn-outline btn-sm"
                style={{ padding: '0.25rem 0.6rem', fontSize: '0.75rem' }}
              >
                <RefreshCw size={12} />
                <span>Refresh Now</span>
              </button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
};
