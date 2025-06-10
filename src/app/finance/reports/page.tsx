"use client";

import { useState } from 'react';
import Link from 'next/link';
import { 
  ArrowLeftIcon,
  ChartBarIcon,
  DocumentChartBarIcon,
  CalendarIcon,
  ArrowTrendingUpIcon,
  ArrowTrendingDownIcon,
  BanknotesIcon,
  PrinterIcon,
  CloudArrowDownIcon
} from '@heroicons/react/24/outline';

// Mock data for reports
const monthlyData = [
  { month: 'T1', income: 45000000, expenses: 38000000 },
  { month: 'T2', income: 52000000, expenses: 41000000 },
  { month: 'T3', income: 48000000, expenses: 39000000 },
  { month: 'T4', income: 55000000, expenses: 42000000 },
  { month: 'T5', income: 58000000, expenses: 45000000 },
  { month: 'T6', income: 62000000, expenses: 47000000 },
];

const categoryBreakdown = [
  { category: 'Phí dịch vụ chăm sóc', amount: 180000000, percentage: 65 },
  { category: 'Phí ăn uống', amount: 45000000, percentage: 16 },
  { category: 'Phí y tế', amount: 28000000, percentage: 10 },
  { category: 'Phí tiện ích', amount: 25000000, percentage: 9 },
];

const expenseCategories = [
  { category: 'Lương nhân viên', amount: 120000000, percentage: 45 },
  { category: 'Chi phí y tế', amount: 67000000, percentage: 25 },
  { category: 'Thực phẩm & Dinh dưỡng', amount: 40000000, percentage: 15 },
  { category: 'Tiện ích & Vận hành', amount: 27000000, percentage: 10 },
  { category: 'Khác', amount: 13000000, percentage: 5 },
];

const formatCurrency = (amount: number) => {
  return new Intl.NumberFormat('vi-VN', { 
    style: 'currency', 
    currency: 'VND',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0
  }).format(amount);
};

