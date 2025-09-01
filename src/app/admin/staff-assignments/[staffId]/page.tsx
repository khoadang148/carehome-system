"use client";

import { useState, useEffect } from 'react'
import { toast } from 'react-toastify'
import { getUserFriendlyError } from '@/lib/utils/error-translations';
import { useRouter, useParams } from 'next/navigation';
import Link from 'next/link';
import {
  ArrowLeftIcon,
  UserGroupIcon,
  PencilIcon,
  TrashIcon,
  XMarkIcon,
  CheckIcon,
  ExclamationTriangleIcon,
  PlusCircleIcon,
  CheckCircleIcon,
} from '@heroicons/react/24/outline';
import { useAuth } from '@/lib/contexts/auth-context';
import { staffAssignmentsAPI, staffAPI, residentAPI, userAPI } from '@/lib/api';
import ResidentAssignmentList from '@/components/staff/ResidentAssignmentList';

export default function StaffAssignmentDetailPage() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const params = useParams();
  const staffId = params.staffId as string;

  const [staff, setStaff] = useState<any>(null);
  const [assignments, setAssignments] = useState<any[]>([]);
  const [residents, setResidents] = useState<any[]>([]);
  const [loadingData, setLoadingData] = useState(false);
  const [error, setError] = useState('');

  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [selectedAssignment, setSelectedAssignment] = useState<any>(null);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [successData, setSuccessData] = useState<any>(null);

  const [formData, setFormData] = useState({
    staff_id: '',
    resident_id: '',
    end_date: '',
    notes: '',
    responsibilities: ['vital_signs', 'care_notes', 'activities', 'photos'],
  });

  const [submitting, setSubmitting] = useState(false);
  const [showCreateModal, setShowCreateModal] = useState(false);

  useEffect(() => {
    if (!loading && (!user || user.role !== 'admin')) {
      router.push('/');
    }
  }, [user, loading, router]);

  useEffect(() => {
    if (!user || user.role !== 'admin' || !staffId) return;

    const loadData = async () => {
      setLoadingData(true);
      setError('');

      try {
        const [staffData, assignmentsData, residentsData] = await Promise.all([
          userAPI.getById(staffId),
          staffAssignmentsAPI.getByStaff(staffId),
          residentAPI.getAll(),
        ]);

        setStaff(staffData);
        setAssignments(Array.isArray(assignmentsData) ? assignmentsData : []);
        setResidents(Array.isArray(residentsData) ? residentsData : []);
      } catch (err: any) {
        setError(`Không thể tải dữ liệu: ${err.response?.data?.message || err.message}`);
      } finally {
        setLoadingData(false);
      }
    };

    loadData();
  }, [user, staffId]);

  const handleUpdate = async () => {
    if (!selectedAssignment) return;

    setSubmitting(true);
    try {
      const updatedAssignment = await staffAssignmentsAPI.update(selectedAssignment._id, {
        staff_id: formData.staff_id,
        resident_id: formData.resident_id,
        end_date: formData.end_date || undefined,
        notes: formData.notes,
        responsibilities: formData.responsibilities,
      });

      setAssignments(prev =>
        prev.map(a => a._id === selectedAssignment._id ? updatedAssignment : a)
      );
      setShowEditModal(false);
      resetForm();

      setSuccessData({
        type: 'update',
        message: 'Cập nhật phân công thành công!',
        assignment: updatedAssignment,
      });
      setShowSuccessModal(true);
    } catch (err: any) {
      const errorMessage = err.response?.data?.message || 'Không thể cập nhật phân công. Vui lòng thử lại.';
      toast.error(errorMessage);
    } finally {
      setSubmitting(false);
    }
  };

  const handleCreate = async () => {
    setSubmitting(true);
    try {
      const newAssignment = await staffAssignmentsAPI.create({
        staff_id: staffId,
        resident_id: formData.resident_id,
        end_date: formData.end_date || undefined,
        notes: formData.notes,
        responsibilities: formData.responsibilities,
      });


      const updatedAssignments = await staffAssignmentsAPI.getByStaff(staffId);
      setAssignments(Array.isArray(updatedAssignments) ? updatedAssignments : []);

      setShowCreateModal(false);
      resetForm();

      setSuccessData({
        type: 'create',
        message: 'Tạo phân công thành công!',
        assignment: newAssignment,
      });
      setShowSuccessModal(true);
    } catch (err: any) {
      const errorMessage = err.response?.data?.message || 'Không thể tạo phân công. Vui lòng thử lại.';
      toast.error(errorMessage);
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (!selectedAssignment) return;

    setSubmitting(true);
    try {
      await staffAssignmentsAPI.delete(selectedAssignment._id);
      setAssignments(prev => prev.filter(a => a._id !== selectedAssignment._id));
      setShowDeleteModal(false);

      setSuccessData({
        type: 'delete',
        message: 'Xóa phân công thành công!',
        assignment: selectedAssignment,
      });
      setShowSuccessModal(true);
    } catch (err: any) {
      const errorMessage = err.response?.data?.message || 'Không thể xóa phân công. Vui lòng thử lại.';
      toast.error(errorMessage);
    } finally {
      setSubmitting(false);
    }
  };

  const handleSuccessClose = () => {
    setShowSuccessModal(false);
    setSuccessData(null);
  };

  const resetForm = () => {
    setFormData({
      staff_id: '',
      resident_id: '',
      end_date: '',
      notes: '',
      responsibilities: ['vital_signs', 'care_notes', 'activities', 'photos'],
    });
    setSelectedAssignment(null);
  };

  const openEditModal = (assignment: any) => {
    setSelectedAssignment(assignment);
    setFormData({
      staff_id: assignment.staff_id?._id || assignment.staff_id,
      resident_id: assignment.resident_id?._id || assignment.resident_id,
      end_date: assignment.end_date ? new Date(assignment.end_date).toISOString().split('T')[0] : '',
      notes: assignment.notes || '',
      responsibilities: assignment.responsibilities || ['vital_signs', 'care_notes', 'activities', 'photos'],
    });
    setShowEditModal(true);
  };

  const openDeleteModal = (assignment: any) => {
    setSelectedAssignment(assignment);
    setShowDeleteModal(true);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('vi-VN');
  };

  const getStatusBadge = (status: string) => {
    return <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
      <CheckIcon className="w-3 h-3 mr-1" />
      Đang hoạt động
    </span>;
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Đang tải...</p>
        </div>
      </div>
    );
  }

  if (!user || user.role !== 'admin') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-red-50 to-pink-100 flex items-center justify-center">
        <div className="text-center">
          <ExclamationTriangleIcon className="h-16 w-16 text-red-500 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-gray-900 mb-2">Không có quyền truy cập</h2>
          <p className="text-gray-600">Bạn cần quyền admin để truy cập trang này.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50">
      <div className="bg-white shadow-lg border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            <div className="flex items-center">
              <Link
                href="/admin/staff-assignments"
                className="mr-4 p-2 text-gray-400 hover:text-gray-600 transition-colors rounded-lg hover:bg-gray-100"
              >
                <ArrowLeftIcon className="w-6 h-6" />
              </Link>
              <div>
                <h1 className="text-3xl font-bold text-gray-900 bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
                  Quản lý phân công - {staff?.full_name || 'Đang tải...'}
                </h1>
                <p className="text-sm text-gray-500 mt-1">Quản lý tất cả phân công của nhân viên này</p>
              </div>
            </div>
            <button
              onClick={() => setShowCreateModal(true)}
              className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white px-6 py-3 rounded-xl flex items-center transition-all duration-200 shadow-lg hover:shadow-xl transform hover:scale-105 font-medium"
            >
              <PlusCircleIcon className="w-5 h-5 mr-3" />
              Thêm phân công
            </button>
          </div>
        </div>
      </div>

      {error && (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-6">
          <div className="bg-red-50 border-l-4 border-red-400 text-red-700 px-6 py-4 rounded-lg shadow-md">
            <div className="flex items-center">
              <ExclamationTriangleIcon className="w-5 h-5 mr-3" />
              <p className="font-medium">{error}</p>
            </div>
          </div>
        </div>
      )}

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {loadingData ? (
          <div className="flex justify-center items-center h-64">
            <div className="text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
              <p className="text-gray-600">Đang tải dữ liệu...</p>
            </div>
          </div>
        ) : (
          <>
            {staff && (
              <div className="bg-white rounded-2xl shadow-xl border border-gray-100 p-8 mb-8">
                <div className="flex items-center justify-between">
                  <div className="flex items-center">
                    <div className="h-20 w-20 rounded-full bg-gradient-to-r from-blue-500 to-indigo-500 flex items-center justify-center shadow-lg">
                      <UserGroupIcon className="h-10 w-10 text-white" />
                    </div>
                    <div className="ml-8">
                      <h2 className="text-2xl font-bold text-gray-900">{staff.full_name}</h2>
                      <p className="text-gray-500 text-lg">{staff.email}</p>
                      <p className="text-sm text-gray-400">ID: {staff._id}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-4xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
                      {assignments.length}
                    </div>
                    <div className="text-sm text-gray-500 font-medium">Tổng phân công</div>
                  </div>
                </div>
              </div>
            )}

            <div className="bg-white rounded-2xl shadow-xl border border-gray-100 p-8">
              <div className="mb-8">
                <h3 className="text-2xl font-bold text-gray-900 flex items-center">
                  <div className="w-8 h-8 bg-green-100 rounded-lg flex items-center justify-center mr-3">
                    <CheckIcon className="w-5 h-5 text-green-600" />
                  </div>
                  Danh sách phân công
                </h3>
                <p className="text-sm text-gray-500 mt-2">Quản lý tất cả người cao tuổi được phân công cho nhân viên này</p>
              </div>

              {assignments.length === 0 ? (
                <div className="text-center py-16">
                  <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-6">
                    <UserGroupIcon className="h-10 w-10 text-gray-400" />
                  </div>
                  <h3 className="text-xl font-semibold text-gray-900 mb-2">Chưa có phân công nào</h3>
                  <p className="text-gray-500 mb-6">Bắt đầu tạo phân công mới cho nhân viên này</p>
                  <button
                    onClick={() => setShowCreateModal(true)}
                    className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white px-6 py-3 rounded-xl flex items-center mx-auto transition-all duration-200 shadow-lg hover:shadow-xl transform hover:scale-105 font-medium"
                  >
                    <PlusCircleIcon className="w-5 h-5 mr-3" />
                    Tạo phân công đầu tiên
                  </button>
                </div>
              ) : (
                <ResidentAssignmentList
                  assignments={assignments}
                  onEdit={openEditModal}
                  onDelete={openDeleteModal}
                />
              )}
            </div>
          </>
        )}
      </div>

      {showEditModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full">
            <div className="p-8">
              <h2 className="text-2xl font-bold text-gray-900 mb-6 flex items-center">
                <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center mr-3">
                  <PencilIcon className="w-5 h-5 text-blue-600" />
                </div>
                Chỉnh sửa phân công
              </h2>
              <div className="space-y-6">
                <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl p-4">
                  <label className="block text-sm font-semibold text-gray-700 mb-3">
                    Người cao tuổi
                  </label>
                  <select
                    value={formData.resident_id}
                    onChange={(e) => setFormData({ ...formData, resident_id: e.target.value })}
                    className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-4 focus:ring-blue-100 focus:border-blue-500 focus:outline-none transition-all duration-200"
                  >
                    <option value="">Chọn người cao tuổi</option>
                    {residents
                      .filter(resident => {
                        const isAssignedToOtherStaff = assignments.some(
                          assignment =>
                            assignment.resident_id?._id === resident._id &&
                            assignment.staff_id?._id !== staffId &&
                            assignment.status === 'active'
                        );
                        return !isAssignedToOtherStaff;
                      })
                      .map((resident) => (
                        <option key={resident._id} value={resident._id}>
                          {resident.full_name}
                        </option>
                      ))}
                  </select>
                </div>
                <div className="bg-gradient-to-r from-purple-50 to-pink-50 rounded-xl p-4">
                  <label className="block text-sm font-semibold text-gray-700 mb-3">
                    Ngày kết thúc
                  </label>
                  <input
                    type="date"
                    value={formData.end_date}
                    onChange={(e) => setFormData({ ...formData, end_date: e.target.value })}
                    className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-4 focus:ring-purple-100 focus:border-purple-500 focus:outline-none transition-all duration-200"
                  />
                </div>
                <div className="bg-gradient-to-r from-yellow-50 to-orange-50 rounded-xl p-4">
                  <label className="block text-sm font-semibold text-gray-700 mb-3">
                    Ghi chú
                  </label>
                  <textarea
                    value={formData.notes}
                    onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                    rows={3}
                    className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-4 focus:ring-yellow-100 focus:border-yellow-500 focus:outline-none transition-all duration-200 resize-none"
                    placeholder="📝 Ghi chú về phân công..."
                  />
                </div>
              </div>
              <div className="flex justify-end space-x-4 mt-8">
                <button
                  onClick={() => {
                    setShowEditModal(false);
                    resetForm();
                  }}
                  className="px-6 py-3 text-gray-600 border-2 border-gray-300 rounded-xl hover:bg-gray-50 transition-all duration-200 font-medium"
                  disabled={submitting}
                >
                  Hủy
                </button>
                <button
                  onClick={handleUpdate}
                  disabled={submitting}
                  className="px-6 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-xl hover:from-blue-700 hover:to-indigo-700 disabled:opacity-50 transition-all duration-200 font-semibold shadow-lg hover:shadow-xl transform hover:scale-105"
                >
                  {submitting ? (
                    <div className="flex items-center">
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                      Đang cập nhật...
                    </div>
                  ) : (
                    'Cập nhật'
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {showCreateModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full">
            <div className="p-8">
              <h2 className="text-2xl font-bold text-gray-900 mb-6 flex items-center">
                <div className="w-8 h-8 bg-green-100 rounded-lg flex items-center justify-center mr-3">
                  <PlusCircleIcon className="w-5 h-5 text-green-600" />
                </div>
                Thêm phân công mới
              </h2>
              <div className="space-y-6">
                <div className="bg-gradient-to-r from-green-50 to-emerald-50 rounded-xl p-4">
                  <label className="block text-sm font-semibold text-gray-700 mb-3">
                    Người cao tuổi <span className="text-red-500">*</span>
                  </label>
                  <select
                    value={formData.resident_id}
                    onChange={(e) => setFormData({ ...formData, resident_id: e.target.value })}
                    className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-4 focus:ring-green-100 focus:border-green-500 focus:outline-none transition-all duration-200"
                  >
                    <option value="">Chọn người cao tuổi</option>
                    {residents
                      .filter(resident => {
                        const isAssignedToAnyStaff = assignments.some(
                          assignment =>
                            assignment.resident_id?._id === resident._id &&
                            assignment.status === 'active'
                        );
                        return !isAssignedToAnyStaff;
                      })
                      .map((resident) => (
                        <option key={resident._id} value={resident._id}>
                          {resident.full_name}
                        </option>
                      ))}
                  </select>
                </div>
                <div className="bg-gradient-to-r from-purple-50 to-pink-50 rounded-xl p-4">
                  <label className="block text-sm font-semibold text-gray-700 mb-3">
                    Ngày kết thúc
                  </label>
                  <input
                    type="date"
                    value={formData.end_date}
                    onChange={(e) => setFormData({ ...formData, end_date: e.target.value })}
                    className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-4 focus:ring-purple-100 focus:border-purple-500 focus:outline-none transition-all duration-200"
                  />
                </div>
                <div className="bg-gradient-to-r from-yellow-50 to-orange-50 rounded-xl p-4">
                  <label className="block text-sm font-semibold text-gray-700 mb-3">
                    Ghi chú
                  </label>
                  <textarea
                    value={formData.notes}
                    onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                    rows={3}
                    className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-4 focus:ring-yellow-100 focus:border-yellow-500 focus:outline-none transition-all duration-200 resize-none"
                    placeholder="📝 Ghi chú về phân công..."
                  />
                </div>
              </div>
              <div className="flex justify-end space-x-4 mt-8">
                <button
                  onClick={() => {
                    setShowCreateModal(false);
                    resetForm();
                  }}
                  className="px-6 py-3 text-gray-600 border-2 border-gray-300 rounded-xl hover:bg-gray-50 transition-all duration-200 font-medium"
                  disabled={submitting}
                >
                  Hủy
                </button>
                <button
                  onClick={handleCreate}
                  disabled={submitting || !formData.resident_id}
                  className="px-6 py-3 bg-gradient-to-r from-green-600 to-emerald-600 text-white rounded-xl hover:from-green-700 hover:to-emerald-700 disabled:opacity-50 transition-all duration-200 font-semibold shadow-lg hover:shadow-xl transform hover:scale-105"
                >
                  {submitting ? (
                    <div className="flex items-center">
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                      Đang tạo...
                    </div>
                  ) : (
                    'Tạo phân công'
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {showDeleteModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full">
            <div className="p-8 text-center">
              <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-6">
                <ExclamationTriangleIcon className="w-8 h-8 text-red-600" />
              </div>
              <h2 className="text-2xl font-bold text-gray-900 mb-4">Xác nhận xóa</h2>
              <p className="text-gray-600 mb-8">
                Bạn có chắc chắn muốn xóa phân công này không? Hành động này không thể hoàn tác.
              </p>
              <div className="flex justify-center space-x-4">
                <button
                  onClick={() => setShowDeleteModal(false)}
                  className="px-6 py-3 text-gray-600 border-2 border-gray-300 rounded-xl hover:bg-gray-50 transition-all duration-200 font-medium"
                  disabled={submitting}
                >
                  Hủy
                </button>
                <button
                  onClick={handleDelete}
                  disabled={submitting}
                  className="px-6 py-3 bg-gradient-to-r from-red-600 to-pink-600 text-white rounded-xl hover:from-red-700 hover:to-pink-700 disabled:opacity-50 transition-all duration-200 font-semibold shadow-lg hover:shadow-xl transform hover:scale-105"
                >
                  {submitting ? (
                    <div className="flex items-center">
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                      Đang xóa...
                    </div>
                  ) : (
                    'Xóa'
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {showSuccessModal && successData && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-3xl shadow-2xl max-w-md w-full transform transition-all duration-300 scale-100">
            <div className="p-8 text-center">
              <div className="w-20 h-20 bg-gradient-to-r from-green-400 to-emerald-500 rounded-full flex items-center justify-center mx-auto mb-6 shadow-lg">
                <CheckCircleIcon className="w-12 h-12 text-white" />
              </div>

              <h2 className="text-2xl font-bold text-gray-900 mb-4">
                {successData.message}
              </h2>

              <div className="bg-gradient-to-r from-green-50 to-emerald-50 rounded-2xl p-6 mb-6">
                <div className="space-y-3 text-left">
                  <div className="flex items-center justify-between">
                    <span className="text-gray-600">Hành động:</span>
                    <span className="font-semibold text-gray-900 capitalize">
                      {successData.type === 'create' && 'Tạo mới'}
                      {successData.type === 'update' && 'Cập nhật'}
                      {successData.type === 'delete' && 'Xóa'}
                    </span>
                  </div>
                  {successData.assignment && (
                    <>
                      <div className="flex items-center justify-between">
                        <span className="text-gray-600">Người cao tuổi:</span>
                        <span className="font-semibold text-gray-900">
                          {successData.assignment.resident_id?.full_name || 'N/A'}
                        </span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-gray-600">Nhân viên:</span>
                        <span className="font-semibold text-gray-900">
                          {successData.assignment.staff_id?.full_name || 'N/A'}
                        </span>
                      </div>
                    </>
                  )}
                </div>
              </div>

              <button
                onClick={handleSuccessClose}
                className="w-full px-6 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-xl hover:from-blue-700 hover:to-indigo-700 transition-all duration-200 font-semibold shadow-lg hover:shadow-xl transform hover:scale-105"
              >
                Đóng
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
} 