'use client';

import { createContext, useContext, useState, ReactNode } from 'react';

type UserEmail = {
  emailAddress: string;
};

type User = {
  id: string;
  firstName: string | null;
  lastName: string | null;
  emailAddresses: UserEmail[];
};

type UserContextType = {
  user: User | null;
  setUser: (user: User | null) => void;
  isAuthenticated: boolean;
};

const UserContext = createContext<UserContextType | undefined>(undefined);

export function UserProvider({ children }: { children: ReactNode }) {
  // Estado inicial com um usuário de teste
  const [user, setUser] = useState<User | null>({
    id: '1',
    firstName: 'Usuário',
    lastName: 'Teste',
    emailAddresses: [{ emailAddress: 'usuario@teste.com' }]
  });

  return (
    <UserContext.Provider 
      value={{
        user,
        setUser,
        isAuthenticated: !!user
      }}
    >
      {children}
    </UserContext.Provider>
  );
}

export function useUser() {
  const context = useContext(UserContext);
  if (context === undefined) {
    throw new Error('useUser must be used within a UserProvider');
  }
  return context;
}