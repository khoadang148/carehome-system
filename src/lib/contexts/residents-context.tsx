"use client";

import { getUserFriendlyError } from '@/lib/utils/error-translations';
import { createContext, useContext, useState, useEffect, ReactNode, useCallback, useMemo } from 'react';
import { residentAPI, roomsAPI, carePlanAssignmentsAPI } from '@/lib/api';
import { useAuth } from './auth-context';
import { filterOfficialResidents } from '@/lib/utils/resident-status';
import { getCached, setCached, buildCacheKey } from '@/lib/utils/apiCache';

export interface Resident {
  id: string; 
  name: string;
  room: string;
  photo: string;
  age: number | string;
  status: string;
  activities?: any[];
  vitals?: any;
  careNotes?: any[];
  medications?: any[];
  appointments?: any[];
}

interface ResidentsContextType {
  residents: Resident[];
  loading: boolean;
  error: string | null;
  selectedResident: Resident | null;
  setSelectedResident: (resident: Resident | null) => void;
  getResidentById: (id: string) => Resident | undefined;
  getResidentByName: (name: string) => Resident | undefined;
  refreshResidents: () => Promise<void>;
  initialized: boolean;
  initializeResidents: () => void;
}

const ResidentsContext = createContext<ResidentsContextType | undefined>(undefined);

export function ResidentsProvider({ children }: { children: ReactNode }) {
  const [residents, setResidents] = useState<Resident[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [initialized, setInitialized] = useState(false);
  const { user } = useAuth();

  // Index map for fast lookup
  const residentIndex = useMemo(() => {
    const m = new Map<string, Resident>();
    for (const r of residents) m.set(r.id, r);
    return m;
  }, [residents]);

  const baseKey = useMemo(() => buildCacheKey('', 'residents:list', { role: user?.role, id: user?.id }), [user?.role, user?.id]);

  const pushBaseResidents = (rows: any[]) => {
    const mapped: Resident[] = rows.map((resident: any) => ({
      id: resident._id || resident.id,
      name: resident.full_name || resident.name || '',
      age: resident.date_of_birth ? (new Date().getFullYear() - new Date(resident.date_of_birth).getFullYear()) : '',
      status: resident.status || 'active',
      photo: Array.isArray(resident.avatar) ? resident.avatar[0] : resident.avatar || null,
      room: 'Đang tải...',
    } as any));
    setResidents(mapped);
  };

  // Progressive fetch: show cached immediately, then update
  const fetchResidents = async () => {
    if (loading) return; 
    setLoading(true);
    setError(null);

    try {
      // 1) Use cached base list immediately
      const cached = typeof window !== 'undefined' ? getCached<any[]>(baseKey) : null;
      if (cached?.data && Array.isArray(cached.data) && !initialized) {
        pushBaseResidents(cached.data);
      }

      // 2) Fetch latest base list
      let residentsData: any[] = [];
      if (user?.role === 'admin' || user?.role === 'staff') {
        residentsData = await residentAPI.getAll({ fields: '_id,full_name,date_of_birth,status,avatar,gender' });
      } else if (user?.role === 'family' && user?.id) {
        const familyResidents = await residentAPI.getByFamilyMemberId(user.id);
        residentsData = Array.isArray(familyResidents) ? familyResidents : (familyResidents ? [familyResidents] : []);
      }

      if (residentsData?.length) {
        pushBaseResidents(residentsData);
        // cache 60s
        if (typeof window !== 'undefined') setCached(baseKey, { data: residentsData, status: 200, statusText: 'OK' }, 60_000);
      }

      // 3) Enrich room number progressively (non-blocking)
      (async () => {
        const updates: Record<string, string> = {};
        for (const raw of residentsData) {
          const rid = raw._id || raw.id;
          try {
            const assignments = await carePlanAssignmentsAPI.getByResidentId(rid);
            if (Array.isArray(assignments) && assignments.length > 0) {
              const activeAssignment = assignments.find((a: any) => 
                a.status === 'active' || a.status === 'room_assigned' || a.status === 'payment_completed'
              ) || assignments[0];
              if (activeAssignment?.bed_id?.room_id) {
                if (typeof activeAssignment.bed_id.room_id === 'object' && activeAssignment.bed_id.room_id.room_number) {
                  updates[rid] = activeAssignment.bed_id.room_id.room_number;
                } else {
                  const roomId = activeAssignment.bed_id.room_id._id || activeAssignment.bed_id.room_id;
                  if (roomId) {
                    const room = await roomsAPI.getById(roomId);
                    updates[rid] = room?.room_number || 'Chưa hoàn tất đăng kí';
                  } else {
                    updates[rid] = 'Chưa hoàn tất đăng kí';
                  }
                }
              } else {
                updates[rid] = 'Chưa hoàn tất đăng kí';
              }
            } else {
              updates[rid] = 'Chưa hoàn tất đăng kí';
            }
          } catch {
            updates[rid] = 'Chưa hoàn tất đăng kí';
          }
        }
        // apply updates in one shot to prevent reflows
        setResidents(prev => prev.map(r => ({ ...r, room: updates[r.id] ?? r.room })));
      })();

      setInitialized(true);
    } catch (err) {
      setError('Không thể tải danh sách người cao tuổi');
      setResidents([]);
    } finally {
      setLoading(false);
    }
  };

  const initializeResidents = useCallback(() => {
    if (!initialized && !loading) {
      fetchResidents();
    }
  }, [initialized, loading]);

  const refreshResidents = useCallback(async () => {
    await fetchResidents();
  }, []);

  useEffect(() => {
    if (!user) {
      setResidents([]);
      setLoading(false);
      setInitialized(false);
      return;
    }
  }, [user]);

  const [selectedResident, setSelectedResident] = useState<Resident | null>(null);

  const getResidentById = (id: string) => residentIndex.get(id);
  const getResidentByName = (name: string) => residents.find(resident => resident.name === name);

  return (
    <ResidentsContext.Provider value={{ 
      residents, 
      loading, 
      error, 
      selectedResident,
      setSelectedResident,
      getResidentById,
      getResidentByName,
      initialized,
      initializeResidents,
      refreshResidents 
    }}>
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
