import React, { useState } from 'react'
import { toast } from 'react-toastify'
import { getUserFriendlyError } from '@/lib/utils/error-translations';;;
import { Dialog } from '@headlessui/react';
import { UserGroupIcon, UserIcon, CheckCircleIcon, XCircleIcon, MagnifyingGlassIcon } from '@heroicons/react/24/outline';
import { useActivityEvaluation } from '@/hooks/useActivityEvaluation';

interface Resident {
  id: string;
  name: string;
  room: string;
  age: number | string;
  status?: string;
  photo?: string;
}

interface ResidentEvaluationModalProps {
  open: boolean;
  onClose: () => void;
  activity: any;
  residents: Resident[];
  user: any;
}

export default function ResidentEvaluationModal({ open, onClose, activity, residents, user }: ResidentEvaluationModalProps) {
  const [search, setSearch] = useState('');
  const [showReasonAll, setShowReasonAll] = useState(false);
  const [reasonAll, setReasonAll] = useState('');

  const {
    evaluations,
    loading,
    saving,
    error,
    handleEvaluationChange,
    handleReasonChange,
    handleSelectAll,
    handleSaveEvaluations
  } = useActivityEvaluation({
    activityId: activity.id,
    residents,
    user,
    activityDate: activity.date // truyền ngày hoạt động
  });

  // Lọc cư dân theo tìm kiếm
  const filteredResidents = residents.filter(r =>
    r.name.toLowerCase().includes(search.toLowerCase()) ||
    (r.room?.toLowerCase() || '').includes(search.toLowerCase())
  );

  // Chọn tất cả Có/Không
  const setAll = (participated: boolean) => {
    handleSelectAll(participated);
    setShowReasonAll(!participated);
  };

  // Khi nhập lý do chung
  const handleReasonAllChange = (val: string) => {
    setReasonAll(val);
    filteredResidents.forEach(resident => {
      if (!evaluations[resident.id] || !evaluations[resident.id].participated) {
        handleReasonChange(resident.id, val);
      }
    });
  };

  const handleSave = async () => {
    try {
      await handleSaveEvaluations(activity);
      onClose();
    } catch (err: any) {
      toast.error(err.message || 'Có lỗi xảy ra khi lưu đánh giá.');
    }
  };

  return (
    <Dialog open={open} onClose={onClose} className="fixed z-50 inset-0 overflow-y-auto">
      <div className="flex items-center justify-center min-h-screen px-2 sm:px-4">
        <Dialog.Overlay className="fixed inset-0 bg-black opacity-30" />
        <div className="relative bg-white rounded-xl shadow-xl w-full max-w-5xl mx-auto p-0 sm:p-0 z-15">
          {/* Header */}
          <div className="flex items-center gap-3 px-6 pt-6 pb-2 border-b">
            <div className="bg-green-100 rounded-lg p-2 flex items-center justify-center">
              <UserGroupIcon className="w-7 h-7 text-green-600" />
            </div>
            <div>
              <Dialog.Title className="text-lg sm:text-xl font-bold mb-0">Đánh giá tham gia hoạt động</Dialog.Title>
              <div className="text-gray-600 text-sm font-medium">{activity.name} - {activity.date}</div>
            </div>
          </div>

          {/* Tìm kiếm + thao tác nhanh */}
          <div className="flex flex-col sm:flex-row items-center gap-2 px-6 pt-4 pb-2">
            <div className="relative w-full sm:w-1/2">
              <MagnifyingGlassIcon className="w-5 h-5 text-gray-400 absolute left-2 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                className="border rounded pl-8 pr-3 py-2 w-full text-sm focus:ring-green-500 focus:border-green-500"
                placeholder="Tìm kiếm cư dân theo tên hoặc phòng..."
                value={search}
                onChange={e => setSearch(e.target.value)}
              />
            </div>
            <div className="flex gap-2 w-full sm:w-auto justify-end">
              <button
                type="button"
                className="px-3 py-2 rounded bg-green-50 text-green-700 font-semibold border border-green-200 hover:bg-green-100 flex items-center gap-1"
                onClick={() => setAll(true)}
              >
                <CheckCircleIcon className="w-5 h-5" /> Chọn tất cả Có
              </button>
              <button
                type="button"
                className="px-3 py-2 rounded bg-red-50 text-red-700 font-semibold border border-red-200 hover:bg-red-100 flex items-center gap-1"
                onClick={() => setAll(false)}
              >
                <XCircleIcon className="w-5 h-5" /> Chọn tất cả Không
              </button>
            </div>
          </div>

          {/* Lý do chung nếu tất cả Không */}
          {showReasonAll && (
            <div className="px-6 pb-2">
              <input
                type="text"
                className="border rounded px-3 py-2 w-full text-sm mt-1 mb-2 focus:ring-red-500 focus:border-red-500"
                placeholder="Nhập lý do chung cho tất cả cư dân vắng mặt..."
                value={reasonAll}
                onChange={e => handleReasonAllChange(e.target.value)}
              />
            </div>
          )}

          {/* Danh sách cư dân */}
          <div className="max-h-[80vh] overflow-y-auto divide-y px-2 sm:px-12 pb-2">
            {filteredResidents.length === 0 && (
              <div className="text-center text-gray-400 py-8">Không tìm thấy cư dân phù hợp.</div>
            )}
            {filteredResidents.map(resident => {
              const ev = evaluations[resident.id] || { participated: true, reason: '' };
              return (
                <div key={resident.id} className="flex items-center gap-3 py-3">
                  <div className="flex-shrink-0">
                    {resident.photo ? (
                      <img src={resident.photo} alt={resident.name} className="w-10 h-10 rounded-full object-cover border" />
                    ) : (
                      <UserIcon className="w-10 h-10 text-gray-300 bg-gray-100 rounded-full p-1" />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="font-semibold text-gray-900 truncate">{resident.name}</div>
                    <div className="text-xs text-gray-500 truncate">Phòng: {resident.room} | Tuổi: {resident.age}</div>
                  </div>
                  <div className="flex items-center gap-2">
                    <label className="flex items-center gap-1 cursor-pointer">
                      <input
                        type="radio"
                        checked={ev.participated}
                        onChange={() => handleEvaluationChange(resident.id, true)}
                      />
                      <span className="text-green-700 font-medium">Có</span>
                    </label>
                    <label className="flex items-center gap-1 cursor-pointer">
                      <input
                        type="radio"
                        checked={!ev.participated}
                        onChange={() => handleEvaluationChange(resident.id, false)}
                      />
                      <span className="text-red-700 font-medium">Không</span>
                    </label>
                  </div>
                  {!ev.participated && (
                    <input
                      type="text"
                      className="border rounded px-2 py-1 text-sm w-44 focus:ring-red-500 focus:border-red-500 ml-2"
                      placeholder="Lý do vắng mặt..."
                      value={ev.reason || ''}
                      onChange={e => handleReasonChange(resident.id, e.target.value)}
                      required
                    />
                  )}
                </div>
              );
            })}
          </div>

          {/* Footer */}
          <div className="flex justify-end gap-2 px-12 py-6 border-t bg-gray-50 rounded-b-xl">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded bg-gray-200 hover:bg-gray-300 font-semibold"
              disabled={saving}
            >
              Hủy
            </button>
            <button
              type="button"
              onClick={handleSave}
              className="px-4 py-2 rounded bg-green-600 text-white hover:bg-green-700 font-semibold"
              disabled={saving || filteredResidents.some(r => !evaluations[r.id]?.participated && !evaluations[r.id]?.reason)}
            >
              {saving ? 'Đang lưu...' : 'Lưu đánh giá'}
            </button>
          </div>
        </div>
      </div>
    </Dialog>
  );
} 