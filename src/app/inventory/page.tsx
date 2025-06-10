"use client";

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth-context';
import { 
  CubeIcon,
  MagnifyingGlassIcon,
  FunnelIcon,
  PlusCircleIcon,
  ExclamationTriangleIcon,
  ClockIcon,
  CheckCircleIcon,
  XMarkIcon,
  PencilIcon,
  EyeIcon
} from '@heroicons/react/24/outline';

interface InventoryItem {
  id: number;
  name: string;
  category: 'medication' | 'medical_equipment' | 'daily_supplies' | 'food' | 'cleaning' | 'safety';
  sku: string;
  currentStock: number;
  minStock: number;
  maxStock: number;
  unit: string;
  costPerUnit: number;
  supplier: string;
  expiryDate?: string;
  location: string;
  lastUpdated: string;
  status: 'in_stock' | 'low_stock' | 'out_of_stock' | 'expired';
  description: string;
}

const MOCK_INVENTORY: InventoryItem[] = [
  {
    id: 1,
    name: 'Paracetamol 500mg',
    category: 'medication',
    sku: 'MED-001',
    currentStock: 50,
    minStock: 100,
    maxStock: 500,
    unit: 'viên',
    costPerUnit: 500,
    supplier: 'Dược phẩm ABC',
    expiryDate: '2024-12-31',
    location: 'Tủ thuốc A-1',
    lastUpdated: '2024-01-15',
    status: 'low_stock',
    description: 'Thuốc giảm đau, hạ sốt'
  },
  {
    id: 2,
    name: 'Máy đo huyết áp',
    category: 'medical_equipment',
    sku: 'EQP-001',
    currentStock: 3,
    minStock: 2,
    maxStock: 5,
    unit: 'cái',
    costPerUnit: 1500000,
    supplier: 'Thiết bị y tế XYZ',
    location: 'Phòng y tế',
    lastUpdated: '2024-01-10',
    status: 'in_stock',
    description: 'Máy đo huyết áp điện tử'
  },
  {
    id: 3,
    name: 'Khẩu trang y tế',
    category: 'safety',
    sku: 'SAF-001',
    currentStock: 20,
    minStock: 100,
    maxStock: 1000,
    unit: 'hộp',
    costPerUnit: 50000,
    supplier: 'Vật tư y tế DEF',
    location: 'Kho chính',
    lastUpdated: '2024-01-12',
    status: 'low_stock',
    description: 'Khẩu trang 3 lớp'
  }
];

const CATEGORIES = [
  { value: 'all', label: 'Tất cả' },
  { value: 'medication', label: 'Thuốc' },
  { value: 'medical_equipment', label: 'Thiết bị y tế' },
  { value: 'daily_supplies', label: 'Vật tư hàng ngày' },
  { value: 'food', label: 'Thực phẩm' },
  { value: 'cleaning', label: 'Vệ sinh' },
  { value: 'safety', label: 'An toàn' }
];

const STATUSES = [
  { value: 'all', label: 'Tất cả' },
  { value: 'in_stock', label: 'Còn hàng' },
  { value: 'low_stock', label: 'Sắp hết' },
  { value: 'out_of_stock', label: 'Hết hàng' },
  { value: 'expired', label: 'Hết hạn' }
];

