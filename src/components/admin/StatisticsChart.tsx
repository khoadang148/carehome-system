"use client";

import { useState, useEffect } from 'react';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ArcElement,
} from 'chart.js';
import { Line, Bar, Doughnut } from 'react-chartjs-2';
import { billsAPI } from '@/lib/api';
import EmptyState from './EmptyState';

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ArcElement
);

interface ChartData {
  labels: string[];
  datasets: {
    label: string;
    data: number[];
    backgroundColor?: string | string[];
    borderColor?: string | string[];
    borderWidth?: number;
    fill?: boolean;
  }[];
}

interface StatisticsChartProps {
  type: 'revenue' | 'transactions' | 'distribution';
}

export default function StatisticsChart({ type }: StatisticsChartProps) {
  const [chartData, setChartData] = useState<ChartData>({
    labels: [],
    datasets: []
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchChartData();
  }, [type]);

  const fetchChartData = async () => {
    try {
      setLoading(true);
      
      const bills = await billsAPI.getAll();
      
      switch (type) {
        case 'revenue':
          setChartData(processRevenueData(bills));
          break;
        case 'transactions':
          setChartData(processTransactionData(bills));
          break;
        case 'distribution':
          setChartData(processDistributionData(bills));
          break;
      }
    } catch (error) {
      console.error('Error fetching chart data:', error);
      setChartData({
        labels: [],
        datasets: []
      });
    } finally {
      setLoading(false);
    }
  };

  const processRevenueData = (bills: any[]) => {
    const monthlyRevenue = new Array(12).fill(0);
    const currentYear = new Date().getFullYear();
    
    bills.forEach((bill: any) => {
      if (bill.status === 'paid' && bill.paid_date) {
        const paidDate = new Date(bill.paid_date);
        if (paidDate.getFullYear() === currentYear) {
          const month = paidDate.getMonth();
          monthlyRevenue[month] += bill.amount || 0;
        }
      }
    });

    const revenueInMillions = monthlyRevenue.map(amount => Math.round(amount / 1000000));

    return {
      labels: ['T1', 'T2', 'T3', 'T4', 'T5', 'T6', 'T7', 'T8', 'T9', 'T10', 'T11', 'T12'],
      datasets: [
        {
          label: 'Doanh thu (triệu VND)',
          data: revenueInMillions,
          borderColor: 'rgb(59, 130, 246)',
          backgroundColor: 'rgba(59, 130, 246, 0.1)',
          borderWidth: 3,
          fill: true,
        },
      ],
    };
  };

  const processTransactionData = (bills: any[]) => {
    const monthlyCompleted = new Array(12).fill(0);
    const monthlyPending = new Array(12).fill(0);
    const currentYear = new Date().getFullYear();
    
    bills.forEach((bill: any) => {
      const billDate = new Date(bill.created_at);
      if (billDate.getFullYear() === currentYear) {
        const month = billDate.getMonth();
        if (bill.status === 'paid') {
          monthlyCompleted[month]++;
        } else if (bill.status === 'pending') {
          monthlyPending[month]++;
        }
      }
    });

    return {
      labels: ['T1', 'T2', 'T3', 'T4', 'T5', 'T6', 'T7', 'T8', 'T9', 'T10', 'T11', 'T12'],
      datasets: [
        {
          label: 'Giao dịch hoàn thành',
          data: monthlyCompleted,
          backgroundColor: 'rgba(16, 185, 129, 0.8)',
          borderColor: 'rgb(16, 185, 129)',
          borderWidth: 1,
        },
        {
          label: 'Giao dịch đang chờ',
          data: monthlyPending,
          backgroundColor: 'rgba(245, 158, 11, 0.8)',
          borderColor: 'rgb(245, 158, 11)',
          borderWidth: 1,
        },
      ],
    };
  };

  const processDistributionData = (bills: any[]) => {
    const completedCount = bills.filter((bill: any) => bill.status === 'paid').length;
    const pendingCount = bills.filter((bill: any) => bill.status === 'pending').length;
    const failedCount = bills.filter((bill: any) => bill.status === 'cancelled' || bill.status === 'failed').length;

    return {
      labels: ['Hoàn thành', 'Đang chờ', 'Thất bại'],
      datasets: [
        {
          label: 'Phân bổ giao dịch',
          data: [completedCount, pendingCount, failedCount],
          backgroundColor: [
            'rgba(16, 185, 129, 0.8)',
            'rgba(245, 158, 11, 0.8)',
            'rgba(239, 68, 68, 0.8)',
          ],
          borderColor: [
            'rgb(16, 185, 129)',
            'rgb(245, 158, 11)',
            'rgb(239, 68, 68)',
          ],
          borderWidth: 2,
        },
      ],
    };
  };



  const options = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'top' as const,
        labels: {
          font: {
            size: 12,
            weight: 'bold' as const,
          },
          color: '#374151',
        },
      },
      title: {
        display: true,
        text: type === 'revenue' ? 'Biểu đồ doanh thu theo tháng' :
              type === 'transactions' ? 'Biểu đồ giao dịch theo tháng' :
              'Phân bổ trạng thái giao dịch',
        font: {
          size: 16,
          weight: 'bold' as const,
        },
        color: '#1e293b',
      },
    },
    scales: type !== 'distribution' ? {
      y: {
        beginAtZero: true,
        grid: {
          color: 'rgba(0, 0, 0, 0.1)',
        },
        ticks: {
          color: '#64748b',
          font: {
            size: 12,
          },
        },
      },
      x: {
        grid: {
          color: 'rgba(0, 0, 0, 0.1)',
        },
        ticks: {
          color: '#64748b',
          font: {
            size: 12,
          },
        },
      },
    } : undefined,
  };

  const renderChart = () => {
    if (loading) {
      return (
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          height: '100%',
          color: '#64748b'
        }}>
          Đang tải dữ liệu...
        </div>
      );
    }
      
    if (!chartData.labels || chartData.labels.length === 0 || 
        !chartData.datasets || chartData.datasets.length === 0 ||
        chartData.datasets.every(dataset => dataset.data.every(value => value === 0))) {
      return (
        <EmptyState
          type="no-data"
          title="Không có dữ liệu"
          message="Chưa có dữ liệu thống kê để hiển thị. Dữ liệu sẽ xuất hiện khi có giao dịch thanh toán."
        />
      );
    }

    switch (type) {
      case 'revenue':
        return <Line data={chartData} options={options} />;
      case 'transactions':
        return <Bar data={chartData} options={options} />;
      case 'distribution':
        return <Doughnut data={chartData} options={options} />;
      default:
        return null;
    }
  };

  return (
    <div style={{
      background: 'linear-gradient(135deg, #ffffff 0%, #f8fafc 100%)',
      borderRadius: '1.25rem',
      padding: '2rem',
      boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
      border: '1px solid rgba(255, 255, 255, 0.2)',
      height: '400px'
    }}>
      {renderChart()}
    </div>
  );
}
