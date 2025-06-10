// Thư viện validation y khoa chuyên nghiệp cho viện dưỡng lão

export interface ValidationError {
  field: string;
  message: string;
  severity: 'error' | 'warning' | 'info';
  code?: string;
}

export interface MedicationData {
  name: string;
  dosage: string;
  schedule: string;
  instructions: string;
  duration: string;
}

// Danh sách thuốc thông dụng với thông tin y khoa
export const COMMON_MEDICATIONS = [
  { 
    name: 'Paracetamol', 
    maxDailyDose: 4000, 
    unit: 'mg',
    interactions: ['Warfarin'], 
    category: 'Giảm đau, hạ sốt',
    contraindications: ['Suy gan nặng'],
    sideEffects: ['Tổn thương gan nếu quá liều']
  },
  { 
    name: 'Aspirin', 
    maxDailyDose: 4000, 
    unit: 'mg',
    interactions: ['Warfarin', 'Heparin', 'Methotrexate'], 
    category: 'Giảm đau, chống viêm',
    contraindications: ['Dị ứng aspirin', 'Xuất huyết tiêu hóa'],
    sideEffects: ['Chảy máu dạ dày', 'Ù tai']
  },
  { 
    name: 'Metformin', 
    maxDailyDose: 2000, 
    unit: 'mg',
    interactions: ['Insulin', 'Alcohol'], 
    category: 'Điều trị tiểu đường',
    contraindications: ['Suy thận nặng', 'Suy tim nặng'],
    sideEffects: ['Đau bụng', 'Tiêu chảy', 'Acid lactic']
  },
  { 
    name: 'Amlodipine', 
    maxDailyDose: 10, 
    unit: 'mg',
    interactions: ['Simvastatin'], 
    category: 'Điều trị tăng huyết áp',
    contraindications: ['Sốc tim'],
    sideEffects: ['Phù chân', 'Đau đầu', 'Mệt mỏi']
  },
  { 
    name: 'Omeprazole', 
    maxDailyDose: 40, 
    unit: 'mg',
    interactions: ['Clopidogrel', 'Warfarin'], 
    category: 'Điều trị dạ dày',
    contraindications: ['Dị ứng PPI'],
    sideEffects: ['Đau đầu', 'Tiêu chảy', 'Thiếu B12 dài hạn']
  },
  { 
    name: 'Atorvastatin', 
    maxDailyDose: 80, 
    unit: 'mg',
    interactions: ['Warfarin', 'Digoxin', 'Cyclosporine'], 
    category: 'Giảm cholesterol',
    contraindications: ['Bệnh gan hoạt động'],
    sideEffects: ['Đau cơ', 'Tăng enzyme gan']
  },
  { 
    name: 'Furosemide', 
    maxDailyDose: 600, 
    unit: 'mg',
    interactions: ['Digoxin', 'Lithium', 'ACE inhibitors'], 
    category: 'Lợi tiểu',
    contraindications: ['Suy thận cấp', 'Mất nước nặng'],
    sideEffects: ['Giảm kali', 'Chóng mặt', 'Mất nước']
  },
  { 
    name: 'Losartan', 
    maxDailyDose: 100, 
    unit: 'mg',
    interactions: ['ACE inhibitors', 'Spironolactone'], 
    category: 'Điều trị tăng huyết áp',
    contraindications: ['Thai kỳ', 'Tăng kali máu'],
    sideEffects: ['Ho khan', 'Chóng mặt', 'Tăng kali']
  }
];

// Lịch uống thuốc chuẩn y khoa
export const MEDICATION_SCHEDULES = [
  { value: '1x/ngày-sáng', timeSlots: ['08:00'], description: 'Một lần/ngày (sáng)', medicalCode: 'QD' },
  { value: '1x/ngày-tối', timeSlots: ['20:00'], description: 'Một lần/ngày (tối)', medicalCode: 'QHS' },
  { value: '2x/ngày', timeSlots: ['08:00', '20:00'], description: 'Hai lần/ngày', medicalCode: 'BID' },
  { value: '3x/ngày', timeSlots: ['08:00', '14:00', '20:00'], description: 'Ba lần/ngày', medicalCode: 'TID' },
  { value: '4x/ngày', timeSlots: ['06:00', '12:00', '18:00', '24:00'], description: 'Bốn lần/ngày', medicalCode: 'QID' },
  { value: 'trước-ăn-sáng', timeSlots: ['07:30'], description: 'Trước ăn sáng', medicalCode: 'AC' },
  { value: 'sau-ăn', timeSlots: ['08:30', '13:30', '19:30'], description: 'Sau ăn', medicalCode: 'PC' },
  { value: 'mỗi-12h', timeSlots: ['08:00', '20:00'], description: 'Mỗi 12 giờ', medicalCode: 'Q12H' },
  { value: 'mỗi-8h', timeSlots: ['08:00', '16:00', '24:00'], description: 'Mỗi 8 giờ', medicalCode: 'Q8H' },
  { value: 'mỗi-6h', timeSlots: ['06:00', '12:00', '18:00', '24:00'], description: 'Mỗi 6 giờ', medicalCode: 'Q6H' },
  { value: 'khi-cần', timeSlots: [], description: 'Khi cần thiết', medicalCode: 'PRN' },
  { value: 'theo-chỉ-định', timeSlots: [], description: 'Theo chỉ định', medicalCode: 'STAT' }
];

