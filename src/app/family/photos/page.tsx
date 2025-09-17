"use client";
import { useEffect, useMemo, useState } from "react"
import { toast } from 'react-toastify'
import { getUserFriendlyError } from '@/lib/utils/error-translations';
import { useRouter } from "next/navigation";
import { ArrowLeftIcon, PhotoIcon, ChevronLeftIcon, ChevronRightIcon, ArrowDownTrayIcon, XMarkIcon, EyeIcon, UsersIcon } from "@heroicons/react/24/outline";
import { useAuth } from "@/lib/contexts/auth-context";
import { staffAPI } from "@/lib/api";
import { residentAPI } from "@/lib/api";
import { userAPI, photosAPI, activitiesAPI, activityParticipationsAPI } from "@/lib/api";
import { clientStorage } from "@/lib/utils/clientStorage";

export default function FamilyPhotosPage() {
  const router = useRouter();
  const { user } = useAuth();
  const [allPhotos, setAllPhotos] = useState<any[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [staffList, setStaffList] = useState<any[]>([]);
  const [residents, setResidents] = useState<any[]>([]);
  const [selectedResidentId, setSelectedResidentId] = useState<string>('all');

  useEffect(() => {
    staffAPI.getAll().then(data => {
      setStaffList(Array.isArray(data) ? data : []);
    }).catch(() => setStaffList([]));
  }, []);

  useEffect(() => {
    if (!user) {
      router.replace('/login');
      return;
    }

    if (user.role !== 'family') {
      if (user.role === 'staff') router.replace('/staff');
      else if (user.role === 'admin') router.replace('/admin');
      else router.replace('/login');
      return;
    }
    const accessToken = clientStorage.getItem("access_token");
    if (!accessToken) {
      setLoading(false);
      setError("Không tìm thấy access token. Vui lòng đăng nhập lại.");
      return;
    }
    setLoading(true);
    setError(null);

    photosAPI.getAll({ family_member_id: user.id })
      .then(async (allPhotosData) => {

        const mapped = await Promise.all(allPhotosData.map(async item => {
          let senderName = item.uploadedByName;
          let senderPosition = '';

          if (item.uploaded_by) {
            if (typeof item.uploaded_by === 'object' && item.uploaded_by.full_name) {
              senderName = item.uploaded_by.full_name;
              senderPosition = item.uploaded_by.position || '';
            } else if (typeof item.uploaded_by === 'string' && item.uploaded_by.length === 24) {
              try {
                const userInfo = await userAPI.getById(item.uploaded_by);
                if (userInfo && userInfo.full_name) {
                  senderName = userInfo.full_name;
                  senderPosition = userInfo.position || '';
                }
                            } catch (e) { 
              }
            }
          }

          if (!senderName && item.uploadedBy) {
            const staff = staffList.find(s => String(s._id) === String(item.uploadedBy));
            senderName = staff ? (staff.fullName || staff.name || staff.username || staff.email) : undefined;
            senderPosition = staff ? (staff.position || '') : '';
          }

          const mediaUrl = item.file_path ? photosAPI.getPhotoUrl(item.file_path) : "";
          // Detect media type
          const isVideo = typeof item.file_type === 'string' && item.file_type.startsWith('video');

          // Resolve related activity and participation (if any)
          let activityName: string | undefined;
          let activityId: string | undefined;
          let participationStatus: string | undefined;
          
          // Handle activityId - it might be an object (populated) or string
          const rawActivityId = item.related_activity_id || item.activity_id;
          if (rawActivityId) {
            if (typeof rawActivityId === 'object' && rawActivityId._id) {
              activityId = rawActivityId._id;
              // If it's already populated, we can get the name directly
              activityName = rawActivityId.activity_name || rawActivityId.name;
            } else if (typeof rawActivityId === 'string') {
              activityId = rawActivityId;
            }
          }
          
          try {
            const residentId = typeof item.resident_id === 'object' ? item.resident_id?._id : item.resident_id;
            if (activityId && residentId && !activityName) {
              try {
                const [act, part] = await Promise.all([
                  activitiesAPI.getById(activityId).catch(() => null),
                  activityParticipationsAPI.getByResidentAndActivity(residentId, activityId).catch(() => null)
                ]);
                activityName = act?.activity_name || act?.name || undefined;
                participationStatus = part?.attendance_status || undefined;
              } catch {}
            }
          } catch {}

          const result = {
            ...item,
            id: item._id,
            url: mediaUrl,
            caption: item.caption || "",
            date: item.takenDate
              ? new Date(item.takenDate).toISOString().split("T")[0]
              : (item.created_at ? new Date(item.created_at).toISOString().split("T")[0] : ""),
            uploadedByName: senderName,
            uploadedByPosition: senderPosition,
            residentId: typeof item.resident_id === 'object' ? item.resident_id._id : item.resident_id,
            isVideo,
            activityId,
            activityName,
            participationStatus,
          };
          return result;
        }));

        setAllPhotos(mapped);
        setLoading(false);
      })
      .catch(err => {
        setError("Không thể tải danh sách ảnh. Có thể bạn không có quyền xem hoặc chưa có ảnh nào được chia sẻ.");
        setLoading(false);
      });
  }, [user, staffList]);

  useEffect(() => {
    if (user?.id) {
      residentAPI.getByFamilyMemberId(user.id)
        .then((data) => {
          const arr = Array.isArray(data) ? data : [data];
          setResidents(arr && arr.filter(r => r && r._id));
        })
        .catch(() => setResidents([]));
    } else {
      setResidents([]);
    }
  }, [user]);

  const filteredPhotos = useMemo(() =>
    allPhotos.filter((photo: any) => {
      const matchSearch =
        photo.caption.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (photo.uploadedBy && photo.uploadedBy.toLowerCase().includes(searchTerm.toLowerCase())) ||
        photo.date.includes(searchTerm);
      const matchResident =
        selectedResidentId === 'all' ||
        String(photo.residentId) === String(selectedResidentId);
      return matchSearch && matchResident;
    }),
    [allPhotos, searchTerm, selectedResidentId]
  );

  const groupedPhotos = useMemo(
    () =>
      filteredPhotos.reduce((groups: Record<string, any[]>, photo: any) => {
        const date = photo.date;
        if (!groups[date]) groups[date] = [];
        groups[date].push(photo);
        return groups;
      }, {} as Record<string, any[]>),
    [filteredPhotos]
  );

  const sortedDates = useMemo(
    () => Object.keys(groupedPhotos).sort((a, b) => new Date(b).getTime() - new Date(a).getTime()),
    [groupedPhotos]
  );

  const openLightbox = (photoId: any) => {
    const idx = filteredPhotos.findIndex((p: any) => p.id === photoId);
    setLightboxIndex(idx);
  };

  const closeLightbox = () => setLightboxIndex(null);
  const prevLightbox = () => setLightboxIndex(i => (i !== null && i > 0 ? i - 1 : i));
  const nextLightbox = () => setLightboxIndex(i => (i !== null && i < filteredPhotos.length - 1 ? i + 1 : i));

  const downloadPhoto = async (url: string, name: string) => {
    try {
      const accessToken = clientStorage.getItem("access_token");
      const response = await fetch(url, {
        headers: accessToken ? { "Authorization": `Bearer ${accessToken}` } : {},
      });
      const blob = await response.blob();
      const a = document.createElement("a");
      a.href = window.URL.createObjectURL(blob);
      a.download = name || "photo.jpg";
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(a.href);
    } catch (err) {
      toast.error("Không thể tải ảnh. Vui lòng thử lại!");
    }
  };



  if (loading) return <div className="text-center mt-12 text-slate-500 text-xl">Đang tải ảnh...</div>;
  if (error) return <div className="text-center mt-12 text-red-500 text-xl">Lỗi: {error}</div>;

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 p-0 font-sans">
      <div className="sticky top-0 z-10 bg-gradient-to-br from-white to-slate-50 border border-slate-200 rounded-3xl p-6 mb-8 w-full max-w-7xl mx-auto shadow-lg backdrop-blur-sm mt-8">
        <div className="flex items-center justify-between gap-10 flex-wrap">
          <div className="flex items-center gap-8">
            <div className="flex items-center gap-6">
              <button
                onClick={() => router.push('/')}
                className="group p-3.5 rounded-full bg-gradient-to-r from-slate-100 to-slate-200 hover:from-red-100 hover:to-orange-100 text-slate-700 hover:text-red-700 hover:shadow-lg hover:shadow-red-200/50 hover:-translate-x-0.5 transition-all duration-300"
                title="Quay lại"
              >
                <ArrowLeftIcon className="w-5 h-5 group-hover:scale-110 transition-transform duration-200" />
              </button>
              <div className="w-14 h-14 bg-gradient-to-br from-orange-400 to-red-500 rounded-full flex items-center justify-center shadow-lg">
                <PhotoIcon className="w-8 h-8 text-white" />
              </div>
              <div className="flex flex-col gap-1">
                <span className="text-2xl font-bold bg-gradient-to-r from-red-500 to-orange-400 bg-clip-text text-transparent leading-tight tracking-tight">
                  Nhật ký hình ảnh
                </span>
                <span className="text-lg text-slate-500 font-medium">
                  Khoảnh khắc đáng nhớ của người thân tại viện
                </span>
              </div>
            </div>
          </div>

          <div className="flex items-center flex-1 justify-end min-w-80">
            <div className="relative min-w-80 max-w-lg w-full">
              <span className="absolute left-6 top-1/2 transform -translate-y-1/2 text-slate-300 text-2xl pointer-events-none z-10">
                <svg width="22" height="22" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24"><circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" /></svg>
              </span>
              <input
                type="text"
                placeholder="Tìm kiếm ảnh, chú thích, người gửi..."
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
                className="w-full py-4 px-12 rounded-3xl border-2 border-slate-200 text-lg bg-slate-50 text-slate-700 shadow-sm outline-none font-medium tracking-wide transition-all duration-200 focus:border-red-500 focus:shadow-lg focus:shadow-red-100"
              />
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-10 pb-2 flex items-start justify-start mb-4">
        <div className="bg-gradient-to-br from-green-50 to-emerald-50 border-2 border-emerald-200 rounded-2xl shadow-sm p-3 flex items-center gap-3 min-w-0 max-w-none w-auto m-0 flex-nowrap">
          <UsersIcon className="w-6 h-6 text-emerald-500 flex-shrink-0" />
          <label htmlFor="resident-filter" className="font-bold text-gray-800 text-lg tracking-tight mr-1 whitespace-nowrap">
            Lọc theo người thân:
          </label>
          <select
            id="resident-filter"
            value={selectedResidentId}
            onChange={e => setSelectedResidentId(e.target.value)}
            className="py-2 px-4 rounded-xl border-2 border-emerald-200 text-base bg-white text-gray-800 font-semibold min-w-32 shadow-sm outline-none transition-all duration-200 cursor-pointer focus:border-emerald-500 focus:shadow-lg focus:shadow-emerald-100"
          >
            <option value="all">Tất cả người thân</option>
            {residents.map((r: any) => {
              const value = r._id || r.id;
              const label = r.name || r.full_name || value || 'Không rõ tên';
              return <option key={value} value={value}>{label}</option>;
            })}
          </select>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-10 pb-12">
        {sortedDates.length === 0 ? (
          <div className="relative overflow-hidden">
            {/* Background decorative elements */}
            <div className="absolute -top-20 -right-20 w-40 h-40 bg-gradient-to-br from-orange-200/30 to-red-300/20 rounded-full blur-3xl"></div>
            <div className="absolute -bottom-20 -left-20 w-32 h-32 bg-gradient-to-br from-emerald-200/30 to-emerald-300/20 rounded-full blur-3xl"></div>
            <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-64 h-64 bg-gradient-to-br from-blue-100/20 to-purple-100/20 rounded-full blur-3xl"></div>
            
            <div className="relative bg-gradient-to-br from-white via-slate-50/50 to-white rounded-3xl p-16 shadow-2xl border border-white/30 backdrop-blur-xl text-center">
              <div className="max-w-3xl mx-auto">
                {/* Main icon with enhanced styling */}
                <div className="relative mb-12">
                  <div className="w-32 h-32 bg-gradient-to-br from-orange-400 via-red-500 to-red-600 rounded-full flex items-center justify-center shadow-2xl mx-auto mb-6 transform hover:scale-105 transition-all duration-300">
                    <PhotoIcon className="w-16 h-16 text-white drop-shadow-lg" />
                  </div>
                  {/* Floating decorative elements */}
                  <div className="absolute -top-2 -right-2 w-6 h-6 bg-gradient-to-br from-emerald-400 to-emerald-500 rounded-full animate-pulse"></div>
                  <div className="absolute -bottom-2 -left-2 w-4 h-4 bg-gradient-to-br from-blue-400 to-blue-500 rounded-full animate-pulse delay-1000"></div>
                </div>
                
                {/* Enhanced heading */}
                <div className="mb-8">
                  <h2 className="text-4xl font-bold bg-gradient-to-r from-slate-800 via-slate-700 to-slate-800 bg-clip-text text-transparent mb-4 leading-tight">
                    Chưa có ảnh nào được chia sẻ
                  </h2>
                  <div className="w-24 h-1 bg-gradient-to-r from-orange-400 to-red-500 rounded-full mx-auto mb-6"></div>
                  <p className="text-xl text-slate-600 leading-relaxed max-w-2xl mx-auto">
                    Hiện tại chưa có ảnh nào được chia sẻ cho người thân của bạn. Nhân viên chăm sóc sẽ cập nhật ảnh thường xuyên.
                  </p>
                </div>
                
                {/* Enhanced features section */}
                <div className="bg-gradient-to-br from-orange-50 via-orange-50/80 to-red-100/50 rounded-3xl p-8 border border-orange-200/50 mb-10 shadow-lg backdrop-blur-sm">
                  <div className="flex items-center justify-center gap-4 mb-6">
                    <div className="w-12 h-12 bg-gradient-to-br from-orange-500 to-red-600 rounded-2xl flex items-center justify-center shadow-lg">
                      <PhotoIcon className="w-7 h-7 text-white" />
                    </div>
                    <h3 className="text-2xl font-bold text-orange-800">
                      Khi có ảnh, bạn sẽ thấy:
                    </h3>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-orange-700">
                    <div className="flex items-center gap-3 p-3 bg-white/60 rounded-xl border border-orange-200/50 hover:bg-white/80 transition-all duration-200">
                      <div className="w-3 h-3 bg-gradient-to-br from-orange-500 to-red-600 rounded-full shadow-sm"></div>
                      <span className="font-semibold">Ảnh hoạt động hàng ngày</span>
                    </div>
                    <div className="flex items-center gap-3 p-3 bg-white/60 rounded-xl border border-orange-200/50 hover:bg-white/80 transition-all duration-200">
                      <div className="w-3 h-3 bg-gradient-to-br from-orange-500 to-red-600 rounded-full shadow-sm"></div>
                      <span className="font-semibold">Khoảnh khắc đáng nhớ</span>
                    </div>
                    <div className="flex items-center gap-3 p-3 bg-white/60 rounded-xl border border-orange-200/50 hover:bg-white/80 transition-all duration-200">
                      <div className="w-3 h-3 bg-gradient-to-br from-orange-500 to-red-600 rounded-full shadow-sm"></div>
                      <span className="font-semibold">Tải ảnh về máy</span>
                    </div>
                    <div className="flex items-center gap-3 p-3 bg-white/60 rounded-xl border border-orange-200/50 hover:bg-white/80 transition-all duration-200">
                      <div className="w-3 h-3 bg-gradient-to-br from-orange-500 to-red-600 rounded-full shadow-sm"></div>
                      <span className="font-semibold">Xem chi tiết từng ảnh</span>
                    </div>
                  </div>
                </div>
                
                {/* Enhanced footer text */}
                <div className="flex items-center justify-center gap-2 text-slate-500">
                  <div className="w-2 h-2 bg-gradient-to-br from-orange-400 to-red-500 rounded-full"></div>
                  <p className="text-base font-medium">
                    Ảnh sẽ được cập nhật thường xuyên bởi nhân viên chăm sóc
                  </p>
                  <div className="w-2 h-2 bg-gradient-to-br from-orange-400 to-red-500 rounded-full"></div>
                </div>
              </div>
            </div>
          </div>
        ) : (
          sortedDates.map(date => (
            <div key={date} className="mb-10">
              <div className="font-bold text-lg text-slate-500 mb-5 tracking-wide shadow-sm">{new Date(date).toLocaleDateString("vi-VN")}</div>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                {groupedPhotos[date].map((photo, idx) => (
                  <div
                    key={photo.id || idx}
                    className="relative rounded-2xl overflow-hidden bg-slate-50 shadow-lg group"
                  >
                    {photo.isVideo ? (
                      <video
                        src={photo.url}
                        controls
                        onClick={() => router.push(`/family/photos/${photo.id}`)}
                        className="w-full h-56 object-cover bg-black rounded-2xl cursor-pointer"
                      />
                    ) : (
                      <img
                        src={photo.url}
                        alt={photo.caption}
                        onClick={() => router.push(`/family/photos/${photo.id}`)}
                        className="w-full h-56 object-cover block bg-gray-100 rounded-2xl cursor-pointer transition-transform duration-200 group-hover:scale-105"
                        onError={(e) => {
                          e.currentTarget.style.display = 'none';
                          const placeholder = document.createElement('div');
                          placeholder.innerHTML = `
                            <div class="w-full h-56 bg-gradient-to-br from-gray-100 to-gray-200 rounded-2xl flex items-center justify-center text-gray-500 text-sm font-medium">
                              <div class="text-center">
                                <svg width="48" height="48" fill="none" stroke="currentColor" stroke-width="1.5" viewBox="0 0 24 24" class="mb-2 opacity-50">
                                  <rect x="3" y="3" width="18" height="18" rx="2" ry="2"/>
                                  <circle cx="8.5" cy="8.5" r="1.5"/>
                                  <polyline points="21,15 16,10 5,21"/>
                                </svg>
                                <div>Không thể tải ảnh</div>
                              </div>
                            </div>
                          `;
                          e.currentTarget.parentNode?.appendChild(placeholder.firstElementChild!);
                        }}
                      />
                    )}

                    {(photo.activityName || photo.participationStatus) && (
                      <div className="absolute left-3 bottom-3 bg-white/85 backdrop-blur-sm rounded-lg px-3 py-1 text-xs font-semibold text-slate-700 shadow">
                        {photo.activityName && <span>{photo.activityName}</span>}
                        {photo.participationStatus && (
                          <span className={`ml-2 px-2 py-0.5 rounded-full capitalize ${photo.participationStatus === 'attended' ? 'bg-emerald-100 text-emerald-700' : photo.participationStatus === 'absent' ? 'bg-rose-100 text-rose-700' : 'bg-amber-100 text-amber-700'}`}>
                            {photo.participationStatus}
                          </span>
                        )}
                      </div>
                    )}

                    <button
                      onClick={() => downloadPhoto(photo.url, photo.fileName || photo.caption || "photo.jpg")}
                      className="absolute top-3 right-3 bg-gradient-to-br from-white to-slate-50 border-2 border-red-500 rounded-lg text-red-500 p-2 cursor-pointer text-base font-medium shadow-lg backdrop-blur-sm transition-all duration-300 hover:bg-gradient-to-br hover:from-red-500 hover:to-red-600 hover:text-white hover:-translate-y-1 hover:scale-105 hover:shadow-xl"
                      title="Tải ảnh xuống"
                    >
                      <ArrowDownTrayIcon className="w-4 h-4" />
                    </button>

                    <button
                      onClick={() => router.push(`/family/photos/${photo.id}`)}
                      title="Xem chi tiết ảnh"
                      className="absolute top-14 right-3 bg-gradient-to-br from-white to-slate-50 border-2 border-blue-500 rounded-lg text-blue-500 p-2 cursor-pointer text-base font-medium shadow-lg backdrop-blur-sm transition-all duration-300 hover:bg-gradient-to-br hover:from-blue-500 hover:to-blue-600 hover:text-white hover:-translate-y-1 hover:scale-105 hover:shadow-xl"
                    >
                      <EyeIcon className="w-4 h-4" />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          ))
        )}
      </div>

      {lightboxIndex !== null && filteredPhotos[lightboxIndex] && (
        <div className="fixed inset-0 bg-slate-900/90 z-50 flex items-center justify-center animate-fadeIn" onClick={closeLightbox}>
          <button
            onClick={closeLightbox}
            title="Đóng"
            className="absolute top-24 right-16 bg-white/25 text-white border border-white/20 rounded-full text-lg cursor-pointer z-10 p-4 font-light backdrop-blur-sm shadow-lg transition-all duration-300 flex items-center justify-center hover:-translate-y-1 hover:shadow-xl hover:bg-white/35"
          >
            <XMarkIcon className="w-4 h-4" />
          </button>

          <button
            onClick={e => { e.stopPropagation(); prevLightbox(); }}
            className="absolute left-10 top-1/2 transform -translate-y-1/2 bg-white/15 text-white border-none rounded-2xl text-4xl cursor-pointer z-10 px-6 font-bold shadow-lg"
          >
            <ChevronLeftIcon className="w-9 h-9" />
          </button>

          {filteredPhotos[lightboxIndex].isVideo ? (
            <video
              src={filteredPhotos[lightboxIndex].url}
              controls
              className="max-w-[84vw] max-h-[84vh] rounded-3xl shadow-2xl bg-black object-contain"
              onClick={e => e.stopPropagation()}
            />
          ) : (
            <img
              src={filteredPhotos[lightboxIndex].url}
              alt={filteredPhotos[lightboxIndex].caption}
              className="max-w-[84vw] max-h-[84vh] rounded-3xl shadow-2xl bg-white object-contain"
              onClick={e => e.stopPropagation()}
            />
          )}

          <button
            onClick={e => { e.stopPropagation(); nextLightbox(); }}
            className="absolute right-10 top-1/2 transform -translate-y-1/2 bg-white/15 text-white border-none rounded-2xl text-4xl cursor-pointer z-10 px-6 font-bold shadow-lg"
          >
            <ChevronRightIcon className="w-9 h-9" />
          </button>

          <div className="absolute bottom-14 left-0 right-0 text-center flex justify-center pointer-events-none">
            <div className="bg-slate-900/70 rounded-2xl p-6 inline-block text-white min-w-64 font-bold text-shadow-lg text-lg">
              <div className="text-xl font-bold mb-3">{filteredPhotos[lightboxIndex].caption}</div>
              <div className="text-base font-medium opacity-90 mb-2">
                Người gửi: {filteredPhotos[lightboxIndex].uploadedByPosition && filteredPhotos[lightboxIndex].uploadedByName
                  ? `${filteredPhotos[lightboxIndex].uploadedByPosition} ${filteredPhotos[lightboxIndex].uploadedByName}`
                  : (filteredPhotos[lightboxIndex].uploadedByName || filteredPhotos[lightboxIndex].uploadedBy || "Không rõ")}
              </div>
              <div className="text-base font-medium opacity-90">
                Ngày gửi: {filteredPhotos[lightboxIndex].date && new Date(filteredPhotos[lightboxIndex].date).toLocaleDateString("vi-VN")}
              </div>
              {(filteredPhotos[lightboxIndex].activityName || filteredPhotos[lightboxIndex].participationStatus) && (
                <div className="mt-2 text-base font-medium opacity-90">
                  {filteredPhotos[lightboxIndex].activityName && (
                    <span>Hoạt động: {filteredPhotos[lightboxIndex].activityName}</span>
                  )}
                  {filteredPhotos[lightboxIndex].participationStatus && (
                    <span className="ml-3 capitalize">Trạng thái: {filteredPhotos[lightboxIndex].participationStatus}</span>
                  )}
                </div>
              )}
              <button
                onClick={e => { e.stopPropagation(); downloadPhoto(filteredPhotos[lightboxIndex].url, filteredPhotos[lightboxIndex].fileName || filteredPhotos[lightboxIndex].caption || (filteredPhotos[lightboxIndex].isVideo ? "video.mp4" : "photo.jpg")); }}
                className="mt-5 bg-gradient-to-r from-red-500 to-orange-400 text-white border-none rounded-2xl py-3 px-8 font-bold text-lg cursor-pointer shadow-lg transition-all duration-200 hover:from-red-500 hover:to-orange-500"
                title="Tải media này"
              >
                <ArrowDownTrayIcon className="w-4 h-4 mr-3 inline align-middle" /> Tải về
              </button>
            </div>
          </div>
        </div>
      )}


    </div>
  );
} 