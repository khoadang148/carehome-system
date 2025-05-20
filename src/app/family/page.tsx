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
  ClockIcon
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
    <div style={{maxWidth: '1400px', margin: '0 auto'}}>
      <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem'}}>
        <h1 style={{fontSize: '1.5rem', fontWeight: 600, margin: 0}}>Cổng thông tin gia đình</h1>
        <button style={{
          display: 'inline-flex', 
          alignItems: 'center', 
          gap: '0.375rem',
          backgroundColor: '#0284c7', 
          color: 'white', 
          padding: '0.5rem 1rem',
          borderRadius: '0.375rem',
          border: 'none',
          fontSize: '0.875rem',
          fontWeight: 500,
          cursor: 'pointer'
        }}>
          <PhoneIcon style={{width: '1rem', height: '1rem'}} />
          Liên hệ nhân viên
        </button>
      </div>
      
      {/* Resident Overview */}
      <div style={{backgroundColor: 'white', borderRadius: '0.5rem', boxShadow: '0 1px 3px rgba(0,0,0,0.05)', padding: '1.5rem', marginBottom: '1.5rem'}}>
        <div style={{display: 'flex', flexDirection: 'column', gap: '1.5rem', alignItems: 'flex-start'}}>
          <div style={{display: 'flex', flexWrap: 'wrap', gap: '1.5rem', alignItems: 'center', width: '100%'}}>
            <div>
              <img 
                src={selectedResident.photo} 
                alt={selectedResident.name} 
                style={{
                  height: '5rem', 
                  width: '5rem', 
                  borderRadius: '9999px', 
                  objectFit: 'cover', 
                  border: '4px solid white', 
                  boxShadow: '0 1px 3px rgba(0,0,0,0.1)'
                }}
              />
            </div>
            <div>
              <h2 style={{fontSize: '1.25rem', fontWeight: 700, color: '#111827', margin: '0 0 0.25rem 0'}}>{selectedResident.name}</h2>
              <p style={{fontSize: '0.875rem', color: '#6b7280', margin: '0 0 0.5rem 0'}}>Phòng {selectedResident.room} • {selectedResident.age} tuổi</p>
              <div style={{marginTop: '0.5rem'}}>
                <span style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  padding: '0.25rem 0.75rem',
                  borderRadius: '9999px',
                  fontSize: '0.75rem',
                  fontWeight: 500,
                  backgroundColor: '#dcfce7',
                  color: '#166534'
                }}>
                  <div style={{width: '0.5rem', height: '0.5rem', backgroundColor: '#22c55e', borderRadius: '9999px', marginRight: '0.5rem'}}></div>
                  Trạng thái: {selectedResident.status}
                </span>
              </div>
              <div style={{display: 'flex', gap: '1rem', marginTop: '1rem'}}>
                <button style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '0.25rem',
                  color: '#0284c7',
                  fontSize: '0.875rem',
                  fontWeight: 500,
                  background: 'none',
                  border: 'none',
                  padding: 0,
                  cursor: 'pointer'
                }}>
                  <ChatBubbleLeftRightIcon style={{width: '1rem', height: '1rem'}} />
                  Gửi tin nhắn
                </button>
                <button style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '0.25rem',
                  color: '#0284c7',
                  fontSize: '0.875rem',
                  fontWeight: 500,
                  background: 'none',
                  border: 'none',
                  padding: 0,
                  cursor: 'pointer'
                }}>
                  <CalendarDaysIcon style={{width: '1rem', height: '1rem'}} />
                  Lịch thăm
                </button>
                <button style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '0.25rem',
                  color: '#0284c7',
                  fontSize: '0.875rem',
                  fontWeight: 500,
                  background: 'none',
                  border: 'none',
                  padding: 0,
                  cursor: 'pointer'
                }}>
                  <PhotoIcon style={{width: '1rem', height: '1rem'}} />
                  Xem ảnh
                </button>
              </div>
            </div>
            
            <div style={{marginLeft: 'auto', backgroundColor: '#f9fafb', borderRadius: '0.5rem', padding: '1rem', flexShrink: 0, maxWidth: '320px', width: '100%'}}>
              <h3 style={{fontSize: '0.875rem', fontWeight: 500, color: '#374151', margin: '0 0 0.5rem 0'}}>Cập nhật lần cuối</h3>
              <p style={{fontSize: '0.75rem', color: '#6b7280', margin: '0 0 0.75rem 0'}}>{selectedResident.vitals.lastUpdated}</p>
              <div style={{display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '0.75rem', fontSize: '0.875rem'}}>
                <div>
                  <span style={{color: '#6b7280'}}>Huyết áp:</span> 
                  <span style={{fontWeight: 500, marginLeft: '0.25rem'}}>{selectedResident.vitals.bloodPressure}</span>
                </div>
                <div>
                  <span style={{color: '#6b7280'}}>Nhịp tim:</span> 
                  <span style={{fontWeight: 500, marginLeft: '0.25rem'}}>{selectedResident.vitals.heartRate} bpm</span>
                </div>
                <div>
                  <span style={{color: '#6b7280'}}>Nhiệt độ:</span> 
                  <span style={{fontWeight: 500, marginLeft: '0.25rem'}}>{selectedResident.vitals.temperature}°C</span>
                </div>
                <div>
                  <span style={{color: '#6b7280'}}>Cân nặng:</span> 
                  <span style={{fontWeight: 500, marginLeft: '0.25rem'}}>{selectedResident.vitals.weight}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
      
      {/* Tabbed Information */}
      <div style={{backgroundColor: 'white', borderRadius: '0.5rem', boxShadow: '0 1px 3px rgba(0,0,0,0.05)', overflow: 'hidden'}}>
        <Tab.Group>
          <Tab.List style={{display: 'flex', backgroundColor: '#f9fafb', borderBottom: '1px solid #e5e7eb'}}>
            <Tab className={({ selected }) => 
              `px-4 py-3 text-sm font-medium ${
                selected 
                  ? 'border-b-2 border-primary-500 text-primary-600' 
                  : 'text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`
            }>
              Hoạt động hàng ngày
            </Tab>
            <Tab className={({ selected }) => 
              `px-4 py-3 text-sm font-medium ${
                selected 
                  ? 'border-b-2 border-primary-500 text-primary-600' 
                  : 'text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`
            }>
              Ghi chú chăm sóc
            </Tab>
            <Tab className={({ selected }) => 
              `px-4 py-3 text-sm font-medium ${
                selected 
                  ? 'border-b-2 border-primary-500 text-primary-600' 
                  : 'text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`
            }>
              Thuốc
            </Tab>
            <Tab className={({ selected }) => 
              `px-4 py-3 text-sm font-medium ${
                selected 
                  ? 'border-b-2 border-primary-500 text-primary-600' 
                  : 'text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`
            }>
              Lịch hẹn
            </Tab>
          </Tab.List>
          
          <Tab.Panel style={{padding: '1.5rem'}}>
            <div style={{display: 'flex', flexDirection: 'column', gap: '1rem'}}>
              <h3 style={{fontSize: '1.125rem', fontWeight: 500, color: '#111827', margin: 0}}>Hoạt động hôm nay</h3>
              <div style={{display: 'flex', flexDirection: 'column', gap: '0.75rem'}}>
                {selectedResident.activities.map((activity) => (
                  <div key={activity.id} style={{
                    display: 'flex', 
                    alignItems: 'center', 
                    padding: '0.75rem', 
                    border: '1px solid #e5e7eb', 
                    borderRadius: '0.375rem'
                  }}>
                    <div style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      width: '2rem',
                      height: '2rem',
                      borderRadius: '9999px',
                      backgroundColor: activity.participated ? '#dcfce7' : '#f3f4f6',
                      flexShrink: 0
                    }}>
                      {activity.participated 
                        ? <CheckCircleIcon style={{width: '1rem', height: '1rem', color: '#16a34a'}} />
                        : <ClockIcon style={{width: '1rem', height: '1rem', color: '#9ca3af'}} />
                      }
                    </div>
                    <div style={{marginLeft: '1rem', flex: 1}}>
                      <p style={{fontSize: '0.875rem', fontWeight: 500, color: '#111827', margin: 0}}>{activity.name}</p>
                      <p style={{fontSize: '0.75rem', color: '#6b7280', margin: '0.125rem 0 0 0'}}>{activity.time}</p>
                    </div>
                    <div>
                      <span style={{
                        display: 'inline-flex',
                        padding: '0.25rem 0.5rem',
                        borderRadius: '9999px',
                        fontSize: '0.75rem',
                        fontWeight: 500,
                        backgroundColor: activity.participated ? '#dcfce7' : '#f3f4f6',
                        color: activity.participated ? '#166534' : '#4b5563'
                      }}>
                        {activity.participated ? 'Đã tham gia' : 'Sắp diễn ra'}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </Tab.Panel>
          
          <Tab.Panel style={{padding: '1.5rem'}}>
            <div style={{display: 'flex', flexDirection: 'column', gap: '1rem'}}>
              <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center'}}>
                <h3 style={{fontSize: '1.125rem', fontWeight: 500, color: '#111827', margin: 0}}>Ghi chú chăm sóc gần đây</h3>
                <button style={{
                  fontSize: '0.875rem',
                  color: '#0284c7',
                  background: 'none',
                  border: 'none',
                  padding: 0,
                  cursor: 'pointer'
                }}>Xem tất cả</button>
              </div>
              <div style={{display: 'flex', flexDirection: 'column', gap: '1rem'}}>
                {selectedResident.careNotes.map((note) => (
                  <div key={note.id} style={{
                    borderLeft: '4px solid #93c5fd',
                    backgroundColor: '#f0f9ff',
                    padding: '1rem'
                  }}>
                    <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start'}}>
                      <p style={{fontSize: '0.875rem', fontWeight: 500, color: '#111827', margin: 0}}>{note.date}</p>
                      <p style={{fontSize: '0.75rem', color: '#6b7280', margin: 0}}>{note.staff}</p>
                    </div>
                    <p style={{fontSize: '0.875rem', color: '#4b5563', margin: '0.5rem 0 0 0'}}>{note.note}</p>
                  </div>
                ))}
              </div>
            </div>
          </Tab.Panel>
          
          <Tab.Panel style={{padding: '1.5rem'}}>
            <div style={{display: 'flex', flexDirection: 'column', gap: '1rem'}}>
              <h3 style={{fontSize: '1.125rem', fontWeight: 500, color: '#111827', margin: 0}}>Thuốc hiện tại</h3>
              <div style={{overflowX: 'auto'}}>
                <table style={{minWidth: '100%', borderCollapse: 'separate', borderSpacing: 0}}>
                  <thead style={{backgroundColor: '#f9fafb'}}>
                    <tr>
                      <th style={{padding: '0.75rem 1.5rem', textAlign: 'left', fontSize: '0.75rem', fontWeight: 500, color: '#6b7280', textTransform: 'uppercase', letterSpacing: '0.05em'}}>Thuốc</th>
                      <th style={{padding: '0.75rem 1.5rem', textAlign: 'left', fontSize: '0.75rem', fontWeight: 500, color: '#6b7280', textTransform: 'uppercase', letterSpacing: '0.05em'}}>Liều lượng</th>
                      <th style={{padding: '0.75rem 1.5rem', textAlign: 'left', fontSize: '0.75rem', fontWeight: 500, color: '#6b7280', textTransform: 'uppercase', letterSpacing: '0.05em'}}>Lịch trình</th>
                      <th style={{padding: '0.75rem 1.5rem', textAlign: 'left', fontSize: '0.75rem', fontWeight: 500, color: '#6b7280', textTransform: 'uppercase', letterSpacing: '0.05em'}}>Lần dùng gần nhất</th>
                    </tr>
                  </thead>
                  <tbody style={{backgroundColor: 'white'}}>
                    {selectedResident.medications.map((med) => (
                      <tr key={med.id} style={{borderBottom: '1px solid #e5e7eb'}}>
                        <td style={{padding: '1rem 1.5rem', whiteSpace: 'nowrap', fontSize: '0.875rem', fontWeight: 500, color: '#111827'}}>{med.name}</td>
                        <td style={{padding: '1rem 1.5rem', whiteSpace: 'nowrap', fontSize: '0.875rem', color: '#6b7280'}}>{med.dosage}</td>
                        <td style={{padding: '1rem 1.5rem', whiteSpace: 'nowrap', fontSize: '0.875rem', color: '#6b7280'}}>{med.schedule}</td>
                        <td style={{padding: '1rem 1.5rem', whiteSpace: 'nowrap', fontSize: '0.875rem', color: '#6b7280'}}>{med.lastAdministered}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </Tab.Panel>
          
          <Tab.Panel style={{padding: '1.5rem'}}>
            <div style={{display: 'flex', flexDirection: 'column', gap: '1rem'}}>
              <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center'}}>
                <h3 style={{fontSize: '1.125rem', fontWeight: 500, color: '#111827', margin: 0}}>Lịch hẹn</h3>
                <button style={{
                  fontSize: '0.875rem',
                  color: '#0284c7',
                  background: 'none',
                  border: 'none',
                  padding: 0,
                  cursor: 'pointer'
                }}>Yêu cầu lịch hẹn</button>
              </div>
              <div style={{display: 'flex', flexDirection: 'column', gap: '1rem'}}>
                {selectedResident.appointments.map((appointment) => (
                  <div key={appointment.id} style={{
                    display: 'flex', 
                    alignItems: 'center', 
                    padding: '0.75rem', 
                    border: '1px solid #e5e7eb', 
                    borderRadius: '0.375rem'
                  }}>
                    <div style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      width: '2rem',
                      height: '2rem',
                      borderRadius: '9999px',
                      backgroundColor: '#f3f4f6',
                      flexShrink: 0
                    }}>
                      <DocumentTextIcon style={{width: '1rem', height: '1rem', color: '#6b7280'}} />
                    </div>
                    <div style={{marginLeft: '1rem', flex: 1}}>
                      <p style={{fontSize: '0.875rem', fontWeight: 500, color: '#111827', margin: 0}}>{appointment.type}</p>
                      <p style={{fontSize: '0.75rem', color: '#6b7280', margin: '0.125rem 0 0 0'}}>với {appointment.provider}</p>
                    </div>
                    <div>
                      <span style={{
                        display: 'inline-flex',
                        padding: '0.25rem 0.5rem',
                        borderRadius: '9999px',
                        fontSize: '0.75rem',
                        fontWeight: 500,
                        backgroundColor: '#f3f4f6',
                        color: '#4b5563'
                      }}>
                        {appointment.date}
                      </span>
                    </div>
                    <div>
                      <span style={{
                        display: 'inline-flex',
                        padding: '0.25rem 0.5rem',
                        borderRadius: '9999px',
                        fontSize: '0.75rem',
                        fontWeight: 500,
                        backgroundColor: '#f3f4f6',
                        color: '#4b5563'
                      }}>
                        {appointment.time}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
              <div style={{display: 'flex', justifyContent: 'center', marginTop: '1rem'}}>
                <Link href="/family/calendar" style={{
                  fontSize: '0.875rem',
                  color: '#0284c7',
                  textDecoration: 'underline'
                }}>Xem lịch đầy đủ</Link>
              </div>
            </div>
          </Tab.Panel>
        </Tab.Group>
      </div>
    </div>
  );
} 