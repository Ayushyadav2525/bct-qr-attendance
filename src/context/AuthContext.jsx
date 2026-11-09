import React, { createContext, useContext, useState, useEffect } from 'react';

const AuthContext = createContext();

const DEFAULT_USERS = {
  admin: {
    id: 'ADM-001',
    name: 'Dr. Arthur Pendelton',
    email: 'admin@demo.edu',
    role: 'admin',
    department: 'Administration',
    avatar: 'A',
  },
  teacher: {
    id: 'TCH-001',
    name: 'Dr. Robert Vance',
    email: 'teacher@demo.edu',
    role: 'teacher',
    department: 'Computer Science',
    subjects: ['Blockchain Technology', 'Computer Networks'],
    assignedClasses: ['CS - 4th Sem (Sec A)', 'CS - 4th Sem (Sec B)'],
    avatar: 'RV',
  },
  student: {
    id: 'STU-001',
    name: 'Alex Johnson',
    email: 'student@demo.edu',
    role: 'student',
    rollNo: 'CS2024-001',
    department: 'Computer Science',
    semester: '4th',
    classId: 'CLS-CS4A',
    className: 'CS - 4th Sem (Sec A)',
    avatar: 'AJ',
  },
};

import { authAPI } from '../services/api';

export const AuthProvider = ({ children }) => {
  const [currentUser, setCurrentUser] = useState(() => {
    const saved = localStorage.getItem('qr_att_auth_user');
    return saved ? JSON.parse(saved) : DEFAULT_USERS.admin; // default to admin for seamless first view
  });
  const [authToken, setAuthToken] = useState(() => localStorage.getItem('qr_att_token') || null);

  useEffect(() => {
    if (currentUser) {
      localStorage.setItem('qr_att_auth_user', JSON.stringify(currentUser));
    } else {
      localStorage.removeItem('qr_att_auth_user');
    }
  }, [currentUser]);

  useEffect(() => {
    if (authToken) {
      localStorage.setItem('qr_att_token', authToken);
    } else {
      localStorage.removeItem('qr_att_token');
    }
  }, [authToken]);

  const loginAsRole = async (role) => {
    const defaultUser = DEFAULT_USERS[role] || DEFAULT_USERS.admin;
    const email = defaultUser.email;
    const password = 'password123';

    try {
      const res = await authAPI.login(email, password, role);
      if (res.data?.success && res.data?.token) {
        localStorage.setItem('qr_att_token', res.data.token);
        setAuthToken(res.data.token);
        const mergedUser = { ...defaultUser, ...res.data.user };
        localStorage.setItem('qr_att_auth_user', JSON.stringify(mergedUser));
        setCurrentUser(mergedUser);
        return mergedUser;
      }
    } catch (e) {
      // Backend offline, fallback to local persona
    }

    setCurrentUser(defaultUser);
    return defaultUser;
  };

  const loginCustom = async (email, password, role) => {
    if (!email || !password) {
      return { success: false, error: 'Please enter both email and password.' };
    }

    try {
      const res = await authAPI.login(email, password, role);
      if (res.data?.success && res.data?.token) {
        localStorage.setItem('qr_att_token', res.data.token);
        setAuthToken(res.data.token);
        const template = DEFAULT_USERS[role] || DEFAULT_USERS.student;
        const user = { ...template, ...res.data.user };
        localStorage.setItem('qr_att_auth_user', JSON.stringify(user));
        setCurrentUser(user);
        return { success: true, user };
      }
    } catch (err) {
      // If server responded with 401 or error message, report it; if connection refused, use fallback
      if (err.response?.data?.error) {
        return { success: false, error: err.response.data.error };
      }
    }

    // Offline fallback
    const template = DEFAULT_USERS[role] || DEFAULT_USERS.student;
    const user = { ...template, email };
    setCurrentUser(user);
    return { success: true, user };
  };

  const logout = () => {
    try {
      authAPI.logout().catch(() => {});
    } catch (e) {}
    localStorage.removeItem('qr_att_token');
    localStorage.removeItem('qr_att_auth_user');
    setAuthToken(null);
    setCurrentUser(null);
  };

  return (
    <AuthContext.Provider value={{ currentUser, authToken, loginAsRole, loginCustom, logout, DEFAULT_USERS }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
