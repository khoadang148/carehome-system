
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

export function parseAIRecommendation(feedback: any): ParsedAIRecommendation[] {
  if (!feedback || typeof feedback !== 'string') {
    return [];
  }
  const recommendations: ParsedAIRecommendation[] = [];

  const activitySections = feedback.split(/\*\*HOẠT ĐỘNG \d+:\*\*/);
  
  if (activitySections.length <= 1) {
    const singleRecommendation = parseSingleActivity(feedback);
    if (singleRecommendation) {
      recommendations.push(singleRecommendation);
    }
    return recommendations;
  }
  
  for (let i = 1; i < activitySections.length; i++) {
    const section = activitySections[i];
    const recommendation = parseSingleActivity(section);
    if (recommendation) {
      recommendations.push(recommendation);
    }
  }
  
  return recommendations;
}

// Helper function to parse a single activity section
function parseSingleActivity(section: string): ParsedAIRecommendation | null {
  if (!section || section.trim().length === 0) {
    return null;
  }
  
  let activityName = '';
  const activityNameMatch1 = section.match(/\*\*Tên hoạt động:\*\*\s*"([^"]+)"/);
  if (activityNameMatch1) {
    activityName = activityNameMatch1[1].trim();
  } else {
    const activityNameMatch2 = section.match(/\*\*Tên hoạt động:\*\*\s*([^*\n]+)/);
    if (activityNameMatch2) {
      activityName = activityNameMatch2[1].trim();
    }
  }
  
  if (!activityName) {
    const quotedMatch = section.match(/"([^"]+)"/);
    if (quotedMatch) {
      const quotedText = quotedMatch[1].trim();
      if (quotedText.length > 5 && quotedText.length < 100) {
        activityName = quotedText;
      }
    }
  }
  
  if (!activityName) {
    if (section.includes('Vườn') || section.includes('cây cảnh')) {
      activityName = 'Vườn Thư Giãn: Chăm Sóc Cây Cảnh';
    } else if (section.includes('Đi bộ')) {
      activityName = 'Đi Bộ Thư Giãn';
    } else if (section.includes('Âm nhạc') || section.includes('nhạc cổ điển')) {
      activityName = 'Âm Nhạc Trị Liệu';
    } else if (section.includes('Dưỡng sinh') || section.includes('Yoga')) {
      activityName = 'Dưỡng Sinh/Yoga Nhẹ Nhàng';
    } else if (section.includes('Tập thể dục')) {
      activityName = 'Tập Thể Dục Nhẹ Nhàng';
    } else {
      activityName = 'Hoạt Động Thư Giãn Được Đề Xuất';
    }
  }
  
  let duration = '30-45 phút';
  const durationMatch = section.match(/\*\*Thời lượng:\*\*\s*([^*\n]+)/);
  if (durationMatch) {
    duration = durationMatch[1].trim();
  }
  
  let timeOfDay = '';
  const timeOfDayMatch = section.match(/\*\*Thời điểm:\*\*\s*([^*\n]+)/);
  if (timeOfDayMatch) {
    timeOfDay = timeOfDayMatch[1].trim();
  }
  
  let difficulty = 'Trung bình';
  const difficultyMatch = section.match(/\*\*Độ khó:\*\*\s*([^*\n]+)/);
  if (difficultyMatch) {
    difficulty = difficultyMatch[1].trim();
  }
  
  const objectives: string[] = [];
  const objectivesSection = section.match(/\*\*Mục tiêu:\*\*\s*([^*]+)/);
  if (objectivesSection) {
    const objectivesText = objectivesSection[1];
    const objectiveLines = objectivesText.split(/[•\n]/).filter(line => line.trim());
    objectives.push(...objectiveLines.map(o => o.trim()).filter(o => o));
  }
  
  let detailedDescription = '';
  const descriptionSection = section.match(/\*\*Mô tả:\*\*\s*([^*]+)/);
  if (descriptionSection) {
    detailedDescription = descriptionSection[1].trim();
  } else {
    const usefulContent = section.match(/([^**\n]{20,200})/);
    if (usefulContent) {
      detailedDescription = usefulContent[1].trim();
    } else {
      const lines = section.split('\n').filter(line => line.trim());
      detailedDescription = lines.slice(0, 3).join(' ').trim();
    }
  }
  
  const benefits: string[] = [];
  const benefitsMatch = section.match(/\*\*Lợi ích:\*\*\s*([^*]+)/);
  if (benefitsMatch) {
    const benefitsText = benefitsMatch[1];
    benefits.push(...benefitsText.split(',').map(b => b.trim()).filter(b => b));
  }
  
  const precautions: string[] = [];
  const precautionsMatch = section.match(/\*\*Lưu ý quan trọng:\*\*\s*([^*]+)/);
  if (precautionsMatch) {
    const precautionsText = precautionsMatch[1];
    precautions.push(...precautionsText.split(',').map(p => p.trim()).filter(p => p));
  }
  
  let priority: 'high' | 'medium' | 'low' = 'medium';
  if (difficulty.toLowerCase().includes('nhẹ') || difficulty.toLowerCase().includes('dễ')) {
    priority = 'low';
  } else if (difficulty.toLowerCase().includes('khó') || difficulty.toLowerCase().includes('cao')) {
    priority = 'high';
  }
  
  let confidenceLevel = 70;
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
  
  return recommendation;
} 