// Thư viện validation cho ghi chú chăm sóc chuyên nghiệp

export interface CareNoteValidationError {
  field: string;
  message: string;
  severity: 'error' | 'warning' | 'info';
  code?: string;
}

export interface CareNoteData {
  note: string;
  priority?: 'low' | 'medium' | 'high';
  category?: string;
}

// Các từ khóa y tế quan trọng
export const MEDICAL_KEYWORDS = {
  critical: [
    'khó thở', 'đau ngực', 'ngất xiu', 'co giật', 'sốt cao', 'chảy máu',
    'đột quỵ', 'tim đập nhanh', 'huyết áp cao', 'đường huyết thấp',
    'dị ứng', 'nhiễm trùng', 'viêm phổi', 'suy tim', 'suy thận'
  ],
  attention: [
    'đau đầu', 'chóng mặt', 'buồn nôn', 'tiêu chảy', 'táo bón',
    'mất ngủ', 'lo âu', 'trầm cảm', 'mệt mỏi', 'ăn kém',
    'sưng phù', 'tê bì', 'đau lưng', 'đau khớp', 'ho'
  ],
  medication: [
    'uống thuốc', 'bỏ thuốc', 'tác dụng phụ', 'dị ứng thuốc',
    'tăng liều', 'giảm liều', 'đổi thuốc', 'ngừng thuốc'
  ],
  nutrition: [
    'ăn kém', 'chán ăn', 'sút cân', 'tăng cân', 'khó nuốt',
    'đau bụng', 'tiêu hóa', 'nôn ói', 'ợ chua', 'đầy bụng'
  ],
  mobility: [
    'ngã', 'khó đi', 'đau khớp', 'run tay', 'yếu chân',
    'cần hỗ trợ', 'xe lăn', 'gậy chống', 'thay băng', 'vết thương'
  ],
  cognitive: [
    'quên', 'lú lẫn', 'không nhận ra', 'hoang tưởng', 'kích động',
    'trầm cảm', 'lo âu', 'mất ngủ', 'ác mộng', 'tự làm hại'
  ]
};

// Mẫu ghi chú chuẩn y tế
export const NOTE_TEMPLATES = [
  {
    category: 'Theo dõi sức khỏe',
    template: 'Huyết áp: [systolic]/[diastolic] mmHg, Mạch: [pulse] lần/phút, Nhiệt độ: [temp]°C. Tình trạng chung: [general_condition].',
    requiredFields: ['systolic', 'diastolic', 'pulse', 'temp', 'general_condition']
  },
  {
    category: 'Dùng thuốc',
    template: 'Đã uống [medication] lúc [time]. Phản ứng: [reaction]. Ghi chú: [notes].',
    requiredFields: ['medication', 'time', 'reaction']
  },
  {
    category: 'Dinh dưỡng',
    template: 'Ăn [meal_type]: [amount_eaten]. Thức uống: [drinks]. Khó khăn: [difficulties].',
    requiredFields: ['meal_type', 'amount_eaten']
  },
  {
    category: 'Vận động',
    template: 'Hoạt động: [activity]. Thời gian: [duration]. Hỗ trợ: [assistance]. Ghi chú: [notes].',
    requiredFields: ['activity']
  },
  {
    category: 'Tâm lý',
    template: 'Tâm trạng: [mood]. Giao tiếp: [communication]. Hoạt động xã hội: [social_activity]. Cần chú ý: [concerns].',
    requiredFields: ['mood']
  }
];

// Validation chuyên nghiệp cho ghi chú chăm sóc
export class CareNoteValidator {

  // Phân tích mức độ ưu tiên tự động
  static analyzeAutoPriority(note: string): 'low' | 'medium' | 'high' {
    const lowerNote = note.toLowerCase();

    // Kiểm tra từ khóa nguy hiểm
    const hasCriticalKeywords = MEDICAL_KEYWORDS.critical.some(keyword =>
      lowerNote.includes(keyword)
    );
    if (hasCriticalKeywords) return 'high';

    // Kiểm tra từ khóa cần chú ý
    const hasAttentionKeywords = MEDICAL_KEYWORDS.attention.some(keyword =>
      lowerNote.includes(keyword)
    );
    if (hasAttentionKeywords) return 'medium';

    // Kiểm tra từ khóa thuốc
    const hasMedicationKeywords = MEDICAL_KEYWORDS.medication.some(keyword =>
      lowerNote.includes(keyword)
    );
    if (hasMedicationKeywords) return 'medium';

    // Mặc định là mức độ thấp
    return 'low';
  }

