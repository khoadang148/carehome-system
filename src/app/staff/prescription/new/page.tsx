'use client';

import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useForm, Controller } from 'react-hook-form';
import { 
  ArrowLeftIcon,
  UserIcon,
  PlusIcon,
  XMarkIcon,
  ExclamationTriangleIcon,
  CheckCircleIcon,
  ClockIcon,
  CalendarIcon,
  BeakerIcon
} from '@heroicons/react/24/outline';

interface PrescriptionData {
  residentId: string;
  residentName: string;
  medications: MedicationItem[];
  doctorName: string;
  notes: string;
  startDate: string;
  endDate?: string;
}

interface MedicationItem {
  id: string;
  name: string;
  dosage: string;
  frequency: string;
  instructions: string;
  duration: string;
}

const medicationTemplates = [
  { name: 'Paracetamol', dosage: '500mg', frequency: '3 lần/ngày', instructions: 'Sau ăn' },
  { name: 'Amoxicillin', dosage: '250mg', frequency: '2 lần/ngày', instructions: 'Trước ăn 30 phút' },
  { name: 'Aspirin', dosage: '75mg', frequency: '1 lần/ngày', instructions: 'Sau ăn sáng' },
  { name: 'Metformin', dosage: '500mg', frequency: '2 lần/ngày', instructions: 'Cùng với bữa ăn' },
  { name: 'Lisinopril', dosage: '10mg', frequency: '1 lần/ngày', instructions: 'Buổi sáng' },
  { name: 'Simvastatin', dosage: '20mg', frequency: '1 lần/ngày', instructions: 'Buổi tối' }
];

const doctors = [
  'BS. Nguyễn Văn An - Nội tổng quát',
  'BS. Trần Thị Bình - Tim mạch', 
  'BS. Lê Văn Cường - Thần kinh',
  'BS. Hoàng Thị Dung - Lão khoa',
  'BS. Phạm Văn Minh - Ngoại tổng quát'
];

