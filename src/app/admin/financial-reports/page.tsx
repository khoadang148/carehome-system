"use client";

import { useState } from 'react';
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
  const [records] = useState<FinancialRecord[]>([
    {
      id: '1',
      date: '2024-01-18',
      type: 'income',
      category: 'Phí chăm sóc',
      description: 'Phí chăm sóc tháng 1/2024 - Nguyễn Thị Lan',
      amount: 8000000,
      paymentMethod: 'Chuyển khoản',
      residentId: 'R001',
      residentName: 'Nguyễn Thị Lan',
      status: 'completed'
    },
    {
      id: '2',
      date: '2024-01-17',
      type: 'expense',
      category: 'Y tế',
      description: 'Mua thuốc và vật tư y tế',
      amount: 2500000,
      paymentMethod: 'Tiền mặt',
      status: 'completed'
    },
    {
      id: '3',
      date: '2024-01-16',
      type: 'income',
      category: 'Phí dịch vụ',
      description: 'Phí dịch vụ cao cấp - Lê Văn Hùng',
      amount: 5000000,
      paymentMethod: 'Chuyển khoản',
      residentId: 'R003',
      residentName: 'Lê Văn Hùng',
      status: 'completed'
    },
    {
      id: '4',
      date: '2024-01-15',
      type: 'expense',
      category: 'Thực phẩm',
      description: 'Mua thực phẩm tuần 3 tháng 1',
      amount: 3200000,
      paymentMethod: 'Chuyển khoản',
      status: 'completed'
    },
    {
      id: '5',
      date: '2024-01-14',
      type: 'expense',
      category: 'Lương nhân viên',
      description: 'Lương tháng 1/2024',
      amount: 45000000,
      paymentMethod: 'Chuyển khoản',
      status: 'completed'
    },
    {
      id: '6',
      date: '2024-01-12',
      type: 'income',
      category: 'Phí chăm sóc',
      description: 'Phí chăm sóc tháng 1/2024 - Trần Thị Mai',
      amount: 12000000,
      paymentMethod: 'Tiền mặt',
      residentId: 'R002',
      residentName: 'Trần Thị Mai',
      status: 'completed'
    }
  ]);

  const [dateFilter, setDateFilter] = useState<string>('this_month');
  const [typeFilter, setTypeFilter] = useState<string>('all');

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
    
    const typeMatch = typeFilter === 'all' || record.type === typeFilter;
    
    return dateMatch && typeMatch;
  });

  const totalIncome = filteredRecords
    .filter(r => r.type === 'income')
    .reduce((sum, r) => sum + r.amount, 0);

  const totalExpense = filteredRecords
    .filter(r => r.type === 'expense')
    .reduce((sum, r) => sum + r.amount, 0);

  const netIncome = totalIncome - totalExpense;

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
        </div>

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
              <label className="block text-sm font-medium text-gray-700 mb-2">Loại giao dịch</label>
              <select
                value={typeFilter}
                onChange={(e) => setTypeFilter(e.target.value)}
                className="w-full px-4 py-2.5 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
              >
                <option value="all">Tất cả loại</option>
                <option value="income">Thu nhập</option>
                <option value="expense">Chi phí</option>
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
                  <th className="px-6 py-4 text-left text-xs font-medium text-blue-700 uppercase tracking-wider">Loại</th>
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
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-3 py-1.5 text-xs font-medium rounded-full ${
                        record.type === 'income' 
                          ? 'bg-green-100 text-green-800' 
                          : 'bg-red-100 text-red-800'
                      }`}>
                        {record.type === 'income' ? 'Thu' : 'Chi'}
                      </span>
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
                        record.status === 'completed' 
                          ? 'bg-green-100 text-green-800' 
                          : 'bg-yellow-100 text-yellow-800'
                      }`}>
                        {record.status === 'completed' ? 'Hoàn thành' : 'Đang xử lý'}
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