import {
  VITAL_SIGNS_THRESHOLDS,
  VITAL_SIGNS_STATUS,
  VITAL_SIGNS_STATUS_COLORS,
  VITAL_SIGNS_FORM_VALIDATION
} from '@/lib/constants/vital-signs';

export interface VitalSignsData {
  bloodPressure: string;
  heartRate: number;
  temperature: number;
  oxygenSaturation: number;
  respiratoryRate?: number;
  weight?: number;
  bloodSugar?: number;
}

export type VitalSignsStatus = 'normal' | 'warning' | 'critical';

/**
 * Evaluate vital signs status based on medical thresholds
 */
export function evaluateVitalSignsStatus(data: VitalSignsData): VitalSignsStatus {
  const {
    bloodPressure,
    heartRate,
    temperature,
    oxygenSaturation,
    respiratoryRate
  } = data;

  const { HEART_RATE, TEMPERATURE, OXYGEN_SATURATION, RESPIRATORY_RATE } = VITAL_SIGNS_THRESHOLDS;

  // Check for critical conditions (excluding blood pressure)
  if (
    heartRate >= HEART_RATE.CRITICAL_HIGH ||
    heartRate <= HEART_RATE.CRITICAL_LOW ||
    temperature >= TEMPERATURE.CRITICAL_HIGH ||
    temperature <= TEMPERATURE.CRITICAL_LOW ||
    oxygenSaturation < OXYGEN_SATURATION.CRITICAL_MIN ||
    (respiratoryRate && respiratoryRate >= RESPIRATORY_RATE.CRITICAL_HIGH)
  ) {
    return VITAL_SIGNS_STATUS.CRITICAL;
  }

  // Check for warning conditions (excluding blood pressure)
  if (
    heartRate >= HEART_RATE.WARNING_HIGH ||
    heartRate <= HEART_RATE.CRITICAL_LOW ||
    temperature >= TEMPERATURE.WARNING_HIGH ||
    temperature <= TEMPERATURE.CRITICAL_LOW ||
    oxygenSaturation < OXYGEN_SATURATION.WARNING_MIN ||
    (respiratoryRate && respiratoryRate >= RESPIRATORY_RATE.WARNING_HIGH)
  ) {
    return VITAL_SIGNS_STATUS.WARNING;
  }

  return VITAL_SIGNS_STATUS.NORMAL;
}

/**
 * Get status color for vital signs
 */
export function getVitalSignsStatusColor(status: VitalSignsStatus): string {
  return VITAL_SIGNS_STATUS_COLORS[status] || VITAL_SIGNS_STATUS_COLORS.default;
}

/**
 * Validate vital signs form data
 */
export interface ValidationError {
  field: string;
  message: string;
}

