"use client";

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { ArrowLeftIcon, PencilIcon, CalendarIcon } from '@heroicons/react/24/outline';

type ShiftType = 'morning' | 'afternoon' | 'night';

type ScheduleEntry = {
  id: string;
  staffId: number;
  date: string;
  shift: ShiftType;
  notes?: string;
};

// Mock staff data (same as in the staff pages)
const initialStaffMembers = [
  { 
    id: 1, 
    name: 'John Smith', 
    firstName: 'John',
    lastName: 'Smith',
    position: 'Y tá', 
    department: 'Y tế', 
    shiftType: 'Sáng', 
    hireDate: '2022-03-15',
    dateOfBirth: '1985-06-12',
    gender: 'male',
    email: 'john.smith@example.com',
    certification: 'RN, BSN',
    contactPhone: '555-123-4567',
    address: '123 Maple Street, Anytown',
    emergencyContact: 'Mary Smith',
    emergencyPhone: '555-987-6543',
    notes: 'Chuyên môn về chăm sóc người cao tuổi. Kinh nghiệm 10 năm trong lĩnh vực y tế.'
  },
  { 
    id: 2, 
    name: 'Sarah Johnson', 
    firstName: 'Sarah',
    lastName: 'Johnson',
    position: 'Người chăm sóc', 
    department: 'Chăm sóc người cao tuổi', 
    shiftType: 'Chiều', 
    hireDate: '2022-05-20',
    dateOfBirth: '1990-04-23',
    gender: 'female',
    email: 'sarah.j@example.com',
    certification: 'CNA',
    contactPhone: '555-234-5678',
    address: '456 Oak Avenue, Hometown',
    emergencyContact: 'Robert Johnson',
    emergencyPhone: '555-876-5432',
    notes: 'Tốt nghiệp xuất sắc ngành điều dưỡng. Khả năng giao tiếp tốt với người cao tuổi.'
  },
  { 
    id: 3, 
    name: 'Michael Brown', 
    firstName: 'Michael',
    lastName: 'Brown',
    position: 'Chuyên viên vật lý trị liệu', 
    department: 'Phục hồi chức năng', 
    shiftType: 'Ngày', 
    hireDate: '2021-11-10',
    dateOfBirth: '1988-10-05',
    gender: 'male',
    email: 'mb@example.com',
    certification: 'DPT',
    contactPhone: '555-345-6789',
    address: '789 Pine Road, Cityville',
    emergencyContact: 'Jessica Brown',
    emergencyPhone: '555-765-4321',
    notes: 'Chuyên về phục hồi chức năng cho bệnh nhân sau đột quỵ. Tham gia nhiều khóa đào tạo đặc biệt.'
  },
  { 
    id: 4, 
    name: 'Emily Davis', 
    firstName: 'Emily',
    lastName: 'Davis',
    position: 'Trợ lý y tá', 
    department: 'Chăm sóc người cao tuổi', 
    shiftType: 'Đêm', 
    hireDate: '2023-01-05',
    dateOfBirth: '1992-12-18',
    gender: 'female',
    email: 'emily.d@example.com',
    certification: 'CNA',
    contactPhone: '555-456-7890',
    address: '321 Cedar Lane, Townsville',
    emergencyContact: 'Mark Davis',
    emergencyPhone: '555-654-3210',
    notes: 'Có kinh nghiệm chăm sóc ban đêm. Đặc biệt giỏi trong việc giúp người cao tuổi có giấc ngủ ngon.'
  },
  { 
    id: 5, 
    name: 'David Wilson', 
    firstName: 'David',
    lastName: 'Wilson',
    position: 'Điều phối viên hoạt động', 
    department: 'Hoạt động', 
    shiftType: 'Ngày', 
    hireDate: '2022-08-22',
    dateOfBirth: '1987-03-30',
    gender: 'male',
    email: 'dwilson@example.com',
    certification: 'Liệu pháp giải trí',
    contactPhone: '555-567-8901',
    address: '654 Birch Street, Villagetown',
    emergencyContact: 'Linda Wilson',
    emergencyPhone: '555-543-2109',
    notes: 'Rất sáng tạo trong việc phát triển các hoạt động giải trí cho người cao tuổi. Đặc biệt giỏi về âm nhạc và nghệ thuật.'
  },
];

