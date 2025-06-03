"use client";

import { useState } from 'react';
import Link from 'next/link';
import { 
  ChatBubbleLeftRightIcon, 
  CalendarDaysIcon, 
  PhotoIcon,
  DocumentTextIcon,
  PhoneIcon,
  CheckCircleIcon,
  ClockIcon,
  HeartIcon,
  UsersIcon
} from '@heroicons/react/24/outline';
import { Tab } from '@headlessui/react';

// Mock family member data
const residents = [
  { 
    id: 1, 
    name: 'Alice Johnson', 
    room: '101', 
    photo: 'https://randomuser.me/api/portraits/women/72.jpg',
    age: 78,
    status: 'Stable',
    activities: [
      { id: 1, name: 'Morning Exercise', time: '08:00 AM', participated: true },
      { id: 2, name: 'Art & Craft', time: '10:30 AM', participated: true },
      { id: 3, name: 'Music Therapy', time: '02:00 PM', participated: false }
    ],
    vitals: {
      lastUpdated: '2023-05-10 09:30 AM',
      bloodPressure: '130/85',
      heartRate: 72,
      temperature: 36.8,
      weight: '65 kg'
    },
    careNotes: [
      { id: 1, date: '2023-05-10', note: 'Participated enthusiastically in morning exercise. Ate 100% of breakfast.', staff: 'John Smith, RN' },
      { id: 2, date: '2023-05-09', note: 'Mild discomfort in right knee reported. Applied heat pad. Will monitor.', staff: 'Sarah Johnson, CNA' },
      { id: 3, date: '2023-05-08', note: 'Visited by daughter Emily. Mood noticeably improved after visit.', staff: 'David Wilson' }
    ],
    medications: [
      { id: 1, name: 'Lisinopril', dosage: '10mg', schedule: 'Once daily', lastAdministered: '2023-05-10 08:00 AM' },
      { id: 2, name: 'Simvastatin', dosage: '20mg', schedule: 'Once daily at bedtime', lastAdministered: '2023-05-09 09:00 PM' },
      { id: 3, name: 'Vitamin D', dosage: '1000 IU', schedule: 'Once daily', lastAdministered: '2023-05-10 08:00 AM' }
    ],
    appointments: [
      { id: 1, type: 'Physician Visit', date: '2023-05-15', time: '10:00 AM', provider: 'Dr. Robert Brown' },
      { id: 2, type: 'Physical Therapy', date: '2023-05-12', time: '02:30 PM', provider: 'Michael Stevens, PT' }
    ]
  }
];

