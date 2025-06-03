"use client";

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import Link from 'next/link';
import { ArrowLeftIcon } from '@heroicons/react/24/outline';

// Mock resident data (same as in the residents page)
const initialResidents = [
  { 
    id: 1, 
    name: 'Alice Johnson', 
    firstName: 'Alice',
    lastName: 'Johnson',
    age: 78, 
    room: '101', 
    careLevel: 'Low', 
    admissionDate: '2023-02-15',
    dateOfBirth: '1945-04-15',
    gender: 'female',
    medicalConditions: ['Hypertension', 'Arthritis'],
    medications: ['Lisinopril', 'Ibuprofen'],
    allergies: ['Penicillin'],
    emergencyContact: 'Bob Johnson',
    contactPhone: '(555) 123-4567',
    personalNotes: 'Enjoys reading and gardening. Needs assistance with bathing.',
    dietaryRestrictions: 'Low sodium',
    mobilityStatus: 'Uses walker'
  },
  { 
    id: 2, 
    name: 'Robert Smith', 
    firstName: 'Robert',
    lastName: 'Smith',
    age: 82, 
    room: '102', 
    careLevel: 'Medium', 
    admissionDate: '2023-01-10',
    dateOfBirth: '1941-08-23',
    gender: 'male',
    medicalConditions: ['Diabetes', 'Heart Disease'],
    medications: ['Metformin', 'Atorvastatin'],
    allergies: ['Sulfa drugs'],
    emergencyContact: 'Susan Smith',
    contactPhone: '(555) 234-5678',
    personalNotes: 'Former professor. Enjoys chess and classical music.',
    dietaryRestrictions: 'Diabetic diet',
    mobilityStatus: 'Independent'
  },
  { 
    id: 3, 
    name: 'Mary Williams', 
    firstName: 'Mary',
    lastName: 'Williams',
    age: 85, 
    room: '103', 
    careLevel: 'High', 
    admissionDate: '2022-11-23',
    dateOfBirth: '1937-11-05',
    gender: 'female',
    medicalConditions: ['Alzheimer\'s', 'Osteoporosis'],
    medications: ['Donepezil', 'Calcium supplements'],
    allergies: ['Latex'],
    emergencyContact: 'John Williams',
    contactPhone: '(555) 345-6789',
    personalNotes: 'Needs frequent reorientation. Enjoys music therapy.',
    dietaryRestrictions: 'Soft diet',
    mobilityStatus: 'Wheelchair bound'
  },
  { 
    id: 4, 
    name: 'James Brown', 
    firstName: 'James',
    lastName: 'Brown',
    age: 76, 
    room: '104', 
    careLevel: 'Medium', 
    admissionDate: '2023-03-05',
    dateOfBirth: '1947-06-30',
    gender: 'male',
    medicalConditions: ['COPD', 'Arthritis'],
    medications: ['Albuterol', 'Acetaminophen'],
    allergies: ['Aspirin'],
    emergencyContact: 'Patricia Brown',
    contactPhone: '(555) 456-7890',
    personalNotes: 'Former carpenter. Enjoys woodworking when able.',
    dietaryRestrictions: 'None',
    mobilityStatus: 'Uses cane'
  },
  { 
    id: 5, 
    name: 'Patricia Davis', 
    firstName: 'Patricia',
    lastName: 'Davis',
    age: 81, 
    room: '105', 
    careLevel: 'Low', 
    admissionDate: '2023-04-12',
    dateOfBirth: '1942-02-18',
    gender: 'female',
    medicalConditions: ['Hypertension', 'Depression'],
    medications: ['Amlodipine', 'Sertraline'],
    allergies: ['None known'],
    emergencyContact: 'Michael Davis',
    contactPhone: '(555) 567-8901',
    personalNotes: 'Former teacher. Enjoys crafts and socializing.',
    dietaryRestrictions: 'Vegetarian',
    mobilityStatus: 'Independent'
  },
];

type ResidentFormData = {
  firstName: string;
  lastName: string;
  dateOfBirth: string;
  gender: string;
  room: string;
  careLevel: string;
  emergencyContact: string;
  contactPhone: string;
  medicalConditions: string;
  medications: string;
  allergies: string;
  dietaryRestrictions: string;
  mobilityStatus: string;
  notes: string;
};

