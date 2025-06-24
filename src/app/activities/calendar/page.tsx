"use client";

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { ArrowLeftIcon, ChevronLeftIcon, ChevronRightIcon, PlusCircleIcon } from '@heroicons/react/24/outline';

// Mock activities data
const activitiesData = [
  { 
    id: 1, 
    name: 'Tập thể dục buổi sáng', 
    category: 'Thể chất', 
    scheduledTime: '08:00', 
    duration: 45,
    date: '2024-01-15',
    status: 'Đã lên lịch'
  },
  { 
    id: 2, 
    name: 'Mỹ thuật & Thủ công', 
    category: 'Sáng tạo', 
    scheduledTime: '10:30', 
    duration: 60,
    date: '2024-01-15',
    status: 'Đang diễn ra'
  },
  { 
    id: 3, 
    name: 'Trị liệu âm nhạc', 
    category: 'Trị liệu', 
    scheduledTime: '14:00', 
    duration: 60,
    date: '2024-01-16',
    status: 'Đã lên lịch'
  },
  { 
    id: 4, 
    name: 'Trò chơi trí nhớ', 
    category: 'Nhận thức', 
    scheduledTime: '11:00', 
    duration: 45,
    date: '2024-01-17',
    status: 'Đã lên lịch'
  },
  { 
    id: 5, 
    name: 'Trò chơi buổi tối', 
    category: 'Xã hội', 
    scheduledTime: '16:00', 
    duration: 90,
    date: '2024-01-18',
    status: 'Đã lên lịch'
  }
];

const months = [
  'Tháng 1', 'Tháng 2', 'Tháng 3', 'Tháng 4', 'Tháng 5', 'Tháng 6',
  'Tháng 7', 'Tháng 8', 'Tháng 9', 'Tháng 10', 'Tháng 11', 'Tháng 12'
];

const daysOfWeek = ['CN', 'T2', 'T3', 'T4', 'T5', 'T6', 'T7'];

