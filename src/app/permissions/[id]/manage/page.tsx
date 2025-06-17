"use client";

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { 
  ArrowLeftIcon,
  ShieldCheckIcon,
  UserCircleIcon,
  ExclamationTriangleIcon,
  CheckCircleIcon,
  LockClosedIcon,
  LockOpenIcon,
  EyeIcon,
  PencilIcon,
  TrashIcon,
  CogIcon,
  DocumentTextIcon,
  UsersIcon,
  BanknotesIcon,
  ChartBarIcon,
  Cog8ToothIcon
} from '@heroicons/react/24/outline';

// Mock user data
const getUserById = (id: string) => {
  const users = [
    { 
      id: 1, 
      name: 'Admin Nguyễn', 
      email: 'admin@carehome.com',
      role: 'Quản trị viên',
      permissions: ['Đọc', 'Ghi', 'Chỉnh sửa', 'Xóa'],
      department: 'Quản lý',
      modules: {
        'residents': { read: true, write: true, edit: true, delete: true },
        'staff': { read: true, write: true, edit: true, delete: true },
        'finance': { read: true, write: true, edit: true, delete: true },
        'reports': { read: true, write: true, edit: true, delete: false },
        'settings': { read: true, write: true, edit: true, delete: false }
      }
    },
    { 
      id: 2, 
      name: 'Y tá Trần', 
      email: 'nurse@carehome.com',
      role: 'Y tá',
      permissions: ['Đọc', 'Ghi', 'Chỉnh sửa'],
      department: 'Y tế',
      modules: {
        'residents': { read: true, write: true, edit: true, delete: false },
        'staff': { read: true, write: false, edit: false, delete: false },
        'finance': { read: false, write: false, edit: false, delete: false },
        'reports': { read: true, write: false, edit: false, delete: false },
        'settings': { read: false, write: false, edit: false, delete: false }
      }
    }
  ];
  
  return users.find(u => u.id === parseInt(id));
};

const modules = [
  {
    id: 'residents',
    name: 'Quản lý người cao tuổi',
    icon: UsersIcon,
    description: 'Quản lý thông tin người cao tuổi, hồ sơ y tế, chăm sóc'
  },
  {
    id: 'staff',
    name: 'Quản lý nhân viên',
    icon: UserCircleIcon,
    description: 'Quản lý thông tin nhân viên, lịch làm việc'
  },
  {
    id: 'finance',
    name: 'Quản lý tài chính',
    icon: BanknotesIcon,
    description: 'Quản lý thu chi, báo cáo tài chính'
  },
  {
    id: 'reports',
    name: 'Báo cáo',
    icon: ChartBarIcon,
    description: 'Xem và tạo các báo cáo hệ thống'
  },
  {
    id: 'settings',
    name: 'Cài đặt hệ thống',
    icon: Cog8ToothIcon,
    description: 'Cấu hình hệ thống, phân quyền'
  }
];

const permissions = [
  { id: 'read', name: 'Đọc', icon: EyeIcon, color: '#10b981' },
  { id: 'write', name: 'Ghi', icon: PencilIcon, color: '#3b82f6' },
  { id: 'edit', name: 'Chỉnh sửa', icon: PencilIcon, color: '#f59e0b' },
  { id: 'delete', name: 'Xóa', icon: TrashIcon, color: '#ef4444' }
];

interface ManagePermissionsPageProps {
  params: Promise<{ id: string }>;
}

