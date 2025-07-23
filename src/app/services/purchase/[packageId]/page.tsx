"use client";

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/contexts/auth-context';
import Link from 'next/link';
import { RESIDENTS_DATA } from '@/lib/data/residents-data';
import { ArrowLeftIcon } from '@heroicons/react/24/outline';
import { carePlansAPI, residentAPI, roomsAPI, bedsAPI, apiClient, roomTypesAPI } from '@/lib/api';
import Select from 'react-select';
import DatePicker from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';
import { format, parse, parseISO } from 'date-fns';

export default function PurchaseServicePage({ params }: { params: { packageId: string } }) {
  const router = useRouter();
  const { user } = useAuth();
  const [selectedResident, setSelectedResident] = useState('');
  const [loading, setLoading] = useState(false);
  const [residents, setResidents] = useState<any[]>([]);
  const [loadingResidents, setLoadingResidents] = useState(false);
  const [familyResidents, setFamilyResidents] = useState<any[]>([]);

  // Thêm state để lưu gói dịch vụ từ API
  const [selectedPackage, setSelectedPackage] = useState<any>(null);
  const [loadingPackage, setLoadingPackage] = useState(true);
  const [packageError, setPackageError] = useState<string | null>(null);

  // Advanced business logic states
  const [showConfirmation, setShowConfirmation] = useState(false);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [showMainCarePlanModal, setShowMainCarePlanModal] = useState(false);
  const [showDuplicateCarePlanModal, setShowDuplicateCarePlanModal] = useState(false);

  // Check access permissions
  useEffect(() => {
    if (!user) {
      router.push('/login');
      return;
    }
    
    if (!user.role || !['admin', 'staff', 'family'].includes(user.role)) {
      router.push('/');
      return;
    }
  }, [user, router]);

  // Hide header when modals are open
  useEffect(() => {
    if (showConfirmation || showSuccessModal || showMainCarePlanModal) {
      document.body.classList.add('hide-header');
    } else {
      document.body.classList.remove('hide-header');
    }

    // Cleanup on unmount
    return () => {
      document.body.classList.remove('hide-header');
    };
  }, [showConfirmation, showSuccessModal, showMainCarePlanModal]);
  const [paymentMethod, setPaymentMethod] = useState('bank_transfer');
  const [emergencyContact, setEmergencyContact] = useState('');
  const [emergencyPhone, setEmergencyPhone] = useState('');

  const [medicalNotes, setMedicalNotes] = useState('');
  const [startDate, setStartDate] = useState('');
  const [discountApplied, setDiscountApplied] = useState(0);
  const [registrationStep, setRegistrationStep] = useState(1);
  const [validationErrors, setValidationErrors] = useState<{[key: string]: string}>({});
  const [registrationData, setRegistrationData] = useState<any>(null);

  // Thêm state cho stepper UI
  const [step, setStep] = useState(1);
  const steps = [
    'Chọn người thụ hưởng',
    'Chọn gói dịch vụ',
    'Chọn loại phòng',
    'Chọn phòng',
    'Chọn giường',
    'Thông tin bổ sung',
    'Xác nhận',
    'Hoàn tất'
  ];

  // Get packageId from params directly
  const packageId = params.packageId;

  // Fetch gói dịch vụ từ API theo packageId
  useEffect(() => {
    setLoadingPackage(true);
    setPackageError(null);
    
    carePlansAPI.getById(packageId)
      .then((pkg) => {
        setSelectedPackage(pkg);
      })
      .catch((error) => {
        console.error('Error fetching package:', error);
        setPackageError('Không thể tải thông tin gói dịch vụ');
        setSelectedPackage(null);
      })
      .finally(() => {
        setLoadingPackage(false);
      });
  }, [packageId]);

  // Debug logging
  console.log('Package ID from URL:', packageId);
  console.log('Selected package from API:', selectedPackage);

  const [roomNumbers, setRoomNumbers] = useState<{[residentId: string]: string}>({});
  const [roomType, setRoomType] = useState('');
  const [selectedRoomId, setSelectedRoomId] = useState('');
  const [selectedBedId, setSelectedBedId] = useState('');
  const [familyPreferences, setFamilyPreferences] = useState({ preferred_room_gender: '', preferred_floor: '', special_requests: '' });
  const [residentAssignments, setResidentAssignments] = useState<any[]>([]);
  const [endDate, setEndDate] = useState('');
  const [notes, setNotes] = useState('');

  const [rooms, setRooms] = useState<any[]>([]);
  const [beds, setBeds] = useState<any[]>([]);
  const [additionalMedications, setAdditionalMedications] = useState<any[]>([]);
  const [roomTypes, setRoomTypes] = useState<any[]>([]);
  useEffect(() => {
    roomTypesAPI.getAll().then(setRoomTypes);
  }, []);

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

  const [allCarePlans, setAllCarePlans] = useState<any[]>([]);
  useEffect(() => {
    carePlansAPI.getAll().then(setAllCarePlans);
  }, []);

  useEffect(() => {
    if (!selectedResident) return;
    carePlansAPI.getByResidentId(selectedResident).then(setResidentAssignments);
  }, [selectedResident]);

  const hasActiveMainCarePlan = residentAssignments.some(a => {
    const carePlanId = Array.isArray(a.care_plan_ids) && a.care_plan_ids[0]?._id;
    const carePlan = allCarePlans.find(cp => cp._id === carePlanId);
    return (
      (a.status === 'active' || a.status === 'pending' || a.status === 'pending_approval') &&
      carePlan?.category === 'main'
    );
  });
  const isSelectedPackageMain = selectedPackage?.category === 'main';
  const canRegisterMain = !(hasActiveMainCarePlan && isSelectedPackageMain);

  const checkDuplicatePackage = async () => {
    const assignments = await carePlansAPI.getByResidentId(selectedResident);
    return assignments.some(a =>
      a.care_plan_ids.some((cp: any) => cp._id === selectedPackage._id) &&
      (a.status === 'active' || a.status === 'pending' || a.status === 'pending_approval')
    );
  };

  // Khi chọn cư dân, tự động set giới tính phòng
  useEffect(() => {
    const selectedResidentObj = residents.find(r => r.id === selectedResident);
    if (selectedResidentObj?.gender) {
      setFamilyPreferences(prev => ({
        ...prev,
        preferred_room_gender: selectedResidentObj.gender
      }));
    }
  }, [selectedResident, residents]);

  useEffect(() => {
    if (!user) return;
    residentAPI.getAll().then(apiData => {
      const mapped = apiData.map((r: any) => ({
        id: r._id,
        name: r.full_name || '',
        age: r.date_of_birth ? (new Date().getFullYear() - new Date(r.date_of_birth).getFullYear()) : '',
        careLevel: r.care_level || '',
        emergencyContact: r.emergency_contact?.name || '',
        contactPhone: r.emergency_contact?.phone || '',
        avatar: Array.isArray(r.avatar) ? r.avatar[0] : r.avatar || null,
        gender: (r.gender || '').toLowerCase(),
      }));
      setResidents(mapped);
      // Fetch room number for each resident
      mapped.forEach(async (resident: any) => {
        try {
          const assignments = await carePlansAPI.getByResidentId(resident.id);
          const assignment = Array.isArray(assignments) ? assignments.find((a: any) => a.assigned_room_id) : null;
          const roomId = assignment?.assigned_room_id;
          if (roomId) {
            const room = await roomsAPI.getById(roomId);
            setRoomNumbers(prev => ({ ...prev, [resident.id]: room?.room_number || 'Chưa cập nhật' }));
          } else {
            setRoomNumbers(prev => ({ ...prev, [resident.id]: 'Chưa cập nhật' }));
          }
        } catch {
          setRoomNumbers(prev => ({ ...prev, [resident.id]: 'Chưa cập nhật' }));
        }
      });
    });
  }, [user]);

  useEffect(() => {
    roomsAPI.getAll().then(data => setRooms(Array.isArray(data) ? data : []));
  }, []);

  useEffect(() => {
    bedsAPI.getAll().then(data => setBeds(Array.isArray(data) ? data : []));
  }, []);

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

  // Loading state cho gói dịch vụ
  if (loadingPackage) {
    return (
      <div style={{ 
        minHeight: '100vh', 
        display: 'flex', 
        alignItems: 'center', 
        justifyContent: 'center',
        background: '#f8fafc'
      }}>
        <div style={{ textAlign: 'center', color: '#6b7280' }}>
          <h2>Đang tải thông tin gói dịch vụ...</h2>
        </div>
      </div>
    );
  }

  // Error state cho gói dịch vụ
  if (packageError || !selectedPackage) {
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
          <p>{packageError || 'Gói dịch vụ không tồn tại'}</p>
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
      // Age-based package compatibility - sử dụng planName thay vì id
      if (selectedMember.age < 60 && selectedPackage?.planName === 'Gói Cao Cấp') {
        errors.packageCompatibility = 'Gói Cao Cấp chỉ dành cho người trên 60 tuổi';
      }
      
      // Health condition validation for advanced packages
      if (selectedMember.condition === 'Yếu' && selectedPackage?.planName === 'Gói Cơ Bản') {
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

  // Thêm kiểm tra trước khi gửi đăng ký
  const canSubmit = selectedResident && selectedPackage && roomType && selectedRoomId && selectedBedId && startDate;

  

  const handlePurchase = async () => {
    if (!canSubmit) {
      alert('Vui lòng nhập đầy đủ thông tin bắt buộc!');
      return;
    }
    if (await checkDuplicatePackage()) {
      setShowDuplicateCarePlanModal(true);
      return;
    }
    setLoading(true);
    try {
      const carePlansMonthlyCost = selectedPackage?.monthly_price || 0;
      const totalMonthlyCost = carePlansMonthlyCost + roomMonthlyCost;
      const payload: any = {
        care_plan_ids: [selectedPackage._id],
        resident_id: selectedResident,
        consultation_notes: medicalNotes || "",
        selected_room_type: roomType || "",
        assigned_room_id: selectedRoomId || "",
        assigned_bed_id: selectedBedId || "",
        family_preferences: {
          preferred_room_gender: familyPreferences.preferred_room_gender || "",
          preferred_floor: Number(familyPreferences.preferred_floor) || 0,
          special_requests: familyPreferences.special_requests || ""
        },
        total_monthly_cost: totalMonthlyCost,
        room_monthly_cost: roomMonthlyCost,
        care_plans_monthly_cost: carePlansMonthlyCost,
        start_date: startDate || "",
        additional_medications: Array.isArray(additionalMedications) ? additionalMedications : [],
        status: "active",
        notes: notes || ""
      };
      if (endDate) (payload as any).end_date = endDate;
      console.log('Payload gửi lên:', payload);
      const result = await apiClient.post('/care-plan-assignments', payload);
      setShowConfirmation(false);
      setShowSuccessModal(true);
    } catch (error: any) {
      console.error('API error:', error?.response?.data || error);
      alert('Có lỗi xảy ra khi đăng ký dịch vụ. Vui lòng thử lại!');
    } finally {
      setLoading(false);
    }
  };

  function getAge(dateOfBirth: string) {
    if (!dateOfBirth) return '';
    const dob = new Date(dateOfBirth);
    const today = new Date();
    let age = today.getFullYear() - dob.getFullYear();
    const m = today.getMonth() - dob.getMonth();
    if (m < 0 || (m === 0 && today.getDate() < dob.getDate())) {
      age--;
    }
    return age;
  }

  function getResidentOption(resident: any) {
    const room = roomNumbers[resident.id] ? `Phòng ${roomNumbers[resident.id]}` : '';
    const gender = resident.gender === 'male' ? 'Nam' : resident.gender === 'female' ? 'Nữ' : '';
    return {
      value: resident.id,
      label: [resident.name, gender, room].filter(Boolean).join(' - ')
    };
  }

  const selectedRoomObj = rooms.find(r => r._id === selectedRoomId);
  const selectedRoomTypeObj = roomTypes.find(rt => rt.room_type === selectedRoomObj?.room_type);
  const roomMonthlyCost = selectedRoomTypeObj?.monthly_price || 0;
  const roomTypeName = selectedRoomTypeObj?.type_name || selectedRoomObj?.room_type || '';
  const roomGender = selectedRoomObj?.gender || '';
  console.log('roomType', roomType);
  console.log('roomMonthlyCost', roomMonthlyCost);

  

  const selectedResidentObj = residents.find(r => r.id === selectedResident);
  const residentGender = selectedResidentObj?.gender || '';
  const filteredRooms = rooms.filter(r =>
    r.room_type === roomType &&
    (!residentGender || r.gender === residentGender)
  );

  // Thay vì rooms.map ở select loại phòng, chỉ render mỗi loại phòng duy nhất:
  const uniqueRoomTypes = Array.from(new Map(rooms.map(r => [r.room_type, r])).values());
  console.log('rooms', rooms);
  console.log('uniqueRoomTypes', uniqueRoomTypes);

  // Map room_type sang tên tiếng Việt
  const roomTypeNameMap: Record<string, string> = {
    '2_bed': 'Phòng 2 giường',
    '3_bed': 'Phòng 3 giường',
    '4_5_bed': 'Phòng 4-5 giường',
    '6_8_bed': 'Phòng 6-8 giường',
  };

  return (
    <div style={{ minHeight: '100vh', background: '#f8fafc' }}>
      <div style={{ maxWidth: '600px', margin: '2rem auto', background: '#fff', borderRadius: 16, boxShadow: '0 4px 24px rgba(0,0,0,0.07)', padding: 32 }}>
        {/* Stepper header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 32 }}>
          {steps.map((label, idx) => (
            <div key={label} style={{ textAlign: 'center', flex: 1 }}>
              <div style={{
                width: 32, height: 32, borderRadius: '50%',
                background: idx + 1 === step ? '#3b82f6' : '#e5e7eb',
                color: idx + 1 === step ? '#fff' : '#64748b',
                display: 'inline-flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, marginBottom: 4
              }}>{idx + 1}</div>
              <div style={{ fontSize: 12, color: idx + 1 === step ? '#3b82f6' : '#64748b', fontWeight: idx + 1 === step ? 700 : 400 }}>{label}</div>
                  </div>
                ))}
            </div>

            {/* Step 1: Chọn người thụ hưởng */}
            {step === 1 && (
          <div>
            <label style={{ fontWeight: 600 }}>Chọn người thụ hưởng:</label>
                  <Select
                    options={residents.map(getResidentOption)}
                    value={residents.map(getResidentOption).find(opt => opt.value === selectedResident) || null}
              onChange={opt => setSelectedResident(opt?.value || '')}
              placeholder="Chọn người thụ hưởng..."
                    isSearchable
            />
                <div style={{ marginTop: 24, display: 'flex', justifyContent: 'flex-end' }}>
                  <button
                    disabled={!selectedResident}
                    onClick={() => setStep(2)}
                style={{ background: '#3b82f6', color: '#fff', border: 'none', borderRadius: 8, padding: '0.75rem 2rem', fontWeight: 600, cursor: !selectedResident ? 'not-allowed' : 'pointer' }}
              >Tiếp tục</button>
                </div>
              </div>
            )}

        {/* Step 2: Chọn gói dịch vụ */}
        {step === 2 && (
          <div>
            <label style={{ fontWeight: 600 }}>Chọn gói dịch vụ:</label>
            <div style={{ margin: '1rem 0' }}>
              {selectedPackage ? (
                <div style={{ padding: 16, background: '#f1f5f9', borderRadius: 8, marginBottom: 12 }}>
                  <div style={{ fontWeight: 700 }}>{selectedPackage.plan_name}</div>
                  <div style={{ color: '#3b82f6', fontWeight: 600 }}>{new Intl.NumberFormat('vi-VN').format(selectedPackage.monthly_price)} đ/tháng</div>
                  <div style={{ color: '#64748b', fontSize: 13 }}>{selectedPackage.description}</div>
                    </div>
              ) : (
                <div>Đang tải gói dịch vụ...</div>
              )}
                        </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 24 }}>
              <button onClick={() => setStep(1)} style={{ background: '#e5e7eb', color: '#374151', border: 'none', borderRadius: 8, padding: '0.75rem 2rem', fontWeight: 600 }}>Quay lại</button>
              <button onClick={() => setStep(3)} style={{ background: '#3b82f6', color: '#fff', border: 'none', borderRadius: 8, padding: '0.75rem 2rem', fontWeight: 600 }}>Tiếp tục</button>
                        </div>
                        </div>
                           )}

        {/* Step 3: Chọn loại phòng */}
        {step === 3 && (
          <div>
            <label style={{ fontWeight: 600 }}>Chọn loại phòng:</label>
            <select value={roomType} onChange={e => setRoomType(e.target.value)} style={{ width: '100%', padding: 12, borderRadius: 8, border: '1px solid #e5e7eb', marginTop: 8 }}>
              <option value=''>-- Chọn loại phòng --</option>
              {uniqueRoomTypes.map(r => (
                <option key={r._id} value={r.room_type}>{r.type_name || roomTypeNameMap[r.room_type] || r.room_type}</option>
              ))}
            </select>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 24 }}>
              <button onClick={() => setStep(2)} style={{ background: '#e5e7eb', color: '#374151', border: 'none', borderRadius: 8, padding: '0.75rem 2rem', fontWeight: 600 }}>Quay lại</button>
              <button disabled={!roomType} onClick={() => setStep(4)} style={{ background: '#3b82f6', color: '#fff', border: 'none', borderRadius: 8, padding: '0.75rem 2rem', fontWeight: 600, cursor: !roomType ? 'not-allowed' : 'pointer' }}>Tiếp tục</button>
                        </div>
                        </div>
                           )}
                       
        {/* Step 4: Chọn phòng */}
        {step === 4 && (
          <div>
            <label style={{ fontWeight: 600 }}>Chọn phòng:</label>
            {!residentGender ? (
              <div style={{ color: 'red', margin: '12px 0' }}>
                Vui lòng cập nhật giới tính cho người thụ hưởng trước khi chọn phòng!
                    </div>
            ) : (
              <select value={selectedRoomId} onChange={e => setSelectedRoomId(e.target.value)} style={{ width: '100%', padding: 12, borderRadius: 8, border: '1px solid #e5e7eb', marginTop: 8 }}>
                <option value=''>-- Chọn phòng --</option>
                {filteredRooms.length === 0 ? (
                  <option disabled>Không có phòng phù hợp</option>
                ) : (
                  filteredRooms.map(room => (
                    <option key={room._id} value={room._id}>
                      {room.room_number} ({room.type_name || roomTypeNameMap[room.room_type] || room.room_type} - {room.gender === 'male' ? 'Nam' : room.gender === 'female' ? 'Nữ' : 'Khác'})
                    </option>
                  ))
                )}
              </select>
            )}
            <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 24 }}>
              <button onClick={() => setStep(3)} style={{ background: '#e5e7eb', color: '#374151', border: 'none', borderRadius: 8, padding: '0.75rem 2rem', fontWeight: 600 }}>Quay lại</button>
              <button disabled={!residentGender || !selectedRoomId} onClick={() => setStep(5)} style={{ background: '#3b82f6', color: '#fff', border: 'none', borderRadius: 8, padding: '0.75rem 2rem', fontWeight: 600, cursor: !residentGender || !selectedRoomId ? 'not-allowed' : 'pointer' }}>Tiếp tục</button>
                  </div>
                  </div>
                       )}
                       
        {/* Step 5: Chọn giường */}
        {step === 5 && (
                <div>
            <label style={{ fontWeight: 600 }}>Chọn giường:</label>
            <select value={selectedBedId} onChange={e => setSelectedBedId(e.target.value)} style={{ width: '100%', padding: 12, borderRadius: 8, border: '1px solid #e5e7eb', marginTop: 8 }}>
              <option value=''>-- Chọn giường --</option>
              {beds.filter(b => b.room_id === selectedRoomId && b.status === 'available').map(bed => (
                <option key={bed._id} value={bed._id}>{bed.bed_number}</option>
              ))}
            </select>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 24 }}>
              <button onClick={() => setStep(4)} style={{ background: '#e5e7eb', color: '#374151', border: 'none', borderRadius: 8, padding: '0.75rem 2rem', fontWeight: 600 }}>Quay lại</button>
              <button disabled={!selectedBedId} onClick={() => setStep(6)} style={{ background: '#3b82f6', color: '#fff', border: 'none', borderRadius: 8, padding: '0.75rem 2rem', fontWeight: 600, cursor: !selectedBedId ? 'not-allowed' : 'pointer' }}>Tiếp tục</button>
                </div>
              </div>
            )}

        {/* Step 6: Thông tin bổ sung */}
        {step === 6 && (
          <div>
            <label style={{ fontWeight: 600 }}>Ngày bắt đầu dịch vụ:</label>
            <input
              type='text'
              value={startDate ? (() => {
                const [y, m, d] = startDate.split('-');
                return d && m && y ? `${d}/${m}/${y}` : '';
              })() : ''}
              onChange={e => {
                // Accept dd/mm/yyyy and convert to yyyy-mm-dd
                const val = e.target.value;
                const match = val.match(/^(\d{2})\/(\d{2})\/(\d{4})$/);
                if (match) {
                  const [, dd, mm, yyyy] = match;
                  setStartDate(`${yyyy}-${mm}-${dd}`);
                } else if (val === '') {
                  setStartDate('');
                }
              }}
              placeholder="dd/mm/yyyy"
              style={{ width: '100%', padding: 12, borderRadius: 8, border: '1px solid #e5e7eb', marginBottom: 16 }}
              required
              pattern="\\d{2}/\\d{2}/\\d{4}"
              inputMode="numeric"
            />
            <label style={{ fontWeight: 600 }}>Phân loại phòng theo giới tính:</label>
            <input
              type="text"
              value={residentGender === 'male' ? 'Nam' : residentGender === 'female' ? 'Nữ' : ''}
              disabled
              style={{ width: '100%', padding: 12, borderRadius: 8, border: '1px solid #e5e7eb', marginBottom: 16 }}
            />
            <label style={{ fontWeight: 600 }}>Yêu cầu đặc biệt:</label>
            <input type='text' value={familyPreferences.special_requests} onChange={e => setFamilyPreferences({ ...familyPreferences, special_requests: e.target.value })} style={{ width: '100%', padding: 12, borderRadius: 8, border: '1px solid #e5e7eb', marginBottom: 16 }} />
            <label style={{ fontWeight: 600 }}>Ghi chú tư vấn:</label>
            <textarea value={medicalNotes} onChange={e => setMedicalNotes(e.target.value)} style={{ width: '100%', padding: 12, borderRadius: 8, border: '1px solid #e5e7eb', minHeight: 60, marginBottom: 16 }} />
            <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 24 }}>
              <button onClick={() => setStep(5)} style={{ background: '#e5e7eb', color: '#374151', border: 'none', borderRadius: 8, padding: '0.75rem 2rem', fontWeight: 600 }}>Quay lại</button>
              <button onClick={() => setStep(7)} style={{ background: '#3b82f6', color: '#fff', border: 'none', borderRadius: 8, padding: '0.75rem 2rem', fontWeight: 600 }} disabled={!startDate || !familyPreferences.preferred_room_gender}>Tiếp tục</button>
            </div>
          </div>
        )}

        {/* Step 7: Xác nhận */}
        {step === 7 && (
                <div>
            <h3 style={{ fontWeight: 700, fontSize: 20, marginBottom: 16 }}>Xác nhận thông tin đăng ký</h3>
            <div style={{ background: '#f1f5f9', borderRadius: 8, padding: 16, marginBottom: 16 }}>
              <div><b>Người thụ hưởng:</b> {residents.find(r => r.id === selectedResident)?.name}</div>
              <div><b>Gói dịch vụ:</b> {selectedPackage?.plan_name}</div>
              <div><b>Loại phòng:</b> {roomTypeName}</div>
              <div><b>Phân loại phòng theo giới tính:</b> {roomGender === 'male' ? 'Nam' : roomGender === 'female' ? 'Nữ' : ''}</div>
              <div><b>Phòng:</b> {selectedRoomObj?.room_number}</div>
              <div><b>Giường:</b> {beds.find(b => b._id === selectedBedId)?.bed_number}</div>
              <div><b>Yêu cầu đặc biệt:</b> {familyPreferences.special_requests}</div>
              <div><b>Ghi chú tư vấn:</b> {medicalNotes}</div>
              <div><b>Tiền phòng/tháng:</b> {roomMonthlyCost.toLocaleString()} đ</div>
              <div><b>Tiền gói dịch vụ/tháng:</b> {selectedPackage?.monthly_price?.toLocaleString()} đ</div>
              <div><b>Tổng cộng/tháng:</b> {(roomMonthlyCost + (selectedPackage?.monthly_price || 0)).toLocaleString()} đ</div>
                    </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 24 }}>
              <button onClick={() => setStep(6)} style={{ background: '#e5e7eb', color: '#374151', border: 'none', borderRadius: 8, padding: '0.75rem 2rem', fontWeight: 600 }}>Quay lại</button>
                  <button
                    onClick={() => {
                  if (!canRegisterMain) {
                    setShowMainCarePlanModal(true);
                        return;
                      }
                  handlePurchase();
                }}
                style={{ background: '#10b981', color: '#fff', border: 'none', borderRadius: 8, padding: '0.75rem 2rem', fontWeight: 600 }}
                disabled={!canSubmit}
              >Xác nhận & Đăng ký</button>
                </div>
              </div>
            )}

        {/* Step 8: Hoàn tất */}
        {step === 8 && (
          <div style={{ textAlign: 'center', padding: 32 }}>
            <div style={{ fontSize: 48, color: '#10b981', marginBottom: 16 }}>✔</div>
            <h3 style={{ fontWeight: 700, fontSize: 22, marginBottom: 8 }}>Đăng ký thành công!</h3>
            <div style={{ color: '#64748b', marginBottom: 24 }}>Thông tin đăng ký dịch vụ đã được gửi thành công. Chúng tôi sẽ liên hệ lại để xác nhận.</div>
            <button onClick={() => router.push('/services')} style={{ background: '#3b82f6', color: '#fff', border: 'none', borderRadius: 8, padding: '0.75rem 2rem', fontWeight: 600 }}>Về trang dịch vụ</button>
              </div>
            )}
          </div>
      {showSuccessModal && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
    width: '100vw',
    height: '100vh',
    background: 'rgba(0,0,0,0.5)',
    zIndex: 9999,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}>
          <div style={{
      background: 'white',
      borderRadius: 16,
      padding: '2.5rem 2rem',
      boxShadow: '0 8px 32px rgba(0,0,0,0.18)',
      minWidth: 340,
      textAlign: 'center',
             position: 'relative',
    }}>
      <div style={{ fontSize: 48, color: '#10b981', marginBottom: 16 }}>✔</div>
      <h3 style={{ fontWeight: 700, fontSize: 22, marginBottom: 8 }}>Đăng ký thành công!</h3>
      <div style={{ color: '#64748b', marginBottom: 24 }}>Thông tin đăng ký dịch vụ đã được gửi thành công.<br/>Chúng tôi sẽ liên hệ lại để xác nhận.</div>
              <button
                   onClick={() => {
                     setShowSuccessModal(false);
          router.push('/services');
        }}
        style={{ background: '#3b82f6', color: '#fff', border: 'none', borderRadius: 8, padding: '0.75rem 2rem', fontWeight: 600 }}
      >
        Đóng & Về trang dịch vụ
              </button>
          </div>
        </div>
             )}
      {showMainCarePlanModal && (
         <div style={{
           position: 'fixed',
           top: 0,
           left: 0,
    width: '100vw',
    height: '100vh',
    background: 'rgba(0,0,0,0.5)',
    zIndex: 9999,
           display: 'flex',
           alignItems: 'center',
           justifyContent: 'center',
         }}>
           <div style={{
      background: 'white',
      borderRadius: 16,
      padding: '2.5rem 2rem',
      boxShadow: '0 8px 32px rgba(0,0,0,0.18)',
      minWidth: 340,
      textAlign: 'center',
             position: 'relative',
    }}>
      <div style={{ fontSize: 48, color: '#ef4444', marginBottom: 16 }}>!</div>
      <h3 style={{ fontWeight: 700, fontSize: 22, marginBottom: 8 }}>Không thể đăng ký gói dịch vụ</h3>
      <div style={{ color: '#64748b', marginBottom: 24 }}>
        Người cao tuổi này đã đăng ký gói dịch vụ chính.<br/>Vui lòng chọn gói dịch vụ bổ sung hoặc liên hệ quản trị viên để biết thêm chi tiết.
      </div>
      <button
        onClick={() => {
          setShowMainCarePlanModal(false);
          router.push('/services');
        }}
        style={{ background: '#3b82f6', color: '#fff', border: 'none', borderRadius: 8, padding: '0.75rem 2rem', fontWeight: 600 }}
      >Đóng</button>
    </div>
  </div>
)}
{showDuplicateCarePlanModal && (
             <div style={{
    position: 'fixed',
    top: 0,
    left: 0,
    width: '100vw',
    height: '100vh',
    background: 'rgba(0,0,0,0.5)',
    zIndex: 9999,
                 display: 'flex',
                 alignItems: 'center',
                 justifyContent: 'center',
  }}>
               <div style={{
      background: 'white',
      borderRadius: 16,
      padding: '2.5rem 2rem',
      boxShadow: '0 8px 32px rgba(0,0,0,0.18)',
      minWidth: 340,
      textAlign: 'center',
      position: 'relative',
    }}>
      <div style={{ fontSize: 48, color: '#ef4444', marginBottom: 16 }}>!</div>
      <h3 style={{ fontWeight: 700, fontSize: 22, marginBottom: 8 }}>Không thể đăng ký gói dịch vụ</h3>
      <div style={{ color: '#64748b', marginBottom: 24 }}>
        Người cao tuổi này đã đăng ký gói dịch vụ này trước đó và đang sử dụng.<br/>Vui lòng chọn gói dịch vụ khác hoặc liên hệ quản trị viên để biết thêm chi tiết.
                   </div>
                 <button
                   onClick={() => {
          setShowDuplicateCarePlanModal(false);
          router.push('/services');
        }}
        style={{ background: '#3b82f6', color: '#fff', border: 'none', borderRadius: 8, padding: '0.75rem 2rem', fontWeight: 600 }}
      >Đóng</button>
           </div>
         </div>
       )}
    </div>
  );
} 