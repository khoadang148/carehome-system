"use client";

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeftIcon, PencilIcon } from '@heroicons/react/24/outline';

// Mock resident data (same as in the residents page)
const initialResidents = [
  { 
    id: 1, 
    name: 'Alice Johnson', 
    age: 78, 
    room: '101', 
    careLevel: 'Low', 
    admissionDate: '2023-02-15',
    medicalConditions: ['Hypertension', 'Arthritis'],
    medications: ['Lisinopril', 'Ibuprofen'],
    allergies: ['Penicillin'],
    emergencyContact: 'Bob Johnson',
    contactPhone: '(555) 123-4567',
    personalNotes: 'Enjoys reading and gardening. Needs assistance with bathing.',
    dietaryRestrictions: 'Low sodium',
    mobilityStatus: 'Uses walker',
    carePackage: {
      id: 2,
      name: 'Gói Nâng Cao',
      price: 25000000,
      purchaseDate: '2024-03-15',
      features: [
        'Tất cả dịch vụ của gói Cơ Bản',
        'Chăm sóc y tế chuyên sâu',
        'Vật lý trị liệu định kỳ',
        'Hoạt động giải trí đa dạng',
        'Chế độ dinh dưỡng cá nhân hóa'
      ]
    }
  },
  { 
    id: 2, 
    name: 'Robert Smith', 
    age: 82, 
    room: '102', 
    careLevel: 'Medium', 
    admissionDate: '2023-01-10',
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
    age: 85, 
    room: '103', 
    careLevel: 'High', 
    admissionDate: '2022-11-23',
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
    age: 76, 
    room: '104', 
    careLevel: 'Medium', 
    admissionDate: '2023-03-05',
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
    age: 81, 
    room: '105', 
    careLevel: 'Low', 
    admissionDate: '2023-04-12',
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

export default function ResidentDetailPage({ params }: { params: { id: string } }) {
  const router = useRouter();
  const [resident, setResident] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  
  useEffect(() => {
    // Simulate API call to fetch resident data
    const fetchResident = async () => {
      try {
        // In a real application, you would fetch from an API endpoint
        const residentId = parseInt(params.id);
        
        // Check if there's saved residents data in localStorage
        let residents = initialResidents;
        const savedResidents = localStorage.getItem('nurseryHomeResidents');
        if (savedResidents) {
          residents = JSON.parse(savedResidents);
        }
        
        const foundResident = residents.find(r => r.id === residentId);
        
        if (foundResident) {
          setResident(foundResident);
        } else {
          // Resident not found, redirect to list
          router.push('/residents');
        }
      } catch (error) {
        console.error('Error fetching resident:', error);
      } finally {
        setLoading(false);
      }
    };
    
    fetchResident();
  }, [params.id, router]);
  
  const handleEditClick = () => {
    router.push(`/residents/${params.id}/edit`);
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
  if (!resident) {
    return (
      <div style={{display: 'flex', justifyContent: 'center', alignItems: 'center', height: '50vh'}}>
        <p style={{fontSize: '1rem', color: '#6b7280'}}>Không tìm thấy thông tin cư dân.</p>
      </div>
    );
  }
  
  // Helper function to render care level with appropriate color
  const renderCareLevel = (level: string) => {
    const bgColor = 
      level === 'Low' ? '#dcfce7' : 
      level === 'Medium' ? '#fef9c3' : '#fee2e2';
      
    const textColor = 
      level === 'Low' ? '#166534' : 
      level === 'Medium' ? '#854d0e' : '#b91c1c';
      
    return (
      <span style={{
        display: 'inline-flex', 
        padding: '0.25rem 0.75rem', 
        fontSize: '0.75rem', 
        fontWeight: 500, 
        borderRadius: '9999px',
        backgroundColor: bgColor,
        color: textColor
      }}>
        {level}
      </span>
    );
  };
  
  return (
    <div style={{maxWidth: '1400px', margin: '0 auto', padding: '0 1rem'}}>
      <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem'}}>
        <div style={{display: 'flex', alignItems: 'center', gap: '0.5rem'}}>
          <Link href="/residents" style={{color: '#6b7280', display: 'flex'}}>
            <ArrowLeftIcon style={{width: '1.25rem', height: '1.25rem'}} />
          </Link>
          <h1 style={{fontSize: '1.5rem', fontWeight: 600, margin: 0}}>Chi tiết cư dân</h1>
        </div>
        
        <button
          onClick={handleEditClick}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem',
            padding: '0.5rem 1rem',
            backgroundColor: '#16a34a',
            color: 'white',
            borderRadius: '0.375rem',
            border: 'none',
            fontSize: '0.875rem',
            fontWeight: 500,
            cursor: 'pointer'
          }}
        >
          <PencilIcon style={{width: '1rem', height: '1rem'}} />
          Chỉnh sửa thông tin
        </button>
      </div>
      
      <div style={{backgroundColor: 'white', borderRadius: '0.5rem', boxShadow: '0 1px 3px rgba(0,0,0,0.05)', overflow: 'hidden'}}>
        {/* Header with basic info */}
        <div style={{backgroundColor: '#f9fafb', padding: '1.5rem', borderBottom: '1px solid #e5e7eb'}}>
          <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start'}}>
            <div>
              <h2 style={{fontSize: '1.5rem', fontWeight: 600, color: '#111827', margin: 0}}>{resident.name}</h2>
              <p style={{fontSize: '1rem', color: '#6b7280', marginTop: '0.25rem', marginBottom: '0.5rem'}}>
                {resident.age} tuổi | Phòng: {resident.room}
              </p>
              <div style={{marginTop: '0.5rem'}}>
                <span style={{fontSize: '0.875rem', color: '#6b7280', marginRight: '0.5rem'}}>Mức độ chăm sóc:</span>
                {renderCareLevel(resident.careLevel)}
              </div>
            </div>
            
            <div>
              <p style={{fontSize: '0.875rem', color: '#6b7280', margin: 0}}>
                <span style={{fontWeight: 500}}>Ngày tiếp nhận:</span>{' '}
                {new Date(resident.admissionDate).toLocaleDateString()}
              </p>
            </div>
          </div>
        </div>
        
        {/* Main content */}
        <div style={{padding: '1.5rem'}}>
          <div style={{display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '1.5rem'}}>
            {/* Medical Information */}
            <div style={{borderRadius: '0.5rem', border: '1px solid #e5e7eb', padding: '1.5rem'}}>
              <h3 style={{fontSize: '1.125rem', fontWeight: 600, color: '#111827', marginTop: 0, marginBottom: '1rem'}}>
                Thông tin y tế
              </h3>
              
              <div style={{marginBottom: '1rem'}}>
                <h4 style={{fontSize: '0.875rem', fontWeight: 500, color: '#4b5563', marginBottom: '0.5rem'}}>
                  Tình trạng sức khỏe
                </h4>
                <ul style={{margin: 0, paddingLeft: '1.25rem'}}>
                  {resident.medicalConditions.map((condition: string, index: number) => (
                    <li key={index} style={{fontSize: '0.875rem', color: '#6b7280'}}>{condition}</li>
                  ))}
                </ul>
              </div>
              
              <div style={{marginBottom: '1rem'}}>
                <h4 style={{fontSize: '0.875rem', fontWeight: 500, color: '#4b5563', marginBottom: '0.5rem'}}>
                  Thuốc đang sử dụng
                </h4>
                <ul style={{margin: 0, paddingLeft: '1.25rem'}}>
                  {resident.medications.map((medication: string, index: number) => (
                    <li key={index} style={{fontSize: '0.875rem', color: '#6b7280'}}>{medication}</li>
                  ))}
                </ul>
              </div>
              
              <div>
                <h4 style={{fontSize: '0.875rem', fontWeight: 500, color: '#4b5563', marginBottom: '0.5rem'}}>
                  Dị ứng
                </h4>
                <p style={{fontSize: '0.875rem', color: '#6b7280', margin: 0}}>
                  {resident.allergies.length > 0 ? resident.allergies.join(', ') : 'Không có'}
                </p>
              </div>
            </div>
            
            {/* Personal Information */}
            <div style={{borderRadius: '0.5rem', border: '1px solid #e5e7eb', padding: '1.5rem'}}>
              <h3 style={{fontSize: '1.125rem', fontWeight: 600, color: '#111827', marginTop: 0, marginBottom: '1rem'}}>
                Thông tin cá nhân
              </h3>
              
              <div style={{display: 'grid', gap: '1rem'}}>
                <div>
                  <h4 style={{fontSize: '0.875rem', fontWeight: 500, color: '#4b5563', marginBottom: '0.25rem'}}>
                    Người liên hệ khẩn cấp
                  </h4>
                  <p style={{fontSize: '0.875rem', color: '#6b7280', margin: 0}}>{resident.emergencyContact}</p>
                </div>
                
                <div>
                  <h4 style={{fontSize: '0.875rem', fontWeight: 500, color: '#4b5563', marginBottom: '0.25rem'}}>
                    Số điện thoại liên hệ
                  </h4>
                  <p style={{fontSize: '0.875rem', color: '#6b7280', margin: 0}}>{resident.contactPhone}</p>
                </div>
                
                <div>
                  <h4 style={{fontSize: '0.875rem', fontWeight: 500, color: '#4b5563', marginBottom: '0.25rem'}}>
                    Tình trạng di chuyển
                  </h4>
                  <p style={{fontSize: '0.875rem', color: '#6b7280', margin: 0}}>{resident.mobilityStatus}</p>
                </div>
                
                <div>
                  <h4 style={{fontSize: '0.875rem', fontWeight: 500, color: '#4b5563', marginBottom: '0.25rem'}}>
                    Chế độ ăn đặc biệt
                  </h4>
                  <p style={{fontSize: '0.875rem', color: '#6b7280', margin: 0}}>
                    {resident.dietaryRestrictions || 'Không có'}
                  </p>
                </div>
              </div>
            </div>

            {/* Care Package Information */}
            {resident.carePackage ? (
              <div style={{borderRadius: '0.5rem', border: '1px solid #e5e7eb', padding: '1.5rem'}}>
                <h3 style={{fontSize: '1.125rem', fontWeight: 600, color: '#111827', marginTop: 0, marginBottom: '1rem'}}>
                  Gói Dịch Vụ Đang Sử Dụng
                </h3>
                
                <div style={{display: 'grid', gap: '1rem'}}>
                  <div>
                    <h4 style={{fontSize: '0.875rem', fontWeight: 500, color: '#4b5563', marginBottom: '0.25rem'}}>
                      Tên gói
                    </h4>
                    <p style={{fontSize: '0.875rem', color: '#6b7280', margin: 0}}>{resident.carePackage.name}</p>
                  </div>
                  
                  <div>
                    <h4 style={{fontSize: '0.875rem', fontWeight: 500, color: '#4b5563', marginBottom: '0.25rem'}}>
                      Giá gói
                    </h4>
                    <p style={{fontSize: '0.875rem', color: '#6b7280', margin: 0}}>
                      {new Intl.NumberFormat('vi-VN', {
                        style: 'currency',
                        currency: 'VND'
                      }).format(resident.carePackage.price)}/tháng
                    </p>
                  </div>
                  
                  <div>
                    <h4 style={{fontSize: '0.875rem', fontWeight: 500, color: '#4b5563', marginBottom: '0.25rem'}}>
                      Ngày đăng ký
                    </h4>
                    <p style={{fontSize: '0.875rem', color: '#6b7280', margin: 0}}>
                      {new Date(resident.carePackage.purchaseDate).toLocaleDateString('vi-VN')}
                    </p>
                  </div>
                  
                  <div>
                    <h4 style={{fontSize: '0.875rem', fontWeight: 500, color: '#4b5563', marginBottom: '0.25rem'}}>
                      Dịch vụ bao gồm
                    </h4>
                    <ul style={{margin: 0, paddingLeft: '1.25rem'}}>
                      {resident.carePackage.features.map((feature: string, index: number) => (
                        <li key={index} style={{fontSize: '0.875rem', color: '#6b7280'}}>{feature}</li>
                      ))}
                    </ul>
                  </div>
                </div>
              </div>
            ) : (
              <div style={{borderRadius: '0.5rem', border: '1px solid #e5e7eb', padding: '1.5rem'}}>
                <h3 style={{fontSize: '1.125rem', fontWeight: 600, color: '#111827', marginTop: 0, marginBottom: '1rem'}}>
                  Gói Dịch Vụ
                </h3>
                <p style={{fontSize: '0.875rem', color: '#6b7280', marginBottom: '1rem'}}>
                  Chưa đăng ký gói dịch vụ nào
                </p>
                <Link
                  href="/services"
                  style={{
                    display: 'inline-block',
                    padding: '0.5rem 1rem',
                    backgroundColor: '#2563eb',
                    color: 'white',
                    borderRadius: '0.375rem',
                    fontSize: '0.875rem',
                    fontWeight: 500,
                    textDecoration: 'none'
                  }}
                >
                  Xem các gói dịch vụ
                </Link>
              </div>
            )}
          </div>
          
          {/* Notes Section */}
          <div style={{marginTop: '1.5rem', borderRadius: '0.5rem', border: '1px solid #e5e7eb', padding: '1.5rem'}}>
            <h3 style={{fontSize: '1.125rem', fontWeight: 600, color: '#111827', marginTop: 0, marginBottom: '1rem'}}>
              Ghi chú
            </h3>
            <p style={{fontSize: '0.875rem', color: '#6b7280', margin: 0}}>{resident.personalNotes}</p>
          </div>
        </div>
      </div>
    </div>
  );
} 