"use client";

import { useState, useEffect, useRef } from 'react';
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
import { carePlansAPI, residentAPI } from '@/lib/api';

// Business rules data
const termsData = [
  {
    id: 'services',
    title: 'Dịch Vụ Chăm Sóc',
    icon: 'medical-services',
    content: [
      {
        subtitle: 'Gói dịch vụ chăm sóc',
        text: 'Viện cung cấp các gói dịch vụ chăm sóc khác nhau phù hợp với tình trạng sức khỏe của người cao tuổi. Mỗi gói bao gồm dịch vụ ăn uống, thuốc men cơ bản, và các hoạt động giải trí.'
      },
      {
        subtitle: 'Dịch vụ bao gồm',
        text: 'Tất cả dịch vụ ăn uống, thuốc men theo đơn bác sĩ, và các hoạt động sinh hoạt đã được bao gồm trong gói dịch vụ mà không tính phí thêm.'
      },
      {
        subtitle: 'Dịch vụ bổ sung',
        text: 'Người nhà có thể tự do mang thuốc, thực phẩm chức năng hoặc thức ăn cho người thân. Các yêu cầu thêm thuốc từ bệnh viện sẽ được tính phí riêng.'
      }
    ]
  },
  {
    id: 'pricing',
    title: 'Chính Sách Tính Phí',
    icon: 'attach-money',
    content: [
      {
        subtitle: 'Cơ sở tính phí',
        text: 'Chi phí được tính dựa trên gói dịch vụ chăm sóc và loại phòng được chọn. Giá cả tính theo số ngày thực tế người cao tuổi lưu trú tại viện.'
      },
      {
        subtitle: 'Công thức tính',
        text: 'Phí tháng = (Tổng phí gói dịch vụ ÷ 30 ngày) × Số ngày thực tế ở viện'
      },
      {
        subtitle: 'Đăng ký lần đầu',
        text: 'Khi đăng ký, người nhà cần thanh toán cọc trước 1 tháng cộng với tiền phí tháng đầu tiên.'
      }
    ]
  },
  {
    id: 'payment',
    title: 'Thanh Toán',
    icon: 'payment',
    content: [
      {
        subtitle: 'Chu kỳ thanh toán',
        text: 'Thanh toán được thực hiện hàng tháng từ ngày 1 đến ngày 5 của mỗi tháng.'
      },
      {
        subtitle: 'Phương thức thanh toán',
        text: 'Đợt đăng ký đầu tiên: Thanh toán tại quầy nhân viên bằng chuyển khoản. Các tháng tiếp theo: Có thể thanh toán online hoặc tại quầy.'
      },
      {
        subtitle: 'Quá hạn thanh toán',
        text: 'Nếu quá ngày 5 mà chưa thanh toán, viện sẽ thông báo và trao đổi với người nhà để đưa người cao tuổi về nhà.'
      }
    ]
  },
  {
    id: 'service_change',
    title: 'Thay Đổi Gói Dịch Vụ',
    icon: 'swap-horizontal-circle',
    content: [
      {
        subtitle: 'Điều kiện thay đổi',
        text: 'Khi người cao tuổi có thay đổi về tình trạng sức khỏe và cần chuyển sang gói dịch vụ khác, việc thay đổi sẽ có hiệu lực từ tháng tiếp theo.'
      },
      {
        subtitle: 'Quy trình thay đổi',
        text: 'Hoàn thành hợp đồng hiện tại đến hết tháng, sau đó đăng ký gói dịch vụ mới cho tháng tiếp theo.'
      }
    ]
  },
  {
    id: 'termination',
    title: 'Chấm Dứt Dịch Vụ',
    icon: 'exit-to-app',
    content: [
      {
        subtitle: 'Do người nhà yêu cầu',
        text: 'Nếu người nhà muốn đón người cao tuổi về, phí sẽ được tính theo công thức: (Tổng phí gói ÷ 30 ngày) × Số ngày thực tế ở viện.'
      },
      {
        subtitle: 'Hoàn tiền',
        text: 'Số tiền dư sẽ được hoàn lại cho người nhà vì tiền được thu trước vào đầu mỗi tháng.'
      },
      {
        subtitle: 'Do vi phạm thanh toán',
        text: 'Khi không thanh toán đúng hạn sau thông báo, viện có quyền chấm dứt dịch vụ và yêu cầu người nhà đón về.'
      }
    ]
  },
  {
    id: 'responsibilities',
    title: 'Trách Nhiệm Các Bên',
    icon: 'handshake',
    content: [
      {
        subtitle: 'Trách nhiệm của viện',
        text: 'Cung cấp dịch vụ chăm sóc chất lượng, đảm bảo an toàn và sức khỏe cho người cao tuổi theo gói dịch vụ đã đăng ký.'
      },
      {
        subtitle: 'Trách nhiệm của người nhà',
        text: 'Thanh toán đúng hạn, cung cấp thông tin sức khỏe chính xác, tuân thủ các quy định của viện.'
      },
      {
        subtitle: 'Thăm viếng',
        text: 'Người nhà được quyền thăm viếng theo lịch đã đăng ký và phải tuân thủ các quy định về giờ thăm viếng.'
      }
    ]
  },
  {
    id: 'privacy',
    title: 'Bảo Mật Thông Tin',
    icon: 'privacy-tip',
    content: [
      {
        subtitle: 'Thu thập thông tin',
        text: 'Viện chỉ thu thập thông tin cần thiết để cung cấp dịch vụ chăm sóc tốt nhất.'
      },
      {
        subtitle: 'Bảo vệ thông tin',
        text: 'Mọi thông tin cá nhân và y tế của người cao tuổi được bảo mật tuyệt đối và chỉ chia sẻ với nhân viên y tế có liên quan.'
      },
      {
        subtitle: 'Quyền truy cập',
        text: 'Người nhà có quyền truy cập và yêu cầu cập nhật thông tin của người thân mình.'
      }
    ]
  },
  {
    id: 'emergency',
    title: 'Tình Huống Khẩn Cấp',
    icon: 'local-hospital',
    content: [
      {
        subtitle: 'Xử lý khẩn cấp',
        text: 'Trong trường hợp khẩn cấp, viện sẽ liên hệ ngay với người nhà và thực hiện các biện pháp cấp cứu cần thiết.'
      },
      {
        subtitle: 'Chi phí phát sinh',
        text: 'Chi phí cấp cứu và điều trị đặc biệt ngoài gói dịch vụ sẽ được thông báo và tính riêng.'
      }
    ]
  }
];

