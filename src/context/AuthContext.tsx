import React, { createContext, useContext, useEffect, useState } from 'react';
import type { Session, User } from '@supabase/supabase-js';
import { supabase } from '../lib/supabase';
import type { UserProfile } from '../types/shipment';

interface AuthContextType {
  user: User | null;
  session: Session | null;
  profile: UserProfile | null;
  isInternal: boolean;
  loading: boolean;
  accessDeniedError: string | null;
  signOut: () => Promise<void>;
  refreshProfile: () => Promise<void>;
  clearAccessDenied: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [session, setSession] = useState<Session | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [accessDeniedError, setAccessDeniedError] = useState<string | null>(null);

  const fetchProfile = async (userId: string) => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('id, email, nickname, is_internal, company_id, status, created_at')
        .eq('id', userId)
        .single();

      if (error) {
        console.error('Error fetching profile in ERP:', error);
        return null;
      }
      return data as UserProfile;
    } catch (err) {
      console.error('Error in fetchProfile:', err);
      return null;
    }
  };

  const handleUserSession = async (currentSession: Session | null, isInitial = false) => {
    // Activar loader solo en carga inicial o cuando llega una sesión activa a validar
    if (isInitial || currentSession) {
      setLoading(true);
    }
    setAccessDeniedError(null);

    if (!currentSession?.user) {
      setSession(null);
      setUser(null);
      setProfile(null);
      setLoading(false);
      return;
    }

    const currentUser = currentSession.user;
    const currentProfile = await fetchProfile(currentUser.id);

    if (!currentProfile) {
      console.error('Perfil no encontrado para usuario:', currentUser.id);
      await supabase.auth.signOut();
      setSession(null);
      setUser(null);
      setProfile(null);
      setAccessDeniedError('No se encontró el perfil de colaborador asociado a esta cuenta.');
      setLoading(false);
      return;
    }

    // Validación de seguridad para Ingelox ERP (Exclusivo personal interno)
    if (currentProfile.status === 'inactive') {
      await supabase.auth.signOut();
      setSession(null);
      setUser(null);
      setProfile(null);
      setAccessDeniedError('Tu cuenta se encuentra inactiva. Contacta al administrador.');
      setLoading(false);
      return;
    }

    if (!currentProfile.is_internal) {
      await supabase.auth.signOut();
      setSession(null);
      setUser(null);
      setProfile(null);
      setAccessDeniedError('Acceso denegado: El ERP Ingelox es un centro de operaciones exclusivo para colaboradores internos. Si eres cliente, por favor ingresa al portal de seguimiento de clientes.');
      setLoading(false);
      return;
    }

    setSession(currentSession);
    setUser(currentUser);
    setProfile(currentProfile);
    setAccessDeniedError(null);
    setLoading(false);
  };

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      handleUserSession(session, true);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === 'SIGNED_IN' || event === 'SIGNED_OUT' || event === 'USER_UPDATED') {
        handleUserSession(session, false);
      }
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  const refreshProfile = async () => {
    if (user?.id) {
      const p = await fetchProfile(user.id);
      if (p) setProfile(p);
    }
  };

  const signOut = async () => {
    await supabase.auth.signOut();
    setSession(null);
    setUser(null);
    setProfile(null);
  };

  const clearAccessDenied = () => {
    setAccessDeniedError(null);
  };

  const isInternal = Boolean(profile?.is_internal);

  return (
    <AuthContext.Provider
      value={{
        user,
        session,
        profile,
        isInternal,
        loading,
        accessDeniedError,
        signOut,
        refreshProfile,
        clearAccessDenied,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
