'use client';
import { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
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
import { useAuth } from '@/lib/contexts/auth-context';
import { carePlanAssignmentsAPI, residentAPI, userAPI, carePlansAPI, roomTypesAPI } from '@/lib/api';
import { formatDateDDMMYYYY } from '@/lib/utils/validation';

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

  const handleEditClick = () => {
    router.push(`/services/assignments/${assignmentId}/edit`);
  };

  // Show loading state while fetching data
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
            Đang tải thông tin đăng ký dịch vụ...
          </p>
        </div>
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
            Không tìm thấy đăng ký dịch vụ
          </h2>
          <p style={{
            fontSize: '0.875rem',
            color: '#6b7280',
            margin: '0 0 1.5rem 0'
          }}>
            {error}
          </p>
          <Link
            href="/services/assignments"
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
        {/* Header */}
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
              href="/services/assignments"
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
                gap: '0.75rem',
                marginTop: '0.9rem'
              }}>
                <div style={{
                  width: '2.5rem',
                  height: '2.5rem',
                  background: 'linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%)',
                  borderRadius: '0.75rem',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  boxShadow: '0 4px 15px rgba(59, 130, 246, 0.3)'
                }}>
                  <ClipboardDocumentListIcon style={{ width: '1.25rem', height: '1.25rem', color: 'white' }} />
                </div>
                <h1 style={{
                  fontSize: '2rem',
                  fontWeight: 700,
                  margin: 0,
                  background: 'linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%)',
                  WebkitBackgroundClip: 'text',
                  WebkitTextFillColor: 'transparent',
                  backgroundClip: 'text',
                  
                }}>
                  Chi tiết đăng ký dịch vụ
                </h1>
              </div>
              <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.75rem',
                marginTop: '1rem',
                flexWrap: 'wrap',
              }}>
                {/* Cư dân */}
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.5rem',
                  fontSize: '0.875rem',
                  color: '#475569',
                  background: 'linear-gradient(135deg, #f1f5f9 0%, #e2e8f0 100%)',
                  borderRadius: '0.75rem',
                  padding: '0.5rem 1rem',
                  fontWeight: 500,
                  border: '1px solid #e2e8f0'
                }}>
                  <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    width: '1.5rem',
                    height: '1.5rem',
                    background: 'rgba(59, 130, 246, 0.1)',
                    borderRadius: '0.5rem'
                  }}>
                    <UserIcon style={{ width: '0.875rem', height: '0.875rem', color: '#3b82f6' }} />
                  </div>
                  <span style={{ color: '#64748b' }}>Cư dân:</span>
                  <span style={{ color: '#1e293b', fontWeight: 600 }}>
                    {residentDetails?.full_name || assignment.resident_id?.full_name || 'N/A'}
                  </span>
                </div>

                {/* Người thân */}
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.5rem',
                  fontSize: '0.875rem',
                  color: '#475569',
                  background: 'linear-gradient(135deg, #f1f5f9 0%, #e2e8f0 100%)',
                  borderRadius: '0.75rem',
                  padding: '0.5rem 1rem',
                  fontWeight: 500,
                  border: '1px solid #e2e8f0'
                }}>
                  <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    width: '1.5rem',
                    height: '1.5rem',
                    background: 'rgba(99, 102, 241, 0.1)',
                    borderRadius: '0.5rem'
                  }}>
                    <PhoneIcon style={{ width: '0.875rem', height: '0.875rem', color: '#6366f1' }} />
                  </div>
                  <span style={{ color: '#64748b' }}>Người thân:</span>
                  <span style={{ color: '#1e293b', fontWeight: 600 }}>
                    {familyMemberDetails?.full_name || familyMemberDetails?.name || assignment.family_member_id?.full_name || assignment.family_member_id?.name || 'N/A'}
                  </span>
                </div>
                
                {/* Trạng thái */}
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.5rem',
                  padding: '0.5rem 1rem',
                  borderRadius: '0.75rem',
                  fontSize: '0.875rem',
                  fontWeight: 600,
                  background: `linear-gradient(135deg, ${getStatusColor(assignment.status)}15 0%, ${getStatusColor(assignment.status)}08 100%)`,
                  color: getStatusColor(assignment.status),
                  border: `1px solid ${getStatusColor(assignment.status)}30`
                }}>
                  <div style={{
                    width: '0.5rem', 
                    height: '0.5rem', 
                    background: getStatusColor(assignment.status), 
                    borderRadius: '9999px'
                  }}></div>
                  <span>Trạng thái:</span>
                  <span style={{ fontWeight: 700 }}>{getStatusText(assignment.status)}</span>
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
              Chỉnh sửa
            </button>
          </div>
        </div>
        
        {/* Content */}
        <div style={{
          background: 'linear-gradient(135deg, #ffffff 0%, #f8fafc 100%)',
          borderRadius: '1.5rem',
          padding: '2rem',
          boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.1)',
          border: '1px solid rgba(255, 255, 255, 0.2)'
        }}>
          

          {/* Resident Information Section - Full Width */}
          <div style={{ marginTop: '2rem' }}>
            <div style={{
              background: 'white',
              borderRadius: '1rem',
              border: '1px solid rgba(59, 130, 246, 0.2)',
              overflow: 'hidden'
            }}>
              <div style={{
                background: 'rgba(59, 130, 246, 0.1)',
                padding: '1rem 1.5rem',
                borderBottom: '1px solid rgba(59, 130, 246, 0.2)'
              }}>
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.75rem'
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
                    Thông tin cư dân
                  </h3>
                </div>
              </div>
              <div style={{ padding: '1.5rem' }}>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '1.5rem' }}>
                  <div>
                    <p style={{ fontSize: '0.75rem', fontWeight: 500, color: '#64748b', margin: '0 0 0.5rem 0' }}>
                      Họ và tên
                    </p>
                    <p style={{ fontSize: '0.875rem', color: '#1e293b', margin: 0, fontWeight: 500 }}>
                      {residentDetails?.full_name || assignment.resident_id?.full_name || 'N/A'}
                    </p>
                  </div>
                  <div>
                    <p style={{ fontSize: '0.75rem', fontWeight: 500, color: '#64748b', margin: '0 0 0.5rem 0' }}>
                      Giới tính
                    </p>
                    <p style={{ fontSize: '0.875rem', color: '#1e293b', margin: 0, fontWeight: 500 }}>
                      {residentDetails?.gender === 'male' ? 'Nam' : residentDetails?.gender === 'female' ? 'Nữ' : 'N/A'}
                    </p>
                  </div>
                  <div>
                    <p style={{ fontSize: '0.75rem', fontWeight: 500, color: '#64748b', margin: '0 0 0.5rem 0' }}>
                      Ngày sinh
                    </p>
                    <p style={{ fontSize: '0.875rem', color: '#1e293b', margin: 0, fontWeight: 500 }}>
                      {residentDetails?.date_of_birth ? formatDateDDMMYYYY(residentDetails.date_of_birth) : assignment.resident_id?.date_of_birth ? formatDateDDMMYYYY(assignment.resident_id.date_of_birth) : 'N/A'}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Family Member Information Section - Full Width */}
          <div style={{ marginTop: '2rem' }}>
            <div style={{
              background: 'white',
              borderRadius: '1rem',
              border: '1px solid rgba(16, 185, 129, 0.2)',
              overflow: 'hidden'
            }}>
              <div style={{
                background: 'rgba(16, 185, 129, 0.1)',
                padding: '1rem 1.5rem',
                borderBottom: '1px solid rgba(16, 185, 129, 0.2)'
              }}>
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.75rem'
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
                    Thông tin người thân
                  </h3>
                </div>
              </div>
              <div style={{ padding: '1.5rem' }}>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '1.5rem' }}>
                  <div>
                    <p style={{ fontSize: '0.75rem', fontWeight: 500, color: '#64748b', margin: '0 0 0.5rem 0' }}>
                      Họ và tên
                    </p>
                    <p style={{ fontSize: '0.875rem', color: '#1e293b', margin: 0, fontWeight: 500 }}>
                      {familyMemberDetails?.full_name || familyMemberDetails?.name || assignment.family_member_id?.full_name || assignment.family_member_id?.name || 'N/A'}
                    </p>
                  </div>
                  <div>
                    <p style={{ fontSize: '0.75rem', fontWeight: 500, color: '#64748b', margin: '0 0 0.5rem 0' }}>
                      Email
                    </p>
                    <p style={{ fontSize: '0.875rem', color: '#1e293b', margin: 0, fontWeight: 500 }}>
                      {familyMemberDetails?.email || assignment.family_member_id?.email || 'N/A'}
                    </p>
                  </div>
                  <div>
                    <p style={{ fontSize: '0.75rem', fontWeight: 500, color: '#64748b', margin: '0 0 0.5rem 0' }}>
                      Số điện thoại
                    </p>
                    <p style={{ fontSize: '0.875rem', color: '#1e293b', margin: 0, fontWeight: 500 }}>
                      {familyMemberDetails?.phone || assignment.family_member_id?.phone || 'N/A'}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Room Assignment Section - Full Width */}
          <div style={{ marginTop: '2rem' }}>
            <div style={{
              background: 'white',
              borderRadius: '1rem',
              border: '1px solid rgba(245, 158, 11, 0.2)',
              overflow: 'hidden'
            }}>
              <div style={{
                background: 'rgba(245, 158, 11, 0.1)',
                padding: '1rem 1.5rem',
                borderBottom: '1px solid rgba(245, 158, 11, 0.2)'
              }}>
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.75rem'
                }}>
                  <div style={{
                    width: '2rem',
                    height: '2rem',
                    background: 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)',
                    borderRadius: '0.5rem',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center'
                  }}>
                    <CalendarIcon style={{ width: '1rem', height: '1rem', color: 'white' }} />
                  </div>
                  <h3 style={{
                    fontSize: '1rem',
                    fontWeight: 600,
                    margin: 0,
                    color: '#1e293b'
                  }}>
                    Phân bổ phòng và giường
                  </h3>
                </div>
              </div>
              <div style={{ padding: '1.5rem' }}>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '1.5rem' }}>
                  <div>
                    <p style={{ fontSize: '0.75rem', fontWeight: 500, color: '#64748b', margin: '0 0 0.5rem 0' }}>
                      Loại phòng
                    </p>
                    <p style={{ fontSize: '0.875rem', color: '#1e293b', margin: 0, fontWeight: 500 }}>
                      {roomTypeDetails?.type_name || assignment.selected_room_type || 'N/A'}
                    </p>
                  </div>
                  <div>
                    <p style={{ fontSize: '0.75rem', fontWeight: 500, color: '#64748b', margin: '0 0 0.5rem 0' }}>
                      Phòng được phân
                    </p>
                    <p style={{ fontSize: '0.875rem', color: '#1e293b', margin: 0, fontWeight: 500 }}>
                      {assignment.assigned_room_id ? (
                        <>
                          {assignment.assigned_room_id.room_number || 'N/A'}
                          {assignment.assigned_room_id.floor && ` (Tầng ${assignment.assigned_room_id.floor})`}
                        </>
                      ) : 'Chưa phân phòng'}
                    </p>
                  </div>
                  <div>
                    <p style={{ fontSize: '0.75rem', fontWeight: 500, color: '#64748b', margin: '0 0 0.5rem 0' }}>
                      Giường được phân
                    </p>
                    <p style={{ fontSize: '0.875rem', color: '#1e293b', margin: 0, fontWeight: 500 }}>
                      {assignment.assigned_bed_id?.bed_number || 'Chưa phân giường'}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Care Plans Section - Full Width */}
          <div style={{ marginTop: '2rem' }}>
            <div style={{
              background: 'white',
              borderRadius: '1rem',
              border: '1px solid rgba(16, 185, 129, 0.2)',
              overflow: 'hidden'
            }}>
              <div style={{
                background: 'rgba(16, 185, 129, 0.1)',
                padding: '1rem 1.5rem',
                borderBottom: '1px solid rgba(16, 185, 129, 0.2)'
              }}>
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.75rem'
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
                    Gói dịch vụ đã đăng ký
                  </h3>
                </div>
              </div>
              <div style={{ padding: '1.5rem' }}>
                
                {/* Service Packages Section */}
                {carePlanDetails.length > 0 ? (
                  <div style={{ marginBottom: '2rem' }}>
                    <h4 style={{ 
                      fontSize: '1rem', 
                      fontWeight: 600, 
                      color: '#059669', 
                      margin: '0 0 1rem 0',
                      textTransform: 'uppercase',
                      letterSpacing: '0.05em'
                    }}>
                      Danh sách gói dịch vụ
                    </h4>
                    <div style={{ display: 'grid', gap: '1rem' }}>
                      {carePlanDetails.map((plan: any, index: number) => (
                        <div key={index} style={{
                          background: 'rgba(255,255,255,0.9)',
                          borderRadius: '0.75rem',
                          padding: '1.5rem',
                          border: '1px solid #d1fae5',
                          boxShadow: '0 2px 4px rgba(0,0,0,0.05)'
                        }}>
                          <div style={{ 
                            display: 'flex', 
                            justifyContent: 'space-between', 
                            alignItems: 'flex-start',
                            marginBottom: '1rem'
                          }}>
                            <div style={{ flex: 1 }}>
                              <div style={{ fontWeight: 600, fontSize: '1.125rem', color: '#059669', marginBottom: '0.5rem' }}>
                                {plan.plan_name || plan.description || 'N/A'}
                              </div>
                              {plan.description && plan.description !== plan.plan_name && (
                                <div style={{ fontSize: '0.875rem', color: '#6b7280', lineHeight: '1.5' }}>
                                  {plan.description}
                                </div>
                              )}
                            </div>
                            {plan.monthly_price !== undefined && (
                              <div style={{
                                background: 'rgba(5, 150, 105, 0.1)',
                                padding: '0.5rem 1rem',
                                borderRadius: '0.5rem',
                                border: '1px solid rgba(5, 150, 105, 0.2)',
                                textAlign: 'center',
                                minWidth: '120px'
                              }}>
                                <div style={{ fontSize: '0.75rem', color: '#059669', fontWeight: 500, marginBottom: '0.25rem' }}>
                                  Giá hàng tháng
                                </div>
                                <div style={{ fontSize: '1rem', color: '#059669', fontWeight: 700 }}>
                                  {formatCurrency(plan.monthly_price)}
                                </div>
                              </div>
                            )}
                          </div>
                          
                          {plan.services_included && plan.services_included.length > 0 && (
                            <div>
                              <div style={{ fontSize: '0.875rem', fontWeight: 600, color: '#374151', marginBottom: '0.75rem' }}>
                                Dịch vụ bao gồm:
                              </div>
                              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
                                {plan.services_included.map((service: string, serviceIndex: number) => (
                                  <span key={serviceIndex} style={{
                                    padding: '0.5rem 0.75rem',
                                    borderRadius: '0.5rem',
                                    fontSize: '0.8rem',
                                    backgroundColor: '#e0f2fe',
                                    color: '#0369a1',
                                    border: '1px solid #bae6fd',
                                    fontWeight: 500
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
                  </div>

                ) : Array.isArray(assignment.care_plan_ids) && assignment.care_plan_ids.length > 0 ? (
                  <div style={{ marginBottom: '2rem' }}>
                    <h4 style={{ 
                      fontSize: '1rem', 
                      fontWeight: 600, 
                      color: '#059669', 
                      margin: '0 0 1rem 0',
                      textTransform: 'uppercase',
                      letterSpacing: '0.05em'
                    }}>
                      Danh sách gói dịch vụ
                    </h4>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                      {assignment.care_plan_ids.map((plan: any, index: number) => (
                        <div key={index} style={{
                          padding: '1.5rem',
                          borderRadius: '0.75rem',
                          backgroundColor: '#f8fafc',
                          border: '1px solid #e2e8f0',
                          boxShadow: '0 2px 4px rgba(0,0,0,0.05)'
                        }}>
                          <div style={{ fontSize: '1rem', fontWeight: 600, color: '#111827', marginBottom: '0.5rem' }}>
                            {plan.description || plan.plan_name || 'N/A'}
                          </div>
                          <div style={{ fontSize: '0.875rem', color: '#6b7280' }}>
                            ID: {plan._id || 'N/A'}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                ) : (
                  <div style={{ 
                    textAlign: 'center', 
                    padding: '2rem', 
                    background: '#f8fafc', 
                    borderRadius: '0.75rem',
                    border: '1px solid #e2e8f0',
                    marginBottom: '2rem'
                  }}>
                    <div style={{ fontSize: '1rem', color: '#6b7280', fontWeight: 500 }}>
                      Không có gói dịch vụ nào được đăng ký
                    </div>
                  </div>
                )}

                {/* Cost Information Section */}
                <div style={{ 
                  background: 'linear-gradient(135deg, rgba(16, 185, 129, 0.05) 0%, rgba(5, 150, 105, 0.02) 100%)',
                  borderRadius: '1rem',
                  padding: '2rem',
                  border: '1px solid rgba(16, 185, 129, 0.15)',
                  marginBottom: '2rem',
                  boxShadow: '0 4px 6px rgba(0,0,0,0.05)'
                }}>
                  <h4 style={{ 
                    fontSize: '1rem', 
                    fontWeight: 600, 
                    color: '#059669', 
                    margin: '0 0 1.5rem 0',
                    textTransform: 'uppercase',
                    letterSpacing: '0.05em',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.5rem'
                  }}>
                    <div style={{
                      width: '1.5rem',
                      height: '1.5rem',
                      background: 'rgba(5, 150, 105, 0.2)',
                      borderRadius: '0.375rem',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center'
                    }}>
                      <HeartIcon style={{ width: '0.75rem', height: '0.75rem', color: '#059669' }} />
                    </div>
                    Chi phí dịch vụ
                  </h4>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '1.5rem' }}>
                    <div style={{
                      background: 'white',
                      padding: '1.25rem',
                      borderRadius: '0.75rem',
                      border: '1px solid rgba(16, 185, 129, 0.1)'
                    }}>
                      <p style={{ fontSize: '0.75rem', fontWeight: 500, color: '#64748b', margin: '0 0 0.5rem 0', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                        Chi phí phòng hàng tháng
                      </p>
                      <p style={{ fontSize: '1.125rem', color: '#1e293b', margin: 0, fontWeight: 600 }}>
                        {assignment.room_monthly_cost ? formatCurrency(assignment.room_monthly_cost) : 'N/A'}
                      </p>
                    </div>
                    <div style={{
                      background: 'white',
                      padding: '1.25rem',
                      borderRadius: '0.75rem',
                      border: '1px solid rgba(16, 185, 129, 0.1)'
                    }}>
                      <p style={{ fontSize: '0.75rem', fontWeight: 500, color: '#64748b', margin: '0 0 0.5rem 0', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                        Chi phí dịch vụ hàng tháng
                      </p>
                      <p style={{ fontSize: '1.125rem', color: '#1e293b', margin: 0, fontWeight: 600 }}>
                        {assignment.care_plans_monthly_cost ? formatCurrency(assignment.care_plans_monthly_cost) : 'N/A'}
                      </p>
                    </div>
                  </div>
                  <div style={{ 
                    background: 'linear-gradient(135deg, rgba(5, 150, 105, 0.1) 0%, rgba(16, 185, 129, 0.05) 100%)',
                    padding: '1.5rem',
                    borderRadius: '0.75rem',
                    border: '2px solid rgba(5, 150, 105, 0.2)',
                    marginTop: '1.5rem',
                    textAlign: 'center'
                  }}>
                    <p style={{ fontSize: '0.75rem', fontWeight: 500, color: '#64748b', margin: '0 0 0.5rem 0', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                      Tổng chi phí hàng tháng
                    </p>
                    <p style={{ fontSize: '1.5rem', color: '#059669', margin: 0, fontWeight: 700 }}>
                      {assignment.total_monthly_cost ? formatCurrency(assignment.total_monthly_cost) : 'N/A'}
                    </p>
                  </div>
                </div>

                {/* Registration Dates Section */}
                <div style={{
                  background: 'linear-gradient(135deg, rgba(139, 92, 246, 0.05) 0%, rgba(124, 58, 237, 0.02) 100%)',
                  borderRadius: '1rem',
                  padding: '2rem',
                  border: '1px solid rgba(139, 92, 246, 0.15)',
                  boxShadow: '0 4px 6px rgba(0,0,0,0.05)'
                }}>
                  <h4 style={{ 
                    fontSize: '1rem', 
                    fontWeight: 600, 
                    color: '#7c3aed', 
                    margin: '0 0 1.5rem 0',
                    textTransform: 'uppercase',
                    letterSpacing: '0.05em',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.5rem'
                  }}>
                    <div style={{
                      width: '1.5rem',
                      height: '1.5rem',
                      background: 'rgba(124, 58, 237, 0.2)',
                      borderRadius: '0.375rem',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center'
                    }}>
                      <CalendarIcon style={{ width: '0.75rem', height: '0.75rem', color: '#7c3aed' }} />
                    </div>
                    Thông tin thời gian
                  </h4>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '1.5rem' }}>
                    <div style={{
                      background: 'white',
                      padding: '1.25rem',
                      borderRadius: '0.75rem',
                      border: '1px solid rgba(139, 92, 246, 0.1)'
                    }}>
                      <p style={{ fontSize: '0.75rem', fontWeight: 500, color: '#64748b', margin: '0 0 0.5rem 0', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                        Ngày đăng ký dịch vụ
                      </p>
                      <p style={{ fontSize: '1.125rem', color: '#1e293b', margin: 0, fontWeight: 600 }}>
                        {assignment.registration_date ? formatDateDDMMYYYY(assignment.registration_date) : 'N/A'}
                      </p>
                    </div>
                    <div style={{
                      background: 'white',
                      padding: '1.25rem',
                      borderRadius: '0.75rem',
                      border: '1px solid rgba(139, 92, 246, 0.1)'
                    }}>
                      <p style={{ fontSize: '0.75rem', fontWeight: 500, color: '#64748b', margin: '0 0 0.5rem 0', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                        Ngày bắt đầu sử dụng dịch vụ
                      </p>
                      <p style={{ fontSize: '1.125rem', color: '#1e293b', margin: 0, fontWeight: 600 }}>
                        {assignment.start_date ? formatDateDDMMYYYY(assignment.start_date) : 'N/A'}
                      </p>
                    </div>
                  </div>
                </div>

              </div>
              
            </div>
          </div>

          {/* Notes Section - Full Width */}
          {(assignment.consultation_notes || assignment.notes) && (
            <div style={{ marginTop: '2rem' }}>
              <div style={{
                background: 'white',
                borderRadius: '1rem',
                border: '1px solid rgba(245, 158, 11, 0.2)',
                overflow: 'hidden'
              }}>
                <div style={{
                  background: 'rgba(245, 158, 11, 0.1)',
                  padding: '1rem 1.5rem',
                  borderBottom: '1px solid rgba(245, 158, 11, 0.2)'
                }}>
                  <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.75rem'
                  }}>
                    <div style={{
                      width: '2rem',
                      height: '2rem',
                      background: 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)',
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
                      color: '#1e293b'
                    }}>
                      Ghi chú
                    </h3>
                  </div>
                </div>
                <div style={{ padding: '1.5rem' }}>
                  <div style={{ display: 'grid', gap: '1rem' }}>
                    {assignment.consultation_notes && (
                      <div>
                        <p style={{ fontSize: '0.875rem', fontWeight: 500, color: '#374151', margin: '0 0 0.5rem 0' }}>
                          Ghi chú tư vấn:
                        </p>
                        <div style={{
                          padding: '1rem',
                          background: 'rgba(255, 255, 255, 0.8)',
                          borderRadius: '0.5rem',
                          border: '1px solid rgba(245, 158, 11, 0.1)'
                        }}>
                          <p style={{ fontSize: '0.875rem', color: '#1e293b', margin: 0, lineHeight: '1.6' }}>
                            {assignment.consultation_notes}
                          </p>
                        </div>
                      </div>
                    )}
                    
                    {assignment.notes && (
                      <div>
                        <p style={{ fontSize: '0.875rem', fontWeight: 500, color: '#374151', margin: '0 0 0.5rem 0' }}>
                          Ghi chú khác:
                        </p>
                        <div style={{
                          padding: '1rem',
                          background: 'rgba(255, 255, 255, 0.8)',
                          borderRadius: '0.5rem',
                          border: '1px solid rgba(245, 158, 11, 0.1)'
                        }}>
                          <p style={{ fontSize: '0.875rem', color: '#1e293b', margin: 0, lineHeight: '1.6' }}>
                            {assignment.notes}
                          </p>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
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