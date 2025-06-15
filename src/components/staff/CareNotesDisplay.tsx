"use client";

import { useState } from 'react';
import { ClipboardDocumentListIcon, PlusIcon, UserIcon } from '@heroicons/react/24/outline';

interface CareNotesDisplayProps {
  careNotes: any[];
  isStaff?: boolean;
}

export default function CareNotesDisplay({ careNotes, isStaff = false }: CareNotesDisplayProps) {
  
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffTime = Math.abs(now.getTime() - date.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffDays === 1) return 'Hôm qua';
    if (diffDays <= 3) return `${diffDays} ngày trước`;
    return date.toLocaleDateString('vi-VN');
  };

  const getPriorityColor = (note: string) => {
    const lowerNote = note.toLowerCase();
    if (lowerNote.includes('cần theo dõi') || lowerNote.includes('khẩn cấp') || lowerNote.includes('nguy hiểm')) {
      return { bg: '#fee2e2', border: '#fca5a5', text: '#dc2626' };
    }
    if (lowerNote.includes('chú ý') || lowerNote.includes('quan trọng')) {
      return { bg: '#fef3c7', border: '#fbbf24', text: '#d97706' };
    }
    return { bg: '#f3f4f6', border: '#d1d5db', text: '#374151' };
  };

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
      {careNotes.map((careNote) => {
        const colors = getPriorityColor(careNote.note);
        
        return (
          <div
            key={careNote.id}
            style={{
              background: colors.bg,
              border: `1px solid ${colors.border}`,
              borderRadius: '0.75rem',
              padding: '1.25rem',
              borderLeft: `4px solid ${colors.text}`
            }}
          >
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
                  {careNote.staff.split(',')[0]?.trim() || 'Nhân viên'}
                </span>
                {careNote.staff.includes(',') && (
                  <span style={{
                    fontSize: '0.75rem',
                    color: '#6b7280',
                    fontStyle: 'italic'
                  }}>
                    ({careNote.staff.split(',')[1]?.trim()})
                  </span>
                )}
              </div>
              <span style={{
                fontSize: '0.75rem',
                color: '#6b7280'
              }}>
                {formatDate(careNote.date)}
              </span>
            </div>

            <div style={{
              fontSize: '0.875rem',
              color: '#374151',
              lineHeight: '1.6',
              marginBottom: '0.5rem'
            }}>
              {careNote.note}
            </div>

            {/* Priority indicator for high priority notes */}
            {(careNote.note.toLowerCase().includes('cần theo dõi') || 
              careNote.note.toLowerCase().includes('khẩn cấp')) && (
              <div style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.25rem',
                padding: '0.25rem 0.5rem',
                backgroundColor: '#dc2626',
                color: 'white',
                borderRadius: '0.5rem',
                fontSize: '0.75rem',
                fontWeight: 500
              }}>
                ⚠️ Cần theo dõi
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
} 
