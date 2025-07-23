"use client";

import { useState, useEffect, useRef } from 'react';
import { useAuth } from '@/lib/contexts/auth-context';
import { 
  HeartIcon,
  UserIcon,
  PlusIcon,
  ChartBarIcon,
  ExclamationTriangleIcon,
  CheckCircleIcon,
  ClockIcon,
  ArrowLeftIcon,
  FireIcon,
  ScaleIcon,
  BeakerIcon,
  HandRaisedIcon,
  CloudIcon,
  BellIcon
} from '@heroicons/react/24/outline';
import { 
  HeartIcon as HeartIconSolid,
  FireIcon as FireIconSolid,
  CloudIcon as CloudIconSolid
} from '@heroicons/react/24/solid';
import { useRouter } from 'next/navigation';
import DatePicker from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';
import { format, parseISO } from 'date-fns';
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { useVitalSigns, VitalSigns } from '@/hooks/useVitalSigns';
import { getVitalSignsStatusColor } from '@/lib/utils/vital-signs-utils';
import { VITAL_SIGNS_STATUS_LABELS } from '@/lib/constants/vital-signs';
import VitalSignsForm from '@/components/VitalSignsForm';

export default function StaffVitalSignsPage() {
  const { user } = useAuth();
  const router = useRouter();
  
  // Check access permissions
  useEffect(() => {
    if (!user) {
      router.push('/login');
      return;
    }
    
    if (!user.role || !['admin', 'staff'].includes(user.role)) {
      router.push('/');
      return;
    }
  }, [user, router]);
  
  // Use the custom hook for data management
  const {
    vitalSigns,
    residents,
    staffMap,
    loading,
    addVitalSigns,
    validateForm,
    getFilteredVitalSigns
  } = useVitalSigns();

  // UI state
  const [selectedResident, setSelectedResident] = useState<string | null>(null);
  const [showAddForm, setShowAddForm] = useState(false);
  const [currentDate, setCurrentDate] = useState(new Date().toISOString().split('T')[0]);
  const [filterDate, setFilterDate] = useState<Date | null>(new Date());
  const [notifications, setNotifications] = useState<{ id: number, message: string, type: 'success' | 'error', time: string }[]>([]);
  const [showNotifications, setShowNotifications] = useState(false);
  const notificationIdRef = useRef(0);
  const [pendingSuccess, setPendingSuccess] = useState(false);
  const [showSuccessModal, setShowSuccessModal] = useState(false);

  // Modal management effect
  useEffect(() => {
    if (showAddForm) {
      document.body.classList.add('hide-header');
      document.body.style.overflow = 'hidden';
    } else {
      document.body.classList.remove('hide-header');
      document.body.style.overflow = 'unset';
    }
    
    return () => {
      document.body.classList.remove('hide-header');
      document.body.style.overflow = 'unset';
    };
  }, [showAddForm]);

  // Handle form submission
  const handleAddVitalSigns = async (data: Partial<VitalSigns>) => {
    try {
      await addVitalSigns(data);
      setShowAddForm(false);
      setShowSuccessModal(true);
      setTimeout(() => setShowSuccessModal(false), 1500);
    } catch (error) {
      toast.error('Lỗi khi thêm chỉ số sức khỏe!', { position: 'top-right' });
      notificationIdRef.current += 1;
      setNotifications(prev => [
        {
          id: notificationIdRef.current,
          message: 'Lỗi khi thêm chỉ số sức khỏe!',
          type: 'error',
          time: new Date().toLocaleString('vi-VN')
        },
        ...prev
      ]);
      throw error;
    }
  };

  // Khi modal đóng, nếu vừa submit thành công thì show toast/notification ở page
  useEffect(() => {
    if (!showAddForm && pendingSuccess) {
      toast.success('Thêm chỉ số sức khỏe thành công!', { position: 'top-right' });
      notificationIdRef.current += 1;
      setNotifications(prev => [
        {
          id: notificationIdRef.current,
          message: 'Thêm chỉ số sức khỏe thành công!',
          type: 'success',
          time: new Date().toLocaleString('vi-VN')
        },
        ...prev
      ]);
      setPendingSuccess(false);
    }
  }, [showAddForm, pendingSuccess]);

  // Get filtered data
  const filteredVitalSigns = getFilteredVitalSigns(selectedResident || undefined, currentDate);

  // Loading state
  if (loading) {
    return (
      <div style={{
        minHeight: '100vh',
        background: 'linear-gradient(135deg, #f8fafc 0%, #e2e8f0 100%)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center'
      }}>
        <div style={{
          width: '3rem',
          height: '3rem',
          border: '3px solid #e5e7eb',
          borderTop: '3px solid #3b82f6',
          borderRadius: '50%',
          animation: 'spin 1s linear infinite'
        }} />
      </div>
    );
  }

  return (
    <>
      <ToastContainer />
      <style dangerouslySetInnerHTML={{
        __html: `
          @keyframes pulse {
            0%, 100% { transform: scale(1); }
            50% { transform: scale(1.1); }
          }
          @keyframes spin {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
          }
        `
      }} />
      
      <div style={{
        minHeight: '100vh',
        background: 'linear-gradient(135deg, #f8fafc 0%, #e2e8f0 100%)',
        padding: '2rem'
      }}>
        <div style={{ maxWidth: '1400px', margin: '0 auto' }}>
          {/* Back Button */}
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
            <div style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center'
            }}>
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                  <div style={{
                    background: 'linear-gradient(135deg, #ef4444 0%, #dc2626 100%)',
                    borderRadius: '1rem',
                    padding: '1rem',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    boxShadow: '0 4px 12px rgba(239, 68, 68, 0.3)'
                  }}>
                    <HeartIconSolid style={{ width: '2rem', height: '2rem', color: 'white' }} />
                  </div>
                  <div>
                    <h1 style={{
                      fontSize: '1.875rem',
                      fontWeight: 700,
                      background: 'linear-gradient(135deg, #ef4444 0%, #dc2626 100%)',
                      WebkitBackgroundClip: 'text',
                      WebkitTextFillColor: 'transparent',
                      margin: '0 0 0.5rem 0'
                    }}>
                      Theo Dõi Các Chỉ Số Sức Khỏe
                    </h1>
                    <p style={{ color: '#6b7280', margin: 0 }}>
                      Ghi nhận và theo dõi các thông số sinh lý quan trọng của người cao tuổi
                    </p>
                  </div>
                </div>
              </div>
              <button
                onClick={() => setShowAddForm(true)}
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
                  cursor: 'pointer',
                  boxShadow: '0 4px 12px rgba(239, 68, 68, 0.3)'
                }}
              >
                <PlusIcon style={{ width: '1.25rem', height: '1.25rem' }} />
                Thêm chỉ số
              </button>
            </div>
          </div>

          {/* Filters */}
          <div style={{
            background: 'white',
            borderRadius: '1rem',
            padding: '1.5rem',
            marginBottom: '2rem',
            boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
          }}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '1rem' }}>
              {/* Resident Filter */}
              <div>
                <label style={{
                  display: 'block',
                  fontSize: '0.875rem',
                  fontWeight: 500,
                  color: '#374151',
                  marginBottom: '0.5rem'
                }}>
                  Lọc theo người cao tuổi
                </label>
                <select
                  value={selectedResident || ''}
                  onChange={(e) => setSelectedResident(e.target.value || null)}
                  style={{
                    width: '100%',
                    padding: '0.75rem',
                    border: '1px solid #d1d5db',
                    borderRadius: '0.5rem',
                    fontSize: '0.875rem',
                    outline: 'none'
                  }}
                >
                  <option value="">Tất cả người cao tuổi</option>
                  {residents.map(resident => (
                    <option key={resident.id} value={resident.id}>
                      {resident.name} - Phòng {resident.room}
                    </option>
                  ))}
                </select>
              </div>

              {/* Date Filter */}
              <div>
                <label style={{
                  display: 'block',
                  fontSize: '0.875rem',
                  fontWeight: 500,
                  color: '#374151',
                  marginBottom: '0.5rem'
                }}>
                  Lọc theo ngày
                </label>
                <DatePicker
                  selected={filterDate}
                  onChange={(date: Date | null) => {
                    setFilterDate(date);
                    if (date) {
                      const yyyy = date.getFullYear();
                      const mm = String(date.getMonth() + 1).padStart(2, '0');
                      const dd = String(date.getDate()).padStart(2, '0');
                      setCurrentDate(`${yyyy}-${mm}-${dd}`);
                    } else {
                      setCurrentDate('');
                    }
                  }}
                  dateFormat="dd/MM/yyyy"
                  style={{
                    width: '100%',
                    padding: '0.75rem',
                    border: '1px solid #d1d5db',
                    borderRadius: '0.5rem',
                    fontSize: '0.875rem',
                    outline: 'none'
                  }}
                />
              </div>

            </div>
          </div>

          {/* Vital Signs List */}
          <div style={{
            background: 'white',
            borderRadius: '1rem',
            overflow: 'hidden',
            boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
          }}>
            <div style={{
              padding: '1.5rem',
              borderBottom: '1px solid #e5e7eb',
              background: '#f9fafb'
            }}>
              <h2 style={{
                fontSize: '1.25rem',
                fontWeight: 600,
                color: '#1f2937',
                margin: 0
              }}>
                Danh sách chỉ số sức khỏe({filteredVitalSigns.length})
              </h2>
            </div>

            {filteredVitalSigns.length === 0 ? (
              <div style={{
                padding: '3rem',
                textAlign: 'center',
                color: '#6b7280'
              }}>
                <HeartIcon style={{ width: '3rem', height: '3rem', margin: '0 auto 1rem', opacity: 0.5 }} />
                <p style={{ fontSize: '1.125rem', fontWeight: 500, margin: '0 0 0.5rem 0' }}>
                  Chưa có chỉ số sức khỏe nào
                </p>
                <p style={{ margin: 0 }}>
                  Thêm chỉ số sức khỏe đầu tiên để theo dõi sức khỏe
                </p>
              </div>
            ) : (
              <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                  <thead>
                    <tr style={{ background: '#f9fafb' }}>
                      <th style={{ padding: '1rem', textAlign: 'left', fontSize: '0.875rem', fontWeight: 500, color: '#374151' }}>
                        Người cao tuổi
                      </th>
                      <th style={{ padding: '1rem', textAlign: 'left', fontSize: '0.875rem', fontWeight: 500, color: '#374151' }}>
                        Ngày giờ
                      </th>
                      <th style={{ padding: '1rem', textAlign: 'left', fontSize: '0.875rem', fontWeight: 500, color: '#374151' }}>
                        Huyết áp
                      </th>
                      <th style={{ padding: '1rem', textAlign: 'left', fontSize: '0.875rem', fontWeight: 500, color: '#374151' }}>
                        Nhịp tim
                      </th>
                      <th style={{ padding: '1rem', textAlign: 'left', fontSize: '0.875rem', fontWeight: 500, color: '#374151' }}>
                        Nhiệt độ
                      </th>
                      <th style={{ padding: '1rem', textAlign: 'left', fontSize: '0.875rem', fontWeight: 500, color: '#374151' }}>
                        SpO2
                      </th>
                      <th style={{ padding: '1rem', textAlign: 'left', fontSize: '0.875rem', fontWeight: 500, color: '#374151' }}>
                        Ghi chú
                      </th>
                      <th style={{ padding: '1rem', textAlign: 'left', fontSize: '0.875rem', fontWeight: 500, color: '#374151' }}>
                        Người nhập chỉ số
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredVitalSigns.map((vs, index) => (
                      <tr 
                        key={vs.id}
                        style={{
                          borderBottom: '1px solid #e5e7eb',
                          background: index % 2 === 0 ? 'white' : '#fafafa'
                        }}
                      >
                        <td style={{ padding: '1rem' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                            <div style={{
                              width: '2.5rem',
                              height: '2.5rem',
                              borderRadius: '50%',
                              background: 'linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%)',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              color: 'white',
                              fontSize: '0.875rem',
                              fontWeight: 600
                            }}>
                              {vs.residentName.charAt(0)}
                            </div>
                            <div>
                              <div style={{ fontWeight: 500, color: '#1f2937' }}>
                                {vs.residentName}
                              </div>
                            </div>
                          </div>
                        </td>
                        <td style={{ padding: '1rem', fontSize: '0.875rem', color: '#374151' }}>
                          <div>
                            {format(parseISO(vs.date), 'dd/MM/yyyy')}
                          </div>
                          <div style={{ color: '#6b7280' }}>
                            {vs.date_time ? vs.date_time.slice(11, 16) : vs.time || ''}
                          </div>
                        </td>
                        <td style={{ padding: '1rem', fontSize: '0.875rem', color: '#374151' }}>
                          {vs.bloodPressure}
                        </td>
                        <td style={{ padding: '1rem', fontSize: '0.875rem', color: '#374151' }}>
                          {vs.heartRate} bpm
                        </td>
                        <td style={{ padding: '1rem', fontSize: '0.875rem', color: '#374151' }}>
                          {vs.temperature}°C
                        </td>
                        <td style={{ padding: '1rem', fontSize: '0.875rem', color: '#374151' }}>
                          {vs.oxygenSaturation}%
                        </td>
                        <td style={{ padding: '1rem', fontSize: '0.875rem', color: '#374151' }}>
                          {vs.notes || ''}
                        </td>
                        <td style={{ padding: '1rem', fontSize: '0.875rem', color: '#6b7280' }}>
                          {staffMap[vs.recordedBy] || vs.recordedBy}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Add Form Modal */}
      <VitalSignsForm
        isOpen={showAddForm}
        onClose={() => setShowAddForm(false)}
        onSubmit={handleAddVitalSigns}
        residents={residents}
        validateForm={validateForm}
      />

      {/* Notification Center Button */}
      <div style={{ position: 'fixed', top: 24, right: 32, zIndex: 2000 }}>
        <button
          onClick={() => setShowNotifications(v => !v)}
          style={{
            position: 'relative',
            background: 'white',
            border: '1px solid #d1d5db',
            borderRadius: '9999px',
            width: '3rem',
            height: '3rem',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            boxShadow: '0 2px 8px rgba(0,0,0,0.08)',
            cursor: 'pointer',
          }}
        >
          <BellIcon style={{ width: '1.5rem', height: '1.5rem', color: '#ef4444' }} />
          {notifications.length > 0 && (
            <span style={{
              position: 'absolute',
              top: 8,
              right: 8,
              background: '#ef4444',
              color: 'white',
              borderRadius: '9999px',
              fontSize: '0.75rem',
              fontWeight: 700,
              padding: '0.15rem 0.5rem',
              minWidth: '1.25rem',
              textAlign: 'center',
              lineHeight: 1
            }}>{notifications.length}</span>
          )}
        </button>
        {/* Notification List Popup */}
        {showNotifications && (
          <div style={{
            position: 'absolute',
            top: '3.5rem',
            right: 0,
            width: '350px',
            maxHeight: '400px',
            overflowY: 'auto',
            background: 'white',
            border: '1px solid #e5e7eb',
            borderRadius: '1rem',
            boxShadow: '0 8px 24px rgba(0,0,0,0.12)',
            zIndex: 2100,
            padding: '1rem'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
              <span style={{ fontWeight: 700, fontSize: '1rem', color: '#1f2937' }}>Thông báo</span>
              <button onClick={() => setShowNotifications(false)} style={{ background: 'none', border: 'none', color: '#ef4444', fontWeight: 700, cursor: 'pointer', fontSize: '1.25rem' }}>×</button>
            </div>
            {notifications.length === 0 ? (
              <div style={{ color: '#6b7280', textAlign: 'center', padding: '1rem 0' }}>Không có thông báo nào</div>
            ) : (
              <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
                {notifications.map(n => (
                  <li key={n.id} style={{
                    marginBottom: '0.75rem',
                    background: n.type === 'success' ? '#ecfdf5' : '#fef2f2',
                    border: n.type === 'success' ? '1px solid #6ee7b7' : '1px solid #fca5a5',
                    borderRadius: '0.75rem',
                    padding: '0.75rem',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.75rem'
                  }}>
                    <span style={{ fontSize: '1.25rem' }}>{n.type === 'success' ? '✅' : '❌'}</span>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontWeight: 500, color: n.type === 'success' ? '#065f46' : '#991b1b' }}>{n.message}</div>
                      <div style={{ fontSize: '0.75rem', color: '#6b7280', marginTop: '0.25rem' }}>{n.time}</div>
                    </div>
                    <button onClick={() => setNotifications(prev => prev.filter(x => x.id !== n.id))} style={{ background: 'none', border: 'none', color: '#6b7280', fontSize: '1.25rem', cursor: 'pointer' }}>×</button>
                  </li>
                ))}
              </ul>
            )}
          </div>
        )}
      </div>

      {/* Success Modal */}
      {showSuccessModal && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'rgba(0,0,0,0.4)',
          zIndex: 3000,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          animation: 'fadeIn 0.2s ease-out'
        }}>
          <div style={{
            background: 'white',
            borderRadius: '1.5rem',
            padding: '2.5rem',
            maxWidth: '400px',
            width: '90%',
            textAlign: 'center',
            boxShadow: '0 25px 50px -12px rgba(0,0,0,0.25)',
            animation: 'slideUp 0.3s ease-out'
          }}>
            <div style={{
              width: '4rem',
              height: '4rem',
              background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
              borderRadius: '50%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              margin: '0 auto 1.5rem',
              boxShadow: '0 10px 25px rgba(16,185,129,0.3)'
            }}>
              <CheckCircleIcon style={{ width: '2rem', height: '2rem', color: 'white' }} />
            </div>
            <h2 style={{ fontSize: '1.25rem', fontWeight: 700, color: '#111827', margin: '0 0 1rem 0' }}>
              Thêm chỉ số sức khỏe thành công!
            </h2>
            <p style={{ fontSize: '1rem', color: '#6b7280', margin: 0 }}>
              Dữ liệu đã được cập nhật vào hệ thống.
            </p>
            <button
              onClick={() => setShowSuccessModal(false)}
              style={{
                marginTop: '2rem',
                padding: '0.75rem 2rem',
                background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
                color: 'white',
                border: 'none',
                borderRadius: '0.75rem',
                fontSize: '1rem',
                fontWeight: 600,
                cursor: 'pointer',
                boxShadow: '0 4px 12px rgba(16,185,129,0.3)'
              }}
            >
              Đóng
            </button>
          </div>
        </div>
      )}
    </>
  );
} 