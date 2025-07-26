// AI Recommendation System for Nursing Home Activities
// File mẫu để app build và trang AI hoạt động

export interface ResidentProfile {
  id: number | string;
  name: string;
  age?: number;
  healthConditions?: string[];
  mobilityLevel?: string;
  cognitiveLevel?: string;
  socialPreferences?: string;
  activityPreferences?: string[];
  participationHistory?: ActivityParticipation[];
  medicalRestrictions?: string[];
  personalInterests?: string[];
  physicalLimitations?: string[];
  emotionalState?: string;
  sleepPattern?: string;
  nutritionLevel?: string;
  lastAssessmentDate?: string;
  room?: string;
}

export interface ActivityParticipation {
  activityId: number;
  activityName: string;
  date: string;
  participationLevel: string;
  enjoymentRating: number;
  behaviorNotes: string;
  healthImpact: string;
}

export interface ActivityTemplate {
  id: number;
  name: string;
  category: string;
  description: string;
  requiredMobilityLevel: string[];
  requiredCognitiveLevel: string[];
  targetConditions: string[];
  contraindications: string[];
  benefits: string[];
  duration: number;
  maxParticipants: number;
  equipmentNeeded: string[];
  staffRequirements: string[];
  timeOfDay: string[];
  difficulty: string;
  socialLevel: string;
}

export interface AIRecommendation {
  activityId: number;
  activityName: string;
  recommendationScore: number;
  reasons: string[];
  benefits: string[];
  precautions: string[];
  optimalTime: string;
  suggestedDuration: number;
  recommendedParticipants: (number | string)[];
  adaptations: string[];
  priority: 'high' | 'medium' | 'low';
  confidenceLevel: number;
}

// Interface for AI API response
export interface AIRecommendationResponse {
  feedback: string;
}

// Interface for parsed AI recommendation
export interface ParsedAIRecommendation {
  activityName: string;
  description: string;
  duration: string;
  difficulty: string;
  benefits: string[];
  precautions: string[];
  priority: 'high' | 'medium' | 'low';
  confidenceLevel: number;
  objectives: string[];
  timeOfDay: string;
  detailedDescription: string;
}

