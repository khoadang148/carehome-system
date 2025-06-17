"use client";

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/contexts/auth-context';
import { RESIDENTS_DATA } from '@/lib/data/residents-data';
import { 
  BuildingLibraryIcon,
  DocumentPlusIcon,
  CalendarDaysIcon,
  XMarkIcon,
  CheckCircleIcon,
  ArrowLeftIcon
} from '@heroicons/react/24/outline';

const carePackages = [
  {
    id: 1,
    name: 'Gói Cơ Bản',
    price: 15000000,
    image: 'https://images.unsplash.com/photo-1559757148-5c350d0d3c56?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80',
    badge: null,
    features: [
      'Chăm sóc cơ bản hàng ngày',
      'Bữa ăn theo tiêu chuẩn',
      'Kiểm tra sức khỏe định kỳ',
      'Hoạt động giải trí cơ bản'
    ],
    description: 'Phù hợp cho người cao tuổi có sức khỏe tốt, cần hỗ trợ sinh hoạt cơ bản.',
    color: 'from-blue-400 to-blue-600',
    buttonColor: '#2563eb'
  },
  {
    id: 2,
    name: 'Gói Nâng Cao',
    price: 25000000,
    image: 'https://img.rawpixel.com/s3fs-private/rawpixel_images/website_content/v211batch10-audi-80-health_2.jpg?w=1300&dpr=1&fit=default&crop=default&q=80&vib=3&con=3&usm=15&bg=F4F4F3&ixlib=js-2.2.1&s=0c9814284e1b21fa1d1751a6e3f1374b',
    badge: 'Phổ biến nhất',
    features: [
      'Tất cả dịch vụ của gói Cơ Bản',
      'Chăm sóc y tế chuyên sâu',
      'Vật lý trị liệu định kỳ',
      'Hoạt động giải trí đa dạng',
      'Chế độ dinh dưỡng cá nhân hóa'
    ],
    description: 'Phù hợp cho người cao tuổi cần được chăm sóc kỹ lưỡng hơn về sức khỏe.',
    color: 'from-emerald-400 to-emerald-600',
    buttonColor: '#10b981'
  },
  {
    id: 3,
    name: 'Gói Cao Cấp',
    price: 35000000,
    image: 'https://images.unsplash.com/photo-1582750433449-648ed127bb54?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80',
    badge: 'Chất lượng cao',
    features: [
      'Tất cả dịch vụ của gói Nâng Cao',
      'Chăm sóc y tế 24/7',
      'Phòng riêng cao cấp',
      'Dịch vụ trị liệu tâm lý',
      'Hoạt động văn hóa, giải trí cao cấp',
      'Đưa đón khám chuyên khoa'
    ],
    description: 'Dành cho người cao tuổi cần được chăm sóc toàn diện với chất lượng cao cấp nhất.',
    color: 'from-purple-400 to-purple-600',
    buttonColor: '#7c3aed'
  }
];