// Mock schedule data
const initialScheduleData: ScheduleEntry[] = [
  { id: '1', staffId: 1, date: '2023-06-17', shift: 'morning', notes: 'Chăm sóc đặc biệt cho người cao tuổi A' },
  { id: '2', staffId: 1, date: '2023-06-18', shift: 'night', notes: 'Trực đêm thay cho nhân viên nghỉ ốm' },
  { id: '3', staffId: 1, date: '2023-06-20', shift: 'afternoon', notes: 'Hỗ trợ hoạt động nhóm' },
  { id: '4', staffId: 2, date: '2023-06-17', shift: 'afternoon' },
  { id: '5', staffId: 2, date: '2023-06-19', shift: 'morning' },
  { id: '6', staffId: 2, date: '2023-06-20', shift: 'night' },
  { id: '7', staffId: 3, date: '2023-06-17', shift: 'night' },
  { id: '8', staffId: 3, date: '2023-06-19', shift: 'afternoon' },
  { id: '9', staffId: 4, date: '2023-06-18', shift: 'morning' },
  { id: '10', staffId: 4, date: '2023-06-19', shift: 'night' },
  { id: '11', staffId: 5, date: '2023-06-18', shift: 'afternoon' },
  { id: '12', staffId: 5, date: '2023-06-20', shift: 'morning' },
];

const DAYS_OF_WEEK = ['Thứ 2', 'Thứ 3', 'Thứ 4', 'Thứ 5', 'Thứ 6', 'Thứ 7', 'Chủ nhật'];

