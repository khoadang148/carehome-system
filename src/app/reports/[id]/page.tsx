"use client";

import { useState, useEffect, use } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { 
  ArrowLeftIcon, 
  ChartBarIcon, 
  UsersIcon,
  CurrencyDollarIcon,
  HeartIcon,
  CalendarIcon,
  DocumentArrowDownIcon,
  PrinterIcon
} from '@heroicons/react/24/outline';

// Mock reports data
const reportsData = [
  {
    id: 1,
    title: 'Báo cáo tổng quan tháng 1/2024',
    type: 'monthly',
    period: '2024-01',
    generatedDate: '2024-02-01',
    status: 'completed',
    data: {
      residents: {
        total: 45,
        newAdmissions: 3,
        discharges: 1,
        occupancyRate: 90
      },
      staff: {
        total: 25,
        nursesCount: 8,
        caregiversCount: 12,
        adminCount: 5
      },
      financial: {
        revenue: 2850000000,
        expenses: 2340000000,
        profit: 510000000,
        profitMargin: 17.9
      },
      activities: {
        totalActivities: 45,
        participationRate: 85,
        mostPopular: 'Tập thể dục buổi sáng',
        averageParticipants: 18
      },
      medical: {
        totalRecords: 67,
        emergencies: 2,
        routineCheckups: 45,
        medicationChanges: 12
      }
    }
  },
  {
    id: 2,
    title: 'Báo cáo tài chính quý 1/2024',
    type: 'quarterly',
    period: '2024-Q1',
    generatedDate: '2024-04-01',
    status: 'completed',
    data: {
      financial: {
        revenue: 8550000000,
        expenses: 7020000000,
        profit: 1530000000,
        profitMargin: 17.9,
        monthlyBreakdown: [
          { month: 'Tháng 1', revenue: 2850000000, expenses: 2340000000 },
          { month: 'Tháng 2', revenue: 2900000000, expenses: 2380000000 },
          { month: 'Tháng 3', revenue: 2800000000, expenses: 2300000000 }
        ]
      },
      residents: {
        total: 47,
        averageStay: 18,
        satisfactionScore: 4.6
      }
    }
  }
];

