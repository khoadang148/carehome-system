// AI Recommendation System for Nursing Home Activities
// Based on resident health conditions, preferences, participation history, and medical data

export interface ResidentProfile {
  id: number;
  name: string;
  age: number;
  healthConditions: string[];
  mobilityLevel: 'high' | 'medium' | 'low' | 'wheelchair';
  cognitiveLevel: 'normal' | 'mild_decline' | 'moderate_decline' | 'severe_decline';
  socialPreferences: 'group' | 'small_group' | 'individual' | 'mixed';
  activityPreferences: string[];
  participationHistory: ActivityParticipation[];
  medicalRestrictions: string[];
  personalInterests: string[];
  physicalLimitations: string[];
  emotionalState: 'happy' | 'sad' | 'anxious' | 'calm' | 'agitated';
  sleepPattern: 'good' | 'fair' | 'poor';
  nutritionLevel: 'good' | 'fair' | 'poor';
  lastAssessmentDate: string;
}

export interface ActivityParticipation {
  activityId: number;
  activityName: string;
  date: string;
  participationLevel: 'full' | 'partial' | 'observer' | 'declined';
  enjoymentRating: number; // 1-5 scale
  behaviorNotes: string;
  healthImpact: 'positive' | 'neutral' | 'negative';
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
  difficulty: 'easy' | 'medium' | 'hard';
  socialLevel: 'individual' | 'small_group' | 'large_group';
}

export interface AIRecommendation {
  activityId: number;
  activityName: string;
  recommendationScore: number; // 0-100
  reasons: string[];
  benefits: string[];
  precautions: string[];
  optimalTime: string;
  suggestedDuration: number;
  recommendedParticipants: number[];
  adaptations: string[];
  priority: 'high' | 'medium' | 'low';
  confidenceLevel: number; // 0-100
}

