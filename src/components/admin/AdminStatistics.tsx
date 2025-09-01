"use client";

import { useState, useEffect } from 'react';
import { 
  UsersIcon, 
  UserGroupIcon, 
  CurrencyDollarIcon,
  ChartBarIcon,
  ArrowTrendingUpIcon,
  ArrowTrendingDownIcon,
  CalendarDaysIcon,
  ClockIcon
} from '@heroicons/react/24/outline';
import { residentAPI, userAPI, paymentAPI } from '@/lib/api';
import EmptyState from './EmptyState';
import { formatDisplayCurrency, formatActualCurrency, isDisplayMultiplierEnabled } from '@/lib/utils/currencyUtils';

interface StatisticsData {
  hospitalizedResidents: number;
  activeStaff: number;
  totalRevenue: number;
  monthlyRevenue: number;
  pendingPayments: number;
  completedPayments: number;
  revenueTrend: 'up' | 'down' | 'stable';
  revenueChange: number;
}

export default function AdminStatistics() {
  const [stats, setStats] = useState<StatisticsData>({
    hospitalizedResidents: 0,
    activeStaff: 0,
    totalRevenue: 0,
    monthlyRevenue: 0,
    pendingPayments: 0,
    completedPayments: 0,
    revenueTrend: 'stable',
    revenueChange: 0
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchStatistics();
  }, []);

  const fetchStatistics = async () => {
    try {
      setLoading(true);
      
      const residents = await residentAPI.getAll();
      const hospitalizedResidents = residents.filter((resident: any) => 
        resident.status === 'active'
      ).length;

      const users = await userAPI.getAll();
      const activeStaff = users.filter((user: any) => 
        user.role === 'staff' && user.status === 'active'
      ).length;

      const response = await fetch('/api/payment/stats', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
          'Content-Type': 'application/json'
        }
      });
      
      if (response.ok) {
        const paymentStats = await response.json();
        setStats({
          hospitalizedResidents,
          activeStaff,
          totalRevenue: paymentStats.totalRevenue || 0,
          monthlyRevenue: paymentStats.monthlyRevenue || 0,
          pendingPayments: paymentStats.pendingBills || 0,
          completedPayments: paymentStats.paidBills || 0,
          revenueTrend: paymentStats.growthPercentage > 0 ? 'up' : paymentStats.growthPercentage < 0 ? 'down' : 'stable',
          revenueChange: Math.abs(paymentStats.growthPercentage || 0)
        });
      } else {
        console.error('Failed to fetch payment stats:', response.status);
        setStats({
          hospitalizedResidents,
          activeStaff,
          totalRevenue: 0,
          monthlyRevenue: 0,
          pendingPayments: 0,
          completedPayments: 0,
          revenueTrend: 'stable',
          revenueChange: 0
        });
      }
    } catch (error) {
      console.error('Error fetching statistics:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (amount: number) => {
    return formatDisplayCurrency(amount);
  };

  const StatCard = ({ 
    title, 
    value, 
    icon: Icon, 
    gradient, 
    subtitle,
    trend,
    trendValue 
  }: {
    title: string;
    value: string | number;
    icon: any;
    gradient: string;
    subtitle?: string;
    trend?: 'up' | 'down' | 'stable';
    trendValue?: number;
  }) => (
    <div style={{
      background: 'linear-gradient(135deg, #ffffff 0%, #f8fafc 100%)',
      borderRadius: '1.25rem',
      padding: '2rem',
      boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
      border: '1px solid rgba(255, 255, 255, 0.2)',
      position: 'relative',
      overflow: 'hidden'
    }}>
      <div style={{
        width: '3.5rem',
        height: '3.5rem',
        background: gradient,
        borderRadius: '1rem',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: '1.5rem',
        boxShadow: '0 8px 16px -4px rgba(0, 0, 0, 0.1)'
      }}>
        <Icon style={{ width: '1.75rem', height: '1.75rem', color: 'white' }} />
      </div>

      <h3 style={{
        fontSize: '1.125rem',
        fontWeight: 600,
        margin: '0 0 0.5rem 0',
        color: '#64748b'
      }}>
        {title}
      </h3>
      
      <div style={{
        fontSize: '2rem',
        fontWeight: 700,
        margin: '0 0 0.5rem 0',
        color: '#1e293b'
      }}>
        {value}
      </div>

      {subtitle && (
        <p style={{
          fontSize: '0.875rem',
          color: '#64748b',
          margin: '0 0 0.75rem 0'
        }}>
          {subtitle}
        </p>
      )}

      {trend && trendValue && (
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '0.5rem',
          fontSize: '0.875rem',
          fontWeight: 600
        }}>
          {trend === 'up' ? (
            <ArrowTrendingUpIcon style={{ width: '1rem', height: '1rem', color: '#10b981' }} />
          ) : trend === 'down' ? (
            <ArrowTrendingDownIcon style={{ width: '1rem', height: '1rem', color: '#ef4444' }} />
          ) : (
            <ChartBarIcon style={{ width: '1rem', height: '1rem', color: '#6b7280' }} />
          )}
          <span style={{
            color: trend === 'up' ? '#10b981' : trend === 'down' ? '#ef4444' : '#6b7280'
          }}>
            {trend === 'up' ? '+' : ''}{trendValue}%
          </span>
        </div>
      )}

      <div style={{
        position: 'absolute',
        top: 0,
        right: 0,
        width: '80px',
        height: '80px',
        background: gradient,
        opacity: 0.1,
        borderRadius: '50%',
        transform: 'translate(30px, -30px)'
      }} />
    </div>
  );

  if (loading) {
    return (
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
        gap: '1.5rem',
        marginBottom: '2rem'
      }}>
        {[1, 2, 3, 4].map((i) => (
          <div key={i} style={{
            background: 'linear-gradient(135deg, #ffffff 0%, #f8fafc 100%)',
            borderRadius: '1.25rem',
            padding: '2rem',
            boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
            border: '1px solid rgba(255, 255, 255, 0.2)',
            minHeight: '200px'
          }}>
            <div style={{
              width: '3.5rem',
              height: '3.5rem',
              background: '#e2e8f0',
              borderRadius: '1rem',
              marginBottom: '1.5rem'
            }} />
            <div style={{
              width: '60%',
              height: '1.5rem',
              background: '#e2e8f0',
              borderRadius: '0.5rem',
              marginBottom: '0.5rem'
            }} />
            <div style={{
              width: '40%',
              height: '2rem',
              background: '#e2e8f0',
              borderRadius: '0.5rem'
            }} />
          </div>
        ))}
      </div>
    );
  }

  const hasNoData = stats.hospitalizedResidents === 0 && 
                   stats.activeStaff === 0 && 
                   stats.totalRevenue === 0 && 
                   stats.monthlyRevenue === 0 && 
                   stats.pendingPayments === 0;

  if (hasNoData) {
    return (
      <div style={{ marginBottom: '2rem' }}>
        <EmptyState
          type="no-data"
          title="Không có dữ liệu thống kê"
          message="Hiện tại chưa có dữ liệu để hiển thị. Dữ liệu sẽ xuất hiện khi có người cao tuổi, nhân viên hoặc giao dịch thanh toán."
        />
      </div>
    );
  }

  return (
    <div style={{
      display: 'grid',
      gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
      gap: '1.5rem',
      marginBottom: '2rem'
    }}>
      <StatCard
        title="Người cao tuổi đang nằm viện"
        value={stats.hospitalizedResidents}
        icon={UsersIcon}
        gradient="linear-gradient(135deg, #ef4444 0%, #dc2626 100%)"
        subtitle="người cao tuổi đang được chăm sóc"
      />

      <StatCard
        title="Nhân viên đang làm việc"
        value={stats.activeStaff}
        icon={UserGroupIcon}
        gradient="linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)"
        subtitle="Đội ngũ y tế hoạt động"
      />

      <StatCard
        title="Doanh thu tháng này"
        value={formatCurrency(stats.monthlyRevenue)}
        icon={CurrencyDollarIcon}
        gradient="linear-gradient(135deg, #10b981 0%, #059669 100%)"
        subtitle="Tổng thu từ Payos"
        trend={stats.revenueTrend}
        trendValue={stats.revenueChange}
      />

      <StatCard
        title="Thanh toán đang chờ"
        value={stats.pendingPayments}
        icon={ClockIcon}
        gradient="linear-gradient(135deg, #f59e0b 0%, #d97706 100%)"
        subtitle="Giao dịch chưa hoàn tất"
      />
    </div>
  );
}
