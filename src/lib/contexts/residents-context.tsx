"use client";

import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { residentAPI, carePlansAPI, roomsAPI } from '@/lib/api';
import { useAuth } from './auth-context';

// Define types for resident data
export interface Resident {
  id: string; // Changed to string to match API ObjectIds
  name: string;
  room: string;
  photo: string;
  age: number;
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
}

const ResidentsContext = createContext<ResidentsContextType | undefined>(undefined);

export function ResidentsProvider({ children }: { children: ReactNode }) {
  const [residents, setResidents] = useState<Resident[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedResident, setSelectedResident] = useState<Resident | null>(null);
  const { user } = useAuth();

  const fetchResidents = async () => {
    try {
      setLoading(true);
      setError(null);
      
      let residentsData;
      
      // Nếu user là family member, chỉ lấy residents liên quan
      if (user?.role === 'family') {
        console.log('Fetching residents for family member:', user.id);
        residentsData = await residentAPI.getByFamilyMemberId(user.id);
      } else {
        // Nếu là admin hoặc staff, lấy tất cả residents
        residentsData = await residentAPI.getAll();
      }
      
      console.log('Raw residents data from API:', residentsData);
      
      // Map API data to Resident interface and fetch room numbers
      const mappedResidentsPromises = residentsData.map(async (resident: any) => {
        console.log('Processing resident:', resident);
        
        // Calculate age from date_of_birth if available
        let age = 0;
        if (resident.date_of_birth) {
          const birth = new Date(resident.date_of_birth);
          const now = new Date();
          age = now.getFullYear() - birth.getFullYear();
          const m = now.getMonth() - birth.getMonth();
          if (m < 0 || (m === 0 && now.getDate() < birth.getDate())) {
            age--;
          }
        } else if (resident.age) {
          age = resident.age;
        }

        // Fetch room number for this resident
        let roomNumber = 'N/A';
        try {
          const assignments = await carePlansAPI.getByResidentId(resident._id || resident.id);
          const assignment = Array.isArray(assignments) ? assignments.find((a: any) => a.assigned_room_id) : null;
          const roomId = assignment?.assigned_room_id;
          if (roomId) {
            const room = await roomsAPI.getById(roomId);
            roomNumber = room?.room_number || 'N/A';
          }
        } catch (error) {
          console.error(`Error fetching room for resident ${resident._id}:`, error);
          roomNumber = 'N/A';
        }

        const mappedResident = {
          id: resident._id || resident.id,
          name: resident.full_name || resident.fullName || resident.name || 'Không có tên',
          room: roomNumber,
          photo: resident.photo || resident.avatar || resident.avatarUrl || '/default-avatar.svg',
          age: age,
          status: resident.status || 'Ổn định',
          activities: resident.activities || [],
          vitals: resident.vitals || {},
          careNotes: resident.care_notes || [],
          medications: resident.medications || [],
          appointments: resident.appointments || []
        };
        
        console.log('Mapped resident:', mappedResident);
        return mappedResident;
      });
      
      const mappedResidents = await Promise.all(mappedResidentsPromises);
      console.log('Final mapped residents:', mappedResidents);
      
      setResidents(mappedResidents);
      if (mappedResidents.length > 0 && !selectedResident) {
        setSelectedResident(mappedResidents[0]);
      }
    } catch (err: any) {
      console.error('Error fetching residents:', err);
      setError(err.message || 'Không thể tải danh sách cư dân');
    } finally {
      setLoading(false);
    }
  };

  const refreshResidents = async () => {
    await fetchResidents();
  };

  useEffect(() => {
    if (!user) {
      setResidents([]);
      setLoading(false);
      return;
    }
    fetchResidents();
  }, [user]);

  const getResidentById = (id: string) => {
    return residents.find(resident => resident.id === id);
  };

  const getResidentByName = (name: string) => {
    return residents.find(resident => resident.name === name);
  };

  return (
    <ResidentsContext.Provider value={{
      residents,
      loading,
      error,
      selectedResident,
      setSelectedResident,
      getResidentById,
      getResidentByName,
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
