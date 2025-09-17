'use client';

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { useAuth } from './auth-context';
import { residentAPI } from '@/lib/api';

interface Resident {
  _id: string;
  full_name: string;
  fullName?: string;
  avatar?: string;
  avatarUrl?: string;
  relationship?: string;
  emergency_contact?: any;
  emergencyContact?: any;
  status?: string;
  admission_date?: string;
  date_of_birth?: string;
  dateOfBirth?: string;
  gender?: string;
  careNotes?: any[];
}

interface ResidentsContextType {
  residents: Resident[];
  residentsCount: number;
  hasResidents: boolean;
  loading: boolean;
  error: string | null;
  initialized: boolean;
  refreshResidents: () => Promise<void>;
  initializeResidents: () => Promise<void>;
}

const ResidentsContext = createContext<ResidentsContextType | undefined>(undefined);

interface ResidentsProviderProps {
  children: ReactNode;
}

export function ResidentsProvider({ children }: ResidentsProviderProps) {
  const { user } = useAuth();
  const [residents, setResidents] = useState<Resident[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [initialized, setInitialized] = useState(false);

  const fetchResidents = async () => {
    if (!user?.id || user.role !== 'family') {
      setResidents([]);
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);
      const data = await residentAPI.getByFamilyMemberId(user.id);
      const arr = Array.isArray(data) ? data : [data];
      setResidents(arr);
    } catch (err) {
      console.error('Error fetching residents:', err);
      setError('Không thể tải thông tin người thân');
      setResidents([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchResidents().finally(() => setInitialized(true));
  }, [user?.id, user?.role]);

  const refreshResidents = async () => {
    await fetchResidents();
  };

  const initializeResidents = async () => {
    if (!initialized) {
      await fetchResidents();
      setInitialized(true);
    }
  };

  const value: ResidentsContextType = {
    residents,
    residentsCount: residents.length,
    hasResidents: residents.length > 0,
    loading,
    error,
    initialized,
    refreshResidents,
    initializeResidents
  };

  return (
    <ResidentsContext.Provider value={value}>
      {children}
    </ResidentsContext.Provider>
  );
}

export function useResidents() {
  const context = useContext(ResidentsContext);
  if (context === undefined) {
    throw new Error('useResidents must be used within a ResidentsProvider');
  }
  return context;
}