export default function FamilyPortalPage() {
  const [selectedResident, setSelectedResident] = useState(residents[0]);
  
  return (
    <div style={{
      minHeight: '100vh',
      background: 'linear-gradient(135deg, #f8fafc 0%, #e2e8f0 100%)',
      position: 'relative'
    }}>
      {/* Background decorations */}
      <div style={{
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        background: `
          radial-gradient(circle at 20% 80%, rgba(16, 185, 129, 0.05) 0%, transparent 50%),
          radial-gradient(circle at 80% 20%, rgba(139, 92, 246, 0.05) 0%, transparent 50%),
          radial-gradient(circle at 40% 40%, rgba(59, 130, 246, 0.03) 0%, transparent 50%)
        `,
        pointerEvents: 'none'
      }} />
      
      <div style={{
        maxWidth: '1400px', 
        margin: '0 auto', 
        padding: '2rem 1.5rem',
        position: 'relative',
        zIndex: 1
      }}>
        {/* Header Section */}
        <div style={{
          background: 'linear-gradient(135deg, #ffffff 0%, #f8fafc 100%)',
          borderRadius: '1.5rem',
          padding: '2rem',
          marginBottom: '2rem',
          boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.1), 0 0 0 1px rgba(255, 255, 255, 0.05)',
          border: '1px solid rgba(255, 255, 255, 0.2)',
          backdropFilter: 'blur(10px)'
        }}>
          <div style={{
            display: 'flex', 
            justifyContent: 'space-between', 
            alignItems: 'center',
            flexWrap: 'wrap',
            gap: '1rem'
          }}>
            <div style={{display: 'flex', alignItems: 'center', gap: '1rem'}}>
              <div style={{
                width: '3.5rem',
                height: '3.5rem',
                background: 'linear-gradient(135deg, #8b5cf6 0%, #7c3aed 100%)',
                borderRadius: '1rem',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                boxShadow: '0 4px 12px rgba(139, 92, 246, 0.3)'
              }}>
                <UsersIcon style={{width: '2rem', height: '2rem', color: 'white'}} />
              </div>
              <div>
                <h1 style={{
                  fontSize: '2rem', 
                  fontWeight: 700, 
                  margin: 0,
                  background: 'linear-gradient(135deg, #8b5cf6 0%, #7c3aed 100%)',
                  WebkitBackgroundClip: 'text',
                  WebkitTextFillColor: 'transparent',
                  letterSpacing: '-0.025em'
                }}>
                  Cổng thông tin gia đình
                </h1>
                <p style={{
                  fontSize: '1rem',
                  color: '#64748b',
                  margin: '0.25rem 0 0 0',
                  fontWeight: 500
                }}>
                  Theo dõi và kết nối với người thân của bạn
                </p>
              </div>
            </div>
            
            <button style={{
              display: 'inline-flex', 
              alignItems: 'center', 
              gap: '0.5rem',
              background: 'linear-gradient(135deg, #ef4444 0%, #dc2626 100%)',
              color: 'white', 
              padding: '0.875rem 1.5rem',
              borderRadius: '0.75rem',
              border: 'none',
              fontSize: '0.875rem',
              fontWeight: 600,
              cursor: 'pointer',
              boxShadow: '0 4px 12px rgba(239, 68, 68, 0.3)',
              transition: 'all 0.3s ease',
              whiteSpace: 'nowrap'
            }}
            onMouseOver={(e) => {
              e.currentTarget.style.transform = 'translateY(-2px)';
              e.currentTarget.style.boxShadow = '0 8px 20px rgba(239, 68, 68, 0.4)';
            }}
            onMouseOut={(e) => {
              e.currentTarget.style.transform = 'translateY(0)';
              e.currentTarget.style.boxShadow = '0 4px 12px rgba(239, 68, 68, 0.3)';
            }}>
              <PhoneIcon style={{width: '1.125rem', height: '1.125rem'}} />
              Liên hệ nhân viên
            </button>
          </div>
        </div>
        
        {/* Resident Overview */}
        <div style={{
          background: 'linear-gradient(135deg, #ffffff 0%, #f8fafc 100%)',
          borderRadius: '1.5rem',
          boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.1)',
          border: '1px solid rgba(255, 255, 255, 0.2)',
          padding: '2rem',
          marginBottom: '2rem'
        }}>
          <div style={{display: 'flex', flexDirection: 'column', gap: '2rem', alignItems: 'flex-start'}}>
            <div style={{display: 'flex', flexWrap: 'wrap', gap: '2rem', alignItems: 'center', width: '100%'}}>
              <div>
                <img 
                  src={selectedResident.photo} 
                  alt={selectedResident.name} 
                  style={{
                    height: '6rem', 
                    width: '6rem', 
                    borderRadius: '1.5rem', 
                    objectFit: 'cover', 
                    border: '4px solid white', 
                    boxShadow: '0 8px 20px rgba(0, 0, 0, 0.15)'
                  }}
                />
              </div>
              <div style={{flex: 1}}>
                <h2 style={{
                  fontSize: '1.5rem', 
                  fontWeight: 700, 
                  color: '#111827', 
                  margin: '0 0 0.5rem 0'
                }}>
                  {selectedResident.name}
                </h2>
                <p style={{
                  fontSize: '1rem', 
                  color: '#6b7280', 
                  margin: '0 0 1rem 0',
                  fontWeight: 500
                }}>
                  Phòng {selectedResident.room} • {selectedResident.age} tuổi
                </p>
                <div style={{marginBottom: '1.5rem'}}>
                  <span style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    padding: '0.5rem 1rem',
                    borderRadius: '9999px',
                    fontSize: '0.875rem',
                    fontWeight: 600,
                    background: 'linear-gradient(135deg, #dcfce7 0%, #bbf7d0 100%)',
                    color: '#166534',
                    border: '1px solid #86efac'
                  }}>
                    <div style={{
                      width: '0.5rem', 
                      height: '0.5rem', 
                      background: 'linear-gradient(135deg, #22c55e 0%, #16a34a 100%)',
                      borderRadius: '9999px', 
                      marginRight: '0.5rem'
                    }}></div>
                    Trạng thái: {selectedResident.status}
                  </span>
                </div>
                <div style={{display: 'flex', gap: '1.5rem', flexWrap: 'wrap'}}>
                  <button style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '0.5rem',
                    background: 'linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%)',
                    color: 'white',
                    fontSize: '0.875rem',
                    fontWeight: 500,
                    padding: '0.625rem 1.25rem',
                    borderRadius: '0.75rem',
                    border: 'none',
                    cursor: 'pointer',
                    boxShadow: '0 2px 4px rgba(59, 130, 246, 0.3)',
                    transition: 'all 0.2s ease',
                    whiteSpace: 'nowrap'
                  }}
                  onMouseOver={(e) => {
                    e.currentTarget.style.transform = 'translateY(-1px)';
                    e.currentTarget.style.boxShadow = '0 4px 8px rgba(59, 130, 246, 0.4)';
                  }}
                  onMouseOut={(e) => {
                    e.currentTarget.style.transform = 'translateY(0)';
                    e.currentTarget.style.boxShadow = '0 2px 4px rgba(59, 130, 246, 0.3)';
                  }}>
                    <ChatBubbleLeftRightIcon style={{width: '1rem', height: '1rem'}} />
                    Gửi tin nhắn
                  </button>
                  <button style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '0.5rem',
                    background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
                    color: 'white',
                    fontSize: '0.875rem',
                    fontWeight: 500,
                    padding: '0.625rem 1.25rem',
                    borderRadius: '0.75rem',
                    border: 'none',
                    cursor: 'pointer',
                    boxShadow: '0 2px 4px rgba(16, 185, 129, 0.3)',
                    transition: 'all 0.2s ease',
                    whiteSpace: 'nowrap'
                  }}
                  onMouseOver={(e) => {
                    e.currentTarget.style.transform = 'translateY(-1px)';
                    e.currentTarget.style.boxShadow = '0 4px 8px rgba(16, 185, 129, 0.4)';
                  }}
                  onMouseOut={(e) => {
                    e.currentTarget.style.transform = 'translateY(0)';
                    e.currentTarget.style.boxShadow = '0 2px 4px rgba(16, 185, 129, 0.3)';
                  }}>
                    <CalendarDaysIcon style={{width: '1rem', height: '1rem'}} />
                    Lịch thăm
                  </button>
                  <button style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '0.5rem',
                    background: 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)',
                    color: 'white',
                    fontSize: '0.875rem',
                    fontWeight: 500,
                    padding: '0.625rem 1.25rem',
                    borderRadius: '0.75rem',
                    border: 'none',
                    cursor: 'pointer',
                    boxShadow: '0 2px 4px rgba(245, 158, 11, 0.3)',
                    transition: 'all 0.2s ease',
                    whiteSpace: 'nowrap'
                  }}
                  onMouseOver={(e) => {
                    e.currentTarget.style.transform = 'translateY(-1px)';
                    e.currentTarget.style.boxShadow = '0 4px 8px rgba(245, 158, 11, 0.4)';
                  }}
                  onMouseOut={(e) => {
                    e.currentTarget.style.transform = 'translateY(0)';
                    e.currentTarget.style.boxShadow = '0 2px 4px rgba(245, 158, 11, 0.3)';
                  }}>
                    <PhotoIcon style={{width: '1rem', height: '1rem'}} />
                    Xem ảnh
                  </button>
                </div>
              </div>
              
              <div style={{
                background: 'linear-gradient(135deg, #f8fafc 0%, #e2e8f0 100%)',
                borderRadius: '1rem',
                padding: '1.5rem',
                flexShrink: 0,
                maxWidth: '320px',
                width: '100%',
                boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
                border: '1px solid rgba(255, 255, 255, 0.2)'
              }}>
                <h3 style={{
                  fontSize: '0.875rem', 
                  fontWeight: 600, 
                  color: '#374151', 
                  margin: '0 0 0.5rem 0'
                }}>
                  Chỉ số sức khỏe
                </h3>
                <p style={{
                  fontSize: '0.75rem', 
                  color: '#6b7280', 
                  margin: '0 0 1rem 0'
                }}>
                  Cập nhật lần cuối: {selectedResident.vitals.lastUpdated}
                </p>
                <div style={{
                  display: 'grid', 
                  gridTemplateColumns: 'repeat(2, 1fr)', 
                  gap: '1rem', 
                  fontSize: '0.875rem'
                }}>
                  <div>
                    <span style={{color: '#6b7280', fontSize: '0.75rem', display: 'block'}}>Huyết áp</span> 
                    <span style={{fontWeight: 600, color: '#111827'}}>{selectedResident.vitals.bloodPressure}</span>
                  </div>
                  <div>
                    <span style={{color: '#6b7280', fontSize: '0.75rem', display: 'block'}}>Nhịp tim</span> 
                    <span style={{fontWeight: 600, color: '#111827'}}>{selectedResident.vitals.heartRate} bpm</span>
                  </div>
                  <div>
                    <span style={{color: '#6b7280', fontSize: '0.75rem', display: 'block'}}>Nhiệt độ</span> 
                    <span style={{fontWeight: 600, color: '#111827'}}>{selectedResident.vitals.temperature}°C</span>
                  </div>
                  <div>
                    <span style={{color: '#6b7280', fontSize: '0.75rem', display: 'block'}}>Cân nặng</span> 
                    <span style={{fontWeight: 600, color: '#111827'}}>{selectedResident.vitals.weight}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
        
        {/* Tabbed Information */}
        <div style={{
          background: 'linear-gradient(135deg, #ffffff 0%, #f8fafc 100%)',
          borderRadius: '1rem',
          boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.1)',
          border: '1px solid rgba(255, 255, 255, 0.2)',
          overflow: 'hidden'
        }}>
          <Tab.Group>
            <Tab.List style={{
              display: 'flex',
              background: 'linear-gradient(135deg, #f8fafc 0%, #e2e8f0 100%)',
              borderBottom: '1px solid rgba(255, 255, 255, 0.2)'
            }}>
              <Tab className={({ selected }) => 
                `px-6 py-4 text-sm font-medium transition-all duration-200 whitespace-nowrap ${
                  selected 
                    ? 'border-b-2 border-purple-500 text-purple-600 bg-white/50' 
                    : 'text-gray-500 hover:text-gray-700 hover:bg-white/30'
                }`
              }>
                Hoạt động hôm nay
              </Tab>
              <Tab className={({ selected }) => 
                `px-6 py-4 text-sm font-medium transition-all duration-200 whitespace-nowrap ${
                  selected 
                    ? 'border-b-2 border-purple-500 text-purple-600 bg-white/50' 
                    : 'text-gray-500 hover:text-gray-700 hover:bg-white/30'
                }`
              }>
                Ghi chú chăm sóc
              </Tab>
              <Tab className={({ selected }) => 
                `px-6 py-4 text-sm font-medium transition-all duration-200 whitespace-nowrap ${
                  selected 
                    ? 'border-b-2 border-purple-500 text-purple-600 bg-white/50' 
                    : 'text-gray-500 hover:text-gray-700 hover:bg-white/30'
                }`
              }>
                Thuốc & Điều trị
              </Tab>
              <Tab className={({ selected }) => 
                `px-6 py-4 text-sm font-medium transition-all duration-200 whitespace-nowrap ${
                  selected 
                    ? 'border-b-2 border-purple-500 text-purple-600 bg-white/50' 
                    : 'text-gray-500 hover:text-gray-700 hover:bg-white/30'
                }`
              }>
                Lịch hẹn
              </Tab>
            </Tab.List>
            <Tab.Panels>
              <Tab.Panel style={{padding: '2rem'}}>
                <h3 style={{
                  fontSize: '1.125rem',
                  fontWeight: 600,
                  color: '#111827',
                  marginBottom: '1.5rem'
                }}>
                  Hoạt động trong ngày
                </h3>
                <div style={{display: 'flex', flexDirection: 'column', gap: '1rem'}}>
                  {selectedResident.activities.map((activity) => (
                    <div
                      key={activity.id}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        padding: '1rem',
                        borderRadius: '0.75rem',
                        background: activity.participated 
                          ? 'linear-gradient(135deg, #dcfce7 0%, #bbf7d0 100%)' 
                          : 'linear-gradient(135deg, #f3f4f6 0%, #e5e7eb 100%)',
                        border: '1px solid',
                        borderColor: activity.participated ? '#86efac' : '#d1d5db'
                      }}
                    >
                      <div style={{marginRight: '1rem'}}>
                        {activity.participated ? (
                          <CheckCircleIcon style={{width: '1.5rem', height: '1.5rem', color: '#16a34a'}} />
                        ) : (
                          <ClockIcon style={{width: '1.5rem', height: '1.5rem', color: '#6b7280'}} />
                        )}
                      </div>
                      <div style={{flex: 1}}>
                        <div style={{
                          fontSize: '0.875rem',
                          fontWeight: 600,
                          color: '#111827',
                          marginBottom: '0.25rem'
                        }}>
                          {activity.name}
                        </div>
                        <div style={{fontSize: '0.75rem', color: '#6b7280'}}>
                          {activity.time}
                        </div>
                      </div>
                      <span style={{
                        fontSize: '0.75rem',
                        fontWeight: 500,
                        color: activity.participated ? '#166534' : '#6b7280'
                      }}>
                        {activity.participated ? 'Đã tham gia' : 'Chưa tham gia'}
                      </span>
                    </div>
                  ))}
                </div>
              </Tab.Panel>
              
              <Tab.Panel style={{padding: '2rem'}}>
                <h3 style={{
                  fontSize: '1.125rem',
                  fontWeight: 600,
                  color: '#111827',
                  marginBottom: '1.5rem'
                }}>
                  Ghi chú chăm sóc gần đây
                </h3>
                <div style={{display: 'flex', flexDirection: 'column', gap: '1rem'}}>
                  {selectedResident.careNotes.map((note) => (
                    <div
                      key={note.id}
                      style={{
                        padding: '1.5rem',
                        borderRadius: '0.75rem',
                        background: 'linear-gradient(135deg, #f8fafc 0%, #e2e8f0 100%)',
                        border: '1px solid rgba(255, 255, 255, 0.2)',
                        boxShadow: '0 2px 4px rgba(0, 0, 0, 0.05)'
                      }}
                    >
                      <div style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'flex-start',
                        marginBottom: '0.75rem'
                      }}>
                        <span style={{
                          fontSize: '0.75rem',
                          color: '#6b7280',
                          fontWeight: 500
                        }}>
                          {new Date(note.date).toLocaleDateString('vi-VN')}
                        </span>
                        <span style={{
                          fontSize: '0.75rem',
                          color: '#8b5cf6',
                          fontWeight: 500
                        }}>
                          {note.staff}
                        </span>
                      </div>
                      <p style={{
                        fontSize: '0.875rem',
                        color: '#374151',
                        lineHeight: '1.5',
                        margin: 0
                      }}>
                        {note.note}
                      </p>
                    </div>
                  ))}
                </div>
              </Tab.Panel>
              
              <Tab.Panel style={{padding: '2rem'}}>
                <h3 style={{
                  fontSize: '1.125rem',
                  fontWeight: 600,
                  color: '#111827',
                  marginBottom: '1.5rem'
                }}>
                  Thuốc hiện tại
                </h3>
                <div style={{display: 'grid', gap: '1rem'}}>
                  {selectedResident.medications.map((medication) => (
                    <div
                      key={medication.id}
                      style={{
                        padding: '1.5rem',
                        borderRadius: '0.75rem',
                        background: 'linear-gradient(135deg, #fef3c7 0%, #fde68a 100%)',
                        border: '1px solid #fbbf24',
                        boxShadow: '0 2px 4px rgba(245, 158, 11, 0.1)'
                      }}
                    >
                      <div style={{
                        display: 'grid',
                        gridTemplateColumns: '2fr 1fr 1fr',
                        gap: '1rem',
                        alignItems: 'center'
                      }}>
                        <div>
                          <div style={{
                            fontSize: '0.875rem',
                            fontWeight: 600,
                            color: '#111827',
                            marginBottom: '0.25rem'
                          }}>
                            {medication.name}
                          </div>
                          <div style={{fontSize: '0.75rem', color: '#92400e'}}>
                            {medication.dosage} - {medication.schedule}
                          </div>
                        </div>
                        <div>
                          <span style={{fontSize: '0.75rem', color: '#6b7280', display: 'block'}}>
                            Uống lần cuối
                          </span>
                          <span style={{fontSize: '0.875rem', fontWeight: 500, color: '#92400e'}}>
                            {medication.lastAdministered}
                          </span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </Tab.Panel>
              
              <Tab.Panel style={{padding: '2rem'}}>
                <h3 style={{
                  fontSize: '1.125rem',
                  fontWeight: 600,
                  color: '#111827',
                  marginBottom: '1.5rem'
                }}>
                  Lịch hẹn sắp tới
                </h3>
                <div style={{display: 'flex', flexDirection: 'column', gap: '1rem'}}>
                  {selectedResident.appointments.map((appointment) => (
                    <div
                      key={appointment.id}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        padding: '1.5rem',
                        borderRadius: '0.75rem',
                        background: 'linear-gradient(135deg, #dbeafe 0%, #bfdbfe 100%)',
                        border: '1px solid #93c5fd'
                      }}
                    >
                      <div style={{marginRight: '1.5rem'}}>
                        <CalendarDaysIcon style={{width: '2rem', height: '2rem', color: '#1d4ed8'}} />
                      </div>
                      <div style={{flex: 1}}>
                        <div style={{
                          fontSize: '0.875rem',
                          fontWeight: 600,
                          color: '#111827',
                          marginBottom: '0.25rem'
                        }}>
                          {appointment.type}
                        </div>
                        <div style={{fontSize: '0.75rem', color: '#1e40af', marginBottom: '0.25rem'}}>
                          {appointment.provider}
                        </div>
                        <div style={{fontSize: '0.75rem', color: '#6b7280'}}>
                          {new Date(appointment.date).toLocaleDateString('vi-VN')} lúc {appointment.time}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </Tab.Panel>
            </Tab.Panels>
          </Tab.Group>
        </div>
      </div>
    </div>
  );
} 