// Validation chính
export class MedicalValidator {
  
  // Validate thông tin bác sĩ
  static validateDoctor(doctorName: string): ValidationError[] {
    const errors: ValidationError[] = [];
    
    if (!doctorName.trim()) {
      errors.push({
        field: 'doctor',
        message: 'Tên bác sĩ kê đơn là bắt buộc theo Thông tư 52/2017/TT-BYT',
        severity: 'error',
        code: 'DOCTOR_REQUIRED'
      });
    } else {
      // Kiểm tra định dạng tên bác sĩ
      const titleRegex = /^(BS\.|Bác sĩ|ThS\.|TS\.|GS\.|PGS\.)/i;
      if (!titleRegex.test(doctorName.trim())) {
        errors.push({
          field: 'doctor',
          message: 'Tên bác sĩ nên có danh xưng chuyên môn (VD: BS. Nguyễn Văn A)',
          severity: 'warning',
          code: 'DOCTOR_TITLE_MISSING'
        });
      }

      // Kiểm tra độ dài tên
      if (doctorName.trim().length < 5) {
        errors.push({
          field: 'doctor',
          message: 'Tên bác sĩ quá ngắn, vui lòng kiểm tra lại',
          severity: 'warning',
          code: 'DOCTOR_NAME_TOO_SHORT'
        });
      }
    }
    
    return errors;
  }