export function validateVitalSignsForm(data: Partial<VitalSignsData>): ValidationError[] {
  const errors: ValidationError[] = [];
  const validation = VITAL_SIGNS_FORM_VALIDATION;

  // Blood Pressure validation - only check format, no min/max validation
  if (data.bloodPressure) {
    if (typeof data.bloodPressure !== 'string' || !/^\d{2,3}\/\d{2,3}$/.test(data.bloodPressure)) {
      errors.push({
        field: 'bloodPressure',
        message: 'Huyết áp phải có định dạng xxx/xxx (ví dụ: 120/80)'
      });
    }
  }

  // Heart Rate validation
  if (data.heartRate !== undefined) {
    if (data.heartRate < validation.HEART_RATE.MIN) {
      errors.push({
        field: 'heartRate',
        message: `Nhịp tim phải >= ${validation.HEART_RATE.MIN} bpm`
      });
    } else if (data.heartRate > validation.HEART_RATE.MAX) {
      errors.push({
        field: 'heartRate',
        message: `Nhịp tim phải <= ${validation.HEART_RATE.MAX} bpm`
      });
    }
  } else if (validation.HEART_RATE.REQUIRED) {
    errors.push({
      field: 'heartRate',
      message: 'Nhịp tim là bắt buộc'
    });
  }

  // Validate Temperature
  if (data.temperature !== undefined) {
    if (data.temperature < validation.TEMPERATURE.MIN) {
      errors.push({
        field: 'temperature',
        message: `Nhiệt độ phải >= ${validation.TEMPERATURE.MIN}°C`
      });
    }
    if (data.temperature > validation.TEMPERATURE.MAX) {
      errors.push({
        field: 'temperature',
        message: `Nhiệt độ phải <= ${validation.TEMPERATURE.MAX}°C`
      });
    }
  } else if (validation.TEMPERATURE.REQUIRED) {
    errors.push({
      field: 'temperature',
      message: 'Nhiệt độ là bắt buộc'
    });
  }

  // Validate Oxygen Saturation
  if (data.oxygenSaturation !== undefined) {
    if (data.oxygenSaturation < validation.OXYGEN_SATURATION.MIN) {
      errors.push({
        field: 'oxygenSaturation',
        message: `Nồng độ oxy phải >= ${validation.OXYGEN_SATURATION.MIN}%`
      });
    }
    if (data.oxygenSaturation > validation.OXYGEN_SATURATION.MAX) {
      errors.push({
        field: 'oxygenSaturation',
        message: `Nồng độ oxy phải <= ${validation.OXYGEN_SATURATION.MAX}%`
      });
    }
  } else if (validation.OXYGEN_SATURATION.REQUIRED) {
    errors.push({
      field: 'oxygenSaturation',
      message: 'Nồng độ oxy là bắt buộc'
    });
  }

  // Validate optional fields
  if (data.weight !== undefined && (data.weight < validation.WEIGHT.MIN || data.weight > validation.WEIGHT.MAX)) {
    errors.push({
      field: 'weight',
      message: `Cân nặng phải từ ${validation.WEIGHT.MIN}-${validation.WEIGHT.MAX} kg`
    });
  }

  if (data.bloodSugar !== undefined && (data.bloodSugar < validation.BLOOD_SUGAR.MIN || data.bloodSugar > validation.BLOOD_SUGAR.MAX)) {
    errors.push({
      field: 'bloodSugar',
      message: `Đường huyết phải từ ${validation.BLOOD_SUGAR.MIN}-${validation.BLOOD_SUGAR.MAX} mg/dL`
    });
  }

  return errors;
}

/**
 * Validate vital signs form data
 */
export function validateVitalSigns(data: any) {
  const errors = [];
  if (!data.residentId && !data.resident_id) {
    errors.push({ field: 'residentId', message: 'Vui lòng chọn người cao tuổi' });
  }
  if (!data.bloodPressure && !data.blood_pressure) {
    errors.push({ field: 'bloodPressure', message: 'Vui lòng nhập huyết áp' });
  }
  if (!data.heartRate && !data.heart_rate) {
    errors.push({ field: 'heartRate', message: 'Vui lòng nhập nhịp tim' });
  }
  if (!data.temperature) {
    errors.push({ field: 'temperature', message: 'Vui lòng nhập nhiệt độ' });
  }
  if (!data.oxygenSaturation && !data.oxygen_level) {
    errors.push({ field: 'oxygenSaturation', message: 'Vui lòng nhập nồng độ oxy' });
  }
  // Add more validation as needed
  return errors;
}

/**
 * Transform API data to VitalSigns format
 */
