'use client';

import { createContext, useContext, useState, ReactNode } from 'react';

type DashboardMetrics = {
  activeClients: number;
  openServiceOrders: number;
  monthlyRevenue: number;
  growthPercentage: number;
};

type RecentActivity = {
  id: string;
  description: string;
  date: Date;
  type: 'client' | 'service' | 'payment';
};

type DashboardContextType = {
  metrics: DashboardMetrics;
  recentActivities: RecentActivity[];
  updateMetrics: (metrics: Partial<DashboardMetrics>) => void;
  addActivity: (activity: Omit<RecentActivity, 'id' | 'date'>) => void;
};

const DashboardContext = createContext<DashboardContextType | undefined>(undefined);

export function DashboardProvider({ children }: { children: ReactNode }) {
  const [metrics, setMetrics] = useState<DashboardMetrics>({
    activeClients: 0,
    openServiceOrders: 0,
    monthlyRevenue: 0,
    growthPercentage: 0
  });

  const [recentActivities, setRecentActivities] = useState<RecentActivity[]>([]);

  const updateMetrics = (newMetrics: Partial<DashboardMetrics>) => {
    setMetrics(prev => ({
      ...prev,
      ...newMetrics
    }));
  };

  const addActivity = (activity: Omit<RecentActivity, 'id' | 'date'>) => {
    const newActivity: RecentActivity = {
      ...activity,
      id: Math.random().toString(36).substring(2, 9),
      date: new Date()
    };

    setRecentActivities(prev => [newActivity, ...prev].slice(0, 10));
  };

  return (
    <DashboardContext.Provider
      value={{
        metrics,
        recentActivities,
        updateMetrics,
        addActivity
      }}
    >
      {children}
    </DashboardContext.Provider>
  );
}

export function useDashboard() {
  const context = useContext(DashboardContext);
  if (context === undefined) {
    throw new Error('useDashboard must be used within a DashboardProvider');
  }
  return context;
}