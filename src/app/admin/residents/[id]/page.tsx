"use client";

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  ArrowLeftIcon,
  PencilIcon,
  UserIcon,
  HeartIcon,
  PhoneIcon,
  CalendarIcon,
  ClipboardDocumentListIcon,
  ShieldCheckIcon,
  CheckCircleIcon,
  ExclamationCircleIcon
} from '@heroicons/react/24/outline';
import { residentAPI, userAPI } from '@/lib/api';
import { carePlansAPI } from '@/lib/api';
import { vitalSignsAPI } from '@/lib/api';
import { roomsAPI } from '@/lib/api';
import { bedsAPI } from '@/lib/api';
import { bedAssignmentsAPI } from '@/lib/api';
import { useAuth } from '@/lib/contexts/auth-context';
import { careNotesAPI } from '@/lib/api';
import { photosAPI } from '@/lib/api';
import { formatDateDDMMYYYY } from '@/lib/utils/validation';
import { formatDisplayCurrency } from '@/lib/utils/currencyUtils';
import CareNotesDisplay from '@/components/staff/CareNotesDisplay';
import AppointmentsDisplay from '@/components/staff/AppointmentsDisplay';
import Avatar from '@/components/Avatar';
import useSWR from 'swr';
import { useResident, useVitalSigns as useVitalSignsSWR, useCareNotes as useCareNotesSWR, useRoom as useRoomSWR, useBedAssignments as useBedAssignmentsSWR } from '@/hooks/useSWRData';
import { swrKeys } from '@/lib/swr-config';

// Helper function to check if bed assignment is active
const isBedAssignmentActive = (assignment) => {
  if (!assignment) return false;
  if (!assignment.unassigned_date) return true; // null = active
  const unassignedDate = new Date(assignment.unassigned_date);
  const now = new Date();
  return unassignedDate > now; // ngày trong tương lai = active
};


