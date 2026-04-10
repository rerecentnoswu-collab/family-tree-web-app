import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../../../utils/supabase/client';
import { User, Session } from '@supabase/supabase-js';

export interface UseAuthReturn {
  user: User | null;
  session: Session | null;
  loading: boolean;
  error: string | null;
  isAuthenticated: boolean;
  signOut: () => Promise<void>;
  refreshSession: () => Promise<void>;
}

export const useAuth = (): UseAuthReturn => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Get current session
  const getSession = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      
      const { data: { session }, error: sessionError } = await supabase.auth.getSession();
      
      if (sessionError) {
        console.error('Session error:', sessionError);
        setError(sessionError.message);
        return;
      }
      
      if (session) {
        setUser(session.user);
        setSession(session);
        console.log('Session restored for user:', session.user.id);
      } else {
        setUser(null);
        setSession(null);
        console.log('No active session found');
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to get session';
      console.error('Error getting session:', errorMessage);
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  }, []);

  // Sign out
  const signOut = useCallback(async () => {
    try {
      const { error } = await supabase.auth.signOut();
      if (error) {
        console.error('Sign out error:', error);
        setError(error.message);
      } else {
        setUser(null);
        setSession(null);
        console.log('User signed out successfully');
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to sign out';
      console.error('Error signing out:', errorMessage);
      setError(errorMessage);
    }
  }, []);

  // Refresh session
  const refreshSession = useCallback(async () => {
    try {
      const { data: { session }, error } = await supabase.auth.refreshSession();
      
      if (error) {
        console.error('Session refresh error:', error);
        setError(error.message);
      } else if (session) {
        setUser(session.user);
        setSession(session);
        console.log('Session refreshed successfully');
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to refresh session';
      console.error('Error refreshing session:', errorMessage);
      setError(errorMessage);
    }
  }, []);

  // Set up auth state listener
  useEffect(() => {
    // Get initial session
    getSession();

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        console.log('Auth state changed:', event, session?.user?.id);
        
        if (session) {
          setUser(session.user);
          setSession(session);
          setError(null);
        } else {
          setUser(null);
          setSession(null);
        }
        
        setLoading(false);
      }
    );

    return () => {
      subscription.unsubscribe();
    };
  }, [getSession]);

  return {
    user,
    session,
    loading,
    error,
    isAuthenticated: !!user,
    signOut,
    refreshSession
  };
};