  // Phân loại chủ đề ghi chú
  static categorizeNote(note: string): string {
    const lowerNote = note.toLowerCase();

    if (MEDICAL_KEYWORDS.medication.some(kw => lowerNote.includes(kw))) {
      return 'Dùng thuốc';
    }
    if (MEDICAL_KEYWORDS.nutrition.some(kw => lowerNote.includes(kw))) {
      return 'Dinh dưỡng';
    }
    if (MEDICAL_KEYWORDS.mobility.some(kw => lowerNote.includes(kw))) {
      return 'Vận động';
    }
    if (MEDICAL_KEYWORDS.cognitive.some(kw => lowerNote.includes(kw))) {
      return 'Tâm lý - Nhận thức';
    }
    if (MEDICAL_KEYWORDS.critical.some(kw => lowerNote.includes(kw)) ||
        MEDICAL_KEYWORDS.attention.some(kw => lowerNote.includes(kw))) {
      return 'Theo dõi sức khỏe';
    }

    return 'Chăm sóc tổng quát';
  }

  // Validate nội dung ghi chú
  static validateNoteContent(noteData: CareNoteData): CareNoteValidationError[] {
    const errors: CareNoteValidationError[] = [];
    const { note } = noteData;

    // 1. Kiểm tra nội dung cơ bản
    if (!note.trim()) {
      errors.push({
        field: 'note',
        message: 'Nội dung ghi chú không được để trống',
        severity: 'error',
        code: 'NOTE_CONTENT_REQUIRED'
      });
      return errors;
    }

    // 2. Kiểm tra độ dài tối thiểu
    if (note.trim().length < 10) {
      errors.push({
        field: 'note',
        message: 'Ghi chú quá ngắn (tối thiểu 10 ký tự). Cần mô tả rõ ràng tình trạng hoặc sự việc.',
        severity: 'error',
        code: 'NOTE_TOO_SHORT'
      });
    }

    // 3. Kiểm tra độ dài tối đa
    if (note.length > 1000) {
      errors.push({
        field: 'note',
        message: 'Ghi chú quá dài (>1000 ký tự). Nên tóm tắt nội dung chính hoặc chia thành nhiều ghi chú.',
        severity: 'warning',
        code: 'NOTE_TOO_LONG'
      });
    }

    // 4. Kiểm tra từ khóa y tế quan trọng
    const autoPriority = this.analyzeAutoPriority(note);
    const suggestedCategory = this.categorizeNote(note);

    errors.push({
      field: 'priority_suggestion',
      message: `Gợi ý mức độ ưu tiên: ${autoPriority === 'high' ? 'Cao' : autoPriority === 'medium' ? 'Trung bình' : 'Thấp'} - Chủ đề: ${suggestedCategory}`,
      severity: 'info',
      code: 'AUTO_PRIORITY_SUGGESTION'
    });

    // 5. Kiểm tra từ khóa nguy hiểm
    const criticalKeywords = MEDICAL_KEYWORDS.critical.filter(keyword =>
      note.toLowerCase().includes(keyword)
    );
    if (criticalKeywords.length > 0) {
      errors.push({
        field: 'critical_alert',
        message: `🚨 CẢNH BÁO: Phát hiện từ khóa nghiêm trọng "${criticalKeywords.join(', ')}". Cần báo cáo ngay cho bác sĩ và gia đình.`,
        severity: 'error',
        code: 'CRITICAL_KEYWORDS_DETECTED'
      });
    }

    // 6. Kiểm tra thông tin số liệu y tế
    const hasVitalSigns = /(\d+\/\d+|huyết áp|mạch|nhiệt độ|\d+°C|\d+ lần\/phút)/.test(note.toLowerCase());
    if (hasVitalSigns) {
      errors.push({
        field: 'vital_signs',
        message: '📊 Phát hiện chỉ số sinh hiệu. Đảm bảo đo đạc chính xác và ghi rõ thời gian đo.',
        severity: 'info',
        code: 'VITAL_SIGNS_DETECTED'
      });
    }

    // 7. Kiểm tra thông tin thuốc
    const medicationKeywords = MEDICAL_KEYWORDS.medication.filter(keyword =>
      note.toLowerCase().includes(keyword)
    );
    if (medicationKeywords.length > 0) {
      errors.push({
        field: 'medication_info',
        message: `💊 Thông tin về thuốc: "${medicationKeywords.join(', ')}". Cần ghi rõ tên thuốc, liều lượng, thời gian.`,
        severity: 'info',
        code: 'MEDICATION_INFO_DETECTED'
      });
    }

    // 8. Kiểm tra tính khách quan
    const subjectiveWords = ['có vẻ', 'hình như', 'chắc là', 'có thể', 'tôi nghĩ'];
    const hasSubjectiveLanguage = subjectiveWords.some(word => 
      note.toLowerCase().includes(word)
    );
    if (hasSubjectiveLanguage) {
      errors.push({
        field: 'objectivity',
        message: 'Ghi chú chứa ngôn ngữ chủ quan. Nên sử dụng các thuật ngữ khách quan, cụ thể.',
        severity: 'warning',
        code: 'SUBJECTIVE_LANGUAGE'
      });
    }

    // 9. Kiểm tra ngữ pháp và chính tả cơ bản
    const hasRepeatedSpaces = /\s{2,}/.test(note);
    if (hasRepeatedSpaces) {
      errors.push({
        field: 'formatting',
        message: 'Ghi chú có nhiều khoảng trắng liên tiếp. Cần chỉnh sửa định dạng.',
        severity: 'info',
        code: 'FORMATTING_ISSUE'
      });
    }

    // 10. Gợi ý mẫu ghi chú chuẩn
    const category = this.categorizeNote(note);
    const template = NOTE_TEMPLATES.find(t => t.category === category);
    if (template && note.length < 50) {
      errors.push({
        field: 'template_suggestion',
        message: `💡 Gợi ý mẫu ghi chú cho "${category}": ${template.template}`,
        severity: 'info',
        code: 'TEMPLATE_SUGGESTION'
      });
    }

    return errors;
  }

