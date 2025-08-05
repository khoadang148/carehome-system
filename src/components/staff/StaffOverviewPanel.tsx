"use client";

import { useState, useEffect } from 'react';
import { 
  DocumentTextIcon,
  ClipboardIcon,
  ClipboardDocumentListIcon,
  UserIcon,
  MagnifyingGlassIcon
} from '@heroicons/react/24/outline';
import { clientStorage } from '@/lib/utils/clientStorage';


interface Resident {
  id: number;
  name: string;
  room: string;
  age: number;
  careLevel: string;
}

export default function StaffOverviewPanel() {
  const [residents, setResidents] = useState<Resident[]>([]);
  const [selectedResident, setSelectedResident] = useState<Resident | null>(null);
  const [searchTerm, setSearchTerm] = useState('');

  const [showCareNoteModal, setShowCareNoteModal] = useState(false);

  useEffect(() => {
    loadResidents();
  }, []);

  const loadResidents = () => {
    try {
      const savedResidents = clientStorage.getItem('nurseryHomeResidents');
      if (savedResidents) {
        const residentsData = JSON.parse(savedResidents);
        setResidents(residentsData.map((r: any) => ({
          id: r.id,
          name: r.name,
          room: r.room,
          age: r.age,
          careLevel: r.careLevel
        })));
      }
    } catch (error) {
      console.error('Error loading residents:', error);
    }
  };

  const filteredResidents = residents.filter(resident =>
    resident.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    resident.room.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleActionComplete = () => {
    loadResidents();
    // Trigger custom event để refresh widgets
    window.dispatchEvent(new CustomEvent('dataUpdated'));
  };



  const openCareNoteModal = (resident: Resident) => {
    setSelectedResident(resident);
    setShowCareNoteModal(true);
  };

  return (
    <div style={{
      background: 'linear-gradient(135deg, #ffffff 0%, #f8fafc 100%)',
      borderRadius: '1.5rem',
      padding: '2rem',
      boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.1)',
      border: '1px solid rgba(255, 255, 255, 0.2)',
      marginTop: '2rem'
    }}>
      <h2 style={{
        fontSize: '1.5rem',
        fontWeight: 700,
        margin: '0 0 1.5rem 0',
        color: '#1e293b',
        display: 'flex',
        alignItems: 'center',
        gap: '0.75rem'
      }}>
        <UserIcon style={{ width: '1.5rem', height: '1.5rem', color: '#3b82f6' }} />
        Công cụ chăm sóc người cao tuổi
      </h2>

      {/* Search Residents */}
      <div style={{ marginBottom: '2rem' }}>
        <div style={{
          position: 'relative',
          maxWidth: '400px'
        }}>
          <MagnifyingGlassIcon style={{
            position: 'absolute',
            left: '0.75rem',
            top: '50%',
            transform: 'translateY(-50%)',
            width: '1.25rem',
            height: '1.25rem',
            color: '#6b7280'
          }} />
          <input
            type="text"
            placeholder="Tìm kiếm người cao tuổi theo tên hoặc phòng..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            style={{
              width: '100%',
              padding: '0.75rem 0.75rem 0.75rem 2.5rem',
              border: '1px solid #d1d5db',
              borderRadius: '0.75rem',
              fontSize: '0.875rem',
              outline: 'none',
              backgroundColor: 'white',
              transition: 'all 0.2s ease'
            }}
          />
        </div>
      </div>

      {/* Action Buttons */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
        gap: '1.5rem',
        marginBottom: '2rem'
      }}>
        {/* Care Notes Button */}
        <ActionCard
          title="Nhật ký theo dõi"
          description="Ghi chú tình trạng và tiến triển sức khỏe"
          icon={<ClipboardDocumentListIcon style={{ width: '1.5rem', height: '1.5rem', color: '#1d4ed8' }} />}
          gradient="linear-gradient(135deg, #dbeafe 0%, #bfdbfe 100%)"
          borderColor="#93c5fd"
          textColor="#1d4ed8"
          residents={filteredResidents}
          onSelectResident={openCareNoteModal}
          searchTerm={searchTerm}
        />
      </div>

      {/* Modals */}
      {showCareNoteModal && selectedResident && (
        <CareNoteModal
          residentId={selectedResident.id}
          residentName={selectedResident.name}
          onClose={() => {
            setShowCareNoteModal(false);
            setSelectedResident(null);
          }}
          onComplete={() => {
            setShowCareNoteModal(false);
            setSelectedResident(null);
            handleActionComplete();
          }}
        />
      )}
    </div>
  );
}

