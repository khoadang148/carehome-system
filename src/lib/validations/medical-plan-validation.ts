// Thư viện validation cho kế hoạch khám bệnh chuyên nghiệp

export interface MedicalPlanValidationError {
  field: string;
  message: string;
  severity: 'error' | 'warning' | 'info';
  code?: string;
}

export interface AppointmentData {
  type: string;
  provider: string;
  date: string;
  time: string;
  notes: string;
  priority: 'low' | 'medium' | 'high';
}

// Các loại khám và thông tin y khoa
export const MEDICAL_SERVICES = [
  {
    name: 'Khám tổng quát',
    frequency: '6 tháng',
    duration: '30 phút',
    preparation: 'Nhịn ăn 8 tiếng nếu có xét nghiệm',
    category: 'Khám định kỳ',
    requirements: ['Bác sĩ đa khoa']
  },
  {
    name: 'Khám định kỳ',
    frequency: '3 tháng',
    duration: '20 phút',
    preparation: 'Mang theo thuốc đang dùng',
    category: 'Khám định kỳ',
    requirements: ['Bác sĩ gia đình']
  },
  {
    name: 'Khám chuyên khoa tim mạch',
    frequency: '6 tháng',
    duration: '45 phút',
    preparation: 'Mang theo kết quả ECG gần nhất',
    category: 'Chuyên khoa',
    requirements: ['Bác sĩ tim mạch', 'Máy siêu âm tim']
  },
  {
    name: 'Khám chuyên khoa tiêu hóa',
    frequency: '6 tháng',
    duration: '30 phút',
    preparation: 'Nhịn ăn 12 tiếng nếu cần nội soi',
    category: 'Chuyên khoa',
    requirements: ['Bác sĩ tiêu hóa']
  },
  {
    name: 'Khám chuyên khoa thần kinh',
    frequency: '6 tháng',
    duration: '40 phút',
    preparation: 'Chuẩn bị danh sách triệu chứng',
    category: 'Chuyên khoa',
    requirements: ['Bác sĩ thần kinh']
  },
  {
    name: 'Khám chuyên khoa cơ xương khớp',
    frequency: '4 tháng',
    duration: '35 phút',
    preparation: 'Mang theo X-quang cũ',
    category: 'Chuyên khoa',
    requirements: ['Bác sĩ cơ xương khớp']
  },
  {
    name: 'Khám mắt',
    frequency: '12 tháng',
    duration: '25 phút',
    preparation: 'Không cần chuẩn bị đặc biệt',
    category: 'Chuyên khoa',
    requirements: ['Bác sĩ nhãn khoa']
  },
  {
    name: 'Khám răng hàm mặt',
    frequency: '6 tháng',
    duration: '30 phút',
    preparation: 'Đánh răng sạch sẽ trước khám',
    category: 'Chuyên khoa',
    requirements: ['Bác sĩ nha khoa']
  },
  {
    name: 'Xét nghiệm máu tổng quát',
    frequency: '3 tháng',
    duration: '15 phút',
    preparation: 'Nhịn ăn 8-12 tiếng',
    category: 'Xét nghiệm',
    requirements: ['Phòng xét nghiệm']
  },
  {
    name: 'Xét nghiệm sinh hóa',
    frequency: '3 tháng',
    duration: '15 phút',
    preparation: 'Nhịn ăn 12 tiếng',
    category: 'Xét nghiệm',
    requirements: ['Phòng xét nghiệm']
  },
  {
    name: 'Xét nghiệm nước tiểu',
    frequency: '3 tháng',
    duration: '10 phút',
    preparation: 'Lấy nước tiểu đầu tiên buổi sáng',
    category: 'Xét nghiệm',
    requirements: ['Phòng xét nghiệm']
  },
  {
    name: 'Siêu âm bụng tổng quát',
    frequency: '12 tháng',
    duration: '30 phút',
    preparation: 'Nhịn ăn 8 tiếng, uống nhiều nước',
    category: 'Chẩn đoán hình ảnh',
    requirements: ['Máy siêu âm', 'Bác sĩ chẩn đoán hình ảnh']
  },
  {
    name: 'Siêu âm tim',
    frequency: '12 tháng',
    duration: '45 phút',
    preparation: 'Không cần chuẩn bị đặc biệt',
    category: 'Chẩn đoán hình ảnh',
    requirements: ['Máy siêu âm tim', 'Bác sĩ tim mạch']
  },
  {
    name: 'Chụp X-quang ngực',
    frequency: '12 tháng',
    duration: '15 phút',
    preparation: 'Cởi áo, trang sức vùng ngực',
    category: 'Chẩn đoán hình ảnh',
    requirements: ['Máy X-quang', 'Kỹ thuật viên X-quang']
  },
  {
    name: 'Chụp X-quang cột sống',
    frequency: '18 tháng',
    duration: '20 phút',
    preparation: 'Cởi áo, trang sức',
    category: 'Chẩn đoán hình ảnh',
    requirements: ['Máy X-quang', 'Kỹ thuật viên X-quang']
  },
  {
    name: 'CT Scan',
    frequency: '24 tháng',
    duration: '30 phút',
    preparation: 'Nhịn ăn 4 tiếng, uống thuốc cản quang',
    category: 'Chẩn đoán hình ảnh',
    requirements: ['Máy CT', 'Bác sĩ chẩn đoán hình ảnh']
  },
  {
    name: 'MRI',
    frequency: '24 tháng',
    duration: '60 phút',
    preparation: 'Cởi hết đồ kim loại',
    category: 'Chẩn đoán hình ảnh',
    requirements: ['Máy MRI', 'Bác sĩ chẩn đoán hình ảnh']
  },
  {
    name: 'Vật lý trị liệu',
    frequency: '1 tuần',
    duration: '45 phút',
    preparation: 'Mặc quần áo thoải mái',
    category: 'Phục hồi chức năng',
    requirements: ['Kỹ thuật viên vật lý trị liệu']
  },
  {
    name: 'Tư vấn dinh dưỡng',
    frequency: '6 tháng',
    duration: '30 phút',
    preparation: 'Ghi chép chế độ ăn 3 ngày',
    category: 'Tư vấn',
    requirements: ['Chuyên viên dinh dưỡng']
  },
  {
    name: 'Tư vấn tâm lý',
    frequency: '6 tháng',
    duration: '45 phút',
    preparation: 'Chuẩn bị tinh thần thoải mái',
    category: 'Tư vấn',
    requirements: ['Bác sĩ tâm lý']
  },
  {
    name: 'Kiểm tra huyết áp',
    frequency: '1 tuần',
    duration: '10 phút',
    preparation: 'Nghỉ ngơi 5 phút trước đo',
    category: 'Theo dõi',
    requirements: ['Máy đo huyết áp']
  },
  {
    name: 'Kiểm tra đường huyết',
    frequency: '1 tuần',
    duration: '10 phút',
    preparation: 'Nhịn ăn 8 tiếng nếu đo đói',
    category: 'Theo dõi',
    requirements: ['Máy đo đường huyết']
  },
  {
    name: 'Theo dõi cân nặng',
    frequency: '1 tuần',
    duration: '5 phút',
    preparation: 'Cân buổi sáng, bụng đói',
    category: 'Theo dõi',
    requirements: ['Cân điện tử']
  }
];

