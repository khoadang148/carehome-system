"use client";

import { useState, useEffect, useCallback } from 'react';
import {
  ChartBarIcon,
  CurrencyDollarIcon,
  DocumentTextIcon,
  CalendarDaysIcon,
  ArrowUpIcon,
  ArrowDownIcon,
  EyeIcon,
  ArrowLeftIcon,
  PencilIcon,
  TrashIcon,
  UserIcon
} from '@heroicons/react/24/outline';
import { useRouter } from 'next/navigation';
import { billsAPI, bedAssignmentsAPI } from '../../../lib/api';
import { Dialog } from '@headlessui/react';
import { formatDisplayCurrency, formatActualCurrency, isDisplayMultiplierEnabled } from '@/lib/utils/currencyUtils';
import { clientStorage } from '@/lib/utils/clientStorage';

interface FinancialRecord {
  _id: string;
  title: string;
  amount: number;
  due_date: string;
  paid_date?: string | null;
  payment_method?: string;
  status: string;
  notes?: string;
  resident_id?: string | {
    _id: string;
    full_name: string;
  };
  family_member_id?: string | {
    _id: string;
    full_name: string;
    email: string;
  };
  staff_id?: string | {
    _id: string;
    full_name: string;
  };
  care_plan_assignment_id?: {
    assigned_room_id?: {
      room_number: string;
      room_type: string;
      floor: string;
    };
    assigned_bed_id?: {
      bed_number: string;
      bed_type: string;
    };
    care_plan_ids?: Array<{
      plan_name: string;
      description: string;
      monthly_price: number;
    }>;
  };
  created_at?: string;
  updated_at?: string;
}

