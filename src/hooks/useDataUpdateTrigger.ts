import { useEffect } from 'react';
import { triggerDataUpdate } from './useAutoMutate';

// Hook để trigger data update khi component unmount hoặc khi có action
export const useDataUpdateTrigger = () => {
  // Trigger update khi component unmount (ví dụ: sau khi đăng ký resident)
  useEffect(() => {
    return () => {
      // Trigger update khi component unmount
      triggerDataUpdate('component_unmount');
    };
  }, []);

  // Function để trigger update khi có action cụ thể
  const triggerUpdate = (type: string, residentId?: string, additionalData?: any) => {
    triggerDataUpdate(type, residentId, additionalData);
  };

  return { triggerUpdate };
};

// Hook đặc biệt cho trang đăng ký resident
export const useResidentRegistrationTrigger = () => {
  const { triggerUpdate } = useDataUpdateTrigger();

  const triggerResidentRegistration = (residentId: string) => {
    triggerUpdate('resident_registered', residentId);
  };

  return { triggerResidentRegistration };
};

// Hook đặc biệt cho trang cập nhật vital signs
export const useVitalSignsUpdateTrigger = () => {
  const { triggerUpdate } = useDataUpdateTrigger();

  const triggerVitalSignsUpdate = (residentId: string) => {
    triggerUpdate('vital_signs_updated', residentId);
  };

  return { triggerVitalSignsUpdate };
};

// Hook đặc biệt cho trang cập nhật care notes
export const useCareNotesUpdateTrigger = () => {
  const { triggerUpdate } = useDataUpdateTrigger();

  const triggerCareNotesUpdate = (residentId: string) => {
    triggerUpdate('care_notes_updated', residentId);
  };

  return { triggerCareNotesUpdate };
};

// Hook đặc biệt cho trang cập nhật staff assignments
export const useStaffAssignmentUpdateTrigger = () => {
  const { triggerUpdate } = useDataUpdateTrigger();

  const triggerStaffAssignmentUpdate = (residentId: string) => {
    triggerUpdate('staff_assignment_updated', residentId);
  };

  return { triggerStaffAssignmentUpdate };
};

// Hook đặc biệt cho trang cập nhật activities
export const useActivityUpdateTrigger = () => {
  const { triggerUpdate } = useDataUpdateTrigger();

  const triggerActivityUpdate = (residentId: string) => {
    triggerUpdate('activity_updated', residentId);
  };

  return { triggerActivityUpdate };
};
