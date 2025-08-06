'use client';

import { ReactNode } from 'react';
import { ThemeProvider } from './ThemeContext';
import { UserProvider } from './UserContext';
import { DashboardProvider } from './DashboardContext';

type AppProvidersProps = {
  children: ReactNode;
};

export default function AppProviders({ children }: AppProvidersProps) {
  return (
    <ThemeProvider>
      <UserProvider>
        <DashboardProvider>
          {children}
        </DashboardProvider>
      </UserProvider>
    </ThemeProvider>
  );
}