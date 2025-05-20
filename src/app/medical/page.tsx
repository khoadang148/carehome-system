"use client";

import { useState } from 'react';
import Link from 'next/link';
import { 
  MagnifyingGlassIcon, 
  FunnelIcon, 
  PlusCircleIcon,
  ClipboardDocumentListIcon,
  BeakerIcon,
  DocumentPlusIcon
} from '@heroicons/react/24/outline';

// Mock medical records data
const medicalRecords = [
  { 
    id: 1, 
    residentName: 'Alice Johnson', 
    recordType: 'Ghi chú y tế',
    date: '2023-05-10',
    doctor: 'Dr. Robert Brown',
    status: 'Cập nhật',
    notes: 'Kiểm tra huyết áp định kỳ. Kết quả: 130/85.'
  },
  { 
    id: 2, 
    residentName: 'Robert Smith', 
    recordType: 'Kê đơn thuốc',
    date: '2023-05-08',
    doctor: 'Dr. Sarah Williams',
    status: 'Đang xử lý',
    notes: 'Kê đơn thuốc Lisinopril 10mg hàng ngày để kiểm soát huyết áp.'
  },
  { 
    id: 3, 
    residentName: 'Mary Williams', 
    recordType: 'Báo cáo xét nghiệm',
    date: '2023-05-05',
    doctor: 'Dr. Robert Brown',
    status: 'Hoàn thành',
    notes: 'Kết quả xét nghiệm máu cho thấy mức cholesterol cao. Đã khuyến nghị thay đổi chế độ ăn.'
  },
  { 
    id: 4, 
    residentName: 'James Brown', 
    recordType: 'Kiểm tra sức khỏe',
    date: '2023-05-02',
    doctor: 'Dr. Elizabeth Wilson',
    status: 'Hoàn thành',
    notes: 'Kiểm tra sức khỏe tổng quát hàng năm. Tình trạng chung ổn định.'
  },
  { 
    id: 5, 
    residentName: 'Patricia Davis', 
    recordType: 'Ghi chú y tế',
    date: '2023-04-28',
    doctor: 'Dr. Sarah Williams',
    status: 'Cập nhật',
    notes: 'Ghi nhận triệu chứng đau khớp. Đã đề xuất dùng thuốc giảm đau và theo dõi.'
  },
];

const recordTypes = ['Tất cả', 'Ghi chú y tế', 'Kê đơn thuốc', 'Báo cáo xét nghiệm', 'Kiểm tra sức khỏe'];
const statuses = ['Tất cả', 'Hoàn thành', 'Đang xử lý', 'Cập nhật'];