// Activity templates database
const ACTIVITY_TEMPLATES: ActivityTemplate[] = [
  {
    id: 1,
    name: 'Tập thể dục nhẹ nhàng',
    category: 'Thể chất',
    description: 'Các bài tập kéo giãn và vận động nhẹ cho người cao tuổi',
    requiredMobilityLevel: ['high', 'medium'],
    requiredCognitiveLevel: ['normal', 'mild_decline'],
    targetConditions: ['arthritis', 'diabetes', 'heart_disease'],
    contraindications: ['severe_heart_condition', 'recent_surgery'],
    benefits: ['Cải thiện tuần hoàn máu', 'Tăng cường sức mạnh cơ bắp', 'Cải thiện tâm trạng'],
    duration: 30,
    maxParticipants: 15,
    equipmentNeeded: ['Thảm yoga', 'Ghế hỗ trợ'],
    staffRequirements: ['Nhân viên vật lý trị liệu'],
    timeOfDay: ['morning', 'afternoon'],
    difficulty: 'easy',
    socialLevel: 'large_group'
  },
  {
    id: 2,
    name: 'Trị liệu âm nhạc',
    category: 'Trị liệu',
    description: 'Nghe nhạc và hát theo để cải thiện tâm trạng và trí nhớ',
    requiredMobilityLevel: ['high', 'medium', 'low', 'wheelchair'],
    requiredCognitiveLevel: ['normal', 'mild_decline', 'moderate_decline'],
    targetConditions: ['depression', 'anxiety', 'dementia', 'alzheimer'],
    contraindications: ['severe_hearing_loss'],
    benefits: ['Cải thiện trí nhớ', 'Giảm stress', 'Tăng cường giao tiếp xã hội'],
    duration: 45,
    maxParticipants: 20,
    equipmentNeeded: ['Loa', 'Nhạc cụ đơn giản'],
    staffRequirements: ['Chuyên viên âm nhạc trị liệu'],
    timeOfDay: ['morning', 'afternoon', 'evening'],
    difficulty: 'easy',
    socialLevel: 'large_group'
  },
  {
    id: 3,
    name: 'Làm vườn trị liệu',
    category: 'Trị liệu',
    description: 'Chăm sóc cây cối và làm vườn để kích thích giác quan',
    requiredMobilityLevel: ['high', 'medium'],
    requiredCognitiveLevel: ['normal', 'mild_decline'],
    targetConditions: ['depression', 'anxiety', 'arthritis'],
    contraindications: ['severe_allergies', 'skin_conditions'],
    benefits: ['Kích thích giác quan', 'Cải thiện khéo léo tay', 'Giảm stress'],
    duration: 60,
    maxParticipants: 8,
    equipmentNeeded: ['Dụng cụ làm vườn', 'Găng tay', 'Cây giống'],
    staffRequirements: ['Nhân viên hoạt động'],
    timeOfDay: ['morning', 'afternoon'],
    difficulty: 'medium',
    socialLevel: 'small_group'
  },
  {
    id: 4,
    name: 'Trò chơi trí nhớ',
    category: 'Nhận thức',
    description: 'Các trò chơi và bài tập kích thích trí nhớ và tư duy',
    requiredMobilityLevel: ['high', 'medium', 'low', 'wheelchair'],
    requiredCognitiveLevel: ['normal', 'mild_decline'],
    targetConditions: ['dementia', 'alzheimer', 'mild_cognitive_impairment'],
    contraindications: ['severe_cognitive_decline'],
    benefits: ['Kích thích trí nhớ', 'Cải thiện tập trung', 'Ngăn ngừa suy giảm nhận thức'],
    duration: 45,
    maxParticipants: 10,
    equipmentNeeded: ['Thẻ trò chơi', 'Puzzle', 'Bút viết'],
    staffRequirements: ['Chuyên viên nhận thức'],
    timeOfDay: ['morning', 'afternoon'],
    difficulty: 'medium',
    socialLevel: 'small_group'
  },
  {
    id: 5,
    name: 'Mỹ thuật sáng tạo',
    category: 'Sáng tạo',
    description: 'Vẽ tranh, làm đồ thủ công để kích thích sáng tạo',
    requiredMobilityLevel: ['high', 'medium', 'low'],
    requiredCognitiveLevel: ['normal', 'mild_decline', 'moderate_decline'],
    targetConditions: ['depression', 'anxiety', 'arthritis'],
    contraindications: ['severe_hand_tremor'],
    benefits: ['Kích thích sáng tạo', 'Cải thiện khéo léo tay', 'Tăng cường tự tin'],
    duration: 90,
    maxParticipants: 12,
    equipmentNeeded: ['Giấy vẽ', 'Màu nước', 'Cọ vẽ', 'Kéo'],
    staffRequirements: ['Nhân viên nghệ thuật'],
    timeOfDay: ['morning', 'afternoon'],
    difficulty: 'easy',
    socialLevel: 'small_group'
  },
  {
    id: 6,
    name: 'Đọc sách và thảo luận',
    category: 'Giáo dục',
    description: 'Đọc sách và thảo luận nhóm để kích thích tư duy',
    requiredMobilityLevel: ['high', 'medium', 'low', 'wheelchair'],
    requiredCognitiveLevel: ['normal'],
    targetConditions: ['depression', 'social_isolation'],
    contraindications: ['severe_hearing_loss', 'severe_vision_loss'],
    benefits: ['Kích thích tư duy', 'Tăng cường giao tiếp xã hội', 'Mở rộng kiến thức'],
    duration: 60,
    maxParticipants: 8,
    equipmentNeeded: ['Sách', 'Kính lúp', 'Ghế thoải mái'],
    staffRequirements: ['Nhân viên thư viện'],
    timeOfDay: ['morning', 'afternoon'],
    difficulty: 'medium',
    socialLevel: 'small_group'
  }
];

export class AIRecommendationEngine {
  private activityTemplates: ActivityTemplate[];
  private residentProfiles: Map<number, ResidentProfile>;

  constructor() {
    this.activityTemplates = ACTIVITY_TEMPLATES;
    this.residentProfiles = new Map();
  }

  // Load resident profile
  loadResidentProfile(profile: ResidentProfile): void {
    this.residentProfiles.set(profile.id, profile);
  }

  // Main recommendation function
  generateRecommendations(residentId: number, timeOfDay: string = 'morning'): AIRecommendation[] {
    const resident = this.residentProfiles.get(residentId);
    if (!resident) {
      throw new Error('Resident profile not found');
    }

    const recommendations: AIRecommendation[] = [];

    for (const activity of this.activityTemplates) {
      const score = this.calculateRecommendationScore(resident, activity, timeOfDay);
      
      if (score > 30) { // Only recommend activities with score > 30
        const recommendation = this.createRecommendation(resident, activity, score, timeOfDay);
        recommendations.push(recommendation);
      }
    }

    // Sort by recommendation score (highest first)
    return recommendations.sort((a, b) => b.recommendationScore - a.recommendationScore);
  }

