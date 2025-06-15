"use client";

import { useState } from 'react';
import Link from 'next/link';
import { 
  DocumentTextIcon, 
  DocumentChartBarIcon,
  ArrowDownTrayIcon,
  CalendarIcon,
  FunnelIcon, 
  MagnifyingGlassIcon,
  EyeIcon,
  PencilIcon,
  ChartBarIcon
} from '@heroicons/react/24/outline';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/contexts/auth-context';
import { useEffect } from 'react';

// Mock report data
const reports = [
  { 
    id: 1, 
    title: 'Báo cáo hoạt động hàng ngày', 
    description: 'Tổng quan về các hoạt động của cư dân trong ngày',
    category: 'Hoạt động', 
    generatedAt: '2023-05-10',
    format: 'PDF',
    size: '2.4 MB',
    author: 'David Wilson'
  },
  { 
    id: 2, 
    title: 'Báo cáo sức khỏe tháng 5', 
    description: 'Thống kê chi tiết sức khỏe tất cả cư dân',
    category: 'Y tế', 
    generatedAt: '2023-05-08',
    format: 'XLSX',
    size: '4.7 MB',
    author: 'Sarah Johnson'
  },
  { 
    id: 3, 
    title: 'Báo cáo tài chính Quý 2', 
    description: 'Báo cáo chi tiết thu chi và ngân sách',
    category: 'Tài chính', 
    generatedAt: '2023-04-30',
    format: 'PDF',
    size: '3.2 MB',
    author: 'Michael Brown'
  },
  { 
    id: 4, 
    title: 'Thống kê thuốc men tháng 4', 
    description: 'Danh sách thuốc đã sử dụng và còn tồn kho',
    category: 'Y tế', 
    generatedAt: '2023-04-28',
    format: 'XLSX',
    size: '1.8 MB',
    author: 'Emily Davis'
  },
  { 
    id: 5, 
    title: 'Báo cáo nhân sự Quý 2', 
    description: 'Đánh giá hiệu suất nhân viên và biểu đồ ca làm việc',
    category: 'Nhân sự', 
    generatedAt: '2023-04-25',
    format: 'PDF',
    size: '5.1 MB',
    author: 'Robert Johnson'
  },
];

const categories = ['Tất cả', 'Hoạt động', 'Y tế', 'Tài chính', 'Nhân sự'];

