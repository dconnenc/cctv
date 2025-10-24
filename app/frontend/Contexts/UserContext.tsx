import { ReactNode, createContext, useContext, useEffect, useState } from 'react';

import { UserRole } from '@cctv/types';
import { clearAllExperienceJWTs } from '@cctv/utils';

interface User {
  id: string;
  email: string;
  name: string;
  created_at: string;
  updated_at: string;
  role: UserRole;
  admin: boolean;
  super_admin: boolean;
  most_recent_participant_name?: string;
}

interface UserContextType {
  user: User | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  isAdmin: boolean;
  refreshUser: () => Promise<void>;
  logOut: () => Promise<boolean>;
}

const UserContext = createContext<UserContextType | undefined>(undefined);

interface UserProviderProps {
  children: ReactNode;
}

export function UserProvider({ children }: UserProviderProps) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const isAuthenticated = user !== null;
  const isAdmin = user?.super_admin === true || user?.admin === true;

  const userFetch = async (input: RequestInfo | URL, init: RequestInit = {}) => {
    return fetch(input, {
      credentials: 'include',
      headers: { 'Content-Type': 'application/json', ...(init.headers || {}) },
      ...init,
    });
  };

  const refreshUser = async () => {
    setIsLoading(true);
    try {
      const response = await userFetch('/api/users/me');

      if (response.ok) {
        const userData = await response.json();
        if (userData && Object.keys(userData).length !== 0) {
          setUser(userData);
        } else {
          setUser(null);
        }
      } else {
        // No current user or session expired
        setUser(null);
      }
    } catch (error) {
      console.error('Failed to fetch user:', error);
      setUser(null);
    } finally {
      setIsLoading(false);
    }
  };

  const logOut = async () => {
    try {
      const response = await userFetch('/api/users/sign_out_user', { method: 'POST' });
      if (response.ok) {
        setUser(null);
        clearAllExperienceJWTs();
        return true;
      }
      return false;
    } catch (e) {
      return false;
    }
  };

  // Check for existing session on mount
  useEffect(() => {
    refreshUser();
  }, []);

  const value: UserContextType = {
    user,
    isLoading,
    isAuthenticated,
    isAdmin,
    refreshUser,
    logOut,
  };

  return <UserContext.Provider value={value}>{children}</UserContext.Provider>;
}

export function useUser() {
  const context = useContext(UserContext);
  if (context === undefined) {
    throw new Error('useUser must be used within a UserProvider');
  }
  return context;
}
