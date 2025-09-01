"use client";
import { useEffect, useState } from "react"
import { toast } from 'react-toastify'
import { getUserFriendlyError } from '@/lib/utils/error-translations';
import { useRouter, useParams } from "next/navigation";
import { userAPI } from "@/lib/api";
import Image from "next/image";
import Link from "next/link";
import { UserFriendlyErrorHandler } from '@/lib/utils/user-friendly-errors';
import { 
  ArrowLeftIcon,
  UserIcon,
  EnvelopeIcon,
  PhoneIcon,
  IdentificationIcon,
  CalendarIcon,
  MapPinIcon,
  DocumentTextIcon,
  UserGroupIcon,
  CheckCircleIcon,
  ExclamationTriangleIcon
} from "@heroicons/react/24/outline";

export default function EditAccountPage() {
  const router = useRouter();
  const params = useParams();
  const id = params?.id as string;
  const [formData, setFormData] = useState<any>({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [avatarUploading, setAvatarUploading] = useState(false);
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [successMessage, setSuccessMessage] = useState("");
  const [originalData, setOriginalData] = useState<any>({});

  useEffect(() => {
    if (!id) return;
    setLoading(true);
    userAPI.getById(id)
      .then((data) => {
        const initialData = {
          ...data,
          name: data.name || data.full_name || "",
          full_name: data.full_name || data.name || ""
        };
        setFormData(initialData);
        setOriginalData(initialData);
      })
      .catch(() => setError("Không tìm thấy tài khoản!"))
      .finally(() => setLoading(false));
  }, [id]);

  useEffect(() => {
    if (!id) return;

    const interval = setInterval(async () => {
      try {
        const data = await userAPI.getById(id);
        setFormData(prev => ({
          ...prev,
          ...data,
          name: data.name || data.full_name || prev.name || "",
          full_name: data.full_name || data.name || prev.full_name || ""
        }));
      } catch (error) {
      }
    }, 30000);

    return () => clearInterval(interval);
  }, [id]);

  const handleChange = (field: string, value: string) => {
    if (field === "name" || field === "full_name") {
      setFormData((prev: any) => ({ ...prev, name: value, full_name: value }));
    } else {
      setFormData((prev: any) => ({ ...prev, [field]: value }));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError("");
    try {
      if (formData.email) {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(formData.email)) {
          setError("Email không hợp lệ!");
          setSaving(false);
          return;
        }
      }

      const allowedFields = ['full_name', 'email', 'phone', 'notes', 'address', 'position', 'qualification'];
      const filteredData: any = {};
      for (const key of allowedFields) {
        if (formData[key] !== undefined && formData[key] !== null && formData[key] !== '') {
          filteredData[key] = formData[key];
        }
      }

      if (Object.keys(filteredData).length === 0) {
        setError("Không có dữ liệu nào để cập nhật!");
        setSaving(false);
        return;
      }

      await userAPI.update(id, filteredData);

      const updatedData = await userAPI.getById(id);
      const newData = {
        ...updatedData,
        name: updatedData.name || updatedData.full_name || "",
        full_name: updatedData.full_name || updatedData.name || ""
      };
      setFormData(newData);
      setOriginalData(newData);

      setSuccessMessage("Tài khoản đã được cập nhật thành công!");
      setShowSuccessModal(true);
    } catch (err: any) {
      const errorResult = UserFriendlyErrorHandler.handleError(err);
      setError(errorResult.message);
    } finally {
      setSaving(false);
    }
  };

  const handleAvatarChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith('image/')) {
      toast.error('Chỉ chấp nhận file ảnh JPG, PNG, GIF');
      return;
    }
    if (file.size > 1024 * 1024) {
      toast.error('File quá lớn, chỉ chấp nhận tối đa 1MB');
      return;
    }
    setAvatarUploading(true);
    setAvatarPreview(URL.createObjectURL(file));
    const formData = new FormData();
    formData.append('avatar', file);
    try {
      const res = await userAPI.updateAvatar(id, formData);
      const uploadedAvatar = res?.avatar || res?.data?.avatar || res?.path || res?.url;
      if (res?.success === false) {
        toast.error('Lỗi khi upload ảnh đại diện!');
      } else if (uploadedAvatar) {
        const updatedData = await userAPI.getById(id);
        const newData = {
          ...updatedData,
          name: updatedData.name || updatedData.full_name || "",
          full_name: updatedData.full_name || updatedData.name || ""
        };
        setFormData(newData);
        setOriginalData(newData);
        toast.success('Cập nhật ảnh đại diện thành công!');
      } else {
        const updatedData = await userAPI.getById(id);
        const newData = {
          ...updatedData,
          name: updatedData.name || updatedData.full_name || "",
          full_name: updatedData.full_name || updatedData.name || ""
        };
        setFormData(newData);
        setOriginalData(newData);
      }
    } catch (err) {
      toast.error('Lỗi khi upload ảnh đại diện!');
    } finally {
      setAvatarUploading(false);
    }
  };

  const handleStatusChange = async (newStatus: string) => {
    if (newStatus === formData.status) return;
    setSaving(true);
    try {
      if (newStatus === 'active') {
        await userAPI.activate(id);
      } else if (newStatus === 'inactive') {
        await userAPI.deactivate(id);
      }

      const updatedData = await userAPI.getById(id);
      const newData = {
        ...updatedData,
        name: updatedData.name || updatedData.full_name || "",
        full_name: updatedData.full_name || updatedData.name || ""
      };
      setFormData(newData);
      setOriginalData(newData);

      toast.success('Cập nhật trạng thái thành công!');
    } catch {
      toast.error('Cập nhật trạng thái thất bại!');
    } finally {
      setSaving(false);
    }
  };

  // Kiểm tra xem có thay đổi gì không
  const hasChanges = () => {
    if (!originalData || Object.keys(originalData).length === 0) return false;
    
    return (
      formData.name !== originalData.name ||
      formData.full_name !== originalData.full_name ||
      formData.email !== originalData.email ||
      formData.phone !== originalData.phone ||
      formData.role !== originalData.role ||
      formData.position !== originalData.position ||
      formData.qualification !== originalData.qualification ||
      formData.notes !== originalData.notes ||
      formData.address !== originalData.address
    );
  };

  if (loading) return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 flex items-center justify-center">
      <div className="text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
        <p className="text-gray-600">Đang tải dữ liệu...</p>
      </div>
    </div>
  );

  if (error) return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 flex items-center justify-center">
      <div className="text-center">
        <ExclamationTriangleIcon className="h-12 w-12 text-red-500 mx-auto mb-4" />
        <p className="text-red-600">{error}</p>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="bg-gradient-to-r from-blue-200 to-indigo-200 rounded-2xl p-6 mb-8 shadow-lg">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <button
                onClick={() => router.push('/admin/account-management')}
                className="group p-3 rounded-full bg-white/80 hover:bg-white text-gray-700 hover:text-blue-700 hover:shadow-lg transition-all duration-300"
                title="Quay lại"
              >
                <ArrowLeftIcon className="w-5 h-5 group-hover:scale-110 transition-transform duration-200" />
              </button>
              <div>
                <h1 className="text-2xl font-bold text-gray-800">
                  {formData.role === 'family' ? 'Chỉnh sửa tài khoản gia đình' : 'Chỉnh sửa tài khoản nhân viên'}
                </h1>
                <p className="text-gray-600 mt-1">Cập nhật thông tin tài khoản</p>
              </div>
            </div>
          </div>
        </div>

        {/* Main Content */}
        <div className="bg-white rounded-2xl shadow-xl overflow-hidden">
          <form onSubmit={handleSubmit}>
            {/* Profile Section */}
            <div className="bg-gradient-to-r from-blue-50 to-indigo-50 p-8 border-b border-gray-200">
              <div className="flex items-center gap-6">
                {/* Avatar */}
                <div className="relative">
                  <div className="w-24 h-24 rounded-full bg-gradient-to-br from-blue-100 to-indigo-100 border-4 border-white shadow-lg flex items-center justify-center">
                    {avatarPreview ? (
                      <img 
                        src={avatarPreview} 
                        alt="avatar preview" 
                        className="w-full h-full rounded-full object-cover" 
                      />
                    ) : formData.avatar ? (
                      <img 
                        src={userAPI.getAvatarUrl(formData.avatar)}
                        alt="avatar"
                        className="w-full h-full rounded-full object-cover" 
                      />
                    ) : (
                      <UserIcon className="w-12 h-12 text-blue-600" />
                    )}
                  </div>
                  
                  <label 
                    htmlFor="avatar-upload" 
                    className="absolute -bottom-2 -right-2 bg-gradient-to-r from-blue-600 to-indigo-600 rounded-full p-2 cursor-pointer shadow-lg hover:shadow-xl transition-all duration-200"
                    title="Đổi ảnh đại diện"
                  >
                    <svg className="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.75 10.5V6.75A2.25 2.25 0 0 0 13.5 4.5h-3A2.25 2.25 0 0 0 8.25 6.75v3.75m-2.25 0h12a2.25 2.25 0 0 1 2.25 2.25v6.75A2.25 2.25 0 0 1 18 21H6a2.25 2.25 0 0 1-2.25-2.25v-6.75A2.25 2.25 0 0 1 6 10.5z" />
                    </svg>
                    <input 
                      id="avatar-upload" 
                      type="file" 
                      accept="image/*" 
                      onChange={handleAvatarChange}
                      disabled={avatarUploading} 
                      className="hidden" 
                    />
                  </label>
                </div>

                {/* User Info */}
                <div className="flex-1">
                  <h2 className="text-2xl font-bold text-gray-800 mb-2">
                    {formData.name || formData.full_name || 'Chưa có tên'}
                  </h2>
                  <div className="flex items-center gap-4 text-gray-600">
                    <div className="flex items-center gap-2">
                      <UserGroupIcon className="w-4 h-4" />
                      <span className="text-sm font-medium">Vai trò:</span>
                      <span className="px-2 py-1 bg-blue-100 text-blue-800 rounded-full text-xs font-medium">
                        {formData.role === 'admin' ? 'Quản trị viên' : 
                         formData.role === 'staff' ? 'Nhân viên' : 
                         formData.role === 'family' ? 'Gia đình' : 'Chưa xác định'}
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <CheckCircleIcon className="w-4 h-4" />
                      <span className="text-sm font-medium">Trạng thái:</span>
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                        formData.status === 'active' 
                          ? 'bg-green-100 text-green-800' 
                          : 'bg-red-100 text-red-800'
                      }`}>
                        {formData.status === 'active' ? 'Hoạt động' : 'Không hoạt động'}
                      </span>
                    </div>
                  </div>
                  {avatarUploading && (
                    <p className="text-blue-600 text-sm mt-2">Đang tải ảnh lên...</p>
                  )}
                </div>
              </div>
            </div>

            {/* Form Fields */}
            <div className="p-8">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Tên */}
          <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    <UserIcon className="w-4 h-4 inline mr-2" />
                    {formData.role === 'family' ? 'Tên người giám hộ' : 'Tên nhân viên'} *
            </label>
            <input
              type="text"
              value={formData.name || formData.full_name || ''}
              onChange={e => handleChange('name', e.target.value)}
              required
                    className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 bg-gray-50 hover:bg-white"
                    placeholder="Nhập tên đầy đủ"
            />
          </div>

                {/* Email */}
          <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    <EnvelopeIcon className="w-4 h-4 inline mr-2" />
                    Email *
                  </label>
            <input
              type="email"
              value={formData.email || ''}
              onChange={e => handleChange('email', e.target.value)}
              required
                    className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 bg-gray-50 hover:bg-white"
                    placeholder="example@email.com"
                  />
                </div>

                {/* Số điện thoại */}
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    <PhoneIcon className="w-4 h-4 inline mr-2" />
                    Số điện thoại
                  </label>
                  <input
                    type="tel"
                    value={formData.phone || ''}
                    onChange={e => handleChange('phone', e.target.value)}
                    className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 bg-gray-50 hover:bg-white"
                    placeholder="0123456789"
            />
          </div>

                {/* Vai trò */}
          <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    <UserGroupIcon className="w-4 h-4 inline mr-2" />
                    Vai trò *
                  </label>
            <select
              value={formData.role || ''}
              onChange={e => handleChange('role', e.target.value)}
              required
                    className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 bg-gray-50 hover:bg-white"
            >
              <option value="">Chọn vai trò</option>
              <option value="admin">Quản trị viên</option>
              <option value="staff">Nhân viên</option>
              <option value="family">Gia đình</option>
            </select>
          </div>

                {/* Chức vụ - chỉ hiện cho staff và admin */}
          {formData.role !== 'family' && (
            <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      <IdentificationIcon className="w-4 h-4 inline mr-2" />
                      Chức vụ
                    </label>
              <input
                type="text"
                value={formData.position || ''}
                onChange={e => handleChange('position', e.target.value)}
                      className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 bg-gray-50 hover:bg-white"
                      placeholder="Nhập chức vụ"
              />
            </div>
          )}

                {/* Trạng thái */}
          <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    <CheckCircleIcon className="w-4 h-4 inline mr-2" />
                    Trạng thái
                  </label>
            <select
              value={formData.status || 'active'}
              onChange={e => handleStatusChange(e.target.value)}
              disabled={saving || formData.role === 'admin'}
                    className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 bg-gray-50 hover:bg-white disabled:bg-gray-100 disabled:cursor-not-allowed"
            >
              <option value="active">Hoạt động</option>
              <option value="inactive">Không hoạt động</option>
            </select>
            {formData.role === 'admin' && (
                    <p className="text-red-500 text-xs mt-1">
                      Không thể thay đổi trạng thái tài khoản quản trị viên
                    </p>
                  )}
                </div>

                {/* Địa chỉ */}
                <div className="md:col-span-2">
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    <MapPinIcon className="w-4 h-4 inline mr-2" />
                    Địa chỉ
                  </label>
                  <input
                    type="text"
                    value={formData.address || ''}
                    onChange={e => handleChange('address', e.target.value)}
                    className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 bg-gray-50 hover:bg-white"
                    placeholder="Nhập địa chỉ"
                  />
                </div>

                {/* Ghi chú */}
                <div className="md:col-span-2">
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    <DocumentTextIcon className="w-4 h-4 inline mr-2" />
                    Ghi chú
                  </label>
                  <textarea
                    value={formData.notes || ''}
                    onChange={e => handleChange('notes', e.target.value)}
                    rows={3}
                    className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 bg-gray-50 hover:bg-white resize-none"
                    placeholder="Nhập ghi chú (nếu có)"
                  />
                </div>
              </div>

              {/* Error Message */}
              {error && (
                <div className="mt-6 p-4 bg-red-50 border border-red-200 rounded-xl">
                  <div className="flex items-center gap-2">
                    <ExclamationTriangleIcon className="w-5 h-5 text-red-500" />
                    <p className="text-red-700">{error}</p>
                  </div>
                </div>
              )}

              {/* Action Buttons */}
              <div className="flex justify-end gap-4 mt-8 pt-6 border-t border-gray-200">
                <button
                  type="button"
                  onClick={() => router.push('/admin/account-management')}
                  className="px-6 py-3 border border-gray-300 rounded-xl bg-white text-gray-700 font-semibold hover:bg-gray-50 hover:border-gray-400 transition-all duration-200"
                >
                  Hủy
                </button>
                
                {hasChanges() ? (
                  <button
                    type="submit"
                    disabled={saving}
                    className="px-6 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-semibold rounded-xl hover:from-blue-700 hover:to-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 flex items-center gap-2"
                  >
                    {saving ? (
                      <>
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                        Đang lưu...
                      </>
                    ) : (
                      <>
                        <CheckCircleIcon className="w-5 h-5" />
                        Cập nhật
                      </>
                    )}
                  </button>
                ) : (
                  <div className="px-6 py-3 bg-gray-100 text-gray-500 font-semibold rounded-xl flex items-center gap-2">
                    <CheckCircleIcon className="w-5 h-5" />
                    Không có thay đổi
              </div>
            )}
          </div>
        </div>
          </form>
        </div>
      </div>

      {/* Success Modal */}
      {showSuccessModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl p-8 max-w-md w-full text-center shadow-2xl">
            <div className="w-16 h-16 bg-gradient-to-r from-green-500 to-emerald-500 rounded-full flex items-center justify-center mx-auto mb-4">
              <CheckCircleIcon className="w-8 h-8 text-white" />
            </div>

            <h3 className="text-xl font-bold text-gray-800 mb-2">
              Thành công!
            </h3>

            <p className="text-gray-600 mb-6">
              {successMessage}
            </p>

            <button
              onClick={() => {
                setShowSuccessModal(false);
                router.push("/admin/account-management");
              }}
              className="w-full px-6 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-semibold rounded-xl hover:from-blue-700 hover:to-indigo-700 transition-all duration-200"
            >
              Đóng
            </button>
          </div>
        </div>
      )}
    </div>
  );
} 