// Khung giờ làm việc chuẩn y tế
export const WORKING_HOURS = {
  weekdays: {
    morning: { start: '07:00', end: '11:30' },
    afternoon: { start: '13:30', end: '17:00' }
  },
  saturday: {
    morning: { start: '07:00', end: '11:30' }
  },
  emergency: {
    available: '24/7'
  }
};

// Validation chuyên nghiệp cho kế hoạch y tế
export class MedicalPlanValidator {

  // Validate thông tin cơ bản của kế hoạch
  static validatePlanInfo(title: string, notes?: string): MedicalPlanValidationError[] {
    const errors: MedicalPlanValidationError[] = [];

    if (!title.trim()) {
      errors.push({
        field: 'title',
        message: 'Tên kế hoạch khám bệnh là bắt buộc theo quy trình y tế',
        severity: 'error',
        code: 'PLAN_TITLE_REQUIRED'
      });
    } else if (title.trim().length < 10) {
      errors.push({
        field: 'title',
        message: 'Tên kế hoạch nên mô tả rõ ràng mục đích (tối thiểu 10 ký tự)',
        severity: 'warning',
        code: 'PLAN_TITLE_TOO_SHORT'
      });
    }

    // Kiểm tra từ khóa chuyên môn trong tên kế hoạch
    const medicalKeywords = ['khám', 'xét nghiệm', 'theo dõi', 'điều trị', 'phục hồi', 'tư vấn'];
    const hasKeyword = medicalKeywords.some(keyword => 
      title.toLowerCase().includes(keyword)
    );
    
    if (!hasKeyword) {
      errors.push({
        field: 'title',
        message: 'Tên kế hoạch nên chứa từ khóa y tế rõ ràng (VD: khám, xét nghiệm, theo dõi)',
        severity: 'info',
        code: 'PLAN_TITLE_NO_MEDICAL_KEYWORDS'
      });
    }

    return errors;
  }

