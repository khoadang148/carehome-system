"use client";

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/contexts/auth-context';
import Link from 'next/link';
import { ArrowLeftIcon } from '@heroicons/react/24/outline';
import { carePlansAPI, residentAPI, roomsAPI, bedsAPI, apiClient, roomTypesAPI } from '@/lib/api';
import Select from 'react-select';
import DatePicker from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';
import { format, parse, parseISO } from 'date-fns';
import ConfirmModal from '@/components/shared/ConfirmModal';
import { clientStorage } from '@/lib/utils/clientStorage';

export default function PurchaseServicePage({ params }: { params: Promise<{ packageId: string }> }) {
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
  
  // Confirm modal state
  const [confirmModal, setConfirmModal] = useState({
    isOpen: false,
    title: '',
    message: '',
    type: 'confirm' as 'confirm' | 'success' | 'error',
    onConfirm: () => {},
    onCancel: () => {}
  });

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

  // Get packageId from params using React.use()
  const packageId = React.use(params).packageId;

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
  const [allAssignments, setAllAssignments] = useState<any[]>([]);
  const [endDate, setEndDate] = useState('');
  const [notes, setNotes] = useState('');

  const [rooms, setRooms] = useState<any[]>([]);
  const [beds, setBeds] = useState<any[]>([]);
  const [additionalMedications, setAdditionalMedications] = useState<any[]>([]);
  const [roomTypes, setRoomTypes] = useState<any[]>([]);
  const [loadingRooms, setLoadingRooms] = useState(false);
  const [loadingBeds, setLoadingBeds] = useState(false);
  const [loadingRoomTypes, setLoadingRoomTypes] = useState(false);
  const [loadingAssignments, setLoadingAssignments] = useState(false);
  const [residentPackageStatus, setResidentPackageStatus] = useState<{[key: string]: boolean}>({});
  useEffect(() => {
    setLoadingRoomTypes(true);
    roomTypesAPI.getAll().then(setRoomTypes).catch(error => {
      console.error('Error loading room types:', error);
      setRoomTypes([]);
    }).finally(() => {
      setLoadingRoomTypes(false);
    });
  }, []);

  

  const [allCarePlans, setAllCarePlans] = useState<any[]>([]);
  useEffect(() => {
    carePlansAPI.getAll().then(setAllCarePlans);
  }, []);

  useEffect(() => {
    if (!selectedResident) return;
    carePlansAPI.getByResidentId(selectedResident).then(setResidentAssignments);
  }, [selectedResident]);

  // Kiểm tra từng cư dân có gói chính hay không
  useEffect(() => {
    const checkResidentPackages = async () => {
      if (selectedPackage?.category !== 'main' || residents.length === 0) return;
      
      setLoadingAssignments(true);
      const statusMap: {[key: string]: boolean} = {};
      
      try {
        // Kiểm tra từng cư dân
        for (const resident of residents) {
          try {
            const response = await apiClient.get(`/care-plan-assignments/by-resident/${resident.id}`);
            const assignments = response.data || [];
            
            // Kiểm tra xem cư dân có gói chính active không
            console.log(`🔍 Checking resident ${resident.name} (${resident.id}):`, assignments);
            
            // Kiểm tra dựa trên assigned_room_id - nếu có phòng thì đã đăng ký gói chính
            const hasActiveAssignment = assignments.some((a: any) => 
              a.status === 'active' && 
              (a.bed_id?.room_id || a.assigned_room_id) &&
              a.packages && a.packages.length > 0
            );
            
            console.log(`  Has room assignment: ${hasActiveAssignment}`);
            
            // Nếu có phòng thì chắc chắn đã đăng ký gói chính
            if (hasActiveAssignment) {
              statusMap[resident.id] = true;
              console.log(`✅ Resident ${resident.name} has main package (has room assignment)`);
              continue;
            }
            
            const hasMainPackage = assignments.some((a: any) => {
              console.log(`  Assignment:`, a);
              console.log(`  Care plan IDs:`, a.care_plan_ids);
              
              let hasMain = false;
              
              // Kiểm tra nếu care_plan_ids là array của objects
              if (Array.isArray(a.care_plan_ids) && a.care_plan_ids.length > 0 && typeof a.care_plan_ids[0] === 'object') {
                hasMain = a.care_plan_ids.some((cp: any) => {
                  console.log(`    Care plan object:`, cp);
                  console.log(`    Category:`, cp.category);
                  return cp.category === 'main';
                });
              }
              // Kiểm tra nếu care_plan_ids là array của strings (IDs)
              else if (Array.isArray(a.care_plan_ids) && a.care_plan_ids.length > 0) {
                console.log(`    Care plan IDs (strings):`, a.care_plan_ids);
                // Nếu là strings, cần kiểm tra thông qua care_plans array
                if (a.care_plans && Array.isArray(a.care_plans)) {
                  hasMain = a.care_plans.some((cp: any) => {
                    console.log(`    Care plan from care_plans:`, cp);
                    return cp.category === 'main';
                  });
                } else {
                  // Nếu không có care_plans, thử gọi API để lấy thông tin
                  console.log(`    No care_plans array, will check via API calls`);
                }
              }
              
              const validStatus = (a.status === 'active' || a.status === 'pending' || a.status === 'pending_approval');
              console.log(`  Status: ${a.status}, Valid: ${validStatus}`);
              console.log(`  Has main package: ${hasMain && validStatus}`);
              
              return hasMain && validStatus;
            });
            
            statusMap[resident.id] = hasMainPackage;
            console.log(`🔍 Resident ${resident.name}: ${hasMainPackage ? 'Has main package' : 'No main package'}`);
          } catch (error) {
            console.error(`Error checking resident ${resident.id}:`, error);
            statusMap[resident.id] = false; // Mặc định là false nếu có lỗi
          }
        }
        
        setResidentPackageStatus(statusMap);
        console.log('📋 Resident package status:', statusMap);
      } catch (error) {
        console.error('Error checking resident packages:', error);
      } finally {
        setLoadingAssignments(false);
      }
    };
    
    checkResidentPackages();
  }, [residents, selectedPackage?.category]);

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
    try {
    const assignments = await carePlansAPI.getByResidentId(selectedResident);
      return assignments.some((a: any) =>
      a.care_plan_ids.some((cp: any) => cp._id === selectedPackage._id) &&
      (a.status === 'active' || a.status === 'pending' || a.status === 'pending_approval')
    );
    } catch (error) {
      console.error('Error checking duplicate package:', error);
      return false;
    }
  };

  // Khi chọn cư dân, tự động set giới tính phòng và kiểm tra phòng hiện tại
  useEffect(() => {
    const selectedResidentObj = residents.find(r => r.id === selectedResident);
    if (selectedResidentObj?.gender) {
      setFamilyPreferences(prev => ({
        ...prev,
        preferred_room_gender: selectedResidentObj.gender
      }));
    }
    
    // Kiểm tra xem resident đã có phòng chưa
    if (selectedResident && roomNumbers[selectedResident] && roomNumbers[selectedResident] !== 'Chưa hoàn tất đăng kí') {
      console.log(`✅ Resident ${selectedResidentObj?.name} đã có phòng: ${roomNumbers[selectedResident]}`);
    }
  }, [selectedResident, residents, roomNumbers]);

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
          const assignment = Array.isArray(assignments) ? assignments.find((a: any) => a.bed_id?.room_id || a.assigned_room_id) : null;
          const roomId = assignment?.bed_id?.room_id || assignment?.assigned_room_id;
          // Đảm bảo roomId là string, không phải object
          const roomIdString = typeof roomId === 'object' && roomId?._id ? roomId._id : roomId;
          if (roomIdString) {
            const room = await roomsAPI.getById(roomIdString);
            setRoomNumbers(prev => ({ ...prev, [resident.id]: room?.room_number || 'Chưa hoàn tất đăng kí' }));
          } else {
            setRoomNumbers(prev => ({ ...prev, [resident.id]: 'Chưa hoàn tất đăng kí' }));
          }
        } catch {
          setRoomNumbers(prev => ({ ...prev, [resident.id]: 'Chưa hoàn tất đăng kí' }));
        }
      });
    });
  }, [user]);

  // Lọc cư dân dựa trên loại gói dịch vụ
  const getFilteredResidents = () => {
    console.log('🔍 Filtering residents for package:', selectedPackage?.category);
    console.log('📊 Total residents:', residents.length);
    console.log('🔄 Loading assignments:', loadingAssignments);
    console.log('📋 Resident package status:', residentPackageStatus);
    
    // Nếu đang tải assignments, hiển thị tất cả cư dân
    if (loadingAssignments) {
      console.log('⏳ Still loading assignments, showing all residents');
      return residents;
    }
    
    if (selectedPackage?.category === 'main') {
      // Nếu là gói chính, lọc ra những cư dân chưa có gói chính
      const filteredResidents = residents.filter(resident => {
        const hasMainPackage = residentPackageStatus[resident.id] || false;
        
        if (hasMainPackage) {
          console.log(`❌ Resident ${resident.name} has main package, filtering out`);
        }
        
        return !hasMainPackage;
      });
      
      console.log('✅ Filtered residents for main package:', filteredResidents.length);
      return filteredResidents;
    }
    
    // Nếu là gói bổ sung, hiển thị tất cả cư dân
    console.log('✅ Showing all residents for supplementary package');
    return residents;
  };

  useEffect(() => {
    setLoadingRooms(true);
    roomsAPI.getAll().then(data => {
      setRooms(Array.isArray(data) ? data : []);
    }).catch(error => {
      console.error('Error loading rooms:', error);
      setRooms([]);
    }).finally(() => {
      setLoadingRooms(false);
    });
  }, []);

  useEffect(() => {
    setLoadingBeds(true);
    bedsAPI.getAll().then(data => {
      setBeds(Array.isArray(data) ? data : []);
    }).catch(error => {
      console.error('Error loading beds:', error);
      setBeds([]);
    }).finally(() => {
      setLoadingBeds(false);
    });
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
      
      const existingHistory = JSON.parse(clientStorage.getItem('registrationHistory') || '[]');
      const updatedHistory = [historyItem, ...existingHistory.slice(0, 9)]; // Giữ 10 đăng ký gần nhất
      clientStorage.setItem('registrationHistory', JSON.stringify(updatedHistory));
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
      const existingRatings = JSON.parse(clientStorage.getItem('serviceRatings') || '[]');
      existingRatings.push(ratingData);
      clientStorage.setItem('serviceRatings', JSON.stringify(existingRatings));
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
    
    // Start date validation - allow any future date including today
    if (!startDate) {
      errors.startDate = 'Vui lòng chọn ngày bắt đầu dịch vụ';
    } else {
      const selectedDate = new Date(startDate);
      selectedDate.setHours(0, 0, 0, 0); // Reset time to start of day
      const today = new Date();
      today.setHours(0, 0, 0, 0); // Reset time to start of day
      
      if (selectedDate < today) {
        errors.startDate = 'Ngày bắt đầu dịch vụ không được là ngày trong quá khứ';
      }
    }
    
    // End date validation (optional but must be after start date if provided)
    if (endDate) {
      const endDateObj = new Date(endDate);
      const startDateObj = startDate ? new Date(startDate) : null;
      
      if (startDateObj && endDateObj <= startDateObj) {
        errors.endDate = 'Ngày kết thúc phải sau ngày bắt đầu';
      }
      
      // End date should not be more than 2 years from start date
      if (startDateObj) {
        const maxEndDate = new Date(startDateObj);
        maxEndDate.setFullYear(maxEndDate.getFullYear() + 2);
        
        if (endDateObj > maxEndDate) {
          errors.endDate = 'Ngày kết thúc không được quá 2 năm từ ngày bắt đầu';
        }
      }
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
    
    console.log('Validation errors:', errors);
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
      setConfirmModal({
        isOpen: true,
        title: 'Xác nhận nâng cấp gói',
        message: `Người thân này đã có gói "${existingPackage.name}". Bạn có muốn nâng cấp lên gói "${selectedPackage?.name}" không?`,
        type: 'confirm',
        onConfirm: () => {
          setConfirmModal(prev => ({ ...prev, isOpen: false }));
          // Calculate discount
          const discount = calculateDiscount();
          setDiscountApplied(discount);
          
          // Show confirmation dialog
          setShowConfirmation(true);
        },
        onCancel: () => {
          setConfirmModal(prev => ({ ...prev, isOpen: false }));
        }
      });
      return;
    }

    // Calculate discount
    const discount = calculateDiscount();
    setDiscountApplied(discount);
    
    // Show confirmation dialog
    setShowConfirmation(true);
  };

  // Kiểm tra xem resident đã có phòng chưa
  const selectedResidentObj = residents.find(r => r.id === selectedResident);
  const hasExistingRoom = selectedResident && roomNumbers[selectedResident] && roomNumbers[selectedResident] !== 'Chưa hoàn tất đăng kí';
  
  // Thêm kiểm tra trước khi gửi đăng ký
  const canSubmit = selectedResident && selectedPackage && startDate && 
    (selectedPackage?.category === 'supplementary' || 
     (selectedPackage?.category === 'main' && (hasExistingRoom || (roomType && selectedRoomId && selectedBedId))));

  

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
      let totalMonthlyCost = carePlansMonthlyCost;
      let payload: any = {
        care_plan_ids: [selectedPackage._id],
        resident_id: selectedResident,
        consultation_notes: medicalNotes || "",
        family_preferences: {
          preferred_room_gender: familyPreferences.preferred_room_gender || "",
          preferred_floor: Number(familyPreferences.preferred_floor) || 0,
          special_requests: familyPreferences.special_requests || ""
        },
        care_plans_monthly_cost: carePlansMonthlyCost,
        start_date: startDate || "",
        additional_medications: Array.isArray(additionalMedications) ? additionalMedications : [],
        status: "active",
        notes: notes || ""
      };

      // Nếu là gói chính, thêm thông tin phòng và giường
      if (selectedPackage?.category === 'main') {
        totalMonthlyCost += roomMonthlyCost;
        payload.selected_room_type = roomType || "";
        payload.assigned_room_id = selectedRoomId || "";
        payload.assigned_bed_id = selectedBedId || "";
        payload.room_monthly_cost = roomMonthlyCost;
      }

      payload.total_monthly_cost = totalMonthlyCost;
      
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
    <div style={{ 
      minHeight: '100vh', 
      background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
      padding: '2rem 0'
    }}>
      <div style={{ 
        maxWidth: '1200px', 
        margin: '0 auto', 
        background: '#fff', 
        borderRadius: 20, 
        boxShadow: '0 20px 60px rgba(0,0,0,0.15)', 
        overflow: 'hidden',
        position: 'relative'
      }}>
        {/* Header với gradient */}
        <div style={{
          background: 'linear-gradient(135deg, #1e3a8a 0%, #3b82f6 100%)',
          padding: '2rem 3rem',
          color: 'white',
          textAlign: 'center'
        }}>
          <h1 style={{ 
            fontSize: '2.5rem', 
            fontWeight: 700, 
            margin: '0 0 0.5rem 0',
            letterSpacing: '-0.02em'
          }}>
            Đăng Ký Dịch Vụ Chăm Sóc
          </h1>
          <p style={{ 
            fontSize: '1.1rem', 
            opacity: 0.9, 
            margin: 0,
            fontWeight: 400
          }}>
            Chọn người thân cần chăm sóc và gói dịch vụ phù hợp
          </p>
        </div>

        {/* Stepper header chuyên nghiệp */}
        <div style={{ 
          padding: '2rem 3rem 1rem 3rem',
          background: '#f8fafc',
          borderBottom: '1px solid #e5e7eb'
        }}>
          <div style={{ 
            display: 'flex', 
            justifyContent: 'space-between', 
            alignItems: 'center',
            maxWidth: '800px',
            margin: '0 auto'
          }}>
          {steps.map((label, idx) => (
              <div key={label} style={{ 
                textAlign: 'center', 
                flex: 1,
                position: 'relative'
              }}>
              <div style={{
                  width: 48, 
                  height: 48, 
                  borderRadius: '50%',
                  background: idx + 1 === step 
                    ? 'linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%)' 
                    : idx + 1 < step 
                    ? '#10b981' 
                    : '#e5e7eb',
                  color: idx + 1 <= step ? '#fff' : '#64748b',
                  display: 'inline-flex', 
                  alignItems: 'center', 
                  justifyContent: 'center', 
                  fontWeight: 700, 
                  marginBottom: 12,
                  fontSize: '1.1rem',
                  boxShadow: idx + 1 === step ? '0 4px 12px rgba(59, 130, 246, 0.3)' : 'none',
                  transition: 'all 0.3s ease'
                }}>
                  {idx + 1 < step ? '✓' : idx + 1}
                </div>
                <div style={{ 
                  fontSize: '0.875rem', 
                  color: idx + 1 === step ? '#1d4ed8' : idx + 1 < step ? '#10b981' : '#64748b', 
                  fontWeight: idx + 1 === step ? 700 : 500,
                  lineHeight: 1.4
                }}>
                  {label}
                </div>
                {idx < steps.length - 1 && (
                  <div style={{
                    position: 'absolute',
                    top: 24,
                    left: '60%',
                    width: '80%',
                    height: 2,
                    background: idx + 1 < step ? '#10b981' : '#e5e7eb',
                    zIndex: -1
                  }} />
                )}
                  </div>
                ))}
          </div>
            </div>

        {/* Main content area */}
        <div style={{ padding: '3rem' }}>

            {/* Step 1: Chọn người thụ hưởng */}
            {step === 1 && (
            <div style={{ maxWidth: '800px', margin: '0 auto' }}>
              <div style={{ 
                textAlign: 'center', 
                marginBottom: '3rem' 
              }}>
                <h2 style={{ 
                  fontSize: '2rem', 
                  fontWeight: 700, 
                  color: '#1f2937',
                  margin: '0 0 1rem 0'
                }}>
                  Chọn Người Thụ Hưởng
                </h2>
                <p style={{ 
                  fontSize: '1.1rem', 
                  color: '#6b7280',
                  margin: 0,
                  lineHeight: 1.6
                }}>
                  Vui lòng chọn người thân cần đăng ký dịch vụ chăm sóc
                </p>
              </div>

              <div style={{
                background: '#f9fafb',
                borderRadius: 16,
                padding: '2rem',
                border: '2px solid #e5e7eb',
                marginBottom: '2rem'
              }}>
                <label style={{ 
                  display: 'block',
                  fontWeight: 600, 
                  fontSize: '1.1rem',
                  color: '#374151',
                  marginBottom: '1rem'
                }}>
                  Danh sách người thân:
                </label>
                {loadingAssignments ? (
                  <div style={{
                    background: '#f0f9ff',
                    borderRadius: 8,
                    padding: '0.75rem',
                    marginBottom: '1rem',
                    border: '1px solid #0ea5e9'
                  }}>
                    <div style={{ fontSize: '0.9rem', color: '#0369a1' }}>
                      🔄 <strong>Đang tải:</strong> Kiểm tra thông tin đăng ký gói dịch vụ...
                    </div>
                  </div>
                ) : selectedPackage?.category === 'main' && (
                  <div style={{
                    background: '#fef3c7',
                    borderRadius: 8,
                    padding: '0.75rem',
                    marginBottom: '1rem',
                    border: '1px solid #f59e0b'
                  }}>
                    <div style={{ fontSize: '0.9rem', color: '#92400e' }}>
                      💡 <strong>Lưu ý:</strong> Chỉ hiển thị những người cao tuổi chưa đăng ký gói chính
                      {!loadingAssignments && (
                        <span style={{ marginLeft: '0.5rem' }}>
                          ({getFilteredResidents().length}/{residents.length} người cao tuổi)
                        </span>
                      )}
                      {getFilteredResidents().length > 4 && (
                        <div style={{ marginTop: '0.5rem', fontSize: '0.85rem' }}>
                                CCó thể cuộn xuống để xem thêm người cao tuổi
                        </div>
                      )}
                    </div>
                  </div>
                )}
                  <Select
                    options={getFilteredResidents().map(getResidentOption)}
                    value={getFilteredResidents().map(getResidentOption).find(opt => opt.value === selectedResident) || null}
              onChange={opt => setSelectedResident(opt?.value || '')}
                    placeholder="Tìm kiếm và chọn người thân..."
                    isSearchable
                    menuPlacement="auto"
                    maxMenuHeight={200}
                  styles={{
                    control: (provided) => ({
                      ...provided,
                      border: '2px solid #d1d5db',
                      borderRadius: '12px',
                      padding: '8px',
                      fontSize: '1rem',
                      minHeight: '56px',
                      boxShadow: 'none',
                      '&:hover': {
                        borderColor: '#3b82f6'
                      }
                    }),
                    option: (provided, state) => ({
                      ...provided,
                      backgroundColor: state.isSelected ? '#3b82f6' : state.isFocused ? '#eff6ff' : 'white',
                      color: state.isSelected ? 'white' : '#374151',
                      padding: '12px 16px',
                      fontSize: '1rem'
                    }),
                    menu: (provided) => ({
                      ...provided,
                      borderRadius: '12px',
                      boxShadow: '0 10px 25px rgba(0,0,0,0.1)',
                      border: '1px solid #e5e7eb',
                      maxHeight: '200px',
                      overflow: 'auto'
                    }),
                    menuList: (provided) => ({
                      ...provided,
                      maxHeight: '200px',
                      overflow: 'auto',
                      scrollbarWidth: 'thin',
                      scrollbarColor: '#cbd5e1 #f1f5f9'
                    })
                  }}
                />
              </div>

              {/* Selected resident info card */}
              {selectedResident && (
                <div style={{
                  background: 'linear-gradient(135deg, #eff6ff 0%, #dbeafe 100%)',
                  borderRadius: 16,
                  padding: '1.5rem',
                  border: '2px solid #3b82f6',
                  marginBottom: '2rem'
                }}>
                  <h3 style={{ 
                    fontSize: '1.25rem', 
                    fontWeight: 600, 
                    color: '#1e40af',
                    margin: '0 0 1rem 0'
                  }}>
                    Thông tin người được chọn:
                  </h3>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem' }}>
                    <div>
                      <span style={{ fontWeight: 600, color: '#374151' }}>Tên:</span>
                      <span style={{ marginLeft: '0.5rem', color: '#6b7280' }}>
                        {residents.find(r => r.id === selectedResident)?.name}
                      </span>
                    </div>
                    <div>
                      <span style={{ fontWeight: 600, color: '#374151' }}>Tuổi:</span>
                      <span style={{ marginLeft: '0.5rem', color: '#6b7280' }}>
                        {residents.find(r => r.id === selectedResident)?.age} tuổi
                      </span>
                    </div>
                    <div>
                      <span style={{ fontWeight: 600, color: '#374151' }}>Giới tính:</span>
                      <span style={{ marginLeft: '0.5rem', color: '#6b7280' }}>
                        {residents.find(r => r.id === selectedResident)?.gender === 'male' ? 'Nam' : 'Nữ'}
                      </span>
                    </div>
                    <div>
                      <span style={{ fontWeight: 600, color: '#374151' }}>Phòng hiện tại:</span>
                      <span style={{ marginLeft: '0.5rem', color: '#6b7280' }}>
                        {roomNumbers[selectedResident] || 'Chưa được phân bổ'}
                      </span>
                    </div>
                  </div>
                </div>
              )}

              <div style={{ 
                display: 'flex', 
                justifyContent: 'space-between', 
                alignItems: 'center',
                marginTop: '2rem',
                paddingTop: '2rem',
                borderTop: '1px solid #e5e7eb'
              }}>
                <Link href="/services" style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '0.5rem',
                  color: '#6b7280',
                  textDecoration: 'none',
                  fontWeight: 500,
                  fontSize: '1rem',
                  padding: '0.75rem 1.5rem',
                  borderRadius: '12px',
                  border: '2px solid #e5e7eb',
                  background: 'white',
                  transition: 'all 0.2s ease'
                }}
                onMouseOver={(e) => {
                  e.currentTarget.style.background = '#f9fafb';
                  e.currentTarget.style.borderColor = '#d1d5db';
                }}
                onMouseOut={(e) => {
                  e.currentTarget.style.background = 'white';
                  e.currentTarget.style.borderColor = '#e5e7eb';
                }}>
                  <ArrowLeftIcon style={{ width: 20, height: 20 }} />
                  Quay lại trang dịch vụ
                </Link>
                  <button
                    disabled={!selectedResident}
                    onClick={() => setStep(2)}
                  style={{ 
                    background: selectedResident 
                      ? 'linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%)' 
                      : '#e5e7eb',
                    color: selectedResident ? '#fff' : '#9ca3af',
                    border: 'none', 
                    borderRadius: 12, 
                    padding: '1rem 2.5rem', 
                    fontWeight: 600, 
                    fontSize: '1.1rem',
                    cursor: selectedResident ? 'pointer' : 'not-allowed',
                    boxShadow: selectedResident ? '0 4px 12px rgba(59, 130, 246, 0.3)' : 'none',
                    transition: 'all 0.3s ease',
                    minWidth: '160px'
                  }}
                  onMouseOver={(e) => {
                    if (selectedResident) {
                      e.currentTarget.style.transform = 'translateY(-2px)';
                      e.currentTarget.style.boxShadow = '0 8px 20px rgba(59, 130, 246, 0.4)';
                    }
                  }}
                  onMouseOut={(e) => {
                    if (selectedResident) {
                      e.currentTarget.style.transform = 'translateY(0)';
                      e.currentTarget.style.boxShadow = '0 4px 12px rgba(59, 130, 246, 0.3)';
                    }
                  }}
                >
                  Tiếp tục
                </button>
                </div>
              </div>
            )}

        {/* Step 2: Chọn gói dịch vụ */}
        {step === 2 && (
          <div style={{ maxWidth: '800px', margin: '0 auto' }}>
            <div style={{ 
              textAlign: 'center', 
              marginBottom: '3rem' 
            }}>
              <h2 style={{ 
                fontSize: '2rem', 
                fontWeight: 700, 
                color: '#1f2937',
                margin: '0 0 1rem 0'
              }}>
                Xác Nhận Gói Dịch Vụ
              </h2>
              <p style={{ 
                fontSize: '1.1rem', 
                color: '#6b7280',
                margin: 0,
                lineHeight: 1.6
              }}>
                Thông tin chi tiết về gói dịch vụ bạn đã chọn
              </p>
            </div>

              {selectedPackage ? (
              <div style={{
                background: 'linear-gradient(135deg, #f0f9ff 0%, #e0f2fe 100%)',
                borderRadius: 16,
                padding: '2rem',
                border: '2px solid #0ea5e9',
                marginBottom: '2rem'
              }}>
                <h3 style={{ 
                  fontSize: '1.5rem', 
                  fontWeight: 700, 
                  color: '#0369a1',
                  margin: '0 0 1rem 0'
                }}>
                  {selectedPackage.plan_name}
                </h3>
                <div style={{ 
                  fontSize: '1.25rem', 
                  color: '#0ea5e9', 
                  fontWeight: 700,
                  marginBottom: '1rem'
                }}>
                  {new Intl.NumberFormat('vi-VN').format(selectedPackage.monthly_price)} đ/tháng
                </div>
                <p style={{ 
                  color: '#475569', 
                  fontSize: '1rem',
                  lineHeight: 1.6,
                  margin: '0 0 1.5rem 0'
                }}>
                  {selectedPackage.description}
                </p>
                <div style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
                  gap: '1rem',
                  marginTop: '1rem'
                }}>
                  <div>
                    <span style={{ fontWeight: 600, color: '#374151' }}>Loại gói:</span>
                    <span style={{ marginLeft: '0.5rem', color: '#6b7280' }}>
                      {selectedPackage.category === 'main' ? 'Gói chính' : 'Gói bổ sung'}
                    </span>
                  </div>
                  
                </div>
                    </div>
              ) : (
              <div style={{
                background: '#fef2f2',
                borderRadius: 16,
                padding: '2rem',
                border: '2px solid #ef4444',
                textAlign: 'center'
              }}>
                <div style={{ fontSize: '1.1rem', color: '#dc2626' }}>
                  Đang tải thông tin gói dịch vụ...
                        </div>
              </div>
            )}

            <div style={{ 
              display: 'flex', 
              justifyContent: 'space-between', 
              alignItems: 'center',
              marginTop: '2rem',
              paddingTop: '2rem',
              borderTop: '1px solid #e5e7eb'
            }}>
              <button 
                onClick={() => setStep(1)} 
                style={{ 
                  background: '#f3f4f6',
                  color: '#374151',
                  border: '2px solid #d1d5db',
                  borderRadius: 12, 
                  padding: '1rem 2rem', 
                  fontWeight: 600,
                  fontSize: '1rem',
                  cursor: 'pointer',
                  transition: 'all 0.2s ease'
                }}
              >
                Quay lại
              </button>
              <button 
                onClick={() => {
                  // Nếu là gói bổ sung hoặc resident đã có phòng, bỏ qua các bước chọn phòng
                  if (selectedPackage?.category === 'supplementary' || hasExistingRoom) {
                    setStep(6); // Chuyển thẳng đến bước thông tin bổ sung
                  } else {
                    setStep(3);
                  }
                }} 
                style={{ 
                  background: 'linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%)',
                  color: '#fff',
                  border: 'none', 
                  borderRadius: 12, 
                  padding: '1rem 2.5rem', 
                  fontWeight: 600,
                  fontSize: '1.1rem',
                  cursor: 'pointer',
                  boxShadow: '0 4px 12px rgba(59, 130, 246, 0.3)',
                  transition: 'all 0.3s ease',
                  minWidth: '160px'
                }}
                onMouseOver={(e) => {
                  e.currentTarget.style.transform = 'translateY(-2px)';
                  e.currentTarget.style.boxShadow = '0 8px 20px rgba(59, 130, 246, 0.4)';
                }}
                onMouseOut={(e) => {
                  e.currentTarget.style.transform = 'translateY(0)';
                  e.currentTarget.style.boxShadow = '0 4px 12px rgba(59, 130, 246, 0.3)';
                }}
              >
                Tiếp tục
              </button>
                        </div>
                        </div>
                           )}

        {/* Step 3: Chọn loại phòng */}
        {step === 3 && (
          <div style={{ maxWidth: '800px', margin: '0 auto' }}>
            <div style={{ 
              textAlign: 'center', 
              marginBottom: '3rem' 
            }}>
              <h2 style={{ 
                fontSize: '2rem', 
                fontWeight: 700, 
                color: '#1f2937',
                margin: '0 0 1rem 0'
              }}>
                Chọn Loại Phòng
              </h2>
              <p style={{ 
                fontSize: '1.1rem', 
                color: '#6b7280',
                margin: 0,
                lineHeight: 1.6
              }}>
                Lựa chọn loại phòng phù hợp với nhu cầu và ngân sách
              </p>
            </div>

            <div style={{
              background: '#f9fafb',
              borderRadius: 16,
              padding: '2rem',
              border: '2px solid #e5e7eb',
              marginBottom: '2rem'
            }}>
                            <label style={{ 
                display: 'block',
                fontWeight: 600, 
                fontSize: '1.1rem',
                color: '#374151',
                marginBottom: '1rem'
              }}>
                Loại phòng:
              </label>
              {loadingRoomTypes ? (
                <div style={{
                  padding: '1rem',
                  textAlign: 'center',
                  color: '#6b7280',
                  background: '#f9fafb',
                  borderRadius: 12,
                  border: '2px solid #e5e7eb'
                }}>
                  Đang tải danh sách loại phòng...
                </div>
              ) : (
                <select 
                  value={roomType} 
                  onChange={e => setRoomType(e.target.value)} 
                  style={{ 
                    width: '100%', 
                    padding: '1rem', 
                    borderRadius: 12, 
                    border: '2px solid #d1d5db', 
                    fontSize: '1rem',
                    background: 'white',
                    cursor: 'pointer',
                    transition: 'border-color 0.2s ease'
                  }}
                  onFocus={(e) => e.target.style.borderColor = '#3b82f6'}
                  onBlur={(e) => e.target.style.borderColor = '#d1d5db'}
                >
              <option value=''>-- Chọn loại phòng --</option>
              {uniqueRoomTypes.map(r => (
                    <option key={r._id} value={r.room_type}>
                      {r.type_name || roomTypeNameMap[r.room_type] || r.room_type}
                    </option>
              ))}
            </select>
              )}
            </div>

            <div style={{ 
              display: 'flex', 
              justifyContent: 'space-between', 
              alignItems: 'center',
              marginTop: '2rem',
              paddingTop: '2rem',
              borderTop: '1px solid #e5e7eb'
            }}>
              <button 
                onClick={() => setStep(2)} 
                style={{ 
                  background: '#f3f4f6',
                  color: '#374151',
                  border: '2px solid #d1d5db',
                  borderRadius: 12, 
                  padding: '1rem 2rem', 
                  fontWeight: 600,
                  fontSize: '1rem',
                  cursor: 'pointer',
                  transition: 'all 0.2s ease'
                }}
              >
                Quay lại
              </button>
              <button 
                disabled={!roomType} 
                onClick={() => setStep(4)} 
                style={{ 
                  background: roomType 
                    ? 'linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%)' 
                    : '#e5e7eb',
                  color: roomType ? '#fff' : '#9ca3af',
                  border: 'none', 
                  borderRadius: 12, 
                  padding: '1rem 2.5rem', 
                  fontWeight: 600,
                  fontSize: '1.1rem',
                  cursor: roomType ? 'pointer' : 'not-allowed',
                  boxShadow: roomType ? '0 4px 12px rgba(59, 130, 246, 0.3)' : 'none',
                  transition: 'all 0.3s ease',
                  minWidth: '160px'
                }}
              >
                Tiếp tục
              </button>
                        </div>
                        </div>
                           )}
                       
        {/* Step 4: Chọn phòng */}
        {step === 4 && (
          <div style={{ maxWidth: '800px', margin: '0 auto' }}>
            <div style={{ 
              textAlign: 'center', 
              marginBottom: '3rem' 
            }}>
              <h2 style={{ 
                fontSize: '2rem', 
                fontWeight: 700, 
                color: '#1f2937',
                margin: '0 0 1rem 0'
              }}>
                Chọn Phòng Cụ Thể
              </h2>
              <p style={{ 
                fontSize: '1.1rem', 
                color: '#6b7280',
                margin: 0,
                lineHeight: 1.6
              }}>
                Lựa chọn phòng phù hợp với giới tính và loại phòng đã chọn
              </p>
            </div>

            {!residentGender ? (
              <div style={{
                background: '#fef2f2',
                borderRadius: 16,
                padding: '2rem',
                border: '2px solid #ef4444',
                textAlign: 'center',
                marginBottom: '2rem'
              }}>
                <div style={{ fontSize: '1.1rem', color: '#dc2626', fontWeight: 600 }}>
                  ⚠️ Vui lòng cập nhật giới tính cho người thụ hưởng trước khi chọn phòng!
                </div>
                    </div>
            ) : (
              <div style={{
                background: '#f9fafb',
                borderRadius: 16,
                padding: '2rem',
                border: '2px solid #e5e7eb',
                marginBottom: '2rem'
              }}>
                                <label style={{ 
                  display: 'block',
                  fontWeight: 600, 
                  fontSize: '1.1rem',
                  color: '#374151',
                  marginBottom: '1rem'
                }}>
                  Danh sách phòng phù hợp:
                </label>
                {loadingRooms ? (
                  <div style={{
                    padding: '1rem',
                    textAlign: 'center',
                    color: '#6b7280',
                    background: '#f9fafb',
                    borderRadius: 12,
                    border: '2px solid #e5e7eb'
                  }}>
                    Đang tải danh sách phòng...
                  </div>
                ) : (
                  <select 
                    value={selectedRoomId} 
                    onChange={e => setSelectedRoomId(e.target.value)} 
                    style={{ 
                      width: '100%', 
                      padding: '1rem', 
                      borderRadius: 12, 
                      border: '2px solid #d1d5db', 
                      fontSize: '1rem',
                      background: 'white',
                      cursor: 'pointer'
                    }}
                  >
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
              </div>
            )}

            <div style={{ 
              display: 'flex', 
              justifyContent: 'space-between', 
              alignItems: 'center',
              marginTop: '2rem',
              paddingTop: '2rem',
              borderTop: '1px solid #e5e7eb'
            }}>
              <button 
                onClick={() => setStep(3)} 
                style={{ 
                  background: '#f3f4f6',
                  color: '#374151',
                  border: '2px solid #d1d5db',
                  borderRadius: 12, 
                  padding: '1rem 2rem', 
                  fontWeight: 600,
                  fontSize: '1rem',
                  cursor: 'pointer',
                  transition: 'all 0.2s ease'
                }}
              >
                Quay lại
              </button>
              <button 
                disabled={!residentGender || !selectedRoomId} 
                onClick={() => setStep(5)} 
                style={{ 
                  background: (residentGender && selectedRoomId)
                    ? 'linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%)' 
                    : '#e5e7eb',
                  color: (residentGender && selectedRoomId) ? '#fff' : '#9ca3af',
                  border: 'none', 
                  borderRadius: 12, 
                  padding: '1rem 2.5rem', 
                  fontWeight: 600,
                  fontSize: '1.1rem',
                  cursor: (residentGender && selectedRoomId) ? 'pointer' : 'not-allowed',
                  boxShadow: (residentGender && selectedRoomId) ? '0 4px 12px rgba(59, 130, 246, 0.3)' : 'none',
                  transition: 'all 0.3s ease',
                  minWidth: '160px'
                }}
              >
                Tiếp tục
              </button>
                  </div>
                  </div>
                       )}
                       
        {/* Step 5: Chọn giường */}
        {step === 5 && (
          <div style={{ maxWidth: '800px', margin: '0 auto' }}>
            <div style={{ 
              textAlign: 'center', 
              marginBottom: '3rem' 
            }}>
              <h2 style={{ 
                fontSize: '2rem', 
                fontWeight: 700, 
                color: '#1f2937',
                margin: '0 0 1rem 0'
              }}>
                Chọn Giường
              </h2>
              <p style={{ 
                fontSize: '1.1rem', 
                color: '#6b7280',
                margin: 0,
                lineHeight: 1.6
              }}>
                Lựa chọn giường cụ thể trong phòng đã chọn
              </p>
            </div>

            <div style={{
              background: '#f9fafb',
              borderRadius: 16,
              padding: '2rem',
              border: '2px solid #e5e7eb',
              marginBottom: '2rem'
            }}>
                              <label style={{ 
                  display: 'block',
                  fontWeight: 600, 
                  fontSize: '1.1rem',
                  color: '#374151',
                  marginBottom: '1rem'
                }}>
                  Danh sách giường có sẵn:
                </label>
                {loadingBeds ? (
                  <div style={{
                    padding: '1rem',
                    textAlign: 'center',
                    color: '#6b7280',
                    background: '#f9fafb',
                    borderRadius: 12,
                    border: '2px solid #e5e7eb'
                  }}>
                    Đang tải danh sách giường...
                  </div>
                ) : (
                  <select 
                    value={selectedBedId} 
                    onChange={e => setSelectedBedId(e.target.value)} 
                    style={{ 
                      width: '100%', 
                      padding: '1rem', 
                      borderRadius: 12, 
                      border: '2px solid #d1d5db', 
                      fontSize: '1rem',
                      background: 'white',
                      cursor: 'pointer'
                    }}
                  >
              <option value=''>-- Chọn giường --</option>
              {beds.filter(b => b.room_id === selectedRoomId && b.status === 'available').map(bed => (
                <option key={bed._id} value={bed._id}>{bed.bed_number}</option>
              ))}
            </select>
                )}
            </div>

            <div style={{ 
              display: 'flex', 
              justifyContent: 'space-between', 
              alignItems: 'center',
              marginTop: '2rem',
              paddingTop: '2rem',
              borderTop: '1px solid #e5e7eb'
            }}>
              <button 
                onClick={() => setStep(4)} 
                style={{ 
                  background: '#f3f4f6',
                  color: '#374151',
                  border: '2px solid #d1d5db',
                  borderRadius: 12, 
                  padding: '1rem 2rem', 
                  fontWeight: 600,
                  fontSize: '1rem',
                  cursor: 'pointer',
                  transition: 'all 0.2s ease'
                }}
              >
                Quay lại
              </button>
              <button 
                disabled={!selectedBedId} 
                onClick={() => setStep(6)} 
                style={{ 
                  background: selectedBedId
                    ? 'linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%)' 
                    : '#e5e7eb',
                  color: selectedBedId ? '#fff' : '#9ca3af',
                  border: 'none', 
                  borderRadius: 12, 
                  padding: '1rem 2.5rem', 
                  fontWeight: 600,
                  fontSize: '1.1rem',
                  cursor: selectedBedId ? 'pointer' : 'not-allowed',
                  boxShadow: selectedBedId ? '0 4px 12px rgba(59, 130, 246, 0.3)' : 'none',
                  transition: 'all 0.3s ease',
                  minWidth: '160px'
                }}
              >
                Tiếp tục
              </button>
                </div>
              </div>
            )}

        {/* Step 6: Thông tin bổ sung */}
        {step === 6 && (
          <div style={{ maxWidth: '800px', margin: '0 auto' }}>
            <div style={{ 
              textAlign: 'center', 
              marginBottom: '3rem' 
            }}>
              <h2 style={{ 
                fontSize: '2rem', 
                fontWeight: 700, 
                color: '#1f2937',
                margin: '0 0 1rem 0'
              }}>
                Thông Tin Bổ Sung
              </h2>
              <p style={{ 
                fontSize: '1.1rem', 
                color: '#6b7280',
                margin: 0,
                lineHeight: 1.6
              }}>
                Cung cấp thêm thông tin để chúng tôi phục vụ tốt hơn
              </p>
              {(selectedPackage?.category === 'supplementary' || hasExistingRoom) && (
                <div style={{
                  background: '#f0f9ff',
                  borderRadius: 12,
                  padding: '1rem',
                  marginTop: '1rem',
                  border: '1px solid #0ea5e9'
                }}>
                  <div style={{ fontSize: '1rem', color: '#0369a1', textAlign: 'center' }}>
                    {selectedPackage?.category === 'supplementary' ? (
                      <>🎯 <strong>Gói bổ sung:</strong> Không cần chọn phòng vì người cao tuổi đã có phòng từ gói chính</>
                    ) : (
                      <>🏠 <strong>Đã có phòng:</strong> Người cao tuổi đã được phân bổ phòng {roomNumbers[selectedResident]} nên bỏ qua bước chọn phòng</>
                    )}
                  </div>
                </div>
              )}
            </div>

            <div style={{
              background: '#f9fafb',
              borderRadius: 16,
              padding: '2rem',
              border: '2px solid #e5e7eb',
              marginBottom: '2rem'
            }}>
              <div style={{ marginBottom: '1.5rem' }}>
                <label style={{ 
                  display: 'block',
                  fontWeight: 600, 
                  fontSize: '1rem',
                  color: '#374151',
                  marginBottom: '0.5rem'
                }}>
                  Ngày bắt đầu dịch vụ: *
                </label>
            <DatePicker
              selected={startDate ? new Date(startDate) : null}
              onChange={date => {
                const newStartDate = date ? date.toISOString().slice(0, 10) : '';
                setStartDate(newStartDate);
                // Clear validation errors when user changes the date
                if (validationErrors.startDate) {
                  setValidationErrors(prev => ({ ...prev, startDate: '' }));
                }
                // If end date exists and is now invalid, clear it
                if (endDate && newStartDate && new Date(endDate) <= new Date(newStartDate)) {
                  setEndDate('');
                  setValidationErrors(prev => ({ ...prev, endDate: '' }));
                }
              }}
              dateFormat="dd/MM/yyyy"
              placeholderText="dd/mm/yyyy"
              filterDate={(date) => {
                const today = new Date();
                today.setHours(0, 0, 0, 0);
                const selectedDate = new Date(date);
                selectedDate.setHours(0, 0, 0, 0);
                return selectedDate >= today;
              }}
                  className={`date-picker-custom ${validationErrors.startDate ? 'error' : ''}`}
                />
                {validationErrors.startDate && (
                  <p style={{ 
                    fontSize: '0.75rem', 
                    color: '#ef4444', 
                    marginTop: '0.25rem'
                  }}>
                    {validationErrors.startDate}
                  </p>
                )}
              </div>

              <div style={{ marginBottom: '1.5rem' }}>
                <label style={{ 
                  display: 'block',
                  fontWeight: 600, 
                  fontSize: '1rem',
                  color: '#374151',
                  marginBottom: '0.5rem'
                }}>
                  Ngày kết thúc dịch vụ:
                </label>
            <DatePicker
              selected={endDate ? new Date(endDate) : null}
              onChange={date => {
                const newEndDate = date ? date.toISOString().slice(0, 10) : '';
                setEndDate(newEndDate);
                // Clear validation errors when user changes the date
                if (validationErrors.endDate) {
                  setValidationErrors(prev => ({ ...prev, endDate: '' }));
                }
              }}
              dateFormat="dd/MM/yyyy"
              placeholderText="dd/mm/yyyy (tùy chọn)"
              filterDate={(date) => {
                const selectedDate = new Date(date);
                selectedDate.setHours(0, 0, 0, 0);
                if (startDate) {
                  const startDateObj = new Date(startDate);
                  startDateObj.setHours(0, 0, 0, 0);
                  return selectedDate > startDateObj;
                } else {
                  const today = new Date();
                  today.setHours(0, 0, 0, 0);
                  return selectedDate >= today;
                }
              }}
                  className={`date-picker-custom ${validationErrors.endDate ? 'error' : ''}`}
                />
                {validationErrors.endDate ? (
                  <p style={{ 
                    fontSize: '0.75rem', 
                    color: '#ef4444', 
                    marginTop: '0.25rem'
                  }}>
                    {validationErrors.endDate}
                  </p>
                ) : (
                  <p style={{ 
                    fontSize: '0.75rem', 
                    color: '#6b7280', 
                    marginTop: '0.25rem',
                    fontStyle: 'italic'
                  }}>
                    Để trống nếu không muốn đặt ngày kết thúc cụ thể. Dịch vụ sẽ kéo dài cho đến khi bạn hủy.
                  </p>
                )}
              </div>

              <div style={{ marginBottom: '1.5rem' }}>
                <label style={{ 
                  display: 'block',
                  fontWeight: 600, 
                  fontSize: '1rem',
                  color: '#374151',
                  marginBottom: '0.5rem'
                }}>
                  Giới tính phòng:
                </label>
            <input
              type="text"
              value={residentGender === 'male' ? 'Nam' : residentGender === 'female' ? 'Nữ' : ''}
              disabled
                  style={{ 
                    width: '100%', 
                    padding: '1rem', 
                    borderRadius: 12, 
                    border: '2px solid #d1d5db', 
                    fontSize: '1rem',
                    background: '#f9fafb',
                    color: '#6b7280'
                  }}
                />
              </div>

              <div style={{ marginBottom: '1.5rem' }}>
                <label style={{ 
                  display: 'block',
                  fontWeight: 600, 
                  fontSize: '1rem',
                  color: '#374151',
                  marginBottom: '0.5rem'
                }}>
                  Yêu cầu đặc biệt:
                </label>
                <input 
                  type='text' 
                  value={familyPreferences.special_requests} 
                  onChange={e => setFamilyPreferences({ ...familyPreferences, special_requests: e.target.value })} 
                  style={{ 
                    width: '100%', 
                    padding: '1rem', 
                    borderRadius: 12, 
                    border: '2px solid #d1d5db', 
                    fontSize: '1rem',
                    background: 'white'
                  }} 
                />
              </div>

              <div style={{ marginBottom: '1.5rem' }}>
                <label style={{ 
                  display: 'block',
                  fontWeight: 600, 
                  fontSize: '1rem',
                  color: '#374151',
                  marginBottom: '0.5rem'
                }}>
                  Ghi chú tư vấn:
                </label>
                <textarea 
                  value={medicalNotes} 
                  onChange={e => setMedicalNotes(e.target.value)} 
                  style={{ 
                    width: '100%', 
                    padding: '1rem', 
                    borderRadius: 12, 
                    border: '2px solid #d1d5db', 
                    minHeight: 80, 
                    fontSize: '1rem',
                    background: 'white',
                    resize: 'vertical'
                  }} 
                />
              </div>
            </div>

            {/* Hiển thị validation errors */}
            {Object.keys(validationErrors).length > 0 && (
              <div style={{
                padding: '1rem',
                backgroundColor: '#fef2f2',
                border: '1px solid #fecaca',
                borderRadius: '0.5rem',
                marginBottom: '1rem',
                color: '#dc2626',
                fontSize: '0.875rem'
              }}>
                <strong>Vui lòng sửa các lỗi sau:</strong>
                <ul style={{ margin: '0.5rem 0 0 0', paddingLeft: '1.5rem' }}>
                  {Object.entries(validationErrors).map(([field, error]) => (
                    <li key={field}>{error}</li>
                  ))}
                </ul>
              </div>
            )}

            <div style={{ 
              display: 'flex', 
              justifyContent: 'space-between', 
              alignItems: 'center',
              marginTop: '2rem',
              paddingTop: '2rem',
              borderTop: '1px solid #e5e7eb'
            }}>
              <button 
                onClick={() => {
                  // Nếu là gói bổ sung hoặc đã có phòng, quay lại step 1 thay vì step 5
                  if (selectedPackage?.category === 'supplementary' || hasExistingRoom) {
                    setStep(1);
                  } else {
                    setStep(5);
                  }
                }} 
                style={{ 
                  background: '#f3f4f6',
                  color: '#374151',
                  border: '2px solid #d1d5db',
                  borderRadius: 12, 
                  padding: '1rem 2rem', 
                  fontWeight: 600,
                  fontSize: '1rem',
                  cursor: 'pointer',
                  transition: 'all 0.2s ease'
                }}
              >
                Quay lại
              </button>
              <button 
                onClick={() => {
                  // Validate form before proceeding
                  console.log('Current validation errors:', validationErrors);
                  console.log('Start date:', startDate);
                  console.log('End date:', endDate);
                  console.log('Emergency contact:', emergencyContact);
                  console.log('Emergency phone:', emergencyPhone);
                  if (validateRegistration()) {
                    setStep(7);
                  } else {
                    console.log('Validation failed. Errors:', validationErrors);
                  }
                }} 
                style={{ 
                  background: 'linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%)',
                  color: '#fff',
                  border: 'none', 
                  borderRadius: 12, 
                  padding: '1rem 2.5rem', 
                  fontWeight: 600,
                  fontSize: '1.1rem',
                  cursor: 'pointer',
                  boxShadow: '0 4px 12px rgba(59, 130, 246, 0.3)',
                  transition: 'all 0.3s ease',
                  minWidth: '160px'
                }}
                disabled={!startDate || Object.keys(validationErrors).length > 0}
              >
                Tiếp tục
              </button>
            </div>
          </div>
        )}

        {/* Step 7: Xác nhận */}
        {step === 7 && (
          <div style={{ maxWidth: '800px', margin: '0 auto' }}>
            <div style={{ 
              textAlign: 'center', 
              marginBottom: '3rem' 
            }}>
              <h2 style={{ 
                fontSize: '2rem', 
                fontWeight: 700, 
                color: '#1f2937',
                margin: '0 0 1rem 0'
              }}>
                Xác Nhận Thông Tin
              </h2>
              <p style={{ 
                fontSize: '1.1rem', 
                color: '#6b7280',
                margin: 0,
                lineHeight: 1.6
              }}>
                Kiểm tra lại thông tin trước khi hoàn tất đăng ký
              </p>
                    </div>

            <div style={{
              background: 'linear-gradient(135deg, #f0fdf4 0%, #dcfce7 100%)',
              borderRadius: 16,
              padding: '2rem',
              border: '2px solid #22c55e',
              marginBottom: '2rem'
            }}>
              <h3 style={{ 
                fontSize: '1.25rem', 
                fontWeight: 600, 
                color: '#15803d',
                margin: '0 0 1.5rem 0'
              }}>
                Thông tin đăng ký:
              </h3>
              <div style={{ 
                display: 'grid', 
                gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', 
                gap: '1rem',
                fontSize: '1rem'
              }}>
                <div><b style={{ color: '#374151' }}>Người thụ hưởng:</b> {residents.find(r => r.id === selectedResident)?.name}</div>
                <div><b style={{ color: '#374151' }}>Gói dịch vụ:</b> {selectedPackage?.plan_name}</div>
                <div><b style={{ color: '#374151' }}>Ngày bắt đầu:</b> {startDate ? new Date(startDate).toLocaleDateString('vi-VN') : 'Chưa chọn'}</div>
                <div><b style={{ color: '#374151' }}>Ngày kết thúc:</b> {endDate ? new Date(endDate).toLocaleDateString('vi-VN') : 'Không có (kéo dài vô thời hạn)'}</div>
                                 {selectedPackage?.category === 'main' && (
                   <>
                     {hasExistingRoom ? (
                       <>
                         <div><b style={{ color: '#374151' }}>Phòng hiện tại:</b> {roomNumbers[selectedResident]}</div>
                         <div><b style={{ color: '#374151' }}>Ghi chú:</b> Sử dụng phòng hiện có</div>
                       </>
                     ) : (
                       <>
                         <div><b style={{ color: '#374151' }}>Loại phòng:</b> {roomTypeName}</div>
                         <div><b style={{ color: '#374151' }}>Giới tính phòng:</b> {roomGender === 'male' ? 'Nam' : roomGender === 'female' ? 'Nữ' : ''}</div>
                         <div><b style={{ color: '#374151' }}>Phòng:</b> {selectedRoomObj?.room_number}</div>
                         <div><b style={{ color: '#374151' }}>Giường:</b> {beds.find(b => b._id === selectedBedId)?.bed_number}</div>
                       </>
                     )}
                   </>
                 )}
                <div><b style={{ color: '#374151' }}>Yêu cầu đặc biệt:</b> {familyPreferences.special_requests || 'Không có'}</div>
                <div><b style={{ color: '#374151' }}>Ghi chú:</b> {medicalNotes || 'Không có'}</div>
                                 {selectedPackage?.category === 'main' && (
                   <div><b style={{ color: '#374151' }}>Tiền phòng/tháng:</b> {roomMonthlyCost.toLocaleString()} đ</div>
                 )}
                 <div><b style={{ color: '#374151' }}>Tiền gói dịch vụ/tháng:</b> {selectedPackage?.monthly_price?.toLocaleString()} đ</div>
                <div style={{ 
                  gridColumn: '1 / -1',
                  padding: '1rem',
                  background: '#f8fafc',
                  borderRadius: 8,
                  border: '1px solid #e2e8f0'
                }}>
                  <b style={{ color: '#1e40af', fontSize: '1.1rem' }}>Tổng cộng/tháng:</b> 
                                     <span style={{ 
                     marginLeft: '0.5rem',
                     color: '#1e40af', 
                     fontSize: '1.2rem',
                     fontWeight: 700
                   }}>
                     {((selectedPackage?.category === 'main' && !hasExistingRoom ? roomMonthlyCost : 0) + (selectedPackage?.monthly_price || 0)).toLocaleString()} đ
                   </span>
                </div>
              </div>
            </div>

            <div style={{ 
              display: 'flex', 
              justifyContent: 'space-between', 
              alignItems: 'center',
              marginTop: '2rem',
              paddingTop: '2rem',
              borderTop: '1px solid #e5e7eb'
            }}>
              <button 
                onClick={() => setStep(6)} 
                style={{ 
                  background: '#f3f4f6',
                  color: '#374151',
                  border: '2px solid #d1d5db',
                  borderRadius: 12, 
                  padding: '1rem 2rem', 
                  fontWeight: 600,
                  fontSize: '1rem',
                  cursor: 'pointer',
                  transition: 'all 0.2s ease'
                }}
              >
                Quay lại
              </button>
                  <button
                    onClick={() => {
                  if (!canRegisterMain) {
                    setShowMainCarePlanModal(true);
                        return;
                      }
                  handlePurchase();
                }}
                style={{ 
                  background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
                  color: '#fff',
                  border: 'none', 
                  borderRadius: 12, 
                  padding: '1rem 2.5rem', 
                  fontWeight: 600,
                  fontSize: '1.1rem',
                  cursor: 'pointer',
                  boxShadow: '0 4px 12px rgba(16, 185, 129, 0.3)',
                  transition: 'all 0.3s ease',
                  minWidth: '160px'
                }}
                disabled={!canSubmit}
              >
                Xác nhận & Đăng ký
              </button>
                </div>
              </div>
            )}

        {/* Step 8: Hoàn tất */}
        {step === 8 && (
          <div style={{ 
            maxWidth: '800px', 
            margin: '0 auto',
            textAlign: 'center', 
            padding: '3rem 0'
          }}>
            <div style={{ 
              fontSize: 64, 
              color: '#10b981', 
              marginBottom: '2rem' 
            }}>
              ✓
            </div>
            <h3 style={{ 
              fontWeight: 700, 
              fontSize: '2rem', 
              marginBottom: '1rem',
              color: '#1f2937'
            }}>
              Đăng ký thành công!
            </h3>
            <div style={{ 
              color: '#6b7280', 
              marginBottom: '2rem',
              fontSize: '1.1rem',
              lineHeight: 1.6
            }}>
              Thông tin đăng ký dịch vụ đã được gửi thành công. 
              <br/>Chúng tôi sẽ liên hệ lại để xác nhận trong thời gian sớm nhất.
            </div>
            <button 
              onClick={() => router.push('/services')} 
              style={{ 
                background: 'linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%)',
                color: '#fff',
                border: 'none', 
                borderRadius: 12, 
                padding: '1rem 2.5rem', 
                fontWeight: 600,
                fontSize: '1.1rem',
                cursor: 'pointer',
                boxShadow: '0 4px 12px rgba(59, 130, 246, 0.3)',
                transition: 'all 0.3s ease'
              }}
            >
              Về trang dịch vụ
            </button>
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

      {/* Confirm Modal for package upgrade */}
      <ConfirmModal
        isOpen={confirmModal.isOpen}
        title={confirmModal.title}
        message={confirmModal.message}
        type={confirmModal.type}
        onConfirm={confirmModal.onConfirm}
        onCancel={confirmModal.onCancel}
      />

      <style jsx>{`
        .date-picker-custom.error {
          border: 2px solid #ef4444 !important;
          border-radius: 12px !important;
        }
        
        .date-picker-custom {
          border: 2px solid #d1d5db;
          border-radius: 12px;
          padding: 1rem;
          width: 100%;
          font-size: 1rem;
          background: white;
        }
      `}</style>
    </div>
    </div>
  );
} 