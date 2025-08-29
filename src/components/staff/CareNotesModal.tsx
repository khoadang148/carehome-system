"use client";

import React, { useState } from 'react';
import { XMarkIcon, HeartIcon } from '@heroicons/react/24/outline';
import { clientStorage } from '@/lib/utils/clientStorage';

interface CareNotesModalProps {
  residentId: number;
  residentName: string;
  onClose: () => void;
  onComplete: () => void;
}

export default function CareNotesModal({ residentId, residentName, onClose, onComplete }: CareNotesModalProps) {
  const [noteContent, setNoteContent] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = () => {
    if (!noteContent.trim()) return;
    
    setIsSubmitting(true);
    
    try {
      const savedResidents = clientStorage.getItem('nurseryHomeResidents');
      if (savedResidents) {
        const residents = JSON.parse(savedResidents);
        const residentIndex = residents.findIndex((r: any) => r.id === residentId);
        
        if (residentIndex !== -1) {
          if (!residents[residentIndex].careNotes) {
            residents[residentIndex].careNotes = [];
          }
          
          const newNote = {
            id: Date.now(),
            content: noteContent,
            date: new Date().toISOString(),
            staffName: 'Nhân viên chăm sóc',
            priority: 'Bình thường',
            category: 'Chăm sóc tổng quát'
          };
          
          residents[residentIndex].careNotes.unshift(newNote);
          clientStorage.setItem('nurseryHomeResidents', JSON.stringify(residents));
        }
      }
      
      onComplete();
    } catch (error) {
      console.error('Error saving care note:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      backgroundColor: 'rgba(0, 0, 0, 0.7)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 1000,
      padding: '1rem'
    }}>
      <div style={{
        backgroundColor: 'white',
        borderRadius: '1rem',
        width: '100%',
        maxWidth: '600px',
        maxHeight: '90vh',
        overflow: 'auto',
        boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)'
      }}>
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '1.5rem',
          borderBottom: '1px solid #e5e7eb'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <div style={{
              width: '2.5rem',
              height: '2.5rem',
              background: 'linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)',
              borderRadius: '0.75rem',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}>
              <HeartIcon style={{ width: '1.25rem', height: '1.25rem', color: 'white' }} />
            </div>
            <div>
              <h2 style={{
                fontSize: '1.25rem',
                fontWeight: 600,
                margin: 0,
                color: '#1f2937'
              }}>
                Nhật ký theo dõi
              </h2>
              <p style={{
                fontSize: '0.875rem',
                color: '#6b7280',
                margin: 0
              }}>
                Ghi chú chăm sóc cho {residentName}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            style={{
              padding: '0.5rem',
              borderRadius: '0.5rem',
              border: 'none',
              backgroundColor: '#f3f4f6',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}
          >
            <XMarkIcon style={{ width: '1.25rem', height: '1.25rem', color: '#6b7280' }} />
          </button>
        </div>

        <div style={{ padding: '1.5rem' }}>
          <div style={{ marginBottom: '1rem' }}>
            <label style={{
              display: 'block',
              fontSize: '0.875rem',
              fontWeight: 500,
              color: '#374151',
              marginBottom: '0.5rem'
            }}>
              Nội dung ghi chú
            </label>
            <textarea
              value={noteContent}
              onChange={(e) => setNoteContent(e.target.value)}
              placeholder="Ghi chú tình trạng sức khỏe, thái độ, hoạt động..."
              style={{
                width: '100%',
                padding: '0.75rem',
                border: '1px solid #d1d5db',
                borderRadius: '0.5rem',
                fontSize: '0.875rem',
                resize: 'vertical',
                minHeight: '120px',
                outline: 'none'
              }}
            />
          </div>
                
          <div style={{
            display: 'flex',
            justifyContent: 'flex-end',
            gap: '0.75rem'
          }}>
            <button
              onClick={onClose}
              style={{
                padding: '0.75rem 1.5rem',
                borderRadius: '0.5rem',
                border: '1px solid #d1d5db',
                backgroundColor: 'white',
                color: '#374151',
                cursor: 'pointer',
                fontSize: '0.875rem',
                fontWeight: 500
              }}
            >
              Hủy
            </button>
            <button
              onClick={handleSubmit}
              disabled={!noteContent.trim() || isSubmitting}
              style={{
                padding: '0.75rem 1.5rem',
                borderRadius: '0.5rem',
                border: 'none',
                backgroundColor: !noteContent.trim() || isSubmitting ? '#9ca3af' : '#3b82f6',
                color: 'white',
                cursor: !noteContent.trim() || isSubmitting ? 'not-allowed' : 'pointer',
                fontSize: '0.875rem',
                fontWeight: 500
              }}
            >
              {isSubmitting ? 'Đang lưu...' : 'Lưu ghi chú'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
} 
