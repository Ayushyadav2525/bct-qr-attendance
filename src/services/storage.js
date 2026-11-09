import {
  initialClasses,
  initialSubjects,
  initialTeachers,
  initialStudents,
  initialAttendanceRecords,
  initialSessions,
  generateMockHash
} from '../data/mockData';

const KEYS = {
  CLASSES: 'qr_att_classes',
  SUBJECTS: 'qr_att_subjects',
  TEACHERS: 'qr_att_teachers',
  STUDENTS: 'qr_att_students',
  RECORDS: 'qr_att_records',
  SESSIONS: 'qr_att_sessions',
};

// Initialize LocalStorage with seed data if not present
export const initializeStorage = () => {
  if (!localStorage.getItem(KEYS.CLASSES)) {
    localStorage.setItem(KEYS.CLASSES, JSON.stringify(initialClasses));
  }
  if (!localStorage.getItem(KEYS.SUBJECTS)) {
    localStorage.setItem(KEYS.SUBJECTS, JSON.stringify(initialSubjects));
  }
  if (!localStorage.getItem(KEYS.TEACHERS)) {
    localStorage.setItem(KEYS.TEACHERS, JSON.stringify(initialTeachers));
  }
  if (!localStorage.getItem(KEYS.STUDENTS)) {
    localStorage.setItem(KEYS.STUDENTS, JSON.stringify(initialStudents));
  }
  if (!localStorage.getItem(KEYS.RECORDS)) {
    localStorage.setItem(KEYS.RECORDS, JSON.stringify(initialAttendanceRecords));
  }
  if (!localStorage.getItem(KEYS.SESSIONS)) {
    localStorage.setItem(KEYS.SESSIONS, JSON.stringify(initialSessions));
  }
};

// Generic getters and setters
const get = (key, fallback = []) => {
  try {
    const data = localStorage.getItem(key);
    return data ? JSON.parse(data) : fallback;
  } catch (e) {
    console.error(`Error reading ${key} from storage:`, e);
    return fallback;
  }
};

const set = (key, data) => {
  try {
    localStorage.setItem(key, JSON.stringify(data));
  } catch (e) {
    console.error(`Error writing ${key} to storage:`, e);
  }
};

