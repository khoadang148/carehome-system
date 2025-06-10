"use client";

import { useState } from 'react';
import { PlusIcon, TrashIcon, BeakerIcon, ExclamationTriangleIcon } from '@heroicons/react/24/outline';

interface PrescriptionModalProps {
  residentId: number;
  residentName: string;
  onClose: () => void;
  onComplete: () => void;
}

interface MedicationItem {
  id: string;
  name: string;
  dosage: string;
  schedule: string;
  instructions: string;
  duration: string;
}

interface ValidationError {
  field: string;
  message: string;
  severity: 'error' | 'warning';
}

export default function PrescriptionModal({ residentId, residentName, onClose, onComplete }: PrescriptionModalProps) {
  const [medications, setMedications] = useState<MedicationItem[]>([
    {
      id: Date.now().toString(),
      name: '',
      dosage: '',
      schedule: '',
      instructions: '',
      duration: ''
    }
  ]);
  const [doctorName, setDoctorName] = useState('');
  const [prescriptionNotes, setPrescriptionNotes] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [validationErrors, setValidationErrors] = useState<ValidationError[]>([]);
  const [showValidation, setShowValidation] = useState(false);

  // Danh sách thuốc phổ biến với thông tin y khoa
  const commonMedications = [
    { name: 'Paracetamol', maxDailyDose: '4000mg', interactions: ['Warfarin'], category: 'Giảm đau, hạ sốt' },
    { name: 'Aspirin', maxDailyDose: '4000mg', interactions: ['Warfarin', 'Heparin'], category: 'Giảm đau, chống viêm' },
    { name: 'Metformin', maxDailyDose: '2000mg', interactions: ['Insulin'], category: 'Điều trị tiểu đường' },
    { name: 'Amlodipine', maxDailyDose: '10mg', interactions: ['Simvastatin'], category: 'Điều trị tăng huyết áp' },
    { name: 'Omeprazole', maxDailyDose: '40mg', interactions: ['Clopidogrel'], category: 'Điều trị dạ dày' },
    { name: 'Atorvastatin', maxDailyDose: '80mg', interactions: ['Warfarin', 'Digoxin'], category: 'Giảm cholesterol' },
    { name: 'Furosemide', maxDailyDose: '600mg', interactions: ['Digoxin', 'Lithium'], category: 'Lợi tiểu' }
  ];

  const scheduleOptions = [
    { value: '1x/ngày - sáng', timeSlots: ['08:00'], medicalName: 'Mỗi ngày một lần (sáng)' },
    { value: '1x/ngày - tối', timeSlots: ['20:00'], medicalName: 'Mỗi ngày một lần (tối)' },
    { value: '2x/ngày', timeSlots: ['08:00', '20:00'], medicalName: 'Hai lần mỗi ngày' },
    { value: '3x/ngày', timeSlots: ['08:00', '14:00', '20:00'], medicalName: 'Ba lần mỗi ngày' },
    { value: '4x/ngày', timeSlots: ['08:00', '12:00', '16:00', '20:00'], medicalName: 'Bốn lần mỗi ngày' },
    { value: 'Trước ăn sáng', timeSlots: ['07:30'], medicalName: 'Mỗi ngày một lần trước ăn sáng' },
    { value: 'Sau ăn sáng', timeSlots: ['08:30'], medicalName: 'Mỗi ngày một lần sau ăn sáng' },
    { value: 'Sau ăn trưa', timeSlots: ['13:00'], medicalName: 'Mỗi ngày một lần sau ăn trưa' },
    { value: 'Sau ăn tối', timeSlots: ['19:30'], medicalName: 'Mỗi ngày một lần sau ăn tối' },
    { value: 'Mỗi 12 giờ', timeSlots: ['08:00', '20:00'], medicalName: 'Mỗi 12 giờ một lần' },
    { value: 'Mỗi 8 giờ', timeSlots: ['08:00', '16:00', '00:00'], medicalName: 'Mỗi 8 giờ một lần' },
    { value: 'Mỗi 6 giờ', timeSlots: ['06:00', '12:00', '18:00', '00:00'], medicalName: 'Mỗi 6 giờ một lần' },
    { value: 'Khi cần thiết', timeSlots: [], medicalName: 'Theo yêu cầu (PRN)' },
    { value: 'Theo chỉ định', timeSlots: [], medicalName: 'Theo chỉ định bác sĩ' }
  ];

  // Validation chuyên nghiệp
  const performMedicalValidation = (): ValidationError[] => {
    const errors: ValidationError[] = [];

    // 1. Kiểm tra thông tin bác sĩ
    if (!doctorName.trim()) {
      errors.push({
        field: 'doctor',
        message: 'Tên bác sĩ kê đơn là bắt buộc theo quy định y tế',
        severity: 'error'
      });
    } else if (!/^(BS\.|Bác sĩ|ThS\.|TS\.|GS\.)/.test(doctorName.trim())) {
      errors.push({
        field: 'doctor',
        message: 'Tên bác sĩ nên có danh xưng (VD: BS. Nguyễn Văn A)',
        severity: 'warning'
      });
    }

    // 2. Validation từng thuốc
    medications.forEach((med, index) => {
      // Kiểm tra tên thuốc
      if (!med.name.trim()) {
        errors.push({
          field: `med_${index}_name`,
          message: `Thuốc ${index + 1}: Tên thuốc không được để trống`,
          severity: 'error'
        });
      } else {
        const commonMed = commonMedications.find(cm => 
          cm.name.toLowerCase() === med.name.toLowerCase()
        );
        if (!commonMed) {
          errors.push({
            field: `med_${index}_name`,
            message: `Thuốc ${index + 1}: "${med.name}" không có trong danh mục thuốc thông dụng. Vui lòng kiểm tra chính tả.`,
            severity: 'warning'
          });
        }
      }

      // Kiểm tra liều lượng
      if (!med.dosage.trim()) {
        errors.push({
          field: `med_${index}_dosage`,
          message: `Thuốc ${index + 1}: Liều lượng là bắt buộc`,
          severity: 'error'
        });
      } else {
        const dosageRegex = /^\d+(\.\d+)?\s*(mg|g|ml|viên|gói|ống|mcg|μg|IU|%)$/i;
        if (!dosageRegex.test(med.dosage.trim())) {
          errors.push({
            field: `med_${index}_dosage`,
            message: `Thuốc ${index + 1}: Liều lượng phải có đơn vị (VD: 500mg, 1 viên)`,
            severity: 'error'
          });
        } else {
          // Kiểm tra liều tối đa
          const commonMed = commonMedications.find(cm => 
            cm.name.toLowerCase() === med.name.toLowerCase()
          );
          if (commonMed && med.dosage.includes('mg')) {
            const currentDose = parseFloat(med.dosage.match(/(\d+(\.\d+)?)/)?.[0] || '0');
            const maxDose = parseFloat(commonMed.maxDailyDose.match(/(\d+(\.\d+)?)/)?.[0] || '0');
            
            // Tính liều hàng ngày dựa trên tần suất
            const schedule = scheduleOptions.find(s => s.value === med.schedule);
            const dailyDose = currentDose * (schedule?.timeSlots.length || 1);
            
            if (dailyDose > maxDose) {
              errors.push({
                field: `med_${index}_dosage`,
                message: `Thuốc ${index + 1}: Liều hàng ngày (${dailyDose}mg) vượt quá liều tối đa khuyến cáo (${maxDose}mg)`,
                severity: 'warning'
              });
            }
          }
        }
      }

      // Kiểm tra lịch uống
      if (!med.schedule.trim()) {
        errors.push({
          field: `med_${index}_schedule`,
          message: `Thuốc ${index + 1}: Lịch uống thuốc là bắt buộc`,
          severity: 'error'
        });
      }

      // Kiểm tra thời gian điều trị
      if (!med.duration.trim()) {
        errors.push({
          field: `med_${index}_duration`,
          message: `Thuốc ${index + 1}: Thời gian điều trị là bắt buộc`,
          severity: 'error'
        });
      } else {
        const durationRegex = /^\d+\s*(ngày|tuần|tháng|năm)$/i;
        if (!durationRegex.test(med.duration.trim())) {
          errors.push({
            field: `med_${index}_duration`,
            message: `Thuốc ${index + 1}: Thời gian điều trị phải có định dạng: "7 ngày", "2 tuần", "1 tháng"`,
            severity: 'error'
          });
        }
      }
    });

    // 3. Kiểm tra tương tác thuốc
    const medicationNames = medications.map(m => m.name.toLowerCase()).filter(n => n);
    for (let i = 0; i < medicationNames.length; i++) {
      for (let j = i + 1; j < medicationNames.length; j++) {
        const med1 = commonMedications.find(cm => cm.name.toLowerCase() === medicationNames[i]);
        const med2 = commonMedications.find(cm => cm.name.toLowerCase() === medicationNames[j]);
        
        if (med1 && med2) {
          if (med1.interactions.some(interaction => 
            interaction.toLowerCase() === med2.name.toLowerCase()
          )) {
            errors.push({
              field: 'interaction',
              message: `Cảnh báo tương tác thuốc: ${med1.name} và ${med2.name} có thể tương tác. Cần theo dõi chặt chẽ.`,
              severity: 'warning'
            });
          }
        }
      }
    }

    // 4. Kiểm tra thuốc trùng lặp
    const duplicates = medicationNames.filter((name, index) => 
      medicationNames.indexOf(name) !== index
    );
    if (duplicates.length > 0) {
      errors.push({
        field: 'duplicate',
        message: `Phát hiện thuốc trùng lặp: ${duplicates.join(', ')}`,
        severity: 'error'
      });
    }

    // 5. Kiểm tra số lượng thuốc
    if (medications.length > 10) {
      errors.push({
        field: 'count',
        message: 'Đơn thuốc có quá nhiều loại thuốc (>10). Khuyến nghị xem xét lại.',
        severity: 'warning'
      });
    }

    return errors;
  };

  const addMedication = () => {
    setMedications([
      ...medications,
      {
        id: Date.now().toString(),
        name: '',
        dosage: '',
        schedule: '',
        instructions: '',
        duration: ''
      }
    ]);
  };

  const removeMedication = (id: string) => {
    if (medications.length > 1) {
      setMedications(medications.filter(med => med.id !== id));
    }
  };

  const updateMedication = (id: string, field: keyof MedicationItem, value: string) => {
    setMedications(medications.map(med => 
      med.id === id ? { ...med, [field]: value } : med
    ));
    
    // Real-time validation
    if (showValidation) {
      setValidationErrors(performMedicalValidation());
    }
  };

  const validateForm = () => {
    const errors = performMedicalValidation();
    setValidationErrors(errors);
    setShowValidation(true);
    
    // Chỉ cho phép submit nếu không có lỗi nghiêm trọng
    return errors.filter(e => e.severity === 'error').length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      alert('Vui lòng khắc phục các lỗi trước khi lưu đơn thuốc.');
      return;
    }

    // Hiển thị cảnh báo nếu có
    const warnings = validationErrors.filter(e => e.severity === 'warning');
    if (warnings.length > 0) {
      const warningMessages = warnings.map(w => w.message).join('\n');
      const confirmed = confirm(`Phát hiện các cảnh báo sau:\n\n${warningMessages}\n\nBạn có muốn tiếp tục?`);
      if (!confirmed) return;
    }

    setIsSubmitting(true);
    
    try {
      // Get current user for staff info
      const currentUser = JSON.parse(localStorage.getItem('currentUser') || '{}');
      const staffName = currentUser.name || 'Nhân viên';
      
      // Get existing residents data
      const savedResidents = localStorage.getItem('nurseryHomeResidents');
      const residents = savedResidents ? JSON.parse(savedResidents) : [];
      
      // Find and update the resident
      const residentIndex = residents.findIndex((r: any) => r.id === residentId);
      if (residentIndex !== -1) {
        // Initialize arrays if they don't exist
        if (!residents[residentIndex].medications_detail) {
          residents[residentIndex].medications_detail = [];
        }
        if (!residents[residentIndex].medications) {
          residents[residentIndex].medications = [];
        }
        if (!residents[residentIndex].prescriptions) {
          residents[residentIndex].prescriptions = [];
        }

        // Create prescription record with validation info
        const prescription = {
          id: Date.now(),
          doctor: doctorName,
          prescriptionDate: new Date().toISOString(),
          notes: prescriptionNotes,
          prescribedBy: `${staffName}, Nhân viên chăm sóc`,
          validationWarnings: validationErrors.filter(e => e.severity === 'warning').length,
          medications: medications.map(med => {
            const schedule = scheduleOptions.find(s => s.value === med.schedule);
            return {
              name: med.name,
              dosage: med.dosage,
              schedule: schedule ? schedule.timeSlots : [],
              scheduleText: med.schedule,
              instructions: med.instructions,
              duration: med.duration,
              medicalCategory: commonMedications.find(cm => 
                cm.name.toLowerCase() === med.name.toLowerCase()
              )?.category || 'Khác'
            };
          })
        };

        // Add to prescriptions history
        residents[residentIndex].prescriptions.push(prescription);
        
        // Add medications to current medication list
        medications.forEach(med => {
          const schedule = scheduleOptions.find(s => s.value === med.schedule);
          const newMedication = {
            id: Date.now() + Math.random(),
            name: med.name,
            dosage: med.dosage,
            schedule: schedule ? schedule.timeSlots : [],
            scheduleText: med.schedule,
            instructions: med.instructions,
            duration: med.duration,
            lastAdministered: null,
            addedDate: new Date().toISOString(),
            prescriptionId: prescription.id,
            active: true,
            category: commonMedications.find(cm => 
              cm.name.toLowerCase() === med.name.toLowerCase()
            )?.category || 'Khác'
          };
          
          residents[residentIndex].medications_detail.push(newMedication);
          
          // Update simple medications array for compatibility
          residents[residentIndex].medications.push(`${med.name} ${med.dosage}`);
        });

        // Add care note about prescription
        if (!residents[residentIndex].careNotes) {
          residents[residentIndex].careNotes = [];
        }
        
        const prescriptionNote = {
          id: Date.now() + 1,
          date: new Date().toISOString().split('T')[0],
          note: `Đơn thuốc mới từ ${doctorName}: ${medications.map(m => `${m.name} ${m.dosage}`).join(', ')}. Thời gian điều trị: ${medications.map(m => m.duration).join(', ')}. ${prescriptionNotes}`,
          staff: `${staffName}, Nhân viên chăm sóc`,
          timestamp: new Date().toISOString(),
          type: 'prescription',
          priority: validationErrors.some(e => e.severity === 'warning') ? 'high' : 'medium'
        };
        
        residents[residentIndex].careNotes.unshift(prescriptionNote);
        
        localStorage.setItem('nurseryHomeResidents', JSON.stringify(residents));
      }
      
      onComplete();
    } catch (error) {
      console.error('Error creating prescription:', error);
      alert('Có lỗi xảy ra khi lên đơn thuốc. Vui lòng thử lại.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const getFieldError = (field: string) => {
    return validationErrors.find(e => e.field === field);
  };

  const renderValidationMessage = (error: ValidationError) => (
    <div style={{
      display: 'flex',
      alignItems: 'center',
      gap: '0.5rem',
      padding: '0.5rem',
      marginTop: '0.25rem',
      borderRadius: '0.375rem',
      fontSize: '0.75rem',
      backgroundColor: error.severity === 'error' ? '#fef2f2' : '#fffbeb',
      border: `1px solid ${error.severity === 'error' ? '#fecaca' : '#fed7aa'}`,
      color: error.severity === 'error' ? '#dc2626' : '#d97706'
    }}>
      <ExclamationTriangleIcon style={{ 
        width: '1rem', 
        height: '1rem',
        color: error.severity === 'error' ? '#dc2626' : '#d97706'
      }} />
      {error.message}
    </div>
  );

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
        borderRadius: '1rem',
        padding: '2rem',
        maxWidth: '900px',
        width: '95%',
        maxHeight: '90vh',
        overflow: 'auto',
        boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)'
      }}>
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '0.75rem',
          marginBottom: '1.5rem'
        }}>
          <div style={{
            width: '3rem',
            height: '3rem',
            background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
            borderRadius: '0.75rem',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          }}>
            <BeakerIcon style={{ width: '1.5rem', height: '1.5rem', color: 'white' }} />
          </div>
          <div>
            <h2 style={{ 
              fontSize: '1.5rem', 
              fontWeight: 700, 
              margin: 0,
              color: '#111827'
            }}>
              Kê đơn thuốc điều trị - {residentName}
            </h2>
            <p style={{
              fontSize: '0.875rem',
              color: '#6b7280',
              margin: '0.25rem 0 0 0'
            }}>
              Vui lòng điền đầy đủ thông tin theo quy định y tế
            </p>
          </div>
        </div>

        <form onSubmit={handleSubmit}>
          {/* Doctor Information */}
          <div style={{ marginBottom: '2rem' }}>
            <label style={{
              display: 'block',
              fontSize: '0.875rem',
              fontWeight: 600,
              color: '#374151',
              marginBottom: '0.5rem'
            }}>
              Bác sĩ kê đơn <span style={{ color: '#ef4444' }}>*</span>
            </label>
            <input
              type="text"
              value={doctorName}
              onChange={(e) => {
                setDoctorName(e.target.value);
                if (showValidation) {
                  setValidationErrors(performMedicalValidation());
                }
              }}
              placeholder="VD: BS. Nguyễn Văn A"
              style={{
                width: '100%',
                padding: '0.75rem',
                border: `1px solid ${getFieldError('doctor') ? '#ef4444' : '#d1d5db'}`,
                borderRadius: '0.5rem',
                fontSize: '0.875rem',
                outline: 'none'
              }}
              required
            />
            {getFieldError('doctor') && renderValidationMessage(getFieldError('doctor')!)}
          </div>

          {/* Medications List */}
          <div style={{ marginBottom: '2rem' }}>
            <div style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              marginBottom: '1rem'
            }}>
              <label style={{
                fontSize: '0.875rem',
                fontWeight: 600,
                color: '#374151'
              }}>
                Danh sách thuốc <span style={{ color: '#ef4444' }}>*</span>
              </label>
              <button
                type="button"
                onClick={addMedication}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.5rem',
                  padding: '0.5rem 1rem',
                  backgroundColor: '#10b981',
                  color: 'white',
                  border: 'none',
                  borderRadius: '0.5rem',
                  fontSize: '0.875rem',
                  cursor: 'pointer'
                }}
              >
                <PlusIcon style={{ width: '1rem', height: '1rem' }} />
                Thêm thuốc
              </button>
            </div>

            {medications.map((medication, index) => (
              <div key={medication.id} style={{
                border: `2px solid ${getFieldError(`med_${index}_name`) || getFieldError(`med_${index}_dosage`) || getFieldError(`med_${index}_schedule`) || getFieldError(`med_${index}_duration`) ? '#ef4444' : '#e5e7eb'}`,
                borderRadius: '0.75rem',
                padding: '1.5rem',
                marginBottom: '1rem',
                backgroundColor: '#fafafa'
              }}>
                <div style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  marginBottom: '1rem'
                }}>
                  <h4 style={{
                    fontSize: '1rem',
                    fontWeight: 600,
                    color: '#111827',
                    margin: 0
                  }}>
                    Thuốc #{index + 1}
                  </h4>
                  {medications.length > 1 && (
                    <button
                      type="button"
                      onClick={() => removeMedication(medication.id)}
                      style={{
                        padding: '0.5rem',
                        backgroundColor: '#ef4444',
                        color: 'white',
                        border: 'none',
                        borderRadius: '0.375rem',
                        cursor: 'pointer'
                      }}
                    >
                      <TrashIcon style={{ width: '1rem', height: '1rem' }} />
                    </button>
                  )}
                </div>

                <div style={{
                  display: 'grid',
                  gridTemplateColumns: '1fr 1fr',
                  gap: '1rem',
                  marginBottom: '1rem'
                }}>
                  {/* Medication Name */}
                  <div>
                    <label style={{
                      display: 'block',
                      fontSize: '0.75rem',
                      fontWeight: 500,
                      color: '#374151',
                      marginBottom: '0.25rem'
                    }}>
                      Tên thuốc <span style={{ color: '#ef4444' }}>*</span>
                    </label>
                    <input
                      type="text"
                      list={`medications-${index}`}
                      value={medication.name}
                      onChange={(e) => updateMedication(medication.id, 'name', e.target.value)}
                      placeholder="VD: Paracetamol"
                      style={{
                        width: '100%',
                        padding: '0.5rem',
                        border: `1px solid ${getFieldError(`med_${index}_name`) ? '#ef4444' : '#d1d5db'}`,
                        borderRadius: '0.375rem',
                        fontSize: '0.75rem'
                      }}
                      required
                    />
                    <datalist id={`medications-${index}`}>
                      {commonMedications.map(med => (
                        <option key={med.name} value={med.name}>
                          {med.category}
                        </option>
                      ))}
                    </datalist>
                    {getFieldError(`med_${index}_name`) && renderValidationMessage(getFieldError(`med_${index}_name`)!)}
                  </div>

                  {/* Dosage */}
                  <div>
                    <label style={{
                      display: 'block',
                      fontSize: '0.75rem',
                      fontWeight: 500,
                      color: '#374151',
                      marginBottom: '0.25rem'
                    }}>
                      Liều lượng <span style={{ color: '#ef4444' }}>*</span>
                    </label>
                    <input
                      type="text"
                      value={medication.dosage}
                      onChange={(e) => updateMedication(medication.id, 'dosage', e.target.value)}
                      placeholder="VD: 500mg, 1 viên"
                      style={{
                        width: '100%',
                        padding: '0.5rem',
                        border: `1px solid ${getFieldError(`med_${index}_dosage`) ? '#ef4444' : '#d1d5db'}`,
                        borderRadius: '0.375rem',
                        fontSize: '0.75rem'
                      }}
                      required
                    />
                    {getFieldError(`med_${index}_dosage`) && renderValidationMessage(getFieldError(`med_${index}_dosage`)!)}
                  </div>
                </div>

                <div style={{
                  display: 'grid',
                  gridTemplateColumns: '1fr 1fr',
                  gap: '1rem',
                  marginBottom: '1rem'
                }}>
                  {/* Schedule */}
                  <div>
                    <label style={{
                      display: 'block',
                      fontSize: '0.75rem',
                      fontWeight: 500,
                      color: '#374151',
                      marginBottom: '0.25rem'
                    }}>
                      Lịch dùng <span style={{ color: '#ef4444' }}>*</span>
                    </label>
                    <select
                      value={medication.schedule}
                      onChange={(e) => updateMedication(medication.id, 'schedule', e.target.value)}
                      style={{
                        width: '100%',
                        padding: '0.5rem',
                        border: `1px solid ${getFieldError(`med_${index}_schedule`) ? '#ef4444' : '#d1d5db'}`,
                        borderRadius: '0.375rem',
                        fontSize: '0.75rem'
                      }}
                      required
                    >
                      <option value="">Chọn lịch dùng</option>
                      {scheduleOptions.map(option => (
                        <option key={option.value} value={option.value}>
                          {option.value} {option.timeSlots.length > 0 && `(${option.timeSlots.join(', ')})`}
                        </option>
                      ))}
                    </select>
                    {getFieldError(`med_${index}_schedule`) && renderValidationMessage(getFieldError(`med_${index}_schedule`)!)}
                  </div>

                  {/* Duration */}
                  <div>
                    <label style={{
                      display: 'block',
                      fontSize: '0.75rem',
                      fontWeight: 500,
                      color: '#374151',
                      marginBottom: '0.25rem'
                    }}>
                      Thời gian điều trị <span style={{ color: '#ef4444' }}>*</span>
                    </label>
                    <input
                      type="text"
                      value={medication.duration}
                      onChange={(e) => updateMedication(medication.id, 'duration', e.target.value)}
                      placeholder="VD: 7 ngày, 2 tuần"
                      style={{
                        width: '100%',
                        padding: '0.5rem',
                        border: `1px solid ${getFieldError(`med_${index}_duration`) ? '#ef4444' : '#d1d5db'}`,
                        borderRadius: '0.375rem',
                        fontSize: '0.75rem'
                      }}
                      required
                    />
                    {getFieldError(`med_${index}_duration`) && renderValidationMessage(getFieldError(`med_${index}_duration`)!)}
                  </div>
                </div>

                {/* Instructions */}
                <div>
                  <label style={{
                    display: 'block',
                    fontSize: '0.75rem',
                    fontWeight: 500,
                    color: '#374151',
                    marginBottom: '0.25rem'
                  }}>
                    Hướng dẫn sử dụng
                  </label>
                  <textarea
                    value={medication.instructions}
                    onChange={(e) => updateMedication(medication.id, 'instructions', e.target.value)}
                    placeholder="VD: Uống sau ăn, không nhai, tránh ánh nắng..."
                    rows={2}
                    style={{
                      width: '100%',
                      padding: '0.5rem',
                      border: '1px solid #d1d5db',
                      borderRadius: '0.375rem',
                      fontSize: '0.75rem',
                      resize: 'vertical'
                    }}
                  />
                </div>
              </div>
            ))}

            {/* Global validation messages */}
            {validationErrors.filter(e => ['interaction', 'duplicate', 'count'].includes(e.field)).map((error, index) => (
              <div key={index}>
                {renderValidationMessage(error)}
              </div>
            ))}
          </div>

          {/* Prescription Notes */}
          <div style={{ marginBottom: '2rem' }}>
            <label style={{
              display: 'block',
              fontSize: '0.875rem',
              fontWeight: 600,
              color: '#374151',
              marginBottom: '0.5rem'
            }}>
              Ghi chú đơn thuốc
            </label>
            <textarea
              value={prescriptionNotes}
              onChange={(e) => setPrescriptionNotes(e.target.value)}
              placeholder="Ghi chú chung về đơn thuốc, chú ý đặc biệt, theo dõi tác dụng phụ..."
              rows={3}
              style={{
                width: '100%',
                padding: '0.75rem',
                border: '1px solid #d1d5db',
                borderRadius: '0.5rem',
                fontSize: '0.875rem',
                resize: 'vertical'
              }}
            />
          </div>

          {/* Validation Summary */}
          {showValidation && validationErrors.length > 0 && (
            <div style={{
              backgroundColor: '#f9fafb',
              border: '1px solid #e5e7eb',
              borderRadius: '0.5rem',
              padding: '1rem',
              marginBottom: '1.5rem'
            }}>
              <h4 style={{
                fontSize: '0.875rem',
                fontWeight: 600,
                color: '#111827',
                margin: '0 0 0.5rem 0'
              }}>
                Tóm tắt kiểm tra ({validationErrors.length} vấn đề)
              </h4>
              <div style={{
                fontSize: '0.75rem',
                color: '#6b7280'
              }}>
                • {validationErrors.filter(e => e.severity === 'error').length} lỗi nghiêm trọng
                <br />
                • {validationErrors.filter(e => e.severity === 'warning').length} cảnh báo cần lưu ý
              </div>
            </div>
          )}

          {/* Action Buttons */}
          <div style={{
            display: 'flex',
            justifyContent: 'flex-end',
            gap: '1rem'
          }}>
            <button
              type="button"
              onClick={onClose}
              style={{
                padding: '0.75rem 1.5rem',
                border: '1px solid #d1d5db',
                borderRadius: '0.5rem',
                backgroundColor: 'white',
                color: '#374151',
                fontSize: '0.875rem',
                cursor: 'pointer'
              }}
            >
              Hủy
            </button>
            <button
              type="button"
              onClick={() => {
                setValidationErrors(performMedicalValidation());
                setShowValidation(true);
              }}
              style={{
                padding: '0.75rem 1.5rem',
                border: '1px solid #d97706',
                borderRadius: '0.5rem',
                backgroundColor: '#fffbeb',
                color: '#d97706',
                fontSize: '0.875rem',
                cursor: 'pointer'
              }}
            >
              Kiểm tra
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              style={{
                padding: '0.75rem 1.5rem',
                backgroundColor: isSubmitting ? '#9ca3af' : '#10b981',
                color: 'white',
                border: 'none',
                borderRadius: '0.5rem',
                fontSize: '0.875rem',
                cursor: isSubmitting ? 'not-allowed' : 'pointer'
              }}
            >
              {isSubmitting ? 'Đang lưu...' : 'Lưu đơn thuốc'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
} 