export default function InventoryPage() {
  const router = useRouter();
  const { user } = useAuth();
  const [inventory, setInventory] = useState<InventoryItem[]>(MOCK_INVENTORY);
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [showAddModal, setShowAddModal] = useState(false);
  const [selectedItem, setSelectedItem] = useState<InventoryItem | null>(null);

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

  // Filter inventory
  const filteredInventory = inventory.filter(item => {
    const matchesSearch = item.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          item.sku.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = categoryFilter === 'all' || item.category === categoryFilter;
    const matchesStatus = statusFilter === 'all' || item.status === statusFilter;
    
    return matchesSearch && matchesCategory && matchesStatus;
  });

  // Get status info
  const getStatusInfo = (status: string) => {
    switch (status) {
      case 'in_stock':
        return { color: '#16a34a', bg: '#dcfce7', text: 'Còn hàng' };
      case 'low_stock':
        return { color: '#d97706', bg: '#fef3c7', text: 'Sắp hết' };
      case 'out_of_stock':
        return { color: '#dc2626', bg: '#fee2e2', text: 'Hết hàng' };
      case 'expired':
        return { color: '#7c2d12', bg: '#fef2f2', text: 'Hết hạn' };
      default:
        return { color: '#6b7280', bg: '#f3f4f6', text: 'Không xác định' };
    }
  };

  // Get category label
  const getCategoryLabel = (category: string) => {
    const cat = CATEGORIES.find(c => c.value === category);
    return cat ? cat.label : category;
  };

  // Format currency
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: 'VND'
    }).format(amount);
  };

  // Check if item is expiring soon (within 30 days)
  const isExpiringSoon = (expiryDate?: string) => {
    if (!expiryDate) return false;
    const expiry = new Date(expiryDate);
    const today = new Date();
    const diffTime = expiry.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays <= 30 && diffDays > 0;
  };

  return (
    <div style={{
      minHeight: '100vh',
      background: 'linear-gradient(135deg, #f8fafc 0%, #e2e8f0 100%)',
      position: 'relative'
    }}>
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
          boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.1)',
          border: '1px solid rgba(255, 255, 255, 0.2)'
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
                background: 'linear-gradient(135deg, #06b6d4 0%, #0891b2 100%)',
                borderRadius: '1rem',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                boxShadow: '0 4px 12px rgba(6, 182, 212, 0.3)'
              }}>
                <CubeIcon style={{ width: '2rem', height: '2rem', color: 'white' }} />
              </div>
              <div>
                <h1 style={{
                  fontSize: '2rem',
                  fontWeight: 700,
                  margin: 0,
                  background: 'linear-gradient(135deg, #06b6d4 0%, #0891b2 100%)',
                  WebkitBackgroundClip: 'text',
                  WebkitTextFillColor: 'transparent'
                }}>
                  Quản lý kho
                </h1>
                <p style={{
                  fontSize: '1rem',
                  color: '#64748b',
                  margin: '0.25rem 0 0 0',
                  fontWeight: 500
                }}>
                  Quản lý vật tư, thuốc và thiết bị y tế
                </p>
              </div>
            </div>
            
            <button
              onClick={() => setShowAddModal(true)}
              style={{
                padding: '0.875rem 1.5rem',
                borderRadius: '0.75rem',
                border: 'none',
                background: 'linear-gradient(135deg, #16a34a 0%, #15803d 100%)',
                color: 'white',
                fontWeight: 600,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem',
                transition: 'all 0.2s ease'
              }}
            >
              <PlusCircleIcon style={{ width: '1rem', height: '1rem' }} />
              Thêm vật tư
            </button>
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
            {/* Search */}
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
                  placeholder="Tìm theo tên hoặc mã SKU..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  style={{
                    width: '100%',
                    paddingLeft: '2.5rem',
                    paddingRight: '1rem',
                    paddingTop: '0.75rem',
                    paddingBottom: '0.75rem',
                    border: '1px solid #d1d5db',
                    borderRadius: '0.5rem',
                    fontSize: '0.875rem'
                  }}
                />
              </div>
            </div>

            {/* Category Filter */}
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
                value={categoryFilter}
                onChange={(e) => setCategoryFilter(e.target.value)}
                style={{
                  width: '100%',
                  padding: '0.75rem',
                  border: '1px solid #d1d5db',
                  borderRadius: '0.5rem',
                  fontSize: '0.875rem'
                }}
              >
                {CATEGORIES.map(cat => (
                  <option key={cat.value} value={cat.value}>
                    {cat.label}
                  </option>
                ))}
              </select>
            </div>

            {/* Status Filter */}
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
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                style={{
                  width: '100%',
                  padding: '0.75rem',
                  border: '1px solid #d1d5db',
                  borderRadius: '0.5rem',
                  fontSize: '0.875rem'
                }}
              >
                {STATUSES.map(status => (
                  <option key={status.value} value={status.value}>
                    {status.label}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* Inventory List */}
        <div style={{
          background: 'white',
          borderRadius: '1rem',
          overflow: 'hidden',
          boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
          border: '1px solid rgba(255, 255, 255, 0.2)'
        }}>
          <div style={{
            overflowX: 'auto'
          }}>
            <table style={{
              width: '100%',
              borderCollapse: 'collapse'
            }}>
              <thead>
                <tr style={{ background: '#f8fafc' }}>
                  <th style={{ padding: '1rem', textAlign: 'left', fontWeight: 600, color: '#374151' }}>
                    Sản phẩm
                  </th>
                  <th style={{ padding: '1rem', textAlign: 'left', fontWeight: 600, color: '#374151' }}>
                    Danh mục
                  </th>
                  <th style={{ padding: '1rem', textAlign: 'left', fontWeight: 600, color: '#374151' }}>
                    Tồn kho
                  </th>
                  <th style={{ padding: '1rem', textAlign: 'left', fontWeight: 600, color: '#374151' }}>
                    Trạng thái
                  </th>
                  <th style={{ padding: '1rem', textAlign: 'left', fontWeight: 600, color: '#374151' }}>
                    Giá trị
                  </th>
                  <th style={{ padding: '1rem', textAlign: 'left', fontWeight: 600, color: '#374151' }}>
                    Hành động
                  </th>
                </tr>
              </thead>
              <tbody>
                {filteredInventory.map((item, index) => {
                  const statusInfo = getStatusInfo(item.status);
                  const isExpiring = isExpiringSoon(item.expiryDate);
                  
                  return (
                    <tr 
                      key={item.id}
                      style={{
                        borderBottom: index < filteredInventory.length - 1 ? '1px solid #f1f5f9' : 'none'
                      }}
                    >
                      <td style={{ padding: '1rem' }}>
                        <div>
                          <div style={{ 
                            fontWeight: 600, 
                            color: '#111827',
                            marginBottom: '0.25rem'
                          }}>
                            {item.name}
                          </div>
                          <div style={{ 
                            fontSize: '0.875rem', 
                            color: '#6b7280',
                            marginBottom: '0.25rem'
                          }}>
                            SKU: {item.sku}
                          </div>
                          <div style={{ 
                            fontSize: '0.75rem', 
                            color: '#9ca3af'
                          }}>
                            {item.location}
                          </div>
                          {isExpiring && (
                            <div style={{
                              display: 'flex',
                              alignItems: 'center',
                              gap: '0.25rem',
                              marginTop: '0.25rem'
                            }}>
                              <ExclamationTriangleIcon style={{
                                width: '0.875rem',
                                height: '0.875rem',
                                color: '#f59e0b'
                              }} />
                              <span style={{
                                fontSize: '0.75rem',
                                color: '#f59e0b',
                                fontWeight: 500
                              }}>
                                Sắp hết hạn
                              </span>
                            </div>
                          )}
                        </div>
                      </td>
                      <td style={{ padding: '1rem' }}>
                        <span style={{
                          padding: '0.25rem 0.75rem',
                          borderRadius: '9999px',
                          fontSize: '0.75rem',
                          fontWeight: 500,
                          background: '#e0e7ff',
                          color: '#3730a3'
                        }}>
                          {getCategoryLabel(item.category)}
                        </span>
                      </td>
                      <td style={{ padding: '1rem' }}>
                        <div>
                          <div style={{ fontWeight: 600, color: '#111827' }}>
                            {item.currentStock} {item.unit}
                          </div>
                          <div style={{ 
                            fontSize: '0.75rem', 
                            color: '#6b7280'
                          }}>
                            Min: {item.minStock} / Max: {item.maxStock}
                          </div>
                        </div>
                      </td>
                      <td style={{ padding: '1rem' }}>
                        <span style={{
                          padding: '0.25rem 0.75rem',
                          borderRadius: '9999px',
                          fontSize: '0.75rem',
                          fontWeight: 500,
                          background: statusInfo.bg,
                          color: statusInfo.color
                        }}>
                          {statusInfo.text}
                        </span>
                      </td>
                      <td style={{ padding: '1rem' }}>
                        <div style={{ fontWeight: 600, color: '#111827' }}>
                          {formatCurrency(item.currentStock * item.costPerUnit)}
                        </div>
                        <div style={{ 
                          fontSize: '0.75rem', 
                          color: '#6b7280'
                        }}>
                          {formatCurrency(item.costPerUnit)}/{item.unit}
                        </div>
                      </td>
                      <td style={{ padding: '1rem' }}>
                        <div style={{ display: 'flex', gap: '0.5rem' }}>
                          <button
                            onClick={() => setSelectedItem(item)}
                            style={{
                              padding: '0.5rem',
                              borderRadius: '0.375rem',
                              border: 'none',
                              background: '#3b82f6',
                              color: 'white',
                              cursor: 'pointer'
                            }}
                            title="Xem chi tiết"
                          >
                            <EyeIcon style={{ width: '1rem', height: '1rem' }} />
                          </button>
                          <button
                            style={{
                              padding: '0.5rem',
                              borderRadius: '0.375rem',
                              border: 'none',
                              background: '#f59e0b',
                              color: 'white',
                              cursor: 'pointer'
                            }}
                            title="Chỉnh sửa"
                          >
                            <PencilIcon style={{ width: '1rem', height: '1rem' }} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {filteredInventory.length === 0 && (
            <div style={{
              padding: '3rem',
              textAlign: 'center'
            }}>
              <CubeIcon style={{ width: '3rem', height: '3rem', color: '#d1d5db', margin: '0 auto 1rem' }} />
              <h3 style={{
                fontSize: '1.125rem',
                fontWeight: 600,
                color: '#6b7280',
                margin: '0 0 0.5rem 0'
              }}>
                Không tìm thấy vật tư nào
              </h3>
              <p style={{
                fontSize: '0.875rem',
                color: '#9ca3af',
                margin: 0
              }}>
                Thử điều chỉnh bộ lọc hoặc thêm vật tư mới
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
} 