  // Generate group recommendations for multiple residents
  generateGroupRecommendations(residentIds: number[], timeOfDay: string = 'morning'): AIRecommendation[] {
    const groupRecommendations: AIRecommendation[] = [];

    for (const activity of this.activityTemplates) {
      const compatibleResidents: number[] = [];
      let totalScore = 0;

      for (const residentId of residentIds) {
        const resident = this.residentProfiles.get(residentId);
        if (resident) {
          const score = this.calculateRecommendationScore(resident, activity, timeOfDay);
          if (score > 40) { // Higher threshold for group activities
            compatibleResidents.push(residentId);
            totalScore += score;
          }
        }
      }

      if (compatibleResidents.length >= 2) { // Need at least 2 participants
        const avgScore = totalScore / compatibleResidents.length;
        const groupRecommendation = this.createGroupRecommendation(activity, avgScore, compatibleResidents, timeOfDay);
        groupRecommendations.push(groupRecommendation);
      }
    }

    return groupRecommendations.sort((a, b) => b.recommendationScore - a.recommendationScore);
  }

  // Calculate recommendation score based on multiple factors
  private calculateRecommendationScore(resident: ResidentProfile, activity: ActivityTemplate, timeOfDay: string): number {
    let score = 0;

    // Health condition compatibility (30 points)
    score += this.calculateHealthCompatibility(resident, activity);

    // Mobility and cognitive level compatibility (25 points)
    score += this.calculatePhysicalCompatibility(resident, activity);

    // Personal preferences and interests (20 points)
    score += this.calculatePreferenceMatch(resident, activity);

    // Historical participation data (15 points)
    score += this.calculateHistoricalMatch(resident, activity);

    // Current emotional and physical state (10 points)
    score += this.calculateCurrentStateMatch(resident, activity, timeOfDay);

    return Math.min(100, Math.max(0, score));
  }

  private calculateHealthCompatibility(resident: ResidentProfile, activity: ActivityTemplate): number {
    let score = 0;

    // Check contraindications
    for (const condition of resident.healthConditions) {
      if (activity.contraindications.includes(condition)) {
        return 0; // Immediate disqualification
      }
    }

    // Check target conditions
    for (const condition of resident.healthConditions) {
      if (activity.targetConditions.includes(condition)) {
        score += 10;
      }
    }

    // Check medical restrictions
    if (resident.medicalRestrictions.length === 0) {
      score += 10;
    } else {
      score += Math.max(0, 10 - resident.medicalRestrictions.length * 2);
    }

    return Math.min(30, score);
  }

  private calculatePhysicalCompatibility(resident: ResidentProfile, activity: ActivityTemplate): number {
    let score = 0;

    // Mobility level compatibility
    if (activity.requiredMobilityLevel.includes(resident.mobilityLevel)) {
      score += 15;
    } else {
      return 0; // Cannot participate
    }

    // Cognitive level compatibility
    if (activity.requiredCognitiveLevel.includes(resident.cognitiveLevel)) {
      score += 10;
    } else if (resident.cognitiveLevel === 'severe_decline') {
      return 0; // Cannot participate in most activities
    }

    return score;
  }

  private calculatePreferenceMatch(resident: ResidentProfile, activity: ActivityTemplate): number {
    let score = 0;

    // Activity category preferences
    if (resident.activityPreferences.includes(activity.category)) {
      score += 8;
    }

    // Personal interests alignment
    for (const interest of resident.personalInterests) {
      if (activity.description.toLowerCase().includes(interest.toLowerCase()) || 
          activity.name.toLowerCase().includes(interest.toLowerCase())) {
        score += 4;
      }
    }

    // Social preference match
    const socialMatch = this.checkSocialPreferenceMatch(resident.socialPreferences, activity.socialLevel);
    score += socialMatch;

    return Math.min(20, score);
  }

