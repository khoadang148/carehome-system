"use client";

import React, { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import Link from 'next/link';
import { 
  ArrowLeftIcon,
  XMarkIcon,
  CheckCircleIcon,
  ClockIcon,
  CurrencyDollarIcon,
  UserIcon,
  CalendarIcon,
  DocumentTextIcon,
  ExclamationTriangleIcon,
  HomeIcon,
  ShieldCheckIcon,
  HeartIcon
} from '@heroicons/react/24/outline';
import { useAuth } from '@/lib/contexts/auth-context';
import { carePlansAPI, residentAPI, userAPI, roomsAPI, bedsAPI, bedAssignmentsAPI } from '@/lib/api';

// Helper function to get full avatar URL
const getAvatarUrl = (avatarPath: string | null | undefined) => {
  if (!avatarPath) return '/default-avatar.svg';
  
  if (avatarPath.startsWith('http')) return avatarPath;
  if (avatarPath.startsWith('data:')) return avatarPath;
  
  const cleanPath = avatarPath.replace(/\\/g, '/').replace(/"/g, '/');
  return userAPI.getAvatarUrl(cleanPath);
};

export default function ResidentServiceDetailPage() {
  const router = useRouter();
  const params = useParams();
  const { user } = useAuth();
  
  const [resident, setResident] = useState<any>(null);
  const [carePlanAssignment, setCarePlanAssignment] = useState<any>(null);
  const [carePlanDetails, setCarePlanDetails] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [roomNumber, setRoomNumber] = useState<string>('Chưa hoàn tất đăng kí');
  const [bedNumber, setBedNumber] = useState<string>('Chưa hoàn tất đăng kí');
  const [roomLoading, setRoomLoading] = useState(false);
  const [bedLoading, setBedLoading] = useState(false);
  const [expandedServices, setExpandedServices] = useState<{ [key: number]: boolean }>({});
  const [roomCost, setRoomCost] = useState<number>(0);

  // Get IDs from URL params
  const residentId = params.id as string;
  const serviceId = params.serviceId as string;

  // Check access permissions - admin only
  useEffect(() => {
    if (!user) {
      router.push('/login');
      return;
    }
    
    if (user?.role !== 'admin') {
      router.push('/');
      return;
    }
  }, [user, router]);

  // Load resident data
  useEffect(() => {
    const loadResident = async () => {
      try {
        setLoading(true);
        const data = await residentAPI.getById(residentId);
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
      } catch (error) {
        console.error('Error loading resident:', error);
        router.push('/admin/residents');
      } finally {
        setLoading(false);
      }
    };

    if (residentId) {
      loadResident();
    }
  }, [residentId, router]);

  // Load care plan assignment
  useEffect(() => {
    const loadCarePlanAssignment = async () => {
      if (!residentId) return;

      try {
        const assignments = await carePlansAPI.getByResidentId(residentId);
        console.log('🔍 All care plan assignments for resident:', assignments);
        
        const assignment = Array.isArray(assignments) ? assignments.find((a: any) => a._id === serviceId) : null;
        console.log('🔍 Found assignment:', assignment);
        
        if (assignment) {
          setCarePlanAssignment(assignment);
          
          // Load care plan details
          if (assignment.care_plan_ids && assignment.care_plan_ids.length > 0) {
            const carePlanPromises = assignment.care_plan_ids.map(async (plan: any) => {
              const planId = plan._id || plan;
              try {
                const planData = await carePlansAPI.getById(planId);
                console.log('✅ Loaded care plan:', planData);
                return planData;
              } catch (err) {
                console.error('❌ Error fetching care plan with ID', planId, ':', err);
                // Return a fallback object with basic info
                return {
                  plan_name: plan.plan_name || 'Gói dịch vụ không xác định',
                  description: plan.description || 'Không có mô tả',
                  monthly_price: plan.monthly_price || 0,
                  services_included: plan.services_included || ['Không có thông tin dịch vụ'],
                  start_date: plan.start_date || assignment.start_date,
                  end_date: plan.end_date || assignment.end_date
                };
              }
            });
            
            const carePlanData = await Promise.all(carePlanPromises);
            console.log('📋 Final care plan details:', carePlanData);
            setCarePlanDetails(carePlanData);
          } else {
            console.log('⚠️ No care plan IDs found in assignment');
            setCarePlanDetails([]);
          }
        } else {
          console.log('❌ No assignment found for serviceId:', serviceId);
        }
      } catch (error) {
        console.error('❌ Error loading care plan assignment:', error);
        setCarePlanDetails([]);
      }
    };

    loadCarePlanAssignment();
  }, [residentId, serviceId]);

  // Load room and bed information
  useEffect(() => {
    const loadRoomAndBedInfo = async () => {
      if (!residentId) return;

      setRoomLoading(true);
      setBedLoading(true);

      try {
        console.log('🏠 Loading room and bed info for resident:', residentId);
        
        // Ưu tiên sử dụng bedAssignmentsAPI để lấy thông tin phòng và giường
        try {
          const bedAssignments = await bedAssignmentsAPI.getByResidentId(residentId);
          console.log('🛏️ Bed assignments found:', bedAssignments);
          
          const bedAssignment = Array.isArray(bedAssignments) ? 
            bedAssignments.find((a: any) => a.bed_id?.room_id) : null;
          
          console.log('🛏️ Active bed assignment:', bedAssignment);
          
          if (bedAssignment?.bed_id?.room_id) {
            // Nếu room_id đã có thông tin room_number, sử dụng trực tiếp
            if (typeof bedAssignment.bed_id.room_id === 'object' && bedAssignment.bed_id.room_id.room_number) {
              console.log('🏠 Room number from bed assignment:', bedAssignment.bed_id.room_id.room_number);
              setRoomNumber(bedAssignment.bed_id.room_id.room_number);
              // Set room cost if available
              if (bedAssignment.bed_id.room_id.monthly_price) {
                setRoomCost(bedAssignment.bed_id.room_id.monthly_price);
                console.log('💰 Room cost from bed assignment:', bedAssignment.bed_id.room_id.monthly_price);
              }
            } else {
              // Nếu chỉ có _id, fetch thêm thông tin
              const roomId = bedAssignment.bed_id.room_id._id || bedAssignment.bed_id.room_id;
              console.log('🏠 Fetching room info for ID:', roomId);
              if (roomId) {
                const room = await roomsAPI.getById(roomId);
                console.log('🏠 Room data:', room);
                setRoomNumber(room?.room_number || 'Chưa hoàn tất đăng kí');
                // Set room cost from fetched room data
                if (room?.monthly_price) {
                  setRoomCost(room.monthly_price);
                  console.log('💰 Room cost from fetched room:', room.monthly_price);
                }
              } else {
                throw new Error('No room ID found');
              }
            }
          } else {
            throw new Error('No bed assignment found');
          }

          if (bedAssignment?.bed_id) {
            // Nếu bed_id đã có thông tin bed_number, sử dụng trực tiếp
            if (typeof bedAssignment.bed_id === 'object' && bedAssignment.bed_id.bed_number) {
              console.log('🛏️ Bed number from bed assignment:', bedAssignment.bed_id.bed_number);
              setBedNumber(bedAssignment.bed_id.bed_number);
            } else {
              // Nếu chỉ có _id, fetch thêm thông tin
              const bedId = bedAssignment.bed_id._id || bedAssignment.bed_id;
              console.log('🛏️ Fetching bed info for ID:', bedId);
              if (bedId) {
                const bed = await bedsAPI.getById(bedId);
                console.log('🛏️ Bed data:', bed);
                setBedNumber(bed?.bed_number || 'Chưa hoàn tất đăng kí');
              } else {
                throw new Error('No bed ID found');
              }
            }
          } else {
            throw new Error('No bed assignment found');
          }
        } catch (bedError) {
          console.warn(`⚠️ Failed to get bed assignment for resident ${residentId}:`, bedError);
          
          // Fallback về carePlansAPI nếu bedAssignmentsAPI không có kết quả
          if (carePlanAssignment) {
            console.log('🔄 Falling back to care plan assignment for room/bed info');
            
            // Load room information from care plan assignment
            const assignedRoomId = carePlanAssignment.bed_id?.room_id || carePlanAssignment.assigned_room_id;
            console.log('🏠 Room ID from care plan:', assignedRoomId);
            
            const roomIdString = typeof assignedRoomId === 'object' && assignedRoomId?._id ? assignedRoomId._id : assignedRoomId;
            if (roomIdString) {
              const room = await roomsAPI.getById(roomIdString);
              console.log('🏠 Room data from care plan:', room);
              setRoomNumber(room?.room_number || 'Chưa hoàn tất đăng kí');
              // Set room cost from care plan fallback
              if (room?.monthly_price) {
                setRoomCost(room.monthly_price);
                console.log('💰 Room cost from care plan fallback:', room.monthly_price);
              }
            } else {
              console.log('❌ No room ID found in care plan assignment');
              setRoomNumber('Chưa hoàn tất đăng kí');
            }

            // Load bed information from care plan assignment
            const assignedBedId = carePlanAssignment.assigned_bed_id;
            console.log('🛏️ Bed ID from care plan:', assignedBedId);
            
            const bedIdString = typeof assignedBedId === 'object' && assignedBedId?._id ? assignedBedId._id : assignedBedId;
            if (bedIdString) {
              const bed = await bedsAPI.getById(bedIdString);
              console.log('🛏️ Bed data from care plan:', bed);
              setBedNumber(bed?.bed_number || 'Chưa hoàn tất đăng kí');
            } else {
              console.log('❌ No bed ID found in care plan assignment');
              setBedNumber('Chưa hoàn tất đăng kí');
            }
          } else {
            console.log('❌ No care plan assignment available for fallback');
            setRoomNumber('Chưa hoàn tất đăng kí');
            setBedNumber('Chưa hoàn tất đăng kí');
          }
        }
      } catch (error) {
        console.error('❌ Error loading room/bed info:', error);
        setRoomNumber('Chưa hoàn tất đăng kí');
        setBedNumber('Chưa hoàn tất đăng kí');
      } finally {
        setRoomLoading(false);
        setBedLoading(false);
      }
    };

    loadRoomAndBedInfo();
  }, [residentId, carePlanAssignment]);

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: 'VND'
    }).format(amount);
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
            Đang tải thông tin dịch vụ...
          </p>
        </div>
      </div>
    );
  }

  if (!resident || !carePlanAssignment) {
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
          <ExclamationTriangleIcon style={{
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
            Không tìm thấy thông tin
          </h2>
          <p style={{
            fontSize: '0.875rem',
            color: '#6b7280',
            margin: '0 0 1.5rem 0'
          }}>
            Dịch vụ này có thể đã bị xóa hoặc không tồn tại
          </p>
          <Link
            href={`/admin/residents/${residentId}`}
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
            Quay lại trang resident
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
              href={`/admin/residents/${residentId}`}
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
                  {resident.avatar ? (
                    <img
                      src={getAvatarUrl(resident.avatar)}
                      alt={`Avatar của ${resident.name}`}
                      style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                      onError={(e) => {
                        e.currentTarget.style.display = 'none';
                        const parent = e.currentTarget.parentElement;
                        if (parent) {
                          parent.textContent = resident.name ? resident.name.charAt(0).toUpperCase() : 'U';
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
                          parent.textContent = resident.name ? resident.name.charAt(0).toUpperCase() : 'U';
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
                      <span>{resident.age} tuổi</span>
                    </span>
                    {/* Phòng */}
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
                      <HomeIcon style={{ width: '1rem', height: '1rem' }} />
                      <span>Phòng:</span>
                      <span>{roomLoading ? 'Đang tải...' : roomNumber}</span>
                    </span>
                    {/* Giường */}
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
                  </div>
                </div>
              </div>
            </div>
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
              <DocumentTextIcon style={{ width: '1.5rem', height: '1.5rem', color: 'white' }} />
            </div>
            <div>
              <h2 style={{
                fontSize: '1.5rem',
                fontWeight: 700,
                color: '#1e293b',
                margin: 0
              }}>
                Chi tiết gói dịch vụ
              </h2>
              <p style={{
                fontSize: '1rem',
                color: '#64748b',
                margin: '0.25rem 0 0 0'
              }}>
                Thông tin chi tiết về gói dịch vụ đang sử dụng
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
                            <ClockIcon style={{ width: '1rem', height: '1rem', color: '#16a34a' }} />
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
                            {carePlan.start_date ? formatDate(carePlan.start_date) : 
                             carePlanAssignment.start_date ? formatDate(carePlanAssignment.start_date) : 'N/A'}
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
                            {carePlan.end_date ? formatDate(carePlan.end_date) : 
                             carePlanAssignment.end_date ? formatDate(carePlanAssignment.end_date) : 'Không có thời hạn'}
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
                      Phòng
                    </p>
                    <p style={{
                      fontSize: '1.5rem',
                      fontWeight: 700,
                      color: '#059669',
                      margin: 0
                    }}>
                      {roomLoading ? 'Đang tải...' : roomNumber}
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
                      Giường
                    </p>
                    <p style={{
                      fontSize: '1.5rem',
                      fontWeight: 700,
                      color: '#059669',
                      margin: 0
                    }}>
                      {bedLoading ? 'Đang tải...' : bedNumber}
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