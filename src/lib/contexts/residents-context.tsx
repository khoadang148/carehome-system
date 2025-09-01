"use client";

import { getUserFriendlyError } from '@/lib/utils/error-translations';
import { createContext, useContext, useState, useEffect, ReactNode, useCallback } from 'react';
import { residentAPI, roomsAPI, carePlanAssignmentsAPI } from '@/lib/api';
import { useAuth } from './auth-context';
import { filterOfficialResidents } from '@/lib/utils/resident-status';


export interface Resident {
  id: string; 
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

  const fetchResidents = async () => {
    if (loading) return; 
    
    setLoading(true);
    setError(null);
    
    try {
      let residentsData;
      
      // Only fetch all residents for admin and staff roles
      if (user?.role === 'admin' || user?.role === 'staff') {
        residentsData = await residentAPI.getAll();
      } else if (user?.role === 'family' && user?.id) {
        // For family role, fetch only their associated residents
        const familyResidents = await residentAPI.getByFamilyMemberId(user.id);
        residentsData = Array.isArray(familyResidents) ? familyResidents : (familyResidents ? [familyResidents] : []);
      } else {
        residentsData = [];
      }
      
      const mappedResidentsPromises = residentsData.map(async (resident: any) => {
        const mappedResident = {
          id: resident._id || resident.id,
          name: resident.full_name || '',
          age: resident.date_of_birth ? (new Date().getFullYear() - new Date(resident.date_of_birth).getFullYear()) : '',
          gender: resident.gender || '',
          admissionDate: resident.admission_date,
          dischargeDate: resident.discharge_date,
          relationship: resident.relationship || '',
          medicalHistory: resident.medical_history || '',
          currentMedications: resident.current_medications || '',
          allergies: resident.allergies || '',
          emergencyContact: resident.emergency_contact || '',
          careLevel: resident.care_level || '',
          avatar: Array.isArray(resident.avatar) ? resident.avatar[0] : resident.avatar || null,
          status: resident.status || 'active',
          roomNumber: 'Loading...', 
          carePlan: null,
          ...resident
        };

        try {
          const assignments = await carePlanAssignmentsAPI.getByResidentId(resident._id || resident.id);
          
          if (Array.isArray(assignments) && assignments.length > 0) {
            const activeAssignment = assignments.find((a: any) => 
              a.status === 'active' || a.status === 'room_assigned' || a.status === 'payment_completed'
            ) || assignments[0]; 
            
            if (activeAssignment?.bed_id?.room_id) {
              try {
                if (typeof activeAssignment.bed_id.room_id === 'object' && activeAssignment.bed_id.room_id.room_number) {
                  mappedResident.roomNumber = activeAssignment.bed_id.room_id.room_number;
                } else {
                  const roomId = activeAssignment.bed_id.room_id._id || activeAssignment.bed_id.room_id;
                  if (roomId) {
                    const room = await roomsAPI.getById(roomId);
                    mappedResident.roomNumber = room?.room_number || 'Chưa hoàn tất đăng kí';
                  } else {
                    mappedResident.roomNumber = 'Chưa hoàn tất đăng kí';
                  }
                }
              } catch (roomError) {
                mappedResident.roomNumber = 'Chưa hoàn tất đăng kí';
              }
            } else {
              mappedResident.roomNumber = 'Chưa hoàn tất đăng kí';
            }
            
            mappedResident.carePlan = activeAssignment;
          } else {
            mappedResident.roomNumber = 'Chưa hoàn tất đăng kí';
          }
        } catch (assignmentError) {
          mappedResident.roomNumber = 'Chưa hoàn tất đăng kí';
        }

        return mappedResident;
      });

      const mappedResidents = await Promise.all(mappedResidentsPromises);
      setResidents(mappedResidents);
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