  // Validate một cuộc hẹn y tế
  static validateAppointment(appointment: AppointmentData, index: number): MedicalPlanValidationError[] {
    const errors: MedicalPlanValidationError[] = [];
    const prefix = `apt_${index}`;

    // 1. Validate loại dịch vụ y tế
    if (!appointment.type.trim()) {
      errors.push({
        field: `${prefix}_type`,
        message: `Cuộc hẹn ${index + 1}: Loại dịch vụ y tế là bắt buộc`,
        severity: 'error',
        code: 'APT_TYPE_REQUIRED'
      });
    } else {
      const service = MEDICAL_SERVICES.find(s => s.name === appointment.type);
      if (!service) {
        errors.push({
          field: `${prefix}_type`,
          message: `Cuộc hẹn ${index + 1}: "${appointment.type}" không có trong danh mục dịch vụ y tế chuẩn`,
          severity: 'warning',
          code: 'APT_TYPE_NOT_STANDARD'
        });
      } else {
        // Thông tin hữu ích về dịch vụ
        errors.push({
          field: `${prefix}_type_info`,
          message: `Cuộc hẹn ${index + 1}: ${service.name} - Thời gian: ${service.duration}, Tần suất: ${service.frequency}. Chuẩn bị: ${service.preparation}`,
          severity: 'info',
          code: 'APT_SERVICE_INFO'
        });
      }
    }

    // 2. Validate nhà cung cấp dịch vụ
    if (!appointment.provider.trim()) {
      errors.push({
        field: `${prefix}_provider`,
        message: `Cuộc hẹn ${index + 1}: Tên bác sĩ/nhà cung cấp dịch vụ là bắt buộc`,
        severity: 'error',
        code: 'APT_PROVIDER_REQUIRED'
      });
    } else {
      // Kiểm tra định dạng tên bác sĩ
      const providerRegex = /^(BS\.|Bác sĩ|ThS\.|TS\.|GS\.|PGS\.|KTV\.|Chuyên viên)/i;
      if (!providerRegex.test(appointment.provider.trim())) {
        errors.push({
          field: `${prefix}_provider`,
          message: `Cuộc hẹn ${index + 1}: Tên nhà cung cấp nên có danh xưng chuyên môn (VD: BS. Nguyễn Văn A, KTV. Trần Thị B)`,
          severity: 'warning',
          code: 'APT_PROVIDER_NO_TITLE'
        });
      }

      // Kiểm tra yêu cầu chuyên môn
      const service = MEDICAL_SERVICES.find(s => s.name === appointment.type);
      if (service && service.requirements.length > 0) {
        const hasRequiredSkill = service.requirements.some(req => 
          appointment.provider.toLowerCase().includes(req.toLowerCase().split(' ')[1]) || 
          appointment.provider.toLowerCase().includes(req.toLowerCase())
        );
        
        if (!hasRequiredSkill) {
          errors.push({
            field: `${prefix}_provider`,
            message: `Cuộc hẹn ${index + 1}: Dịch vụ "${appointment.type}" yêu cầu: ${service.requirements.join(', ')}. Vui lòng kiểm tra chuyên môn nhà cung cấp.`,
            severity: 'warning',
            code: 'APT_PROVIDER_SKILL_MISMATCH'
          });
        }
      }
    }

    // 3. Validate ngày hẹn
    if (!appointment.date.trim()) {
      errors.push({
        field: `${prefix}_date`,
        message: `Cuộc hẹn ${index + 1}: Ngày hẹn là bắt buộc`,
        severity: 'error',
        code: 'APT_DATE_REQUIRED'
      });
    } else {
      const appointmentDate = new Date(appointment.date);
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      // Kiểm tra ngày hợp lệ
      if (isNaN(appointmentDate.getTime())) {
        errors.push({
          field: `${prefix}_date`,
          message: `Cuộc hẹn ${index + 1}: Ngày hẹn không hợp lệ`,
          severity: 'error',
          code: 'APT_DATE_INVALID'
        });
      } else {
        // Kiểm tra ngày trong quá khứ
        if (appointmentDate < today) {
          errors.push({
            field: `${prefix}_date`,
            message: `Cuộc hẹn ${index + 1}: Không thể đặt lịch hẹn trong quá khứ`,
            severity: 'error',
            code: 'APT_DATE_IN_PAST'
          });
        }

        // Kiểm tra ngày quá xa trong tương lai
        const maxFutureDate = new Date();
        maxFutureDate.setMonth(maxFutureDate.getMonth() + 6);
        if (appointmentDate > maxFutureDate) {
          errors.push({
            field: `${prefix}_date`,
            message: `Cuộc hẹn ${index + 1}: Không nên đặt lịch hẹn quá xa (>6 tháng)`,
            severity: 'warning',
            code: 'APT_DATE_TOO_FAR'
          });
        }

        // Kiểm tra ngày cuối tuần cho các dịch vụ không khẩn cấp
        const dayOfWeek = appointmentDate.getDay();
        if (dayOfWeek === 0) { // Chủ nhật
          errors.push({
            field: `${prefix}_date`,
            message: `Cuộc hẹn ${index + 1}: Chủ nhật thường không có dịch vụ y tế thường quy. Vui lòng kiểm tra lại.`,
            severity: 'warning',
            code: 'APT_DATE_SUNDAY'
          });
        }
      }
    }

    // 4. Validate giờ hẹn
    if (!appointment.time.trim()) {
      errors.push({
        field: `${prefix}_time`,
        message: `Cuộc hẹn ${index + 1}: Giờ hẹn là bắt buộc`,
        severity: 'error',
        code: 'APT_TIME_REQUIRED'
      });
    } else {
      const timeRegex = /^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/;
      if (!timeRegex.test(appointment.time)) {
        errors.push({
          field: `${prefix}_time`,
          message: `Cuộc hẹn ${index + 1}: Giờ hẹn phải có định dạng HH:MM (VD: 09:30)`,
          severity: 'error',
          code: 'APT_TIME_INVALID_FORMAT'
        });
      } else {
        // Kiểm tra giờ làm việc
        const [hours, minutes] = appointment.time.split(':').map(Number);
        const timeInMinutes = hours * 60 + minutes;
        
        const appointmentDate = new Date(appointment.date);
        const dayOfWeek = appointmentDate.getDay();
        
        let isValidTime = false;
        
        if (dayOfWeek >= 1 && dayOfWeek <= 5) { // Thứ 2-6
          const morningStart = 7 * 60; // 07:00
          const morningEnd = 11 * 60 + 30; // 11:30
          const afternoonStart = 13 * 60 + 30; // 13:30
          const afternoonEnd = 17 * 60; // 17:00
          
          isValidTime = (timeInMinutes >= morningStart && timeInMinutes <= morningEnd) ||
                       (timeInMinutes >= afternoonStart && timeInMinutes <= afternoonEnd);
        } else if (dayOfWeek === 6) { // Thứ 7
          const morningStart = 7 * 60;
          const morningEnd = 11 * 60 + 30;
          isValidTime = timeInMinutes >= morningStart && timeInMinutes <= morningEnd;
        }
        
        if (!isValidTime) {
          errors.push({
            field: `${prefix}_time`,
            message: `Cuộc hẹn ${index + 1}: Giờ hẹn ngoài giờ làm việc. Thứ 2-6: 07:00-11:30, 13:30-17:00. Thứ 7: 07:00-11:30`,
            severity: 'warning',
            code: 'APT_TIME_OUTSIDE_HOURS'
          });
        }
      }
    }

    // 5. Validate mức độ ưu tiên
    if (!['low', 'medium', 'high'].includes(appointment.priority)) {
      errors.push({
        field: `${prefix}_priority`,
        message: `Cuộc hẹn ${index + 1}: Mức độ ưu tiên không hợp lệ`,
        severity: 'error',
        code: 'APT_PRIORITY_INVALID'
      });
    } else {
      // Gợi ý mức độ ưu tiên dựa trên loại dịch vụ
      const service = MEDICAL_SERVICES.find(s => s.name === appointment.type);
      if (service) {
        if (service.category === 'Chuyên khoa' && appointment.priority === 'low') {
          errors.push({
            field: `${prefix}_priority`,
            message: `Cuộc hẹn ${index + 1}: Khám chuyên khoa thường có mức độ ưu tiên Medium hoặc High`,
            severity: 'info',
            code: 'APT_PRIORITY_SUGGESTION'
          });
        }
        
        if (service.category === 'Theo dõi' && appointment.priority === 'high') {
          errors.push({
            field: `${prefix}_priority`,
            message: `Cuộc hẹn ${index + 1}: Theo dõi thường quy thường có mức độ ưu tiên Low hoặc Medium`,
            severity: 'info',
            code: 'APT_PRIORITY_SUGGESTION'
          });
        }
      }
    }

    return errors;
  }

