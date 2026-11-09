export const initialClasses = [
  { id: 'CLS-CS4A', name: 'CS - 4th Sem (Sec A)', department: 'Computer Science', semester: '4th', studentCount: 42 },
  { id: 'CLS-CS4B', name: 'CS - 4th Sem (Sec B)', department: 'Computer Science', semester: '4th', studentCount: 38 },
  { id: 'CLS-IT6A', name: 'IT - 6th Sem', department: 'Information Tech', semester: '6th', studentCount: 35 },
  { id: 'CLS-AI4A', name: 'AI & Data Science - 4th Sem', department: 'Artificial Intelligence', semester: '4th', studentCount: 40 },
];

export const initialSubjects = [
  { id: 'SUB-BC401', code: 'CS401', name: 'Blockchain Technology', classId: 'CLS-CS4A', teacherId: 'TCH-001', teacherName: 'Dr. Robert Vance' },
  { id: 'SUB-DB402', code: 'CS402', name: 'Database Management Systems', classId: 'CLS-CS4A', teacherId: 'TCH-002', teacherName: 'Prof. Sarah Jenkins' },
  { id: 'SUB-CN403', code: 'CS403', name: 'Computer Networks', classId: 'CLS-CS4A', teacherId: 'TCH-001', teacherName: 'Dr. Robert Vance' },
  { id: 'SUB-OS404', code: 'CS404', name: 'Operating Systems', classId: 'CLS-CS4B', teacherId: 'TCH-003', teacherName: 'Dr. Alan Turing' },
  { id: 'SUB-ML601', code: 'IT601', name: 'Machine Learning', classId: 'CLS-IT6A', teacherId: 'TCH-002', teacherName: 'Prof. Sarah Jenkins' },
];

export const initialTeachers = [
  {
    id: 'TCH-001',
    name: 'Dr. Robert Vance',
    email: 'teacher@demo.edu',
    department: 'Computer Science',
    phone: '+1 (555) 234-5678',
    subjects: ['Blockchain Technology', 'Computer Networks'],
    assignedClasses: ['CS - 4th Sem (Sec A)', 'CS - 4th Sem (Sec B)'],
  },
  {
    id: 'TCH-002',
    name: 'Prof. Sarah Jenkins',
    email: 'sarah.jenkins@demo.edu',
    department: 'Computer Science',
    phone: '+1 (555) 345-6789',
    subjects: ['Database Management Systems', 'Machine Learning'],
    assignedClasses: ['CS - 4th Sem (Sec A)', 'IT - 6th Sem'],
  },
  {
    id: 'TCH-003',
    name: 'Dr. Alan Turing',
    email: 'alan.turing@demo.edu',
    department: 'Artificial Intelligence',
    phone: '+1 (555) 456-7890',
    subjects: ['Operating Systems', 'Algorithms'],
    assignedClasses: ['CS - 4th Sem (Sec B)', 'AI & Data Science - 4th Sem'],
  },
];

export const initialStudents = [
  {
    id: 'STU-001',
    rollNo: 'CS2024-001',
    name: 'Alex Johnson',
    email: 'student@demo.edu',
    department: 'Computer Science',
    semester: '4th',
    classId: 'CLS-CS4A',
    className: 'CS - 4th Sem (Sec A)',
    attendancePct: 88,
  },
  {
    id: 'STU-002',
    rollNo: 'CS2024-002',
    name: 'Priya Sharma',
    email: 'priya.s@demo.edu',
    department: 'Computer Science',
    semester: '4th',
    classId: 'CLS-CS4A',
    className: 'CS - 4th Sem (Sec A)',
    attendancePct: 92,
  },
  {
    id: 'STU-003',
    rollNo: 'CS2024-003',
    name: 'Marcus Chen',
    email: 'marcus.c@demo.edu',
    department: 'Computer Science',
    semester: '4th',
    classId: 'CLS-CS4A',
    className: 'CS - 4th Sem (Sec A)',
    attendancePct: 68, // below threshold for demonstration
  },
  {
    id: 'STU-004',
    rollNo: 'CS2024-004',
    name: 'Emily Davis',
    email: 'emily.d@demo.edu',
    department: 'Computer Science',
    semester: '4th',
    classId: 'CLS-CS4A',
    className: 'CS - 4th Sem (Sec A)',
    attendancePct: 84,
  },
  {
    id: 'STU-005',
    rollNo: 'CS2024-005',
    name: 'Liam Wilson',
    email: 'liam.w@demo.edu',
    department: 'Computer Science',
    semester: '4th',
    classId: 'CLS-CS4A',
    className: 'CS - 4th Sem (Sec A)',
    attendancePct: 71, // below threshold
  },
  {
    id: 'STU-006',
    rollNo: 'CS2024-006',
    name: 'Sophia Martinez',
    email: 'sophia.m@demo.edu',
    department: 'Computer Science',
    semester: '4th',
    classId: 'CLS-CS4A',
    className: 'CS - 4th Sem (Sec A)',
    attendancePct: 95,
  },
];

