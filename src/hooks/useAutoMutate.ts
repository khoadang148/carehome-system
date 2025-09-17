import { useEffect } from 'react';
import { mutateAll } from './useSWRData';
import { clientStorage } from '@/lib/utils/clientStorage';

// Hook để tự động mutate dữ liệu khi có thay đổi
export const useAutoMutate = (residentId?: string) => {
  useEffect(() => {
    // Lắng nghe sự kiện storage change để cập nhật dữ liệu
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === 'data_updated' && e.newValue) {
        try {
          const updateData = JSON.parse(e.newValue);
          const { type, residentId: updatedResidentId } = updateData;
          
          // Mutate dữ liệu dựa trên loại thay đổi
          switch (type) {
            case 'resident_registered':
              mutateAll.residents();
              if (updatedResidentId) {
                mutateAll.residentData(updatedResidentId);
              }
              break;
            case 'vital_signs_updated':
              if (updatedResidentId) {
                mutateAll.vitalSigns(updatedResidentId);
              }
              break;
            case 'care_notes_updated':
              if (updatedResidentId) {
                mutateAll.careNotes(updatedResidentId);
              }
              break;
            case 'staff_assignment_updated':
              if (updatedResidentId) {
                mutateAll.staffAssignments(updatedResidentId);
              }
              break;
            case 'activity_updated':
              if (updatedResidentId) {
                mutateAll.activities(updatedResidentId);
              }
              break;
            case 'bed_assignment_updated':
              if (updatedResidentId) {
                mutateAll.bedAssignments(updatedResidentId);
              }
              break;
            case 'room_updated':
              mutateAll.room(updateData.roomId);
              break;
            case 'staff_updated':
              mutateAll.staff();
              break;
            default:
              // Mutate tất cả dữ liệu
              mutateAll.all();
          }
        } catch (error) {
          console.error('Error parsing storage update data:', error);
        }
      }
    };

    // Lắng nghe sự kiện focus để revalidate dữ liệu
    const handleFocus = () => {
      if (residentId) {
        mutateAll.residentData(residentId);
      } else {
        mutateAll.all();
      }
    };

    // Lắng nghe sự kiện online để revalidate khi kết nối lại
    const handleOnline = () => {
      if (residentId) {
        mutateAll.residentData(residentId);
      } else {
        mutateAll.all();
      }
    };

    // Đăng ký event listeners
    window.addEventListener('storage', handleStorageChange);
    window.addEventListener('focus', handleFocus);
    window.addEventListener('online', handleOnline);

    // Cleanup
    return () => {
      window.removeEventListener('storage', handleStorageChange);
      window.removeEventListener('focus', handleFocus);
      window.removeEventListener('online', handleOnline);
    };
  }, [residentId]);
};

// Utility function để trigger data update
export const triggerDataUpdate = (type: string, residentId?: string, additionalData?: any) => {
  const updateData = {
    type,
    residentId,
    timestamp: new Date().toISOString(),
    ...additionalData
  };
  
  // Lưu vào localStorage để trigger storage event
  clientStorage.setItem('data_updated', JSON.stringify(updateData));
  
  // Xóa sau 1 giây để tránh spam
  setTimeout(() => {
    clientStorage.removeItem('data_updated');
  }, 1000);
};

// Hook để mutate dữ liệu khi component mount
export const useInitialMutate = (residentId?: string) => {
  useEffect(() => {
    // Mutate dữ liệu khi component mount
    if (residentId) {
      mutateAll.residentData(residentId);
    } else {
      mutateAll.all();
    }
  }, [residentId]);
};