export default function ServicesPage() {
  const router = useRouter();
  const { user } = useAuth();
  
  // Check access permissions
  useEffect(() => {
    if (!user) {
      router.push('/login');
      return;
    }
    
    if (!['admin', 'staff', 'family'].includes(user?.role || '')) {
      router.push('/');
      return;
    }
  }, [user, router]);
  
  const [selectedPackage, setSelectedPackage] = useState<number | null>(null);
  const [showServiceModal, setShowServiceModal] = useState(false);
  const [selectedResidentIndex, setSelectedResidentIndex] = useState(0);
  const [showApprovalModal, setShowApprovalModal] = useState(false);
  const [pendingPackages, setPendingPackages] = useState<any[]>([]);
  
  const loadPendingPackages = () => {
    try {
      const savedResidents = localStorage.getItem('nurseryHomeResidents');
      if (savedResidents) {
        const residents = JSON.parse(savedResidents);
        const pending = residents
          .filter((r: any) => r.carePackage && r.carePackage.status === 'pending_approval')
          .map((r: any) => ({
            ...r.carePackage,
            residentName: r.name,
            residentId: r.id,
            residentAge: r.age,
            residentRoom: r.room
          }));
        setPendingPackages(pending);
      }
    } catch (error) {
      console.error('Error loading pending packages:', error);
    }
  };

  // Load pending packages when component mounts (for admin)
  useEffect(() => {
    if (user?.role === 'admin') {
      loadPendingPackages();
    }
  }, [user]);

  // Handle approve/reject service packages
  const handleApprovePackage = (registrationId: string) => {
    try {
      const savedResidents = localStorage.getItem('nurseryHomeResidents');
      if (savedResidents) {
        const residents = JSON.parse(savedResidents);
        const updatedResidents = residents.map((r: any) => {
          if (r.carePackage && r.carePackage.registrationId === registrationId) {
            return {
              ...r,
              carePackage: {
                ...r.carePackage,
                status: 'active',
                approvedDate: new Date().toISOString(),
                approvedBy: 'Nhân viên quản lý'
              }
            };
          }
          return r;
        });
        
        localStorage.setItem('nurseryHomeResidents', JSON.stringify(updatedResidents));
        loadPendingPackages(); // Reload pending packages
        alert('✅ Đã duyệt gói dịch vụ thành công!');
      }
    } catch (error) {
      console.error('Error approving package:', error);
      alert('❌ Có lỗi xảy ra khi duyệt gói dịch vụ!');
    }
  };

  const handleRejectPackage = (registrationId: string) => {
    const reason = prompt('Nhập lý do từ chối:');
    if (!reason) return;

    try {
      const savedResidents = localStorage.getItem('nurseryHomeResidents');
      if (savedResidents) {
        const residents = JSON.parse(savedResidents);
        const updatedResidents = residents.map((r: any) => {
          if (r.carePackage && r.carePackage.registrationId === registrationId) {
            return {
              ...r,
              carePackage: {
                ...r.carePackage,
                status: 'rejected',
                rejectedDate: new Date().toISOString(),
                rejectedBy: 'Nhân viên quản lý',
                rejectionReason: reason
              }
            };
          }
          return r;
        });
        
        localStorage.setItem('nurseryHomeResidents', JSON.stringify(updatedResidents));
        loadPendingPackages(); // Reload pending packages
        alert('❌ Đã từ chối gói dịch vụ!');
      }
    } catch (error) {
      console.error('Error rejecting package:', error);
      alert('❌ Có lỗi xảy ra khi từ chối gói dịch vụ!');
    }
  };

  // Hide header when modals are open
  useEffect(() => {
    if (showServiceModal || showApprovalModal) {
      document.body.classList.add('hide-header');
      document.body.style.overflow = 'hidden';
    } else {
      document.body.classList.remove('hide-header');
      document.body.style.overflow = 'unset';
    }

    // Cleanup on unmount
    return () => {
      document.body.classList.remove('hide-header');
      document.body.style.overflow = 'unset';
    };
  }, [showServiceModal, showApprovalModal]);

  const handlePackageSelect = (packageId: number) => {
    if (!user) {
      router.push('/login');
      return;
    }
    setSelectedPackage(packageId);
    router.push(`/services/purchase/${packageId}`);
  };

  const handleViewServicePackage = () => {
    setSelectedResidentIndex(0); // Reset to first resident
    setShowServiceModal(true);
  };

  const getAllRegisteredServicePackages = () => {
    try {
      // For family role, use RESIDENTS_DATA as the primary source
      if (user?.role === 'family') {
        // Filter residents with care packages from RESIDENTS_DATA
        const residentsWithPackages = RESIDENTS_DATA.filter((r: any) => r.carePackage);
        return residentsWithPackages.map((resident: any) => ({
          ...resident.carePackage,
          // Add resident info to package data
          residentInfo: {
            name: resident.name,
            age: resident.age,
            room: resident.room,
            admissionDate: resident.admissionDate,
            healthCondition: resident.healthCondition,
            emergencyContact: resident.emergencyContact,
            medicalHistory: resident.medicalHistory,
            medications: resident.medications_detail || resident.medications,
            allergyInfo: resident.allergyInfo,
            specialNeeds: resident.specialNeeds
          }
        }));
      }
      
      // Fallback to localStorage for other roles
      const savedResidents = localStorage.getItem('nurseryHomeResidents');
      if (savedResidents) {
        const residents = JSON.parse(savedResidents);
        const residentsWithPackages = residents.filter((r: any) => r.carePackage);
        return residentsWithPackages.map((resident: any) => ({
          ...resident.carePackage,
          residentInfo: {
            name: resident.name,
            age: resident.age,
            room: resident.room,
            admissionDate: resident.admissionDate,
            healthCondition: resident.healthCondition,
            emergencyContact: resident.emergencyContact,
            medicalHistory: resident.medicalHistory,
            medications: resident.medications,
            allergyInfo: resident.allergyInfo,
            specialNeeds: resident.specialNeeds
          }
        }));
      }
    } catch (error) {
      console.error('Error getting registered service packages:', error);
    }
    return [];
  };

  const getRegisteredServicePackage = () => {
    const allPackages = getAllRegisteredServicePackages();
    return allPackages.length > 0 ? allPackages[selectedResidentIndex] : null;
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: 'VND'
    }).format(amount);
  };

  return (
    <div style={{ minHeight: '100vh', background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)' }}>
      {/* Hero Section */}
      <div style={{ 
        background: 'linear-gradient(135deg, rgba(102, 126, 234, 0.9) 0%, rgba(118, 75, 162, 0.9) 100%)',
        color: 'white',
        padding: '4rem 1rem 2rem',
        textAlign: 'center'
      }}>
        <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
          <h1 style={{ 
            fontSize: '3.5rem', 
            fontWeight: 700, 
            marginBottom: '1rem',
            textShadow: '2px 2px 4px rgba(0,0,0,0.3)'
          }}>
            {user?.role === 'family' ? 'Gói Chăm Sóc Cho Người Thân' : 'Gói Dịch Vụ Chăm Sóc'}
          </h1>
          <p style={{ 
            fontSize: '1.25rem', 
            opacity: 0.9, 
            maxWidth: '700px', 
            margin: '0 auto',
            lineHeight: 1.6,
            marginBottom: '2rem'
          }}>
            {user?.role === 'family' 
              ? 'Lựa chọn gói chăm sóc phù hợp nhất cho người thân yêu của bạn. Chúng tôi cam kết mang lại sự an tâm và chất lượng chăm sóc tốt nhất.'
              : 'Chọn gói dịch vụ phù hợp để mang lại sự chăm sóc tốt nhất cho người thân của bạn'
            }
          </p>

          {/* Action Buttons */}
          <div style={{ marginTop: '2rem', display: 'flex', gap: '1rem', justifyContent: 'center', flexWrap: 'wrap' }}>
            {/* View Registered Package Button for Family */}
            {user?.role === 'family' && (
              <button
                onClick={handleViewServicePackage}
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '0.75rem',
                  padding: '1rem 2rem',
                  background: 'rgba(255, 255, 255, 0.2)',
                  color: 'white',
                  border: '2px solid rgba(255, 255, 255, 0.3)',
                  borderRadius: '50px',
                  fontSize: '1rem',
                  fontWeight: 600,
                  cursor: 'pointer',
                  transition: 'all 0.3s ease',
                  backdropFilter: 'blur(10px)',
                  boxShadow: '0 8px 32px rgba(0, 0, 0, 0.1)',
                  position: 'relative'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = 'rgba(255, 255, 255, 0.25)';
                  e.currentTarget.style.transform = 'translateY(-2px)';
                  e.currentTarget.style.boxShadow = '0 12px 40px rgba(0, 0, 0, 0.15)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = 'rgba(255, 255, 255, 0.2)';
                  e.currentTarget.style.transform = 'translateY(0)';
                  e.currentTarget.style.boxShadow = '0 8px 32px rgba(0, 0, 0, 0.1)';
                }}
              >
                <svg
                  style={{ width: '1.25rem', height: '1.25rem' }}
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
                {(() => {
                  const allPackages = getAllRegisteredServicePackages();
                  const count = allPackages.length;
                  if (count === 0) return 'Chưa có gói dịch vụ';
                  if (count === 1) return 'Gói dịch vụ đã đăng ký';
                  return `Gói dịch vụ đã đăng ký (${count})`;
                })()}
                {(() => {
                  const allPackages = getAllRegisteredServicePackages();
                  const count = allPackages.length;
                  if (count > 1) {
                    return (
                      <span style={{
                        position: 'absolute',
                        top: '-0.5rem',
                        right: '-0.5rem',
                        background: '#f59e0b',
                        color: 'white',
                        borderRadius: '50%',
                        width: '1.5rem',
                        height: '1.5rem',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontSize: '0.75rem',
                        fontWeight: 700,
                        border: '2px solid white'
                      }}>
                        {count}
                      </span>
                    );
                  }
                  return null;
                })()}
              </button>
            )}
            
            {/* Service Package Approval Button for Admin */}
            {user?.role === 'admin' && (
              <button
                onClick={() => setShowApprovalModal(true)}
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '0.75rem',
                  padding: '1rem 2rem',
                  background: pendingPackages.length > 0 
                    ? 'rgba(245, 158, 11, 0.2)' 
                    : 'rgba(107, 114, 128, 0.2)',
                  color: 'white',
                  border: pendingPackages.length > 0 
                    ? '2px solid rgba(245, 158, 11, 0.5)' 
                    : '2px solid rgba(107, 114, 128, 0.3)',
                  borderRadius: '50px',
                  fontSize: '1rem',
                  fontWeight: 600,
                  cursor: 'pointer',
                  transition: 'all 0.3s ease',
                  backdropFilter: 'blur(10px)',
                  boxShadow: '0 8px 32px rgba(0, 0, 0, 0.1)',
                  position: 'relative'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = pendingPackages.length > 0 
                    ? 'rgba(245, 158, 11, 0.3)' 
                    : 'rgba(255, 255, 255, 0.25)';
                  e.currentTarget.style.transform = 'translateY(-2px)';
                  e.currentTarget.style.boxShadow = '0 12px 40px rgba(0, 0, 0, 0.15)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = pendingPackages.length > 0 
                    ? 'rgba(245, 158, 11, 0.2)' 
                    : 'rgba(107, 114, 128, 0.2)';
                  e.currentTarget.style.transform = 'translateY(0)';
                  e.currentTarget.style.boxShadow = '0 8px 32px rgba(0, 0, 0, 0.1)';
                }}
              >
                <svg style={{width: '1.25rem', height: '1.25rem'}} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
                Duyệt gói dịch vụ
                {pendingPackages.length > 0 && (
                  <span style={{
                    position: 'absolute',
                    top: '-0.5rem',
                    right: '-0.5rem',
                    background: '#ef4444',
                    color: 'white',
                    borderRadius: '50%',
                    width: '1.5rem',
                    height: '1.5rem',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '0.75rem',
                    fontWeight: 700,
                    border: '2px solid white'
                  }}>
                    {pendingPackages.length}
                  </span>
                )}
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Packages Section */}
      <div style={{ 
        maxWidth: '1200px', 
        margin: '0 auto', 
        padding: '3rem 1rem',
        transform: 'translateY(-2rem)'
      }}>
        <div style={{ 
          display: 'grid', 
          gridTemplateColumns: 'repeat(auto-fit, minmax(350px, 1fr))', 
          gap: '2rem',
          alignItems: 'stretch'
        }}>
          {carePackages.map((pkg, index) => (
            <div
              key={pkg.id}
              style={{
                background: 'white',
                borderRadius: '20px',
                overflow: 'hidden',
                boxShadow: '0 20px 40px rgba(0,0,0,0.1)',
                transition: 'all 0.3s ease',
                transform: index === 1 ? 'scale(1.05)' : 'scale(1)',
                position: 'relative',
                border: index === 1 ? '3px solid #10b981' : 'none'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = 'translateY(-10px) scale(1.02)';
                e.currentTarget.style.boxShadow = '0 30px 60px rgba(0,0,0,0.15)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = index === 1 ? 'scale(1.05)' : 'scale(1)';
                e.currentTarget.style.boxShadow = '0 20px 40px rgba(0,0,0,0.1)';
              }}
            >
              {/* Badge */}
              {pkg.badge && (
                <div style={{
                  position: 'absolute',
                  top: '1rem',
                  right: '1rem',
                  background: 'linear-gradient(45deg, #ff6b6b, #feca57)',
                  color: 'white',
                  padding: '0.5rem 1rem',
                  borderRadius: '25px',
                  fontSize: '0.75rem',
                  fontWeight: 600,
                  zIndex: 2,
                  boxShadow: '0 4px 15px rgba(255, 107, 107, 0.4)'
                }}>
                  {pkg.badge}
                </div>
              )}

              {/* Image */}
              <div style={{ 
                height: '200px', 
                backgroundImage: `url(${pkg.image})`,
                backgroundSize: 'cover',
                backgroundPosition: 'center',
                position: 'relative'
              }}>
                <div style={{
                  position: 'absolute',
                  bottom: '1rem',
                  left: 0,
                  right: 0,
                  color: 'white',
                  textAlign: 'center'
                }}>
                  <h2 style={{ 
                    fontSize: '1.75rem', 
                    fontWeight: 700, 
                    margin: 0,
                    textShadow: '2px 2px 4px rgba(0,0,0,0.5)'
                  }}>
                    {pkg.name}
                  </h2>
                </div>
              </div>

              {/* Content */}
              <div style={{ padding: '1.5rem' }}>
                {/* Price */}
                <div style={{ textAlign: 'center', marginBottom: '1.5rem' }}>
                  <div style={{ 
                    fontSize: '2.5rem', 
                    fontWeight: 700, 
                    color: pkg.buttonColor,
                    lineHeight: 1.2
                  }}>
                    {new Intl.NumberFormat('vi-VN', {
                      style: 'currency',
                      currency: 'VND'
                    }).format(pkg.price)}
                  </div>
                  <div style={{ 
                    fontSize: '0.875rem', 
                    color: '#6b7280',
                    fontWeight: 500
                  }}>
                    /tháng
                  </div>
                </div>

                {/* Description */}
                <p style={{ 
                  color: '#6b7280', 
                  marginBottom: '1.5rem',
                  lineHeight: 1.6,
                  fontSize: '0.9rem'
                }}>
                  {pkg.description}
                </p>

                {/* Features */}
                <div style={{ marginBottom: '2rem' }}>
                  <h3 style={{ 
                    fontSize: '1rem', 
                    fontWeight: 600, 
                    color: '#374151',
                    marginBottom: '1rem'
                  }}>
                    Dịch vụ bao gồm:
                  </h3>
                  <ul style={{ 
                    listStyle: 'none', 
                    padding: 0, 
                    margin: 0,
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '0.75rem'
                  }}>
                    {pkg.features.map((feature, index) => (
                      <li key={index} style={{ display: 'flex', alignItems: 'flex-start' }}>
                        <svg
                          style={{
                            width: '16px',
                            height: '16px',
                            color: '#10b981',
                            marginRight: '0.75rem',
                            marginTop: '2px',
                            flexShrink: 0
                          }}
                          fill="none"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth="2.5"
                          viewBox="0 0 24 24"
                          stroke="currentColor"
                        >
                          <path d="M5 13l4 4L19 7"></path>
                        </svg>
                        <span style={{ 
                          color: '#4b5563', 
                          fontSize: '0.875rem',
                          lineHeight: 1.5
                        }}>
                          {feature}
                        </span>
                      </li>
                    ))}
                  </ul>
                </div>

                {/* Button */}
                <button
                  onClick={() => handlePackageSelect(pkg.id)}
                  style={{
                    width: '100%',
                    background: pkg.buttonColor,
                    color: 'white',
                    border: 'none',
                    borderRadius: '12px',
                    padding: '1rem',
                    fontSize: '1rem',
                    fontWeight: 600,
                    cursor: 'pointer',
                    transition: 'all 0.3s ease',
                    boxShadow: `0 4px 15px ${pkg.buttonColor}40`,
                    textTransform: 'uppercase',
                    letterSpacing: '0.5px'
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.transform = 'translateY(-2px)';
                    e.currentTarget.style.boxShadow = `0 8px 25px ${pkg.buttonColor}60`;
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.transform = 'translateY(0)';
                    e.currentTarget.style.boxShadow = `0 4px 15px ${pkg.buttonColor}40`;
                  }}
                >
                  {user?.role === 'family' ? 'Đăng Ký Cho Người Thân' : 'Chọn Gói Này'}
                </button>
              </div>
            </div>
          ))}
        </div>

        {/* Additional Info Section */}
        <div style={{
          marginTop: '4rem',
          textAlign: 'center',
          padding: '2rem',
          background: 'rgba(255, 255, 255, 0.9)',
          borderRadius: '20px',
          backdropFilter: 'blur(10px)'
        }}>
          <h3 style={{ 
            fontSize: '1.5rem', 
            fontWeight: 600, 
            color: '#374151',
            marginBottom: '1rem'
          }}>
            Tại sao chọn chúng tôi?
          </h3>
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
            gap: '2rem',
            marginTop: '2rem'
          }}>
            <div style={{ textAlign: 'center' }}>
              <div style={{
                width: '60px',
                height: '60px',
                background: 'linear-gradient(45deg, #667eea, #764ba2)',
                borderRadius: '50%',
                margin: '0 auto 1rem',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: 'white',
                fontSize: '1.5rem'
              }}>
                ⭐
              </div>
              <h4 style={{ fontWeight: 600, marginBottom: '0.5rem', color: '#374151' }}>Chất lượng cao</h4>
              <p style={{ color: '#6b7280', fontSize: '0.875rem' }}>
                Đội ngũ chuyên gia giàu kinh nghiệm
              </p>
            </div>
            <div style={{ textAlign: 'center' }}>
              <div style={{
                width: '60px',
                height: '60px',
                background: 'linear-gradient(45deg, #667eea, #764ba2)',
                borderRadius: '50%',
                margin: '0 auto 1rem',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: 'white',
                fontSize: '1.5rem'
              }}>
                🏥
              </div>
              <h4 style={{ fontWeight: 600, marginBottom: '0.5rem', color: '#374151' }}>Cơ sở hiện đại</h4>
              <p style={{ color: '#6b7280', fontSize: '0.875rem' }}>
                Trang thiết bị y tế tiên tiến
              </p>
            </div>
            <div style={{ textAlign: 'center' }}>
              <div style={{
                width: '60px',
                height: '60px',
                background: 'linear-gradient(45deg, #667eea, #764ba2)',
                borderRadius: '50%',
                margin: '0 auto 1rem',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: 'white',
                fontSize: '1.5rem'
              }}>
                💝
              </div>
              <h4 style={{ fontWeight: 600, marginBottom: '0.5rem', color: '#374151' }}>Chăm sóc tận tâm</h4>
              <p style={{ color: '#6b7280', fontSize: '0.875rem' }}>
                Sự quan tâm chu đáo 24/7
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Service Package Modal */}
      {showServiceModal && (
        <div style={{
          position: 'fixed',
          inset: 0,
          backgroundColor: 'rgba(0, 0, 0, 0.5)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 50
        }}>
          <div style={{
            backgroundColor: 'white',
            borderRadius: '16px',
            width: '95%',
            maxWidth: '540px',
            maxHeight: '90vh',
            boxShadow: '0 10px 32px rgba(0, 0, 0, 0.18)',
            border: '1.5px solid #e0e7ef',
            padding: 0,
            overflowY: 'auto'
          }}>
            {/* Header */}
            <div className="p-6 border-b border-gray-200 flex justify-between items-center bg-gradient-to-r from-blue-50 to-indigo-50 rounded-t-2xl">
              <h3 className="text-xl font-bold text-gray-900 flex items-center gap-3">
                <div className="w-8 h-8 bg-blue-500 rounded-lg flex items-center justify-center">
                  <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                </div>
                Chi tiết gói dịch vụ đã đăng ký
              </h3>
            
            </div>

            {/* Selector nếu có nhiều người thân */}
            {(() => {
              const allPackages = getAllRegisteredServicePackages();
              if (allPackages.length > 1) {
                return (
                  <div className="p-6 border-b border-gray-100 bg-gray-50/50">
                    <label className="block text-sm font-semibold text-gray-700 mb-2 flex items-center gap-2">
                      <svg className="w-4 h-4 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-1H21m0 0l-3 3m3-3l-3-3" />
                      </svg>
                      Chọn người thân:
                    </label>
                    <div className="flex gap-3 flex-wrap">
                      {allPackages.map((pkg: any, index: number) => (
                        <button
                          key={index}
                          onClick={() => setSelectedResidentIndex(index)}
                          className={`px-4 py-2.5 rounded-xl border-2 font-medium text-sm transition-all duration-200 transform hover:scale-105 ${
                            selectedResidentIndex === index 
                              ? 'border-blue-500 bg-blue-50 text-blue-700 shadow-md' 
                              : 'border-gray-200 bg-white text-gray-600 hover:border-gray-300 hover:bg-gray-50'
                          }`}
                        >
                          {pkg.residentInfo?.name || `Gói ${index + 1}`}
                        </button>
                      ))}
                    </div>
                  </div>
                );
              }
              return null;
            })()}

            {/* Nội dung chi tiết */}
            {(() => {
              const registeredPackage = getRegisteredServicePackage();
              if (!registeredPackage) {
                return (
                  <div className="py-16 px-8 text-center">
                    <div className="mb-6">
                      <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                        <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                        </svg>
                      </div>
                      <h3 className="text-lg font-semibold text-gray-900 mb-2">Chưa có gói dịch vụ</h3>
                      <p className="text-gray-500 max-w-md mx-auto">
                        Hiện tại chưa có gói dịch vụ nào được đăng ký. Vui lòng liên hệ để đăng ký gói dịch vụ phù hợp.
                      </p>
                    </div>
                    <button
                      onClick={() => setShowServiceModal(false)}
                      className="bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white font-medium py-3 px-8 rounded-xl transition-all duration-200 shadow-lg hover:shadow-xl transform hover:scale-105"
                    >
                      Đóng
                    </button>
                  </div>
                );
              }

              if (registeredPackage?.residentInfo) {
                const resident = registeredPackage.residentInfo;
                return (
                  <div className="p-6 space-y-7">
                    {/* Thông tin người thân */}
                    <div className="border border-blue-100 rounded-2xl p-5 bg-gradient-to-r from-blue-50 to-indigo-50">
                      <div className="text-base font-semibold text-gray-700 mb-4 flex items-center gap-2">
                        <svg className="w-5 h-5 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                        </svg>
                        Thông tin người thân
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <div className="text-xs text-gray-500 font-medium mb-1">Họ tên</div>
                          <div className="text-sm font-semibold text-gray-900">{resident.name || 'Chưa cập nhật'}</div>
                        </div>
                        <div>
                          <div className="text-xs text-gray-500 font-medium mb-1">Tuổi</div>
                          <div className="text-sm font-semibold text-gray-900">{resident.age ? `${resident.age} tuổi` : 'Chưa cập nhật'}</div>
                        </div>
                        <div>
                          <div className="text-xs text-gray-500 font-medium mb-1">Phòng</div>
                          <div className="text-sm font-semibold text-gray-900">{resident.room || 'Chưa cập nhật'}</div>
                        </div>
                        <div>
                        </div>
                      </div>
                    </div>

                    {/* Thông tin liên hệ khẩn cấp */}
                    <div className="border border-red-100 rounded-2xl p-5 bg-gradient-to-r from-red-50 to-pink-50">
                      <div className="text-base font-semibold text-gray-700 mb-4 flex items-center gap-2">
                        <svg className="w-5 h-5 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                        </svg>
                        Người liên hệ khẩn cấp
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <div className="text-xs text-gray-500 font-medium mb-1">Họ tên</div>
                          <div className="text-sm font-semibold text-gray-900">{resident.emergencyContact || 'Chưa cập nhật'}</div>
                        </div>
                        <div>
                          <div className="text-xs text-gray-500 font-medium mb-1">Số điện thoại</div>
                          <div className="text-sm font-semibold text-gray-900 font-mono bg-gray-50 px-2 py-1 rounded border">
                            {resident.contactPhone || 'Chưa cập nhật'}
                          </div>
                        </div>
                      </div>
                      <div className="mt-3 flex items-center gap-2 text-xs text-red-600">
                        <span className="w-2 h-2 bg-red-500 rounded-full animate-pulse"></span>
                        <span>Liên hệ khi có tình huống khẩn cấp</span>
                      </div>
                    </div>

                    {/* Thông tin gói dịch vụ */}
                    <div className="border border-gray-200 rounded-2xl p-5 bg-gradient-to-r from-gray-50 to-gray-100">
                      <div className="text-base font-semibold text-gray-700 mb-4 flex items-center gap-2">
                        <svg className="w-5 h-5 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                        </svg>
                        Thông tin gói dịch vụ
                      </div>
                      <div className="grid grid-cols-2 gap-4 mb-4">
                        <div>
                          <div className="text-xs text-gray-500 font-medium mb-1">Tên gói</div>
                          <div className="text-sm font-semibold text-blue-700">{registeredPackage.packageType || 'Chưa cập nhật'}</div>
                        </div>
                        <div>
                          <div className="text-xs text-gray-500 font-medium mb-1">Giá</div>
                          <div className="text-sm font-semibold text-blue-700">{formatCurrency(registeredPackage.finalPrice || registeredPackage.price)}</div>
                        </div>
                        <div>
                          <div className="text-xs text-gray-500 font-medium mb-1">Ngày bắt đầu</div>
                          <div className="text-sm font-semibold text-gray-900">{registeredPackage.startDate ? new Date(registeredPackage.startDate).toLocaleDateString('vi-VN') : 'Chưa cập nhật'}</div>
                        </div>
                       
                      </div>
                      {/* Dịch vụ bao gồm */}
                      <div className="mb-4">
                        <div className="text-xs text-gray-500 font-medium mb-1">Dịch vụ bao gồm</div>
                        <ul className="list-disc pl-5 text-sm text-gray-800 space-y-1">
                          {registeredPackage.features?.map((f: string, i: number) => <li key={i}>{f}</li>)}
                        </ul>
                      </div>
                      {/* Khuyến mãi */}
                      {registeredPackage.discount > 0 && (
                        <div className="bg-gradient-to-r from-green-50 to-emerald-50 border border-green-200 rounded-xl p-4 mt-2">
                          <div className="text-xs font-semibold text-green-700 mb-2 uppercase tracking-wide flex items-center gap-2">
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
                            </svg>
                            Khuyến mãi đặc biệt
                          </div>
                          <div className="space-y-2 text-sm">
                            <div className="flex justify-between items-center">
                              <span className="text-gray-600">Giá gốc:</span>
                              <span className="font-medium text-gray-900">{formatCurrency(Number(registeredPackage.price) || 15000000)}</span>
                            </div>
                            <div className="flex justify-between items-center border-b border-green-200 pb-1">
                              <span className="text-gray-600">Giảm giá ({registeredPackage.discount}%):</span>
                              <span className="font-medium text-green-600">-{formatCurrency(Number(registeredPackage.discountAmount) || 0)}</span>
                            </div>
                            <div className="flex justify-between items-center bg-white rounded-lg px-3 border border-green-100 mt-1">
                              <span className="font-semibold text-gray-900">Thành tiền:</span>
                              <span className="font-bold text-green-600 text-lg">{formatCurrency(registeredPackage.finalPrice)}</span>
                            </div>
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Button đóng */}
                    <div>
                      <button
                        onClick={() => setShowServiceModal(false)}
                        className="w-full bg-gradient-to-r from-gray-100 to-gray-200 hover:from-gray-200 hover:to-gray-300 text-gray-700 font-medium py-3 px-6 rounded-xl transition-all duration-200 border border-gray-300 hover:border-gray-400 flex items-center justify-center gap-2 mt-2"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                        Đóng
                      </button>
                    </div>
                  </div>
                );
              }
              return null;
            })()}
          </div>
        </div>
      )}

      {/* Service Package Approval Modal */}
      {showApprovalModal && (
        <div className="modal-backdrop" style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(0, 0, 0, 0.5)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000,
          backdropFilter: 'blur(5px)'
        }}>
          <div className="modal-container" style={{
            background: 'linear-gradient(135deg, #ffffff 0%, #f8fafc 100%)',
            borderRadius: '1rem',
            maxWidth: '90vw',
            maxHeight: '90vh',
            width: '800px',
            boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
            border: '1px solid rgba(255, 255, 255, 0.2)',
            overflow: 'hidden',
            position: 'relative'
          }}>
            {/* Header */}
            <div style={{
              background: 'linear-gradient(135deg, #fef3c7 0%, #fbbf24 100%)',
              borderTopLeftRadius: '1rem',
              borderTopRightRadius: '1rem',
              padding: '2rem 2.5rem 1.25rem 2.5rem',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              borderBottom: '1px solid #fde68a',
            }}>
              <div>
                <h3 style={{ fontSize: '1.5rem', fontWeight: 700, color: '#92400e', margin: 0 }}>
                  🔍 Duyệt gói dịch vụ chờ phê duyệt
                </h3>
                <p style={{ fontSize: '0.95rem', color: '#b45309', margin: 0, fontWeight: 500 }}>
                  Có {pendingPackages.length} gói dịch vụ đang chờ duyệt
                </p>
              </div>
              <button
                onClick={() => setShowApprovalModal(false)}
                style={{
                  border: 'none',
                  background: 'none',
                  borderRadius: '50%',
                  width: '2.5rem',
                  height: '2.5rem',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  cursor: 'pointer',
                  color: '#92400e',
                  fontSize: '1.5rem',
                  position: 'absolute',
                  top: '1.25rem',
                  right: '1.25rem',
                  zIndex: 2,
                  transition: 'background-color 0.15s'
                }}
                onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'rgba(254, 243, 199, 0.8)'}
                onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
                aria-label="Đóng"
              >
                <XMarkIcon style={{ width: '1.5rem', height: '1.5rem' }} />
              </button>
            </div>
            
            {/* Content */}
            <div style={{ padding: '2rem 2.5rem', maxHeight: 'calc(90vh - 200px)', overflowY: 'auto' }}>
              {pendingPackages.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '3rem 1rem', color: '#6b7280' }}>
                  <svg style={{ width: '4rem', height: '4rem', margin: '0 auto 1rem', color: '#d1d5db' }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                  <h4 style={{ fontSize: '1.125rem', fontWeight: 600, margin: '0 0 0.5rem 0', color: '#374151' }}>
                    Không có gói dịch vụ nào chờ duyệt
                  </h4>
                  <p style={{ margin: 0, fontSize: '0.95rem' }}>
                    Tất cả các gói dịch vụ đã được xử lý
                  </p>
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                  {pendingPackages.map((pkg, index) => (
                    <div key={pkg.registrationId} style={{ 
                      background: 'white',
                      borderRadius: '1rem',
                      boxShadow: '0 2px 8px rgba(0,0,0,0.05)', 
                      padding: '2rem 1.5rem',
                      border: '1px solid #e5e7eb'
                    }}>
                      {/* Tiêu đề gói dịch vụ */}
                      <div style={{
                        display: 'flex',
                        flexWrap: 'wrap',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        marginBottom: '1.5rem'
                      }}>
                        <div>
                          <h2 style={{
                            fontSize: '1.35rem',
                            fontWeight: 700,
                            color: '#0f172a',
                            margin: 0,
                            letterSpacing: '-0.01em'
                          }}>
                            {pkg.name}
                          </h2>
                          <div style={{
                            display: 'grid',
                            gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
                            gap: '0.5rem',
                            fontSize: '1rem',
                            color: '#334155',
                            marginTop: 8
                          }}>
                            <div><strong>Người thụ hưởng:</strong> {pkg.residentName}</div>
                            <div><strong>Tuổi:</strong> {pkg.residentAge} tuổi</div>
                            <div><strong>Phòng:</strong> {pkg.residentRoom}</div>
                            <div><strong>Mã đăng ký:</strong> <span style={{ fontFamily: 'monospace', fontWeight: 600 }}>{pkg.registrationId}</span></div>
                          </div>
                        </div>
                        <div style={{
                          background: '#fef3c7',
                          border: '1px solid #fbbf24',
                          borderRadius: '1rem',
                          padding: '0.5rem 1.25rem',
                          fontSize: '0.95rem',
                          fontWeight: 600,
                          color: '#92400e',
                          marginLeft: 16,
                          minWidth: 120,
                          textAlign: 'center'
                        }}>
                          CHỜ DUYỆT
                        </div>
                      </div>
                      
                      {/* Thông tin thanh toán & thời gian */}
                      <div style={{
                        display: 'grid',
                        gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
                        gap: '1.5rem',
                        marginBottom: '1.5rem'
                      }}>
                        <div style={{
                          background: '#f0fdf4',
                          border: '1px solid #bbf7d0',
                          borderRadius: '0.75rem',
                          padding: '1.25rem',
                          boxShadow: '0 2px 8px rgba(16,185,129,0.06)'
                        }}>
                          <div style={{ fontWeight: 600, color: '#059669', marginBottom: 8 }}>Thông tin thanh toán</div>
                          <div style={{ color: '#334155', fontSize: '1rem', lineHeight: 1.6 }}>
                            <div>Giá gốc: <span style={{ fontWeight: 500 }}>{formatCurrency(pkg.price)}</span></div>
                            {pkg.discount > 0 && (
                              <div style={{ color: '#059669' }}>Giảm giá: -{formatCurrency(pkg.discountAmount)} ({pkg.discount}%)</div>
                            )}
                            <div style={{ fontWeight: 700, color: '#059669', fontSize: '1.1rem' }}>
                              Thành tiền: {formatCurrency(pkg.finalPrice)}/tháng
                            </div>
                          </div>
                        </div>
                        <div style={{
                          background: '#eff6ff',
                          border: '1px solid #bfdbfe',
                          borderRadius: '0.75rem',
                          padding: '1.25rem',
                          boxShadow: '0 2px 8px rgba(59,130,246,0.06)'
                        }}>
                          <div style={{ fontWeight: 600, color: '#1d4ed8', marginBottom: 8 }}>Thông tin thời gian</div>
                          <div style={{ color: '#334155', fontSize: '1rem', lineHeight: 1.6 }}>
                            <div>Ngày đăng ký: <strong>{new Date(pkg.purchaseDate).toLocaleDateString('vi-VN')}</strong></div>
                            {pkg.startDate && (
                              <div>Ngày bắt đầu: <strong>{new Date(pkg.startDate).toLocaleDateString('vi-VN')}</strong></div>
                            )}
                            <div>Phương thức: <strong>{pkg.paymentMethod === 'bank_transfer' ? 'Chuyển khoản' : 'Tiền mặt'}</strong></div>
                          </div>
                        </div>
                      </div>
                      
                      {/* Ghi chú y tế */}
                      {pkg.medicalNotes && (
                        <div style={{
                          background: '#fefce8',
                          border: '1px solid #fde047',
                          borderRadius: '0.75rem',
                          padding: '1.25rem',
                          marginTop: '1rem',
                          color: '#a16207',
                          fontSize: '1rem'
                        }}>
                          <div style={{ fontWeight: 600, marginBottom: 6 }}>Ghi chú y tế</div>
                          <div style={{ color: '#374151', fontWeight: 400 }}>{pkg.medicalNotes}</div>
                        </div>
                      )}
                      
                      {/* Action Buttons */}
                      <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'flex-end', paddingTop: '1.5rem', borderTop: '1px solid #e5e7eb', marginTop: '2rem' }}>
                        <button
                          onClick={() => handleRejectPackage(pkg.registrationId)}
                          style={{
                            minWidth: 120,
                            display: 'flex',
                            alignItems: 'center',
                            gap: 8,
                            padding: '0.625rem 1.25rem',
                            borderRadius: '0.5rem',
                            border: '1px solid #ef4444',
                            backgroundColor: 'white',
                            color: '#ef4444',
                            cursor: 'pointer',
                            fontWeight: 500,
                            fontSize: '0.875rem',
                            transition: 'all 0.2s ease'
                          }}
                          onMouseOver={(e) => {
                            e.currentTarget.style.backgroundColor = '#fef2f2';
                            e.currentTarget.style.borderColor = '#dc2626';
                          }}
                          onMouseOut={(e) => {
                            e.currentTarget.style.backgroundColor = 'white';
                            e.currentTarget.style.borderColor = '#ef4444';
                          }}
                        >
                          <XMarkIcon style={{ width: '1.1em', height: '1.1em', color: '#ef4444' }} />
                          Từ chối
                        </button>
                        <button
                          onClick={() => handleApprovePackage(pkg.registrationId)}
                          style={{
                            minWidth: 120,
                            display: 'flex',
                            alignItems: 'center',
                            gap: 8,
                            padding: '0.625rem 1.25rem',
                            borderRadius: '0.5rem',
                            border: 'none',
                            background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
                            color: 'white',
                            cursor: 'pointer',
                            fontWeight: 500,
                            fontSize: '0.875rem',
                            transition: 'all 0.2s ease',
                            boxShadow: '0 2px 4px rgba(16, 185, 129, 0.3)'
                          }}
                          onMouseOver={(e) => {
                            e.currentTarget.style.transform = 'translateY(-1px)';
                            e.currentTarget.style.boxShadow = '0 4px 8px rgba(16, 185, 129, 0.4)';
                          }}
                          onMouseOut={(e) => {
                            e.currentTarget.style.transform = 'translateY(0)';
                            e.currentTarget.style.boxShadow = '0 2px 4px rgba(16, 185, 129, 0.3)';
                          }}
                        >
                          <CheckCircleIcon style={{ width: '1.1em', height: '1.1em', color: 'white' }} />
                          Duyệt
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
            
            {/* Footer */}
            <div style={{ 
              padding: '1.25rem 2.5rem', 
              background: '#f9fafb', 
              borderRadius: '0 0 1rem 1rem', 
              borderTop: '1px solid #e5e7eb', 
              display: 'flex', 
              justifyContent: 'flex-end' 
            }}>
              <button
                onClick={() => {
                  setShowApprovalModal(false);
                  loadPendingPackages(); // Refresh data when closing
                }}
                style={{
                  padding: '0.625rem 1.25rem',
                  borderRadius: '0.5rem',
                  border: '1px solid #d1d5db',
                  backgroundColor: 'white',
                  color: '#374151',
                  cursor: 'pointer',
                  fontWeight: 500,
                  transition: 'all 0.2s ease'
                }}
                onMouseOver={(e) => {
                  e.currentTarget.style.backgroundColor = '#f9fafb';
                }}
                onMouseOut={(e) => {
                  e.currentTarget.style.backgroundColor = 'white';
                }}
              >
                Đóng
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
} 
