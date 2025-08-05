'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { useAuth } from '@/lib/contexts/auth-context';
import { careNotesAPI, userAPI } from '@/lib/api';
import { 
  ArrowLeftIcon,
  DocumentTextIcon,
  PlusIcon,
  PencilIcon,
  TrashIcon,
  MagnifyingGlassIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
  CheckCircleIcon
} from '@heroicons/react/24/outline';
import { formatDateDDMMYYYYWithTimezone } from '@/lib/utils/validation';

interface CareNote {
  _id: string;
  assessment_type: string;
  notes: string;
  recommendations: string;
  date: string;
  conducted_by: string | { full_name: string; _id?: string };
  resident_id: string | { _id: string };
}

export default function ResidentNotesPage() {
  const router = useRouter();
  const params = useParams();
  const { user } = useAuth();
  const residentId = params.residentId as string;
  
  const [residentName, setResidentName] = useState<string>('');
  const [careNotes, setCareNotes] = useState<CareNote[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [notesPerPage] = useState(10);
  const [editNote, setEditNote] = useState<CareNote | null>(null);
  const [editContent, setEditContent] = useState('');
  const [isDeleting, setIsDeleting] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState<{ note: CareNote } | null>(null);
  const [notification, setNotification] = useState<{ message: string; type: 'success' | 'error' } | null>(null);
  const [staffNames, setStaffNames] = useState<Record<string, string>>({});

  const showNotification = (message: string, type: 'success' | 'error' = 'success') => {
    setNotification({ message, type });
    setTimeout(() => setNotification(null), 3000);
  };

  useEffect(() => {
    if (!user || user.role !== 'staff') {
      router.push('/');
      return;
    }
    loadResidentNotes();
  }, [user, router, residentId]);

  const loadResidentNotes = async () => {
    try {
      setLoading(true);
      const notes = await careNotesAPI.getAll({ resident_id: residentId });
      const notesArray = Array.isArray(notes) ? notes : [];
      
      // Sắp xếp theo ngày mới nhất
      const sortedNotes = notesArray.sort((a, b) => {
        const dateA = new Date(a.date || 0);
        const dateB = new Date(b.date || 0);
        return dateB.getTime() - dateA.getTime();
      });
      
      setCareNotes(sortedNotes);
      
      // Lấy tên cư dân từ URL params hoặc từ note đầu tiên
      const urlParams = new URLSearchParams(window.location.search);
      const nameFromUrl = urlParams.get('residentName');
      if (nameFromUrl) {
        setResidentName(decodeURIComponent(nameFromUrl));
      }
    } catch (error) {
      console.error('Error loading notes:', error);
      showNotification('Không thể tải danh sách ghi chú', 'error');
    } finally {
      setLoading(false);
    }
  };

  // Lọc và phân trang ghi chú
  const filteredNotes = careNotes.filter(note => {
    if (!searchTerm) return true;
    const searchLower = searchTerm.toLowerCase();
    const content = (note.notes || '').toLowerCase();
    const assessmentType = (note.assessment_type || '').toLowerCase();
    const recommendations = (note.recommendations || '').toLowerCase();
    
    return content.includes(searchLower) || 
           assessmentType.includes(searchLower) || 
           recommendations.includes(searchLower);
  });

  const totalPages = Math.ceil(filteredNotes.length / notesPerPage);
  const startIndex = (currentPage - 1) * notesPerPage;
  const endIndex = startIndex + notesPerPage;
  const currentNotes = filteredNotes.slice(startIndex, endIndex);

  const handleCreateNote = () => {
    router.push(`/staff/assessments/new?residentId=${residentId}&residentName=${encodeURIComponent(residentName)}`);
  };

  const handleEditNote = async (note: CareNote) => {
    if (!editContent || !editContent.trim()) {
      showNotification('Nội dung không được để trống!', 'error');
      return;
    }
    
    try {
      // Chuẩn bị dữ liệu theo đúng format API yêu cầu
      const updateData = {
        assessment_type: note.assessment_type || 'Đánh giá tổng quát',
        notes: editContent,
        recommendations: note.recommendations || '',
        resident_id: typeof note.resident_id === 'object' ? note.resident_id._id : String(note.resident_id),
        conducted_by: typeof note.conducted_by === 'object' ? (note.conducted_by._id || note.conducted_by.full_name) : note.conducted_by,
      };
      
      console.log('Updating note with data:', updateData);
      
      await careNotesAPI.update(note._id, updateData);
      
      await loadResidentNotes();
      setEditNote(null);
      showNotification('Cập nhật ghi chú thành công!', 'success');
    } catch (err) {
      console.error('Error updating note:', err);
      showNotification('Cập nhật ghi chú thất bại!', 'error');
    }
  };

  const handleDeleteNote = async (note: CareNote) => {
    setIsDeleting(true);
    try {
      await careNotesAPI.delete(note._id);
      await loadResidentNotes();
      setConfirmDelete(null);
      showNotification('Đã xóa ghi chú thành công!', 'success');
    } catch (err) {
      showNotification('Xóa ghi chú thất bại!', 'error');
    } finally {
      setIsDeleting(false);
    }
  };

  const getStaffName = (staffId: string | { full_name: string }) => {
    if (typeof staffId === 'object' && staffId.full_name) {
      return staffId.full_name;
    }
    
    if (typeof staffId === 'string') {
      if (staffNames[staffId]) return staffNames[staffId];
      
      // Load staff name if not cached
      userAPI.getById(staffId)
        .then(data => {
          setStaffNames(prev => ({ 
            ...prev, 
            [staffId]: data.full_name || data.username || data.email || staffId 
          }));
        })
        .catch(() => {
          setStaffNames(prev => ({ ...prev, [staffId]: staffId }));
        });
      
      return 'Đang tải...';
    }
    
    return '---';
  };

  if (!user || user.role !== 'staff') {
    return null;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-200 p-4 sm:p-6 lg:p-8">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="bg-gradient-to-br from-white to-slate-50 rounded-3xl p-6 sm:p-8 mb-6 sm:mb-8 shadow-lg border border-white/20 backdrop-blur-sm">
          <div className="flex items-center gap-4 mb-6">
            <button
              onClick={() => router.back()}
              className="w-10 h-10 bg-gradient-to-br from-gray-500 to-gray-600 text-white border-none rounded-xl flex items-center justify-center cursor-pointer transition-all duration-300 hover:shadow-lg hover:scale-105 hover:from-gray-600 hover:to-gray-700 active:scale-95"
            >
              <ArrowLeftIcon className="w-5 h-5" />
            </button>
            
            <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-blue-600 rounded-2xl flex items-center justify-center shadow-lg">
              <DocumentTextIcon className="w-6 h-6 text-white" />
            </div>
            
            <div className="flex-1">
              <h1 className="text-2xl sm:text-3xl font-bold m-0 text-slate-800">
                Ghi chú chăm sóc
              </h1>
              <p className="text-sm sm:text-base text-slate-600 mt-1">
                {residentName ? `Người cao tuổi: ${residentName}` : 'Đang tải thông tin...'}
              </p>
            </div>
          </div>

          {/* Search and Actions */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4">
            <div className="relative flex-1 max-w-md">
              <MagnifyingGlassIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-500" />
              <input
                type="text"
                placeholder="Tìm kiếm trong ghi chú..."
                value={searchTerm}
                onChange={(e) => {
                  setSearchTerm(e.target.value);
                  setCurrentPage(1);
                }}
                className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-xl text-sm outline-none bg-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 shadow-sm hover:shadow-md"
              />
            </div>
            
            <button
              onClick={handleCreateNote}
              className="flex items-center justify-center gap-2 px-6 py-3 bg-gradient-to-r from-blue-500 to-blue-600 text-white border-none rounded-xl text-sm font-semibold cursor-pointer transition-all duration-300 hover:from-blue-600 hover:to-blue-700 hover:shadow-lg hover:scale-105 active:scale-95 shadow-md"
            >
              <PlusIcon className="w-4 h-4" />
              <span className="hidden sm:inline">Thêm ghi chú mới</span>
              <span className="sm:hidden">Thêm mới</span>
            </button>
          </div>
        </div>

        {/* Content */}
        {loading ? (
          <div className="text-center py-16">
            <div className="animate-spin rounded-full h-16 w-16 border-4 border-blue-200 border-t-blue-600 mx-auto mb-4"></div>
            <p className="text-gray-600 text-lg">Đang tải ghi chú...</p>
            <p className="text-gray-400 text-sm mt-2">Vui lòng chờ trong giây lát</p>
          </div>
        ) : (
          <>
            {/* Pagination Info */}
            {filteredNotes.length > 0 && (
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between text-sm text-gray-600 mb-6 bg-white rounded-xl p-4 shadow-sm">
                <span className="mb-2 sm:mb-0">
                  Hiển thị <span className="font-semibold text-blue-600">{startIndex + 1}-{Math.min(endIndex, filteredNotes.length)}</span> trong tổng số <span className="font-semibold text-blue-600">{filteredNotes.length}</span> ghi chú
                </span>
                {totalPages > 1 && (
                  <span className="bg-blue-50 text-blue-700 px-3 py-1 rounded-lg font-medium">
                    Trang {currentPage} / {totalPages}
                  </span>
                )}
              </div>
            )}

            {/* Notes List */}
            {currentNotes.length > 0 ? (
              <div className="space-y-4">
                {currentNotes.map((note, index) => (
                  <div 
                    key={note._id} 
                    className="bg-white rounded-2xl p-6 shadow-md border border-gray-100 hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1 group"
                    style={{ animationDelay: `${index * 100}ms` }}
                  >
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-3">
                          <div className="flex items-center gap-2">
                            <span className="text-sm font-semibold text-blue-600 bg-blue-50 px-3 py-1 rounded-full">
                               {note.date ? formatDateDDMMYYYYWithTimezone(note.date) : '---'}
                            </span>
                            
                          </div>
                        </div>
                        
                        <div className="mb-4 bg-slate-50 rounded-xl p-4">
                          <h3 className="text-sm font-semibold text-gray-700 mb-2 flex items-center gap-2">
                            <span className="w-2 h-2 bg-blue-500 rounded-full"></span>
                            Nội dung:
                          </h3>
                          <p className="text-gray-800 whitespace-pre-line leading-relaxed">{note.notes || 'Không có nội dung'}</p>
                        </div>
                        
                        {note.recommendations && (
                          <div className="mb-4 bg-amber-50 rounded-xl p-4 border-l-4 border-amber-400">
                            <h3 className="text-sm font-semibold text-gray-700 mb-2 flex items-center gap-2">
                              <span className="w-2 h-2 bg-amber-500 rounded-full"></span>
                              Khuyến nghị:
                            </h3>
                            <p className="text-gray-800">{note.recommendations}</p>
                          </div>
                        )}
                        
                        <div className="text-xs text-gray-500 bg-gray-50 px-3 py-2 rounded-lg inline-block">
                          Nhân viên ghi chú: <span className="font-medium">{getStaffName(note.conducted_by)}</span>
                        </div>
                      </div>
                      
                      <div className="flex gap-2 ml-4 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                        <button
                          onClick={() => {
                            setEditNote(note);
                            setEditContent(note.notes || '');
                          }}
                          className="p-2 text-amber-600 hover:bg-amber-50 rounded-lg transition-all duration-200 hover:scale-110"
                          title="Sửa ghi chú"
                        >
                          <PencilIcon className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => setConfirmDelete({ note })}
                          className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-all duration-200 hover:scale-110"
                          title="Xóa ghi chú"
                        >
                          <TrashIcon className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-16 bg-white rounded-2xl shadow-sm">
                <DocumentTextIcon className="w-20 h-20 text-gray-300 mx-auto mb-6" />
                <div className="text-gray-500 text-xl mb-3 font-medium">
                                     {searchTerm ? 'Không tìm thấy ghi chú nào phù hợp' : 'Chưa có ghi chú nào'}
                </div>
                <div className="text-gray-400 text-base mb-6">
                  {searchTerm ? 'Thử tìm kiếm với từ khóa khác' : 'Bắt đầu thêm ghi chú đầu tiên cho cư dân này'}
                </div>
                {!searchTerm && (
                  <button
                    onClick={handleCreateNote}
                    className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-blue-500 to-blue-600 text-white border-none rounded-xl text-sm font-semibold cursor-pointer transition-all duration-300 hover:from-blue-600 hover:to-blue-700 hover:shadow-lg hover:scale-105"
                  >
                    <PlusIcon className="w-4 h-4" />
                    Thêm ghi chú đầu tiên
                  </button>
                )}
              </div>
            )}

            {/* Pagination Controls */}
            {totalPages > 1 && (
              <div className="flex items-center justify-center gap-2 mt-8">
                <button
                  onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                  disabled={currentPage === 1}
                  className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 hover:shadow-md"
                >
                  <ChevronLeftIcon className="w-4 h-4" />
                  Trước
                </button>
                
                <div className="flex gap-1">
                  {Array.from({ length: totalPages }, (_, i) => i + 1).map(page => (
                    <button
                      key={page}
                      onClick={() => setCurrentPage(page)}
                      className={`px-3 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
                        currentPage === page
                          ? 'bg-blue-600 text-white shadow-md'
                          : 'bg-white border border-gray-300 text-gray-700 hover:bg-gray-50 hover:shadow-sm'
                      }`}
                    >
                      {page}
                    </button>
                  ))}
                </div>
                
                <button
                  onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                  disabled={currentPage === totalPages}
                  className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 hover:shadow-md"
                >
                  Sau
                  <ChevronRightIcon className="w-4 h-4" />
                </button>
              </div>
            )}
          </>
        )}

        {/* Edit Modal */}
        {editNote && (
          <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-fadeIn">
            <div className="bg-white rounded-3xl max-w-lg w-full p-8 shadow-2xl relative animate-slideUp">
              <button 
                title="Đóng"
                onClick={() => setEditNote(null)} 
                className="absolute top-4 right-4 w-9 h-9 bg-gray-100 hover:bg-gray-200 rounded-full flex items-center justify-center text-gray-500 hover:text-blue-600 transition-colors duration-200 text-2xl"
                aria-label="Đóng"
              >
                ×
              </button>
              <h3 className="text-blue-700 font-bold text-2xl mt-0 mb-7 flex items-center gap-2">
                <PencilIcon className="w-6 h-6" />
                Sửa ghi chú
              </h3>
              
              <div className="space-y-5">
                <div>
                  <label className="font-semibold block mb-2 text-gray-700">
                    Nội dung <span className="text-red-500">*</span>
                  </label>
                  <textarea
                    value={editContent}
                    onChange={e => setEditContent(e.target.value)}
                    rows={6}
                    className="w-full p-3 border border-gray-300 rounded-xl text-base focus:ring-2 focus:ring-blue-400 focus:border-blue-400 transition-all duration-200 resize-none placeholder-gray-400"
                    placeholder="Nhập nội dung ghi chú..."
                    autoFocus
                  />
                  <div className="text-xs text-gray-400 mt-1 text-right">{editContent.length}/1000</div>
                </div>
                
                <div>
                  <label className="font-semibold block mb-2 text-gray-700">Khuyến nghị:</label>
                  <textarea
                    value={editNote.recommendations || ''}
                    onChange={e => setEditNote({ ...editNote, recommendations: e.target.value })}
                    rows={4}
                    className="w-full p-3 border border-gray-300 rounded-xl text-base focus:ring-2 focus:ring-blue-400 focus:border-blue-400 transition-all duration-200 resize-none placeholder-gray-400"
                    placeholder="Nhập khuyến nghị (nếu có)..."
                  />
                </div>
              </div>
              
              <div className="flex flex-col sm:flex-row justify-end gap-3 mt-8">
                <button
                  onClick={() => setEditNote(null)}
                  className="px-5 py-2.5 bg-gray-100 text-gray-700 border-none rounded-xl text-base font-semibold cursor-pointer hover:bg-gray-200 transition-colors duration-200"
                >
                  Hủy
                </button>
                <button
                  onClick={() => handleEditNote(editNote)}
                  className="px-5 py-2.5 bg-gradient-to-r from-blue-500 to-blue-600 text-white border-none rounded-xl text-base font-semibold cursor-pointer hover:from-blue-600 hover:to-blue-700 transition-all duration-200 shadow-md flex items-center gap-2"
                >
                  <PencilIcon className="w-5 h-5" />
                  Lưu thay đổi
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Confirm Delete Modal */}
        {confirmDelete && (
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-fadeIn">
            <div className="bg-white rounded-2xl min-w-80 max-w-96 p-8 shadow-2xl text-center animate-slideUp">
              <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <TrashIcon className="w-8 h-8 text-red-600" />
              </div>
              <div className="text-red-600 font-bold text-xl mb-3">Xác nhận xóa</div>
              <div className="text-slate-700 text-base mb-6">Bạn có chắc muốn xóa ghi chú này không? Hành động này không thể hoàn tác.</div>
              <div className="flex justify-center gap-4">
                <button
                  onClick={() => setConfirmDelete(null)}
                  className="px-6 py-3 bg-gray-200 text-gray-700 border-none rounded-lg text-sm font-semibold cursor-pointer hover:bg-gray-300 transition-colors duration-200"
                >
                  Hủy bỏ
                </button>
                <button
                  onClick={() => handleDeleteNote(confirmDelete.note)}
                  className="px-6 py-3 bg-gradient-to-r from-red-500 to-red-400 text-white border-none rounded-lg text-sm font-semibold cursor-pointer hover:from-red-600 hover:to-red-500 disabled:opacity-70 disabled:cursor-not-allowed transition-all duration-200 shadow-md"
                  disabled={isDeleting}
                >
                  {isDeleting ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent inline-block mr-2"></div>
                      Đang xóa...
                    </>
                  ) : (
                    ' Xóa ghi chú'
                  )}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Notification */}
        {notification && (
          <div className="fixed inset-0 bg-black/15 backdrop-blur-sm z-[70] flex items-center justify-center p-4 animate-fadeIn">
            <div className={`${
              notification.type === 'success' ? 'bg-green-50 text-green-600 border-green-500' : 'bg-red-50 text-red-600 border-red-500'
            } border-2 rounded-2xl min-w-64 max-w-80 p-6 shadow-2xl text-center text-lg font-semibold relative animate-slideUp`}>
                             <div className={`w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-3 ${
                 notification.type === 'success' ? 'bg-green-100' : 'bg-red-100'
               }`}>
                {notification.type === 'success' ? (
                  <CheckCircleIcon className="w-6 h-6 text-green-600" />
                ) : (
                  <div className="w-6 h-6 text-red-600 text-2xl font-bold">!</div>
                )}
              </div>
              {notification.message}
              <button
                onClick={() => setNotification(null)}
                className="absolute top-3 right-4 w-6 h-6 bg-gray-100 hover:bg-gray-200 rounded-full flex items-center justify-center text-gray-500 hover:text-gray-700 transition-colors duration-200"
              >
                ×
              </button>
            </div>
          </div>
        )}
      </div>

      <style jsx>{`
        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        @keyframes slideUp {
          from { opacity: 0; transform: translateY(20px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .animate-fadeIn {
          animation: fadeIn 0.3s ease-out;
        }
        .animate-slideUp {
          animation: slideUp 0.3s ease-out;
        }
      `}</style>
    </div>
  );
} 