export default function ServicesPage() {
  const router = useRouter();
  const { user } = useAuth();
  
  // Care plans state from API
  const [carePlans, setCarePlans] = useState<any[]>([]);
  const [loadingCarePlans, setLoadingCarePlans] = useState(true);
  const [carePlansError, setCarePlansError] = useState<string | null>(null);
  
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
  
  // Fetch care plans from API
  useEffect(() => {
    setLoadingCarePlans(true);
    setCarePlansError(null);
    carePlansAPI.getAll()
      .then((data) => {
        setCarePlans(data);
      })
      .catch(() => {
        setCarePlansError('Không thể tải danh sách gói dịch vụ.');
      })
      .finally(() => {
        setLoadingCarePlans(false);
      });
  }, []);
  
  const [selectedPackage, setSelectedPackage] = useState<string | null>(null);
  const [showServiceModal, setShowServiceModal] = useState(false);
  const [selectedResidentIndex, setSelectedResidentIndex] = useState(0);
  const [showApprovalModal, setShowApprovalModal] = useState(false);
  const [pendingPackages, setPendingPackages] = useState<any[]>([]);
  const [showBusinessRulesModal, setShowBusinessRulesModal] = useState(false);
  const [showStaffRegisterModal, setShowStaffRegisterModal] = useState(false);
  
  // New state for filtering packages by status
  const [packageStatusFilter, setPackageStatusFilter] = useState<string>('all');
  
  // Thêm state cho danh sách người thân và loading
  const [relatives, setRelatives] = useState<any[]>([]);
  const [loadingRelatives, setLoadingRelatives] = useState(false);
  const [selectedRelativeIndex, setSelectedRelativeIndex] = useState(0);

  // New: State for care plans by resident
  const [residentCarePlans, setResidentCarePlans] = useState<{ [residentId: string]: any[] }>({});
  const [loadingResidentCarePlans, setLoadingResidentCarePlans] = useState<{ [residentId: string]: boolean }>({});
  const [residentCarePlansError, setResidentCarePlansError] = useState<{ [residentId: string]: string | null }>({});

  // Thêm state cho care plan chi tiết khi lấy qua carePlanId
  const [residentCarePlanDetail, setResidentCarePlanDetail] = useState<{ [residentId: string]: any | null }>({});
  const [loadingCarePlanDetail, setLoadingCarePlanDetail] = useState<{ [residentId: string]: boolean }>({});
  const [carePlanDetailError, setCarePlanDetailError] = useState<{ [residentId: string]: string | null }>({});

  // Thêm state lưu chi tiết plan cho từng assignment
  const [assignmentPlanDetails, setAssignmentPlanDetails] = useState<{ [assignmentId: string]: any }>({});

  // Debug: Log relatives khi thay đổi
  useEffect(() => {
    if (relatives.length > 0) {
      console.log('Relatives:', relatives);
    }
  }, [relatives]);

  // Fetch care plans for selected resident when modal opens or resident changes
  useEffect(() => {
    if (!showServiceModal || relatives.length === 0) return;
    const resident = relatives[selectedRelativeIndex];
    if (!resident?._id) return;
    const residentId = resident._id;
    console.log('Fetching care plans for residentId:', residentId, resident); // Log residentId và object resident
    // Only fetch if not already loaded
    if (residentCarePlans[residentId]) return;
    setLoadingResidentCarePlans((prev) => ({ ...prev, [residentId]: true }));
    setResidentCarePlansError((prev) => ({ ...prev, [residentId]: null }));
    carePlansAPI.getByResidentId(residentId)
      .then((data) => {
        console.log('API raw data for resident', residentId, data); // Thêm log này
        setResidentCarePlans((prev) => ({ ...prev, [residentId]: data }));
      })
      .catch((err) => {
        console.log('API error for resident', residentId, err);
        setResidentCarePlansError((prev) => ({ ...prev, [residentId]: 'Không thể tải gói dịch vụ cho người thân này.' }));
      })
      .finally(() => {
        setLoadingResidentCarePlans((prev) => ({ ...prev, [residentId]: false }));
      });
  }, [showServiceModal, selectedRelativeIndex, relatives]);

  const loadPendingPackages = () => {
    try {
      const savedResidents = localStorage.getItem('nurseryHomeResidents');
      if (savedResidents) {
        const residents = JSON.parse(savedResidents);
        const pending = residents
          .filter((r: any) => {
            // Check for pending approval packages
            if (r.carePackage && r.carePackage.status === 'pending_approval') {
              return true;
            }
            // Check for pending cancellation requests
            if (r.carePackage && r.carePackage.cancellationRequest && 
                r.carePackage.cancellationRequest.status === 'pending_approval') {
              return true;
            }
            return false;
          })
          .map((r: any) => {
            if (r.carePackage.status === 'pending_approval') {
              return {
                ...r.carePackage,
                type: 'registration',
                residentName: r.name,
                residentId: r._id,
                residentAge: r.age,
                residentRoom: r.room
              };
            } else if (r.carePackage.cancellationRequest) {
              return {
                ...r.carePackage,
                type: 'cancellation',
                cancellationRequest: r.carePackage.cancellationRequest,
                residentName: r.name,
                residentId: r._id,
                residentAge: r.age,
                residentRoom: r.room
              };
            }
            return null;
          })
          .filter(Boolean);
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
        const updatedResidents = (residents as any[]).map((r: any) => {
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
    try {
      const savedResidents = localStorage.getItem('nurseryHomeResidents');
      if (savedResidents) {
        const residents = JSON.parse(savedResidents);
        const updatedResidents = (residents as any[]).map((r: any) => {
          if (r.carePackage && r.carePackage.registrationId === registrationId) {
            return {
              ...r,
              carePackage: {
                ...r.carePackage,
                status: 'rejected',
                rejectedDate: new Date().toISOString(),
                rejectedBy: 'Nhân viên quản lý',
                rejectionReason: 'Đã từ chối'
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
    if (showServiceModal || showApprovalModal || showBusinessRulesModal) {
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
  }, [showServiceModal, showApprovalModal, showBusinessRulesModal]);

  const handlePackageSelect = (packageId: string) => {
    if (!user) {
      router.push('/login');
      return;
    }

    // Check if user already has a registered or pending package of this type
    const existingPackages = getAllRegisteredServicePackages() || [];
    const packageToSelect = carePlans.find((p: any) => p._id === packageId);
    
    if (!packageToSelect) {
      return;
    }
    
    // Check for existing packages of the same type
    const alreadyRegistered = existingPackages.some((pkg: any) => 
      pkg.packageType === packageToSelect.planName && 
      ['active', 'pending_approval'].includes(pkg.status)
    );
    
    if (alreadyRegistered) {
      const confirmContinue = window.confirm(
        `Bạn đã đăng ký gói "${packageToSelect.planName}" trước đó và đang chờ duyệt hoặc đang sử dụng. Bạn có chắc muốn tiếp tục đăng ký gói này không?`
      );
      if (!confirmContinue) {
        return;
      }
    }
    
    setSelectedPackage(packageId);
    router.push(`/services/purchase/${packageId}`);
  };

  const handleViewServicePackage = () => {
    setSelectedResidentIndex(0); // Reset to first resident
    setShowServiceModal(true);
  };

  const getAllRegisteredServicePackages = (statusFilter: string = 'all') => {
    try {
      // For family role, use RESIDENTS_DATA as the primary source
      if (user?.role === 'family') {
        // Filter residents with care packages from RESIDENTS_DATA
        const residentsWithPackages = RESIDENTS_DATA.filter((r: any) => r.carePackage);
        let packages = residentsWithPackages.map((resident: any) => ({
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
        
        // Apply status filter if not 'all'
        if (statusFilter !== 'all') {
          packages = packages.filter((pkg: any) => pkg.status === statusFilter);
        }
        
        return packages;
      }
      
      // Fallback to localStorage for other roles
      const savedResidents = localStorage.getItem('nurseryHomeResidents');
      if (savedResidents) {
        const residents = JSON.parse(savedResidents);
        const residentsWithPackages = residents.filter((r: any) => r.carePackage);
        let packages = residentsWithPackages.map((resident: any) => ({
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
        
        // Apply status filter if not 'all'
        if (statusFilter !== 'all') {
          packages = packages.filter((pkg: any) => pkg.status === statusFilter);
        }
        
        return packages;
      }
    } catch (error) {
      console.error('Error getting registered service packages:', error);
    }
    return [];
  };

  const getRegisteredServicePackage = () => {
    const allPackages = getAllRegisteredServicePackages(packageStatusFilter);
    return allPackages.length > 0 ? allPackages[selectedResidentIndex] : null;
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: 'VND'
    }).format(amount);
  };

  const currentPackage = getRegisteredServicePackage();

  // Gọi API lấy danh sách người thân khi user thay đổi
  useEffect(() => {
    if (!user?.id) return;
    setLoadingRelatives(true);
    residentAPI.getByFamilyMemberId(user.id)
      .then((data) => {
        setRelatives(Array.isArray(data) ? data : []);
      })
      .catch(() => setRelatives([]))
      .finally(() => setLoadingRelatives(false));
  }, [user]);

  // useEffect fetch carePlanId nếu API trả về rỗng, đặt ở cấp component
  useEffect(() => {
    if (!showServiceModal || relatives.length === 0) return;
    const resident = relatives[selectedRelativeIndex];
    const residentId = resident?._id;
    if (
      residentId &&
      (!residentCarePlans[residentId] || residentCarePlans[residentId].length === 0) &&
      resident?.carePlanId &&
      !residentCarePlanDetail[residentId] &&
      !loadingCarePlanDetail[residentId]
    ) {
      setLoadingCarePlanDetail((prev) => ({ ...prev, [residentId]: true }));
      setCarePlanDetailError((prev) => ({ ...prev, [residentId]: null }));
      carePlansAPI.getById(resident.carePlanId)
        .then((plan) => {
          setResidentCarePlanDetail((prev) => ({ ...prev, [residentId]: plan }));
        })
        .catch((err) => {
          setCarePlanDetailError((prev) => ({ ...prev, [residentId]: 'Không thể tải gói dịch vụ cho người thân này.' }));
        })
        .finally(() => {
          setLoadingCarePlanDetail((prev) => ({ ...prev, [residentId]: false }));
        });
    }
    // eslint-disable-next-line
  }, [showServiceModal, selectedRelativeIndex, relatives, residentCarePlans, residentCarePlanDetail, loadingCarePlanDetail]);

  // State for residents list and selected resident (for staff modal)
  const [staffResidents, setStaffResidents] = useState<any[]>([]);
  const [loadingStaffResidents, setLoadingStaffResidents] = useState(false);
  const [selectedStaffResidentId, setSelectedStaffResidentId] = useState<string | null>(null);

  // Fetch residents for staff modal when modal opens
  useEffect(() => {
    if (showStaffRegisterModal) {
      setLoadingStaffResidents(true);
      residentAPI.getAll()
        .then((data) => {
          setStaffResidents(Array.isArray(data) ? data : []);
        })
        .catch(() => setStaffResidents([]))
        .finally(() => setLoadingStaffResidents(false));
    }
  }, [showStaffRegisterModal]);

  // Handler for staff confirm register
  async function handleStaffRegisterConfirm() {
    if (!selectedStaffResidentId || !selectedPackage) return;
    // 1. Lấy danh sách gói đã đăng ký của cư dân
    try {
      const carePlans = await carePlansAPI.getByResidentId(selectedStaffResidentId);
      // 2. Kiểm tra trùng gói
      const selectedPlan = carePlans.find((plan: any) => plan.planId === selectedPackage && ['active', 'pending_approval'].includes(plan.status));
      if (selectedPlan) {
        alert('Cư dân đã có gói này đang hoạt động hoặc chờ duyệt!');
        return;
      }
      // 3. Nếu hợp lệ, chuyển sang trang đăng ký
      router.push(`/services/purchase/${selectedPackage}?residentId=${selectedStaffResidentId}`);
      setShowStaffRegisterModal(false);
      setSelectedStaffResidentId(null);
    } catch (err) {
      alert('Không thể kiểm tra gói dịch vụ. Vui lòng thử lại!');
    }
  }

  // Đặt biến plans ở scope component
  const resident = relatives[selectedRelativeIndex];
  const residentId = resident?._id;
  let plans = residentId ? residentCarePlans[residentId] : [];
  if (plans && !Array.isArray(plans)) {
    plans = [plans];
  }
  const loading = residentId ? loadingResidentCarePlans[residentId] : false;
  const error = residentId ? residentCarePlansError[residentId] : null;
  if ((!plans || plans.length === 0) && resident?.carePlanId) {
    const detail = residentCarePlanDetail[residentId];
    if (detail) plans = [detail];
  }

  // Fetch chi tiết plan cho assignment nếu thiếu thông tin (đặt ngoài hàm render)
  useEffect(() => {
    (plans || []).forEach((plan: any) => {
      const planData = plan.plan || plan;
      const isAssignment = !planData.plan_name && plan.total_monthly_cost !== undefined;
      // Lấy id plan từ assignment, nếu là object thì lấy _id, nếu là string thì dùng trực tiếp
      let planId = plan.plan_id || (Array.isArray(plan.care_plan_ids) ? plan.care_plan_ids[0] : undefined);
      if (planId && typeof planId === 'object' && planId._id) planId = planId._id;
      if (isAssignment && planId && !assignmentPlanDetails[planId]) {
        carePlansAPI.getById(planId).then((detail) => {
          setAssignmentPlanDetails(prev => ({ ...prev, [planId]: detail }));
        });
      }
    });
    // eslint-disable-next-line
  }, [plans]);

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
                  return `Gói dịch vụ đã đăng ký `;
                })()}
                
                {(() => {
                  // Lọc chỉ lấy các gói active
                  const allPackages = getAllRegisteredServicePackages().filter((pkg: any) => pkg.status === 'active');
                  return (
                    <span style={{
                      position: 'absolute',
                      top: '-0.5rem',
                      right: '-0.5rem',
                      background: '#3b82f6',
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
                      {allPackages.length}
                    </span>
                  );
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

            {/* Business Rules Button for all users */}
            <button
              onClick={() => setShowBusinessRulesModal(true)}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.75rem',
                padding: '1rem 2rem',
                background: 'rgba(255, 255, 255, 0.15)',
                color: 'white',
                border: '2px solid rgba(255, 255, 255, 0.25)',
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
                e.currentTarget.style.background = 'rgba(255, 255, 255, 0.15)';
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
              Điều Khoản & Quy Định
            </button>
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
          {loadingCarePlans ? (
            <div style={{ gridColumn: '1/-1', textAlign: 'center', color: '#374151', fontSize: '1.2rem', padding: '2rem' }}>
              Đang tải danh sách gói dịch vụ...
            </div>
          ) : carePlansError ? (
            <div style={{ gridColumn: '1/-1', textAlign: 'center', color: '#dc2626', fontSize: '1.1rem', padding: '2rem' }}>
              {carePlansError}
            </div>
          ) : carePlans.length === 0 ? (
            <div style={{ gridColumn: '1/-1', textAlign: 'center', color: '#374151', fontSize: '1.1rem', padding: '2rem' }}>
              Không có gói dịch vụ nào.
            </div>
          ) : carePlans.map((pkg: any, index: number) => (
            <div
              key={pkg._id}
              style={{
                background: 'white',
                borderRadius: '20px',
                boxShadow: '0 4px 16px rgba(56,189,248,0.08)',
                border: '2px solid #5eead4',
                padding: '1.5rem 1.2rem',
                maxWidth: 340,
                margin: '0 auto',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                fontFamily: "'Inter', 'Montserrat', Arial, sans-serif",
                marginBottom: '1.2rem',
                transition: 'box-shadow 0.2s, border 0.2s',
              }}
            >
              <h2 style={{
                fontFamily: "'Montserrat', 'Inter', Arial, sans-serif",
                fontSize: '1.35rem',
                fontWeight: 700,
                color: '#22223b',
                textAlign: 'center',
                letterSpacing: '-0.5px',
                lineHeight: 1.18,
                textShadow: '0 2px 8px #e0e7ef',
                margin: 0,
                marginBottom: '0.7rem'
              }}>
                {pkg.plan_name}
              </h2>
              <div style={{
                fontFamily: "'Montserrat', 'Inter', Arial, sans-serif",
                fontSize: '1.5rem',
                fontWeight: 800,
                background: 'linear-gradient(90deg, #2563eb 0%, #7c3aed 100%)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                marginBottom: '0.5rem',
                textAlign: 'center',
                letterSpacing: '-1px',
                lineHeight: 1.1
              }}>
                {new Intl.NumberFormat('vi-VN').format(pkg.monthly_price)} <span style={{fontSize: '1rem'}}>đ</span>
              </div>
              <div style={{
                fontFamily: "'Inter', Arial, sans-serif",
                fontSize: '0.98rem',
                color: '#64748b',
                marginBottom: '1.1rem',
                textAlign: 'center',
                minHeight: 32,
                lineHeight: 1.5,
                fontWeight: 400,
                padding: 0
              }}>
                {pkg.description}
              </div>
              <div style={{ width: '100%', marginBottom: '0.7rem' }}>
                <div style={{
                  fontFamily: "'Montserrat', 'Inter', Arial, sans-serif",
                  fontWeight: 700,
                  color: '#06b6d4',
                  marginBottom: '0.5rem',
                  fontSize: '1rem',
                  letterSpacing: '-0.5px',
                  textAlign: 'left',
                }}>
                  Dịch vụ bao gồm:
                </div>
                <ul style={{
                  fontFamily: "'Inter', Arial, sans-serif",
                  padding: 0,
                  margin: 0,
                  listStyle: 'none',
                  color: '#10b981',
                  fontSize: '0.98rem',
                  textAlign: 'left',
                }}>
                  {pkg.services_included?.map((feature: string, i: number) => (
                    <li key={i} style={{
                      marginBottom: 7,
                      display: 'flex',
                      alignItems: 'center',
                      fontWeight: 500
                    }}>
                      <span style={{
                        marginRight: 7,
                        fontSize: 16,
                        color: '#22c55e',
                        flexShrink: 0
                      }}>✔</span>
                      <span style={{color: '#334155'}}>{feature}</span>
                    </li>
                  ))}
                </ul>
              </div>
              {/* Nút đăng ký cho staff */}
              {user?.role === 'staff' && (
                <button
                  onClick={() => {
                    router.push(`/services/purchase/${pkg._id}`);
                  }}
                  style={{
                    marginTop: 12,
                    padding: '0.75rem 1.5rem',
                    background: 'linear-gradient(135deg, #10b981 0%, #06b6d4 100%)',
                    color: 'white',
                    border: 'none',
                    borderRadius: 12,
                    fontWeight: 700,
                    fontSize: '1rem',
                    cursor: 'pointer',
                    boxShadow: '0 2px 8px rgba(16,185,129,0.15)',
                    transition: 'all 0.2s',
                  }}
                  onMouseEnter={(e: React.MouseEvent<HTMLButtonElement>) => {
                    e.currentTarget.style.background = 'linear-gradient(135deg, #06b6d4 0%, #10b981 100%)';
                  }}
                  onMouseLeave={(e: React.MouseEvent<HTMLButtonElement>) => {
                    e.currentTarget.style.background = 'linear-gradient(135deg, #10b981 0%, #06b6d4 100%)';
                  }}
                >
                  Đăng ký cho cư dân
                </button>
              )}
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

      {/* Business Rules Section */}
      <div style={{
        marginTop: '3rem',
        maxWidth: '1000px',
        marginLeft: 'auto',
        marginRight: 'auto',
        background: 'linear-gradient(135deg, #ffffff 0%, #f8fafc 100%)',
        borderRadius: '20px',
        boxShadow: '0 10px 40px rgba(0,0,0,0.1)',
        padding: '2.5rem',
        border: '1px solid #e2e8f0',
        fontSize: '1rem',
        color: '#374151',
        position: 'relative',
        overflow: 'hidden'
      }}>
        {/* Background decoration */}
        <div style={{
          position: 'absolute',
          top: '-50px',
          right: '-50px',
          width: '200px',
          height: '200px',
          background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
          borderRadius: '50%',
          opacity: 0.05,
          zIndex: 0
        }}></div>
        
        <div style={{
          position: 'absolute',
          bottom: '-30px',
          left: '-30px',
          width: '150px',
          height: '150px',
          background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
          borderRadius: '50%',
          opacity: 0.05,
          zIndex: 0
        }}></div>

        {/* Content */}
        <div style={{ position: 'relative', zIndex: 1 }}>
          {/* Header */}
          <div style={{
            textAlign: 'center',
            marginBottom: '2rem',
            paddingBottom: '1.5rem',
            borderBottom: '2px solid #e2e8f0'
          }}>
            
            <h3 style={{ 
              fontWeight: 700, 
              fontSize: '1.6em', 
              marginBottom: '0.5rem', 
              color: '#1e293b',
              background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              backgroundClip: 'text'
            }}>
              Quy Tắc & Điều Khoản Dịch Vụ
        </h3>
            <p style={{ 
              color: '#64748b', 
              fontSize: '1rem', 
              margin: 0,
              maxWidth: '600px',
              marginLeft: 'auto',
              marginRight: 'auto',
              lineHeight: 1.6
            }}>
              Để đảm bảo chất lượng dịch vụ tốt nhất và quyền lợi của tất cả khách hàng, 
              chúng tôi yêu cầu tuân thủ các quy tắc sau
            </p>
          </div>

          {/* Rules Grid */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
            gap: '1.5rem',
            marginBottom: '2rem'
          }}>
            {/* Rule 1 */}
            <div style={{
              background: 'linear-gradient(135deg, #f0f9ff 0%, #e0f2fe 100%)',
              border: '1px solid #0ea5e9',
              borderRadius: '16px',
              padding: '1.5rem',
              position: 'relative'
            }}>
              <div style={{
                position: 'absolute',
                top: '-10px',
                left: '20px',
                background: 'linear-gradient(135deg, #0ea5e9 0%, #0284c7 100%)',
                color: 'white',
                padding: '0.25rem 0.75rem',
                borderRadius: '20px',
                fontSize: '0.75rem',
                fontWeight: 600,
                boxShadow: '0 2px 8px rgba(14, 165, 233, 0.3)'
              }}>
                Quy tắc 1
              </div>
              <h4 style={{ 
                fontSize: '1.125rem', 
                fontWeight: 600, 
                color: '#0c4a6e', 
                margin: '0.5rem 0 1rem 0',
                display: 'flex',
                alignItems: 'center',
                gap: '8px'
              }}>
                
                Đăng ký dịch vụ
              </h4>
              <p style={{ color: '#0c4a6e', lineHeight: 1.6, margin: 0 }}>
              Mỗi người thụ hưởng có thể đăng ký đồng thời nhiều gói dịch vụ tại một thời điểm.
               Việc đăng ký được thực hiện sau khi đội ngũ nhân viên đã tư vấn kỹ lưỡng, 
               dựa trên tình trạng sức khỏe và nhu cầu cá nhân của người cao tuổi,
                nhằm đảm bảo lựa chọn phù hợp và tối ưu nhất.             </p>
            </div>

            {/* Rule 2 */}
            <div style={{
              background: 'linear-gradient(135deg, #f0fdf4 0%, #dcfce7 100%)',
              border: '1px solid #22c55e',
              borderRadius: '16px',
              padding: '1.5rem',
              position: 'relative'
            }}>
              <div style={{
                position: 'absolute',
                top: '-10px',
                left: '20px',
                background: 'linear-gradient(135deg, #22c55e 0%, #16a34a 100%)',
                color: 'white',
                padding: '0.25rem 0.75rem',
                borderRadius: '20px',
                fontSize: '0.75rem',
                fontWeight: 600,
                boxShadow: '0 2px 8px rgba(34, 197, 94, 0.3)'
              }}>
                Quy tắc 2
              </div>
              <h4 style={{ 
                fontSize: '1.125rem', 
                fontWeight: 600, 
                color: '#14532d', 
                margin: '0.5rem 0 1rem 0',
                display: 'flex',
                alignItems: 'center',
                gap: '8px'
              }}>
               
                Hủy dịch vụ
              </h4>
              <p style={{ color: '#14532d', lineHeight: 1.6, margin: 0 }}>
              Dịch vụ sẽ được hủy trực tiếp tại viện sau khi hoàn tất thủ tục. 
              Tiền đặt cọc sẽ được hoàn lại (nếu có), và quá trình bàn giao người cao tuổi sẽ được thực hiện với gia đình.
              </p>
            </div>

            {/* Rule 3 */}
            <div style={{
              background: 'linear-gradient(135deg, #fef3c7 0%, #fde68a 100%)',
              border: '1px solid #f59e0b',
              borderRadius: '16px',
              padding: '1.5rem',
              position: 'relative'
            }}>
              <div style={{
                position: 'absolute',
                top: '-10px',
                left: '20px',
                background: 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)',
                color: 'white',
                padding: '0.25rem 0.75rem',
                borderRadius: '20px',
                fontSize: '0.75rem',
                fontWeight: 600,
                boxShadow: '0 2px 8px rgba(245, 158, 11, 0.3)'
              }}>
                Quy tắc 3
              </div>
              <h4 style={{ 
                fontSize: '1.125rem', 
                fontWeight: 600, 
                color: '#92400e', 
                margin: '0.5rem 0 1rem 0',
                display: 'flex',
                alignItems: 'center',
                gap: '8px'
              }}>
                
                Hoàn tiền
              </h4>
              <p style={{ color: '#92400e', lineHeight: 1.6, margin: 0 }}>
                Khi hủy gói đã được duyệt, số tiền hoàn lại = <strong>Tiền đã trả - (Số ngày đã sử dụng × Giá gói ÷ 30)</strong>.
              </p>
            </div>

            {/* Rule 4 */}
            <div style={{
              background: 'linear-gradient(135deg, #fef2f2 0%, #fee2e2 100%)',
              border: '1px solid #ef4444',
              borderRadius: '16px',
              padding: '1.5rem',
              position: 'relative'
            }}>
              <div style={{
                position: 'absolute',
                top: '-10px',
                left: '20px',
                background: 'linear-gradient(135deg, #ef4444 0%, #dc2626 100%)',
                color: 'white',
                padding: '0.25rem 0.75rem',
                borderRadius: '20px',
                fontSize: '0.75rem',
                fontWeight: 600,
                boxShadow: '0 2px 8px rgba(239, 68, 68, 0.3)'
              }}>
                Quy tắc 4
              </div>
              <h4 style={{ 
                fontSize: '1.125rem', 
                fontWeight: 600, 
                color: '#7f1d1d', 
                margin: '0.5rem 0 1rem 0',
                display: 'flex',
                alignItems: 'center',
                gap: '8px'
              }}>
               
                Lưu ý quan trọng
              </h4>
              <p style={{ color: '#7f1d1d', lineHeight: 1.6, margin: 0 }}>
              Thông tin đăng ký cần được cung cấp một cách đầy đủ và chính xác. Việc hủy gói dịch vụ sẽ dẫn đến việc chấm dứt ngay lập tức toàn bộ các dịch vụ chăm sóc đang được triển khai.             </p>
            </div>
          </div>

          {/* Additional Information */}
          <div style={{
            background: 'linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%)',
            border: '1px solid #cbd5e1',
            borderRadius: '16px',
            padding: '1.5rem',
            marginBottom: '2rem'
          }}>
            <h4 style={{ 
              fontSize: '1.125rem', 
              fontWeight: 600, 
              color: '#475569', 
              marginBottom: '1rem',
              display: 'flex',
              alignItems: 'center',
              gap: '8px'
            }}>
              <svg style={{ width: '20px', height: '20px' }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              Thông tin bổ sung & Cam kết dịch vụ
            </h4>
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
              gap: '1rem',
              fontSize: '0.875rem',
              color: '#64748b'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <div style={{ width: '8px', height: '8px', background: '#3b82f6', borderRadius: '50%' }}></div>
                <span><strong>Thời gian xử lý:</strong> 1-3 ngày làm việc</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <div style={{ width: '8px', height: '8px', background: '#10b981', borderRadius: '50%' }}></div>
                <span><strong>Hoàn tiền:</strong> 5-7 ngày làm việc</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <div style={{ width: '8px', height: '8px', background: '#f59e0b', borderRadius: '50%' }}></div>
                <span><strong>Hỗ trợ:</strong> 24/7 qua hotline</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <div style={{ width: '8px', height: '8px', background: '#ef4444', borderRadius: '50%' }}></div>
                <span><strong>Bảo mật:</strong> Thông tin tuyệt đối</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <div style={{ width: '8px', height: '8px', background: '#8b5cf6', borderRadius: '50%' }}></div>
                <span><strong>Chất lượng:</strong> ISO 9001:2015</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <div style={{ width: '8px', height: '8px', background: '#06b6d4', borderRadius: '50%' }}></div>
                <span><strong>Đội ngũ:</strong> Chuyên gia y tế</span>
              </div>
            </div>
          </div>
          
          {/* CTA Button */}
          <div style={{
            textAlign: 'center',
            padding: '2rem',
            background: 'linear-gradient(135deg, #f0f9ff 0%, #e0f2fe 100%)',
            borderRadius: '20px',
            border: '2px solid #0ea5e9',
            position: 'relative',
            overflow: 'hidden'
          }}>
            <div style={{
              position: 'absolute',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              background: 'linear-gradient(135deg, rgba(14, 165, 233, 0.1) 0%, rgba(2, 132, 199, 0.1) 100%)',
              zIndex: 0
            }}></div>
            <div style={{ position: 'relative', zIndex: 1 }}>
              <div style={{
                width: '50px',
                height: '50px',
                background: 'linear-gradient(135deg, #0ea5e9 0%, #0284c7 100%)',
                borderRadius: '50%',
                margin: '0 auto 1rem',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                boxShadow: '0 4px 15px rgba(14, 165, 233, 0.3)'
              }}>
                <svg style={{ width: '24px', height: '24px', color: 'white' }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
              </div>
              <h4 style={{ 
                color: '#0c4a6e', 
                fontSize: '1.25rem', 
                fontWeight: 600, 
                marginBottom: '0.5rem',
                margin: 0
              }}>
                 Điều Khoản & Quy Định Chi Tiết
              </h4>
              <p style={{ 
                color: '#0c4a6e', 
                fontSize: '0.95rem', 
                marginBottom: '1.8rem',
                margin: 0,
                opacity: 0.8
              }}>
                Tìm hiểu đầy đủ các điều khoản, quy định và cam kết dịch vụ của chúng tôi
              </p>
              <button
                onClick={() => setShowBusinessRulesModal(true)}
                style={{
                  background: 'linear-gradient(135deg, #ffffff 0%, #f8fafc 100%)',
                  color: '#0c4a6e',
                  border: '2px solid #e0f2fe',
                  borderRadius: '16px',
                  padding: '0.875rem 1.75rem',
                  fontWeight: 600,
                  cursor: 'pointer',
                  transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '10px',
                  fontSize: '0.95rem',
                  boxShadow: '0 2px 8px rgba(14, 165, 233, 0.15)',
                  position: 'relative',
                  overflow: 'hidden',
                  backdropFilter: 'blur(10px)',
                  letterSpacing: '0.025em'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.transform = 'translateY(-1px)';
                  e.currentTarget.style.boxShadow = '0 4px 16px rgba(14, 165, 233, 0.25)';
                  e.currentTarget.style.background = 'linear-gradient(135deg, #0ea5e9 0%, #0284c7 100%)';
                  e.currentTarget.style.color = 'white';
                  e.currentTarget.style.borderColor = '#0ea5e9';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.transform = 'translateY(0)';
                  e.currentTarget.style.boxShadow = '0 2px 8px rgba(14, 165, 233, 0.15)';
                  e.currentTarget.style.background = 'linear-gradient(135deg, #ffffff 0%, #f8fafc 100%)';
                  e.currentTarget.style.color = '#0c4a6e';
                  e.currentTarget.style.borderColor = '#e0f2fe';
                }}
              >
                <DocumentPlusIcon style={{ width: '18px', height: '18px' }} />
                Xem Chi Tiết
                <svg style={{ width: '14px', height: '14px', opacity: 0.8 }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 5l7 7-7 7" />
                </svg>
              </button>
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
          zIndex: 50,
          marginLeft: '210px',
        }}>
          <div style={{
            backgroundColor: 'white',
            borderRadius: '16px',
            width: '99%',
            maxWidth: '1150px',
            maxHeight: '98vh',
            boxShadow: '0 10px 32px rgba(0, 0, 0, 0.18)',
            border: '1.5px solid #e0e7ef',
            padding: 0,
            overflowY: 'auto',
            marginLeft: '5rem',
          }}>
            {/* Header */}
            <div style={{
              padding: '1.5rem',
              borderBottom: '1px solid #e5e7eb',
              background: 'linear-gradient(135deg, #eff6ff 0%, #dbeafe 100%)',
              borderRadius: '16px 16px 0 0',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between'
            }}>
              <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: '12px'
              }}>
                <div style={{
                  width: '50px',
                  height: '50px',
                  background: 'linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%)',
                  borderRadius: '12px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  boxShadow: '0 2px 8px rgba(59, 130, 246, 0.3)'
                }}>
                  <svg style={{ width: '26px', height: '26px', color: 'white' }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                </div>
                <div>
                  <h3 style={{ fontSize: '1.4rem', fontWeight: 700, color: '#1e40af', margin: 0 }}>
                    Gói dịch vụ đã đăng ký
                  </h3>
                  <p style={{ fontSize: '1rem', color: '#64748b', margin: 0 }}>
                    Thông tin chi tiết về gói dịch vụ đang sử dụng
                  </p>
                </div>
              </div>
              <button
                onClick={() => setShowServiceModal(false)}
                title="Đóng"
                style={{
                  background: 'rgba(255,255,255,0.8)',
                  border: '1px solid #e2e8f0',
                  borderRadius: '8px',
                  width: '40px',
                  height: '40px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  cursor: 'pointer',
                  color: '#64748b',
                  transition: 'all 0.2s ease'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = '#f1f5f9';
                  e.currentTarget.style.color = '#1e293b';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = 'rgba(255,255,255,0.8)';
                  e.currentTarget.style.color = '#64748b';
                }}
              >
                <XMarkIcon style={{ width: '20px', height: '20px' }} />
              </button>
            </div>

            

            {/* Resident selector only, status filter removed */}
            <div style={{
              padding: '1.5rem',
              borderBottom: '1px solid #f1f5f9',
              background: 'linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%)'
            }}>
              {relatives.length > 1 && (
                <>
                  <label style={{ 
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                    fontSize: '0.875rem',
                    fontWeight: 600,
                    color: '#475569',
                    marginBottom: '0.75rem',
                  }}>
                    <svg style={{ width: '16px', height: '16px', color: '#3b82f6' }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-1H21m0 0l-3 3m3-3l-3-3" />
                    </svg>
                    <span style={{ fontSize: '1rem' }}>Chọn người thân:</span>
                  </label>
                  <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
                    {relatives.map((relative: any, index: number) => (
                      <button
                        key={relative._id || index}
                        onClick={() => setSelectedRelativeIndex(index)}
                        style={{
                          padding: '0.75rem 1rem',
                          borderRadius: '12px',
                          border: selectedRelativeIndex === index ? '2px solid #3b82f6' : '2px solid #e2e8f0',
                          background: selectedRelativeIndex === index ? 'linear-gradient(135deg, #eff6ff 0%, #dbeafe 100%)' : 'white',
                          color: selectedRelativeIndex === index ? '#1e40af' : '#64748b',
                          fontWeight: 500,
                          fontSize: '0.875rem',
                          cursor: 'pointer',
                          transition: 'all 0.2s ease',
                          transform: selectedRelativeIndex === index ? 'scale(1.02)' : 'scale(1)',
                          boxShadow: selectedRelativeIndex === index ? '0 4px 12px rgba(59, 130, 246, 0.2)' : '0 2px 4px rgba(0,0,0,0.1)'
                        }}
                        onMouseEnter={(e) => {
                          if (selectedRelativeIndex !== index) {
                            e.currentTarget.style.transform = 'scale(1.02)';
                            e.currentTarget.style.boxShadow = '0 4px 12px rgba(0,0,0,0.15)';
                          }
                        }}
                        onMouseLeave={(e) => {
                          if (selectedRelativeIndex !== index) {
                            e.currentTarget.style.transform = 'scale(1)';
                            e.currentTarget.style.boxShadow = '0 2px 4px rgba(0,0,0,0.1)';
                          }
                        }}
                      >
                        {relative.name || relative.full_name || `Người thân ${index + 1}`}
                      </button>
                    ))}
                  </div>
                </>
              )}
            </div>

            {/* Nội dung chi tiết */}
                          {(() => {
              const resident = relatives[selectedRelativeIndex];
              const residentId = resident?._id;
              let plans = residentId ? residentCarePlans[residentId] : [];
              // Nếu là object, chuyển thành mảng
              if (plans && !Array.isArray(plans)) {
                plans = [plans];
              }
              const loading = residentId ? loadingResidentCarePlans[residentId] : false;
              const error = residentId ? residentCarePlansError[residentId] : null;
              // Nếu plans rỗng, thử lấy carePlanId từ resident
              if ((!plans || plans.length === 0) && resident?.carePlanId) {
                const detail = residentCarePlanDetail[residentId];
                if (detail) plans = [detail];
              }
              const loadingDetail = residentId ? loadingCarePlanDetail[residentId] : false;
              const errorDetail = residentId ? carePlanDetailError[residentId] : null;
              // Nếu plans vẫn rỗng và có carePlanId, fetch chi tiết care plan
              console.log('Plans to render:', plans); // Thêm log này

              if (loading) {
                return <div style={{ padding: '3rem 2rem', textAlign: 'center' }}>Đang tải gói dịch vụ...</div>;
              }
              if (error) {
                return <div style={{ padding: '3rem 2rem', textAlign: 'center', color: '#dc2626' }}>{error}</div>;
              }
              if (!plans || !Array.isArray(plans) || plans.length === 0) {
                  return (
                    <div style={{ padding: '3rem 2rem', textAlign: 'center' }}>
                      <div style={{ marginBottom: '1.5rem' }}>
                        <div style={{
                          width: '64px',
                          height: '64px',
                          background: 'linear-gradient(135deg, #f1f5f9 0%, #e2e8f0 100%)',
                          borderRadius: '50%',
                          margin: '0 auto 1rem',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center'
                        }}>
                          <svg style={{ width: '32px', height: '32px', color: '#94a3b8' }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                          </svg>
                        </div>
                            <h3 style={{ fontSize: '1.125rem', fontWeight: 600, color: '#1f2937', marginBottom: '0.5rem' }}>
                              Chưa có gói dịch vụ
                            </h3>
                            <p style={{ color: '#6b7280', maxWidth: '400px', margin: '0 auto', lineHeight: 1.6 }}>
                        Hiện tại chưa có gói dịch vụ nào được đăng ký cho người thân này.
                      </p>
                      </div>
                      <button
                        onClick={() => setShowServiceModal(false)}
                        style={{
                          background: 'linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%)',
                          color: 'white',
                          fontWeight: 600,
                          padding: '0.75rem 2rem',
                          borderRadius: '12px',
                          border: 'none',
                          cursor: 'pointer',
                          transition: 'all 0.2s ease',
                          boxShadow: '0 4px 12px rgba(59, 130, 246, 0.3)'
                        }}
                        onMouseEnter={(e) => {
                          e.currentTarget.style.transform = 'translateY(-2px)';
                          e.currentTarget.style.boxShadow = '0 8px 20px rgba(59, 130, 246, 0.4)';
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.transform = 'translateY(0)';
                          e.currentTarget.style.boxShadow = '0 4px 12px rgba(59, 130, 246, 0.3)';
                        }}
                      >
                        Đóng
                      </button>
                    </div>
                  );
              }
              // Show all care plans for this resident
                return (
                <div style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '2rem' }}>
                  {plans.map((assignment: any, idx: number) => (
                    <div
                      key={assignment._id || idx}
                      style={{
                        background: 'linear-gradient(135deg, #f0f9ff 0%, #e0eafc 100%)',
                        borderRadius: 20,
                        padding: 32,
                        marginBottom: 36,
                        boxShadow: '0 8px 32px rgba(59,130,246,0.10)',
                        border: '1.5px solid #e0e7ef',
                        maxWidth: 800,
                        margin: '0 auto'
                      }}
                    >
                      {/* Header */}
                      <div style={{ display: 'flex', alignItems: 'center', marginBottom: 24 }}>
                        <div style={{
                          background: 'linear-gradient(135deg, #3b82f6 0%, #6366f1 100%)',
                          borderRadius: '50%',
                          width: 56,
                          height: 56,
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          color: 'white',
                          fontSize: 28,
                          marginRight: 20,
                          boxShadow: '0 2px 8px rgba(59,130,246,0.15)'
                        }}>
                          <svg width="32" height="32" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                          </svg>
                      </div>
                        <div>
                          <div style={{ fontWeight: 700, fontSize: '1.5rem', color: '#1e293b', marginBottom: 2 }}>
                            {assignment.resident_id?.full_name}
                          </div>
                          <div style={{ color: '#64748b', fontSize: '1rem' }}>
                            Người giám hộ: <b>{assignment.family_member_id?.full_name}</b>
                          </div>
                        </div>
                      </div>

                      {/* Tổng quan */}
                      <div style={{
                          display: 'grid',
                        gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
                        gap: '1.5rem',
                        marginBottom: 24
                      }}>
                        <div>
                          <div style={{ color: '#64748b', fontWeight: 500 }}>Ngày đăng ký</div>
                          <div style={{ fontWeight: 600 }}>{assignment.registration_date ? new Date(assignment.registration_date).toLocaleDateString('vi-VN') : '---'}</div>
                        </div>
                        <div>
                          <div style={{ color: '#64748b', fontWeight: 500 }}>Ngày bắt đầu</div>
                          <div style={{ fontWeight: 600 }}>{assignment.start_date ? new Date(assignment.start_date).toLocaleDateString('vi-VN') : '---'}</div>
                        </div>
                        <div>
                          <div style={{ color: '#64748b', fontWeight: 500 }}>Trạng thái</div>
                          <div style={{
                            fontWeight: 700,
                            color: assignment.status === 'active' ? '#10b981' : '#f59e42',
                            textTransform: 'capitalize'
                          }}>
                            {assignment.status === 'active' ? 'Đang sử dụng' : (assignment.status || '---')}
                          </div>
                        </div>
                      </div>

                      {/* Các gói dịch vụ */}
                      <div style={{ marginBottom: 18 }}>
                        <div style={{ fontWeight: 700, color: '#1d4ed8', fontSize: '1.15rem', marginBottom: 8 }}>
                          Các gói dịch vụ đã đăng ký:
                        </div>
                        <div style={{
                          display: 'flex',
                          flexWrap: 'wrap',
                          gap: '1.2rem'
                        }}>
                          {Array.isArray(assignment.care_plan_ids) && assignment.care_plan_ids.length > 0 ? (
                            assignment.care_plan_ids.map((plan: any, i: number) => (
                              <div key={plan._id || i} style={{
                                background: 'white',
                                borderRadius: 14,
                                boxShadow: '0 2px 8px rgba(59,130,246,0.08)',
                                padding: '1.1rem 1.5rem',
                                minWidth: 220,
                                marginBottom: 8,
                                border: '1px solid #e0e7ef'
                              }}>
                                <div style={{ fontWeight: 700, color: '#0c4a6e', fontSize: '1.1rem', marginBottom: 4 }}>{plan.plan_name}</div>
                                <div style={{ color: '#1d4ed8', fontWeight: 600, fontSize: '1rem', marginBottom: 2 }}>
                                  Giá: {typeof plan.monthly_price === 'number' ? formatCurrency(plan.monthly_price) : '---'}
                                </div>
                              </div>
                            ))
                          ) : (
                            <div>Không có gói dịch vụ nào</div>
                          )}
                        </div>
                      </div>

                      {/* Thông tin bổ sung */}
                      {Array.isArray(assignment.additional_medications) && assignment.additional_medications.length > 0 && (
                        <div style={{
                          background: '#fef2f2',
                          border: '1px solid #fecaca',
                          borderRadius: 10,
                          padding: '0.75rem 1.25rem',
                          color: '#b91c1c',
                          fontWeight: 500,
                          marginTop: 16
                        }}>
                          <b>Thuốc bổ sung:</b>
                          <ul style={{ margin: 0, paddingLeft: 18 }}>
                            {assignment.additional_medications.map((med: any) => (
                              <li key={med._id}>{med.medication_name} - {med.dosage} - {med.frequency}</li>
                          ))}
                        </ul>
                        </div>
                      )}
                      </div>
                  ))}
                  </div>
                );
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
                            {pkg.type === 'cancellation' ? 'Yêu cầu hủy gói dịch vụ' : pkg.name}
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
                            {pkg.type === 'cancellation' && (
                              <div><strong>Loại yêu cầu:</strong> <span style={{ color: '#dc2626', fontWeight: 600 }}>Hủy gói dịch vụ</span></div>
                            )}
                          </div>
                        </div>
                        <div style={{
                          background: pkg.type === 'cancellation' ? '#fef3c7' : '#fef3c7',
                          border: pkg.type === 'cancellation' ? '1px solid #f59e0b' : '1px solid #fbbf24',
                          borderRadius: '1rem',
                          padding: '0.5rem 1.25rem',
                          fontSize: '0.95rem',
                          fontWeight: 600,
                          color: pkg.type === 'cancellation' ? '#92400e' : '#92400e',
                          marginLeft: 16,
                          minWidth: 120,
                          textAlign: 'center'
                        }}>
                          {pkg.type === 'cancellation' ? 'CHỜ DUYỆT HỦY' : 'CHỜ DUYỆT'}
                        </div>
                      </div>
                      
                      {/* Thông tin chi tiết */}
                      {pkg.type === 'cancellation' ? (
                        // Hiển thị thông tin yêu cầu hủy
                        <div style={{
                          background: '#fef2f2',
                          border: '1px solid #fecaca',
                          borderRadius: '0.75rem',
                          padding: '1.25rem',
                          marginBottom: '1.5rem',
                          color: '#dc2626'
                        }}>
                          <div style={{ fontWeight: 600, marginBottom: 8 }}>Thông tin yêu cầu hủy</div>
                          <div style={{ fontSize: '1rem', lineHeight: 1.6 }}>
                            <div>Lý do hủy: <span style={{ fontWeight: 500 }}>{pkg.cancellationRequest.reason}</span></div>
                            <div>Ngày yêu cầu: <strong>{new Date(pkg.cancellationRequest.requestedDate).toLocaleDateString('vi-VN')}</strong></div>
                            <div>Người yêu cầu: <strong>{pkg.cancellationRequest.requestedBy}</strong></div>
                          </div>
                        </div>
                      ) : (
                        // Hiển thị thông tin đăng ký gói dịch vụ
                        <>
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
                        </>
                      )}
                      
                      {/* Action Buttons */}
                      <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'flex-end', paddingTop: '1.5rem', borderTop: '1px solid #e5e7eb', marginTop: '2rem' }}>
                        <button
                          onClick={() => pkg.type === 'cancellation' ? undefined : handleRejectPackage(pkg.registrationId)}
                          disabled={pkg.type === 'cancellation'}
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
                          onClick={() => pkg.type === 'cancellation' ? undefined : handleApprovePackage(pkg.registrationId)}
                          disabled={pkg.type === 'cancellation'}
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
                          {pkg.type === 'cancellation' ? 'Duyệt hủy' : 'Duyệt'}
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
            
            {/* Footer */}
            <div style={{ 
              padding: '0.75rem 1.5rem', 
              background: '#f9fafb', 
              borderRadius: '0 0 1rem 1rem', 
              borderTop: '1px solid #e5e7eb', 
              display: 'flex', 
              justifyContent: 'flex-end' 
            }}>
              <button
                onClick={() => {
                  setShowApprovalModal(false);
                  loadPendingPackages(); 
                }}
                style={{
                  padding: '0.375rem 1rem',
                  borderRadius: '0.375rem',
                  border: '1px solid #d1d5db',
                  backgroundColor: 'white',
                  color: '#374151',
                  cursor: 'pointer',
                  fontWeight: 500,
                  fontSize: '0.875rem',
                  transition: 'all 0.2s ease'
                }}
                onMouseEnter={(e) => {
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

      {/* Business Rules Modal */}
      {showBusinessRulesModal && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          width: '100vw',
          height: '100vh',
          background: 'rgba(0, 0, 0, 0.8)',
          zIndex: 9999,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          transition: 'all 0.2s',
          marginLeft: '9rem',
        }}>
          <div style={{
            background: 'white',
            borderRadius: 20,
            boxShadow: '0 20px 60px rgba(0,0,0,0.3)',
            width: '95%',
            maxWidth: '1050px',
            maxHeight: '100vh',
            overflow: 'hidden',
            position: 'relative',
          }}>
            {/* Header */}
            <div style={{
              background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
              color: 'white',
              padding: '2rem',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              borderBottom: '1px solid rgba(255,255,255,0.1)'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                <div style={{
                  background: 'rgba(255,255,255,0.2)',
                  borderRadius: '12px',
                  padding: '0.75rem',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}>
                  <DocumentPlusIcon style={{ width: '2rem', height: '2rem', color: 'white' }} />
                </div>
                <div>
                  <h2 style={{ fontSize: '1.75rem', fontWeight: 700, margin: 0, marginBottom: '0.5rem' }}>
                     Điều Khoản & Quy Định Dịch Vụ
                  </h2>
                  <p style={{ margin: 0, opacity: 0.9, fontSize: '1rem' }}>
                    Thông tin chi tiết về các điều khoản và quy định khi sử dụng dịch vụ
                  </p>
                </div>
              </div>
              <button
                onClick={() => setShowBusinessRulesModal(false)}
                title="Đóng"
                style={{
                  background: 'rgba(255,255,255,0.2)',
                  border: 'none',
                  borderRadius: '50%',
                  width: '3rem',
                  height: '3rem',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  cursor: 'pointer',
                  color: 'white',
                  fontSize: '1.5rem',
                  transition: 'all 0.2s'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = 'rgba(255,255,255,0.3)';
                  e.currentTarget.style.transform = 'scale(1.1)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = 'rgba(255,255,255,0.2)';
                  e.currentTarget.style.transform = 'scale(1)';
                }}
              >
                <XMarkIcon style={{ width: '1.5rem', height: '1.5rem' }} />
              </button>
            </div>

            {/* Content */}
            <div style={{ 
              padding: '2rem', 
              maxHeight: 'calc(90vh - 140px)', 
              overflowY: 'auto',
              background: 'linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%)'
            }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
                {termsData.map((term, index) => (
                  <div key={term.id} style={{
                    background: 'white',
                    borderRadius: 16,
                    padding: '2rem',
                    boxShadow: '0 4px 20px rgba(0,0,0,0.08)',
                    border: '1px solid #e2e8f0',
                    transition: 'all 0.3s ease'
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.transform = 'translateY(-4px)';
                    e.currentTarget.style.boxShadow = '0 8px 30px rgba(0,0,0,0.12)';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.transform = 'translateY(0)';
                    e.currentTarget.style.boxShadow = '0 4px 20px rgba(0,0,0,0.08)';
                  }}
                  >
                    {/* Term Header */}
                    <div style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '1rem',
                      marginBottom: '1.5rem',
                      paddingBottom: '1rem',
                      borderBottom: '2px solid #f1f5f9'
                    }}>
                      <div style={{
                        width: '3rem',
                        height: '3rem',
                        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                        borderRadius: '50%',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        color: 'white',
                        fontSize: '1.25rem',
                        fontWeight: 700,
                        boxShadow: '0 4px 12px rgba(102, 126, 234, 0.3)'
                      }}>
                        {index + 1}
                      </div>
                      <div>
                        <h3 style={{
                          fontSize: '1.5rem',
                          fontWeight: 700,
                          color: '#1e293b',
                          margin: 0,
                          marginBottom: '0.25rem'
                        }}>
                          {term.title}
                        </h3>
                        <div style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: '0.5rem',
                          fontSize: '0.875rem',
                          color: '#dc2626'
                        }}>
                          <svg style={{ width: '1rem', height: '1rem' }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12c0 4.97-4.03 9-9 9s-9-4.03-9-9 4.03-9 9-9 9z" />
                          </svg>
                          Quy định quan trọng
                        </div>
                      </div>
                    </div>

                    {/* Term Content */}
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                      {term.content.map((item, itemIndex) => (
                        <div key={itemIndex} style={{
                          background: 'linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%)',
                          borderRadius: 12,
                          padding: '1.5rem',
                          border: '1px solid #e2e8f0',
                          position: 'relative'
                        }}>
                          <div style={{
                            position: 'absolute',
                            top: '-0.5rem',
                            left: '1rem',
                            background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                            color: 'white',
                            padding: '0.25rem 0.75rem',
                            borderRadius: '20px',
                            fontSize: '0.75rem',
                            fontWeight: 600,
                            boxShadow: '0 2px 8px rgba(102, 126, 234, 0.3)'
                          }}>
                            {itemIndex + 1}
                          </div>
                          <h4 style={{
                            fontSize: '1.125rem',
                            fontWeight: 600,
                            color: '#1e293b',
                            margin: '0.5rem 0 1rem 0'
                          }}>
                            {item.subtitle}
                          </h4>
                          <p style={{
                            fontSize: '1rem',
                            color: '#475569',
                            lineHeight: 1.7,
                            margin: 0,
                            textAlign: 'justify'
                          }}>
                            {item.text}
                          </p>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>

              {/* Footer Note */}
              <div style={{
                background: 'linear-gradient(135deg, #fef3c7 0%, #fde68a 100%)',
                border: '1px solid #f59e0b',
                borderRadius: 16,
                padding: '1.5rem',
                marginTop: '2rem',
                textAlign: 'center'
              }}>
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '0.75rem',
                  marginBottom: '1rem'
                }}>
                  <svg style={{ width: '1.5rem', height: '1.5rem', color: '#dc2626' }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12c0 4.97-4.03 9-9 9s-9-4.03-9-9 4.03-9 9-9 9z" />
                  </svg>
                  <h4 style={{ fontSize: '1.125rem', fontWeight: 600, color: '#dc2626', margin: 0 }}>
                    Lưu ý quan trọng
                  </h4>
                </div>
                <p style={{
                  fontSize: '1rem',
                  color: '#92400e',
                  margin: 0,
                  lineHeight: 1.6
                }}>
                  Việc đăng ký và sử dụng dịch vụ đồng nghĩa với việc bạn đã đọc, hiểu và đồng ý tuân thủ tất cả các quy định trên. 
                  Mọi thắc mắc vui lòng liên hệ bộ phận hỗ trợ để được tư vấn chi tiết.
                </p>
              </div>
            </div>

            {/* Footer */}
            <div style={{
              padding: '1.5rem 2rem',
              background: 'white',
              borderTop: '1px solid #e2e8f0',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center'
            }}>
              <button
                onClick={() => setShowBusinessRulesModal(false)}
                style={{
                  padding: '0.75rem 2rem',
                  background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                  color: 'white',
                  border: 'none',
                  borderRadius: 12,
                  fontSize: '1rem',
                  fontWeight: 600,
                  cursor: 'pointer',
                  transition: 'all 0.2s',
                  boxShadow: '0 4px 12px rgba(102, 126, 234, 0.3)',
                  marginLeft: '23rem'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.transform = 'translateY(-2px)';
                  e.currentTarget.style.boxShadow = '0 8px 20px rgba(102, 126, 234, 0.4)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.transform = 'translateY(0)';
                  e.currentTarget.style.boxShadow = '0 4px 12px rgba(102, 126, 234, 0.3)';
                }}
              >
                Đã hiểu và đồng ý
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Staff Register Modal */}
      {showStaffRegisterModal && (
        <div style={{
          position: 'fixed',
          top: 0, left: 0, right: 0, bottom: 0,
          background: 'rgba(0,0,0,0.5)',
          zIndex: 1000,
          display: 'flex', alignItems: 'center', justifyContent: 'center'
        }}>
          <div style={{
            background: 'white',
            borderRadius: 16,
            maxWidth: 420,
            width: '95%',
            padding: '2rem',
            boxShadow: '0 8px 32px rgba(0,0,0,0.18)',
            position: 'relative'
          }}>
            <h3 style={{ fontWeight: 700, fontSize: '1.25rem', marginBottom: 16 }}>Chọn cư dân để đăng ký gói dịch vụ</h3>
            {loadingStaffResidents ? (
              <div>Đang tải danh sách cư dân...</div>
            ) : staffResidents.length === 0 ? (
              <div>Không có cư dân nào.</div>
            ) : (
              <select
                value={selectedStaffResidentId || ''}
                onChange={e => setSelectedStaffResidentId(e.target.value)}
                style={{ width: '100%', padding: '0.75rem', borderRadius: 8, border: '1px solid #d1d5db', marginBottom: 20 }}
              >
                <option value=''>-- Chọn cư dân --</option>
                {staffResidents.map(r => (
                  <option key={r._id} value={r._id}>{r.fullName || r.name} - Phòng: {r.room || ''}</option>
                ))}
              </select>
            )}
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 12 }}>
              <button
                onClick={() => {
                  setShowStaffRegisterModal(false);
                  setSelectedStaffResidentId(null);
                }}
                style={{ padding: '0.5rem 1.2rem', borderRadius: 8, border: '1px solid #d1d5db', background: 'white', color: '#374151', fontWeight: 500, cursor: 'pointer' }}
              >
                Hủy
              </button>
              <button
                disabled={!selectedStaffResidentId}
                onClick={handleStaffRegisterConfirm}
                style={{ padding: '0.5rem 1.2rem', borderRadius: 8, border: 'none', background: '#10b981', color: 'white', fontWeight: 700, cursor: selectedStaffResidentId ? 'pointer' : 'not-allowed' }}
              >
                Xác nhận
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
} 
