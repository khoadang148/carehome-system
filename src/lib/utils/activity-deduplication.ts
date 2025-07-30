/**
 * Utility functions for deduplicating activity participations
 */

export interface ActivityParticipation {
  _id?: string;
  activity_id?: { _id: string } | string;
  resident_id?: { _id: string } | string;
  date?: string;
  attendance_status?: string;
  performance_notes?: string;
  updated_at?: string;
  created_at?: string;
  [key: string]: any;
}

/**
 * Loại bỏ trùng lặp activities - chỉ lấy bản ghi mới nhất cho mỗi activity_id
 * @param activities Array of activities
 * @returns Array of unique activities
 */
export function deduplicateActivities(activities: ActivityParticipation[]): ActivityParticipation[] {
  return activities.reduce((acc: ActivityParticipation[], current: ActivityParticipation) => {
    const activityId = typeof current.activity_id === 'object' ? current.activity_id?._id : current.activity_id;
    const existingIndex = acc.findIndex(item => {
      const itemActivityId = typeof item.activity_id === 'object' ? item.activity_id?._id : item.activity_id;
      return itemActivityId === activityId;
    });
    
    if (existingIndex === -1) {
      // Chưa có, thêm vào
      acc.push(current);
    } else {
      // Đã có, so sánh thời gian cập nhật và lấy bản mới nhất
      const existing = acc[existingIndex];
      const existingTime = new Date(existing.updated_at || existing.created_at || 0);
      const currentTime = new Date(current.updated_at || current.created_at || 0);
      
      if (currentTime > existingTime) {
        acc[existingIndex] = current;
      }
    }
    return acc;
  }, []);
}

/**
 * Loại bỏ trùng lặp participations - chỉ lấy bản ghi mới nhất cho mỗi resident
 * @param participations Array of participations
 * @returns Array of unique participations
 */
export function deduplicateParticipations(participations: ActivityParticipation[]): ActivityParticipation[] {
  return participations.reduce((acc: ActivityParticipation[], current: ActivityParticipation) => {
    const residentId = typeof current.resident_id === 'object' ? current.resident_id?._id : current.resident_id;
    const existingIndex = acc.findIndex(item => {
      const itemResidentId = typeof item.resident_id === 'object' ? item.resident_id?._id : item.resident_id;
      return itemResidentId === residentId;
    });
    
    if (existingIndex === -1) {
      // Chưa có, thêm vào
      acc.push(current);
    } else {
      // Đã có, so sánh thời gian cập nhật và lấy bản mới nhất
      const existing = acc[existingIndex];
      const existingTime = new Date(existing.updated_at || existing.created_at || 0);
      const currentTime = new Date(current.updated_at || current.created_at || 0);
      
      if (currentTime > existingTime) {
        acc[existingIndex] = current;
      }
    }
    return acc;
  }, []);
}

/**
 * Lọc participations theo activity_id và date, sau đó loại bỏ trùng lặp
 * @param participations Array of participations
 * @param activityId Activity ID to filter by
 * @param date Date to filter by (YYYY-MM-DD format)
 * @returns Array of filtered and deduplicated participations
 */
export function filterAndDeduplicateParticipations(
  participations: ActivityParticipation[], 
  activityId: string, 
  date: string
): ActivityParticipation[] {
  // Lọc theo activity_id và date
  const filtered = participations.filter((p: ActivityParticipation) => {
    const participationActivityId = typeof p.activity_id === 'object' ? p.activity_id?._id : p.activity_id;
    const participationDate = p.date ? new Date(p.date).toLocaleDateString('en-CA') : null;
    return participationActivityId === activityId && participationDate === date;
  });
  
  // Loại bỏ trùng lặp
  return deduplicateParticipations(filtered);
} 