export const storage = {
  // Students
  getStudents: () => get(KEYS.STUDENTS, initialStudents),
  saveStudent: (student) => {
    const list = storage.getStudents();
    const index = list.findIndex((s) => s.id === student.id);
    if (index >= 0) {
      list[index] = { ...list[index], ...student };
    } else {
      list.unshift({ ...student, id: `STU-${Date.now().toString().slice(-4)}` });
    }
    set(KEYS.STUDENTS, list);
    return list;
  },
  deleteStudent: (id) => {
    const list = storage.getStudents().filter((s) => s.id !== id);
    set(KEYS.STUDENTS, list);
    return list;
  },

  // Teachers
  getTeachers: () => get(KEYS.TEACHERS, initialTeachers),
  saveTeacher: (teacher) => {
    const list = storage.getTeachers();
    const index = list.findIndex((t) => t.id === teacher.id);
    if (index >= 0) {
      list[index] = { ...list[index], ...teacher };
    } else {
      list.unshift({ ...teacher, id: `TCH-${Date.now().toString().slice(-3)}` });
    }
    set(KEYS.TEACHERS, list);
    return list;
  },
  deleteTeacher: (id) => {
    const list = storage.getTeachers().filter((t) => t.id !== id);
    set(KEYS.TEACHERS, list);
    return list;
  },

  // Classes
  getClasses: () => get(KEYS.CLASSES, initialClasses),
  saveClass: (cls) => {
    const list = storage.getClasses();
    const index = list.findIndex((c) => c.id === cls.id);
    if (index >= 0) {
      list[index] = { ...list[index], ...cls };
    } else {
      list.unshift({ ...cls, id: `CLS-${Date.now().toString().slice(-4)}` });
    }
    set(KEYS.CLASSES, list);
    return list;
  },
  deleteClass: (id) => {
    const list = storage.getClasses().filter((c) => c.id !== id);
    set(KEYS.CLASSES, list);
    return list;
  },

  // Subjects
  getSubjects: () => get(KEYS.SUBJECTS, initialSubjects),
  saveSubject: (sub) => {
    const list = storage.getSubjects();
    const index = list.findIndex((s) => s.id === sub.id);
    if (index >= 0) {
      list[index] = { ...list[index], ...sub };
    } else {
      list.unshift({ ...sub, id: `SUB-${Date.now().toString().slice(-4)}` });
    }
    set(KEYS.SUBJECTS, list);
    return list;
  },
  deleteSubject: (id) => {
    const list = storage.getSubjects().filter((s) => s.id !== id);
    set(KEYS.SUBJECTS, list);
    return list;
  },

  // Sessions
  getSessions: () => get(KEYS.SESSIONS, initialSessions),
  createSession: ({ classId, className, subjectId, subjectName, teacherId, teacherName, durationMinutes = 15, lectureDate, lectureStartTime, lectureEndTime }) => {
    const list = storage.getSessions();
    const now = new Date();
    const expiresAt = new Date(now.getTime() + durationMinutes * 60 * 1000);
    const id = `SES-${Date.now().toString().slice(-4)}`;
    const token = `QR-${subjectId}-${Date.now()}`;

    const newSession = {
      id,
      token,
      classId,
      className,
      subjectId,
      subjectName,
      teacherId,
      teacherName,
      createdAt: now.toISOString(),
      expiresAt: expiresAt.toISOString(),
      durationMinutes,
      lectureDate: lectureDate || '02 November 2026',
      lectureStartTime: lectureStartTime || '10:00 AM',
      lectureEndTime: lectureEndTime || '11:00 AM',
      status: 'Active',
      attendeeCount: 0,
    };

    list.unshift(newSession);
    set(KEYS.SESSIONS, list);
    return newSession;
  },
  getSessionAttendance: (sessionId) => {
    const sessions = storage.getSessions();
    const session = sessions.find((s) => s.id === sessionId || s.token === sessionId);
    if (!session) return null;

    const allStudents = storage.getStudents().filter((st) => !session.classId || st.classId === session.classId);
    const records = storage.getRecords().filter((r) => r.sessionId === session.id);
    const students = records.map((r) => ({
      id: r.id,
      rollNo: r.rollNo,
      studentName: r.studentName,
      subject: r.subjectName || session.subjectName,
      scanTime: r.time,
      status: r.status,
    }));

    return {
      session,
      totalEnrolled: allStudents.length || 40,
      checkedInCount: students.length,
      notCheckedInCount: Math.max(0, (allStudents.length || 40) - students.length),
      students,
    };
  },
  closeSession: (sessionId) => {
    const list = storage.getSessions();
    const updated = list.map((s) => (s.id === sessionId ? { ...s, status: 'Closed' } : s));
    set(KEYS.SESSIONS, updated);
    return updated;
  },

  // Records
  getRecords: () => get(KEYS.RECORDS, initialAttendanceRecords),

  // Mark attendance with validations
  markAttendance: ({ token, studentId, method = 'QR Scan' }) => {
    const sessions = storage.getSessions();
    const session = sessions.find((s) => s.token === token || s.id === token);

    if (!session) {
      return { success: false, error: 'Invalid QR Code or Session Token.' };
    }

    const now = new Date();
    const expires = new Date(session.expiresAt);

    if (session.status !== 'Active' || now > expires) {
      return { success: false, error: 'Attendance session has expired or is closed.' };
    }

    const students = storage.getStudents();
    const student = students.find((s) => s.id === studentId);

    if (!student) {
      return { success: false, error: 'Student record not found.' };
    }

    const records = storage.getRecords();
    const todayStr = now.toISOString().split('T')[0];

    // Duplicate attendance check: same student, same subject, same date
    const alreadyMarked = records.find(
      (r) => r.studentId === student.id && r.subjectId === session.subjectId && r.date === todayStr
    );

    if (alreadyMarked) {
      return {
        success: false,
        error: `Attendance already recorded for ${session.subjectName} today at ${alreadyMarked.time}.`,
      };
    }

    const hours = now.getHours();
    const minutes = now.getMinutes().toString().padStart(2, '0');
    const ampm = hours >= 12 ? 'PM' : 'AM';
    const formattedHours = hours % 12 || 12;
    const timeStr = `${formattedHours}:${minutes} ${ampm}`;

    const newRecord = {
      id: `ATT-${Date.now().toString().slice(-4)}`,
      studentId: student.id,
      studentName: student.name,
      rollNo: student.rollNo,
      classId: session.classId,
      className: session.className,
      subjectId: session.subjectId,
      subjectName: session.subjectName,
      date: todayStr,
      time: timeStr,
      status: 'Present',
      method,
      txHash: generateMockHash('0x'),
      blockNumber: Math.floor(1845200 + Math.random() * 500),
    };

    records.unshift(newRecord);
    set(KEYS.RECORDS, records);

    // Update session attendee count
    const updatedSessions = sessions.map((s) =>
      s.id === session.id ? { ...s, attendeeCount: (s.attendeeCount || 0) + 1 } : s
    );
    set(KEYS.SESSIONS, updatedSessions);

    return {
      success: true,
      record: newRecord,
      session,
      message: `Attendance marked successfully for ${session.subjectName}!`,
    };
  },

  // Reset demo data
  resetDemoData: () => {
    localStorage.removeItem(KEYS.CLASSES);
    localStorage.removeItem(KEYS.SUBJECTS);
    localStorage.removeItem(KEYS.TEACHERS);
    localStorage.removeItem(KEYS.STUDENTS);
    localStorage.removeItem(KEYS.RECORDS);
    localStorage.removeItem(KEYS.SESSIONS);
    initializeStorage();
  },
};
