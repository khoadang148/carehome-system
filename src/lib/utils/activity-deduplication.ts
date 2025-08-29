
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


export function deduplicateActivities(activities: ActivityParticipation[]): ActivityParticipation[] {
  return activities.reduce((acc: ActivityParticipation[], current: ActivityParticipation) => {
    const activityId = typeof current.activity_id === 'object' ? current.activity_id?._id : current.activity_id;
    const existingIndex = acc.findIndex(item => {
      const itemActivityId = typeof item.activity_id === 'object' ? item.activity_id?._id : item.activity_id;
      return itemActivityId === activityId;
    });
    
    if (existingIndex === -1) {
      
      acc.push(current);
    } else {
      
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


export function deduplicateParticipations(participations: ActivityParticipation[]): ActivityParticipation[] {
  return participations.reduce((acc: ActivityParticipation[], current: ActivityParticipation) => {
    const residentId = typeof current.resident_id === 'object' ? current.resident_id?._id : current.resident_id;
    const existingIndex = acc.findIndex(item => {
      const itemResidentId = typeof item.resident_id === 'object' ? item.resident_id?._id : item.resident_id;
      return itemResidentId === residentId;
    });
    
    if (existingIndex === -1) {
      
      acc.push(current);
    } else {
      
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

    
export function filterAndDeduplicateParticipations(
  participations: ActivityParticipation[], 
  activityId: string, 
  date: string
): ActivityParticipation[] {
  
  const filtered = participations.filter((p: ActivityParticipation) => {
    const participationActivityId = typeof p.activity_id === 'object' ? p.activity_id?._id : p.activity_id;
    const participationDate = p.date ? new Date(p.date).toLocaleDateString('en-CA') : null;
    return participationActivityId === activityId && participationDate === date;
  });
  

  return deduplicateParticipations(filtered);
} 