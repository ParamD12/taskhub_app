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
    const savedSession = sessionStorage.getItem(SESSION_STORAGE_KEY);
    return savedSession ? JSON.parse(savedSession) : null;
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

  useEffect(() => {
    const initializeAuth = async () => {
      try {
        const { data: { session }, error } = await supabase.auth.getSession();
        
        if (error || !session) {
          clearAuthState();
          setLoading(false);
          return;
        }

        // Get user profile details
        const { data: profileData, error: profileError } = await supabase
          .from('users')
          .select('name, dob')
          .eq('user_id', session.user.id)
          .maybeSingle();

        if (profileError || !profileData) {
          throw new Error('Failed to fetch user profile');
        }

        const userData = {
          id: session.user.id,
          name: profileData.name,
          email: session.user.email!,
          dob: profileData.dob
        };

        setUser(userData);
        sessionStorage.setItem(SESSION_STORAGE_KEY, JSON.stringify(userData));
        
      } catch (error) {
        console.error('Auth initialization error:', error);
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
            return;
          }

          const { data: profileData, error: profileError } = await supabase
            .from('users')
            .select('name, dob')
            .eq('user_id', session.user.id)
            .maybeSingle();

          if (profileError || !profileData) {
            throw new Error('Failed to fetch user profile');
          }

          const userData = {
            id: session.user.id,
            name: profileData.name,
            email: session.user.email!,
            dob: profileData.dob
          };

          setUser(userData);
          sessionStorage.setItem(SESSION_STORAGE_KEY, JSON.stringify(userData));
          
          if (!localStorage.getItem('justRegistered')) {
            navigate('/');
          }
        } catch (error) {
          console.error('Auth state change error:', error);
          clearAuthState();
          navigate('/login');
        }
      } else if (event === 'SIGNED_OUT' || event === 'USER_DELETED') {
        clearAuthState();
        navigate('/login');
      }
    });

    return () => {
      subscription.unsubscribe();
    };
  }, [navigate]);

  const signUp = async (email: string, password: string, name: string, dob: string) => {
    try {
      setLoading(true);
      localStorage.setItem('justRegistered', 'true');
      
      const { data, error } = await supabase.auth.signUp({ 
        email, 
        password,
        options: {
          emailRedirectTo: `${window.location.origin}/login`
        }
      });

      if (error) throw error;
      if (!data.user) throw new Error('User creation failed');

      const { error: profileError } = await supabase.from('users').insert({
        user_id: data.user.id,
        name,
        email,
        dob
      });

      if (profileError) throw profileError;

      toast.success('Account created successfully! Please sign in.');
      navigate('/login');
    } catch (error: any) {
      toast.error(error.message || 'Registration failed');
      console.error('Registration error:', error);
      localStorage.removeItem('justRegistered');
    } finally {
      setLoading(false);
    }
  };

  const signIn = async (email: string, password: string) => {
    try {
      setLoading(true);
      
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password
      });

      if (error) throw error;
      
      toast.success('Signed in successfully!');
    } catch (error: any) {
      toast.error(error.message || 'Sign in failed');
      console.error('Sign in error:', error);
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
      toast.error(error.message || 'Sign out failed');
      console.error('Sign out error:', error);
    } finally {
      setLoading(false);
    }
  };

  const updateProfile = async (name: string, password?: string) => {
    try {
      setLoading(true);
      
      if (!user) throw new Error('No user logged in');

      if (password) {
        const { error: passwordError } = await supabase.auth.updateUser({
          password
        });
        
        if (passwordError) throw passwordError;
      }
      
      const { error: profileError } = await supabase
        .from('users')
        .update({ name })
        .eq('user_id', user.id);
        
      if (profileError) throw profileError;
      
      const updatedUser = { ...user, name };
      setUser(updatedUser);
      sessionStorage.setItem(SESSION_STORAGE_KEY, JSON.stringify(updatedUser));
      
      toast.success('Profile updated successfully');
    } catch (error: any) {
      toast.error(error.message || 'Profile update failed');
      console.error('Profile update error:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthContext.Provider value={{ user, loading, signUp, signIn, signOut, updateProfile }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
