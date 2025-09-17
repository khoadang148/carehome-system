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
  residentAvatar?: string;
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
  avatar?: string;
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

  
  const loadResidents = useCallback(async () => {
    try {
      let resList = await residentAPI.getAll();
      console.log('All residents from API:', resList);
      
      if (user?.role === 'staff' && user?.id) {
        console.log('User is staff, filtering residents by assignments...');
        try {
          const staffAssignments = await staffAssignmentsAPI.getByStaff(user.id);
          console.log('Raw staff assignments:', staffAssignments);
          
          const assignedResidentIds = staffAssignments.map((assignment: any) => {
            const residentId = assignment.resident_id._id || assignment.resident_id;
            console.log('Assignment resident ID:', residentId);
            return residentId;
          });
          
          resList = resList.filter((resident: any) => {
            const residentId = resident._id || resident.id;
            const isAssigned = assignedResidentIds.includes(residentId);
            console.log(`Resident ${residentId} (${resident.full_name}) assigned:`, isAssigned);
            return isAssigned;
          });
          
          console.log('Staff assignments:', staffAssignments);
          console.log('Assigned resident IDs:', assignedResidentIds);
          console.log('Filtered residents for staff:', resList.length);
        } catch (assignmentError) {
          console.error('Error fetching staff assignments:', assignmentError);
          resList = [];
        }
      } else {
        console.log('User is not staff or no user ID, showing all residents');
      }
      
      const mappedResidents: Resident[] = await Promise.all(resList.map(async (r: any) => {
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

        let roomNumber = 'Chưa phân phòng';
        try {
          const assignments = await carePlansAPI.getByResidentId(r._id);
          const assignment = Array.isArray(assignments) ? assignments.find(a => a.assigned_room_id) : null;
          const roomId = assignment?.assigned_room_id;
          const roomIdString = typeof roomId === 'object' && roomId?._id ? roomId._id : roomId;
          if (roomIdString) {
            const room = await roomsAPI.getById(roomIdString);
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
          avatar: Array.isArray(r.avatar) ? r.avatar[0] : r.avatar || null,
        };
      }));
      
      console.log('Final mapped residents:', mappedResidents);
      setResidents(mappedResidents);
      return mappedResidents;
    } catch (error) {
      console.error('Error loading residents:', error);
      setResidents([]);
      return [];
    }
  }, [user]);

  const loadStaff = useCallback(async () => {
    try {
      const staffList = await staffAPI.getAll();
      const map: { [id: string]: string } = {};
      staffList.forEach((staff: any) => {
        const staffId = staff._id || staff.id;
        const staffName = staff.full_name || staff.fullName || staff.username || staff.email || 'Staff';
        
        if (staffId && typeof staffName === 'string') {
          map[staffId] = staffName;
        }
      });
      setStaffMap(map);
    } catch (error) {
      console.error('Error loading staff:', error);
      setStaffMap({});
    }
  }, []);

  const loadVitalSigns = useCallback(async () => {
    setLoading(true);
    try {
      console.log('Loading vital signs data...');
      const residentsList = await loadResidents();
      console.log('Residents loaded:', residentsList.length);
      
      // Fetch vital signs per resident to avoid heavy/global GET and reduce BE errors
      let vsList: any[] = [];
      if (Array.isArray(residentsList) && residentsList.length > 0) {
        const settled = await Promise.allSettled(
          residentsList.map((r: any) => vitalSignsAPI.getByResidentId(r.id))
        );
        for (const r of settled) {
          if (r.status === 'fulfilled') {
            const items = Array.isArray(r.value) ? r.value : [];
            vsList.push(...items);
          }
        }
      }
      console.log('Raw vital signs from API:', vsList);
      
      const mappedVitalSigns: VitalSigns[] = vsList.map((vs: any) => {
        const transformed = transformApiVitalSignsData(vs, residentsList);
        return transformed;
      });
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

  const addVitalSigns = useCallback(async (data: Partial<VitalSigns>) => {
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
      if (error.response?.status === 400) {
        throw new Error('Dữ liệu không hợp lệ. Vui lòng kiểm tra lại các thông tin đã nhập.');
      } else if (error.response?.status === 401) {
        throw new Error('Không có quyền thực hiện thao tác này.');
      } else if (error.response?.status === 404) {
        throw new Error('Không tìm thấy người cao tuổi được chỉ định.');
      } else if (error.response?.status === 500) {
        throw new Error('Lỗi hệ thống. Vui lòng thử lại sau.');
      } else if (error.message) {
        throw error; 
      } else {
        throw new Error('Lỗi khi thêm chỉ số sức khỏe. Vui lòng thử lại.');
      }
    }
  }, [loadVitalSigns]);

  const validateForm = useCallback((data: Partial<VitalSigns>): ValidationError[] => {
    return validateVitalSignsForm(data);
  }, []);

  const getFilteredVitalSigns = useCallback((residentId?: string, date?: string): VitalSigns[] => {
    console.log('🔍 Filtering vital signs with:', { residentId, date });
    console.log('📊 Total vital signs:', vitalSigns.length);
    
    const filtered = vitalSigns.filter(vs => {
      const matchResident = residentId ? vs.residentId === residentId : true;
      
      let matchDate = true;
      if (date && date.trim()) {
        const filterDate = date.trim(); 
        
        let vsDatePart = '';
        if (vs.date) {
          if (vs.date.includes('T')) {
            vsDatePart = vs.date.split('T')[0];
          } else {
            vsDatePart = vs.date;
          }
        }
        

        const normalizedFilterDate = filterDate.replace(/-/g, '');
        const normalizedVsDate = vsDatePart.replace(/-/g, '');
        
        matchDate = normalizedVsDate === normalizedFilterDate;
        
        
        console.log('📅 Date comparison:', {
          vsId: vs.id,
          vsDate: vs.date,
          vsDatePart,
          filterDate,
          normalizedFilterDate,
          normalizedVsDate,
          matchDate
        });
      } else {
        
        matchDate = true;
      }
      
      return matchResident && matchDate;
    });
    
    console.log('✅ Filtered results:', filtered.length);
    return filtered;
  }, [vitalSigns]);


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