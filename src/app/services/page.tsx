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
  const [showCancelSuccessModal, setShowCancelSuccessModal] = useState(false);
  const [showCancelConfirmModal, setShowCancelConfirmModal] = useState(false);
  const [showBusinessRulesModal, setShowBusinessRulesModal] = useState(false);
  
  // New state for filtering packages by status
  const [packageStatusFilter, setPackageStatusFilter] = useState<string>('all');
  
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
                residentId: r.id,
                residentAge: r.age,
                residentRoom: r.room
              };
            } else if (r.carePackage.cancellationRequest) {
              return {
                ...r.carePackage,
                type: 'cancellation',
                cancellationRequest: r.carePackage.cancellationRequest,
                residentName: r.name,
                residentId: r.id,
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

  // Handle cancellation requests
  const handleCancelPackage = (registrationId: string, reason?: string) => {
    try {
      const savedResidents = localStorage.getItem('nurseryHomeResidents');
      if (savedResidents) {
        const residents = JSON.parse(savedResidents);
        const updatedResidents = (residents as any[]).map((r: any) => {
          if (r.carePackage && r.carePackage.registrationId === registrationId) {
            const currentPackage = r.carePackage;
            
            // If package is pending approval, cancel directly
            if (currentPackage.status === 'pending_approval') {
              return {
                ...r,
                carePackage: {
                  ...currentPackage,
                  status: 'cancelled',
                  cancelledDate: new Date().toISOString(),
                  cancelledBy: 'Người dùng',
                  cancellationReason: reason || 'Người dùng hủy'
                }
              };
            }
            
            // If package is active, create cancellation request
            if (currentPackage.status === 'active') {
              return {
                ...r,
                carePackage: {
                  ...currentPackage,
                  cancellationRequest: {
                    requestedDate: new Date().toISOString(),
                    requestedBy: 'Người dùng',
                    reason: reason || 'Người dùng yêu cầu hủy',
                    status: 'pending_approval'
                  }
                }
              };
            }
          }
          return r;
        });
        
        localStorage.setItem('nurseryHomeResidents', JSON.stringify(updatedResidents));
        loadPendingPackages(); // Reload pending packages
      }
    } catch (error) {
      console.error('Error cancelling package:', error);
      alert('❌ Có lỗi xảy ra khi hủy gói dịch vụ!');
    }
  };

  // Handle approve/reject cancellation requests
  const handleApproveCancellation = (registrationId: string) => {
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
                status: 'cancelled',
                cancelledDate: new Date().toISOString(),
                cancelledBy: 'Quản trị viên',
                cancellationRequest: {
                  ...r.carePackage.cancellationRequest,
                  status: 'approved',
                  approvedDate: new Date().toISOString(),
                  approvedBy: 'Quản trị viên'
                }
              }
            };
          }
          return r;
        });
        
        localStorage.setItem('nurseryHomeResidents', JSON.stringify(updatedResidents));
        loadPendingPackages(); // Reload pending packages
        alert(' Đã duyệt yêu cầu hủy gói dịch vụ thành công!');
      }
    } catch (error) {
      console.error('Error approving cancellation:', error);
      alert('Có lỗi xảy ra khi duyệt yêu cầu hủy!');
    }
  };

  const handleRejectCancellation = (registrationId: string) => {
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
                cancellationRequest: {
                  ...r.carePackage.cancellationRequest,
                  status: 'rejected',
                  rejectedDate: new Date().toISOString(),
                  rejectedBy: 'Quản trị viên',
                  rejectionReason: 'Đã từ chối yêu cầu hủy'
                }
              }
            };
          }
          return r;
        });
        
        localStorage.setItem('nurseryHomeResidents', JSON.stringify(updatedResidents));
        loadPendingPackages(); // Reload pending packages
        alert(' Đã từ chối yêu cầu hủy gói dịch vụ!');
      }
    } catch (error) {
      console.error('Error rejecting cancellation:', error);
      alert('Có lỗi xảy ra khi từ chối yêu cầu hủy!');
    }
  };

  // Hide header when modals are open
  useEffect(() => {
    if (showServiceModal || showApprovalModal || showCancelConfirmModal || showCancelSuccessModal || showBusinessRulesModal) {
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
  }, [showServiceModal, showApprovalModal, showCancelConfirmModal, showCancelSuccessModal, showBusinessRulesModal]);

  const handlePackageSelect = (packageId: number) => {
    if (!user) {
      router.push('/login');
      return;
    }

    // Check if user already has a registered or pending package of this type
    const existingPackages = getAllRegisteredServicePackages() || [];
    const packageToSelect = carePackages.find(p => p.id === packageId);
    
    if (!packageToSelect) {
      return;
    }
    
    // Check for existing packages of the same type
    const alreadyRegistered = existingPackages.some(pkg => 
      pkg.packageType === packageToSelect.name && 
      ['active', 'pending_approval'].includes(pkg.status)
    );
    
    if (alreadyRegistered) {
      const confirmContinue = window.confirm(
        `Bạn đã đăng ký gói "${packageToSelect.name}" trước đó và đang chờ duyệt hoặc đang sử dụng. Bạn có chắc muốn tiếp tục đăng ký gói này không?`
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
          packages = packages.filter(pkg => pkg.status === statusFilter);
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
          packages = packages.filter(pkg => pkg.status === statusFilter);
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
                  const allPackages = getAllRegisteredServicePackages();
                  // Chỉ hiển thị badge tổng số nếu có nhiều hơn 1 gói, KHÔNG hiển thị badge màu cam cho pending nữa
                  if (allPackages.length > 1) {
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
                Mỗi người thụ hưởng chỉ được đăng ký <strong>một gói dịch vụ</strong> tại một thời điểm. 
                Gói dịch vụ sau khi đăng ký sẽ chờ quản trị viên phê duyệt trước khi có hiệu lực.
              </p>
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
                Có thể <strong>hủy trực tiếp</strong> khi trạng thái "Chờ duyệt". 
                Sau khi đã được duyệt, việc hủy cần gửi yêu cầu và chờ quản trị viên xử lý.
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
                Thông tin đăng ký phải <strong>chính xác</strong>. Việc hủy gói sẽ chấm dứt ngay lập tức tất cả dịch vụ chăm sóc.
              </p>
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
                    Chi tiết gói dịch vụ đã đăng ký
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

            

            {/* Filter controls and resident selector */}
            <div style={{
              padding: '1.5rem',
              borderBottom: '1px solid #f1f5f9',
              background: 'linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%)'
            }}>
              {/* Status Filter */}
              <div style={{ marginBottom: '1.25rem' }}>
                <label style={{ 
                  display: 'block', 
                  fontSize: '0.875rem', 
                  fontWeight: 600, 
                  color: '#475569', 
                  marginBottom: '0.75rem',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px'
                }}>
                  <svg style={{ width: '16px', height: '16px', color: '#3b82f6' }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" />
                  </svg>
                  <span style={{ fontSize: '1rem' }}>Lọc theo trạng thái:</span>
                </label>
                <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                  {[
                    { id: 'all', label: 'Tất cả', color: '#6b7280', bgColor: '#f9fafb', borderColor: '#e5e7eb' },
                    { id: 'pending_approval', label: 'Chờ duyệt', color: '#92400e', bgColor: '#fef3c7', borderColor: '#fcd34d' },
                    { id: 'active', label: 'Đang sử dụng', color: '#15803d', bgColor: '#f0fdf4', borderColor: '#86efac' },
                    { id: 'rejected', label: 'Đã từ chối', color: '#dc2626', bgColor: '#fef2f2', borderColor: '#fecaca' },
                    { id: 'cancelled', label: 'Đã hủy', color: '#4b5563', bgColor: '#f3f4f6', borderColor: '#d1d5db' }
                  ].map(status => (
                    <button
                      key={status.id}
                      onClick={() => {
                        setPackageStatusFilter(status.id);
                        setSelectedResidentIndex(0); // Reset to first resident when changing filter
                      }}
                      style={{
                        padding: '0.5rem 0.75rem',
                        borderRadius: '8px',
                        border: `1px solid ${packageStatusFilter === status.id ? status.borderColor : '#e2e8f0'}`,
                        background: packageStatusFilter === status.id ? status.bgColor : 'white',
                        color: packageStatusFilter === status.id ? status.color : '#64748b',
                        fontWeight: 500,
                        fontSize: '0.75rem',
                        cursor: 'pointer',
                        transition: 'all 0.2s ease',
                      }}
                      onMouseEnter={(e) => {
                        if (packageStatusFilter !== status.id) {
                          e.currentTarget.style.background = '#f8fafc';
                        }
                      }}
                      onMouseLeave={(e) => {
                        if (packageStatusFilter !== status.id) {
                          e.currentTarget.style.background = 'white';
                        }
                      }}
                    >
                      {status.label}
                    </button>
                  ))}
                </div>
              </div>
              
              {/* Selector nếu có nhiều người thân */}
              {(() => {
                const allPackages = getAllRegisteredServicePackages(packageStatusFilter);
                if (allPackages.length > 1) {
                  return (
                    <>
                      <label style={{ 
                        display: 'block', 
                        fontSize: '0.875rem', 
                        fontWeight: 600, 
                        color: '#475569', 
                        marginBottom: '0.75rem',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '8px'
                      }}>
                        <svg style={{ width: '16px', height: '16px', color: '#3b82f6' }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-1H21m0 0l-3 3m3-3l-3-3" />
                        </svg>
                        <span style={{ fontSize: '1rem' }}>Chọn người thân:</span>
                      </label>
                      <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
                        {allPackages.map((pkg: any, index: number) => (
                          <button
                            key={index}
                            onClick={() => setSelectedResidentIndex(index)}
                            style={{
                              padding: '0.75rem 1rem',
                              borderRadius: '12px',
                              border: selectedResidentIndex === index ? '2px solid #3b82f6' : '2px solid #e2e8f0',
                              background: selectedResidentIndex === index ? 'linear-gradient(135deg, #eff6ff 0%, #dbeafe 100%)' : 'white',
                              color: selectedResidentIndex === index ? '#1e40af' : '#64748b',
                              fontWeight: 500,
                              fontSize: '0.875rem',
                              cursor: 'pointer',
                              transition: 'all 0.2s ease',
                              transform: selectedResidentIndex === index ? 'scale(1.02)' : 'scale(1)',
                              boxShadow: selectedResidentIndex === index ? '0 4px 12px rgba(59, 130, 246, 0.2)' : '0 2px 4px rgba(0,0,0,0.1)'
                            }}
                            onMouseEnter={(e) => {
                              if (selectedResidentIndex !== index) {
                                e.currentTarget.style.transform = 'scale(1.02)';
                                e.currentTarget.style.boxShadow = '0 4px 12px rgba(0,0,0,0.15)';
                              }
                            }}
                            onMouseLeave={(e) => {
                              if (selectedResidentIndex !== index) {
                                e.currentTarget.style.transform = 'scale(1)';
                                e.currentTarget.style.boxShadow = '0 2px 4px rgba(0,0,0,0.1)';
                              }
                            }}
                          >
                            {pkg.residentInfo?.name || `Gói ${index + 1}`}
                          </button>
                        ))}
                      </div>
                    </>
                  );
                }
                return null;
              })()}
            </div>

            {/* Nội dung chi tiết */}
                          {(() => {
                const registeredPackage = getRegisteredServicePackage();
                const allPackages = getAllRegisteredServicePackages();
                const filteredPackages = getAllRegisteredServicePackages(packageStatusFilter);
                
                if (!registeredPackage) {
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
                        {allPackages.length === 0 ? (
                          <>
                            <h3 style={{ fontSize: '1.125rem', fontWeight: 600, color: '#1f2937', marginBottom: '0.5rem' }}>
                              Chưa có gói dịch vụ
                            </h3>
                            <p style={{ color: '#6b7280', maxWidth: '400px', margin: '0 auto', lineHeight: 1.6 }}>
                              Hiện tại chưa có gói dịch vụ nào được đăng ký. Vui lòng liên hệ để đăng ký gói dịch vụ phù hợp.
                            </p>
                          </>
                        ) : (
                          <>
                            <h3 style={{ fontSize: '1.125rem', fontWeight: 600, color: '#1f2937', marginBottom: '0.5rem' }}>
                              Không tìm thấy gói dịch vụ
                            </h3>
                            <p style={{ color: '#6b7280', maxWidth: '450px', margin: '0 auto', lineHeight: 1.6 }}>
                              Không có gói dịch vụ nào khớp với bộ lọc hiện tại. Vui lòng thử bộ lọc khác hoặc chọn "Tất cả" để xem tất cả các gói dịch vụ.
                            </p>
                            <div style={{ marginTop: '1rem' }}>
                              <button
                                onClick={() => setPackageStatusFilter('all')}
                                style={{
                                  background: 'linear-gradient(135deg, #f1f5f9 0%, #e2e8f0 100%)',
                                  color: '#475569',
                                  fontWeight: 600,
                                  padding: '0.5rem 1.5rem',
                                  borderRadius: '8px',
                                  border: '1px solid #cbd5e1',
                                  cursor: 'pointer',
                                  transition: 'all 0.2s ease',
                                  marginBottom: '1rem'
                                }}
                              >
                                Hiển thị tất cả gói dịch vụ
                              </button>
                            </div>
                          </>
                        )}
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

              // Add function to get status badge
              const getStatusBadge = (status: string) => {
                const statusConfig = {
                  'active': {
                    label: 'Trạng thái: Đang sử dụng',
                    background: 'linear-gradient(135deg, #f0fdf4 0%, #dcfce7 100%)',
                    color: '#15803d',
                    border: '1px solid #86efac',
                    icon: (
                      <svg style={{ width: '16px', height: '16px' }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                    )
                  },
                  'pending_approval': {
                    label: 'Trạng thái: Chờ duyệt',
                    background: 'linear-gradient(135deg, #fef3c7 0%, #fde68a 100%)',
                    color: '#92400e',
                    border: '1px solid #fcd34d',
                    icon: (
                      <svg style={{ width: '16px', height: '16px' }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                    )
                  },
                  'rejected': {
                    label: 'Đã từ chối',
                    background: 'linear-gradient(135deg, #fef2f2 0%, #fee2e2 100%)',
                    color: '#dc2626',
                    border: '1px solid #fecaca',
                    icon: (
                      <svg style={{ width: '16px', height: '16px' }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    )
                  },
                  'cancelled': {
                    label: 'Đã hủy',
                    background: 'linear-gradient(135deg, #f3f4f6 0%, #e5e7eb 100%)',
                    color: '#4b5563',
                    border: '1px solid #d1d5db', 
                    icon: (
                      <svg style={{ width: '16px', height: '16px' }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    )
                  }
                };
                
                const config = statusConfig[status as keyof typeof statusConfig] || statusConfig.pending_approval;
                
                return (
                  <div style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '6px',
                    padding: '6px 12px',
                    borderRadius: '12px',
                    background: config.background,
                    color: config.color,
                    border: config.border,
                    fontSize: '0.75rem',
                    fontWeight: 600,
                    marginBottom: '1rem'
                  }}>
                    {config.icon}
                    {config.label}
                  </div>
                );
              };

              // Thêm nút hủy nếu trạng thái là pending_approval hoặc active
              const canCancel = ['pending_approval', 'active'].includes(registeredPackage?.status || '');
              const hasCancellationRequest = registeredPackage?.cancellationRequest && 
                registeredPackage.cancellationRequest.status === 'pending_approval';

              if (registeredPackage?.residentInfo) {
                const resident = registeredPackage.residentInfo;
                return (
                  <div style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                    {/* Add status indicator */}
                    <div style={{ display: 'flex', justifyContent: 'flex-start' }}>
  {getStatusBadge(registeredPackage.status || 'pending_approval')}
</div>

                    {/* Display rejection reason if applicable */}
                    {registeredPackage.status === 'rejected' && registeredPackage.rejectionReason && (
                      <div style={{
                        background: 'linear-gradient(135deg, #fef2f2 0%, #fee2e2 100%)',
                        border: '1px solid #ef4444',
                        borderRadius: '16px',
                        padding: '1.25rem',
                        marginBottom: '1rem'
                      }}>
                        <div style={{ 
                          fontSize: '1rem', 
                          fontWeight: 600, 
                          color: '#dc2626', 
                          marginBottom: '0.75rem',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '8px'
                        }}>
                          <svg style={{ width: '20px', height: '20px' }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                          </svg>
                          Lý do từ chối
                        </div>
                        <div style={{ color: '#7f1d1d', fontSize: '0.9rem' }}>
                          {registeredPackage.rejectionReason}
                        </div>
                      </div>
                    )}

                    {/* Thông tin người thân */}
                    <div style={{
                      background: 'linear-gradient(135deg, #f8fafc 0%, #e0e7ef 100%)',
                      border: '1.5px solid #dbeafe',
                      borderRadius: '24px',
                      padding: '2.25rem 2rem',
                      marginBottom: '2.5rem',
                      boxShadow: '0 8px 32px rgba(59,130,246,0.08)',
                      position: 'relative',
                      overflow: 'hidden'
                    }}>
                      {/* Background decoration */}
                      <div style={{ 
                        position: 'absolute',
                        top: '-20px',
                        right: '-20px',
                        width: '80px',
                        height: '80px',
                        background: 'linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%)',
                        borderRadius: '50%',
                        opacity: 0.1
                      }}></div>
                      
                      <div style={{ 
                        fontSize: '1.25rem', 
                        fontWeight: 700, 
                        color: '#2563eb', 
                        marginBottom: '1.5rem',
                        textAlign: 'center',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: '10px'
                      }}>
                        <svg style={{ width: '24px', height: '24px', color: '#3b82f6' }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                        </svg>
                        Thông tin người thân
                      </div>
                      <div style={{ 
                        display: 'grid', 
                        gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', 
                        gap: '1.25rem',
                        position: 'relative',
                        zIndex: 1
                      }}>
                        <div style={{
                          background: 'white',
                          borderRadius: '16px',
                          padding: '1.25rem',
                          border: '1px solid #e2e8f0',
                          boxShadow: '0 2px 8px rgba(0,0,0,0.04)'
                        }}>
                          <div style={{ fontSize: '0.8rem', color: '#64748b', fontWeight: 500, marginBottom: '0.5rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Họ tên</div>
                          <div style={{ fontSize: '1.1rem', fontWeight: 700, color: '#1e293b' }}>{resident.name || 'Chưa cập nhật'}</div>
                        </div>
                        <div style={{
                          background: 'white',
                          borderRadius: '16px',
                          padding: '1.25rem',
                          border: '1px solid #e2e8f0',
                          boxShadow: '0 2px 8px rgba(0,0,0,0.04)'
                        }}>
                          <div style={{ fontSize: '0.8rem', color: '#64748b', fontWeight: 500, marginBottom: '0.5rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Tuổi</div>
                          <div style={{ fontSize: '1.1rem', fontWeight: 700, color: '#1e293b' }}>{resident.age ? `${resident.age} tuổi` : 'Chưa cập nhật'}</div>
                        </div>
                        <div style={{
                          background: 'white',
                          borderRadius: '16px',
                          padding: '1.25rem',
                          border: '1px solid #e2e8f0',
                          boxShadow: '0 2px 8px rgba(0,0,0,0.04)'
                        }}>
                          <div style={{ fontSize: '0.8rem', color: '#64748b', fontWeight: 500, marginBottom: '0.5rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Phòng</div>
                          <div style={{ fontSize: '1.1rem', fontWeight: 700, color: '#1e293b' }}>{resident.room || 'Chưa cập nhật'}</div>
                        </div>
                      </div>
                    </div>

                    {/* Divider */}
                    <div style={{height:'1px',background:'linear-gradient(90deg, transparent 0%, #e5e7eb 50%, transparent 100%)',margin:'2rem 0'}} />

                    {/* Thông tin liên hệ khẩn cấp */}
                    <div style={{
                      background: 'linear-gradient(135deg, #fef2f2 0%, #fee2e2 100%)',
                      border: '1.5px solid #fecaca',
                      borderRadius: '24px',
                      padding: '2.25rem 2rem',
                      boxShadow: '0 8px 32px rgba(239,68,68,0.08)',
                      position: 'relative',
                      overflow: 'hidden'
                    }}>
                      {/* Background decoration */}
                      <div style={{ 
                        position: 'absolute',
                        top: '-20px',
                        left: '-20px',
                        width: '80px',
                        height: '80px',
                        background: 'linear-gradient(135deg, #ef4444 0%, #dc2626 100%)',
                        borderRadius: '50%',
                        opacity: 0.1
                      }}></div>
                      
                      <div style={{ 
                        fontSize: '1.25rem', 
                        fontWeight: 700, 
                        color: '#dc2626', 
                        textAlign: 'center',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: '10px'
                      }}>
                        <svg style={{ width: '24px', height: '24px', color: '#ef4444' }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                        </svg>
                        Người liên hệ khẩn cấp
                      </div>
                      <div style={{ 
                        display: 'grid', 
                        gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', 
                        gap: '1.25rem',
                        position: 'relative',
                        zIndex: 1
                      }}>
                        <div style={{
                          background: 'white',
                          borderRadius: '16px',
                          padding: '1.25rem',
                          border: '1px solid #fecaca',
                          boxShadow: '0 2px 8px rgba(239,68,68,0.04)'
                        }}>
                          <div style={{ fontSize: '0.8rem', color: '#64748b', fontWeight: 500, marginBottom: '0.5rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Họ tên</div>
                          <div style={{ fontSize: '1.1rem', fontWeight: 700, color: '#1e293b' }}>{resident.emergencyContact || 'Chưa cập nhật'}</div>
                        </div>
                          <div style={{ 
                          background: 'white',
                          borderRadius: '16px',
                          padding: '1.25rem',
                          border: '1px solid #fecaca',
                          boxShadow: '0 2px 8px rgba(239,68,68,0.04)'
                        }}>
                          <div style={{ fontSize: '0.8rem', color: '#64748b', fontWeight: 500, marginBottom: '0.5rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Số điện thoại</div>
                          <div style={{ 
                            fontSize: '1.1rem', 
                            fontWeight: 700, 
                            color: '#1e293b',
                            fontFamily: 'monospace',
                            background: 'linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%)',
                            padding: '0.5rem 0.75rem',
                            borderRadius: '12px',
                            border: '1px solid #e2e8f0',
                            display: 'inline-block'
                          }}>
                            {resident.contactPhone || 'Chưa cập nhật'}
                          </div>
                        </div>
                      </div>
                      <div style={{ 
                        marginTop: '1rem', 
                        display: 'flex', 
                        alignItems: 'center', 
                        justifyContent: 'center',
                        gap: '8px',
                        fontSize: '0.8rem',
                        color: '#dc2626',
                        fontWeight: 500
                      }}>
                        <span style={{ 
                          width: '8px', 
                          height: '8px', 
                          background: '#ef4444', 
                          borderRadius: '50%', 
                          animation: 'pulse 2s infinite' 
                        }}></span>
                        <span>Liên hệ khi có tình huống khẩn cấp</span>
                      </div>
                    </div>

                    {/* Divider */}
                    <div style={{height:'1px',background:'linear-gradient(90deg, transparent 0%, #e5e7eb 50%, transparent 100%)',margin:'2rem 0'}} />

                    {/* Thông tin gói dịch vụ */}
                    <div style={{
                      background: 'linear-gradient(135deg, #f0f9ff 0%, #e0f2fe 100%)',
                      border: '1.5px solid #bfdbfe',
                      borderRadius: '24px',
                      padding: '2.25rem 2rem',
                      marginBottom: '2.5rem',
                      boxShadow: '0 8px 32px rgba(59,130,246,0.08)',
                      position: 'relative',
                      overflow: 'hidden'
                    }}>
                      {/* Background decoration */}
                      <div style={{ 
                        position: 'absolute',
                        bottom: '-20px',
                        right: '-20px',
                        width: '80px',
                        height: '80px',
                        background: 'linear-gradient(135deg, #0ea5e9 0%, #0284c7 100%)',
                        borderRadius: '50%',
                        opacity: 0.1
                      }}></div>
                      
                      <div style={{ 
                        fontSize: '1.25rem', 
                        fontWeight: 700, 
                        color: '#0c4a6e', 
                        marginBottom: '1.5rem',
                        textAlign: 'center',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: '10px'
                      }}>
                        <svg style={{ width: '24px', height: '24px', color: '#3b82f6' }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                        </svg>
                        Thông tin gói dịch vụ
                      </div>
                      <div style={{ 
                        display: 'grid', 
                        gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', 
                        gap: '1.25rem',
                        marginBottom: '1.5rem',
                        position: 'relative',
                        zIndex: 1
                      }}>
                        <div style={{
                          background: 'white',
                          borderRadius: '16px',
                          padding: '1.25rem',
                          border: '1px solid #bfdbfe',
                          boxShadow: '0 2px 8px rgba(59,130,246,0.04)'
                        }}>
                          <div style={{ fontSize: '0.8rem', color: '#64748b', fontWeight: 500, marginBottom: '0.5rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Tên gói</div>
                          <div style={{ fontSize: '1.1rem', fontWeight: 700, color: '#1d4ed8' }}>{registeredPackage.packageType || 'Chưa cập nhật'}</div>
                        </div>
                        <div style={{
                          background: 'white',
                          borderRadius: '16px',
                          padding: '1.25rem',
                          border: '1px solid #bfdbfe',
                          boxShadow: '0 2px 8px rgba(59,130,246,0.04)'
                        }}>
                          <div style={{ fontSize: '0.8rem', color: '#64748b', fontWeight: 500, marginBottom: '0.5rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Giá</div>
                          <div style={{ fontSize: '1.1rem', fontWeight: 700, color: '#1d4ed8' }}>{formatCurrency(registeredPackage.finalPrice || registeredPackage.price)}</div>
                        </div>
                        <div style={{
                          background: 'white',
                          borderRadius: '16px',
                          padding: '1.25rem',
                          border: '1px solid #bfdbfe',
                          boxShadow: '0 2px 8px rgba(59,130,246,0.04)'
                        }}>
                          <div style={{ fontSize: '0.8rem', color: '#64748b', fontWeight: 500, marginBottom: '0.5rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Ngày bắt đầu</div>
                          <div style={{ fontSize: '1.1rem', fontWeight: 700, color: '#1e293b' }}>{registeredPackage.startDate ? new Date(registeredPackage.startDate).toLocaleDateString('vi-VN') : 'Chưa cập nhật'}</div>
                        </div>
                      </div>
                      
                      {/* Dịch vụ bao gồm */}
                      <div style={{ 
                        marginBottom: '1.5rem',
                        background: 'white',
                        borderRadius: '16px',
                        padding: '1.5rem',
                        border: '1px solid #bfdbfe',
                        boxShadow: '0 2px 8px rgba(59,130,246,0.04)'
                      }}>
                        <div style={{ 
                          fontSize: '0.9rem', 
                          color: '#64748b', 
                          fontWeight: 600, 
                          marginBottom: '1rem',
                          textTransform: 'uppercase',
                          letterSpacing: '0.05em'
                        }}>Dịch vụ bao gồm</div>
                        <ul style={{ 
                          listStyle: 'none', 
                          padding: 0, 
                          margin: 0,
                          display: 'grid',
                          gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
                          gap: '0.75rem'
                        }}>
                          {registeredPackage.features?.map((f: string, i: number) => (
                            <li key={i} style={{ 
                              display: 'flex', 
                              alignItems: 'center', 
                              gap: '8px',
                              fontSize: '0.9rem',
                              color: '#374151',
                              lineHeight: 1.5
                            }}>
                              <svg style={{ width: '16px', height: '16px', color: '#10b981', flexShrink: 0 }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                              </svg>
                              {f}
                            </li>
                          ))}
                        </ul>
                      </div>
                      
                      {/* Khuyến mãi */}
                      {registeredPackage.discount > 0 && (
                        <div style={{
                          background: 'linear-gradient(135deg, #f0fdf4 0%, #dcfce7 100%)',
                          border: '1.5px solid #bbf7d0',
                          borderRadius: '20px',
                          padding: '1.5rem',
                          marginTop: '1rem',
                          position: 'relative',
                          overflow: 'hidden'
                        }}>
                          <div style={{ 
                            position: 'absolute',
                            top: '-10px',
                            right: '-10px',
                            width: '40px',
                            height: '40px',
                            background: 'linear-gradient(135deg, #22c55e 0%, #16a34a 100%)',
                            borderRadius: '50%',
                            opacity: 0.1
                          }}></div>
                          
                          <div style={{ 
                            fontSize: '0.9rem', 
                            fontWeight: 700, 
                            color: '#15803d', 
                            marginBottom: '1rem',
                            textTransform: 'uppercase',
                            letterSpacing: '0.05em',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '8px'
                          }}>
                            <svg style={{ width: '18px', height: '18px' }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
                            </svg>
                            Khuyến mãi đặc biệt
                          </div>
                          <div style={{ 
                            display: 'grid',
                            gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
                            gap: '1rem', 
                            fontSize: '0.9rem',
                            position: 'relative',
                            zIndex: 1
                          }}>
                            <div style={{
                              background: 'white',
                              borderRadius: '12px',
                              padding: '1rem',
                              border: '1px solid #bbf7d0'
                            }}>
                              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
                                <span style={{ color: '#64748b', fontSize: '0.8rem' }}>Giá gốc:</span>
                                <span style={{ fontWeight: 600, color: '#1f2937' }}>{formatCurrency(Number(registeredPackage.price) || 15000000)}</span>
                            </div>
                              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid #bbf7d0', paddingBottom: '0.5rem' }}>
                                <span style={{ color: '#64748b', fontSize: '0.8rem' }}>Giảm giá ({registeredPackage.discount}%):</span>
                                <span style={{ fontWeight: 600, color: '#16a34a' }}>-{formatCurrency(Number(registeredPackage.discountAmount) || 0)}</span>
                            </div>
                            <div style={{ 
                              display: 'flex', 
                              justifyContent: 'space-between', 
                              alignItems: 'center',
                                background: 'linear-gradient(135deg, #f0fdf4 0%, #dcfce7 100%)',
                              borderRadius: '8px',
                                padding: '0.75rem',
                              border: '1px solid #bbf7d0',
                                marginTop: '0.5rem'
                            }}>
                                <span style={{ fontWeight: 700, color: '#1f2937' }}>Thành tiền:</span>
                                <span style={{ fontWeight: 700, color: '#16a34a', fontSize: '1.1rem' }}>{formatCurrency(registeredPackage.finalPrice)}</span>
                              </div>
                            </div>
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Button đóng và hủy */}
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                      {/* Hiển thị thông báo yêu cầu hủy đang chờ duyệt */}
                      {hasCancellationRequest && (
                        <div style={{
                          background: 'linear-gradient(135deg, #fef3c7 0%, #fde68a 100%)',
                          border: '1.5px solid #f59e0b',
                          borderRadius: '20px',
                          padding: '1.5rem',
                          marginBottom: '1rem',
                          position: 'relative',
                          overflow: 'hidden'
                        }}>
                          <div style={{ 
                            position: 'absolute',
                            top: '-10px',
                            right: '-10px',
                            width: '40px',
                            height: '40px',
                            background: 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)',
                            borderRadius: '50%',
                            opacity: 0.1
                          }}></div>
                          
                          <div style={{ 
                            fontSize: '0.95rem', 
                            fontWeight: 600, 
                            color: '#92400e', 
                            marginBottom: '0.75rem',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '8px'
                          }}>
                            <svg style={{ width: '18px', height: '18px' }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                            Yêu cầu hủy đang chờ duyệt
                          </div>
                          <div style={{ fontSize: '0.85rem', color: '#92400e', lineHeight: 1.5 }}>
                            <div style={{ marginBottom: '0.5rem' }}>
                              <strong>Lý do:</strong> {registeredPackage.cancellationRequest.reason}
                          </div>
                            <div>
                              <strong>Ngày yêu cầu:</strong> {new Date(registeredPackage.cancellationRequest.requestedDate).toLocaleDateString('vi-VN')}
                            </div>
                          </div>
                        </div>
                      )}
                      
                      {canCancel && !hasCancellationRequest && (
                        <button
                          onClick={() => setShowCancelConfirmModal(true)}
                          style={{
                            background: 'linear-gradient(135deg, #ef4444 0%, #dc2626 100%)',
                            color: 'white',
                            fontWeight: 600,
                            padding: '0.75rem 1.25rem',
                            borderRadius: '12px',
                            border: 'none',
                            cursor: 'pointer',
                            transition: 'all 0.3s ease',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            gap: '8px',
                            fontSize: '0.875rem',
                            boxShadow: '0 4px 12px rgba(239,68,68,0.12)',
                            marginTop: '1rem',
                            marginBottom: '0.5rem',
                            minWidth: 'fit-content',
                            alignSelf: 'flex-end',
                            position: 'relative',
                            overflow: 'hidden'
                          }}
                          onMouseEnter={(e) => {
                            e.currentTarget.style.transform = 'translateY(-2px)';
                            e.currentTarget.style.boxShadow = '0 8px 20px rgba(239,68,68,0.2)';
                            e.currentTarget.style.background = 'linear-gradient(135deg, #f87171 0%, #ef4444 100%)';
                          }}
                          onMouseLeave={(e) => {
                            e.currentTarget.style.transform = 'translateY(0)';
                            e.currentTarget.style.boxShadow = '0 4px 12px rgba(239,68,68,0.12)';
                            e.currentTarget.style.background = 'linear-gradient(135deg, #ef4444 0%, #dc2626 100%)';
                          }}
                        >
                          <div style={{
                            position: 'absolute',
                            top: '-50%',
                            right: '-50%',
                            width: '100%',
                            height: '100%',
                            background: 'linear-gradient(45deg, transparent, rgba(255,255,255,0.1), transparent)',
                            transform: 'rotate(45deg)',
                            opacity: 0
                          }}></div>
                          <svg style={{ width: '16px', height: '16px' }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                          </svg>
                          {registeredPackage.status === 'pending_approval' ? 'Hủy đăng ký' : 'Hủy gói dịch vụ'}
                        </button>
                      )}
                     
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
                          onClick={() => pkg.type === 'cancellation' ? 
                            handleRejectCancellation(pkg.registrationId) : 
                            handleRejectPackage(pkg.registrationId)
                          }
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
                          onClick={() => pkg.type === 'cancellation' ? 
                            handleApproveCancellation(pkg.registrationId) : 
                            handleApprovePackage(pkg.registrationId)
                          }
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

      {/* Modal xác nhận hủy gói dịch vụ */}
      {showCancelConfirmModal && (
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
            background: 'white',
            borderRadius: 16,
            boxShadow: '0 8px 32px rgba(0,0,0,0.18)',
            padding: '2rem',
            minWidth: 480,
            maxWidth: '90vw',
            maxHeight: '90vh',
            overflowY: 'auto',
            position: 'relative',
          }}>
            {/* Header */}
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: 12,
              marginBottom: 24,
              paddingBottom: 16,
              borderBottom: '2px solid #f3f4f6'
            }}>
              <div style={{
                width: 48,
                height: 48,
              background: 'linear-gradient(135deg, #fef3c7 0%, #fde68a 100%)',
              borderRadius: '50%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: '0 2px 8px #fde68a55',
            }}>
                <svg style={{ width: 24, height: 24, color: '#f59e0b' }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 8v4m0 4h.01M21 12c0 4.97-4.03 9-9 9s-9-4.03-9-9 4.03-9 9-9 9z" />
              </svg>
            </div>
              <div>
                <h3 style={{ fontSize: '1.5rem', fontWeight: 700, color: '#b45309', margin: 0 }}>
                  {(() => {
                    const currentPackage = getRegisteredServicePackage();
                    return currentPackage?.status === 'pending_approval' ? 'Xác nhận hủy đăng ký' : 'Xác nhận hủy gói dịch vụ';
                  })()}
                </h3>
                <p style={{ color: '#6b7280', fontSize: '0.875rem', margin: 0 }}>Vui lòng đọc kỹ các quy tắc trước khi xác nhận</p>
              </div>
            </div>

            {/* Thông tin gói dịch vụ hiện tại */}
            {(() => {
              const currentPackage = getRegisteredServicePackage();
              if (!currentPackage) return null;
              
              // Ẩn thông tin hủy đăng ký nếu là hủy đăng ký chờ duyệt
              if (currentPackage.status === 'pending_approval') {
                return null;
              }
              // Thông tin cho hủy gói dịch vụ đang sử dụng
              const today = new Date();
              const startDate = new Date(currentPackage.startDate);
              const daysUsed = Math.ceil((today.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24));
              const dailyRate = currentPackage.finalPrice / 30;
              const amountUsed = Math.max(0, daysUsed * dailyRate);
              const refundAmount = Math.max(0, currentPackage.finalPrice - amountUsed);
              
              return (
                <div style={{
                  background: 'linear-gradient(135deg, #f0fdf4 0%, #dcfce7 100%)',
                  border: '1px solid #22c55e',
                  borderRadius: 12,
                  padding: 16,
                  marginBottom: 20
                }}>
                  <h4 style={{ fontSize: '1rem', fontWeight: 600, color: '#15803d', marginBottom: 12, display: 'flex', alignItems: 'center', gap: 8 }}>
                    <svg style={{ width: '20px', height: '20px' }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 7h6m0 10v-3m-3 3h.01M9 17h.01M9 14h.01M12 14h.01M15 11h.01M12 11h.01M9 11h.01M7 21h10a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
                    </svg>
                    Thông tin gói dịch vụ hiện tại
                  </h4>
                  <div style={{ fontSize: '0.875rem', color: '#15803d' }}>
                    <div style={{ display: 'grid', gap: 8 }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', padding: '4px 0' }}>
                        <span>Gói dịch vụ:</span>
                        <div style={{ fontWeight: 600 }}>{currentPackage.packageType}</div>
                      </div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', padding: '4px 0' }}>
                        <span>Ngày bắt đầu:</span>
                        <div style={{ fontWeight: 600 }}>{new Date(currentPackage.startDate).toLocaleDateString('vi-VN')}</div>
                      </div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', padding: '4px 0' }}>
                        <span>Số ngày đã sử dụng:</span>
                        <div style={{ fontWeight: 600 }}>{daysUsed} ngày</div>
                      </div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', padding: '4px 0' }}>
                        <span>Giá gói/tháng:</span>
                        <div style={{ fontWeight: 600 }}>{formatCurrency(currentPackage.finalPrice)}</div>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })()}

            {/* Quy tắc nghiệp vụ khi hủy */}
            {(() => {
              const currentPackage = getRegisteredServicePackage();
              if (!currentPackage) return null;
              if (currentPackage.status === 'pending_approval') {
                // Hủy đăng ký - không có tính toán phí
                return (
                  <div style={{
                    background: 'linear-gradient(135deg, #f0fdf4 0%, #dcfce7 100%)',
                    border: '1px solid #22c55e',
                    borderRadius: 12,
                    padding: 16,
                    marginBottom: 20
                  }}>
                    <h4 style={{ fontSize: '1rem', fontWeight: 600, color: '#15803d', marginBottom: 12, display: 'flex', alignItems: 'center', gap: 8 }}>
                      <svg style={{ width: '20px', height: '20px' }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                      </svg>
                      Thông tin hủy đăng ký
                    </h4>
                    <div style={{ fontSize: '0.875rem', color: '#15803d' }}>
                      <div style={{ display: 'grid', gap: 8 }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', padding: '4px 0' }}>
                          <span>Gói dịch vụ đăng ký:</span>
                          <div style={{ fontWeight: 600 }}>{currentPackage.packageType}</div>
                        </div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', padding: '4px 0' }}>
                          <span>Ngày đăng ký:</span>
                          <div style={{ fontWeight: 600 }}>{new Date(currentPackage.purchaseDate).toLocaleDateString('vi-VN')}</div>
                        </div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', padding: '4px 0' }}>
                          <span>Trạng thái:</span>
                          <div style={{ fontWeight: 600, color: '#f59e0b' }}>Chờ duyệt</div>
                        </div>
                        <div style={{ 
                          display: 'flex', 
                          justifyContent: 'space-between', 
                          padding: '8px 0', 
                          borderTop: '2px solid #22c55e',
                          marginTop: 4,
                          background: 'rgba(34, 197, 94, 0.1)',
                          borderRadius: 6,
                          paddingLeft: 8,
                          paddingRight: 8
                        }}>
                          <span style={{ fontWeight: 600 }}>Kết quả:</span>
                          <span style={{ fontWeight: 700, fontSize: '1rem', color: '#15803d' }}>Không phát sinh chi phí</span>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              }
              
              // Hủy gói dịch vụ đang sử dụng
              const today = new Date();
              const startDate = new Date(currentPackage.startDate);
              const daysUsed = Math.ceil((today.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24));
              const dailyRate = currentPackage.finalPrice / 30;
              const amountUsed = Math.max(0, daysUsed * dailyRate);
              const refundAmount = Math.max(0, currentPackage.finalPrice - amountUsed);
              
              return (
                <div style={{
                  background: 'linear-gradient(135deg, #f0fdf4 0%, #dcfce7 100%)',
                  border: '1px solid #22c55e',
                  borderRadius: 12,
                  padding: 16,
                  marginBottom: 20
                }}>
                  <h4 style={{ fontSize: '1rem', fontWeight: 600, color: '#15803d', marginBottom: 12, display: 'flex', alignItems: 'center', gap: 8 }}>
                    <svg style={{ width: '20px', height: '20px' }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 7h6m0 10v-3m-3 3h.01M9 17h.01M9 14h.01M12 14h.01M15 11h.01M12 11h.01M9 11h.01M7 21h10a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
                    </svg>
                    Tính toán chi tiết
                  </h4>
                  <div style={{ fontSize: '0.875rem', color: '#15803d' }}>
                    <div style={{ display: 'grid', gap: 8 }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', padding: '4px 0' }}>
                        <span>Giá gói dịch vụ:</span>
                        <div style={{ fontWeight: 600 }}>{formatCurrency(currentPackage.finalPrice)}</div>
                      </div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', padding: '4px 0', borderBottom: '1px solid #bbf7d0' }}>
                        <span>Phí sử dụng ({daysUsed} ngày):</span>
                        <span style={{ fontWeight: 600, color: '#dc2626' }}>-{formatCurrency(amountUsed)}</span>
                      </div>
                      <div style={{ 
                        display: 'flex', 
                        justifyContent: 'space-between', 
                        padding: '8px 0', 
                        borderTop: '2px solid #22c55e',
                        marginTop: 4,
                        background: 'rgba(34, 197, 94, 0.1)',
                        borderRadius: 6,
                        paddingLeft: 8,
                        paddingRight: 8
                      }}>
                        <span style={{ fontWeight: 600 }}>Số tiền hoàn lại:</span>
                        <span style={{ fontWeight: 700, fontSize: '1rem', color: '#15803d' }}>{formatCurrency(refundAmount)}</span>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })()}

            {/* Cảnh báo quan trọng */}
            {(() => {
              const currentPackage = getRegisteredServicePackage();
              if (!currentPackage) return null;
              if (currentPackage.status === 'pending_approval') {
                return (
                  <div style={{
                    background: 'linear-gradient(135deg, #fef2f2 0%, #fee2e2 100%)',
                    border: '1px solid #ef4444',
                    borderRadius: 12,
                    padding: 16,
                    marginBottom: 24
                  }}>
                    <h4 style={{ fontSize: '1rem', fontWeight: 600, color: '#dc2626', marginBottom: 8, display: 'flex', alignItems: 'center', gap: 8 }}>
                      <svg style={{ width: 20, height: 20 }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01M21 12c0 4.97-4.03 9-9 9s-9-4.03-9-9 4.03-9 9-9 9z" />
                      </svg>
                      Cảnh báo quan trọng
                    </h4>
                    <div style={{ fontSize: '0.875rem', color: '#dc2626', lineHeight: 1.6 }}>
                      <ul style={{ paddingLeft: 20, margin: 0 }}>
                        <li>Sau khi xác nhận, yêu cầu đăng ký sẽ bị hủy và không thể khôi phục.</li>
                        <li>Bạn sẽ không bị trừ bất kỳ khoản phí nào.</li>
                      </ul>
                    </div>
                  </div>
                );
              }
              if (currentPackage.status === 'active') {
                return (
                  <div style={{
                    background: 'linear-gradient(135deg, #fef2f2 0%, #fee2e2 100%)',
                    border: '1px solid #ef4444',
                    borderRadius: 12,
                    padding: 16,
                    marginBottom: 24
                  }}>
                    <h4 style={{ fontSize: '1rem', fontWeight: 600, color: '#dc2626', marginBottom: 8, display: 'flex', alignItems: 'center', gap: 8 }}>
                      <svg style={{ width: 20, height: 20 }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01M21 12c0 4.97-4.03 9-9 9s-9-4.03-9-9 4.03-9 9-9 9z" />
                      </svg>
                       Cảnh báo quan trọng
                    </h4>
                    <div style={{ fontSize: '0.875rem', color: '#dc2626', lineHeight: 1.6 }}>
                      <ul style={{ paddingLeft: 20, margin: 0 }}>
                        <li>Hành động này sẽ chấm dứt ngay lập tức tất cả dịch vụ chăm sóc đang được cung cấp.</li>
                        <li>Việc hủy không thể hoàn tác sau khi xác nhận.</li>
                        <li>Người thân sẽ không còn được hưởng các quyền lợi của gói dịch vụ từ thời điểm hủy.</li>
                        <li>Nếu cần hỗ trợ khẩn cấp, vui lòng liên hệ ngay với bộ phận chăm sóc.</li>
                      </ul>
                    </div>
                  </div>
                );
              }
              return null;
            })()}

            {/* Buttons */}
            <div style={{ display: 'flex', gap: 12, justifyContent: 'center' }}>
              <button
                onClick={() => setShowCancelConfirmModal(false)}
                style={{
                  padding: '12px 24px',
                  borderRadius: 8,
                  background: 'linear-gradient(90deg, #e5e7eb 0%, #f3f4f6 100%)',
                  color: '#374151',
                  fontWeight: 600,
                  fontSize: '0.875rem',
                  border: 'none',
                  boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
                  cursor: 'pointer',
                  transition: 'all 0.2s',
                  minWidth: 120
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.transform = 'translateY(-1px)';
                  e.currentTarget.style.boxShadow = '0 4px 8px rgba(0,0,0,0.15)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.transform = 'translateY(0)';
                  e.currentTarget.style.boxShadow = '0 2px 4px rgba(0,0,0,0.1)';
                }}
              >
                Hủy bỏ
              </button>
              <button
                onClick={() => {
                  // Thực hiện hủy
                  try {
                    const currentPackage = getRegisteredServicePackage();
                    if (!currentPackage) return;
                    
                    if (currentPackage.status === 'pending_approval') {
                      // Hủy trực tiếp nếu đang chờ duyệt
                      const savedResidents = localStorage.getItem('nurseryHomeResidents');
                      if (savedResidents) {
                        const residents = JSON.parse(savedResidents);
                        const updatedResidents = (residents as any[]).map((r: any) => {
                          if (r.carePackage && r.carePackage.registrationId === currentPackage.registrationId) {
                            return {
                              ...r,
                              carePackage: {
                                ...r.carePackage,
                                status: 'cancelled',
                                cancelledDate: new Date().toISOString(),
                                cancelledBy: 'Người dùng',
                                cancellationReason: 'Người dùng hủy'
                              }
                            };
                          }
                          return r;
                        });
                        localStorage.setItem('nurseryHomeResidents', JSON.stringify(updatedResidents));
                      }
                    } else if (currentPackage.status === 'active') {
                      // Tạo yêu cầu hủy nếu đang hoạt động
                      handleCancelPackage(currentPackage.registrationId);
                    }
                    
                    setShowServiceModal(false);
                    setShowCancelConfirmModal(false);
                    setShowCancelSuccessModal(true);
                  } catch (error) {
                    console.error('Error cancelling package:', error);
                    setShowServiceModal(false);
                    setShowCancelConfirmModal(false);
                    setShowCancelSuccessModal(true);
                  }
                }}
                style={{
                  padding: '12px 24px',
                  borderRadius: 8,
                  background: 'linear-gradient(90deg, #ef4444 0%, #f87171 100%)',
                  color: 'white',
                  fontWeight: 600,
                  fontSize: '0.875rem',
                  border: 'none',
                  boxShadow: '0 2px 4px rgba(239, 68, 68, 0.3)',
                  cursor: 'pointer',
                  transition: 'all 0.2s',
                  minWidth: 120
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.transform = 'translateY(-1px)';
                  e.currentTarget.style.boxShadow = '0 4px 8px rgba(239, 68, 68, 0.4)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.transform = 'translateY(0)';
                  e.currentTarget.style.boxShadow = '0 2px 4px rgba(239, 68, 68, 0.3)';
                }}
              >
                {(() => {
                  const currentPackage = getRegisteredServicePackage();
                  return currentPackage?.status === 'pending_approval' ? 'Xác nhận hủy' : 'Xác nhận hủy gói dịch vụ';
                })()}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal thông báo hủy thành công */}
      {showCancelSuccessModal && (
        <div style={{
          position: 'fixed',
          inset: 0,
          background: 'rgba(0, 0, 0, 0.78)',
          zIndex: 9999,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          transition: 'all 0.2s',
          marginLeft: 200,
        }}>
          <div style={{
            background: 'white',
            borderRadius: 24,
            boxShadow: '0 20px 60px rgba(16,185,129,0.12), 0 8px 25px rgba(0,0,0,0.08)',
            padding: '3rem 2.5rem 2.5rem 2.5rem',
            minWidth: 750,
            maxWidth: 420,
            textAlign: 'center',
            position: 'relative',
            animation: 'fadeIn 0.3s',
            border: '1px solid rgba(16,185,129,0.08)',
            backdropFilter: 'blur(10px)',
          }}>
            {/* Success Icon */}
            <div style={{
              width: 80,
              height: 80,
              margin: '0 auto 1.5rem',
              background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
              borderRadius: '50%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: '0 4px 16px rgba(16, 185, 129, 0.15)',
              animation: 'bounce 0.6s',
            }}>
              <svg style={{ width: 40, height: 40, color: 'white' }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
              </svg>
            </div>

            {/* Title */}
            <h3 style={{
              fontSize: '1.5rem',
              fontWeight: 700,
              color: '#059669',
              marginBottom: 10,
              letterSpacing: 0.5,
            }}>
              {(() => {
                const currentPackage = getRegisteredServicePackage();
                return currentPackage?.status === 'pending_approval' ? 'Hủy đăng ký thành công!' : 'Hủy gói dịch vụ thành công!';
              })()}
            </h3>

            {/* Message */}
            <p style={{
              color: '#374151',
              fontSize: '1.05rem',
              marginBottom: 18,
              lineHeight: 1.7,
            }}>
              {(() => {
                const currentPackage = getRegisteredServicePackage();
                return currentPackage?.status === 'pending_approval' 
                  ? 'Đăng ký gói dịch vụ đã được hủy thành công.' 
                  : 'Gói dịch vụ đã được hủy thành công. Dịch vụ chăm sóc sẽ chấm dứt ngay lập tức.';
              })()}
            </p>

            {/* Thông báo */}
            {currentPackage && currentPackage.status === 'active' && (
              <div style={{
                background: 'linear-gradient(135deg, #eff6ff 0%, #dbeafe 100%)',
                border: '1px solid #3b82f6',
                borderRadius: 12,
                padding: 18,
                marginBottom: 24,
                textAlign: 'left',
                boxShadow: '0 2px 8px #dbeafe55',
              }}>
                <div style={{
                  fontSize: '0.95rem',
                  color: '#475569',
                  lineHeight: 1.7,
                }}>
                  <div style={{ marginBottom: 16 }}>
                    <strong style={{ color: '#1e40af' }}>Hoàn tiền:</strong> Số dư (nếu có) sẽ được hoàn trả trong 5-7 ngày làm việc.
                  </div>
                  <div style={{ marginBottom: 16 }}>
                    <strong style={{ color: '#1e40af' }}>Xác nhận:</strong> Email chi tiết sẽ được gửi trong vòng 24 giờ.
                  </div>
                  <div style={{ marginBottom: 16 }}>
                    <strong style={{ color: '#dc2626' }}>Lưu ý:</strong> Dịch vụ chăm sóc chấm dứt ngay lập tức.
                  </div>
                  <div style={{ marginBottom: 16 }}>
                    <strong style={{ color: '#1e40af' }}>Hỗ trợ:</strong> Liên hệ hotline{' '}
                    <span style={{
                      fontWeight: 600,
                      color: '#1e40af',
                      background: '#eff6ff',
                      padding: '2px 8px',
                      borderRadius: 4,
                    }}>
                      1900-xxxx
                    </span>{' '}
                    khi cần hỗ trợ.
                  </div>
                  <div>
                    <strong style={{ color: '#1e40af' }}>Đăng ký lại:</strong> Có thể thực hiện sau 30 ngày.
                  </div>
                </div>
              </div>
            )}

            {/* Close Button */}
            <button
              onClick={() => setShowCancelSuccessModal(false)}
              style={{
                padding: '10px 28px',
                borderRadius: 8,
                background: 'linear-gradient(90deg, #10b981 0%, #059669 100%)',
                color: 'white',
                fontWeight: 600,
                fontSize: '1rem',
                border: 'none',
                cursor: 'pointer',
                marginTop: 8,
                boxShadow: '0 2px 8px rgba(16,185,129,0.12)',
                transition: 'all 0.2s',
              }}
              onMouseEnter={e => e.currentTarget.style.background = '#059669'}
              onMouseLeave={e => e.currentTarget.style.background = 'linear-gradient(90deg, #10b981 0%, #059669 100%)'}
            >
              Đóng
            </button>
            {/* Đưa style jsx vào trong return của component */}
            <style jsx>{`
              @keyframes fadeIn {
                from { opacity: 0; transform: scale(0.95); }
                to { opacity: 1; transform: scale(1); }
              }
              @keyframes bounce {
                0%, 20%, 53%, 80%, 100% { transform: translate3d(0,0,0); }
                40%, 43% { transform: translate3d(0, -18px, 0); }
                70% { transform: translate3d(0, -8px, 0); }
                90% { transform: translate3d(0, -2px, 0); }
              }
            `}</style>
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
              <div style={{ fontSize: '0.875rem', color: '#64748b' }}>
                Cập nhật lần cuối: {new Date().toLocaleDateString('vi-VN')}
              </div>
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
                  boxShadow: '0 4px 12px rgba(102, 126, 234, 0.3)'
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
    </div>
  );
} 