export default function FinancialReportsPage() {
  const router = useRouter();
  const [records, setRecords] = useState<FinancialRecord[]>([]);
  const [loading, setLoading] = useState(false);
  const [dateFilter, setDateFilter] = useState<string>('this_month');
  const [customDateRange, setCustomDateRange] = useState<{ start: string; end: string }>({
    start: '',
    end: ''
  });
  const [displayDateRange, setDisplayDateRange] = useState<{ start: string; end: string }>({
    start: '',
    end: ''
  });
  const [showCustomDatePicker, setShowCustomDatePicker] = useState(false);
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [showBillModal, setShowBillModal] = useState(false);
  const [editBill, setEditBill] = useState<FinancialRecord | null>(null);
  const [deleteBill, setDeleteBill] = useState<FinancialRecord | null>(null);
  const [editReason, setEditReason] = useState('');
  const [deleteReason, setDeleteReason] = useState('');
  const [editError, setEditError] = useState('');
  const [deleteError, setDeleteError] = useState('');
  const [saving, setSaving] = useState(false);
  const [originalEditBill, setOriginalEditBill] = useState<FinancialRecord | null>(null);
  const [residentRooms, setResidentRooms] = useState<Record<string, string>>({});
  const [expandedTitles, setExpandedTitles] = useState<Set<string>>(new Set());
  const [showTooltip, setShowTooltip] = useState<{ id: string; x: number; y: number } | null>(null);

  const ROOM_CACHE_TTL_MS = 60 * 1000; // 60s
  const roomCacheKey = (residentId: string) => `residentRoom:${residentId}`;

  const getRoomFromCache = (residentId: string): string | null => {
    try {
      const raw = clientStorage.getItem(roomCacheKey(residentId));
      if (!raw) return null;
      const parsed = JSON.parse(raw) as { expiresAt: number; value: string };
      if (!parsed || parsed.expiresAt < Date.now()) return null;
      return parsed.value || null;
    } catch { return null; }
  };

  const setRoomCache = (residentId: string, value: string) => {
    try {
      clientStorage.setItem(roomCacheKey(residentId), JSON.stringify({ expiresAt: Date.now() + ROOM_CACHE_TTL_MS, value }));
    } catch {}
  };

  const formatDateToDDMMYYYY = (dateString: string) => {
    const date = new Date(dateString);
    const day = date.getDate().toString().padStart(2, '0');
    const month = (date.getMonth() + 1).toString().padStart(2, '0');
    const year = date.getFullYear();
    return `${day}/${month}/${year}`;
  };

  const fetchBills = useCallback(async () => {
    setLoading(true);
    try {
      const data = await billsAPI.getAll();
      setRecords(data);

      // Progressive: fill rooms from cache immediately
      const roomMap: Record<string, string> = {};
      const residentIds = new Set<string>();
      for (const record of data) {
        if (!record.resident_id) continue;
        const rid = typeof record.resident_id === 'object' ? record.resident_id._id : record.resident_id;
        if (!rid) continue;
        const cached = getRoomFromCache(rid);
        if (cached) roomMap[rid] = cached;
        residentIds.add(rid);
      }
      if (Object.keys(roomMap).length) setResidentRooms(prev => ({ ...roomMap, ...prev }));

      // Fetch missing rooms with concurrency limit
      const idsToFetch = Array.from(residentIds).filter(id => !roomMap[id]);
      const limit = 5;
      let idx = 0;
      const results: Record<string, string> = {};
      const worker = async () => {
        while (idx < idsToFetch.length) {
          const i = idx++;
          const rid = idsToFetch[i];
          try {
            const bedAssignments = await bedAssignmentsAPI.getByResidentId(rid);
            if (Array.isArray(bedAssignments) && bedAssignments.length > 0) {
              const bedAssignment = bedAssignments[0];
              const rn = bedAssignment?.bed_id?.room_id?.room_number || 'Đã xuất viện';
              results[rid] = rn;
              setRoomCache(rid, rn);
            } else {
              results[rid] = 'Đã xuất viện';
              setRoomCache(rid, 'Đã xuất viện');
            }
          } catch {
            results[rid] = 'Đã xuất viện';
          }
        }
      };
      await Promise.all(Array.from({ length: Math.min(limit, idsToFetch.length) }, () => worker()));
      if (Object.keys(results).length) setResidentRooms(prev => ({ ...prev, ...results }));
    } catch (err) {
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchBills();
  }, [fetchBills]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Element;
      if (showCustomDatePicker && !target.closest('.date-picker-container')) {
        setShowCustomDatePicker(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showCustomDatePicker]);

  const filteredRecords = records.filter(record => {
    const recordDate = new Date(record.due_date || record.created_at || '');
    const now = new Date();
    let dateMatch = true;
    
    if (dateFilter === 'custom' && customDateRange.start && customDateRange.end) {
      const startDate = new Date(customDateRange.start);
      const endDate = new Date(customDateRange.end);
      endDate.setHours(23, 59, 59, 999);
      dateMatch = recordDate >= startDate && recordDate <= endDate;
    } else if (dateFilter === 'this_month') {
      dateMatch = recordDate.getMonth() === now.getMonth() && recordDate.getFullYear() === now.getFullYear();
    } else if (dateFilter === 'last_month') {
      const lastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
      const lastMonthEnd = new Date(now.getFullYear(), now.getMonth(), 0);
      dateMatch = recordDate >= lastMonth && recordDate <= lastMonthEnd;
    } else if (dateFilter === 'this_week') {
      const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
      dateMatch = recordDate >= weekAgo;
    } else if (dateFilter === 'last_week') {
      const twoWeeksAgo = new Date(now.getTime() - 14 * 24 * 60 * 60 * 1000);
      const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
      dateMatch = recordDate >= twoWeeksAgo && recordDate < weekAgo;
    } else if (dateFilter === 'this_quarter') {
      const currentQuarter = Math.floor(now.getMonth() / 3);
      const quarterStart = new Date(now.getFullYear(), currentQuarter * 3, 1);
      const quarterEnd = new Date(now.getFullYear(), (currentQuarter + 1) * 3, 0);
      dateMatch = recordDate >= quarterStart && recordDate <= quarterEnd;
    } else if (dateFilter === 'this_year') {
      dateMatch = recordDate.getFullYear() === now.getFullYear();
    } else if (dateFilter === 'last_year') {
      dateMatch = recordDate.getFullYear() === now.getFullYear() - 1;
    }
    
    const statusMatch = statusFilter === 'all' || record.status === statusFilter;
    return dateMatch && statusMatch;
  });

  const totalIncome = filteredRecords
    .filter(r => r.amount > 0)
    .reduce((sum, r) => sum + r.amount, 0);

  const statusMap: Record<string, { label: string; className: string }> = {
    completed: { label: 'Đã thanh toán', className: 'bg-green-100 text-green-800' },
    paid: { label: 'Đã thanh toán', className: 'bg-green-100 text-green-800' },
    pending: { label: 'Chưa thanh toán', className: 'bg-yellow-100 text-yellow-800' },
    unpaid: { label: 'Chưa thanh toán', className: 'bg-yellow-100 text-yellow-800' },
    cancelled: { label: 'Đã hủy', className: 'bg-red-100 text-red-800' },
    processing: { label: 'Đang xử lý', className: 'bg-blue-100 text-blue-800' },
  };

  const getResidentInfo = (record: FinancialRecord) => {
    if (typeof record.resident_id === 'object' && record.resident_id) {
      return {
        name: record.resident_id.full_name,
        id: record.resident_id._id
      };
    }
    return { name: 'Không xác định', id: record.resident_id || '' };
  };

  const getRoomInfo = (record: FinancialRecord) => {
    if (record.resident_id) {
      const residentId = typeof record.resident_id === 'object' ? record.resident_id._id : record.resident_id;
      const roomNumber = residentRooms[residentId];
      return roomNumber || 'Đã xuất viện';
    }
    return 'Đã xuất viện';
  };

  const truncateTitle = (title: string, maxLength: number = 40) => {
    if (title.length <= maxLength) return title;
    return title.substring(0, maxLength) + '...';
  };

  const toggleTitleExpansion = (recordId: string) => {
    const newExpanded = new Set(expandedTitles);
    if (newExpanded.has(recordId)) {
      newExpanded.delete(recordId);
    } else {
      newExpanded.add(recordId);
    }
    setExpandedTitles(newExpanded);
  };

  const handleTitleMouseEnter = (e: React.MouseEvent, recordId: string, title: string) => {
    if (title.length > 40) {
      const rect = e.currentTarget.getBoundingClientRect();
      setShowTooltip({
        id: recordId,
        x: rect.left + rect.width / 2,
        y: rect.top - 10
      });
    }
  };

  const handleTitleMouseLeave = () => {
    setShowTooltip(null);
  };

  const getDateFilterLabel = (filter: string) => {
    const now = new Date();
    switch (filter) {
      case 'this_week':
        return 'Tuần này';
      case 'last_week':
        return 'Tuần trước';
      case 'this_month':
        return 'Tháng này';
      case 'last_month':
        return 'Tháng trước';
      case 'this_quarter':
        return 'Quý này';
      case 'this_year':
        return 'Năm nay';
      case 'last_year':
        return 'Năm trước';
      case 'custom':
        return customDateRange.start && customDateRange.end 
          ? `${formatDateToDDMMYYYY(customDateRange.start)} - ${formatDateToDDMMYYYY(customDateRange.end)}`
          : 'Tùy chọn';
      default:
        return 'Tất cả';
    }
  };

  const handleCustomDateApply = () => {
    if (customDateRange.start && customDateRange.end) {
      setDateFilter('custom');
      setShowCustomDatePicker(false);
    }
  };

  const handleQuickDateSelect = (filter: string) => {
    setDateFilter(filter);
    setShowCustomDatePicker(false);
  };

  const hasEditChanges = () => {
    if (!editBill || !originalEditBill) return false;
    
    return (
      editBill.title !== originalEditBill.title ||
      editBill.due_date !== originalEditBill.due_date ||
      editBill.notes !== originalEditBill.notes
    );
  };

  const handleEditBill = async () => {
    if (!editBill) return;
    if (!editBill.notes?.trim()) {
      setEditError('Vui lòng nhập ghi chú.');
      return;
    }
    setSaving(true);
    try {
      await billsAPI.update(editBill._id, { ...editBill, notes: (editBill.notes || '') + `\n[Lý do chỉnh sửa]: ${editReason}` });
      setEditBill(null);
      setOriginalEditBill(null);
      setEditReason('');
      setEditError('');
      fetchBills();
    } catch (err) {
      setEditError('Có lỗi khi cập nhật hóa đơn.');
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteBill = async () => {
    if (!deleteBill) return;

    if (deleteBill.status === 'completed' || deleteBill.status === 'paid') {
      setDeleteError('Không thể xóa hóa đơn đã thanh toán.');
      return;
    }

    if (deleteBill.status === 'cancelled') {
      setDeleteError('Không thể xóa hóa đơn đã hủy.');
      return;
    }

    setSaving(true);
    try {
      await billsAPI.delete(deleteBill._id);
      setDeleteBill(null);
      setDeleteReason('');
      setDeleteError('');
      fetchBills();
    } catch (err) {
      setDeleteError('Có lỗi khi xóa hóa đơn.');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Đang tải dữ liệu...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 relative z-10">
      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="rounded-2xl shadow bg-gradient-to-r from-blue-200 to-indigo-200 px-8 py-8 mb-8 flex flex-col md:flex-row md:items-center md:gap-6">
          <div className="flex items-center gap-6 mb-4 md:mb-0">
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 bg-gradient-to-br from-emerald-500 to-blue-600 rounded-2xl flex items-center justify-center shadow-lg">
                <ChartBarIcon className="w-8 h-8 text-white" />
              </div>
              <div>
                <h1 className="text-3xl font-bold text-gray-800 mb-2">Hoá đơn</h1>
                <p className="text-gray-600 text-base">Danh sách hóa đơn và thanh toán</p>
                  
              </div>
            </div>
          </div>
          <div className="ml-auto flex items-center">
            <button
              className="bg-blue-600 hover:bg-blue-700 text-white font-semibold px-6 py-3 rounded-lg shadow transition-all duration-150"
              onClick={() => router.push('/admin/financial-reports/new')}
            >
              + Tạo hóa đơn
            </button>
          </div>
        </div>

        <div className="bg-white rounded-xl p-6 mb-8 shadow-sm border border-gray-100">
          <div className="flex flex-wrap gap-6">
            {/* Advanced Date Filter */}
            <div className="flex-1 min-w-[300px] date-picker-container">
              <label className="block text-sm font-medium text-gray-700 mb-3">Khoảng thời gian</label>
              <div className="relative">
                <button
                  onClick={() => setShowCustomDatePicker(!showCustomDatePicker)}
                  className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 bg-white hover:bg-gray-50 flex items-center justify-between"
                >
                  <span className="text-gray-900">{getDateFilterLabel(dateFilter)}</span>
                  <CalendarDaysIcon className="w-5 h-5 text-gray-400" />
                </button>
                
                {showCustomDatePicker && (
                  <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-gray-200 rounded-lg shadow-lg z-50 p-4">
                    {/* Quick Date Options */}
                    <div className="mb-4">
                      <h4 className="text-sm font-medium text-gray-700 mb-2">Tùy chọn nhanh</h4>
                      <div className="grid grid-cols-2 gap-2">
                        <button
                          onClick={() => handleQuickDateSelect('this_week')}
                          className={`px-3 py-2 text-sm rounded-md transition-colors ${
                            dateFilter === 'this_week' 
                              ? 'bg-blue-100 text-blue-700 border border-blue-200' 
                              : 'bg-gray-50 text-gray-700 hover:bg-gray-100'
                          }`}
                        >
                          Tuần này
                        </button>
                        <button
                          onClick={() => handleQuickDateSelect('last_week')}
                          className={`px-3 py-2 text-sm rounded-md transition-colors ${
                            dateFilter === 'last_week' 
                              ? 'bg-blue-100 text-blue-700 border border-blue-200' 
                              : 'bg-gray-50 text-gray-700 hover:bg-gray-100'
                          }`}
                        >
                          Tuần trước
                        </button>
                        <button
                          onClick={() => handleQuickDateSelect('this_month')}
                          className={`px-3 py-2 text-sm rounded-md transition-colors ${
                            dateFilter === 'this_month' 
                              ? 'bg-blue-100 text-blue-700 border border-blue-200' 
                              : 'bg-gray-50 text-gray-700 hover:bg-gray-100'
                          }`}
                        >
                          Tháng này
                        </button>
                        <button
                          onClick={() => handleQuickDateSelect('last_month')}
                          className={`px-3 py-2 text-sm rounded-md transition-colors ${
                            dateFilter === 'last_month' 
                              ? 'bg-blue-100 text-blue-700 border border-blue-200' 
                              : 'bg-gray-50 text-gray-700 hover:bg-gray-100'
                          }`}
                        >
                          Tháng trước
                        </button>
                        <button
                          onClick={() => handleQuickDateSelect('this_quarter')}
                          className={`px-3 py-2 text-sm rounded-md transition-colors ${
                            dateFilter === 'this_quarter' 
                              ? 'bg-blue-100 text-blue-700 border border-blue-200' 
                              : 'bg-gray-50 text-gray-700 hover:bg-gray-100'
                          }`}
                        >
                          Quý này
                        </button>
                        <button
                          onClick={() => handleQuickDateSelect('this_year')}
                          className={`px-3 py-2 text-sm rounded-md transition-colors ${
                            dateFilter === 'this_year' 
                              ? 'bg-blue-100 text-blue-700 border border-blue-200' 
                              : 'bg-gray-50 text-gray-700 hover:bg-gray-100'
                          }`}
                        >
                          Năm nay
                        </button>
                        <button
                          onClick={() => handleQuickDateSelect('last_year')}
                          className={`px-3 py-2 text-sm rounded-md transition-colors ${
                            dateFilter === 'last_year' 
                              ? 'bg-blue-100 text-blue-700 border border-blue-200' 
                              : 'bg-gray-50 text-gray-700 hover:bg-gray-100'
                          }`}
                        >
                          Năm trước
                        </button>
                        <button
                          onClick={() => handleQuickDateSelect('all')}
                          className={`px-3 py-2 text-sm rounded-md transition-colors ${
                            dateFilter === 'all' 
                              ? 'bg-blue-100 text-blue-700 border border-blue-200' 
                              : 'bg-gray-50 text-gray-700 hover:bg-gray-100'
                          }`}
                        >
                          Tất cả
                        </button>
                      </div>
                    </div>
                    
                    {/* Custom Date Range */}
                    <div className="border-t pt-4">
                      <h4 className="text-sm font-medium text-gray-700 mb-3">Tùy chọn thời gian</h4>
                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <label className="block text-xs text-gray-600 mb-1">Từ ngày</label>
                          <input
                            type="text"
                            placeholder="dd/mm/yyyy"
                            value={displayDateRange.start}
                            onChange={(e) => {
                              const value = e.target.value;
                              setDisplayDateRange(prev => ({ ...prev, start: value }));
                              
                              // Only convert to ISO format if complete dd/mm/yyyy format
                              if (value.match(/^\d{2}\/\d{2}\/\d{4}$/)) {
                                const [day, month, year] = value.split('/');
                                const isoDate = `${year}-${month}-${day}`;
                                setCustomDateRange(prev => ({ ...prev, start: isoDate }));
                              } else {
                                setCustomDateRange(prev => ({ ...prev, start: '' }));
                              }
                            }}
                            className="w-full px-3 py-2 text-sm border border-gray-200 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                          />
                        </div>
                        <div>
                          <label className="block text-xs text-gray-600 mb-1">Đến ngày</label>
                          <input
                            type="text"
                            placeholder="dd/mm/yyyy"
                            value={displayDateRange.end}
                            onChange={(e) => {
                              const value = e.target.value;
                              setDisplayDateRange(prev => ({ ...prev, end: value }));
                              
                              // Only convert to ISO format if complete dd/mm/yyyy format
                              if (value.match(/^\d{2}\/\d{2}\/\d{4}$/)) {
                                const [day, month, year] = value.split('/');
                                const isoDate = `${year}-${month}-${day}`;
                                setCustomDateRange(prev => ({ ...prev, end: isoDate }));
                              } else {
                                setCustomDateRange(prev => ({ ...prev, end: '' }));
                              }
                            }}
                            className="w-full px-3 py-2 text-sm border border-gray-200 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                          />
                        </div>
                      </div>
                      <div className="flex gap-2 mt-3">
                        <button
                          onClick={handleCustomDateApply}
                          disabled={!customDateRange.start || !customDateRange.end}
                          className="flex-1 px-3 py-2 bg-blue-600 text-white text-sm rounded-md hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors"
                        >
                          Áp dụng
                        </button>
                        <button
                          onClick={() => setShowCustomDatePicker(false)}
                          className="px-3 py-2 bg-gray-200 text-gray-700 text-sm rounded-md hover:bg-gray-300 transition-colors"
                        >
                          Đóng
                        </button>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
            
            {/* Status Filter */}
            <div className="flex-1 min-w-[200px]">
              <label className="block text-sm font-medium text-gray-700 mb-3">Trạng thái</label>
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
              >
                <option value="all">Tất cả trạng thái</option>
                <option value="paid">Đã thanh toán</option>
                <option value="pending">Chưa thanh toán</option>
                <option value="cancelled">Đã hủy</option>
                <option value="processing">Đang xử lý</option>
              </select>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm overflow-hidden border border-gray-100">
          <div className="px-6 py-4 border-b border-gray-100 bg-gradient-to-r from-blue-500 to-indigo-600">
            <h2 className="text-xl font-semibold text-white flex items-center gap-2">
              <DocumentTextIcon className="w-6 h-6 text-white" />
              Chi tiết Hóa đơn
            </h2>
          </div>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-blue-50">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-blue-700 uppercase tracking-wider">Ngày đến hạn</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-blue-700 uppercase tracking-wider">Người cao tuổi</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-blue-700 uppercase tracking-wider">Phòng</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-blue-700 uppercase tracking-wider">Tiêu đề</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-blue-700 uppercase tracking-wider">Số tiền</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-blue-700 uppercase tracking-wider">Trạng thái</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-blue-700 uppercase tracking-wider">Hành động</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-100">
                {filteredRecords.map((record) => {
                  const residentInfo = getResidentInfo(record);
                  const roomInfo = getRoomInfo(record);

                  return (
                    <tr key={record._id} className="hover:bg-gray-50 transition-colors duration-150">
                      <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-900">
                        {new Date(record.due_date).toLocaleDateString('vi-VN')}
                      </td>
                      <td className="px-4 py-3 text-sm">
                        <span className="font-medium text-gray-900">{residentInfo.name}</span>
                      </td>
                      <td className="px-4 py-3 text-sm">
                        <span className="text-gray-900 font-medium">{roomInfo}</span>
                      </td>
                      <td className="px-4 py-3 text-sm">
                        <div className="max-w-xs">
                          <div 
                            className={`font-medium text-gray-900 cursor-pointer hover:text-blue-600 transition-colors ${
                              record.title.length > 40 ? 'relative' : ''
                            }`}
                            onMouseEnter={(e) => handleTitleMouseEnter(e, record._id + '_title', record.title)}
                            onMouseLeave={handleTitleMouseLeave}
                            onClick={() => record.title.length > 40 && toggleTitleExpansion(record._id + '_title')}
                          >
                            {expandedTitles.has(record._id + '_title') ? record.title : truncateTitle(record.title)}
                            {record.title.length > 40 && !expandedTitles.has(record._id + '_title') && (
                              <span className="text-blue-500 text-xs ml-1">[Xem thêm]</span>
                            )}
                            {record.title.length > 40 && expandedTitles.has(record._id + '_title') && (
                              <span className="text-blue-500 text-xs ml-1">[Thu gọn]</span>
                            )}
                          </div>
                          {record.notes && (
                            <div 
                              className={`text-xs text-gray-500 mt-1 cursor-pointer hover:text-blue-600 transition-colors ${
                                record.notes.length > 30 ? 'relative' : ''
                              }`}
                              onMouseEnter={(e) => handleTitleMouseEnter(e, record._id + '_notes', record.notes || '')}
                              onMouseLeave={handleTitleMouseLeave}
                              onClick={() => record.notes && record.notes.length > 30 && toggleTitleExpansion(record._id + '_notes')}
                            >
                              {expandedTitles.has(record._id + '_notes') ? record.notes : truncateTitle(record.notes, 30)}
                              {record.notes.length > 30 && !expandedTitles.has(record._id + '_notes') && (
                                <span className="text-blue-500 text-xs ml-1">[Xem thêm]</span>
                              )}
                              {record.notes.length > 30 && expandedTitles.has(record._id + '_notes') && (
                                <span className="text-blue-500 text-xs ml-1">[Thu gọn]</span>
                              )}
                            </div>
                          )}
                        </div>
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap text-sm font-medium">
                        <span className={record.amount > 0 ? 'text-green-600' : 'text-red-600'}>
                          {formatDisplayCurrency(record.amount)}
                        </span>
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap">
                        <span className={`px-2 py-1 text-xs font-medium rounded-full ${statusMap[record.status]?.className || 'bg-gray-100 text-gray-800'
                          }`}>
                          {statusMap[record.status]?.label || 'Không xác định'}
                        </span>
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap">
                        {(record.status === 'pending' || record.status === 'unpaid') && (
                          <div className="flex gap-1">
                            <button
                              className="p-1 rounded hover:bg-blue-100 transition"
                              title="Chỉnh sửa"
                              onClick={() => { 
                                setEditBill(record); 
                                setOriginalEditBill({...record}); 
                                setEditReason(''); 
                                setEditError(''); 
                              }}
                            >
                              <PencilIcon className="w-4 h-4 text-blue-600" />
                            </button>
                            <button
                              className="p-1 rounded hover:bg-red-100 transition"
                              title="Xóa hóa đơn"
                              onClick={() => { setDeleteBill(record); setDeleteReason(''); setDeleteError(''); }}
                            >
                              <TrashIcon className="w-4 h-4 text-red-600" />
                            </button>
                          </div>
                        )}
                        {(record.status === 'completed' || record.status === 'paid' || record.status === 'cancelled') && (
                          <span className="text-gray-400">—</span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>

        <Dialog open={!!editBill} onClose={() => setEditBill(null)} className="fixed z-50 inset-0 overflow-y-auto">
          <div className="flex items-center justify-center min-h-screen px-4 py-6">
            <div className="fixed inset-0 bg-black/50 backdrop-blur-sm" />
            <div className="relative bg-white rounded-2xl shadow-2xl max-w-2xl w-full mx-auto overflow-hidden z-10">
              {/* Header */}
              <div className="bg-gradient-to-r from-blue-600 to-indigo-600 px-6 py-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-white/20 rounded-lg flex items-center justify-center">
                      <PencilIcon className="w-5 h-5 text-white" />
                  </div>
                  <div>
                      <Dialog.Title className="text-xl font-bold text-white">Chỉnh sửa hóa đơn</Dialog.Title>
                      <p className="text-blue-100 text-sm mt-1">Cập nhật thông tin hóa đơn</p>
                    </div>
                  </div>
                  <button
                    onClick={() => setEditBill(null)}
                    className="text-white/80 hover:text-white transition-colors"
                  >
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>
              </div>

              {/* Content */}
              {editBill && (
                <form onSubmit={e => { e.preventDefault(); handleEditBill(); }} className="p-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                    {/* Tiêu đề */}
                                         <div className="md:col-span-2">
                       <label className="block text-sm font-semibold text-gray-700 mb-1">
                         Tiêu đề hóa đơn <span className="text-red-500">*</span>
                       </label>
                      <input 
                        type="text" 
                        className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 bg-gray-50 hover:bg-white" 
                        value={editBill.title} 
                        onChange={e => setEditBill({ ...editBill, title: e.target.value })} 
                        required 
                        placeholder="Nhập tiêu đề hóa đơn"
                      />
                    </div>

                    {/* Số tiền */}
                  <div>
                       <label className="block text-sm font-semibold text-gray-700 mb-1">
                         Số tiền
                       </label>
                      <div className="relative">
                        <input 
                          type="text" 
                          className="w-full px-4 py-2.5 border border-gray-200 rounded-xl bg-gray-100 cursor-not-allowed text-gray-600" 
                          value={formatDisplayCurrency(editBill.amount)} 
                          readOnly 
                          disabled 
                        />
                        <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                          <CurrencyDollarIcon className="w-5 h-5 text-gray-400" />
                        </div>
                      </div>
                  </div>

                    {/* Ngày đến hạn */}
                  <div>
                       <label className="block text-sm font-semibold text-gray-700 mb-1">
                         Ngày đến hạn <span className="text-red-500">*</span>
                       </label>
                       <input 
                         type="text" 
                         className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 bg-gray-50 hover:bg-white" 
                         value={editBill.due_date ? formatDateToDDMMYYYY(editBill.due_date) : ''} 
                         onChange={e => {
                           const value = e.target.value;
                           // Only convert to ISO format if complete dd/mm/yyyy format
                           if (value.match(/^\d{2}\/\d{2}\/\d{4}$/)) {
                             const [day, month, year] = value.split('/');
                             const isoDate = `${year}-${month}-${day}`;
                             setEditBill({ ...editBill, due_date: isoDate });
                           } else {
                             setEditBill({ ...editBill, due_date: '' });
                           }
                         }} 
                         placeholder="dd/mm/yyyy"
                         required 
                       />
                  </div>

                    {/* Trạng thái */}
                  <div>
                       <label className="block text-sm font-semibold text-gray-700 mb-1">
                         Trạng thái
                       </label>
                      <div className="relative">
                        <select 
                          className="w-full px-4 py-2.5 border border-gray-200 rounded-xl bg-gray-100 cursor-not-allowed text-gray-600 appearance-none" 
                          value={editBill.status} 
                          disabled
                        >
                      <option value="pending">Chưa thanh toán</option>
                      <option value="completed">Đã thanh toán</option>
                      <option value="cancelled">Đã hủy</option>
                    </select>
                        <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                          <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                          </svg>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Ghi chú */}
                  <div className="mb-4">
                    <label className="block text-sm font-semibold text-gray-700 mb-1">
                      Ghi chú <span className="text-red-500">*</span>
                    </label>
                                         <textarea 
                       className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 bg-gray-50 hover:bg-white resize-none" 
                       rows={2}
                       value={editBill.notes || ''} 
                       onChange={e => setEditBill({ ...editBill, notes: e.target.value })} 
                       placeholder="Nhập ghi chú"
                       required
                     />
                  </div>

                                    {/* Lý do chỉnh sửa */}
                  <div className="mb-4">
                    <label className="block text-sm font-semibold text-gray-700 mb-1">
                      Lý do chỉnh sửa
                    </label>
                    <textarea 
                      className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 bg-gray-50 hover:bg-white resize-none" 
                      rows={2}
                      value={editReason} 
                      onChange={e => setEditReason(e.target.value)} 
                      placeholder="Giải thích lý do chỉnh sửa hóa đơn (tùy chọn)"
                    />
                  </div>

                  {/* Error message */}
                  {editError && (
                    <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-xl">
                      <div className="flex items-center gap-2">
                        <svg className="w-5 h-5 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        <span className="text-red-700 text-sm font-medium">{editError}</span>
                      </div>
                    </div>
                  )}

                  {/* Action buttons */}
                  <div className="flex gap-3 justify-end pt-4 border-t border-gray-100">
                    <button 
                      type="button" 
                      className="px-6 py-3 border border-gray-200 text-gray-700 rounded-xl hover:bg-gray-50 transition-all duration-200 font-medium" 
                      onClick={() => {
                        setEditBill(null);
                        setOriginalEditBill(null);
                      }}
                    >
                      Hủy
                    </button>
                    {hasEditChanges() ? (
                      <button 
                        type="submit" 
                        className="px-6 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-xl hover:from-blue-700 hover:to-indigo-700 transition-all duration-200 font-medium flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed" 
                        disabled={saving}
                      >
                        {saving ? (
                          <>
                            <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                            Đang lưu...
                          </>
                        ) : (
                          <>
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                            </svg>
                            Lưu thay đổi
                          </>
                        )}
                      </button>
                    ) : (
                      <div className="px-6 py-3 text-gray-500 text-sm font-medium">
                        Không có thay đổi
                      </div>
                    )}
                  </div>
                </form>
              )}
            </div>
          </div>
        </Dialog>

        <Dialog open={!!deleteBill} onClose={() => setDeleteBill(null)} className="fixed z-50 inset-0 overflow-y-auto">
          <div className="flex items-center justify-center min-h-screen px-4">
            <div className="fixed inset-0 bg-black opacity-30" />
            <div className="relative bg-white rounded-xl shadow-xl max-w-md w-full mx-auto p-6 z-10">
              <Dialog.Title className="text-lg font-bold mb-4 text-red-600">Xóa hóa đơn</Dialog.Title>
              {deleteBill && (
                <div className="space-y-4">
                  <div className="text-gray-700 mb-2">Bạn có chắc chắn muốn xóa hóa đơn <b>{deleteBill.title}</b>?</div>
                  <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3 mb-4">
                    <div className="text-yellow-800 text-sm">
                      <strong>Lưu ý:</strong> Hành động này sẽ xóa vĩnh viễn hóa đơn khỏi hệ thống và không thể hoàn tác.
                    </div>
                  </div>
                  {deleteError && <div className="text-red-600 text-sm">{deleteError}</div>}
                  <div className="flex gap-2 justify-end mt-4">
                    <button type="button" className="px-4 py-2 rounded bg-gray-200" onClick={() => setDeleteBill(null)}>Hủy</button>
                    <button type="button" className="px-4 py-2 rounded bg-red-600 text-white font-semibold" disabled={saving} onClick={handleDeleteBill}>Xác nhận xóa</button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </Dialog>

        {/* Custom Tooltip */}
        {showTooltip && (
          <div
            className="fixed z-50 bg-gray-900 text-white text-sm px-3 py-2 rounded-lg shadow-lg max-w-xs"
            style={{
              left: `${showTooltip.x}px`,
              top: `${showTooltip.y}px`,
              transform: 'translateX(-50%) translateY(-100%)',
              pointerEvents: 'none'
            }}
          >
            <div className="relative">
              {showTooltip.id.includes('_notes') 
                ? records.find(r => r._id === showTooltip.id.replace('_notes', ''))?.notes
                : showTooltip.id.includes('_title')
                ? records.find(r => r._id === showTooltip.id.replace('_title', ''))?.title
                : records.find(r => r._id === showTooltip.id)?.title
              }
              <div className="absolute top-full left-1/2 transform -translate-x-1/2 w-0 h-0 border-l-4 border-r-4 border-t-4 border-transparent border-t-gray-900"></div>
            </div>
          </div>
        )}

      </div>
    </div>
  );
} 