"use client";

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/contexts/auth-context';
import { 
  ShieldCheckIcon,
  DocumentCheckIcon,
  ExclamationTriangleIcon,
  ClockIcon,
  CheckCircleIcon,
  ChartBarIcon,
  CalendarIcon,
  FolderIcon,
  MagnifyingGlassIcon,
  PlusIcon,
  EyeIcon,
  PencilIcon
} from '@heroicons/react/24/outline';

interface ComplianceItem {
  id: number;
  title: string;
  category: 'safety' | 'health' | 'staff' | 'facility' | 'documentation' | 'quality';
  status: 'compliant' | 'non_compliant' | 'pending' | 'overdue';
  lastChecked: string;
  nextCheck: string;
  inspector: string;
  description: string;
  requirements: string[];
  documents: string[];
  notes: string;
  priority: 'high' | 'medium' | 'low';
}

const MOCK_COMPLIANCE_DATA: ComplianceItem[] = [
  {
    id: 1,
    title: 'Kiểm tra an toàn PCCC',
    category: 'safety',
    status: 'compliant',
    lastChecked: '2024-01-15',
    nextCheck: '2024-04-15',
    inspector: 'Trần Văn An',
    description: 'Kiểm tra hệ thống báo cháy, lối thoát hiểm và thiết bị PCCC',
    requirements: [
      'Hệ thống báo cháy hoạt động tốt',
      'Lối thoát hiểm thông thoáng',
      'Bình chữa cháy đầy đủ và còn hạn',
      'Nhân viên được tập huấn PCCC'
    ],
    documents: ['Báo cáo kiểm tra PCCC', 'Chứng chỉ tập huấn', 'Sơ đồ thoát hiểm'],
    notes: 'Tất cả thiết bị hoạt động tốt. Đã cập nhật sơ đồ thoát hiểm.',
    priority: 'high'
  },
  {
    id: 2,
    title: 'Chứng nhận chất lượng y tế',
    category: 'health',
    status: 'pending',
    lastChecked: '2023-12-20',
    nextCheck: '2024-02-01',
    inspector: 'BS. Nguyễn Thị Mai',
    description: 'Đánh giá chất lượng dịch vụ y tế và chăm sóc sức khỏe',
    requirements: [
      'Hồ sơ y tế đầy đủ',
      'Thuốc men được bảo quản đúng cách',
      'Nhân viên y tế có chứng chỉ',
      'Thiết bị y tế được kiểm định'
    ],
    documents: ['Danh sách thuốc', 'Chứng chỉ nhân viên', 'Báo cáo kiểm định'],
    notes: 'Đang chuẩn bị hồ sơ cho đợt kiểm tra sắp tới.',
    priority: 'high'
  },
  {
    id: 3,
    title: 'Đánh giá chất lượng thực phẩm',
    category: 'health',
    status: 'compliant',
    lastChecked: '2024-01-10',
    nextCheck: '2024-03-10',
    inspector: 'Phạm Văn Bình',
    description: 'Kiểm tra an toàn thực phẩm và dinh dưỡng',
    requirements: [
      'Nguồn gốc thực phẩm rõ ràng',
      'Bảo quản thực phẩm đúng nhiệt độ',
      'Thực đơn cân bằng dinh dưỡng',
      'Nhân viên bếp có chứng nhận'
    ],
    documents: ['Thực đơn hàng tuần', 'Hóa đơn mua thực phẩm', 'Chứng nhận vệ sinh'],
    notes: 'Chất lượng thực phẩm tốt, thực đơn đa dạng.',
    priority: 'medium'
  },
  {
    id: 4,
    title: 'Kiểm tra nhân sự và đào tạo',
    category: 'staff',
    status: 'non_compliant',
    lastChecked: '2024-01-05',
    nextCheck: '2024-02-05',
    inspector: 'Lê Thị Hương',
    description: 'Đánh giá năng lực và chứng chỉ của nhân viên',
    requirements: [
      'Nhân viên có đủ chứng chỉ',
      'Hoàn thành khóa đào tạo bắt buộc',
      'Tỷ lệ nhân viên/người cao tuổi đạt chuẩn',
      'Hồ sơ nhân sự đầy đủ'
    ],
    documents: ['Hồ sơ nhân viên', 'Chứng chỉ đào tạo', 'Kế hoạch tuyển dụng'],
    notes: 'Cần bổ sung 2 nhân viên chăm sóc và cập nhật chứng chỉ.',
    priority: 'high'
  },
  {
    id: 5,
    title: 'Bảo trì cơ sở vật chất',
    category: 'facility',
    status: 'overdue',
    lastChecked: '2023-11-15',
    nextCheck: '2024-01-15',
    inspector: 'Võ Văn Thành',
    description: 'Kiểm tra và bảo trì các thiết bị, cơ sở vật chất',
    requirements: [
      'Thiết bị y tế hoạt động tốt',
      'Hệ thống điện nước an toàn',
      'Phòng ốc sạch sẽ, thoáng mát',
      'Thiết bị hỗ trợ sinh hoạt đầy đủ'
    ],
    documents: ['Lịch bảo trì', 'Báo cáo sửa chữa', 'Danh sách thiết bị'],
    notes: 'Một số thiết bị cần thay thế. Đã quá hạn kiểm tra.',
    priority: 'high'
  }
];