export default function ReportsPage() {
  const router = useRouter();
  const { user } = useAuth();
  
  // Check access permissions
  useEffect(() => {
    if (!user) {
      router.push('/login');
      return;
    }
    
    if (!['admin', 'staff'].includes(user.role)) {
      router.push('/');
      return;
    }
  }, [user, router]);
  
  const [searchTerm, setSearchTerm] = useState('');
  const [filterCategory, setFilterCategory] = useState('Tất cả');
  
  // Filter reports based on search term and category
  const filteredReports = reports.filter((report) => {
    const matchesSearch = report.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         report.description.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesCategory = filterCategory === 'Tất cả' || report.category === filterCategory;
    
    return matchesSearch && matchesCategory;
  });
  
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
          radial-gradient(circle at 20% 80%, rgba(59, 130, 246, 0.05) 0%, transparent 50%),
          radial-gradient(circle at 80% 20%, rgba(16, 185, 129, 0.05) 0%, transparent 50%),
          radial-gradient(circle at 40% 40%, rgba(139, 92, 246, 0.03) 0%, transparent 50%)
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
                background: 'linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%)',
                borderRadius: '1rem',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                boxShadow: '0 4px 12px rgba(59, 130, 246, 0.3)'
              }}>
                <ChartBarIcon style={{width: '2rem', height: '2rem', color: 'white'}} />
              </div>
              <div>
                <h1 style={{
                  fontSize: '2rem', 
                  fontWeight: 700, 
                  margin: 0,
                  background: 'linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%)',
                  WebkitBackgroundClip: 'text',
                  WebkitTextFillColor: 'transparent',
                  letterSpacing: '-0.025em'
                }}>
                  Báo cáo & Thống kê
                </h1>
                <p style={{
                  fontSize: '1rem',
                  color: '#64748b',
                  margin: '0.25rem 0 0 0',
                  fontWeight: 500
                }}>
                  Quản lý và theo dõi các báo cáo hệ thống
                </p>
              </div>
            </div>
            
          <Link 
            href="/reports/generate" 
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              background: 'linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%)',
              color: 'white',
              padding: '0.875rem 1.5rem',
              borderRadius: '0.75rem',
              textDecoration: 'none',
              fontWeight: 600,
              fontSize: '0.875rem',
              boxShadow: '0 4px 12px rgba(59, 130, 246, 0.3)',
              transition: 'all 0.3s ease',
              whiteSpace: 'nowrap'
            }}
            onMouseOver={(e) => {
              e.currentTarget.style.transform = 'translateY(-2px)';
              e.currentTarget.style.boxShadow = '0 8px 20px rgba(59, 130, 246, 0.4)';
            }}
            onMouseOut={(e) => {
              e.currentTarget.style.transform = 'translateY(0)';
              e.currentTarget.style.boxShadow = '0 4px 12px rgba(59, 130, 246, 0.3)';
            }}
          >
            <DocumentChartBarIcon style={{width: '1.125rem', height: '1.125rem', marginRight: '0.5rem'}} />
            Tạo báo cáo mới
          </Link>
        </div>
      </div>
      
        {/* Main Content */}
        <div style={{
          background: 'linear-gradient(135deg, #ffffff 0%, #f8fafc 100%)',
          borderRadius: '1.5rem',
          boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.1)',
          border: '1px solid rgba(255, 255, 255, 0.2)',
          overflow: 'hidden'
        }}>
          {/* Filters */}
          <div style={{
            background: 'linear-gradient(135deg, #f8fafc 0%, #e2e8f0 100%)',
            padding: '1.5rem 2rem',
            borderBottom: '1px solid rgba(255, 255, 255, 0.2)'
        }}>
          <div style={{
            display: 'flex',
            flexWrap: 'wrap', 
            alignItems: 'center', 
              gap: '1.5rem'
            }}>
              <div style={{flex: '1', minWidth: '20rem'}}>
                <div style={{position: 'relative'}}>
                  <div style={{
                    position: 'absolute', 
                    top: 0, 
                    bottom: 0, 
                    left: '1rem', 
                    display: 'flex', 
                    alignItems: 'center', 
                    pointerEvents: 'none'
                  }}>
                    <MagnifyingGlassIcon style={{width: '1.125rem', height: '1.125rem', color: '#9ca3af'}} />
              </div>
              <input
                type="text"
                placeholder="Tìm kiếm báo cáo..."
                style={{
                  width: '100%',
                      paddingLeft: '2.75rem',
                      paddingRight: '1rem',
                      paddingTop: '0.75rem',
                      paddingBottom: '0.75rem',
                      borderRadius: '0.75rem',
                      border: '1px solid #e2e8f0',
                      fontSize: '0.875rem',
                      background: 'white',
                      transition: 'all 0.2s ease',
                      boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)'
                }}
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                    onFocus={(e) => {
                      e.currentTarget.style.borderColor = '#3b82f6';
                      e.currentTarget.style.boxShadow = '0 0 0 3px rgba(59, 130, 246, 0.1)';
                    }}
                    onBlur={(e) => {
                      e.currentTarget.style.borderColor = '#e2e8f0';
                      e.currentTarget.style.boxShadow = '0 1px 3px rgba(0, 0, 0, 0.1)';
                    }}
                  />
                </div>
            </div>
          
              <div style={{display: 'flex', alignItems: 'center', gap: '0.75rem', flexWrap: 'wrap'}}>
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.5rem',
                  padding: '0.5rem 1rem',
                  background: 'rgba(59, 130, 246, 0.1)',
                  borderRadius: '0.5rem'
                }}>
                  <FunnelIcon style={{width: '1.125rem', height: '1.125rem', color: '#3b82f6'}} />
                  <span style={{fontSize: '0.875rem', fontWeight: 500, color: '#3b82f6'}}>
                    Lọc
                  </span>
                </div>
              <select
                style={{
                    padding: '0.75rem 1rem',
                    borderRadius: '0.75rem',
                    border: '1px solid #e2e8f0',
                    fontSize: '0.875rem',
                    background: 'white',
                    fontWeight: 500,
                    minWidth: '12rem',
                    boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)',
                    transition: 'all 0.2s ease'
                }}
                value={filterCategory}
                onChange={(e) => setFilterCategory(e.target.value)}
                  onFocus={(e) => {
                    e.currentTarget.style.borderColor = '#3b82f6';
                    e.currentTarget.style.boxShadow = '0 0 0 3px rgba(59, 130, 246, 0.1)';
                  }}
                  onBlur={(e) => {
                    e.currentTarget.style.borderColor = '#e2e8f0';
                    e.currentTarget.style.boxShadow = '0 1px 3px rgba(0, 0, 0, 0.1)';
                  }}
              >
                {categories.map((category) => (
                    <option key={category} value={category}>
                      {category === 'Tất cả' ? 'Tất cả loại báo cáo' : `Báo cáo ${category}`}
                    </option>
                ))}
              </select>
            </div>
          </div>
        </div>
        
          {/* Reports Table */}
        <div style={{overflowX: 'auto'}}>
          <table style={{minWidth: '100%', borderCollapse: 'separate', borderSpacing: 0}}>
              <thead>
                <tr style={{
                  background: 'linear-gradient(135deg, #f8fafc 0%, #e2e8f0 100%)'
                }}>
                  <th style={{
                    padding: '1rem 2rem', 
                    textAlign: 'left', 
                    fontSize: '0.75rem', 
                    fontWeight: 600, 
                    color: '#374151', 
                    textTransform: 'uppercase', 
                    letterSpacing: '0.05em',
                    borderBottom: '1px solid #e2e8f0',
                    whiteSpace: 'nowrap'
                  }}>
                    Tiêu đề
                  </th>
                  <th style={{
                    padding: '1rem 2rem', 
                    textAlign: 'left', 
                    fontSize: '0.75rem', 
                    fontWeight: 600, 
                    color: '#374151', 
                    textTransform: 'uppercase', 
                    letterSpacing: '0.05em',
                    borderBottom: '1px solid #e2e8f0',
                    whiteSpace: 'nowrap'
                  }}>
                    Loại
                  </th>
                  <th style={{
                    padding: '1rem 2rem', 
                    textAlign: 'left', 
                    fontSize: '0.75rem', 
                    fontWeight: 600, 
                    color: '#374151', 
                    textTransform: 'uppercase', 
                    letterSpacing: '0.05em',
                    borderBottom: '1px solid #e2e8f0',
                    whiteSpace: 'nowrap'
                  }}>
                    Ngày tạo
                  </th>
                  <th style={{
                    padding: '1rem 2rem', 
                    textAlign: 'left', 
                    fontSize: '0.75rem', 
                    fontWeight: 600, 
                    color: '#374151', 
                    textTransform: 'uppercase', 
                    letterSpacing: '0.05em',
                    borderBottom: '1px solid #e2e8f0',
                    whiteSpace: 'nowrap'
                  }}>
                    Định dạng
                  </th>
                  <th style={{
                    padding: '1rem 2rem', 
                    textAlign: 'left', 
                    fontSize: '0.75rem', 
                    fontWeight: 600, 
                    color: '#374151', 
                    textTransform: 'uppercase', 
                    letterSpacing: '0.05em',
                    borderBottom: '1px solid #e2e8f0',
                    whiteSpace: 'nowrap'
                  }}>
                    Kích thước
                  </th>
                  <th style={{
                    padding: '1rem 2rem', 
                    textAlign: 'left', 
                    fontSize: '0.75rem', 
                    fontWeight: 600, 
                    color: '#374151', 
                    textTransform: 'uppercase', 
                    letterSpacing: '0.05em',
                    borderBottom: '1px solid #e2e8f0',
                    whiteSpace: 'nowrap'
                  }}>
                    Tác giả
                  </th>
                  <th style={{
                    padding: '1rem 2rem', 
                    textAlign: 'left', 
                    fontSize: '0.75rem', 
                    fontWeight: 600, 
                    color: '#374151', 
                    textTransform: 'uppercase', 
                    letterSpacing: '0.05em',
                    borderBottom: '1px solid #e2e8f0',
                    whiteSpace: 'nowrap'
                  }}>
                    Thao tác
                  </th>
              </tr>
            </thead>
              <tbody>
                {filteredReports.map((report, index) => (
                  <tr 
                    key={report.id} 
                    style={{
                      borderBottom: index !== filteredReports.length - 1 ? '1px solid #f1f5f9' : 'none',
                      transition: 'all 0.2s ease'
                    }}
                    onMouseOver={(e) => {
                      e.currentTarget.style.backgroundColor = '#f8fafc';
                    }}
                    onMouseOut={(e) => {
                      e.currentTarget.style.backgroundColor = 'transparent';
                    }}
                  >
                    <td style={{
                      padding: '1.25rem 2rem', 
                      fontSize: '0.875rem', 
                      fontWeight: 600, 
                      color: '#111827'
                    }}>
                      <div style={{marginBottom: '0.25rem'}}>
                        {report.title}
                      </div>
                      <div style={{
                        fontSize: '0.75rem',
                        color: '#6b7280',
                        fontWeight: 400
                      }}>
                        {report.description}
                      </div>
                  </td>
                    <td style={{padding: '1.25rem 2rem'}}>
                      <span style={{
                        display: 'inline-flex', 
                        padding: '0.375rem 0.875875rem', 
                        fontSize: '0.75rem', 
                        fontWeight: 600, 
                        borderRadius: '9999px',
                        background: 
                          report.category === 'Hoạt động' 
                            ? 'linear-gradient(135deg, #dbeafe 0%, #bfdbfe 100%)' : 
                          report.category === 'Y tế' 
                            ? 'linear-gradient(135deg, #dcfce7 0%, #bbf7d0 100%)' :
                          report.category === 'Tài chính' 
                            ? 'linear-gradient(135deg, #fef3c7 0%, #fde68a 100%)' :
                            'linear-gradient(135deg, #e0e7ff 0%, #c7d2fe 100%)',
                        color: 
                          report.category === 'Hoạt động' ? '#1e40af' : 
                          report.category === 'Y tế' ? '#166534' :
                          report.category === 'Tài chính' ? '#92400e' :
                          '#4338ca',
                        border: '1px solid',
                        borderColor: 
                          report.category === 'Hoạt động' ? '#93c5fd' : 
                          report.category === 'Y tế' ? '#86efac' :
                          report.category === 'Tài chính' ? '#fbbf24' :
                          '#a5b4fc',
                        whiteSpace: 'nowrap'
                      }}>
                        {report.category}
                      </span>
                    </td>
                    <td style={{
                      padding: '1.25rem 2rem', 
                      fontSize: '0.875rem', 
                      color: '#6b7280',
                      fontWeight: 500,
                      whiteSpace: 'nowrap'
                    }}>
                      <div style={{display: 'flex', alignItems: 'center', gap: '0.5rem'}}>
                        <CalendarIcon style={{width: '1rem', height: '1rem', color: '#9ca3af'}} />
                        {new Date(report.generatedAt).toLocaleDateString('vi-VN')}
                      </div>
                    </td>
                    <td style={{
                      padding: '1.25rem 2rem', 
                      fontSize: '0.875rem', 
                      color: '#6b7280',
                      fontWeight: 500,
                      whiteSpace: 'nowrap'
                    }}>
                      <span style={{
                        display: 'inline-flex',
                        padding: '0.25rem 0.5rem',
                        borderRadius: '0.375rem',
                        fontSize: '0.75rem',
                        fontWeight: 600,
                        background: report.format === 'PDF' ? '#fef2f2' : '#f0f9ff',
                        color: report.format === 'PDF' ? '#dc2626' : '#2563eb',
                        whiteSpace: 'nowrap'
                      }}>
                        {report.format}
                      </span>
                    </td>
                    <td style={{
                      padding: '1.25rem 2rem', 
                      fontSize: '0.875rem', 
                      color: '#6b7280',
                      fontWeight: 500,
                      whiteSpace: 'nowrap'
                    }}>
                      {report.size}
                    </td>
                    <td style={{
                      padding: '1.25rem 2rem', 
                      fontSize: '0.875rem', 
                      color: '#6b7280',
                      fontWeight: 500,
                      whiteSpace: 'nowrap'
                    }}>
                      {report.author}
                    </td>
                    <td style={{padding: '1.25rem 2rem'}}>
                      <div style={{display: 'flex', gap: '0.5rem'}}>
                        <Link 
                          href={`/reports/${report.id}`} 
                          style={{
                            padding: '0.5rem',
                            borderRadius: '0.5rem',
                            background: 'linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%)',
                            color: 'white',
                            textDecoration: 'none',
                            transition: 'all 0.2s ease',
                            boxShadow: '0 2px 4px rgba(59, 130, 246, 0.3)',
                            display: 'inline-flex',
                            alignItems: 'center',
                            justifyContent: 'center'
                          }}
                          onMouseOver={(e) => {
                            e.currentTarget.style.transform = 'scale(1.05)';
                            e.currentTarget.style.boxShadow = '0 4px 8px rgba(59, 130, 246, 0.4)';
                          }}
                          onMouseOut={(e) => {
                            e.currentTarget.style.transform = 'scale(1)';
                            e.currentTarget.style.boxShadow = '0 2px 4px rgba(59, 130, 246, 0.3)';
                          }}
                        >
                          <EyeIcon style={{width: '1rem', height: '1rem'}} />
                      </Link>
                      <button 
                        style={{
                            padding: '0.5rem',
                            borderRadius: '0.5rem',
                          border: 'none',
                            background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
                            color: 'white',
                            cursor: 'pointer',
                            transition: 'all 0.2s ease',
                            boxShadow: '0 2px 4px rgba(16, 185, 129, 0.3)'
                          }}
                          onMouseOver={(e) => {
                            e.currentTarget.style.transform = 'scale(1.05)';
                            e.currentTarget.style.boxShadow = '0 4px 8px rgba(16, 185, 129, 0.4)';
                          }}
                          onMouseOut={(e) => {
                            e.currentTarget.style.transform = 'scale(1)';
                            e.currentTarget.style.boxShadow = '0 2px 4px rgba(16, 185, 129, 0.3)';
                        }}
                      >
                        <ArrowDownTrayIcon style={{width: '1rem', height: '1rem'}} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
                {filteredReports.length === 0 && (
                  <tr>
                    <td 
                      colSpan={7} 
                      style={{
                        padding: '3rem', 
                        textAlign: 'center', 
                        color: '#6b7280',
                        fontSize: '1rem',
                        fontWeight: 500
                      }}
                    >
                      <div style={{
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        gap: '1rem'
                      }}>
                        <ChartBarIcon style={{width: '3rem', height: '3rem', color: '#d1d5db'}} />
                        Không tìm thấy báo cáo phù hợp với tìm kiếm của bạn
                      </div>
                    </td>
                  </tr>
                )}
            </tbody>
          </table>
        </div>
          </div>
      </div>
    </div>
  );
} 