// Function to parse AI response text into structured recommendations
export function parseAIRecommendation(feedback: any): ParsedAIRecommendation[] {
  if (!feedback || typeof feedback !== 'string') {
    return [];
  }
  const recommendations: ParsedAIRecommendation[] = [];
  
  console.log('Parsing AI feedback:', feedback.substring(0, 200) + '...');
  console.log('Full feedback length:', feedback.length);
  
  // Extract activity name - chỉ tìm pattern chính xác
  let activityName = '';
  
  // Pattern chính: "**Tên hoạt động:** "Tên hoạt động cụ thể""
  const activityNameMatch1 = feedback.match(/\*\*Tên hoạt động:\*\*\s*"([^"]+)"/);
  if (activityNameMatch1) {
    activityName = activityNameMatch1[1].trim();
    console.log('Found activity name (Pattern 1):', activityName);
  }
  
  // Pattern phụ: "**Tên hoạt động:** Tên hoạt động cụ thể"
  if (!activityName) {
    const activityNameMatch2 = feedback.match(/\*\*Tên hoạt động:\*\*\s*([^*\n]+)/);
    if (activityNameMatch2) {
      activityName = activityNameMatch2[1].trim();
      console.log('Found activity name (Pattern 2):', activityName);
    }
  }
  
  // Pattern dự phòng: Tìm text trong dấu ngoặc kép đầu tiên
  if (!activityName) {
    const quotedMatch = feedback.match(/"([^"]+)"/);
    if (quotedMatch) {
      const quotedText = quotedMatch[1].trim();
      // Kiểm tra xem có phải là tên hoạt động không
      if (quotedText.length > 5 && quotedText.length < 100 && 
          (quotedText.includes('Vườn') || quotedText.includes('Thư Giãn') || 
           quotedText.includes('Chăm Sóc') || quotedText.includes('Tập') ||
           quotedText.includes('Đi bộ') || quotedText.includes('Âm nhạc') ||
           quotedText.includes('Dưỡng sinh') || quotedText.includes('Yoga'))) {
        activityName = quotedText;
        console.log('Found activity name (Pattern 3):', activityName);
      }
    }
  }
  
  // Nếu vẫn không tìm thấy, tạo tên mặc định dựa trên nội dung
  if (!activityName) {
    if (feedback.includes('Vườn') || feedback.includes('cây cảnh')) {
      activityName = 'Vườn Thư Giãn: Chăm Sóc Cây Cảnh';
    } else if (feedback.includes('Đi bộ')) {
      activityName = 'Đi Bộ Thư Giãn';
    } else if (feedback.includes('Âm nhạc') || feedback.includes('nhạc cổ điển')) {
      activityName = 'Âm Nhạc Trị Liệu';
    } else if (feedback.includes('Dưỡng sinh') || feedback.includes('Yoga')) {
      activityName = 'Dưỡng Sinh/Yoga Nhẹ Nhàng';
    } else if (feedback.includes('Tập thể dục')) {
      activityName = 'Tập Thể Dục Nhẹ Nhàng';
    } else {
      activityName = 'Hoạt Động Thư Giãn Được Đề Xuất';
    }
    console.log('Created default activity name:', activityName);
  }
  
  console.log('Final activity name selected:', activityName);
  
  // Extract duration - chỉ tìm pattern chính xác
  let duration = '30-45 phút';
  const durationMatch = feedback.match(/\*\*Thời lượng:\*\*\s*([^*\n]+)/);
  if (durationMatch) {
    duration = durationMatch[1].trim();
    console.log('Found duration:', duration);
  }
  
  // Extract time of day - chỉ tìm pattern chính xác
  let timeOfDay = '';
  const timeOfDayMatch = feedback.match(/\*\*Thời điểm:\*\*\s*([^*\n]+)/);
  if (timeOfDayMatch) {
    timeOfDay = timeOfDayMatch[1].trim();
    console.log('Found time of day:', timeOfDay);
  }
  
  // Extract difficulty - chỉ tìm pattern chính xác
  let difficulty = 'Trung bình';
  const difficultyMatch = feedback.match(/\*\*Độ khó:\*\*\s*([^*\n]+)/);
  if (difficultyMatch) {
    difficulty = difficultyMatch[1].trim();
    console.log('Found difficulty:', difficulty);
  }
  
  // Extract objectives - chỉ tìm pattern chính xác
  const objectives: string[] = [];
  const objectivesSection = feedback.match(/\*\*Mục tiêu:\*\*\s*([^*]+)/);
  if (objectivesSection) {
    const objectivesText = objectivesSection[1];
    // Split by bullet points or new lines
    const objectiveLines = objectivesText.split(/[•\n]/).filter(line => line.trim());
    objectives.push(...objectiveLines.map(o => o.trim()).filter(o => o));
    console.log('Found objectives:', objectives);
  }
  
  // Extract detailed description - chỉ tìm pattern chính xác
  let detailedDescription = '';
  const descriptionSection = feedback.match(/\*\*Mô tả:\*\*\s*([^*]+)/);
  if (descriptionSection) {
    detailedDescription = descriptionSection[1].trim();
    console.log('Found detailed description:', detailedDescription.substring(0, 100) + '...');
  } else {
    // Lấy đoạn đầu tiên của feedback làm mô tả
    const lines = feedback.split('\n').filter(line => line.trim());
    detailedDescription = lines.slice(0, 3).join(' ').trim();
    console.log('Using first paragraph as description:', detailedDescription.substring(0, 100) + '...');
  }
  
  // Extract benefits - chỉ tìm pattern chính xác
  const benefits: string[] = [];
  const benefitsMatch = feedback.match(/\*\*Lợi ích:\*\*\s*([^*]+)/);
  if (benefitsMatch) {
    const benefitsText = benefitsMatch[1];
    benefits.push(...benefitsText.split(',').map(b => b.trim()).filter(b => b));
    console.log('Found benefits:', benefits);
  }
  
  // Extract precautions - chỉ tìm pattern chính xác
  const precautions: string[] = [];
  const precautionsMatch = feedback.match(/\*\*Lưu ý quan trọng:\*\*\s*([^*]+)/);
  if (precautionsMatch) {
    const precautionsText = precautionsMatch[1];
    precautions.push(...precautionsText.split(',').map(p => p.trim()).filter(p => p));
    console.log('Found precautions:', precautions);
  }
  
  // Determine priority based on difficulty
  let priority: 'high' | 'medium' | 'low' = 'medium';
  if (difficulty.toLowerCase().includes('nhẹ') || difficulty.toLowerCase().includes('dễ')) {
    priority = 'low';
  } else if (difficulty.toLowerCase().includes('khó') || difficulty.toLowerCase().includes('cao')) {
    priority = 'high';
  }
  
  // Calculate confidence level based on content completeness
  let confidenceLevel = 70; // Base confidence
  if (activityName && duration && difficulty) confidenceLevel += 20;
  if (objectives.length > 0) confidenceLevel += 10;
  
  const recommendation: ParsedAIRecommendation = {
    activityName,
    description: detailedDescription,
    duration,
    difficulty,
    benefits,
    precautions,
    priority,
    confidenceLevel: Math.min(confidenceLevel, 100),
    objectives,
    timeOfDay,
    detailedDescription
  };
  
  console.log('Final parsed recommendation:', {
    activityName: recommendation.activityName,
    duration: recommendation.duration,
    difficulty: recommendation.difficulty,
    confidenceLevel: recommendation.confidenceLevel
  });
  
  recommendations.push(recommendation);
  
  return recommendations;
}