export default function FinanceReportsPage() {
  const [selectedPeriod, setSelectedPeriod] = useState('6-months');
  const [reportType, setReportType] = useState('overview');
  const [isExporting, setIsExporting] = useState(false);

  const totalIncome = monthlyData.reduce((sum, item) => sum + item.income, 0);
  const totalExpenses = monthlyData.reduce((sum, item) => sum + item.expenses, 0);
  const netProfit = totalIncome - totalExpenses;
  const profitMargin = ((netProfit / totalIncome) * 100).toFixed(1);

  const handlePrintReport = () => {
    window.print();
  };

  const handleExportReport = async () => {
    setIsExporting(true);
    
    try {
      // Simulate export process
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      // Create and download CSV data
      const csvContent = generateReportCSV();
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const link = document.createElement('a');
      
      if (link.download !== undefined) {
        const url = URL.createObjectURL(blob);
        link.setAttribute('href', url);
        link.setAttribute('download', `bao-cao-tai-chinh-${Date.now()}.csv`);
        link.style.visibility = 'hidden';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
      }
    } catch (error) {
      console.error('Export failed:', error);
    } finally {
      setIsExporting(false);
    }
  };

  const generateReportCSV = () => {
    // Generate CSV content based on current data
    const headers = 'Tháng,Thu nhập,Chi phí,Số dư\n';
    const data = monthlyData.map(item => 
      `${item.month},${item.income},${item.expenses},${item.income - item.expenses}`
    ).join('\n');
    
    return headers + data;
  };

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
          radial-gradient(circle at 40% 40%, rgba(239, 68, 68, 0.03) 0%, transparent 50%)
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
              <Link href="/finance" style={{color: '#6b7280', display: 'flex'}}>
                <ArrowLeftIcon style={{width: '1.25rem', height: '1.25rem'}} />
              </Link>
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
                <DocumentChartBarIcon style={{width: '2rem', height: '2rem', color: 'white'}} />
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
                  Báo cáo tài chính
                </h1>
                <p style={{
                  fontSize: '1rem',
                  color: '#64748b',
                  margin: '0.25rem 0 0 0',
                  fontWeight: 500
                }}>
                  Phân tích chi tiết và xu hướng tài chính
                </p>
              </div>
            </div>
            
            <div style={{display: 'flex', gap: '1rem', flexWrap: 'wrap'}}>
              <button 
                onClick={handlePrintReport}
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  background: 'linear-gradient(135deg, #6b7280 0%, #4b5563 100%)',
                  color: 'white',
                  padding: '0.875rem 1.5rem',
                  borderRadius: '0.75rem',
                  border: 'none',
                  fontWeight: 600,
                  fontSize: '0.875rem',
                  boxShadow: '0 4px 12px rgba(107, 114, 128, 0.3)',
                  cursor: 'pointer',
                  transition: 'all 0.3s ease'
                }}
              >
                <PrinterIcon style={{width: '1.125rem', height: '1.125rem', marginRight: '0.5rem'}} />
                In báo cáo
              </button>
              <button 
                onClick={handleExportReport}
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
                  color: 'white',
                  padding: '0.875rem 1.5rem',
                  borderRadius: '0.75rem',
                  border: 'none',
                  fontWeight: 600,
                  fontSize: '0.875rem',
                  boxShadow: '0 4px 12px rgba(16, 185, 129, 0.3)',
                  cursor: 'pointer',
                  transition: 'all 0.3s ease'
                }}
              >
                <CloudArrowDownIcon style={{width: '1.125rem', height: '1.125rem', marginRight: '0.5rem'}} />
                Xuất Excel
              </button>
            </div>
          </div>
        </div>

        {/* Filter Controls */}
        <div style={{
          background: 'linear-gradient(135deg, #ffffff 0%, #f8fafc 100%)',
          borderRadius: '1.5rem',
          padding: '1.5rem 2rem',
          marginBottom: '2rem',
          boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.1)',
          border: '1px solid rgba(255, 255, 255, 0.2)'
        }}>
          <div style={{
            display: 'flex',
            flexWrap: 'wrap', 
            alignItems: 'center', 
            gap: '1.5rem'
          }}>
            <div style={{display: 'flex', alignItems: 'center', gap: '0.5rem'}}>
              <CalendarIcon style={{width: '1.125rem', height: '1.125rem', color: '#6b7280'}} />
              <span style={{fontSize: '0.875rem', fontWeight: 500, color: '#374151'}}>
                Thời gian:
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
                boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)'
              }}
              value={selectedPeriod}
              onChange={(e) => setSelectedPeriod(e.target.value)}
            >
              <option value="6-months">6 tháng gần nhất</option>
              <option value="year">12 tháng gần nhất</option>
              <option value="quarter">Quý hiện tại</option>
              <option value="month">Tháng hiện tại</option>
            </select>

            <div style={{display: 'flex', alignItems: 'center', gap: '0.5rem'}}>
              <ChartBarIcon style={{width: '1.125rem', height: '1.125rem', color: '#6b7280'}} />
              <span style={{fontSize: '0.875rem', fontWeight: 500, color: '#374151'}}>
                Loại báo cáo:
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
                boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)'
              }}
              value={reportType}
              onChange={(e) => setReportType(e.target.value)}
            >
              <option value="overview">Tổng quan</option>
              <option value="income">Thu nhập chi tiết</option>
              <option value="expenses">Chi phí chi tiết</option>
              <option value="profit">Lợi nhuận</option>
            </select>
          </div>
        </div>

        {/* Summary Cards */}
        <div style={{
          display: 'grid', 
          gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', 
          gap: '1.5rem', 
          marginBottom: '2rem'
        }}>
          {/* Total Income */}
          <div style={{
            background: 'linear-gradient(135deg, #ecfdf5 0%, #d1fae5 100%)',
            borderRadius: '1.5rem',
            padding: '2rem',
            boxShadow: '0 10px 25px -5px rgba(34, 197, 94, 0.1)',
            border: '1px solid rgba(34, 197, 94, 0.2)',
            position: 'relative',
            overflow: 'hidden'
          }}>
            <div style={{
              position: 'absolute',
              top: '-1rem',
              right: '-1rem',
              width: '4rem',
              height: '4rem',
              background: 'radial-gradient(circle, rgba(34, 197, 94, 0.1) 0%, transparent 70%)',
              borderRadius: '50%'
            }} />
            <div style={{display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1rem'}}>
              <h3 style={{
                fontSize: '0.875rem', 
                fontWeight: 600, 
                color: '#166534', 
                margin: 0,
                textTransform: 'uppercase',
                letterSpacing: '0.025em'
              }}>
                Tổng thu nhập
              </h3>
              <ArrowTrendingUpIcon style={{width: '1.5rem', height: '1.5rem', color: '#22c55e'}} />
            </div>
            <div style={{
              fontSize: '1.875rem', 
              fontWeight: 700, 
              color: '#16a34a',
              marginBottom: '0.5rem'
            }}>
              {formatCurrency(totalIncome)}
            </div>
            <div style={{fontSize: '0.75rem', color: '#166534', fontWeight: 500}}>
              +8.2% so với kỳ trước
            </div>
          </div>

          {/* Total Expenses */}
          <div style={{
            background: 'linear-gradient(135deg, #fef2f2 0%, #fee2e2 100%)',
            borderRadius: '1.5rem',
            padding: '2rem',
            boxShadow: '0 10px 25px -5px rgba(239, 68, 68, 0.1)',
            border: '1px solid rgba(239, 68, 68, 0.2)',
            position: 'relative',
            overflow: 'hidden'
          }}>
            <div style={{
              position: 'absolute',
              top: '-1rem',
              right: '-1rem',
              width: '4rem',
              height: '4rem',
              background: 'radial-gradient(circle, rgba(239, 68, 68, 0.1) 0%, transparent 70%)',
              borderRadius: '50%'
            }} />
            <div style={{display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1rem'}}>
              <h3 style={{
                fontSize: '0.875rem', 
                fontWeight: 600, 
                color: '#991b1b', 
                margin: 0,
                textTransform: 'uppercase',
                letterSpacing: '0.025em'
              }}>
                Tổng chi phí
              </h3>
              <ArrowTrendingDownIcon style={{width: '1.5rem', height: '1.5rem', color: '#ef4444'}} />
            </div>
            <div style={{
              fontSize: '1.875rem', 
              fontWeight: 700, 
              color: '#dc2626',
              marginBottom: '0.5rem'
            }}>
              {formatCurrency(totalExpenses)}
            </div>
            <div style={{fontSize: '0.75rem', color: '#991b1b', fontWeight: 500}}>
              +3.1% so với kỳ trước
            </div>
          </div>

          {/* Net Profit */}
          <div style={{
            background: 'linear-gradient(135deg, #f0f9ff 0%, #dbeafe 100%)',
            borderRadius: '1.5rem',
            padding: '2rem',
            boxShadow: '0 10px 25px -5px rgba(59, 130, 246, 0.1)',
            border: '1px solid rgba(59, 130, 246, 0.2)',
            position: 'relative',
            overflow: 'hidden'
          }}>
            <div style={{
              position: 'absolute',
              top: '-1rem',
              right: '-1rem',
              width: '4rem',
              height: '4rem',
              background: 'radial-gradient(circle, rgba(59, 130, 246, 0.1) 0%, transparent 70%)',
              borderRadius: '50%'
            }} />
            <div style={{display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1rem'}}>
              <h3 style={{
                fontSize: '0.875rem', 
                fontWeight: 600, 
                color: '#1e40af', 
                margin: 0,
                textTransform: 'uppercase',
                letterSpacing: '0.025em'
              }}>
                Lợi nhuận ròng
              </h3>
              <BanknotesIcon style={{width: '1.5rem', height: '1.5rem', color: '#3b82f6'}} />
            </div>
            <div style={{
              fontSize: '1.875rem', 
              fontWeight: 700, 
              color: '#2563eb',
              marginBottom: '0.5rem'
            }}>
              {formatCurrency(netProfit)}
            </div>
            <div style={{fontSize: '0.75rem', color: '#1e40af', fontWeight: 500}}>
              Tỷ suất lợi nhuận: {profitMargin}%
            </div>
          </div>
        </div>

        {/* Charts and Analysis */}
        <div style={{
          display: 'grid', 
          gridTemplateColumns: 'repeat(auto-fit, minmax(400px, 1fr))', 
          gap: '2rem', 
          marginBottom: '2rem'
        }}>
          {/* Monthly Trend Chart */}
          <div style={{
            background: 'linear-gradient(135deg, #ffffff 0%, #f8fafc 100%)',
            borderRadius: '1.5rem',
            padding: '2rem',
            boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.1)',
            border: '1px solid rgba(255, 255, 255, 0.2)'
          }}>
            <h3 style={{
              fontSize: '1.25rem', 
              fontWeight: 600, 
              color: '#111827', 
              marginBottom: '1.5rem',
              marginTop: 0
            }}>
              Xu hướng theo tháng
            </h3>
            <div style={{position: 'relative', height: '300px'}}>
              {/* Simple bar chart visualization */}
              <div style={{
                display: 'flex', 
                alignItems: 'end', 
                height: '250px', 
                gap: '0.75rem',
                padding: '1rem 0'
              }}>
                {monthlyData.map((data, index) => {
                  const maxValue = Math.max(...monthlyData.map(d => Math.max(d.income, d.expenses)));
                  const incomeHeight = (data.income / maxValue) * 200;
                  const expenseHeight = (data.expenses / maxValue) * 200;
                  
                  return (
                    <div key={index} style={{flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.5rem'}}>
                      <div style={{display: 'flex', gap: '0.25rem', alignItems: 'end'}}>
                        <div style={{
                          width: '1rem',
                          height: `${incomeHeight}px`,
                          background: 'linear-gradient(135deg, #22c55e 0%, #16a34a 100%)',
                          borderRadius: '0.25rem 0.25rem 0 0',
                          minHeight: '20px'
                        }} />
                        <div style={{
                          width: '1rem',
                          height: `${expenseHeight}px`,
                          background: 'linear-gradient(135deg, #ef4444 0%, #dc2626 100%)',
                          borderRadius: '0.25rem 0.25rem 0 0',
                          minHeight: '20px'
                        }} />
                      </div>
                      <span style={{fontSize: '0.75rem', fontWeight: 500, color: '#6b7280'}}>
                        {data.month}
                      </span>
                    </div>
                  );
                })}
              </div>
              <div style={{
                display: 'flex',
                justifyContent: 'center',
                gap: '1rem',
                marginTop: '1rem'
              }}>
                <div style={{display: 'flex', alignItems: 'center', gap: '0.5rem'}}>
                  <div style={{width: '0.75rem', height: '0.75rem', background: '#22c55e', borderRadius: '0.125rem'}} />
                  <span style={{fontSize: '0.75rem', color: '#6b7280'}}>Thu nhập</span>
                </div>
                <div style={{display: 'flex', alignItems: 'center', gap: '0.5rem'}}>
                  <div style={{width: '0.75rem', height: '0.75rem', background: '#ef4444', borderRadius: '0.125rem'}} />
                  <span style={{fontSize: '0.75rem', color: '#6b7280'}}>Chi phí</span>
                </div>
              </div>
            </div>
          </div>

          {/* Income Breakdown */}
          <div style={{
            background: 'linear-gradient(135deg, #ffffff 0%, #f8fafc 100%)',
            borderRadius: '1.5rem',
            padding: '2rem',
            boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.1)',
            border: '1px solid rgba(255, 255, 255, 0.2)'
          }}>
            <h3 style={{
              fontSize: '1.25rem', 
              fontWeight: 600, 
              color: '#111827', 
              marginBottom: '1.5rem',
              marginTop: 0
            }}>
              Cơ cấu thu nhập
            </h3>
            <div style={{display: 'flex', flexDirection: 'column', gap: '1rem'}}>
              {categoryBreakdown.map((item, index) => (
                <div key={index} style={{display: 'flex', flexDirection: 'column', gap: '0.5rem'}}>
                  <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center'}}>
                    <span style={{fontSize: '0.875rem', fontWeight: 500, color: '#374151'}}>
                      {item.category}
                    </span>
                    <span style={{fontSize: '0.875rem', fontWeight: 600, color: '#16a34a'}}>
                      {formatCurrency(item.amount)}
                    </span>
                  </div>
                  <div style={{
                    width: '100%',
                    height: '0.5rem',
                    background: '#f1f5f9',
                    borderRadius: '0.25rem',
                    overflow: 'hidden'
                  }}>
                    <div style={{
                      width: `${item.percentage}%`,
                      height: '100%',
                      background: 'linear-gradient(135deg, #22c55e 0%, #16a34a 100%)',
                      borderRadius: '0.25rem'
                    }} />
                  </div>
                  <span style={{fontSize: '0.75rem', color: '#6b7280'}}>
                    {item.percentage}% tổng thu nhập
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Expense Analysis */}
        <div style={{
          background: 'linear-gradient(135deg, #ffffff 0%, #f8fafc 100%)',
          borderRadius: '1.5rem',
          padding: '2rem',
          boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.1)',
          border: '1px solid rgba(255, 255, 255, 0.2)'
        }}>
          <h3 style={{
            fontSize: '1.25rem', 
            fontWeight: 600, 
            color: '#111827', 
            marginBottom: '1.5rem',
            marginTop: 0
          }}>
            Phân tích chi phí theo danh mục
          </h3>
          <div style={{
            display: 'grid', 
            gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', 
            gap: '1.5rem'
          }}>
            {expenseCategories.map((item, index) => (
              <div key={index} style={{
                padding: '1.5rem',
                borderRadius: '1rem',
                border: '1px solid #e5e7eb',
                background: 'linear-gradient(135deg, #fef9f9 0%, #fef2f2 100%)',
                transition: 'all 0.2s ease'
              }}>
                <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem'}}>
                  <h4 style={{fontSize: '0.875rem', fontWeight: 600, color: '#374151', margin: 0}}>
                    {item.category}
                  </h4>
                  <span style={{
                    fontSize: '0.75rem', 
                    fontWeight: 600, 
                    color: '#dc2626',
                    padding: '0.25rem 0.5rem',
                    background: 'rgba(239, 68, 68, 0.1)',
                    borderRadius: '0.375rem'
                  }}>
                    {item.percentage}%
                  </span>
                </div>
                <div style={{
                  fontSize: '1.25rem', 
                  fontWeight: 700, 
                  color: '#dc2626',
                  marginBottom: '0.75rem'
                }}>
                  {formatCurrency(item.amount)}
                </div>
                <div style={{
                  width: '100%',
                  height: '0.375rem',
                  background: '#f1f5f9',
                  borderRadius: '0.25rem',
                  overflow: 'hidden'
                }}>
                  <div style={{
                    width: `${item.percentage * 2}%`,
                    height: '100%',
                    background: 'linear-gradient(135deg, #ef4444 0%, #dc2626 100%)',
                    borderRadius: '0.25rem'
                  }} />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
} 
