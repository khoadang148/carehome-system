"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/contexts/auth-context";
import { userAPI, residentAPI, carePlanAssignmentsAPI, bedAssignmentsAPI } from "@/lib/api";
import { 
  CheckCircleIcon, 
  XCircleIcon, 
  ArrowPathIcon, 
  MagnifyingGlassIcon, 
  UserIcon, 
  ArrowLeftIcon,
  ClipboardDocumentListIcon,
  UserGroupIcon,
  CalendarDaysIcon,
  CurrencyDollarIcon,
  HomeIcon,
  HeartIcon
} from "@heroicons/react/24/outline";
import SuccessModal from "@/components/SuccessModal";

type TabType = 'users' | 'residents';

export default function ApprovalsPage() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<TabType>('users');
  const [pendingUsers, setPendingUsers] = useState<any[]>([]);
  const [pendingResidents, setPendingResidents] = useState<any[]>([]);
  const [pendingCarePlans, setPendingCarePlans] = useState<any[]>([]);
  const [pendingBedAssignments, setPendingBedAssignments] = useState<any[]>([]);
  const [search, setSearch] = useState("");
  const [busyId, setBusyId] = useState<string | null>(null);
  const [refreshFlag, setRefreshFlag] = useState(0);
  const [successOpen, setSuccessOpen] = useState(false);
  const [successTitle, setSuccessTitle] = useState<string | undefined>(undefined);
  const [successName, setSuccessName] = useState<string | undefined>(undefined);
  const [successActionType, setSuccessActionType] = useState<string | undefined>(undefined);
  const [successDetails, setSuccessDetails] = useState<string | undefined>(undefined);
  const [nextUrlAfterSuccess, setNextUrlAfterSuccess] = useState<string | null>(null);

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
      default:
        return status || '---';
    }
  };

  const getStatusBadgeClass = (status?: string) => {
    switch ((status || '').toLowerCase()) {
      case 'active':
        return 'bg-emerald-50 text-emerald-700 border border-emerald-200';
      case 'inactive':
        return 'bg-slate-50 text-slate-700 border border-slate-200';
      case 'suspended':
        return 'bg-amber-50 text-amber-700 border border-amber-200';
      case 'deleted':
        return 'bg-rose-50 text-rose-700 border border-rose-200';
      case 'pending':
        return 'bg-violet-50 text-violet-700 border border-violet-200';
      default:
        return 'bg-gray-50 text-gray-700 border border-gray-200';
    }
  };

  useEffect(() => {
    if (!loading && (!user || user.role !== "admin")) {
      router.replace("/login");
    }
  }, [user, loading, router]);

  useEffect(() => {
    const load = async () => {
      try {
        // Load pending users
        const users = await userAPI.getByRoleWithStatus("family", "pending");
        setPendingUsers(Array.isArray(users) ? users : []);

        // Load pending residents
        const residents = await residentAPI.getPendingResidents();
        setPendingResidents(Array.isArray(residents) ? residents : []);

        // Load pending care plan assignments
        const carePlans = await carePlanAssignmentsAPI.getPendingAssignments();
        setPendingCarePlans(Array.isArray(carePlans) ? carePlans : []);

        // Load pending bed assignments
        const bedAssignments = await bedAssignmentsAPI.getPendingAssignments();
        setPendingBedAssignments(Array.isArray(bedAssignments) ? bedAssignments : []);
      } catch (error) {
        console.error('Error loading pending data:', error);
      }
    };
    load();
  }, [refreshFlag]);

  const filtered = useMemo(() => {
    const currentData = activeTab === 'users' ? pendingUsers : pendingResidents;
    
    if (!search.trim()) return currentData;
    const q = search.toLowerCase();
    
    return currentData.filter((item) => {
      if (activeTab === 'users') {
        return [item.full_name, item.email, item.phone, item.username]
          .filter(Boolean)
          .some((v: string) => String(v).toLowerCase().includes(q));
      } else {
        return [item.full_name, item.cccd_id]
        .filter(Boolean)
          .some((v: string) => String(v).toLowerCase().includes(q));
      }
    });
  }, [search, activeTab, pendingUsers, pendingResidents]);

  const approve = async (id: string) => {
    try {
      setBusyId(id);
      if (activeTab === 'users') {
      await userAPI.approveUser(id);
        const u = pendingUsers.find((x: any) => x._id === id);
        setSuccessTitle('Phê duyệt tài khoản thành công!');
        setSuccessName(u?.full_name || u?.username || 'Tài khoản');
        setSuccessActionType('approve');
        setSuccessDetails('Tài khoản đã được phê duyệt thành công. Người dùng có thể đăng nhập và sử dụng hệ thống.');
      } else if (activeTab === 'residents') {
        const carePlan = pendingCarePlans.find((cp: any) => cp?.resident_id?._id === id);
        await approveResidentWithCarePlan(id, carePlan?._id);
        return;
      }
      setRefreshFlag((x) => x + 1);
      setSuccessOpen(true);
    } finally {
      setBusyId(null);
    }
  };

  const reject = async (id: string) => {
    try {
      const reason = window.prompt('Nhập lý do từ chối');
      if (reason === null) return; // cancel
      setBusyId(id);
      
      if (activeTab === 'users') {
      await userAPI.deactivateUser(id, reason || undefined);
        const u = pendingUsers.find((x: any) => x._id === id);
        setSuccessTitle('Đã từ chối tài khoản');
        setSuccessName(u?.full_name || u?.username || 'Tài khoản');
        setSuccessActionType('reject');
        setSuccessDetails(reason ? `Lý do từ chối: ${reason}` : 'Tài khoản đã bị từ chối.');
      } else if (activeTab === 'residents') {
        // Reject resident and related pending care plan (if any)
        const carePlan = pendingCarePlans.find((cp: any) => cp?.resident_id?._id === id && (cp?.status === 'pending'));
        if (carePlan?._id) {
          try { await carePlanAssignmentsAPI.rejectAssignment(carePlan._id, reason || undefined); } catch {}
        }

        // Find and reject any pending bed assignments for this resident
        const bedAssignment = pendingBedAssignments.find((ba: any) => 
          (ba?.resident_id?._id === id || ba?.resident_id === id) && (ba?.status === 'pending')
        );
        if (bedAssignment?._id) {
          try { 
            await bedAssignmentsAPI.rejectAssignment(bedAssignment._id, reason || undefined); 
          } catch (error) {
            console.error('Error rejecting bed assignment:', error);
          }
        }

        const r = pendingResidents.find((x: any) => x._id === id);
        await residentAPI.rejectResident(id, reason || undefined);
        
        const hasCarePlan = !!carePlan?._id;
        const hasBedAssignment = !!bedAssignment?._id;
        
        let title = 'Đã từ chối cư dân';
        let details = reason ? `Lý do từ chối: ${reason}` : 'Yêu cầu đã bị từ chối.';
        
        if (hasCarePlan && hasBedAssignment) {
          title = 'Đã từ chối cư dân, gói chăm sóc và phân phòng';
          details = reason ? `Lý do từ chối: ${reason}` : 'Cư dân, gói chăm sóc và phân phòng đã bị từ chối.';
        } else if (hasCarePlan) {
          title = 'Đã từ chối cư dân và gói chăm sóc';
          details = reason ? `Lý do từ chối: ${reason}` : 'Cư dân và gói chăm sóc đã bị từ chối.';
        } else if (hasBedAssignment) {
          title = 'Đã từ chối cư dân và phân phòng';
          details = reason ? `Lý do từ chối: ${reason}` : 'Cư dân và phân phòng đã bị từ chối.';
        }
        
        setSuccessTitle(title);
        setSuccessName(r?.full_name || 'Cư dân');
        setSuccessActionType('reject');
        setSuccessDetails(details);
      }
      
      setRefreshFlag((x) => x + 1);
      setSuccessOpen(true);
    } finally {
      setBusyId(null);
    }
  };

  const approveResidentWithCarePlan = async (residentId: string, carePlanId?: string) => {
    try {
      setBusyId(residentId);
      
      // Approve resident first
      await residentAPI.approveResident(residentId);
      
      // If there's a care plan assignment, approve it too
      if (carePlanId) {
        await carePlanAssignmentsAPI.approveAssignment(carePlanId);
      }

      // Find and approve any pending bed assignments for this resident
      const bedAssignment = pendingBedAssignments.find((ba: any) => 
        ba?.resident_id?._id === residentId || ba?.resident_id === residentId
      );
      if (bedAssignment?._id) {
        try {
          await bedAssignmentsAPI.approveAssignment(bedAssignment._id);
        } catch (error) {
          console.error('Error approving bed assignment:', error);
        }
      }

      const r = pendingResidents.find((x: any) => x._id === residentId);
      const hasCarePlan = !!carePlanId;
      const hasBedAssignment = !!bedAssignment?._id;
      
      let title = 'Phê duyệt cư dân thành công!';
      let details = 'Cư dân đã được phê duyệt thành công.';
      
      if (hasCarePlan && hasBedAssignment) {
        title = 'Phê duyệt cư dân, gói chăm sóc và phân phòng thành công!';
        details = 'Cư dân, gói chăm sóc và phân phòng đã được phê duyệt thành công. Hệ thống sẽ tự động tạo hóa đơn tài chính.';
      } else if (hasCarePlan) {
        title = 'Phê duyệt cư dân và gói chăm sóc thành công!';
        details = 'Cư dân và gói chăm sóc đã được phê duyệt thành công. Hệ thống sẽ tự động tạo hóa đơn tài chính.';
      } else if (hasBedAssignment) {
        title = 'Phê duyệt cư dân và phân phòng thành công!';
        details = 'Cư dân và phân phòng đã được phê duyệt thành công.';
      }
      
      setSuccessTitle(title);
      setSuccessName(r?.full_name || 'Cư dân');
      setSuccessActionType('approve');
      setSuccessDetails(details);
      
      setRefreshFlag((x) => x + 1);
      setSuccessOpen(true);
      setNextUrlAfterSuccess(`/admin/financial-reports/new?residentId=${residentId}`);
    } finally {
      setBusyId(null);
    }
  };

  const goToDetails = (item: any) => {
    if (activeTab === 'users') {
      router.push(`/admin/approvals/${item._id}`);
      return;
    }
    if (activeTab === 'residents') {
      const carePlan = pendingCarePlans.find((cp: any) => cp?.resident_id?._id === item._id);
      const assignmentId = carePlan?._id ? `?assignmentId=${carePlan._id}` : '';
      router.push(`/admin/approvals/${item._id}${assignmentId}`);
      return;
    }
  };

  if (!user || user.role !== "admin") return null;

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-200">
      <div className="max-w-[1300px] mx-auto px-4 py-6">
      
        <div className="bg-gradient-to-br from-white to-slate-50 rounded-xl p-6 mb-6 shadow-md border border-white/30">
          <div className="flex items-center gap-3 mb-4">
            <button
              onClick={() => router.push('/admin')}
              className="group p-3.5 rounded-full bg-gradient-to-r from-slate-100 to-slate-200 hover:from-red-100 hover:to-orange-100 text-slate-700 hover:text-red-700 hover:shadow-lg hover:shadow-red-200/50 hover:-translate-x-0.5 transition-all duration-300"
              title="Quay lại"
            >
              <ArrowLeftIcon className="w-5 h-5 group-hover:scale-110 transition-transform duration-200" />
            </button>
            <div>
              <h1 className="text-3xl font-extrabold m-0 flex items-center gap-2 bg-gradient-to-br from-violet-600 to-violet-700 bg-clip-text text-transparent tracking-tight">
                <ClipboardDocumentListIcon className="w-8 h-8 text-violet-600" />
                Phê duyệt đăng ký
              </h1>
              <p className="text-base text-slate-500 mt-2 font-semibold flex items-center gap-2">
                <ArrowPathIcon className="w-5 h-5 text-slate-400" />
                Duyệt tài khoản, cư dân và gói chăm sóc
              </p>
          </div>
        </div>

          {/* Tabs */}
            <div className="flex gap-2">
              <button
                onClick={() => setActiveTab('users')}
              className={`px-4 py-2 rounded-lg font-semibold transition-all duration-200 flex items-center gap-2 ${
                activeTab === 'users'
                  ? 'bg-violet-600 text-white shadow-lg shadow-violet-200'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              <UserIcon className="w-5 h-5" />
              Tài khoản ({pendingUsers.length})
              </button>
              <button
              onClick={() => setActiveTab('residents')}
              className={`px-4 py-2 rounded-lg font-semibold transition-all duration-200 flex items-center gap-2 ${
                activeTab === 'residents'
                  ? 'bg-violet-600 text-white shadow-lg shadow-violet-200'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              <UserGroupIcon className="w-5 h-5" />
              Cư dân & Gói chăm sóc ({pendingResidents.length})
              </button>
            </div>
        </div>

        <div className="bg-white rounded-xl p-5 shadow border border-slate-200">
          <div className="flex items-center gap-3 mb-4">
            <div className="relative flex-1">
              <MagnifyingGlassIcon className="w-5 h-5 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder={
                  activeTab === 'users' ? "Tìm theo họ tên, email, số điện thoại" :
                  "Tìm theo tên, CCCD"
                }
                className="w-full pl-10 pr-3 py-2 rounded-lg border-2 border-slate-200 focus:border-violet-500 focus:ring-violet-500/10 focus:ring-4 outline-none"
              />
            </div>
          </div>

          {filtered.length === 0 ? (
            <div className="text-center py-16 text-slate-500">
              {activeTab === 'users' && 'Không có tài khoản pending.'}
              {activeTab === 'residents' && 'Không có cư dân pending.'}
            </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="bg-slate-100 text-slate-700">
                    {activeTab === 'users' && (
                      <>
                        <th className="text-left p-3">Người dùng</th>
                        <th className="text-left p-3">Email</th>
                        <th className="text-left p-3">Số điện thoại</th>
                      </>
                    )}
                    {activeTab === 'residents' && (
                      <>
                        <th className="text-left p-3">Cư dân</th>
                        <th className="text-left p-3">CCCD</th>
                        <th className="text-left p-3">Gói chăm sóc</th>
                        <th className="text-left p-3">Ngày đăng ký</th>
                      </>
                    )}
                        <th className="text-center p-3">Thao tác</th>
                      </tr>
                    </thead>
                    <tbody>
                  {filtered.map((item) => (
                    <tr key={item._id} className="border-b border-slate-100">
                      {activeTab === 'users' && (
                        <>
                          <td className="p-3 flex items-center gap-2">
                            <div className="w-9 h-9 rounded-full bg-slate-200 flex items-center justify-center">
                              <UserIcon className="w-5 h-5 text-slate-600" />
                            </div>
                            <div>
                              <div className="font-semibold text-slate-900">{item.full_name || item.username || '---'}</div>
                              <div className={`text-xs inline-flex items-center px-2 py-0.5 rounded-md font-semibold ${getStatusBadgeClass(item.status)}`}>
                                {getStatusLabel(item.status)}
                              </div>
                            </div>
                          </td>
                          <td className="p-3">{item.email || '---'}</td>
                          <td className="p-3">{item.phone || '---'}</td>
                        </>
                      )}
                      
                      {activeTab === 'residents' && (
                        <>
                          <td className="p-3 flex items-center gap-2">
                            <div className="w-9 h-9 rounded-full bg-blue-100 flex items-center justify-center">
                              <UserGroupIcon className="w-5 h-5 text-blue-600" />
                            </div>
                            <div>
                              <div className="font-semibold text-slate-900">{item.full_name || '---'}</div>
                            </div>
                          </td>
                          <td className="p-3">{item.cccd_id || '---'}</td>
                          <td className="p-3">
                            {(() => {
                              const carePlan = pendingCarePlans.find((cp: any) => cp?.resident_id?._id === item._id);
                              const bedAssignment = pendingBedAssignments.find((ba: any) => 
                                ba?.resident_id?._id === item._id || ba?.resident_id === item._id
                              );
                              
                              const hasCarePlan = !!carePlan;
                              const hasBedAssignment = !!bedAssignment;
                              
                              if (hasCarePlan && hasBedAssignment) {
                                return (
                                  <div className="space-y-1">
                                    <div className="inline-flex items-center px-2 py-1 rounded-md bg-green-50 text-green-700 text-xs font-medium">
                                      <HeartIcon className="w-3 h-3 mr-1" />
                                      Đã đăng kí dịch vụ
                                    </div>
                                    <div className="inline-flex items-center px-2 py-1 rounded-md bg-blue-50 text-blue-700 text-xs font-medium">
                                      <HomeIcon className="w-3 h-3 mr-1" />
                                      Đã phân phòng
                                    </div>
                                  </div>
                                );
                              } else if (hasCarePlan) {
                                return (
                                  <div className="inline-flex items-center px-2 py-1 rounded-md bg-green-50 text-green-700 text-xs font-medium">
                                    <HeartIcon className="w-3 h-3 mr-1" />
                                    Đã đăng kí dịch vụ
                                  </div>
                                );
                              } else if (hasBedAssignment) {
                                return (
                                  <div className="inline-flex items-center px-2 py-1 rounded-md bg-blue-50 text-blue-700 text-xs font-medium">
                                    <HomeIcon className="w-3 h-3 mr-1" />
                                    Đã phân phòng
                                  </div>
                                );
                              }
                              
                              return (
                                <div className="inline-flex items-center px-2 py-1 rounded-md bg-slate-50 text-slate-500 text-xs font-medium">
                                  Chưa có gói
                                </div>
                              );
                            })()}
                          </td>
                          <td className="p-3">{item.created_at ? new Date(item.created_at).toLocaleDateString('vi-VN') : '---'}</td>
                        </>
                      )}
                      
                          <td className="p-3 text-center">
                            <div className="inline-flex gap-2">
                              <button
                            onClick={() => goToDetails(item)}
                                title="Chi tiết"
                                aria-label="Chi tiết"
                                className="w-9 h-9 rounded-full bg-slate-600 text-white hover:bg-slate-700 inline-flex items-center justify-center"
                              >
                                <UserIcon className="w-5 h-5" />
                              </button>
                              <button
                            onClick={() => approve(item._id)}
                            disabled={busyId === item._id}
                                title={activeTab === 'residents' ? "Duyệt cư dân và gói chăm sóc" : "Phê duyệt"}
                                aria-label="Phê duyệt"
                                className="w-9 h-9 rounded-full bg-emerald-600 text-white hover:bg-emerald-700 disabled:opacity-50 inline-flex items-center justify-center"
                              >
                                <CheckCircleIcon className="w-5 h-5" />
                              </button>
                              <button
                            onClick={() => reject(item._id)}
                            disabled={busyId === item._id}
                                title={activeTab === 'residents' ? "Từ chối cư dân và gói chăm sóc" : "Từ chối"}
                                aria-label="Từ chối"
                                className="w-9 h-9 rounded-full bg-rose-600 text-white hover:bg-rose-700 disabled:opacity-50 inline-flex items-center justify-center"
                              >
                                <XCircleIcon className="w-5 h-5" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>

        <ApprovalSuccessModal
          open={successOpen}
          onClose={() => {
            setSuccessOpen(false);
            if (nextUrlAfterSuccess) {
              const url = nextUrlAfterSuccess;
              setNextUrlAfterSuccess(null);
              try { router.push(url); } catch {}
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
    <div style={{
      position: 'fixed',
      inset: 0,
      backgroundColor: 'rgba(0, 0, 0, 0.5)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 9999,
      padding: '1rem'
    }}>
      <div style={{
        background: 'linear-gradient(135deg, #ffffff 0%, #f8fafc 100%)',
        borderRadius: '1.5rem',
        padding: '2rem',
        maxWidth: '500px',
        width: '100%',
        boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
        border: '1px solid rgba(255, 255, 255, 0.2)',
        position: 'relative'
      }}>
        {/* Close button */}
        <button
          onClick={onClose}
          style={{
            position: 'absolute',
            top: '1rem',
            right: '1rem',
            background: 'transparent',
            border: 'none',
            cursor: 'pointer',
            padding: '0.5rem',
            borderRadius: '0.5rem',
            color: '#64748b',
            fontSize: '1.5rem',
            lineHeight: 1
          }}
        >
          ×
        </button>

        {/* Icon */}
        <div style={{
          display: 'flex',
          justifyContent: 'center',
          marginBottom: '1.5rem'
        }}>
          <div style={{
            width: '5rem',
            height: '5rem',
            borderRadius: '50%',
            background: isApproved 
              ? 'linear-gradient(135deg, #10b981 0%, #059669 100%)'
              : isRejected
                ? 'linear-gradient(135deg, #ef4444 0%, #dc2626 100%)'
                : 'linear-gradient(135deg, #6b7280 0%, #4b5563 100%)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            boxShadow: isApproved 
              ? '0 10px 25px rgba(16, 185, 129, 0.3)'
              : isRejected
                ? '0 10px 25px rgba(239, 68, 68, 0.3)'
                : '0 10px 25px rgba(107, 114, 128, 0.3)'
          }}>
            {isApproved ? (
              <CheckCircleIcon style={{ width: '2.5rem', height: '2.5rem', color: 'white' }} />
            ) : isRejected ? (
              <XCircleIcon style={{ width: '2.5rem', height: '2.5rem', color: 'white' }} />
            ) : (
              <CheckCircleIcon style={{ width: '2.5rem', height: '2.5rem', color: 'white' }} />
            )}
          </div>
        </div>

        {/* Title */}
        <div style={{
          textAlign: 'center',
          marginBottom: '1rem'
        }}>
          <h2 style={{
            fontSize: '1.5rem',
            fontWeight: 800,
            margin: 0,
            color: '#1e293b',
            letterSpacing: '-0.01em'
          }}>
            {title || 'Thành công!'}
          </h2>
        </div>

        {/* Name */}
        {name && (
          <div style={{
            textAlign: 'center',
            marginBottom: '1.5rem'
          }}>
            <div style={{
              fontSize: '1.125rem',
              fontWeight: 600,
              color: '#64748b',
              marginBottom: '0.5rem'
            }}>
              {isApproved ? 'Đã phê duyệt:' : isRejected ? 'Đã từ chối:' : 'Đối tượng:'}
            </div>
            <div style={{
              fontSize: '1.25rem',
              fontWeight: 700,
              color: '#1e293b'
            }}>
              {name}
            </div>
          </div>
        )}

        {/* Details */}
        {details && (
          <div style={{
            background: isApproved 
              ? 'linear-gradient(135deg, #ecfdf5 0%, #d1fae5 100%)'
              : isRejected
                ? 'linear-gradient(135deg, #fef2f2 0%, #fee2e2 100%)'
                : 'linear-gradient(135deg, #f8fafc 0%, #e2e8f0 100%)',
            border: `1px solid ${isApproved ? '#a7f3d0' : isRejected ? '#fecaca' : '#cbd5e1'}`,
            borderRadius: '0.75rem',
            padding: '1rem',
            marginBottom: '1.5rem'
          }}>
            <div style={{
              fontSize: '0.875rem',
              color: isApproved ? '#065f46' : isRejected ? '#991b1b' : '#475569',
              lineHeight: '1.5',
              textAlign: 'center'
            }}>
              {details}
            </div>
          </div>
        )}

        {/* Action buttons */}
        <div style={{
          display: 'flex',
          gap: '1rem',
          justifyContent: 'center'
        }}>
          <button
            onClick={onClose}
            style={{
              padding: '0.75rem 2rem',
              borderRadius: '0.75rem',
              background: isApproved 
                ? 'linear-gradient(135deg, #10b981 0%, #059669 100%)'
                : isRejected
                  ? 'linear-gradient(135deg, #ef4444 0%, #dc2626 100%)'
                  : 'linear-gradient(135deg, #6b7280 0%, #4b5563 100%)',
              color: 'white',
              border: 'none',
              cursor: 'pointer',
              fontSize: '0.875rem',
              fontWeight: 600,
              boxShadow: isApproved 
                ? '0 4px 12px rgba(16, 185, 129, 0.3)'
                : isRejected
                  ? '0 4px 12px rgba(239, 68, 68, 0.3)'
                  : '0 4px 12px rgba(107, 114, 128, 0.3)',
              transition: 'all 0.2s ease'
            }}
            onMouseOver={(e) => {
              (e.currentTarget as HTMLButtonElement).style.transform = 'translateY(-2px)';
            }}
            onMouseOut={(e) => {
              (e.currentTarget as HTMLButtonElement).style.transform = 'translateY(0)';
            }}
          >
            {isApproved ? 'Tiếp tục' : isRejected ? 'Đóng' : 'OK'}
          </button>
        </div>
      </div>
    </div>
  );
}


