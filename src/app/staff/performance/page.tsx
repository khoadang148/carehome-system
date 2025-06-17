"use client";

import { useState, useEffect } from 'react';
import { useAuth } from '@/lib/contexts/auth-context';
import { 
  StarIcon,
  ChartBarIcon,
  TrophyIcon,
  UserGroupIcon,
  ClipboardDocumentListIcon,
  PencilIcon,
  EyeIcon,
  PlusIcon,
  FunnelIcon
} from '@heroicons/react/24/outline';

interface PerformanceEvaluation {
  id: number;
  staffId: number;
  staffName: string;
  position: string;
  department: string;
  evaluationPeriod: string;
  evaluator: string;
  scores: {
    technical: number;
    communication: number;
    teamwork: number;
    reliability: number;
    initiative: number;
  };
  overallScore: number;
  strengths: string[];
  areasForImprovement: string[];
  goals: string[];
  comments: string;
  status: 'draft' | 'completed' | 'reviewed';
  createdDate: string;
  lastUpdated: string;
}

const EVALUATION_CRITERIA = [
  { key: 'technical', label: 'Kỹ năng chuyên môn', weight: 0.3 },
  { key: 'communication', label: 'Giao tiếp', weight: 0.2 },
  { key: 'teamwork', label: 'Làm việc nhóm', weight: 0.2 },
  { key: 'reliability', label: 'Độ tin cậy', weight: 0.15 },
  { key: 'initiative', label: 'Chủ động sáng tạo', weight: 0.15 }
];

