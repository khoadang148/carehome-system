"use client";

import { useState, useEffect } from 'react'
import { toast } from 'react-toastify'
import { getUserFriendlyError } from '@/lib/utils/error-translations';;;
import { 
  PlusCircleIcon, 
  BeakerIcon, 
  CalendarDaysIcon, 
  ClipboardDocumentListIcon,
  CheckCircleIcon,
  DocumentTextIcon,
  ClipboardIcon
} from '@heroicons/react/24/outline';
import { clientStorage, getParsedItem, setParsedItem } from '@/lib/utils/clientStorage';


interface QuickActionsProps {
  residentId: number;
  residentName: string;
  onActionComplete?: () => void;
}

export default function QuickActions({ residentId, residentName, onActionComplete }: QuickActionsProps) {
  const [showCareNoteModal, setShowCareNoteModal] = useState(false);
  const [showMedicationModal, setShowMedicationModal] = useState(false);
  const [showAppointmentModal, setShowAppointmentModal] = useState(false);
  const [showMedicationListModal, setShowMedicationListModal] = useState(false);


  return (
    <>
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
        gap: '1rem',
        marginBottom: '1.5rem'
      }}>
        <button
          onClick={() => setShowCareNoteModal(true)}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '0.75rem',
            padding: '1rem',
            background: 'linear-gradient(135deg, #dbeafe 0%, #bfdbfe 100%)',
            border: '1px solid #93c5fd',
            borderRadius: '0.75rem',
            color: '#1d4ed8',
            fontWeight: 600,
            fontSize: '0.875rem',
            cursor: 'pointer',
            transition: 'all 0.2s ease',
            textAlign: 'left'
          }}
          onMouseOver={(e) => {
            e.currentTarget.style.transform = 'translateY(-2px)';
            e.currentTarget.style.boxShadow = '0 4px 12px rgba(59, 130, 246, 0.15)';
          }}
          onMouseOut={(e) => {
            e.currentTarget.style.transform = 'translateY(0)';
            e.currentTarget.style.boxShadow = 'none';
          }}
        >
          <ClipboardDocumentListIcon style={{ width: '1.25rem', height: '1.25rem' }} />
          <div>
            <div>Thêm ghi chú</div>
            <div style={{ fontSize: '0.75rem', opacity: 0.8 }}>Ghi chú chăm sóc hàng ngày</div>
          </div>
        </button>

        <button
          onClick={() => setShowAppointmentModal(true)}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '0.75rem',
            padding: '1rem',
            background: 'linear-gradient(135deg, #fff3e0 0%, #ffe0b2 100%)',
            border: '1px solid #ffcc02',
            borderRadius: '0.75rem',
            color: '#ef6c00',
            fontWeight: 600,
            fontSize: '0.875rem',
            cursor: 'pointer',
            transition: 'all 0.2s ease',
            textAlign: 'left'
          }}
          onMouseOver={(e) => {
            e.currentTarget.style.transform = 'translateY(-2px)';
            e.currentTarget.style.boxShadow = '0 4px 12px rgba(239, 108, 0, 0.15)';
          }}
          onMouseOut={(e) => {
            e.currentTarget.style.transform = 'translateY(0)';
            e.currentTarget.style.boxShadow = 'none';
          }}
        >
          <CalendarDaysIcon style={{ width: '1.25rem', height: '1.25rem' }} />
          <div>
            <div>Đặt lịch đơn lẻ</div>
            <div style={{ fontSize: '0.75rem', opacity: 0.8 }}>Tạo một lịch hẹn riêng</div>
          </div>
        </button>

        <button
          onClick={() => setShowMedicationListModal(true)}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '0.75rem',
            padding: '1rem',
            background: 'linear-gradient(135deg, #f3e8ff 0%, #e9d5ff 100%)',
            border: '1px solid #c4b5fd',
            borderRadius: '0.75rem',
            color: '#7c3aed',
            fontWeight: 600,
            fontSize: '0.875rem',
            cursor: 'pointer',
            transition: 'all 0.2s ease',
            textAlign: 'left'
          }}
          onMouseOver={(e) => {
            e.currentTarget.style.transform = 'translateY(-2px)';
            e.currentTarget.style.boxShadow = '0 4px 12px rgba(139, 92, 246, 0.15)';
          }}
          onMouseOut={(e) => {
            e.currentTarget.style.transform = 'translateY(0)';
            e.currentTarget.style.boxShadow = 'none';
          }}
        >
          <CheckCircleIcon style={{ width: '1.25rem', height: '1.25rem' }} />
          <div>
            <div>Đánh dấu uống thuốc</div>
            <div style={{ fontSize: '0.75rem', opacity: 0.8 }}>Cập nhật lần uống cuối</div>
          </div>
        </button>
      </div>

      {showCareNoteModal && (
        <CareNoteModal
          residentId={residentId}
          residentName={residentName}
          onClose={() => setShowCareNoteModal(false)}
          onComplete={() => {
            setShowCareNoteModal(false);
            onActionComplete?.();
          }}
        />
      )}

      {showMedicationModal && (
        <MedicationModal
          residentId={residentId}
          residentName={residentName}
          onClose={() => setShowMedicationModal(false)}
          onComplete={() => {
            setShowMedicationModal(false);
            onActionComplete?.();
          }}
        />
      )}

      {showAppointmentModal && (
        <AppointmentModal
          residentId={residentId}
          residentName={residentName}
          onClose={() => setShowAppointmentModal(false)}
          onComplete={() => {
            setShowAppointmentModal(false);
            onActionComplete?.();
          }}
        />
      )}

      {showMedicationListModal && (
        <MedicationListModal
          residentId={residentId}
          residentName={residentName}
          onClose={() => setShowMedicationListModal(false)}
          onComplete={() => {
            setShowMedicationListModal(false);
            onActionComplete?.();
          }}
        />
      )}


    </>
  );
}