// Helper to generate a mock SHA-256 hash
export const generateMockHash = (prefix = '0x') => {
  const chars = '0123456789abcdef';
  let hash = prefix;
  for (let i = 0; i < 40; i++) {
    hash += chars[Math.floor(Math.random() * chars.length)];
  }
  return hash;
};

export const initialAttendanceRecords = [
  {
    id: 'ATT-1001',
    studentId: 'STU-001',
    studentName: 'Alex Johnson',
    rollNo: 'CS2024-001',
    classId: 'CLS-CS4A',
    className: 'CS - 4th Sem (Sec A)',
    subjectId: 'SUB-BC401',
    subjectName: 'Blockchain Technology',
    date: '2026-10-25',
    time: '09:05 AM',
    status: 'Present',
    method: 'QR Scan',
    txHash: '0x8f4c2b9a1e3d7065f3a098c11e74b281cf67a309',
    blockNumber: 1845201,
  },
  {
    id: 'ATT-1002',
    studentId: 'STU-002',
    studentName: 'Priya Sharma',
    rollNo: 'CS2024-002',
    classId: 'CLS-CS4A',
    className: 'CS - 4th Sem (Sec A)',
    subjectId: 'SUB-BC401',
    subjectName: 'Blockchain Technology',
    date: '2026-10-25',
    time: '09:04 AM',
    status: 'Present',
    method: 'QR Scan',
    txHash: '0x3a7e91d04b68e42f95c10b78d264f3510e1927cb',
    blockNumber: 1845201,
  },
  {
    id: 'ATT-1003',
    studentId: 'STU-003',
    studentName: 'Marcus Chen',
    rollNo: 'CS2024-003',
    classId: 'CLS-CS4A',
    className: 'CS - 4th Sem (Sec A)',
    subjectId: 'SUB-BC401',
    subjectName: 'Blockchain Technology',
    date: '2026-10-25',
    time: '09:20 AM',
    status: 'Late',
    method: 'Manual Demo',
    txHash: '0x1c4d7b889e2f4a01c899321e90fa2b3c4d5e6f70',
    blockNumber: 1845202,
  },
  {
    id: 'ATT-1004',
    studentId: 'STU-001',
    studentName: 'Alex Johnson',
    rollNo: 'CS2024-001',
    classId: 'CLS-CS4A',
    className: 'CS - 4th Sem (Sec A)',
    subjectId: 'SUB-DB402',
    subjectName: 'Database Management Systems',
    date: '2026-10-24',
    time: '11:02 AM',
    status: 'Present',
    method: 'QR Scan',
    txHash: '0x7e8a9d104b68e42f95c10b78d264f3510e1927aa',
    blockNumber: 1845189,
  },
  {
    id: 'ATT-1005',
    studentId: 'STU-001',
    studentName: 'Alex Johnson',
    rollNo: 'CS2024-001',
    classId: 'CLS-CS4A',
    className: 'CS - 4th Sem (Sec A)',
    subjectId: 'SUB-CN403',
    subjectName: 'Computer Networks',
    date: '2026-10-23',
    time: '02:00 PM',
    status: 'Absent',
    method: 'System Mark',
    txHash: '0x2b3c4d5e6f701c4d7b889e2f4a01c899321e90fb',
    blockNumber: 1845170,
  },
];

export const initialSessions = [
  {
    id: 'SES-9001',
    token: 'QR-BC401-20261026-LIVE',
    classId: 'CLS-CS4A',
    className: 'CS - 4th Sem (Sec A)',
    subjectId: 'SUB-BC401',
    subjectName: 'Blockchain Technology',
    teacherId: 'TCH-001',
    teacherName: 'Dr. Robert Vance',
    createdAt: new Date().toISOString(),
    expiresAt: new Date(Date.now() + 60 * 60 * 1000).toISOString(), // 1 hour active for easy testing
    durationMinutes: 60,
    status: 'Active',
    attendeeCount: 2,
  },
];
