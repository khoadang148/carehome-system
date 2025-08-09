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
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [showBillModal, setShowBillModal] = useState(false);
  const [editBill, setEditBill] = useState<FinancialRecord | null>(null);
  const [deleteBill, setDeleteBill] = useState<FinancialRecord | null>(null);
  const [editReason, setEditReason] = useState('');
  const [deleteReason, setDeleteReason] = useState('');
  const [editError, setEditError] = useState('');
  const [deleteError, setDeleteError] = useState('');
  const [saving, setSaving] = useState(false);
  const [residentRooms, setResidentRooms] = useState<Record<string, string>>({});

  const fetchBills = useCallback(async () => {
    setLoading(true);
    try {
      const data = await billsAPI.getAll();
      console.log('Bills data from API:', data);
      setRecords(data);
      
      // Fetch room information for all residents
      const roomMap: Record<string, string> = {};
      for (const record of data) {
        if (record.resident_id) {
          const residentId = typeof record.resident_id === 'object' ? record.resident_id._id : record.resident_id;
          try {
            const bedAssignments = await bedAssignmentsAPI.getByResidentId(residentId);
            if (Array.isArray(bedAssignments) && bedAssignments.length > 0) {
              const bedAssignment = bedAssignments[0]; // Lấy assignment đầu tiên
              if (bedAssignment?.bed_id?.room_id?.room_number) {
                roomMap[residentId] = bedAssignment.bed_id.room_id.room_number;
              }
            }
          } catch (error) {
            console.warn(`Error fetching room for resident ${residentId}:`, error);
          }
        }
      }
      setResidentRooms(roomMap);
    } catch (err) {
      console.error('Error fetching bills:', err);
      // Xử lý lỗi nếu cần
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchBills();
  }, [fetchBills]);

  const filteredRecords = records.filter(record => {
    const recordDate = new Date(record.due_date || record.created_at || '');
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
    .filter(r => r.amount > 0)
    .reduce((sum, r) => sum + r.amount, 0);

  // Mapping trạng thái sang tiếng Việt
  const statusMap: Record<string, { label: string; className: string }> = {
    completed: { label: 'Đã thanh toán', className: 'bg-green-100 text-green-800' },
    paid: { label: 'Đã thanh toán', className: 'bg-green-100 text-green-800' },
    pending: { label: 'Chưa thanh toán', className: 'bg-yellow-100 text-yellow-800' },
    unpaid: { label: 'Chưa thanh toán', className: 'bg-yellow-100 text-yellow-800' },
    cancelled: { label: 'Đã hủy', className: 'bg-red-100 text-red-800' },
    processing: { label: 'Đang xử lý', className: 'bg-blue-100 text-blue-800' },
  };

  // Hàm helper để lấy thông tin resident
  const getResidentInfo = (record: FinancialRecord) => {
    if (typeof record.resident_id === 'object' && record.resident_id) {
      return {
        name: record.resident_id.full_name,
        id: record.resident_id._id
      };
    }
    return { name: 'Không xác định', id: record.resident_id || '' };
  };

  // Hàm helper để lấy thông tin phòng từ bed assignments
  const getRoomInfo = (record: FinancialRecord) => {
    if (record.resident_id) {
      const residentId = typeof record.resident_id === 'object' ? record.resident_id._id : record.resident_id;
      const roomNumber = residentRooms[residentId];
      return roomNumber || 'Chưa phân phòng';
    }
    return 'Chưa phân phòng';
  };

  // Hàm helper để rút gọn tiêu đề
  const truncateTitle = (title: string, maxLength: number = 40) => {
    if (title.length <= maxLength) return title;
    return title.substring(0, maxLength) + '...';
  };

  // Xử lý cập nhật hóa đơn
  const handleEditBill = async () => {
    if (!editBill) return;
    if (!editReason.trim()) {
      setEditError('Vui lòng nhập lý do chỉnh sửa.');
      return;
    }
    setSaving(true);
    try {
      await billsAPI.update(editBill._id, { ...editBill, notes: (editBill.notes || '') + `\n[Lý do chỉnh sửa]: ${editReason}` });
      setEditBill(null);
      setEditReason('');
      setEditError('');
      fetchBills();
    } catch (err) {
      setEditError('Có lỗi khi cập nhật hóa đơn.');
    } finally {
      setSaving(false);
    }
  };

  // Xử lý xóa hóa đơn
  const handleDeleteBill = async () => {
    if (!deleteBill) return;
    
    // Kiểm tra trạng thái hóa đơn
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
      // Xóa cứng hóa đơn chưa thanh toán
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

        {/* Transactions Table - Simplified */}
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
                          <div className="font-medium text-gray-900" title={record.title}>
                            {truncateTitle(record.title)}
                          </div>
                          {record.notes && (
                            <div className="text-xs text-gray-500 mt-1" title={record.notes}>
                              {truncateTitle(record.notes, 30)}
                            </div>
                          )}
                        </div>
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap text-sm font-medium">
                        <span className={record.amount > 0 ? 'text-green-600' : 'text-red-600'}>
                          {record.amount.toLocaleString('vi-VN')} VNĐ
                        </span>
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap">
                        <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                          statusMap[record.status]?.className || 'bg-gray-100 text-gray-800'
                        }`}>
                          {statusMap[record.status]?.label || 'Không xác định'}
                        </span>
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap">
                        {/* Chỉ hiển thị nút chỉnh sửa và xóa cho hóa đơn chưa thanh toán và chưa hủy */}
                        {(record.status === 'pending' || record.status === 'unpaid') && (
                          <div className="flex gap-1">
                            <button
                              className="p-1 rounded hover:bg-blue-100 transition"
                              title="Chỉnh sửa"
                              onClick={() => { setEditBill(record); setEditReason(''); setEditError(''); }}
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
                        {/* Hiển thị dấu gạch ngang cho hóa đơn đã thanh toán hoặc hủy */}
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

       {/* Modal chỉnh sửa hóa đơn */}
       <Dialog open={!!editBill} onClose={() => setEditBill(null)} className="fixed z-50 inset-0 overflow-y-auto">
         <div className="flex items-center justify-center min-h-screen px-4">
           <Dialog.Overlay className="fixed inset-0 bg-black opacity-30" />
           <div className="relative bg-white rounded-xl shadow-xl max-w-lg w-full mx-auto p-6 z-10">
             <Dialog.Title className="text-lg font-bold mb-4">Chỉnh sửa hóa đơn</Dialog.Title>
             {editBill && (
               <form onSubmit={e => { e.preventDefault(); handleEditBill(); }} className="space-y-4">
                 <div>
                   <label className="block text-sm font-medium text-gray-700 mb-1">Tiêu đề</label>
                   <input type="text" className="w-full border rounded px-3 py-2" value={editBill.title} onChange={e => setEditBill({ ...editBill, title: e.target.value })} required />
                 </div>
                 <div>
                   <label className="block text-sm font-medium text-gray-700 mb-1">Số tiền</label>
                   <input type="number" className="w-full border rounded px-3 py-2 bg-gray-100 cursor-not-allowed" value={editBill.amount} readOnly disabled />
                 </div>
                 <div>
                   <label className="block text-sm font-medium text-gray-700 mb-1">Ngày đến hạn</label>
                   <input type="date" className="w-full border rounded px-3 py-2" value={editBill.due_date?.slice(0,10) || ''} onChange={e => setEditBill({ ...editBill, due_date: e.target.value })} required />
                 </div>
                 <div>
                   <label className="block text-sm font-medium text-gray-700 mb-1">Ghi chú</label>
                   <textarea className="w-full border rounded px-3 py-2" value={editBill.notes || ''} onChange={e => setEditBill({ ...editBill, notes: e.target.value })} />
                 </div>
                 <div>
                   <label className="block text-sm font-medium text-gray-700 mb-1">Trạng thái</label>
                   <select className="w-full border rounded px-3 py-2 bg-gray-100 cursor-not-allowed" value={editBill.status} disabled>
                     <option value="pending">Chưa thanh toán</option>
                     <option value="completed">Đã thanh toán</option>
                     <option value="cancelled">Đã hủy</option>
                   </select>
                 </div>
                 <div>
                   <label className="block text-sm font-medium text-gray-700 mb-1">Lý do chỉnh sửa <span className="text-red-500">*</span></label>
                   <textarea className="w-full border rounded px-3 py-2" value={editReason} onChange={e => setEditReason(e.target.value)} required />
                 </div>
                 {editError && <div className="text-red-600 text-sm">{editError}</div>}
                 <div className="flex gap-2 justify-end mt-4">
                   <button type="button" className="px-4 py-2 rounded bg-gray-200" onClick={() => setEditBill(null)}>Hủy</button>
                   <button type="submit" className="px-4 py-2 rounded bg-blue-600 text-white font-semibold" disabled={saving}>Lưu thay đổi</button>
                 </div>
               </form>
             )}
           </div>
         </div>
       </Dialog>

       {/* Modal xóa hóa đơn */}
       <Dialog open={!!deleteBill} onClose={() => setDeleteBill(null)} className="fixed z-50 inset-0 overflow-y-auto">
         <div className="flex items-center justify-center min-h-screen px-4">
           <Dialog.Overlay className="fixed inset-0 bg-black opacity-30" />
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

      </div>
    </div>
  );
} 