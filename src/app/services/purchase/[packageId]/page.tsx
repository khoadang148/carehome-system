"use client";

import { useState, useEffect, use } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth-context';
import Link from 'next/link';
import { RESIDENTS_DATA } from '@/lib/residents-data';

// Sử dụng lại dữ liệu gói từ trang services
const carePackages = [
  {
    id: 1,
    name: 'Gói Cơ Bản',
    price: 15000000,
    image: 'https://images.unsplash.com/photo-1559757148-5c350d0d3c56?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80',
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
    image: 'https://images.unsplash.com/photo-1576091160399-112ba8d25d1f?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80',
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

// Mock data cho residents (trong thực tế sẽ lấy từ API)
// Sử dụng shared data thay vì data riêng biệt

export default function PurchaseServicePage({ params }: { params: Promise<{ packageId: string }> }) {
  const router = useRouter();
  const { user } = useAuth();
  const [selectedResident, setSelectedResident] = useState('');
  const [loading, setLoading] = useState(false);
  const [residents, setResidents] = useState(RESIDENTS_DATA);

  // Unwrap the params Promise using React.use()
  const resolvedParams = use(params);
  const packageId = parseInt(resolvedParams.packageId);
  const selectedPackage = carePackages.find(pkg => pkg.id === packageId);

  useEffect(() => {
    if (!user) {
      router.push('/login');
      return;
    }
    
    // Load residents from localStorage or initialize with default data
    const savedResidents = localStorage.getItem('nurseryHomeResidents');
    if (savedResidents) {
      try {
        const parsedResidents = JSON.parse(savedResidents);
        setResidents(parsedResidents);
      } catch (error) {
        console.error('Error parsing saved residents data:', error);
        // If there's an error, reset to default data
        localStorage.setItem('nurseryHomeResidents', JSON.stringify(RESIDENTS_DATA));
        setResidents(RESIDENTS_DATA);
      }
    } else {
      // Initialize localStorage with default data if it's empty
      localStorage.setItem('nurseryHomeResidents', JSON.stringify(RESIDENTS_DATA));
    }
  }, [user, router]);

  if (!selectedPackage) {
    return (
      <div style={{ 
        minHeight: '100vh', 
        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center'
      }}>
        <div style={{
          background: 'white',
          borderRadius: '20px',
          padding: '3rem',
          textAlign: 'center',
          boxShadow: '0 20px 40px rgba(0,0,0,0.1)',
          maxWidth: '500px',
          margin: '0 1rem'
        }}>
          <div style={{
            width: '80px',
            height: '80px',
            background: 'linear-gradient(45deg, #ff6b6b, #feca57)',
            borderRadius: '50%',
            margin: '0 auto 1.5rem',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '2rem'
          }}>
            ⚠️
          </div>
          <h1 style={{ 
            fontSize: '1.5rem', 
            fontWeight: 600, 
            color: '#dc2626',
            marginBottom: '1rem'
          }}>
            Gói dịch vụ không tồn tại
          </h1>
          <p style={{ color: '#6b7280', marginBottom: '2rem' }}>
            Gói dịch vụ bạn đang tìm kiếm không có trong hệ thống
          </p>
          <Link 
            href="/services" 
            style={{
              display: 'inline-block',
              background: 'linear-gradient(45deg, #667eea, #764ba2)',
              color: 'white',
              padding: '0.75rem 2rem',
              borderRadius: '25px',
              textDecoration: 'none',
              fontWeight: 600,
              transition: 'transform 0.3s ease'
            }}
            onMouseEnter={(e) => e.currentTarget.style.transform = 'translateY(-2px)'}
            onMouseLeave={(e) => e.currentTarget.style.transform = 'translateY(0)'}
          >
            ← Quay lại danh sách gói dịch vụ
          </Link>
        </div>
      </div>
    );
  }

  const handlePurchase = async () => {
    if (!selectedResident) {
      alert('Vui lòng chọn người cần chăm sóc');
      return;
    }

    setLoading(true);
    try {
      // Lấy thông tin gói dịch vụ được chọn
      const selectedPackage = carePackages.find(pkg => pkg.id === packageId);
      if (!selectedPackage) {
        throw new Error('Không tìm thấy gói dịch vụ');
      }

      // Lấy danh sách residents từ localStorage
      const savedResidents = localStorage.getItem('nurseryHomeResidents');
      let residents = RESIDENTS_DATA;
      if (savedResidents) {
        residents = JSON.parse(savedResidents);
      }

      // Cập nhật thông tin gói dịch vụ cho resident được chọn
      const updatedResidents = residents.map(resident => {
        if (resident.id === parseInt(selectedResident)) {
          return {
            ...resident,
            carePackage: {
              id: selectedPackage.id,
              name: selectedPackage.name,
              price: selectedPackage.price,
              purchaseDate: new Date().toISOString(),
              features: selectedPackage.features
            }
          };
        }
        return resident;
      });

      // Lưu danh sách residents đã cập nhật vào localStorage
      localStorage.setItem('nurseryHomeResidents', JSON.stringify(updatedResidents));

      // Chuyển hướng đến trang chi tiết của resident
      router.push(`/residents/${selectedResident}`);
    } catch (error) {
      console.error('Error purchasing service:', error);
      alert('Có lỗi xảy ra khi đăng ký dịch vụ. Vui lòng thử lại sau.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ minHeight: '100vh', background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)' }}>
      {/* Hero Section */}
      <div style={{
        background: 'linear-gradient(135deg, rgba(102, 126, 234, 0.9) 0%, rgba(118, 75, 162, 0.9) 100%)',
        color: 'white',
        padding: '3rem 1rem 2rem',
        textAlign: 'center'
      }}>
        <div style={{ maxWidth: '800px', margin: '0 auto' }}>
          <h1 style={{
            fontSize: '3rem',
            fontWeight: 700,
            marginBottom: '1rem',
            textShadow: '2px 2px 4px rgba(0,0,0,0.3)'
          }}>
            Xác Nhận Đăng Ký Dịch Vụ
          </h1>
          <p style={{
            fontSize: '1.125rem',
            opacity: 0.9,
            maxWidth: '500px',
            margin: '0 auto',
            lineHeight: 1.6
          }}>
            Hoàn tất đăng ký gói dịch vụ chăm sóc cho người thân của bạn
          </p>
        </div>
      </div>

      {/* Main Content */}
      <div style={{
        maxWidth: '900px',
        margin: '0 auto',
        padding: '3rem 1rem',
        transform: 'translateY(-2rem)'
      }}>
        <div style={{
          background: 'white',
          borderRadius: '20px',
          overflow: 'hidden',
          boxShadow: '0 20px 40px rgba(0,0,0,0.1)'
        }}>
          {/* Package Header with Image */}
          <div style={{
            height: '250px',
            backgroundImage: `linear-gradient(${selectedPackage.color}), url(${selectedPackage.image})`,
            backgroundBlendMode: 'overlay',
            backgroundSize: 'cover',
            backgroundPosition: 'center',
            position: 'relative',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          }}>
            <div style={{ textAlign: 'center', color: 'white' }}>
              <h2 style={{
                fontSize: '2.5rem',
                fontWeight: 700,
                margin: 0,
                textShadow: '2px 2px 4px rgba(0,0,0,0.5)',
                marginBottom: '0.5rem'
              }}>
                {selectedPackage.name}
              </h2>
              <div style={{
                fontSize: '2rem',
                fontWeight: 600,
                textShadow: '2px 2px 4px rgba(0,0,0,0.5)'
              }}>
                {new Intl.NumberFormat('vi-VN', {
                  style: 'currency',
                  currency: 'VND'
                }).format(selectedPackage.price)}
                <span style={{ fontSize: '1rem', opacity: 0.9 }}>/tháng</span>
              </div>
            </div>
          </div>

          {/* Content */}
          <div style={{ padding: '2rem' }}>
            {/* Description */}
            <div style={{
              background: 'linear-gradient(135deg, #f8fafc 0%, #e2e8f0 100%)',
              padding: '1.5rem',
              borderRadius: '15px',
              marginBottom: '2rem'
            }}>
              <p style={{
                color: '#4b5563',
                fontSize: '1rem',
                lineHeight: 1.6,
                margin: 0,
                textAlign: 'center'
              }}>
                {selectedPackage.description}
              </p>
            </div>

            {/* Features Section */}
            <div style={{ marginBottom: '2rem' }}>
              <h3 style={{
                fontSize: '1.25rem',
                fontWeight: 600,
                color: '#374151',
                marginBottom: '1.5rem',
                textAlign: 'center'
              }}>
                🎯 Dịch vụ bao gồm:
              </h3>
              <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
                gap: '1rem'
              }}>
                {selectedPackage.features.map((feature, index) => (
                  <div key={index} style={{
                    background: 'rgba(16, 185, 129, 0.05)',
                    border: '1px solid rgba(16, 185, 129, 0.2)',
                    borderRadius: '12px',
                    padding: '1rem',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.75rem'
                  }}>
                    <svg
                      style={{
                        width: '20px',
                        height: '20px',
                        color: '#10b981',
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
                      fontWeight: 500
                    }}>
                      {feature}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* Resident Selection */}
            <div style={{
              background: 'linear-gradient(135deg, #fef3c7 0%, #fde68a 100%)',
              padding: '2rem',
              borderRadius: '15px',
              marginBottom: '2rem'
            }}>
              <h3 style={{
                fontSize: '1.125rem',
                fontWeight: 600,
                color: '#92400e',
                marginBottom: '1rem',
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem'
              }}>
                👤 Chọn người cần chăm sóc
              </h3>
              <select
                value={selectedResident}
                onChange={(e) => setSelectedResident(e.target.value)}
                style={{
                  width: '100%',
                  padding: '0.75rem 1rem',
                  border: '2px solid #d97706',
                  borderRadius: '12px',
                  fontSize: '1rem',
                  background: 'white',
                  color: '#374151',
                  outline: 'none',
                  transition: 'border-color 0.3s ease'
                }}
                onFocus={(e) => e.currentTarget.style.borderColor = '#92400e'}
                onBlur={(e) => e.currentTarget.style.borderColor = '#d97706'}
              >
                <option value="">-- Vui lòng chọn người cần chăm sóc --</option>
                {residents.map((resident) => (
                  <option key={resident.id} value={resident.id}>
                    {resident.name} - Phòng {resident.room}
                  </option>
                ))}
              </select>
            </div>

            {/* Action Buttons */}
            <div style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              flexWrap: 'wrap',
              gap: '1rem'
            }}>
              <Link
                href="/services"
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.5rem',
                  color: '#6b7280',
                  textDecoration: 'none',
                  fontWeight: 500,
                  padding: '0.75rem 1.5rem',
                  borderRadius: '12px',
                  transition: 'all 0.3s ease'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = '#f3f4f6';
                  e.currentTarget.style.color = '#374151';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = 'transparent';
                  e.currentTarget.style.color = '#6b7280';
                }}
              >
                <span style={{ fontSize: '1.25rem' }}>←</span>
                Quay lại
              </Link>

              <button
                onClick={handlePurchase}
                disabled={loading || !selectedResident}
                style={{
                  background: !selectedResident || loading 
                    ? '#9ca3af' 
                    : selectedPackage.buttonColor,
                  color: 'white',
                  border: 'none',
                  borderRadius: '12px',
                  padding: '1rem 2rem',
                  fontSize: '1rem',
                  fontWeight: 600,
                  cursor: !selectedResident || loading ? 'not-allowed' : 'pointer',
                  transition: 'all 0.3s ease',
                  boxShadow: !selectedResident || loading 
                    ? 'none' 
                    : `0 4px 15px ${selectedPackage.buttonColor}40`,
                  textTransform: 'uppercase',
                  letterSpacing: '0.5px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.5rem'
                }}
                onMouseEnter={(e) => {
                  if (!loading && selectedResident) {
                    e.currentTarget.style.transform = 'translateY(-2px)';
                    e.currentTarget.style.boxShadow = `0 8px 25px ${selectedPackage.buttonColor}60`;
                  }
                }}
                onMouseLeave={(e) => {
                  if (!loading && selectedResident) {
                    e.currentTarget.style.transform = 'translateY(0)';
                    e.currentTarget.style.boxShadow = `0 4px 15px ${selectedPackage.buttonColor}40`;
                  }
                }}
              >
                {loading ? (
                  <>
                    <div style={{
                      width: '16px',
                      height: '16px',
                      border: '2px solid transparent',
                      borderTop: '2px solid white',
                      borderRadius: '50%',
                      animation: 'spin 1s linear infinite'
                    }} />
                    Đang xử lý...
                  </>
                ) : (
                  <>
                    <span style={{ fontSize: '1.25rem' }}>✓</span>
                    Xác Nhận Đăng Ký
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Loading animation keyframes */}
      <style jsx>{`
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
} 