// Action Card Component
function ActionCard({ 
  title, 
  description, 
  icon, 
  gradient, 
  borderColor, 
  textColor, 
  residents, 
  onSelectResident,
  searchTerm
}: {
  title: string;
  description: string;
  icon: React.ReactNode;
  gradient: string;
  borderColor: string;
  textColor: string;
  residents: Resident[];
  onSelectResident: (resident: Resident) => void;
  searchTerm: string;
}) {
  return (
    <div style={{
      background: gradient,
      border: `1px solid ${borderColor}`,
      borderRadius: '1rem',
      padding: '1.5rem',
      transition: 'all 0.3s ease'
    }}>
      <div style={{
        display: 'flex',
        alignItems: 'center',
        gap: '0.75rem',
        marginBottom: '1rem'
      }}>
        {icon}
        <h3 style={{
          fontSize: '1.125rem',
          fontWeight: 600,
          margin: 0,
          color: textColor
        }}>
          {title}
        </h3>
      </div>
      <p style={{
        fontSize: '0.875rem',
        color: '#374151',
        margin: '0 0 1rem 0'
      }}>
        {description}
      </p>
      <div style={{
        fontSize: '0.75rem',
        color: '#6b7280',
        marginBottom: '1rem'
      }}>
        Chọn người cao tuổi:
      </div>
      
      {residents.length > 0 ? (
        <div style={{ 
          maxHeight: '120px', 
          overflowY: 'auto',
          display: 'grid',
          gap: '0.5rem'
        }}>
          {residents.slice(0, 5).map((resident) => (
            <button
              key={resident.id}
              onClick={() => onSelectResident(resident)}
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                padding: '0.5rem 0.75rem',
                backgroundColor: 'rgba(255, 255, 255, 0.8)',
                border: `1px solid ${borderColor}`,
                borderRadius: '0.5rem',
                fontSize: '0.75rem',
                cursor: 'pointer',
                transition: 'all 0.2s ease',
                textAlign: 'left'
              }}
              onMouseOver={(e) => {
                e.currentTarget.style.backgroundColor = 'white';
                e.currentTarget.style.transform = 'translateY(-1px)';
              }}
              onMouseOut={(e) => {
                e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.8)';
                e.currentTarget.style.transform = 'translateY(0)';
              }}
            >
                                      <span style={{ fontWeight: 500, color: '#111827' }}><strong>Tên:</strong> {resident.name}</span>
                        <span style={{ color: '#6b7280' }}><strong>Phòng:</strong> {resident.room}</span>
            </button>
          ))}
        </div>
      ) : (
        <div style={{
          fontSize: '0.75rem',
          color: '#6b7280',
          fontStyle: 'italic',
          textAlign: 'center',
          padding: '1rem'
        }}>
          {searchTerm ? 'Không tìm thấy người cao tuổi phù hợp' : 'Đang tải danh sách người cao tuổi...'}
        </div>
      )}
    </div>
  );
}