  private calculateHistoricalMatch(resident: ResidentProfile, activity: ActivityTemplate): number {
    let score = 0;
    const relevantHistory = resident.participationHistory.filter(p => 
      p.activityName.toLowerCase().includes(activity.category.toLowerCase()) ||
      p.activityName === activity.name
    );

    if (relevantHistory.length === 0) {
      return 5; // Neutral score for new activities
    }

    const avgEnjoyment = relevantHistory.reduce((sum, p) => sum + p.enjoymentRating, 0) / relevantHistory.length;
    const positiveParticipation = relevantHistory.filter(p => p.participationLevel === 'full').length;
    const positiveImpact = relevantHistory.filter(p => p.healthImpact === 'positive').length;

    score += avgEnjoyment * 2; // Up to 10 points
    score += (positiveParticipation / relevantHistory.length) * 5; // Up to 5 points
    score += (positiveImpact / relevantHistory.length) * 5; // Up to 5 points

    return Math.min(15, score);
  }

  private calculateCurrentStateMatch(resident: ResidentProfile, activity: ActivityTemplate, timeOfDay: string): number {
    let score = 0;

    // Time of day compatibility
    if (activity.timeOfDay.includes(timeOfDay)) {
      score += 3;
    }

    // Emotional state considerations
    switch (resident.emotionalState) {
      case 'happy':
      case 'calm':
        score += 3;
        break;
      case 'anxious':
        if (activity.category === 'Trị liệu' || activity.category === 'Sáng tạo') {
          score += 2;
        }
        break;
      case 'sad':
        if (activity.socialLevel === 'large_group' || activity.category === 'Trị liệu') {
          score += 2;
        }
        break;
      case 'agitated':
        if (activity.category === 'Thể chất' || activity.category === 'Sáng tạo') {
          score += 1;
        }
        break;
    }

    // Sleep and nutrition considerations
    if (resident.sleepPattern === 'good' && resident.nutritionLevel === 'good') {
      score += 2;
    } else if (resident.sleepPattern === 'poor' && timeOfDay === 'morning') {
      score -= 2;
    }

    return Math.min(10, Math.max(0, score));
  }

  private checkSocialPreferenceMatch(preference: string, activitySocial: string): number {
    const compatibilityMatrix: { [key: string]: { [key: string]: number } } = {
      'group': { 'large_group': 8, 'small_group': 6, 'individual': 2 },
      'small_group': { 'small_group': 8, 'large_group': 5, 'individual': 4 },
      'individual': { 'individual': 8, 'small_group': 4, 'large_group': 1 },
      'mixed': { 'large_group': 6, 'small_group': 6, 'individual': 6 }
    };

    return compatibilityMatrix[preference]?.[activitySocial] || 0;
  }

  private createRecommendation(resident: ResidentProfile, activity: ActivityTemplate, score: number, timeOfDay: string): AIRecommendation {
    const reasons = this.generateReasons(resident, activity);
    const precautions = this.generatePrecautions(resident, activity);
    const adaptations = this.generateAdaptations(resident, activity);

    return {
      activityId: activity.id,
      activityName: activity.name,
      recommendationScore: Math.round(score),
      reasons,
      benefits: activity.benefits,
      precautions,
      optimalTime: this.getOptimalTime(timeOfDay, resident),
      suggestedDuration: this.calculateOptimalDuration(activity.duration, resident),
      recommendedParticipants: [resident.id],
      adaptations,
      priority: score > 80 ? 'high' : score > 60 ? 'medium' : 'low',
      confidenceLevel: this.calculateConfidenceLevel(resident, activity)
    };
  }

  private createGroupRecommendation(activity: ActivityTemplate, score: number, residentIds: number[], timeOfDay: string): AIRecommendation {
    return {
      activityId: activity.id,
      activityName: activity.name,
      recommendationScore: Math.round(score),
      reasons: [`Phù hợp với ${residentIds.length} cư dân`, 'Tăng cường tương tác xã hội'],
      benefits: activity.benefits,
      precautions: ['Theo dõi tương tác giữa các cư dân'],
      optimalTime: timeOfDay,
      suggestedDuration: activity.duration,
      recommendedParticipants: residentIds,
      adaptations: ['Điều chỉnh theo nhóm'],
      priority: score > 80 ? 'high' : score > 60 ? 'medium' : 'low',
      confidenceLevel: Math.min(95, score + 10)
    };
  }

