import { useState, useEffect, useCallback } from 'react';
import { residentAPI, vitalSignsAPI, staffAPI, carePlansAPI, roomsAPI, staffAssignmentsAPI } from '@/lib/api';
import { useAuth } from '@/lib/contexts/auth-context';
import { 
  transformApiVitalSignsData, 
  transformFormDataToApi,
  validateVitalSignsForm,
  ValidationError
} from '@/lib/utils/vital-signs-utils';

export interface VitalSigns {
  id: string;
  residentId: string;
  residentName: string;
  date: string;
  time: string;
  bloodPressure: string;
  heartRate: number;
  temperature: number;
  oxygenSaturation: number;
  respiratoryRate: number;
  weight?: number;
  bloodSugar?: number;
  notes?: string;
  recordedBy: string;
  status: 'normal' | 'warning' | 'critical';
}

export interface Resident {
  id: string;
  name: string;
  room: string;
  age: number;
}

export interface UseVitalSignsReturn {
  vitalSigns: VitalSigns[];
  residents: Resident[];
  staffMap: { [id: string]: string };
  loading: boolean;
  loadVitalSigns: () => Promise<void>;
  addVitalSigns: (data: Partial<VitalSigns>) => Promise<void>;
  validateForm: (data: Partial<VitalSigns>) => ValidationError[];
  getFilteredVitalSigns: (residentId?: string, date?: string) => VitalSigns[];
}

