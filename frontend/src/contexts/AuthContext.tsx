import React, { createContext, useContext, useState, useEffect } from 'react';
import { User, Role } from '../types';
import { api } from '../services/api';

export type UserRole = Role;

interface AuthContextType {
  user: User | null;
  role: Role | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  loginPatient: (token: string, user: User) => void;
  loginDoctor: (token: string, user: User) => void;
  loginAdmin: (token: string, user: User) => void;
  loginAsPatient: (identifier: string, otp: string) => Promise<void>;
  loginAsDoctor: (identifier: string, password: string) => Promise<any>;
  loginAsAdmin: (email: string, password: string) => Promise<void>;
  logout: () => void;
  refreshUser: () => Promise<void>;
  updateProfilePhoto: (photoUrl: string | null) => void;
  removeProfilePhoto: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(() => {
    const saved = localStorage.getItem('emr_user');
    return saved ? JSON.parse(saved) : null;
  });
  const [isLoading, setIsLoading] = useState<boolean>(true);

  const refreshUser = async () => {
    const token = localStorage.getItem('emr_token');
    if (!token) {
      setUser(null);
      setIsLoading(false);
      return;
    }

    try {
      const data = await api.getMe();
      if (data && data.success && data.user) {
        setUser(data.user);
        localStorage.setItem('emr_user', JSON.stringify(data.user));
      } else {
        localStorage.removeItem('emr_token');
        localStorage.removeItem('emr_user');
        setUser(null);
      }
    } catch {
      localStorage.removeItem('emr_token');
      localStorage.removeItem('emr_user');
      setUser(null);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    refreshUser();
  }, []);

  const loginPatient = (token: string, userData: User) => {
    localStorage.setItem('emr_token', token);
    localStorage.setItem('emr_user', JSON.stringify(userData));
    setUser(userData);
    setIsLoading(false);
  };

  const loginDoctor = (token: string, userData: User) => {
    localStorage.setItem('emr_token', token);
    localStorage.setItem('emr_user', JSON.stringify(userData));
    setUser(userData);
    setIsLoading(false);
  };

  const loginAdmin = (token: string, userData: User) => {
    localStorage.setItem('emr_token', token);
    localStorage.setItem('emr_user', JSON.stringify(userData));
    setUser(userData);
    setIsLoading(false);
  };

  const loginAsPatient = async (identifier: string, otp: string) => {
    const data = await api.patientVerifyOtp(identifier, otp);
    if (data && data.token && data.user) {
      loginPatient(data.token, data.user);
      return;
    }
    throw new Error(data?.message || data?.error || 'Authentication failed');
  };

  const loginAsDoctor = async (identifier: string, password: string) => {
    const data = await api.doctorLogin(identifier, password);
    if (data && data.token && data.user) {
      loginDoctor(data.token, data.user);
      return data;
    }
    throw new Error(data?.message || data?.error || 'Doctor authentication failed');
  };

  const loginAsAdmin = async (email: string, password: string) => {
    const data = await api.adminLogin(email, password);
    if (data && data.token && data.user) {
      loginAdmin(data.token, data.user);
      return;
    }
    throw new Error(data?.message || data?.error || 'Invalid administrative credentials.');
  };

  const updateProfilePhoto = (photoUrl: string | null) => {
    if (!user) return;
    const updatedUser: User = {
      ...user,
      profilePhoto: photoUrl,
      patient: user.patient ? { ...user.patient, profilePhoto: photoUrl } : undefined,
      doctor: user.doctor ? { ...user.doctor, profilePhoto: photoUrl || undefined } : undefined,
    };
    setUser(updatedUser);
    localStorage.setItem('emr_user', JSON.stringify(updatedUser));
  };

  const removeProfilePhoto = () => {
    updateProfilePhoto(null);
  };

  const logout = () => {
    localStorage.removeItem('emr_token');
    localStorage.removeItem('emr_user');
    setUser(null);
    window.location.href = '/';
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        role: user?.role || null,
        isAuthenticated: !!user && !!localStorage.getItem('emr_token'),
        isLoading,
        loginPatient,
        loginDoctor,
        loginAdmin,
        loginAsPatient,
        loginAsDoctor,
        loginAsAdmin,
        logout,
        refreshUser,
        updateProfilePhoto,
        removeProfilePhoto,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
