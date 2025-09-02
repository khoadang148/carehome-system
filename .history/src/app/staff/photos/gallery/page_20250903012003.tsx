"use client";

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import {
  ArrowLeftIcon,
  MagnifyingGlassIcon,
  FunnelIcon,
  EyeIcon,
  CalendarDaysIcon,
  UserIcon,
  TagIcon,
  PhotoIcon,
  XMarkIcon
} from '@heroicons/react/24/outline';
import { residentAPI, activitiesAPI, photosAPI, staffAPI } from '@/lib/api';
import { carePlansAPI, roomsAPI, bedAssignmentsAPI } from '@/lib/api';
import { useAuth } from '@/lib/contexts/auth-context';
import { getCompletedResidents } from '@/lib/utils/resident-status';

interface PhotoData {
  _id: string;
  resident_id: string | { _id: string, full_name: string, date_of_birth: string, gender: string };
  uploaded_by: string | { _id: string, full_name: string, position: string };
  file_name: string;
  file_path: string;
  file_type: string;
  file_size: number;
  caption: string;
  activity_type: string;
  tags: string[];
  upload_date: string;
  taken_date?: string;
  staff_notes?: string;
  related_activity_id?: string | null;
  family_id?: string;
  created_at?: string;
  updated_at?: string;
}

