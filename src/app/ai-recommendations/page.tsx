"use client";

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth-context';
import { 
  SparklesIcon,
  UserIcon,
  CalendarIcon,
  ClockIcon,
  StarIcon,
  LightBulbIcon,
  ExclamationTriangleIcon,
  AdjustmentsHorizontalIcon,
  ChartBarIcon,
  EyeIcon,
  PlusIcon
} from '@heroicons/react/24/outline';
import { 
  aiRecommendationEngine, 
  convertToAIProfile, 
  AIRecommendation 
} from '@/lib/ai-recommendations';
import { RESIDENTS_DATA } from '@/lib/residents-data';

export default function AIRecommendationsPage() {
  const router = useRouter();
  const { user } = useAuth();
  const [selectedResident, setSelectedResident] = useState<number | null>(null);
  const [timeOfDay, setTimeOfDay] = useState<string>('morning');
  const [recommendations, setRecommendations] = useState<AIRecommendation[]>([]);
  const [groupRecommendations, setGroupRecommendations] = useState<AIRecommendation[]>([]);
  const [selectedResidents, setSelectedResidents] = useState<number[]>([]);
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<'individual' | 'group'>('individual');
  const [residents, setResidents] = useState<any[]>([]);

  // Check access permissions
  useEffect(() => {
    if (!user) {
      router.push('/login');
      return;
    }
    
    if (!['admin', 'staff'].includes(user.role)) {
      router.push('/');
      return;
    }
  }, [user, router]);

  useEffect(() => {
    // Load residents and initialize AI engine
    const savedResidents = localStorage.getItem('nurseryHomeResidents');
    const residentData = savedResidents ? JSON.parse(savedResidents) : RESIDENTS_DATA;
    setResidents(residentData);

    // Load resident profiles into AI engine
    residentData.forEach((resident: any) => {
      const aiProfile = convertToAIProfile({
        ...resident,
        conditions: resident.conditions || ['diabetes', 'arthritis'],
        mobilityLevel: resident.mobilityLevel || 'medium',
        cognitiveLevel: resident.cognitiveLevel || 'normal',
        socialPreferences: resident.socialPreferences || 'mixed',
        activityPreferences: resident.activityPreferences || ['Thể chất', 'Sáng tạo'],
        participationHistory: resident.participationHistory || [
          {
            activityId: 1,
            activityName: 'Tập thể dục buổi sáng',
            date: '2024-01-10',
            participationLevel: 'full',
            enjoymentRating: 4,
            behaviorNotes: 'Tích cực tham gia',
            healthImpact: 'positive'
          }
        ],
        medicalRestrictions: resident.medicalRestrictions || [],
        personalInterests: resident.personalInterests || ['âm nhạc', 'vẽ tranh'],
        physicalLimitations: resident.physicalLimitations || [],
        emotionalState: resident.emotionalState || 'calm',
        sleepPattern: resident.sleepPattern || 'good',
        nutritionLevel: resident.nutritionLevel || 'good'
      });
      aiRecommendationEngine.loadResidentProfile(aiProfile);
    });
  }, []);

  const generateIndividualRecommendations = async () => {
    if (!selectedResident) return;
    
    setLoading(true);
    try {
      // Simulate AI processing delay
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      const recs = aiRecommendationEngine.generateRecommendations(selectedResident, timeOfDay);
      setRecommendations(recs);
    } catch (error) {
      console.error('Error generating recommendations:', error);
      alert('Có lỗi xảy ra khi tạo gợi ý. Vui lòng thử lại.');
    } finally {
      setLoading(false);
    }
  };

  const generateGroupRecommendations = async () => {
    if (selectedResidents.length < 2) {
      alert('Vui lòng chọn ít nhất 2 cư dân để tạo gợi ý nhóm');
      return;
    }
    
    setLoading(true);
    try {
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      const groupRecs = aiRecommendationEngine.generateGroupRecommendations(selectedResidents, timeOfDay);
      setGroupRecommendations(groupRecs);
    } catch (error) {
      console.error('Error generating group recommendations:', error);
      alert('Có lỗi xảy ra khi tạo gợi ý nhóm. Vui lòng thử lại.');
    } finally {
      setLoading(false);
    }
  };

  const handleResidentToggle = (residentId: number) => {
    setSelectedResidents(prev => 
      prev.includes(residentId) 
        ? prev.filter(id => id !== residentId)
        : [...prev, residentId]
    );
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high': return { bg: '#fee2e2', text: '#dc2626', border: '#fecaca' };
      case 'medium': return { bg: '#fef3c7', text: '#d97706', border: '#fde68a' };
      case 'low': return { bg: '#dcfce7', text: '#16a34a', border: '#bbf7d0' };
      default: return { bg: '#f3f4f6', text: '#6b7280', border: '#e5e7eb' };
    }
  };

  const getSelectedResidentNames = () => {
    return selectedResidents.map(id => {
      const resident = residents.find(r => r.id === id);
      return resident?.name || '';
    }).join(', ');
  };

  const handleCreateActivity = (recommendation: AIRecommendation) => {
    // Store recommendation data for the new activity form
    localStorage.setItem('aiRecommendationData', JSON.stringify(recommendation));
    router.push('/activities/new?source=ai');
  };

  return (
    <div style={{
      minHeight: '100vh',
      background: 'linear-gradient(135deg, #f8fafc 0%, #e2e8f0 100%)',
      position: 'relative'
    }}>
      {/* Background decorations */}
      <div style={{
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        background: `
          radial-gradient(circle at 20% 80%, rgba(139, 92, 246, 0.05) 0%, transparent 50%),
          radial-gradient(circle at 80% 20%, rgba(59, 130, 246, 0.05) 0%, transparent 50%),
          radial-gradient(circle at 40% 40%, rgba(16, 185, 129, 0.03) 0%, transparent 50%)
        `,
        pointerEvents: 'none'
      }} />

      <div style={{
        maxWidth: '1400px',
        margin: '0 auto',
        padding: '2rem 1.5rem',
        position: 'relative',
        zIndex: 1
      }}>
        {/* Header */}
        <div style={{
          background: 'linear-gradient(135deg, #ffffff 0%, #f8fafc 100%)',
          borderRadius: '1.5rem',
          padding: '2rem',
          marginBottom: '2rem',
          boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.1), 0 0 0 1px rgba(255, 255, 255, 0.05)',
          border: '1px solid rgba(255, 255, 255, 0.2)',
          backdropFilter: 'blur(10px)'
        }}>
          <div style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            flexWrap: 'wrap',
            gap: '1rem'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
              <div style={{
                width: '3.5rem',
                height: '3.5rem',
                background: 'linear-gradient(135deg, #8b5cf6 0%, #7c3aed 100%)',
                borderRadius: '1rem',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                boxShadow: '0 4px 12px rgba(139, 92, 246, 0.3)'
              }}>
                <SparklesIcon style={{ width: '2rem', height: '2rem', color: 'white' }} />
              </div>
              <div>
                <h1 style={{
                  fontSize: '2rem',
                  fontWeight: 700,
                  margin: 0,
                  background: 'linear-gradient(135deg, #8b5cf6 0%, #7c3aed 100%)',
                  WebkitBackgroundClip: 'text',
                  WebkitTextFillColor: 'transparent',
                  letterSpacing: '-0.025em'
                }}>
                  Trợ lý thông minh
                </h1>
                <p style={{
                  fontSize: '1rem',
                  color: '#64748b',
                  margin: '0.25rem 0 0 0',
                  fontWeight: 500
                }}>
                  Hệ thống AI phân tích sở thích và tình trạng sức khỏe để đưa ra gợi ý chương trình phù hợp
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Tab Navigation */}
        <div style={{
          background: 'white',
          borderRadius: '1rem',
          padding: '1.5rem',
          marginBottom: '2rem',
          boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
          border: '1px solid rgba(255, 255, 255, 0.2)'
        }}>
          <div style={{
            display: 'flex',
            gap: '1rem',
            marginBottom: '1.5rem'
          }}>
            <button
              onClick={() => setActiveTab('individual')}
              style={{
                padding: '0.75rem 1.5rem',
                borderRadius: '0.5rem',
                border: 'none',
                background: activeTab === 'individual' 
                  ? 'linear-gradient(135deg, #8b5cf6 0%, #7c3aed 100%)' 
                  : '#f3f4f6',
                color: activeTab === 'individual' ? 'white' : '#6b7280',
                fontWeight: 600,
                cursor: 'pointer',
                transition: 'all 0.2s ease'
              }}
            >
              Gợi ý cá nhân
            </button>
            <button
              onClick={() => setActiveTab('group')}
              style={{
                padding: '0.75rem 1.5rem',
                borderRadius: '0.5rem',
                border: 'none',
                background: activeTab === 'group' 
                  ? 'linear-gradient(135deg, #8b5cf6 0%, #7c3aed 100%)' 
                  : '#f3f4f6',
                color: activeTab === 'group' ? 'white' : '#6b7280',
                fontWeight: 600,
                cursor: 'pointer',
                transition: 'all 0.2s ease'
              }}
            >
              Gợi ý nhóm
            </button>
          </div>

          {/* Individual Tab */}
          {activeTab === 'individual' && (
            <div>
              <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
                gap: '1rem',
                marginBottom: '1.5rem'
              }}>
                <div>
                  <label style={{
                    display: 'block',
                    fontSize: '0.875rem',
                    fontWeight: 600,
                    color: '#374151',
                    marginBottom: '0.5rem'
                  }}>
                    Chọn người cao tuổi
                  </label>
                  <select
                    value={selectedResident || ''}
                    onChange={(e) => setSelectedResident(Number(e.target.value))}
                    style={{
                      width: '100%',
                      padding: '0.75rem',
                      borderRadius: '0.5rem',
                      border: '1px solid #d1d5db',
                      fontSize: '0.875rem',
                      background: 'white'
                    }}
                  >
                    <option value="">Chọn người cao tuổi...</option>
                    {residents.map(resident => (
                      <option key={resident.id} value={resident.id}>
                        {resident.name} - Phòng {resident.room}
                      </option>
                    ))}
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
                    Thời gian trong ngày
                  </label>
                  <select
                    value={timeOfDay}
                    onChange={(e) => setTimeOfDay(e.target.value)}
                    style={{
                      width: '100%',
                      padding: '0.75rem',
                      borderRadius: '0.5rem',
                      border: '1px solid #d1d5db',
                      fontSize: '0.875rem',
                      background: 'white'
                    }}
                  >
                    <option value="morning">Buổi sáng (8:00-11:00)</option>
                    <option value="afternoon">Buổi chiều (14:00-17:00)</option>
                    <option value="evening">Buổi tối (19:00-21:00)</option>
                  </select>
                </div>
              </div>

              <button
                onClick={generateIndividualRecommendations}
                disabled={!selectedResident || loading}
                style={{
                  padding: '0.875rem 2rem',
                  borderRadius: '0.75rem',
                  border: 'none',
                  background: selectedResident && !loading 
                    ? 'linear-gradient(135deg, #8b5cf6 0%, #7c3aed 100%)' 
                    : '#9ca3af',
                  color: 'white',
                  fontWeight: 600,
                  cursor: selectedResident && !loading ? 'pointer' : 'not-allowed',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.5rem',
                  transition: 'all 0.2s ease'
                }}
              >
                {loading ? (
                  <>
                    <div style={{
                      width: '1rem',
                      height: '1rem',
                      border: '2px solid transparent',
                      borderTop: '2px solid white',
                      borderRadius: '50%',
                      animation: 'spin 1s linear infinite'
                    }} />
                    Đang phân tích...
                  </>
                ) : (
                  <>
                    <SparklesIcon style={{ width: '1rem', height: '1rem' }} />
                    Tạo gợi ý AI
                  </>
                )}
              </button>
            </div>
          )}

          {/* Group Tab */}
          {activeTab === 'group' && (
            <div>
              <div style={{ marginBottom: '1.5rem' }}>
                <label style={{
                  display: 'block',
                  fontSize: '0.875rem',
                  fontWeight: 600,
                  color: '#374151',
                  marginBottom: '0.5rem'
                }}>
                  Chọn cư dân (tối thiểu 2 người)
                </label>
                <div style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fill, minmax(250px, 1fr))',
                  gap: '0.5rem',
                  maxHeight: '200px',
                  overflow: 'auto',
                  padding: '0.5rem',
                  border: '1px solid #d1d5db',
                  borderRadius: '0.5rem',
                  background: '#f9fafb'
                }}>
                  {residents.map(resident => (
                    <label
                      key={resident.id}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.5rem',
                        padding: '0.5rem',
                        borderRadius: '0.25rem',
                        background: selectedResidents.includes(resident.id) ? '#e0e7ff' : 'white',
                        cursor: 'pointer',
                        transition: 'all 0.2s ease'
                      }}
                    >
                      <input
                        type="checkbox"
                        checked={selectedResidents.includes(resident.id)}
                        onChange={() => handleResidentToggle(resident.id)}
                        style={{ margin: 0 }}
                      />
                      <span style={{ fontSize: '0.875rem', fontWeight: 500 }}>
                        {resident.name}
                      </span>
                      <span style={{ fontSize: '0.75rem', color: '#6b7280' }}>
                        Phòng {resident.room}
                      </span>
                    </label>
                  ))}
                </div>
                {selectedResidents.length > 0 && (
                  <p style={{
                    fontSize: '0.875rem',
                    color: '#6b7280',
                    marginTop: '0.5rem'
                  }}>
                    Đã chọn: {getSelectedResidentNames()}
                  </p>
                )}
              </div>

              <div style={{ marginBottom: '1.5rem' }}>
                <label style={{
                  display: 'block',
                  fontSize: '0.875rem',
                  fontWeight: 600,
                  color: '#374151',
                  marginBottom: '0.5rem'
                }}>
                  Thời gian trong ngày
                </label>
                <select
                  value={timeOfDay}
                  onChange={(e) => setTimeOfDay(e.target.value)}
                  style={{
                    width: '300px',
                    padding: '0.75rem',
                    borderRadius: '0.5rem',
                    border: '1px solid #d1d5db',
                    fontSize: '0.875rem',
                    background: 'white'
                  }}
                >
                  <option value="morning">Buổi sáng (8:00-11:00)</option>
                  <option value="afternoon">Buổi chiều (14:00-17:00)</option>
                  <option value="evening">Buổi tối (19:00-21:00)</option>
                </select>
              </div>

              <button
                onClick={generateGroupRecommendations}
                disabled={selectedResidents.length < 2 || loading}
                style={{
                  padding: '0.875rem 2rem',
                  borderRadius: '0.75rem',
                  border: 'none',
                  background: selectedResidents.length >= 2 && !loading 
                    ? 'linear-gradient(135deg, #8b5cf6 0%, #7c3aed 100%)' 
                    : '#9ca3af',
                  color: 'white',
                  fontWeight: 600,
                  cursor: selectedResidents.length >= 2 && !loading ? 'pointer' : 'not-allowed',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.5rem',
                  transition: 'all 0.2s ease'
                }}
              >
                {loading ? (
                  <>
                    <div style={{
                      width: '1rem',
                      height: '1rem',
                      border: '2px solid transparent',
                      borderTop: '2px solid white',
                      borderRadius: '50%',
                      animation: 'spin 1s linear infinite'
                    }} />
                    Đang phân tích nhóm...
                  </>
                ) : (
                  <>
                    <SparklesIcon style={{ width: '1rem', height: '1rem' }} />
                    Tạo gợi ý nhóm AI
                  </>
                )}
              </button>
            </div>
          )}
        </div>

        {/* Recommendations Results */}
        {(recommendations.length > 0 || groupRecommendations.length > 0) && (
          <div style={{
            background: 'white',
            borderRadius: '1rem',
            padding: '1.5rem',
            boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
            border: '1px solid rgba(255, 255, 255, 0.2)'
          }}>
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '1rem',
              marginBottom: '1.5rem'
            }}>
              <LightBulbIcon style={{ width: '1.5rem', height: '1.5rem', color: '#f59e0b' }} />
              <h2 style={{
                fontSize: '1.25rem',
                fontWeight: 600,
                margin: 0
              }}>
                Kết quả gợi ý AI
              </h2>
            </div>

            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fill, minmax(400px, 1fr))',
              gap: '1.5rem'
            }}>
              {(activeTab === 'individual' ? recommendations : groupRecommendations).map((rec, index) => {
                const priorityColor = getPriorityColor(rec.priority);
                
                return (
                  <div
                    key={index}
                    style={{
                      background: 'linear-gradient(135deg, #ffffff 0%, #f8fafc 100%)',
                      borderRadius: '1rem',
                      padding: '1.5rem',
                      border: `2px solid ${priorityColor.border}`,
                      boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
                      transition: 'all 0.2s ease'
                    }}
                  >
                    {/* Header */}
                    <div style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'flex-start',
                      marginBottom: '1rem'
                    }}>
                      <div>
                        <h3 style={{
                          fontSize: '1.125rem',
                          fontWeight: 600,
                          margin: 0,
                          marginBottom: '0.25rem'
                        }}>
                          {rec.activityName}
                        </h3>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                          <span style={{
                            padding: '0.25rem 0.75rem',
                            borderRadius: '9999px',
                            background: priorityColor.bg,
                            color: priorityColor.text,
                            fontSize: '0.75rem',
                            fontWeight: 600
                          }}>
                            {rec.priority === 'high' ? 'Ưu tiên cao' : 
                             rec.priority === 'medium' ? 'Ưu tiên trung bình' : 'Ưu tiên thấp'}
                          </span>
                        </div>
                      </div>
                      <div style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.25rem'
                      }}>
                        <StarIcon style={{ width: '1rem', height: '1rem', color: '#f59e0b' }} />
                        <span style={{ 
                          fontSize: '1rem', 
                          fontWeight: 600, 
                          color: '#f59e0b' 
                        }}>
                          {rec.recommendationScore}/100
                        </span>
                      </div>
                    </div>

                    {/* Metrics */}
                    <div style={{
                      display: 'grid',
                      gridTemplateColumns: 'repeat(2, 1fr)',
                      gap: '1rem',
                      marginBottom: '1rem'
                    }}>
                      <div style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.5rem'
                      }}>
                        <ClockIcon style={{ width: '1rem', height: '1rem', color: '#6b7280' }} />
                        <span style={{ fontSize: '0.875rem', color: '#6b7280' }}>
                          {rec.optimalTime}
                        </span>
                      </div>
                      <div style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.5rem'
                      }}>
                        <CalendarIcon style={{ width: '1rem', height: '1rem', color: '#6b7280' }} />
                        <span style={{ fontSize: '0.875rem', color: '#6b7280' }}>
                          {rec.suggestedDuration} phút
                        </span>
                      </div>
                    </div>

                    {/* Participants */}
                    {rec.recommendedParticipants.length > 1 && (
                      <div style={{ marginBottom: '1rem' }}>
                        <h4 style={{
                          fontSize: '0.875rem',
                          fontWeight: 600,
                          color: '#374151',
                          marginBottom: '0.5rem'
                        }}>
                          Cư dân tham gia:
                        </h4>
                        <div style={{
                          display: 'flex',
                          flexWrap: 'wrap',
                          gap: '0.5rem'
                        }}>
                          {rec.recommendedParticipants.map(participantId => {
                            const participant = residents.find(r => r.id === participantId);
                            return (
                              <span
                                key={participantId}
                                style={{
                                  padding: '0.25rem 0.5rem',
                                  background: '#e0e7ff',
                                  color: '#3730a3',
                                  borderRadius: '0.375rem',
                                  fontSize: '0.75rem'
                                }}
                              >
                                {participant?.name || `Cư dân ${participantId}`}
                              </span>
                            );
                          })}
                        </div>
                      </div>
                    )}

                    {/* Reasons */}
                    <div style={{ marginBottom: '1rem' }}>
                      <h4 style={{
                        fontSize: '0.875rem',
                        fontWeight: 600,
                        color: '#374151',
                        marginBottom: '0.5rem'
                      }}>
                        Lý do gợi ý:
                      </h4>
                      <ul style={{
                        margin: 0,
                        paddingLeft: '1rem',
                        fontSize: '0.875rem',
                        color: '#6b7280'
                      }}>
                        {rec.reasons.map((reason, idx) => (
                          <li key={idx} style={{ marginBottom: '0.25rem' }}>
                            {reason}
                          </li>
                        ))}
                      </ul>
                    </div>

                    {/* Benefits */}
                    <div style={{ marginBottom: '1rem' }}>
                      <h4 style={{
                        fontSize: '0.875rem',
                        fontWeight: 600,
                        color: '#374151',
                        marginBottom: '0.5rem'
                      }}>
                        Lợi ích:
                      </h4>
                      <div style={{
                        display: 'flex',
                        flexWrap: 'wrap',
                        gap: '0.5rem'
                      }}>
                        {rec.benefits.slice(0, 3).map((benefit, idx) => (
                          <span
                            key={idx}
                            style={{
                              padding: '0.25rem 0.5rem',
                              background: '#dcfce7',
                              color: '#166534',
                              borderRadius: '0.375rem',
                              fontSize: '0.75rem'
                            }}
                          >
                            {benefit}
                          </span>
                        ))}
                      </div>
                    </div>

                    {/* Precautions */}
                    {rec.precautions.length > 0 && (
                      <div style={{ marginBottom: '1rem' }}>
                        <h4 style={{
                          fontSize: '0.875rem',
                          fontWeight: 600,
                          color: '#ef4444',
                          marginBottom: '0.5rem',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '0.25rem'
                        }}>
                          <ExclamationTriangleIcon style={{ width: '0.875rem', height: '0.875rem' }} />
                          Lưu ý:
                        </h4>
                        <ul style={{
                          margin: 0,
                          paddingLeft: '1rem',
                          fontSize: '0.875rem',
                          color: '#ef4444'
                        }}>
                          {rec.precautions.map((precaution, idx) => (
                            <li key={idx} style={{ marginBottom: '0.25rem' }}>
                              {precaution}
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}

                    {/* Adaptations */}
                    {rec.adaptations.length > 0 && (
                      <div style={{ marginBottom: '1rem' }}>
                        <h4 style={{
                          fontSize: '0.875rem',
                          fontWeight: 600,
                          color: '#374151',
                          marginBottom: '0.5rem',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '0.25rem'
                        }}>
                          <AdjustmentsHorizontalIcon style={{ width: '0.875rem', height: '0.875rem' }} />
                          Điều chỉnh:
                        </h4>
                        <ul style={{
                          margin: 0,
                          paddingLeft: '1rem',
                          fontSize: '0.875rem',
                          color: '#6b7280'
                        }}>
                          {rec.adaptations.map((adaptation, idx) => (
                            <li key={idx} style={{ marginBottom: '0.25rem' }}>
                              {adaptation}
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}

                    {/* Confidence Level */}
                    <div style={{
                      marginBottom: '1rem',
                      padding: '0.75rem',
                      background: '#f3f4f6',
                      borderRadius: '0.5rem'
                    }}>
                      <div style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        marginBottom: '0.25rem'
                      }}>
                        <span style={{
                          fontSize: '0.875rem',
                          fontWeight: 600,
                          color: '#374151'
                        }}>
                          Độ tin cậy AI:
                        </span>
                        <span style={{
                          fontSize: '0.875rem',
                          fontWeight: 600,
                          color: '#6b7280'
                        }}>
                          {rec.confidenceLevel}%
                        </span>
                      </div>
                      <div style={{
                        width: '100%',
                        height: '6px',
                        background: '#e5e7eb',
                        borderRadius: '3px',
                        overflow: 'hidden'
                      }}>
                        <div style={{
                          width: `${rec.confidenceLevel}%`,
                          height: '100%',
                          background: rec.confidenceLevel > 80 
                            ? 'linear-gradient(90deg, #22c55e, #16a34a)'
                            : rec.confidenceLevel > 60
                            ? 'linear-gradient(90deg, #f59e0b, #d97706)'
                            : 'linear-gradient(90deg, #ef4444, #dc2626)',
                          transition: 'width 0.3s ease'
                        }} />
                      </div>
                    </div>

                    {/* Actions */}
                    <div style={{
                      display: 'flex',
                      gap: '0.5rem'
                    }}>
                      {user?.role === 'admin' || (user?.role === 'staff' && rec.recommendationScore > 60) ? (
                        <button
                          onClick={() => handleCreateActivity(rec)}
                          style={{
                            flex: 1,
                            padding: '0.75rem',
                            borderRadius: '0.5rem',
                            border: 'none',
                            background: 'linear-gradient(135deg, #16a34a 0%, #15803d 100%)',
                            color: 'white',
                            fontWeight: 600,
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            gap: '0.5rem',
                            fontSize: '0.875rem',
                            transition: 'all 0.2s ease'
                          }}
                          onMouseOver={(e) => {
                            e.currentTarget.style.transform = 'translateY(-1px)';
                            e.currentTarget.style.boxShadow = '0 4px 8px rgba(22, 163, 74, 0.3)';
                          }}
                          onMouseOut={(e) => {
                            e.currentTarget.style.transform = 'translateY(0)';
                            e.currentTarget.style.boxShadow = 'none';
                          }}
                        >
                          <PlusIcon style={{ width: '1rem', height: '1rem' }} />
                          Tạo hoạt động
                        </button>
                      ) : (
                        <div style={{
                          flex: 1,
                          padding: '0.75rem',
                          borderRadius: '0.5rem',
                          border: '1px solid #d1d5db',
                          background: '#f9fafb',
                          color: '#6b7280',
                          fontSize: '0.875rem',
                          textAlign: 'center'
                        }}>
                          {user?.role === 'staff' ? 'Cần điểm AI ≥ 60 để tạo' : 'Không có quyền'}
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Empty State */}
        {!loading && recommendations.length === 0 && groupRecommendations.length === 0 && (
          <div style={{
            background: 'white',
            borderRadius: '1rem',
            padding: '3rem',
            textAlign: 'center',
            boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
            border: '1px solid rgba(255, 255, 255, 0.2)'
          }}>
            <div style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: '1rem'
            }}>
              <SparklesIcon style={{ width: '3rem', height: '3rem', color: '#d1d5db' }} />
              <div>
                <h3 style={{
                  fontSize: '1.125rem',
                  fontWeight: 600,
                  color: '#6b7280',
                  margin: 0,
                  marginBottom: '0.5rem'
                }}>
                  Chưa có gợi ý nào
                </h3>
                <p style={{
                  fontSize: '0.875rem',
                  color: '#9ca3af',
                  margin: 0
                }}>
                  Chọn cư dân và nhấn "Tạo gợi ý AI" để nhận được các hoạt động phù hợp
                </p>
              </div>
            </div>
          </div>
        )}
      </div>

      <style jsx>{`
        @keyframes spin {
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
} 