// Care Note Modal Component
function CareNoteModal({ residentId, residentName, onClose, onComplete }: {
  residentId: number;
  residentName: string;
  onClose: () => void;
  onComplete: () => void;
}) {
  const [note, setNote] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!note.trim()) return;

    // VALIDATION CHUYÊN NGHIỆP Y KHOA
    const noteContent = note.trim();
    
    // 1. Kiểm tra độ dài tối thiểu
    if (noteContent.length < 15) {
      alert('⚠️ Nội dung nhật ký quá ngắn.\n\nVui lòng mô tả chi tiết:\n• Tình trạng hiện tại\n• Triệu chứng quan sát\n• Hoạt động thực hiện\n• Phản ứng của người cao tuổi\n\n(Tối thiểu 15 ký tự)');
      return;
    }

    // 2. Phân tích từ khóa y tế NGHIÊM TRỌNG
    const criticalKeywords = [
      'khó thở', 'thở gấp', 'ngạt thở', 'đau ngực', 'đau tim', 
      'ngất xiu', 'bất tỉnh', 'co giật', 'động kinh', 'sốt cao', 
      'sốt >39', 'chảy máu', 'xuất huyết', 'đột quỵ', 'liệt',
      'hôn mê', 'mê man', 'choáng', 'sốc', 'ngộ độc',
      'dị ứng nặng', 'phù mặt', 'khó nuốt', 'tím tái'
    ];
    
    // 3. Phân tích từ khóa CẦN CHÚ Ý
    const attentionKeywords = [
      'đau đầu', 'chóng mặt', 'buồn nôn', 'nôn', 'tiêu chảy', 
      'táo bón', 'đau bụng', 'mệt mỏi', 'yếu', 'ăn kém',
      'chán ăn', 'sút cân', 'tăng cân', 'mất ngủ', 'ngủ nhiều',
      'lo âu', 'buồn', 'kích động', 'hoang tưởng', 'lú lẫn',
      'run tay', 'run chân', 'đau khớp', 'sưng', 'bầm tím',
      'ho', 'đờm', 'khàn tiếng', 'đau họng'
    ];

    // 4. Phân tích từ khóa THUỐC
    const medicationKeywords = [
      'uống thuốc', 'bỏ thuốc', 'quên thuốc', 'từ chối thuốc',
      'tác dụng phụ', 'dị ứng thuốc', 'phản ứng thuốc',
      'tăng liều', 'giảm liều', 'đổi thuốc', 'ngừng thuốc'
    ];

    const lowerNote = noteContent.toLowerCase();
    
    // Tìm từ khóa nghiêm trọng
    const foundCritical = criticalKeywords.filter(keyword => lowerNote.includes(keyword));
    // Tìm từ khóa cần chú ý
    const foundAttention = attentionKeywords.filter(keyword => lowerNote.includes(keyword));
    // Tìm từ khóa thuốc
    const foundMedication = medicationKeywords.filter(keyword => lowerNote.includes(keyword));

    // 5. Xác định mức độ ưu tiên TỰ ĐỘNG
    let autoPriority = 'low';
    let alertMessage = '';
    let recommendations: string[] = [];

    if (foundCritical.length > 0) {
      autoPriority = 'high';
      alertMessage = `🚨 CẢNH BÁO NGHIÊM TRỌNG!\n\nPhát hiện triệu chứng cấp cứu: "${foundCritical.join(', ')}"\n\n⚡ HÀNH ĐỘNG NGAY:\n• Báo cáo ngay cho bác sĩ\n• Thông báo gia đình\n• Theo dõi sát sao\n• Chuẩn bị sẵn sàng chuyển viện`;
      recommendations = [
        'Theo dõi chỉ số sinh hiệu mỗi 15 phút',
        'Đảm bảo đường thở thông thoáng',
        'Chuẩn bị thuốc cấp cứu',
        'Liên hệ bác sĩ điều trị ngay'
      ];
    } else if (foundAttention.length > 0) {
      autoPriority = 'medium';
      alertMessage = `📋 CẦN CHÚ Ý!\n\nPhát hiện triệu chứng theo dõi: "${foundAttention.join(', ')}"\n\n📝 KHUYẾN NGHỊ:\n• Theo dõi tiến triển\n• Ghi nhận chi tiết\n• Báo cáo nếu xấu hơn`;
      recommendations = [
        'Theo dõi mỗi 2-4 tiếng',
        'Đo chỉ số sinh hiệu 2 lần/ngày',
        'Báo cáo nếu không cải thiện sau 24h'
      ];
    } else if (foundMedication.length > 0) {
      autoPriority = 'medium';
      alertMessage = `💊 THÔNG TIN THUỐC!\n\nGhi nhận về thuốc: "${foundMedication.join(', ')}"\n\n🔍 CẦN KIỂM TRA:\n• Tuân thủ theo đơn\n• Theo dõi tác dụng\n• Báo cáo bất thường`;
      recommendations = [
        'Kiểm tra lại đơn thuốc',
        'Theo dõi tác dụng phụ',
        'Tư vấn dược sĩ nếu cần'
      ];
    }

    // 6. Phân loại CHỦNG LOẠI nhật ký
    let category = 'Chăm sóc tổng quát';
    if (foundMedication.length > 0) {
      category = 'Quản lý thuốc';
    } else if (lowerNote.includes('ăn') || lowerNote.includes('uống') || lowerNote.includes('cân nặng') || lowerNote.includes('dinh dưỡng')) {
      category = 'Dinh dưỡng';
    } else if (lowerNote.includes('đi') || lowerNote.includes('ngã') || lowerNote.includes('vận động') || lowerNote.includes('tập')) {
      category = 'Vận động - Phục hồi';
    } else if (lowerNote.includes('tâm trạng') || lowerNote.includes('buồn') || lowerNote.includes('vui') || lowerNote.includes('lo') || lowerNote.includes('giao tiếp')) {
      category = 'Tâm lý - Xã hội';
    } else if (foundCritical.length > 0 || foundAttention.length > 0) {
      category = 'Theo dõi y tế';
    } else if (lowerNote.includes('vệ sinh') || lowerNote.includes('tắm') || lowerNote.includes('thay quần áo')) {
      category = 'Chăm sóc cá nhân';
    }

    // 7. Tính ĐIỂM CHẤT LƯỢNG nhật ký
    let qualityScore = 50; // Điểm cơ bản
    
    // Cộng điểm cho độ dài phù hợp
    if (noteContent.length >= 50) qualityScore += 20;
    if (noteContent.length >= 100) qualityScore += 10;
    
    // Cộng điểm cho thông tin cụ thể
    if (/\d{1,2}:\d{2}/.test(noteContent)) qualityScore += 10; // Có thời gian
    if (/\d+\/\d+/.test(noteContent)) qualityScore += 10; // Có số đo
    if (noteContent.includes('°C') || noteContent.includes('mmHg')) qualityScore += 10; // Có đơn vị y tế
    
    // Trừ điểm cho ngôn ngữ không chuyên nghiệp
    const informalWords = ['ok', 'oke', 'bình thường', 'tạm được'];
    if (informalWords.some(word => lowerNote.includes(word))) qualityScore -= 15;
    
    let qualityLevel = qualityScore >= 80 ? 'excellent' : qualityScore >= 65 ? 'good' : qualityScore >= 50 ? 'fair' : 'poor';

    // 8. Hiển thị cảnh báo nếu có
    if (alertMessage) {
      const confirmed = confirm(`${alertMessage}\n\n${recommendations.length > 0 ? '📋 KHUYẾN NGHỊ:\n' + recommendations.map(r => `• ${r}`).join('\n') : ''}\n\nẤn OK để lưu nhật ký với phân loại tự động.`);
      if (!confirmed) return;
    }

    setIsSubmitting(true);
    try {
      const currentUser = JSON.parse(clientStorage.getItem('currentUser') || '{}');
      const staffName = currentUser.name || 'Nhân viên';
      
      const savedResidents = clientStorage.getItem('nurseryHomeResidents');
      const residents = savedResidents ? JSON.parse(savedResidents) : [];
      
      const residentIndex = residents.findIndex((r: any) => r.id === residentId);
      if (residentIndex !== -1) {
        if (!residents[residentIndex].careNotes) {
          residents[residentIndex].careNotes = [];
        }
        
        // Tạo nhật ký với THÔNG TIN CHUYÊN NGHIỆP
        const newNote = {
          id: Date.now(),
          date: new Date().toISOString().split('T')[0],
          note: `[${category}] ${noteContent}`,
          staff: `${staffName}, Nhân viên chăm sóc`,
          timestamp: new Date().toISOString(),
          type: 'general',
          // Thông tin validation chuyên nghiệp
          priority: autoPriority,
          category: category,
          qualityScore: qualityLevel,
          qualityPoints: qualityScore,
          detectedKeywords: {
            critical: foundCritical,
            attention: foundAttention, 
            medication: foundMedication
          },
          recommendations: recommendations,
          validated: true,
          autoClassified: true
        };
        
        residents[residentIndex].careNotes.unshift(newNote);
        clientStorage.setItem('nurseryHomeResidents', JSON.stringify(residents));
      }
      
      // Thông báo kết quả chi tiết
      let successMessage = `✅ ĐÃ LƯU NHẬT KÝ THÀNH CÔNG!\n\n📊 THÔNG TIN PHÂN TÍCH:\n`;
      successMessage += `• Danh mục: ${category}\n`;
      successMessage += `• Mức độ ưu tiên: ${autoPriority === 'high' ? '🔴 CAO' : autoPriority === 'medium' ? '🟡 TRUNG BÌNH' : '🟢 THẤP'}\n`;
      successMessage += `• Chất lượng: ${qualityLevel === 'excellent' ? '⭐ Xuất sắc' : qualityLevel === 'good' ? '👍 Tốt' : qualityLevel === 'fair' ? '✔️ Đạt' : '⚠️ Cần cải thiện'} (${qualityScore}/100)\n`;
      
      if (foundCritical.length > 0) {
        successMessage += `\n🚨 CẢNH BÁO: Cần theo dõi đặc biệt!`;
      } else if (foundAttention.length > 0) {
        successMessage += `\n📋 LƯU Ý: Theo dõi thường xuyên.`;
      }
      
      alert(successMessage);
      // Trigger custom event để refresh widgets
      window.dispatchEvent(new CustomEvent('dataUpdated'));
      onComplete();
    } catch (error) {
      console.error('Error adding care note:', error);
      alert('❌ Có lỗi xảy ra khi lưu nhật ký. Vui lòng thử lại.');
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
      backgroundColor: 'rgba(0, 0, 0, 0.5)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 1000
    }}>
      <div style={{
        backgroundColor: 'white',
        borderRadius: '0.75rem',
        padding: '1.5rem',
        maxWidth: '500px',
        width: '90%',
        maxHeight: '80vh',
        overflow: 'auto'
      }}>
        <h3 style={{ 
          fontSize: '1.25rem', 
          fontWeight: 600, 
          marginBottom: '1rem',
          color: '#111827'
        }}>
          Nhật ký theo dõi - {residentName}
        </h3>
        
        <form onSubmit={handleSubmit}>
          <div style={{ marginBottom: '1rem' }}>
            <label style={{
              display: 'block',
              fontSize: '0.875rem',
              fontWeight: 500,
              color: '#374151',
              marginBottom: '0.5rem'
            }}>
              Nội dung theo dõi
            </label>
            <textarea
              value={note}
              onChange={(e) => setNote(e.target.value)}
              rows={5}
              placeholder="VD: người cao tuổi có biểu hiện đau đầu nhẹ từ 14:30. Huyết áp 130/80 mmHg. Đã uống paracetamol 500mg. Tâm trạng ổn định, ăn uống bình thường. Theo dõi tiếp diễn biến..."
              style={{
                width: '100%',
                padding: '0.75rem',
                border: `1px solid ${note.length < 15 ? '#fbbf24' : '#d1d5db'}`,
                borderRadius: '0.375rem',
                fontSize: '0.875rem',
                outline: 'none',
                resize: 'vertical',
                backgroundColor: note.length < 15 ? '#fffbeb' : 'white'
              }}
              required
            />
            <div style={{
              fontSize: '0.75rem',
              color: note.length < 15 ? '#d97706' : '#6b7280',
              marginTop: '0.25rem',
              display: 'flex',
              justifyContent: 'space-between'
            }}>
              <span>
                {note.length < 15 ? '⚠️ Cần mô tả chi tiết hơn (tối thiểu 15 ký tự)' : '✓ Đủ chi tiết'}
              </span>
              <span>{note.length}/1000</span>
            </div>
          </div>
          
          <div style={{
            display: 'flex',
            justifyContent: 'flex-end',
            gap: '0.75rem'
          }}>
            <button
              type="button"
              onClick={onClose}
              style={{
                padding: '0.5rem 1rem',
                border: '1px solid #d1d5db',
                borderRadius: '0.375rem',
                backgroundColor: 'white',
                color: '#374151',
                fontSize: '0.875rem',
                cursor: 'pointer'
              }}
            >
              Hủy
            </button>
            <button
              type="submit"
              disabled={isSubmitting || !note.trim()}
              style={{
                padding: '0.5rem 1rem',
                backgroundColor: isSubmitting ? '#9ca3af' : '#1d4ed8',
                color: 'white',
                border: 'none',
                borderRadius: '0.375rem',
                fontSize: '0.875rem',
                cursor: isSubmitting ? 'not-allowed' : 'pointer'
              }}
            >
              {isSubmitting ? 'Đang lưu...' : 'Lưu nhật ký'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
} 
