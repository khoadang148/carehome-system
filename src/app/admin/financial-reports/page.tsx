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
  ArrowLeftIcon
} from '@heroicons/react/24/outline';
import { useRouter } from 'next/navigation';
import BillModal from '../../../components/BillModal';
import { billsAPI } from '../../../lib/api';

interface FinancialRecord {
  id: string;
  date: string;
  type: 'income' | 'expense';
  category: string;
  description: string;
  amount: number;
  paymentMethod: string;
  residentId?: string;
  residentName?: string;
  status: 'completed' | 'pending' | 'cancelled';
}

export default function FinancialReportsPage() {
  const router = useRouter();
  const [records, setRecords] = useState<FinancialRecord[]>([]);
  const [loading, setLoading] = useState(false);
  const [dateFilter, setDateFilter] = useState<string>('this_month');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [showBillModal, setShowBillModal] = useState(false);

  const fetchBills = useCallback(async () => {
    setLoading(true);
    try {
      const data = await billsAPI.getAll();
      // Map dữ liệu API về đúng định dạng FinancialRecord nếu cần
      setRecords(data.map((item: any) => ({
        id: item.id,
        date: item.due_date || item.created_at || '',
        type: item.amount > 0 ? 'income' : 'expense',
        category: item.category || '',
        description: item.notes || item.description || '',
        amount: item.amount,
        paymentMethod: item.payment_method || '',
        residentId: item.resident_id,
        residentName: item.resident_name,
        status: item.status || 'pending',
      })));
    } catch (err) {
      // Xử lý lỗi nếu cần
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchBills();
  }, [fetchBills]);

  const filteredRecords = records.filter(record => {
    const recordDate = new Date(record.date);
    const now = new Date();
    
    let dateMatch = true;
    if (dateFilter === 'this_month') {
      dateMatch = recordDate.getMonth() === now.getMonth() && recordDate.getFullYear() === now.getFullYear();
    } else if (dateFilter === 'this_week') {
      const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
      dateMatch = recordDate >= weekAgo;
    }
    
    const statusMatch = statusFilter === 'all' || record.status === statusFilter;
    
    return dateMatch && statusMatch;
  });

  const totalIncome = filteredRecords
    .filter(r => r.type === 'income')
    .reduce((sum, r) => sum + r.amount, 0);

  const totalExpense = filteredRecords
    .filter(r => r.type === 'expense')
    .reduce((sum, r) => sum + r.amount, 0);

  const netIncome = totalIncome - totalExpense;

  // Mapping trạng thái sang tiếng Việt
  const statusMap: Record<string, { label: string; className: string }> = {
    completed: { label: 'Đã thanh toán', className: 'bg-green-100 text-green-800' },
    paid: { label: 'Đã thanh toán', className: 'bg-green-100 text-green-800' },
    pending: { label: 'Chưa thanh toán', className: 'bg-yellow-100 text-yellow-800' },
    unpaid: { label: 'Chưa thanh toán', className: 'bg-yellow-100 text-yellow-800' },
    cancelled: { label: 'Đã hủy', className: 'bg-red-100 text-red-800' },
    processing: { label: 'Đang xử lý', className: 'bg-blue-100 text-blue-800' },
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Header - improved professional look */}
        <div className="rounded-2xl shadow bg-gradient-to-r from-blue-200 to-indigo-200 px-8 py-8 mb-8 flex flex-col md:flex-row md:items-center md:gap-6">
          <div className="flex items-center gap-6 mb-4 md:mb-0">
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 bg-gradient-to-br from-emerald-500 to-blue-600 rounded-2xl flex items-center justify-center shadow-lg">
                <ChartBarIcon className="w-8 h-8 text-white" />
              </div>
              <div>
                <h1 className="text-3xl font-bold text-gray-800 mb-2">Báo cáo Tài chính</h1>
                <p className="text-gray-600 text-base">Thống kê và phân tích tài chính chi tiết</p>
              </div>
            </div>
          </div>
          <div className="ml-auto flex items-center">
            <button
              className="bg-blue-600 hover:bg-blue-700 text-white font-semibold px-6 py-3 rounded-lg shadow transition-all duration-150"
              onClick={() => setShowBillModal(true)}
            >
              + Tạo hóa đơn
            </button>
          </div>
        </div>
        <BillModal open={showBillModal} onClose={() => setShowBillModal(false)} onSuccess={fetchBills} />
        {/* Filters */}
        <div className="bg-white rounded-xl p-6 mb-8 shadow-sm border border-gray-100">
          <div className="flex flex-wrap gap-4">
            <div className="flex-1 min-w-[200px]">
              <label className="block text-sm font-medium text-gray-700 mb-2">Thời gian</label>
              <select
                value={dateFilter}
                onChange={(e) => setDateFilter(e.target.value)}
                className="w-full px-4 py-2.5 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
              >
                <option value="this_month">Tháng này</option>
                <option value="this_week">Tuần này</option>
                <option value="all">Tất cả</option>
              </select>
            </div>
            <div className="flex-1 min-w-[200px]">
              <label className="block text-sm font-medium text-gray-700 mb-2">Trạng thái</label>
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="w-full px-4 py-2.5 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
              >
                <option value="all">Tất cả</option>
                <option value="completed">Đã thanh toán</option>
                <option value="pending">Chưa thanh toán</option>
                <option value="cancelled">Đã hủy</option>
              </select>
            </div>
          </div>
        </div>

        {/* Transactions Table */}
        <div className="bg-white rounded-xl shadow-sm overflow-hidden border border-gray-100">
          <div className="px-6 py-4 border-b border-gray-100 bg-gradient-to-r from-blue-500 to-indigo-600">
            <h2 className="text-xl font-semibold text-white flex items-center gap-2">
              <DocumentTextIcon className="w-6 h-6 text-white" />
              Chi tiết Giao dịch
            </h2>
          </div>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-blue-50">
                <tr>
                  <th className="px-6 py-4 text-left text-xs font-medium text-blue-700 uppercase tracking-wider">Ngày</th>
                  <th className="px-6 py-4 text-left text-xs font-medium text-blue-700 uppercase tracking-wider">Mô tả</th>
                  <th className="px-6 py-4 text-left text-xs font-medium text-blue-700 uppercase tracking-wider">Số tiền</th>
                  <th className="px-6 py-4 text-left text-xs font-medium text-blue-700 uppercase tracking-wider">Trạng thái</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-100">
                {filteredRecords.map((record) => (
                  <tr key={record.id} className="hover:bg-gray-50 transition-colors duration-150">
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {new Date(record.date).toLocaleDateString('vi-VN')}
                    </td>
                    <td className="px-6 py-4 text-sm">
                      <div>
                        <div className="font-medium text-gray-900">{record.description}</div>
                        {record.residentName && (
                          <div className="text-gray-500 text-xs mt-1">
                            {record.residentName}
                          </div>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <span className={record.type === 'income' ? 'text-green-600' : 'text-red-600'}>
                        {record.type === 'income' ? '+' : '-'}{record.amount.toLocaleString('vi-VN')} VNĐ
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-3 py-1.5 text-xs font-medium rounded-full ${
                        statusMap[record.status]?.className || 'bg-gray-100 text-gray-800'
                      }`}>
                        {statusMap[record.status]?.label || 'Không xác định'}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
} 