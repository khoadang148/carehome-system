import { useState, useEffect } from 'react';
import { activitiesAPI, activityParticipationsAPI } from '@/lib/api';

export interface Evaluation {
  participated: boolean;
  reason?: string;
}

export function useActivityEvaluation({
  activityId,
  residents,
  user,
  activityDate
}: {
  activityId: string;
  residents: any[];
  user: any;
  activityDate: string;
}) {
  const [participations, setParticipations] = useState<any[]>([]);
  const [evaluations, setEvaluations] = useState<{ [key: string]: Evaluation }>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const fetchParticipations = async () => {
      if (!activityId || !activityDate) return;
      setLoading(true);
      setError(null);
      try {
        const participationsData = await activityParticipationsAPI.getAll({
          activity_id: activityId,
          date: activityDate
        });
        setParticipations(participationsData);
        const filteredResidents = residents.filter(r =>
          participationsData.some((p: any) => {
            const residentId = p.resident_id?._id || p.resident_id;
            return r.id === residentId;
          })
        );
        const initialEvaluations: { [key: string]: Evaluation } = {};
        participationsData.forEach((participation: any) => {
          const residentId = participation.resident_id?._id || participation.resident_id;
          const participated = participation.attendance_status === 'attended';
          const reason = participation.performance_notes || '';
          if (residentId) {
            initialEvaluations[residentId] = {
              participated,
              reason
            };
          }
        });
        setEvaluations(initialEvaluations);
      } catch (err: any) {
        setError('Không thể tải đánh giá tham gia.');
      } finally {
        setLoading(false);
      }
    };
    fetchParticipations();
  }, [activityId, activityDate, residents]);

  const handleEvaluationChange = (residentId: string, participated: boolean) => {
    setEvaluations(prev => ({
      ...prev,
      [residentId]: {
        ...prev[residentId],
        participated,
        reason: participated ? '' : (prev[residentId]?.reason || '')
      }
    }));
  };

  const handleReasonChange = (residentId: string, reason: string) => {
    setEvaluations(prev => ({
      ...prev,
      [residentId]: {
        ...prev[residentId],
        reason
      }
    }));
  };

  const handleSelectAll = (participated: boolean) => {
    const newEvaluations: { [key: string]: Evaluation } = {};
    residents.forEach(resident => {
      newEvaluations[resident.id] = {
        participated,
        reason: participated ? '' : 'Không có lý do cụ thể'
      };
    });
    setEvaluations(newEvaluations);
  };

  const handleSaveEvaluations = async (activity: any) => {
    if (!activity?.id) return;
    const invalidEvaluations = Object.entries(evaluations).filter(([_, evaluation]) => {
      return !evaluation.participated && (!evaluation.reason || evaluation.reason.trim() === '');
    });
    if (invalidEvaluations.length > 0) {
      throw new Error(`Vui lòng nhập lý do vắng mặt cho ${invalidEvaluations.length} người cao tuổi đã chọn "Không tham gia".`);
    }
    setSaving(true);
    try {
      for (const [residentId, evaluation] of Object.entries(evaluations)) {
        const existingParticipation = participations.find(p =>
          (p.resident_id?._id || p.resident_id) === residentId
        );
        if (existingParticipation) {
          await activityParticipationsAPI.update(existingParticipation._id, {
            attendance_status: evaluation.participated ? 'attended' : 'absent',
            performance_notes: evaluation.participated ?
              'Lý do sức khỏe' :
              (evaluation.reason || 'Không có lý do cụ thể')
          });
        } else {
          const resident = residents.find(r => r.id === residentId);
          if (resident) {
            const currentStaffId = participations.length > 0 ? 
              (participations[0].staff_id?._id || participations[0].staff_id) : 
              user?.id || "664f1b2c2f8b2c0012a4e750";
            
            await activityParticipationsAPI.create({
              staff_id: currentStaffId,
              activity_id: activity.id,
              resident_id: resident.id,
              date: activity.date + "T00:00:00Z",
              performance_notes: evaluation.participated ?
                'Lý do sức khỏe' :
                (evaluation.reason || 'Không có lý do cụ thể'),
              attendance_status: evaluation.participated ? 'attended' : 'absent'
            });
          }
        }
      }
      const participationsData = await activityParticipationsAPI.getByActivityId(
        activity.id, 
        activity.date
      );
      setParticipations(participationsData);
      
      const updatedEvaluations: {[key: string]: {participated: boolean, reason?: string}} = {};
      participationsData.forEach((participation: any) => {
        const residentId = participation.resident_id?._id || participation.resident_id;
        const participated = participation.attendance_status === 'attended';
        const reason = participation.performance_notes || '';

        if (residentId) {
          console.log('Processing participation for residentId:', residentId, 'name:', participation.resident_id?.full_name);
          updatedEvaluations[residentId] = {
            participated,
            reason
          };
        }
      });
      setEvaluations(updatedEvaluations);
      console.log('Updated evaluations from new endpoint:', updatedEvaluations);
      console.log('Evaluations keys:', Object.keys(updatedEvaluations));
      
      return true;
    } catch (error) {
      throw error;
    } finally {
      setSaving(false);
    }
  };

  return {
    participations,
    evaluations,
    setEvaluations,
    loading,
    error,
    saving,
    handleEvaluationChange,
    handleReasonChange,
    handleSelectAll,
    handleSaveEvaluations
  };
} 