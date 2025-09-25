"use client";

import { useEffect, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import useSWR from 'swr';
import { useAuth } from "@/lib/contexts/auth-context";
import { useNotifications } from "@/lib/contexts/notification-context";
import { userAPI, API_BASE_URL, photosAPI } from "@/lib/api";
import SuccessModal from "@/components/SuccessModal";
import {
  ArrowLeftIcon,
  CheckCircleIcon,
  XCircleIcon,
  UserIcon,
  ArrowPathIcon,
  ExclamationTriangleIcon,
  DocumentTextIcon,
  ShieldCheckIcon
} from "@heroicons/react/24/outline";
import {
  CheckCircleIcon as CheckCircleIconSolid,
  XCircleIcon as XCircleIconSolid
} from "@heroicons/react/24/solid";

export default function ApprovalDetailPage() {

  const { user, loading } = useAuth();
  const { addNotification } = useNotifications();
  const router = useRouter();
  const params = useParams();
  const id = String(params?.id || ""); // user id

  const [busy, setBusy] = useState(false);
  const [successOpen, setSuccessOpen] = useState(false);
  const [successTitle, setSuccessTitle] = useState<string | undefined>(undefined);
  const [successName, setSuccessName] = useState<string | undefined>(undefined);
  const [successActionType, setSuccessActionType] = useState<string | undefined>(undefined);
  const [successDetails, setSuccessDetails] = useState<string | undefined>(undefined);
  const [nextUrlAfterSuccess, setNextUrlAfterSuccess] = useState<string | null>(null);

  useEffect(() => {
    if (!loading && (!user || user.role !== "admin")) {
      router.replace("/login");
    }
  }, [user, loading, router]);

  // Fetch user data for approval
  const { data: userDetail, error: userError } = useSWR(
    id ? ["user", id] : null,
    () => userAPI.getById(id),
    { 
      revalidateOnFocus: false, 
      dedupingInterval: 30000,
      onError: (error) => {
        console.warn('Failed to fetch user data:', error);
      }
    }
  );

  const isLoadingInitial = !userDetail;
  const showError = userError && !userDetail;

  const getStatusLabel = (status?: string) => {
    switch ((status || '').toLowerCase()) {
      case 'active':
        return 'Đang hoạt động';
      case 'inactive':
        return 'Không hoạt động';
      case 'suspended':
        return 'Tạm khóa';
      case 'deleted':
        return 'Đã xóa';
      case 'pending':
        return 'Chờ duyệt';
      case 'accepted':
        return 'Đã duyệt';
      case 'rejected':
        return 'Từ chối';
      default:
        return status || '---';
    }
  };

  const getRoleLabel = (role?: string) => {
    switch ((role || '').toLowerCase()) {
      case 'admin':
        return 'Quản trị viên';
      case 'staff':
        return 'Nhân viên';
      case 'family':
        return 'Gia đình';
      default:
        return role || '---';
    }
  };

  const approveUser = async () => {
    try {
      setBusy(true);
      if (userDetail?._id) {
        await userAPI.approveUser(userDetail._id);
        
        // Add notification for admin
        addNotification({
          type: 'success',
          title: 'Phê duyệt tài khoản thành công',
          message: `Tài khoản ${userDetail?.full_name || userDetail?.username || 'người dùng'} đã được phê duyệt thành công.`,
          category: 'system',
          actionUrl: '/admin/approvals'
        });
        
        setSuccessTitle('Phê duyệt tài khoản thành công!');
        setSuccessName(userDetail?.full_name || userDetail?.username || 'Tài khoản');
        setSuccessActionType('approve');
        setSuccessDetails('Tài khoản đã được phê duyệt thành công. Người dùng có thể đăng nhập và sử dụng hệ thống.');
        setSuccessOpen(true);
        setNextUrlAfterSuccess('/admin/approvals');
      }
    } finally {
      setBusy(false);
    }
  };

  const rejectUser = async () => {
    try {
      const reason = window.prompt('Nhập lý do từ chối');
      if (reason === null) return;
      setBusy(true);
      if (userDetail?._id) {
        await userAPI.deactivateUser(userDetail._id, reason || undefined);
        
        // Add notification for admin
        addNotification({
          type: 'warning',
          title: 'Từ chối tài khoản',
          message: `Tài khoản ${userDetail?.full_name || userDetail?.username || 'người dùng'} đã bị từ chối${reason ? ` với lý do: ${reason}` : ''}.`,
          category: 'system',
          actionUrl: '/admin/approvals'
        });
        
        setSuccessTitle('Đã từ chối tài khoản');
        setSuccessName(userDetail?.full_name || userDetail?.username || 'Tài khoản');
        setSuccessActionType('reject');
        setSuccessDetails(reason ? `Lý do từ chối: ${reason}` : 'Tài khoản đã bị từ chối.');
        setSuccessOpen(true);
        setNextUrlAfterSuccess('/admin/approvals');
      }
    } finally {
      setBusy(false);
    }
  };

  if (!user || user.role !== "admin") return null;

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 p-8">
      <div className="max-w-6xl mx-auto">
        {/* Header Section */}
        <div className="bg-gradient-to-br from-white via-white to-slate-50 rounded-2xl p-8 mb-8 shadow-lg border border-white/20 backdrop-blur-sm">
          <div className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-4">
            <button
              onClick={() => router.push('/admin/approvals')}
                className="group p-3.5 rounded-xl bg-gradient-to-r from-violet-100 to-purple-100 hover:from-violet-200 hover:to-purple-200 text-violet-700 hover:text-violet-800 hover:shadow-lg hover:shadow-violet-200/50 hover:-translate-y-0.5 transition-all duration-300"
              title="Quay lại"
              >
                <ArrowLeftIcon className="w-5 h-5 group-hover:scale-110 transition-transform duration-200" />
            </button>
              <div className="w-14 h-14 bg-gradient-to-br from-violet-500 to-indigo-600 rounded-2xl flex items-center justify-center shadow-lg shadow-violet-500/25">
                <ShieldCheckIcon className="w-7 h-7 text-white" />
              </div>
              <div>
                <h1 className="text-3xl font-black text-transparent bg-clip-text bg-gradient-to-r from-violet-600 via-indigo-600 to-purple-600 mb-2 tracking-tight">
              Chi tiết phê duyệt
            </h1>
                <p className="text-base text-slate-600 font-semibold flex items-center gap-2">
                  <DocumentTextIcon className="w-4 h-4 text-violet-500" />
                  Xem và xử lý yêu cầu phê duyệt tài khoản người dùng
                </p>
              </div>
            </div>
          </div>
        </div>

        {showError ? (
          <div className="bg-gradient-to-br from-white via-white to-slate-50 rounded-2xl p-8 shadow-lg border border-white/20 backdrop-blur-sm text-center">
            <div className="w-16 h-16 bg-gradient-to-br from-red-500 to-rose-600 rounded-full flex items-center justify-center mx-auto mb-6 shadow-lg shadow-red-500/25">
              <ExclamationTriangleIcon className="w-8 h-8 text-white" />
            </div>
            <h3 className="text-xl font-bold text-red-600 mb-4">Không thể tải thông tin phê duyệt</h3>
            <p className="text-slate-600 mb-6">
              Không tìm thấy thông tin tài khoản với ID: {id}
            </p>
            <button
              onClick={() => router.push('/admin/approvals')}
              className="px-6 py-3 bg-gradient-to-r from-blue-500 to-blue-600 text-white rounded-xl font-semibold shadow-md hover:shadow-lg hover:-translate-y-0.5 transition-all duration-200"
            >
              Quay lại danh sách phê duyệt
            </button>
          </div>
        ) : isLoadingInitial ? (
          <div className="bg-gradient-to-br from-white via-white to-slate-50 rounded-2xl p-8 shadow-lg border border-white/20 backdrop-blur-sm">
            <div className="space-y-6">
              <div className="flex items-center gap-3">
                <div className="w-11 h-11 bg-gradient-to-br from-slate-200 to-slate-300 rounded-xl animate-pulse" />
                <div className="flex-1">
                  <div className="h-4 bg-gradient-to-r from-slate-200 to-slate-300 rounded-lg w-2/5 mb-2 animate-pulse" />
                  <div className="h-3 bg-gradient-to-r from-slate-200 to-slate-300 rounded-lg w-1/4 animate-pulse" />
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                {Array.from({ length: 4 }).map((_, idx) => (
                  <div key={idx} className="p-4 rounded-xl bg-slate-50 border border-slate-200">
                    <div className="h-3 bg-gradient-to-r from-slate-200 to-slate-300 rounded-lg w-2/5 mb-2 animate-pulse" />
                    <div className="h-4 bg-gradient-to-r from-slate-200 to-slate-300 rounded-lg w-3/4 animate-pulse" />
                  </div>
                ))}
              </div>
            </div>
          </div>
        ) : userDetail && (
          <div className="space-y-6">
            {/* User Information Card */}
            <div className="bg-gradient-to-br from-white via-white to-slate-50 rounded-2xl p-8 shadow-lg border border-white/20 backdrop-blur-sm">
              <div className="flex items-center gap-3 mb-6 p-4 bg-gradient-to-br from-slate-50 to-slate-100 rounded-xl border border-slate-200 shadow-sm">
                <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl flex items-center justify-center shadow-lg shadow-blue-500/25">
                  <UserIcon className="w-5 h-5 text-white" />
                </div>
                <div>
                  <h2 className="text-xl font-black text-slate-800 tracking-tight">
                    THÔNG TIN TÀI KHOẢN
                  </h2>
                  <p className="text-sm text-slate-600 font-medium">
                    Thông tin chi tiết tài khoản người dùng
                  </p>
                </div>
              </div>

              {/* User Avatar and Basic Info */}
              <div className="flex flex-col items-center gap-4 mb-8 py-6">
                <div className="relative w-24 h-24">
                  <div className="absolute inset-0 rounded-full p-1 bg-gradient-to-r from-blue-500 via-indigo-500 to-purple-500" />
                  <div className="absolute inset-1 rounded-full overflow-hidden bg-slate-100 flex items-center justify-center">
                    {userDetail.avatar ? (
                      <img
                        src={`${API_BASE_URL}/${String(userDetail.avatar || '').replace(/\\/g, '/')}`}
                        alt="avatar"
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <UserIcon className="w-10 h-10 text-blue-500" />
                    )}
                  </div>
                </div>
                
                <div className="text-center">
                  <div className="text-xs text-slate-500 font-semibold mb-1 uppercase tracking-wider">
                    Tài khoản:
                  </div>
                  <h1 className="text-2xl font-black text-slate-900 mb-3 tracking-tight">
                      {userDetail.full_name || userDetail.username || '---'}
                    </h1>
                  <div className="flex items-center justify-center gap-2 mb-3">
                    <span className="text-xs text-slate-500 font-semibold uppercase tracking-wider">
                      Trạng thái tài khoản:
                    </span>
                    <span className={`text-sm font-semibold text-white rounded-full px-4 py-1.5 shadow-lg uppercase tracking-wider ${userDetail?.status === 'active' ? 'bg-gradient-to-r from-emerald-500 to-emerald-600' :
                        userDetail?.status === 'inactive' ? 'bg-gradient-to-r from-gray-500 to-gray-600' :
                          userDetail?.status === 'suspended' ? 'bg-gradient-to-r from-yellow-500 to-yellow-600' :
                            userDetail?.status === 'deleted' ? 'bg-gradient-to-r from-red-500 to-red-600' :
                              userDetail?.status === 'pending' ? 'bg-gradient-to-r from-yellow-500 to-yellow-600' :
                                userDetail?.status === 'accepted' ? 'bg-gradient-to-r from-green-500 to-green-600' :
                                  userDetail?.status === 'rejected' ? 'bg-gradient-to-r from-red-500 to-red-600' :
                                    'bg-gradient-to-r from-slate-500 to-slate-600'
                      }`}>
                          {getStatusLabel(userDetail.status)}
                        </span>
                  </div>
                </div>
              </div>
              
              {/* Divider */}
              <div className="h-px bg-gradient-to-r from-transparent via-slate-300 to-transparent my-6" />

              {/* User Details Grid */}
              <div className="p-7 rounded-2xl bg-gradient-to-br from-slate-50 to-white border border-slate-200">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  <div className="flex flex-col gap-2 p-4 rounded-xl bg-gradient-to-br from-slate-100 to-slate-200 border border-slate-300">
                    <span className="text-xs text-slate-500 font-bold uppercase tracking-wider">Họ và tên</span>
                    <span className="text-lg font-black text-slate-900">{userDetail.full_name || '---'}</span>
                  </div>
                  
                  <div className="flex flex-col gap-2 p-4 rounded-xl bg-gradient-to-br from-slate-100 to-slate-200 border border-slate-300">
                    <span className="text-xs text-slate-500 font-bold uppercase tracking-wider">Email</span>
                    <span className="text-lg font-black text-slate-900">{userDetail.email || '---'}</span>
                  </div>
                  
                  <div className="flex flex-col gap-2 p-4 rounded-xl bg-gradient-to-br from-slate-100 to-slate-200 border border-slate-300">
                    <span className="text-xs text-slate-500 font-bold uppercase tracking-wider">Số điện thoại</span>
                    <span className="text-lg font-black text-slate-900">{userDetail.phone || '---'}</span>
                  </div>
                  
                  <div className="flex flex-col gap-2 p-4 rounded-xl bg-gradient-to-br from-slate-100 to-slate-200 border border-slate-300">
                    <span className="text-xs text-slate-500 font-bold uppercase tracking-wider">Địa chỉ</span>
                    <span className="text-lg font-black text-slate-900">{userDetail.address || '---'}</span>
                  </div>
                  
                  <div className="flex flex-col gap-2 p-4 rounded-xl bg-gradient-to-br from-slate-100 to-slate-200 border border-slate-300">
                    <span className="text-xs text-slate-500 font-bold uppercase tracking-wider">Vai trò</span>
                    <span className="text-lg font-black text-slate-900">{getRoleLabel(userDetail.role)}</span>
                  </div>
                  
                  <div className="flex flex-col gap-2 p-4 rounded-xl bg-gradient-to-br from-slate-100 to-slate-200 border border-slate-300">
                    <span className="text-xs text-slate-500 font-bold uppercase tracking-wider">Ngày tạo tài khoản</span>
                    <span className="text-lg font-black text-slate-900">{userDetail.created_at ? new Date(userDetail.created_at).toLocaleDateString('vi-VN') : '---'}</span>
                  </div>
                </div>
              </div>

              {/* CCCD section for user account */}
              {(userDetail?.cccd_id || userDetail?.cccd_front || userDetail?.cccd_back) && (
                <div className="mt-4 p-5 rounded-2xl bg-gradient-to-br from-emerald-50 to-green-50 border border-emerald-200">
                  <div className="flex items-center gap-2 mb-3">
                    <div className="w-4 h-4 rounded-full bg-emerald-500" />
                    <div className="text-emerald-800 font-black text-sm uppercase tracking-wider">CCCD tài khoản</div>
                  </div>
                  {userDetail?.cccd_id && (
                    <div className="text-base text-slate-900 font-bold mb-3">
                      Số CCCD: {userDetail.cccd_id}
                    </div>
                  )}
                  {(userDetail?.cccd_front || userDetail?.cccd_back) && (
                    <div className="flex gap-4 flex-wrap">
                      {userDetail?.cccd_front && (
                        <div className="flex flex-col items-center gap-2">
                          <div className="text-xs text-emerald-700 font-bold uppercase tracking-wider text-center">
                            Ảnh mặt trước
                          </div>
                          {(() => {
                            const rawPath = String(userDetail.cccd_front || '').replace(/\\/g,'/').replace(/^"|"$/g,'');
                            const cleanPath = rawPath.replace(/^\/?(tmp\/)?uploads\//, 'uploads/');
                            const url = photosAPI.getPhotoUrl(cleanPath);
                            const fallbackUrl = `https://sep490-be-xniz.onrender.com/uploads/${cleanPath.replace(/^uploads\//,'')}`;
                            return (
                          <a
                            href={url}
                            target="_blank"
                            rel="noreferrer"
                            className="block w-40 h-28 overflow-hidden rounded-lg border-2 border-emerald-500 bg-white shadow-lg shadow-emerald-500/15 hover:shadow-xl hover:shadow-emerald-500/25 transition-all duration-200"
                          >
                            <img
                              className="w-full h-full object-cover"
                              src={url}
                              alt="CCCD mặt trước"
                              onError={(e) => {
                                const img = e.currentTarget as HTMLImageElement;
                                if (img.src !== fallbackUrl) {
                                  img.src = fallbackUrl;
                                }
                              }}
                            />
                          </a>
                            );
                          })()}
                        </div>
                      )}
                      {userDetail?.cccd_back && (
                        <div className="flex flex-col items-center gap-2">
                          <div className="text-xs text-emerald-700 font-bold uppercase tracking-wider text-center">
                            Ảnh mặt sau
                          </div>
                          {(() => {
                            const rawPath = String(userDetail.cccd_back || '').replace(/\\/g,'/').replace(/^"|"$/g,'');
                            const cleanPath = rawPath.replace(/^\/?(tmp\/)?uploads\//, 'uploads/');
                            const url = photosAPI.getPhotoUrl(cleanPath);
                            const fallbackUrl = `https://sep490-be-xniz.onrender.com/uploads/${cleanPath.replace(/^uploads\//,'')}`;
                            return (
                          <a
                            href={url}
                            target="_blank"
                            rel="noreferrer"
                            className="block w-40 h-28 overflow-hidden rounded-lg border-2 border-emerald-500 bg-white shadow-lg shadow-emerald-500/15 hover:shadow-xl hover:shadow-emerald-500/25 transition-all duration-200"
                          >
                            <img
                              className="w-full h-full object-cover"
                              src={url}
                              alt="CCCD mặt sau"
                              onError={(e) => {
                                const img = e.currentTarget as HTMLImageElement;
                                if (img.src !== fallbackUrl) {
                                  img.src = fallbackUrl;
                                }
                              }}
                            />
                          </a>
                            );
                          })()}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Action Buttons Card */}
            <div className="bg-gradient-to-br from-white via-white to-slate-50 rounded-2xl p-8 shadow-lg border border-white/20 backdrop-blur-sm">
              <div className="flex items-center gap-3 mb-6 p-4 bg-gradient-to-br from-slate-50 to-slate-100 rounded-xl border border-slate-200 shadow-sm">
                <div className="w-10 h-10 bg-gradient-to-br from-amber-500 to-orange-600 rounded-xl flex items-center justify-center shadow-lg shadow-amber-500/25">
                  <CheckCircleIcon className="w-5 h-5 text-white" />
                </div>
                <div>
                  <h2 className="text-xl font-black text-slate-800 tracking-tight">
                    PHÊ DUYỆT
                  </h2>
                  <p className="text-sm text-slate-600 font-medium">
                    Xem xét và quyết định phê duyệt hoặc từ chối yêu cầu
                  </p>
                </div>
              </div>

              <div className="flex gap-4 justify-center items-center flex-wrap">
                <button
                  onClick={approveUser}
                  disabled={busy}
                  title="Phê duyệt"
                  aria-label="Phê duyệt"
                  className={`inline-flex items-center gap-3 px-8 py-4 rounded-2xl text-white border-none cursor-pointer text-base font-bold transition-all duration-200 min-w-[160px] justify-center ${busy
                      ? 'bg-emerald-500/50 cursor-not-allowed shadow-lg shadow-emerald-500/15'
                      : 'bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-600 hover:to-emerald-700 shadow-lg shadow-emerald-500/30 hover:shadow-xl hover:shadow-emerald-500/40 hover:-translate-y-1'
                    }`}
                >
                  <div className="w-6 h-6 rounded-full bg-white/20 flex items-center justify-center">
                    {busy ? (
                      <ArrowPathIcon className="w-4 h-4 animate-spin" />
                    ) : (
                      <CheckCircleIconSolid className="w-4 h-4" />
                    )}
                  </div>
                  {busy ? 'Đang xử lý...' : 'Phê duyệt'}
                </button>
                
                <button
                  onClick={rejectUser}
                  disabled={busy}
                  title="Từ chối"
                  aria-label="Từ chối"
                  className={`inline-flex items-center gap-3 px-8 py-4 rounded-2xl text-white border-none cursor-pointer text-base font-bold transition-all duration-200 min-w-[160px] justify-center ${busy
                      ? 'bg-red-500/50 cursor-not-allowed shadow-lg shadow-red-500/15'
                      : 'bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 shadow-lg shadow-red-500/30 hover:shadow-xl hover:shadow-red-500/40 hover:-translate-y-1'
                    }`}
                >
                  <div className="w-6 h-6 rounded-full bg-white/20 flex items-center justify-center">
                    {busy ? (
                      <ArrowPathIcon className="w-4 h-4 animate-spin" />
                    ) : (
                      <XCircleIconSolid className="w-4 h-4" />
                    )}
                  </div>
                  {busy ? 'Đang xử lý...' : 'Từ chối'}
                </button>
              </div>
            </div>
          </div>
        )}

        <ApprovalSuccessModal
          open={successOpen}
          onClose={() => {
            setSuccessOpen(false);
            if (nextUrlAfterSuccess) {
              const url = nextUrlAfterSuccess;
              setNextUrlAfterSuccess(null);
              try { router.push(url); } catch { }
            }
          }}
          title={successTitle}
          name={successName}
          actionType={successActionType}
          details={successDetails}
        />
      </div>
    </div>
  );
}

// Approval Success Modal Component
function ApprovalSuccessModal({ 
  open, 
  onClose, 
  title, 
  name, 
  actionType, 
  details 
}: { 
  open: boolean; 
  onClose: () => void; 
  title?: string; 
  name?: string; 
  actionType?: string; 
  details?: string; 
}) {
  if (!open) return null;

  const isApproved = actionType === 'approve';
  const isRejected = actionType === 'reject';

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-gradient-to-br from-white via-white to-slate-50 rounded-2xl p-8 max-w-lg w-full shadow-2xl border border-white/20 backdrop-blur-sm relative">
        {/* Close button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-2 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-all duration-200"
        >
          <XCircleIcon className="w-5 h-5" />
        </button>

        {/* Icon */}
        <div className="flex justify-center mb-6">
          <div className={`w-20 h-20 rounded-full flex items-center justify-center shadow-lg ${isApproved
              ? 'bg-gradient-to-br from-emerald-500 to-emerald-600 shadow-emerald-500/25'
              : isRejected
                ? 'bg-gradient-to-br from-red-500 to-red-600 shadow-red-500/25'
                : 'bg-gradient-to-br from-slate-500 to-slate-600 shadow-slate-500/25'
            }`}>
            {isApproved ? (
              <CheckCircleIconSolid className="w-10 h-10 text-white" />
            ) : isRejected ? (
              <XCircleIconSolid className="w-10 h-10 text-white" />
            ) : (
              <CheckCircleIconSolid className="w-10 h-10 text-white" />
            )}
          </div>
        </div>

        {/* Title */}
        <div className="text-center mb-4">
          <h2 className="text-2xl font-black text-slate-800 tracking-tight">
            {title || 'Thành công!'}
          </h2>
        </div>

        {/* Name */}
        {name && (
          <div className="text-center mb-6">
            <div className="text-lg font-semibold text-slate-600 mb-2">
              {isApproved ? 'Đã phê duyệt:' : isRejected ? 'Đã từ chối:' : 'Đối tượng:'}
            </div>
            <div className="text-xl font-bold text-slate-800">
              {name}
            </div>
          </div>
        )}

        {/* Details */}
        {details && (
          <div className={`rounded-xl p-4 mb-6 border ${isApproved
              ? 'bg-gradient-to-br from-emerald-50 to-emerald-100 border-emerald-200'
              : isRejected
                ? 'bg-gradient-to-br from-red-50 to-red-100 border-red-200'
                : 'bg-gradient-to-br from-slate-50 to-slate-100 border-slate-200'
            }`}>
            <div className={`text-sm text-center leading-relaxed ${isApproved ? 'text-emerald-800' : isRejected ? 'text-red-800' : 'text-slate-700'
              }`}>
              {details}
            </div>
          </div>
        )}

        {/* Action buttons */}
        <div className="flex gap-3 justify-center">
          <button
            onClick={onClose}
            className={`px-6 py-3 rounded-xl font-bold text-white shadow-md hover:shadow-lg hover:-translate-y-0.5 transition-all duration-300 ${isApproved
                ? 'bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-600 hover:to-emerald-700'
                : isRejected
                  ? 'bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700'
                  : 'bg-gradient-to-r from-slate-500 to-slate-600 hover:from-slate-600 hover:to-slate-700'
              }`}
          >
            {isApproved ? 'Tiếp tục' : isRejected ? 'Đóng' : 'OK'}
          </button>
        </div>
      </div>
    </div>
  );
}

export const dynamic = 'force-dynamic';