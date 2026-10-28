import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { AppRole, Staff } from '../types';
import { supabase } from '../lib/supabase';

interface AuthContextType {
  currentRole: AppRole | null;
  currentStaff: Staff | null;
  isStaff: boolean;
  isLoading: boolean;
  authError: string | null;
  signIn: (email: string, password: string) => Promise<void>;
  signOut: () => Promise<void>;
  canViewRevenue: boolean;
  canManageSettings: boolean;
  canManageStaff: boolean;
  canManageContent: boolean;
  canEditBookings: boolean;
  isTechnician: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [currentStaff, setCurrentStaff] = useState<Staff | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [authError, setAuthError] = useState<string | null>(null);
  const currentRole = currentStaff?.role ?? null;
  const isStaff = Boolean(currentStaff && currentStaff.isActive);

  useEffect(() => {
    let isMounted = true;

    if (!supabase) {
      setIsLoading(false);
      setAuthError('Staff sign-in is not configured for this deployment.');
      return () => { isMounted = false; };
    }

    const loadStaffProfile = async (userId: string) => {
      setIsLoading(true);
      const { data, error } = await supabase
        .from('staff_profiles')
        .select('*')
        .eq('auth_user_id', userId)
        .eq('is_active', true)
        .maybeSingle();

      if (!isMounted) return;

      if (error) {
        setCurrentStaff(null);
        setAuthError('We could not verify staff access. Please try again or contact the site owner.');
        setIsLoading(false);
        return;
      }

      if (!data) {
        setCurrentStaff(null);
        setAuthError('This account does not have an active staff profile.');
        setIsLoading(false);
        return;
      }

      setCurrentStaff({
        id: data.id,
        fullName: data.full_name,
        email: data.email,
        phone: data.phone || '',
        role: data.role as AppRole,
        isActive: Boolean(data.is_active),
        avatarUrl: data.avatar_url || undefined,
        specializationEn: data.specialization_en || undefined,
        specializationUr: data.specialization_ur || undefined,
      });
      setAuthError(null);
      setIsLoading(false);
    };

    const { data: authListener } = supabase.auth.onAuthStateChange((_event, session) => {
      const userId = session?.user?.id;
      if (!userId) {
        setCurrentStaff(null);
        setAuthError(null);
        setIsLoading(false);
        return;
      }
      // Defer database access outside the auth callback to avoid holding its internal lock.
      Promise.resolve().then(() => loadStaffProfile(userId));
    });

    void supabase.auth.getSession().then(({ data, error }) => {
      if (!isMounted) return;
      if (error) {
        setCurrentStaff(null);
        setAuthError('We could not check your session. Please sign in again.');
        setIsLoading(false);
        return;
      }
      if (!data.session?.user?.id) {
        setCurrentStaff(null);
        setAuthError(null);
        setIsLoading(false);
        return;
      }
      void loadStaffProfile(data.session.user.id);
    });

    return () => {
      isMounted = false;
      authListener.subscription.unsubscribe();
    };
  }, []);

  const signIn = useCallback(async (email: string, password: string) => {
    if (!supabase) {
      const message = 'Staff sign-in is not configured for this deployment.';
      setAuthError(message);
      throw new Error(message);
    }
    setAuthError(null);
    const { error } = await supabase.auth.signInWithPassword({
      email: email.trim(),
      password,
    });
    if (error) {
      const message = error.message === 'Invalid login credentials'
        ? 'Email or password is incorrect.'
        : 'We could not sign you in. Check your details and try again.';
      setAuthError(message);
      throw new Error(message);
    }
  }, []);

  const signOut = useCallback(async () => {
    if (!supabase) {
      setCurrentStaff(null);
      return;
    }
    const { error } = await supabase.auth.signOut();
    if (error) {
      setAuthError('Sign-out failed. Please try again.');
      throw error;
    }
    setCurrentStaff(null);
    setAuthError(null);
  }, []);

  const value = useMemo<AuthContextType>(() => ({
    currentRole,
    currentStaff,
    isStaff,
    isLoading,
    authError,
    signIn,
    signOut,
    canViewRevenue: currentRole === 'owner',
    canManageSettings: currentRole === 'owner',
    canManageStaff: currentRole === 'owner',
    canManageContent: currentRole === 'owner' || currentRole === 'content_editor',
    canEditBookings: currentRole === 'owner' || currentRole === 'booking_manager',
    isTechnician: currentRole === 'technician',
  }), [currentRole, currentStaff, isStaff, isLoading, authError, signIn, signOut]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