function CareNoteModal({ residentId, residentName, onClose, onComplete }: {
  residentId: number;
  residentName: string;
  onClose: () => void;
  onComplete: () => void;
}) {
  const [note, setNote] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!note.trim()) return;

    setIsSubmitting(true);
    try {
      const currentUser = JSON.parse(clientStorage.getItem('currentUser') || '{}');
      const staffName = currentUser.name || 'Nhân viên';
      
      const savedResidents = clientStorage.getItem('nurseryHomeResidents');
      const residents = savedResidents ? JSON.parse(savedResidents) : [];
      
      const residentIndex = residents.findIndex((r: any) => r.id === residentId);
      if (residentIndex !== -1) {
        if (!residents[residentIndex].careNotes) {
          residents[residentIndex].careNotes = [];
        }
        
        const newNote = {
          id: Date.now(),
          date: new Date().toISOString().split('T')[0],
          note: note.trim(),
          staff: `${staffName}, Nhân viên chăm sóc`,
          timestamp: new Date().toISOString()
        };
        
        residents[residentIndex].careNotes.unshift(newNote);
        clientStorage.setItem('nurseryHomeResidents', JSON.stringify(residents));
      }
      
      onComplete();
    } catch (error) {
      console.error('Error adding care note:', error);
      toast.error('Có lỗi xảy ra khi thêm ghi chú. Vui lòng thử lại.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      backgroundColor: 'rgba(0, 0, 0, 0.5)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 1000
    }}>
      <div style={{
        backgroundColor: 'white',
        borderRadius: '0.75rem',
        padding: '1.5rem',
        maxWidth: '500px',
        width: '90%',
        maxHeight: '80vh',
        overflow: 'auto'
      }}>
        <h3 style={{ 
          fontSize: '1.25rem', 
          fontWeight: 600, 
          marginBottom: '1rem',
          color: '#111827'
        }}>
          Thêm ghi chú chăm sóc - {residentName}
        </h3>
        
        <form onSubmit={handleSubmit}>
          <div style={{ marginBottom: '1rem' }}>
            <label style={{
              display: 'block',
              fontSize: '0.875rem',
              fontWeight: 500,
              color: '#374151',
              marginBottom: '0.5rem'
            }}>
              Nội dung ghi chú
            </label>
            <textarea
              value={note}
              onChange={(e) => setNote(e.target.value)}
              rows={4}
              placeholder="Nhập ghi chú về tình trạng, hoạt động, hay điều cần theo dõi..."
              style={{
                width: '100%',
                padding: '0.75rem',
                border: '1px solid #d1d5db',
                borderRadius: '0.375rem',
                fontSize: '0.875rem',
                outline: 'none',
                resize: 'vertical'
              }}
              required
            />
          </div>
          
          <div style={{
            display: 'flex',
            justifyContent: 'flex-end',
            gap: '0.75rem'
          }}>
            <button
              type="button"
              onClick={onClose}
              style={{
                padding: '0.5rem 1rem',
                border: '1px solid #d1d5db',
                borderRadius: '0.375rem',
                backgroundColor: 'white',
                color: '#374151',
                fontSize: '0.875rem',
                cursor: 'pointer'
              }}
            >
              Hủy
            </button>
            <button
              type="submit"
              disabled={isSubmitting || !note.trim()}
              style={{
                padding: '0.5rem 1rem',
                backgroundColor: isSubmitting ? '#9ca3af' : '#1d4ed8',
                color: 'white',
                border: 'none',
                borderRadius: '0.375rem',
                fontSize: '0.875rem',
                cursor: isSubmitting ? 'not-allowed' : 'pointer'
              }}
            >
              {isSubmitting ? 'Đang lưu...' : 'Lưu ghi chú'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

function MedicationModal({ residentId, residentName, onClose, onComplete }: {
  residentId: number;
  residentName: string;
  onClose: () => void;
  onComplete: () => void;
}) {
  const [formData, setFormData] = useState({
    name: '',
    dosage: '',
    schedule: '',
    instructions: ''
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    
    try {
      const savedResidents = clientStorage.getItem('nurseryHomeResidents');
      const residents = savedResidents ? JSON.parse(savedResidents) : [];
      
      const residentIndex = residents.findIndex((r: any) => r.id === residentId);
      if (residentIndex !== -1) {
        if (!residents[residentIndex].medications_detail) {
          residents[residentIndex].medications_detail = [];
        }
        
        const newMedication = {
          id: Date.now(),
          name: formData.name,
          dosage: formData.dosage,
          schedule: formData.schedule,
          instructions: formData.instructions,
          lastAdministered: null,
          addedDate: new Date().toISOString(),
          active: true
        };
        
        residents[residentIndex].medications_detail.push(newMedication);
          
        if (!residents[residentIndex].medications) {
          residents[residentIndex].medications = [];
        }
        residents[residentIndex].medications.push(`${formData.name} ${formData.dosage}`);
        
        clientStorage.setItem('nurseryHomeResidents', JSON.stringify(residents));
      }
      
      onComplete();
    } catch (error) {
      console.error('Error adding medication:', error);
      toast.error('Có lỗi xảy ra khi thêm thuốc. Vui lòng thử lại.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      backgroundColor: 'rgba(0, 0, 0, 0.5)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 1000
    }}>
      <div style={{
        backgroundColor: 'white',
        borderRadius: '0.75rem',
        padding: '1.5rem',
        maxWidth: '500px',
        width: '90%',
        maxHeight: '80vh',
        overflow: 'auto'
      }}>
        <h3 style={{ 
          fontSize: '1.25rem', 
          fontWeight: 600, 
          marginBottom: '1rem',
          color: '#111827'
        }}>
          Thêm thuốc mới - {residentName}
        </h3>
        
        <form onSubmit={handleSubmit}>
          <div style={{ marginBottom: '1rem' }}>
            <label style={{
              display: 'block',
              fontSize: '0.875rem',
              fontWeight: 500,
              color: '#374151',
              marginBottom: '0.5rem'
            }}>
              Tên thuốc *
            </label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => setFormData({...formData, name: e.target.value})}
              placeholder="VD: Paracetamol"
              style={{
                width: '100%',
                padding: '0.75rem',
                border: '1px solid #d1d5db',
                borderRadius: '0.375rem',
                fontSize: '0.875rem',
                outline: 'none'
              }}
              required
            />
          </div>

          <div style={{ marginBottom: '1rem' }}>
            <label style={{
              display: 'block',
              fontSize: '0.875rem',
              fontWeight: 500,
              color: '#374151',
              marginBottom: '0.5rem'
            }}>
              Liều lượng *
            </label>
            <input
              type="text"
              value={formData.dosage}
              onChange={(e) => setFormData({...formData, dosage: e.target.value})}
              placeholder="VD: 500mg"
              style={{
                width: '100%',
                padding: '0.75rem',
                border: '1px solid #d1d5db',
                borderRadius: '0.375rem',
                fontSize: '0.875rem',
                outline: 'none'
              }}
              required
            />
          </div>

          <div style={{ marginBottom: '1rem' }}>
            <label style={{
              display: 'block',
              fontSize: '0.875rem',
              fontWeight: 500,
              color: '#374151',
              marginBottom: '0.5rem'
            }}>
              Lịch dùng *
            </label>
            <select
              value={formData.schedule}
              onChange={(e) => setFormData({...formData, schedule: e.target.value})}
              style={{
                width: '100%',
                padding: '0.75rem',
                border: '1px solid #d1d5db',
                borderRadius: '0.375rem',
                fontSize: '0.875rem',
                outline: 'none'
              }}
              required
            >
              <option value="">Chọn lịch dùng</option>
              <option value="Mỗi ngày một lần">Mỗi ngày một lần</option>
              <option value="Hai lần mỗi ngày">Hai lần mỗi ngày</option>
              <option value="Ba lần mỗi ngày">Ba lần mỗi ngày</option>
              <option value="Mỗi ngày một lần trước giờ đi ngủ">Mỗi ngày một lần trước giờ đi ngủ</option>
              <option value="Mỗi ngày một lần sau ăn">Mỗi ngày một lần sau ăn</option>
              <option value="Khi cần thiết">Khi cần thiết</option>
            </select>
          </div>

          <div style={{ marginBottom: '1rem' }}>
            <label style={{
              display: 'block',
              fontSize: '0.875rem',
              fontWeight: 500,
              color: '#374151',
              marginBottom: '0.5rem'
            }}>
              Hướng dẫn sử dụng
            </label>
            <textarea
              value={formData.instructions}
              onChange={(e) => setFormData({...formData, instructions: e.target.value})}
              rows={3}
              placeholder="Ghi chú thêm về cách sử dụng..."
              style={{
                width: '100%',
                padding: '0.75rem',
                border: '1px solid #d1d5db',
                borderRadius: '0.375rem',
                fontSize: '0.875rem',
                outline: 'none',
                resize: 'vertical'
              }}
            />
          </div>
          
          <div style={{
            display: 'flex',
            justifyContent: 'flex-end',
            gap: '0.75rem'
          }}>
            <button
              type="button"
              onClick={onClose}
              style={{
                padding: '0.5rem 1rem',
                border: '1px solid #d1d5db',
                borderRadius: '0.375rem',
                backgroundColor: 'white',
                color: '#374151',
                fontSize: '0.875rem',
                cursor: 'pointer'
              }}
            >
              Hủy
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              style={{
                padding: '0.5rem 1rem',
                backgroundColor: isSubmitting ? '#9ca3af' : '#166534',
                color: 'white',
                border: 'none',
                borderRadius: '0.375rem',
                fontSize: '0.875rem',
                cursor: isSubmitting ? 'not-allowed' : 'pointer'
              }}
            >
              {isSubmitting ? 'Đang lưu...' : 'Thêm thuốc'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

function AppointmentModal({ residentId, residentName, onClose, onComplete }: {
  residentId: number;
  residentName: string;
  onClose: () => void;
  onComplete: () => void;
}) {
  const [formData, setFormData] = useState({
    type: '',
    provider: '',
    date: '',
    time: '',
    notes: ''
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  const appointmentTypes = [
    'Khám bác sĩ',
    'Khám định kỳ',
    'Vật lý trị liệu',
    'Khám mắt',
    'Khám răng',
    'Xét nghiệm',
    'Chụp X-quang',
    'Tư vấn dinh dưỡng',
    'Khám chuyên khoa'
  ];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    
    try {
      const savedResidents = clientStorage.getItem('nurseryHomeResidents');
      const residents = savedResidents ? JSON.parse(savedResidents) : [];
      
      const residentIndex = residents.findIndex((r: any) => r.id === residentId);
      if (residentIndex !== -1) {
        if (!residents[residentIndex].appointments) {
          residents[residentIndex].appointments = [];
        }
        
        const newAppointment = {
          id: Date.now(),
          type: formData.type,
          provider: formData.provider,
          date: formData.date,
          time: formData.time,
          notes: formData.notes,
          status: 'scheduled',
          createdDate: new Date().toISOString()
        };
        
        residents[residentIndex].appointments.push(newAppointment);
        clientStorage.setItem('nurseryHomeResidents', JSON.stringify(residents));
      }
      
      onComplete();
    } catch (error) {
      console.error('Error adding appointment:', error);
      toast.error('Có lỗi xảy ra khi đặt lịch hẹn. Vui lòng thử lại.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      backgroundColor: 'rgba(0, 0, 0, 0.5)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 1000
    }}>
      <div style={{
        backgroundColor: 'white',
        borderRadius: '0.75rem',
        padding: '1.5rem',
        maxWidth: '500px',
        width: '90%',
        maxHeight: '80vh',
        overflow: 'auto'
      }}>
        <h3 style={{ 
          fontSize: '1.25rem', 
          fontWeight: 600, 
          marginBottom: '1rem',
          color: '#111827'
        }}>
          Đặt lịch khám - {residentName}
        </h3>
        
        <form onSubmit={handleSubmit}>
          <div style={{ marginBottom: '1rem' }}>
            <label style={{
              display: 'block',
              fontSize: '0.875rem',
              fontWeight: 500,
              color: '#374151',
              marginBottom: '0.5rem'
            }}>
              Loại lịch khám *
            </label>
            <select
              value={formData.type}
              onChange={(e) => setFormData({...formData, type: e.target.value})}
              style={{
                width: '100%',
                padding: '0.75rem',
                border: '1px solid #d1d5db',
                borderRadius: '0.375rem',
                fontSize: '0.875rem',
                outline: 'none'
              }}
              required
            >
              <option value="">Chọn loại khám</option>
              {appointmentTypes.map(type => (
                <option key={type} value={type}>{type}</option>
              ))}
            </select>
          </div>

          <div style={{ marginBottom: '1rem' }}>
            <label style={{
              display: 'block',
              fontSize: '0.875rem',
              fontWeight: 500,
              color: '#374151',
              marginBottom: '0.5rem'
            }}>
              Bác sĩ/Chuyên viên *
            </label>
            <input
              type="text"
              value={formData.provider}
              onChange={(e) => setFormData({...formData, provider: e.target.value})}
              placeholder="VD: BS. Nguyễn Văn A"
              style={{
                width: '100%',
                padding: '0.75rem',
                border: '1px solid #d1d5db',
                borderRadius: '0.375rem',
                fontSize: '0.875rem',
                outline: 'none'
              }}
              required
            />
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1rem' }}>
            <div>
              <label style={{
                display: 'block',
                fontSize: '0.875rem',
                fontWeight: 500,
                color: '#374151',
                marginBottom: '0.5rem'
              }}>
                Ngày *
              </label>
              <input
                type="date"
                value={formData.date}
                onChange={(e) => setFormData({...formData, date: e.target.value})}
                min={new Date().toISOString().split('T')[0]}
                style={{
                  width: '100%',
                  padding: '0.75rem',
                  border: '1px solid #d1d5db',
                  borderRadius: '0.375rem',
                  fontSize: '0.875rem',
                  outline: 'none'
                }}
                required
              />
            </div>

            <div>
              <label style={{
                display: 'block',
                fontSize: '0.875rem',
                fontWeight: 500,
                color: '#374151',
                marginBottom: '0.5rem'
              }}>
                Giờ *
              </label>
              <input
                type="time"
                value={formData.time}
                onChange={(e) => setFormData({...formData, time: e.target.value})}
                style={{
                  width: '100%',
                  padding: '0.75rem',
                  border: '1px solid #d1d5db',
                  borderRadius: '0.375rem',
                  fontSize: '0.875rem',
                  outline: 'none'
                }}
                required
              />
            </div>
          </div>

          <div style={{ marginBottom: '1rem' }}>
            <label style={{
              display: 'block',
              fontSize: '0.875rem',
              fontWeight: 500,
              color: '#374151',
              marginBottom: '0.5rem'
            }}>
              Ghi chú
            </label>
            <textarea
              value={formData.notes}
              onChange={(e) => setFormData({...formData, notes: e.target.value})}
              rows={3}
              placeholder="Ghi chú về cuộc hẹn..."
              style={{
                width: '100%',
                padding: '0.75rem',
                border: '1px solid #d1d5db',
                borderRadius: '0.375rem',
                fontSize: '0.875rem',
                outline: 'none',
                resize: 'vertical'
              }}
            />
          </div>
          
          <div style={{
            display: 'flex',
            justifyContent: 'flex-end',
            gap: '0.75rem'
          }}>
            <button
              type="button"
              onClick={onClose}
              style={{
                padding: '0.5rem 1rem',
                border: '1px solid #d1d5db',
                borderRadius: '0.375rem',
                backgroundColor: 'white',
                color: '#374151',
                fontSize: '0.875rem',
                cursor: 'pointer'
              }}
            >
              Hủy
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              style={{
                padding: '0.5rem 1rem',
                backgroundColor: isSubmitting ? '#9ca3af' : '#d97706',
                color: 'white',
                border: 'none',
                borderRadius: '0.375rem',
                fontSize: '0.875rem',
                cursor: isSubmitting ? 'not-allowed' : 'pointer'
              }}
            >
              {isSubmitting ? 'Đang lưu...' : 'Đặt lịch'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

function MedicationListModal({ residentId, residentName, onClose, onComplete }: {
  residentId: number;
  residentName: string;
  onClose: () => void;
  onComplete: () => void;
}) {
  const [medications, setMedications] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const savedResidents = clientStorage.getItem('nurseryHomeResidents');
    if (savedResidents) {
      const residents = JSON.parse(savedResidents);
      const resident = residents.find((r: any) => r.id === residentId);
      if (resident && resident.medications_detail) {
        setMedications(resident.medications_detail.filter((med: any) => med.active !== false));
      }
    }
    setLoading(false);
  }, [residentId]);

  const markAsTaken = async (medicationId: number) => {
    try {
      const savedResidents = clientStorage.getItem('nurseryHomeResidents');
      if (savedResidents) {
        const residents = JSON.parse(savedResidents);
        const residentIndex = residents.findIndex((r: any) => r.id === residentId);
        
        if (residentIndex !== -1 && residents[residentIndex].medications_detail) {
          const medIndex = residents[residentIndex].medications_detail.findIndex((med: any) => med.id === medicationId);
          if (medIndex !== -1) {
            residents[residentIndex].medications_detail[medIndex].lastAdministered = new Date().toLocaleString('vi-VN');
            clientStorage.setItem('nurseryHomeResidents', JSON.stringify(residents));
            
            setMedications(prev => prev.map(med => 
              med.id === medicationId 
                ? { ...med, lastAdministered: new Date().toLocaleString('vi-VN') }
                : med
            ));
          }
        }
      }
    } catch (error) {
      console.error('Error marking medication as taken:', error);
      toast.error('Có lỗi xảy ra. Vui lòng thử lại.');
    }
  };

  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      backgroundColor: 'rgba(0, 0, 0, 0.5)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 1000
    }}>
      <div style={{
        backgroundColor: 'white',
        borderRadius: '0.75rem',
        padding: '1.5rem',
        maxWidth: '600px',
        width: '90%',
        maxHeight: '80vh',
        overflow: 'auto'
      }}>
        <h3 style={{ 
          fontSize: '1.25rem', 
          fontWeight: 600, 
          marginBottom: '1rem',
          color: '#111827'
        }}>
          Đánh dấu uống thuốc - {residentName}
        </h3>
        
        {loading ? (
          <p>Đang tải...</p>
        ) : medications.length === 0 ? (
          <p style={{ color: '#6b7280', textAlign: 'center', padding: '2rem' }}>
            Chưa có thuốc nào được kê đơn.
          </p>
        ) : (
          <div style={{ display: 'grid', gap: '1rem', marginBottom: '1rem' }}>
            {medications.map((medication) => (
              <div key={medication.id} style={{
                border: '1px solid #e5e7eb',
                borderRadius: '0.5rem',
                padding: '1rem'
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                  <div style={{ flex: 1 }}>
                    <h4 style={{ fontSize: '1rem', fontWeight: 600, margin: '0 0 0.25rem 0' }}>
                      {medication.name}
                    </h4>
                    <p style={{ fontSize: '0.875rem', color: '#6b7280', margin: '0 0 0.25rem 0' }}>
                      Liều lượng: {medication.dosage} • {medication.schedule}
                    </p>
                    <p style={{ fontSize: '0.75rem', color: '#9ca3af', margin: 0 }}>
                      Lần cuối: {medication.lastAdministered || 'Chưa uống'}
                    </p>
                  </div>
                  <button
                    onClick={() => markAsTaken(medication.id)}
                    style={{
                      padding: '0.5rem 1rem',
                      backgroundColor: '#10b981',
                      color: 'white',
                      border: 'none',
                      borderRadius: '0.375rem',
                      fontSize: '0.75rem',
                      cursor: 'pointer',
                      marginLeft: '1rem'
                    }}
                  >
                    Đánh dấu đã uống
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
        
        <div style={{
          display: 'flex',
          justifyContent: 'flex-end',
          borderTop: '1px solid #e5e7eb',
          paddingTop: '1rem'
        }}>
          <button
            onClick={onComplete}
            style={{
              padding: '0.5rem 1rem',
              backgroundColor: '#1d4ed8',
              color: 'white',
              border: 'none',
              borderRadius: '0.375rem',
              fontSize: '0.875rem',
              cursor: 'pointer'
            }}
          >
            Đóng
          </button>
        </div>
      </div>
    </div>
  );
} 
