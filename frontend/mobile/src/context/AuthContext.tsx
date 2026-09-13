import React, { createContext, useContext, useEffect, useState } from 'react';
import { Session, User } from '@supabase/supabase-js';
import { usePostHog } from 'posthog-react-native';
import { ANALYTICS_EVENTS } from '../analytics/events';
import { supabase } from '../lib/supabase';

// Types
interface AuthContextType {
  user: User | null;
  session: Session | null;
  loading: boolean;
  signInWithPhone: (phone: string) => Promise<void>;
  verifyOTP: (phone: string, token: string) => Promise<void>;
  signOut: () => Promise<void>;
}

// Create Context
const AuthContext = createContext<AuthContextType>({} as AuthContextType);

// Provider
export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const posthog = usePostHog();
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Get initial session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      if (session?.user.id) posthog.identify(session.user.id);
      setLoading(false);
    });

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (_event, session) => {
        setSession(session);
        setUser(session?.user ?? null);
        if (session?.user.id) posthog.identify(session.user.id);
        setLoading(false);
      }
    );

    return () => subscription.unsubscribe();
  }, [posthog]);

  // Send OTP to phone
  const signInWithPhone = async (phone: string) => {
    try {
      const { error } = await supabase.auth.signInWithOtp({ phone });
      if (error) throw error;
      posthog.capture(ANALYTICS_EVENTS.OTP_SENT, { auth_method: 'sms' });
    } catch (error) {
      posthog.capture(ANALYTICS_EVENTS.OTP_FAILED, {
        auth_method: 'sms',
        stage: 'request',
      });
      posthog.captureException(new Error('OTP request failed'), { auth_method: 'sms' });
      throw error;
    }
  };

  // Verify OTP
  const verifyOTP = async (phone: string, token: string) => {
    try {
      const { data, error } = await supabase.auth.verifyOtp({
        phone,
        token,
        type: 'sms',
      });
      if (error) throw error;
      if (data.user?.id) posthog.identify(data.user.id);
      posthog.capture(ANALYTICS_EVENTS.OTP_VERIFIED, { auth_method: 'sms' });
    } catch (error) {
      posthog.capture(ANALYTICS_EVENTS.OTP_FAILED, {
        auth_method: 'sms',
        stage: 'verification',
      });
      posthog.captureException(new Error('OTP verification failed'), { auth_method: 'sms' });
      throw error;
    }
  };

  // Sign out
  const signOut = async () => {
    const { error } = await supabase.auth.signOut();
    if (error) throw error;
    posthog.capture(ANALYTICS_EVENTS.LOGOUT);
    posthog.reset();
  };

  return (
    <AuthContext.Provider value={{
      user,
      session,
      loading,
      signInWithPhone,
      verifyOTP,
      signOut,
    }}>
      {children}
    </AuthContext.Provider>
  );
};

// useAuth hook
export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
};