export function useVitalSigns(): UseVitalSignsReturn {
  const { user } = useAuth();
  const [vitalSigns, setVitalSigns] = useState<VitalSigns[]>([]);
  const [residents, setResidents] = useState<Resident[]>([]);
  const [staffMap, setStaffMap] = useState<{ [id: string]: string }>({});
  const [loading, setLoading] = useState(true);

  // Load residents data
  const loadResidents = useCallback(async () => {
    try {
      let resList = await residentAPI.getAll();
      
      // If user is staff, filter residents by staff assignment
      if (user?.role === 'staff' && user?.id) {
        try {
          const staffAssignments = await staffAssignmentsAPI.getByStaff(user.id);
          const assignedResidentIds = staffAssignments.map((assignment: any) => 
            assignment.resident_id._id || assignment.resident_id
          );
          
          // Filter residents to only show assigned ones
          resList = resList.filter((resident: any) => 
            assignedResidentIds.includes(resident._id || resident.id)
          );
          
          console.log('Staff assignments:', staffAssignments);
          console.log('Assigned resident IDs:', assignedResidentIds);
          console.log('Filtered residents for staff:', resList.length);
        } catch (assignmentError) {
          console.error('Error fetching staff assignments:', assignmentError);
          // If error fetching assignments, show no residents for staff
          resList = [];
        }
      }
      
      // Get room information for each resident
      const mappedResidents: Resident[] = await Promise.all(resList.map(async (r: any) => {
        // Calculate age from date_of_birth
        let age = 0;
        if (r.date_of_birth) {
          const birthDate = new Date(r.date_of_birth);
          const today = new Date();
          age = today.getFullYear() - birthDate.getFullYear();
          const monthDiff = today.getMonth() - birthDate.getMonth();
          if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
            age--;
          }
        }

        // Get room number from care plans
        let roomNumber = 'Chưa phân phòng';
        try {
          const assignments = await carePlansAPI.getByResidentId(r._id);
          const assignment = Array.isArray(assignments) ? assignments.find(a => a.assigned_room_id) : null;
          if (assignment?.assigned_room_id) {
            const room = await roomsAPI.getById(assignment.assigned_room_id);
            roomNumber = room?.room_number || 'Chưa phân phòng';
          }
        } catch (error) {
          console.log(`Could not get room for resident ${r._id}:`, error);
        }

        return {
          id: r._id || r.id,
          name: r.full_name || r.fullName || r.name || 'Chưa có tên',
          room: roomNumber,
          age: age,
        };
      }));
      
      setResidents(mappedResidents);
      return mappedResidents;
    } catch (error) {
      console.error('Error loading residents:', error);
      setResidents([]);
      return [];
    }
  }, [user]);

  // Load staff data
  const loadStaff = useCallback(async () => {
    try {
      const staffList = await staffAPI.getAll();
      const map: { [id: string]: string } = {};
      staffList.forEach((staff: any) => {
        map[staff._id || staff.id] = staff.full_name || staff.fullName || staff.username || staff.email;
      });
      setStaffMap(map);
    } catch (error) {
      console.error('Error loading staff:', error);
      setStaffMap({});
    }
  }, []);

  // Load vital signs data
  const loadVitalSigns = useCallback(async () => {
    setLoading(true);
    try {
      console.log('Loading vital signs data...');
      const residentsList = await loadResidents();
      console.log('Residents loaded:', residentsList.length);
      
      const vsList = await vitalSignsAPI.getAll();
      console.log('Raw vital signs from API:', vsList);
      
      const mappedVitalSigns: VitalSigns[] = vsList.map((vs: any) => {
        const transformed = transformApiVitalSignsData(vs, residentsList);
        return transformed;
      });
      // Lọc unique theo id
      const uniqueVitalSigns = Array.from(
        new Map(mappedVitalSigns.map(vs => [vs.id, vs])).values()
      );
      console.log('Final mapped vital signs:', uniqueVitalSigns);
      setVitalSigns(uniqueVitalSigns);
    } catch (error) {
      console.error('Error loading vital signs:', error);
      throw new Error('Lỗi khi tải dữ liệu chỉ số sức khỏe hoặc danh sách người cao tuổi!');
    } finally {
      setLoading(false);
    }
  }, [loadResidents]);

  // Add new vital signs
  const addVitalSigns = useCallback(async (data: Partial<VitalSigns>) => {
    // Validate required fields BEFORE API call only
    if (!data.residentId) {
      throw new Error('Vui lòng chọn người cao tuổi');
    }
    if (!data.bloodPressure) {
      throw new Error('Vui lòng nhập huyết áp');
    }
    if (!data.heartRate || !data.temperature || !data.oxygenSaturation) {
      throw new Error('Vui lòng nhập đầy đủ các chỉ số cơ bản');
    }
    try {
      const apiData = transformFormDataToApi(data);
      const response = await vitalSignsAPI.create(apiData);
      await loadVitalSigns();
      return response;
    } catch (error: any) {
      // More specific error messages
      if (error.response?.status === 400) {
        throw new Error('Dữ liệu không hợp lệ. Vui lòng kiểm tra lại các thông tin đã nhập.');
      } else if (error.response?.status === 401) {
        throw new Error('Không có quyền thực hiện thao tác này.');
      } else if (error.response?.status === 404) {
        throw new Error('Không tìm thấy người cao tuổi được chỉ định.');
      } else if (error.response?.status === 500) {
        throw new Error('Lỗi hệ thống. Vui lòng thử lại sau.');
      } else if (error.message) {
        throw error; // Re-throw validation errors
      } else {
        throw new Error('Lỗi khi thêm chỉ số sức khỏe. Vui lòng thử lại.');
      }
    }
  }, [loadVitalSigns]);

  // Validate form data
  const validateForm = useCallback((data: Partial<VitalSigns>): ValidationError[] => {
    return validateVitalSignsForm(data);
  }, []);

  // Get filtered vital signs
  const getFilteredVitalSigns = useCallback((residentId?: string, date?: string): VitalSigns[] => {
    console.log('🔍 Filtering vital signs with:', { residentId, date });
    console.log('📊 Total vital signs:', vitalSigns.length);
    
    const filtered = vitalSigns.filter(vs => {
      const matchResident = residentId ? vs.residentId === residentId : true;
      
      // Improved date matching - handle different date formats
      let matchDate = true;
      if (date) {
        const filterDate = date; // YYYY-MM-DD format
        
        // Extract date part from vs.date (handle both YYYY-MM-DD and ISO datetime)
        let vsDatePart = '';
        if (vs.date) {
          if (vs.date.includes('T')) {
            // ISO datetime format: 2025-07-18T01:53:00.000Z -> 2025-07-18
            vsDatePart = vs.date.split('T')[0];
          } else {
            // Already date format: 2025-07-18
            vsDatePart = vs.date;
          }
        }
        
        matchDate = vsDatePart === filterDate;
        
        // Debug log
        console.log('📅 Date comparison:', {
          vsId: vs.id,
          vsDate: vs.date,
          vsDatePart,
          filterDate,
          matchDate
        });
      }
      
      return matchResident && matchDate;
    });
    
    console.log('✅ Filtered results:', filtered.length);
    return filtered;
  }, [vitalSigns]);

  // Initialize data on mount
  useEffect(() => {
    if (user) {
      loadVitalSigns();
      loadStaff();
    }
  }, [loadVitalSigns, loadStaff, user]);

  return {
    vitalSigns,
    residents,
    staffMap,
    loading,
    loadVitalSigns,
    addVitalSigns,
    validateForm,
    getFilteredVitalSigns,
  };
} 