export default function ManagePermissionsPage({ params }: ManagePermissionsPageProps) {
  const router = useRouter();
  const [resolvedParams, setResolvedParams] = useState<{ id: string } | null>(null);
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [userPermissions, setUserPermissions] = useState<any>({});
  const [hasChanges, setHasChanges] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);

  useEffect(() => {
    const resolveParams = async () => {
      const resolved = await params;
      setResolvedParams(resolved);
      
      setTimeout(() => {
        const foundUser = getUserById(resolved.id);
        if (foundUser) {
          setUser(foundUser);
          setUserPermissions(foundUser.modules || {});
        }
        setLoading(false);
      }, 500);
    };
    resolveParams();
  }, [params]);

  const handlePermissionChange = (moduleId: string, permissionId: string, value: boolean) => {
    setUserPermissions((prev: any) => ({
      ...prev,
      [moduleId]: {
        ...prev[moduleId],
        [permissionId]: value
      }
    }));
    setHasChanges(true);
  };

  const handleSelectAll = (moduleId: string, enable: boolean) => {
    setUserPermissions((prev: any) => ({
      ...prev,
      [moduleId]: {
        read: enable,
        write: enable,
        edit: enable,
        delete: enable
      }
    }));
    setHasChanges(true);
  };

  const handleSave = async () => {
    setIsSubmitting(true);
    
    try {
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      setShowSuccess(true);
      setHasChanges(false);
      
      setTimeout(() => {
        setShowSuccess(false);
      }, 3000);
      
    } catch (error) {
      console.error('Error saving permissions:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (loading || !resolvedParams) {
    return (
      <div style={{
        minHeight: '100vh',
        background: 'linear-gradient(135deg, #f8fafc 0%, #e2e8f0 100%)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center'
      }}>
        <div style={{
          background: 'white',
          borderRadius: '1rem',
          padding: '2rem',
          boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.1)',
          textAlign: 'center'
        }}>
          <div style={{
            width: '2rem',
            height: '2rem',
            border: '3px solid #f3f4f6',
            borderTop: '3px solid #8b5cf6',
            borderRadius: '50%',
            animation: 'spin 1s linear infinite',
            margin: '0 auto 1rem'
          }} />
          <p>Đang tải thông tin quyền hạn...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div style={{
        minHeight: '100vh',
        background: 'linear-gradient(135deg, #f8fafc 0%, #e2e8f0 100%)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center'
      }}>
        <div style={{
          background: 'white',
          borderRadius: '1rem',
          padding: '3rem',
          boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.1)',
          textAlign: 'center',
          maxWidth: '400px'
        }}>
          <ExclamationTriangleIcon style={{width: '3rem', height: '3rem', color: '#ef4444', margin: '0 auto 1rem'}} />
          <h2 style={{fontSize: '1.25rem', fontWeight: 600, color: '#111827', marginBottom: '1rem'}}>
            Không tìm thấy người dùng
          </h2>
          <p style={{color: '#6b7280', marginBottom: '1.5rem'}}>
            Người dùng với ID {resolvedParams.id} không tồn tại trong hệ thống.
          </p>
          <Link
            href="/permissions"
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              background: 'linear-gradient(135deg, #8b5cf6 0%, #7c3aed 100%)',
              color: 'white',
              padding: '0.75rem 1.5rem',
              borderRadius: '0.5rem',
              textDecoration: 'none',
              fontWeight: 600,
              fontSize: '0.875rem'
            }}
          >
            <ArrowLeftIcon style={{width: '1rem', height: '1rem', marginRight: '0.5rem'}} />
            Quay về danh sách
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div style={{
      minHeight: '100vh',
      background: 'linear-gradient(135deg, #f8fafc 0%, #e2e8f0 100%)',
      position: 'relative'
    }}>
      <div style={{
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        background: `
          radial-gradient(circle at 20% 80%, rgba(139, 92, 246, 0.05) 0%, transparent 50%),
          radial-gradient(circle at 80% 20%, rgba(59, 130, 246, 0.05) 0%, transparent 50%),
          radial-gradient(circle at 40% 40%, rgba(239, 68, 68, 0.03) 0%, transparent 50%)
        `,
        pointerEvents: 'none'
      }} />
      
      <div style={{
        maxWidth: '1200px', 
        margin: '0 auto', 
        padding: '2rem 1.5rem',
        position: 'relative',
        zIndex: 1
      }}>
        {/* Header */}
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
            justifyContent: 'space-between',
            alignItems: 'center',
            flexWrap: 'wrap',
            gap: '1rem'
          }}>
            <div style={{display: 'flex', alignItems: 'center', gap: '1rem'}}>
              <Link href="/permissions" style={{color: '#6b7280', display: 'flex'}}>
                <ArrowLeftIcon style={{width: '1.25rem', height: '1.25rem'}} />
              </Link>
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
                <ShieldCheckIcon style={{width: '2rem', height: '2rem', color: 'white'}} />
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
                  Quản lý quyền hạn
                </h1>
                <p style={{
                  fontSize: '1rem',
                  color: '#64748b',
                  margin: '0.25rem 0 0 0',
                  fontWeight: 500
                }}>
                  Cấu hình chi tiết quyền hạn cho {user.name}
                </p>
              </div>
            </div>

            {hasChanges && (
              <div style={{display: 'flex', gap: '1rem', flexWrap: 'wrap'}}>
                <button
                  onClick={() => window.location.reload()}
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    padding: '0.875rem 1.5rem',
                    borderRadius: '0.75rem',
                    border: '1px solid #e2e8f0',
                    background: 'white',
                    color: '#374151',
                    fontSize: '0.875rem',
                    fontWeight: 600,
                    cursor: 'pointer',
                    transition: 'all 0.2s ease'
                  }}
                >
                  Hủy bỏ
                </button>
                <button
                  onClick={handleSave}
                  disabled={isSubmitting}
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    background: isSubmitting 
                      ? 'linear-gradient(135deg, #9ca3af 0%, #6b7280 100%)' 
                      : 'linear-gradient(135deg, #8b5cf6 0%, #7c3aed 100%)',
                    color: 'white',
                    padding: '0.875rem 1.5rem',
                    borderRadius: '0.75rem',
                    border: 'none',
                    fontSize: '0.875rem',
                    fontWeight: 600,
                    cursor: isSubmitting ? 'not-allowed' : 'pointer',
                    transition: 'all 0.2s ease',
                    boxShadow: '0 4px 12px rgba(139, 92, 246, 0.3)',
                    gap: '0.5rem'
                  }}
                >
                  {isSubmitting ? (
                    <>
                      <div style={{
                        width: '1rem',
                        height: '1rem',
                        border: '2px solid rgba(255, 255, 255, 0.3)',
                        borderTop: '2px solid white',
                        borderRadius: '50%',
                        animation: 'spin 1s linear infinite'
                      }} />
                      Đang lưu...
                    </>
                  ) : (
                    <>
                      <CheckCircleIcon style={{width: '1rem', height: '1rem'}} />
                      Lưu thay đổi
                    </>
                  )}
                </button>
              </div>
            )}
          </div>
        </div>

        {/* User Info Card */}
        <div style={{
          background: 'linear-gradient(135deg, #ffffff 0%, #f8fafc 100%)',
          borderRadius: '1.5rem',
          padding: '2rem',
          marginBottom: '2rem',
          boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.1)',
          border: '1px solid rgba(255, 255, 255, 0.2)'
        }}>
          <div style={{display: 'flex', alignItems: 'center', gap: '1rem'}}>
            <div style={{
              width: '4rem',
              height: '4rem',
              borderRadius: '50%',
              background: 'linear-gradient(135deg, #8b5cf6 0%, #7c3aed 100%)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: '0 4px 12px rgba(139, 92, 246, 0.3)'
            }}>
              <UserCircleIcon style={{width: '2rem', height: '2rem', color: 'white'}} />
            </div>
            <div>
              <h3 style={{fontSize: '1.25rem', fontWeight: 600, color: '#111827', margin: '0 0 0.25rem 0'}}>
                {user.name}
              </h3>
              <p style={{fontSize: '0.875rem', color: '#6b7280', margin: '0 0 0.25rem 0'}}>
                {user.email}
              </p>
              <div style={{display: 'flex', gap: '0.5rem', alignItems: 'center'}}>
                <span style={{
                  display: 'inline-flex',
                  padding: '0.25rem 0.75rem',
                  fontSize: '0.75rem',
                  fontWeight: 600,
                  borderRadius: '9999px',
                  background: 'linear-gradient(135deg, #f0f9ff 0%, #dbeafe 100%)',
                  color: '#1e40af',
                  border: '1px solid #93c5fd'
                }}>
                  {user.role}
                </span>
                <span style={{
                  display: 'inline-flex',
                  padding: '0.25rem 0.75rem',
                  fontSize: '0.75rem',
                  fontWeight: 600,
                  borderRadius: '9999px',
                  background: 'linear-gradient(135deg, #f0fdf4 0%, #dcfce7 100%)',
                  color: '#15803d',
                  border: '1px solid #a3e635'
                }}>
                  {user.department}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Permissions Matrix */}
        <div style={{
          background: 'linear-gradient(135deg, #ffffff 0%, #f8fafc 100%)',
          borderRadius: '1.5rem',
          boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.1)',
          border: '1px solid rgba(255, 255, 255, 0.2)',
          overflow: 'hidden'
        }}>
          <div style={{
            background: 'linear-gradient(135deg, #f8fafc 0%, #e2e8f0 100%)',
            padding: '1.5rem 2rem',
            borderBottom: '1px solid rgba(255, 255, 255, 0.2)'
          }}>
            <h3 style={{
              fontSize: '1.25rem',
              fontWeight: 600,
              color: '#111827',
              margin: 0,
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem'
            }}>
              <LockClosedIcon style={{width: '1.25rem', height: '1.25rem', color: '#8b5cf6'}} />
              Ma trận phân quyền chi tiết
            </h3>
          </div>

          <div style={{padding: '2rem'}}>
            <div style={{
              display: 'grid',
              gap: '2rem'
            }}>
              {modules.map((module) => {
                const modulePermissions = userPermissions[module.id] || {};
                const IconComponent = module.icon;
                
                return (
                  <div key={module.id} style={{
                    border: '1px solid #e2e8f0',
                    borderRadius: '1rem',
                    padding: '1.5rem',
                    background: 'linear-gradient(135deg, #ffffff 0%, #f8fafc 100%)'
                  }}>
                    <div style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'flex-start',
                      marginBottom: '1.5rem',
                      flexWrap: 'wrap',
                      gap: '1rem'
                    }}>
                      <div style={{display: 'flex', alignItems: 'center', gap: '1rem'}}>
                        <div style={{
                          width: '3rem',
                          height: '3rem',
                          borderRadius: '0.75rem',
                          background: 'linear-gradient(135deg, #8b5cf6 0%, #7c3aed 100%)',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          boxShadow: '0 4px 12px rgba(139, 92, 246, 0.3)'
                        }}>
                          <IconComponent style={{width: '1.5rem', height: '1.5rem', color: 'white'}} />
                        </div>
                        <div>
                          <h4 style={{fontSize: '1.125rem', fontWeight: 600, color: '#111827', margin: '0 0 0.25rem 0'}}>
                            {module.name}
                          </h4>
                          <p style={{fontSize: '0.875rem', color: '#6b7280', margin: 0}}>
                            {module.description}
                          </p>
                        </div>
                      </div>
                      
                      <div style={{display: 'flex', gap: '0.5rem'}}>
                        <button
                          onClick={() => handleSelectAll(module.id, true)}
                          style={{
                            padding: '0.5rem 1rem',
                            borderRadius: '0.5rem',
                            border: 'none',
                            background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
                            color: 'white',
                            fontSize: '0.75rem',
                            fontWeight: 600,
                            cursor: 'pointer',
                            transition: 'all 0.2s ease',
                            boxShadow: '0 2px 4px rgba(16, 185, 129, 0.3)'
                          }}
                        >
                          <LockOpenIcon style={{width: '0.875rem', height: '0.875rem', marginRight: '0.25rem', display: 'inline'}} />
                          Cho phép tất cả
                        </button>
                        <button
                          onClick={() => handleSelectAll(module.id, false)}
                          style={{
                            padding: '0.5rem 1rem',
                            borderRadius: '0.5rem',
                            border: 'none',
                            background: 'linear-gradient(135deg, #ef4444 0%, #dc2626 100%)',
                            color: 'white',
                            fontSize: '0.75rem',
                            fontWeight: 600,
                            cursor: 'pointer',
                            transition: 'all 0.2s ease',
                            boxShadow: '0 2px 4px rgba(239, 68, 68, 0.3)'
                          }}
                        >
                          <LockClosedIcon style={{width: '0.875rem', height: '0.875rem', marginRight: '0.25rem', display: 'inline'}} />
                          Khóa tất cả
                        </button>
                      </div>
                    </div>
                    
                    <div style={{
                      display: 'grid',
                      gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
                      gap: '1rem'
                    }}>
                      {permissions.map((permission) => {
                        const PermissionIcon = permission.icon;
                        const isEnabled = modulePermissions[permission.id] || false;
                        
                        return (
                          <label
                            key={permission.id}
                            style={{
                              display: 'flex',
                              alignItems: 'center',
                              gap: '0.75rem',
                              padding: '1rem',
                              borderRadius: '0.75rem',
                              border: '1px solid #e2e8f0',
                              background: isEnabled ? 'rgba(139, 92, 246, 0.1)' : 'white',
                              cursor: 'pointer',
                              transition: 'all 0.2s ease',
                              boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)'
                            }}
                          >
                            <input
                              type="checkbox"
                              checked={isEnabled}
                              onChange={(e) => handlePermissionChange(module.id, permission.id, e.target.checked)}
                              style={{
                                width: '1.25rem',
                                height: '1.25rem',
                                accentColor: permission.color
                              }}
                            />
                            <div style={{display: 'flex', alignItems: 'center', gap: '0.5rem'}}>
                              <PermissionIcon style={{
                                width: '1rem', 
                                height: '1rem', 
                                color: isEnabled ? permission.color : '#9ca3af'
                              }} />
                              <span style={{
                                fontSize: '0.875rem',
                                fontWeight: 500,
                                color: isEnabled ? permission.color : '#6b7280'
                              }}>
                                {permission.name}
                              </span>
                            </div>
                          </label>
                        );
                      })}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Success Message */}
        {showSuccess && (
          <div style={{
            position: 'fixed',
            top: '2rem',
            right: '2rem',
            background: 'linear-gradient(135deg, #ecfdf5 0%, #d1fae5 100%)',
            border: '1px solid #86efac',
            borderRadius: '1rem',
            padding: '1rem 1.5rem',
            boxShadow: '0 10px 25px -5px rgba(34, 197, 94, 0.3)',
            zIndex: 1000,
            animation: 'slideIn 0.3s ease-out'
          }}>
            <div style={{display: 'flex', alignItems: 'center', gap: '0.75rem'}}>
              <CheckCircleIcon style={{width: '1.25rem', height: '1.25rem', color: '#16a34a'}} />
              <span style={{fontSize: '0.875rem', fontWeight: 600, color: '#166534'}}>
                Cập nhật quyền hạn thành công!
              </span>
            </div>
          </div>
        )}
      </div>

      {/* CSS Animations */}
      <style jsx>{`
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
        
        @keyframes slideIn {
          0% { transform: translateX(100%); opacity: 0; }
          100% { transform: translateX(0); opacity: 1; }
        }
      `}</style>
    </div>
  );
} 