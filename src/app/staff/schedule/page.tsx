"use client";

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { ArrowLeftIcon } from '@heroicons/react/24/outline';

type Staff = {
  id: string;
  name: string;
  role: string;
  department: string;
};

type ShiftType = 'morning' | 'afternoon' | 'night';

type ScheduleEntry = {
  id: string;
  staffId: string;
  date: string;
  shift: ShiftType;
};

const DAYS_OF_WEEK = ['Thứ 2', 'Thứ 3', 'Thứ 4', 'Thứ 5', 'Thứ 6', 'Thứ 7', 'Chủ nhật'];

const MOCK_STAFF: Staff[] = [
  { id: '1', name: 'Nguyễn Văn A', role: 'Y tá', department: 'Y tế' },
  { id: '2', name: 'Trần Thị B', role: 'Bác sĩ', department: 'Y tế' },
  { id: '3', name: 'Lê Văn C', role: 'Nhân viên chăm sóc', department: 'Chăm sóc' },
  { id: '4', name: 'Phạm Thị D', role: 'Nhân viên chăm sóc', department: 'Chăm sóc' },
  { id: '5', name: 'Hoàng Văn E', role: 'Bảo vệ', department: 'Hành chính' },
];

const MOCK_SCHEDULE: ScheduleEntry[] = [
  { id: '1', staffId: '1', date: '2023-06-17', shift: 'morning' },
  { id: '2', staffId: '2', date: '2023-06-17', shift: 'afternoon' },
  { id: '3', staffId: '3', date: '2023-06-17', shift: 'night' },
  { id: '4', staffId: '4', date: '2023-06-18', shift: 'morning' },
  { id: '5', staffId: '5', date: '2023-06-18', shift: 'afternoon' },
  { id: '6', staffId: '1', date: '2023-06-18', shift: 'night' },
  { id: '7', staffId: '2', date: '2023-06-19', shift: 'morning' },
  { id: '8', staffId: '3', date: '2023-06-19', shift: 'afternoon' },
  { id: '9', staffId: '4', date: '2023-06-19', shift: 'night' },
  { id: '10', staffId: '5', date: '2023-06-20', shift: 'morning' },
  { id: '11', staffId: '1', date: '2023-06-20', shift: 'afternoon' },
  { id: '12', staffId: '2', date: '2023-06-20', shift: 'night' },
];

