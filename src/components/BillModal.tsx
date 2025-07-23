import React, { useEffect, useState } from 'react';
import { Dialog } from '@headlessui/react';
import { residentAPI, staffAPI, billsAPI, carePlansAPI } from '../lib/api';
import { useAuth } from '@/lib/contexts/auth-context';
import DatePicker from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';

interface BillModalProps {
  open: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

export default function BillModal({ open, onClose, onSuccess }: BillModalProps) {
  const { user } = useAuth();
  const [residents, setResidents] = useState<any[]>([]);
  const [resident_id, setResidentId] = useState('');
  const [loadingResidents, setLoadingResidents] = useState(false);
  const [staffs, setStaffs] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [carePlanAssignments, setCarePlanAssignments] = useState<any[]>([]);
  const [loadingAssignments, setLoadingAssignments] = useState(false);
  const [care_plan_assignment_id, setCarePlanAssignmentId] = useState('');
  const [staff_id, setStaffId] = useState('');
  const [amount, setAmount] = useState('');
  const [due_date, setDueDate] = useState('');
  const [title, setTitle] = useState('');
  const [notes, setNotes] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // Fetch residents, staffs on open
  useEffect(() => {
    if (open) {
      setLoadingResidents(true);
      residentAPI.getAll()
        .then(data => setResidents(data))
        .catch(() => setResidents([]))
        .finally(() => setLoadingResidents(false));
      staffAPI.getAll().then(setStaffs);
      // Auto-select current user as staff if role is staff or admin
      if (user && (user.role === 'staff' || user.role === 'admin')) {
        setStaffId(user.id);
      } else {
        setStaffId('');
      }
    }
  }, [open, user]);

  // Fetch care plan assignments when resident changes
  useEffect(() => {
    if (resident_id) {
      setLoadingAssignments(true);
      carePlansAPI.getByResidentId(resident_id)
        .then(data => setCarePlanAssignments(Array.isArray(data) ? data : []))
        .catch(() => setCarePlanAssignments([]))
        .finally(() => setLoadingAssignments(false));
      setCarePlanAssignmentId('');
      setAmount('');
    } else {
      setCarePlanAssignments([]);
      setCarePlanAssignmentId('');
      setAmount('');
    }
  }, [resident_id]);

  // Set amount when care plan assignment changes
  useEffect(() => {
    if (care_plan_assignment_id) {
      const assignment = carePlanAssignments.find((a: any) => a._id === care_plan_assignment_id);
      setAmount(assignment ? assignment.total_monthly_cost?.toString() : '');
      // Gợi ý title/notes tự động
      if (assignment) {
        const planName = assignment.care_plan_ids && assignment.care_plan_ids[0]?.plan_name ? assignment.care_plan_ids[0].plan_name : '';
        const month = due_date ? new Date(due_date).getMonth() + 1 : '';
        const year = due_date ? new Date(due_date).getFullYear() : '';
        setTitle(`Hóa đơn tháng ${month}/${year} cho gói chăm sóc ${planName}`);
        setNotes(`Chưa thanh toán cho ${planName}${assignment.room_type ? ' + phòng ' + assignment.room_type : ''} tháng ${month}/${year}`);
      } else {
        setTitle('');
        setNotes('');
      }
    } else {
      setAmount('');
      setTitle('');
      setNotes('');
    }
  }, [care_plan_assignment_id, carePlanAssignments, due_date]);

  // Update title/notes when due_date changes
  useEffect(() => {
    if (care_plan_assignment_id && due_date) {
      const assignment = carePlanAssignments.find((a: any) => a._id === care_plan_assignment_id);
      const planName = assignment?.care_plan_ids && assignment.care_plan_ids[0]?.plan_name ? assignment.care_plan_ids[0].plan_name : '';
      const month = new Date(due_date).getMonth() + 1;
      const year = new Date(due_date).getFullYear();
      setTitle(`Hóa đơn tháng ${month}/${year} cho gói chăm sóc ${planName}`);
      setNotes(`Chưa thanh toán cho ${planName}${assignment?.room_type ? ' + phòng ' + assignment.room_type : ''} tháng ${month}/${year}`);
    }
  }, [due_date]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setSuccess(null);
    // Defensive: check required fields
    if (!resident_id || !care_plan_assignment_id || !staff_id || !amount || !due_date || !title) {
      setError('Vui lòng nhập đầy đủ thông tin bắt buộc.');
      setLoading(false);
      return;
    }
    try {
      await billsAPI.create({
        resident_id,
        care_plan_assignment_id,
        staff_id,
        amount: Number(amount),
        due_date: due_date ? new Date(due_date).toISOString() : '',
        title,
        notes
      });
      setSuccess('Tạo hóa đơn thành công!');
      if (onSuccess) onSuccess();
      setTimeout(() => {
        setSuccess(null);
        onClose();
      }, 1200);
    } catch (err: any) {
      setError(err?.message || 'Có lỗi xảy ra');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onClose={onClose} className="fixed z-50 inset-0 overflow-y-auto">
      <div className="flex items-center justify-center min-h-screen px-4">
        <Dialog.Overlay className="fixed inset-0 bg-black opacity-30" />
        <div className="relative bg-white rounded-xl shadow-xl w-full max-w-lg mx-auto p-8 z-10">
          <Dialog.Title className="text-xl font-bold mb-4">Tạo hóa đơn mới</Dialog.Title>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block font-medium mb-1">Cư dân <span className="text-red-500">*</span></label>
              <select value={resident_id} onChange={e => setResidentId(e.target.value)} required className="w-full border rounded px-3 py-2">
                <option value="">Chọn cư dân</option>
                {residents.length === 0 && !loadingResidents && (
                  <option value="" disabled>Không có cư dân nào</option>
                )}
                {residents.map(r => (
                  <option key={r?._id} value={r?._id}>{r?.full_name}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block font-medium mb-1">Gói chăm sóc <span className="text-red-500">*</span></label>
              <select value={care_plan_assignment_id} onChange={e => setCarePlanAssignmentId(e.target.value)} required className="w-full border rounded px-3 py-2" disabled={!resident_id || loadingAssignments}>
                <option value="">{loadingAssignments ? 'Đang tải...' : 'Chọn gói'}</option>
                {carePlanAssignments.map(cp => (
                  <option key={cp?._id} value={cp?._id}>
                    {cp?.care_plan_ids && cp.care_plan_ids[0]?.plan_name ? cp.care_plan_ids[0].plan_name : 'Gói'}
                    {cp?.total_monthly_cost ? ` - ${Number(cp.total_monthly_cost).toLocaleString('vi-VN')} đ/tháng` : ''}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block font-medium mb-1">Nhân viên tạo hóa đơn <span className="text-red-500">*</span></label>
              <select value={staff_id} onChange={e => setStaffId(e.target.value)} required className="w-full border rounded px-3 py-2">
                <option value="">Chọn nhân viên</option>
                {staffs.map(s => (
                  <option key={s?._id} value={s?._id}>{s?.full_name}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block font-medium mb-1">Số tiền <span className="text-red-500">*</span></label>
              <input type="number" value={amount} readOnly className="w-full border rounded px-3 py-2 bg-gray-100 cursor-not-allowed" placeholder="Tự động từ gói" required />
            </div>
            <div>
              <label className="block font-medium mb-1">Ngày đến hạn <span className="text-red-500">*</span></label>
              <DatePicker
                selected={due_date ? (() => {
                  const [y, m, d] = due_date.split('-');
                  if (y && m && d) return new Date(Number(y), Number(m) - 1, Number(d));
                  return null;
                })() : null}
                onChange={date => {
                  if (date instanceof Date && !isNaN(date.getTime())) {
                    const yyyy = date.getFullYear();
                    const mm = String(date.getMonth() + 1).padStart(2, '0');
                    const dd = String(date.getDate()).padStart(2, '0');
                    setDueDate(`${yyyy}-${mm}-${dd}`);
                  } else {
                    setDueDate('');
                  }
                }}
                dateFormat="dd/MM/yyyy"
                placeholderText="dd/mm/yyyy"
                className="w-full border rounded px-3 py-2"
                required
                autoComplete="off"
                showMonthDropdown
                showYearDropdown
                dropdownMode="select"
              />
            </div>
            <div>
              <label className="block font-medium mb-1">Tiêu đề <span className="text-red-500">*</span></label>
              <input type="text" value={title} onChange={e => setTitle(e.target.value)} required className="w-full border rounded px-3 py-2" placeholder="Hóa đơn tháng 2/2024 cho gói chăm sóc cao cấp" />
            </div>
            <div>
              <label className="block font-medium mb-1">Ghi chú</label>
              <textarea value={notes} onChange={e => setNotes(e.target.value)} className="w-full border rounded px-3 py-2" placeholder="Chưa thanh toán cho gói cao cấp + phòng 2 giường tháng 2/2024" />
            </div>
            {error && <div className="text-red-600 text-sm">{error}</div>}
            {success && <div className="text-green-600 text-sm">{success}</div>}
            <div className="flex justify-end gap-2 pt-2">
              <button type="button" onClick={onClose} className="px-4 py-2 rounded bg-gray-200 hover:bg-gray-300">Hủy</button>
              <button type="submit" disabled={loading || loadingResidents || residents.length === 0 || loadingAssignments} className="px-4 py-2 rounded bg-blue-600 text-white hover:bg-blue-700 font-semibold">
                {loading ? 'Đang tạo...' : 'Tạo hóa đơn'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </Dialog>
  );
} 