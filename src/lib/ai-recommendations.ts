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