  // Kiểm tra xung đột lịch hẹn
  static checkScheduleConflicts(appointments: AppointmentData[]): MedicalPlanValidationError[] {
    const errors: MedicalPlanValidationError[] = [];
    const schedule = new Map<string, number[]>();

    appointments.forEach((apt, index) => {
      if (apt.date && apt.time) {
        const dateTime = `${apt.date} ${apt.time}`;
        if (!schedule.has(dateTime)) {
          schedule.set(dateTime, []);
        }
        schedule.get(dateTime)!.push(index + 1);
      }
    });

    schedule.forEach((indices, dateTime) => {
      if (indices.length > 1) {
        errors.push({
          field: 'schedule_conflict',
          message: `⚠️ XUNG ĐỘT LỊCH HẸN: ${dateTime} có ${indices.length} cuộc hẹn (vị trí: ${indices.join(', ')}). Cần điều chỉnh thời gian.`,
          severity: 'error',
          code: 'SCHEDULE_CONFLICT'
        });
      }
    });

    return errors;
  }

  // Kiểm tra tần suất hợp lý của các dịch vụ
  static checkServiceFrequency(appointments: AppointmentData[]): MedicalPlanValidationError[] {
    const errors: MedicalPlanValidationError[] = [];
    const serviceCount = new Map<string, number>();

    appointments.forEach(apt => {
      if (apt.type) {
        serviceCount.set(apt.type, (serviceCount.get(apt.type) || 0) + 1);
      }
    });

    serviceCount.forEach((count, serviceName) => {
      if (count > 1) {
        const service = MEDICAL_SERVICES.find(s => s.name === serviceName);
        if (service) {
          // Tính khoảng cách tối thiểu giữa các lần khám
          let minDaysBetween = 30; // Mặc định 1 tháng
          
          if (service.frequency.includes('tuần')) {
            const weeks = parseInt(service.frequency.match(/(\d+)/)?.[0] || '1');
            minDaysBetween = weeks * 7;
          } else if (service.frequency.includes('tháng')) {
            const months = parseInt(service.frequency.match(/(\d+)/)?.[0] || '1');
            minDaysBetween = months * 30;
          }
          
          errors.push({
            field: 'frequency',
            message: `Dịch vụ "${serviceName}" có ${count} lần trong kế hoạch. Tần suất khuyến nghị: ${service.frequency}. Đảm bảo khoảng cách tối thiểu ${minDaysBetween} ngày.`,
            severity: 'info',
            code: 'SERVICE_FREQUENCY_INFO'
          });
        }
      }
    });

    return errors;
  }

