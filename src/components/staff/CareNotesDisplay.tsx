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

  // Fetch staff names by conducted_by if needed
  useEffect(() => {
    (async () => {
      if (!careNotes) return;
      for (const note of careNotes) {
        if (note.conducted_by && !note.staff && !staffNames[note.conducted_by] && !requestedIds.current.has(note.conducted_by)) {
          requestedIds.current.add(note.conducted_by);
          try {
            const user = await userAPI.getById(note.conducted_by);
            setStaffNames(prev => ({ ...prev, [note.conducted_by]: user.full_name || user.username || user.email || '---' }));
          } catch {
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
        // Lấy tên nhân viên
        let staffName = '---';
        if (careNote.staff) {
          staffName = careNote.staff.split(',')[0]?.trim();
        } else if (careNote.conducted_by_name) {
          staffName = careNote.conducted_by_name;
        } else if (careNote.conducted_by && staffNames[careNote.conducted_by]) {
          staffName = staffNames[careNote.conducted_by];
        } else if (careNote.conducted_by_full_name) {
          staffName = careNote.conducted_by_full_name;
        } else if (careNote.full_name) {
          staffName = careNote.full_name;
        }
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
                  Nhân viên: {staffName}
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