// Hàm test để kiểm tra việc parse dữ liệu
export function testParseAIRecommendation() {
  const testFeedback = `Tuyệt vời, tôi sẽ giúp bạn tạo một hoạt động phù hợp cho cụ Nguyễn Văn An, dựa trên các thông tin bạn cung cấp, đặc biệt lưu ý đến tình trạng sức khỏe của cụ (tăng huyết áp, đau lưng mãn tính).

**Dưới đây là gợi ý chi tiết cho hoạt động:**

**Tên hoạt động:** "Thư giãn và Nghe Nhạc Cổ Điển"

**Thời lượng:** 30-45 phút

**Độ khó:** Rất nhẹ nhàng (dành cho người lớn tuổi, có bệnh lý nền)

**Thời điểm:** Buổi chiều (14:00 - 16:00)

**Mục tiêu:**
• Giảm stress và lo lắng
• Cải thiện tâm trạng
• Tăng cường thư giãn tinh thần
• Hỗ trợ giấc ngủ

**Mô tả:** Hoạt động này bao gồm việc nghe nhạc cổ điển nhẹ nhàng trong môi trường yên tĩnh, có thể kết hợp với các bài tập thở đơn giản để tăng cường hiệu quả thư giãn.

**Lợi ích:** Giảm huyết áp, giảm đau lưng, cải thiện tâm trạng, tăng cường thư giãn

**Lưu ý quan trọng:** Đảm bảo âm lượng vừa phải, không quá to, và có thể dừng bất cứ lúc nào nếu cảm thấy không thoải mái.`;

  console.log('Testing AI recommendation parsing...');
  const result = parseAIRecommendation(testFeedback);
  console.log('Parse result:', result);
  
  if (result.length > 0) {
    const rec = result[0];
    console.log('Parsed fields:');
    console.log('- Activity Name:', rec.activityName);
    console.log('- Duration:', rec.duration);
    console.log('- Difficulty:', rec.difficulty);
    console.log('- Time of Day:', rec.timeOfDay);
    console.log('- Objectives:', rec.objectives);
    console.log('- Benefits:', rec.benefits);
    console.log('- Confidence Level:', rec.confidenceLevel);
  }
  
  return result;
}

// Class giả lập AI Recommendation Engine
export class AIRecommendationEngine {
  private residentProfiles: Map<number | string, ResidentProfile> = new Map();

  loadResidentProfile(profile: ResidentProfile): void {
    this.residentProfiles.set(profile.id, profile);
  }

  generateRecommendations(residentId: number | string, timeOfDay: string = 'morning'): AIRecommendation[] {
    // Trả về 1 recommendation mẫu cho demo
    return [
      {
        activityId: 1,
        activityName: 'Tập thể dục buổi sáng',
        recommendationScore: 85,
        reasons: ['Phù hợp sức khỏe', 'Thích vận động'],
        benefits: ['Cải thiện sức khỏe', 'Tăng cường vận động'],
        precautions: ['Không tập quá sức'],
        optimalTime: '8:00',
        suggestedDuration: 45,
        recommendedParticipants: [residentId],
        adaptations: [],
        priority: 'high',
        confidenceLevel: 90
      }
    ];
  }

  generateGroupRecommendations(residentIds: (number | string)[], timeOfDay: string = 'morning'): AIRecommendation[] {
    // Trả về 1 recommendation nhóm mẫu cho demo
    return [
      {
        activityId: 2,
        activityName: 'Âm nhạc trị liệu',
        recommendationScore: 78,
        reasons: ['Tốt cho tinh thần nhóm'],
        benefits: ['Giảm stress', 'Tăng gắn kết'],
        precautions: [],
        optimalTime: '14:00',
        suggestedDuration: 60,
        recommendedParticipants: residentIds,
        adaptations: [],
        priority: 'medium',
        confidenceLevel: 80
      }
    ];
  }
}

// Singleton instance cho trang sử dụng
export const aiRecommendationEngine = new AIRecommendationEngine();

// Hàm chuyển đổi resident sang profile AI (giả lập)
export function convertToAIProfile(resident: any): ResidentProfile {
  return {
    id: resident.id || resident._id,
    name: resident.name || resident.full_name || '',
    age: resident.age,
    room: resident.room,
    // ...các trường khác nếu cần
  };
} 