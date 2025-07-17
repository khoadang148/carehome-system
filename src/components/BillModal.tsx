import React, { useEffect, useState } from 'react';
import { Dialog } from '@headlessui/react';
import { residentAPI, familyMembersAPI, staffAPI, billsAPI } from '../lib/api';

interface BillModalProps {
  open: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

export default function BillModal({ open, onClose, onSuccess }: BillModalProps) {
  const [residents, setResidents] = useState<any[]>([]);
  const [staffs, setStaffs] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState<any>({
    family_id: '',
    resident_id: '',
    care_plan_id: '',
    staff_id: '',
    amount: '',
    due_date: '',
    paid_date: '',
    payment_method: '',
    status: 'pending',
    notes: '',
  });
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  useEffect(() => {
    if (open) {
      residentAPI.getAll().then(setResidents);
      staffAPI.getAll().then(setStaffs);
    }
  }, [open]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setSuccess(null);
    try {
      const payload = {
        ...form,
        amount: Number(form.amount),
      };
      await billsAPI.create(payload);
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
              <label className="block text-sm font-medium mb-1">Cư dân</label>
              <select name="resident_id" value={form.resident_id} onChange={handleChange} required className="w-full border rounded px-3 py-2">
                <option value="">Chọn cư dân</option>
                {residents.map((r: any) => (
                  <option key={r.id} value={r.id}>{r.name || r.fullName}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Nhân viên phụ trách</label>
              <select name="staff_id" value={form.staff_id} onChange={handleChange} required className="w-full border rounded px-3 py-2">
                <option value="">Chọn nhân viên</option>
                {staffs.map((s: any) => (
                  <option key={s.id} value={s.id}>{s.name || s.fullName || s.email}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Số tiền</label>
              <input name="amount" type="number" value={form.amount} onChange={handleChange} required className="w-full border rounded px-3 py-2" min={0} />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Ngày đến hạn</label>
              <input name="due_date" type="date" value={form.due_date} onChange={handleChange} required className="w-full border rounded px-3 py-2" />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Ngày thanh toán</label>
              <input name="paid_date" type="date" value={form.paid_date} onChange={handleChange} className="w-full border rounded px-3 py-2" />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Phương thức thanh toán</label>
              <select name="payment_method" value={form.payment_method} onChange={handleChange} required className="w-full border rounded px-3 py-2">
                <option value="">Chọn phương thức</option>
                <option value="bank_transfer">Chuyển khoản</option>
                <option value="cash">Tiền mặt</option>
                <option value="other">Khác</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Trạng thái</label>
              <select name="status" value={form.status} onChange={handleChange} required className="w-full border rounded px-3 py-2">
                <option value="pending">Chưa thanh toán</option>
                <option value="completed">Đã thanh toán</option>
                <option value="cancelled">Đã hủy</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Ghi chú</label>
              <textarea name="notes" value={form.notes} onChange={handleChange} className="w-full border rounded px-3 py-2" rows={2} />
            </div>
            {error && <div className="text-red-600 text-sm">{error}</div>}
            {success && <div className="text-green-600 text-sm">{success}</div>}
            <div className="flex justify-end gap-2 pt-2">
              <button type="button" onClick={onClose} className="px-4 py-2 rounded bg-gray-200 hover:bg-gray-300">Hủy</button>
              <button type="submit" disabled={loading} className="px-4 py-2 rounded bg-blue-600 text-white hover:bg-blue-700 font-semibold">
                {loading ? 'Đang tạo...' : 'Tạo hóa đơn'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </Dialog>
  );
} 