  // Validate một loại thuốc
  static validateMedication(medication: MedicationData, index: number): ValidationError[] {
    const errors: ValidationError[] = [];
    const prefix = `med_${index}`;

    // 1. Validate tên thuốc
    if (!medication.name.trim()) {
      errors.push({
        field: `${prefix}_name`,
        message: `Thuốc ${index + 1}: Tên thuốc không được để trống`,
        severity: 'error',
        code: 'MED_NAME_REQUIRED'
      });
    } else {
      const commonMed = COMMON_MEDICATIONS.find(cm => 
        cm.name.toLowerCase() === medication.name.toLowerCase()
      );
      
      if (!commonMed) {
        errors.push({
          field: `${prefix}_name`,
          message: `Thuốc ${index + 1}: "${medication.name}" không có trong danh mục thuốc an toàn. Vui lòng kiểm tra chính tả hoặc tham khảo dược sĩ.`,
          severity: 'warning',
          code: 'MED_NOT_IN_FORMULARY'
        });
      }
    }

    // 2. Validate liều lượng
    if (!medication.dosage.trim()) {
      errors.push({
        field: `${prefix}_dosage`,
        message: `Thuốc ${index + 1}: Liều lượng là bắt buộc`,
        severity: 'error',
        code: 'DOSAGE_REQUIRED'
      });
    } else {
      const dosageRegex = /^(\d+(\.\d+)?)\s*(mg|g|ml|viên|gói|ống|mcg|μg|IU|%|đơn vị)$/i;
      if (!dosageRegex.test(medication.dosage.trim())) {
        errors.push({
          field: `${prefix}_dosage`,
          message: `Thuốc ${index + 1}: Liều lượng phải có định dạng chuẩn y khoa (VD: 500mg, 1 viên, 5ml)`,
          severity: 'error',
          code: 'DOSAGE_INVALID_FORMAT'
        });
      } else {
        // Kiểm tra liều tối đa hàng ngày
        const commonMed = COMMON_MEDICATIONS.find(cm => 
          cm.name.toLowerCase() === medication.name.toLowerCase()
        );
        
        if (commonMed) {
          const dosageMatch = medication.dosage.match(/(\d+(\.\d+)?)/);
          const schedule = MEDICATION_SCHEDULES.find(s => s.value === medication.schedule);
          
          if (dosageMatch && schedule) {
            const singleDose = parseFloat(dosageMatch[0]);
            const timesPerDay = schedule.timeSlots.length || 1;
            const dailyDose = singleDose * timesPerDay;
            
            if (dailyDose > commonMed.maxDailyDose) {
              errors.push({
                field: `${prefix}_dosage`,
                message: `Thuốc ${index + 1}: Liều hàng ngày (${dailyDose}${commonMed.unit}) vượt quá liều tối đa khuyến cáo (${commonMed.maxDailyDose}${commonMed.unit}). Cần xem xét lại.`,
                severity: 'warning',
                code: 'DOSAGE_EXCEEDS_MAX'
              });
            }

            // Cảnh báo liều cao cho người cao tuổi
            if (dailyDose > commonMed.maxDailyDose * 0.7) {
              errors.push({
                field: `${prefix}_dosage`,
                message: `Thuốc ${index + 1}: Liều cao cho người cao tuổi. Khuyến nghị theo dõi chặt chẽ tác dụng phụ.`,
                severity: 'info',
                code: 'HIGH_DOSE_ELDERLY'
              });
            }
          }
        }
      }
    }

    // 3. Validate lịch uống
    if (!medication.schedule.trim()) {
      errors.push({
        field: `${prefix}_schedule`,
        message: `Thuốc ${index + 1}: Lịch uống thuốc là bắt buộc`,
        severity: 'error',
        code: 'SCHEDULE_REQUIRED'
      });
    } else {
      const validSchedule = MEDICATION_SCHEDULES.find(s => s.value === medication.schedule);
      if (!validSchedule) {
        errors.push({
          field: `${prefix}_schedule`,
          message: `Thuốc ${index + 1}: Lịch uống không hợp lệ`,
          severity: 'error',
          code: 'SCHEDULE_INVALID'
        });
      }
    }

    // 4. Validate thời gian điều trị
    if (!medication.duration.trim()) {
      errors.push({
        field: `${prefix}_duration`,
        message: `Thuốc ${index + 1}: Thời gian điều trị là bắt buộc`,
        severity: 'error',
        code: 'DURATION_REQUIRED'
      });
    } else {
      const durationRegex = /^(\d+)\s*(ngày|tuần|tháng|năm)$/i;
      const match = medication.duration.match(durationRegex);
      
      if (!match) {
        errors.push({
          field: `${prefix}_duration`,
          message: `Thuốc ${index + 1}: Thời gian điều trị phải có định dạng: "7 ngày", "2 tuần", "1 tháng"`,
          severity: 'error',
          code: 'DURATION_INVALID_FORMAT'
        });
      } else {
        const amount = parseInt(match[1]);
        const unit = match[2].toLowerCase();
        
        // Cảnh báo thời gian điều trị quá dài
        let maxDays = 0;
        switch (unit) {
          case 'ngày': maxDays = amount; break;
          case 'tuần': maxDays = amount * 7; break;
          case 'tháng': maxDays = amount * 30; break;
          case 'năm': maxDays = amount * 365; break;
        }
        
        if (maxDays > 90) {
          errors.push({
            field: `${prefix}_duration`,
            message: `Thuốc ${index + 1}: Thời gian điều trị dài hạn (>${maxDays} ngày). Cần theo dõi định kỳ.`,
            severity: 'info',
            code: 'LONG_TERM_TREATMENT'
          });
        }
      }
    }

    return errors;
  }

  // Kiểm tra tương tác thuốc
  static checkDrugInteractions(medications: MedicationData[]): ValidationError[] {
    const errors: ValidationError[] = [];
    const activeMeds = medications.filter(m => m.name.trim());

    for (let i = 0; i < activeMeds.length; i++) {
      for (let j = i + 1; j < activeMeds.length; j++) {
        const med1 = COMMON_MEDICATIONS.find(cm => 
          cm.name.toLowerCase() === activeMeds[i].name.toLowerCase()
        );
        const med2 = COMMON_MEDICATIONS.find(cm => 
          cm.name.toLowerCase() === activeMeds[j].name.toLowerCase()
        );

        if (med1 && med2) {
          // Kiểm tra tương tác trực tiếp
          if (med1.interactions.some(interaction => 
            interaction.toLowerCase() === med2.name.toLowerCase()
          )) {
            errors.push({
              field: 'interaction',
              message: `⚠️ CẢNH BÁO TƯƠNG TÁC: ${med1.name} và ${med2.name} có thể tương tác nghiêm trọng. Cần theo dõi chặt chẽ và điều chỉnh liều nếu cần.`,
              severity: 'warning',
              code: 'DRUG_INTERACTION'
            });
          }

          // Kiểm tra tương tác ngược
          if (med2.interactions.some(interaction => 
            interaction.toLowerCase() === med1.name.toLowerCase()
          )) {
            errors.push({
              field: 'interaction',
              message: `⚠️ CẢNH BÁO TƯƠNG TÁC: ${med2.name} và ${med1.name} có thể tương tác nghiêm trọng. Cần theo dõi chặt chẽ và điều chỉnh liều nếu cần.`,
              severity: 'warning',
              code: 'DRUG_INTERACTION'
            });
          }
        }
      }
    }

    return errors;
  }

