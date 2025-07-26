'use client';
import { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { useAuth } from '@/lib/contexts/auth-context';
import { carePlanAssignmentsAPI, residentAPI, userAPI, carePlansAPI, roomTypesAPI } from '@/lib/api';

export default function CarePlanAssignmentDetailPage() {
  const router = useRouter();
  const params = useParams();
  const { user } = useAuth();
  const [assignment, setAssignment] = useState<any>(null);
  const [residentDetails, setResidentDetails] = useState<any>(null);
  const [familyMemberDetails, setFamilyMemberDetails] = useState<any>(null);
  const [carePlanDetails, setCarePlanDetails] = useState<any[]>([]);
  const [roomTypeDetails, setRoomTypeDetails] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const assignmentId = params.id as string;

  useEffect(() => {
    if (!user) return;
    if (!(user.role === 'admin' || user.role === 'staff')) {
      router.push('/');
      return;
    }
    fetchAssignmentDetails();
  }, [user, router, assignmentId]);

  const fetchAssignmentDetails = async () => {
    if (!assignmentId) return;
    
    setLoading(true);
    setError(null);
    try {
      const data = await carePlanAssignmentsAPI.getById(assignmentId);
      console.log('Assignment data received:', data);
      console.log('Family member ID from assignment:', data.family_member_id);
      setAssignment(data);
      
      // Fetch resident details
      if (data.resident_id?._id) {
        try {
          const residentData = await residentAPI.getById(data.resident_id._id);
          setResidentDetails(residentData);
        } catch (err) {
          console.error('Error fetching resident details:', err);
        }
      }
      
      // Fetch family member details
      const familyMemberId = data.family_member_id?._id || data.family_member_id;
      if (familyMemberId) {
        try {
          console.log('Fetching family member with ID:', familyMemberId);
          const familyData = await userAPI.getById(familyMemberId);
          console.log('Family member data received:', familyData);
          setFamilyMemberDetails(familyData);
        } catch (err) {
          console.error('Error fetching family member details:', err);
        }
      } else {
        console.log('No family_member_id found in assignment data');
      }

      // Fetch care plan details
      if (Array.isArray(data.care_plan_ids) && data.care_plan_ids.length > 0) {
        try {
          console.log('Fetching care plan details for:', data.care_plan_ids.length, 'plans');
          const carePlanPromises = data.care_plan_ids.map(async (plan: any) => {
            const planId = plan._id || plan;
            console.log('Fetching care plan with ID:', planId);
            try {
              const planData = await carePlansAPI.getById(planId);
              console.log('Care plan data received for ID', planId, ':', planData);
              return planData;
            } catch (err) {
              console.error('Error fetching care plan with ID', planId, ':', err);
              return plan; // Return original plan data if fetch fails
            }
          });
          
          const carePlanData = await Promise.all(carePlanPromises);
          console.log('All care plan details received:', carePlanData);
          setCarePlanDetails(carePlanData);
        } catch (err) {
          console.error('Error fetching care plan details:', err);
        }
      } else {
        console.log('No care plans found in assignment data');
      }

      // Fetch room type details
      if (data.selected_room_type) {
        try {
          console.log('Fetching room types to find:', data.selected_room_type);
          const roomTypes = await roomTypesAPI.getAll();
          const matchingRoomType = roomTypes.find((rt: any) => rt.room_type === data.selected_room_type);
          if (matchingRoomType) {
            console.log('Room type details found:', matchingRoomType);
            setRoomTypeDetails(matchingRoomType);
          } else {
            console.log('No matching room type found for:', data.selected_room_type);
          }
        } catch (err) {
          console.error('Error fetching room type details:', err);
        }
      } else {
        console.log('No selected_room_type found in assignment data');
      }
    } catch (err: any) {
      setError(err.message || 'Không thể tải chi tiết đăng ký dịch vụ');
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('vi-VN');
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: 'VND'
    }).format(amount);
  };

  const getStatusText = (status: string) => {
    const statusMap: { [key: string]: string } = {
      'consulting': 'Đang tư vấn',
      'packages_selected': 'Đã chọn gói',
      'room_assigned': 'Đã phân phòng',
      'payment_completed': 'Đã thanh toán',
      'active': 'Đang hoạt động',
      'completed': 'Đã hoàn thành',
      'cancelled': 'Đã hủy',
      'paused': 'Tạm dừng'
    };
    return statusMap[status] || status;
  };

  const getStatusColor = (status: string) => {
    const colorMap: { [key: string]: string } = {
      'consulting': '#f59e0b',
      'packages_selected': '#3b82f6',
      'room_assigned': '#8b5cf6',
      'payment_completed': '#10b981',
      'active': '#059669',
      'completed': '#6b7280',
      'cancelled': '#ef4444',
      'paused': '#f97316'
    };
    return colorMap[status] || '#6b7280';
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
        <div style={{ fontSize: '1.125rem', color: '#6b7280' }}>Đang tải...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div style={{
        minHeight: '100vh',
        background: 'linear-gradient(135deg, #f8fafc 0%, #e2e8f0 100%)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center'
      }}>
        <div style={{ textAlign: 'center', color: '#ef4444' }}>
          <div style={{ fontSize: '1.125rem', marginBottom: '1rem' }}>{error}</div>
          <button
            onClick={() => router.back()}
            style={{
              padding: '0.75rem 1.5rem',
              borderRadius: '0.5rem',
              border: '1px solid #d1d5db',
              backgroundColor: 'white',
              color: '#374151',
              fontSize: '0.875rem',
              fontWeight: 500,
              cursor: 'pointer'
            }}
          >
            Quay lại
          </button>
        </div>
      </div>
    );
  }

  return (
    <div style={{
      minHeight: '100vh',
      background: 'linear-gradient(135deg, #f8fafc 0%, #e2e8f0 100%)',
      position: 'relative'
    }}>
      {/* Background decorations */}
      <div style={{
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        background: `
          radial-gradient(circle at 20% 80%, rgba(102, 126, 234, 0.05) 0%, transparent 50%),
          radial-gradient(circle at 80% 20%, rgba(16, 185, 129, 0.05) 0%, transparent 50%),
          radial-gradient(circle at 40% 40%, rgba(245, 158, 11, 0.03) 0%, transparent 50%)
        `,
        pointerEvents: 'none'
      }} />
      
      <div style={{
        maxWidth: '1200px',
        margin: '0 auto',
        padding: '2rem 1.5rem',
        position: 'relative',
        zIndex: 1
      }}>
        {/* Header Section */}
        <div style={{
          background: 'linear-gradient(135deg, #ffffff 0%, #f8fafc 100%)',
          borderRadius: '1.5rem',
          padding: '2rem',
          marginBottom: '2rem',
          boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.1), 0 0 0 1px rgba(255, 255, 255, 0.05)',
          border: '1px solid rgba(255, 255, 255, 0.2)',
          backdropFilter: 'blur(10px)'
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
            <h1 style={{
              fontSize: '2rem',
              fontWeight: 700,
              margin: 0,
              background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              letterSpacing: '-0.025em'
            }}>
              Chi tiết đăng ký dịch vụ
            </h1>
            <div style={{ display: 'flex', gap: '1rem' }}>
              <button
                onClick={() => router.push(`/services/assignments/${assignmentId}/edit`)}
                style={{
                  padding: '0.75rem 1.5rem',
                  borderRadius: '0.5rem',
                  border: '1px solid #059669',
                  backgroundColor: 'white',
                  color: '#059669',
                  fontSize: '0.875rem',
                  fontWeight: 500,
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.5rem',
                  transition: 'all 0.2s'
                }}
                onMouseOver={(e) => e.currentTarget.style.backgroundColor = '#ecfdf5'}
                onMouseOut={(e) => e.currentTarget.style.backgroundColor = 'white'}
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/>
                  <path d="m18.5 2.5 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
                </svg>
                Chỉnh sửa
              </button>
              <button
                onClick={() => router.back()}
                style={{
                  padding: '0.75rem 1.5rem',
                  borderRadius: '0.5rem',
                  border: '1px solid #d1d5db',
                  backgroundColor: 'white',
                  color: '#374151',
                  fontSize: '0.875rem',
                  fontWeight: 500,
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.5rem',
                  transition: 'all 0.2s'
                }}
                onMouseOver={(e) => e.currentTarget.style.backgroundColor = '#f9fafb'}
                onMouseOut={(e) => e.currentTarget.style.backgroundColor = 'white'}
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M19 12H5"/>
                  <path d="m12 19-7-7 7-7"/>
                </svg>
                Quay lại
              </button>
            </div>
          </div>
          
          {/* Status Badge */}
          <div style={{ display: 'flex', justifyContent: 'center' }}>
            <span style={{
              padding: '0.75rem 1.5rem',
              borderRadius: '2rem',
              fontSize: '1rem',
              fontWeight: 600,
              backgroundColor: getStatusColor(assignment.status) + '20',
              color: getStatusColor(assignment.status),
              border: `1px solid ${getStatusColor(assignment.status)}40`
            }}>
              {getStatusText(assignment.status)}
            </span>
          </div>
        </div>

        {/* Content Grid */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(400px, 1fr))', gap: '2rem' }}>
          {/* Resident Information */}
          <div style={{
            background: 'linear-gradient(135deg, #ffffff 0%, #f8fafc 100%)',
            borderRadius: '1rem',
            padding: '1.5rem',
            boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
            border: '1px solid rgba(255, 255, 255, 0.2)'
          }}>
            <h3 style={{ fontSize: '1.25rem', fontWeight: 600, margin: '0 0 1rem 0', color: '#111827' }}>
              Thông tin cư dân
            </h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              <div>
                <span style={{ fontSize: '0.875rem', color: '#6b7280' }}>Họ và tên:</span>
                <div style={{ fontSize: '0.875rem', fontWeight: 500, color: '#111827' }}>
                  {residentDetails?.full_name || assignment.resident_id?.full_name || 'N/A'}
                </div>
              </div>
              <div>
                <span style={{ fontSize: '0.875rem', color: '#6b7280' }}>Giới tính:</span>
                <div style={{ fontSize: '0.875rem', fontWeight: 500, color: '#111827' }}>
                  {residentDetails?.gender === 'male' ? 'Nam' : residentDetails?.gender === 'female' ? 'Nữ' : 'N/A'}
                </div>
              </div>
              <div>
                <span style={{ fontSize: '0.875rem', color: '#6b7280' }}>Ngày sinh:</span>
                <div style={{ fontSize: '0.875rem', fontWeight: 500, color: '#111827' }}>
                  {residentDetails?.date_of_birth ? formatDate(residentDetails.date_of_birth) : assignment.resident_id?.date_of_birth ? formatDate(assignment.resident_id.date_of_birth) : 'N/A'}
                </div>
              </div>
            </div>
          </div>

          {/* Family Member Information */}
          <div style={{
            background: 'linear-gradient(135deg, #ffffff 0%, #f8fafc 100%)',
            borderRadius: '1rem',
            padding: '1.5rem',
            boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
            border: '1px solid rgba(255, 255, 255, 0.2)'
          }}>
            <h3 style={{ fontSize: '1.25rem', fontWeight: 600, margin: '0 0 1rem 0', color: '#111827' }}>
              Thông tin người thân
            </h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              <div>
                <span style={{ fontSize: '0.875rem', color: '#6b7280' }}>Họ và tên:</span>
                <div style={{ fontSize: '0.875rem', fontWeight: 500, color: '#111827' }}>
                  {familyMemberDetails?.full_name || familyMemberDetails?.name || assignment.family_member_id?.full_name || assignment.family_member_id?.name || 'N/A'}
                </div>
              </div>
              <div>
                <span style={{ fontSize: '0.875rem', color: '#6b7280' }}>Email:</span>
                <div style={{ fontSize: '0.875rem', fontWeight: 500, color: '#111827' }}>
                  {familyMemberDetails?.email || assignment.family_member_id?.email || 'N/A'}
                </div>
              </div>
              <div>
                <span style={{ fontSize: '0.875rem', color: '#6b7280' }}>Số điện thoại:</span>
                <div style={{ fontSize: '0.875rem', fontWeight: 500, color: '#111827' }}>
                  {familyMemberDetails?.phone || assignment.family_member_id?.phone || 'N/A'}
                </div>
              </div>
            </div>
          </div>

          {/* Care Plans */}
          <div style={{
            background: 'linear-gradient(135deg, #ffffff 0%, #f8fafc 100%)',
            borderRadius: '1rem',
            padding: '1.5rem',
            boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
            border: '1px solid rgba(255, 255, 255, 0.2)'
          }}>
            <h3 style={{ fontSize: '1.25rem', fontWeight: 600, margin: '0 0 1rem 0', color: '#111827' }}>
              Gói dịch vụ
            </h3>
            {carePlanDetails.length > 0 ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                {carePlanDetails.map((plan: any, index: number) => (
                  <div key={index} style={{
                    padding: '1.5rem',
                    borderRadius: '0.75rem',
                    backgroundColor: '#f8fafc',
                    border: '1px solid #e2e8f0'
                  }}>
                    <div style={{ marginBottom: '0.75rem' }}>
                      <div style={{ fontSize: '1rem', fontWeight: 600, color: '#111827', marginBottom: '0.25rem' }}>
                        {plan.plan_name || plan.description || 'N/A'}
                      </div>
                      <div style={{ fontSize: '0.875rem', color: '#6b7280', marginBottom: '0.5rem' }}>
                        {plan.description && plan.description !== plan.plan_name ? plan.description : ''}
                      </div>
                    </div>
                    
                    {plan.services_included && plan.services_included.length > 0 && (
                      <div style={{ marginBottom: '0.75rem' }}>
                        <div style={{ fontSize: '0.875rem', fontWeight: 500, color: '#374151', marginBottom: '0.5rem' }}>
                          Dịch vụ bao gồm:
                        </div>
                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.25rem' }}>
                          {plan.services_included.map((service: string, serviceIndex: number) => (
                            <span key={serviceIndex} style={{
                              padding: '0.25rem 0.5rem',
                              borderRadius: '0.375rem',
                              fontSize: '0.75rem',
                              backgroundColor: '#e0f2fe',
                              color: '#0369a1',
                              border: '1px solid #bae6fd'
                            }}>
                              {service}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}
                    

                  </div>
                ))}
              </div>
            ) : Array.isArray(assignment.care_plan_ids) && assignment.care_plan_ids.length > 0 ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                {assignment.care_plan_ids.map((plan: any, index: number) => (
                  <div key={index} style={{
                    padding: '1rem',
                    borderRadius: '0.5rem',
                    backgroundColor: '#f8fafc',
                    border: '1px solid #e2e8f0'
                  }}>
                    <div style={{ fontSize: '0.875rem', fontWeight: 500, color: '#111827', marginBottom: '0.25rem' }}>
                      {plan.description || plan.plan_name || 'N/A'}
                    </div>
                    <div style={{ fontSize: '0.75rem', color: '#6b7280' }}>
                      ID: {plan._id || 'N/A'}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div style={{ fontSize: '0.875rem', color: '#6b7280' }}>Không có gói dịch vụ nào</div>
            )}
          </div>

          {/* Room and Bed Assignment */}
          <div style={{
            background: 'linear-gradient(135deg, #ffffff 0%, #f8fafc 100%)',
            borderRadius: '1rem',
            padding: '1.5rem',
            boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
            border: '1px solid rgba(255, 255, 255, 0.2)'
          }}>
            <h3 style={{ fontSize: '1.25rem', fontWeight: 600, margin: '0 0 1rem 0', color: '#111827' }}>
              Phân bổ phòng và giường
            </h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              <div>
                <span style={{ fontSize: '0.875rem', color: '#6b7280' }}>Loại phòng:</span>
                <div style={{ fontSize: '0.875rem', fontWeight: 500, color: '#111827' }}>
                  {roomTypeDetails?.type_name || assignment.selected_room_type || 'N/A'}
                </div>
              </div>
              <div>
                <span style={{ fontSize: '0.875rem', color: '#6b7280' }}>Phòng được phân:</span>
                <div style={{ fontSize: '0.875rem', fontWeight: 500, color: '#111827' }}>
                  {assignment.assigned_room_id ? (
                    <>
                      {assignment.assigned_room_id.room_number || 'N/A'}
                      {assignment.assigned_room_id.floor && ` (Tầng ${assignment.assigned_room_id.floor})`}
                    </>
                  ) : 'Chưa phân phòng'}
                </div>
              </div>
              <div>
                <span style={{ fontSize: '0.875rem', color: '#6b7280' }}>Giường được phân:</span>
                <div style={{ fontSize: '0.875rem', fontWeight: 500, color: '#111827' }}>
                  {assignment.assigned_bed_id?.bed_number || 'Chưa phân giường'}
                </div>
              </div>
            </div>
          </div>

          {/* Financial Information */}
          <div style={{
            background: 'linear-gradient(135deg, #ffffff 0%, #f8fafc 100%)',
            borderRadius: '1rem',
            padding: '1.5rem',
            boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
            border: '1px solid rgba(255, 255, 255, 0.2)'
          }}>
            <h3 style={{ fontSize: '1.25rem', fontWeight: 600, margin: '0 0 1rem 0', color: '#111827' }}>
              Thông tin tài chính
            </h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              <div>
                <span style={{ fontSize: '0.875rem', color: '#6b7280' }}>Chi phí phòng hàng tháng:</span>
                <div style={{ fontSize: '0.875rem', fontWeight: 500, color: '#111827' }}>
                  {assignment.room_monthly_cost ? formatCurrency(assignment.room_monthly_cost) : 'N/A'}
                </div>
              </div>
              <div>
                <span style={{ fontSize: '0.875rem', color: '#6b7280' }}>Chi phí dịch vụ hàng tháng:</span>
                <div style={{ fontSize: '0.875rem', fontWeight: 500, color: '#111827' }}>
                  {assignment.care_plans_monthly_cost ? formatCurrency(assignment.care_plans_monthly_cost) : 'N/A'}
                </div>
              </div>
              <div style={{ borderTop: '1px solid #e5e7eb', paddingTop: '0.75rem', marginTop: '0.25rem' }}>
                <span style={{ fontSize: '0.875rem', color: '#6b7280' }}>Tổng chi phí hàng tháng:</span>
                <div style={{ fontSize: '0.875rem', fontWeight: 600, color: '#059669' }}>
                  {assignment.total_monthly_cost ? formatCurrency(assignment.total_monthly_cost) : 'N/A'}
                </div>
              </div>
            </div>
          </div>

          {/* Dates */}
          <div style={{
            background: 'linear-gradient(135deg, #ffffff 0%, #f8fafc 100%)',
            borderRadius: '1rem',
            padding: '1.5rem',
            boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
            border: '1px solid rgba(255, 255, 255, 0.2)'
          }}>
            <h3 style={{ fontSize: '1.25rem', fontWeight: 600, margin: '0 0 1rem 0', color: '#111827' }}>
              Thông tin thời gian
            </h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              <div>
                <span style={{ fontSize: '0.875rem', color: '#6b7280' }}>Ngày đăng ký:</span>
                <div style={{ fontSize: '0.875rem', fontWeight: 500, color: '#111827' }}>
                  {assignment.registration_date ? formatDate(assignment.registration_date) : 'N/A'}
                </div>
              </div>
              <div>
                <span style={{ fontSize: '0.875rem', color: '#6b7280' }}>Ngày bắt đầu:</span>
                <div style={{ fontSize: '0.875rem', fontWeight: 500, color: '#111827' }}>
                  {assignment.start_date ? formatDate(assignment.start_date) : 'N/A'}
                </div>
              </div>
              <div>
                <span style={{ fontSize: '0.875rem', color: '#6b7280' }}>Ngày kết thúc:</span>
                <div style={{ fontSize: '0.875rem', fontWeight: 500, color: '#111827' }}>
                  {assignment.end_date ? formatDate(assignment.end_date) : 'Chưa có'}
                </div>
              </div>
            </div>
          </div>

          {/* Notes */}
          {(assignment.consultation_notes || assignment.notes) && (
            <div style={{
              background: 'linear-gradient(135deg, #ffffff 0%, #f8fafc 100%)',
              borderRadius: '1rem',
              padding: '1.5rem',
              boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
              border: '1px solid rgba(255, 255, 255, 0.2)'
            }}>
              <h3 style={{ fontSize: '1.25rem', fontWeight: 600, margin: '0 0 1rem 0', color: '#111827' }}>
                Ghi chú
              </h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                {assignment.consultation_notes && (
                  <div>
                    <span style={{ fontSize: '0.875rem', color: '#6b7280' }}>Ghi chú tư vấn:</span>
                    <div style={{ fontSize: '0.875rem', fontWeight: 500, color: '#111827', marginTop: '0.25rem' }}>
                      {assignment.consultation_notes}
                    </div>
                  </div>
                )}
                {assignment.notes && (
                  <div>
                    <span style={{ fontSize: '0.875rem', color: '#6b7280' }}>Ghi chú khác:</span>
                    <div style={{ fontSize: '0.875rem', fontWeight: 500, color: '#111827', marginTop: '0.25rem' }}>
                      {assignment.notes}
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
} 