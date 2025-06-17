"use client";

import { useState, useEffect } from 'react';
import { useAuth } from '@/lib/contexts/auth-context';
import { 
  ClipboardDocumentListIcon,
  ClockIcon,
  CheckCircleIcon,
  ExclamationTriangleIcon,
  UserIcon,
  CalendarDaysIcon,
  PlusIcon,
  EyeIcon,
  PlayIcon,
  StopIcon,
  FunnelIcon,
  ArrowLeftIcon
} from '@heroicons/react/24/outline';
import { useRouter } from 'next/navigation';

interface Task {
  id: number;
  title: string;
  description: string;
  type: 'care' | 'medication' | 'activity' | 'administrative' | 'emergency';
  priority: 'low' | 'medium' | 'high' | 'urgent';
  status: 'pending' | 'in_progress' | 'completed' | 'overdue';
  assignedBy: string;
  assignedTo: string;
  assignedDate: string;
  dueDate: string;
  estimatedDuration: number; // minutes
  actualDuration?: number;
  residentId?: number;
  residentName?: string;
  location: string;
  equipment?: string[];
  instructions: string;
  completionNotes?: string;
  completedAt?: string;
  attachments?: string[];
}

export default function StaffTasksPage() {
  const { user } = useAuth();
  const router = useRouter();
  const [tasks, setTasks] = useState<Task[]>([]);
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [filterStatus, setFilterStatus] = useState<string>('');
  const [filterPriority, setFilterPriority] = useState<string>('');
  const [filterType, setFilterType] = useState<string>('');
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(true);
  const [showCompletionModal, setShowCompletionModal] = useState(false);
  const [completionNoteValue, setCompletionNoteValue] = useState('');
  const [completingTaskId, setCompletingTaskId] = useState<number|null>(null);

  useEffect(() => {
    loadTasks();
  }, []);

  useEffect(() => {
    console.log('Modal states:', { showDetailModal, showCompletionModal });
    // Only hide header for modals, not the main page
    const hasModalOpen = showDetailModal || showCompletionModal;
    
    if (hasModalOpen) {
      console.log('Modal is open - adding hide-header class');
      document.body.classList.add('hide-header');
      document.body.style.overflow = 'hidden';
    } else {
      console.log('No modal open - removing hide-header class');
      document.body.classList.remove('hide-header');
      document.body.style.overflow = 'unset';
    }
    
    return () => {
      document.body.classList.remove('hide-header');
      document.body.style.overflow = 'unset';
    };
  }, [showDetailModal, showCompletionModal]);


  const loadTasks = () => {
    // Mock data - trong thực tế sẽ load từ API
    const mockTasks: Task[] = [
      {
        id: 1,
        title: 'Đo chỉ số sinh hiệu buổi sáng',
        description: 'Đo huyết áp, nhịp tim, nhiệt độ cho các người cao tuổi trong ca sáng',
        type: 'care',
        priority: 'high',
        status: 'pending',
        assignedBy: 'Trưởng ca Y tế',
        assignedTo: user?.name || 'Nguyễn Văn A',
        assignedDate: '2024-01-15',
        dueDate: '2024-01-15',
        estimatedDuration: 90,
        residentId: 1,
        residentName: 'Trần Văn B',
        location: 'Phòng 101-105',
        equipment: ['Máy đo huyết áp', 'Nhiệt kế', 'Máy đo SpO2'],
        instructions: 'Đo chỉ số cho 5 người cao tuổi theo thứ tự phòng. Ghi chú đặc biệt nếu có bất thường.',
        attachments: []
      },
      {
        id: 2,
        title: 'Phát thuốc buổi trưa',
        description: 'Phát thuốc theo đơn cho người cao tuổi, kiểm tra tuân thủ',
        type: 'medication',
        priority: 'urgent',
        status: 'in_progress',
        assignedBy: 'Dược sĩ trưởng',
        assignedTo: user?.name || 'Nguyễn Văn A',
        assignedDate: '2024-01-15',
        dueDate: '2024-01-15',
        estimatedDuration: 45,
        actualDuration: 20,
        location: 'Phòng thuốc',
        equipment: ['Xe đẩy thuốc', 'Danh sách thuốc'],
        instructions: 'Kiểm tra kỹ tên, liều lượng trước khi phát. Ghi nhận nếu người cao tuổi từ chối uống.',
        attachments: ['medication-list.pdf']
      },
      {
        id: 3,
        title: 'Tổ chức hoạt động thể dục',
        description: 'Hướng dẫn bài tập thể dục nhẹ cho nhóm người cao tuổi',
        type: 'activity',
        priority: 'medium',
        status: 'completed',
        assignedBy: 'Điều phối viên hoạt động',
        assignedTo: user?.name || 'Nguyễn Văn A',
        assignedDate: '2024-01-14',
        dueDate: '2024-01-14',
        estimatedDuration: 60,
        actualDuration: 65,
        location: 'Sân thể dục',
        equipment: ['Thảm tập', 'Loa di động', 'Bóng mềm'],
        instructions: 'Khởi động 10 phút, bài tập chính 40 phút, thư giãn 10 phút.',
        completionNotes: 'Hoàn thành tốt. 8/10 người cao tuổi tham gia tích cực.',
        completedAt: '2024-01-14T15:30:00',
        attachments: ['exercise-photos.jpg']
      },
      {
        id: 4,
        title: 'Báo cáo kiểm kê kho',
        description: 'Kiểm kê vật tư y tế và báo cáo tình trạng',
        type: 'administrative',
        priority: 'low',
        status: 'overdue',
        assignedBy: 'Quản lý kho',
        assignedTo: user?.name || 'Nguyễn Văn A',
        assignedDate: '2024-01-13',
        dueDate: '2024-01-14',
        estimatedDuration: 120,
        location: 'Kho vật tư',
        equipment: ['Máy quét mã vạch', 'Tablet'],
        instructions: 'Kiểm đếm số lượng thực tế, so sánh với sổ sách, báo cáo hàng thiếu.',
        attachments: ['inventory-template.xlsx']
      },
      {
        id: 5,
        title: 'Xử lý tình huống khẩn cấp',
        description: 'Hỗ trợ người cao tuổi gặp vấn đề sức khỏe đột xuất',
        type: 'emergency',
        priority: 'urgent',
        status: 'completed',
        assignedBy: 'Hệ thống tự động',
        assignedTo: user?.name || 'Nguyễn Văn A',
        assignedDate: '2024-01-15',
        dueDate: '2024-01-15',
        estimatedDuration: 30,
        actualDuration: 45,
        residentId: 3,
        residentName: 'Lê Thị C',
        location: 'Phòng 203',
        equipment: ['Bộ dụng cụ sơ cấp cứu'],
        instructions: 'Đánh giá tình trạng, sơ cấp cứu ban đầu, liên hệ bác sĩ nếu cần.',
        completionNotes: 'người cao tuổi bị choáng váng nhẹ. Đã ổn định và thông báo bác sĩ.',
        completedAt: '2024-01-15T10:45:00',
        attachments: []
      }
    ];
    
    setTasks(mockTasks);
    setLoading(false);
  };

  const filteredTasks = tasks.filter(task => {
    const matchesSearch = task.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         task.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         (task.residentName && task.residentName.toLowerCase().includes(searchTerm.toLowerCase()));
    const matchesStatus = !filterStatus || task.status === filterStatus;
    const matchesPriority = !filterPriority || task.priority === filterPriority;
    const matchesType = !filterType || task.type === filterType;
    
    return matchesSearch && matchesStatus && matchesPriority && matchesType;
  });

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'care': return '#ef4444';
      case 'medication': return '#f59e0b';
      case 'activity': return '#8b5cf6';
      case 'administrative': return '#3b82f6';
      case 'emergency': return '#dc2626';
      default: return '#6b7280';
    }
  };

  const getTypeText = (type: string) => {
    switch (type) {
      case 'care': return 'Chăm sóc';
      case 'medication': return 'Thuốc';
      case 'activity': return 'Hoạt động';
      case 'administrative': return 'Hành chính';
      case 'emergency': return 'Khẩn cấp';
      default: return type;
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'low': return '#10b981';
      case 'medium': return '#f59e0b';
      case 'high': return '#ef4444';
      case 'urgent': return '#dc2626';
      default: return '#6b7280';
    }
  };

  const getPriorityText = (priority: string) => {
    switch (priority) {
      case 'low': return 'Thấp';
      case 'medium': return 'Trung bình';
      case 'high': return 'Cao';
      case 'urgent': return 'Khẩn cấp';
      default: return priority;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending': return '#f59e0b';
      case 'in_progress': return '#3b82f6';
      case 'completed': return '#10b981';
      case 'overdue': return '#ef4444';
      default: return '#6b7280';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'pending': return 'Chờ thực hiện';
      case 'in_progress': return 'Đang thực hiện';
      case 'completed': return 'Hoàn thành';
      case 'overdue': return 'Quá hạn';
      default: return status;
    }
  };

  const handleStartTask = (taskId: number) => {
    setTasks(prev => prev.map(task => 
      task.id === taskId 
        ? { ...task, status: 'in_progress' as const }
        : task
    ));
  };

  const handleCompleteTask = (taskId: number) => {
    setCompletingTaskId(taskId);
    setCompletionNoteValue('');
    setShowCompletionModal(true);
  };

  const handleSaveCompletionNote = () => {
    if (completingTaskId !== null) {
      setTasks(prev => prev.map(t =>
        t.id === completingTaskId
          ? {
              ...t,
              status: 'completed' as const,
              completionNotes: completionNoteValue,
              completedAt: new Date().toISOString()
            }
          : t
      ));
    }
    setShowCompletionModal(false);
    setCompletingTaskId(null);
    setCompletionNoteValue('');
  };

  const handleCancelCompletionNote = () => {
    setShowCompletionModal(false);
    setCompletingTaskId(null);
    setCompletionNoteValue('');
  };

  const getTaskStats = () => {
    const pending = tasks.filter(t => t.status === 'pending').length;
    const inProgress = tasks.filter(t => t.status === 'in_progress').length;
    const completed = tasks.filter(t => t.status === 'completed').length;
    const overdue = tasks.filter(t => t.status === 'overdue').length;
    
    return { pending, inProgress, completed, overdue };
  };

  const stats = getTaskStats();

  if (loading) {
    return (
      <div style={{
        minHeight: '100vh',
        background: 'linear-gradient(135deg, #f8fafc 0%, #e2e8f0 100%)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center'
      }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{
            width: '3rem',
            height: '3rem',
            border: '3px solid #e5e7eb',
            borderTop: '3px solid #3b82f6',
            borderRadius: '50%',
            margin: '0 auto 1rem',
            animation: 'spin 1s linear infinite'
          }} />
          <p style={{ color: '#6b7280' }}>Đang tải danh sách nhiệm vụ...</p>
        </div>
      </div>
    );
  }


  return (
    <div style={{
      minHeight: '100vh',
      background: 'linear-gradient(135deg, #f8fafc 0%, #e2e8f0 100%)',
      padding: '2rem'
    }}>
      <div style={{ maxWidth: '1400px', margin: '0 auto' }}>
        <button
          onClick={() => router.push('/')}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem',
            padding: '0.75rem 1rem',
            background: 'white',
            color: '#374151',
            border: '1px solid #d1d5db',
            borderRadius: '0.5rem',
            fontSize: '0.875rem',
            fontWeight: 500,
            cursor: 'pointer',
            marginBottom: '1rem',
            boxShadow: '0 1px 2px rgba(0, 0, 0, 0.05)'
          }}
        >
          <ArrowLeftIcon style={{ width: '1rem', height: '1rem' }} />
          Quay lại
        </button>
        {/* Header */}
        <div style={{
          background: 'white',
          borderRadius: '1rem',
          padding: '2rem',
          marginBottom: '2rem',
          boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '1rem' }}>
            <ClipboardDocumentListIcon style={{ width: '2rem', height: '2rem', color: '#3b82f6' }} />
            <h1 style={{
              fontSize: '1.875rem',
              fontWeight: 700,
              background: 'linear-gradient(135deg, #3b82f6 0%, #8b5cf6 100%)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              margin: 0
            }}>
              Nhiệm Vụ Được Giao
            </h1>
          </div>
          <p style={{ color: '#6b7280', margin: 0 }}>
            Quản lý và thực hiện các nhiệm vụ hàng ngày
          </p>
        </div>

        {/* Statistics */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
          gap: '1.5rem',
          marginBottom: '2rem'
        }}>
          <div style={{
            background: 'white',
            borderRadius: '1rem',
            padding: '1.5rem',
            boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
            border: '2px solid #fbbf2420'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
              <ClockIcon style={{ width: '1.5rem', height: '1.5rem', color: '#f59e0b' }} />
              <div>
                <p style={{ fontSize: '0.875rem', color: '#6b7280', margin: 0 }}>Chờ thực hiện</p>
                <p style={{ fontSize: '1.5rem', fontWeight: 700, color: '#f59e0b', margin: 0 }}>
                  {stats.pending}
                </p>
              </div>
            </div>
          </div>

          <div style={{
            background: 'white',
            borderRadius: '1rem',
            padding: '1.5rem',
            boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
            border: '2px solid #3b82f620'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
              <PlayIcon style={{ width: '1.5rem', height: '1.5rem', color: '#3b82f6' }} />
              <div>
                <p style={{ fontSize: '0.875rem', color: '#6b7280', margin: 0 }}>Đang thực hiện</p>
                <p style={{ fontSize: '1.5rem', fontWeight: 700, color: '#3b82f6', margin: 0 }}>
                  {stats.inProgress}
                </p>
              </div>
            </div>
          </div>

          <div style={{
            background: 'white',
            borderRadius: '1rem',
            padding: '1.5rem',
            boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
            border: '2px solid #10b98120'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
              <CheckCircleIcon style={{ width: '1.5rem', height: '1.5rem', color: '#10b981' }} />
              <div>
                <p style={{ fontSize: '0.875rem', color: '#6b7280', margin: 0 }}>Hoàn thành</p>
                <p style={{ fontSize: '1.5rem', fontWeight: 700, color: '#10b981', margin: 0 }}>
                  {stats.completed}
                </p>
              </div>
            </div>
          </div>

          <div style={{
            background: 'white',
            borderRadius: '1rem',
            padding: '1.5rem',
            boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
            border: '2px solid #ef444420'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
              <ExclamationTriangleIcon style={{ width: '1.5rem', height: '1.5rem', color: '#ef4444' }} />
              <div>
                <p style={{ fontSize: '0.875rem', color: '#6b7280', margin: 0 }}>Quá hạn</p>
                <p style={{ fontSize: '1.5rem', fontWeight: 700, color: '#ef4444', margin: 0 }}>
                  {stats.overdue}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Filters */}
        <div style={{
          background: 'white',
          borderRadius: '1rem',
          padding: '1.5rem',
          marginBottom: '2rem',
          boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
        }}>
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
            gap: '1rem'
          }}>
            <div>
              <label style={{
                display: 'block',
                fontSize: '0.875rem',
                fontWeight: 600,
                color: '#374151',
                marginBottom: '0.5rem'
              }}>
                Tìm kiếm
              </label>
              <input
                type="text"
                placeholder="Tên nhiệm vụ, mô tả..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                style={{
                  width: '100%',
                  padding: '0.75rem',
                  border: '1px solid #d1d5db',
                  borderRadius: '0.5rem',
                  fontSize: '0.875rem'
                }}
              />
            </div>

            <div>
              <label style={{
                display: 'block',
                fontSize: '0.875rem',
                fontWeight: 600,
                color: '#374151',
                marginBottom: '0.5rem'
              }}>
                Trạng thái
              </label>
              <select
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value)}
                style={{
                  width: '100%',
                  padding: '0.75rem',
                  border: '1px solid #d1d5db',
                  borderRadius: '0.5rem',
                  fontSize: '0.875rem',
                  background: 'white'
                }}
              >
                <option value="">Tất cả trạng thái</option>
                <option value="pending">Chờ thực hiện</option>
                <option value="in_progress">Đang thực hiện</option>
                <option value="completed">Hoàn thành</option>
                <option value="overdue">Quá hạn</option>
              </select>
            </div>

            <div>
              <label style={{
                display: 'block',
                fontSize: '0.875rem',
                fontWeight: 600,
                color: '#374151',
                marginBottom: '0.5rem'
              }}>
                Mức độ ưu tiên
              </label>
              <select
                value={filterPriority}
                onChange={(e) => setFilterPriority(e.target.value)}
                style={{
                  width: '100%',
                  padding: '0.75rem',
                  border: '1px solid #d1d5db',
                  borderRadius: '0.5rem',
                  fontSize: '0.875rem',
                  background: 'white'
                }}
              >
                <option value="">Tất cả mức độ</option>
                <option value="low">Thấp</option>
                <option value="medium">Trung bình</option>
                <option value="high">Cao</option>
                <option value="urgent">Khẩn cấp</option>
              </select>
            </div>

            <div>
              <label style={{
                display: 'block',
                fontSize: '0.875rem',
                fontWeight: 600,
                color: '#374151',
                marginBottom: '0.5rem'
              }}>
                Loại nhiệm vụ
              </label>
              <select
                value={filterType}
                onChange={(e) => setFilterType(e.target.value)}
                style={{
                  width: '100%',
                  padding: '0.75rem',
                  border: '1px solid #d1d5db',
                  borderRadius: '0.5rem',
                  fontSize: '0.875rem',
                  background: 'white'
                }}
              >
                <option value="">Tất cả loại</option>
                <option value="care">Chăm sóc</option>
                <option value="medication">Thuốc</option>
                <option value="activity">Hoạt động</option>
                <option value="administrative">Hành chính</option>
                <option value="emergency">Khẩn cấp</option>
              </select>
            </div>
          </div>
        </div>

        {/* Tasks List */}
        <div style={{ display: 'grid', gap: '1.5rem' }}>
          {filteredTasks.map((task) => (
            <div key={task.id} style={{
              background: 'white',
              borderRadius: '1rem',
              padding: '1.5rem',
              boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
              border: `2px solid ${getStatusColor(task.status)}20`
            }}>
              <div style={{
                display: 'grid',
                gridTemplateColumns: '1fr auto',
                gap: '1rem',
                alignItems: 'flex-start'
              }}>
                <div>
                  <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '1rem',
                    marginBottom: '1rem'
                  }}>
                    <h3 style={{
                      fontSize: '1.25rem',
                      fontWeight: 700,
                      color: '#1f2937',
                      margin: 0
                    }}>
                      {task.title}
                    </h3>
                    <span style={{ fontSize: '0.75rem', color: '#6b7280', fontWeight: 500, marginRight: '0.25rem' }}>Loại:</span>
                    <span style={{
                      padding: '0.25rem 0.75rem',
                      borderRadius: '0.375rem',
                      fontSize: '0.75rem',
                      fontWeight: 600,
                      background: `${getTypeColor(task.type)}20`,
                      color: getTypeColor(task.type)
                    }}>
                      {getTypeText(task.type)}
                    </span>
                    <span style={{ fontSize: '0.75rem', color: '#6b7280', fontWeight: 500, marginLeft: '0.75rem', marginRight: '0.25rem' }}>Ưu tiên:</span>
                    <span style={{
                      padding: '0.25rem 0.75rem',
                      borderRadius: '0.375rem',
                      fontSize: '0.75rem',
                      fontWeight: 600,
                      background: `${getPriorityColor(task.priority)}20`,
                      color: getPriorityColor(task.priority)
                    }}>
                      {getPriorityText(task.priority)}
                    </span>
                    <span style={{ fontSize: '0.75rem', color: '#6b7280', fontWeight: 500, marginLeft: '0.75rem', marginRight: '0.25rem' }}>Trạng thái:</span>
                    <span style={{
                      padding: '0.25rem 0.75rem',
                      borderRadius: '0.375rem',
                      fontSize: '0.75rem',
                      fontWeight: 600,
                      background: `${getStatusColor(task.status)}20`,
                      color: getStatusColor(task.status)
                    }}>
                      {getStatusText(task.status)}
                    </span>
                  </div>

                  <p style={{
                    color: '#6b7280',
                    lineHeight: 1.6,
                    margin: '0 0 1rem 0'
                  }}>
                    {task.description}
                  </p>

                  <div style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
                    gap: '1rem',
                    marginBottom: '1rem'
                  }}>
                    <div>
                      <p style={{
                        fontSize: '0.875rem',
                        color: '#6b7280',
                        margin: '0 0 0.25rem 0'
                      }}>
                        Người giao việc
                      </p>
                      <p style={{
                        fontSize: '0.875rem',
                        fontWeight: 600,
                        color: '#1f2937',
                        margin: 0
                      }}>
                        {task.assignedBy}
                      </p>
                    </div>
                    <div>
                      <p style={{
                        fontSize: '0.875rem',
                        color: '#6b7280',
                        margin: '0 0 0.25rem 0'
                      }}>
                        Hạn hoàn thành
                      </p>
                      <p style={{
                        fontSize: '0.875rem',
                        fontWeight: 600,
                        color: '#1f2937',
                        margin: 0
                      }}>
                        {new Date(task.dueDate).toLocaleDateString('vi-VN')}
                      </p>
                    </div>
                    <div>
                      <p style={{
                        fontSize: '0.875rem',
                        color: '#6b7280',
                        margin: '0 0 0.25rem 0'
                      }}>
                        Thời gian dự kiến
                      </p>
                      <p style={{
                        fontSize: '0.875rem',
                        fontWeight: 600,
                        color: '#1f2937',
                        margin: 0
                      }}>
                        {task.estimatedDuration} phút
                      </p>
                    </div>
                    <div>
                      <p style={{
                        fontSize: '0.875rem',
                        color: '#6b7280',
                        margin: '0 0 0.25rem 0'
                      }}>
                        Địa điểm
                      </p>
                      <p style={{
                        fontSize: '0.875rem',
                        fontWeight: 600,
                        color: '#1f2937',
                        margin: 0
                      }}>
                        {task.location}
                      </p>
                    </div>
                  </div>

                  {task.residentName && (
                    <div style={{
                      padding: '0.75rem',
                      background: '#f0f9ff',
                      border: '1px solid #bfdbfe',
                      borderRadius: '0.5rem',
                      marginBottom: '1rem'
                    }}>
                      <p style={{
                        fontSize: '0.875rem',
                        color: '#1e40af',
                        margin: 0,
                        fontWeight: 500
                      }}>
                        <UserIcon style={{ width: '1rem', height: '1rem', display: 'inline', marginRight: '0.5rem' }} />
                        Liên quan đến người cao tuổi: {task.residentName}
                      </p>
                    </div>
                  )}

                  {task.completionNotes && (
                    <div style={{
                      padding: '0.75rem',
                      background: '#ecfdf5',
                      border: '1px solid #a7f3d0',
                      borderRadius: '0.5rem',
                      marginBottom: '1rem'
                    }}>
                      <p style={{
                        fontSize: '0.875rem',
                        color: '#065f46',
                        margin: '0 0 0.5rem 0',
                        fontWeight: 600
                      }}>
                        Ghi chú hoàn thành:
                      </p>
                      <p style={{
                        fontSize: '0.875rem',
                        color: '#047857',
                        margin: 0
                      }}>
                        {task.completionNotes}
                      </p>
                    </div>
                  )}
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                  <button
                    onClick={() => {
                      setSelectedTask(task);
                      setShowDetailModal(true);
                    }}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.5rem',
                      padding: '0.5rem 1rem',
                      background: '#f8fafc',
                      border: '1px solid #e2e8f0',
                      borderRadius: '0.5rem',
                      fontSize: '0.875rem',
                      cursor: 'pointer',
                      whiteSpace: 'nowrap'
                    }}
                  >
                    <EyeIcon style={{ width: '1rem', height: '1rem' }} />
                    Chi tiết
                  </button>

                  {task.status === 'pending' && (
                    <button
                      onClick={() => handleStartTask(task.id)}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.5rem',
                        padding: '0.5rem 1rem',
                        background: 'linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)',
                        color: 'white',
                        border: 'none',
                        borderRadius: '0.5rem',
                        fontSize: '0.875rem',
                        fontWeight: 600,
                        cursor: 'pointer',
                        whiteSpace: 'nowrap'
                      }}
                    >
                      <PlayIcon style={{ width: '1rem', height: '1rem' }} />
                      Bắt đầu
                    </button>
                  )}

                  {task.status === 'in_progress' && (
                    <button
                      onClick={() => handleCompleteTask(task.id)}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.5rem',
                        padding: '0.5rem 1rem',
                        background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
                        color: 'white',
                        border: 'none',
                        borderRadius: '0.5rem',
                        fontSize: '0.875rem',
                        fontWeight: 600,
                        cursor: 'pointer',
                        whiteSpace: 'nowrap'
                      }}
                    >
                      <CheckCircleIcon style={{ width: '1rem', height: '1rem' }} />
                      Hoàn thành
                    </button>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>

        {filteredTasks.length === 0 && (
          <div style={{
            background: 'white',
            borderRadius: '1rem',
            padding: '3rem',
            textAlign: 'center',
            boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
          }}>
            <ClipboardDocumentListIcon style={{
              width: '3rem',
              height: '3rem',
              margin: '0 auto 1rem',
              color: '#d1d5db'
            }} />
            <p style={{ fontSize: '1.125rem', fontWeight: 500, color: '#6b7280', margin: 0 }}>
              Không tìm thấy nhiệm vụ nào
            </p>
            <p style={{ color: '#9ca3af', margin: '0.5rem 0 0 0' }}>
              Thử thay đổi bộ lọc hoặc từ khóa tìm kiếm
            </p>
          </div>
        )}

        {/* Task Detail Modal */}
        {showDetailModal && selectedTask && (
          <div style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: 'rgba(0, 0, 0, 0.5)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1000,
            padding: '1rem', 
            marginLeft: '120px',
          
          }}>
            <div style={{
              background: '#f8fafc',
              borderRadius: '1.5rem',
              padding: '2.5rem',
              maxWidth: '800px',
              width: '100%',
              maxHeight: '90vh',
              overflowY: 'auto',
              boxShadow: '0 8px 32px 0 rgba(16, 185, 129, 0.10)'
            }}>
              <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                marginBottom: '2rem'
              }}>
                <h2 style={{
                  background: 'linear-gradient(90deg, #22c55e 0%, #64748b 100%)',
                  WebkitBackgroundClip: 'text',
                  WebkitTextFillColor: 'transparent',
                  letterSpacing: '0.01em',
                  fontSize: '1.8rem',
                }}>
                  Chi tiết nhiệm vụ
                </h2>
                
                <button
                  onClick={() => setShowDetailModal(false)}
                  title="Đóng"
                  style={{
                    padding: '0.5rem',
                    background: 'none',
                    border: 'none',
                    cursor: 'pointer',
                    fontSize: '1.5rem',
                    color: '#6b7280'
                  }}
                >
                  ×
                </button>
              </div>

              {/* General Info Table - Redesigned with gray/green */}
              <div style={{
                background: 'white',
                borderRadius: '1rem',
                padding: '2rem',
                marginBottom: '2rem',
                border: '1px solid #d1fae5',
                boxShadow: '0 2px 8px 0 rgba(16,185,129,0.06)'
              }}>
                <h3 style={{
                  fontSize: '1.15rem',
                  fontWeight: 700,
                  color: '#22c55e',
                  marginBottom: '1.5rem',
                  letterSpacing: '0.01em',
                  display: 'inline-block'
                }}>
                  Thông tin chung
                </h3>
                <div style={{
                  display: 'grid',
                  gridTemplateColumns: 'max-content 1fr',
                  rowGap: '1.1rem',
                  columnGap: '2rem',
                  alignItems: 'center',
                  fontSize: '1rem'
                }}>
                  <span style={{fontWeight:600, color:'#334155', textAlign:'right'}}>Tên nhiệm vụ:</span>
                  <span style={{color:'#1f2937'}}>{selectedTask.title}</span>
                  <span style={{fontWeight:600, color:'#334155', textAlign:'right'}}>Mô tả:</span>
                  <span style={{color:'#1f2937'}}>{selectedTask.description}</span>
                  <span style={{fontWeight:600, color:'#334155', textAlign:'right'}}>Người giao việc:</span>
                  <span style={{color:'#1f2937'}}>{selectedTask.assignedBy}</span>
                  <span style={{fontWeight:600, color:'#334155', textAlign:'right'}}>Người nhận việc:</span>
                  <span style={{color:'#1f2937'}}>{selectedTask.assignedTo}</span>
                  <span style={{fontWeight:600, color:'#334155', textAlign:'right'}}>Địa điểm:</span>
                  <span style={{color:'#1f2937'}}>{selectedTask.location}</span>
                  {/* Type, Priority, Status as badges with labels */}
                  <span style={{fontWeight:600, color:'#334155', textAlign:'right'}}>Loại:</span>
                  <span>
                    <span style={{
                      padding: '0.25rem 0.75rem',
                      borderRadius: '0.375rem',
                      fontSize: '0.85em',
                      fontWeight: 600,
                      background: '#dcfce7',
                      color: '#16a34a',
                      marginRight: '0.5rem',
                      display: 'inline-block',
                      border: '1px solid #bbf7d0'
                    }}>{getTypeText(selectedTask.type)}</span>
                  </span>
                  <span style={{fontWeight:600, color:'#334155', textAlign:'right'}}>Ưu tiên:</span>
                  <span>
                    <span style={{
                      padding: '0.25rem 0.75rem',
                      borderRadius: '0.375rem',
                      fontSize: '0.85em',
                      fontWeight: 600,
                      background: '#f0fdf4',
                      color: '#22c55e',
                      marginRight: '0.5rem',
                      display: 'inline-block',
                      border: '1px solid #bbf7d0'
                    }}>{getPriorityText(selectedTask.priority)}</span>
                  </span>
                  <span style={{fontWeight:600, color:'#334155', textAlign:'right'}}>Trạng thái:</span>
                  <span>
                    <span style={{
                      padding: '0.25rem 0.75rem',
                      borderRadius: '0.375rem',
                      fontSize: '0.85em',
                      fontWeight: 600,
                      background: '#e0f2fe',
                      color: '#22c55e',
                      display: 'inline-block',
                      border: '1px solid #bbf7d0'
                    }}>{getStatusText(selectedTask.status)}</span>
                  </span>
                  {selectedTask.residentName && (
                    <>
                      <span style={{fontWeight:600, color:'#334155', textAlign:'right'}}>Người cao tuổi liên quan:</span>
                      <span style={{color:'#1f2937'}}>{selectedTask.residentName}</span>
                    </>
                  )}
                </div>
              </div>

              {/* Instructions */}
              <div style={{ marginBottom: '2rem' }}>
                <h3 style={{
                  fontSize: '1.125rem',
                  fontWeight: 700,
                  color: '#16a34a',
                  marginBottom: '1rem'
                }}>
                  Hướng dẫn thực hiện
                </h3>
                <div style={{
                  padding: '1rem',
                  background: '#f0fdf4',
                  borderRadius: '0.5rem',
                  border: '1px solid #bbf7d0'
                }}>
                  <p style={{
                    color: '#374151',
                    lineHeight: 1.6,
                    margin: 0
                  }}>
                    {selectedTask.instructions}
                  </p>
                </div>
              </div>

              {/* Equipment */}
              {selectedTask.equipment && selectedTask.equipment.length > 0 && (
                <div style={{ marginBottom: '2rem' }}>
                  <h3 style={{
                    fontSize: '1.125rem',
                    fontWeight: 700,
                    color: '#16a34a',
                    marginBottom: '1rem'
                  }}>
                    Thiết bị cần thiết
                  </h3>
                  <div style={{
                    padding: '1rem',
                    background: '#f0fdf4',
                    borderRadius: '0.5rem',
                    border: '1px solid #bbf7d0'
                  }}>
                    <ul style={{ margin: 0, paddingLeft: '1.5rem' }}>
                      {selectedTask.equipment.map((equipment, index) => (
                        <li key={index} style={{
                          color: '#374151',
                          marginBottom: '0.5rem'
                        }}>
                          {equipment}
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              )}

              {/* Time Info */}
              <div style={{
                background: '#f8fafc',
                borderRadius: '0.5rem',
                padding: '1.5rem',
                marginBottom: '2rem',
                border: '1px solid #d1fae5'
              }}>
                <h3 style={{
                  fontSize: '1.125rem',
                  fontWeight: 700,
                  color: '#16a34a',
                  marginBottom: '1rem'
                }}>
                  Thông tin thời gian
                </h3>
                <div style={{
                  display: 'grid',
                  gridTemplateColumns: 'max-content 1fr',
                  rowGap: '0.75rem',
                  columnGap: '1.5rem',
                  alignItems: 'center'
                }}>
                  <span style={{fontWeight:600, color:'#334155'}}>Ngày giao việc:</span>
                  <span>{new Date(selectedTask.assignedDate).toLocaleDateString('vi-VN')}</span>
                  <span style={{fontWeight:600, color:'#334155'}}>Hạn hoàn thành:</span>
                  <span>{new Date(selectedTask.dueDate).toLocaleDateString('vi-VN')}</span>
                  {selectedTask.completedAt && (
                    <>
                      <span style={{fontWeight:600, color:'#334155'}}>Thời gian hoàn thành:</span>
                      <span>{new Date(selectedTask.completedAt).toLocaleString('vi-VN')}</span>
                    </>
                  )}
                  {selectedTask.actualDuration && (
                    <>
                      <span style={{fontWeight:600, color:'#334155'}}>Thời gian thực tế:</span>
                      <span>{selectedTask.actualDuration} phút</span>
                    </>
                  )}
                  <span style={{fontWeight:600, color:'#334155'}}>Thời gian dự kiến:</span>
                  <span>{selectedTask.estimatedDuration} phút</span>
                </div>
              </div>

              {/* Completion Notes */}
              {selectedTask.completionNotes && (
                <div style={{
                  padding: '1.5rem',
                  background: '#f0fdf4',
                  border: '1px solid #bbf7d0',
                  borderRadius: '0.5rem',
                  marginBottom: '1rem'
                }}>
                  <h3 style={{
                    fontSize: '1.125rem',
                    fontWeight: 700,
                    color: '#16a34a',
                    marginBottom: '1rem'
                  }}>
                    Ghi chú hoàn thành
                  </h3>
                  <p style={{
                    fontSize: '0.95rem',
                    color: '#047857',
                    margin: 0,
                    lineHeight: 1.6
                  }}>
                    {selectedTask.completionNotes}
                  </p>
                </div>
              )}
            </div>
          </div>
        )}

        {showCompletionModal && (
          <div style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: 'rgba(0, 0, 0, 0.5)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1100,
            padding: '1rem'
          }}>
            <div style={{
              background: 'white',
              borderRadius: '1rem',
              padding: '2rem',
              maxWidth: '400px',
              width: '100%',
              boxShadow: '0 4px 16px rgba(0,0,0,0.15)'
            }}>
              <h3 style={{
                fontSize: '1.125rem',
                fontWeight: 600,
                color: '#1f2937',
                marginBottom: '1.5rem',
                textAlign: 'center'
              }}>
                Nhập ghi chú hoàn thành
              </h3>
              <label htmlFor="completion-note" style={{
                display: 'block',
                fontWeight: 500,
                color: '#374151',
                marginBottom: '0.5rem'
              }}>
                Ghi chú (nếu có):
              </label>
              <textarea
                id="completion-note"
                value={completionNoteValue}
                onChange={e => setCompletionNoteValue(e.target.value)}
                rows={4}
                style={{
                  width: '100%',
                  padding: '0.75rem',
                  border: '1px solid #d1d5db',
                  borderRadius: '0.5rem',
                  fontSize: '0.95rem',
                  marginBottom: '1.5rem',
                  resize: 'vertical',
                  background: '#f9fafb'
                }}
                placeholder="Nhập ghi chú về quá trình hoàn thành nhiệm vụ..."
              />
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '1rem' }}>
                <button
                  onClick={handleCancelCompletionNote}
                  style={{
                    padding: '0.5rem 1.25rem',
                    background: '#f3f4f6',
                    color: '#374151',
                    border: '1px solid #d1d5db',
                    borderRadius: '0.5rem',
                    fontWeight: 500,
                    cursor: 'pointer'
                  }}
                >
                  Hủy
                </button>
                <button
                  onClick={handleSaveCompletionNote}
                  style={{
                    padding: '0.5rem 1.25rem',
                    background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
                    color: 'white',
                    border: 'none',
                    borderRadius: '0.5rem',
                    fontWeight: 600,
                    cursor: 'pointer'
                  }}
                >
                  Lưu
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
} 