export default function NewPrescriptionPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  
  const { register, handleSubmit, control, watch, setValue, formState: { errors } } = useForm<PrescriptionData>({
    defaultValues: {
      residentId: searchParams.get('residentId') || '',
      residentName: searchParams.get('residentName') || '',
      medications: [{ id: '1', name: '', dosage: '', frequency: '', instructions: '', duration: '' }],
      startDate: new Date().toISOString().split('T')[0],
      doctorName: '',
      notes: ''
    }
  });

  const medications = watch('medications');

  const addMedication = () => {
    const newMedication: MedicationItem = {
      id: Date.now().toString(),
      name: '',
      dosage: '',
      frequency: '',
      instructions: '',
      duration: ''
    };
    setValue('medications', [...medications, newMedication]);
  };

  const removeMedication = (id: string) => {
    setValue('medications', medications.filter(med => med.id !== id));
  };

  const updateMedication = (id: string, field: keyof MedicationItem, value: string) => {
    const updatedMedications = medications.map(med => 
      med.id === id ? { ...med, [field]: value } : med
    );
    setValue('medications', updatedMedications);
  };

  const fillTemplate = (index: number, template: any) => {
    updateMedication(medications[index].id, 'name', template.name);
    updateMedication(medications[index].id, 'dosage', template.dosage);
    updateMedication(medications[index].id, 'frequency', template.frequency);
    updateMedication(medications[index].id, 'instructions', template.instructions);
  };

  const onSubmit = async (data: PrescriptionData) => {
    setIsSubmitting(true);
    
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    // Save prescription to localStorage
    const prescriptions = JSON.parse(localStorage.getItem('nurseryHomePrescriptions') || '[]');
    const newPrescription = {
      id: Date.now(),
      ...data,
      createdAt: new Date().toISOString(),
      status: 'Đang hiệu lực'
    };
    
    prescriptions.push(newPrescription);
    localStorage.setItem('nurseryHomePrescriptions', JSON.stringify(prescriptions));
    
    setIsSubmitting(false);
    setShowSuccess(true);
    
    setTimeout(() => {
      router.push('/staff/prescription');
    }, 2000);
  };

  return (
    <div style={{
      minHeight: '100vh',
      background: 'linear-gradient(135deg, #f8fafc 0%, #e2e8f0 100%)',
      padding: '2rem'
    }}>
      <div style={{
        maxWidth: '800px',
        margin: '0 auto'
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
            alignItems: 'center',
            gap: '1rem',
            marginBottom: '1rem'
          }}>
            <button
              onClick={() => router.back()}
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                width: '2.5rem',
                height: '2.5rem',
                background: 'linear-gradient(135deg, #6b7280 0%, #4b5563 100%)',
                color: 'white',
                border: 'none',
                borderRadius: '0.75rem',
                cursor: 'pointer',
                transition: 'all 0.2s ease',
                boxShadow: '0 2px 4px rgba(0, 0, 0, 0.1)'
              }}
              onMouseOver={(e) => {
                e.currentTarget.style.transform = 'translateY(-1px)';
                e.currentTarget.style.boxShadow = '0 4px 8px rgba(0, 0, 0, 0.15)';
              }}
              onMouseOut={(e) => {
                e.currentTarget.style.transform = 'translateY(0)';
                e.currentTarget.style.boxShadow = '0 2px 4px rgba(0, 0, 0, 0.1)';
              }}
            >
              <ArrowLeftIcon style={{ width: '1.25rem', height: '1.25rem' }} />
            </button>
            
            <div style={{
              width: '3.5rem',
              height: '3.5rem',
              background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
              borderRadius: '1rem',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: '0 4px 12px rgba(16, 185, 129, 0.3)'
            }}>
              <BeakerIcon style={{ width: '2rem', height: '2rem', color: 'white' }} />
            </div>
            
            <div>
              <h1 style={{
                fontSize: '1.875rem',
                fontWeight: 700,
                margin: 0,
                color: '#1e293b',
                background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent'
              }}>
                Kê đơn thuốc mới
              </h1>
              <p style={{
                fontSize: '1rem',
                color: '#64748b',
                margin: '0.25rem 0 0 0',
                fontWeight: 500
              }}>
                {searchParams.get('residentName') || 'Chọn cư dân'}
              </p>
            </div>
          </div>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit(onSubmit)}>
          <div style={{
            background: 'linear-gradient(135deg, #ffffff 0%, #f8fafc 100%)',
            borderRadius: '1.5rem',
            padding: '2rem',
            boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.1)',
            border: '1px solid rgba(255, 255, 255, 0.2)',
            marginBottom: '2rem'
          }}>
            {/* Basic Info */}
            <div style={{
              display: 'grid',
              gridTemplateColumns: '1fr 1fr',
              gap: '1.5rem',
              marginBottom: '2rem'
            }}>
              <div>
                <label style={{
                  display: 'block',
                  fontSize: '0.875rem',
                  fontWeight: 600,
                  color: '#374151',
                  marginBottom: '0.5rem'
                }}>
                  Tên cư dân *
                </label>
                <input
                  {...register('residentName', { required: 'Vui lòng nhập tên cư dân' })}
                  style={{
                    width: '100%',
                    padding: '0.75rem',
                    border: '2px solid #e5e7eb',
                    borderRadius: '0.5rem',
                    fontSize: '0.875rem',
                    outline: 'none',
                    backgroundColor: '#f9fafb'
                  }}
                  placeholder="Nhập tên cư dân"
                />
                {errors.residentName && (
                  <p style={{ color: '#ef4444', fontSize: '0.75rem', marginTop: '0.25rem' }}>
                    {errors.residentName.message}
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
                  Bác sĩ kê đơn *
                </label>
                <select
                  {...register('doctorName', { required: 'Vui lòng chọn bác sĩ' })}
                  style={{
                    width: '100%',
                    padding: '0.75rem',
                    border: '2px solid #e5e7eb',
                    borderRadius: '0.5rem',
                    fontSize: '0.875rem',
                    outline: 'none'
                  }}
                >
                  <option value="">Chọn bác sĩ</option>
                  {doctors.map(doctor => (
                    <option key={doctor} value={doctor}>{doctor}</option>
                  ))}
                </select>
                {errors.doctorName && (
                  <p style={{ color: '#ef4444', fontSize: '0.75rem', marginTop: '0.25rem' }}>
                    {errors.doctorName.message}
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
                  Ngày bắt đầu *
                </label>
                <input
                  type="date"
                  {...register('startDate', { required: 'Vui lòng chọn ngày bắt đầu' })}
                  style={{
                    width: '100%',
                    padding: '0.75rem',
                    border: '2px solid #e5e7eb',
                    borderRadius: '0.5rem',
                    fontSize: '0.875rem',
                    outline: 'none'
                  }}
                />
                {errors.startDate && (
                  <p style={{ color: '#ef4444', fontSize: '0.75rem', marginTop: '0.25rem' }}>
                    {errors.startDate.message}
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
                  Ngày kết thúc (tùy chọn)
                </label>
                <input
                  type="date"
                  {...register('endDate')}
                  style={{
                    width: '100%',
                    padding: '0.75rem',
                    border: '2px solid #e5e7eb',
                    borderRadius: '0.5rem',
                    fontSize: '0.875rem',
                    outline: 'none'
                  }}
                />
              </div>
            </div>

            {/* Medications */}
            <div style={{ marginBottom: '2rem' }}>
              <div style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                marginBottom: '1rem'
              }}>
                <h3 style={{
                  fontSize: '1.125rem',
                  fontWeight: 600,
                  color: '#1e293b',
                  margin: 0
                }}>
                  Danh sách thuốc
                </h3>
                <button
                  type="button"
                  onClick={addMedication}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.5rem',
                    padding: '0.5rem 1rem',
                    background: 'linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)',
                    color: 'white',
                    border: 'none',
                    borderRadius: '0.5rem',
                    fontSize: '0.875rem',
                    fontWeight: 600,
                    cursor: 'pointer'
                  }}
                >
                  <PlusIcon style={{ width: '1rem', height: '1rem' }} />
                  Thêm thuốc
                </button>
              </div>

              {medications.map((medication, index) => (
                <div
                  key={medication.id}
                  style={{
                    background: '#f8fafc',
                    border: '1px solid #e2e8f0',
                    borderRadius: '0.75rem',
                    padding: '1.5rem',
                    marginBottom: '1rem'
                  }}
                >
                  <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    marginBottom: '1rem'
                  }}>
                    <h4 style={{
                      fontSize: '1rem',
                      fontWeight: 600,
                      color: '#1e293b',
                      margin: 0
                    }}>
                      Thuốc #{index + 1}
                    </h4>
                    <div style={{ display: 'flex', gap: '0.5rem' }}>
                      <select
                        onChange={(e) => {
                          const template = medicationTemplates[parseInt(e.target.value)];
                          if (template) fillTemplate(index, template);
                        }}
                        style={{
                          padding: '0.5rem',
                          border: '1px solid #d1d5db',
                          borderRadius: '0.375rem',
                          fontSize: '0.75rem',
                          outline: 'none'
                        }}
                      >
                        <option value="">Chọn mẫu có sẵn</option>
                        {medicationTemplates.map((template, templateIndex) => (
                          <option key={templateIndex} value={templateIndex}>
                            {template.name} {template.dosage}
                          </option>
                        ))}
                      </select>
                      {medications.length > 1 && (
                        <button
                          type="button"
                          onClick={() => removeMedication(medication.id)}
                          style={{
                            padding: '0.5rem',
                            background: '#ef4444',
                            color: 'white',
                            border: 'none',
                            borderRadius: '0.375rem',
                            cursor: 'pointer'
                          }}
                        >
                          <XMarkIcon style={{ width: '1rem', height: '1rem' }} />
                        </button>
                      )}
                    </div>
                  </div>

                  <div style={{
                    display: 'grid',
                    gridTemplateColumns: '2fr 1fr 1fr',
                    gap: '1rem',
                    marginBottom: '1rem'
                  }}>
                    <div>
                      <label style={{
                        display: 'block',
                        fontSize: '0.75rem',
                        fontWeight: 600,
                        color: '#374151',
                        marginBottom: '0.25rem'
                      }}>
                        Tên thuốc *
                      </label>
                      <input
                        value={medication.name}
                        onChange={(e) => updateMedication(medication.id, 'name', e.target.value)}
                        style={{
                          width: '100%',
                          padding: '0.5rem',
                          border: '1px solid #d1d5db',
                          borderRadius: '0.375rem',
                          fontSize: '0.875rem',
                          outline: 'none'
                        }}
                        placeholder="Nhập tên thuốc"
                      />
                    </div>

                    <div>
                      <label style={{
                        display: 'block',
                        fontSize: '0.75rem',
                        fontWeight: 600,
                        color: '#374151',
                        marginBottom: '0.25rem'
                      }}>
                        Liều lượng *
                      </label>
                      <input
                        value={medication.dosage}
                        onChange={(e) => updateMedication(medication.id, 'dosage', e.target.value)}
                        style={{
                          width: '100%',
                          padding: '0.5rem',
                          border: '1px solid #d1d5db',
                          borderRadius: '0.375rem',
                          fontSize: '0.875rem',
                          outline: 'none'
                        }}
                        placeholder="500mg"
                      />
                    </div>

                    <div>
                      <label style={{
                        display: 'block',
                        fontSize: '0.75rem',
                        fontWeight: 600,
                        color: '#374151',
                        marginBottom: '0.25rem'
                      }}>
                        Tần suất *
                      </label>
                      <input
                        value={medication.frequency}
                        onChange={(e) => updateMedication(medication.id, 'frequency', e.target.value)}
                        style={{
                          width: '100%',
                          padding: '0.5rem',
                          border: '1px solid #d1d5db',
                          borderRadius: '0.375rem',
                          fontSize: '0.875rem',
                          outline: 'none'
                        }}
                        placeholder="3 lần/ngày"
                      />
                    </div>
                  </div>

                  <div style={{
                    display: 'grid',
                    gridTemplateColumns: '1fr 1fr',
                    gap: '1rem'
                  }}>
                    <div>
                      <label style={{
                        display: 'block',
                        fontSize: '0.75rem',
                        fontWeight: 600,
                        color: '#374151',
                        marginBottom: '0.25rem'
                      }}>
                        Hướng dẫn sử dụng
                      </label>
                      <input
                        value={medication.instructions}
                        onChange={(e) => updateMedication(medication.id, 'instructions', e.target.value)}
                        style={{
                          width: '100%',
                          padding: '0.5rem',
                          border: '1px solid #d1d5db',
                          borderRadius: '0.375rem',
                          fontSize: '0.875rem',
                          outline: 'none'
                        }}
                        placeholder="Sau ăn"
                      />
                    </div>

                    <div>
                      <label style={{
                        display: 'block',
                        fontSize: '0.75rem',
                        fontWeight: 600,
                        color: '#374151',
                        marginBottom: '0.25rem'
                      }}>
                        Thời gian điều trị
                      </label>
                      <input
                        value={medication.duration}
                        onChange={(e) => updateMedication(medication.id, 'duration', e.target.value)}
                        style={{
                          width: '100%',
                          padding: '0.5rem',
                          border: '1px solid #d1d5db',
                          borderRadius: '0.375rem',
                          fontSize: '0.875rem',
                          outline: 'none'
                        }}
                        placeholder="7 ngày"
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Notes */}
            <div style={{ marginBottom: '2rem' }}>
              <label style={{
                display: 'block',
                fontSize: '0.875rem',
                fontWeight: 600,
                color: '#374151',
                marginBottom: '0.5rem'
              }}>
                Ghi chú thêm
              </label>
              <textarea
                {...register('notes')}
                rows={4}
                style={{
                  width: '100%',
                  padding: '0.75rem',
                  border: '2px solid #e5e7eb',
                  borderRadius: '0.5rem',
                  fontSize: '0.875rem',
                  outline: 'none',
                  resize: 'vertical'
                }}
                placeholder="Ghi chú về tình trạng bệnh nhân, tác dụng phụ cần lưu ý..."
              />
            </div>

            {/* Submit Button */}
            <div style={{
              display: 'flex',
              justifyContent: 'flex-end',
              gap: '1rem'
            }}>
              <button
                type="button"
                onClick={() => router.back()}
                style={{
                  padding: '0.75rem 1.5rem',
                  background: '#6b7280',
                  color: 'white',
                  border: 'none',
                  borderRadius: '0.5rem',
                  fontSize: '0.875rem',
                  fontWeight: 600,
                  cursor: 'pointer'
                }}
              >
                Hủy
              </button>
              <button
                type="submit"
                disabled={isSubmitting}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.5rem',
                  padding: '0.75rem 1.5rem',
                  background: isSubmitting 
                    ? '#9ca3af' 
                    : 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
                  color: 'white',
                  border: 'none',
                  borderRadius: '0.5rem',
                  fontSize: '0.875rem',
                  fontWeight: 600,
                  cursor: isSubmitting ? 'not-allowed' : 'pointer'
                }}
              >
                {isSubmitting ? (
                  <>
                    <div style={{
                      width: '1rem',
                      height: '1rem',
                      border: '2px solid transparent',
                      borderTop: '2px solid white',
                      borderRadius: '50%',
                      animation: 'spin 1s linear infinite'
                    }} />
                    Đang lưu...
                  </>
                ) : (
                  <>
                    <CheckCircleIcon style={{ width: '1rem', height: '1rem' }} />
                    Lưu đơn thuốc
                  </>
                )}
              </button>
            </div>
          </div>
        </form>

        {/* Success Modal */}
        {showSuccess && (
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
              background: 'white',
              borderRadius: '1rem',
              padding: '2rem',
              maxWidth: '400px',
              textAlign: 'center'
            }}>
              <CheckCircleIcon style={{
                width: '4rem',
                height: '4rem',
                color: '#10b981',
                margin: '0 auto 1rem'
              }} />
              <h3 style={{
                fontSize: '1.25rem',
                fontWeight: 600,
                color: '#1e293b',
                marginBottom: '0.5rem'
              }}>
                Đã lưu đơn thuốc thành công!
              </h3>
              <p style={{
                color: '#64748b',
                marginBottom: '1rem'
              }}>
                Đơn thuốc đã được tạo và có hiệu lực ngay lập tức.
              </p>
            </div>
          </div>
        )}
      </div>

      <style jsx>{`
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
} 