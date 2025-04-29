import React, { createContext, useContext, useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { User } from '../types';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';

type AuthContextType = {
  user: User | null;
  loading: boolean;
  signUp: (email: string, password: string, name: string, dob: string) => Promise<void>;
  signIn: (email: string, password: string) => Promise<void>;
  signOut: () => Promise<void>;
  updateProfile: (name: string, password?: string) => Promise<void>;
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);
const SESSION_STORAGE_KEY = 'app_session';

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(() => {
    const saved = sessionStorage.getItem(SESSION_STORAGE_KEY);
    return saved ? JSON.parse(saved) : null;
  });
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  const clearAuthState = () => {
    setUser(null);
    sessionStorage.removeItem(SESSION_STORAGE_KEY);
    localStorage.removeItem('supabase.auth.token');
    localStorage.removeItem('supabase.auth.refreshToken');
    localStorage.removeItem('justRegistered');
  };

  const fetchUserProfile = async (sessionUser: any): Promise<User | null> => {
    const { data, error } = await supabase
      .from('users')
      .select('name, dob')
      .eq('user_id', sessionUser.id)
      .maybeSingle();

    if (error || !data) {
      console.error('Failed to fetch user profile:', error);
      return null;
    }

    return {
      id: sessionUser.id,
      name: data.name,
      email: sessionUser.email!,
      dob: data.dob,
    };
  };

  useEffect(() => {
    const initializeAuth = async () => {
      try {
        const { data: { session }, error } = await supabase.auth.getSession();
        if (error || !session) throw new Error('No valid session found');

        const profile = await fetchUserProfile(session.user);
        if (!profile) throw new Error('Profile load failed');

        setUser(profile);
        sessionStorage.setItem(SESSION_STORAGE_KEY, JSON.stringify(profile));
      } catch (err) {
        clearAuthState();
      } finally {
        setLoading(false);
      }
    };

    initializeAuth();

    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (event === 'SIGNED_IN' && session) {
        try {
          if (localStorage.getItem('justRegistered')) {
            localStorage.removeItem('justRegistered');
            setLoading(false); // ✅ Fix: ensure loading false
            return;
          }

          const profile = await fetchUserProfile(session.user);
          if (!profile) throw new Error('Profile fetch failed');

          setUser(profile);
          sessionStorage.setItem(SESSION_STORAGE_KEY, JSON.stringify(profile));
          navigate('/');
        } catch (err) {
          clearAuthState();
          navigate('/login');
        } finally {
          setLoading(false); // ✅ Ensure loading false in all cases
        }
      } else if (event === 'SIGNED_OUT' || event === 'USER_DELETED') {
        clearAuthState();
        setLoading(false); // ✅ Ensure loading false on sign out
        navigate('/login');
      }
    });

    return () => subscription.unsubscribe();
  }, [navigate]);

  const signUp = async (email: string, password: string, name: string, dob: string) => {
    try {
      setLoading(true);
      localStorage.setItem('justRegistered', 'true');

      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: { emailRedirectTo: `${window.location.origin}/login` }
      });

      if (error || !data.user) throw new Error('User registration failed');

      const { error: profileError } = await supabase.from('users').insert({
        user_id: data.user.id,
        name,
        email,
        dob,
      });

      if (profileError) throw profileError;

      toast.success('Account created. Please sign in.');
      navigate('/login');
    } catch (error: any) {
      toast.error(error.message || 'Registration failed');
      localStorage.removeItem('justRegistered');
    } finally {
      setLoading(false);
    }
  };

  const signIn = async (email: string, password: string) => {
    try {
      setLoading(true);
      const { error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) throw error;
      toast.success('Signed in successfully');
    } catch (error: any) {
      toast.error(error.message || 'Sign-in failed');
      clearAuthState();
    } finally {
      setLoading(false);
    }
  };

  const signOut = async () => {
    try {
      setLoading(true);
      const { error } = await supabase.auth.signOut();
      if (error) throw error;
      clearAuthState();
      navigate('/login');
      toast.success('Signed out successfully');
    } catch (error: any) {
      toast.error(error.message || 'Sign-out failed');
    } finally {
      setLoading(false);
    }
  };

  const updateProfile = async (name: string, password?: string) => {
    try {
      setLoading(true);
      if (!user) throw new Error('No user logged in');

      if (password) {
        const { error } = await supabase.auth.updateUser({ password });
        if (error) throw error;
      }

      const { error } = await supabase
        .from('users')
        .update({ name })
        .eq('user_id', user.id);

      if (error) throw error;

      const updatedUser = { ...user, name };
      setUser(updatedUser);
      sessionStorage.setItem(SESSION_STORAGE_KEY, JSON.stringify(updatedUser));
      toast.success('Profile updated successfully');
    } catch (error: any) {
      toast.error(error.message || 'Profile update failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthContext.Provider value={{ user, loading, signUp, signIn, signOut, updateProfile }}>
      {loading ? <div>Loading...</div> : children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within an AuthProvider');
  return context;
};
