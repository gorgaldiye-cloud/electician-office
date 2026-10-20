import React, { createContext, useContext, useState } from 'react';
import { AppRole, Staff } from '../types';
import { repository } from '../data';

interface AuthContextType {
  currentRole: AppRole;
  currentStaff: Staff;
  setRole: (role: AppRole) => void;
  isStaff: boolean;
  canViewRevenue: boolean;
  canManageSettings: boolean;
  canManageStaff: boolean;
  canManageContent: boolean;
  canEditBookings: boolean;
  isTechnician: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [currentRole, setCurrentRole] = useState<AppRole>('owner');

  const allStaff = repository.getStaff();
  const currentStaff = allStaff.find((s) => s.role === currentRole) || allStaff[0];

  const setRole = (role: AppRole) => {
    setCurrentRole(role);
  };

  // RBAC matrix matching Doc 01 §G
  const canViewRevenue = currentRole === 'owner';
  const canManageSettings = currentRole === 'owner';
  const canManageStaff = currentRole === 'owner';
  const canManageContent = currentRole === 'owner' || currentRole === 'content_editor';
  const canEditBookings = currentRole === 'owner' || currentRole === 'booking_manager';
  const isTechnician = currentRole === 'technician';

  return (
    <AuthContext.Provider
      value={{
        currentRole,
        currentStaff,
        setRole,
        isStaff: true,
        canViewRevenue,
        canManageSettings,
        canManageStaff,
        canManageContent,
        canEditBookings,
        isTechnician,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
