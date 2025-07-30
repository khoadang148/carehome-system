"use client";

import { useState, useEffect, useRef } from 'react';
import { ClipboardDocumentListIcon, PlusIcon, UserIcon } from '@heroicons/react/24/outline';
import { userAPI } from '@/lib/api';
import { formatDateDDMMYYYY } from '@/lib/utils/validation';

interface CareNotesDisplayProps {
  careNotes: any[];
  isStaff?: boolean;
}

export default function CareNotesDisplay({ careNotes, isStaff = false }: CareNotesDisplayProps) {
  const [staffNames, setStaffNames] = useState<{[id: string]: string}>({});
  const requestedIds = useRef<Set<string>>(new Set());

  const formatDate = (dateString: string) => {
    if (!dateString) return '';
    return formatDateDDMMYYYY(dateString);
  };

  const getPriorityColor = () => {
    return { bg: '#f3f4f6', border: '#d1d5db', text: '#374151' };
  };

  // Fetch staff names by conducted_by if needed (fallback for non-populated data)
  useEffect(() => {
    (async () => {
      if (!careNotes) return;
      
      for (const note of careNotes) {
        // Only fetch if conducted_by is a string ID and we don't have the staff name yet
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
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [careNotes]);

  if (!careNotes || careNotes.length === 0) {
    return (
      <div style={{
        padding: '2rem',
        textAlign: 'center',
        color: '#6b7280',
        backgroundColor: '#f9fafb',
        borderRadius: '0.75rem',
        border: '1px solid #e5e7eb'
      }}>
        <ClipboardDocumentListIcon style={{ width: '3rem', height: '3rem', margin: '0 auto 1rem', opacity: 0.5 }} />
        <p style={{ margin: 0, fontSize: '0.875rem' }}>Chưa có ghi chú chăm sóc nào.</p>
      </div>
    );
  }

  return (
    <div style={{ display: 'grid', gap: '1rem' }}>
      {careNotes.map((careNote, idx) => {
        const colors = getPriorityColor();
        const key = careNote.id || careNote._id || idx;
        // Lấy tên nhân viên và position
        let staffName = '---';
        let staffPosition = '';
        
        // Try multiple sources for staff name and position
        if (careNote.staff) {
          staffName = careNote.staff.split(',')[0]?.trim();
        } else if (careNote.conducted_by_name) {
          staffName = careNote.conducted_by_name;
        } else if (careNote.conducted_by && typeof careNote.conducted_by === 'object') {
          // Handle populated conducted_by object from backend
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
          // If we have conducted_by as string ID but no staff name yet, show loading
          staffName = 'Đang tải...';
        }
        
        // Format staff display with position
        const staffDisplay = staffPosition ? `${staffPosition}: ${staffName}` : staffName;
        return (
          <div
            key={key}
            style={{
              background: colors.bg,
              border: `1px solid ${colors.border}`,
              borderRadius: '0.75rem',
              padding: '1.25rem',
              borderLeft: `4px solid ${colors.text}`
            }}
          >
            {/* Nhân viên */}
            <div style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'flex-start',
              marginBottom: '0.75rem'
            }}>
              <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem'
              }}>
                <UserIcon style={{ width: '1rem', height: '1rem', color: colors.text }} />
                <span style={{
                  fontSize: '0.875rem',
                  fontWeight: 600,
                  color: colors.text
                }}>
                  Nhân viên: {staffDisplay}
                </span>
              </div>
              <span style={{
                fontSize: '0.75rem',
                color: '#6b7280'
              }}>
                Ngày: {formatDate(careNote.date)}
              </span>
            </div>

            {/* Assessment type */}
            {careNote.assessment_type && (
              <div style={{
                fontSize: '0.95rem',
                fontWeight: 600,
                color: '#059669',
                marginBottom: '0.25rem'
              }}>
                Loại đánh giá: {careNote.assessment_type}
              </div>
            )}

            {/* Notes content */}
            <div style={{
              fontSize: '0.875rem',
              color: '#374151',
              lineHeight: '1.6',
              marginBottom: '0.5rem'
            }}>
              <span style={{fontWeight: 600}}>Nội dung: </span>{careNote.notes || careNote.note || careNote.content || 'Không có nội dung ghi chú'}
            </div>

            {/* Recommendations */}
            {careNote.recommendations && (
              <div style={{
                fontSize: '0.85rem',
                color: '#3b82f6',
                marginBottom: '0.25rem',
                fontStyle: 'italic'
              }}>
                <span style={{fontWeight: 600}}>Khuyến nghị: </span>{careNote.recommendations}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
} 