export function transformApiVitalSignsData(apiData: any, residents: any[]): any {
  const residentId = apiData.resident_id || apiData.residentId;
  
  // Try multiple ways to find the resident
  let resident = residents.find(r => r.id === residentId);
  if (!resident) {
    // Try with _id if id doesn't match
    resident = residents.find(r => r.id === apiData.resident_id?._id || apiData.residentId?._id);
  }
  if (!resident) {
    // Try with string comparison
    resident = residents.find(r => String(r.id) === String(residentId));
  }
  
  // Debug log for resident mapping
  console.log('🔍 Resident mapping:', {
    apiDataId: residentId,
    apiDataResidentId: apiData.resident_id,
    apiDataResidentIdType: typeof apiData.resident_id,
    availableResidentIds: residents.map(r => r.id),
    foundResident: resident,
    residentName: resident?.name
  });
  
  // Parse date and time from date_time field
  let date = '', time = '';
  if (apiData.date_time) {
    date = apiData.date_time.slice(0, 10); // YYYY-MM-DD
    time = apiData.date_time.slice(11, 16); // HH:mm (UTC, đúng như API)
  } else if (apiData.dateTime) {
    date = apiData.dateTime.slice(0, 10);
    time = apiData.dateTime.slice(11, 16);
  } else if (apiData.date && apiData.time) {
    date = apiData.date;
    time = apiData.time;
  }

  // Parse blood pressure
  let bloodPressure = '';
  if (apiData.blood_pressure && typeof apiData.blood_pressure === 'string') {
    bloodPressure = apiData.blood_pressure;
  } else {
    bloodPressure = apiData.bloodPressure || '';
  }

  const vitalSignsData = {
    bloodPressure,
    heartRate: apiData.heart_rate || apiData.heartRate,
    temperature: apiData.temperature,
    oxygenSaturation: apiData.oxygen_level || apiData.oxygenLevel || apiData.oxygenSaturation,
    respiratoryRate: apiData.respiratory_rate || apiData.respiratoryRate,
  };

  // Handle recordedBy - ensure it's always a string
  let recordedBy = 'Staff';
  if (apiData.recorded_by) {
    if (typeof apiData.recorded_by === 'object' && apiData.recorded_by !== null) {
      // If it's an object, extract the ID or name
      recordedBy = apiData.recorded_by._id || apiData.recorded_by.id || apiData.recorded_by.full_name || apiData.recorded_by.fullName || 'Staff';
    } else if (typeof apiData.recorded_by === 'string') {
      recordedBy = apiData.recorded_by;
    }
  } else if (apiData.recordedBy) {
    if (typeof apiData.recordedBy === 'object' && apiData.recordedBy !== null) {
      recordedBy = apiData.recordedBy._id || apiData.recordedBy.id || apiData.recordedBy.full_name || apiData.recordedBy.fullName || 'Staff';
    } else if (typeof apiData.recordedBy === 'string') {
      recordedBy = apiData.recordedBy;
    }
  }

  // Get resident name with fallback
  let residentName = '';
  if (resident?.name) {
    residentName = resident.name;
  } else if (apiData.resident_name) {
    residentName = apiData.resident_name;
  } else if (apiData.resident_id?.full_name) {
    residentName = apiData.resident_id.full_name;
  } else if (apiData.residentId?.full_name) {
    residentName = apiData.residentId.full_name;
  } else {
    residentName = `Resident ${residentId}`;
  }

  // Get resident avatar
  let residentAvatar = '';
  if (resident?.avatar) {
    residentAvatar = Array.isArray(resident.avatar) ? resident.avatar[0] : resident.avatar;
  } else if (apiData.resident_id?.avatar) {
    residentAvatar = Array.isArray(apiData.resident_id.avatar) ? apiData.resident_id.avatar[0] : apiData.resident_id.avatar;
  } else if (apiData.residentId?.avatar) {
    residentAvatar = Array.isArray(apiData.residentId.avatar) ? apiData.residentId.avatar[0] : apiData.residentId.avatar;
  }

  // Ensure residentId is always a string
  let finalResidentId = '';
  if (typeof apiData.resident_id === 'string') {
    finalResidentId = apiData.resident_id;
  } else if (typeof apiData.residentId === 'string') {
    finalResidentId = apiData.residentId;
  } else if (apiData.resident_id?._id) {
    finalResidentId = apiData.resident_id._id;
  } else if (apiData.residentId?._id) {
    finalResidentId = apiData.residentId._id;
  } else if (apiData.resident_id?.id) {
    finalResidentId = apiData.resident_id.id;
  } else if (apiData.residentId?.id) {
    finalResidentId = apiData.residentId.id;
  } else {
    finalResidentId = String(apiData.resident_id || apiData.residentId || '');
  }

  return {
    id: apiData._id || apiData.id,
    residentId: finalResidentId,
    residentName,
    residentAvatar,
    date,
    time,
    ...vitalSignsData,
    weight: apiData.weight,
    bloodSugar: apiData.bloodSugar,
    notes: apiData.notes,
    recordedBy,
    status: evaluateVitalSignsStatus(vitalSignsData)
  };
}

/**
 * Transform form data to API format
 */
export function transformFormDataToApi(formData: any): any {
  const date_time = formData.date && formData.time ? 
    `${formData.date}T${formData.time}:00.000Z` : undefined;
  
  const blood_pressure = formData.bloodPressure;

  return {
    resident_id: formData.residentId,
    date_time,
    temperature: formData.temperature,
    heart_rate: formData.heartRate,
    blood_pressure,
    respiratory_rate: formData.respiratoryRate,
    oxygen_level: formData.oxygenSaturation,
    weight: formData.weight,
    notes: formData.notes,
  };
} 