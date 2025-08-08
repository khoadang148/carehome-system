import { bedAssignmentsAPI, carePlansAPI, roomsAPI, residentAPI } from '@/lib/api';

export interface ResidentStatus {
  id: string;
  isOfficial: boolean;
  hasRoom: boolean;
  hasBed: boolean;
  roomNumber?: string;
  bedNumber?: string;
}

/**
 * Kiểm tra xem resident có phải là cư dân chính thức hay không
 * Cư dân chính thức = có phòng và giường được phân công
 */
export const checkResidentStatus = async (residentId: string): Promise<ResidentStatus> => {
  try {
    // Kiểm tra bed assignment trước
    const bedAssignments = await bedAssignmentsAPI.getByResidentId(residentId);
    const bedAssignment = Array.isArray(bedAssignments) ? 
      bedAssignments.find((a: any) => a.bed_id?.room_id) : null;
    
    if (bedAssignment?.bed_id?.room_id) {
      // Có bed assignment
      let roomNumber = '';
      let bedNumber = '';
      
      // Lấy thông tin room
      if (typeof bedAssignment.bed_id.room_id === 'object' && bedAssignment.bed_id.room_id.room_number) {
        roomNumber = bedAssignment.bed_id.room_id.room_number;
      } else {
        const roomId = bedAssignment.bed_id.room_id._id || bedAssignment.bed_id.room_id;
        if (roomId) {
          const room = await roomsAPI.getById(roomId);
          roomNumber = room?.room_number || '';
        }
      }
      
      // Lấy thông tin bed
      if (typeof bedAssignment.bed_id === 'object' && bedAssignment.bed_id.bed_number) {
        bedNumber = bedAssignment.bed_id.bed_number;
      }
      
      return {
        id: residentId,
        isOfficial: true,
        hasRoom: true,
        hasBed: true,
        roomNumber,
        bedNumber
      };
    }
    
    // Fallback: kiểm tra care plan assignments
    const assignments = await carePlansAPI.getByResidentId(residentId);
    const assignment = Array.isArray(assignments) ? 
      assignments.find((a: any) => a.bed_id?.room_id || a.assigned_room_id) : null;
    
    if (assignment?.bed_id?.room_id || assignment?.assigned_room_id) {
      // Có room assignment
      let roomNumber = '';
      const roomId = assignment?.bed_id?.room_id || assignment?.assigned_room_id;
      const roomIdString = typeof roomId === 'object' && roomId?._id ? roomId._id : roomId;
      
      if (roomIdString) {
        const room = await roomsAPI.getById(roomIdString);
        roomNumber = room?.room_number || '';
      }
      
      return {
        id: residentId,
        isOfficial: true,
        hasRoom: true,
        hasBed: false,
        roomNumber
      };
    }
    
    // Không có assignment nào
    return {
      id: residentId,
      isOfficial: false,
      hasRoom: false,
      hasBed: false
    };
    
  } catch (error) {
    console.error(`Error checking resident status for ${residentId}:`, error);
    return {
      id: residentId,
      isOfficial: false,
      hasRoom: false,
      hasBed: false
    };
  }
};

/**
 * Lọc danh sách residents chỉ lấy những cư dân chính thức
 */
export const filterOfficialResidents = async (residents: any[]): Promise<any[]> => {
  const officialResidents = [];
  
  for (const resident of residents) {
    const status = await checkResidentStatus(resident.id || resident._id);
    if (status.isOfficial) {
      officialResidents.push({
        ...resident,
        roomNumber: status.roomNumber,
        bedNumber: status.bedNumber
      });
    }
  }
  
  return officialResidents;
};

/**
 * Lọc danh sách residents chỉ lấy những cư dân chưa chính thức
 */
export const filterUnofficialResidents = async (residents: any[]): Promise<any[]> => {
  const unofficialResidents = [];
  
  for (const resident of residents) {
    const status = await checkResidentStatus(resident.id || resident._id);
    if (!status.isOfficial) {
      unofficialResidents.push(resident);
    }
  }
  
  return unofficialResidents;
}; 

/**
 * Lấy danh sách tất cả resident đã hoàn tất đăng ký (có phòng)
 */
export const getCompletedResidents = async (): Promise<Array<any>> => {
  try {
    const allResidents = await residentAPI.getAll();
    const residents = Array.isArray(allResidents) ? allResidents : [];
    
    const completedResidents: any[] = [];
    
    for (const resident of residents) {
      try {
        // Kiểm tra bed assignment trước
        const bedAssignments = await bedAssignmentsAPI.getByResidentId(resident._id);
        const bedAssignment = Array.isArray(bedAssignments) ? 
          bedAssignments.find((a: any) => a.bed_id?.room_id) : null;
        
        if (bedAssignment?.bed_id?.room_id) {
          // Có bed assignment - đã hoàn tất đăng ký
          let roomNumber = '';
          if (typeof bedAssignment.bed_id.room_id === 'object' && bedAssignment.bed_id.room_id.room_number) {
            roomNumber = bedAssignment.bed_id.room_id.room_number;
          } else {
            const roomId = bedAssignment.bed_id.room_id._id || bedAssignment.bed_id.room_id;
            if (roomId) {
              const room = await roomsAPI.getById(roomId);
              roomNumber = room?.room_number || '';
            }
          }
          
          if (roomNumber) {
            completedResidents.push({
              ...resident,
              roomNumber
            });
          }
        } else {
          // Fallback: kiểm tra care plan assignments
          const assignments = await carePlansAPI.getByResidentId(resident._id);
          const assignment = Array.isArray(assignments) ? 
            assignments.find((a: any) => a.bed_id?.room_id || a.assigned_room_id) : null;
          
          if (assignment?.bed_id?.room_id || assignment?.assigned_room_id) {
            let roomNumber = '';
            const roomId = assignment?.bed_id?.room_id || assignment?.assigned_room_id;
            const roomIdString = typeof roomId === 'object' && roomId?._id ? roomId._id : roomId;
            
            if (roomIdString) {
              const room = await roomsAPI.getById(roomIdString);
              roomNumber = room?.room_number || '';
            }
            
            if (roomNumber) {
              completedResidents.push({
                ...resident,
                roomNumber
              });
            }
          }
        }
      } catch (error) {
        console.warn(`Error checking resident ${resident._id} status:`, error);
      }
    }
    
    console.log('Completed residents with rooms:', completedResidents);
    return completedResidents;
  } catch (error) {
    console.error('Error fetching completed residents:', error);
    return [];
  }
}; 