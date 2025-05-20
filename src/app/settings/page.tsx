"use client";

import { useState } from 'react';
import { 
  Cog6ToothIcon, 
  BellIcon, 
  UserCircleIcon, 
  ShieldCheckIcon, 
  ServerIcon,
  EnvelopeIcon,
  DevicePhoneMobileIcon
} from '@heroicons/react/24/outline';

// Settings sections data
const settingsSections = [
  {
    id: 'general',
    title: 'Cài đặt chung',
    icon: Cog6ToothIcon,
    settings: [
      {
        id: 'facilityName',
        label: 'Tên cơ sở',
        value: 'Nhà dưỡng lão An Bình',
        type: 'text'
      },
      {
        id: 'facilityAddress',
        label: 'Địa chỉ',
        value: '123 Nguyễn Văn Linh, Quận 7, TP HCM',
        type: 'text'
      },
      {
        id: 'contactPhone',
        label: 'Số điện thoại liên hệ',
        value: '028 1234 5678',
        type: 'text'
      },
      {
        id: 'contactEmail',
        label: 'Email liên hệ',
        value: 'info@anbinh.com',
        type: 'email'
      },
      {
        id: 'language',
        label: 'Ngôn ngữ',
        value: 'Vietnamese',
        type: 'select',
        options: ['English', 'Vietnamese']
      }
    ]
  },
  {
    id: 'notifications',
    title: 'Thông báo',
    icon: BellIcon,
    settings: [
      {
        id: 'emailNotifications',
        label: 'Thông báo qua email',
        value: true,
        type: 'toggle'
      },
      {
        id: 'smsNotifications',
        label: 'Thông báo qua SMS',
        value: false,
        type: 'toggle'
      },
      {
        id: 'medicalAlerts',
        label: 'Cảnh báo y tế',
        value: true,
        type: 'toggle'
      },
      {
        id: 'activityReminders',
        label: 'Nhắc nhở hoạt động',
        value: true,
        type: 'toggle'
      }
    ]
  },
  {
    id: 'security',
    title: 'Bảo mật',
    icon: ShieldCheckIcon,
    settings: [
      {
        id: 'twoFactorAuth',
        label: 'Xác thực hai yếu tố',
        value: true,
        type: 'toggle'
      },
      {
        id: 'passwordResetTime',
        label: 'Thời gian reset mật khẩu',
        value: '90',
        type: 'select',
        options: ['30', '60', '90', '180']
      },
      {
        id: 'sessionTimeout',
        label: 'Thời gian chờ phiên làm việc (phút)',
        value: '30',
        type: 'select',
        options: ['15', '30', '60', '120']
      }
    ]
  },
  {
    id: 'system',
    title: 'Hệ thống',
    icon: ServerIcon,
    settings: [
      {
        id: 'databaseBackup',
        label: 'Tự động sao lưu cơ sở dữ liệu',
        value: true,
        type: 'toggle'
      },
      {
        id: 'backupSchedule',
        label: 'Lịch sao lưu',
        value: 'daily',
        type: 'select',
        options: ['daily', 'weekly', 'monthly']
      },
      {
        id: 'dataRetention',
        label: 'Thời gian lưu trữ dữ liệu (tháng)',
        value: '24',
        type: 'select',
        options: ['12', '24', '36', '60']
      }
    ]
  }
];

// Fix 1: Add proper types for the settings and functions
interface Setting {
  id: string;
  label: string;
  value: string | boolean;
  type: 'text' | 'email' | 'select' | 'toggle';
  options?: string[];
}

interface SettingsSection {
  id: string;
  title: string;
  icon: React.FC<React.ComponentProps<'svg'>>;
  settings: Setting[];
}

