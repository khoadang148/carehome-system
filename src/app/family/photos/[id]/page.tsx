"use client";
import { useEffect, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import { ArrowLeftIcon, PhotoIcon, ChevronLeftIcon, ChevronRightIcon, ArrowDownTrayIcon, XMarkIcon, CalendarIcon, UserIcon, HomeIcon } from "@heroicons/react/24/outline";
import { useAuth } from "@/lib/contexts/auth-context";
import { photosAPI, userAPI } from "@/lib/api";

export default function PhotoDetailPage() {
  const router = useRouter();
  const params = useParams();
  const { user } = useAuth();
  const [photo, setPhoto] = useState<any>(null);
  const [allPhotos, setAllPhotos] = useState<any[]>([]);
  const [currentIndex, setCurrentIndex] = useState<number>(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!user) {
      setLoading(false);
      setError("Không tìm thấy thông tin người dùng. Vui lòng đăng nhập lại.");
      return;
    }

    const loadPhotos = async () => {
      try {
        const accessToken = localStorage.getItem("access_token");
        if (!accessToken) {
          setError("Không tìm thấy access token. Vui lòng đăng nhập lại.");
          return;
        }

        const familyId = user.id;
        const data = await photosAPI.getAll({ family_member_id: familyId });
        
        if (Array.isArray(data)) {
          const mapped = await Promise.all(data.map(async (item: any) => {
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
                  console.log('Error fetching user info:', e);
                }
              }
            }
            
            let imageUrl = item.file_path ? photosAPI.getPhotoUrl(item.file_path) : "";
            return {
              ...item,
              id: item._id,
              url: imageUrl,
              caption: item.caption || "",
              date: item.takenDate
                ? new Date(item.takenDate).toISOString().split("T")[0]
                : (item.created_at ? new Date(item.created_at).toISOString().split("T")[0] : ""),
              uploadedByName: senderName,
              uploadedByPosition: senderPosition,
              residentId: item.resident_id,
            };
          }));
          
          setAllPhotos(mapped);
          
          // Find current photo
          const photoId = params.id as string;
          const photoIndex = mapped.findIndex((p: any) => p.id === photoId);
          
          if (photoIndex !== -1) {
            setPhoto(mapped[photoIndex]);
            setCurrentIndex(photoIndex);
          } else {
            setError("Không tìm thấy ảnh");
          }
        }
        
        setLoading(false);
      } catch (err: any) {
        setError(err.message || "Lỗi không xác định");
        setLoading(false);
      }
    };

    loadPhotos();
  }, [user, params.id]);

  const navigateToPhoto = (direction: 'prev' | 'next') => {
    let newIndex = currentIndex;
    
    if (direction === 'prev' && currentIndex > 0) {
      newIndex = currentIndex - 1;
    } else if (direction === 'next' && currentIndex < allPhotos.length - 1) {
      newIndex = currentIndex + 1;
    }
    
    if (newIndex !== currentIndex) {
      const newPhoto = allPhotos[newIndex];
      setPhoto(newPhoto);
      setCurrentIndex(newIndex);
      router.push(`/family/photos/${newPhoto.id}`);
    }
  };

  const downloadPhoto = async (url: string, name: string) => {
    try {
      const accessToken = localStorage.getItem("access_token");
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
      alert("Không thể tải ảnh. Vui lòng thử lại!");
    }
  };

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      switch (event.key) {
        case 'ArrowLeft':
          event.preventDefault();
          navigateToPhoto('prev');
          break;
        case 'ArrowRight':
          event.preventDefault();
          navigateToPhoto('next');
          break;
        case 'Escape':
          event.preventDefault();
          router.push('/family/photos');
          break;
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [currentIndex, allPhotos]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-red-500 mx-auto mb-4"></div>
          <p className="text-slate-600 text-lg">Đang tải ảnh...</p>
        </div>
      </div>
    );
  }

  if (error || !photo) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 flex items-center justify-center">
        <div className="text-center max-w-md mx-auto p-8">
          <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <PhotoIcon className="w-8 h-8 text-red-500" />
          </div>
          <h2 className="text-xl font-semibold text-slate-800 mb-2">Không tìm thấy ảnh</h2>
          <p className="text-slate-600 mb-6">{error || "Ảnh này không tồn tại hoặc đã bị xóa."}</p>
          <button
            onClick={() => router.push('/family/photos')}
            className="bg-red-500 hover:bg-red-600 text-white px-6 py-3 rounded-xl font-medium transition-colors duration-200 flex items-center gap-2 mx-auto"
          >
            <HomeIcon className="w-5 h-5" />
            Về trang ảnh
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">
      {/* Header */}
      <div className="sticky top-0 z-10 bg-gradient-to-br from-white to-slate-50 border border-slate-200 rounded-3xl p-6 mb-8 w-full max-w-7xl mx-auto shadow-lg backdrop-blur-sm mt-8">
        <div className="flex items-center justify-between gap-10 flex-wrap">
          {/* Left: Icon + Title */}
          <div className="flex items-center gap-8">
            <div className="flex items-center gap-6">
              <div className="w-14 h-14 bg-gradient-to-br from-orange-400 to-red-500 rounded-full flex items-center justify-center shadow-lg">
                <PhotoIcon className="w-8 h-8 text-white" />
              </div>
              <div className="flex flex-col gap-1">
                <span className="text-2xl font-bold bg-gradient-to-r from-red-500 to-orange-400 bg-clip-text text-transparent leading-tight tracking-tight">
                  Chi tiết ảnh
                </span>
                <span className="text-lg text-slate-500 font-medium">
                  Xem ảnh chi tiết và thông tin
                </span>
              </div>
            </div>
          </div>

          {/* Right: Photo counter and navigation */}
          <div className="flex items-center gap-6">
            <div className="bg-gradient-to-r from-red-500 to-orange-400 text-white px-5 py-2.5 rounded-full text-sm font-bold shadow-lg shadow-red-500/25 border border-red-400/20">
              {currentIndex + 1} / {allPhotos.length}
            </div>
            
            <div className="flex items-center gap-3">
              <button
                onClick={() => navigateToPhoto('prev')}
                disabled={currentIndex <= 0}
                className={`group p-3.5 rounded-full transition-all duration-300 ${
                  currentIndex > 0
                    ? 'bg-gradient-to-r from-slate-100 to-slate-200 hover:from-red-100 hover:to-orange-100 text-slate-700 hover:text-red-700 hover:shadow-lg hover:shadow-red-200/50 hover:-translate-x-0.5'
                    : 'bg-slate-50 text-slate-400 cursor-not-allowed'
                }`}
                title="Ảnh trước"
              >
                <ChevronLeftIcon className="w-5 h-5 group-hover:scale-110 transition-transform duration-200" />
              </button>
              
              <button
                onClick={() => navigateToPhoto('next')}
                disabled={currentIndex >= allPhotos.length - 1}
                className={`group p-3.5 rounded-full transition-all duration-300 ${
                  currentIndex < allPhotos.length - 1
                    ? 'bg-gradient-to-r from-slate-100 to-slate-200 hover:from-red-100 hover:to-orange-100 text-slate-700 hover:text-red-700 hover:shadow-lg hover:shadow-red-200/50 hover:translate-x-0.5'
                    : 'bg-slate-50 text-slate-400 cursor-not-allowed'
                }`}
                title="Ảnh tiếp"
              >
                <ChevronRightIcon className="w-5 h-5 group-hover:scale-110 transition-transform duration-200" />
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-6 py-8">
        <div className="grid lg:grid-cols-2 gap-8 items-start">
          {/* Photo Section */}
          <div className="space-y-6">
            {/* Main Photo */}
            <div className="relative group">
              <div className="relative rounded-2xl overflow-hidden bg-white shadow-xl">
                <img
                  src={photo.url}
                  alt={photo.caption}
                  className="w-full h-auto max-h-[70vh] object-contain"
                  onError={(e) => {
                    console.error('Image failed to load:', photo.url);
                    e.currentTarget.style.display = 'none';
                    const placeholder = document.createElement('div');
                    placeholder.innerHTML = `
                      <div class="w-full h-96 bg-gradient-to-br from-gray-100 to-gray-200 rounded-2xl flex items-center justify-center text-gray-500">
                        <div class="text-center">
                          <svg width="64" height="64" fill="none" stroke="currentColor" stroke-width="1.5" viewBox="0 0 24 24" class="mx-auto mb-4 opacity-50">
                            <rect x="3" y="3" width="18" height="18" rx="2" ry="2"/>
                            <circle cx="8.5" cy="8.5" r="1.5"/>
                            <polyline points="21,15 16,10 5,21"/>
                          </svg>
                          <div class="text-lg font-medium">Không thể tải ảnh</div>
                        </div>
                      </div>
                    `;
                    e.currentTarget.parentNode?.appendChild(placeholder.firstElementChild!);
                  }}
                />
                
                {/* Download button overlay */}
                <div className="absolute top-4 right-4 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                  <button
                    onClick={() => downloadPhoto(photo.url, photo.fileName || photo.caption || "photo.jpg")}
                    className="bg-white/90 backdrop-blur-sm text-slate-700 hover:text-red-500 p-3 rounded-xl shadow-lg transition-all duration-200 hover:scale-105"
                    title="Tải ảnh xuống"
                  >
                    <ArrowDownTrayIcon className="w-5 h-5" />
                  </button>
                </div>
              </div>
            </div>

            {/* Photo Actions */}
            <div className="flex items-center justify-center gap-4">
              <button
                onClick={() => navigateToPhoto('prev')}
                disabled={currentIndex <= 0}
                className={`flex items-center gap-2 px-6 py-3 rounded-xl font-medium transition-all duration-200 ${
                  currentIndex > 0
                    ? 'bg-slate-100 hover:bg-slate-200 text-slate-700'
                    : 'bg-slate-50 text-slate-400 cursor-not-allowed'
                }`}
              >
                <ChevronLeftIcon className="w-4 h-4" />
                Ảnh trước
              </button>
              
              <button
                onClick={() => downloadPhoto(photo.url, photo.fileName || photo.caption || "photo.jpg")}
                className="flex items-center gap-2 px-6 py-3 bg-red-500 hover:bg-red-600 text-white rounded-xl font-medium transition-colors duration-200"
              >
                <ArrowDownTrayIcon className="w-4 h-4" />
                Tải ảnh xuống
              </button>
              
              <button
                onClick={() => navigateToPhoto('next')}
                disabled={currentIndex >= allPhotos.length - 1}
                className={`flex items-center gap-2 px-6 py-3 rounded-xl font-medium transition-all duration-200 ${
                  currentIndex < allPhotos.length - 1
                    ? 'bg-slate-100 hover:bg-slate-200 text-slate-700'
                    : 'bg-slate-50 text-slate-400 cursor-not-allowed'
                }`}
              >
                Ảnh tiếp
                <ChevronRightIcon className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Info Section */}
          <div className="space-y-6">
            {/* Photo Title */}
              
            <div className="bg-white rounded-2xl p-6 shadow-lg">
            <h3 className="text-xl font-bold bg-gradient-to-r from-blue-600 to-blue-600 bg-clip-text text-transparent mb-4 flex items-center gap-2">
              Mô tả
              </h3>
              <h1 className="text-2xl font-bold text-slate-800 mb-2 leading-tight">
                {photo.caption || "Ảnh không có chú thích"}
              </h1>
              <p className="text-slate-600">
                Một khoảnh khắc đáng nhớ được chia sẻ từ viện dưỡng lão
              </p>
            </div>

            {/* Photo Details */}
            <div className="bg-white rounded-xl p-5 shadow-md">
              <h3 className="text-xl font-bold bg-gradient-to-r from-blue-600 to-blue-600 bg-clip-text text-transparent mb-4 flex items-center gap-2">
                
                Thông tin ảnh
              </h3>
              <div className="space-y-3">
                <div className="flex items-center gap-3">
                  <CalendarIcon className="w-5 h-5 text-blue-500" />
                  <div>
                    <p className="text-sm text-slate-500">Ngày gửi</p>
                    <p className="font-medium text-slate-800">
                      {photo.date ? new Date(photo.date).toLocaleDateString('vi-VN', {
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric'
                      }) : 'Không rõ'}
                    </p>
                  </div>
                </div>
                
                <div className="flex items-center gap-3">
                  <UserIcon className="w-5 h-5 text-green-500" />
                  <div>
                    <p className="text-sm text-slate-500">Người gửi</p>
                    <p className="font-medium text-slate-800">
                      {photo.uploadedByPosition ? 
                        `${photo.uploadedByPosition} ${photo.uploadedByName || photo.uploadedBy || "Không rõ"}` :
                        (photo.uploadedByName || photo.uploadedBy || "Không rõ")
                      }
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Navigation Tips */}
            <div className="bg-blue-50 border border-blue-200 rounded-2xl p-6">
              <h3 className="text-lg font-semibold text-blue-800 mb-3">Mẹo điều hướng</h3>
              <div className="space-y-2 text-sm text-blue-700">
                <p>• Sử dụng phím mũi tên ← → để chuyển ảnh</p>
                <p>• Nhấn ESC để quay lại trang ảnh</p>
                <p>• Di chuột vào ảnh để hiện nút tải xuống</p>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
} 