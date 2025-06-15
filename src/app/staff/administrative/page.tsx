"use client";

import { useState, useEffect } from 'react';
import { useAuth } from '@/lib/contexts/auth-context';
import { 
  DocumentTextIcon,
  ExclamationTriangleIcon,
  CubeIcon,
  ClipboardDocumentCheckIcon,
  PlusIcon,
  EyeIcon,
  CheckCircleIcon,
  ClockIcon,
  ArrowLeftIcon
} from '@heroicons/react/24/outline';
import { useRouter } from 'next/navigation';


interface IncidentReport {
  id: number;
  title: string;
  description: string;
  type: 'safety' | 'medical' | 'equipment' | 'other';
  priority: 'low' | 'medium' | 'high' | 'urgent';
  status: 'draft' | 'submitted' | 'reviewing' | 'resolved';
  reportedBy: string;
  location: string;
  incidentDate: string;
  reportDate: string;
  involvedPersons?: string[];
  actions?: string;
  resolution?: string;
}

interface InventoryItem {
  id: number;
  name: string;
  category: string;
  currentStock: number;
  minimumStock: number;
  unit: string;
  lastChecked: string;
  status: 'sufficient' | 'low' | 'out_of_stock';
  location: string;
  supplier?: string;
  expiryDate?: string;
}