export default function StaffSchedulePage({ params }: { params: Promise<{ id: string }> }) {
  const router = useRouter();
  const [currentWeekStart, setCurrentWeekStart] = useState<Date>(getMonday(new Date()));
  const [staff, setStaff] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [scheduleData, setScheduleData] = useState<ScheduleEntry[]>(initialScheduleData);
  const [showAddModal, setShowAddModal] = useState(false);
  const [selectedDate, setSelectedDate] = useState<string>('');
  const [selectedShift, setSelectedShift] = useState<ShiftType>('morning');
  const [notes, setNotes] = useState<string>('');
  const [resolvedParams, setResolvedParams] = useState<{ id: string } | null>(null);
  
  // Generate dates for the current week
  const weekDates = Array.from({ length: 7 }, (_, i) => {
    const date = new Date(currentWeekStart);
    date.setDate(currentWeekStart.getDate() + i);
    return date;
  });
  
  useEffect(() => {
    // Resolve params Promise
    const resolveParams = async () => {
      const resolved = await params;
      setResolvedParams(resolved);
    };
    resolveParams();
  }, [params]);
  
  useEffect(() => {
    if (!resolvedParams) return;
    
    // Attempt to load staff member data
    const loadStaff = async () => {
      try {
        const staffId = parseInt(resolvedParams.id);
        
        // Check if there's saved staff data in localStorage
        let staffMembers = initialStaffMembers;
        const savedStaff = localStorage.getItem('nurseryHomeStaff');
        if (savedStaff) {
          staffMembers = JSON.parse(savedStaff);
        }
        
        const foundStaff = staffMembers.find(s => s.id === staffId);
        
        if (foundStaff) {
          setStaff(foundStaff);
        } else {
          // Staff not found, redirect to list
          router.push('/staff');
        }

        // Load schedule data
        const savedSchedule = localStorage.getItem('staffScheduleData');
        if (savedSchedule) {
          setScheduleData(JSON.parse(savedSchedule));
        }
      } catch (error) {
        console.error('Error loading staff data:', error);
      } finally {
        setLoading(false);
      }
    };
    
    loadStaff();
  }, [resolvedParams, router]);
  
  function getMonday(date: Date): Date {
    const day = date.getDay();
    const diff = date.getDate() - day + (day === 0 ? -6 : 1); // adjust when day is Sunday
    const monday = new Date(date);
    monday.setDate(diff);
    return monday;
  }
  
  function formatDate(date: Date): string {
    return date.toISOString().split('T')[0];
  }
  
  function formatDisplayDate(date: Date): string {
    return `${date.getDate()}/${date.getMonth() + 1}`;
  }
  
  function previousWeek() {
    const newDate = new Date(currentWeekStart);
    newDate.setDate(currentWeekStart.getDate() - 7);
    setCurrentWeekStart(newDate);
  }
  
  function nextWeek() {
    const newDate = new Date(currentWeekStart);
    newDate.setDate(currentWeekStart.getDate() + 7);
    setCurrentWeekStart(newDate);
  }
  
  function getShiftInfo(date: string, shift: ShiftType): ScheduleEntry | undefined {
    if (!staff) return undefined;
    
    return scheduleData.find(entry => 
      entry.staffId === staff.id && 
      entry.date === date && 
      entry.shift === shift
    );
  }
  
  function handleAddShift(date: string, shift: ShiftType) {
    setSelectedDate(date);
    setSelectedShift(shift);
    setNotes('');
    
    // Check if this shift already exists
    const existingShift = getShiftInfo(date, shift);
    if (existingShift) {
      setNotes(existingShift.notes || '');
    }
    
    setShowAddModal(true);
  }
  
  function handleSaveShift() {
    if (!staff) return;
    
    const existingShiftIndex = scheduleData.findIndex(entry => 
      entry.staffId === staff.id && 
      entry.date === selectedDate && 
      entry.shift === selectedShift
    );
    
    let updatedScheduleData;
    
    if (existingShiftIndex >= 0) {
      // Update existing shift
      updatedScheduleData = [...scheduleData];
      updatedScheduleData[existingShiftIndex] = {
        ...updatedScheduleData[existingShiftIndex],
        notes: notes
      };
    } else {
      // Add new shift
      const newShift: ScheduleEntry = {
        id: `${staff.id}-${selectedDate}-${selectedShift}-${Date.now()}`,
        staffId: staff.id,
        date: selectedDate,
        shift: selectedShift,
        notes: notes
      };
      updatedScheduleData = [...scheduleData, newShift];
    }
    
    setScheduleData(updatedScheduleData);
    
    // Save to localStorage
    localStorage.setItem('staffScheduleData', JSON.stringify(updatedScheduleData));
    
    setShowAddModal(false);
  }
  
  function handleDeleteShift() {
    if (!staff) return;
    
    const updatedScheduleData = scheduleData.filter(entry => 
      !(entry.staffId === staff.id && 
        entry.date === selectedDate && 
        entry.shift === selectedShift)
    );
    
    setScheduleData(updatedScheduleData);
    
    // Save to localStorage
    localStorage.setItem('staffScheduleData', JSON.stringify(updatedScheduleData));
    
    setShowAddModal(false);
  }
  
  // Show loading state while fetching data
  if (loading || !resolvedParams) {
    return (
      <div style={{display: 'flex', justifyContent: 'center', alignItems: 'center', height: '50vh'}}>
        <p style={{fontSize: '1rem', color: '#6b7280'}}>Đang tải thông tin...</p>
      </div>
    );
  }
  
  // If staff is not found
  if (!staff) {
    return (
      <div style={{display: 'flex', justifyContent: 'center', alignItems: 'center', height: '50vh'}}>
        <p style={{fontSize: '1rem', color: '#6b7280'}}>Không tìm thấy thông tin nhân viên.</p>
      </div>
    );
  }
  
  return (
    <div style={{maxWidth: '1400px', margin: '0 auto', padding: '0 1rem'}}>
      <div style={{display: 'flex', alignItems: 'center', marginBottom: '1.5rem'}}>
        <Link href={`/staff/${resolvedParams.id}`} style={{color: '#6b7280', display: 'flex', marginRight: '0.75rem'}}>
          <ArrowLeftIcon style={{width: '1.25rem', height: '1.25rem'}} />
        </Link>
        <h1 style={{fontSize: '1.5rem', fontWeight: 600, margin: 0}}>
          Lịch làm việc: {staff.name}
        </h1>
      </div>
      
      <div style={{backgroundColor: 'white', borderRadius: '0.5rem', boxShadow: '0 1px 3px rgba(0,0,0,0.05)', padding: '1.5rem', marginBottom: '1.5rem'}}>
        <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem'}}>
          <div style={{display: 'flex', alignItems: 'center', gap: '1rem'}}>
            <button 
              onClick={previousWeek}
              style={{
                padding: '0.5rem', 
                border: '1px solid #d1d5db', 
                borderRadius: '0.375rem', 
                backgroundColor: 'white',
                cursor: 'pointer'
              }}
            >
              &lt;
            </button>
            <span style={{fontWeight: 500}}>
              Tuần {currentWeekStart.getDate()}/{currentWeekStart.getMonth() + 1} - {
                new Date(currentWeekStart.getTime() + 6 * 24 * 60 * 60 * 1000).getDate()
              }/{
                new Date(currentWeekStart.getTime() + 6 * 24 * 60 * 60 * 1000).getMonth() + 1
              }
            </span>
            <button 
              onClick={nextWeek}
              style={{
                padding: '0.5rem', 
                border: '1px solid #d1d5db', 
                borderRadius: '0.375rem', 
                backgroundColor: 'white',
                cursor: 'pointer'
              }}
            >
              &gt;
            </button>
          </div>
          
          <div style={{fontSize: '0.875rem', color: '#6b7280'}}>
            {staff.position} | {staff.department}
          </div>
        </div>
        
        <div style={{overflowX: 'auto'}}>
          <table style={{width: '100%', borderCollapse: 'collapse'}}>
            <thead>
              <tr>
                <th style={{width: '10%', padding: '0.75rem', borderBottom: '1px solid #e5e7eb', textAlign: 'left'}}>Ca</th>
                {weekDates.map((date, index) => (
                  <th key={index} style={{padding: '0.75rem', borderBottom: '1px solid #e5e7eb', textAlign: 'center', width: '12.85%'}}>
                    <div style={{fontWeight: 600}}>{DAYS_OF_WEEK[index]}</div>
                    <div style={{fontWeight: 'normal', fontSize: '0.875rem'}}>{formatDisplayDate(date)}</div>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {/* Morning Shift */}
              <tr>
                <td style={{padding: '0.75rem', borderBottom: '1px solid #e5e7eb', fontWeight: 500}}>
                  Sáng
                </td>
                {weekDates.map((date, index) => {
                  const formattedDate = formatDate(date);
                  const shiftInfo = getShiftInfo(formattedDate, 'morning');
                  
                  return (
                    <td 
                      key={index} 
                      style={{
                        padding: '0.5rem', 
                        borderBottom: '1px solid #e5e7eb', 
                        backgroundColor: shiftInfo ? '#dcfce7' : 'transparent',
                        textAlign: 'center',
                        cursor: 'pointer'
                      }}
                      onClick={() => handleAddShift(formattedDate, 'morning')}
                    >
                      {shiftInfo ? (
                        <div style={{fontSize: '0.875rem'}}>
                          <div style={{fontWeight: 500}}>Ca sáng</div>
                          {shiftInfo.notes && (
                            <div style={{fontSize: '0.75rem', color: '#6b7280', marginTop: '0.25rem'}}>
                              {shiftInfo.notes}
                            </div>
                          )}
                        </div>
                      ) : (
                        <div style={{color: '#9ca3af', fontSize: '0.75rem'}}>Bấm để thêm</div>
                      )}
                    </td>
                  );
                })}
              </tr>
              
              {/* Afternoon Shift */}
              <tr>
                <td style={{padding: '0.75rem', borderBottom: '1px solid #e5e7eb', fontWeight: 500}}>
                  Chiều
                </td>
                {weekDates.map((date, index) => {
                  const formattedDate = formatDate(date);
                  const shiftInfo = getShiftInfo(formattedDate, 'afternoon');
                  
                  return (
                    <td 
                      key={index} 
                      style={{
                        padding: '0.5rem', 
                        borderBottom: '1px solid #e5e7eb', 
                        backgroundColor: shiftInfo ? '#f3e8ff' : 'transparent',
                        textAlign: 'center',
                        cursor: 'pointer'
                      }}
                      onClick={() => handleAddShift(formattedDate, 'afternoon')}
                    >
                      {shiftInfo ? (
                        <div style={{fontSize: '0.875rem'}}>
                          <div style={{fontWeight: 500}}>Ca chiều</div>
                          {shiftInfo.notes && (
                            <div style={{fontSize: '0.75rem', color: '#6b7280', marginTop: '0.25rem'}}>
                              {shiftInfo.notes}
                            </div>
                          )}
                        </div>
                      ) : (
                        <div style={{color: '#9ca3af', fontSize: '0.75rem'}}>Bấm để thêm</div>
                      )}
                    </td>
                  );
                })}
              </tr>
              
              {/* Night Shift */}
              <tr>
                <td style={{padding: '0.75rem', borderBottom: '1px solid #e5e7eb', fontWeight: 500}}>
                  Đêm
                </td>
                {weekDates.map((date, index) => {
                  const formattedDate = formatDate(date);
                  const shiftInfo = getShiftInfo(formattedDate, 'night');
                  
                  return (
                    <td 
                      key={index} 
                      style={{
                        padding: '0.5rem', 
                        borderBottom: '1px solid #e5e7eb', 
                        backgroundColor: shiftInfo ? '#e0e7ff' : 'transparent',
                        textAlign: 'center',
                        cursor: 'pointer'
                      }}
                      onClick={() => handleAddShift(formattedDate, 'night')}
                    >
                      {shiftInfo ? (
                        <div style={{fontSize: '0.875rem'}}>
                          <div style={{fontWeight: 500}}>Ca đêm</div>
                          {shiftInfo.notes && (
                            <div style={{fontSize: '0.75rem', color: '#6b7280', marginTop: '0.25rem'}}>
                              {shiftInfo.notes}
                            </div>
                          )}
                        </div>
                      ) : (
                        <div style={{color: '#9ca3af', fontSize: '0.75rem'}}>Bấm để thêm</div>
                      )}
                    </td>
                  );
                })}
              </tr>
            </tbody>
          </table>
        </div>
      </div>
      
      {/* Summary of total shifts in the current week */}
      <div style={{backgroundColor: 'white', borderRadius: '0.5rem', boxShadow: '0 1px 3px rgba(0,0,0,0.05)', padding: '1.5rem'}}>
        <h2 style={{fontSize: '1.125rem', fontWeight: 600, marginBottom: '1rem'}}>Tóm tắt ca làm việc</h2>
        
        <div style={{display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem'}}>
          {/* Morning shifts */}
          <div style={{padding: '1rem', borderRadius: '0.5rem', border: '1px solid #dbeafe', backgroundColor: '#f0f9ff'}}>
            <h3 style={{fontSize: '0.875rem', fontWeight: 600, color: '#1e40af', margin: 0}}>Ca sáng</h3>
            <p style={{fontSize: '1.5rem', fontWeight: 500, margin: '0.5rem 0'}}>
              {scheduleData.filter(entry => 
                entry.staffId === staff.id && 
                entry.shift === 'morning' &&
                weekDates.some(date => formatDate(date) === entry.date)
              ).length}
            </p>
          </div>
          
          {/* Afternoon shifts */}
          <div style={{padding: '1rem', borderRadius: '0.5rem', border: '1px solid #f3e8ff', backgroundColor: '#faf5ff'}}>
            <h3 style={{fontSize: '0.875rem', fontWeight: 600, color: '#7e22ce', margin: 0}}>Ca chiều</h3>
            <p style={{fontSize: '1.5rem', fontWeight: 500, margin: '0.5rem 0'}}>
              {scheduleData.filter(entry => 
                entry.staffId === staff.id && 
                entry.shift === 'afternoon' &&
                weekDates.some(date => formatDate(date) === entry.date)
              ).length}
            </p>
          </div>
          
          {/* Night shifts */}
          <div style={{padding: '1rem', borderRadius: '0.5rem', border: '1px solid #e0e7ff', backgroundColor: '#f5f3ff'}}>
            <h3 style={{fontSize: '0.875rem', fontWeight: 600, color: '#4338ca', margin: 0}}>Ca đêm</h3>
            <p style={{fontSize: '1.5rem', fontWeight: 500, margin: '0.5rem 0'}}>
              {scheduleData.filter(entry => 
                entry.staffId === staff.id && 
                entry.shift === 'night' &&
                weekDates.some(date => formatDate(date) === entry.date)
              ).length}
            </p>
          </div>
          
          {/* Total shifts */}
          <div style={{padding: '1rem', borderRadius: '0.5rem', border: '1px solid #d1d5db', backgroundColor: '#f9fafb'}}>
            <h3 style={{fontSize: '0.875rem', fontWeight: 600, color: '#111827', margin: 0}}>Tổng số ca</h3>
            <p style={{fontSize: '1.5rem', fontWeight: 500, margin: '0.5rem 0'}}>
              {scheduleData.filter(entry => 
                entry.staffId === staff.id && 
                weekDates.some(date => formatDate(date) === entry.date)
              ).length}
            </p>
          </div>
        </div>
      </div>
      
      {/* Add/Edit Shift Modal */}
      {showAddModal && (
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
          zIndex: 50
        }}>
          <div style={{
            backgroundColor: 'white',
            borderRadius: '0.5rem',
            padding: '1.5rem',
            width: '100%',
            maxWidth: '28rem',
            boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)'
          }}>
            <h3 style={{
              fontSize: '1.125rem',
              fontWeight: 600,
              color: '#111827',
              marginBottom: '0.75rem'
            }}>
              {getShiftInfo(selectedDate, selectedShift) ? 'Chỉnh sửa ca làm việc' : 'Thêm ca làm việc'}
            </h3>
            
            <div style={{marginBottom: '1rem'}}>
              <p style={{fontSize: '0.875rem', color: '#6b7280', margin: '0 0 0.5rem'}}>
                {new Date(selectedDate).toLocaleDateString('vi-VN', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
              </p>
              <p style={{fontSize: '1rem', fontWeight: 500, color: '#111827', margin: 0}}>
                Ca: {selectedShift === 'morning' ? 'Sáng' : selectedShift === 'afternoon' ? 'Chiều' : 'Đêm'}
              </p>
            </div>
            
            <div style={{marginBottom: '1.5rem'}}>
              <label htmlFor="notes" style={{display: 'block', fontSize: '0.875rem', fontWeight: 500, color: '#374151', marginBottom: '0.25rem'}}>
                Ghi chú
              </label>
              <textarea
                id="notes"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                rows={4}
                style={{
                  display: 'block',
                  width: '100%',
                  borderRadius: '0.375rem',
                  border: '1px solid #d1d5db',
                  boxShadow: '0 1px 2px 0 rgba(0, 0, 0, 0.05)',
                  padding: '0.5rem 0.75rem',
                  fontSize: '0.875rem'
                }}
                placeholder="Nhập các ghi chú về ca làm việc này..."
              />
            </div>
            
            <div style={{
              display: 'flex',
              justifyContent: 'space-between',
              gap: '0.75rem'
            }}>
              <div>
                {getShiftInfo(selectedDate, selectedShift) && (
                  <button
                    onClick={handleDeleteShift}
                    style={{
                      padding: '0.5rem 1rem',
                      fontSize: '0.875rem',
                      fontWeight: 500,
                      borderRadius: '0.375rem',
                      border: '1px solid transparent',
                      backgroundColor: '#ef4444',
                      color: 'white',
                      cursor: 'pointer'
                    }}
                  >
                    Xoá ca
                  </button>
                )}
              </div>
              
              <div style={{
                display: 'flex',
                gap: '0.75rem'
              }}>
                <button
                  onClick={() => setShowAddModal(false)}
                  style={{
                    padding: '0.5rem 1rem',
                    fontSize: '0.875rem',
                    fontWeight: 500,
                    borderRadius: '0.375rem',
                    border: '1px solid #d1d5db',
                    backgroundColor: 'white',
                    color: '#374151',
                    cursor: 'pointer'
                  }}
                >
                  Huỷ
                </button>
                <button
                  onClick={handleSaveShift}
                  style={{
                    padding: '0.5rem 1rem',
                    fontSize: '0.875rem',
                    fontWeight: 500,
                    borderRadius: '0.375rem',
                    border: '1px solid transparent',
                    backgroundColor: '#3b82f6',
                    color: 'white',
                    cursor: 'pointer'
                  }}
                >
                  {getShiftInfo(selectedDate, selectedShift) ? 'Cập nhật' : 'Thêm'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
} 