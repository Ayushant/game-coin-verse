
import React, { createContext, useState, useEffect, useContext } from 'react';
import { supabase } from '@/lib/supabase';
import type { User } from '@supabase/supabase-js';

type UserData = {
  id: string;
  email?: string;
  coins: number;
  isGuest: boolean;
};

interface AuthContextType {
  user: UserData | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<{
    error: Error | null;
  }>;
  signUp: (email: string, password: string) => Promise<{
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
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Check active sessions and sets the user
    const getSession = async () => {
      const { data: { session }, error } = await supabase.auth.getSession();
      
      if (!error && session) {
        const { data: userData, error: userError } = await supabase
          .from('profiles')
          .select('id, email, coins')
          .eq('id', session.user.id)
          .single();

        if (!userError && userData) {
          setUser({
            id: userData.id,
            email: userData.email || session.user.email,
            coins: userData.coins || 0,
            isGuest: false,
          });
        } else {
          // If no profile exists, create one
          await supabase.from('profiles').insert([
            { id: session.user.id, email: session.user.email, coins: 100 },
          ]);
          
          setUser({
            id: session.user.id,
            email: session.user.email,
            coins: 100,
            isGuest: false,
          });
        }
      } else {
        // Check if there's a guest user in localStorage
        const guestUser = localStorage.getItem('guestUser');
        if (guestUser) {
          setUser(JSON.parse(guestUser));
        }
      }
      
      setLoading(false);
    };

    getSession();

    const { data: authListener } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        if (event === 'SIGNED_IN' && session) {
          const { data, error } = await supabase
            .from('profiles')
            .select('id, email, coins')
            .eq('id', session.user.id)
            .single();

          if (!error && data) {
            setUser({
              id: data.id,
              email: data.email || session.user.email,
              coins: data.coins || 0,
              isGuest: false,
            });
          } else {
            // Create a new profile if it doesn't exist
            await supabase.from('profiles').insert([
              { id: session.user.id, email: session.user.email, coins: 100 },
            ]);
            
            setUser({
              id: session.user.id,
              email: session.user.email,
              coins: 100,
              isGuest: false,
            });
          }
        } else if (event === 'SIGNED_OUT') {
          setUser(null);
        }
      }
    );

    return () => {
      authListener.subscription.unsubscribe();
    };
  }, []);

  // Sign in with email and password
  const signIn = async (email: string, password: string) => {
    try {
      const { error } = await supabase.auth.signInWithPassword({ email, password });
      return { error };
    } catch (error) {
      return { error: error as Error };
    }
  };

  // Sign up with email and password
  const signUp = async (email: string, password: string) => {
    try {
      const { error } = await supabase.auth.signUp({ email, password });
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
    } catch (error) {
      console.error('Error signing out:', error);
    }
  };

  // Reset password
  const resetPassword = async (email: string) => {
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email);
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
        coins: 50,
        isGuest: true,
      };
      
      localStorage.setItem('guestUser', JSON.stringify(guestUser));
      setUser(guestUser);
    } catch (error) {
      console.error('Error continuing as guest:', error);
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
        // Update Supabase for registered users
        const { data, error } = await supabase
          .from('profiles')
          .update({ coins: user.coins + amount })
          .eq('id', user.id)
          .select()
          .single();
        
        if (!error && data) {
          setUser(prevUser => prevUser ? { ...prevUser, coins: data.coins } : null);
        }
      }
    } catch (error) {
      console.error('Error updating coins:', error);
    }
  };

  const value = {
    user,
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
