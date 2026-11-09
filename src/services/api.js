import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || '/api';

export const apiClient = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 10000,
});

// Intercept requests to attach JWT auth token
apiClient.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('qr_att_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Intercept responses for global error handling
apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // Optional: Handle token expiration
    }
    return Promise.reject(error);
  }
);

export const authAPI = {
  login: (email, password, role) => apiClient.post('/auth/login', { email, password, role }),
  register: (data) => apiClient.post('/auth/register', data),
  logout: () => apiClient.post('/auth/logout'),
  getMe: () => apiClient.get('/auth/me'),
};

export const adminAPI = {
  getDashboard: () => apiClient.get('/admin/dashboard'),
  getStudents: () => apiClient.get('/admin/students'),
  createStudent: (data) => apiClient.post('/admin/students', data),
  updateStudent: (id, data) => apiClient.put(`/admin/students/${id}`, data),
  deleteStudent: (id) => apiClient.delete(`/admin/students/${id}`),

  getTeachers: () => apiClient.get('/admin/teachers'),
  createTeacher: (data) => apiClient.post('/admin/teachers', data),
  updateTeacher: (id, data) => apiClient.put(`/admin/teachers/${id}`, data),
  deleteTeacher: (id) => apiClient.delete(`/admin/teachers/${id}`),

  getClasses: () => apiClient.get('/admin/classes'),
  createClass: (data) => apiClient.post('/admin/classes', data),
  updateClass: (id, data) => apiClient.put(`/admin/classes/${id}`, data),
  deleteClass: (id) => apiClient.delete(`/admin/classes/${id}`),

  getSubjects: () => apiClient.get('/admin/subjects'),
  createSubject: (data) => apiClient.post('/admin/subjects', data),
  updateSubject: (id, data) => apiClient.put(`/admin/subjects/${id}`, data),
  deleteSubject: (id) => apiClient.delete(`/admin/subjects/${id}`),

  getAllAttendance: (params) => apiClient.get('/admin/attendance', { params }),
};

export const teacherAPI = {
  getDashboard: () => apiClient.get('/teacher/dashboard'),
  getClasses: () => apiClient.get('/teacher/classes'),
  getSubjects: () => apiClient.get('/teacher/subjects'),
  getStudents: (classId) => apiClient.get('/teacher/students', { params: classId ? { class_id: classId } : {} }),
  createSession: (data) => apiClient.post('/teacher/sessions', data),
  getSessions: () => apiClient.get('/teacher/sessions'),
  closeSession: (id) => apiClient.post(`/teacher/sessions/${id}/close`),
  getSessionAttendance: (sessionId) => apiClient.get(`/teacher/sessions/${sessionId}/attendance`),
  getAttendance: (params) => apiClient.get('/teacher/attendance', { params }),
  correctAttendance: (data) => apiClient.post('/teacher/attendance/correct', data),
  getProfile: () => apiClient.get('/teacher/profile'),
  updateProfile: (data) => apiClient.put('/teacher/profile', data),
};

export const studentAPI = {
  getDashboard: () => apiClient.get('/student/dashboard'),
  getSubjects: () => apiClient.get('/student/subjects'),
  getProfile: () => apiClient.get('/student/profile'),
  updateProfile: (data) => apiClient.put('/student/profile', data),
  scanAttendance: (token, method = 'QR Camera') => apiClient.post('/student/attendance/scan', { token, method }),
  getAttendance: () => apiClient.get('/student/attendance'),
};

export const blockchainAPI = {
  getStatus: () => apiClient.get('/blockchain/status'),
  getRecord: (id) => apiClient.get(`/blockchain/attendance/${id}`),
  getTransaction: (txHash) => apiClient.get(`/blockchain/transaction/${txHash}`),
  retrySubmission: (attendanceId) => apiClient.post(`/blockchain/retry/${attendanceId}`),
};

export const reportsAPI = {
  getAttendanceSummary: (params) => apiClient.get('/reports/attendance', { params }),
  getStudentReport: (studentId) => apiClient.get('/reports/student', { params: { student_id: studentId } }),
  getSubjectReport: (subjectId) => apiClient.get('/reports/subject', { params: { subject_id: subjectId } }),
  exportCsv: (params) => apiClient.get('/reports/export', { params, responseType: 'blob' }),
};

export default apiClient;
