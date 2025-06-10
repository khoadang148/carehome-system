"use client";

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth-context';
import { RESIDENTS_DATA } from '@/lib/residents-data';
import { 
  BuildingLibraryIcon,
  DocumentPlusIcon,
  CalendarDaysIcon,
  XMarkIcon
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

  // Hide header when modals are open
  useEffect(() => {
    if (showServiceModal) {
      document.body.classList.add('hide-header');
    } else {
      document.body.classList.remove('hide-header');
    }

    // Cleanup on unmount
    return () => {
      document.body.classList.remove('hide-header');
    };
  }, [showServiceModal]);

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

          {/* View Registered Package Button */}
          {user?.role === 'family' && (
            <div style={{ marginTop: '2rem' }}>
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
            </div>
          )}
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
            borderRadius: '12px',
            width: '90%',
            maxWidth: '500px',
            maxHeight: '85vh',
            overflowY: 'auto',
            boxShadow: '0 10px 25px rgba(0, 0, 0, 0.15)'
          }}>
            {/* Simple Header */}
            <div className="p-6 border-b border-gray-200 flex justify-between items-center bg-gradient-to-r from-blue-50 to-indigo-50">
              <h3 className="text-xl font-semibold text-gray-900 flex items-center gap-3">
                <div className="w-8 h-8 bg-blue-500 rounded-lg flex items-center justify-center">
                  <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                </div>
                Chi tiết gói dịch vụ đã đăng ký
              </h3>
              <button
                onClick={() => setShowServiceModal(false)}
                className="p-2 hover:bg-gray-100 rounded-full transition-colors duration-200 text-gray-500 hover:text-gray-700"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {/* Multiple residents selector */}
            {(() => {
              const allPackages = getAllRegisteredServicePackages();
              if (allPackages.length > 1) {
                return (
                  <div className="p-6 border-b border-gray-100 bg-gray-50/50">
                    <p className="text-sm font-medium text-gray-700 mb-3 flex items-center gap-2">
                      <svg className="w-4 h-4 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-1H21m0 0l-3 3m3-3l-3-3" />
                      </svg>
                      Chọn người thân:
                    </p>
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

            {/* Package Details */}
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
                  <div className="p-6">
                    {/* User Info */}
                    <div className="flex items-center gap-4 mb-6 p-4 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-2xl border border-blue-100">
                      <div className="w-14 h-14 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-xl flex items-center justify-center text-white text-xl font-bold shadow-lg">
                        {resident.name?.charAt(0) || 'N'}
                      </div>
                      <div className="flex-1">
                        <h4 className="text-lg font-semibold text-gray-900 mb-1">
                          {resident.name}
                        </h4>
                        <p className="text-sm text-gray-600 flex items-center gap-2">
                          <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                          </svg>
                          {resident.age} tuổi • {resident.room}
                        </p>
                      </div>
                      <span className="bg-green-100 text-green-800 px-3 py-1.5 rounded-full text-xs font-medium flex items-center gap-1">
                        <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                        Đang hoạt động
                      </span>
                    </div>

                    {/* Emergency Contact Info */}
                    <div className="mb-6 p-4 bg-gradient-to-r from-red-50 to-pink-50 rounded-2xl border border-red-100">
                      <h5 className="text-sm font-semibold text-gray-900 mb-3 flex items-center gap-2">
                        <div className="w-5 h-5 bg-red-500 rounded-lg flex items-center justify-center">
                          <svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                          </svg>
                        </div>
                        Người liên hệ khẩn cấp
                      </h5>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="bg-white rounded-xl p-3 border border-red-100">
                          <p className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-1 flex items-center gap-1">
                            <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                            </svg>
                            Họ tên
                          </p>
                          <p className="text-sm font-semibold text-gray-900">
                            {resident.emergencyContact || 'Lê Thị Hoa'}
                          </p>
                        </div>
                        <div className="bg-white rounded-xl p-3 border border-red-100">
                          <p className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-1 flex items-center gap-1">
                            <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                            </svg>
                            Số điện thoại
                          </p>
                          <p className="text-sm font-semibold text-gray-900 font-mono bg-gray-50 px-2 py-1 rounded border">
                            {resident.contactPhone || '(028) 1234-5678'}
                          </p>
                        </div>
                      </div>
                      <div className="mt-3 flex items-center gap-2 text-xs text-red-600">
                        <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse"></div>
                        <span>Liên hệ khi có tình huống khẩn cấp</span>
                      </div>
                    </div>

                    {/* Package Info */}
                    <div className="border border-gray-200 rounded-2xl mb-6 overflow-hidden shadow-sm">
                      {/* Package Name & Price */}
                      <div className="bg-gradient-to-r from-gray-50 to-gray-100 p-6 border-b border-gray-200">
                        <div className="flex items-start justify-between">
                          <div>
                            <h4 className="text-xl font-bold text-gray-900 mb-2 flex items-center gap-2">
                              <div className="w-6 h-6 bg-blue-500 rounded-lg flex items-center justify-center">
                                <svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                </svg>
                              </div>
                              {registeredPackage.packageType || 'Gói Cơ Bản'}
                            </h4>
                            <p className="text-3xl font-bold text-blue-600 flex items-baseline gap-2">
                              {formatCurrency(registeredPackage.finalPrice || registeredPackage.price)}
                              <span className="text-sm font-medium text-gray-500">
                                /tháng
                              </span>
                            </p>
                          </div>
                          <div className="bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-xs font-medium">
                            Đã đăng ký
                          </div>
                        </div>
                      </div>

                      {/* Package Details */}
                      <div className="p-6">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                          <div className="bg-gray-50 rounded-xl p-4 border border-gray-100">
                            <p className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-2 flex items-center gap-2">
                              <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                              </svg>
                              Ngày bắt đầu
                            </p>
                            <p className="text-sm font-semibold text-gray-900">
                              {new Date(registeredPackage.startDate || '2024-06-07').toLocaleDateString('vi-VN')}
                            </p>
                          </div>

                          <div className="bg-gray-50 rounded-xl p-4 border border-gray-100">
                            <p className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-2 flex items-center gap-2">
                              <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 20l4-16m2 16l4-16M6 9h14M4 15h14" />
                              </svg>
                              Mã đăng ký
                            </p>
                            <p className="text-sm font-semibold text-gray-900 font-mono bg-white px-2 py-1 rounded border">
                              {registeredPackage.registrationId || 'REG-1717423258-1'}
                            </p>
                          </div>
                        </div>

                        {/* Features */}
                        {registeredPackage.features && registeredPackage.features.length > 0 && (
                          <div className="mb-6">
                            <p className="text-sm font-semibold text-gray-900 mb-4 flex items-center gap-2">
                              <svg className="w-4 h-4 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                              </svg>
                              Dịch vụ bao gồm:
                            </p>
                            <div className="space-y-3">
                              {registeredPackage.features.map((feature: string, index: number) => (
                                <div key={index} className="flex items-start gap-3 p-3 bg-green-50 rounded-lg border border-green-100">
                                  <div className="w-5 h-5 bg-green-500 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                                    <svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                    </svg>
                                  </div>
                                  <span className="text-sm text-gray-700 font-medium">{feature}</span>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}

                        {/* Pricing Details */}
                        {registeredPackage.discount > 0 && (
                          <div className="bg-gradient-to-r from-green-50 to-emerald-50 border border-green-200 rounded-xl p-5">
                            <p className="text-xs font-semibold text-green-700 mb-3 uppercase tracking-wide flex items-center gap-2">
                              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
                              </svg>
                              Khuyến mãi đặc biệt
                            </p>
                            <div className="space-y-3 text-sm">
                              <div className="flex justify-between items-center py-2">
                                <span className="text-gray-600">Giá gốc:</span>
                                <span className="font-medium text-gray-900">{formatCurrency(Number(registeredPackage.price) || 15000000)}</span>
                              </div>
                              <div className="flex justify-between items-center py-2 border-b border-green-200">
                                <span className="text-gray-600">Giảm giá ({registeredPackage.discount}%):</span>
                                <span className="font-medium text-green-600">
                                  -{formatCurrency(Number(registeredPackage.discountAmount) || 0)}
                                </span>
                              </div>
                              <div className="flex justify-between items-center py-2 bg-white rounded-lg px-3 border border-green-100">
                                <span className="font-semibold text-gray-900">Thành tiền:</span>
                                <span className="font-bold text-green-600 text-lg">
                                  {formatCurrency(registeredPackage.finalPrice)}
                                </span>
                              </div>
                            </div>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Close Button */}
                    <div className="px-6 pb-6">
                      <button
                        onClick={() => setShowServiceModal(false)}
                        className="w-full bg-gradient-to-r from-gray-100 to-gray-200 hover:from-gray-200 hover:to-gray-300 text-gray-700 font-medium py-3 px-6 rounded-xl transition-all duration-200 border border-gray-300 hover:border-gray-400 flex items-center justify-center gap-2"
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
    </div>
  );
} 