export default function PhotoGalleryPage() {
  const { user } = useAuth();
  const router = useRouter();

  const [photos, setPhotos] = useState<PhotoData[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterResident, setFilterResident] = useState('');
  const [filterActivityType, setFilterActivityType] = useState('');
  const [filterDateRange, setFilterDateRange] = useState('all');
  const [selectedPhoto, setSelectedPhoto] = useState<PhotoData | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [residents, setResidents] = useState<Array<any>>([]);
  const [activityTypes, setActivityTypes] = useState<string[]>([]);
  const [staffs, setStaffs] = useState<Array<any>>([]);
  const [roomNumbers, setRoomNumbers] = useState<{ [residentId: string]: string }>({});

  // Load photos from API
  useEffect(() => {
    const fetchPhotos = async () => {
      setLoading(true);
      setError(null);
      try {
        const params: any = {};
        if (filterResident) params.resident_id = filterResident;
        if (filterActivityType) params.activity_type = filterActivityType;
        const data = await photosAPI.getAll(params);
        setPhotos(Array.isArray(data) ? data : []);
      } catch (error: any) {
        setPhotos([]);
        setError(error?.message || 'Không thể tải ảnh');
      } finally {
        setLoading(false);
      }
    };
    fetchPhotos();
  }, [filterResident, filterActivityType, filterDateRange]);

  // Load residents from API cho dropdown filter - chỉ lấy những resident đã hoàn tất đăng ký
  useEffect(() => {
    const fetchResidents = async () => {
      try {
        const completedResidents = await getCompletedResidents();
        setResidents(completedResidents);
      } catch (err) {
        setResidents([]);
      }
    };
    fetchResidents();
  }, []);

  // Load activity types from API
  useEffect(() => {
    const fetchActivityTypes = async () => {
      try {
        const data = await activitiesAPI.getAll();
        const uniqueTypes = Array.from(new Set((Array.isArray(data) ? data : []).map((a: any) => a.activityName).filter(Boolean)));
        setActivityTypes(uniqueTypes);
      } catch (err) {
        setActivityTypes([]);
      }
    };
    fetchActivityTypes();
  }, []);

  // Load staff từ API cho mapping uploadedBy
  useEffect(() => {
    const fetchStaffs = async () => {
      try {
        const data = await staffAPI.getAll();
        setStaffs(Array.isArray(data) ? data : []);
      } catch (err) {
        setStaffs([]);
      }
    };
    fetchStaffs();
  }, []);

  // Lấy số phòng cho từng resident xuất hiện trong gallery
  useEffect(() => {
    const fetchRooms = async () => {
      const residentIds = Array.from(new Set(photos.map((p) => {
        if (typeof p.resident_id === 'object' && p.resident_id && '_id' in p.resident_id) {
          return (p.resident_id as any)._id;
        }
        return p.resident_id;
      })));

      for (const residentId of residentIds) {
        if (!residentId || roomNumbers[residentId]) {
          continue;
        }
        try {
          try {
            const bedAssignments = await bedAssignmentsAPI.getByResidentId(residentId);
            const bedAssignment = Array.isArray(bedAssignments) ?
              bedAssignments.find((a: any) => a.bed_id?.room_id) : null;

            if (bedAssignment?.bed_id?.room_id) {
              if (typeof bedAssignment.bed_id.room_id === 'object' && bedAssignment.bed_id.room_id.room_number) {
                setRoomNumbers((prev) => ({ ...prev, [residentId]: bedAssignment.bed_id.room_id.room_number }));
              } else {
                const roomId = bedAssignment.bed_id.room_id._id || bedAssignment.bed_id.room_id;
                if (roomId) {
                  const room = await roomsAPI.getById(roomId);
                  setRoomNumbers((prev) => ({ ...prev, [residentId]: room?.room_number || 'Chưa hoàn tất đăng kí' }));
                }
              }
            } else {
              throw new Error('');
            }
          } catch (bedError) {
            const assignments = await carePlansAPI.getByResidentId(residentId);

            const assignment = Array.isArray(assignments) ? assignments.find((a: any) => a.bed_id?.room_id || a.assigned_room_id) : null;
            const roomId = assignment?.bed_id?.room_id || assignment?.assigned_room_id;
            const roomIdString = typeof roomId === 'object' && roomId?._id ? roomId._id : roomId;

            if (roomIdString) {
              const room = await roomsAPI.getById(roomIdString);
              setRoomNumbers((prev) => ({ ...prev, [residentId]: room?.room_number || 'Chưa hoàn tất đăng kí' }));
            } else {
              setRoomNumbers((prev) => ({ ...prev, [residentId]: 'Chưa hoàn tất đăng kí' }));
            }
          }
        } catch (error) {
          setRoomNumbers((prev) => ({ ...prev, [residentId]: 'Chưa hoàn tất đăng kí' }));
        }
      }
    };
    if (photos.length > 0) fetchRooms();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [photos]);

  useEffect(() => {
    const hasModalOpen = showModal;
    if (hasModalOpen) {
      document.body.classList.add('hide-header');
      document.body.style.overflow = 'hidden';
    } else {
      document.body.classList.remove('hide-header');
      document.body.style.overflow = 'unset';
    }
    return () => {
      document.body.classList.remove('hide-header');
      document.body.style.overflow = 'unset';
    };
  }, [showModal]);

  // Check access permissions
  useEffect(() => {
    if (!user) {
      router.push('/login');
      return;
    }

    if (!['admin', 'staff', 'family'].includes(String(user.role))) {
      router.push('/');
      return;
    }
  }, [user, router]);

  const filteredPhotos = photos.filter(photo => {
    const matchesSearch =
      (photo.caption && photo.caption.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (getResidentNameByResidentId(photo.resident_id).toLowerCase().includes(searchTerm.toLowerCase())) ||
      (Array.isArray(photo.tags) && photo.tags.some(tag => tag && tag.toLowerCase().includes(searchTerm.toLowerCase())));

    const photoResidentId = typeof photo.resident_id === 'object' && photo.resident_id && '_id' in photo.resident_id
      ? (photo.resident_id as any)._id
      : photo.resident_id;
    const matchesResident = filterResident === '' || photoResidentId === filterResident;
    const matchesActivityType = filterActivityType === '' || photo.activity_type === filterActivityType;

    let matchesDate = true;
    if (filterDateRange !== 'all') {
      const photoDate = new Date(photo.upload_date);
      const now = new Date();
      const daysDiff = Math.floor((now.getTime() - photoDate.getTime()) / (1000 * 60 * 60 * 24));
      switch (filterDateRange) {
        case 'today':
          matchesDate = daysDiff === 0;
          break;
        case 'week':
          matchesDate = daysDiff <= 7;
          break;
        case 'month':
          matchesDate = daysDiff <= 30;
          break;
        case '3months':
          matchesDate = daysDiff <= 90;
          break;
      }
    }
    if (user && String(user.role) === 'family') {
      return matchesSearch && matchesResident && matchesActivityType && matchesDate && (user as any)?.family_id && photo.family_id === (user as any).family_id;
    }
    return matchesSearch && matchesResident && matchesActivityType && matchesDate;
  });

  const sortedPhotos = filteredPhotos.sort((a, b) => new Date(b.upload_date).getTime() - new Date(a.upload_date).getTime());

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('vi-VN', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const handlePhotoClick = (photo: PhotoData) => {
    setSelectedPhoto(photo);
    setShowModal(true);

    // No viewCount in new API, just open modal
  };

  const closeModal = () => {
    setShowModal(false);
    setSelectedPhoto(null);
  };

  const getPhotoUrl = (photo: any) => {
    if (!photo || !photo.file_path) return '/window.svg';
    if (photo.file_path.startsWith('http')) return photo.file_path;
    
    // Thêm version từ photo data để tránh cache
    const version = photo.updated_at || photo.created_at || Date.now();
    return `${photosAPI.getPhotoUrl(photo.file_path)}?v=${version}`;
  };

  const getResidentNameByResidentId = (residentId: string | { _id: string, full_name: string, date_of_birth: string, gender: string } | null) => {
    if (!residentId) return 'Không rõ';
    
    if (typeof residentId === 'object') {
      if (residentId.full_name) return residentId.full_name;
      if (residentId._id) {
        const resident = residents.find((r: any) => r._id === residentId._id);
        return resident ? resident.full_name : 'Không rõ';
      }
      return 'Không rõ';
    }
    const resident = residents.find((r: any) => r._id === residentId);
    return resident ? resident.full_name : 'Không rõ';
  };

  const getStaffNameById = (staffId: string | { _id: string, full_name: string, position: string } | null) => {
    if (!staffId) return 'Không rõ';
    
    if (typeof staffId === 'object' && staffId?.full_name) return staffId.full_name;
    const staff = staffs.find((s: any) => s._id === (typeof staffId === 'object' ? staffId._id : staffId));
    return staff ? staff.full_name : 'Không rõ';
  };

  return (
    <div className="min-h-screen bg-[linear-gradient(135deg,rgb(251,251,248)_0%,rgb(249,247,243)_100%)] py-8 px-4">
      <div className="max-w-[1400px] mx-auto">
        <div className="bg-gradient-to-br from-white to-slate-50 rounded-3xl shadow-2xl border border-white/20 overflow-hidden mb-8">
          <div className="bg-gradient-to-br from-indigo-500 to-purple-600 p-8 text-white">
            <div className="flex items-center gap-4 mb-4">
              <button
                onClick={() => router.push('/staff/photos')}
                className="p-3 bg-white/20 hover:bg-white/30 rounded-xl transition text-white flex items-center justify-center"
              >
                <ArrowLeftIcon className="w-5 h-5" />
              </button>
              <div>
                <div className="flex items-center gap-3">
                  <PhotoIcon className="w-10 h-10 text-white" />
                  <div>
                    <h1 className="text-[1.8rem] font-bold m-0">
                      Thư viện ảnh
                    </h1>
                    <p className="text-sm mt-2 opacity-90 m-0">
                      Xem lại những khoảnh khắc đáng nhớ của các cụ
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="p-8">
            <div className="grid [grid-template-columns:repeat(auto-fit,minmax(250px,1fr))] gap-4 mb-4">
              <div className="relative">
                <MagnifyingGlassIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 z-[1]" />
                <input
                  type="text"
                  placeholder="Tìm kiếm theo mô tả, tên cụ, tags..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-11 pr-3 py-3 rounded-xl border-2 border-gray-200 text-[0.95rem] outline-none bg-white"
                />
              </div>

              <select
                value={filterResident}
                onChange={(e) => setFilterResident(e.target.value)}
                className="w-full p-3 rounded-xl border-2 border-gray-200 text-[0.95rem] outline-none bg-white"
              >
                <option value="">Tất cả người cao tuổi</option>
                {residents.map((resident: any) => (
                  <option key={resident._id} value={resident._id}>
                    {resident.full_name} - Phòng {resident.roomNumber}
                  </option>
                ))}
              </select>

            </div>

            <div className="flex items-center justify-between text-gray-500 text-sm">
              <span>Hiển thị {sortedPhotos.length} / {photos.length} ảnh</span>
              {user?.role !== 'family' && (
                <button
                  onClick={() => router.push('/staff/photos')}
                  className="px-4 py-2 bg-gradient-to-br from-green-500 to-green-600 text-white rounded-md text-sm font-semibold"
                >
                  + Đăng ảnh mới
                </button>
              )}
            </div>
          </div>
        </div>

        {loading && (
          <div className="text-center text-slate-500 my-8">Đang tải ảnh...</div>
        )}
        {error && (
          <div className="text-center text-red-500 my-8">{error}</div>
        )}
        {sortedPhotos.length === 0 ? (
          <div className="bg-white rounded-xl p-12 text-center shadow">
            <PhotoIcon className="w-16 h-16 mx-auto mb-4 text-gray-300" />
            <h3 className="text-xl font-semibold text-gray-700 mb-2 m-0">
              Chưa có ảnh nào
            </h3>
            <p className="text-gray-500 m-0">
              {photos.length === 0
                ? 'Chưa có ảnh nào được đăng tải.'
                : 'Không tìm thấy ảnh nào phù hợp với bộ lọc hiện tại.'
              }
            </p>
          </div>
        ) : (
          <div className="grid [grid-template-columns:repeat(auto-fill,minmax(300px,1fr))] gap-6">
            {sortedPhotos.map((photo) => (
              <div
                key={photo._id}
                onClick={() => handlePhotoClick(photo)}
                className="bg-white rounded-xl overflow-hidden shadow border border-gray-200 cursor-pointer transition transform hover:-translate-y-1 hover:shadow-xl"
              >
                <img 
                  src={getPhotoUrl(photo)} 
                  alt={photo.caption} 
                  key={`${photo._id}-${photo.updated_at || photo.created_at}`}
                  className="h-[200px] w-full object-cover block" 
                  onError={(e) => { (e.currentTarget as HTMLImageElement).src = '/window.svg'; }} 
                />

                <div className="p-4">
                  <div className="grid [grid-template-columns:max-content_1fr] gap-x-4 gap-y-1 items-center mb-3 border-b border-slate-100 pb-2">
                    <span className="font-semibold text-gray-500 text-[0.92rem] text-left">Tên:</span>
                    <span className="font-medium text-gray-900 text-base">
                      {getResidentNameByResidentId(photo.resident_id)}
                    </span>
                    <span className="font-semibold text-gray-500 text-[0.92rem] text-left">Phòng:</span>
                    <span className="font-medium text-gray-900 text-base">{roomNumbers[(typeof photo.resident_id === 'object' && photo.resident_id && '_id' in photo.resident_id) ? (photo.resident_id as any)._id : photo.resident_id] || 'Chưa hoàn tất đăng kí'}</span>
                    <span className="font-semibold text-gray-500 text-[0.92rem] text-left">Hoạt động:</span>
                    <span className="font-medium text-gray-900 text-base">{photo.activity_type}</span>
                    <span className="font-semibold text-gray-500 text-[0.92rem] text-left">Đăng bởi:</span>
                    <span className="font-medium text-gray-900 text-base">{getStaffNameById(photo.uploaded_by)}</span>
                  </div>

                  <div className="my-2 border-b border-slate-100 pb-2">
                    <span className="font-semibold text-gray-500 text-[0.92rem]">Mô tả:</span>
                    <span className="ml-2 text-slate-700 text-[0.98rem]">{photo.caption}</span>
                  </div>

                  {Array.isArray(photo.tags) && photo.tags.length > 0 && (
                    <div className="flex items-center gap-2 my-2 flex-wrap border-b border-slate-100 pb-2">
                      <TagIcon className="w-4 h-4 text-green-500" />
                      <span className="font-semibold text-gray-500 text-[0.92rem]">Tags:</span>
                      {photo.tags.slice(0, 3).map((tag, index) => (
                        <span key={tag + '-' + index} className="bg-green-100 text-green-600 px-2 py-[2px] rounded text-[0.85rem] font-medium">
                          {tag}
                        </span>
                      ))}
                      {photo.tags.length > 3 && (
                        <span className="text-gray-500 text-[0.85rem]">
                          +{photo.tags.length - 3}
                        </span>
                      )}
                    </div>
                  )}

                  <div className="flex items-center justify-between text-[0.88rem] text-slate-400 mt-2 gap-4">
                    <div className="flex items-center gap-1.5">
                      <CalendarDaysIcon className="w-4 h-4" />
                      <span className="font-semibold">Ngày đăng:</span>
                      <span className="text-slate-500">{formatDate(photo.upload_date)}</span>
                    </div>

                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {showModal && selectedPhoto && (
          <div className="fixed inset-0 bg-black/85 z-[1000] flex items-center justify-center p-8 backdrop-blur-sm ml-[120px]">
            <div className="bg-gradient-to-br from-white to-slate-50 rounded-2xl max-w-[900px] w-full max-h-[95vh] overflow-hidden relative shadow-2xl border border-white/20">
              <button
                onClick={closeModal}
                className="absolute top-6 right-6 bg-slate-900/80 text-white rounded-full w-12 h-12 flex items-center justify-center z-[1001] transition shadow"
              >
                <XMarkIcon className="w-6 h-6" />
              </button>

              <div className="relative">
                <img
                  src={getPhotoUrl(selectedPhoto)}
                  alt={selectedPhoto.caption}
                  key={`${selectedPhoto._id}-${selectedPhoto.updated_at || selectedPhoto.created_at}`}
                  className="w-full h-[400px] object-cover block"
                  onError={e => { (e.currentTarget as HTMLImageElement).src = '/window.svg'; }}
                />
                <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/70 to-transparent text-white px-8 pt-8 pb-6">
                  <h2 className="text-xl font-bold mb-2 m-0">
                    {getResidentNameByResidentId(selectedPhoto.resident_id)}
                  </h2>
                  <p className="text-base m-0 opacity-90">
                    {selectedPhoto.caption}
                  </p>
                </div>
              </div>

              <div className="p-8 max-h-[calc(95vh-400px)] overflow-y-auto">
                <div className="bg-gradient-to-br from-slate-100 to-slate-200 rounded-xl p-6 mb-6 border border-slate-200">
                  <h3 className="text-xl font-bold text-slate-800 mb-4 flex items-center gap-2">
                    <div className="w-1 h-6 bg-gradient-to-br from-blue-500 to-blue-700 rounded" />
                    Thông tin chi tiết
                  </h3>
                  <div className="grid [grid-template-columns:repeat(auto-fit,minmax(250px,1fr))] gap-4">
                    <div className="bg-white p-4 rounded-lg border border-slate-200">
                      <div className="text-[0.75rem] font-semibold text-slate-500 uppercase tracking-wider mb-1">Tên người cao tuổi</div>
                      <div className="text-base font-semibold text-slate-800">{getResidentNameByResidentId(selectedPhoto.resident_id)}</div>
                    </div>

                    <div className="bg-white p-4 rounded-lg border border-slate-200">
                      <div className="text-[0.75rem] font-semibold text-slate-500 uppercase tracking-wider mb-1">Số phòng</div>
                      <div className="text-base font-semibold text-slate-800">Phòng {roomNumbers[(typeof selectedPhoto.resident_id === 'object' && selectedPhoto.resident_id && '_id' in selectedPhoto.resident_id) ? (selectedPhoto.resident_id as any)._id : selectedPhoto.resident_id] || 'Chưa hoàn tất đăng kí'}</div>
                    </div>

                    <div className="bg-white p-4 rounded-lg border border-slate-200">
                      <div className="text-[0.75rem] font-semibold text-slate-500 uppercase tracking-wider mb-1">Loại hoạt động</div>
                      <div className="text-base font-semibold text-slate-800">{selectedPhoto.activity_type}</div>
                    </div>

                    <div className="bg-white p-4 rounded-lg border border-slate-200">
                      <div className="text-[0.75rem] font-semibold text-slate-500 uppercase tracking-wider mb-1">Đăng bởi</div>
                      <div className="text-base font-semibold text-slate-800">{getStaffNameById(selectedPhoto.uploaded_by)}</div>
                    </div>

                  </div>
                </div>

                <div className="bg-gradient-to-br from-amber-50 to-amber-200 rounded-xl p-6 mb-6 border border-amber-200">
                  <h3 className="text-xl font-bold text-orange-600 mb-4 flex items-center gap-2">
                    <div className="w-1 h-6 bg-gradient-to-br from-orange-600 to-orange-800 rounded" />
                    Mô tả chi tiết
                  </h3>
                  <div className="bg-white p-4 rounded-lg border border-amber-200">
                    <div className="text-[0.75rem] font-semibold text-orange-700 uppercase tracking-wider mb-2">Nội dung mô tả</div>
                    <div className="text-base leading-relaxed text-slate-800">{selectedPhoto.caption}</div>
                  </div>
                </div>

                {Array.isArray(selectedPhoto.tags) && selectedPhoto.tags.length > 0 && (
                  <div className="bg-gradient-to-br from-green-50 to-green-200 rounded-xl p-6 mb-6 border border-green-200">
                    <h3 className="text-xl font-bold text-green-700 mb-4 flex items-center gap-2">
                      <div className="w-1 h-6 bg-gradient-to-br from-green-500 to-green-700 rounded" />
                      Thẻ tags
                    </h3>
                    <div className="bg-white p-4 rounded-lg border border-green-200">
                      <div className="text-[0.75rem] font-semibold text-green-700 uppercase tracking-wider mb-3">Các thẻ đính kèm</div>
                      <div className="flex flex-wrap gap-2">
                        {selectedPhoto.tags.map((tag, index) => (
                          <span
                            key={tag + '-' + index}
                            className="bg-gradient-to-br from-green-500 to-green-600 text-white px-4 py-2 rounded-full text-sm font-semibold shadow-sm border border-white/20"
                          >
                            #{tag}
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>
                )}

                {selectedPhoto.staff_notes && String(user?.role) !== 'family' && (
                  <div className="bg-gradient-to-br from-yellow-50 to-yellow-200 rounded-xl p-6 border border-yellow-200">
                    <h3 className="text-xl font-bold text-yellow-700 mb-4 flex items-center gap-2">
                      <div className="w-1 h-6 bg-gradient-to-br from-yellow-500 to-yellow-700 rounded" />
                      Ghi chú nhân viên
                    </h3>
                    <div className="bg-white p-4 rounded-lg border border-yellow-200">
                      <div className="text-[0.75rem] font-semibold text-yellow-700 uppercase tracking-wider mb-2">Ghi chú nội bộ</div>
                      <div className="text-base italic leading-relaxed text-slate-800">{selectedPhoto.staff_notes}</div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}