export default function ReportDetailPage({ params }: { params: { id: string } }) {
  const router = useRouter();
  const [report, setReport] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  
  // Get reportId from params directly
  const reportId = params.id;
  
  useEffect(() => {
    const fetchReport = async () => {
      try {
        const id = parseInt(reportId);
        
        // Check localStorage for reports data
        let reports = reportsData;
        const savedReports = localStorage.getItem('nurseryHomeReports');
        if (savedReports) {
          reports = JSON.parse(savedReports);
        }
        
        const foundReport = reports.find(r => r.id === id);
        
        if (foundReport) {
          setReport(foundReport);
        } else {
          router.push('/reports');
        }
      } catch (error) {
        console.error('Error fetching report:', error);
      } finally {
        setLoading(false);
      }
    };
    
    fetchReport();
  }, [reportId, router]);
  
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: 'VND'
    }).format(amount);
  };
  
  const formatPeriod = (period: string, type: string) => {
    if (type === 'monthly') {
      const [year, month] = period.split('-');
      return `Tháng ${month}/${year}`;
    } else if (type === 'quarterly') {
      const [year, quarter] = period.split('-');
      return `Quý ${quarter.replace('Q', '')}/${year}`;
    }
    return period;
  };
  
  const handleDownload = () => {
    if (!report) return;
    
    // Generate PDF-like content as HTML
    const reportContent = generateReportHTML(report);
    const blob = new Blob([reportContent], { type: 'text/html' });
    const url = URL.createObjectURL(blob);
    
    // Create download link
    const link = document.createElement('a');
    link.href = url;
    link.download = `bao-cao-${report.title.toLowerCase().replace(/\s+/g, '-')}-${Date.now()}.html`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    // Clean up
    URL.revokeObjectURL(url);
  };

  const generateReportHTML = (report: any) => {
    return `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="UTF-8">
          <title>Báo cáo: ${report.title}</title>
          <style>
            body { font-family: Arial, sans-serif; margin: 20px; }
            .header { border-bottom: 2px solid #333; padding-bottom: 20px; margin-bottom: 20px; }
            .metric { margin: 10px 0; padding: 10px; background: #f5f5f5; border-radius: 5px; }
            .metric-title { font-weight: bold; color: #333; }
            .metric-value { font-size: 1.2em; color: #0066cc; }
          </style>
        </head>
        <body>
          <div class="header">
            <h1>${report.title}</h1>
            <p><strong>Kỳ báo cáo:</strong> ${formatPeriod(report.period, report.type)}</p>
            <p><strong>Ngày tạo:</strong> ${new Date(report.generatedDate).toLocaleDateString('vi-VN')}</p>
          </div>
          
          <div class="content">
            <h2>Tóm tắt chỉ số chính</h2>
            ${report.data ? generateMetricsHTML(report.data) : '<p>Không có dữ liệu</p>'}
          </div>
          
          <div class="footer" style="margin-top: 40px; padding-top: 20px; border-top: 1px solid #ccc;">
            <p><em>Báo cáo được tạo tự động từ hệ thống quản lý viện dưỡng lão</em></p>
            <p><em>Thời gian xuất: ${new Date().toLocaleString('vi-VN')}</em></p>
          </div>
        </body>
      </html>
    `;
  };

  const generateMetricsHTML = (data: any) => {
    let html = '';
    
    if (data.residents) {
      html += `
        <div class="metric">
          <div class="metric-title">Thông tin người cao tuổi</div>
          <div class="metric-value">Tổng số: ${data.residents.total}</div>
          ${data.residents.newAdmissions ? `<div>người cao tuổi mới: ${data.residents.newAdmissions}</div>` : ''}
          ${data.residents.occupancyRate ? `<div>Tỷ lệ lấp đầy: ${data.residents.occupancyRate}%</div>` : ''}
        </div>
      `;
    }
    
    if (data.financial) {
      html += `
        <div class="metric">
          <div class="metric-title">Thông tin tài chính</div>
          <div class="metric-value">Doanh thu: ${formatCurrency(data.financial.revenue)}</div>
          <div>Chi phí: ${formatCurrency(data.financial.expenses)}</div>
          <div>Lợi nhuận: ${formatCurrency(data.financial.profit)}</div>
          <div>Tỷ lệ lợi nhuận: ${data.financial.profitMargin}%</div>
        </div>
      `;
    }
    
    return html;
  };
  
  const handlePrint = () => {
    window.print();
  };
  
  if (loading) {
    return (
      <div style={{display: 'flex', justifyContent: 'center', alignItems: 'center', height: '50vh'}}>
        <p style={{fontSize: '1rem', color: '#6b7280'}}>Đang tải báo cáo...</p>
      </div>
    );
  }
  
  if (!report) {
    return (
      <div style={{display: 'flex', justifyContent: 'center', alignItems: 'center', height: '50vh'}}>
        <p style={{fontSize: '1rem', color: '#6b7280'}}>Không tìm thấy báo cáo.</p>
      </div>
    );
  }
  
  return (
    <div style={{maxWidth: '1400px', margin: '0 auto', padding: '0 1rem'}}>
      <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem'}}>
        <div style={{display: 'flex', alignItems: 'center', gap: '0.5rem'}}>
          <Link href="/reports" style={{color: '#6b7280', display: 'flex'}}>
            <ArrowLeftIcon style={{width: '1.25rem', height: '1.25rem'}} />
          </Link>
          <h1 style={{fontSize: '1.5rem', fontWeight: 600, margin: 0}}>Chi tiết báo cáo</h1>
        </div>
        
        <div style={{display: 'flex', gap: '0.5rem'}}>
          <button
            onClick={handleDownload}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem',
              padding: '0.5rem 1rem',
              backgroundColor: '#2563eb',
              color: 'white',
              borderRadius: '0.375rem',
              border: 'none',
              fontSize: '0.875rem',
              fontWeight: 500,
              cursor: 'pointer'
            }}
          >
            <DocumentArrowDownIcon style={{width: '1rem', height: '1rem'}} />
            Tải xuống
          </button>
          <button
            onClick={handlePrint}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem',
              padding: '0.5rem 1rem',
              backgroundColor: '#16a34a',
              color: 'white',
              borderRadius: '0.375rem',
              border: 'none',
              fontSize: '0.875rem',
              fontWeight: 500,
              cursor: 'pointer'
            }}
          >
            <PrinterIcon style={{width: '1rem', height: '1rem'}} />
            In báo cáo
          </button>
        </div>
      </div>
      
      <div style={{backgroundColor: 'white', borderRadius: '0.5rem', boxShadow: '0 1px 3px rgba(0,0,0,0.05)', overflow: 'hidden'}}>
        {/* Header */}
        <div style={{backgroundColor: '#f9fafb', padding: '1.5rem', borderBottom: '1px solid #e5e7eb'}}>
          <h2 style={{fontSize: '1.5rem', fontWeight: 600, color: '#111827', margin: 0}}>{report.title}</h2>
          <div style={{display: 'flex', alignItems: 'center', gap: '2rem', marginTop: '1rem'}}>
            <div>
              <span style={{fontSize: '0.75rem', fontWeight: 500, color: '#6b7280', textTransform: 'uppercase'}}>Kỳ báo cáo</span>
              <p style={{fontSize: '0.875rem', color: '#111827', margin: 0}}>{formatPeriod(report.period, report.type)}</p>
            </div>
            <div>
              <span style={{fontSize: '0.75rem', fontWeight: 500, color: '#6b7280', textTransform: 'uppercase'}}>Ngày tạo</span>
              <p style={{fontSize: '0.875rem', color: '#111827', margin: 0}}>{new Date(report.generatedDate).toLocaleDateString('vi-VN')}</p>
            </div>
            <div>
              <span style={{fontSize: '0.75rem', fontWeight: 500, color: '#6b7280', textTransform: 'uppercase'}}>Trạng thái</span>
              <p style={{fontSize: '0.875rem', color: '#111827', margin: 0}}>
                <span style={{
                  padding: '0.25rem 0.75rem',
                  backgroundColor: '#dcfce7',
                  color: '#166534',
                  borderRadius: '9999px',
                  fontSize: '0.75rem',
                  fontWeight: 500
                }}>
                  Hoàn thành
                </span>
              </p>
            </div>
          </div>
        </div>
        
        {/* Content */}
        <div style={{padding: '1.5rem'}}>
          
          {/* Key Metrics */}
          {report.data && (
            <div style={{marginBottom: '2rem'}}>
              <h3 style={{fontSize: '1.25rem', fontWeight: 600, color: '#111827', marginBottom: '1rem'}}>
                Tóm tắt chỉ số chính
              </h3>
              
              <div style={{display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '1rem'}}>
                
                {/* Residents */}
                {report.data.residents && (
                  <div style={{
                    padding: '1.5rem',
                    backgroundColor: '#f0f9ff',
                    borderRadius: '0.5rem',
                    border: '1px solid #bae6fd'
                  }}>
                    <div style={{display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1rem'}}>
                      <div style={{
                        padding: '0.5rem',
                        backgroundColor: '#0ea5e9',
                        borderRadius: '0.375rem'
                      }}>
                        <UsersIcon style={{width: '1.25rem', height: '1.25rem', color: 'white'}} />
                      </div>
                      <h4 style={{fontSize: '1rem', fontWeight: 600, color: '#0c4a6e', margin: 0}}>người cao tuổi</h4>
                    </div>
                    <div style={{display: 'grid', gap: '0.5rem'}}>
                      <div style={{display: 'flex', justifyContent: 'space-between'}}>
                        <span style={{fontSize: '0.875rem', color: '#075985'}}>Tổng số:</span>
                        <span style={{fontSize: '0.875rem', fontWeight: 600, color: '#0c4a6e'}}>{report.data.residents.total}</span>
                      </div>
                      {report.data.residents.newAdmissions && (
                        <div style={{display: 'flex', justifyContent: 'space-between'}}>
                          <span style={{fontSize: '0.875rem', color: '#075985'}}>người cao tuổi mới:</span>
                          <span style={{fontSize: '0.875rem', fontWeight: 600, color: '#0c4a6e'}}>{report.data.residents.newAdmissions}</span>
                        </div>
                      )}
                      {report.data.residents.occupancyRate && (
                        <div style={{display: 'flex', justifyContent: 'space-between'}}>
                          <span style={{fontSize: '0.875rem', color: '#075985'}}>Tỷ lệ lấp đầy:</span>
                          <span style={{fontSize: '0.875rem', fontWeight: 600, color: '#0c4a6e'}}>{report.data.residents.occupancyRate}%</span>
                        </div>
                      )}
                    </div>
                  </div>
                )}
                
                {/* Financial */}
                {report.data.financial && (
                  <div style={{
                    padding: '1.5rem',
                    backgroundColor: '#f0fdf4',
                    borderRadius: '0.5rem',
                    border: '1px solid #bbf7d0'
                  }}>
                    <div style={{display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1rem'}}>
                      <div style={{
                        padding: '0.5rem',
                        backgroundColor: '#16a34a',
                        borderRadius: '0.375rem'
                      }}>
                        <CurrencyDollarIcon style={{width: '1.25rem', height: '1.25rem', color: 'white'}} />
                      </div>
                      <h4 style={{fontSize: '1rem', fontWeight: 600, color: '#14532d', margin: 0}}>Tài chính</h4>
                    </div>
                    <div style={{display: 'grid', gap: '0.5rem'}}>
                      <div style={{display: 'flex', justifyContent: 'space-between'}}>
                        <span style={{fontSize: '0.875rem', color: '#166534'}}>Doanh thu:</span>
                        <span style={{fontSize: '0.875rem', fontWeight: 600, color: '#14532d'}}>{formatCurrency(report.data.financial.revenue)}</span>
                      </div>
                      <div style={{display: 'flex', justifyContent: 'space-between'}}>
                        <span style={{fontSize: '0.875rem', color: '#166534'}}>Chi phí:</span>
                        <span style={{fontSize: '0.875rem', fontWeight: 600, color: '#14532d'}}>{formatCurrency(report.data.financial.expenses)}</span>
                      </div>
                      <div style={{display: 'flex', justifyContent: 'space-between'}}>
                        <span style={{fontSize: '0.875rem', color: '#166534'}}>Lợi nhuận:</span>
                        <span style={{fontSize: '0.875rem', fontWeight: 600, color: '#14532d'}}>{formatCurrency(report.data.financial.profit)}</span>
                      </div>
                      <div style={{display: 'flex', justifyContent: 'space-between'}}>
                        <span style={{fontSize: '0.875rem', color: '#166534'}}>Tỷ lệ LN:</span>
                        <span style={{fontSize: '0.875rem', fontWeight: 600, color: '#14532d'}}>{report.data.financial.profitMargin}%</span>
                      </div>
                    </div>
                  </div>
                )}
                
                {/* Activities */}
                {report.data.activities && (
                  <div style={{
                    padding: '1.5rem',
                    backgroundColor: '#fefce8',
                    borderRadius: '0.5rem',
                    border: '1px solid #fde047'
                  }}>
                    <div style={{display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1rem'}}>
                      <div style={{
                        padding: '0.5rem',
                        backgroundColor: '#eab308',
                        borderRadius: '0.375rem'
                      }}>
                        <ChartBarIcon style={{width: '1.25rem', height: '1.25rem', color: 'white'}} />
                      </div>
                      <h4 style={{fontSize: '1rem', fontWeight: 600, color: '#713f12', margin: 0}}>Hoạt động</h4>
                    </div>
                    <div style={{display: 'grid', gap: '0.5rem'}}>
                      <div style={{display: 'flex', justifyContent: 'space-between'}}>
                        <span style={{fontSize: '0.875rem', color: '#a16207'}}>Tổng số:</span>
                        <span style={{fontSize: '0.875rem', fontWeight: 600, color: '#713f12'}}>{report.data.activities.totalActivities}</span>
                      </div>
                      <div style={{display: 'flex', justifyContent: 'space-between'}}>
                        <span style={{fontSize: '0.875rem', color: '#a16207'}}>Tỷ lệ tham gia:</span>
                        <span style={{fontSize: '0.875rem', fontWeight: 600, color: '#713f12'}}>{report.data.activities.participationRate}%</span>
                      </div>
                      <div style={{marginTop: '0.5rem'}}>
                        <span style={{fontSize: '0.75rem', color: '#a16207'}}>Phổ biến nhất:</span>
                        <p style={{fontSize: '0.875rem', fontWeight: 600, color: '#713f12', margin: 0}}>{report.data.activities.mostPopular}</p>
                      </div>
                    </div>
                  </div>
                )}
                
                {/* Medical */}
                {report.data.medical && (
                  <div style={{
                    padding: '1.5rem',
                    backgroundColor: '#fdf2f8',
                    borderRadius: '0.5rem',
                    border: '1px solid #fbcfe8'
                  }}>
                    <div style={{display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1rem'}}>
                      <div style={{
                        padding: '0.5rem',
                        backgroundColor: '#ec4899',
                        borderRadius: '0.375rem'
                      }}>
                        <HeartIcon style={{width: '1.25rem', height: '1.25rem', color: 'white'}} />
                      </div>
                      <h4 style={{fontSize: '1rem', fontWeight: 600, color: '#831843', margin: 0}}>Y tế</h4>
                    </div>
                    <div style={{display: 'grid', gap: '0.5rem'}}>
                      <div style={{display: 'flex', justifyContent: 'space-between'}}>
                        <span style={{fontSize: '0.875rem', color: '#be185d'}}>Tổng hồ sơ:</span>
                        <span style={{fontSize: '0.875rem', fontWeight: 600, color: '#831843'}}>{report.data.medical.totalRecords}</span>
                      </div>
                      <div style={{display: 'flex', justifyContent: 'space-between'}}>
                        <span style={{fontSize: '0.875rem', color: '#be185d'}}>Cấp cứu:</span>
                        <span style={{fontSize: '0.875rem', fontWeight: 600, color: '#831843'}}>{report.data.medical.emergencies}</span>
                      </div>
                      <div style={{display: 'flex', justifyContent: 'space-between'}}>
                        <span style={{fontSize: '0.875rem', color: '#be185d'}}>Khám định kỳ:</span>
                        <span style={{fontSize: '0.875rem', fontWeight: 600, color: '#831843'}}>{report.data.medical.routineCheckups}</span>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}
          
          {/* Detailed Breakdown */}
          {report.data?.financial?.monthlyBreakdown && (
            <div style={{marginBottom: '2rem'}}>
              <h3 style={{fontSize: '1.25rem', fontWeight: 600, color: '#111827', marginBottom: '1rem'}}>
                Chi tiết theo tháng
              </h3>
              
              <div style={{overflowX: 'auto'}}>
                <table style={{width: '100%', borderCollapse: 'separate', borderSpacing: 0}}>
                  <thead style={{backgroundColor: '#f9fafb'}}>
                    <tr>
                      <th style={{padding: '0.75rem 1rem', textAlign: 'left', fontSize: '0.875rem', fontWeight: 600, color: '#374151', borderBottom: '1px solid #e5e7eb'}}>Tháng</th>
                      <th style={{padding: '0.75rem 1rem', textAlign: 'right', fontSize: '0.875rem', fontWeight: 600, color: '#374151', borderBottom: '1px solid #e5e7eb'}}>Doanh thu</th>
                      <th style={{padding: '0.75rem 1rem', textAlign: 'right', fontSize: '0.875rem', fontWeight: 600, color: '#374151', borderBottom: '1px solid #e5e7eb'}}>Chi phí</th>
                      <th style={{padding: '0.75rem 1rem', textAlign: 'right', fontSize: '0.875rem', fontWeight: 600, color: '#374151', borderBottom: '1px solid #e5e7eb'}}>Lợi nhuận</th>
                    </tr>
                  </thead>
                  <tbody>
                    {report.data.financial.monthlyBreakdown.map((month: any, index: number) => (
                      <tr key={index} style={{backgroundColor: index % 2 === 0 ? 'white' : '#f9fafb'}}>
                        <td style={{padding: '0.75rem 1rem', fontSize: '0.875rem', color: '#374151', borderBottom: '1px solid #e5e7eb'}}>{month.month}</td>
                        <td style={{padding: '0.75rem 1rem', fontSize: '0.875rem', color: '#374151', textAlign: 'right', borderBottom: '1px solid #e5e7eb'}}>{formatCurrency(month.revenue)}</td>
                        <td style={{padding: '0.75rem 1rem', fontSize: '0.875rem', color: '#374151', textAlign: 'right', borderBottom: '1px solid #e5e7eb'}}>{formatCurrency(month.expenses)}</td>
                        <td style={{padding: '0.75rem 1rem', fontSize: '0.875rem', color: '#16a34a', textAlign: 'right', fontWeight: 600, borderBottom: '1px solid #e5e7eb'}}>{formatCurrency(month.revenue - month.expenses)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
          
          {/* Additional Stats */}
          {report.data?.staff && (
            <div style={{marginBottom: '2rem'}}>
              <h3 style={{fontSize: '1.25rem', fontWeight: 600, color: '#111827', marginBottom: '1rem'}}>
                Thống kê nhân viên
              </h3>
              
              <div style={{display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem'}}>
                <div style={{textAlign: 'center', padding: '1rem', border: '1px solid #e5e7eb', borderRadius: '0.5rem'}}>
                  <div style={{fontSize: '2rem', fontWeight: 700, color: '#0284c7', marginBottom: '0.5rem'}}>{report.data.staff.total}</div>
                  <div style={{fontSize: '0.875rem', color: '#6b7280'}}>Tổng nhân viên</div>
                </div>
                <div style={{textAlign: 'center', padding: '1rem', border: '1px solid #e5e7eb', borderRadius: '0.5rem'}}>
                  <div style={{fontSize: '2rem', fontWeight: 700, color: '#dc2626', marginBottom: '0.5rem'}}>{report.data.staff.nursesCount}</div>
                  <div style={{fontSize: '0.875rem', color: '#6b7280'}}>Y tá</div>
                </div>
                <div style={{textAlign: 'center', padding: '1rem', border: '1px solid #e5e7eb', borderRadius: '0.5rem'}}>
                  <div style={{fontSize: '2rem', fontWeight: 700, color: '#16a34a', marginBottom: '0.5rem'}}>{report.data.staff.caregiversCount}</div>
                  <div style={{fontSize: '0.875rem', color: '#6b7280'}}>Người chăm sóc</div>
                </div>
                <div style={{textAlign: 'center', padding: '1rem', border: '1px solid #e5e7eb', borderRadius: '0.5rem'}}>
                  <div style={{fontSize: '2rem', fontWeight: 700, color: '#7c3aed', marginBottom: '0.5rem'}}>{report.data.staff.adminCount}</div>
                  <div style={{fontSize: '0.875rem', color: '#6b7280'}}>Quản lý</div>
                </div>
              </div>
            </div>
          )}
          
          {/* Summary */}
          <div style={{
            backgroundColor: '#f8fafc',
            border: '1px solid #e2e8f0',
            borderRadius: '0.5rem',
            padding: '1.5rem'
          }}>
            <h3 style={{fontSize: '1.125rem', fontWeight: 600, color: '#111827', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem'}}>
              <CalendarIcon style={{width: '1.25rem', height: '1.25rem'}} />
              Tóm tắt báo cáo
            </h3>
            <div style={{fontSize: '0.875rem', color: '#4b5563', lineHeight: 1.6}}>
              <p style={{margin: '0 0 1rem 0'}}>
                Báo cáo này cung cấp cái nhìn tổng quan về hoạt động của viện dưỡng lão trong kỳ {formatPeriod(report.period, report.type)}. 
                Các chỉ số chính cho thấy sự ổn định và phát triển tích cực.
              </p>
              {report.data?.financial && (
                <p style={{margin: '0 0 1rem 0'}}>
                  <strong>Tài chính:</strong> Doanh thu đạt {formatCurrency(report.data.financial.revenue)} với tỷ lệ lợi nhuận {report.data.financial.profitMargin}%, 
                  cho thấy hiệu quả hoạt động kinh doanh tốt.
                </p>
              )}
              {report.data?.residents && (
                <p style={{margin: '0 0 1rem 0'}}>
                  <strong>người cao tuổi:</strong> Hiện có {report.data.residents.total} người cao tuổi với tỷ lệ lấp đầy {report.data.residents.occupancyRate}%, 
                  đảm bảo sức chứa và chất lượng dịch vụ.
                </p>
              )}
              {report.data?.activities && (
                <p style={{margin: 0}}>
                  <strong>Hoạt động:</strong> Tổ chức {report.data.activities.totalActivities} hoạt động với tỷ lệ tham gia {report.data.activities.participationRate}%, 
                  góp phần nâng cao chất lượng cuộc sống của người cao tuổi.
                </p>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
} 