export default function SettingsPage() {
  const [activeSection, setActiveSection] = useState('general');
  const [modifiedSettings, setModifiedSettings] = useState<Record<string, any>>({});
  
  const handleSettingChange = (sectionId: string, settingId: string, value: string | boolean) => {
    setModifiedSettings({
      ...modifiedSettings,
      [`${sectionId}.${settingId}`]: value
    });
  };
  
  const currentSection = settingsSections.find(section => section.id === activeSection);
  
  // Function to get the current value of a setting
  const getCurrentValue = (sectionId: string, settingId: string, defaultValue: string | boolean): string | boolean => {
    const key = `${sectionId}.${settingId}`;
    return modifiedSettings[key] !== undefined 
      ? modifiedSettings[key] 
      : defaultValue;
  };
  
  return (
    <div style={{maxWidth: '1400px', margin: '0 auto'}}>
      <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem'}}>
        <h1 style={{fontSize: '1.5rem', fontWeight: 600, margin: 0}}>Cài đặt hệ thống</h1>
      </div>
      
      <div style={{display: 'grid', gridTemplateColumns: '16rem 1fr', gap: '1.5rem'}}>
        {/* Settings Navigation */}
        <nav style={{
          backgroundColor: 'white', 
          borderRadius: '0.5rem', 
          boxShadow: '0 1px 3px rgba(0,0,0,0.05)', 
          padding: '1rem 0'
        }}>
          <ul style={{listStyle: 'none', margin: 0, padding: 0}}>
            {settingsSections.map(section => (
              <li key={section.id}>
                <button 
                  onClick={() => setActiveSection(section.id)}
                  style={{
                    width: '100%',
                    padding: '0.75rem 1rem',
                    display: 'flex',
                    alignItems: 'center',
                    fontSize: '0.875rem',
                    background: 'none',
                    border: 'none',
                    cursor: 'pointer',
                    textAlign: 'left',
                    color: activeSection === section.id ? '#0c4a6e' : '#4b5563',
                    fontWeight: activeSection === section.id ? 600 : 'normal',
                    backgroundColor: activeSection === section.id ? '#f0f9ff' : 'transparent'
                  }}
                >
                  <section.icon style={{
                    width: '1rem', 
                    height: '1rem', 
                    marginRight: '0.75rem',
                    color: activeSection === section.id ? '#0369a1' : '#6b7280'
                  }} />
                  {section.title}
                </button>
              </li>
            ))}
          </ul>
        </nav>
        
        {/* Settings Content */}
        <div style={{
          backgroundColor: 'white',
          borderRadius: '0.5rem',
          boxShadow: '0 1px 3px rgba(0,0,0,0.05)',
          padding: '1.5rem'
        }}>
          {currentSection && (
            <>
              <div style={{display: 'flex', alignItems: 'center', marginBottom: '1.5rem'}}>
                <currentSection.icon style={{
                  width: '1.25rem', 
                  height: '1.25rem', 
                  color: '#0369a1',
                  marginRight: '0.75rem'
                }} />
                <h2 style={{
                  fontSize: '1.25rem', 
                  fontWeight: 600, 
                  color: '#111827',
                  margin: 0
                }}>
                  {currentSection.title}
                </h2>
              </div>
              
              <div style={{display: 'grid', gap: '1.5rem'}}>
                {currentSection.settings.map(setting => (
                  <div key={setting.id} style={{
                    borderBottom: '1px solid #e5e7eb', 
                    paddingBottom: '1.25rem'
                  }}>
                    <div style={{
                      display: 'flex', 
                      flexDirection: 'column', 
                      gap: '0.5rem'
                    }}>
                      <label htmlFor={setting.id} style={{
                        fontWeight: 500, 
                        fontSize: '0.875rem', 
                        color: '#374151'
                      }}>
                        {setting.label}
                      </label>
                      
                      {setting.type === 'text' || setting.type === 'email' ? (
                        <input
                          type={setting.type}
                          id={setting.id}
                          value={getCurrentValue(currentSection.id, setting.id, setting.value)}
                          onChange={(e) => handleSettingChange(currentSection.id, setting.id, e.target.value)}
                          style={{
                            padding: '0.5rem 0.75rem',
                            borderRadius: '0.375rem',
                            border: '1px solid #d1d5db',
                            fontSize: '0.875rem',
                            width: '100%',
                            maxWidth: '24rem'
                          }}
                        />
                      ) : setting.type === 'select' ? (
                        <select
                          id={setting.id}
                          value={getCurrentValue(currentSection.id, setting.id, setting.value)}
                          onChange={(e) => handleSettingChange(currentSection.id, setting.id, e.target.value)}
                          style={{
                            padding: '0.5rem 0.75rem',
                            borderRadius: '0.375rem',
                            border: '1px solid #d1d5db',
                            fontSize: '0.875rem',
                            backgroundColor: 'white',
                            width: '100%',
                            maxWidth: '12rem'
                          }}
                        >
                          {setting.options.map(option => (
                            <option key={option} value={option}>
                              {option}
                            </option>
                          ))}
                        </select>
                      ) : (
                        <div style={{display: 'flex', alignItems: 'center'}}>
                          <button
                            type="button"
                            role="switch"
                            aria-checked={getCurrentValue(currentSection.id, setting.id, setting.value)}
                            onClick={() => handleSettingChange(
                              currentSection.id, 
                              setting.id, 
                              !getCurrentValue(currentSection.id, setting.id, setting.value)
                            )}
                            style={{
                              position: 'relative',
                              display: 'inline-flex',
                              width: '3rem',
                              height: '1.5rem',
                              backgroundColor: getCurrentValue(currentSection.id, setting.id, setting.value) 
                                ? '#0ea5e9' 
                                : '#d1d5db',
                              borderRadius: '9999px',
                              transition: 'background-color 0.2s',
                              cursor: 'pointer'
                            }}
                          >
                            <span style={{
                              position: 'absolute',
                              top: '0.125rem',
                              left: getCurrentValue(currentSection.id, setting.id, setting.value) ? 'calc(100% - 1.25rem)' : '0.125rem',
                              width: '1.25rem',
                              height: '1.25rem',
                              backgroundColor: 'white',
                              borderRadius: '9999px',
                              transition: 'left 0.2s',
                              transform: 'translateX(0)'
                            }} />
                          </button>
                          <span style={{
                            marginLeft: '0.75rem', 
                            fontSize: '0.875rem',
                            color: '#6b7280'
                          }}>
                            {getCurrentValue(currentSection.id, setting.id, setting.value) ? 'Bật' : 'Tắt'}
                          </span>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
              
              <div style={{marginTop: '2rem', display: 'flex', gap: '0.75rem'}}>
                <button style={{
                  backgroundColor: '#0284c7',
                  color: 'white',
                  padding: '0.5rem 1.25rem',
                  borderRadius: '0.375rem',
                  border: 'none',
                  fontSize: '0.875rem',
                  fontWeight: 500,
                  cursor: 'pointer'
                }}>
                  Lưu thay đổi
                </button>
                <button style={{
                  backgroundColor: 'white',
                  color: '#4b5563',
                  padding: '0.5rem 1.25rem',
                  borderRadius: '0.375rem',
                  border: '1px solid #d1d5db',
                  fontSize: '0.875rem',
                  fontWeight: 500,
                  cursor: 'pointer'
                }}>
                  Hủy
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
} 