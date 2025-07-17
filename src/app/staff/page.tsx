"use client";

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { 
  MagnifyingGlassIcon, 
  FunnelIcon, 
  PlusCircleIcon, 
  PencilIcon, 
  EyeIcon, 
  CalendarIcon,
  TrashIcon,
  UsersIcon,
  CheckCircleIcon,
  XMarkIcon,
  ArrowLeftIcon,
} from '@heroicons/react/24/outline';
import { useAuth } from '@/lib/contexts/auth-context';
import RoleDashboard from '@/components/RoleDashboard';
import StaffDashboardWidgets from '@/components/staff/StaffDashboardWidgets';

export default function StaffDashboardPage() {
  const { user, loading } = useAuth();
  const router = useRouter();

  // Chỉ cho phép staff truy cập
  useEffect(() => {
    if (!loading && (!user || user.role !== 'staff')) {
      router.replace('/');
    }
  }, [user, loading, router]);

  if (loading || !user) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)' }}>
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto"></div>
        <p style={{ marginLeft: 16, color: '#6366f1', fontWeight: 600 }}>Đang tải...</p>
      </div>
    );
  }

  if (user.role !== 'staff') return null;

  return (
    <div style={{ minHeight: '100vh', background: 'linear-gradient(135deg, #f8fafc 0%, #e2e8f0 100%)' }}>
      {/* Staff Dashboard Widgets */}
      <div style={{ maxWidth: 1200, margin: '0 auto', padding: '2rem 1rem' }}>
        <StaffDashboardWidgets />
        <RoleDashboard />
      </div>
    </div>
  );
} 
