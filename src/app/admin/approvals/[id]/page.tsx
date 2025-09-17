"use client";

import { useEffect, useState, useMemo } from "react";
import { useRouter, useParams, useSearchParams } from "next/navigation";
import useSWR from 'swr';
import { useAuth } from "@/lib/contexts/auth-context";
import { userAPI, residentAPI, carePlanAssignmentsAPI, carePlansAPI, roomsAPI, bedsAPI, API_BASE_URL } from "@/lib/api";
import { formatDisplayCurrency } from "@/lib/utils/currencyUtils";
import SuccessModal from "@/components/SuccessModal";
import { ArrowLeftIcon, CheckCircleIcon, XCircleIcon, UserIcon, HeartIcon, HomeIcon, CurrencyDollarIcon, PhoneIcon } from "@heroicons/react/24/outline";

// Helper to build file URL (same logic as the resident CCCD block)
const buildFileUrl = (file_path?: string) => {
  if (!file_path) return '';
  const cleanPath = String(file_path).replace(/\\/g, '/').replace(/"/g, '');
  return `${API_BASE_URL}/${cleanPath}`;
};

export default function ApprovalDetailPage() {
  // Add CSS for loading spinner animation
  useEffect(() => {
    const style = document.createElement('style');
    style.textContent = `
      @keyframes spin {
        0% { transform: rotate(0deg); }
        100% { transform: rotate(360deg); }
      }
    `;
    document.head.appendChild(style);
    
    return () => {
      document.head.removeChild(style);
    };
  }, []);
  const { user, loading } = useAuth();
  const router = useRouter();
  const params = useParams();
  const searchParams = useSearchParams();
  const id = String(params?.id || ""); // resident id or user id (fallback)
  const assignmentIdFromQuery = String(searchParams?.get("assignmentId") || "");

  const [busy, setBusy] = useState(false);
  const [successOpen, setSuccessOpen] = useState(false);
  const [successTitle, setSuccessTitle] = useState<string | undefined>(undefined);
  const [successName, setSuccessName] = useState<string | undefined>(undefined);
  const [successActionType, setSuccessActionType] = useState<string | undefined>(undefined);
  const [successDetails, setSuccessDetails] = useState<string | undefined>(undefined);
  const [nextUrlAfterSuccess, setNextUrlAfterSuccess] = useState<string | null>(null);
  const [carePlanDetails, setCarePlanDetails] = useState<any[]>([]);
  const [loadingCarePlans, setLoadingCarePlans] = useState(false);
  const [roomDetails, setRoomDetails] = useState<any>(null);
  const [bedDetails, setBedDetails] = useState<any>(null);
  const [loadingRoomBed, setLoadingRoomBed] = useState(false);
  const [roomTypeDetails, setRoomTypeDetails] = useState<any>(null);

  useEffect(() => {
    if (!loading && (!user || user.role !== "admin")) {
      router.replace("/login");
    }
  }, [user, loading, router]);

  // SWR fetchers
  const { data: assignmentDetail } = useSWR(
    assignmentIdFromQuery ? ["care-plan-assignment", assignmentIdFromQuery] : null,
    () => carePlanAssignmentsAPI.getById(assignmentIdFromQuery),
    { revalidateOnFocus: false, dedupingInterval: 30000 }
  );

  // Determine resident id priority: assignment.resident_id -> route id
  const derivedResidentId = useMemo(() => {
    const rid = assignmentDetail?.resident_id?._id || assignmentDetail?.resident_id;
    return String(rid || id || "");
  }, [assignmentDetail?.resident_id, id]);

  const { data: residentDetail } = useSWR(
    derivedResidentId ? ["resident", derivedResidentId] : null,
    () => residentAPI.getById(derivedResidentId),
    { revalidateOnFocus: false, dedupingInterval: 30000 }
  );

  const { data: userDetail } = useSWR(
    !residentDetail && id ? ["user", id] : null,
    () => userAPI.getById(id),
    { revalidateOnFocus: false, dedupingInterval: 30000 }
  );

  const isLoadingInitial = !residentDetail && !userDetail && (!assignmentIdFromQuery || (assignmentIdFromQuery && !assignmentDetail));

  // Load care plan details when assignmentDetail is available
  useEffect(() => {
    const loadCarePlanDetails = async () => {
      if (!assignmentDetail?.care_plan_ids || assignmentDetail.care_plan_ids.length === 0) {
        setCarePlanDetails([]);
        return;
      }

      setLoadingCarePlans(true);
      try {
        const carePlanPromises = assignmentDetail.care_plan_ids.map(async (planId: string) => {
          try {
            const planData = await carePlansAPI.getById(planId);
            return planData;
          } catch (err) {
            console.error(`Failed to load care plan ${planId}:`, err);
            return { _id: planId, name: `Gói ${planId} (Không tải được)` };
          }
        });

        const carePlanData = await Promise.all(carePlanPromises);
        setCarePlanDetails(carePlanData);
      } catch (error) {
        console.error('Error loading care plan details:', error);
        setCarePlanDetails([]);
      } finally {
        setLoadingCarePlans(false);
      }
    };

    loadCarePlanDetails();
  }, [assignmentDetail?.care_plan_ids]);

  // Load room and bed details when assignmentDetail is available
  useEffect(() => {
    const loadRoomBedDetails = async () => {
      if (!assignmentDetail?.assigned_room_id && !assignmentDetail?.assigned_bed_id) {
        setRoomDetails(null);
        setBedDetails(null);
        return;
      }

      setLoadingRoomBed(true);
      try {
        const promises: any[] = [];

        // Load room details if assigned_room_id exists
        if (assignmentDetail.assigned_room_id) {
          promises.push(
            roomsAPI.getById(assignmentDetail.assigned_room_id)
              .then((roomData) => {
                setRoomDetails(roomData);
                
                // Load room type details if room_type exists
                if (roomData?.room_type) {
                  return fetch(`${API_BASE_URL}/room-types?room_type=${roomData.room_type}`)
                    .then(res => res.json())
                    .then(roomTypes => {
                      if (roomTypes && roomTypes.length > 0) {
                        setRoomTypeDetails(roomTypes[0]);
                      }
                      return roomData;
                    })
                    .catch(err => {
                      console.error('Failed to load room type:', err);
                      return roomData;
                    });
                }
                return roomData;
              })
              .catch((err) => {
                console.error(`Failed to load room ${assignmentDetail.assigned_room_id}:`, err);
                setRoomDetails(null);
                return null;
              })
          );
        }

        // Load bed details if assigned_bed_id exists
        if (assignmentDetail.assigned_bed_id) {
          promises.push(
            bedsAPI.getById(assignmentDetail.assigned_bed_id)
              .then((bedData) => {
                setBedDetails(bedData);
                return bedData;
              })
              .catch((err) => {
                console.error(`Failed to load bed ${assignmentDetail.assigned_bed_id}:`, err);
                setBedDetails(null);
                return null;
              })
          );
        }

        if (promises.length > 0) {
          await Promise.all(promises);
        }
      } catch (error) {
        console.error('Error loading room/bed details:', error);
        setRoomDetails(null);
        setBedDetails(null);
      } finally {
        setLoadingRoomBed(false);
      }
    };

    loadRoomBedDetails();
  }, [assignmentDetail?.assigned_room_id, assignmentDetail?.assigned_bed_id]);

  const getStatusLabel = (status?: string) => {
    switch ((status || '').toLowerCase()) {
      case 'active':
        return 'Đang hoạt động';
      case 'inactive':
        return 'Không hoạt động';
      case 'suspended':
        return 'Tạm khóa';
      case 'deleted':
        return 'Đã xóa';
      case 'pending':
        return 'Chờ duyệt';
      case 'accepted':
        return 'Đã duyệt';
      case 'rejected':
        return 'Từ chối';
      default:
        return status || '---';
    }
  };

  const getRoleLabel = (role?: string) => {
    switch ((role || '').toLowerCase()) {
      case 'admin':
        return 'Quản trị viên';
      case 'staff':
        return 'Nhân viên';
      case 'family':
        return 'Gia đình';
      default:
        return role || '---';
    }
  };

  const approveCombined = async () => {
    try {
      setBusy(true);
      if (residentDetail?._id) {
        await residentAPI.approveResident(residentDetail._id);
        if (assignmentDetail?._id) {
          try { await carePlanAssignmentsAPI.approveAssignment(assignmentDetail._id); } catch {}
        }
        setSuccessTitle(assignmentDetail?._id ? 'Phê duyệt cư dân và gói chăm sóc thành công!' : 'Phê duyệt cư dân thành công!');
        setSuccessName(residentDetail?.full_name || 'Cư dân');
        setSuccessActionType('approve');
        setSuccessDetails(assignmentDetail?._id ? 'Cư dân và gói chăm sóc đã được phê duyệt thành công. Hệ thống sẽ tự động tạo hóa đơn tài chính.' : 'Cư dân đã được phê duyệt thành công.');
        setSuccessOpen(true);
        setNextUrlAfterSuccess('/admin/approvals');
        return;
      }
      if (userDetail?._id) {
        await userAPI.approveUser(userDetail._id);
        setSuccessTitle('Phê duyệt tài khoản thành công!');
        setSuccessName(userDetail?.full_name || userDetail?.username || 'Tài khoản');
        setSuccessActionType('approve');
        setSuccessDetails('Tài khoản đã được phê duyệt thành công. Người dùng có thể đăng nhập và sử dụng hệ thống.');
        setSuccessOpen(true);
        setNextUrlAfterSuccess('/admin/approvals');
      }
    } finally {
      setBusy(false);
    }
  };

  const rejectCombined = async () => {
    try {
      const reason = window.prompt('Nhập lý do từ chối');
      if (reason === null) return;
      setBusy(true);
      if (residentDetail?._id) {
        if (assignmentDetail?._id) {
          try { await carePlanAssignmentsAPI.rejectAssignment(assignmentDetail._id, reason || undefined); } catch {}
        }
        await residentAPI.rejectResident(residentDetail._id, reason || undefined);
        setSuccessTitle('Đã từ chối cư dân và gói chăm sóc');
        setSuccessName(residentDetail?.full_name || 'Cư dân');
        setSuccessActionType('reject');
        setSuccessDetails(reason ? `Lý do từ chối: ${reason}` : 'Yêu cầu đã bị từ chối.');
        setSuccessOpen(true);
        setNextUrlAfterSuccess('/admin/approvals');
        return;
      }
      if (userDetail?._id) {
        await userAPI.deactivateUser(userDetail._id, reason || undefined);
        setSuccessTitle('Đã từ chối tài khoản');
        setSuccessName(userDetail?.full_name || userDetail?.username || 'Tài khoản');
        setSuccessActionType('reject');
        setSuccessDetails(reason ? `Lý do từ chối: ${reason}` : 'Tài khoản đã bị từ chối.');
        setSuccessOpen(true);
        setNextUrlAfterSuccess('/admin/approvals');
      }
    } finally {
      setBusy(false);
    }
  };

  if (!user || user.role !== "admin") return null;

  return (
    <div style={{
      minHeight: '100vh',
      background: 'linear-gradient(135deg, #f8fafc 0%, #e2e8f0 100%)',
      padding: '2rem 1rem'
    }}>
      <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
        <div style={{
          background: 'linear-gradient(135deg, #ffffff 0%, #f8fafc 100%)',
          borderRadius: '1.5rem',
          padding: '2rem',
          marginBottom: '2rem',
          boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.1)',
          border: '1px solid rgba(255, 255, 255, 0.2)'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '1rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
            <button
              onClick={() => router.push('/admin/approvals')}
              title="Quay lại"
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                  width: '2.75rem',
                  height: '2.75rem',
                  background: 'linear-gradient(135deg, #eef2ff 0%, #e9d5ff 100%)',
                  borderRadius: '0.9rem',
                  color: '#7c3aed',
                  border: '1px solid #e9d5ff',
                  cursor: 'pointer',
                  boxShadow: '0 6px 16px rgba(124, 58, 237, 0.15)'
              }}
            >
              <ArrowLeftIcon style={{ width: '1.25rem', height: '1.25rem' }} />
            </button>
              <div>
            <h1 style={{
                  fontSize: '1.9rem',
              fontWeight: 800,
              margin: 0,
              background: 'linear-gradient(135deg, #7c3aed 0%, #6d28d9 100%)',
              WebkitBackgroundClip: 'text',
              backgroundClip: 'text',
                  color: 'transparent',
                  letterSpacing: '-0.01em'
            }}>
              Chi tiết phê duyệt
            </h1>
                <div style={{ marginTop: '0.25rem', color: '#64748b', fontWeight: 600, fontSize: '0.9rem' }}>
                  Xem và xử lý yêu cầu phê duyệt cư dân, tài khoản, và gói chăm sóc
                </div>
              </div>
            </div>
          </div>
        </div>

        {(!residentDetail && !userDetail && isLoadingInitial) ? (
          <div style={{
            background: 'linear-gradient(135deg, #ffffff 0%, #f8fafc 100%)',
            borderRadius: '1.5rem',
            padding: '2rem',
            boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.06)',
            border: '1px solid rgba(255, 255, 255, 0.2)'
          }}>
            <div style={{ display: 'grid', gap: '1rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                <div className="skeleton" style={{ width: '2.75rem', height: '2.75rem', borderRadius: '0.9rem' }} />
                <div style={{ flex: 1 }}>
                  <div className="skeleton" style={{ height: '1rem', width: '40%', borderRadius: '0.5rem', marginBottom: '0.5rem' }} />
                  <div className="skeleton" style={{ height: '0.75rem', width: '25%', borderRadius: '0.5rem' }} />
                </div>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '1rem' }}>
                {Array.from({ length: 4 }).map((_, idx) => (
                  <div key={idx} style={{ padding: '1rem', borderRadius: '0.9rem', background: '#f8fafc', border: '1px solid #e2e8f0' }}>
                    <div className="skeleton" style={{ height: '0.75rem', width: '40%', borderRadius: '0.5rem', marginBottom: '0.5rem' }} />
                    <div className="skeleton" style={{ height: '1rem', width: '70%', borderRadius: '0.5rem' }} />
                  </div>
                ))}
              </div>
            </div>
          </div>
        ) : (
          <div style={{ display: 'grid', gap: '1.5rem' }}>
            {residentDetail && (
              <div style={{
                background: 'linear-gradient(135deg, #ffffff 0%, #f8fafc 100%)',
                borderRadius: '1.5rem',
                padding: '2rem',
                boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.1)',
                border: '1px solid rgba(255, 255, 255, 0.2)'
              }}>
                <div style={{ 
                  display: 'flex', 
                  alignItems: 'center', 
                  gap: '0.75rem', 
                  marginBottom: '1.5rem', 
                  padding: '1rem 1.25rem',
                  background: 'linear-gradient(135deg, #f8fafc 0%, #e2e8f0 100%)',
                  borderRadius: '0.9rem',
                  border: '1px solid #e2e8f0',
                  boxShadow: '0 2px 8px rgba(0, 0, 0, 0.04)'
                }}>
                  <div style={{
                    width: '2.5rem',
                    height: '2.5rem',
                    borderRadius: '0.75rem',
                    background: 'linear-gradient(135deg, #7c3aed 0%, #6d28d9 100%)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    boxShadow: '0 4px 12px rgba(124, 58, 237, 0.25)'
                  }}>
                    <UserIcon style={{ width: '1.25rem', height: '1.25rem', color: 'white' }} />
                </div>
                  <div>
                    <h2 style={{
                      fontSize: '1.25rem',
                      fontWeight: 800,
                      margin: 0,
                      color: '#1e293b',
                      letterSpacing: '-0.01em'
                    }}>
                      THÔNG TIN NGƯỜI CAO TUỔI
                    </h2>
                    <p style={{
                      fontSize: '0.8rem',
                      color: '#64748b',
                      margin: '0.25rem 0 0 0',
                      fontWeight: 500
                    }}>
                      Thông tin cá nhân và giấy tờ tùy thân
                    </p>
                  </div>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '1rem', marginBottom: '2rem', padding: '1.5rem 0' }}>
                  <div style={{
                    position: 'relative',
                    width: '6rem',
                    height: '6rem'
                  }}>
                    <div style={{
                      position: 'absolute',
                      inset: 0,
                      borderRadius: '9999px',
                      padding: '3px',
                      background: 'linear-gradient(135deg, #3b82f6, #22c55e, #a855f7)',
                      WebkitMask: 'linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0)',
                      WebkitMaskComposite: 'xor' as any,
                      maskComposite: 'exclude'
                    }} />
                    <div style={{
                      position: 'absolute',
                      inset: '3px',
                      borderRadius: '9999px',
                      overflow: 'hidden',
                      background: '#eef2ff',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center'
                    }}>
                      {residentDetail.avatar ? (
                        <img
                          src={`${API_BASE_URL}/${String(residentDetail.avatar || '').replace(/\\/g,'/')}`}
                          alt="avatar"
                          style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                        />
                      ) : (
                        <UserIcon style={{ width: '2.5rem', height: '2.5rem', color: '#2563eb' }} />
                      )}
                    </div>
                  </div>
                  
                  <div style={{ textAlign: 'center' }}>
                    <div style={{ 
                      fontSize: '0.75rem', 
                      color: '#64748b', 
                      fontWeight: 600, 
                      marginBottom: '0.25rem', 
                      letterSpacing: '0.05em',
                      textTransform: 'uppercase'
                    }}>
                      Người cao tuổi:
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.75rem', marginBottom: '0.75rem', flexWrap: 'wrap' }}>
                      <h1 style={{ 
                        fontSize: '1.75rem', 
                        fontWeight: 800, 
                        color: '#0f172a', 
                        margin: 0,
                        letterSpacing: '-0.01em'
                      }}>
                        {residentDetail.full_name || '---'}
                      </h1>
                      </div>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem', marginBottom: '0.75rem' }}>
                          <span style={{
                            fontSize: '0.75rem',
                        color: '#64748b', 
                        fontWeight: 600, 
                        letterSpacing: '0.05em',
                        textTransform: 'uppercase'
                      }}>
                        Trạng thái hồ sơ:
                      </span>
                      {(() => {
                        const status = residentDetail?.status;
                        const getStatusStyle = (status: string) => {
                          switch (status) {
                            case 'active':
                              return 'bg-gradient-to-r from-emerald-500 to-emerald-600';
                            case 'discharged':
                              return 'bg-gradient-to-r from-blue-500 to-blue-600';
                            case 'deceased':
                              return 'bg-gradient-to-r from-gray-500 to-gray-600';
                            case 'accepted':
                              return 'bg-gradient-to-r from-green-500 to-green-600';
                            case 'rejected':
                              return 'bg-gradient-to-r from-red-500 to-red-600';
                            case 'pending':
                              return 'bg-gradient-to-r from-yellow-500 to-yellow-600';
                            default:
                              return 'bg-gradient-to-r from-slate-500 to-slate-600';
                          }
                        };
                        return (
                          <span className={`text-sm font-semibold text-white rounded-full px-4 py-1.5 shadow-lg uppercase tracking-wider text-center ${getStatusStyle(status)}`}>
                            {getStatusLabel(residentDetail.status)}
                          </span>
                        );
                      })()}
                    </div>
                    
                    
                      </div>
                </div>
                
                <div style={{ height: 1, background: 'linear-gradient(90deg, transparent, #e2e8f0, transparent)', margin: '0.75rem 0 1.25rem 0' }} />

                      <div style={{
                  padding: '1.75rem',
                  borderRadius: '1rem',
                  background: 'linear-gradient(135deg, #f8fafc 0%, #ffffff 100%)',
                  border: '1px solid #e2e8f0'
                }}>
                  <div style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(2, 1fr)',
                    gap: '1.5rem',
                    padding: '0 1rem'
                  }}>
                    <div style={{
                      display: 'flex',
                      flexDirection: 'column',
                      gap: '0.5rem',
                      padding: '1rem',
                      borderRadius: '0.75rem',
                      background: 'linear-gradient(135deg, #f1f5f9 0%, #e2e8f0 100%)',
                      border: '1px solid #cbd5e1'
                    }}>
                      <span style={{
                        color: '#64748b',
                        fontWeight: 700,
                        fontSize: '0.75rem',
                        textTransform: 'uppercase',
                        letterSpacing: '0.05em'
                      }}>Giới tính</span>
                      <span style={{
                        color: '#0f172a',
                        fontWeight: 800,
                        fontSize: '1.125rem'
                      }}>{residentDetail.gender === 'male' ? 'Nam' : residentDetail.gender === 'female' ? 'Nữ' : 'Khác'}</span>
                      </div>
                      <div style={{
                      display: 'flex',
                      flexDirection: 'column',
                      gap: '0.5rem',
                      padding: '1rem',
                      borderRadius: '0.75rem',
                      background: 'linear-gradient(135deg, #f1f5f9 0%, #e2e8f0 100%)',
                      border: '1px solid #cbd5e1'
                    }}>
                      <span style={{
                        color: '#64748b',
                        fontWeight: 700,
                        fontSize: '0.75rem',
                        textTransform: 'uppercase',
                        letterSpacing: '0.05em'
                      }}>Ngày sinh</span>
                      <span style={{
                        color: '#0f172a',
                        fontWeight: 800,
                        fontSize: '1.125rem'
                      }}>{residentDetail.date_of_birth ? new Date(residentDetail.date_of_birth).toLocaleDateString('vi-VN') : '---'}</span>
                      </div>
                      <div style={{
                      display: 'flex',
                      flexDirection: 'column',
                      gap: '0.5rem',
                      padding: '1rem',
                      borderRadius: '0.75rem',
                      background: 'linear-gradient(135deg, #f1f5f9 0%, #e2e8f0 100%)',
                      border: '1px solid #cbd5e1'
                    }}>
                      <span style={{
                        color: '#64748b',
                        fontWeight: 700,
                        fontSize: '0.75rem',
                        textTransform: 'uppercase',
                        letterSpacing: '0.05em'
                      }}>Ngày nhập viện</span>
                      <span style={{
                        color: '#0f172a',
                        fontWeight: 800,
                        fontSize: '1.125rem'
                      }}>{residentDetail.admission_date ? new Date(residentDetail.admission_date).toLocaleDateString('vi-VN') : '---'}</span>
                      </div>
                    <div style={{
                      display: 'flex',
                      flexDirection: 'column',
                      gap: '0.5rem',
                      padding: '1rem',
                      borderRadius: '0.75rem',
                      background: 'linear-gradient(135deg, #f1f5f9 0%, #e2e8f0 100%)',
                      border: '1px solid #cbd5e1'
                    }}>
                      <span style={{
                        color: '#64748b',
                        fontWeight: 700,
                        fontSize: '0.75rem',
                        textTransform: 'uppercase',
                        letterSpacing: '0.05em'
                      }}>Lịch sử bệnh án</span>
                      <span style={{
                        color: '#0f172a',
                        fontWeight: 800,
                        fontSize: '1.125rem'
                      }}>{residentDetail.medical_history || '---'}</span>
                    </div>
                    
                    <div style={{
                      display: 'flex',
                      flexDirection: 'column',
                      gap: '0.5rem',
                      padding: '1rem',
                      borderRadius: '0.75rem',
                      background: 'linear-gradient(135deg, #f1f5f9 0%, #e2e8f0 100%)',
                      border: '1px solid #cbd5e1'
                    }}>
                      <span style={{
                        color: '#64748b',
                        fontWeight: 700,
                        fontSize: '0.75rem',
                        textTransform: 'uppercase',
                        letterSpacing: '0.05em'
                      }}>Dị ứng</span>
                      <span style={{
                        color: '#0f172a',
                        fontWeight: 800,
                        fontSize: '1.125rem'
                      }}>{residentDetail.allergies && residentDetail.allergies.length > 0 ? residentDetail.allergies.join(', ') : 'Không có'}</span>
                      </div>
                    <div style={{
                      display: 'flex',
                      flexDirection: 'column',
                      gap: '0.5rem',
                      padding: '1rem',
                      borderRadius: '0.75rem',
                      background: 'linear-gradient(135deg, #f1f5f9 0%, #e2e8f0 100%)',
                      border: '1px solid #cbd5e1'
                    }}>
                      <span style={{
                        color: '#64748b',
                        fontWeight: 700,
                        fontSize: '0.75rem',
                        textTransform: 'uppercase',
                        letterSpacing: '0.05em'
                      }}>Thuốc đang dùng</span>
                      <span style={{
                        color: '#0f172a',
                        fontWeight: 800,
                        fontSize: '1.125rem'
                      }}>{residentDetail.current_medications && residentDetail.current_medications.length > 0 ? residentDetail.current_medications.map((med: any) => `${med.medication_name} (${med.dosage})`).join(', ') : 'Không có'}</span>
                </div>
                <div style={{
                      display: 'flex',
                      flexDirection: 'column',
                      gap: '0.5rem',
                      padding: '1rem',
                      borderRadius: '0.75rem',
                      background: 'linear-gradient(135deg, #f1f5f9 0%, #e2e8f0 100%)',
                      border: '1px solid #cbd5e1'
                    }}>
                      <span style={{
                        color: '#64748b',
                        fontWeight: 700,
                        fontSize: '0.75rem',
                        textTransform: 'uppercase',
                        letterSpacing: '0.05em'
                      }}> số CCCD của người cao tuổi</span>
                      <span style={{
                        color: '#0f172a',
                        fontWeight: 800,
                        fontSize: '1.125rem'
                      }}>{residentDetail.cccd_id || '---'}</span>
          </div>
                </div>

                  {(residentDetail?.cccd_front || residentDetail?.cccd_back) && (
                  <div style={{ marginTop: '2rem', marginLeft: '1rem'}}>
                    <div style={{ color: '#64748b', fontWeight: 600, fontSize: '0.75rem', textTransform: 'uppercase', marginBottom: '0.5rem' }}>Ảnh CCCD của người cao tuổi</div>
                    <div style={{ display: 'flex', gap: '0.75rem' }}>
                      {residentDetail?.cccd_front && (
                        <a href={`${API_BASE_URL}/${String(residentDetail.cccd_front).replace(/\\/g,'/')}`} target="_blank" rel="noreferrer" style={{ display: 'block', width: '10rem', height: '7rem', overflow: 'hidden', borderRadius: '0.5rem', border: '1px solid #e2e8f0', background: '#f8fafc' }}>
                          <img style={{ width: '100%', height: '100%', objectFit: 'cover' }} src={`${API_BASE_URL}/${String(residentDetail.cccd_front).replace(/\\/g,'/')}`} alt="CCCD front" />
                        </a>
                      )}
                      {residentDetail?.cccd_back && (
                        <a href={`${API_BASE_URL}/${String(residentDetail.cccd_back).replace(/\\/g,'/')}`} target="_blank" rel="noreferrer" style={{ display: 'block', width: '10rem', height: '7rem', overflow: 'hidden', borderRadius: '0.5rem', border: '1px solid #e2e8f0', background: '#f8fafc' }}>
                          <img style={{ width: '100%', height: '100%', objectFit: 'cover' }} src={`${API_BASE_URL}/${String(residentDetail.cccd_back).replace(/\\/g,'/')}`} alt="CCCD back" />
                        </a>
                      )}
                    </div>
                  </div>
                )}
                </div>

               

                {(residentDetail?.emergency_contact || residentDetail?.family_member_id) && (
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1rem', marginTop: '1rem' }}>
                    {residentDetail?.emergency_contact && (
                      <div style={{ padding: '1rem', borderRadius: '0.75rem', background: '#f8fafc', border: '1px solid #e2e8f0' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.75rem' }}>
                          <PhoneIcon style={{ width: '1rem', height: '1rem', color: '#dc2626' }} />
                          <div style={{ color: '#dc2626', fontWeight: 800, fontSize: '0.875rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Liên hệ khẩn cấp</div>
                        </div>
                        <div style={{ fontSize: '0.875rem' }}><span style={{ fontWeight: 600 }}>Tên: </span>{residentDetail.emergency_contact.name || '---'}</div>
                        <div style={{ fontSize: '0.875rem' }}><span style={{ fontWeight: 600 }}>SĐT: </span>{residentDetail.emergency_contact.phone || '---'}</div>
                        <div style={{ fontSize: '0.875rem' }}><span style={{ fontWeight: 600 }}>Quan hệ: </span>{residentDetail.emergency_contact.relationship || '---'}</div>
                      </div>
                    )}
                    {residentDetail?.family_member_id && (
                      <div style={{ padding: '1rem', borderRadius: '0.75rem', background: '#f8fafc', border: '1px solid #e2e8f0' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.75rem' }}>
                          <UserIcon style={{ width: '1rem', height: '1rem', color: '#059669' }} />
                          <div style={{ color: '#059669', fontWeight: 800, fontSize: '0.875rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Người thân</div>
                        </div>
                        <div style={{ fontSize: '0.875rem' }}><span style={{ fontWeight: 600 }}>Tên: </span>{residentDetail.family_member_id.full_name || '---'}</div>
                        <div style={{ fontSize: '0.875rem' }}><span style={{ fontWeight: 600 }}>Email: </span>{residentDetail.family_member_id.email || '---'}</div>
                        <div style={{ fontSize: '0.875rem' }}><span style={{ fontWeight: 600 }}>SĐT: </span>{residentDetail.family_member_id.phone || '---'}</div>
                        {(() => {
                          const fm = residentDetail.family_member_id || {} as any;
                          const hasAny = fm.cccd_id || fm.cccd_front || fm.cccd_back;
                          if (!hasAny) return null;
                          return (
                            <div style={{ marginTop: '0.75rem' }}>
                              <div style={{ color: '#059669', fontWeight: 600, fontSize: '0.75rem', textTransform: 'uppercase', marginBottom: '0.5rem' }}>CCCD người thân</div>
                              {fm.cccd_id && (
                                <div style={{ fontSize: '0.875rem', marginBottom: '0.5rem' }}><span style={{ fontWeight: 600 }}>Số CCCD: </span>{fm.cccd_id}</div>
                              )}
                              {(fm.cccd_front || fm.cccd_back) && (
                                <div style={{ display: 'flex', gap: '0.75rem' }}>
                                  {fm.cccd_front && (
                                    <a href={`${API_BASE_URL}/${String(fm.cccd_front).replace(/\\/g,'/')}`} target="_blank" rel="noreferrer" style={{ display: 'block', width: '8rem', height: '6rem', overflow: 'hidden', borderRadius: '0.5rem', border: '1px solid #e2e8f0', background: 'white' }}>
                                      <img
                                        style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                                        src={`${API_BASE_URL}/${String(fm.cccd_front).replace(/\\/g,'/')}`}
                                        alt="CCCD front (family)"
                                        onError={(e) => {
                                          const target = e.currentTarget as HTMLImageElement;
                                          target.style.display = 'none';
                                        }}
                                      />
                                    </a>
                                  )}
                                  {fm.cccd_back && (
                                    <a href={`${API_BASE_URL}/${String(fm.cccd_back).replace(/\\/g,'/')}`} target="_blank" rel="noreferrer" style={{ display: 'block', width: '8rem', height: '6rem', overflow: 'hidden', borderRadius: '0.5rem', border: '1px solid #e2e8f0', background: 'white' }}>
                                      <img
                                        style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                                        src={`${API_BASE_URL}/${String(fm.cccd_back).replace(/\\/g,'/')}`}
                                        alt="CCCD back (family)"
                                        onError={(e) => {
                                          const target = e.currentTarget as HTMLImageElement;
                                          target.style.display = 'none';
                                        }}
                                      />
                                    </a>
                                  )}
                                </div>
                              )}
                            </div>
                          );
                        })()}
                      </div>
                    )}
                  </div>
                )}

               
              </div>
            )}

            {assignmentDetail && (
              <div style={{
                background: 'linear-gradient(135deg, #ffffff 0%, #f8fafc 100%)',
                borderRadius: '1.5rem',
                padding: '2rem',
                boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.1)',
                border: '1px solid rgba(255, 255, 255, 0.2)'
              }}>
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.75rem',
                    marginBottom: '1.5rem',
                    padding: '1rem 1.5rem',
                    background: 'linear-gradient(90deg, #ffe4e6 0%, #f1f5f9 100%)',
                    borderRadius: '1rem',
                    border: '1.5px solid #e11d48',
                    boxShadow: '0 2px 8px 0 rgba(225,29,72,0.08)',
                  }}
                >
                  <HeartIcon style={{ width: '1.5rem', height: '1.5rem', color: '#e11d48' }} />
                  <span style={{
                    color: '#e11d48',
                    fontSize: '1.15rem',
                    fontWeight: 800,
                    letterSpacing: '0.04em',
                    textTransform: 'uppercase',
                  }}>
                  THÔNG TIN GÓI CHĂM SÓC
                  </span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1rem' }}>
                  <div style={{ width: '3rem', height: '3rem', borderRadius: '9999px', background: '#ffe4e6', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <HeartIcon style={{ width: '1.25rem', height: '1.25rem', color: '#e11d48' }} />
              </div>
              <div>
                    <div style={{ fontSize: '1.125rem', fontWeight: 700, color: '#0f172a' }}>Gói chăm sóc</div>
              </div>
            </div>

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '1rem', padding: '0 1rem' }}>
                  
                  <div style={{
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '0.5rem',
                    padding: '1rem',
                    borderRadius: '0.75rem',
                    background: 'linear-gradient(135deg, #f1f5f9 0%, #e2e8f0 100%)',
                    border: '1px solid #cbd5e1'
                  }}>
                    <span style={{
                      color: '#64748b',
                      fontWeight: 700,
                      fontSize: '0.75rem',
                      textTransform: 'uppercase',
                      letterSpacing: '0.05em'
                    }}>Trạng thái</span>
                    <span style={{
                      color: '#0f172a',
                      fontWeight: 800,
                      fontSize: '1.125rem'
                    }}>{getStatusLabel(assignmentDetail.status)}</span>
                </div>

                  <div style={{
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '0.5rem',
                    padding: '1rem',
                    borderRadius: '0.75rem',
                    background: 'linear-gradient(135deg, #f1f5f9 0%, #e2e8f0 100%)',
                    border: '1px solid #cbd5e1'
                  }}>
                    <span style={{
                      color: '#64748b',
                      fontWeight: 700,
                      fontSize: '0.75rem',
                      textTransform: 'uppercase',
                      letterSpacing: '0.05em'
                    }}>Ngày bắt đầu dịch vụ</span>
                    <span style={{
                      color: '#0f172a',
                      fontWeight: 800,
                      fontSize: '1.125rem'
                    }}>{assignmentDetail.start_date ? new Date(assignmentDetail.start_date).toLocaleDateString('vi-VN') : '---'}</span>
                  </div>
                  <div style={{
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '0.5rem',
                    padding: '1rem',
                    borderRadius: '0.75rem',
                    background: 'linear-gradient(135deg, #f1f5f9 0%, #e2e8f0 100%)',
                    border: '1px solid #cbd5e1'
                  }}>
                    <span style={{
                      color: '#64748b',
                      fontWeight: 700,
                      fontSize: '0.75rem',
                      textTransform: 'uppercase',
                      letterSpacing: '0.05em'
                    }}>Ngày kết thúc dịch vụ</span>
                    <span style={{
                      color: '#0f172a',
                      fontWeight: 800,
                      fontSize: '1.125rem'
                    }}>{assignmentDetail.end_date ? new Date(assignmentDetail.end_date).toLocaleDateString('vi-VN') : '---'}</span>
                  </div>
                  <div style={{
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '0.5rem',
                    padding: '1rem',
                    borderRadius: '0.75rem',
                    background: 'linear-gradient(135deg, #f1f5f9 0%, #e2e8f0 100%)',
                    border: '1px solid #cbd5e1'
                  }}>
                    <span style={{
                      color: '#64748b',
                      fontWeight: 700,
                      fontSize: '0.75rem',
                      textTransform: 'uppercase',
                      letterSpacing: '0.05em'
                    }}>Phòng dành cho</span>
                    <span style={{
                      color: '#0f172a',
                      fontWeight: 800,
                      fontSize: '1.125rem'
                    }}>{assignmentDetail.family_preferences?.preferred_room_gender === 'male' ? 'Nam' : assignmentDetail.family_preferences?.preferred_room_gender === 'female' ? 'Nữ' : '---'}</span>
            </div>

                </div>

                {/* Care Plans Section */}
                {assignmentDetail?.care_plan_ids && assignmentDetail.care_plan_ids.length > 0 && (
                  <div style={{ marginTop: '1.5rem', padding: '0 1rem' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.75rem' }}>
                      <HeartIcon style={{ width: '1rem', height: '1rem', color: '#e11d48' }} />
                      <div style={{ color: '#e11d48', fontWeight: 800, fontSize: '0.875rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Gói dịch vụ đã chọn</div>
                    </div>
                    {loadingCarePlans ? (
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '1rem', borderRadius: '0.75rem', background: '#f8fafc', border: '1px solid #e2e8f0' }}>
                        <div style={{ width: '1rem', height: '1rem', border: '2px solid #e2e8f0', borderTop: '2px solid #3b82f6', borderRadius: '50%', animation: 'spin 1s linear infinite' }}></div>
                        <div style={{ fontSize: '0.875rem', color: '#64748b' }}>Đang tải thông tin gói dịch vụ...</div>
                      </div>
                    ) : (
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                        {carePlanDetails.map((plan: any, index: number) => (
                          <div key={plan._id || index} style={{
                            padding: '1rem',
                            borderRadius: '0.75rem',
                            background: 'linear-gradient(135deg, #fef2f2 0%, #fee2e2 100%)',
                            border: '1px solid #fecaca',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '0.75rem'
                          }}>
                            <div style={{ width: '2rem', height: '2rem', borderRadius: '50%', background: '#e11d48', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                              <span style={{ color: 'white', fontSize: '0.875rem', fontWeight: 'bold' }}>{index + 1}</span>
                            </div>
                            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
                              <div>
                                <span style={{ fontSize: '0.75rem', color: '#64748b', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', marginRight: '0.5rem' }}>
                                  Tên gói:
                                </span>
                                <span style={{ fontSize: '1rem', fontWeight: 700, color: '#0f172a' }}>
                                  {plan.plan_name || plan.name || plan.title || plan.care_plan_name || `Gói ${plan._id}`}
                                </span>
                              </div>
                              <div>
                                <span style={{ fontSize: '0.75rem', color: '#64748b', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', marginRight: '0.5rem' }}>
                                  Mô tả:
                                </span>
                                <span style={{ fontSize: '0.875rem', color: '#64748b', lineHeight: '1.4' }}>
                                  {plan.description ? plan.description : '---'}
                                </span>
                              </div>
                              <div>
                                <span style={{ fontSize: '0.75rem', color: '#64748b', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', marginRight: '0.5rem' }}>
                                  Giá/tháng:
                                </span>
                                <span style={{ fontSize: '0.875rem', color: '#059669', fontWeight: 600 }}>
                                  {(plan.monthly_price || plan.monthly_cost)
                                    ? `${formatDisplayCurrency(Number(plan.monthly_price || plan.monthly_cost))}/tháng`
                                    : '---'}
                                </span>
                              </div>
                            </div>
                            </div>
                          
                        ))}
                      </div>
                    )}
                  </div>
                )}

                {/* Room and Bed Information */}
                <div style={{ marginTop: '1.5rem', padding: '0 1rem' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.75rem' }}>
                    <HomeIcon style={{ width: '1rem', height: '1rem', color: '#475569' }} />
                    <div style={{ color: '#475569', fontWeight: 800, fontSize: '0.875rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Thông tin phòng và giường</div>
                  </div>
                  
                  {loadingRoomBed ? (
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '1rem', borderRadius: '0.75rem', background: '#f8fafc', border: '1px solid #e2e8f0' }}>
                      <div style={{ width: '1rem', height: '1rem', border: '2px solid #e2e8f0', borderTop: '2px solid #3b82f6', borderRadius: '50%', animation: 'spin 1s linear infinite' }}></div>
                      <div style={{ fontSize: '0.875rem', color: '#64748b' }}>Đang tải thông tin phòng và giường...</div>
                    </div>
                  ) : (
                    <>
                      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem' }}>
                      <div style={{
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '0.5rem',
                    padding: '1rem',
                    borderRadius: '0.75rem',
                    background: 'linear-gradient(135deg, #f1f5f9 0%, #e2e8f0 100%)',
                    border: '1px solid #cbd5e1'
                  }}>
                    <span style={{
                      color: '#64748b',
                      fontWeight: 700,
                      fontSize: '0.75rem',
                      textTransform: 'uppercase',
                      letterSpacing: '0.05em'
                    }}>Loại phòng</span>
                    <span style={{
                      color: '#0f172a',
                      fontWeight: 800,
                      fontSize: '1.125rem'
                    }}>{roomTypeDetails?.type_name || (() => {
                      const roomType = assignmentDetail.selected_room_type || '';
                      if (!roomType) return '---';
                      
                      // Convert room type to Vietnamese
                      const typeMap: { [key: string]: string } = {
                        '2_bed': 'Phòng 2 giường',
                        '3_bed': 'Phòng 3 giường', 
                        '4_5_bed': 'Phòng 4-5 giường',
                        '6_8_bed': 'Phòng 6-8 giường',
                        'single': 'Phòng đơn',
                        'double': 'Phòng đôi',
                        'triple': 'Phòng ba',
                        'quad': 'Phòng bốn',
                        'standard': 'Phòng tiêu chuẩn',
                        'deluxe': 'Phòng cao cấp',
                        'vip': 'Phòng VIP'
                      };
                      
                      return typeMap[roomType] || roomType.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase());
                    })()}</span>
                  </div>
                  
                  <div style={{
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '0.5rem',
                    padding: '1rem',
                    borderRadius: '0.75rem',
                    background: 'linear-gradient(135deg, #f1f5f9 0%, #e2e8f0 100%)',
                    border: '1px solid #cbd5e1'
                  }}>
                    <span style={{
                      color: '#64748b',
                      fontWeight: 700,
                      fontSize: '0.75rem',
                      textTransform: 'uppercase',
                      letterSpacing: '0.05em'
                    }}>Tầng</span>
                    <span style={{
                      color: '#0f172a',
                      fontWeight: 800,
                      fontSize: '1.125rem'
                    }}> {roomDetails?.floor || '---'}</span>
                  </div>
                        <div style={{
                          padding: '1rem',
                          borderRadius: '0.75rem',
                          background: 'linear-gradient(135deg, #f1f5f9 0%, #e2e8f0 100%)',
                          border: '1px solid #cbd5e1'
                        }}>
                          <div style={{ fontSize: '0.75rem', color: '#64748b', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '0.5rem' }}>Phòng đã chọn</div>
                          <div style={{ fontSize: '1.125rem', color: '#0f172a', fontWeight: 800 }}>
                            {roomDetails?.room_number || assignmentDetail?.assigned_room_id?.room_number || assignmentDetail?.bed_id?.room_id?.room_number || 'Chưa chọn'}
                          </div>
                        </div>
                        
                        <div style={{
                          padding: '1rem',
                          borderRadius: '0.75rem',
                          background: 'linear-gradient(135deg, #f1f5f9 0%, #e2e8f0 100%)',
                          border: '1px solid #cbd5e1'
                        }}>
                          <div style={{ fontSize: '0.75rem', color: '#64748b', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '0.5rem' }}>Giường đã chọn</div>
                          <div style={{ fontSize: '1.125rem', color: '#0f172a', fontWeight: 800 }}>
                            {bedDetails?.bed_number || assignmentDetail?.assigned_bed_id?.bed_number || assignmentDetail?.bed_id?.bed_number || 'Chưa chọn'}
                          </div>
              </div>
            </div>

                     
                    </>
                  )}
            </div>

                {(assignmentDetail.consultation_notes || assignmentDetail.family_preferences?.special_requests) && (
                  <div style={{ marginTop: '1.5rem', padding: '0 1rem' }}>
                    {assignmentDetail.consultation_notes && (
                      <div style={{ marginBottom: '1rem', padding: '1rem', borderRadius: '0.75rem', background: '#fef3c7', border: '1px solid #f59e0b' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.75rem' }}>
                          <div style={{ width: '1rem', height: '1rem', borderRadius: '50%', background: '#f59e0b', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                            <span style={{ color: 'white', fontSize: '0.75rem', fontWeight: 'bold' }}>!</span>
                          </div>
                          <div style={{ color: '#92400e', fontWeight: 800, fontSize: '0.875rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Ghi chú tư vấn</div>
                        </div>
                        <div style={{ fontSize: '0.875rem', color: '#92400e', lineHeight: '1.5' }}>{assignmentDetail.consultation_notes}</div>
                      </div>
                    )}
                    {assignmentDetail.family_preferences?.special_requests && (
                      <div style={{ padding: '1rem', borderRadius: '0.75rem', background: '#e0f2fe', border: '1px solid #0284c7' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.75rem' }}>
                          <div style={{ width: '1rem', height: '1rem', borderRadius: '50%', background: '#0284c7', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                            <span style={{ color: 'white', fontSize: '0.75rem', fontWeight: 'bold' }}>★</span>
                          </div>
                          <div style={{ color: '#0c4a6e', fontWeight: 800, fontSize: '0.875rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Yêu cầu đặc biệt</div>
                        </div>
                        <div style={{ fontSize: '0.875rem', color: '#0c4a6e', lineHeight: '1.5' }}>{assignmentDetail.family_preferences.special_requests}</div>
                      </div>
                    )}
                  </div>
                )}

                <div style={{ marginTop: '1rem', padding: '1rem', borderRadius: '0.75rem', background: '#ecfdf5', border: '1px solid #a7f3d0', display: 'flex', alignItems: 'center', gap: '0.5rem', marginLeft: '1rem' }}>
                  <CurrencyDollarIcon style={{ width: '1.1rem', height: '1.1rem', color: '#047857' }} />
                  <div style={{ fontSize: '0.875rem', color: '#065f46' }}>Giá phòng: {assignmentDetail.room_monthly_cost ? `${formatDisplayCurrency(Number(assignmentDetail.room_monthly_cost))}/tháng` : '---'}</div>
                </div>
               
              </div>
            )}

            {!residentDetail && userDetail && (
              <div style={{
                background: 'linear-gradient(135deg, #ffffff 0%, #f8fafc 100%)',
                borderRadius: '1.5rem',
                padding: '2rem',
                boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.1)',
                border: '1px solid rgba(255, 255, 255, 0.2)'
              }}>
                <div style={{ 
                  display: 'flex', 
                  alignItems: 'center', 
                  gap: '0.75rem', 
                  marginBottom: '1.5rem', 
                  padding: '1rem 1.25rem',
                  background: 'linear-gradient(135deg, #f8fafc 0%, #e2e8f0 100%)',
                  borderRadius: '0.9rem',
                  border: '1px solid #e2e8f0',
                  boxShadow: '0 2px 8px rgba(0, 0, 0, 0.04)'
                }}>
                  <div style={{
                    width: '2.5rem',
                    height: '2.5rem',
                    borderRadius: '0.75rem',
                    background: 'linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    boxShadow: '0 4px 12px rgba(59, 130, 246, 0.25)'
                  }}>
                    <UserIcon style={{ width: '1.25rem', height: '1.25rem', color: 'white' }} />
                  </div>
                  <div>
                    <h2 style={{
                      fontSize: '1.25rem',
                      fontWeight: 800,
                      margin: 0,
                      color: '#1e293b',
                      letterSpacing: '-0.01em'
                    }}>
                      THÔNG TIN TÀI KHOẢN
                    </h2>
                    <p style={{
                      fontSize: '0.8rem',
                      color: '#64748b',
                      margin: '0.25rem 0 0 0',
                      fontWeight: 500
                    }}>
                      Thông tin chi tiết tài khoản người dùng
                    </p>
                  </div>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '1rem', marginBottom: '2rem', padding: '1.5rem 0' }}>
                  <div style={{
                    position: 'relative',
                    width: '6rem',
                    height: '6rem'
                  }}>
                    <div style={{
                      position: 'absolute',
                      inset: 0,
                      borderRadius: '9999px',
                      padding: '3px',
                      background: 'linear-gradient(135deg, #3b82f6, #1d4ed8, #7c3aed)',
                      WebkitMask: 'linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0)',
                      WebkitMaskComposite: 'xor' as any,
                      maskComposite: 'exclude'
                    }} />
                    <div style={{
                      position: 'absolute',
                      inset: '3px',
                      borderRadius: '9999px',
                      overflow: 'hidden',
                      background: '#eef2ff',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center'
                    }}>
                      {userDetail.avatar ? (
                        <img
                          src={`${API_BASE_URL}/${String(userDetail.avatar || '').replace(/\\/g,'/')}`}
                          alt="avatar"
                          style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                        />
                      ) : (
                        <UserIcon style={{ width: '2.5rem', height: '2.5rem', color: '#3b82f6' }} />
                      )}
                    </div>
                  </div>
                  
                  <div style={{ textAlign: 'center' }}>
                    <div style={{ 
                      fontSize: '0.75rem', 
                      color: '#64748b', 
                      fontWeight: 600, 
                      marginBottom: '0.25rem', 
                      letterSpacing: '0.05em',
                      textTransform: 'uppercase'
                    }}>
                      Tài khoản:
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.75rem', marginBottom: '0.75rem', flexWrap: 'wrap' }}>
                      <h1 style={{ 
                        fontSize: '1.75rem', 
                        fontWeight: 800, 
                        color: '#0f172a', 
                        margin: 0,
                        letterSpacing: '-0.01em'
                      }}>
                        {userDetail.full_name || userDetail.username || '---'}
                      </h1>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem', marginBottom: '0.75rem' }}>
                      <span style={{
                        fontSize: '0.75rem',
                        color: '#64748b', 
                        fontWeight: 600, 
                        letterSpacing: '0.05em',
                        textTransform: 'uppercase'
                      }}>
                        Trạng thái tài khoản:
                      </span>
                      {(() => {
                        const status = userDetail?.status;
                        const getStatusStyle = (status: string) => {
                          switch (status) {
                            case 'active':
                              return 'bg-gradient-to-r from-emerald-500 to-emerald-600';
                            case 'inactive':
                              return 'bg-gradient-to-r from-gray-500 to-gray-600';
                            case 'suspended':
                              return 'bg-gradient-to-r from-yellow-500 to-yellow-600';
                            case 'deleted':
                              return 'bg-gradient-to-r from-red-500 to-red-600';
                            case 'pending':
                              return 'bg-gradient-to-r from-yellow-500 to-yellow-600';
                            case 'accepted':
                              return 'bg-gradient-to-r from-green-500 to-green-600';
                            case 'rejected':
                              return 'bg-gradient-to-r from-red-500 to-red-600';
                            default:
                              return 'bg-gradient-to-r from-slate-500 to-slate-600';
                          }
                        };
                        return (
                          <span className={`text-sm font-semibold text-white rounded-full px-4 py-1.5 shadow-lg uppercase tracking-wider text-center ${getStatusStyle(status)}`}>
                            {getStatusLabel(userDetail.status)}
                          </span>
                        );
                      })()}
                    </div>
                  </div>
                </div>
                
                <div style={{ height: 1, background: 'linear-gradient(90deg, transparent, #e2e8f0, transparent)', margin: '0.75rem 0 1.25rem 0' }} />

                <div style={{
                  padding: '1.75rem',
                  borderRadius: '1rem',
                  background: 'linear-gradient(135deg, #f8fafc 0%, #ffffff 100%)',
                  border: '1px solid #e2e8f0'
                }}>
                  <div style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(2, 1fr)',
                    gap: '1.5rem',
                    padding: '0 1rem'
                  }}>
                    <div style={{
                      display: 'flex',
                      flexDirection: 'column',
                      gap: '0.5rem',
                      padding: '1rem',
                      borderRadius: '0.75rem',
                      background: 'linear-gradient(135deg, #f1f5f9 0%, #e2e8f0 100%)',
                      border: '1px solid #cbd5e1'
                    }}>
                      <span style={{
                        color: '#64748b',
                        fontWeight: 700,
                        fontSize: '0.75rem',
                        textTransform: 'uppercase',
                        letterSpacing: '0.05em'
                      }}>Họ và tên</span>
                      <span style={{
                        color: '#0f172a',
                        fontWeight: 800,
                        fontSize: '1.125rem'
                      }}>{userDetail.full_name || '---'}</span>
                    </div>
                    
                    <div style={{
                      display: 'flex',
                      flexDirection: 'column',
                      gap: '0.5rem',
                      padding: '1rem',
                      borderRadius: '0.75rem',
                      background: 'linear-gradient(135deg, #f1f5f9 0%, #e2e8f0 100%)',
                      border: '1px solid #cbd5e1'
                    }}>
                      <span style={{
                        color: '#64748b',
                        fontWeight: 700,
                        fontSize: '0.75rem',
                        textTransform: 'uppercase',
                        letterSpacing: '0.05em'
                      }}>Email</span>
                      <span style={{
                        color: '#0f172a',
                        fontWeight: 800,
                        fontSize: '1.125rem'
                      }}>{userDetail.email || '---'}</span>
                    </div>
                    
                    <div style={{
                      display: 'flex',
                      flexDirection: 'column',
                      gap: '0.5rem',
                      padding: '1rem',
                      borderRadius: '0.75rem',
                      background: 'linear-gradient(135deg, #f1f5f9 0%, #e2e8f0 100%)',
                      border: '1px solid #cbd5e1'
                    }}>
                      <span style={{
                        color: '#64748b',
                        fontWeight: 700,
                        fontSize: '0.75rem',
                        textTransform: 'uppercase',
                        letterSpacing: '0.05em'
                      }}>Số điện thoại</span>
                      <span style={{
                        color: '#0f172a',
                        fontWeight: 800,
                        fontSize: '1.125rem'
                      }}>{userDetail.phone || '---'}</span>
                    </div>
                    
                    <div style={{
                      display: 'flex',
                      flexDirection: 'column',
                      gap: '0.5rem',
                      padding: '1rem',
                      borderRadius: '0.75rem',
                      background: 'linear-gradient(135deg, #f1f5f9 0%, #e2e8f0 100%)',
                      border: '1px solid #cbd5e1'
                    }}>
                      <span style={{
                        color: '#64748b',
                        fontWeight: 700,
                        fontSize: '0.75rem',
                        textTransform: 'uppercase',
                        letterSpacing: '0.05em'
                      }}>Địa chỉ</span>
                      <span style={{
                        color: '#0f172a',
                        fontWeight: 800,
                        fontSize: '1.125rem'
                      }}>{userDetail.address || '---'}</span>
                    </div>
                    
                    <div style={{
                      display: 'flex',
                      flexDirection: 'column',
                      gap: '0.5rem',
                      padding: '1rem',
                      borderRadius: '0.75rem',
                      background: 'linear-gradient(135deg, #f1f5f9 0%, #e2e8f0 100%)',
                      border: '1px solid #cbd5e1'
                    }}>
                      <span style={{
                        color: '#64748b',
                        fontWeight: 700,
                        fontSize: '0.75rem',
                        textTransform: 'uppercase',
                        letterSpacing: '0.05em'
                      }}>Vai trò</span>
                      <span style={{
                        color: '#0f172a',
                        fontWeight: 800,
                        fontSize: '1.125rem'
                      }}>{getRoleLabel(userDetail.role)}</span>
                    </div>
                    
                    <div style={{
                      display: 'flex',
                      flexDirection: 'column',
                      gap: '0.5rem',
                      padding: '1rem',
                      borderRadius: '0.75rem',
                      background: 'linear-gradient(135deg, #f1f5f9 0%, #e2e8f0 100%)',
                      border: '1px solid #cbd5e1'
                    }}>
                      <span style={{
                        color: '#64748b',
                        fontWeight: 700,
                        fontSize: '0.75rem',
                        textTransform: 'uppercase',
                        letterSpacing: '0.05em'
                      }}>Ngày tạo tài khoản</span>
                      <span style={{
                        color: '#0f172a',
                        fontWeight: 800,
                        fontSize: '1.125rem'
                      }}>{userDetail.created_at ? new Date(userDetail.created_at).toLocaleDateString('vi-VN') : '---'}</span>
                    </div>
                  </div>
                </div>
              </div>
            )}

            <div style={{
              background: 'linear-gradient(135deg, #ffffff 0%, #f8fafc 100%)',
              borderRadius: '1.5rem',
              padding: '2rem',
              boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.1)',
              border: '1px solid rgba(255, 255, 255, 0.2)'
            }}>
              <div style={{ 
                display: 'flex', 
                alignItems: 'center', 
                gap: '0.75rem', 
                marginBottom: '1.5rem', 
                padding: '1rem 1.25rem',
                background: 'linear-gradient(135deg, #f8fafc 0%, #e2e8f0 100%)',
                borderRadius: '0.9rem',
                border: '1px solid #e2e8f0',
                boxShadow: '0 2px 8px rgba(0, 0, 0, 0.04)'
              }}>
                <div style={{
                  width: '2.5rem',
                  height: '2.5rem',
                  borderRadius: '0.75rem',
                  background: 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  boxShadow: '0 4px 12px rgba(245, 158, 11, 0.25)'
                }}>
                  <CheckCircleIcon style={{ width: '1.25rem', height: '1.25rem', color: 'white' }} />
                </div>
                <div>
                  <h2 style={{
                    fontSize: '1.25rem',
                    fontWeight: 800,
                    margin: 0,
                    color: '#1e293b',
                    letterSpacing: '-0.01em'
                  }}>
                    PHÊ DUYỆT
                  </h2>
                  <p style={{
                    fontSize: '0.8rem',
                    color: '#64748b',
                    margin: '0.25rem 0 0 0',
                    fontWeight: 500
                  }}>
                    Xem xét và quyết định phê duyệt hoặc từ chối yêu cầu
                  </p>
                </div>
              </div>

              <div style={{
                display: 'flex',
                gap: '1rem',
                justifyContent: 'center',
                alignItems: 'center',
                flexWrap: 'wrap'
              }}>
                <button
                  onClick={approveCombined}
                  disabled={busy}
                  title="Phê duyệt"
                  aria-label="Phê duyệt"
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '0.75rem',
                    padding: '1rem 2rem',
                    borderRadius: '1rem',
                    background: busy ? '#10b98180' : 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
                    color: 'white',
                    border: 'none',
                    cursor: busy ? 'not-allowed' : 'pointer',
                    fontSize: '1rem',
                    fontWeight: 700,
                    boxShadow: busy ? '0 4px 12px rgba(16, 185, 129, 0.15)' : '0 8px 25px rgba(16, 185, 129, 0.3)',
                    transition: 'all 0.2s ease',
                    minWidth: '160px',
                    justifyContent: 'center'
                  }}
                  onMouseOver={(e) => { 
                    if (!busy) {
                      (e.currentTarget as HTMLButtonElement).style.transform = 'translateY(-3px)';
                      (e.currentTarget as HTMLButtonElement).style.boxShadow = '0 12px 35px rgba(16, 185, 129, 0.4)';
                    }
                  }}
                  onMouseOut={(e) => { 
                    (e.currentTarget as HTMLButtonElement).style.transform = 'translateY(0)';
                    (e.currentTarget as HTMLButtonElement).style.boxShadow = busy ? '0 4px 12px rgba(16, 185, 129, 0.15)' : '0 8px 25px rgba(16, 185, 129, 0.3)';
                  }}
                >
                  <div style={{
                    width: '1.5rem',
                    height: '1.5rem',
                    borderRadius: '50%',
                    background: 'rgba(255, 255, 255, 0.2)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center'
                  }}>
                    <CheckCircleIcon style={{ width: '1rem', height: '1rem' }} />
                  </div>
                  Phê duyệt
                </button>
                
                <button
                  onClick={rejectCombined}
                  disabled={busy}
                  title="Từ chối"
                  aria-label="Từ chối"
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '0.75rem',
                    padding: '1rem 2rem',
                    borderRadius: '1rem',
                    background: busy ? '#ef444480' : 'linear-gradient(135deg, #ef4444 0%, #dc2626 100%)',
                    color: 'white',
                    border: 'none',
                    cursor: busy ? 'not-allowed' : 'pointer',
                    fontSize: '1rem',
                    fontWeight: 700,
                    boxShadow: busy ? '0 4px 12px rgba(239, 68, 68, 0.15)' : '0 8px 25px rgba(239, 68, 68, 0.3)',
                    transition: 'all 0.2s ease',
                    minWidth: '160px',
                    justifyContent: 'center'
                  }}
                  onMouseOver={(e) => { 
                    if (!busy) {
                      (e.currentTarget as HTMLButtonElement).style.transform = 'translateY(-3px)';
                      (e.currentTarget as HTMLButtonElement).style.boxShadow = '0 12px 35px rgba(239, 68, 68, 0.4)';
                    }
                  }}
                  onMouseOut={(e) => { 
                    (e.currentTarget as HTMLButtonElement).style.transform = 'translateY(0)';
                    (e.currentTarget as HTMLButtonElement).style.boxShadow = busy ? '0 4px 12px rgba(239, 68, 68, 0.15)' : '0 8px 25px rgba(239, 68, 68, 0.3)';
                  }}
                >
                  <div style={{
                    width: '1.5rem',
                    height: '1.5rem',
                    borderRadius: '50%',
                    background: 'rgba(255, 255, 255, 0.2)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center'
                  }}>
                    <XCircleIcon style={{ width: '1rem', height: '1rem' }} />
                  </div>
                  Từ chối
                </button>
              </div>
            </div>
          </div>
        )}

        <ApprovalSuccessModal
          open={successOpen}
          onClose={() => {
            setSuccessOpen(false);
            if (nextUrlAfterSuccess) {
              const url = nextUrlAfterSuccess;
              setNextUrlAfterSuccess(null);
              try { router.push(url); } catch {}
            }
          }}
          title={successTitle}
          name={successName}
          actionType={successActionType}
          details={successDetails}
        />
      </div>
    </div>
  );
}

function Info({ label, value }: { label: string; value?: string }) {
  return (
    <div style={{
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center',
      padding: '0.5rem 0.25rem',
      borderBottom: '1px solid #e2e8f0'
    }}>
      <div style={{ color: '#64748b', fontWeight: 600, fontSize: '0.85rem' }}>{label}</div>
      <div style={{ color: '#0f172a', fontWeight: 600, fontSize: '0.95rem' }}>{value || '---'}</div>
    </div>
  );
}

function DetailItem({ label, value }: { label: string; value?: string }) {
  return (
    <div style={{
      padding: '0.9rem 1rem',
      borderRadius: '0.75rem',
      background: '#f8fafc',
      border: '1px solid #e2e8f0',
      display: 'flex',
      flexDirection: 'column',
      gap: '0.35rem'
    }}>
      <div style={{ color: '#64748b', fontWeight: 700, fontSize: '0.75rem', textTransform: 'uppercase' }}>{label}</div>
      <div style={{ color: '#0f172a', fontWeight: 700, fontSize: '0.95rem' }}>{value || '---'}</div>
    </div>
  );
}

function DetailField({ label, value }: { label: string; value?: string }) {
  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      gap: '0.25rem',
      padding: '0.5rem 0.25rem'
    }}>
      <div style={{ color: '#64748b', fontWeight: 700, fontSize: '0.75rem', textTransform: 'uppercase' }}>{label}</div>
      <div style={{ color: '#0f172a', fontWeight: 700, fontSize: '0.95rem' }}>{value || '---'}</div>
    </div>
  );
}

// Approval Success Modal Component
function ApprovalSuccessModal({ 
  open, 
  onClose, 
  title, 
  name, 
  actionType, 
  details 
}: { 
  open: boolean; 
  onClose: () => void; 
  title?: string; 
  name?: string; 
  actionType?: string; 
  details?: string; 
}) {
  if (!open) return null;

  const isApproved = actionType === 'approve';
  const isRejected = actionType === 'reject';

  return (
    <div style={{
      position: 'fixed',
      inset: 0,
      backgroundColor: 'rgba(0, 0, 0, 0.5)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 9999,
      padding: '1rem'
    }}>
      <div style={{
        background: 'linear-gradient(135deg, #ffffff 0%, #f8fafc 100%)',
        borderRadius: '1.5rem',
        padding: '2rem',
        maxWidth: '500px',
        width: '100%',
        boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
        border: '1px solid rgba(255, 255, 255, 0.2)',
        position: 'relative'
      }}>
        {/* Close button */}
        <button
          onClick={onClose}
          style={{
            position: 'absolute',
            top: '1rem',
            right: '1rem',
            background: 'transparent',
            border: 'none',
            cursor: 'pointer',
            padding: '0.5rem',
            borderRadius: '0.5rem',
            color: '#64748b',
            fontSize: '1.5rem',
            lineHeight: 1
          }}
        >
          ×
        </button>

        {/* Icon */}
        <div style={{
          display: 'flex',
          justifyContent: 'center',
          marginBottom: '1.5rem'
        }}>
          <div style={{
            width: '5rem',
            height: '5rem',
            borderRadius: '50%',
            background: isApproved 
              ? 'linear-gradient(135deg, #10b981 0%, #059669 100%)'
              : isRejected
                ? 'linear-gradient(135deg, #ef4444 0%, #dc2626 100%)'
                : 'linear-gradient(135deg, #6b7280 0%, #4b5563 100%)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            boxShadow: isApproved 
              ? '0 10px 25px rgba(16, 185, 129, 0.3)'
              : isRejected
                ? '0 10px 25px rgba(239, 68, 68, 0.3)'
                : '0 10px 25px rgba(107, 114, 128, 0.3)'
          }}>
            {isApproved ? (
              <CheckCircleIcon style={{ width: '2.5rem', height: '2.5rem', color: 'white' }} />
            ) : isRejected ? (
              <XCircleIcon style={{ width: '2.5rem', height: '2.5rem', color: 'white' }} />
            ) : (
              <CheckCircleIcon style={{ width: '2.5rem', height: '2.5rem', color: 'white' }} />
            )}
          </div>
        </div>

        {/* Title */}
        <div style={{
          textAlign: 'center',
          marginBottom: '1rem'
        }}>
          <h2 style={{
            fontSize: '1.5rem',
            fontWeight: 800,
            margin: 0,
            color: '#1e293b',
            letterSpacing: '-0.01em'
          }}>
            {title || 'Thành công!'}
          </h2>
        </div>

        {/* Name */}
        {name && (
          <div style={{
            textAlign: 'center',
            marginBottom: '1.5rem'
          }}>
            <div style={{
              fontSize: '1.125rem',
              fontWeight: 600,
              color: '#64748b',
              marginBottom: '0.5rem'
            }}>
              {isApproved ? 'Đã phê duyệt:' : isRejected ? 'Đã từ chối:' : 'Đối tượng:'}
            </div>
            <div style={{
              fontSize: '1.25rem',
              fontWeight: 700,
              color: '#1e293b'
            }}>
              {name}
            </div>
          </div>
        )}

        {/* Details */}
        {details && (
          <div style={{
            background: isApproved 
              ? 'linear-gradient(135deg, #ecfdf5 0%, #d1fae5 100%)'
              : isRejected
                ? 'linear-gradient(135deg, #fef2f2 0%, #fee2e2 100%)'
                : 'linear-gradient(135deg, #f8fafc 0%, #e2e8f0 100%)',
            border: `1px solid ${isApproved ? '#a7f3d0' : isRejected ? '#fecaca' : '#cbd5e1'}`,
            borderRadius: '0.75rem',
            padding: '1rem',
            marginBottom: '1.5rem'
          }}>
            <div style={{
              fontSize: '0.875rem',
              color: isApproved ? '#065f46' : isRejected ? '#991b1b' : '#475569',
              lineHeight: '1.5',
              textAlign: 'center'
            }}>
              {details}
            </div>
          </div>
        )}

        {/* Action buttons */}
        <div style={{
          display: 'flex',
          gap: '1rem',
          justifyContent: 'center'
        }}>
          <button
            onClick={onClose}
            style={{
              padding: '0.75rem 2rem',
              borderRadius: '0.75rem',
              background: isApproved 
                ? 'linear-gradient(135deg, #10b981 0%, #059669 100%)'
                : isRejected
                  ? 'linear-gradient(135deg, #ef4444 0%, #dc2626 100%)'
                  : 'linear-gradient(135deg, #6b7280 0%, #4b5563 100%)',
              color: 'white',
              border: 'none',
              cursor: 'pointer',
              fontSize: '0.875rem',
              fontWeight: 600,
              boxShadow: isApproved 
                ? '0 4px 12px rgba(16, 185, 129, 0.3)'
                : isRejected
                  ? '0 4px 12px rgba(239, 68, 68, 0.3)'
                  : '0 4px 12px rgba(107, 114, 128, 0.3)',
              transition: 'all 0.2s ease'
            }}
            onMouseOver={(e) => {
              (e.currentTarget as HTMLButtonElement).style.transform = 'translateY(-2px)';
            }}
            onMouseOut={(e) => {
              (e.currentTarget as HTMLButtonElement).style.transform = 'translateY(0)';
            }}
          >
            {isApproved ? 'Tiếp tục' : isRejected ? 'Đóng' : 'OK'}
          </button>
        </div>
      </div>
    </div>
  );
}

// Scoped styles
// eslint-disable-next-line @next/next/no-css-tags
// We intentionally embed a small style block for skeleton animation
// matching the resident page approach for keyframes.
// This is safe in a client component.
//
// Note: Keep minimal to avoid style leakage.
export const dynamic = 'force-dynamic';


