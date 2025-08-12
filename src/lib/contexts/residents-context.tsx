import { getUserFriendlyError } from '@/lib/utils/error-translations';
"use client";

import { createContext, useContext, useState, useEffect, ReactNode, useCallback } from 'react';
import { residentAPI, roomsAPI, carePlanAssignmentsAPI } from '@/lib/api';
import { useAuth } from './auth-context';
import { filterOfficialResidents } from '@/lib/utils/resident-status';

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
    if (loading) return; // Prevent multiple simultaneous requests
    
    setLoading(true);
    setError(null);
    
    try {
      const residentsData = await residentAPI.getAll();
      
      // Map residents data with additional information
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
          roomNumber: 'Loading...', // Default value
          carePlan: null,
          ...resident
        };

        // Fetch care plan assignments (gói dịch vụ đang sử dụng)
        try {
          const assignments = await carePlanAssignmentsAPI.getByResidentId(resident._id || resident.id);
          console.log(`Care plan assignments for resident ${resident._id}:`, assignments);
          
          if (Array.isArray(assignments) && assignments.length > 0) {
            // Find the most recent active assignment
            const activeAssignment = assignments.find((a: any) => 
              a.status === 'active' || a.status === 'room_assigned' || a.status === 'payment_completed'
            ) || assignments[0]; // Fallback to first assignment if no active one
            
            console.log(`Selected assignment for resident ${resident._id}:`, activeAssignment);
            
            // Check if assignment has room information
            if (activeAssignment?.bed_id?.room_id) {
              try {
                // Nếu room_id đã có thông tin room_number, sử dụng trực tiếp
                if (typeof activeAssignment.bed_id.room_id === 'object' && activeAssignment.bed_id.room_id.room_number) {
                  mappedResident.roomNumber = activeAssignment.bed_id.room_id.room_number;
                } else {
                  // Nếu chỉ có _id, fetch thêm thông tin
                  const roomId = activeAssignment.bed_id.room_id._id || activeAssignment.bed_id.room_id;
                  if (roomId) {
                    const room = await roomsAPI.getById(roomId);
                    mappedResident.roomNumber = room?.room_number || 'Chưa hoàn tất đăng kí';
                  } else {
                    mappedResident.roomNumber = 'Chưa hoàn tất đăng kí';
                  }
                }
              } catch (roomError) {
                console.error(`Error fetching room for resident ${resident._id}:`, roomError);
                mappedResident.roomNumber = 'Chưa hoàn tất đăng kí';
              }
            } else {
              mappedResident.roomNumber = 'Chưa hoàn tất đăng kí';
            }
            
            // Set care plan information
            mappedResident.carePlan = activeAssignment;
          } else {
            mappedResident.roomNumber = 'Chưa hoàn tất đăng kí';
          }
        } catch (assignmentError) {
          console.error(`Error fetching care plan assignments for resident ${resident._id}:`, assignmentError);
          mappedResident.roomNumber = 'Chưa hoàn tất đăng kí';
        }

        return mappedResident;
      });

      const mappedResidents = await Promise.all(mappedResidentsPromises);
      setResidents(mappedResidents);
      setInitialized(true);
    } catch (err) {
      console.error('Error fetching residents:', err);
      setError('Không thể tải danh sách cư dân');
      setResidents([]);
    } finally {
      setLoading(false);
    }
  };

  // Lazy loading: chỉ fetch data khi cần thiết
  const initializeResidents = useCallback(() => {
    if (!initialized && !loading) {
      fetchResidents();
    }
  }, [initialized, loading]);

  const refreshResidents = useCallback(() => {
    fetchResidents();
  }, []);

  // Tối ưu: Không tự động fetch data khi user login
  // Chỉ fetch khi component thực sự cần data
  useEffect(() => {
    // Chỉ clear data khi user logout, không tự động fetch
    if (!user) {
      setResidents([]);
      setLoading(false);
      setInitialized(false);
      return;
    }
    // Không tự động initializeResidents() ở đây
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