  // Validate ưu tiên thủ công
  static validatePriority(
    note: string,
    manualPriority?: 'low' | 'medium' | 'high'
  ): CareNoteValidationError[] {
    const errors: CareNoteValidationError[] = [];
    
    if (!manualPriority) return errors;

    const autoPriority = this.analyzeAutoPriority(note);
    
    // Cảnh báo nếu ưu tiên thủ công khác biệt đáng kể so với tự động
    if (autoPriority === 'high' && manualPriority === 'low') {
      errors.push({
        field: 'priority_mismatch',
        message: '⚠️ CẢNH BÁO: Ghi chú chứa từ khóa nghiêm trọng nhưng được đánh giá mức độ ưu tiên thấp. Vui lòng xem xét lại.',
        severity: 'warning',
        code: 'PRIORITY_DOWNGRADE_WARNING'
      });
    }

    if (autoPriority === 'low' && manualPriority === 'high') {
      errors.push({
        field: 'priority_mismatch',
        message: 'Ghi chú được đánh giá mức độ ưu tiên cao. Đảm bảo nội dung phản ánh đúng mức độ nghiêm trọng.',
        severity: 'info',
        code: 'PRIORITY_UPGRADE_INFO'
      });
    }

    return errors;
  }

  // Validation tổng thể
  static validateCareNote(noteData: CareNoteData): CareNoteValidationError[] {
    const errors: CareNoteValidationError[] = [];

    // 1. Validate nội dung
    errors.push(...this.validateNoteContent(noteData));

    // 2. Validate ưu tiên
    errors.push(...this.validatePriority(noteData.note, noteData.priority));

    return errors;
  }

