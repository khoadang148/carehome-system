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
  ExclamationCircleIcon,
  CurrencyDollarIcon,
  HomeIcon,
  DocumentTextIcon
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
  const [expandedServices, setExpandedServices] = useState<{ [key: number]: boolean }>({});

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

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('vi-VN', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const toggleServiceExpansion = (index: number) => {
    setExpandedServices(prev => ({
      ...prev,
      [index]: !prev[index]
    }));
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
                gap: '1.5rem'
              }}>
                {/* Avatar */}
                <div style={{
                  width: '80px',
                  height: '80px',
                  borderRadius: '50%',
                  overflow: 'hidden',
                  border: '3px solid #e5e7eb',
                  background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: 'white',
                  fontSize: '2rem',
                  fontWeight: 'bold',
                  flexShrink: 0
                }}>
                  {residentDetails?.avatar ? (
                    <img
                      src={userAPI.getAvatarUrl(residentDetails.avatar)}
                      alt={`Avatar của ${residentDetails?.full_name || residentDetails?.name}`}
                      style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                      onError={(e) => {
                        e.currentTarget.style.display = 'none';
                        const parent = e.currentTarget.parentElement;
                        if (parent) {
                          parent.textContent = (residentDetails?.full_name || residentDetails?.name || 'U').charAt(0).toUpperCase();
                        }
                      }}
                    />
                  ) : (
                    <img
                      src="/default-avatar.svg"
                      alt="Default avatar"
                      style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                      onError={(e) => {
                        e.currentTarget.style.display = 'none';
                        const parent = e.currentTarget.parentElement;
                        if (parent) {
                          parent.textContent = (residentDetails?.full_name || residentDetails?.name || 'U').charAt(0).toUpperCase();
                        }
                      }}
                    />
                  )}
                </div>
                
                {/* Thông tin cơ bản */}
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
                      {residentDetails?.full_name || residentDetails?.name || assignment?.resident_id?.full_name || assignment?.resident_id?.name || 'N/A'}
                </h1>
              </div>
              <div style={{
                display: 'flex',
                alignItems: 'center',
                    gap: '1rem',
                    marginTop: '0.5rem',
                    flexWrap: 'wrap'
                  }}>
                    {/* Tuổi */}
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
                      <span>{residentDetails?.date_of_birth ? (new Date().getFullYear() - new Date(residentDetails.date_of_birth).getFullYear()) : 'N/A'} tuổi</span>
                  </span>
                {/* Người thân */}
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
                      <PhoneIcon style={{ width: '1rem', height: '1rem' }} />
                      <span>Người thân:</span>
                      <span>{familyMemberDetails?.full_name || familyMemberDetails?.name || assignment?.family_member_id?.full_name || assignment?.family_member_id?.name || 'N/A'}</span>
                  </span>
                {/* Trạng thái */}
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
                      <CheckCircleIcon style={{ width: '1rem', height: '1rem' }} />
                  <span>Trạng thái:</span>
                      <span style={{ color: getStatusColor(assignment?.status), fontWeight: 600 }}>{getStatusText(assignment?.status)}</span>
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
              Chỉnh sửa
            </button>
          </div>
          
          {/* Page Title */}
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '1rem',
            paddingTop: '1.5rem',
            borderTop: '1px solid #e2e8f0'
          }}>
            <div style={{
              width: '3rem',
              height: '3rem',
              background: 'linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)',
              borderRadius: '0.75rem',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}>
              <ClipboardDocumentListIcon style={{ width: '1.5rem', height: '1.5rem', color: 'white' }} />
            </div>
            <div>
              <h2 style={{
                fontSize: '1.5rem',
                fontWeight: 700,
                color: '#1e293b',
                margin: 0
              }}>
                Chi tiết đăng ký dịch vụ
              </h2>
              <p style={{
                fontSize: '1rem',
                color: '#64748b',
                margin: '0.25rem 0 0 0'
              }}>
                Thông tin chi tiết về gói dịch vụ đã đăng ký
              </p>
            </div>
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
          <div style={{ display: 'grid', gap: '2rem' }}>
          
            {/* Service Cost Overview */}
            <div style={{
              background: 'linear-gradient(135deg, #dbeafe 0%, #bfdbfe 100%)',
              borderRadius: '1rem',
              padding: '2rem',
              border: '1px solid #93c5fd'
              }}>
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                gap: '1rem',
                marginBottom: '1.5rem'
                }}>
                  <div style={{
                  width: '3rem',
                  height: '3rem',
                    background: 'linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)',
                  borderRadius: '0.75rem',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center'
                  }}>
                  <CurrencyDollarIcon style={{ width: '1.5rem', height: '1.5rem', color: 'white' }} />
                  </div>
                <div>
                  <h3 style={{
                    fontSize: '1.25rem',
                    fontWeight: 700,
                    color: '#1e293b',
                    margin: 0
                  }}>
                    Tổng chi phí dịch vụ
                  </h3>
                  <p style={{
                    fontSize: '0.875rem',
                    color: '#64748b',
                    margin: '0.25rem 0 0 0'
                  }}>
                    Chi phí hàng tháng bao gồm phòng và dịch vụ
                  </p>
                </div>
              </div>
              
              <div style={{ textAlign: 'center' }}>
                <p style={{
                  fontSize: '2.5rem',
                  fontWeight: 800,
                  color: '#1d4ed8',
                  margin: '0 0 0.5rem 0'
                }}>
                  {formatCurrency(assignment?.total_monthly_cost || 0)}
                </p>
                <p style={{
                  fontSize: '1rem',
                  color: '#64748b',
                  margin: '0 0 1.5rem 0'
                }}>
                  Mỗi tháng
                </p>
                
                <div style={{
                  background: 'rgba(255, 255, 255, 0.9)',
                  borderRadius: '0.75rem',
                  padding: '1.5rem',
                  border: '1px solid #dbeafe'
                }}>
                  <div style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
                    gap: '1.5rem'
                  }}>
                    <div style={{ textAlign: 'center' }}>
                      <p style={{
                        fontSize: '0.875rem',
                        color: '#64748b',
                        margin: '0 0 0.5rem 0'
                      }}>
                        Tiền phòng
                      </p>
                      <p style={{
                        fontSize: '1.5rem',
                        fontWeight: 700,
                        color: '#1e293b',
                        margin: 0
                      }}>
                        {formatCurrency(assignment?.room_monthly_cost || 0)}
                    </p>
                  </div>
                    <div style={{ textAlign: 'center' }}>
                      <p style={{
                        fontSize: '0.875rem',
                        color: '#64748b',
                        margin: '0 0 0.5rem 0'
                      }}>
                        Tiền dịch vụ
                      </p>
                      <p style={{
                        fontSize: '1.5rem',
                        fontWeight: 700,
                        color: '#1e293b',
                        margin: 0
                      }}>
                        {formatCurrency(assignment?.care_plans_monthly_cost || 0)}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>

            {/* Service Packages */}
            <div style={{
              background: 'linear-gradient(135deg, #f0f9ff 0%, #e0f2fe 100%)',
              borderRadius: '1rem',
              padding: '2rem',
              border: '1px solid #7dd3fc'
              }}>
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                gap: '1rem',
                marginBottom: '1.5rem'
                }}>
                  <div style={{
                  width: '3rem',
                  height: '3rem',
                  background: 'linear-gradient(135deg, #0ea5e9 0%, #0284c7 100%)',
                  borderRadius: '0.75rem',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center'
                  }}>
                  <DocumentTextIcon style={{ width: '1.5rem', height: '1.5rem', color: 'white' }} />
                  </div>
                <div style={{ flex: 1 }}>
                  <h3 style={{
                    fontSize: '1.25rem',
                    fontWeight: 700,
                    color: '#1e293b',
                    margin: 0
                  }}>
                    Gói dịch vụ đã đăng ký
                  </h3>
                  <p style={{
                    fontSize: '0.875rem',
                    color: '#64748b',
                    margin: '0.25rem 0 0 0'
                  }}>
                    Chi tiết các dịch vụ đang sử dụng
                    </p>
                  </div>
                  <div>
                  <span style={{
                    background: 'rgba(14, 165, 233, 0.1)',
                    color: '#0c4a6e',
                    fontSize: '0.875rem',
                    fontWeight: 600,
                    padding: '0.5rem 1rem',
                    borderRadius: '9999px',
                    border: '1px solid rgba(14, 165, 233, 0.2)'
                  }}>
                    Tổng: {carePlanDetails.length} gói dịch vụ
                  </span>
            </div>
          </div>

              <div style={{ display: 'grid', gap: '1.5rem' }}>
                {carePlanDetails.map((carePlan: any, index: number) => (
                  <div key={index} style={{
                    background: 'rgba(255, 255, 255, 0.9)',
              borderRadius: '1rem',
                    padding: '1.5rem',
                    border: '1px solid #bae6fd',
                    boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
                    transition: 'all 0.2s ease'
                  }}>
                    {/* Header with name and price */}
                <div style={{
                  display: 'flex',
                      alignItems: 'flex-start',
                      justifyContent: 'space-between',
                      marginBottom: '1.5rem'
                    }}>
                      <div style={{ flex: 1 }}>
                        <h4 style={{
                          fontSize: '1.25rem',
                          fontWeight: 700,
                          color: '#1e293b',
                          margin: '0 0 0.5rem 0'
                        }}>
                          {carePlan.plan_name}
                        </h4>
                        <p style={{
                          fontSize: '0.875rem',
                          color: '#64748b',
                          lineHeight: '1.6',
                          margin: 0
                        }}>
                          {carePlan.description}
                        </p>
                      </div>
                      <div style={{ textAlign: 'right', marginLeft: '1rem' }}>
                  <div style={{
                    display: 'flex',
                    alignItems: 'center',
                          gap: '0.5rem',
                          marginBottom: '0.25rem'
                        }}>
                          <span style={{
                            fontSize: '0.75rem',
                            color: '#64748b'
                          }}>
                            Giá:
                          </span>
                          <span style={{
                            fontSize: '1.25rem',
                            fontWeight: 700,
                            color: '#0c4a6e'
                          }}>
                            {formatCurrency(carePlan.monthly_price || 0)}
                          </span>
                </div>
                        <p style={{
                          fontSize: '0.75rem',
                          color: '#64748b',
                          margin: 0
                        }}>
                          mỗi tháng
                        </p>
            </div>
          </div>

                    {/* Time Information */}
            <div style={{
                      background: 'linear-gradient(135deg, #f0fdf4 0%, #dcfce7 100%)',
                      borderRadius: '0.75rem',
                      padding: '1rem',
                      marginBottom: '1.5rem',
                      border: '1px solid #bbf7d0'
            }}>
              <div style={{
                        display: 'grid',
                        gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
                        gap: '1rem'
                      }}>
                        <div style={{ textAlign: 'center' }}>
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                            justifyContent: 'center',
                            gap: '0.5rem',
                            marginBottom: '0.5rem'
                          }}>
                            <CalendarIcon style={{ width: '1rem', height: '1rem', color: '#16a34a' }} />
                            <span style={{
                              fontSize: '0.75rem',
                    fontWeight: 600,
                              color: '#15803d'
                  }}>
                              Ngày bắt đầu
                            </span>
                </div>
                          <p style={{
                            fontSize: '0.875rem',
                      fontWeight: 600, 
                            color: '#1e293b',
                            margin: 0
                          }}>
                            {assignment?.start_date ? formatDate(assignment.start_date) : 'N/A'}
                          </p>
                        </div>
                        <div style={{ textAlign: 'center' }}>
                          <div style={{ 
                            display: 'flex', 
                            alignItems: 'center',
                            justifyContent: 'center',
                            gap: '0.5rem',
                            marginBottom: '0.5rem'
                          }}>
                            <CalendarIcon style={{ width: '1rem', height: '1rem', color: '#7c3aed' }} />
                            <span style={{
                              fontSize: '0.75rem',
                              fontWeight: 600,
                              color: '#6d28d9'
                            }}>
                              Ngày kết thúc
                            </span>
                              </div>
                          <p style={{
                            fontSize: '0.875rem',
                            fontWeight: 600,
                            color: '#1e293b',
                            margin: 0
                          }}>
                            {assignment?.end_date ? formatDate(assignment.end_date) : 'Không có thời hạn'}
                          </p>
                                </div>
                                </div>
                          </div>
                          
                    {/* Services Included */}
                    <div style={{
                      borderTop: '1px solid #e2e8f0',
                      paddingTop: '1.5rem'
                    }}>
                      <p style={{
                        fontSize: '0.875rem',
                        fontWeight: 600,
                        color: '#374151',
                        margin: '0 0 1rem 0'
                      }}>
                                Dịch vụ bao gồm:
                      </p>
                      <div style={{
                        display: 'flex',
                        flexWrap: 'wrap',
                        gap: '0.75rem'
                      }}>
                        {carePlan.services_included?.slice(0, expandedServices[index] ? undefined : 4).map((service: string, serviceIndex: number) => (
                                  <span key={serviceIndex} style={{
                            background: 'linear-gradient(135deg, #dbeafe 0%, #bfdbfe 100%)',
                            color: '#1e40af',
                            fontSize: '0.75rem',
                            padding: '0.5rem 1rem',
                            borderRadius: '9999px',
                            border: '1px solid #93c5fd',
                                    fontWeight: 500
                                  }}>
                                    {service}
                                  </span>
                                ))}
                        {carePlan.services_included?.length > 4 && !expandedServices[index] && (
                          <button
                            onClick={() => toggleServiceExpansion(index)}
                            style={{
                              background: 'rgba(59, 130, 246, 0.1)',
                              color: '#1d4ed8',
                              fontSize: '0.75rem',
                              padding: '0.5rem 1rem',
                              borderRadius: '9999px',
                              border: '1px solid rgba(59, 130, 246, 0.2)',
                              fontWeight: 500,
                              cursor: 'pointer',
                              display: 'flex',
                              alignItems: 'center',
                              gap: '0.25rem',
                              transition: 'all 0.2s ease'
                            }}
                          >
                            <span>+{carePlan.services_included.length - 4} dịch vụ khác</span>
                            <svg style={{ width: '0.75rem', height: '0.75rem' }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                            </svg>
                          </button>
                        )}
                        {carePlan.services_included?.length > 4 && expandedServices[index] && (
                          <button
                            onClick={() => toggleServiceExpansion(index)}
                            style={{
                              background: 'rgba(107, 114, 128, 0.1)',
                              color: '#374151',
                              fontSize: '0.75rem',
                              padding: '0.5rem 1rem',
                              borderRadius: '9999px',
                              border: '1px solid rgba(107, 114, 128, 0.2)',
                              fontWeight: 500,
                              cursor: 'pointer',
                              display: 'flex',
                              alignItems: 'center',
                              gap: '0.25rem',
                              transition: 'all 0.2s ease'
                            }}
                          >
                            <span>Thu gọn danh sách</span>
                            <svg style={{ width: '0.75rem', height: '0.75rem' }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
                            </svg>
                          </button>
                          )}
                        </div>
                    </div>
                  </div>
                ))}
                
                {carePlanDetails.length === 0 && (
                  <div style={{ textAlign: 'center', padding: '3rem' }}>
                    <DocumentTextIcon style={{
                      width: '3rem',
                      height: '3rem',
                      color: '#d1d5db',
                      margin: '0 auto 1rem'
                    }} />
                    <p style={{
                      fontSize: '1rem', 
                      fontWeight: 600, 
                      color: '#6b7280',
                      margin: '0 0 0.5rem 0'
                    }}>
                      Chưa có gói dịch vụ nào
                    </p>
                    <p style={{
                      fontSize: '0.875rem',
                      color: '#9ca3af',
                      margin: 0
                    }}>
                      Hãy đăng ký dịch vụ để bắt đầu
                    </p>
                          </div>
                )}
                          </div>
                        </div>

            {/* Room & Bed Information */}
                <div style={{ 
              background: 'linear-gradient(135deg, #f0fdf4 0%, #dcfce7 100%)',
                  borderRadius: '1rem',
                  padding: '2rem',
              border: '1px solid #86efac'
            }}>
              <div style={{
                    display: 'flex',
                    alignItems: 'center',
                gap: '1rem',
                marginBottom: '1.5rem'
                  }}>
                    <div style={{
                  width: '3rem',
                  height: '3rem',
                  background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
                  borderRadius: '0.75rem',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center'
                    }}>
                  <HomeIcon style={{ width: '1.5rem', height: '1.5rem', color: 'white' }} />
                    </div>
                <div>
                  <h3 style={{
                    fontSize: '1.25rem',
                    fontWeight: 700,
                    color: '#1e293b',
                    margin: 0
                  }}>
                    Phòng & Giường
                  </h3>
                  <p style={{
                    fontSize: '0.875rem',
                    color: '#64748b',
                    margin: '0.25rem 0 0 0'
                  }}>
                    Vị trí lưu trú hiện tại
                    </p>
                  </div>
                </div>

                <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
                gap: '1.5rem'
              }}>
                <div style={{ textAlign: 'center' }}>
                    <div style={{
                    background: 'rgba(255, 255, 255, 0.9)',
                      borderRadius: '0.75rem',
                    padding: '1.5rem',
                    border: '1px solid #bbf7d0'
                  }}>
                    <p style={{
                      fontSize: '0.875rem',
                      color: '#64748b',
                      margin: '0 0 0.5rem 0'
                    }}>
                      Loại phòng
                    </p>
                    <p style={{
                      fontSize: '1.5rem',
                      fontWeight: 700,
                      color: '#059669',
                      margin: 0
                    }}>
                      {roomTypeDetails?.type_name || assignment?.selected_room_type || 'N/A'}
                      </p>
                    </div>
                </div>
                <div style={{ textAlign: 'center' }}>
                    <div style={{
                    background: 'rgba(255, 255, 255, 0.9)',
                      borderRadius: '0.75rem',
                    padding: '1.5rem',
                    border: '1px solid #bbf7d0'
                  }}>
                    <p style={{
                      fontSize: '0.875rem',
                      color: '#64748b',
                      margin: '0 0 0.5rem 0'
                    }}>
                      Phòng được phân
                    </p>
                    <p style={{
                      fontSize: '1.5rem',
                      fontWeight: 700,
                      color: '#059669',
                      margin: 0
                    }}>
                      {assignment?.assigned_room_id ? (
                        <>
                          {assignment.assigned_room_id.room_number || 'N/A'}
                          {assignment.assigned_room_id.floor && ` (Tầng ${assignment.assigned_room_id.floor})`}
                        </>
                      ) : 'Chưa phân phòng'}
                      </p>
                    </div>
                  </div>
                <div style={{ textAlign: 'center' }}>
              <div style={{
                    background: 'rgba(255, 255, 255, 0.9)',
                    borderRadius: '0.75rem',
                    padding: '1.5rem',
                    border: '1px solid #bbf7d0'
                  }}>
                    <p style={{
                      fontSize: '0.875rem',
                      color: '#64748b',
                      margin: '0 0 0.5rem 0'
                    }}>
                      Giường được phân
                    </p>
                    <p style={{
                      fontSize: '1.5rem',
                      fontWeight: 700,
                      color: '#059669',
                      margin: 0
                    }}>
                      {assignment?.assigned_bed_id?.bed_number || 'Chưa phân giường'}
                          </p>
                        </div>
                      </div>
                        </div>
                      </div>
                  </div>
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