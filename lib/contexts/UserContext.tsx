'use client';

import React, { createContext, useContext, useMemo } from 'react';

interface UserContextType {
  username: string | null;
  isUserSet: boolean;
}

interface UserProviderProps {
  children: React.ReactNode;
  initialUsername: string | null;
}

const UserContext = createContext<UserContextType | undefined>(undefined);

export function UserProvider({ children, initialUsername }: UserProviderProps) {
  const value = useMemo<UserContextType>(() => {
    const normalizedUsername = initialUsername?.trim() || null;
    return {
      username: normalizedUsername,
      isUserSet: Boolean(normalizedUsername),
    };
  }, [initialUsername]);

  return <UserContext.Provider value={value}>{children}</UserContext.Provider>;
}

export function useUser() {
  const context = useContext(UserContext);
  if (context === undefined) {
    throw new Error('useUser must be used within a UserProvider');
  }
  return context;
}