  // Validation tổng thể kế hoạch y tế
  static validateMedicalPlan(
    title: string,
    appointments: AppointmentData[],
    notes?: string
  ): MedicalPlanValidationError[] {
    const errors: MedicalPlanValidationError[] = [];

    // 1. Validate thông tin cơ bản
    errors.push(...this.validatePlanInfo(title, notes));

    // 2. Validate từng cuộc hẹn
    appointments.forEach((apt, index) => {
      errors.push(...this.validateAppointment(apt, index));
    });

    // 3. Kiểm tra xung đột lịch hẹn
    errors.push(...this.checkScheduleConflicts(appointments));

    // 4. Kiểm tra tần suất dịch vụ
    errors.push(...this.checkServiceFrequency(appointments));

    // 5. Kiểm tra số lượng cuộc hẹn
    const validAppointments = appointments.filter(apt => apt.type && apt.date && apt.time);
    if (validAppointments.length === 0) {
      errors.push({
        field: 'appointments',
        message: 'Kế hoạch y tế phải có ít nhất một cuộc hẹn hợp lệ',
        severity: 'error',
        code: 'NO_VALID_APPOINTMENTS'
      });
    } else if (validAppointments.length > 15) {
      errors.push({
        field: 'appointments',
        message: `Kế hoạch có ${validAppointments.length} cuộc hẹn (>15). Cân nhắc chia thành nhiều kế hoạch nhỏ để dễ quản lý.`,
        severity: 'warning',
        code: 'TOO_MANY_APPOINTMENTS'
      });
    }

    // 6. Kiểm tra tính cân bằng của kế hoạch
    const categories = new Set(
      validAppointments.map(apt => {
        const service = MEDICAL_SERVICES.find(s => s.name === apt.type);
        return service?.category || 'Khác';
      })
    );

    if (categories.size === 1 && validAppointments.length > 3) {
      errors.push({
        field: 'balance',
        message: 'Kế hoạch tập trung vào một loại dịch vụ. Cân nhắc thêm các dịch vụ khác để chăm sóc toàn diện.',
        severity: 'info',
        code: 'PLAN_NOT_BALANCED'
      });
    }

    return errors;
  }

