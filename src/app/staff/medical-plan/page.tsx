"use client";

import { useState, useEffect } from 'react';
import { useAuth } from '@/lib/auth-context';
import { useRouter } from 'next/navigation';
import { 
  ClipboardDocumentCheckIcon, 
  MagnifyingGlassIcon,
  PlusIcon,
  UserIcon,
  CalendarDaysIcon
} from '@heroicons/react/24/outline';

interface Resident {
  id: number;
  name: string;
  room: string;
  age: number;
  careLevel: string;
  lastExam?: string;
}

export default function MedicalPlanPage() {
  const { user } = useAuth();
  const router = useRouter();
  const [residents, setResidents] = useState<Resident[]>([]);
  const [filteredResidents, setFilteredResidents] = useState<Resident[]>([]);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    if (!user || user.role !== 'staff') {
      router.push('/');
      return;
    }
    loadResidents();
  }, [user, router]);

  useEffect(() => {
    const filtered = residents.filter(resident =>
      resident.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      resident.room.toLowerCase().includes(searchTerm.toLowerCase())
    );
    setFilteredResidents(filtered);
  }, [residents, searchTerm]);

  const loadResidents = () => {
    try {
      const savedResidents = localStorage.getItem('nurseryHomeResidents');
      if (savedResidents) {
        const data = JSON.parse(savedResidents);
        const residentsWithExams = data.map((resident: any) => {
          let lastExam = 'Chưa có lịch khám';
          if (resident.medicalPlans && resident.medicalPlans.length > 0) {
            const latest = resident.medicalPlans[0];
            const examDate = new Date(latest.examinationDate);
            const daysDiff = Math.floor((new Date().getTime() - examDate.getTime()) / (1000 * 60 * 60 * 24));
            if (daysDiff === 0) lastExam = 'Hôm nay';
            else if (daysDiff === 1) lastExam = 'Hôm qua';
            else if (daysDiff > 0) lastExam = `${daysDiff} ngày trước`;
            else lastExam = `Sau ${Math.abs(daysDiff)} ngày`;
          }
          return {
            ...resident,
            lastExam
          };
        });
        setResidents(residentsWithExams);
      }
    } catch (error) {
      console.error('Error loading residents:', error);
    }
  };

  const handleCreateMedicalPlan = (resident: Resident) => {
    router.push(`/staff/medical-plan/new?residentId=${resident.id}&residentName=${encodeURIComponent(resident.name)}`);
  };

  if (!user || user.role !== 'staff') {
    return null;
  }

  return (
    <div style={{
      minHeight: '100vh',
      background: 'linear-gradient(135deg, #f8fafc 0%, #e2e8f0 100%)',
      padding: '2rem'
    }}>
      <div style={{
        maxWidth: '1200px',
        margin: '0 auto'
      }}>
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
            <div style={{
              width: '3rem',
              height: '3rem',
              background: 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)',
              borderRadius: '1rem',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}>
              <ClipboardDocumentCheckIcon style={{ width: '1.5rem', height: '1.5rem', color: 'white' }} />
            </div>
            <div>
              <h1 style={{
                fontSize: '1.875rem',
                fontWeight: 700,
                margin: 0,
                color: '#1e293b'
              }}>
                Lịch khám sức khỏe
              </h1>
              <p style={{
                fontSize: '1rem',
                color: '#64748b',
                margin: '0.25rem 0 0 0'
              }}>
                Lập kế hoạch khám và theo dõi sức khỏe định kỳ
              </p>
            </div>
          </div>

          <div style={{
            position: 'relative',
            maxWidth: '400px'
          }}>
            <MagnifyingGlassIcon style={{
              position: 'absolute',
              left: '0.75rem',
              top: '50%',
              transform: 'translateY(-50%)',
              width: '1.25rem',
              height: '1.25rem',
              color: '#6b7280'
            }} />
            <input
              type="text"
              placeholder="Tìm kiếm cư dân theo tên hoặc phòng..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              style={{
                width: '100%',
                padding: '0.75rem 0.75rem 0.75rem 2.5rem',
                border: '1px solid #d1d5db',
                borderRadius: '0.75rem',
                fontSize: '0.875rem',
                outline: 'none',
                backgroundColor: 'white'
              }}
            />
          </div>
        </div>

        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(350px, 1fr))',
          gap: '1.5rem'
        }}>
          {filteredResidents.map((resident) => (
            <div
              key={resident.id}
              style={{
                background: 'linear-gradient(135deg, #ffffff 0%, #f8fafc 100%)',
                borderRadius: '1.25rem',
                padding: '1.5rem',
                boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
                border: '1px solid rgba(255, 255, 255, 0.2)',
                transition: 'all 0.2s ease'
              }}
            >
              <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.75rem',
                marginBottom: '1rem'
              }}>
                <div style={{
                  width: '3rem',
                  height: '3rem',
                  background: 'linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)',
                  borderRadius: '0.75rem',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}>
                  <UserIcon style={{ width: '1.5rem', height: '1.5rem', color: 'white' }} />
                </div>
                <div>
                  <h3 style={{
                    fontSize: '1.125rem',
                    fontWeight: 600,
                    margin: 0,
                    color: '#1e293b'
                  }}>
                    {resident.name}
                  </h3>
                  <div style={{
                    fontSize: '0.875rem',
                    color: '#64748b',
                    display: 'flex',
                    gap: '1rem',
                    marginTop: '0.25rem'
                  }}>
                    <span>Phòng {resident.room}</span>
                    <span>{resident.age} tuổi</span>
                  </div>
                </div>
              </div>

              <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem',
                marginBottom: '1rem',
                padding: '0.75rem',
                backgroundColor: '#f8fafc',
                borderRadius: '0.5rem',
                border: '1px solid #e2e8f0'
              }}>
                <CalendarDaysIcon style={{ width: '1rem', height: '1rem', color: '#6b7280' }} />
                <span style={{
                  fontSize: '0.875rem',
                  color: '#475569'
                }}>
                  Khám gần nhất: {resident.lastExam}
                </span>
              </div>

              <button
                onClick={() => handleCreateMedicalPlan(resident)}
                style={{
                  width: '100%',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '0.5rem',
                  padding: '0.75rem 1rem',
                  background: 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)',
                  color: 'white',
                  border: 'none',
                  borderRadius: '0.5rem',
                  fontSize: '0.875rem',
                  fontWeight: 600,
                  cursor: 'pointer',
                  transition: 'all 0.2s ease'
                }}
              >
                <PlusIcon style={{ width: '1rem', height: '1rem' }} />
                Lập lịch khám mới
              </button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
} 