export default function StaffAdministrativePage() {
  const { user } = useAuth();
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<'incidents' | 'inventory'>('incidents');
  const [incidents, setIncidents] = useState<IncidentReport[]>([]);
  const [inventory, setInventory] = useState<InventoryItem[]>([]);
  const [showNewIncident, setShowNewIncident] = useState(false);
  const [showInventoryUpdate, setShowInventoryUpdate] = useState(false);
  const [selectedItem, setSelectedItem] = useState<InventoryItem | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = () => {
    // Mock incident data
    const mockIncidents: IncidentReport[] = [
      {
        id: 1,
        title: 'Cư dân bị trượt trong phòng tắm',
        description: 'Cô Lan bị trượt khi đi vào phòng tắm, không bị thương nghiêm trọng nhưng cần theo dõi.',
        type: 'safety',
        priority: 'high',
        status: 'submitted',
        reportedBy: user?.name || 'Nguyễn Văn A',
        location: 'Phòng 201 - Khu A',
        incidentDate: '2024-01-15T09:30:00',
        reportDate: '2024-01-15T10:00:00',
        involvedPersons: ['Trần Thị Lan (Cư dân)'],
        actions: 'Kiểm tra sức khỏe, báo cáo y tế, cải thiện biện pháp an toàn'
      },
      {
        id: 2,
        title: 'Máy đo huyết áp bị hỏng',
        description: 'Máy đo huyết áp tại phòng khám không hoạt động, cần thay thế hoặc sửa chữa.',
        type: 'equipment',
        priority: 'medium',
        status: 'resolved',
        reportedBy: user?.name || 'Nguyễn Văn A',
        location: 'Phòng khám',
        incidentDate: '2024-01-14T14:00:00',
        reportDate: '2024-01-14T14:15:00',
        actions: 'Liên hệ bộ phận kỹ thuật',
        resolution: 'Đã thay thế máy mới ngày 15/01/2024'
      }
    ];

    // Mock inventory data
    const mockInventory: InventoryItem[] = [
      {
        id: 1,
        name: 'Khẩu trang y tế',
        category: 'Vật tư y tế',
        currentStock: 50,
        minimumStock: 100,
        unit: 'hộp',
        lastChecked: '2024-01-15',
        status: 'low',
        location: 'Kho y tế - Tầng 1',
        supplier: 'Công ty ABC',
        expiryDate: '2025-12-31'
      },
      {
        id: 2,
        name: 'Thuốc hạ huyết áp',
        category: 'Thuốc',
        currentStock: 0,
        minimumStock: 20,
        unit: 'lọ',
        lastChecked: '2024-01-14',
        status: 'out_of_stock',
        location: 'Tủ thuốc chính',
        supplier: 'Nhà thuốc XYZ',
        expiryDate: '2024-08-30'
      },
      {
        id: 3,
        name: 'Găng tay nitrile',
        category: 'Vật tư y tế',
        currentStock: 200,
        minimumStock: 50,
        unit: 'đôi',
        lastChecked: '2024-01-15',
        status: 'sufficient',
        location: 'Kho y tế - Tầng 1',
        supplier: 'Công ty DEF'
      }
    ];

    setIncidents(mockIncidents);
    setInventory(mockInventory);
    setLoading(false);
  };

  const handleInventoryUpdate = (itemId: number, newStock: number) => {
    setInventory(prev => prev.map(item => 
      item.id === itemId 
        ? { 
            ...item, 
            currentStock: newStock,
            lastChecked: new Date().toISOString().split('T')[0],
            status: newStock === 0 ? 'out_of_stock' : 
                   newStock <= item.minimumStock ? 'low' : 'sufficient'
          }
        : item
    ));
    setSelectedItem(null);
    setShowInventoryUpdate(false);
  };

  const getIncidentTypeColor = (type: string) => {
    switch (type) {
      case 'safety': return '#ef4444';
      case 'medical': return '#f59e0b';
      case 'equipment': return '#3b82f6';
      case 'other': return '#6b7280';
      default: return '#6b7280';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'draft': return '#6b7280';
      case 'submitted': return '#f59e0b';
      case 'reviewing': return '#3b82f6';
      case 'resolved': return '#10b981';
      case 'sufficient': return '#10b981';
      case 'low': return '#f59e0b';
      case 'out_of_stock': return '#ef4444';
      default: return '#6b7280';
    }
  };

  if (loading) {
    return (
      <div style={{
        minHeight: '100vh',
        background: 'linear-gradient(135deg, #f8fafc 0%, #e2e8f0 100%)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center'
      }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{
            width: '3rem',
            height: '3rem',
            border: '3px solid #e5e7eb',
            borderTop: '3px solid #3b82f6',
            borderRadius: '50%',
            margin: '0 auto 1rem',
            animation: 'spin 1s linear infinite'
          }} />
          <p style={{ color: '#6b7280' }}>Đang tải dữ liệu...</p>
        </div>
      </div>
    );
  }

  return (
    <div style={{
      minHeight: '100vh',
      background: 'linear-gradient(135deg, #f8fafc 0%, #e2e8f0 100%)',
      padding: '2rem'
    }}>
      <div style={{ maxWidth: '1400px', margin: '0 auto' }}>
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
          background: 'white',
          borderRadius: '1rem',
          padding: '2rem',
          marginBottom: '2rem',
          boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '1rem' }}>
            <DocumentTextIcon style={{ width: '2rem', height: '2rem', color: '#3b82f6' }} />
            <h1 style={{
              fontSize: '1.875rem',
              fontWeight: 700,
              background: 'linear-gradient(135deg, #3b82f6 0%, #8b5cf6 100%)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              margin: 0
            }}>
              Hỗ Trợ Hành Chính
            </h1>
          </div>
          <p style={{ color: '#6b7280', margin: 0 }}>
            Báo cáo sự cố và quản lý kiểm kê hàng tồn kho
          </p>
        </div>

        {/* Tabs */}
        <div style={{
          background: 'white',
          borderRadius: '1rem',
          marginBottom: '2rem',
          boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
        }}>
          <div style={{
            display: 'flex',
            borderBottom: '1px solid #e5e7eb'
          }}>
            <button
              onClick={() => setActiveTab('incidents')}
              style={{
                flex: 1,
                padding: '1rem 2rem',
                background: 'none',
                border: 'none',
                borderRadius: '1rem 0 0 0',
                fontSize: '1rem',
                fontWeight: 600,
                color: activeTab === 'incidents' ? '#3b82f6' : '#6b7280',
                borderBottom: activeTab === 'incidents' ? '2px solid #3b82f6' : '2px solid transparent',
                cursor: 'pointer'
              }}
            >
              <ExclamationTriangleIcon style={{ 
                width: '1.25rem', 
                height: '1.25rem', 
                display: 'inline',
                marginRight: '0.5rem'
              }} />
              Báo cáo sự cố
            </button>
            <button
              onClick={() => setActiveTab('inventory')}
              style={{
                flex: 1,
                padding: '1rem 2rem',
                background: 'none',
                border: 'none',
                borderRadius: '0 1rem 0 0',
                fontSize: '1rem',
                fontWeight: 600,
                color: activeTab === 'inventory' ? '#3b82f6' : '#6b7280',
                borderBottom: activeTab === 'inventory' ? '2px solid #3b82f6' : '2px solid transparent',
                cursor: 'pointer'
              }}
            >
              <CubeIcon style={{ 
                width: '1.25rem', 
                height: '1.25rem', 
                display: 'inline',
                marginRight: '0.5rem'
              }} />
              Kiểm kê kho
            </button>
          </div>
        </div>

        {/* Content */}
        {activeTab === 'incidents' ? (
          <div>
            {/* Incident Stats */}
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
              gap: '1.5rem',
              marginBottom: '2rem'
            }}>
              <div style={{
                background: 'white',
                borderRadius: '1rem',
                padding: '1.5rem',
                boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
                border: '2px solid #f59e0b20'
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                  <ClockIcon style={{ width: '1.5rem', height: '1.5rem', color: '#f59e0b' }} />
                  <div>
                    <p style={{ fontSize: '0.875rem', color: '#6b7280', margin: 0 }}>Chờ xử lý</p>
                    <p style={{ fontSize: '1.5rem', fontWeight: 700, color: '#f59e0b', margin: 0 }}>
                      {incidents.filter(i => i.status === 'submitted').length}
                    </p>
                  </div>
                </div>
              </div>

              <div style={{
                background: 'white',
                borderRadius: '1rem',
                padding: '1.5rem',
                boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
                border: '2px solid #10b98120'
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                  <CheckCircleIcon style={{ width: '1.5rem', height: '1.5rem', color: '#10b981' }} />
                  <div>
                    <p style={{ fontSize: '0.875rem', color: '#6b7280', margin: 0 }}>Đã giải quyết</p>
                    <p style={{ fontSize: '1.5rem', fontWeight: 700, color: '#10b981', margin: 0 }}>
                      {incidents.filter(i => i.status === 'resolved').length}
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Add New Incident Button */}
            <div style={{ 
              display: 'flex', 
              justifyContent: 'flex-end', 
              marginBottom: '2rem' 
            }}>
              <button
                onClick={() => setShowNewIncident(true)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.5rem',
                  padding: '0.75rem 1.5rem',
                  background: 'linear-gradient(135deg, #ef4444 0%, #dc2626 100%)',
                  color: 'white',
                  border: 'none',
                  borderRadius: '0.75rem',
                  fontSize: '0.875rem',
                  fontWeight: 600,
                  cursor: 'pointer'
                }}
              >
                <PlusIcon style={{ width: '1rem', height: '1rem' }} />
                Báo cáo sự cố mới
              </button>
            </div>

            {/* Incidents List */}
            <div style={{ display: 'grid', gap: '1.5rem' }}>
              {incidents.map((incident) => (
                <div key={incident.id} style={{
                  background: 'white',
                  borderRadius: '1rem',
                  padding: '2rem',
                  boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
                  border: `2px solid ${getStatusColor(incident.status)}20`
                }}>
                  <div style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'flex-start',
                    marginBottom: '1rem'
                  }}>
                    <div>
                      <div style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '1rem',
                        marginBottom: '0.5rem'
                      }}>
                        <h3 style={{
                          fontSize: '1.125rem',
                          fontWeight: 700,
                          color: '#1f2937',
                          margin: 0
                        }}>
                          {incident.title}
                        </h3>
                        <span style={{
                          padding: '0.25rem 0.75rem',
                          borderRadius: '0.375rem',
                          fontSize: '0.75rem',
                          fontWeight: 600,
                          background: `${getIncidentTypeColor(incident.type)}20`,
                          color: getIncidentTypeColor(incident.type)
                        }}>
                          {incident.type === 'safety' ? 'An toàn' :
                           incident.type === 'medical' ? 'Y tế' :
                           incident.type === 'equipment' ? 'Thiết bị' : 'Khác'}
                        </span>
                        <span style={{
                          padding: '0.25rem 0.75rem',
                          borderRadius: '0.375rem',
                          fontSize: '0.75rem',
                          fontWeight: 600,
                          background: `${getStatusColor(incident.status)}20`,
                          color: getStatusColor(incident.status)
                        }}>
                          {incident.status === 'draft' ? 'Nháp' :
                           incident.status === 'submitted' ? 'Đã gửi' :
                           incident.status === 'reviewing' ? 'Đang xem xét' : 'Đã giải quyết'}
                        </span>
                      </div>
                      <p style={{
                        fontSize: '0.875rem',
                        color: '#6b7280',
                        margin: 0
                      }}>
                        {incident.location} • {new Date(incident.incidentDate).toLocaleString('vi-VN')}
                      </p>
                    </div>
                  </div>

                  <p style={{
                    color: '#374151',
                    lineHeight: 1.6,
                    marginBottom: '1rem'
                  }}>
                    {incident.description}
                  </p>

                  {incident.actions && (
                    <div style={{
                      padding: '1rem',
                      background: '#f0f9ff',
                      border: '1px solid #bfdbfe',
                      borderRadius: '0.5rem',
                      marginBottom: '1rem'
                    }}>
                      <p style={{
                        fontSize: '0.875rem',
                        color: '#1e40af',
                        margin: '0 0 0.5rem 0',
                        fontWeight: 600
                      }}>
                        Hành động đã thực hiện:
                      </p>
                      <p style={{
                        color: '#1e3a8a',
                        margin: 0
                      }}>
                        {incident.actions}
                      </p>
                    </div>
                  )}

                  {incident.resolution && (
                    <div style={{
                      padding: '1rem',
                      background: '#ecfdf5',
                      border: '1px solid #a7f3d0',
                      borderRadius: '0.5rem'
                    }}>
                      <p style={{
                        fontSize: '0.875rem',
                        color: '#065f46',
                        margin: '0 0 0.5rem 0',
                        fontWeight: 600
                      }}>
                        Giải pháp:
                      </p>
                      <p style={{
                        color: '#047857',
                        margin: 0
                      }}>
                        {incident.resolution}
                      </p>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        ) : (
          <div>
            {/* Inventory Stats */}
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
              gap: '1.5rem',
              marginBottom: '2rem'
            }}>
              <div style={{
                background: 'white',
                borderRadius: '1rem',
                padding: '1.5rem',
                boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
                border: '2px solid #ef444420'
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                  <ExclamationTriangleIcon style={{ width: '1.5rem', height: '1.5rem', color: '#ef4444' }} />
                  <div>
                    <p style={{ fontSize: '0.875rem', color: '#6b7280', margin: 0 }}>Hết hàng</p>
                    <p style={{ fontSize: '1.5rem', fontWeight: 700, color: '#ef4444', margin: 0 }}>
                      {inventory.filter(i => i.status === 'out_of_stock').length}
                    </p>
                  </div>
                </div>
              </div>

              <div style={{
                background: 'white',
                borderRadius: '1rem',
                padding: '1.5rem',
                boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
                border: '2px solid #f59e0b20'
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                  <ClockIcon style={{ width: '1.5rem', height: '1.5rem', color: '#f59e0b' }} />
                  <div>
                    <p style={{ fontSize: '0.875rem', color: '#6b7280', margin: 0 }}>Sắp hết</p>
                    <p style={{ fontSize: '1.5rem', fontWeight: 700, color: '#f59e0b', margin: 0 }}>
                      {inventory.filter(i => i.status === 'low').length}
                    </p>
                  </div>
                </div>
              </div>

              <div style={{
                background: 'white',
                borderRadius: '1rem',
                padding: '1.5rem',
                boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
                border: '2px solid #10b98120'
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                  <CheckCircleIcon style={{ width: '1.5rem', height: '1.5rem', color: '#10b981' }} />
                  <div>
                    <p style={{ fontSize: '0.875rem', color: '#6b7280', margin: 0 }}>Đủ hàng</p>
                    <p style={{ fontSize: '1.5rem', fontWeight: 700, color: '#10b981', margin: 0 }}>
                      {inventory.filter(i => i.status === 'sufficient').length}
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Inventory List */}
            <div style={{
              background: 'white',
              borderRadius: '1rem',
              padding: '2rem',
              boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
            }}>
              <div style={{ display: 'grid', gap: '1rem' }}>
                {inventory.map((item) => (
                  <div key={item.id} style={{
                    display: 'grid',
                    gridTemplateColumns: '1fr auto auto',
                    gap: '2rem',
                    alignItems: 'center',
                    padding: '1.5rem',
                    background: '#f9fafb',
                    borderRadius: '0.75rem',
                    border: `2px solid ${getStatusColor(item.status)}20`
                  }}>
                    <div>
                      <div style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '1rem',
                        marginBottom: '0.5rem'
                      }}>
                        <h3 style={{
                          fontSize: '1.125rem',
                          fontWeight: 700,
                          color: '#1f2937',
                          margin: 0
                        }}>
                          {item.name}
                        </h3>
                        <span style={{
                          padding: '0.25rem 0.75rem',
                          borderRadius: '0.375rem',
                          fontSize: '0.75rem',
                          fontWeight: 600,
                          background: `${getStatusColor(item.status)}20`,
                          color: getStatusColor(item.status)
                        }}>
                          {item.status === 'sufficient' ? 'Đủ hàng' :
                           item.status === 'low' ? 'Sắp hết' : 'Hết hàng'}
                        </span>
                      </div>

                      <div style={{
                        display: 'grid',
                        gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))',
                        gap: '1rem'
                      }}>
                        <div>
                          <p style={{
                            fontSize: '0.875rem',
                            color: '#6b7280',
                            margin: '0 0 0.25rem 0'
                          }}>
                            Tồn kho
                          </p>
                          <p style={{
                            fontSize: '0.875rem',
                            fontWeight: 600,
                            color: '#1f2937',
                            margin: 0
                          }}>
                            {item.currentStock} {item.unit}
                          </p>
                        </div>
                        <div>
                          <p style={{
                            fontSize: '0.875rem',
                            color: '#6b7280',
                            margin: '0 0 0.25rem 0'
                          }}>
                            Tối thiểu
                          </p>
                          <p style={{
                            fontSize: '0.875rem',
                            fontWeight: 600,
                            color: '#1f2937',
                            margin: 0
                          }}>
                            {item.minimumStock} {item.unit}
                          </p>
                        </div>
                        <div>
                          <p style={{
                            fontSize: '0.875rem',
                            color: '#6b7280',
                            margin: '0 0 0.25rem 0'
                          }}>
                            Vị trí
                          </p>
                          <p style={{
                            fontSize: '0.875rem',
                            fontWeight: 600,
                            color: '#1f2937',
                            margin: 0
                          }}>
                            {item.location}
                          </p>
                        </div>
                        <div>
                          <p style={{
                            fontSize: '0.875rem',
                            color: '#6b7280',
                            margin: '0 0 0.25rem 0'
                          }}>
                            Kiểm tra cuối
                          </p>
                          <p style={{
                            fontSize: '0.875rem',
                            fontWeight: 600,
                            color: '#1f2937',
                            margin: 0
                          }}>
                            {new Date(item.lastChecked).toLocaleDateString('vi-VN')}
                          </p>
                        </div>
                      </div>
                    </div>

                    <div style={{
                      textAlign: 'center',
                      padding: '1rem',
                      background: 'white',
                      borderRadius: '0.75rem',
                      border: '1px solid #e5e7eb'
                    }}>
                      <p style={{
                        fontSize: '1.5rem',
                        fontWeight: 700,
                        color: getStatusColor(item.status),
                        margin: 0
                      }}>
                        {item.currentStock}
                      </p>
                      <p style={{
                        fontSize: '0.75rem',
                        color: '#6b7280',
                        margin: 0
                      }}>
                        {item.unit}
                      </p>
                    </div>

                    <button
                      onClick={() => {
                        setSelectedItem(item);
                        setShowInventoryUpdate(true);
                      }}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.5rem',
                        padding: '0.75rem 1rem',
                        background: 'linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)',
                        color: 'white',
                        border: 'none',
                        borderRadius: '0.5rem',
                        fontSize: '0.875rem',
                        fontWeight: 600,
                        cursor: 'pointer',
                        whiteSpace: 'nowrap'
                      }}
                    >
                      <ClipboardDocumentCheckIcon style={{ width: '1rem', height: '1rem' }} />
                      Cập nhật
                    </button>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Inventory Update Modal */}
        {showInventoryUpdate && selectedItem && (
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
            zIndex: 1000,
            padding: '1rem'
          }}>
            <div style={{
              background: 'white',
              borderRadius: '1rem',
              padding: '2rem',
              maxWidth: '500px',
              width: '100%'
            }}>
              <h2 style={{
                fontSize: '1.25rem',
                fontWeight: 700,
                color: '#1f2937',
                marginBottom: '1.5rem'
              }}>
                Cập nhật tồn kho
              </h2>

              <div style={{ marginBottom: '1rem' }}>
                <p style={{
                  fontSize: '0.875rem',
                  color: '#6b7280',
                  margin: '0 0 0.5rem 0'
                }}>
                  Sản phẩm: {selectedItem.name}
                </p>
                <p style={{
                  fontSize: '0.875rem',
                  color: '#6b7280',
                  margin: '0 0 0.5rem 0'
                }}>
                  Tồn kho hiện tại: {selectedItem.currentStock} {selectedItem.unit}
                </p>
              </div>

              <div style={{ marginBottom: '1.5rem' }}>
                <label style={{
                  display: 'block',
                  fontSize: '0.875rem',
                  fontWeight: 600,
                  color: '#374151',
                  marginBottom: '0.5rem'
                }}>
                  Số lượng mới:
                </label>
                <input
                  type="number"
                  min="0"
                  defaultValue={selectedItem.currentStock}
                  id="newStock"
                  style={{
                    width: '100%',
                    padding: '0.75rem',
                    border: '1px solid #d1d5db',
                    borderRadius: '0.5rem',
                    fontSize: '0.875rem'
                  }}
                />
              </div>

              <div style={{
                display: 'flex',
                justifyContent: 'flex-end',
                gap: '1rem'
              }}>
                <button
                  onClick={() => {
                    setShowInventoryUpdate(false);
                    setSelectedItem(null);
                  }}
                  style={{
                    padding: '0.75rem 1.5rem',
                    background: '#f3f4f6',
                    color: '#374151',
                    border: '1px solid #d1d5db',
                    borderRadius: '0.5rem',
                    fontSize: '0.875rem',
                    cursor: 'pointer'
                  }}
                >
                  Hủy
                </button>
                <button
                  onClick={() => {
                    const input = document.getElementById('newStock') as HTMLInputElement;
                    const newStock = parseInt(input.value);
                    handleInventoryUpdate(selectedItem.id, newStock);
                  }}
                  style={{
                    padding: '0.75rem 1.5rem',
                    background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
                    color: 'white',
                    border: 'none',
                    borderRadius: '0.5rem',
                    fontSize: '0.875rem',
                    fontWeight: 600,
                    cursor: 'pointer'
                  }}
                >
                  Cập nhật
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
} 