export default function ActivityCalendarPage() {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [activities, setActivities] = useState(activitiesData);
  
  useEffect(() => {
    // Load activities from localStorage
    const savedActivities = localStorage.getItem('nurseryHomeActivities');
    if (savedActivities) {
      setActivities(JSON.parse(savedActivities));
    }
  }, []);
  
  // Navigate to previous month
  const previousMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1));
  };
  
  // Navigate to next month
  const nextMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1));
  };
  
  // Get activities for a specific date
  const getActivitiesForDate = (date: Date) => {
    const dateString = date.toISOString().split('T')[0];
    return activities.filter(activity => activity.date === dateString);
  };
  
  // Generate calendar days
  const generateCalendarDays = () => {
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();
    
    const firstDayOfMonth = new Date(year, month, 1);
    const lastDayOfMonth = new Date(year, month + 1, 0);
    const firstDayOfWeek = firstDayOfMonth.getDay();
    
    const days = [];
    
    // Add empty cells for days before the first day of the month
    for (let i = 0; i < firstDayOfWeek; i++) {
      days.push(null);
    }
    
    // Add days of the month
    for (let day = 1; day <= lastDayOfMonth.getDate(); day++) {
      days.push(new Date(year, month, day));
    }
    
    return days;
  };
  
  const calendarDays = generateCalendarDays();
  
  // Helper function to render category with appropriate color
  const getCategoryColor = (category: string) => {
    switch (category) {
      case 'Thể chất': return '#1d4ed8';
      case 'Sáng tạo': return '#166534';
      case 'Trị liệu': return '#d97706';
      case 'Nhận thức': return '#4338ca';
      case 'Xã hội': return '#be185d';
      default: return '#374151';
    }
  };
  
  // Check if a date is today
  const isToday = (date: Date) => {
    const today = new Date();
    return date.toDateString() === today.toDateString();
  };
  
  // Check if a date is selected
  const isSelected = (date: Date) => {
    return selectedDate && date.toDateString() === selectedDate.toDateString();
  };
  
  return (
    <div style={{maxWidth: '1400px', margin: '0 auto', padding: '0 1rem'}}>
      <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem'}}>
        <div style={{display: 'flex', alignItems: 'center', gap: '0.5rem'}}>
          <Link href="/activities" style={{color: '#6b7280', display: 'flex'}}>
            <ArrowLeftIcon style={{width: '1.25rem', height: '1.25rem'}} />
          </Link>
          <h1 style={{fontSize: '1.5rem', fontWeight: 600, margin: 0}}>Lịch hoạt động</h1>
        </div>
        
        <Link 
          href="/activities/new" 
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            backgroundColor: '#0284c7',
            color: 'white',
            padding: '0.5rem 1rem',
            borderRadius: '0.375rem',
            textDecoration: 'none',
            fontWeight: 500,
            fontSize: '0.875rem'
          }}
        >
          <PlusCircleIcon style={{width: '1rem', height: '1rem', marginRight: '0.375rem'}} />
          Thêm hoạt động
        </Link>
      </div>
      
      <div style={{display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '1.5rem'}}>
        
        {/* Calendar */}
        <div style={{backgroundColor: 'white', borderRadius: '0.5rem', boxShadow: '0 1px 3px rgba(0,0,0,0.05)', padding: '1.5rem'}}>
          
          {/* Calendar Header */}
          <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem'}}>
            <h2 style={{fontSize: '1.25rem', fontWeight: 600, color: '#111827', margin: 0}}>
              {months[currentDate.getMonth()]} {currentDate.getFullYear()}
            </h2>
            <div style={{display: 'flex', gap: '0.5rem'}}>
              <button
                onClick={previousMonth}
                style={{
                  padding: '0.5rem',
                  border: '1px solid #d1d5db',
                  borderRadius: '0.375rem',
                  backgroundColor: 'white',
                  cursor: 'pointer'
                }}
              >
                <ChevronLeftIcon style={{width: '1rem', height: '1rem'}} />
              </button>
              <button
                onClick={nextMonth}
                style={{
                  padding: '0.5rem',
                  border: '1px solid #d1d5db',
                  borderRadius: '0.375rem',
                  backgroundColor: 'white',
                  cursor: 'pointer'
                }}
              >
                <ChevronRightIcon style={{width: '1rem', height: '1rem'}} />
              </button>
            </div>
          </div>
          
          {/* Days of week header */}
          <div style={{display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: '0.25rem', marginBottom: '0.5rem'}}>
            {daysOfWeek.map(day => (
              <div key={day} style={{
                padding: '0.5rem',
                fontSize: '0.875rem',
                fontWeight: 500,
                color: '#6b7280',
                textAlign: 'center'
              }}>
                {day}
              </div>
            ))}
          </div>
          
          {/* Calendar grid */}
          <div style={{display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: '0.25rem'}}>
            {calendarDays.map((date, index) => {
              if (!date) {
                return <div key={index} style={{minHeight: '6rem'}} />;
              }
              
              const dayActivities = getActivitiesForDate(date);
              const today = isToday(date);
              const selected = isSelected(date);
              
              return (
                <div
                  key={index}
                  onClick={() => setSelectedDate(date)}
                  style={{
                    minHeight: '6rem',
                    padding: '0.5rem',
                    border: '1px solid #e5e7eb',
                    borderRadius: '0.375rem',
                    cursor: 'pointer',
                    backgroundColor: selected ? '#dbeafe' : today ? '#fef3c7' : 'white',
                    borderColor: selected ? '#1d4ed8' : today ? '#d97706' : '#e5e7eb'
                  }}
                >
                  <div style={{
                    fontSize: '0.875rem',
                    fontWeight: today ? 600 : 500,
                    color: today ? '#d97706' : '#374151',
                    marginBottom: '0.25rem'
                  }}>
                    {date.getDate()}
                  </div>
                  
                  {/* Activities for this date */}
                  <div style={{display: 'flex', flexDirection: 'column', gap: '0.125rem'}}>
                    {dayActivities.slice(0, 3).map(activity => (
                      <div
                        key={activity.id}
                        style={{
                          fontSize: '0.625rem',
                          padding: '0.125rem 0.25rem',
                          borderRadius: '0.25rem',
                          backgroundColor: getCategoryColor(activity.category),
                          color: 'white',
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                          whiteSpace: 'nowrap'
                        }}
                      >
                        {activity.scheduledTime} {activity.name}
                      </div>
                    ))}
                    {dayActivities.length > 3 && (
                      <div style={{
                        fontSize: '0.625rem',
                        color: '#6b7280',
                        textAlign: 'center'
                      }}>
                        +{dayActivities.length - 3} khác
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
        
        {/* Selected Date Activities */}
        <div style={{backgroundColor: 'white', borderRadius: '0.5rem', boxShadow: '0 1px 3px rgba(0,0,0,0.05)', padding: '1.5rem'}}>
          <h3 style={{fontSize: '1.125rem', fontWeight: 600, color: '#111827', marginTop: 0, marginBottom: '1rem'}}>
            {selectedDate 
              ? `Hoạt động ngày ${selectedDate.getDate()}/${selectedDate.getMonth() + 1}/${selectedDate.getFullYear()}`
              : 'Chọn ngày để xem hoạt động'
            }
          </h3>
          
          {selectedDate ? (
            <div style={{display: 'flex', flexDirection: 'column', gap: '0.75rem'}}>
              {getActivitiesForDate(selectedDate).length > 0 ? (
                getActivitiesForDate(selectedDate).map(activity => (
                  <Link
                    key={activity.id}
                    href={`/activities/${activity.id}`}
                    style={{
                      display: 'block',
                      padding: '0.75rem',
                      border: '1px solid #e5e7eb',
                      borderRadius: '0.375rem',
                      textDecoration: 'none',
                      color: 'inherit',
                      transition: 'all 0.2s'
                    }}
                  >
                    <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.25rem'}}>
                      <h4 style={{fontSize: '0.875rem', fontWeight: 600, color: '#111827', margin: 0}}>
                        {activity.name}
                      </h4>
                      <span style={{
                        fontSize: '0.75rem',
                        padding: '0.125rem 0.5rem',
                        borderRadius: '9999px',
                        backgroundColor: getCategoryColor(activity.category),
                        color: 'white'
                      }}>
                        {activity.category}
                      </span>
                    </div>
                    <div style={{display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem', color: '#6b7280'}}>
                      <span><strong>Thời gian:</strong> {activity.scheduledTime}</span>
                      <span><strong>Thời lượng:</strong> {activity.duration} phút</span>
                    </div>
                  </Link>
                ))
              ) : (
                <p style={{fontSize: '0.875rem', color: '#6b7280', textAlign: 'center', margin: '2rem 0'}}>
                  Không có hoạt động nào được lên lịch cho ngày này
                </p>
              )}
              
              <Link
                href={`/activities/new?date=${selectedDate.toISOString().split('T')[0]}`}
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  padding: '0.5rem 1rem',
                  border: '1px dashed #d1d5db',
                  borderRadius: '0.375rem',
                  textDecoration: 'none',
                  color: '#6b7280',
                  fontSize: '0.875rem',
                  fontWeight: 500,
                  marginTop: '0.5rem'
                }}
              >
                <PlusCircleIcon style={{width: '1rem', height: '1rem', marginRight: '0.5rem'}} />
                Thêm hoạt động cho ngày này
              </Link>
            </div>
          ) : (
            <p style={{fontSize: '0.875rem', color: '#6b7280', textAlign: 'center', margin: '2rem 0'}}>
              Nhấp vào một ngày trên lịch để xem các hoạt động
            </p>
          )}
        </div>
      </div>
      
      {/* Legend */}
      <div style={{backgroundColor: 'white', borderRadius: '0.5rem', boxShadow: '0 1px 3px rgba(0,0,0,0.05)', padding: '1rem', marginTop: '1.5rem'}}>
        <h4 style={{fontSize: '1rem', fontWeight: 600, color: '#111827', marginTop: 0, marginBottom: '0.75rem'}}>
          Chú thích màu sắc
        </h4>
        <div style={{display: 'flex', flexWrap: 'wrap', gap: '1rem'}}>
          {['Thể chất', 'Sáng tạo', 'Trị liệu', 'Nhận thức', 'Xã hội'].map(category => (
            <div key={category} style={{display: 'flex', alignItems: 'center', gap: '0.5rem'}}>
              <div style={{
                width: '0.75rem',
                height: '0.75rem',
                borderRadius: '0.125rem',
                backgroundColor: getCategoryColor(category)
              }} />
              <span style={{fontSize: '0.875rem', color: '#6b7280'}}>{category}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
} 
