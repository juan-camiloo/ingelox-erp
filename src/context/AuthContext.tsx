import React, { createContext, useContext, useEffect, useRef, useState } from 'react';
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

  const profilePromiseRef = useRef<Promise<UserProfile | null> | null>(null);
  const fetchingUserIdRef = useRef<string | null>(null);

  const fetchProfile = async (userId: string): Promise<UserProfile | null> => {
    // Si ya existe una consulta HTTP en curso para este mismo usuario, reutilizar la misma promesa
    // para evitar peticiones duplicadas a la red.
    if (fetchingUserIdRef.current === userId && profilePromiseRef.current) {
      return profilePromiseRef.current;
    }

    fetchingUserIdRef.current = userId;
    const fetchPromise = (async () => {
      try {
        // Se seleccionan únicamente los campos indispensables para el ERP (email, nickname, is_internal, status).
        // Se excluyen deliberadamente 'id' y 'company_id' de la consulta a la API de Supabase para evitar
        // que estos identificadores se transmitan o filtren en las respuestas HTTP visibles en la red.
        const { data, error } = await supabase
          .from('profiles')
          .select('email, nickname, is_internal, status')
          .eq('id', userId)
          .single();

        if (error) {
          console.error('Error fetching profile in ERP:', error);
          return null;
        }

        // El 'id' se asocia en memoria local a partir del ID verificado de la sesión de autenticación (auth.uid()),
        // garantizando compatibilidad total con auditorías (updated_by, created_by) sin exponerlo en la respuesta HTTP.
        return {
          ...(data as Omit<UserProfile, 'id'>),
          id: userId,
        } as UserProfile;
      } catch (err) {
        console.error('Error in fetchProfile:', err);
        return null;
      } finally {
        profilePromiseRef.current = null;
        fetchingUserIdRef.current = null;
      }
    })();

    profilePromiseRef.current = fetchPromise;
    return fetchPromise;
  };

  const handleUserSession = async (currentSession: Session | null, isInitial = false) => {
    // Solo activar loader en carga inicial si aún no tenemos perfil ni sesión
    if (isInitial && !profile) {
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

    // Si ya tenemos el perfil de este usuario en memoria, actualizamos la sesión sin reconsultar
    if (profile && profile.id === currentUser.id && user?.id === currentUser.id) {
      setSession(currentSession);
      setLoading(false);
      return;
    }

    const currentProfile = await fetchProfile(currentUser.id);

    if (!currentProfile) {
      console.error('Perfil no encontrado para la cuenta autenticada.');
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
