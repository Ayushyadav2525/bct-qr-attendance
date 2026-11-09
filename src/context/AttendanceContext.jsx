import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { storage, initializeStorage } from '../services/storage';
import { adminAPI, teacherAPI, studentAPI } from '../services/api';
import { useAuth } from './AuthContext';

const AttendanceContext = createContext();

export const AttendanceProvider = ({ children }) => {
  const { currentUser } = useAuth();

  const [students, setStudents] = useState([]);
  const [teachers, setTeachers] = useState([]);
  const [classes, setClasses] = useState([]);
  const [subjects, setSubjects] = useState([]);
  const [records, setRecords] = useState([]);
  const [sessions, setSessions] = useState([]);
  const [toasts, setToasts] = useState([]);
  const [isBackendConnected, setIsBackendConnected] = useState(false);

  // Toast notification system
  const addToast = useCallback((message, type = 'info') => {
    const id = Date.now() + Math.random();
    setToasts((prev) => [...prev, { id, message, type }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 4500);
  }, []);

  const removeToast = useCallback((id) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  // Initialize and load from live backend or fallback to local storage
  const refreshData = useCallback(async () => {
    const role = currentUser?.role || 'admin';

    try {
      if (role === 'admin') {
        const [stuRes, tchRes, clsRes, subRes, attRes, sesRes] = await Promise.all([
          adminAPI.getStudents(),
          adminAPI.getTeachers(),
          adminAPI.getClasses(),
          adminAPI.getSubjects(),
          adminAPI.getAllAttendance(),
          teacherAPI.getSessions(),
        ]);

        if (stuRes.data?.success && tchRes.data?.success) {
          setStudents(stuRes.data.students || []);
          setTeachers(tchRes.data.teachers || []);
          setClasses(clsRes.data.classes || []);
          setSubjects(subRes.data.subjects || []);
          setRecords(attRes.data.records || []);
          setSessions(sesRes.data.sessions || []);
          setIsBackendConnected(true);
          return;
        }
      } else if (role === 'teacher') {
        const [clsRes, subRes, sesRes, attRes, stuRes] = await Promise.all([
          teacherAPI.getClasses(),
          teacherAPI.getSubjects(),
          teacherAPI.getSessions(),
          teacherAPI.getAttendance(),
          teacherAPI.getStudents(),
        ]);

        if (clsRes.data?.success && subRes.data?.success) {
          setClasses(clsRes.data.classes || []);
          setSubjects(subRes.data.subjects || []);
          setSessions(sesRes.data.sessions || []);
          setRecords(attRes.data.records || []);
          setStudents(stuRes.data?.students || []);
          setIsBackendConnected(true);
          return;
        }
      } else if (role === 'student') {
        const [dashRes, attRes, subRes] = await Promise.all([
          studentAPI.getDashboard(),
          studentAPI.getAttendance(),
          studentAPI.getSubjects(),
        ]);

        if (dashRes.data?.success) {
          setRecords(attRes.data?.records || []);
          setSubjects(subRes.data?.subjects || []);
          setIsBackendConnected(true);
          return;
        }
      }
    } catch (err) {
      console.warn('Backend query error, using local fallback if needed:', err);
      setIsBackendConnected(false);
    }

    // Fallback LocalStorage initialization
    initializeStorage();
    setStudents(storage.getStudents());
    setTeachers(storage.getTeachers());
    setClasses(storage.getClasses());
    setSubjects(storage.getSubjects());
    setRecords(storage.getRecords());
    setSessions(storage.getSessions());
  }, [currentUser]);

  useEffect(() => {
    refreshData();
  }, [refreshData]);

  // Student operations
  const saveStudent = async (studentData) => {
    try {
      if (studentData.id && typeof studentData.id === 'string' && studentData.id.startsWith('STU-')) {
        await adminAPI.updateStudent(studentData.id, studentData);
      } else {
        await adminAPI.createStudent(studentData);
      }
      await refreshData();
      addToast(`Student ${studentData.name} saved in database.`, 'success');
      return;
    } catch (e) {
      // Offline fallback
    }

    const updated = storage.saveStudent(studentData);
    setStudents(updated);
    addToast(`Student ${studentData.name} saved successfully.`, 'success');
  };

  const deleteStudent = async (id) => {
    try {
      await adminAPI.deleteStudent(id);
      await refreshData();
      addToast('Student record deleted from database.', 'info');
      return;
    } catch (e) {}

    const updated = storage.deleteStudent(id);
    setStudents(updated);
    addToast('Student record deleted.', 'info');
  };

  // Teacher operations
  const saveTeacher = async (teacherData) => {
    try {
      if (teacherData.id && typeof teacherData.id === 'string' && teacherData.id.startsWith('TCH-')) {
        await adminAPI.updateTeacher(teacherData.id, teacherData);
      } else {
        await adminAPI.createTeacher(teacherData);
      }
      await refreshData();
      addToast(`Faculty member ${teacherData.name} saved.`, 'success');
      return;
    } catch (e) {}

    const updated = storage.saveTeacher(teacherData);
    setTeachers(updated);
    addToast(`Faculty member ${teacherData.name} saved.`, 'success');
  };

  const deleteTeacher = async (id) => {
    try {
      await adminAPI.deleteTeacher(id);
      await refreshData();
      addToast('Faculty member removed from database.', 'info');
      return;
    } catch (e) {}

    const updated = storage.deleteTeacher(id);
    setTeachers(updated);
    addToast('Faculty member removed.', 'info');
  };

  // Class & Subject operations
  const saveClass = async (classData) => {
    try {
      if (classData.id && classData.id.startsWith('CLS-')) {
        await adminAPI.updateClass(classData.id, classData);
      } else {
        await adminAPI.createClass(classData);
      }
      await refreshData();
      addToast(`Class ${classData.name} saved.`, 'success');
      return;
    } catch (e) {}

    const updated = storage.saveClass(classData);
    setClasses(updated);
    addToast(`Class ${classData.name} saved.`, 'success');
  };

  const deleteClass = async (id) => {
    try {
      await adminAPI.deleteClass(id);
      await refreshData();
      addToast('Class removed.', 'info');
      return;
    } catch (e) {}

    const updated = storage.deleteClass(id);
    setClasses(updated);
    addToast('Class removed.', 'info');
  };

  const saveSubject = async (subjectData) => {
    try {
      if (subjectData.id && subjectData.id.startsWith('SUB-')) {
        await adminAPI.updateSubject(subjectData.id, subjectData);
      } else {
        await adminAPI.createSubject(subjectData);
      }
      await refreshData();
      addToast(`Subject ${subjectData.name} saved.`, 'success');
      return;
    } catch (e) {}

    const updated = storage.saveSubject(subjectData);
    setSubjects(updated);
    addToast(`Subject ${subjectData.name} saved.`, 'success');
  };

  const deleteSubject = async (id) => {
    try {
      await adminAPI.deleteSubject(id);
      await refreshData();
      addToast('Subject removed.', 'info');
      return;
    } catch (e) {}

    const updated = storage.deleteSubject(id);
    setSubjects(updated);
    addToast('Subject removed.', 'info');
  };

  // QR Session operations
  const createSession = async (payload) => {
    try {
      const res = await teacherAPI.createSession(payload);
      if (res.data?.success && res.data?.session) {
        const newSession = res.data.session;
        if (newSession.status === 'OPEN' || newSession.status === 'Active') {
          setSessions((prev) => [newSession, ...prev.filter((s) => s.id !== newSession.id)]);
          addToast(`Live QR session generated for ${newSession.subjectName}!`, 'success');
          return newSession;
        } else {
          addToast(`Session returned unexpected status: ${newSession.status}. Expected OPEN.`, 'error');
          return null;
        }
      } else {
        const errMsg = res.data?.error || 'Failed to create attendance session.';
        addToast(errMsg, 'error');
        return null;
      }
    } catch (err) {
      const errMsg = err.response?.data?.error || 'Failed to create attendance session from server.';
      addToast(errMsg, 'error');
      return null;
    }
  };

  const closeSession = async (sessionId) => {
    try {
      const res = await teacherAPI.closeSession(sessionId);
      if (res.data?.success) {
        setSessions((prev) =>
          prev.map((s) => (s.id === sessionId ? { ...s, status: 'Closed' } : s))
        );
        addToast('Session closed successfully.', 'info');
        return;
      }
    } catch (err) {
      const errMsg = err.response?.data?.error || 'Failed to close session.';
      addToast(errMsg, 'error');
    }

    const updated = storage.closeSession(sessionId);
    setSessions(updated);
    addToast('Session expired/closed.', 'info');
  };

  const getSessionAttendance = async (sessionId) => {
    try {
      const res = await teacherAPI.getSessionAttendance(sessionId);
      if (res.data?.success) {
        return res.data;
      }
    } catch (err) {
      // Fallback
    }
    return storage.getSessionAttendance(sessionId);
  };

  const correctAttendance = async ({ attendanceId, status, reason }) => {
    try {
      const res = await teacherAPI.correctAttendance({ attendanceId, status, reason });
      if (res.data?.success) {
        addToast(res.data.message || 'Attendance status corrected.', 'success');
        await refreshData();
        return res.data;
      }
    } catch (err) {
      const errMsg = err.response?.data?.error || 'Failed to correct attendance.';
      addToast(errMsg, 'error');
      return { success: false, error: errMsg };
    }
  };

  // Mark Attendance with backend validation & blockchain
  const markAttendance = async ({ token, studentId, method = 'QR Scan' }) => {
    try {
      const res = await studentAPI.scanAttendance(token, method);
      if (res.data?.success) {
        await refreshData();
        addToast(res.data.message || 'Attendance verified and recorded!', 'success');
        return {
          success: true,
          message: res.data.message,
          record: res.data.record,
          blockchain: res.data.blockchain,
        };
      }
    } catch (err) {
      if (err.response?.data?.error) {
        const errorMsg = err.response.data.error;
        addToast(errorMsg, 'error');
        return { success: false, error: errorMsg };
      }
    }

    // Fallback if backend offline
    const result = storage.markAttendance({ token, studentId, method });
    if (result.success) {
      setRecords(storage.getRecords());
      setSessions(storage.getSessions());
      addToast(result.message, 'success');
    } else {
      addToast(result.error, 'error');
    }
    return result;
  };

  const resetAllData = () => {
    storage.resetDemoData();
    refreshData();
    addToast('Demo database restored to default factory state.', 'info');
  };

  // Computed metrics
  const totalStudents = students.length;
  const totalTeachers = teachers.length;
  const totalClasses = classes.length;
  const totalSubjects = subjects.length;

  const presentCount = records.filter((r) => r.status === 'Present' || r.status === 'Late').length;
  const overallPercentage = records.length > 0 ? Math.round((presentCount / records.length) * 100) : 85;

  return (
    <AttendanceContext.Provider
      value={{
        students,
        teachers,
        classes,
        subjects,
        records,
        sessions,
        toasts,
        isBackendConnected,
        addToast,
        removeToast,
        refreshData,
        saveStudent,
        deleteStudent,
        saveTeacher,
        deleteTeacher,
        saveClass,
        deleteClass,
        saveSubject,
        deleteSubject,
        createSession,
        closeSession,
        getSessionAttendance,
        correctAttendance,
        markAttendance,
        resetAllData,
        metrics: {
          totalStudents,
          totalTeachers,
          totalClasses,
          totalSubjects,
          overallPercentage,
          totalRecords: records.length,
        },
      }}
    >
      {children}
    </AttendanceContext.Provider>
  );
};

export const useAttendance = () => useContext(AttendanceContext);