export default function StaffSchedulePage() {
  const [currentWeekStart, setCurrentWeekStart] = useState<Date>(getMonday(new Date()));
  const [selectedDepartment, setSelectedDepartment] = useState<string>('all');
  const [scheduleData, setScheduleData] = useState<ScheduleEntry[]>(MOCK_SCHEDULE);
  
  // Generate dates for the current week
  const weekDates = Array.from({ length: 7 }, (_, i) => {
    const date = new Date(currentWeekStart);
    date.setDate(currentWeekStart.getDate() + i);
    return date;
  });
  
  // Filter staff by department
  const filteredStaff = selectedDepartment === 'all' 
    ? MOCK_STAFF 
    : MOCK_STAFF.filter(staff => staff.department === selectedDepartment);
  
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
  
  function getShiftForStaffOnDate(staffId: string, date: string, shift: ShiftType): boolean {
    return scheduleData.some(entry => 
      entry.staffId === staffId && 
      entry.date === date && 
      entry.shift === shift
    );
  }
  
  function toggleShift(staffId: string, date: string, shift: ShiftType) {
    const existingEntry = scheduleData.find(entry => 
      entry.staffId === staffId && 
      entry.date === date && 
      entry.shift === shift
    );
    
    if (existingEntry) {
      // Remove the shift
      setScheduleData(scheduleData.filter(entry => entry.id !== existingEntry.id));
    } else {
      // Add the shift
      const newEntry: ScheduleEntry = {
        id: `${staffId}-${date}-${shift}-${Date.now()}`,
        staffId,
        date,
        shift
      };
      setScheduleData([...scheduleData, newEntry]);
    }
  }
  
  return (
    <div style={{marginBottom: '2rem'}}>
      <div style={{display: 'flex', alignItems: 'center', marginBottom: '1rem'}}>
        <Link href="/staff" style={{marginRight: '1rem', color: '#6b7280', display: 'flex'}}>
          <ArrowLeftIcon style={{height: '1rem', width: '1rem'}} />
        </Link>
        <h1 style={{fontSize: '1.5rem', fontWeight: 600, color: '#111827'}}>Lịch làm việc nhân viên</h1>
      </div>
      
      <div style={{backgroundColor: 'white', borderRadius: '0.5rem', boxShadow: '0 1px 2px rgba(0,0,0,0.05)', padding: '1.5rem', marginBottom: '1.5rem'}}>
        <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem'}}>
          <div style={{display: 'flex', alignItems: 'center', gap: '0.5rem'}}>
            <button 
              onClick={previousWeek}
              style={{
                padding: '0.5rem', 
                border: '1px solid #d1d5db', 
                borderRadius: '0.375rem', 
                backgroundColor: 'white'
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
                backgroundColor: 'white'
              }}
            >
              &gt;
            </button>
          </div>
          
          <div>
            <select
              value={selectedDepartment}
              onChange={(e) => setSelectedDepartment(e.target.value)}
              style={{
                padding: '0.5rem',
                border: '1px solid #d1d5db',
                borderRadius: '0.375rem',
                backgroundColor: 'white'
              }}
            >
              <option value="all">Tất cả bộ phận</option>
              <option value="Y tế">Y tế</option>
              <option value="Chăm sóc">Chăm sóc</option>
              <option value="Hành chính">Hành chính</option>
            </select>
          </div>
        </div>
        
        <div style={{overflowX: 'auto'}}>
          <table style={{width: '100%', borderCollapse: 'collapse'}}>
            <thead>
              <tr>
                <th style={{padding: '0.75rem', borderBottom: '1px solid #e5e7eb', textAlign: 'left'}}>Nhân viên</th>
                {weekDates.map((date, index) => (
                  <th key={index} style={{padding: '0.75rem', borderBottom: '1px solid #e5e7eb', textAlign: 'center', minWidth: '120px'}}>
                    <div>{DAYS_OF_WEEK[index]}</div>
                    <div style={{fontWeight: 'normal', fontSize: '0.875rem'}}>{formatDisplayDate(date)}</div>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filteredStaff.map(staff => (
                <tr key={staff.id}>
                  <td style={{padding: '0.75rem', borderBottom: '1px solid #e5e7eb'}}>
                    <div style={{fontWeight: 500}}>{staff.name}</div>
                    <div style={{fontSize: '0.875rem', color: '#6b7280'}}>{staff.role}</div>
                  </td>
                  {weekDates.map((date, index) => (
                    <td key={index} style={{padding: '0.5rem', borderBottom: '1px solid #e5e7eb', textAlign: 'center'}}>
                      <div style={{display: 'flex', flexDirection: 'column', gap: '0.25rem'}}>
                        <button
                          onClick={() => toggleShift(staff.id, formatDate(date), 'morning')}
                          style={{
                            padding: '0.25rem',
                            border: '1px solid #d1d5db',
                            borderRadius: '0.25rem',
                            backgroundColor: getShiftForStaffOnDate(staff.id, formatDate(date), 'morning') ? '#dcfce7' : 'transparent',
                            cursor: 'pointer',
                            fontSize: '0.75rem'
                          }}
                        >
                          Sáng
                        </button>
                        <button
                          onClick={() => toggleShift(staff.id, formatDate(date), 'afternoon')}
                          style={{
                            padding: '0.25rem',
                            border: '1px solid #d1d5db',
                            borderRadius: '0.25rem',
                            backgroundColor: getShiftForStaffOnDate(staff.id, formatDate(date), 'afternoon') ? '#dcfce7' : 'transparent',
                            cursor: 'pointer',
                            fontSize: '0.75rem'
                          }}
                        >
                          Chiều
                        </button>
                        <button
                          onClick={() => toggleShift(staff.id, formatDate(date), 'night')}
                          style={{
                            padding: '0.25rem',
                            border: '1px solid #d1d5db',
                            borderRadius: '0.25rem',
                            backgroundColor: getShiftForStaffOnDate(staff.id, formatDate(date), 'night') ? '#dcfce7' : 'transparent',
                            cursor: 'pointer',
                            fontSize: '0.75rem'
                          }}
                        >
                          Đêm
                        </button>
                      </div>
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
      
      <div style={{display: 'flex', justifyContent: 'flex-end'}}>
        <button
          style={{
            padding: '0.5rem 1rem', 
            border: '1px solid transparent', 
            borderRadius: '0.375rem', 
            boxShadow: '0 1px 2px 0 rgba(0, 0, 0, 0.05)', 
            fontSize: '0.875rem', 
            fontWeight: 500, 
            color: 'white', 
            backgroundColor: '#0284c7',
            cursor: 'pointer'
          }}
        >
          Lưu lịch làm việc
        </button>
      </div>
    </div>
  );
} 