  // Tạo ghi chú có cấu trúc
  static generateStructuredNote(
    category: string,
    data: Record<string, any>
  ): { note: string; errors: CareNoteValidationError[] } {
    const template = NOTE_TEMPLATES.find(t => t.category === category);
    const errors: CareNoteValidationError[] = [];

    if (!template) {
      errors.push({
        field: 'template',
        message: `Không tìm thấy mẫu ghi chú cho danh mục "${category}"`,
        severity: 'error',
        code: 'TEMPLATE_NOT_FOUND'
      });
      return { note: '', errors };
    }

    let note = template.template;

    // Thay thế các trường bắt buộc
    template.requiredFields.forEach(field => {
      if (!data[field]) {
        errors.push({
          field: field,
          message: `Trường "${field}" là bắt buộc cho ghi chú ${category}`,
          severity: 'error',
          code: 'REQUIRED_FIELD_MISSING'
        });
      } else {
        note = note.replace(`[${field}]`, data[field]);
      }
    });

    // Thay thế các trường tùy chọn
    Object.keys(data).forEach(key => {
      if (data[key] && !template.requiredFields.includes(key)) {
        note = note.replace(`[${key}]`, data[key]);
      }
    });

    // Xóa các trường chưa được thay thế
    note = note.replace(/\[[^\]]+\]/g, '_____');

    return { note, errors };
  }

  // Tính điểm chất lượng ghi chú (0-100)
  static calculateNoteQuality(noteData: CareNoteData): {
    score: number;
    level: 'poor' | 'fair' | 'good' | 'excellent';
    suggestions: string[];
  } {
    const errors = this.validateCareNote(noteData);
    const suggestions: string[] = [];
    let score = 100;

    // Trừ điểm cho các lỗi
    errors.forEach(error => {
      switch (error.severity) {
        case 'error':
          score -= 25;
          suggestions.push(error.message);
          break;
        case 'warning':
          score -= 10;
          break;
        case 'info':
          // Không trừ điểm cho thông tin
          break;
      }
    });

    // Thêm điểm cho các yếu tố tích cực
    const { note } = noteData;

    // Độ dài phù hợp
    if (note.length >= 50 && note.length <= 300) {
      score += 10;
    }

    // Có thông tin cụ thể (số liệu, thời gian)
    const hasSpecificInfo = /(\d+|\d+:\d+|[0-9]{1,2}\/[0-9]{1,2})/.test(note);
    if (hasSpecificInfo) {
      score += 10;
    }

    // Sử dụng thuật ngữ y tế
    const medicalTerms = [...MEDICAL_KEYWORDS.critical, ...MEDICAL_KEYWORDS.attention]
      .filter(term => note.toLowerCase().includes(term));
    if (medicalTerms.length > 0) {
      score += 5;
    }

    // Tính chuyên nghiệp (không chứa ngôn ngữ thông tục)
    const informalWords = ['ok', 'oke', 'tạm được', 'bình thường'];
    const hasInformalLanguage = informalWords.some(word => 
      note.toLowerCase().includes(word)
    );
    if (!hasInformalLanguage) {
      score += 5;
    }

    // Giới hạn điểm từ 0-100
    score = Math.max(0, Math.min(100, score));

    let level: 'poor' | 'fair' | 'good' | 'excellent' = 'poor';
    if (score >= 85) level = 'excellent';
    else if (score >= 70) level = 'good';
    else if (score >= 50) level = 'fair';

    // Thêm gợi ý cải thiện
    if (score < 50) {
      suggestions.unshift('Ghi chú cần cải thiện đáng kể về nội dung và chất lượng chuyên môn');
    } else if (score < 70) {
      suggestions.unshift('Ghi chú có thể cải thiện thêm để đạt tiêu chuẩn chuyên nghiệp');
    } else if (score >= 85) {
      suggestions.unshift('Ghi chú có chất lượng xuất sắc, đạt tiêu chuẩn chuyên nghiệp');
    }

    return { score, level, suggestions };
  }
} 