  // Tính điểm chất lượng kế hoạch (0-100)
  static calculatePlanQuality(
    title: string,
    appointments: AppointmentData[],
    notes?: string
  ): { score: number; level: 'poor' | 'fair' | 'good' | 'excellent'; recommendations: string[] } {
    const errors = this.validateMedicalPlan(title, appointments, notes);
    const recommendations: string[] = [];
    let score = 100;

    // Trừ điểm cho các lỗi
    errors.forEach(error => {
      switch (error.severity) {
        case 'error':
          score -= 15;
          recommendations.push(error.message);
          break;
        case 'warning':
          score -= 8;
          break;
        case 'info':
          score -= 3;
          break;
      }
    });

    // Thêm điểm cho các yếu tố tích cực
    const validAppointments = appointments.filter(apt => apt.type && apt.date && apt.time);
    
    // Đa dạng dịch vụ
    const categories = new Set(
      validAppointments.map(apt => {
        const service = MEDICAL_SERVICES.find(s => s.name === apt.type);
        return service?.category || 'Khác';
      })
    );
    score += Math.min(categories.size * 5, 20);

    // Kế hoạch có ghi chú chi tiết
    if (notes && notes.length > 50) {
      score += 5;
    }

    // Phân bổ ưu tiên hợp lý
    const priorities = validAppointments.map(apt => apt.priority);
    const hasHighPriority = priorities.includes('high');
    const hasMediumPriority = priorities.includes('medium');
    const hasLowPriority = priorities.includes('low');
    
    if (hasHighPriority && hasMediumPriority && hasLowPriority) {
      score += 10;
    }

    // Giới hạn điểm từ 0-100
    score = Math.max(0, Math.min(100, score));

    let level: 'poor' | 'fair' | 'good' | 'excellent' = 'poor';
    if (score >= 85) level = 'excellent';
    else if (score >= 70) level = 'good';
    else if (score >= 50) level = 'fair';

    // Thêm khuyến nghị dựa trên điểm số
    if (score < 50) {
      recommendations.unshift('Kế hoạch cần cải thiện đáng kể về chất lượng và tính khả thi');
    } else if (score < 70) {
      recommendations.unshift('Kế hoạch có thể cải thiện thêm để đạt chất lượng tốt hơn');
    } else if (score >= 85) {
      recommendations.unshift('Kế hoạch có chất lượng xuất sắc, phù hợp để triển khai');
    }

    return { score, level, recommendations };
  }
} 
