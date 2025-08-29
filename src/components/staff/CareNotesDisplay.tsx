"use client";

import { useState, useEffect, useRef } from 'react';
import { ClipboardDocumentListIcon, PlusIcon, UserIcon, MagnifyingGlassIcon, ChevronLeftIcon, ChevronRightIcon } from '@heroicons/react/24/outline';
import { userAPI } from '@/lib/api';
import { formatDateDDMMYYYY } from '@/lib/utils/validation';

interface CareNotesDisplayProps {
  careNotes: any[];
  isStaff?: boolean;
}

export default function CareNotesDisplay({ careNotes, isStaff = false }: CareNotesDisplayProps) {
  const [staffNames, setStaffNames] = useState<{[key: string]: string}>({});
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [notesPerPage] = useState(5);
  const requestedIds = useRef<Set<string>>(new Set());

  const formatDate = (dateString: string) => {
    if (!dateString) return '';
    return formatDateDDMMYYYY(dateString);
  };

  const getPriorityColor = () => {
    return { bg: 'bg-gray-50', border: 'border-gray-200', text: 'text-gray-700' };
  };

  useEffect(() => {
    (async () => {
      if (!careNotes) return;
      
      for (const note of careNotes) {
        if (note.conducted_by && 
            typeof note.conducted_by === 'string' && 
            !staffNames[note.conducted_by] && 
            !requestedIds.current.has(note.conducted_by)) {
          requestedIds.current.add(note.conducted_by);
          try {
            console.log('Fetching staff name for ID:', note.conducted_by);
            const user = await userAPI.getById(note.conducted_by);
            console.log('Staff data received:', user);
            const staffName = user.full_name || user.username || user.email || '---';
            const staffPosition = user.position || '';
            const staffDisplay = staffPosition ? `${staffPosition}: ${staffName}` : staffName;
            setStaffNames(prev => ({ ...prev, [note.conducted_by]: staffDisplay }));
          } catch (error: any) {
            console.error('Error fetching staff name for ID:', note.conducted_by, error);
            setStaffNames(prev => ({ ...prev, [note.conducted_by]: '---' }));
          }
        }
      }
    })();

  }, [careNotes]);

  const filteredCareNotes = careNotes.filter(note => {
    if (!searchTerm) return true;
    const searchLower = searchTerm.toLowerCase();
    const content = (note.notes || note.note || note.content || '').toLowerCase();
    const assessmentType = (note.assessment_type || '').toLowerCase();
    const recommendations = (note.recommendations || '').toLowerCase();
    
    return content.includes(searchLower) || 
           assessmentType.includes(searchLower) || 
           recommendations.includes(searchLower);
  });

  const sortedCareNotes = [...filteredCareNotes].sort((a, b) => {
    const dateA = new Date(a.date || 0);
    const dateB = new Date(b.date || 0);
    return dateB.getTime() - dateA.getTime();
  });

  const totalPages = Math.ceil(sortedCareNotes.length / notesPerPage);
  const startIndex = (currentPage - 1) * notesPerPage;
  const endIndex = startIndex + notesPerPage;
  const currentCareNotes = sortedCareNotes.slice(startIndex, endIndex);

  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm]);

  if (!careNotes || careNotes.length === 0) {
    return (
      <div className="p-8 text-center text-gray-500 bg-gray-50 rounded-xl border border-gray-200">
        <ClipboardDocumentListIcon className="w-12 h-12 mx-auto mb-4 opacity-50" />
        <p className="m-0 text-sm">Chưa có ghi chú chăm sóc nào.</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
        <div className="flex-1 max-w-md">
          <div className="relative">
            <input
              type="text"
              placeholder="Tìm kiếm ghi chú..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
            <MagnifyingGlassIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
          </div>
        </div>
        <div className="text-sm text-gray-600">
          Hiển thị {currentCareNotes.length} / {sortedCareNotes.length} ghi chú
        </div>
      </div>

      <div className="space-y-4">
        {currentCareNotes.map((careNote, idx) => {
          const colors = getPriorityColor();
          const key = careNote.id || careNote._id || idx;
          let staffName = '---';
          let staffPosition = '';
          
          if (careNote.staff) {
            staffName = careNote.staff.split(',')[0]?.trim();
          } else if (careNote.conducted_by_name) {
            staffName = careNote.conducted_by_name;
          } else if (careNote.conducted_by && typeof careNote.conducted_by === 'object') {
            staffName = careNote.conducted_by.full_name || '---';
            staffPosition = careNote.conducted_by.position || '';
          } else if (careNote.conducted_by && staffNames[careNote.conducted_by]) {
            staffName = staffNames[careNote.conducted_by];
          } else if (careNote.conducted_by_full_name) {
            staffName = careNote.conducted_by_full_name;
          } else if (careNote.staff_name) {
            staffName = careNote.staff_name;
          } else if (careNote.full_name) {
            staffName = careNote.full_name;
          } else if (careNote.conducted_by && typeof careNote.conducted_by === 'string') {
            staffName = 'Đang tải...';
          }
          
          const staffDisplay = staffPosition;
          
          return (
            <div
              key={key}
              className="bg-gray-50 border border-gray-200 rounded-xl p-5 border-l-4 border-l-gray-400 hover:shadow-md transition-shadow duration-200"
            >
              <div className="flex justify-between items-start mb-3">
                <div className="flex items-center gap-2">
                  <UserIcon className="w-4 h-4 text-gray-600" />
                  <span className="text-sm font-semibold text-gray-700">
                    Nhân viên: {staffDisplay}
                  </span>
                </div>
                <span className="text-xs text-gray-500">
                  Ngày: {formatDate(careNote.date)}
                </span>
              </div>

              {careNote.assessment_type && (
                <div className="text-sm font-semibold text-green-600 mb-2">
                  Loại đánh giá: {careNote.assessment_type}
                </div>
              )}

              <div className="text-sm text-gray-700 leading-relaxed mb-2">
                <span className="font-semibold">Nội dung: </span>
                {careNote.notes || careNote.note || careNote.content || 'Không có nội dung ghi chú'}
              </div>

              {careNote.recommendations && (
                <div className="text-xs text-blue-600 italic">
                  <span className="font-semibold">Khuyến nghị: </span>
                  {careNote.recommendations}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {totalPages > 1 && (
        <div className="flex items-center justify-between pt-4 border-t border-gray-200">
          <div className="text-sm text-gray-600">
            Trang {currentPage} / {totalPages}
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
              disabled={currentPage === 1}
              className="px-3 py-1 text-sm border border-gray-300 rounded-md disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50 transition-colors"
            >
              <ChevronLeftIcon className="w-4 h-4" />
            </button>
            <button
              onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
              disabled={currentPage === totalPages}
              className="px-3 py-1 text-sm border border-gray-300 rounded-md disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50 transition-colors"
            >
              <ChevronRightIcon className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {filteredCareNotes.length === 0 && careNotes.length > 0 && (
        <div className="p-6 text-center text-gray-500 bg-gray-50 rounded-xl border border-gray-200">
          <ClipboardDocumentListIcon className="w-8 h-8 mx-auto mb-2 opacity-50" />
          <p className="text-sm">Không tìm thấy ghi chú nào phù hợp với từ khóa tìm kiếm.</p>
        </div>
      )}
    </div>
  );
} 