  private generateReasons(resident: ResidentProfile, activity: ActivityTemplate): string[] {
    const reasons: string[] = [];

    // Health-based reasons
    for (const condition of resident.healthConditions) {
      if (activity.targetConditions.includes(condition)) {
        reasons.push(`Phù hợp với tình trạng ${condition}`);
      }
    }

    // Preference-based reasons
    if (resident.activityPreferences.includes(activity.category)) {
      reasons.push(`Phù hợp với sở thích ${activity.category}`);
    }

    // Physical compatibility
    if (activity.requiredMobilityLevel.includes(resident.mobilityLevel)) {
      reasons.push(`Phù hợp với khả năng vận động`);
    }

    // Social preference
    reasons.push(`Phù hợp với xu hướng ${resident.socialPreferences}`);

    return reasons.slice(0, 3); // Limit to top 3 reasons
  }

  private generatePrecautions(resident: ResidentProfile, activity: ActivityTemplate): string[] {
    const precautions: string[] = [];

    // Medical restrictions
    if (resident.medicalRestrictions.length > 0) {
      precautions.push('Cần lưu ý hạn chế y tế');
    }

    // Physical limitations
    if (resident.physicalLimitations.length > 0) {
      precautions.push('Cần điều chỉnh theo hạn chế vật lý');
    }

    // Cognitive considerations
    if (resident.cognitiveLevel !== 'normal') {
      precautions.push('Cần hỗ trợ thêm do suy giảm nhận thức');
    }

    // Emotional state
    if (resident.emotionalState === 'anxious' || resident.emotionalState === 'agitated') {
      precautions.push('Cần theo dõi trạng thái cảm xúc');
    }

    return precautions;
  }

  private generateAdaptations(resident: ResidentProfile, activity: ActivityTemplate): string[] {
    const adaptations: string[] = [];

    // Mobility adaptations
    if (resident.mobilityLevel === 'low' || resident.mobilityLevel === 'wheelchair') {
      adaptations.push('Điều chỉnh bài tập cho người hạn chế di chuyển');
    }

    // Cognitive adaptations
    if (resident.cognitiveLevel === 'mild_decline') {
      adaptations.push('Đơn giản hóa hướng dẫn và lặp lại');
    } else if (resident.cognitiveLevel === 'moderate_decline') {
      adaptations.push('Cần hỗ trợ 1:1 và hướng dẫn từng bước');
    }

    // Duration adaptations
    if (resident.age > 85 || resident.physicalLimitations.length > 2) {
      adaptations.push('Rút ngắn thời gian hoạt động');
    }

    return adaptations;
  }

  private getOptimalTime(timeOfDay: string, resident: ResidentProfile): string {
    // Consider sleep pattern and energy levels
    if (resident.sleepPattern === 'poor' && timeOfDay === 'morning') {
      return '10:00-11:00'; // Later morning
    } else if (timeOfDay === 'morning') {
      return '09:00-10:00';
    } else if (timeOfDay === 'afternoon') {
      return '14:00-15:00';
    } else {
      return '19:00-20:00';
    }
  }

  private calculateOptimalDuration(originalDuration: number, resident: ResidentProfile): number {
    let duration = originalDuration;

    // Adjust based on age
    if (resident.age > 85) {
      duration *= 0.8;
    }

    // Adjust based on physical limitations
    if (resident.physicalLimitations.length > 2) {
      duration *= 0.7;
    }

    // Adjust based on cognitive level
    if (resident.cognitiveLevel === 'moderate_decline') {
      duration *= 0.8;
    } else if (resident.cognitiveLevel === 'severe_decline') {
      duration *= 0.6;
    }

    return Math.max(15, Math.round(duration)); // Minimum 15 minutes
  }

  private calculateConfidenceLevel(resident: ResidentProfile, activity: ActivityTemplate): number {
    let confidence = 50; // Base confidence

    // Increase confidence based on data quality
    if (resident.participationHistory.length > 5) {
      confidence += 20;
    } else if (resident.participationHistory.length > 0) {
      confidence += 10;
    }

    // Increase confidence for well-matched activities
    if (activity.requiredMobilityLevel.includes(resident.mobilityLevel) &&
        activity.requiredCognitiveLevel.includes(resident.cognitiveLevel)) {
      confidence += 20;
    }

    // Decrease confidence for complex cases
    if (resident.medicalRestrictions.length > 3) {
      confidence -= 15;
    }

    if (resident.physicalLimitations.length > 3) {
      confidence -= 10;
    }

    return Math.min(95, Math.max(25, confidence));
  }

