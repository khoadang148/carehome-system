"use client";

import { useState } from 'react';
import Link from 'next/link';
import { 
  DocumentTextIcon, 
  DocumentChartBarIcon,
  ArrowDownTrayIcon,
  CalendarIcon,
  FunnelIcon, 
  MagnifyingGlassIcon
} from '@heroicons/react/24/outline';

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
    <div style={{maxWidth: '1400px', margin: '0 auto'}}>
      <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem'}}>
        <h1 style={{fontSize: '1.5rem', fontWeight: 600, margin: 0}}>Báo cáo</h1>
        <div style={{display: 'flex', gap: '1rem'}}>
          <Link 
            href="/reports/generate" 
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
            <DocumentChartBarIcon style={{width: '1rem', height: '1rem', marginRight: '0.375rem'}} />
            Tạo báo cáo mới
          </Link>
        </div>
      </div>
      
      <div style={{backgroundColor: 'white', borderRadius: '0.5rem', boxShadow: '0 1px 3px rgba(0,0,0,0.05)', padding: '1.5rem'}}>
        <div style={{
          display: 'flex', 
          flexDirection: 'column', 
          gap: '1rem', 
          marginBottom: '1.5rem'
        }}>
          <div style={{
            display: 'flex',
            flexWrap: 'wrap', 
            alignItems: 'center', 
            justifyContent: 'space-between',
            gap: '1rem'
          }}>
            <div style={{position: 'relative', width: '100%', maxWidth: '20rem'}}>
              <div style={{position: 'absolute', top: 0, bottom: 0, left: '0.75rem', display: 'flex', alignItems: 'center', pointerEvents: 'none'}}>
                <MagnifyingGlassIcon style={{width: '1rem', height: '1rem', color: '#9ca3af'}} />
              </div>
              <input
                type="text"
                placeholder="Tìm kiếm báo cáo..."
                style={{
                  width: '100%',
                  paddingLeft: '2.25rem',
                  paddingRight: '0.75rem',
                  paddingTop: '0.5rem',
                  paddingBottom: '0.5rem',
                  borderRadius: '0.375rem',
                  border: '1px solid #e5e7eb',
                  fontSize: '0.875rem'
                }}
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
          
            <div style={{display: 'flex', alignItems: 'center', gap: '0.5rem'}}>
              <FunnelIcon style={{width: '1rem', height: '1rem', color: '#9ca3af'}} />
              <select
                style={{
                  padding: '0.5rem 0.75rem',
                  borderRadius: '0.375rem',
                  border: '1px solid #e5e7eb',
                  fontSize: '0.875rem'
                }}
                value={filterCategory}
                onChange={(e) => setFilterCategory(e.target.value)}
              >
                {categories.map((category) => (
                  <option key={category} value={category}>{category === 'Tất cả' ? 'Tất cả loại báo cáo' : `Báo cáo ${category}`}</option>
                ))}
              </select>
            </div>
          </div>
        </div>
        
        <div style={{overflowX: 'auto'}}>
          <table style={{minWidth: '100%', borderCollapse: 'separate', borderSpacing: 0}}>
            <thead style={{backgroundColor: '#f9fafb'}}>
              <tr>
                <th style={{padding: '0.75rem 1.5rem', textAlign: 'left', fontSize: '0.75rem', fontWeight: 500, color: '#6b7280', textTransform: 'uppercase', letterSpacing: '0.05em'}}>Tiêu đề</th>
                <th style={{padding: '0.75rem 1.5rem', textAlign: 'left', fontSize: '0.75rem', fontWeight: 500, color: '#6b7280', textTransform: 'uppercase', letterSpacing: '0.05em'}}>Loại</th>
                <th style={{padding: '0.75rem 1.5rem', textAlign: 'left', fontSize: '0.75rem', fontWeight: 500, color: '#6b7280', textTransform: 'uppercase', letterSpacing: '0.05em'}}>Ngày tạo</th>
                <th style={{padding: '0.75rem 1.5rem', textAlign: 'left', fontSize: '0.75rem', fontWeight: 500, color: '#6b7280', textTransform: 'uppercase', letterSpacing: '0.05em'}}>Định dạng</th>
                <th style={{padding: '0.75rem 1.5rem', textAlign: 'left', fontSize: '0.75rem', fontWeight: 500, color: '#6b7280', textTransform: 'uppercase', letterSpacing: '0.05em'}}>Kích thước</th>
                <th style={{padding: '0.75rem 1.5rem', textAlign: 'left', fontSize: '0.75rem', fontWeight: 500, color: '#6b7280', textTransform: 'uppercase', letterSpacing: '0.05em'}}>Tác giả</th>
                <th style={{padding: '0.75rem 1.5rem', textAlign: 'left', fontSize: '0.75rem', fontWeight: 500, color: '#6b7280', textTransform: 'uppercase', letterSpacing: '0.05em'}}>Thao tác</th>
              </tr>
            </thead>
            <tbody style={{backgroundColor: 'white'}}>
              {filteredReports.map((report) => (
                <tr key={report.id} style={{borderBottom: '1px solid #e5e7eb'}}>
                  <td style={{padding: '1rem 1.5rem'}}>
                    <div style={{fontWeight: 500, color: '#111827'}}>{report.title}</div>
                    <div style={{fontSize: '0.75rem', color: '#6b7280', marginTop: '0.25rem'}}>{report.description}</div>
                  </td>
                  <td style={{padding: '1rem 1.5rem', whiteSpace: 'nowrap'}}>
                    <span style={{
                      display: 'inline-flex', 
                      padding: '0.25rem 0.75rem', 
                      fontSize: '0.75rem', 
                      fontWeight: 500, 
                      borderRadius: '9999px',
                      backgroundColor: 
                        report.category === 'Hoạt động' ? '#dbeafe' : 
                        report.category === 'Y tế' ? '#dcfce7' :
                        report.category === 'Tài chính' ? '#fef3c7' :
                        '#e0e7ff',
                      color: 
                        report.category === 'Hoạt động' ? '#1e40af' : 
                        report.category === 'Y tế' ? '#166534' :
                        report.category === 'Tài chính' ? '#92400e' :
                        '#4338ca'
                    }}>
                      {report.category}
                    </span>
                  </td>
                  <td style={{padding: '1rem 1.5rem', whiteSpace: 'nowrap', fontSize: '0.875rem', color: '#6b7280'}}>
                    <div style={{display: 'flex', alignItems: 'center', gap: '0.5rem'}}>
                      <CalendarIcon style={{width: '1rem', height: '1rem', color: '#9ca3af'}} />
                      {report.generatedAt}
                    </div>
                  </td>
                  <td style={{padding: '1rem 1.5rem', whiteSpace: 'nowrap', fontSize: '0.875rem', color: '#6b7280'}}>{report.format}</td>
                  <td style={{padding: '1rem 1.5rem', whiteSpace: 'nowrap', fontSize: '0.875rem', color: '#6b7280'}}>{report.size}</td>
                  <td style={{padding: '1rem 1.5rem', whiteSpace: 'nowrap', fontSize: '0.875rem', color: '#6b7280'}}>{report.author}</td>
                  <td style={{padding: '1rem 1.5rem', whiteSpace: 'nowrap', fontSize: '0.875rem', color: '#6b7280'}}>
                    <div style={{display: 'flex', alignItems: 'center', gap: '1rem'}}>
                      <Link href={`/reports/${report.id}`} style={{color: '#2563eb', display: 'flex', alignItems: 'center'}}>
                        <DocumentTextIcon style={{width: '1rem', height: '1rem'}} />
                      </Link>
                      <button 
                        style={{
                          color: '#16a34a', 
                          display: 'flex', 
                          alignItems: 'center',
                          backgroundColor: 'transparent',
                          border: 'none',
                          padding: 0,
                          cursor: 'pointer'
                        }}
                      >
                        <ArrowDownTrayIcon style={{width: '1rem', height: '1rem'}} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        
        {filteredReports.length === 0 && (
          <div style={{textAlign: 'center', padding: '2rem 0'}}>
            <p style={{color: '#6b7280'}}>Không tìm thấy báo cáo phù hợp với tìm kiếm của bạn.</p>
          </div>
        )}
      </div>
    </div>
  );
} 