  // Kiểm tra thuốc trùng lặp
  static checkDuplicateMedications(medications: MedicationData[]): ValidationError[] {
    const errors: ValidationError[] = [];
    const nameMap = new Map<string, number[]>();

    medications.forEach((med, index) => {
      const name = med.name.toLowerCase().trim();
      if (name) {
        if (!nameMap.has(name)) {
          nameMap.set(name, []);
        }
        nameMap.get(name)!.push(index + 1);
      }
    });

    nameMap.forEach((indices, name) => {
      if (indices.length > 1) {
        errors.push({
          field: 'duplicate',
          message: `🔄 THUỐC TRÙNG LẶP: "${name}" xuất hiện ${indices.length} lần (vị trí: ${indices.join(', ')}). Vui lòng xem xét gộp hoặc loại bỏ.`,
          severity: 'error',
          code: 'DUPLICATE_MEDICATION'
        });
      }
    });

    return errors;
  }

  // Validation tổng thể đơn thuốc
  static validatePrescription(
    doctorName: string, 
    medications: MedicationData[]
  ): ValidationError[] {
    const errors: ValidationError[] = [];

    // 1. Validate thông tin bác sĩ
    errors.push(...this.validateDoctor(doctorName));

    // 2. Validate từng thuốc
    medications.forEach((med, index) => {
      errors.push(...this.validateMedication(med, index));
    });

    // 3. Kiểm tra tương tác thuốc
    errors.push(...this.checkDrugInteractions(medications));

    // 4. Kiểm tra thuốc trùng lặp
    errors.push(...this.checkDuplicateMedications(medications));

    // 5. Kiểm tra số lượng thuốc
    const activeMeds = medications.filter(m => m.name.trim());
    if (activeMeds.length === 0) {
      errors.push({
        field: 'medications',
        message: 'Đơn thuốc phải có ít nhất một loại thuốc',
        severity: 'error',
        code: 'NO_MEDICATIONS'
      });
    } else if (activeMeds.length > 10) {
      errors.push({
        field: 'count',
        message: `Đơn thuốc có ${activeMeds.length} loại thuốc (>10). Khuyến nghị xem xét giảm đa dược để tránh tác dụng phụ.`,
        severity: 'warning',
        code: 'POLYPHARMACY_RISK'
      });
    }

    // 6. Kiểm tra độ phức tạp lịch uống
    const scheduleComplexity = new Set(
      activeMeds.map(m => m.schedule).filter(s => s)
    ).size;
    
    if (scheduleComplexity > 6) {
      errors.push({
        field: 'complexity',
        message: 'Lịch uống thuốc phức tạp (>6 thời điểm khác nhau). Cân nhắc đơn giản hóa để tăng tuân thủ điều trị.',
        severity: 'info',
        code: 'COMPLEX_SCHEDULE'
      });
    }

    return errors;
  }

  // Tính điểm rủi ro đơn thuốc (0-100)
  static calculateRiskScore(
    doctorName: string, 
    medications: MedicationData[]
  ): { score: number; level: 'low' | 'medium' | 'high'; factors: string[] } {
    const errors = this.validatePrescription(doctorName, medications);
    const factors: string[] = [];
    let score = 0;

    // Tính điểm dựa trên mức độ nghiêm trọng
    errors.forEach(error => {
      switch (error.severity) {
        case 'error':
          score += 20;
          factors.push(error.message);
          break;
        case 'warning':
          score += 10;
          factors.push(error.message);
          break;
        case 'info':
          score += 5;
          break;
      }
    });

    // Điều chỉnh điểm dựa trên số lượng thuốc
    const activeMeds = medications.filter(m => m.name.trim());
    if (activeMeds.length > 8) {
      score += 15;
      factors.push('Đa dược (>8 loại thuốc)');
    }

    // Giới hạn điểm từ 0-100
    score = Math.min(100, Math.max(0, score));

    let level: 'low' | 'medium' | 'high' = 'low';
    if (score >= 50) level = 'high';
    else if (score >= 25) level = 'medium';

    return { score, level, factors };
  }
} 