  // Update resident profile based on activity participation
  updateResidentProfile(residentId: number, participation: ActivityParticipation): void {
    const resident = this.residentProfiles.get(residentId);
    if (resident) {
      resident.participationHistory.push(participation);
      
      // Keep only last 50 participation records
      if (resident.participationHistory.length > 50) {
        resident.participationHistory = resident.participationHistory.slice(-50);
      }
      
      this.residentProfiles.set(residentId, resident);
    }
  }

  // Get activity insights for reporting
  getActivityInsights(residentId: number): any {
    const resident = this.residentProfiles.get(residentId);
    if (!resident) return null;

    const history = resident.participationHistory;
    const totalActivities = history.length;
    const avgEnjoyment = history.reduce((sum, p) => sum + p.enjoymentRating, 0) / totalActivities;
    const favoriteCategories = this.getFavoriteCategories(history);
    const improvementAreas = this.getImprovementAreas(resident);

    return {
      totalActivities,
      avgEnjoyment: Math.round(avgEnjoyment * 10) / 10,
      favoriteCategories,
      improvementAreas,
      participationTrend: this.getParticipationTrend(history)
    };
  }

  private getFavoriteCategories(history: ActivityParticipation[]): string[] {
    const categoryCount: { [key: string]: number } = {};
    
    for (const activity of this.activityTemplates) {
      const relatedHistory = history.filter(h => h.activityName.includes(activity.name));
      if (relatedHistory.length > 0) {
        const avgEnjoyment = relatedHistory.reduce((sum, h) => sum + h.enjoymentRating, 0) / relatedHistory.length;
        categoryCount[activity.category] = (categoryCount[activity.category] || 0) + avgEnjoyment;
      }
    }

    return Object.entries(categoryCount)
      .sort(([,a], [,b]) => b - a)
      .slice(0, 3)
      .map(([category]) => category);
  }

  private getImprovementAreas(resident: ResidentProfile): string[] {
    const areas: string[] = [];

    if (resident.mobilityLevel === 'low' || resident.mobilityLevel === 'wheelchair') {
      areas.push('Cải thiện khả năng vận động');
    }

    if (resident.cognitiveLevel !== 'normal') {
      areas.push('Kích thích hoạt động nhận thức');
    }

    if (resident.socialPreferences === 'individual') {
      areas.push('Tăng cường tương tác xã hội');
    }

    if (resident.emotionalState === 'sad' || resident.emotionalState === 'anxious') {
      areas.push('Cải thiện tâm trạng');
    }

    return areas;
  }

  private getParticipationTrend(history: ActivityParticipation[]): string {
    if (history.length < 5) return 'Chưa đủ dữ liệu';

    const recent = history.slice(-5);
    const older = history.slice(-10, -5);

    if (older.length === 0) return 'Mới tham gia';

    const recentAvg = recent.reduce((sum, p) => sum + p.enjoymentRating, 0) / recent.length;
    const olderAvg = older.reduce((sum, p) => sum + p.enjoymentRating, 0) / older.length;

    if (recentAvg > olderAvg + 0.5) return 'Cải thiện';
    if (recentAvg < olderAvg - 0.5) return 'Giảm sút';
    return 'Ổn định';
  }
}

// Export singleton instance
export const aiRecommendationEngine = new AIRecommendationEngine();

// Helper function to convert resident data to AI profile
export function convertToAIProfile(resident: any): ResidentProfile {
  return {
    id: resident.id,
    name: resident.name,
    age: resident.age,
    healthConditions: resident.conditions || [],
    mobilityLevel: resident.mobilityLevel || 'medium',
    cognitiveLevel: resident.cognitiveLevel || 'normal',
    socialPreferences: resident.socialPreferences || 'mixed',
    activityPreferences: resident.activityPreferences || [],
    participationHistory: resident.participationHistory || [],
    medicalRestrictions: resident.medicalRestrictions || [],
    personalInterests: resident.personalInterests || [],
    physicalLimitations: resident.physicalLimitations || [],
    emotionalState: resident.emotionalState || 'calm',
    sleepPattern: resident.sleepPattern || 'good',
    nutritionLevel: resident.nutritionLevel || 'good',
    lastAssessmentDate: resident.lastAssessmentDate || new Date().toISOString()
  };
}
 