export default function EditResidentPage({ params }: { params: { id: string } }) {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [notFound, setNotFound] = useState(false);
  const [residents, setResidents] = useState(initialResidents);
  
  const { 
    register, 
    handleSubmit, 
    formState: { errors }, 
    reset
  } = useForm<ResidentFormData>();
  
  useEffect(() => {
    // Check if there's saved residents data in localStorage
    const savedResidents = localStorage.getItem('nurseryHomeResidents');
    if (savedResidents) {
      setResidents(JSON.parse(savedResidents));
    }
    
    // Simulate API call to fetch resident data
    const fetchResident = async () => {
      try {
        // In a real application, you would fetch from an API endpoint
        const residentId = parseInt(params.id);
        // Use the residents from state or localStorage
        const foundResident = residents.find(r => r.id === residentId);
        
        if (foundResident) {
          // Format data for the form
          reset({
            firstName: foundResident.firstName,
            lastName: foundResident.lastName,
            dateOfBirth: foundResident.dateOfBirth,
            gender: foundResident.gender,
            room: foundResident.room,
            careLevel: foundResident.careLevel,
            emergencyContact: foundResident.emergencyContact,
            contactPhone: foundResident.contactPhone,
            medicalConditions: foundResident.medicalConditions.join(', '),
            medications: foundResident.medications.join(', '),
            allergies: foundResident.allergies.join(', '),
            dietaryRestrictions: foundResident.dietaryRestrictions,
            mobilityStatus: foundResident.mobilityStatus,
            notes: foundResident.personalNotes
          });
        } else {
          // Resident not found
          setNotFound(true);
        }
      } catch (error) {
        console.error('Error fetching resident:', error);
      } finally {
        setLoading(false);
      }
    };
    
    fetchResident();
  }, [params.id, reset]);
  
  const onSubmit = async (data: ResidentFormData) => {
    setIsSubmitting(true);
    
    try {
      // In a real application, you would send the data to your backend API
      const residentId = parseInt(params.id);
      
      // Update the resident in the array
      const updatedResidents = residents.map(resident => {
        if (resident.id === residentId) {
          // Update with form data
          return {
            ...resident,
            firstName: data.firstName,
            lastName: data.lastName,
            name: `${data.firstName} ${data.lastName}`,
            dateOfBirth: data.dateOfBirth,
            // Calculate age based on date of birth
            age: new Date().getFullYear() - new Date(data.dateOfBirth).getFullYear(),
            gender: data.gender,
            room: data.room,
            careLevel: data.careLevel,
            emergencyContact: data.emergencyContact,
            contactPhone: data.contactPhone,
            medicalConditions: data.medicalConditions.split(',').map(item => item.trim()),
            medications: data.medications.split(',').map(item => item.trim()),
            allergies: data.allergies.split(',').map(item => item.trim()),
            dietaryRestrictions: data.dietaryRestrictions,
            mobilityStatus: data.mobilityStatus,
            personalNotes: data.notes
          };
        }
        return resident;
      });
      
      // Update state
      setResidents(updatedResidents);
      
      // Save updated residents to localStorage
      localStorage.setItem('nurseryHomeResidents', JSON.stringify(updatedResidents));
      
      // For demo purposes, simulate a delay
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Navigate back to resident details page
      router.push(`/residents/${params.id}`);
    } catch (error) {
      console.error('Error updating resident:', error);
    } finally {
      setIsSubmitting(false);
    }
  };
  
  // Show loading state while fetching data
  if (loading) {
    return (
      <div style={{display: 'flex', justifyContent: 'center', alignItems: 'center', height: '50vh'}}>
        <p style={{fontSize: '1rem', color: '#6b7280'}}>Đang tải thông tin...</p>
      </div>
    );
  }
  
  // If resident is not found
  if (notFound) {
    return (
      <div style={{display: 'flex', justifyContent: 'center', alignItems: 'center', height: '50vh'}}>
        <p style={{fontSize: '1rem', color: '#6b7280'}}>Không tìm thấy thông tin cư dân.</p>
      </div>
    );
  }
  
  return (
    <div style={{maxWidth: '1400px', margin: '0 auto', padding: '0 1rem'}}>
      <div style={{display: 'flex', alignItems: 'center', marginBottom: '1.5rem'}}>
        <Link href={`/residents/${params.id}`} style={{color: '#6b7280', display: 'flex', marginRight: '0.75rem'}}>
          <ArrowLeftIcon style={{width: '1.25rem', height: '1.25rem'}} />
        </Link>
        <h1 style={{fontSize: '1.5rem', fontWeight: 600, margin: 0}}>Chỉnh sửa thông tin cư dân</h1>
      </div>
      
      <div style={{backgroundColor: 'white', borderRadius: '0.5rem', boxShadow: '0 1px 3px rgba(0,0,0,0.05)', padding: '1.5rem'}}>
        <form onSubmit={handleSubmit(onSubmit)} style={{display: 'flex', flexDirection: 'column', gap: '1.5rem'}}>
          {/* Personal Information Section */}
          <div>
            <h2 style={{fontSize: '1.25rem', fontWeight: 600, color: '#111827', marginBottom: '1rem'}}>
              Thông tin cá nhân
            </h2>
            <div style={{display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '1rem'}}>
              {/* First Name */}
              <div>
                <label htmlFor="firstName" style={{display: 'block', fontSize: '0.875rem', fontWeight: 500, color: '#374151', marginBottom: '0.25rem'}}>
                  Tên*
                </label>
                <input
                  id="firstName"
                  type="text"
                  style={{
                    display: 'block',
                    width: '100%',
                    borderRadius: '0.375rem',
                    border: `1px solid ${errors.firstName ? '#fca5a5' : '#d1d5db'}`,
                    boxShadow: '0 1px 2px 0 rgba(0, 0, 0, 0.05)',
                    padding: '0.5rem 0.75rem',
                    fontSize: '0.875rem',
                    outline: 'none'
                  }}
                  {...register('firstName', { required: 'Tên là bắt buộc' })}
                />
                {errors.firstName && (
                  <p style={{marginTop: '0.25rem', fontSize: '0.875rem', color: '#dc2626'}}>{errors.firstName.message}</p>
                )}
              </div>
              
              {/* Last Name */}
              <div>
                <label htmlFor="lastName" style={{display: 'block', fontSize: '0.875rem', fontWeight: 500, color: '#374151', marginBottom: '0.25rem'}}>
                  Họ*
                </label>
                <input
                  id="lastName"
                  type="text"
                  style={{
                    display: 'block',
                    width: '100%',
                    borderRadius: '0.375rem',
                    border: `1px solid ${errors.lastName ? '#fca5a5' : '#d1d5db'}`,
                    boxShadow: '0 1px 2px 0 rgba(0, 0, 0, 0.05)',
                    padding: '0.5rem 0.75rem',
                    fontSize: '0.875rem',
                    outline: 'none'
                  }}
                  {...register('lastName', { required: 'Họ là bắt buộc' })}
                />
                {errors.lastName && (
                  <p style={{marginTop: '0.25rem', fontSize: '0.875rem', color: '#dc2626'}}>{errors.lastName.message}</p>
                )}
              </div>
              
              {/* Date of Birth */}
              <div>
                <label htmlFor="dateOfBirth" style={{display: 'block', fontSize: '0.875rem', fontWeight: 500, color: '#374151', marginBottom: '0.25rem'}}>
                  Ngày sinh*
                </label>
                <input
                  id="dateOfBirth"
                  type="date"
                  style={{
                    display: 'block',
                    width: '100%',
                    borderRadius: '0.375rem',
                    border: `1px solid ${errors.dateOfBirth ? '#fca5a5' : '#d1d5db'}`,
                    boxShadow: '0 1px 2px 0 rgba(0, 0, 0, 0.05)',
                    padding: '0.5rem 0.75rem',
                    fontSize: '0.875rem',
                    outline: 'none'
                  }}
                  {...register('dateOfBirth', { required: 'Ngày sinh là bắt buộc' })}
                />
                {errors.dateOfBirth && (
                  <p style={{marginTop: '0.25rem', fontSize: '0.875rem', color: '#dc2626'}}>{errors.dateOfBirth.message}</p>
                )}
              </div>
              
              {/* Gender */}
              <div>
                <label htmlFor="gender" style={{display: 'block', fontSize: '0.875rem', fontWeight: 500, color: '#374151', marginBottom: '0.25rem'}}>
                  Giới tính*
                </label>
                <select
                  id="gender"
                  style={{
                    display: 'block',
                    width: '100%',
                    borderRadius: '0.375rem',
                    border: `1px solid ${errors.gender ? '#fca5a5' : '#d1d5db'}`,
                    boxShadow: '0 1px 2px 0 rgba(0, 0, 0, 0.05)',
                    padding: '0.5rem 0.75rem',
                    fontSize: '0.875rem',
                    outline: 'none'
                  }}
                  {...register('gender', { required: 'Giới tính là bắt buộc' })}
                >
                  <option value="">Chọn giới tính</option>
                  <option value="male">Nam</option>
                  <option value="female">Nữ</option>
                  <option value="other">Khác</option>
                </select>
                {errors.gender && (
                  <p style={{marginTop: '0.25rem', fontSize: '0.875rem', color: '#dc2626'}}>{errors.gender.message}</p>
                )}
              </div>
            </div>
          </div>
          
          {/* Residential Information Section */}
          <div>
            <h2 style={{fontSize: '1.25rem', fontWeight: 600, color: '#111827', marginBottom: '1rem'}}>
              Thông tin điều trị
            </h2>
            <div style={{display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '1rem'}}>
              {/* Room */}
              <div>
                <label htmlFor="room" style={{display: 'block', fontSize: '0.875rem', fontWeight: 500, color: '#374151', marginBottom: '0.25rem'}}>
                  Phòng*
                </label>
                <input
                  id="room"
                  type="text"
                  style={{
                    display: 'block',
                    width: '100%',
                    borderRadius: '0.375rem',
                    border: `1px solid ${errors.room ? '#fca5a5' : '#d1d5db'}`,
                    boxShadow: '0 1px 2px 0 rgba(0, 0, 0, 0.05)',
                    padding: '0.5rem 0.75rem',
                    fontSize: '0.875rem',
                    outline: 'none'
                  }}
                  {...register('room', { required: 'Phòng là bắt buộc' })}
                />
                {errors.room && (
                  <p style={{marginTop: '0.25rem', fontSize: '0.875rem', color: '#dc2626'}}>{errors.room.message}</p>
                )}
              </div>
              
              {/* Care Level */}
              <div>
                <label htmlFor="careLevel" style={{display: 'block', fontSize: '0.875rem', fontWeight: 500, color: '#374151', marginBottom: '0.25rem'}}>
                  Gói dịch vụ*
                </label>
                <select
                  id="careLevel"
                  style={{
                    display: 'block',
                    width: '100%',
                    borderRadius: '0.375rem',
                    border: `1px solid ${errors.careLevel ? '#fca5a5' : '#d1d5db'}`,
                    boxShadow: '0 1px 2px 0 rgba(0, 0, 0, 0.05)',
                    padding: '0.5rem 0.75rem',
                    fontSize: '0.875rem',
                    outline: 'none'
                  }}
                  {...register('careLevel', { required: 'Gói dịch vụ là bắt buộc' })}
                >
                  <option value="">Chọn gói dịch vụ</option>
                  <option value="Cơ bản">Cơ bản</option>
                  <option value="Nâng cao">Nâng cao</option>
                  <option value="Cao cấp">Cao cấp</option>
                </select>
                {errors.careLevel && (
                  <p style={{marginTop: '0.25rem', fontSize: '0.875rem', color: '#dc2626'}}>{errors.careLevel.message}</p>
                )}
              </div>
              
              {/* Mobility Status */}
              <div>
                <label htmlFor="mobilityStatus" style={{display: 'block', fontSize: '0.875rem', fontWeight: 500, color: '#374151', marginBottom: '0.25rem'}}>
                  Tình trạng di chuyển
                </label>
                <input
                  id="mobilityStatus"
                  type="text"
                  style={{
                    display: 'block',
                    width: '100%',
                    borderRadius: '0.375rem',
                    border: '1px solid #d1d5db',
                    boxShadow: '0 1px 2px 0 rgba(0, 0, 0, 0.05)',
                    padding: '0.5rem 0.75rem',
                    fontSize: '0.875rem',
                    outline: 'none'
                  }}
                  {...register('mobilityStatus')}
                />
              </div>
              
              {/* Dietary Restrictions */}
              <div>
                <label htmlFor="dietaryRestrictions" style={{display: 'block', fontSize: '0.875rem', fontWeight: 500, color: '#374151', marginBottom: '0.25rem'}}>
                  Chế độ ăn đặc biệt
                </label>
                <input
                  id="dietaryRestrictions"
                  type="text"
                  style={{
                    display: 'block',
                    width: '100%',
                    borderRadius: '0.375rem',
                    border: '1px solid #d1d5db',
                    boxShadow: '0 1px 2px 0 rgba(0, 0, 0, 0.05)',
                    padding: '0.5rem 0.75rem',
                    fontSize: '0.875rem',
                    outline: 'none'
                  }}
                  {...register('dietaryRestrictions')}
                />
              </div>
            </div>
          </div>
          
          {/* Contact Information Section */}
          <div>
            <h2 style={{fontSize: '1.25rem', fontWeight: 600, color: '#111827', marginBottom: '1rem'}}>
              Thông tin liên hệ khẩn cấp
            </h2>
            <div style={{display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '1rem'}}>
              {/* Emergency Contact */}
              <div>
                <label htmlFor="emergencyContact" style={{display: 'block', fontSize: '0.875rem', fontWeight: 500, color: '#374151', marginBottom: '0.25rem'}}>
                  Người liên hệ khẩn cấp*
                </label>
                <input
                  id="emergencyContact"
                  type="text"
                  style={{
                    display: 'block',
                    width: '100%',
                    borderRadius: '0.375rem',
                    border: `1px solid ${errors.emergencyContact ? '#fca5a5' : '#d1d5db'}`,
                    boxShadow: '0 1px 2px 0 rgba(0, 0, 0, 0.05)',
                    padding: '0.5rem 0.75rem',
                    fontSize: '0.875rem',
                    outline: 'none'
                  }}
                  {...register('emergencyContact', { required: 'Người liên hệ khẩn cấp là bắt buộc' })}
                />
                {errors.emergencyContact && (
                  <p style={{marginTop: '0.25rem', fontSize: '0.875rem', color: '#dc2626'}}>{errors.emergencyContact.message}</p>
                )}
              </div>
              
              {/* Contact Phone */}
              <div>
                <label htmlFor="contactPhone" style={{display: 'block', fontSize: '0.875rem', fontWeight: 500, color: '#374151', marginBottom: '0.25rem'}}>
                  Số điện thoại liên hệ*
                </label>
                <input
                  id="contactPhone"
                  type="tel"
                  style={{
                    display: 'block',
                    width: '100%',
                    borderRadius: '0.375rem',
                    border: `1px solid ${errors.contactPhone ? '#fca5a5' : '#d1d5db'}`,
                    boxShadow: '0 1px 2px 0 rgba(0, 0, 0, 0.05)',
                    padding: '0.5rem 0.75rem',
                    fontSize: '0.875rem',
                    outline: 'none'
                  }}
                  {...register('contactPhone', { required: 'Số điện thoại liên hệ là bắt buộc' })}
                />
                {errors.contactPhone && (
                  <p style={{marginTop: '0.25rem', fontSize: '0.875rem', color: '#dc2626'}}>{errors.contactPhone.message}</p>
                )}
              </div>
            </div>
          </div>
          
          {/* Medical Information Section */}
          <div>
            <h2 style={{fontSize: '1.25rem', fontWeight: 600, color: '#111827', marginBottom: '1rem'}}>
              Thông tin y tế
            </h2>
            <div style={{display: 'grid', gap: '1rem'}}>
              {/* Medical Conditions */}
              <div>
                <label htmlFor="medicalConditions" style={{display: 'block', fontSize: '0.875rem', fontWeight: 500, color: '#374151', marginBottom: '0.25rem'}}>
                  Tình trạng sức khỏe
                </label>
                <textarea
                  id="medicalConditions"
                  rows={3}
                  style={{
                    display: 'block',
                    width: '100%',
                    borderRadius: '0.375rem',
                    border: '1px solid #d1d5db',
                    boxShadow: '0 1px 2px 0 rgba(0, 0, 0, 0.05)',
                    padding: '0.5rem 0.75rem',
                    fontSize: '0.875rem',
                    outline: 'none'
                  }}
                  placeholder="Nhập các tình trạng sức khỏe, phân cách bằng dấu phẩy"
                  {...register('medicalConditions')}
                />
              </div>
              
              {/* Medications */}
              <div>
                <label htmlFor="medications" style={{display: 'block', fontSize: '0.875rem', fontWeight: 500, color: '#374151', marginBottom: '0.25rem'}}>
                  Thuốc đang sử dụng
                </label>
                <textarea
                  id="medications"
                  rows={3}
                  style={{
                    display: 'block',
                    width: '100%',
                    borderRadius: '0.375rem',
                    border: '1px solid #d1d5db',
                    boxShadow: '0 1px 2px 0 rgba(0, 0, 0, 0.05)',
                    padding: '0.5rem 0.75rem',
                    fontSize: '0.875rem',
                    outline: 'none'
                  }}
                  placeholder="Nhập thuốc đang sử dụng, phân cách bằng dấu phẩy"
                  {...register('medications')}
                />
              </div>
              
              {/* Allergies */}
              <div>
                <label htmlFor="allergies" style={{display: 'block', fontSize: '0.875rem', fontWeight: 500, color: '#374151', marginBottom: '0.25rem'}}>
                  Dị ứng
                </label>
                <input
                  id="allergies"
                  type="text"
                  style={{
                    display: 'block',
                    width: '100%',
                    borderRadius: '0.375rem',
                    border: '1px solid #d1d5db',
                    boxShadow: '0 1px 2px 0 rgba(0, 0, 0, 0.05)',
                    padding: '0.5rem 0.75rem',
                    fontSize: '0.875rem',
                    outline: 'none'
                  }}
                  placeholder="Nhập các dị ứng, phân cách bằng dấu phẩy"
                  {...register('allergies')}
                />
              </div>
            </div>
          </div>
          
          {/* Notes Section */}
          <div>
            <label htmlFor="notes" style={{display: 'block', fontSize: '0.875rem', fontWeight: 500, color: '#374151', marginBottom: '0.25rem'}}>
              Ghi chú bổ sung
            </label>
            <textarea
              id="notes"
              rows={4}
              style={{
                display: 'block',
                width: '100%',
                borderRadius: '0.375rem',
                border: '1px solid #d1d5db',
                boxShadow: '0 1px 2px 0 rgba(0, 0, 0, 0.05)',
                padding: '0.5rem 0.75rem',
                fontSize: '0.875rem',
                outline: 'none'
              }}
              {...register('notes')}
            />
          </div>
          
          {/* Form Buttons */}
          <div style={{display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', marginTop: '1rem'}}>
            <Link 
              href={`/residents/${params.id}`} 
              style={{
                padding: '0.5rem 1rem', 
                border: '1px solid #d1d5db', 
                borderRadius: '0.375rem', 
                boxShadow: '0 1px 2px 0 rgba(0, 0, 0, 0.05)', 
                fontSize: '0.875rem', 
                fontWeight: 500, 
                color: '#374151',
                textDecoration: 'none'
              }}
            >
              Huỷ
            </Link>
            <button
              type="submit"
              disabled={isSubmitting}
              style={{
                padding: '0.5rem 1rem', 
                border: '1px solid transparent', 
                borderRadius: '0.375rem', 
                boxShadow: '0 1px 2px 0 rgba(0, 0, 0, 0.05)', 
                fontSize: '0.875rem', 
                fontWeight: 500, 
                color: 'white', 
                backgroundColor: '#0284c7',
                cursor: isSubmitting ? 'not-allowed' : 'pointer',
                opacity: isSubmitting ? 0.5 : 1
              }}
            >
              {isSubmitting ? 'Đang lưu...' : 'Lưu thông tin'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
} 