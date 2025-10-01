"use client";

import { useAuth } from '@/lib/contexts/auth-context';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import PaymentManagement from '@/components/admin/PaymentManagement';
import ResidentStaffList from '@/components/admin/ResidentStaffList';
import { residentAPI, userAPI, billsAPI } from '@/lib/api';
import { formatDisplayCurrency } from '@/lib/utils/currencyUtils';
import {
  ChartBarIcon,
  UsersIcon,
  UserGroupIcon,
  CurrencyDollarIcon,
  CalendarDaysIcon,
  ClockIcon,
  ArrowLeftIcon
} from '@heroicons/react/24/outline';

interface DashboardStats {
  residentsCount: number;
  staffCount: number;
  totalRevenue: number;
  loading: boolean;
}

export default function AdminDashboardPage() {
  const { user } = useAuth();
  const router = useRouter();
  const [stats, setStats] = useState<DashboardStats>({
    residentsCount: 0,
    staffCount: 0,
    totalRevenue: 0,
    loading: true
  });

  useEffect(() => {
    if (!user) {
      router.push('/login');
      return;
    }

    if (user.role !== 'admin') {
      router.push('/');
      return;
    }
  }, [user, router]);

  useEffect(() => {
    fetchDashboardStats();
  }, []);

  const fetchDashboardStats = async () => {
    try {
      setStats(prev => ({ ...prev, loading: true }));

      // Fetch residents count
      const residentsData = await residentAPI.getAll();
      const residentsArr: any[] = Array.isArray(residentsData)
        ? residentsData
        : (residentsData && Array.isArray((residentsData as any).data))
          ? (residentsData as any).data
          : [];
      const admittedResidents = residentsArr.filter((resident: any) => 
        resident.status === 'admitted'
      );

      // Fetch staff count
      const staffData = await userAPI.getAll();
      const staffArr: any[] = Array.isArray(staffData)
        ? staffData
        : (staffData && Array.isArray((staffData as any).data))
          ? (staffData as any).data
          : [];
      const activeStaff = staffArr.filter((user: any) => 
        user.role === 'staff' && user.status === 'active'
      );

      // Fetch revenue data - using same logic as PaymentManagement
      const billsData = await billsAPI.getAll();
      const billsArr: any[] = Array.isArray(billsData)
        ? billsData
        : (billsData && Array.isArray((billsData as any).data))
          ? (billsData as any).data
          : [];
      
      // Filter residents by allowed statuses (same as PaymentManagement)
      const allowedStatuses = new Set(['admitted','active','discharged','deceased','accepted']);
      const allowedResidentIds = new Set<string>();
      residentsArr.forEach((r: any) => {
        const status = String(r?.status || '').toLowerCase();
        if (!allowedStatuses.has(status)) return;
        const id: string = (r._id || r.id || '').toString();
        if (!id) return;
        allowedResidentIds.add(id);
      });
      
      // Calculate total revenue from completed payments (same logic as PaymentManagement)
      const completedTransactions = billsArr
        .filter((bill: any) => {
          let residentId: any = bill.resident_id || bill.residentId || bill.resident;
          let residentObj: any = null;
          if (typeof residentId === 'object' && residentId !== null) {
            residentObj = residentId;
            residentId = residentId._id || residentId.id || residentId;
          }
          residentId = String(residentId || '');
          
          // Skip bills if resident is not allowed or not identifiable
          if (!residentId || (!allowedResidentIds.has(residentId) && !allowedStatuses.has(String(residentObj?.status || '').toLowerCase()))) {
            return false;
          }
          
          return bill.status === 'paid';
        })
        .reduce((sum: number, bill: any) => sum + (bill.amount || 0), 0);
      
      const totalRevenue = completedTransactions;

      setStats({
        residentsCount: admittedResidents.length,
        staffCount: activeStaff.length,
        totalRevenue: totalRevenue,
        loading: false
      });
    } catch (error) {
      console.error('Error fetching dashboard stats:', error);
      setStats(prev => ({ ...prev, loading: false }));
    }
  };

  if (!user || user.role !== 'admin') {
    return null;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100">
      <div className="max-w-7xl mx-auto px-6 py-6">
        {/* Header Section */}
        <div className="bg-gradient-to-br from-white via-white to-blue-50 rounded-2xl p-6 mb-6 shadow-xl border border-white/50 backdrop-blur-sm">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <button
                onClick={() => router.push('/admin')}
                className="group p-3 rounded-full bg-gradient-to-r from-slate-100 to-slate-200 hover:from-red-100 hover:to-orange-100 text-slate-700 hover:text-red-700 hover:shadow-lg hover:shadow-red-200/50 hover:-translate-x-0.5 transition-all duration-300"
                title="Quay lại"
              >
                <ArrowLeftIcon className="w-5 h-5 group-hover:scale-110 transition-transform duration-200" />
              </button>
              
              <div className="w-14 h-14 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-2xl flex items-center justify-center shadow-2xl shadow-blue-500/25">
                <ChartBarIcon className="w-7 h-7 text-white" />
              </div>
              
              <div>
                <h1 className="text-3xl font-black text-transparent bg-clip-text bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 mb-2 tracking-tight">
                  Bảng Thống Kê
                </h1>
                <p className="text-base text-slate-600 font-semibold flex items-center gap-2">
                  
                  Quản lý viện dưỡng lão - Thanh toán & Nhân sự
                </p>
              </div>
            </div>
          </div>
        </div>


        {/* Statistics Cards Section */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <div className="bg-gradient-to-br from-white via-white to-blue-50 rounded-xl p-4 shadow-lg border border-white/50 backdrop-blur-sm">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-blue-600 font-bold mb-1 uppercase tracking-wide">Người cao tuổi</p>
                <p className="text-2xl font-black text-blue-700 mb-1">
                  {stats.loading ? '...' : stats.residentsCount}
                </p>
                <p className="text-xs text-blue-600 font-semibold">Đang chăm sóc</p>
              </div>
              <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-xl flex items-center justify-center shadow-lg">
                <UsersIcon className="w-6 h-6 text-white" />
              </div>
            </div>
          </div>

          <div className="bg-gradient-to-br from-white via-white to-green-50 rounded-xl p-4 shadow-lg border border-white/50 backdrop-blur-sm">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-green-600 font-bold mb-1 uppercase tracking-wide">Nhân viên</p>
                <p className="text-2xl font-black text-green-700 mb-1">
                  {stats.loading ? '...' : stats.staffCount}
                </p>
                <p className="text-xs text-green-600 font-semibold">Đang làm việc</p>
              </div>
              <div className="w-12 h-12 bg-gradient-to-br from-green-500 to-emerald-600 rounded-xl flex items-center justify-center shadow-lg">
                <UserGroupIcon className="w-6 h-6 text-white" />
              </div>
            </div>
          </div>

          <div className="bg-gradient-to-br from-white via-white to-purple-50 rounded-xl p-4 shadow-lg border border-white/50 backdrop-blur-sm">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-purple-600 font-bold mb-1 uppercase tracking-wide">Doanh thu</p>
                <p className="text-2xl font-black text-purple-700 mb-1">
                  {stats.loading ? '...' : formatDisplayCurrency(stats.totalRevenue)}
                </p>
                <p className="text-xs text-purple-600 font-semibold">Tổng doanh thu</p>
              </div>
              <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-pink-600 rounded-xl flex items-center justify-center shadow-lg">
                <CurrencyDollarIcon className="w-6 h-6 text-white" />
              </div>
            </div>
          </div>
        </div>

        {/* Payment Management Section */}
        <div className="mb-6">
          <PaymentManagement />
        </div>

        {/* Resident Staff List Section */}
        <div className="mb-6">
          <ResidentStaffList />
        </div>

        {/* Quick Actions Section */}
        <div className="bg-gradient-to-br from-white via-white to-slate-50 rounded-2xl p-6 shadow-xl border border-white/50 backdrop-blur-sm">
          <div className="mb-4">
            <h2 className="text-xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-slate-700 to-blue-700 mb-2 flex items-center gap-2">
              <div className="w-6 h-6 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-lg flex items-center justify-center shadow-lg">
                <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
              </div>
              Thao tác nhanh
            </h2>
            <p className="text-xs text-slate-600 font-medium">Truy cập nhanh các chức năng quản lý chính</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <button
              onClick={() => router.push('/admin/staff-assignments')}
              className="group flex items-center gap-3 p-4 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-xl border border-blue-400/20 text-white cursor-pointer transition-all duration-300 shadow-lg hover:shadow-2xl hover:shadow-blue-500/25 hover:-translate-y-1"
            >
              <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform duration-300">
                <UserGroupIcon className="w-6 h-6 text-white" />
              </div>
              <div className="text-left">
                <div className="font-bold text-sm mb-1">
                  Quản lý phân công
                </div>
                <div className="text-xs opacity-90">
                  Phân công nhân viên chăm sóc
                </div>
              </div>
            </button>

            <button
              onClick={() => router.push('/admin/room-management')}
              className="group flex items-center gap-3 p-4 bg-gradient-to-br from-green-500 to-emerald-600 rounded-xl border border-green-400/20 text-white cursor-pointer transition-all duration-300 shadow-lg hover:shadow-2xl hover:shadow-green-500/25 hover:-translate-y-1"
            >
              <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform duration-300">
                <CalendarDaysIcon className="w-6 h-6 text-white" />
              </div>
              <div className="text-left">
                <div className="font-bold text-sm mb-1">
                  Quản lý phòng & giường
                </div>
                <div className="text-xs opacity-90">
                  Phân bổ phòng cho người cao tuổi
                </div>
              </div>
            </button>

            <button
              onClick={() => router.push('/admin/vital-signs')}
              className="group flex items-center gap-3 p-4 bg-gradient-to-br from-red-500 to-pink-600 rounded-xl border border-red-400/20 text-white cursor-pointer transition-all duration-300 shadow-lg hover:shadow-2xl hover:shadow-red-500/25 hover:-translate-y-1"
            >
              <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform duration-300">
                <ClockIcon className="w-6 h-6 text-white" />
              </div>
              <div className="text-left">
                <div className="font-bold text-sm mb-1">
                  Chỉ số sức khỏe
                </div>
                <div className="text-xs opacity-90">
                  Theo dõi sức khỏe người cao tuổi
                </div>
              </div>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}