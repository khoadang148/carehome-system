"use client";

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/contexts/auth-context';
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
  EyeIcon,
  ArrowLeftIcon
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

interface ValidationErrors {
  name?: string;
  category?: string;
  sku?: string;
  currentStock?: string;
  minStock?: string;
  maxStock?: string;
  unit?: string;
  costPerUnit?: string;
  supplier?: string;
  location?: string;
  expiryDate?: string;
}

export default function InventoryPage() {

  const router = useRouter();
  const { user } = useAuth();
  const [inventory, setInventory] = useState<InventoryItem[]>(MOCK_INVENTORY);
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [showAddModal, setShowAddModal] = useState(false);
  const [showViewModal, setShowViewModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [selectedItem, setSelectedItem] = useState<InventoryItem | null>(null);
  const [formData, setFormData] = useState<Partial<InventoryItem>>({
    name: '',
    category: 'medication',
    sku: '',
    currentStock: 0,
    minStock: 0,
    maxStock: 0,
    unit: '',
    costPerUnit: 0,
    supplier: '',
    expiryDate: '',
    location: '',
    description: ''
  });
  const [validationErrors, setValidationErrors] = useState<ValidationErrors>({});
  
  useEffect(() => {
    console.log('Modal states:', { showAddModal, showViewModal, showEditModal });
    // Only hide header for modals, not the main page
    const hasModalOpen = showAddModal || showViewModal || showEditModal;
    
    if (hasModalOpen) {
      console.log('Modal is open - adding hide-header class');
      document.body.classList.add('hide-header');
      document.body.style.overflow = 'hidden';
    } else {
      console.log('No modal open - removing hide-header class');
      document.body.classList.remove('hide-header');
      document.body.style.overflow = 'unset';
    }
    
    return () => {
      document.body.classList.remove('hide-header');
      document.body.style.overflow = 'unset';
    };
  }, [showAddModal, showViewModal, showEditModal]);

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

  // Validate form data
  const validateForm = (data: Partial<InventoryItem>): ValidationErrors => {
    const errors: ValidationErrors = {};

    // Validate name
    if (!data.name?.trim()) {
      errors.name = 'Tên vật tư không được để trống';
    } else if (data.name.length > 100) {
      errors.name = 'Tên vật tư không được vượt quá 100 ký tự';
    }

    // Validate category
    if (!data.category) {
      errors.category = 'Vui lòng chọn danh mục';
    }

    // Validate SKU
    if (!data.sku?.trim()) {
      errors.sku = 'Mã SKU không được để trống';
    } else if (!/^[A-Z0-9-]+$/.test(data.sku)) {
      errors.sku = 'Mã SKU chỉ được chứa chữ hoa, số và dấu gạch ngang';
    }

    // Validate current stock
    if (data.currentStock === undefined || data.currentStock === null) {
      errors.currentStock = 'Số lượng tồn kho không được để trống';
    } else if (data.currentStock < 0) {
      errors.currentStock = 'Số lượng tồn kho không được âm';
    }

    // Validate min stock
    if (data.minStock === undefined || data.minStock === null) {
      errors.minStock = 'Số lượng tối thiểu không được để trống';
    } else if (data.minStock < 0) {
      errors.minStock = 'Số lượng tối thiểu không được âm';
    }

    // Validate max stock
    if (data.maxStock === undefined || data.maxStock === null) {
      errors.maxStock = 'Số lượng tối đa không được để trống';
    } else if (data.maxStock < 0) {
      errors.maxStock = 'Số lượng tối đa không được âm';
    }

    // Validate min/max stock relationship
    if (data.minStock !== undefined && data.maxStock !== undefined && data.minStock > data.maxStock) {
      errors.minStock = 'Số lượng tối thiểu không được lớn hơn số lượng tối đa';
      errors.maxStock = 'Số lượng tối đa không được nhỏ hơn số lượng tối thiểu';
    }

    // Validate current stock against min/max
    if (data.currentStock !== undefined && data.minStock !== undefined && data.maxStock !== undefined) {
      if (data.currentStock < data.minStock) {
        errors.currentStock = 'Số lượng tồn kho không được nhỏ hơn số lượng tối thiểu';
      } else if (data.currentStock > data.maxStock) {
        errors.currentStock = 'Số lượng tồn kho không được lớn hơn số lượng tối đa';
      }
    }

    // Validate unit
    if (!data.unit?.trim()) {
      errors.unit = 'Đơn vị không được để trống';
    }

    // Validate cost per unit
    if (data.costPerUnit === undefined || data.costPerUnit === null) {
      errors.costPerUnit = 'Giá nhập không được để trống';
    } else if (data.costPerUnit < 0) {
      errors.costPerUnit = 'Giá nhập không được âm';
    }

    // Validate supplier
    if (!data.supplier?.trim()) {
      errors.supplier = 'Nhà cung cấp không được để trống';
    }

    // Validate location
    if (!data.location?.trim()) {
      errors.location = 'Vị trí lưu trữ không được để trống';
    }

    // Validate expiry date if provided
    if (data.expiryDate) {
      const expiryDate = new Date(data.expiryDate);
      const today = new Date();
      if (expiryDate < today) {
        errors.expiryDate = 'Ngày hết hạn không được trong quá khứ';
      }
    }

    return errors;
  };

  // Handle form input changes
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));

    // Clear validation error for the field being changed
    if (validationErrors[name as keyof ValidationErrors]) {
      setValidationErrors(prev => ({
        ...prev,
        [name]: undefined
      }));
    }
  };

  // Handle add new item
  const handleAddItem = () => {
    const errors = validateForm(formData);
    if (Object.keys(errors).length > 0) {
      setValidationErrors(errors);
      return;
    }

    const newItem: InventoryItem = {
      id: inventory.length + 1,
      ...formData as Omit<InventoryItem, 'id' | 'status' | 'lastUpdated'>,
      status: 'in_stock',
      lastUpdated: new Date().toISOString().split('T')[0]
    };
    setInventory(prev => [...prev, newItem]);
    setShowAddModal(false);
    setFormData({
      name: '',
      category: 'medication',
      sku: '',
      currentStock: 0,
      minStock: 0,
      maxStock: 0,
      unit: '',
      costPerUnit: 0,
      supplier: '',
      expiryDate: '',
      location: '',
      description: ''
    });
    setValidationErrors({});
  };

  // Handle edit item
  const handleEditItem = () => {
    if (!selectedItem) return;

    const errors = validateForm(formData);
    if (Object.keys(errors).length > 0) {
      setValidationErrors(errors);
      return;
    }
    
    const updatedItem = {
      ...selectedItem,
      ...formData,
      lastUpdated: new Date().toISOString().split('T')[0]
    };
    
    setInventory(prev => prev.map(item => 
      item.id === selectedItem.id ? updatedItem : item
    ));
    setShowEditModal(false);
    setSelectedItem(null);
    setValidationErrors({});
  };

  // Open edit modal
  const handleEditClick = (item: InventoryItem) => {
    setSelectedItem(item);
    setFormData(item);
    setShowEditModal(true);
  };

  // Open view modal
  const handleViewClick = (item: InventoryItem) => {
    setSelectedItem(item);
    setShowViewModal(true);
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
        <button
          onClick={() => router.push('/')}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem',
            padding: '0.75rem 1rem',
            background: 'white',
            color: '#374151',
            border: '1px solid #d1d5db',
            borderRadius: '0.5rem',
            fontSize: '0.875rem',
            fontWeight: 500,
            cursor: 'pointer',
            marginBottom: '1rem',
            boxShadow: '0 1px 2px rgba(0, 0, 0, 0.05)'
          }}
        >
          <ArrowLeftIcon style={{ width: '1rem', height: '1rem' }} />
          Quay lại
        </button>

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
                            onClick={() => handleViewClick(item)}
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
                            onClick={() => handleEditClick(item)}
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

      {/* Add Modal */}
      {showAddModal && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'rgba(0, 0, 0, 0.5)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000
        }}>
          <div style={{
            background: 'white',
            borderRadius: '1rem',
            padding: '2rem',
            width: '100%',
            maxWidth: '600px',
            maxHeight: '90vh',
            overflowY: 'auto'
          }}>
            <div style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              marginBottom: '1.5rem'
            }}>
              <h2 style={{
                fontSize: '1.5rem',
                fontWeight: 600,
                color: '#111827',
                margin: 0
              }}>
                Thêm vật tư mới
              </h2>
              <button
                onClick={() => setShowAddModal(false)}
                style={{
                  background: 'none',
                  border: 'none',
                  cursor: 'pointer',
                  padding: '0.5rem'
                }}
              >
                <XMarkIcon style={{ width: '1.5rem', height: '1.5rem', color: '#6b7280' }} />
              </button>
            </div>

            <div style={{ display: 'grid', gap: '1rem' }}>
              <div>
                <label style={{
                  display: 'block',
                  fontSize: '0.875rem',
                  fontWeight: 600,
                  color: '#374151',
                  marginBottom: '0.5rem'
                }}>
                  Tên vật tư *
                </label>
                <input
                  type="text"
                  name="name"
                  value={formData.name}
                  onChange={handleInputChange}
                  style={{
                    width: '100%',
                    padding: '0.75rem',
                    border: validationErrors.name ? '1px solid #dc2626' : '1px solid #d1d5db',
                    borderRadius: '0.5rem',
                    fontSize: '0.875rem'
                  }}
                  placeholder="Nhập tên vật tư"
                />
                {validationErrors.name && (
                  <p style={{
                    color: '#dc2626',
                    fontSize: '0.75rem',
                    marginTop: '0.25rem'
                  }}>
                    {validationErrors.name}
                  </p>
                )}
              </div>

              <div>
                <label style={{
                  display: 'block',
                  fontSize: '0.875rem',
                  fontWeight: 600,
                  color: '#374151',
                  marginBottom: '0.5rem'
                }}>
                  Danh mục *
                </label>
                <select
                  name="category"
                  value={formData.category}
                  onChange={handleInputChange}
                  style={{
                    width: '100%',
                    padding: '0.75rem',
                    border: '1px solid #d1d5db',
                    borderRadius: '0.5rem',
                    fontSize: '0.875rem'
                  }}
                >
                  {CATEGORIES.filter(cat => cat.value !== 'all').map(cat => (
                    <option key={cat.value} value={cat.value}>
                      {cat.label}
                    </option>
                  ))}
                </select>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                <div>
                  <label style={{
                    display: 'block',
                    fontSize: '0.875rem',
                    fontWeight: 600,
                    color: '#374151',
                    marginBottom: '0.5rem'
                  }}>
                    Mã SKU *
                  </label>
                  <input
                    type="text"
                    name="sku"
                    value={formData.sku}
                    onChange={handleInputChange}
                    style={{
                      width: '100%',
                      padding: '0.75rem',
                      border: '1px solid #d1d5db',
                      borderRadius: '0.5rem',
                      fontSize: '0.875rem'
                    }}
                    placeholder="Nhập mã SKU"
                  />
                </div>

                <div>
                  <label style={{
                    display: 'block',
                    fontSize: '0.875rem',
                    fontWeight: 600,
                    color: '#374151',
                    marginBottom: '0.5rem'
                  }}>
                    Đơn vị *
                  </label>
                  <input
                    type="text"
                    name="unit"
                    value={formData.unit}
                    onChange={handleInputChange}
                    style={{
                      width: '100%',
                      padding: '0.75rem',
                      border: '1px solid #d1d5db',
                      borderRadius: '0.5rem',
                      fontSize: '0.875rem'
                    }}
                    placeholder="Nhập đơn vị"
                  />
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '1rem' }}>
                <div>
                  <label style={{
                    display: 'block',
                    fontSize: '0.875rem',
                    fontWeight: 600,
                    color: '#374151',
                    marginBottom: '0.5rem'
                  }}>
                    Tồn kho hiện tại *
                  </label>
                  <input
                    type="number"
                    name="currentStock"
                    value={formData.currentStock}
                    onChange={handleInputChange}
                    style={{
                      width: '100%',
                      padding: '0.75rem',
                      border: '1px solid #d1d5db',
                      borderRadius: '0.5rem',
                      fontSize: '0.875rem'
                    }}
                    min="0"
                  />
                </div>

                <div>
                  <label style={{
                    display: 'block',
                    fontSize: '0.875rem',
                    fontWeight: 600,
                    color: '#374151',
                    marginBottom: '0.5rem'
                  }}>
                    Tồn kho tối thiểu *
                  </label>
                  <input
                    type="number"
                    name="minStock"
                    value={formData.minStock}
                    onChange={handleInputChange}
                    style={{
                      width: '100%',
                      padding: '0.75rem',
                      border: '1px solid #d1d5db',
                      borderRadius: '0.5rem',
                      fontSize: '0.875rem'
                    }}
                    min="0"
                  />
                </div>

                <div>
                  <label style={{
                    display: 'block',
                    fontSize: '0.875rem',
                    fontWeight: 600,
                    color: '#374151',
                    marginBottom: '0.5rem'
                  }}>
                    Tồn kho tối đa *
                  </label>
                  <input
                    type="number"
                    name="maxStock"
                    value={formData.maxStock}
                    onChange={handleInputChange}
                    style={{
                      width: '100%',
                      padding: '0.75rem',
                      border: '1px solid #d1d5db',
                      borderRadius: '0.5rem',
                      fontSize: '0.875rem'
                    }}
                    min="0"
                  />
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                <div>
                  <label style={{
                    display: 'block',
                    fontSize: '0.875rem',
                    fontWeight: 600,
                    color: '#374151',
                    marginBottom: '0.5rem'
                  }}>
                    Giá nhập *
                  </label>
                  <input
                    type="number"
                    name="costPerUnit"
                    value={formData.costPerUnit}
                    onChange={handleInputChange}
                    style={{
                      width: '100%',
                      padding: '0.75rem',
                      border: '1px solid #d1d5db',
                      borderRadius: '0.5rem',
                      fontSize: '0.875rem'
                    }}
                    min="0"
                  />
                </div>

                <div>
                  <label style={{
                    display: 'block',
                    fontSize: '0.875rem',
                    fontWeight: 600,
                    color: '#374151',
                    marginBottom: '0.5rem'
                  }}>
                    Ngày hết hạn
                  </label>
                  <input
                    type="date"
                    name="expiryDate"
                    value={formData.expiryDate}
                    onChange={handleInputChange}
                    style={{
                      width: '100%',
                      padding: '0.75rem',
                      border: '1px solid #d1d5db',
                      borderRadius: '0.5rem',
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
                  Nhà cung cấp *
                </label>
                <input
                  type="text"
                  name="supplier"
                  value={formData.supplier}
                  onChange={handleInputChange}
                  style={{
                    width: '100%',
                    padding: '0.75rem',
                    border: '1px solid #d1d5db',
                    borderRadius: '0.5rem',
                    fontSize: '0.875rem'
                  }}
                  placeholder="Nhập tên nhà cung cấp"
                />
              </div>

              <div>
                <label style={{
                  display: 'block',
                  fontSize: '0.875rem',
                  fontWeight: 600,
                  color: '#374151',
                  marginBottom: '0.5rem'
                }}>
                  Vị trí lưu trữ *
                </label>
                <input
                  type="text"
                  name="location"
                  value={formData.location}
                  onChange={handleInputChange}
                  style={{
                    width: '100%',
                    padding: '0.75rem',
                    border: '1px solid #d1d5db',
                    borderRadius: '0.5rem',
                    fontSize: '0.875rem'
                  }}
                  placeholder="Nhập vị trí lưu trữ"
                />
              </div>

              <div>
                <label style={{
                  display: 'block',
                  fontSize: '0.875rem',
                  fontWeight: 600,
                  color: '#374151',
                  marginBottom: '0.5rem'
                }}>
                  Mô tả
                </label>
                <textarea
                  name="description"
                  value={formData.description}
                  onChange={handleInputChange}
                  style={{
                    width: '100%',
                    padding: '0.75rem',
                    border: '1px solid #d1d5db',
                    borderRadius: '0.5rem',
                    fontSize: '0.875rem',
                    minHeight: '100px',
                    resize: 'vertical'
                  }}
                  placeholder="Nhập mô tả chi tiết"
                />
              </div>
            </div>

            <div style={{
              display: 'flex',
              justifyContent: 'flex-end',
              gap: '1rem',
              marginTop: '2rem'
            }}>
              <button
                onClick={() => setShowAddModal(false)}
                style={{
                  padding: '0.75rem 1.5rem',
                  borderRadius: '0.5rem',
                  border: '1px solid #d1d5db',
                  background: 'white',
                  color: '#374151',
                  fontWeight: 500,
                  cursor: 'pointer'
                }}
              >
                Hủy
              </button>
              <button
                onClick={handleAddItem}
                style={{
                  padding: '0.75rem 1.5rem',
                  borderRadius: '0.5rem',
                  border: 'none',
                  background: '#16a34a',
                  color: 'white',
                  fontWeight: 500,
                  cursor: 'pointer'
                }}
              >
                Thêm vật tư
              </button>
            </div>
          </div>
        </div>
      )}

      {/* View Modal */}
      {showViewModal && selectedItem && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'rgba(0, 0, 0, 0.5)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000
        }}>
          <div style={{
            background: 'white',
            borderRadius: '1rem',
            padding: '2rem',
            width: '100%',
            maxWidth: '600px',
            maxHeight: '90vh',
            overflowY: 'auto'
          }}>
            <div style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              marginBottom: '1.5rem'
            }}>
              <h2 style={{
                fontSize: '1.5rem',
                fontWeight: 600,
                color: '#111827',
                margin: 0
              }}>
                Chi tiết vật tư
              </h2>
              <button
                onClick={() => setShowViewModal(false)}
                style={{
                  background: 'none',
                  border: 'none',
                  cursor: 'pointer',
                  padding: '0.5rem'
                }}
              >
                <XMarkIcon style={{ width: '1.5rem', height: '1.5rem', color: '#6b7280' }} />
              </button>
            </div>

            <div style={{ display: 'grid', gap: '1.5rem' }}>
              <div>
                <h3 style={{
                  fontSize: '1.25rem',
                  fontWeight: 600,
                  color: '#111827',
                  margin: '0 0 0.5rem 0'
                }}>
                  {selectedItem.name}
                </h3>
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.5rem'
                }}>
                  <span style={{
                    padding: '0.25rem 0.75rem',
                    borderRadius: '9999px',
                    fontSize: '0.75rem',
                    fontWeight: 500,
                    background: '#e0e7ff',
                    color: '#3730a3'
                  }}>
                    {getCategoryLabel(selectedItem.category)}
                  </span>
                  <span style={{
                    padding: '0.25rem 0.75rem',
                    borderRadius: '9999px',
                    fontSize: '0.75rem',
                    fontWeight: 500,
                    background: getStatusInfo(selectedItem.status).bg,
                    color: getStatusInfo(selectedItem.status).color
                  }}>
                    {getStatusInfo(selectedItem.status).text}
                  </span>
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                <div>
                  <label style={{
                    display: 'block',
                    fontSize: '0.875rem',
                    fontWeight: 600,
                    color: '#374151',
                    marginBottom: '0.5rem'
                  }}>
                    Mã SKU
                  </label>
                  <div style={{
                    padding: '0.75rem',
                    background: '#f9fafb',
                    borderRadius: '0.5rem',
                    fontSize: '0.875rem',
                    color: '#111827'
                  }}>
                    {selectedItem.sku}
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
                    Đơn vị
                  </label>
                  <div style={{
                    padding: '0.75rem',
                    background: '#f9fafb',
                    borderRadius: '0.5rem',
                    fontSize: '0.875rem',
                    color: '#111827'
                  }}>
                    {selectedItem.unit}
                  </div>
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '1rem' }}>
                <div>
                  <label style={{
                    display: 'block',
                    fontSize: '0.875rem',
                    fontWeight: 600,
                    color: '#374151',
                    marginBottom: '0.5rem'
                  }}>
                    Tồn kho hiện tại
                  </label>
                  <div style={{
                    padding: '0.75rem',
                    background: '#f9fafb',
                    borderRadius: '0.5rem',
                    fontSize: '0.875rem',
                    color: '#111827'
                  }}>
                    {selectedItem.currentStock} {selectedItem.unit}
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
                    Tồn kho tối thiểu
                  </label>
                  <div style={{
                    padding: '0.75rem',
                    background: '#f9fafb',
                    borderRadius: '0.5rem',
                    fontSize: '0.875rem',
                    color: '#111827'
                  }}>
                    {selectedItem.minStock} {selectedItem.unit}
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
                    Tồn kho tối đa
                  </label>
                  <div style={{
                    padding: '0.75rem',
                    background: '#f9fafb',
                    borderRadius: '0.5rem',
                    fontSize: '0.875rem',
                    color: '#111827'
                  }}>
                    {selectedItem.maxStock} {selectedItem.unit}
                  </div>
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                <div>
                  <label style={{
                    display: 'block',
                    fontSize: '0.875rem',
                    fontWeight: 600,
                    color: '#374151',
                    marginBottom: '0.5rem'
                  }}>
                    Giá nhập
                  </label>
                  <div style={{
                    padding: '0.75rem',
                    background: '#f9fafb',
                    borderRadius: '0.5rem',
                    fontSize: '0.875rem',
                    color: '#111827'
                  }}>
                    {formatCurrency(selectedItem.costPerUnit)}/{selectedItem.unit}
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
                    Ngày hết hạn
                  </label>
                  <div style={{
                    padding: '0.75rem',
                    background: '#f9fafb',
                    borderRadius: '0.5rem',
                    fontSize: '0.875rem',
                    color: '#111827'
                  }}>
                    {selectedItem.expiryDate || 'Không có'}
                  </div>
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
                  Nhà cung cấp
                </label>
                <div style={{
                  padding: '0.75rem',
                  background: '#f9fafb',
                  borderRadius: '0.5rem',
                  fontSize: '0.875rem',
                  color: '#111827'
                }}>
                  {selectedItem.supplier}
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
                  Vị trí lưu trữ
                </label>
                <div style={{
                  padding: '0.75rem',
                  background: '#f9fafb',
                  borderRadius: '0.5rem',
                  fontSize: '0.875rem',
                  color: '#111827'
                }}>
                  {selectedItem.location}
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
                  Mô tả
                </label>
                <div style={{
                  padding: '0.75rem',
                  background: '#f9fafb',
                  borderRadius: '0.5rem',
                  fontSize: '0.875rem',
                  color: '#111827',
                  minHeight: '100px'
                }}>
                  {selectedItem.description}
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
                  Cập nhật lần cuối
                </label>
                <div style={{
                  padding: '0.75rem',
                  background: '#f9fafb',
                  borderRadius: '0.5rem',
                  fontSize: '0.875rem',
                  color: '#111827'
                }}>
                  {selectedItem.lastUpdated}
                </div>
              </div>
            </div>

            <div style={{
              display: 'flex',
              justifyContent: 'flex-end',
              gap: '1rem',
              marginTop: '2rem'
            }}>
              <button
                onClick={() => {
                  setShowViewModal(false);
                  handleEditClick(selectedItem);
                }}
                style={{
                  padding: '0.75rem 1.5rem',
                  borderRadius: '0.5rem',
                  border: 'none',
                  background: '#f59e0b',
                  color: 'white',
                  fontWeight: 500,
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.5rem'
                }}
              >
                <PencilIcon style={{ width: '1rem', height: '1rem' }} />
                Chỉnh sửa
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Edit Modal */}
      {showEditModal && selectedItem && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'rgba(0, 0, 0, 0.5)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000
        }}>
          <div style={{
            background: 'white',
            borderRadius: '1rem',
            padding: '2rem',
            width: '100%',
            maxWidth: '600px',
            maxHeight: '90vh',
            overflowY: 'auto'
          }}>
            <div style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              marginBottom: '1.5rem'
            }}>
              <h2 style={{
                fontSize: '1.5rem',
                fontWeight: 600,
                color: '#111827',
                margin: 0
              }}>
                Chỉnh sửa vật tư
              </h2>
              <button
                onClick={() => setShowEditModal(false)}
                style={{
                  background: 'none',
                  border: 'none',
                  cursor: 'pointer',
                  padding: '0.5rem'
                }}
              >
                <XMarkIcon style={{ width: '1.5rem', height: '1.5rem', color: '#6b7280' }} />
              </button>
            </div>

            <div style={{ display: 'grid', gap: '1rem' }}>
              <div>
                <label style={{
                  display: 'block',
                  fontSize: '0.875rem',
                  fontWeight: 600,
                  color: '#374151',
                  marginBottom: '0.5rem'
                }}>
                  Tên vật tư *
                </label>
                <input
                  type="text"
                  name="name"
                  value={formData.name}
                  onChange={handleInputChange}
                  style={{
                    width: '100%',
                    padding: '0.75rem',
                    border: validationErrors.name ? '1px solid #dc2626' : '1px solid #d1d5db',
                    borderRadius: '0.5rem',
                    fontSize: '0.875rem'
                  }}
                />
                {validationErrors.name && (
                  <p style={{
                    color: '#dc2626',
                    fontSize: '0.75rem',
                    marginTop: '0.25rem'
                  }}>
                    {validationErrors.name}
                  </p>
                )}
              </div>

              <div>
                <label style={{
                  display: 'block',
                  fontSize: '0.875rem',
                  fontWeight: 600,
                  color: '#374151',
                  marginBottom: '0.5rem'
                }}>
                  Danh mục *
                </label>
                <select
                  name="category"
                  value={formData.category}
                  onChange={handleInputChange}
                  style={{
                    width: '100%',
                    padding: '0.75rem',
                    border: '1px solid #d1d5db',
                    borderRadius: '0.5rem',
                    fontSize: '0.875rem'
                  }}
                >
                  {CATEGORIES.filter(cat => cat.value !== 'all').map(cat => (
                    <option key={cat.value} value={cat.value}>
                      {cat.label}
                    </option>
                  ))}
                </select>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                <div>
                  <label style={{
                    display: 'block',
                    fontSize: '0.875rem',
                    fontWeight: 600,
                    color: '#374151',
                    marginBottom: '0.5rem'
                  }}>
                    Mã SKU *
                  </label>
                  <input
                    type="text"
                    name="sku"
                    value={formData.sku}
                    onChange={handleInputChange}
                    style={{
                      width: '100%',
                      padding: '0.75rem',
                      border: '1px solid #d1d5db',
                      borderRadius: '0.5rem',
                      fontSize: '0.875rem'
                    }}
                  />
                </div>

                <div>
                  <label style={{
                    display: 'block',
                    fontSize: '0.875rem',
                    fontWeight: 600,
                    color: '#374151',
                    marginBottom: '0.5rem'
                  }}>
                    Đơn vị *
                  </label>
                  <input
                    type="text"
                    name="unit"
                    value={formData.unit}
                    onChange={handleInputChange}
                    style={{
                      width: '100%',
                      padding: '0.75rem',
                      border: '1px solid #d1d5db',
                      borderRadius: '0.5rem',
                      fontSize: '0.875rem'
                    }}
                  />
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '1rem' }}>
                <div>
                  <label style={{
                    display: 'block',
                    fontSize: '0.875rem',
                    fontWeight: 600,
                    color: '#374151',
                    marginBottom: '0.5rem'
                  }}>
                    Tồn kho hiện tại *
                  </label>
                  <input
                    type="number"
                    name="currentStock"
                    value={formData.currentStock}
                    onChange={handleInputChange}
                    style={{
                      width: '100%',
                      padding: '0.75rem',
                      border: '1px solid #d1d5db',
                      borderRadius: '0.5rem',
                      fontSize: '0.875rem'
                    }}
                    min="0"
                  />
                </div>

                <div>
                  <label style={{
                    display: 'block',
                    fontSize: '0.875rem',
                    fontWeight: 600,
                    color: '#374151',
                    marginBottom: '0.5rem'
                  }}>
                    Tồn kho tối thiểu *
                  </label>
                  <input
                    type="number"
                    name="minStock"
                    value={formData.minStock}
                    onChange={handleInputChange}
                    style={{
                      width: '100%',
                      padding: '0.75rem',
                      border: '1px solid #d1d5db',
                      borderRadius: '0.5rem',
                      fontSize: '0.875rem'
                    }}
                    min="0"
                  />
                </div>

                <div>
                  <label style={{
                    display: 'block',
                    fontSize: '0.875rem',
                    fontWeight: 600,
                    color: '#374151',
                    marginBottom: '0.5rem'
                  }}>
                    Tồn kho tối đa *
                  </label>
                  <input
                    type="number"
                    name="maxStock"
                    value={formData.maxStock}
                    onChange={handleInputChange}
                    style={{
                      width: '100%',
                      padding: '0.75rem',
                      border: '1px solid #d1d5db',
                      borderRadius: '0.5rem',
                      fontSize: '0.875rem'
                    }}
                    min="0"
                  />
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                <div>
                  <label style={{
                    display: 'block',
                    fontSize: '0.875rem',
                    fontWeight: 600,
                    color: '#374151',
                    marginBottom: '0.5rem'
                  }}>
                    Giá nhập *
                  </label>
                  <input
                    type="number"
                    name="costPerUnit"
                    value={formData.costPerUnit}
                    onChange={handleInputChange}
                    style={{
                      width: '100%',
                      padding: '0.75rem',
                      border: '1px solid #d1d5db',
                      borderRadius: '0.5rem',
                      fontSize: '0.875rem'
                    }}
                    min="0"
                  />
                </div>

                <div>
                  <label style={{
                    display: 'block',
                    fontSize: '0.875rem',
                    fontWeight: 600,
                    color: '#374151',
                    marginBottom: '0.5rem'
                  }}>
                    Ngày hết hạn
                  </label>
                  <input
                    type="date"
                    name="expiryDate"
                    value={formData.expiryDate}
                    onChange={handleInputChange}
                    style={{
                      width: '100%',
                      padding: '0.75rem',
                      border: '1px solid #d1d5db',
                      borderRadius: '0.5rem',
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
                  Nhà cung cấp *
                </label>
                <input
                  type="text"
                  name="supplier"
                  value={formData.supplier}
                  onChange={handleInputChange}
                  style={{
                    width: '100%',
                    padding: '0.75rem',
                    border: '1px solid #d1d5db',
                    borderRadius: '0.5rem',
                    fontSize: '0.875rem'
                  }}
                />
              </div>

              <div>
                <label style={{
                  display: 'block',
                  fontSize: '0.875rem',
                  fontWeight: 600,
                  color: '#374151',
                  marginBottom: '0.5rem'
                }}>
                  Vị trí lưu trữ *
                </label>
                <input
                  type="text"
                  name="location"
                  value={formData.location}
                  onChange={handleInputChange}
                  style={{
                    width: '100%',
                    padding: '0.75rem',
                    border: '1px solid #d1d5db',
                    borderRadius: '0.5rem',
                    fontSize: '0.875rem'
                  }}
                />
              </div>

              <div>
                <label style={{
                  display: 'block',
                  fontSize: '0.875rem',
                  fontWeight: 600,
                  color: '#374151',
                  marginBottom: '0.5rem'
                }}>
                  Mô tả
                </label>
                <textarea
                  name="description"
                  value={formData.description}
                  onChange={handleInputChange}
                  style={{
                    width: '100%',
                    padding: '0.75rem',
                    border: '1px solid #d1d5db',
                    borderRadius: '0.5rem',
                    fontSize: '0.875rem',
                    minHeight: '100px',
                    resize: 'vertical'
                  }}
                />
              </div>
            </div>

            <div style={{
              display: 'flex',
              justifyContent: 'flex-end',
              gap: '1rem',
              marginTop: '2rem'
            }}>
              <button
                onClick={() => setShowEditModal(false)}
                style={{
                  padding: '0.75rem 1.5rem',
                  borderRadius: '0.5rem',
                  border: '1px solid #d1d5db',
                  background: 'white',
                  color: '#374151',
                  fontWeight: 500,
                  cursor: 'pointer'
                }}
              >
                Hủy
              </button>
              <button
                onClick={handleEditItem}
                style={{
                  padding: '0.75rem 1.5rem',
                  borderRadius: '0.5rem',
                  border: 'none',
                  background: '#f59e0b',
                  color: 'white',
                  fontWeight: 500,
                  cursor: 'pointer'
                }}
              >
                Lưu thay đổi
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
} 