export default function PerformancePage() {
  const { user } = useAuth();
  const [evaluations, setEvaluations] = useState<PerformanceEvaluation[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [departmentFilter, setDepartmentFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [selectedEvaluation, setSelectedEvaluation] = useState<PerformanceEvaluation | null>(null);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [showCreateModal, setShowCreateModal] = useState(false);

  useEffect(() => {
    loadEvaluations();
  }, []);

  const loadEvaluations = () => {
    // Mock data - trong thực tế sẽ load từ API
    const mockEvaluations: PerformanceEvaluation[] = [
      {
        id: 1,
        staffId: 1,
        staffName: 'Nguyễn Văn A',
        position: 'Y tá',
        department: 'Y tế',
        evaluationPeriod: 'Q4 2023',
        evaluator: 'Trưởng khoa Y tế',
        scores: {
          technical: 85,
          communication: 88,
          teamwork: 82,
          reliability: 90,
          initiative: 78
        },
        overallScore: 84.6,
        strengths: [
          'Kỹ năng chuyên môn vững vàng',
          'Giao tiếp tốt với bệnh nhân',
          'Làm việc có trách nhiệm'
        ],
        areasForImprovement: [
          'Cần chủ động hơn trong đề xuất cải tiến',
          'Tăng cường kỹ năng lãnh đạo nhóm'
        ],
        goals: [
          'Tham gia khóa đào tạo lãnh đạo',
          'Đề xuất ít nhất 2 ý tưởng cải tiến quy trình'
        ],
        comments: 'Nhân viên có năng lực, cần hỗ trợ phát triển thêm kỹ năng mềm.',
        status: 'completed',
        createdDate: '2023-12-15',
        lastUpdated: '2023-12-20'
      },
      {
        id: 2,
        staffId: 2,
        staffName: 'Trần Thị B',
        position: 'Người chăm sóc',
        department: 'Chăm sóc người cao tuổi',
        evaluationPeriod: 'Q4 2023',
        evaluator: 'Quản lý Chăm sóc',
        scores: {
          technical: 78,
          communication: 92,
          teamwork: 88,
          reliability: 85,
          initiative: 82
        },
        overallScore: 84.0,
        strengths: [
          'Giao tiếp xuất sắc với người cao tuổi và gia đình',
          'Tinh thần trách nhiệm cao',
          'Làm việc nhóm hiệu quả'
        ],
        areasForImprovement: [
          'Nâng cao kỹ năng kỹ thuật chăm sóc',
          'Tăng tính chủ động trong công việc'
        ],
        goals: [
          'Hoàn thành khóa đào tạo chăm sóc nâng cao',
          'Hỗ trợ đào tạo nhân viên mới'
        ],
        comments: 'Có tài năng giao tiếp, phù hợp với vai trò tương tác với gia đình.',
        status: 'reviewed',
        createdDate: '2023-12-10',
        lastUpdated: '2023-12-22'
      }
    ];
    setEvaluations(mockEvaluations);
  };

  const filteredEvaluations = evaluations.filter(evaluation => {
    const matchesSearch = evaluation.staffName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         evaluation.position.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesDepartment = !departmentFilter || evaluation.department === departmentFilter;
    const matchesStatus = !statusFilter || evaluation.status === statusFilter;
    
    return matchesSearch && matchesDepartment && matchesStatus;
  });

  const getScoreColor = (score: number) => {
    if (score >= 90) return '#10b981';
    if (score >= 80) return '#3b82f6';
    if (score >= 70) return '#f59e0b';
    return '#ef4444';
  };

  const getScoreLabel = (score: number) => {
    if (score >= 90) return 'Xuất sắc';
    if (score >= 80) return 'Tốt';
    if (score >= 70) return 'Khá';
    if (score >= 60) return 'Trung bình';
    return 'Cần cải thiện';
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'draft': return 'Nháp';
      case 'completed': return 'Hoàn thành';
      case 'reviewed': return 'Đã duyệt';
      default: return status;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'draft': return '#6b7280';
      case 'completed': return '#3b82f6';
      case 'reviewed': return '#10b981';
      default: return '#6b7280';
    }
  };

  return (
    <div style={{
      minHeight: '100vh',
      background: 'linear-gradient(135deg, #f8fafc 0%, #e2e8f0 100%)',
      padding: '2rem'
    }}>
      <div style={{ maxWidth: '1400px', margin: '0 auto' }}>
        {/* Header */}
        <div style={{
          background: 'white',
          borderRadius: '1rem',
          padding: '2rem',
          marginBottom: '2rem',
          boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '1rem' }}>
                <TrophyIcon style={{ width: '2rem', height: '2rem', color: '#3b82f6' }} />
                <h1 style={{
                  fontSize: '1.875rem',
                  fontWeight: 700,
                  background: 'linear-gradient(135deg, #3b82f6 0%, #8b5cf6 100%)',
                  WebkitBackgroundClip: 'text',
                  WebkitTextFillColor: 'transparent',
                  margin: 0
                }}>
                  Đánh Giá Hiệu Suất
                </h1>
              </div>
              <p style={{ color: '#6b7280', margin: 0 }}>
                Theo dõi và đánh giá hiệu suất làm việc của đội ngũ nhân viên
              </p>
            </div>
            <button
              onClick={() => setShowCreateModal(true)}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem',
                padding: '0.75rem 1.5rem',
                background: 'linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)',
                color: 'white',
                border: 'none',
                borderRadius: '0.75rem',
                fontSize: '0.875rem',
                fontWeight: 600,
                cursor: 'pointer',
                boxShadow: '0 4px 6px -1px rgba(59, 130, 246, 0.3)'
              }}
            >
              <PlusIcon style={{ width: '1rem', height: '1rem' }} />
              Đánh giá mới
            </button>
          </div>
        </div>

        {/* Statistics */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
          gap: '1.5rem',
          marginBottom: '2rem'
        }}>
          <div style={{
            background: 'white',
            borderRadius: '1rem',
            padding: '1.5rem',
            boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1rem' }}>
              <ChartBarIcon style={{ width: '1.5rem', height: '1.5rem', color: '#10b981' }} />
              <h3 style={{ fontSize: '1rem', fontWeight: 600, color: '#1f2937', margin: 0 }}>
                Điểm trung bình
              </h3>
            </div>
            <p style={{ fontSize: '2rem', fontWeight: 700, color: '#10b981', margin: 0 }}>
              {evaluations.length > 0 
                ? (evaluations.reduce((sum, e) => sum + e.overallScore, 0) / evaluations.length).toFixed(1)
                : '0.0'
              }
            </p>
            <p style={{ fontSize: '0.875rem', color: '#6b7280', margin: '0.5rem 0 0 0' }}>
              Trên thang điểm 100
            </p>
          </div>

          <div style={{
            background: 'white',
            borderRadius: '1rem',
            padding: '1.5rem',
            boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1rem' }}>
              <StarIcon style={{ width: '1.5rem', height: '1.5rem', color: '#f59e0b' }} />
              <h3 style={{ fontSize: '1rem', fontWeight: 600, color: '#1f2937', margin: 0 }}>
                Hiệu suất cao
              </h3>
            </div>
            <p style={{ fontSize: '2rem', fontWeight: 700, color: '#f59e0b', margin: 0 }}>
              {evaluations.filter(e => e.overallScore >= 85).length}
            </p>
            <p style={{ fontSize: '0.875rem', color: '#6b7280', margin: '0.5rem 0 0 0' }}>
              Nhân viên đạt ≥85 điểm
            </p>
          </div>

          <div style={{
            background: 'white',
            borderRadius: '1rem',
            padding: '1.5rem',
            boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1rem' }}>
              <ClipboardDocumentListIcon style={{ width: '1.5rem', height: '1.5rem', color: '#3b82f6' }} />
              <h3 style={{ fontSize: '1rem', fontWeight: 600, color: '#1f2937', margin: 0 }}>
                Đã hoàn thành
              </h3>
            </div>
            <p style={{ fontSize: '2rem', fontWeight: 700, color: '#3b82f6', margin: 0 }}>
              {evaluations.filter(e => e.status === 'completed' || e.status === 'reviewed').length}
            </p>
            <p style={{ fontSize: '0.875rem', color: '#6b7280', margin: '0.5rem 0 0 0' }}>
              Đánh giá đã hoàn thành
            </p>
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
                placeholder="Tên nhân viên hoặc chức vụ..."
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
                Phòng ban
              </label>
              <select
                value={departmentFilter}
                onChange={(e) => setDepartmentFilter(e.target.value)}
                style={{
                  width: '100%',
                  padding: '0.75rem',
                  border: '1px solid #d1d5db',
                  borderRadius: '0.5rem',
                  fontSize: '0.875rem',
                  background: 'white'
                }}
              >
                <option value="">Tất cả phòng ban</option>
                <option value="Y tế">Y tế</option>
                <option value="Chăm sóc người cao tuổi">Chăm sóc người cao tuổi</option>
                <option value="Phục hồi chức năng">Phục hồi chức năng</option>
                <option value="Hoạt động">Hoạt động</option>
                <option value="Quản lý">Quản lý</option>
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
                Trạng thái
              </label>
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
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
                <option value="draft">Nháp</option>
                <option value="completed">Hoàn thành</option>
                <option value="reviewed">Đã duyệt</option>
              </select>
            </div>
          </div>
        </div>

        {/* Evaluations List */}
        <div style={{
          display: 'grid',
          gap: '1.5rem'
        }}>
          {filteredEvaluations.map((evaluation) => (
            <div key={evaluation.id} style={{
              background: 'white',
              borderRadius: '1rem',
              padding: '1.5rem',
              boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
              border: '1px solid #e5e7eb'
            }}>
              <div style={{
                display: 'grid',
                gridTemplateColumns: '1fr auto',
                gap: '1rem',
                alignItems: 'flex-start'
              }}>
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '1rem' }}>
                    <div>
                      <h3 style={{
                        fontSize: '1.25rem',
                        fontWeight: 700,
                        color: '#1f2937',
                        margin: 0
                      }}>
                        {evaluation.staffName}
                      </h3>
                      <p style={{
                        fontSize: '0.875rem',
                        color: '#6b7280',
                        margin: '0.25rem 0 0 0'
                      }}>
                        {evaluation.position} • {evaluation.department}
                      </p>
                    </div>
                    <span style={{
                      padding: '0.25rem 0.75rem',
                      borderRadius: '0.375rem',
                      fontSize: '0.75rem',
                      fontWeight: 600,
                      background: `${getStatusColor(evaluation.status)}20`,
                      color: getStatusColor(evaluation.status)
                    }}>
                      {getStatusText(evaluation.status)}
                    </span>
                  </div>

                  <div style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))',
                    gap: '1rem',
                    marginBottom: '1rem'
                  }}>
                    <div>
                      <p style={{
                        fontSize: '0.875rem',
                        color: '#6b7280',
                        margin: '0 0 0.25rem 0'
                      }}>
                        Kỳ đánh giá
                      </p>
                      <p style={{
                        fontSize: '0.875rem',
                        fontWeight: 600,
                        color: '#1f2937',
                        margin: 0
                      }}>
                        {evaluation.evaluationPeriod}
                      </p>
                    </div>
                    <div>
                      <p style={{
                        fontSize: '0.875rem',
                        color: '#6b7280',
                        margin: '0 0 0.25rem 0'
                      }}>
                        Người đánh giá
                      </p>
                      <p style={{
                        fontSize: '0.875rem',
                        fontWeight: 600,
                        color: '#1f2937',
                        margin: 0
                      }}>
                        {evaluation.evaluator}
                      </p>
                    </div>
                    <div>
                      <p style={{
                        fontSize: '0.875rem',
                        color: '#6b7280',
                        margin: '0 0 0.25rem 0'
                      }}>
                        Điểm tổng
                      </p>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <span style={{
                          fontSize: '1.25rem',
                          fontWeight: 700,
                          color: getScoreColor(evaluation.overallScore)
                        }}>
                          {evaluation.overallScore.toFixed(1)}
                        </span>
                        <span style={{
                          fontSize: '0.75rem',
                          padding: '0.125rem 0.5rem',
                          borderRadius: '0.25rem',
                          background: `${getScoreColor(evaluation.overallScore)}20`,
                          color: getScoreColor(evaluation.overallScore),
                          fontWeight: 600
                        }}>
                          {getScoreLabel(evaluation.overallScore)}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Score Bars */}
                  <div style={{ marginBottom: '1rem' }}>
                    <p style={{
                      fontSize: '0.875rem',
                      fontWeight: 600,
                      color: '#374151',
                      margin: '0 0 0.75rem 0'
                    }}>
                      Chi tiết điểm số:
                    </p>
                    <div style={{
                      display: 'grid',
                      gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
                      gap: '0.75rem'
                    }}>
                      {EVALUATION_CRITERIA.map((criteria) => {
                        const score = evaluation.scores[criteria.key as keyof typeof evaluation.scores];
                        return (
                          <div key={criteria.key}>
                            <div style={{
                              display: 'flex',
                              justifyContent: 'space-between',
                              alignItems: 'center',
                              marginBottom: '0.25rem'
                            }}>
                              <span style={{
                                fontSize: '0.75rem',
                                color: '#6b7280'
                              }}>
                                {criteria.label}
                              </span>
                              <span style={{
                                fontSize: '0.75rem',
                                fontWeight: 600,
                                color: getScoreColor(score)
                              }}>
                                {score}
                              </span>
                            </div>
                            <div style={{
                              width: '100%',
                              height: '0.25rem',
                              background: '#f3f4f6',
                              borderRadius: '0.125rem',
                              overflow: 'hidden'
                            }}>
                              <div style={{
                                width: `${score}%`,
                                height: '100%',
                                background: getScoreColor(score),
                                borderRadius: '0.125rem'
                              }} />
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </div>

                <div style={{ display: 'flex', gap: '0.75rem' }}>
                  <button
                    onClick={() => {
                      setSelectedEvaluation(evaluation);
                      setShowDetailModal(true);
                    }}
                    style={{
                      padding: '0.5rem',
                      background: '#f8fafc',
                      border: '1px solid #e2e8f0',
                      borderRadius: '0.5rem',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center'
                    }}
                  >
                    <EyeIcon style={{ width: '1rem', height: '1rem', color: '#3b82f6' }} />
                  </button>
                  <button
                    style={{
                      padding: '0.5rem',
                      background: '#f8fafc',
                      border: '1px solid #e2e8f0',
                      borderRadius: '0.5rem',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center'
                    }}
                  >
                    <PencilIcon style={{ width: '1rem', height: '1rem', color: '#6b7280' }} />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>

        {filteredEvaluations.length === 0 && (
          <div style={{
            background: 'white',
            borderRadius: '1rem',
            padding: '3rem',
            textAlign: 'center',
            boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
          }}>
            <TrophyIcon style={{
              width: '3rem',
              height: '3rem',
              margin: '0 auto 1rem',
              color: '#d1d5db'
            }} />
            <p style={{ fontSize: '1.125rem', fontWeight: 500, color: '#6b7280', margin: 0 }}>
              Không tìm thấy đánh giá nào
            </p>
            <p style={{ color: '#9ca3af', margin: '0.5rem 0 0 0' }}>
              Thử thay đổi bộ lọc hoặc tạo đánh giá mới
            </p>
          </div>
        )}

        {/* Detail Modal */}
        {showDetailModal && selectedEvaluation && (
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
            padding: '1rem'
          }}>
            <div style={{
              background: 'white',
              borderRadius: '1rem',
              padding: '2rem',
              maxWidth: '800px',
              width: '100%',
              maxHeight: '90vh',
              overflowY: 'auto'
            }}>
              <div style={{
                display: 'flex',
                justifyContent: 'between',
                alignItems: 'center',
                marginBottom: '2rem'
              }}>
                <h2 style={{
                  fontSize: '1.5rem',
                  fontWeight: 700,
                  color: '#1f2937',
                  margin: 0
                }}>
                  Chi tiết đánh giá - {selectedEvaluation.staffName}
                </h2>
                <button
                  onClick={() => setShowDetailModal(false)}
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

              <div style={{ display: 'grid', gap: '2rem' }}>
                <div>
                  <h3 style={{
                    fontSize: '1.125rem',
                    fontWeight: 600,
                    color: '#1f2937',
                    marginBottom: '1rem'
                  }}>
                    Điểm mạnh
                  </h3>
                  <ul style={{ margin: 0, paddingLeft: '1.5rem' }}>
                    {selectedEvaluation.strengths.map((strength, index) => (
                      <li key={index} style={{
                        color: '#374151',
                        marginBottom: '0.5rem'
                      }}>
                        {strength}
                      </li>
                    ))}
                  </ul>
                </div>

                <div>
                  <h3 style={{
                    fontSize: '1.125rem',
                    fontWeight: 600,
                    color: '#1f2937',
                    marginBottom: '1rem'
                  }}>
                    Điểm cần cải thiện
                  </h3>
                  <ul style={{ margin: 0, paddingLeft: '1.5rem' }}>
                    {selectedEvaluation.areasForImprovement.map((area, index) => (
                      <li key={index} style={{
                        color: '#374151',
                        marginBottom: '0.5rem'
                      }}>
                        {area}
                      </li>
                    ))}
                  </ul>
                </div>

                <div>
                  <h3 style={{
                    fontSize: '1.125rem',
                    fontWeight: 600,
                    color: '#1f2937',
                    marginBottom: '1rem'
                  }}>
                    Mục tiêu phát triển
                  </h3>
                  <ul style={{ margin: 0, paddingLeft: '1.5rem' }}>
                    {selectedEvaluation.goals.map((goal, index) => (
                      <li key={index} style={{
                        color: '#374151',
                        marginBottom: '0.5rem'
                      }}>
                        {goal}
                      </li>
                    ))}
                  </ul>
                </div>

                <div>
                  <h3 style={{
                    fontSize: '1.125rem',
                    fontWeight: 600,
                    color: '#1f2937',
                    marginBottom: '1rem'
                  }}>
                    Nhận xét tổng quan
                  </h3>
                  <p style={{
                    color: '#374151',
                    lineHeight: 1.6,
                    margin: 0
                  }}>
                    {selectedEvaluation.comments}
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
} 