export default function ResidentDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const router = useRouter();
  const { user } = useAuth();
  const [resident, setResident] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [refreshKey, setRefreshKey] = useState(0);
  const [activeTab, setActiveTab] = useState('overview');
  const [carePlans, setCarePlans] = useState<any[]>([]);
  const [carePlanMap, setCarePlanMap] = useState<{ [id: string]: any }>({});
  const [vitalSigns, setVitalSigns] = useState<any>(null);
  const [vitalLoading, setVitalLoading] = useState(true);
  const [careNotes, setCareNotes] = useState<any[]>([]);
  const [roomNumber, setRoomNumber] = useState<string>('Chưa hoàn tất đăng kí');
  const [roomLoading, setRoomLoading] = useState(false);
  const [carePlanAssignments, setCarePlanAssignments] = useState<any[]>([]);
  const [bedNumber, setBedNumber] = useState<string>('Chưa hoàn tất đăng kí');
  const [bedLoading, setBedLoading] = useState(false);

  const now = new Date();
  // Phân nhóm assignment: đang hiệu lực và đã hết hạn (loại trừ cancelled)
  const currentAssignments = carePlanAssignments.filter((assignment: any) => {
    const notExpired = !assignment?.end_date || new Date(assignment.end_date) >= now;
    const notCancelled = String(assignment?.status || '').toLowerCase() !== 'cancelled';
    return notExpired && notCancelled;
  });

  const expiredAssignments = carePlanAssignments.filter((assignment: any) => {
    const isExpired = assignment?.end_date && new Date(assignment.end_date) < now;
    const notCancelled = String(assignment?.status || '').toLowerCase() !== 'cancelled';
    return isExpired && notCancelled;
  });
  
  console.log('All care plan assignments:', carePlanAssignments);
  console.log('Current assignments:', currentAssignments);
  console.log('Expired assignments:', expiredAssignments);

  // Loại bỏ các biến không cần thiết
  // const allAssignments = carePlanAssignments.filter((assignment: any) => {
  //   const notCancelled = !['cancelled', 'completed'].includes(String(assignment?.status || '').toLowerCase());
  //   return notCancelled;
  // });

  // const expiredAssignments = allAssignments.filter((assignment: any) => {
  //   const isExpired = assignment?.end_date && new Date(assignment.end_date) < now;
  //   return isExpired;
  // });

  const residentId = React.use(params).id;

  // SWR-driven data fetching
  const { resident: residentData, isLoading: residentLoading } = useResident(residentId);
  const { vitalSigns: vitalDataLatest, isLoading: vitalIsLoading } = useVitalSignsSWR(residentId);
  const { careNotes: careNotesData, isLoading: careNotesIsLoading } = useCareNotesSWR(residentId);
  const { bedAssignment: currentBedAssignment, roomId, isLoading: bedAssignmentsIsLoading, bedAssignments } = useBedAssignmentsSWR(residentId);
  const { roomNumber: swrRoomNumber, isLoading: roomIsLoading } = useRoomSWR(roomId || '');

  const { data: carePlanAssignmentsData } = useSWR(
    residentId ? `care-plan-assignments-${residentId}` : null,
    () => carePlansAPI.getByResidentId(residentId)
  );

  // Map resident data to UI shape
  useEffect(() => {
    if (residentData) {
      const data: any = residentData;
      const mapped = {
        id: data._id,
        name: data.full_name,
        age: data.date_of_birth ? (new Date().getFullYear() - new Date(data.date_of_birth).getFullYear()) : '',
        gender: data.gender,
        admissionDate: data.admission_date,
        dischargeDate: data.discharge_date,
        relationship: data.relationship,
        medicalHistory: data.medical_history,
        currentMedications: data.current_medications,
        allergies: data.allergies,
        emergencyContact: data.emergency_contact,
        careLevel: data.care_level,
        avatar: Array.isArray(data.avatar) ? data.avatar[0] : data.avatar || null,
        status: data.status,
        ...data
      };
      setResident(mapped);
    }
    setLoading(residentLoading);
  }, [residentData, residentLoading]);

  // Vital signs and care notes from SWR
  useEffect(() => {
    setVitalLoading(vitalIsLoading);
    setVitalSigns(vitalDataLatest || null);
  }, [vitalDataLatest, vitalIsLoading]);

  useEffect(() => {
    setCareNotes(Array.isArray(careNotesData) ? careNotesData : []);
  }, [careNotesData]);

  // Care plan assignments via SWR
  useEffect(() => {
    if (Array.isArray(carePlanAssignmentsData)) {
      setCarePlanAssignments(carePlanAssignmentsData);
    } else if (carePlanAssignmentsData === undefined) {
      // noop while loading
    } else {
      setCarePlanAssignments([]);
    }
  }, [carePlanAssignmentsData]);

  // Room and bed from SWR hooks
  useEffect(() => {
    setRoomLoading(roomIsLoading || bedAssignmentsIsLoading);
    if (swrRoomNumber) {
      setRoomNumber(swrRoomNumber || 'Chưa hoàn tất đăng kí');
    }
  }, [swrRoomNumber, roomIsLoading, bedAssignmentsIsLoading]);

  useEffect(() => {
    setBedLoading(bedAssignmentsIsLoading);
    const ba = currentBedAssignment || (Array.isArray(bedAssignments) ? bedAssignments.find((a: any) => a.bed_id && isBedAssignmentActive(a)) : null);
    if (ba?.bed_id) {
      if (typeof ba.bed_id === 'object' && ba.bed_id.bed_number) {
        setBedNumber(ba.bed_id.bed_number);
      }
    } else {
      // try from care plan assignment
      let currentAssignment: any = null;
      if (Array.isArray(carePlanAssignments)) {
        currentAssignment = carePlanAssignments.find(a =>
          (a.resident_id?._id || a.resident_id) === residentId
        ) || carePlanAssignments[0];
      }
      const assignedBedId = currentAssignment?.assigned_bed_id as any;
      if (!assignedBedId) {
        setBedNumber('Chưa hoàn tất đăng kí');
      }
    }
  }, [currentBedAssignment, bedAssignments, bedAssignmentsIsLoading, carePlanAssignments, residentId]);

  // Load care plan details by ID for display of name and price
  useEffect(() => {
    const loadCarePlanDetails = async () => {
      try {
        const ids = new Set<string>();
        (carePlanAssignments || []).forEach((assignment: any) => {
          const cps = Array.isArray(assignment?.care_plan_ids) ? assignment.care_plan_ids : [];
          cps.forEach((cp: any) => {
            const id = (cp && typeof cp === 'object') ? (cp._id || cp.id) : cp;
            if (typeof id === 'string' && id.length >= 12) ids.add(id);
          });
        });

        const toFetch = Array.from(ids).filter(id => !(id in carePlanMap));
        if (toFetch.length === 0) return;

        const results = await Promise.allSettled(toFetch.map(id => carePlansAPI.getById(id)));
        const nextMap: { [id: string]: any } = { ...carePlanMap };
        results.forEach((res, idx) => {
          const id = toFetch[idx];
          if (res.status === 'fulfilled' && res.value) {
            nextMap[id] = res.value;
          }
        });
        setCarePlanMap(nextMap);
      } catch {
        // ignore
      }
    };
    loadCarePlanDetails();
  }, [carePlanAssignments]);

  const handleEditClick = () => {
    router.push(`/admin/residents/${residentId}/edit`);
  };

  const handleActionComplete = () => {
    setRefreshKey(prev => prev + 1);
  };

  if (loading) {
    return (
      <div style={{
        minHeight: '100vh',
        background: 'linear-gradient(135deg, #f8fafc 0%, #e2e8f0 100%)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center'
      }}>
        <div style={{
          background: 'white',
          borderRadius: '1rem',
          padding: '2rem',
          boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.1)',
          textAlign: 'center'
        }}>
          <div style={{
            width: '3rem',
            height: '3rem',
            borderRadius: '50%',
            border: '3px solid #f3f4f6',
            borderTop: '3px solid #3b82f6',
            animation: 'spin 1s linear infinite',
            margin: '0 auto 1rem'
          }} />
          <p style={{ fontSize: '0.875rem', color: '#6b7280', margin: 0 }}>
            Đang tải thông tin người cao tuổi...
          </p>
        </div>
      </div>
    );
  }

  if (!resident) {
    return (
      <div style={{
        minHeight: '100vh',
        background: 'linear-gradient(135deg, #f8fafc 0%, #e2e8f0 100%)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center'
      }}>
        <div style={{
          background: 'white',
          borderRadius: '1rem',
          padding: '3rem',
          boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.1)',
          textAlign: 'center',
          maxWidth: '400px'
        }}>
          <ExclamationCircleIcon style={{
            width: '3rem',
            height: '3rem',
            color: '#f59e0b',
            margin: '0 auto 1rem'
          }} />
          <h2 style={{
            fontSize: '1.25rem',
            fontWeight: 600,
            color: '#1f2937',
            margin: '0 0 0.5rem 0'
          }}>
            Không tìm thấy người cao tuổi
          </h2>
          <p style={{
            fontSize: '0.875rem',
            color: '#6b7280',
            margin: '0 0 1.5rem 0'
          }}>
            người cao tuổi này có thể đã bị xóa hoặc không tồn tại
          </p>
          <Link
            href="/admin/residents"
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '0.5rem',
              padding: '0.75rem 1.5rem',
              background: 'linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)',
              color: 'white',
              borderRadius: '0.5rem',
              textDecoration: 'none',
              fontSize: '0.875rem',
              fontWeight: 500
            }}
          >
            <ArrowLeftIcon style={{ width: '1rem', height: '1rem' }} />
            Quay lại danh sách
          </Link>
        </div>
      </div>
    );
  }

  const renderCareLevel = (level: string) => {
    const colors = {
      'Cơ bản': { bg: '#dbeafe', text: '#1d4ed8', border: '#3b82f6' },
      'Nâng cao': { bg: '#dcfce7', text: '#166534', border: '#10b981' },
      'Cao cấp': { bg: '#f3e8ff', text: '#7c3aed', border: '#8b5cf6' },
      'Đặc biệt': { bg: '#fef3c7', text: '#d97706', border: '#f59e0b' }
    };

    const color = colors[level as keyof typeof colors] || colors['Cơ bản'];

    return (
      <span style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: '0.25rem',
        padding: '0.5rem 1rem',
        fontSize: '0.875rem',
        fontWeight: 600,
        borderRadius: '0.75rem',
        backgroundColor: color.bg,
        color: color.text,
        border: `1px solid ${color.border}20`
      }}>
        <ShieldCheckIcon style={{ width: '1rem', height: '1rem' }} />
        {level}
      </span>
    );
  };

  const getStatusColor = (status: string) => {
    switch (status?.toLowerCase()) {
      case 'active':
      case 'đang chăm sóc':
        return { bg: '#dcfce7', text: '#166534', icon: CheckCircleIcon };
      case 'discharged':
      case 'đã xuất viện':
        return { bg: '#fef3c7', text: '#d97706', icon: ExclamationCircleIcon };
      default:
        return { bg: '#dbeafe', text: '#1d4ed8', icon: CheckCircleIcon };
    }
  };

  const statusStyle = getStatusColor(resident.status || 'Đang chăm sóc');

  const tabs = [
    { id: 'overview', label: 'Tổng quan', icon: UserIcon },
    { id: 'medical', label: 'Y tế', icon: HeartIcon },
    { id: 'contact', label: 'Liên hệ', icon: PhoneIcon },
    { id: 'notes', label: 'Ghi chú', icon: ClipboardDocumentListIcon }
  ];

  return (
    <div style={{
      minHeight: '100vh',
      background: 'linear-gradient(135deg, #f8fafc 0%, #e2e8f0 100%)',
      padding: '2rem 1rem'
    }}>
      <div style={{
        maxWidth: '1200px',
        margin: '0 auto'
      }}>
        <div style={{
          background: 'linear-gradient(135deg, #ffffff 0%, #f8fafc 100%)',
          borderRadius: '1.5rem',
          padding: '2rem',
          marginBottom: '2rem',
          boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.1)',
          border: '1px solid rgba(255, 255, 255, 0.2)'
        }}>
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '1rem',
            marginBottom: '1.5rem'
          }}>
            <Link
              href="/admin/residents"
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                width: '2.5rem',
                height: '2.5rem',
                background: 'rgba(59, 130, 246, 0.1)',
                borderRadius: '0.75rem',
                color: '#3b82f6',
                textDecoration: 'none',
                transition: 'all 0.2s ease'
              }}
            >
              <ArrowLeftIcon style={{ width: '1.25rem', height: '1.25rem' }} />
            </Link>
            <div style={{ flex: 1 }}>
              <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: '1.5rem',
                marginBottom: '1rem'
              }}>
                <Avatar
                  src={resident.avatar}
                  alt={resident.name}
                  size="large"
                  className="w-20 h-20"
                  showInitials={true}
                  name={resident.name}
                  fallbackSrc="/default-avatar.svg"
                />

                <div style={{ flex: 1 }}>
                  <div style={{ marginBottom: '0.5rem' }}>
                    <span style={{
                      fontSize: '0.875rem',
                      fontWeight: 500,
                      color: '#64748b',
                      display: 'block',
                      marginBottom: '0.25rem'
                    }}>
                      Tên người cao tuổi:
                    </span>
                    <h1 style={{
                      fontSize: '1.875rem',
                      fontWeight: 700,
                      margin: 0,
                      color: '#1e293b'
                    }}>
                      {resident.name}
                    </h1>
                  </div>
                  <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '1rem',
                    marginTop: '0.5rem',
                    flexWrap: 'wrap'
                  }}>
                    <span style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '0.25rem',
                      fontSize: '1rem',
                      color: '#64748b',
                      background: '#f3f4f6',
                      borderRadius: '0.5rem',
                      padding: '0.25rem 0.75rem',
                      fontWeight: 500
                    }}>
                      <UserIcon style={{ width: '1rem', height: '1rem' }} />
                      <span>Tuổi:</span>
                      <span>{resident.age} tuổi</span>
                    </span>
                    <span style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '0.25rem',
                      fontSize: '1rem',
                      color: '#64748b',
                      background: '#f3f4f6',
                      borderRadius: '0.5rem',
                      padding: '0.25rem 0.75rem',
                      fontWeight: 500
                    }}>
                      <CalendarIcon style={{ width: '1rem', height: '1rem' }} />
                      <span>Phòng:</span>
                      <span>{roomLoading ? 'Đang tải...' : roomNumber}</span>
                    </span>
                    <span style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '0.25rem',
                      fontSize: '1rem',
                      color: '#64748b',
                      background: '#f3f4f6',
                      borderRadius: '0.5rem',
                      padding: '0.25rem 0.75rem',
                      fontWeight: 500
                    }}>
                      <CalendarIcon style={{ width: '1rem', height: '1rem' }} />
                      <span>Giường:</span>
                      <span>{bedLoading ? 'Đang tải...' : bedNumber}</span>
                    </span>

                    <span style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      padding: '0.5rem 1rem',
                      borderRadius: '9999px',
                      fontSize: '0.875rem',
                      fontWeight: 600,
                      background: !vitalSigns || vitalSigns?.notes === 'Ổn định' ? 'linear-gradient(135deg, #dcfce7 0%, #bbf7d0 100%)' : 'linear-gradient(135deg, #fef3c7 0%, #fde68a 100%)',
                      color: !vitalSigns || vitalSigns?.notes === 'Ổn định' ? '#166534' : '#92400e',
                      border: !vitalSigns || vitalSigns?.notes === 'Ổn định' ? '1px solid #86efac' : '1px solid #fbbf24',
                      marginLeft: '0.5rem'
                    }}>
                      <div style={{ width: '0.5rem', height: '0.5rem', background: !vitalSigns || vitalSigns?.notes === 'Ổn định' ? 'linear-gradient(135deg, #22c55e 0%, #16a34a 100%)' : 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)', borderRadius: '9999px', marginRight: '0.5rem' }}></div>
                      Trạng thái sức khỏe: {vitalLoading ? 'Đang tải...' : vitalSigns?.notes ?? 'Chưa cập nhật'}
                    </span>
                  </div>
                </div>
              </div>
            </div>
            <button
              onClick={handleEditClick}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem',
                padding: '0.75rem 1.5rem',
                background: 'linear-gradient(135deg, #16a34a 0%, #15803d 100%)',
                color: 'white',
                borderRadius: '0.75rem',
                border: 'none',
                fontSize: '0.875rem',
                fontWeight: 500,
                cursor: 'pointer',
                transition: 'all 0.2s ease'
              }}
            >
              <PencilIcon style={{ width: '1rem', height: '1rem' }} />
              Chỉnh sửa thông tin
            </button>
          </div>

          <div style={{
            display: 'flex',
            gap: '0.5rem',
            borderTop: '1px solid #e2e8f0',
            paddingTop: '1.5rem'
          }}>
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.5rem',
                  padding: '0.75rem 1rem',
                  background: activeTab === tab.id ?
                    'linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)' :
                    'rgba(248, 250, 252, 0.8)',
                  color: activeTab === tab.id ? 'white' : '#64748b',
                  border: `1px solid ${activeTab === tab.id ? '#3b82f6' : '#e2e8f0'}`,
                  borderRadius: '0.5rem',
                  fontSize: '0.875rem',
                  fontWeight: 500,
                  cursor: 'pointer',
                  transition: 'all 0.2s ease'
                }}
              >
                <tab.icon style={{ width: '1rem', height: '1rem' }} />
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        <div style={{
          background: 'linear-gradient(135deg, #ffffff 0%, #f8fafc 100%)',
          borderRadius: '1.5rem',
          padding: '2rem',
          boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.1)',
          border: '1px solid rgba(255, 255, 255, 0.2)'
        }}>
          {activeTab === 'overview' && (
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
              gap: '1.5rem'
            }}>
              <div style={{
                background: 'rgba(59, 130, 246, 0.05)',
                borderRadius: '1rem',
                padding: '1.5rem',
                border: '1px solid rgba(59, 130, 246, 0.2)'
              }}>
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.75rem',
                  marginBottom: '1rem'
                }}>
                  <div style={{
                    width: '2rem',
                    height: '2rem',
                    background: 'linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)',
                    borderRadius: '0.5rem',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center'
                  }}>
                    <UserIcon style={{ width: '1rem', height: '1rem', color: 'white' }} />
                  </div>
                  <h3 style={{
                    fontSize: '1rem',
                    fontWeight: 600,
                    margin: 0,
                    color: '#1e293b'
                  }}>
                    Thông tin cá nhân
                  </h3>
                </div>
                <div style={{ display: 'grid', gap: '0.75rem' }}>
                  <div>
                    <p style={{ fontSize: '0.75rem', fontWeight: 500, color: '#64748b', margin: '0 0 0.25rem 0' }}>
                      Ngày sinh
                    </p>
                    <p style={{ fontSize: '0.875rem', color: '#1e293b', margin: 0, fontWeight: 500 }}>
                      {resident.date_of_birth ? formatDateDDMMYYYY(resident.date_of_birth) : 'Chưa hoàn tất đăng kí'}
                    </p>
                  </div>
                  <div>
                    <p style={{ fontSize: '0.75rem', fontWeight: 500, color: '#64748b', margin: '0 0 0.25rem 0' }}>
                      Giới tính
                    </p>
                    <p style={{ fontSize: '0.875rem', color: '#1e293b', margin: 0, fontWeight: 500 }}>
                      {resident.gender === 'male' ? 'Nam' : resident.gender === 'female' ? 'Nữ' : 'Khác'}
                    </p>
                  </div>
                  <div>
                    <p style={{ fontSize: '0.75rem', fontWeight: 500, color: '#64748b', margin: '0 0 0.25rem 0' }}>
                      Ngày nhập viện
                    </p>
                    <p style={{ fontSize: '0.875rem', color: '#1e293b', margin: 0, fontWeight: 500 }}>
                      {resident.admission_date ? formatDateDDMMYYYY(resident.admission_date) : 'Chưa hoàn tất đăng kí'}
                    </p>
                  </div>
                  <div>
                    <p style={{ fontSize: '0.75rem', fontWeight: 500, color: '#64748b', margin: '0 0 0.25rem 0' }}>
                      Số CCCD
                    </p>
                    <p style={{ fontSize: '0.875rem', color: '#1e293b', margin: 0, fontWeight: 500 }}>
                      {resident.cccd_id || 'Chưa hoàn tất đăng kí'}
                    </p>
                  </div>
                </div>
              </div>

              <div style={{
                background: 'rgba(16, 185, 129, 0.05)',
                borderRadius: '1rem',
                padding: '1.5rem',
                border: '1px solid rgba(16, 185, 129, 0.2)'
              }}>
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.75rem',
                  marginBottom: '1rem'
                }}>
                  <div style={{
                    width: '2rem',
                    height: '2rem',
                    background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
                    borderRadius: '0.5rem',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center'
                  }}>
                    <ShieldCheckIcon style={{ width: '1rem', height: '1rem', color: 'white' }} />
                  </div>
                  <h3 style={{
                    fontSize: '1rem',
                    fontWeight: 600,
                    margin: 0,
                    color: '#1e293b'
                  }}>
                    {String(resident?.status || '').toLowerCase() === 'active' 
                      ? 'Gói dịch vụ đã đăng ký' 
                      : 'Gói dịch vụ đang sử dụng'}
                  </h3>
                </div>
                {currentAssignments.length > 0 ? (
                  <div style={{ display: 'grid', gap: '0.75rem' }}>
                    {/* Current Assignments */}
                    {currentAssignments.map((assignment: any, assignmentIdx: number) => (
                      assignment.care_plan_ids && assignment.care_plan_ids.length > 0 ? (
                        assignment.care_plan_ids.map((planRef: any, planIdx: number) => {
                          const planId = (planRef && typeof planRef === 'object') ? (planRef._id || planRef.id) : planRef;
                          const plan = planId && carePlanMap[planId] ? carePlanMap[planId] : (planRef || {});
                          const name = plan?.plan_name || plan?.name || 'Gói dịch vụ';
                          const price = plan?.monthly_price;
                          return (
                            <div
                              key={`current-${assignment._id}-${planId || planIdx}`}
                              style={{
                                background: 'rgba(255,255,255,0.8)',
                                borderRadius: '0.5rem',
                                padding: '1rem',
                                border: '1px solid #d1fae5',
                                marginBottom: '0.5rem'
                              }}
                            >
                              <div style={{
                                fontWeight: 600,
                                fontSize: '1rem',
                                color: '#059669'
                              }}>
                                <span>{name}</span>
                              </div>
                              <div style={{ fontSize: '0.95rem', color: '#374151', marginBottom: '0.5rem' }}>
                                Giá: {price !== undefined ? formatDisplayCurrency(price) : '---'}
                              </div>
                            </div>
                          );
                        })
                      ) : (
                        <div key={`empty-current-${assignmentIdx}`} style={{
                          background: 'rgba(255,255,255,0.8)',
                          borderRadius: '0.5rem',
                          padding: '1rem',
                          border: '1px solid #d1fae5',
                          fontSize: '0.875rem',
                          color: '#64748b'
                        }}>
                          Assignment {assignmentIdx + 1}: Không có gói dịch vụ được gán
                        </div>
                      )
                    ))}

                    {/* Link to details */}
                    <Link
                      href={`/admin/residents/${residentId}/services/${currentAssignments[0]._id}`}
                      style={{
                        background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
                        color: 'white',
                        borderRadius: '0.5rem',
                        padding: '1rem',
                        textAlign: 'center',
                        fontSize: '0.875rem',
                        fontWeight: 500,
                        textDecoration: 'none',
                        transition: 'all 0.2s ease',
                        display: 'block'
                      }}
                      onMouseOver={(e) => {
                        e.currentTarget.style.background = 'linear-gradient(135deg, #059669 0%, #047857 100%)';
                        e.currentTarget.style.transform = 'translateY(-2px)';
                        e.currentTarget.style.boxShadow = '0 4px 12px rgba(16, 185, 129, 0.15)';
                      }}
                      onMouseOut={(e) => {
                        e.currentTarget.style.background = 'linear-gradient(135deg, #10b981 0%, #059669 100%)';
                        e.currentTarget.style.transform = 'translateY(0)';
                        e.currentTarget.style.boxShadow = 'none';
                      }}
                    >
                      Xem chi tiết →
                    </Link>
                  </div>
                ) : (
                  <div>
                    <p style={{ fontSize: '0.875rem', color: '#64748b', marginBottom: '1rem' }}>
                      Chưa đăng ký gói dịch vụ nào
                    </p>
                    <Link
                      href="/services"
                      style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '0.5rem',
                        padding: '0.5rem 1rem',
                        background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
                        color: 'white',
                        borderRadius: '0.5rem',
                        fontSize: '0.875rem',
                        fontWeight: 500,
                        textDecoration: 'none'
                      }}
                    >
                      Xem các gói dịch vụ
                    </Link>
                  </div>
                )}
              </div>

              {expiredAssignments.length > 0 && (
                <div style={{
                  background: 'rgba(107, 114, 128, 0.06)',
                  borderRadius: '1rem',
                  padding: '1.5rem',
                  border: '1px solid rgba(107, 114, 128, 0.2)'
                }}>
                  <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.75rem',
                    marginBottom: '1rem'
                  }}>
                    <div style={{
                      width: '2rem',
                      height: '2rem',
                      background: 'linear-gradient(135deg, #9ca3af 0%, #6b7280 100%)',
                      borderRadius: '0.5rem',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center'
                    }}>
                      <ClipboardDocumentListIcon style={{ width: '1rem', height: '1rem', color: 'white' }} />
                    </div>
                    <h3 style={{
                      fontSize: '1rem',
                      fontWeight: 600,
                      margin: 0,
                      color: '#374151'
                    }}>
                      Gói dịch vụ đã hết hạn
                    </h3>
                  </div>
                  <div style={{ display: 'grid', gap: '0.75rem' }}>
                    {expiredAssignments.map((assignment: any, assignmentIdx: number) => (
                      assignment.care_plan_ids && assignment.care_plan_ids.length > 0 ? (
                        assignment.care_plan_ids.map((planRef: any, planIdx: number) => {
                          const planId = (planRef && typeof planRef === 'object') ? (planRef._id || planRef.id) : planRef;
                          const plan = planId && carePlanMap[planId] ? carePlanMap[planId] : (planRef || {});
                          const name = plan?.plan_name || plan?.name || 'Gói dịch vụ';
                          const price = plan?.monthly_price;
                          const endDate = assignment?.end_date ? formatDateDDMMYYYY(assignment.end_date) : '';
                          return (
                            <div
                              key={`expired-${assignment._id}-${planId || planIdx}`}
                              style={{
                                background: 'rgba(255,255,255,0.7)',
                                borderRadius: '0.5rem',
                                padding: '1rem',
                                border: '1px solid #e5e7eb',
                                marginBottom: '0.5rem',
                                opacity: 0.9
                              }}
                            >
                              <div style={{
                                fontWeight: 600,
                                fontSize: '1rem',
                                color: '#6b7280'
                              }}>
                                <span>{name}</span>
                              </div>
                              <div style={{ fontSize: '0.9rem', color: '#6b7280' }}>
                                Giá: {price !== undefined ? formatDisplayCurrency(price) : '---'}
                              </div>
                              {endDate && (
                                <div style={{ fontSize: '0.85rem', color: '#9ca3af', marginTop: '0.25rem' }}>
                                  Hết hạn: {endDate}
                                </div>
                              )}
                            </div>
                          );
                        })
                      ) : (
                        <div key={`empty-expired-${assignmentIdx}`} style={{
                          background: 'rgba(255,255,255,0.7)',
                          borderRadius: '0.5rem',
                          padding: '1rem',
                          border: '1px solid #e5e7eb',
                          fontSize: '0.875rem',
                          color: '#6b7280'
                        }}>
                          Assignment {assignmentIdx + 1}: Không có gói dịch vụ
                        </div>
                      )
                    ))}
                  </div>
                </div>
              )}

              {/* CCCD Images Section */}
              <div style={{
                background: 'rgba(168, 85, 247, 0.05)',
                borderRadius: '1rem',
                padding: '1.5rem',
                border: '1px solid rgba(168, 85, 247, 0.2)'
              }}>
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.75rem',
                  marginBottom: '1rem'
                }}>
                  <div style={{
                    width: '2rem',
                    height: '2rem',
                    background: 'linear-gradient(135deg, #a855f7 0%, #9333ea 100%)',
                    borderRadius: '0.5rem',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center'
                  }}>
                    <svg style={{ width: '1rem', height: '1rem', color: 'white' }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V8a2 2 0 00-2-2h-5m-4 0V5a2 2 0 114 0v1m-4 0a2 2 0 104 0m-5 8a2 2 0 100-4 2 2 0 000 4zm0 0c1.306 0 2.417.835 2.83 2M9 14a3.001 3.001 0 00-2.83 2M15 11h3m-3 4h2" />
                    </svg>
                  </div>
                  <h3 style={{
                    fontSize: '1rem',
                    fontWeight: 600,
                    margin: 0,
                    color: '#1e293b'
                  }}>
                    Giấy tờ tùy thân (CCCD)
                  </h3>
                </div>

                <div style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
                  gap: '1.5rem'
                }}>
                  {/* CCCD Front */}
                  <div>
                    <p style={{ fontSize: '0.75rem', fontWeight: 500, color: '#64748b', margin: '0 0 0.75rem 0' }}>
                      CCCD mặt trước
                    </p>
                    {resident.cccd_front ? (
                      <div style={{
                        position: 'relative',
                        borderRadius: '0.75rem',
                        overflow: 'hidden',
                        border: '2px solid #e5e7eb',
                        background: '#f9fafb'
                      }}>
                        {(() => {
                          const rawPath = String(resident.cccd_front || '').replace(/\\/g, '/').replace(/^\"|\"$/g, '');
                          const cleanPath = rawPath.replace(/^\/?(tmp\/)?uploads\//, 'uploads/');
                          const url = photosAPI.getPhotoUrl(cleanPath);
                          const fallbackUrl = `https://sep490-be-xniz.onrender.com/uploads/${cleanPath.replace(/^uploads\//, '')}`;
                          return (
                            <img
                              src={url}
                              alt="CCCD mặt trước"
                              style={{
                                width: '100%',
                                height: '200px',
                                objectFit: 'cover',
                                display: 'block'
                              }}
                              onError={(e) => {
                                const img = e.currentTarget as HTMLImageElement;
                                if (img.src !== fallbackUrl) {
                                  img.src = fallbackUrl;
                                }
                              }}
                            />
                          );
                        })()}
                      </div>
                    ) : (
                      <div style={{
                        width: '100%',
                        height: '200px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        background: '#f3f4f6',
                        borderRadius: '0.75rem',
                        border: '2px dashed #d1d5db',
                        color: '#6b7280',
                        fontSize: '0.875rem'
                      }}>
                        Chưa có hình ảnh
                      </div>
                    )}
                  </div>

                  {/* CCCD Back */}
                  <div>
                    <p style={{ fontSize: '0.75rem', fontWeight: 500, color: '#64748b', margin: '0 0 0.75rem 0' }}>
                      CCCD mặt sau
                    </p>
                    {resident.cccd_back ? (
                      <div style={{
                        position: 'relative',
                        borderRadius: '0.75rem',
                        overflow: 'hidden',
                        border: '2px solid #e5e7eb',
                        background: '#f9fafb'
                      }}>
                        {(() => {
                          const rawPath = String(resident.cccd_back || '').replace(/\\/g, '/').replace(/^\"|\"$/g, '');
                          const cleanPath = rawPath.replace(/^\/?(tmp\/)?uploads\//, 'uploads/');
                          const url = photosAPI.getPhotoUrl(cleanPath);
                          const fallbackUrl = `https://sep490-be-xniz.onrender.com/uploads/${cleanPath.replace(/^uploads\//, '')}`;
                          return (
                            <img
                              src={url}
                              alt="CCCD mặt sau"
                              style={{
                                width: '100%',
                                height: '200px',
                                objectFit: 'cover',
                                display: 'block'
                              }}
                              onError={(e) => {
                                const img = e.currentTarget as HTMLImageElement;
                                if (img.src !== fallbackUrl) {
                                  img.src = fallbackUrl;
                                }
                              }}
                            />
                          );
                        })()}
                      </div>
                    ) : (
                      <div style={{
                        width: '100%',
                        height: '200px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        background: '#f3f4f6',
                        borderRadius: '0.75rem',
                        border: '2px dashed #d1d5db',
                        color: '#6b7280',
                        fontSize: '0.875rem'
                      }}>
                        Chưa có hình ảnh
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'medical' && (
            <div style={{ display: 'grid', gap: '1.5rem' }}>
              <div style={{
                background: 'rgba(239, 68, 68, 0.05)',
                borderRadius: '1rem',
                padding: '1.5rem',
                border: '1px solid rgba(239, 68, 68, 0.2)'
              }}>
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.75rem',
                  marginBottom: '1rem'
                }}>
                  <div style={{
                    width: '2rem',
                    height: '2rem',
                    background: 'linear-gradient(135deg, #ef4444 0%, #dc2626 100%)',
                    borderRadius: '0.5rem',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center'
                  }}>
                    <HeartIcon style={{ width: '1rem', height: '1rem', color: 'white' }} />
                  </div>
                  <h3 style={{
                    fontSize: '1rem',
                    fontWeight: 600,
                    margin: 0,
                    color: '#1e293b'
                  }}>
                    Tình trạng sức khỏe
                  </h3>
                </div>

                <div style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
                  gap: '1rem'
                }}>
                  {resident.medical_history ? (
                    <div style={{
                      padding: '0.75rem',
                      background: 'rgba(255, 255, 255, 0.8)',
                      borderRadius: '0.5rem',
                      border: '1px solid rgba(239, 68, 68, 0.1)'
                    }}>
                      <p style={{ fontSize: '0.875rem', color: '#1e293b', margin: 0, fontWeight: 500 }}>
                        {resident.medical_history}
                      </p>
                    </div>
                  ) : (
                    <p style={{ fontSize: '0.875rem', color: '#64748b', margin: 0 }}>
                      Không có tình trạng sức khỏe đặc biệt
                    </p>
                  )}
                </div>
              </div>

              <div style={{
                background: 'rgba(16, 185, 129, 0.05)',
                borderRadius: '1rem',
                padding: '1.5rem',
                border: '1px solid rgba(16, 185, 129, 0.2)'
              }}>
                <h3 style={{
                  fontSize: '1rem',
                  fontWeight: 600,
                  margin: '0 0 1rem 0',
                  color: '#1e293b'
                }}>
                  Thuốc đang sử dụng
                </h3>

                <div style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
                  gap: '1rem'
                }}>
                  {(resident.current_medications || []).length > 0 ? (
                    (resident.current_medications || []).map((med: any, index: number) => (
                      <div key={index} style={{
                        padding: '0.75rem',
                        background: 'rgba(255, 255, 255, 0.8)',
                        borderRadius: '0.5rem',
                        border: '1px solid rgba(16, 185, 129, 0.1)'
                      }}>
                        <p style={{ fontSize: '0.875rem', color: '#1e293b', margin: 0, fontWeight: 500 }}>
                          {med.medication_name} - {med.dosage} - {med.frequency}
                        </p>
                      </div>
                    ))
                  ) : (
                    <p style={{ fontSize: '0.875rem', color: '#64748b', margin: 0 }}>
                      Không có thuốc đang sử dụng
                    </p>
                  )}
                </div>
              </div>

              <div style={{
                background: 'rgba(245, 158, 11, 0.05)',
                borderRadius: '1rem',
                padding: '1.5rem',
                border: '1px solid rgba(245, 158, 11, 0.2)'
              }}>
                <h3 style={{
                  fontSize: '1rem',
                  fontWeight: 600,
                  margin: '0 0 1rem 0',
                  color: '#1e293b'
                }}>
                  Dị ứng
                </h3>

                <div style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
                  gap: '0.75rem'
                }}>
                  {(resident.allergies || []).length > 0 ? (
                    (resident.allergies || []).map((allergy: string, index: number) => (
                      <div key={index} style={{
                        padding: '0.5rem 0.75rem',
                        background: 'rgba(255, 255, 255, 0.8)',
                        borderRadius: '0.5rem',
                        border: '1px solid rgba(245, 158, 11, 0.2)',
                        fontSize: '0.875rem',
                        color: '#1e293b',
                        fontWeight: 500
                      }}>
                        {allergy}
                      </div>
                    ))
                  ) : (
                    <p style={{ fontSize: '0.875rem', color: '#64748b', margin: 0 }}>
                      Không có dị ứng đã biết
                    </p>
                  )}
                </div>
              </div>
            </div>
          )}

          {activeTab === 'contact' && (
            <div style={{
              background: 'rgba(16, 185, 129, 0.05)',
              borderRadius: '1rem',
              padding: '1.5rem',
              border: '1px solid rgba(16, 185, 129, 0.2)'
            }}>
              <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.75rem',
                marginBottom: '1.5rem'
              }}>
                <div style={{
                  width: '2rem',
                  height: '2rem',
                  background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
                  borderRadius: '0.5rem',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}>
                  <PhoneIcon style={{ width: '1rem', height: '1rem', color: 'white' }} />
                </div>
                <h3 style={{
                  fontSize: '1rem',
                  fontWeight: 600,
                  margin: 0,
                  color: '#1e293b'
                }}>
                  Thông tin liên hệ khẩn cấp
                </h3>
              </div>

              <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
                gap: '1.5rem'
              }}>
                <div>
                  <p style={{ fontSize: '0.75rem', fontWeight: 500, color: '#64748b', margin: '0 0 0.5rem 0' }}>
                    Người liên hệ khẩn cấp
                  </p>
                  <p style={{ fontSize: '1.125rem', color: '#1e293b', margin: 0, fontWeight: 600 }}>
                    {resident.emergencyContact && typeof resident.emergencyContact === 'object'
                      ? `${resident.emergencyContact.name || ''}${resident.emergencyContact.relationship ? ' (' + resident.emergencyContact.relationship + ')' : ''}`
                      : (resident.emergencyContact || 'Chưa hoàn tất đăng kí')}
                  </p>
                </div>
                <div>
                  <p style={{ fontSize: '0.75rem', fontWeight: 500, color: '#64748b', margin: '0 0 0.5rem 0' }}>
                    Số điện thoại liên hệ
                  </p>
                  <p style={{ fontSize: '1.125rem', color: '#1e293b', margin: 0, fontWeight: 600 }}>
                    {resident.emergencyContact?.phone || 'Chưa hoàn tất đăng kí'}
                  </p>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'notes' && (
            <div style={{ display: 'grid', gap: '1.5rem' }}>
              <div style={{
                background: 'rgba(245, 158, 11, 0.05)',
                borderRadius: '1rem',
                padding: '1.5rem',
                border: '1px solid rgba(245, 158, 11, 0.2)'
              }}>
                <h3 style={{
                  fontSize: '1rem',
                  fontWeight: 600,
                  margin: '0 0 1rem 0',
                  color: '#1e293b'
                }}>
                  Ghi chú chăm sóc
                </h3>
                <CareNotesDisplay
                  careNotes={careNotes}
                  isStaff={user?.role === 'staff'}
                />
              </div>

              {resident.personalNotes && (
                <div style={{
                  background: 'rgba(59, 130, 246, 0.05)',
                  borderRadius: '1rem',
                  padding: '1.5rem',
                  border: '1px solid rgba(59, 130, 246, 0.2)'
                }}>
                  <h3 style={{
                    fontSize: '1rem',
                    fontWeight: 600,
                    margin: '0 0 1rem 0',
                    color: '#1e293b'
                  }}>
                    Ghi chú cá nhân
                  </h3>
                  <div style={{
                    padding: '1rem',
                    background: 'rgba(255, 255, 255, 0.8)',
                    borderRadius: '0.5rem',
                    border: '1px solid rgba(59, 130, 246, 0.1)'
                  }}>
                    <p style={{ fontSize: '0.875rem', color: '#1e293b', margin: 0, lineHeight: '1.6' }}>
                      {resident.personalNotes}
                    </p>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      <style jsx>{`
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
} 