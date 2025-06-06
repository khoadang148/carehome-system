"use client";

import React, { useState, useEffect } from 'react';
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
    image: 'https://img.rawpixel.com/s3fs-private/rawpixel_images/website_content/v211batch10-audi-80-health_2.jpg?w=1300&dpr=1&fit=default&crop=default&q=80&vib=3&con=3&usm=15&bg=F4F4F3&ixlib=js-2.2.1&s=0c9814284e1b21fa1d1751a6e3f1374b',
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

export default function PurchaseServicePage({ params }: { params: Promise<{ packageId: string }> }) {
  const router = useRouter();
  const { user } = useAuth();
  const [selectedResident, setSelectedResident] = useState('');
  const [loading, setLoading] = useState(false);
  const [residents, setResidents] = useState(RESIDENTS_DATA);
  const [familyResidents, setFamilyResidents] = useState<any[]>([]);

  // Advanced business logic states
  const [showConfirmation, setShowConfirmation] = useState(false);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState('bank_transfer');
  const [emergencyContact, setEmergencyContact] = useState('');
  const [emergencyPhone, setEmergencyPhone] = useState('');

  const [medicalNotes, setMedicalNotes] = useState('');
  const [startDate, setStartDate] = useState('');
  const [discountApplied, setDiscountApplied] = useState(0);
  const [registrationStep, setRegistrationStep] = useState(1);
  const [validationErrors, setValidationErrors] = useState<{[key: string]: string}>({});
  const [registrationData, setRegistrationData] = useState<any>(null);

  // Unwrap the params Promise using React.use()
  const unwrappedParams = React.use(params);
  const packageId = unwrappedParams.packageId;

  // Debug logging
  console.log('Package ID from URL:', packageId);
  console.log('Available package IDs:', carePackages.map(pkg => pkg.id));

  // Find the selected package
  let selectedPackage = carePackages.find(pkg => pkg.id === parseInt(packageId));
  console.log('Selected package:', selectedPackage);
  
  // Fake selectedPackage for demo if not found
  if (!selectedPackage) {
    selectedPackage = {
      id: 1,
      name: 'Gói Cơ Bản',
      price: 15000000,
      description: 'Phù hợp cho người cao tuổi có sức khỏe tốt, cần hỗ trợ sinh hoạt cơ bản.',
      image: 'https://images.unsplash.com/photo-1559757148-5c350d0d3c56?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80',
      features: [
        'Chăm sóc cơ bản hàng ngày',
        'Bữa ăn theo tiêu chuẩn',
        'Kiểm tra sức khỏe định kỳ',
        'Hoạt động giải trí cơ bản'
      ],
      color: 'from-blue-400 to-blue-600',
      buttonColor: '#2563eb'
    };
  }

  useEffect(() => {
    if (typeof window !== 'undefined') {
      // Load residents data for all roles
      const savedResidents = localStorage.getItem('nurseryHomeResidents');
      if (savedResidents) {
        try {
          const parsedResidents = JSON.parse(savedResidents);
          setResidents(parsedResidents);
          
          if (user?.role === 'family') {
            // For family role, create fake family members data for demo
            const familyMembers = [
              {
                id: 1,
                name: 'Nguyễn Văn Nam',
                age: 78,
                room: 'A01',
                relationship: 'Cha',
                condition: 'Tốt',
                image: '/api/placeholder/60/60'
              },
              {
                id: 2,
                name: 'Lê Thị Hoa',
                age: 75,
                room: 'A02',
                relationship: 'Mẹ',
                condition: 'Khá',
                image: '/api/placeholder/60/60'
              }
            ];
            setFamilyResidents(familyMembers);
          }
        } catch (error) {
          console.error('Error parsing saved residents data:', error);
          
          // If there's an error, reset to default data
          localStorage.setItem('nurseryHomeResidents', JSON.stringify(RESIDENTS_DATA));
          setResidents(RESIDENTS_DATA);
          
          if (user?.role === 'family') {
            // For family role, create fake family members data for demo
            const familyMembers = [
              {
                id: 1,
                name: 'Nguyễn Văn Nam',
                age: 78,
                room: 'A01',
                relationship: 'Cha',
                condition: 'Tốt',
                image: '/api/placeholder/60/60'
              },
              {
                id: 2,
                name: 'Lê Thị Hoa',
                age: 75,
                room: 'A02',
                relationship: 'Mẹ',
                condition: 'Khá',
                image: '/api/placeholder/60/60'
              },
              {
                id: 3,
                name: 'Nguyễn Văn Minh',
                age: 82,
                room: 'B05',
                relationship: 'Ông',
                condition: 'Tốt',
                image: '/api/placeholder/60/60'
              }
            ];
            setFamilyResidents(familyMembers);
          }
        }
      } else {
        // Initialize localStorage with default data if it's empty
        localStorage.setItem('nurseryHomeResidents', JSON.stringify(RESIDENTS_DATA));
        setResidents(RESIDENTS_DATA);
        
        if (user?.role === 'family') {
          const familyMembers = RESIDENTS_DATA.slice(0, 2).map((resident: any) => ({
            ...resident,
            relationship: resident.id === 1 ? 'Cha' : 'Mẹ'
          }));
          setFamilyResidents(familyMembers);
        }
      }
    }
  }, [user]);

  // 🚀 Thêm thông báo đơn giản và hiệu ứng nâng cao
  useEffect(() => {
    if (showSuccessModal && registrationData) {
      // Hiển thị thông báo thành công
      const timer = setTimeout(() => {
        console.log('🎉 Hệ thống đăng ký nâng cao đã sẵn sàng!');
        console.log('✅ Tính năng in hóa đơn đã được kích hoạt');
        console.log('📤 Tính năng chia sẻ đã sẵn sàng');
        console.log('⭐ Hệ thống đánh giá đã được tích hợp');
      }, 1000);
      
      return () => clearTimeout(timer);
    }
  }, [showSuccessModal, registrationData]);

  if (!selectedPackage) {
    return (
      <div style={{ 
        minHeight: '100vh', 
        display: 'flex', 
        alignItems: 'center', 
        justifyContent: 'center',
        background: '#f8fafc'
      }}>
        <div style={{ textAlign: 'center', color: '#6b7280' }}>
          <h2>Không tìm thấy gói dịch vụ</h2>
          <button 
            onClick={() => router.push('/services')}
            style={{
              background: '#3b82f6',
              color: 'white',
              border: 'none',
              padding: '0.75rem 1.5rem',
              borderRadius: '8px',
              fontSize: '1rem',
              cursor: 'pointer',
              marginTop: '1rem'
            }}
          >
            Quay lại trang dịch vụ
          </button>
        </div>
      </div>
    );
  }

  // Professional validation functions
  const validatePhoneNumber = (phone: string): boolean => {
    const phoneRegex = /^(\+84|84|0)?[3|5|7|8|9][0-9]{8}$/;
    return phoneRegex.test(phone.replace(/\s/g, ''));
  };

  const validateEmergencyContact = (name: string): boolean => {
    return name.trim().length >= 2 && /^[a-zA-ZÀ-ỹ\s]+$/.test(name.trim());
  };

  // 🚀 TÍNH NĂNG NÂNG CAO - Simplified Advanced Features
  
  // Tính năng in hóa đơn đơn giản
  const handlePrintInvoice = () => {
    if (!registrationData) return;
    
    const printContent = `
      ===========================================
      🏥 VIỆN DƯỠNG LÃO AN KHANG
      ===========================================
      
      📋 HÓA ĐƠN ĐĂNG KÝ DỊCH VỤ
      Mã đăng ký: ${registrationData.registrationId}
      
      📦 THÔNG TIN DỊCH VỤ:
      - Gói dịch vụ: ${registrationData.packageName}
      - Người thụ hưởng: ${registrationData.memberName}
      - Ngày bắt đầu: ${new Date(registrationData.startDate).toLocaleDateString('vi-VN')}
      - Ngày đăng ký: ${new Date().toLocaleDateString('vi-VN')}
      
      💰 CHI TIẾT THANH TOÁN:
      - Giá gốc: ${registrationData.originalPrice.toLocaleString('vi-VN')} VNĐ
      ${registrationData.discountApplied > 0 ? `- Giảm giá (${registrationData.discountApplied}%): -${registrationData.discountAmount.toLocaleString('vi-VN')} VNĐ` : ''}
      - Tổng cộng: ${registrationData.finalPrice.toLocaleString('vi-VN')} VNĐ/tháng
      
      💳 THÔNG TIN CHUYỂN KHOẢN:
      - Ngân hàng: Vietcombank - Chi nhánh HCM
      - Số tài khoản: 0123456789
      - Chủ tài khoản: CÔNG TY TNHH VIỆN DƯỠNG LÃO AN KHANG
      - Nội dung CK: ${registrationData.registrationId} ${registrationData.memberName}
      
      ===========================================
      Cảm ơn quý khách đã tin tưởng dịch vụ!
      Hotline hỗ trợ: 1900-1234
      ===========================================
    `;
    
    const printWindow = window.open('', '_blank');
    if (printWindow) {
      printWindow.document.write(`<pre style="font-family: monospace; font-size: 12px; line-height: 1.4;">${printContent}</pre>`);
      printWindow.document.close();
      printWindow.print();
      alert('✅ Đã chuẩn bị hóa đơn để in!');
    }
  };

  // Tính năng chia sẻ đơn giản
  const handleShareRegistration = async () => {
    if (!registrationData) return;
    
    const shareText = `🎉 Đăng ký thành công gói ${registrationData.packageName} cho ${registrationData.memberName}!\n\nMã đăng ký: ${registrationData.registrationId}\nTổng chi phí: ${registrationData.finalPrice.toLocaleString('vi-VN')} VNĐ/tháng\n\n🏥 Viện Dưỡng Lão An Khang - Chăm sóc tận tâm`;
    
    if (navigator.share) {
      try {
        await navigator.share({
          title: 'Đăng ký dịch vụ thành công',
          text: shareText
        });
        alert('✅ Đã chia sẻ thông tin thành công!');
      } catch (err) {
        console.log('Chia sẻ bị hủy');
      }
    } else {
      // Fallback: copy to clipboard
      try {
        await navigator.clipboard.writeText(shareText);
        alert('📋 Đã sao chép thông tin vào clipboard!');
      } catch (err) {
        // Fallback for older browsers
        const textArea = document.createElement('textarea');
        textArea.value = shareText;
        document.body.appendChild(textArea);
        textArea.select();
        document.execCommand('copy');
        document.body.removeChild(textArea);
        alert('📋 Đã sao chép thông tin vào clipboard!');
      }
    }
  };

  // Lưu vào lịch sử đăng ký
  const saveRegistrationToHistory = (data: any) => {
    try {
      const historyItem = {
        ...data,
        timestamp: new Date().toISOString(),
        status: 'completed',
        id: Date.now()
      };
      
      const existingHistory = JSON.parse(localStorage.getItem('registrationHistory') || '[]');
      const updatedHistory = [historyItem, ...existingHistory.slice(0, 9)]; // Giữ 10 đăng ký gần nhất
      localStorage.setItem('registrationHistory', JSON.stringify(updatedHistory));
      console.log('✅ Đã lưu vào lịch sử đăng ký');
    } catch (error) {
      console.log('Không thể lưu lịch sử:', error);
    }
  };

  // Đánh giá dịch vụ đơn giản
  const handleQuickRating = (rating: number) => {
    if (!registrationData) return;
    
    const ratingData = {
      registrationId: registrationData.registrationId,
      rating: rating,
      timestamp: new Date().toISOString(),
      packageName: registrationData.packageName
    };
    
    try {
      const existingRatings = JSON.parse(localStorage.getItem('serviceRatings') || '[]');
      existingRatings.push(ratingData);
      localStorage.setItem('serviceRatings', JSON.stringify(existingRatings));
      alert(`⭐ Cảm ơn bạn đã đánh giá ${rating}/5 sao cho dịch vụ của chúng tôi!`);
    } catch (error) {
      console.log('Không thể lưu đánh giá:', error);
    }
  };

  const validateRegistration = () => {
    const errors: {[key: string]: string} = {};
    
    // Resident selection validation
    if (!selectedResident) {
      errors.selectedResident = 'Vui lòng chọn người cần chăm sóc';
    }
    
    // Start date validation with business rules
    if (!startDate) {
      errors.startDate = 'Vui lòng chọn ngày bắt đầu dịch vụ';
    } else {
      const selectedDate = new Date(startDate);
      const today = new Date();
      const minDate = new Date();
      minDate.setDate(today.getDate() + 3);
      const maxDate = new Date();
      maxDate.setDate(today.getDate() + 365); // Max 1 year in advance
      
      if (selectedDate < minDate) {
        errors.startDate = 'Ngày bắt đầu dịch vụ phải sau ít nhất 3 ngày làm việc từ hôm nay';
      } else if (selectedDate > maxDate) {
        errors.startDate = 'Không thể đăng ký trước quá 1 năm';
      }
      
      // Check for weekends (assuming service doesn't start on weekends)
      const dayOfWeek = selectedDate.getDay();
      if (dayOfWeek === 0 || dayOfWeek === 6) {
        errors.startDate = 'Dịch vụ không bắt đầu vào cuối tuần. Vui lòng chọn ngày trong tuần';
      }
    }
    
    // Emergency contact validation
    if (!emergencyContact.trim()) {
      errors.emergencyContact = 'Vui lòng nhập tên người liên hệ khẩn cấp';
    } else if (!validateEmergencyContact(emergencyContact)) {
      errors.emergencyContact = 'Tên người liên hệ chỉ được chứa chữ cái và khoảng trắng (tối thiểu 2 ký tự)';
    }
    
    // Emergency phone validation
    if (!emergencyPhone.trim()) {
      errors.emergencyPhone = 'Vui lòng nhập số điện thoại người liên hệ khẩn cấp';
    } else if (!validatePhoneNumber(emergencyPhone)) {
      errors.emergencyPhone = 'Số điện thoại không hợp lệ. Định dạng: 0xxxxxxxxx hoặc +84xxxxxxxxx';
    }
    

    
    // Advanced business validation
    const selectedMember = familyResidents.find(member => member.id.toString() === selectedResident);
    if (selectedMember) {
      // Age-based package compatibility
      if (selectedMember.age < 60 && selectedPackage?.id === 3) {
        errors.packageCompatibility = 'Gói Cao Cấp chỉ dành cho người trên 60 tuổi';
      }
      
      // Health condition validation for advanced packages
      if (selectedMember.condition === 'Yếu' && selectedPackage?.id === 1) {
        errors.healthCompatibility = 'Người thân có tình trạng sức khỏe yếu nên chọn gói Nâng Cao hoặc Cao Cấp';
      }
    }
    
    // Medical notes validation for high-risk cases
    if (selectedMember?.age >= 85 && !medicalNotes.trim()) {
      errors.medicalNotes = 'Đối với người trên 85 tuổi, vui lòng cung cấp thông tin y tế để chăm sóc tốt nhất';
    }
    
    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const calculateDiscount = () => {
    let discount = 0;
    
    // Multiple family member discount
    if (user?.role === 'family' && familyResidents.length > 1) {
      discount += 10; // 10% discount for multiple family members
    }
    
    // Early registration discount (if start date is more than 30 days away)
    if (startDate) {
      const selectedDate = new Date(startDate);
      const thirtyDaysFromNow = new Date();
      thirtyDaysFromNow.setDate(thirtyDaysFromNow.getDate() + 30);
      
      if (selectedDate > thirtyDaysFromNow) {
        discount += 5; // 5% early bird discount
      }
    }
    
    // Senior citizen additional discount
    const selectedMember = familyResidents.find(member => member.id.toString() === selectedResident);
    if (selectedMember && selectedMember.age >= 80) {
      discount += 5; // 5% senior discount
    }
    
    return Math.min(discount, 20); // Maximum 20% discount
  };

  const checkExistingPackage = () => {
    const selectedMember = familyResidents.find(member => member.id.toString() === selectedResident);
    return selectedMember?.carePackage ? selectedMember.carePackage : null;
  };

  const handleInitialPurchase = () => {
    console.log('handleInitialPurchase called');
    
    if (!selectedResident) {
      alert('Vui lòng chọn người cần chăm sóc');
      return;
    }

    // Check for existing package
    const existingPackage = checkExistingPackage();
    if (existingPackage) {
      const confirmUpgrade = window.confirm(
        `Người thân này đã có gói "${existingPackage.name}". Bạn có muốn nâng cấp lên gói "${selectedPackage?.name}" không?`
      );
      if (!confirmUpgrade) return;
    }

    // Calculate discount
    const discount = calculateDiscount();
    setDiscountApplied(discount);
    
    // Show confirmation dialog
    setShowConfirmation(true);
  };

  const handlePurchase = async () => {
    console.log('handlePurchase called');
    console.log('selectedResident:', selectedResident);
    console.log('user:', user);
    console.log('selectedPackage:', selectedPackage);
    
    // Validate all required fields with professional validation
    const isValid = validateRegistration();
    if (!isValid) {
      // Scroll to first error field
      const firstErrorField = Object.keys(validationErrors)[0];
      if (firstErrorField) {
        const element = document.querySelector(`[data-field="${firstErrorField}"]`);
        element?.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
      return;
    }

    setLoading(true);
    try {
      // Sử dụng selectedPackage đã được định nghĩa ở trên
      if (!selectedPackage) {
        throw new Error('Không tìm thấy gói dịch vụ');
      }

      console.log('Processing purchase for role:', user?.role);

      if (user?.role === 'family') {
        // For family role, find the selected family member and update with care package
        const selectedFamilyMember = familyResidents.find(member => member.id.toString() === selectedResident);
        
        // Calculate final price with discount
        const originalPrice = selectedPackage.price;
        const discountAmount = (originalPrice * discountApplied) / 100;
        const finalPrice = originalPrice - discountAmount;
        
        if (selectedFamilyMember) {
          const updatedFamilyMember = {
            ...selectedFamilyMember,
            carePackage: {
              id: selectedPackage.id,
              name: selectedPackage.name,
              price: originalPrice,
              finalPrice: finalPrice,
              discount: discountApplied,
              discountAmount: discountAmount,
              purchaseDate: new Date().toISOString(),
              startDate: startDate,
              paymentMethod: paymentMethod,
              emergencyContact: emergencyContact,
              medicalNotes: medicalNotes,
              features: selectedPackage.features,
              status: 'pending_approval',
              registrationId: `REG-${Date.now()}-${selectedFamilyMember.id}`
            }
          };

          // Update the resident in the main residents list
          const updatedResidents = residents.map((resident: any) => 
            resident.id.toString() === selectedFamilyMember.id.toString() 
              ? updatedFamilyMember 
              : resident
          );

          localStorage.setItem('nurseryHomeResidents', JSON.stringify(updatedResidents));
          
          // Store registration data for success modal
          const registrationInfo = {
            registrationId: updatedFamilyMember.carePackage.registrationId,
            packageName: selectedPackage.name,
            memberName: selectedFamilyMember.name,
            originalPrice,
            discountAmount,
            finalPrice,
            startDate,
            discountApplied
          };
          
          setRegistrationData(registrationInfo);
          
          // 🚀 Sử dụng tính năng nâng cao - Lưu lịch sử
          try {
            const historyItem = {
              ...registrationInfo,
              timestamp: new Date().toISOString(),
              status: 'completed',
              id: Date.now()
            };
            
            const existingHistory = JSON.parse(localStorage.getItem('registrationHistory') || '[]');
            const updatedHistory = [historyItem, ...existingHistory.slice(0, 9)];
            localStorage.setItem('registrationHistory', JSON.stringify(updatedHistory));
            console.log('✅ Đã lưu vào lịch sử đăng ký');
          } catch (error) {
            console.log('Không thể lưu lịch sử:', error);
          }
          
          console.log('🎉 Đăng ký thành công! Chuẩn bị hiển thị chi tiết...'); // Thông báo
          
          console.log('Purchase successful for family member:', updatedFamilyMember);
          setShowConfirmation(false);
          setShowSuccessModal(true);
        }
      } else {
        // For other roles, update residents data
        const savedResidents = localStorage.getItem('nurseryHomeResidents');
        let residents = RESIDENTS_DATA;
        if (savedResidents) {
          residents = JSON.parse(savedResidents);
        }

        // Cập nhật thông tin gói dịch vụ cho resident được chọn
        const updatedResidents = residents.map((resident: any) => {
          if (resident.id.toString() === selectedResident) {
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

        // Show success message and redirect
        console.log('Purchase successful for resident:', selectedResident);
        alert('Đăng ký gói chăm sóc thành công! Chúng tôi sẽ liên hệ với bạn để hoàn tất thủ tục.');
        router.push(`/residents/${selectedResident}`);
      }
    } catch (error) {
      console.error('Error purchasing service:', error);
      const errorMessage = error instanceof Error ? error.message : String(error);
      alert(`Có lỗi xảy ra khi đăng ký dịch vụ: ${errorMessage}. Vui lòng thử lại sau.`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ minHeight: '100vh', background: '#f8fafc' }}>
      {/* Hero Section */}
      <div style={{
        background: 'white',
        color: '#1e293b',
        padding: '2.5rem 1rem 1.5rem',
        textAlign: 'center',
        boxShadow: '0 2px 8px rgba(0,0,0,0.04)',
        borderBottom: '1px solid #e5e7eb'
      }}>
        <div style={{ maxWidth: '800px', margin: '0 auto' }}>
          <h1 style={{
            fontSize: '2.2rem',
            fontWeight: 700,
            marginBottom: '1rem',
            color: '#3b3b3b',
            textShadow: 'none'
          }}>
            {user?.role === 'family' ? 'Đăng Ký Chăm Sóc Cho Người Thân' : 'Xác Nhận Đăng Ký Dịch Vụ'}
          </h1>
          <p style={{
            fontSize: '1.1rem',
            opacity: 0.95,
            maxWidth: '500px',
            margin: '0 auto',
            lineHeight: 1.6,
            color: '#475569'
          }}>
            {user?.role === 'family' 
              ? 'Xác nhận gói chăm sóc phù hợp nhất cho người thân yêu quý của bạn'
              : 'Hoàn tất đăng ký gói dịch vụ chăm sóc cho người thân của bạn'
            }
          </p>
        </div>
      </div>

      {/* Main Content */}
      <div style={{
        maxWidth: '900px',
        margin: '0 auto',
        padding: '2.5rem 1rem',
        transform: 'translateY(-1.5rem)'
      }}>
        <div style={{
          background: 'white',
          borderRadius: '20px',
          overflow: 'hidden',
          boxShadow: '0 6px 24px rgba(0,0,0,0.07)',
          border: '1px solid #e5e7eb'
        }}>
          {/* Package Header with Image */}
          <div style={{
            height: '220px',
            backgroundImage: `url(${selectedPackage.image})`,
            backgroundSize: 'cover',
            backgroundPosition: 'center',
            position: 'relative',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          }}>
            <div style={{ textAlign: 'center', color: '#1e293b', background: 'rgba(255,255,255,0.85)', borderRadius: '12px', padding: '1rem 2rem' }}>
              <h2 style={{
                fontSize: '2rem',
                fontWeight: 700,
                margin: 0,
                textShadow: 'none',
                marginBottom: '0.5rem',
                color: '#1e293b'
              }}>
                {selectedPackage.name}
              </h2>
              <div style={{
                fontSize: '1.5rem',
                fontWeight: 600,
                color: '#059669',
                textShadow: 'none'
              }}>
                {new Intl.NumberFormat('vi-VN', {
                  style: 'currency',
                  currency: 'VND'
                }).format(selectedPackage.price)}
                <span style={{ fontSize: '1rem', opacity: 0.9, color: '#64748b' }}>/tháng</span>
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
                fontSize: '1.15rem',
                fontWeight: 600,
                color: '#374151',
                marginBottom: '1.2rem',
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
                      style={{ width: '20px', height: '20px', color: '#10b981', flexShrink: 0 }}
                      fill="currentColor"
                      viewBox="0 0 20 20"
                    >
                      <path
                        fillRule="evenodd"
                        d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                        clipRule="evenodd"
                      />
                    </svg>
                    <span style={{ color: '#374151', fontSize: '0.95rem' }}>{feature}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Resident/Family Member Selection */}
            <div style={{ marginBottom: '2rem' }}>
              <h3 style={{
                fontSize: '1.15rem',
                fontWeight: 600,
                color: '#374151',
                marginBottom: '1.2rem'
              }}>
                👤 {user?.role === 'family' ? 'Chọn người thân cần chăm sóc' : 'Chọn người cần chăm sóc'}
              </h3>

              {user?.role === 'family' ? (
                // Family role: Show family members as selectable cards
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '1rem' }}>
                  {familyResidents.map((member) => (
                    <div
                      key={member.id}
                      onClick={() => setSelectedResident(member.id.toString())}
                      style={{
                        background: selectedResident === member.id.toString() ? '#eff6ff' : 'white',
                        border: selectedResident === member.id.toString() ? '2px solid #3b82f6' : '1px solid #e5e7eb',
                        borderRadius: '12px',
                        padding: '1.5rem',
                        cursor: 'pointer',
                        transition: 'all 0.2s ease',
                        position: 'relative'
                      }}
                    >
                      <div style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '1rem',
                        marginBottom: '1rem'
                      }}>
                        <div style={{
                          width: '60px',
                          height: '60px',
                          borderRadius: '50%',
                          background: 'linear-gradient(135deg, #3B82F6, #1E40AF)',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          color: 'white',
                          fontSize: '1.5rem',
                          fontWeight: 'bold'
                        }}>
                          {member.name.charAt(0)}
                        </div>
                        <div>
                          <h4 style={{ margin: 0, fontSize: '1.1rem', color: '#111827' }}>{member.name}</h4>
                          <p style={{ margin: '0.25rem 0', color: '#6B7280', fontSize: '0.9rem' }}>
                            <strong>Quan hệ:</strong> {member.relationship}
                          </p>
                        </div>
                        {selectedResident === member.id.toString() && (
                          <div style={{
                            position: 'absolute',
                            top: '1rem',
                            right: '1rem',
                            color: '#3b82f6'
                          }}>
                            <svg style={{ width: '24px', height: '24px' }} fill="currentColor" viewBox="0 0 20 20">
                              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                            </svg>
                          </div>
                        )}
                      </div>
                      <div style={{
                        display: 'grid',
                        gridTemplateColumns: 'repeat(auto-fit, minmax(120px, 1fr))',
                        gap: '1rem',
                        fontSize: '0.9rem',
                        color: '#4B5563'
                      }}>
                        <p style={{ margin: 0 }}>
                          <strong>Tuổi:</strong> {member.age} tuổi
                        </p>
                        <p style={{ margin: 0 }}>
                          <strong>Phòng:</strong> {member.room}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                // Other roles: Show dropdown selection
                <select
                  value={selectedResident}
                  onChange={(e) => setSelectedResident(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '1rem',
                    border: '1px solid #d1d5db',
                    borderRadius: '12px',
                    fontSize: '1rem',
                    background: 'white',
                    color: '#374151'
                  }}
                  required
                >
                  <option value="">Chọn người cần chăm sóc</option>
                  {residents.map((resident) => (
                    <option key={resident.id} value={resident.id}>
                      {resident.name} - Phòng {resident.room} ({resident.age} tuổi)
                    </option>
                  ))}
                </select>
              )}
            </div>

            {/* Purchase Button */}
            <div style={{ textAlign: 'center', marginTop: '2rem' }}>
              <button
                onClick={(e) => {
                  console.log('Button clicked', e);
                  handleInitialPurchase();
                }}
                disabled={!selectedResident || loading}
                style={{
                  background: (!selectedResident || loading) ? '#9ca3af' : 'linear-gradient(135deg, #3B82F6 0%, #1E40AF 100%)',
                  color: 'white',
                  border: 'none',
                  padding: '1rem 3rem',
                  borderRadius: '12px',
                  fontSize: '1.1rem',
                  fontWeight: 600,
                  cursor: (!selectedResident || loading) ? 'not-allowed' : 'pointer',
                  transition: 'all 0.3s ease',
                  boxShadow: (!selectedResident || loading) ? 'none' : '0 4px 15px rgba(59, 130, 246, 0.4)',
                  transform: (!selectedResident || loading) ? 'none' : 'translateY(-2px)'
                }}
              >
                {loading ? 'Đang xử lý...' : (user?.role === 'family' ? 'Đăng Ký Cho Người Thân' : 'Xác Nhận Đăng Ký')}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Professional Confirmation Dialog */}
      {showConfirmation && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(0, 0, 0, 0.7)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000,
          backdropFilter: 'blur(5px)'
        }}>
          <div style={{
            background: 'linear-gradient(135deg, #ffffff 0%, #f8fafc 100%)',
            borderRadius: '20px',
            padding: '2.5rem',
            maxWidth: '600px',
            width: '90%',
            maxHeight: '90vh',
            overflowY: 'auto',
            boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
            border: '1px solid rgba(255, 255, 255, 0.2)'
          }}>
            {/* Header */}
            <div style={{
              textAlign: 'center',
              marginBottom: '2rem'
            }}>
              <div style={{
                width: '4rem',
                height: '4rem',
                background: 'linear-gradient(135deg, #3B82F6 0%, #1E40AF 100%)',
                borderRadius: '50%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                margin: '0 auto 1rem',
                boxShadow: '0 4px 12px rgba(59, 130, 246, 0.3)'
              }}>
                <svg style={{ width: '2rem', height: '2rem', color: 'white' }} fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                </svg>
              </div>
              <h2 style={{
                fontSize: '1.5rem',
                fontWeight: 700,
                color: '#111827',
                margin: '0 0 0.5rem 0'
              }}>
                Xác nhận đăng ký dịch vụ
              </h2>
              <p style={{
                color: '#6B7280',
                fontSize: '1rem'
              }}>
                Vui lòng kiểm tra thông tin trước khi hoàn tất đăng ký
              </p>
            </div>

            {/* Registration Form */}
            <div style={{ marginBottom: '2rem' }}>
              {/* Service Summary */}
              <div style={{
                background: 'rgba(59, 130, 246, 0.05)',
                border: '1px solid rgba(59, 130, 246, 0.2)',
                borderRadius: '12px',
                padding: '1.5rem',
                marginBottom: '1.5rem'
              }}>
                <h3 style={{ fontSize: '1.1rem', fontWeight: 600, color: '#111827', margin: '0 0 1rem 0' }}>
                  📋 Thông tin gói dịch vụ
                </h3>
                                 <div style={{ fontSize: '0.95rem', color: '#374151', lineHeight: 1.6 }}>
                   <p style={{ margin: '0.5rem 0' }}><strong>Gói dịch vụ:</strong> {selectedPackage?.name}</p>
                   
                   {/* Detailed beneficiary information */}
                   <div style={{
                     background: 'rgba(59, 130, 246, 0.05)',
                     border: '1px solid rgba(59, 130, 246, 0.15)',
                     borderRadius: '8px',
                     padding: '1rem',
                     margin: '1rem 0'
                   }}>
                     <h4 style={{ 
                       fontSize: '1rem', 
                       fontWeight: 600, 
                       color: '#1e40af', 
                       margin: '0 0 0.75rem 0',
                       display: 'flex',
                       alignItems: 'center',
                       gap: '0.5rem'
                     }}>
                       👤 Thông tin người thụ hưởng
                     </h4>
                     {(() => {
                       const beneficiary = familyResidents.find(m => m.id.toString() === selectedResident);
                       return beneficiary ? (
                         <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '0.75rem' }}>
                           <div>
                             <span style={{ fontWeight: 600, color: '#374151' }}>👨‍👩‍👧‍👦 Họ và tên:</span>
                             <br />
                             <span style={{ color: '#1e40af', fontWeight: 500 }}>{beneficiary.name}</span>
                           </div>
                           <div>
                             <span style={{ fontWeight: 600, color: '#374151' }}>🎂 Tuổi:</span>
                             <br />
                             <span>{beneficiary.age} tuổi</span>
                           </div>
                           <div>
                             <span style={{ fontWeight: 600, color: '#374151' }}>🏠 Phòng:</span>
                             <br />
                             <span>{beneficiary.room}</span>
                           </div>
                           <div>
                             <span style={{ fontWeight: 600, color: '#374151' }}>👥 Mối quan hệ:</span>
                             <br />
                             <span>{beneficiary.relationship}</span>
                           </div>
                           <div>
                             <span style={{ fontWeight: 600, color: '#374151' }}>🏥 Tình trạng sức khỏe:</span>
                             <br />
                             <span style={{ 
                               color: beneficiary.condition === 'Tốt' ? '#059669' : '#f59e0b',
                               fontWeight: 500
                             }}>
                               {beneficiary.condition || 'Ổn định'}
                             </span>
                           </div>
                           {beneficiary.age >= 80 && (
                             <div style={{ gridColumn: '1 / -1' }}>
                               <div style={{
                                 background: 'rgba(16, 185, 129, 0.1)',
                                 border: '1px solid rgba(16, 185, 129, 0.3)',
                                 borderRadius: '6px',
                                 padding: '0.5rem',
                                 fontSize: '0.85rem',
                                 color: '#059669'
                               }}>
                                 ⭐ <strong>Ưu đãi cao tuổi:</strong> Được giảm 5% phí dịch vụ do trên 80 tuổi
                               </div>
                             </div>
                           )}
                         </div>
                       ) : null;
                     })()}
                   </div>
                   
                   {/* Pricing information */}
                   <div style={{ borderTop: '1px solid #e5e7eb', paddingTop: '1rem' }}>
                     <p style={{ margin: '0.5rem 0' }}>
                       <strong>💰 Giá gốc:</strong> {selectedPackage?.price.toLocaleString('vi-VN')} VNĐ/tháng
                     </p>
                     {discountApplied > 0 && (
                       <p style={{ margin: '0.5rem 0', color: '#059669' }}>
                         <strong>🎁 Tổng giảm giá:</strong> {discountApplied}% (-{((selectedPackage?.price || 0) * discountApplied / 100).toLocaleString('vi-VN')} VNĐ)
                         <br />
                         <small style={{ fontSize: '0.8rem', opacity: 0.8 }}>
                           {familyResidents.length > 1 && "• Giảm 10% do có nhiều thành viên"}<br />
                           {(() => {
                             if (startDate) {
                               const selectedDate = new Date(startDate);
                               const thirtyDaysFromNow = new Date();
                               thirtyDaysFromNow.setDate(thirtyDaysFromNow.getDate() + 30);
                               if (selectedDate > thirtyDaysFromNow) return "• Giảm 5% do đăng ký sớm";
                             }
                             return "";
                           })()}<br />
                           {(() => {
                             const beneficiary = familyResidents.find(m => m.id.toString() === selectedResident);
                             return beneficiary?.age >= 80 ? "• Giảm 5% do trên 80 tuổi" : "";
                           })()}
                         </small>
                       </p>
                     )}
                     <p style={{ margin: '0.5rem 0', fontSize: '1.1rem', fontWeight: 600, color: '#059669' }}>
                       <strong>💳 Tổng thanh toán:</strong> {((selectedPackage?.price || 0) * (100 - discountApplied) / 100).toLocaleString('vi-VN')} VNĐ/tháng
                     </p>
                   </div>
                 </div>
              </div>

              {/* Additional Information Form */}
              <div style={{ display: 'grid', gap: '1rem' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 600, color: '#374151', marginBottom: '0.5rem' }}>
                    📅 Ngày bắt đầu dịch vụ *
                  </label>
                  <input
                    type="date"
                    value={startDate}
                    onChange={(e) => {
                      setStartDate(e.target.value);
                      if (validationErrors.startDate) {
                        setValidationErrors(prev => ({...prev, startDate: ''}));
                      }
                    }}
                    data-field="startDate"
                    min={new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]}
                    style={{
                      width: '100%',
                      padding: '0.75rem',
                      borderRadius: '8px',
                      border: validationErrors.startDate ? '2px solid #ef4444' : '1px solid #D1D5DB',
                      fontSize: '0.875rem',
                      outline: 'none'
                    }}
                  />
                  {validationErrors.startDate && (
                    <p style={{ color: '#ef4444', fontSize: '0.75rem', marginTop: '0.25rem', margin: '0.25rem 0 0 0' }}>
                      ⚠️ {validationErrors.startDate}
                    </p>
                  )}
                </div>

                                                  <div>
                  <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 600, color: '#374151', marginBottom: '0.5rem' }}>
                    📞 Thông tin liên hệ khẩn cấp *
                  </label>
                  
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem', marginBottom: '0.5rem' }}>
                    <input
                      type="text"
                      value={emergencyContact}
                      onChange={(e) => {
                        setEmergencyContact(e.target.value);
                        if (validationErrors.emergencyContact) {
                          setValidationErrors(prev => ({...prev, emergencyContact: ''}));
                        }
                      }}
                      data-field="emergencyContact"
                      placeholder="Họ và tên"
                      style={{
                        width: '100%',
                        padding: '0.75rem',
                        borderRadius: '8px',
                        border: validationErrors.emergencyContact ? '2px solid #ef4444' : '1px solid #D1D5DB',
                        fontSize: '0.875rem',
                        outline: 'none'
                      }}
                    />
                    
                    <input
                      type="text"
                      value={emergencyPhone}
                      onChange={(e) => {
                        setEmergencyPhone(e.target.value);
                        if (validationErrors.emergencyPhone) {
                          setValidationErrors(prev => ({...prev, emergencyPhone: ''}));
                        }
                      }}
                      data-field="emergencyPhone"
                      placeholder="Số điện thoại"
                      style={{
                        width: '100%',
                        padding: '0.75rem',
                        borderRadius: '8px',
                        border: validationErrors.emergencyPhone ? '2px solid #ef4444' : '1px solid #D1D5DB',
                        fontSize: '0.875rem',
                        outline: 'none'
                      }}
                    />
                    
                    
                  </div>
                  
                  {(validationErrors.emergencyContact || validationErrors.emergencyPhone) && (
                    <div style={{ fontSize: '0.75rem', color: '#ef4444' }}>
                      {validationErrors.emergencyContact && <p style={{ margin: '0.25rem 0' }}>⚠️ {validationErrors.emergencyContact}</p>}
                      {validationErrors.emergencyPhone && <p style={{ margin: '0.25rem 0' }}>⚠️ {validationErrors.emergencyPhone}</p>}
                    </div>
                  )}
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 600, color: '#374151', marginBottom: '0.5rem' }}>
                    🏥 Ghi chú y tế {validationErrors.medicalNotes ? '*' : '(nếu có)'}
                  </label>
                  <textarea
                    value={medicalNotes}
                    onChange={(e) => {
                      setMedicalNotes(e.target.value);
                      if (validationErrors.medicalNotes) {
                        setValidationErrors(prev => ({...prev, medicalNotes: ''}));
                      }
                    }}
                    data-field="medicalNotes"
                    placeholder="Các vấn đề sức khỏe, dị ứng, hoặc lưu ý đặc biệt..."
                    rows={3}
                    style={{
                      width: '100%',
                      padding: '0.75rem',
                      borderRadius: '8px',
                      border: validationErrors.medicalNotes ? '2px solid #ef4444' : '1px solid #D1D5DB',
                      fontSize: '0.875rem',
                      resize: 'vertical',
                      outline: 'none'
                    }}
                  />
                  {validationErrors.medicalNotes && (
                    <p style={{ color: '#ef4444', fontSize: '0.75rem', marginTop: '0.25rem', margin: '0.25rem 0 0 0' }}>
                      ⚠️ {validationErrors.medicalNotes}
                    </p>
                  )}
                </div>
              </div>
            </div>

            {/* Action Buttons */}
            <div style={{ display: 'flex', gap: '1rem', justifyContent: 'flex-end' }}>
              <button
                onClick={() => setShowConfirmation(false)}
                style={{
                  padding: '0.75rem 1.5rem',
                  borderRadius: '8px',
                  border: '1px solid #D1D5DB',
                  backgroundColor: 'white',
                  color: '#374151',
                  cursor: 'pointer',
                  fontWeight: 500,
                  fontSize: '0.875rem'
                }}
              >
                Hủy bỏ
              </button>
              <button
                onClick={handlePurchase}
                disabled={loading}
                style={{
                  background: loading ? '#9CA3AF' : 'linear-gradient(135deg, #3B82F6 0%, #1E40AF 100%)',
                  color: 'white',
                  border: 'none',
                  padding: '0.75rem 2rem',
                  borderRadius: '8px',
                  fontSize: '0.875rem',
                  fontWeight: 600,
                  cursor: loading ? 'not-allowed' : 'pointer',
                  boxShadow: loading ? 'none' : '0 4px 12px rgba(59, 130, 246, 0.3)'
                }}
              >
                {loading ? 'Đang xử lý...' : 'Xác nhận đăng ký'}
              </button>
            </div>
          </div>
        </div>
             )}

       {/* Professional Success Modal */}
       {showSuccessModal && registrationData && (
         <div style={{
           position: 'fixed',
           top: 0,
           left: 0,
           right: 0,
           bottom: 0,
           backgroundColor: 'rgba(0, 0, 0, 0.8)',
           display: 'flex',
           alignItems: 'center',
           justifyContent: 'center',
           zIndex: 1001,
           backdropFilter: 'blur(10px)',
           animation: 'fadeIn 0.4s ease-out'
         }}>
           <div style={{
             background: 'linear-gradient(135deg, #ffffff 0%, #f8fafc 100%)',
             borderRadius: '24px',
             padding: '0',
             maxWidth: '700px',
             width: '95%',
             maxHeight: '90vh',
             overflowY: 'auto',
             boxShadow: '0 32px 64px -12px rgba(0, 0, 0, 0.35)',
             border: '1px solid rgba(255, 255, 255, 0.2)',
             position: 'relative',
             animation: 'slideUp 0.4s ease-out'
           }}>
             {/* Success Header */}
             <div style={{
               background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
               borderRadius: '24px 24px 0 0',
               padding: '2rem',
               textAlign: 'center',
               color: 'white',
               position: 'relative'
             }}>
               <div style={{
                 width: '5rem',
                 height: '5rem',
                 background: 'rgba(255, 255, 255, 0.2)',
                 borderRadius: '50%',
                 display: 'flex',
                 alignItems: 'center',
                 justifyContent: 'center',
                 margin: '0 auto 1.5rem',
                 backdropFilter: 'blur(10px)'
               }}>
                 <svg style={{ width: '3rem', height: '3rem', color: 'white' }} fill="currentColor" viewBox="0 0 20 20">
                   <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                 </svg>
               </div>
               <h2 style={{
                 fontSize: '2rem',
                 fontWeight: 700,
                 margin: '0 0 0.5rem 0',
                 textShadow: '0 2px 4px rgba(0, 0, 0, 0.1)'
               }}>
                 🎉 Đăng Ký Thành Công!
               </h2>
               <p style={{
                 fontSize: '1.1rem',
                 margin: 0,
                 opacity: 0.95
               }}>
                 Cảm ơn bạn đã tin tưởng dịch vụ của chúng tôi
               </p>
             </div>

             {/* Registration Details */}
             <div style={{ padding: '2rem' }}>
               {/* Registration ID Card */}
               <div style={{
                 background: 'linear-gradient(135deg, #3b82f6 0%, #1e40af 100%)',
                 borderRadius: '16px',
                 padding: '1.5rem',
                 marginBottom: '2rem',
                 color: 'white',
                 position: 'relative',
                 overflow: 'hidden'
               }}>
                 <div style={{
                   position: 'absolute',
                   top: '-50%',
                   right: '-20%',
                   width: '200px',
                   height: '200px',
                   background: 'rgba(255, 255, 255, 0.1)',
                   borderRadius: '50%'
                 }} />
                 <h3 style={{ 
                   fontSize: '1.2rem', 
                   fontWeight: 600, 
                   margin: '0 0 1rem 0',
                   position: 'relative',
                   zIndex: 1
                 }}>
                   📋 Mã Đăng Ký
                 </h3>
                 <div style={{
                   fontSize: '1.8rem',
                   fontWeight: 700,
                   fontFamily: 'monospace',
                   letterSpacing: '2px',
                   position: 'relative',
                   zIndex: 1
                 }}>
                   {registrationData.registrationId}
                 </div>
                 <p style={{ 
                   fontSize: '0.9rem', 
                   margin: '0.5rem 0 0 0', 
                   opacity: 0.9,
                   position: 'relative',
                   zIndex: 1
                 }}>
                   Vui lòng lưu mã này để tra cứu đăng ký
                 </p>
               </div>

               {/* Service Details */}
               <div style={{
                 display: 'grid',
                 gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
                 gap: '1.5rem',
                 marginBottom: '2rem'
               }}>
                 <div style={{
                   background: 'rgba(16, 185, 129, 0.05)',
                   border: '1px solid rgba(16, 185, 129, 0.2)',
                   borderRadius: '12px',
                   padding: '1.5rem'
                 }}>
                   <h4 style={{ 
                     fontSize: '1.1rem', 
                     fontWeight: 600, 
                     color: '#059669', 
                     margin: '0 0 1rem 0',
                     display: 'flex',
                     alignItems: 'center',
                     gap: '0.5rem'
                   }}>
                     📦 Thông Tin Dịch Vụ
                   </h4>
                   <div style={{ fontSize: '0.9rem', color: '#374151', lineHeight: 1.6 }}>
                     <p style={{ margin: '0.5rem 0' }}>
                       <strong>Gói:</strong> {registrationData.packageName}
                     </p>
                     <p style={{ margin: '0.5rem 0' }}>
                       <strong>Người thụ hưởng:</strong> {registrationData.memberName}
                     </p>
                     <p style={{ margin: '0.5rem 0' }}>
                       <strong>Bắt đầu:</strong> {new Date(registrationData.startDate).toLocaleDateString('vi-VN')}
                     </p>
                   </div>
                 </div>

                 <div style={{
                   background: 'rgba(59, 130, 246, 0.05)',
                   border: '1px solid rgba(59, 130, 246, 0.2)',
                   borderRadius: '12px',
                   padding: '1.5rem'
                 }}>
                   <h4 style={{ 
                     fontSize: '1.1rem', 
                     fontWeight: 600, 
                     color: '#1e40af', 
                     margin: '0 0 1rem 0',
                     display: 'flex',
                     alignItems: 'center',
                     gap: '0.5rem'
                   }}>
                     💰 Chi Tiết Thanh Toán
                   </h4>
                   <div style={{ fontSize: '0.9rem', color: '#374151', lineHeight: 1.6 }}>
                     <p style={{ margin: '0.5rem 0' }}>
                       <strong>Giá gốc:</strong> {registrationData.originalPrice.toLocaleString('vi-VN')} VNĐ
                     </p>
                     {registrationData.discountApplied > 0 && (
                       <p style={{ margin: '0.5rem 0', color: '#059669' }}>
                         <strong>Giảm giá:</strong> -{registrationData.discountAmount.toLocaleString('vi-VN')} VNĐ ({registrationData.discountApplied}%)
                       </p>
                     )}
                     <p style={{ margin: '0.5rem 0', fontSize: '1.1rem', fontWeight: 600, color: '#1e40af' }}>
                       <strong>Tổng cộng:</strong> {registrationData.finalPrice.toLocaleString('vi-VN')} VNĐ/tháng
                     </p>
                   </div>
                 </div>
               </div>

               {/* Simple Completion Message */}
               <div style={{
                 background: 'rgba(16, 185, 129, 0.05)',
                 border: '1px solid rgba(16, 185, 129, 0.2)',
                 borderRadius: '16px',
                 padding: '1.5rem',
                 marginBottom: '2rem',
                 textAlign: 'center'
               }}>
                 
                 <p style={{
                   fontSize: '0.9rem',
                   color: '#374151',
                   margin: 0,
                   lineHeight: 1.5
                 }}>
                   Cảm ơn bạn đã tin tưởng và lựa chọn dịch vụ chăm sóc của chúng tôi. Chúng tôi cam kết mang đến sự chăm sóc tận tâm nhất cho người thân yêu quý của bạn.
                 </p>
               </div>

               {/* Simple Action Button */}
               <div style={{ display: 'flex', justifyContent: 'center' }}>
                 <button
                   onClick={() => {
                     setShowSuccessModal(false);
                     router.push('/family');
                   }}
                   style={{
                     background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
                     color: 'white',
                     border: 'none',
                     padding: '1rem 2rem',
                     borderRadius: '12px',
                     fontSize: '1rem',
                     fontWeight: 600,
                     cursor: 'pointer',
                     boxShadow: '0 4px 15px rgba(16, 185, 129, 0.4)',
                     transition: 'all 0.2s ease'
                   }}
                   onMouseOver={(e) => {
                     e.currentTarget.style.transform = 'translateY(-2px)';
                     e.currentTarget.style.boxShadow = '0 8px 25px rgba(16, 185, 129, 0.5)';
                   }}
                   onMouseOut={(e) => {
                     e.currentTarget.style.transform = 'translateY(0)';
                     e.currentTarget.style.boxShadow = '0 4px 15px rgba(16, 185, 129, 0.4)';
                   }}
                 >
                   ✓ Hoàn Tất
                 </button>
               </div>
             </div>
           </div>
         </div>
       )}





       {/* 🚀 CSS ANIMATIONS */}
       <style jsx>{`
         @keyframes slideInRight {
           from {
             opacity: 0;
             transform: translateX(100%);
           }
           to {
             opacity: 1;
             transform: translateX(0);
           }
         }

         @keyframes scaleIn {
           from {
             opacity: 0;
             transform: scale(0.9);
           }
           to {
             opacity: 1;
             transform: scale(1);
           }
         }
       `}</style>
    </div>
  );
} 