const CATEGORIES = {
  all: 'Tất cả',
  safety: 'An toàn',
  health: 'Sức khỏe',
  staff: 'Nhân sự',
  facility: 'Cơ sở vật chất',
  documentation: 'Tài liệu',
  quality: 'Chất lượng'
};

export default function CompliancePage() {
  const router = useRouter();
  const { user } = useAuth();
  const [complianceItems, setComplianceItems] = useState<ComplianceItem[]>(MOCK_COMPLIANCE_DATA);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [selectedStatus, setSelectedStatus] = useState<string>('all');

  // Check access permissions
  useEffect(() => {
    if (!user) {
      router.push('/login');
      return;
    }
    
    if (!['admin', 'staff'].includes(user.role)) {
      router.push('/');
      return;
    }
  }, [user, router]);

  // Filter compliance items
  const filteredItems = complianceItems.filter(item => {
    const matchesSearch = item.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         item.description.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = selectedCategory === 'all' || item.category === selectedCategory;
    const matchesStatus = selectedStatus === 'all' || item.status === selectedStatus;
    
    return matchesSearch && matchesCategory && matchesStatus;
  });

  // Calculate statistics
  const totalItems = complianceItems.length;
  const compliantItems = complianceItems.filter(item => item.status === 'compliant').length;
  const pendingItems = complianceItems.filter(item => item.status === 'pending').length;
  const nonCompliantItems = complianceItems.filter(item => item.status === 'non_compliant').length;
  const overdueItems = complianceItems.filter(item => item.status === 'overdue').length;
  const complianceRate = ((compliantItems / totalItems) * 100).toFixed(1);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'compliant':
        return { bg: '#dcfce7', text: '#166534', border: '#bbf7d0' };
      case 'pending':
        return { bg: '#fef3c7', text: '#d97706', border: '#fde68a' };
      case 'non_compliant':
        return { bg: '#fecaca', text: '#dc2626', border: '#fca5a5' };
      case 'overdue':
        return { bg: '#fdf2f8', text: '#be185d', border: '#f9a8d4' };
      default:
        return { bg: '#f3f4f6', text: '#6b7280', border: '#e5e7eb' };
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'compliant':
        return CheckCircleIcon;
      case 'pending':
        return ClockIcon;
      case 'non_compliant':
        return ExclamationTriangleIcon;
      case 'overdue':
        return ExclamationTriangleIcon;
      default:
        return ClockIcon;
    }
  };

  const getCategoryColor = (category: string) => {
    switch (category) {
      case 'safety':
        return '#ef4444';
      case 'health':
        return '#10b981';
      case 'staff':
        return '#3b82f6';
      case 'facility':
        return '#8b5cf6';
      case 'documentation':
        return '#f59e0b';
      case 'quality':
        return '#06b6d4';
      default:
        return '#6b7280';
    }
  };

  return (
    <div style={{
      minHeight: '100vh',
      background: 'linear-gradient(135deg, #f8fafc 0%, #e2e8f0 100%)',
      position: 'relative'
    }}>
      {/* Background decorations */}
      <div style={{
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        background: `
          radial-gradient(circle at 20% 80%, rgba(245, 158, 11, 0.05) 0%, transparent 50%),
          radial-gradient(circle at 80% 20%, rgba(139, 92, 246, 0.05) 0%, transparent 50%),
          radial-gradient(circle at 40% 40%, rgba(16, 185, 129, 0.03) 0%, transparent 50%)
        `,
        pointerEvents: 'none'
      }} />

      <div style={{
        maxWidth: '1400px',
        margin: '0 auto',
        padding: '2rem 1.5rem',
        position: 'relative',
        zIndex: 1
      }}>
        {/* Header */}
        <div style={{
          background: 'linear-gradient(135deg, #ffffff 0%, #f8fafc 100%)',
          borderRadius: '1.5rem',
          padding: '2rem',
          marginBottom: '2rem',
          boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.1), 0 0 0 1px rgba(255, 255, 255, 0.05)',
          border: '1px solid rgba(255, 255, 255, 0.2)',
          backdropFilter: 'blur(10px)'
        }}>
          <div style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            flexWrap: 'wrap',
            gap: '1rem'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
              <div style={{
                width: '3.5rem',
                height: '3.5rem',
                background: 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)',
                borderRadius: '1rem',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                boxShadow: '0 4px 12px rgba(245, 158, 11, 0.3)'
              }}>
                <ShieldCheckIcon style={{ width: '2rem', height: '2rem', color: 'white' }} />
              </div>
              <div>
                <h1 style={{
                  fontSize: '2rem',
                  fontWeight: 700,
                  margin: 0,
                  background: 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)',
                  WebkitBackgroundClip: 'text',
                  WebkitTextFillColor: 'transparent',
                  letterSpacing: '-0.025em'
                }}>
                  Quản lý Tuân thủ
                </h1>
                <p style={{
                  fontSize: '1rem',
                  color: '#64748b',
                  margin: '0.25rem 0 0 0',
                  fontWeight: 500
                }}>
                  Giám sát và báo cáo tuân thủ quy định
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Statistics Cards */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
          gap: '1rem',
          marginBottom: '2rem'
        }}>
          <div style={{
            background: 'linear-gradient(135deg, #ffffff 0%, #f0fdf4 100%)',
            borderRadius: '1rem',
            padding: '1.5rem',
            boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
            border: '1px solid rgba(34, 197, 94, 0.2)'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
              <div style={{
                width: '3rem',
                height: '3rem',
                background: 'linear-gradient(135deg, #22c55e 0%, #16a34a 100%)',
                borderRadius: '0.75rem',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}>
                <CheckCircleIcon style={{ width: '1.5rem', height: '1.5rem', color: 'white' }} />
              </div>
              <div>
                <div style={{ fontSize: '2rem', fontWeight: 700, color: '#16a34a' }}>
                  {complianceRate}%
                </div>
                <div style={{ fontSize: '0.875rem', color: '#6b7280', fontWeight: 500 }}>
                  Tỷ lệ tuân thủ
                </div>
              </div>
            </div>
          </div>

          <div style={{
            background: 'linear-gradient(135deg, #ffffff 0%, #fefce8 100%)',
            borderRadius: '1rem',
            padding: '1.5rem',
            boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
            border: '1px solid rgba(245, 158, 11, 0.2)'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
              <div style={{
                width: '3rem',
                height: '3rem',
                background: 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)',
                borderRadius: '0.75rem',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}>
                <ClockIcon style={{ width: '1.5rem', height: '1.5rem', color: 'white' }} />
              </div>
              <div>
                <div style={{ fontSize: '2rem', fontWeight: 700, color: '#d97706' }}>
                  {pendingItems}
                </div>
                <div style={{ fontSize: '0.875rem', color: '#6b7280', fontWeight: 500 }}>
                  Đang chờ kiểm tra
                </div>
              </div>
            </div>
          </div>

          <div style={{
            background: 'linear-gradient(135deg, #ffffff 0%, #fef2f2 100%)',
            borderRadius: '1rem',
            padding: '1.5rem',
            boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
            border: '1px solid rgba(239, 68, 68, 0.2)'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
              <div style={{
                width: '3rem',
                height: '3rem',
                background: 'linear-gradient(135deg, #ef4444 0%, #dc2626 100%)',
                borderRadius: '0.75rem',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}>
                <ExclamationTriangleIcon style={{ width: '1.5rem', height: '1.5rem', color: 'white' }} />
              </div>
              <div>
                <div style={{ fontSize: '2rem', fontWeight: 700, color: '#dc2626' }}>
                  {nonCompliantItems + overdueItems}
                </div>
                <div style={{ fontSize: '0.875rem', color: '#6b7280', fontWeight: 500 }}>
                  Cần khắc phục
                </div>
              </div>
            </div>
          </div>

          <div style={{
            background: 'linear-gradient(135deg, #ffffff 0%, #f8fafc 100%)',
            borderRadius: '1rem',
            padding: '1.5rem',
            boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
            border: '1px solid rgba(148, 163, 184, 0.2)'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
              <div style={{
                width: '3rem',
                height: '3rem',
                background: 'linear-gradient(135deg, #94a3b8 0%, #64748b 100%)',
                borderRadius: '0.75rem',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}>
                <ChartBarIcon style={{ width: '1.5rem', height: '1.5rem', color: 'white' }} />
              </div>
              <div>
                <div style={{ fontSize: '2rem', fontWeight: 700, color: '#64748b' }}>
                  {totalItems}
                </div>
                <div style={{ fontSize: '0.875rem', color: '#6b7280', fontWeight: 500 }}>
                  Tổng số mục
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Filters */}
        <div style={{
          background: 'white',
          borderRadius: '1rem',
          padding: '1.5rem',
          marginBottom: '2rem',
          boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
          border: '1px solid rgba(255, 255, 255, 0.2)'
        }}>
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
            gap: '1rem',
            alignItems: 'end'
          }}>
            <div>
              <label style={{
                display: 'block',
                fontSize: '0.875rem',
                fontWeight: 600,
                color: '#374151',
                marginBottom: '0.5rem'
              }}>
                Tìm kiếm
              </label>
              <div style={{ position: 'relative' }}>
                <MagnifyingGlassIcon style={{
                  position: 'absolute',
                  left: '0.75rem',
                  top: '50%',
                  transform: 'translateY(-50%)',
                  width: '1rem',
                  height: '1rem',
                  color: '#9ca3af'
                }} />
                <input
                  type="text"
                  placeholder="Tìm kiếm theo tiêu đề hoặc mô tả..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  style={{
                    width: '100%',
                    paddingLeft: '2.5rem',
                    paddingRight: '1rem',
                    paddingTop: '0.75rem',
                    paddingBottom: '0.75rem',
                    borderRadius: '0.5rem',
                    border: '1px solid #d1d5db',
                    fontSize: '0.875rem'
                  }}
                />
              </div>
            </div>

            <div>
              <label style={{
                display: 'block',
                fontSize: '0.875rem',
                fontWeight: 600,
                color: '#374151',
                marginBottom: '0.5rem'
              }}>
                Danh mục
              </label>
              <select
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                style={{
                  width: '100%',
                  padding: '0.75rem',
                  borderRadius: '0.5rem',
                  border: '1px solid #d1d5db',
                  fontSize: '0.875rem'
                }}
              >
                {Object.entries(CATEGORIES).map(([key, label]) => (
                  <option key={key} value={key}>{label}</option>
                ))}
              </select>
            </div>

            <div>
              <label style={{
                display: 'block',
                fontSize: '0.875rem',
                fontWeight: 600,
                color: '#374151',
                marginBottom: '0.5rem'
              }}>
                Trạng thái
              </label>
              <select
                value={selectedStatus}
                onChange={(e) => setSelectedStatus(e.target.value)}
                style={{
                  width: '100%',
                  padding: '0.75rem',
                  borderRadius: '0.5rem',
                  border: '1px solid #d1d5db',
                  fontSize: '0.875rem'
                }}
              >
                <option value="all">Tất cả</option>
                <option value="compliant">Tuân thủ</option>
                <option value="pending">Chờ kiểm tra</option>
                <option value="non_compliant">Không tuân thủ</option>
                <option value="overdue">Quá hạn</option>
              </select>
            </div>
          </div>
        </div>

        {/* Compliance Items */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(400px, 1fr))',
          gap: '1.5rem'
        }}>
          {filteredItems.map((item) => {
            const statusColor = getStatusColor(item.status);
            const StatusIcon = getStatusIcon(item.status);
            const categoryColor = getCategoryColor(item.category);

            return (
              <div
                key={item.id}
                style={{
                  background: 'linear-gradient(135deg, #ffffff 0%, #f8fafc 100%)',
                  borderRadius: '1rem',
                  padding: '1.5rem',
                  boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
                  border: '1px solid rgba(255, 255, 255, 0.2)',
                  transition: 'all 0.3s ease'
                }}
                onMouseOver={(e) => {
                  e.currentTarget.style.transform = 'translateY(-2px)';
                  e.currentTarget.style.boxShadow = '0 8px 15px -3px rgba(0, 0, 0, 0.15)';
                }}
                onMouseOut={(e) => {
                  e.currentTarget.style.transform = 'translateY(0)';
                  e.currentTarget.style.boxShadow = '0 4px 6px -1px rgba(0, 0, 0, 0.1)';
                }}
              >
                {/* Header */}
                <div style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'flex-start',
                  marginBottom: '1rem'
                }}>
                  <div style={{ flex: 1 }}>
                    <h3 style={{
                      fontSize: '1.125rem',
                      fontWeight: 600,
                      color: '#111827',
                      margin: 0,
                      marginBottom: '0.5rem'
                    }}>
                      {item.title}
                    </h3>
                    <div style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '0.25rem',
                      padding: '0.25rem 0.75rem',
                      borderRadius: '9999px',
                      fontSize: '0.75rem',
                      fontWeight: 600,
                      background: categoryColor + '20',
                      color: categoryColor
                    }}>
                      {CATEGORIES[item.category as keyof typeof CATEGORIES]}
                    </div>
                  </div>
                  <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.25rem',
                    padding: '0.5rem 1rem',
                    borderRadius: '9999px',
                    fontSize: '0.75rem',
                    fontWeight: 600,
                    background: statusColor.bg,
                    color: statusColor.text,
                    border: `1px solid ${statusColor.border}`
                  }}>
                    <StatusIcon style={{ width: '0.875rem', height: '0.875rem' }} />
                    {item.status === 'compliant' && 'Tuân thủ'}
                    {item.status === 'pending' && 'Chờ kiểm tra'}
                    {item.status === 'non_compliant' && 'Không tuân thủ'}
                    {item.status === 'overdue' && 'Quá hạn'}
                  </div>
                </div>

                {/* Description */}
                <p style={{
                  fontSize: '0.875rem',
                  color: '#6b7280',
                  marginBottom: '1rem',
                  lineHeight: 1.5
                }}>
                  {item.description}
                </p>

                {/* Dates */}
                <div style={{
                  display: 'grid',
                  gridTemplateColumns: '1fr 1fr',
                  gap: '1rem',
                  marginBottom: '1rem'
                }}>
                  <div>
                    <div style={{
                      fontSize: '0.75rem',
                      color: '#6b7280',
                      fontWeight: 500,
                      marginBottom: '0.25rem'
                    }}>
                      Kiểm tra cuối
                    </div>
                    <div style={{
                      fontSize: '0.875rem',
                      color: '#374151',
                      fontWeight: 600
                    }}>
                      {new Date(item.lastChecked).toLocaleDateString('vi-VN')}
                    </div>
                  </div>
                  <div>
                    <div style={{
                      fontSize: '0.75rem',
                      color: '#6b7280',
                      fontWeight: 500,
                      marginBottom: '0.25rem'
                    }}>
                      Kiểm tra tiếp theo
                    </div>
                    <div style={{
                      fontSize: '0.875rem',
                      color: item.status === 'overdue' ? '#dc2626' : '#374151',
                      fontWeight: 600
                    }}>
                      {new Date(item.nextCheck).toLocaleDateString('vi-VN')}
                    </div>
                  </div>
                </div>

                {/* Inspector */}
                <div style={{
                  fontSize: '0.875rem',
                  color: '#6b7280',
                  marginBottom: '1rem',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.5rem'
                }}>
                  <span style={{ fontWeight: 500 }}>Kiểm tra viên:</span>
                  <span style={{ color: '#374151', fontWeight: 600 }}>{item.inspector}</span>
                </div>

                {/* Documents count */}
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.5rem',
                  marginBottom: '1rem',
                  fontSize: '0.875rem',
                  color: '#6b7280'
                }}>
                  <FolderIcon style={{ width: '1rem', height: '1rem' }} />
                  <span>{item.documents.length} tài liệu</span>
                </div>

                {/* Actions */}
                <div style={{
                  display: 'flex',
                  gap: '0.5rem',
                  justifyContent: 'flex-end'
                }}>
                  <button style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.25rem',
                    padding: '0.5rem 1rem',
                    borderRadius: '0.5rem',
                    border: '1px solid #d1d5db',
                    background: 'white',
                    color: '#374151',
                    fontSize: '0.875rem',
                    fontWeight: 500,
                    cursor: 'pointer',
                    transition: 'all 0.2s ease'
                  }}>
                    <EyeIcon style={{ width: '1rem', height: '1rem' }} />
                    Xem
                  </button>
                  <button style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.25rem',
                    padding: '0.5rem 1rem',
                    borderRadius: '0.5rem',
                    border: 'none',
                    background: 'linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)',
                    color: 'white',
                    fontSize: '0.875rem',
                    fontWeight: 500,
                    cursor: 'pointer',
                    transition: 'all 0.2s ease'
                  }}>
                    <PencilIcon style={{ width: '1rem', height: '1rem' }} />
                    Cập nhật
                  </button>
                </div>
              </div>
            );
          })}
        </div>

        {filteredItems.length === 0 && (
          <div style={{
            background: 'white',
            borderRadius: '1rem',
            padding: '3rem',
            textAlign: 'center',
            boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
          }}>
            <DocumentCheckIcon style={{
              width: '4rem',
              height: '4rem',
              color: '#d1d5db',
              margin: '0 auto 1rem'
            }} />
            <h3 style={{
              fontSize: '1.125rem',
              fontWeight: 600,
              color: '#374151',
              marginBottom: '0.5rem'
            }}>
              Không tìm thấy mục tuân thủ nào
            </h3>
            <p style={{
              fontSize: '0.875rem',
              color: '#6b7280'
            }}>
              Thử thay đổi bộ lọc hoặc từ khóa tìm kiếm
            </p>
          </div>
        )}
      </div>
    </div>
  );
} 
