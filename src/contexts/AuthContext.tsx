
import React, { createContext, useState, useEffect, useContext } from 'react';
import { supabase } from '@/integrations/supabase/client';
import type { User, Session } from '@supabase/supabase-js';
import { useToast } from '@/hooks/use-toast';

type UserData = {
  id: string;
  email?: string;
  username?: string;
  avatar_url?: string;
  coins: number;
  isGuest: boolean;
  role?: 'user' | 'admin';
};

interface AuthContextType {
  user: UserData | null;
  session: Session | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<{
    error: Error | null;
  }>;
  signUp: (email: string, password: string, username?: string) => Promise<{
    error: Error | null;
  }>;
  signOut: () => Promise<void>;
  resetPassword: (email: string) => Promise<{
    error: Error | null;
  }>;
  continueAsGuest: () => Promise<void>;
  updateUserCoins: (amount: number) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [user, setUser] = useState<UserData | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  // Helper function to fetch user profile
  const fetchUserProfile = async (userId: string) => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single();

      if (error) {
        throw error;
      }

      if (data) {
        setUser({
          id: data.id,
          email: session?.user?.email,
          username: data.username,
          avatar_url: data.avatar_url,
          coins: data.coins || 0,
          isGuest: data.is_guest,
          role: data.role,
        });
      }
    } catch (error) {
      console.error('Error fetching user profile:', error);
    }
  };

  useEffect(() => {
    // Set up auth state listener FIRST
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, currentSession) => {
        setSession(currentSession);
        
        // Basic synchronous state updates
        if (currentSession?.user) {
          // Set minimal user data immediately
          setUser(prevUser => ({
            ...prevUser,
            id: currentSession.user.id,
            email: currentSession.user.email || undefined,
            isGuest: false,
          }));
          
          // Use setTimeout to avoid potential deadlocks
          setTimeout(() => {
            fetchUserProfile(currentSession.user.id);
          }, 0);
        } else {
          setUser(null);
        }
        
        if (event === 'SIGNED_OUT') {
          localStorage.removeItem('guestUser');
        }
      }
    );

    // THEN check for existing session
    const initializeAuth = async () => {
      try {
        const { data: { session: currentSession } } = await supabase.auth.getSession();
        
        setSession(currentSession);
        
        if (currentSession?.user) {
          await fetchUserProfile(currentSession.user.id);
        } else {
          // Check if there's a guest user in localStorage
          const guestUser = localStorage.getItem('guestUser');
          if (guestUser) {
            setUser(JSON.parse(guestUser));
          }
          setLoading(false);
        }
      } catch (error) {
        console.error('Error initializing auth:', error);
        setLoading(false);
      } finally {
        setLoading(false);
      }
    };

    initializeAuth();

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  // Sign in with email and password
  const signIn = async (email: string, password: string) => {
    try {
      const { error } = await supabase.auth.signInWithPassword({ email, password });
      
      if (!error) {
        toast({
          title: "Login successful",
          description: "Welcome back!",
        });
      }
      
      return { error };
    } catch (error) {
      return { error: error as Error };
    }
  };

  // Sign up with email and password
  const signUp = async (email: string, password: string, username?: string) => {
    try {
      const { error } = await supabase.auth.signUp({ 
        email, 
        password,
        options: {
          data: {
            username: username || email.split('@')[0],
            is_guest: false,
          }
        }
      });
      
      if (!error) {
        toast({
          title: "Registration successful",
          description: "Please check your email to verify your account.",
        });
      }
      
      return { error };
    } catch (error) {
      return { error: error as Error };
    }
  };

  // Sign out
  const signOut = async () => {
    try {
      localStorage.removeItem('guestUser');
      await supabase.auth.signOut();
      setUser(null);
      
      toast({
        title: "Signed out",
        description: "You have been signed out successfully.",
      });
    } catch (error) {
      console.error('Error signing out:', error);
      
      toast({
        title: "Sign out failed",
        description: "There was a problem signing you out.",
        variant: "destructive",
      });
    }
  };

  // Reset password
  const resetPassword = async (email: string) => {
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: window.location.origin + '/reset-confirmation',
      });
      return { error };
    } catch (error) {
      return { error: error as Error };
    }
  };

  // Continue as guest
  const continueAsGuest = async () => {
    try {
      const guestId = `guest_${Math.random().toString(36).substring(2, 15)}`;
      const guestUser = {
        id: guestId,
        username: `Guest_${guestId.substring(6, 12)}`,
        coins: 50,
        isGuest: true,
      };
      
      localStorage.setItem('guestUser', JSON.stringify(guestUser));
      setUser(guestUser);
      
      toast({
        title: "Welcome, Guest!",
        description: "You can play games and earn coins. Sign up to save your progress!",
      });
    } catch (error) {
      console.error('Error continuing as guest:', error);
      
      toast({
        title: "Guest login failed",
        description: "There was a problem with guest login. Please try again.",
        variant: "destructive",
      });
    }
  };

  // Update user coins
  const updateUserCoins = async (amount: number) => {
    if (!user) return;
    
    try {
      if (user.isGuest) {
        // Update local storage for guest users
        const updatedUser = { ...user, coins: user.coins + amount };
        localStorage.setItem('guestUser', JSON.stringify(updatedUser));
        setUser(updatedUser);
      } else {
        // For registered users, the backend trigger will handle updating coins
        // We just need to refresh the profile data
        if (session?.user) {
          await fetchUserProfile(session.user.id);
        }
      }
    } catch (error) {
      console.error('Error updating coins:', error);
      
      toast({
        title: "Failed to update coins",
        description: "There was a problem updating your coins.",
        variant: "destructive",
      });
    }
  };

  const value = {
    user,
    session,
    loading,
    signIn,
    signUp,
    signOut,
    resetPassword,
    continueAsGuest,
    updateUserCoins,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