export default function MedicalPage() {
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState('Tất cả');
  const [filterStatus, setFilterStatus] = useState('Tất cả');
  
  // Filter medical records based on search term, type and status
  const filteredRecords = medicalRecords.filter((record) => {
    const matchesSearch = record.residentName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          record.doctor.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          record.notes.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesType = filterType === 'Tất cả' || record.recordType === filterType;
    const matchesStatus = filterStatus === 'Tất cả' || record.status === filterStatus;
    
    return matchesSearch && matchesType && matchesStatus;
  });
  
  return (
    <div style={{maxWidth: '1400px', margin: '0 auto'}}>
      <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem'}}>
        <h1 style={{fontSize: '1.5rem', fontWeight: 600, margin: 0}}>Hồ sơ y tế</h1>
        <div style={{display: 'flex', gap: '1rem'}}>
          <Link 
            href="/medical/tests" 
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              backgroundColor: '#16a34a',
              color: 'white',
              padding: '0.5rem 1rem',
              borderRadius: '0.375rem',
              textDecoration: 'none',
              fontWeight: 500,
              fontSize: '0.875rem'
            }}
          >
            <BeakerIcon style={{width: '1rem', height: '1rem', marginRight: '0.375rem'}} />
            Quản lý xét nghiệm
          </Link>
          <Link 
            href="/medical/new" 
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
            Hồ sơ mới
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
                placeholder="Tìm kiếm hồ sơ y tế..."
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
          
            <div style={{display: 'flex', alignItems: 'center', gap: '1rem', flexWrap: 'wrap'}}>
              <div style={{display: 'flex', alignItems: 'center', gap: '0.5rem'}}>
                <FunnelIcon style={{width: '1rem', height: '1rem', color: '#9ca3af'}} />
                <select
                  style={{
                    padding: '0.5rem 0.75rem',
                    borderRadius: '0.375rem',
                    border: '1px solid #e5e7eb',
                    fontSize: '0.875rem'
                  }}
                  value={filterType}
                  onChange={(e) => setFilterType(e.target.value)}
                >
                  {recordTypes.map((type) => (
                    <option key={type} value={type}>{type}</option>
                  ))}
                </select>
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
                  value={filterStatus}
                  onChange={(e) => setFilterStatus(e.target.value)}
                >
                  {statuses.map((status) => (
                    <option key={status} value={status}>{status}</option>
                  ))}
                </select>
              </div>
            </div>
          </div>
        </div>
        
        <div style={{overflowX: 'auto'}}>
          <table style={{minWidth: '100%', borderCollapse: 'separate', borderSpacing: 0}}>
            <thead style={{backgroundColor: '#f9fafb'}}>
              <tr>
                <th style={{padding: '0.75rem 1.5rem', textAlign: 'left', fontSize: '0.75rem', fontWeight: 500, color: '#6b7280', textTransform: 'uppercase', letterSpacing: '0.05em'}}>Cư dân</th>
                <th style={{padding: '0.75rem 1.5rem', textAlign: 'left', fontSize: '0.75rem', fontWeight: 500, color: '#6b7280', textTransform: 'uppercase', letterSpacing: '0.05em'}}>Loại hồ sơ</th>
                <th style={{padding: '0.75rem 1.5rem', textAlign: 'left', fontSize: '0.75rem', fontWeight: 500, color: '#6b7280', textTransform: 'uppercase', letterSpacing: '0.05em'}}>Ngày</th>
                <th style={{padding: '0.75rem 1.5rem', textAlign: 'left', fontSize: '0.75rem', fontWeight: 500, color: '#6b7280', textTransform: 'uppercase', letterSpacing: '0.05em'}}>Bác sĩ</th>
                <th style={{padding: '0.75rem 1.5rem', textAlign: 'left', fontSize: '0.75rem', fontWeight: 500, color: '#6b7280', textTransform: 'uppercase', letterSpacing: '0.05em'}}>Trạng thái</th>
                <th style={{padding: '0.75rem 1.5rem', textAlign: 'left', fontSize: '0.75rem', fontWeight: 500, color: '#6b7280', textTransform: 'uppercase', letterSpacing: '0.05em'}}>Thao tác</th>
              </tr>
            </thead>
            <tbody style={{backgroundColor: 'white'}}>
              {filteredRecords.map((record) => (
                <tr key={record.id} style={{borderBottom: '1px solid #e5e7eb'}}>
                  <td style={{padding: '1rem 1.5rem', whiteSpace: 'nowrap', fontSize: '0.875rem', fontWeight: 500, color: '#111827'}}>{record.residentName}</td>
                  <td style={{padding: '1rem 1.5rem', whiteSpace: 'nowrap'}}>
                    <span style={{
                      display: 'inline-flex', 
                      padding: '0.25rem 0.75rem', 
                      fontSize: '0.75rem', 
                      fontWeight: 500, 
                      borderRadius: '9999px',
                      backgroundColor: 
                        record.recordType === 'Ghi chú y tế' ? '#dbeafe' : 
                        record.recordType === 'Kê đơn thuốc' ? '#dcfce7' :
                        record.recordType === 'Báo cáo xét nghiệm' ? '#fef3c7' : 
                        '#e0e7ff',
                      color: 
                        record.recordType === 'Ghi chú y tế' ? '#1e40af' : 
                        record.recordType === 'Kê đơn thuốc' ? '#166534' :
                        record.recordType === 'Báo cáo xét nghiệm' ? '#92400e' : 
                        '#4338ca'
                    }}>
                      {record.recordType}
                    </span>
                  </td>
                  <td style={{padding: '1rem 1.5rem', whiteSpace: 'nowrap', fontSize: '0.875rem', color: '#6b7280'}}>{record.date}</td>
                  <td style={{padding: '1rem 1.5rem', whiteSpace: 'nowrap', fontSize: '0.875rem', color: '#6b7280'}}>{record.doctor}</td>
                  <td style={{padding: '1rem 1.5rem', whiteSpace: 'nowrap'}}>
                    <span style={{
                      display: 'inline-flex', 
                      padding: '0.25rem 0.75rem', 
                      fontSize: '0.75rem', 
                      fontWeight: 500, 
                      borderRadius: '9999px',
                      backgroundColor: 
                        record.status === 'Hoàn thành' ? '#dcfce7' : 
                        record.status === 'Đang xử lý' ? '#fef3c7' : 
                        '#f0f9ff',
                      color: 
                        record.status === 'Hoàn thành' ? '#166534' : 
                        record.status === 'Đang xử lý' ? '#92400e' : 
                        '#0369a1'
                    }}>
                      {record.status}
                    </span>
                  </td>
                  <td style={{padding: '1rem 1.5rem', whiteSpace: 'nowrap', fontSize: '0.875rem', color: '#6b7280'}}>
                    <div style={{display: 'flex', alignItems: 'center', gap: '1rem'}}>
                      <Link href={`/medical/${record.id}`} style={{color: '#2563eb', display: 'flex', alignItems: 'center'}}>
                        <ClipboardDocumentListIcon style={{width: '1rem', height: '1rem'}} />
                      </Link>
                      <Link href={`/medical/${record.id}/edit`} style={{color: '#16a34a', display: 'flex', alignItems: 'center'}}>
                        <DocumentPlusIcon style={{width: '1rem', height: '1rem'}} />
                      </Link>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        
        {filteredRecords.length === 0 && (
          <div style={{textAlign: 'center', padding: '2rem 0'}}>
            <p style={{color: '#6b7280'}}>Không tìm thấy hồ sơ y tế phù hợp với tìm kiếm của bạn.</p>
          </div>
        )}
      </div>
    </div>
  );
} 