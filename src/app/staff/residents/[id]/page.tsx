"use client";

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { 
  ArrowLeftIcon, 
  UserIcon,
  HeartIcon,
  PhoneIcon,
  CalendarIcon,
  ClipboardDocumentListIcon,
  ShieldCheckIcon,
  CheckCircleIcon,
  ExclamationCircleIcon
} from '@heroicons/react/24/outline';
import { residentAPI, userAPI } from '@/lib/api';
import { carePlansAPI } from '@/lib/api';
import { vitalSignsAPI } from '@/lib/api';
import { roomsAPI } from '@/lib/api';
import { bedsAPI } from '@/lib/api';
import { bedAssignmentsAPI } from '@/lib/api';
import { useAuth } from '@/lib/contexts/auth-context';
import { careNotesAPI } from '@/lib/api';
import { formatDateDDMMYYYY } from '@/lib/utils/validation';

import CareNotesDisplay from '@/components/staff/CareNotesDisplay';

export default function ResidentDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const router = useRouter();
  const { user } = useAuth();
  const [resident, setResident] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [refreshKey, setRefreshKey] = useState(0);
  const [activeTab, setActiveTab] = useState('overview');
  const [vitalSigns, setVitalSigns] = useState<any>(null);
  const [vitalLoading, setVitalLoading] = useState(true);
  const [careNotes, setCareNotes] = useState<any[]>([]);
  const [roomNumber, setRoomNumber] = useState<string>('Chưa hoàn tất đăng kí');
  const [roomLoading, setRoomLoading] = useState(false);
  const [carePlanAssignments, setCarePlanAssignments] = useState<any[]>([]);
  const [activeAssignments, setActiveAssignments] = useState<any[]>([]);
  const [bedNumber, setBedNumber] = useState<string>('Chưa hoàn tất đăng kí');
  const [bedLoading, setBedLoading] = useState(false);
  
  const residentId = React.use(params).id;
  
  useEffect(() => {
    const fetchResident = async () => {
      try {
        const data = await residentAPI.getById(residentId);
        const mapped = {
          id: data._id,
          name: data.full_name,
          age: data.date_of_birth ? (new Date().getFullYear() - new Date(data.date_of_birth).getFullYear()) : '',
          gender: data.gender,
          admissionDate: data.admission_date,
          dischargeDate: data.discharge_date,
          relationship: data.relationship,
          medicalHistory: data.medical_history,
          currentMedications: data.current_medications,
          allergies: data.allergies,
          emergencyContact: data.emergency_contact,
          careLevel: data.care_level,
          avatar: Array.isArray(data.avatar) ? data.avatar[0] : data.avatar || null,
          status: data.status,
          ...data
        };
        setResident(mapped);
        const assignments = await carePlansAPI.getByResidentId(residentId);
        const validAssignments = Array.isArray(assignments) 
          ? assignments.filter(assignment => assignment && assignment._id)
          : [];
        
        // Filter out expired assignments
        const now = new Date();
        const filteredActiveAssignments = validAssignments.filter((assignment: any) => {
          const notExpired = !assignment?.end_date || new Date(assignment.end_date) >= now;
          const notCancelled = !['cancelled', 'completed', 'expired'].includes(String(assignment?.status || '').toLowerCase());
          const isActive = assignment?.status === 'active' || !assignment?.status;
          return notExpired && notCancelled && isActive;
        });
        
        setCarePlanAssignments(validAssignments);
        setActiveAssignments(filteredActiveAssignments);
        setRoomLoading(true);
        try {
          try {
            const bedAssignments = await bedAssignmentsAPI.getByResidentId(residentId);
            const bedAssignment = Array.isArray(bedAssignments) ? 
              bedAssignments.find((a: any) => a.bed_id?.room_id) : null;
            
            if (bedAssignment?.bed_id?.room_id) {
              if (typeof bedAssignment.bed_id.room_id === 'object' && bedAssignment.bed_id.room_id.room_number) {
                setRoomNumber(bedAssignment.bed_id.room_id.room_number);
              } else {
                const roomId = bedAssignment.bed_id.room_id._id || bedAssignment.bed_id.room_id;
                if (roomId) {
                  const room = await roomsAPI.getById(roomId);
                  setRoomNumber(room?.room_number || 'Chưa hoàn tất đăng kí');
                } else {
                  throw new Error('No room ID found');
                }
              }
            } else {
              throw new Error('No bed assignment found');
            }
          } catch (bedError) {
            const assignment = validAssignments.find((a: any) => a.bed_id?.room_id || a.assigned_room_id);
            const roomId = assignment?.bed_id?.room_id || assignment?.assigned_room_id;
            const roomIdString = typeof roomId === 'object' && roomId?._id ? roomId._id : roomId;
            if (roomIdString) {
              const room = await roomsAPI.getById(roomIdString);
              setRoomNumber(room?.room_number || 'Chưa hoàn tất đăng kí');
            } else {
              setRoomNumber('Chưa hoàn tất đăng kí');
            }
          }
        } catch {
          setRoomNumber('Chưa hoàn tất đăng kí');
        }
        setRoomLoading(false);
        setBedLoading(true);
        try {
          try {
            const bedAssignments = await bedAssignmentsAPI.getByResidentId(residentId);
            const bedAssignment = Array.isArray(bedAssignments) ? 
              bedAssignments.find((a: any) => a.bed_id) : null;
            
            if (bedAssignment?.bed_id) {
              if (typeof bedAssignment.bed_id === 'object' && bedAssignment.bed_id.bed_number) {
                setBedNumber(bedAssignment.bed_id.bed_number);
              } else {
                const bedId = typeof bedAssignment.bed_id === 'object' && bedAssignment.bed_id?._id ? 
                  bedAssignment.bed_id._id : bedAssignment.bed_id;
                if (bedId) {
                  const bed = await bedsAPI.getById(bedId);
                  setBedNumber(bed?.bed_number || 'Chưa hoàn tất đăng kí');
                } else {
                  throw new Error('No bed ID found');
                }
              }
            } else {
              throw new Error('No bed assignment found');
            }
          } catch (bedError) {
            let currentAssignment: any = null;
            if (validAssignments.length > 0) {
              currentAssignment = validAssignments.find(a =>
                (a.resident_id?._id || a.resident_id) === residentId
              ) || validAssignments[0];
            }
            const assignedBedId = currentAssignment?.assigned_bed_id as any;
            const bedIdString = typeof assignedBedId === 'object' && assignedBedId?._id ? assignedBedId._id : assignedBedId;
            if (bedIdString) {
              try {
                const bed = await bedsAPI.getById(bedIdString);
                setBedNumber(bed?.bed_number || 'Chưa hoàn tất đăng kí');
              } catch {
                setBedNumber('Chưa hoàn tất đăng kí');
              }
            } else {
              setBedNumber('Chưa hoàn tất đăng kí');
            }
          }
        } catch {
          setBedNumber('Chưa hoàn tất đăng kí');
        }
        setBedLoading(false);
        setVitalLoading(true);
        const vitalData = await vitalSignsAPI.getByResidentId(residentId);
        setVitalSigns(Array.isArray(vitalData) && vitalData.length > 0 ? vitalData[0] : null);
        try {
          const careNotesData = await careNotesAPI.getAll({ resident_id: residentId });
          setCareNotes(Array.isArray(careNotesData) ? careNotesData : []);
        } catch {
          setCareNotes([]);
        }
      } catch (error) {
        router.push('/staff/residents');
      } finally {
        setLoading(false);
        setVitalLoading(false);
      }
    };
    fetchResident();
  }, [residentId, router, refreshKey]);
  
  const handleEditClick = () => {
    router.push(`/staff/residents/${residentId}/edit`);
  };

  const handleActionComplete = () => {
    setRefreshKey(prev => prev + 1);
  };
  
  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-200 flex items-center justify-center">
        <div className="bg-white rounded-2xl p-8 shadow-lg text-center">
          <div className="w-12 h-12 rounded-full border-3 border-gray-200 border-t-blue-500 animate-spin mx-auto mb-4" />
          <p className="text-sm text-gray-500 m-0">
            Đang tải thông tin người cao tuổi...
          </p>
        </div>
      </div>
    );
  }
  
  if (!resident) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-200 flex items-center justify-center">
        <div className="bg-white rounded-2xl p-12 shadow-lg text-center max-w-md">
          <ExclamationCircleIcon className="w-12 h-12 text-amber-500 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-gray-800 mb-2">
            Không tìm thấy người cao tuổi
          </h2>
          <p className="text-sm text-gray-500 mb-6">
            người cao tuổi này có thể đã bị xóa hoặc không tồn tại
          </p>
          <Link
            href="/staff/residents"
            className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-blue-500 to-blue-600 text-white rounded-lg text-sm font-medium no-underline"
          >
            <ArrowLeftIcon className="w-4 h-4" />
            Quay lại danh sách
          </Link>
        </div>
      </div>
    );
  }
  
  const renderCareLevel = (level: string) => {
    const colors = {
      'Cơ bản': { bg: 'bg-blue-100', text: 'text-blue-800', border: 'border-blue-200' },
      'Nâng cao': { bg: 'bg-green-100', text: 'text-green-800', border: 'border-green-200' },
      'Cao cấp': { bg: 'bg-purple-100', text: 'text-purple-800', border: 'border-purple-200' },
      'Đặc biệt': { bg: 'bg-amber-100', text: 'text-amber-800', border: 'border-amber-200' }
    };
    
    const color = colors[level as keyof typeof colors] || colors['Cơ bản'];
      
    return (
      <span className={`inline-flex items-center gap-1 px-4 py-2 text-sm font-semibold rounded-xl ${color.bg} ${color.text} border ${color.border}`}>
        <ShieldCheckIcon className="w-4 h-4" />
        {level}
      </span>
    );
  };

  const getStatusColor = (status: string) => {
    switch (status?.toLowerCase()) {
      case 'active':
      case 'đang chăm sóc':
        return { bg: 'bg-green-100', text: 'text-green-800', icon: CheckCircleIcon };
      case 'discharged':
      case 'đã xuất viện':
        return { bg: 'bg-amber-100', text: 'text-amber-800', icon: ExclamationCircleIcon };
      default:
        return { bg: 'bg-blue-100', text: 'text-blue-800', icon: CheckCircleIcon };
    }
  };

  const statusStyle = getStatusColor(resident.status || 'Đang chăm sóc');

  const tabs = [
    { id: 'overview', label: 'Tổng quan', icon: UserIcon },
    { id: 'medical', label: 'Y tế', icon: HeartIcon },
    { id: 'contact', label: 'Liên hệ', icon: PhoneIcon },
    { id: 'notes', label: 'Ghi chú', icon: ClipboardDocumentListIcon }
  ];
  
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-200 px-4 py-8">
      <div className="max-w-6xl mx-auto">
        <div className="bg-gradient-to-br from-white to-slate-50 rounded-3xl p-8 mb-8 shadow-lg border border-white/20">
          <div className="flex items-center gap-4 mb-6">
          <button
              onClick={() => router.back()}
              className="group p-3.5 rounded-full bg-gradient-to-r from-slate-100 to-slate-200 hover:from-red-100 hover:to-orange-100 text-slate-700 hover:text-red-700 hover:shadow-lg hover:shadow-red-200/50 hover:-translate-x-0.5 transition-all duration-300"
              title="Quay lại "
            >
              <ArrowLeftIcon className="w-5 h-5 group-hover:scale-110 transition-transform duration-200" />
            </button>
            <div className="flex-1">
              <div className="flex items-center gap-6 mb-4">
                <div className="w-20 h-20 rounded-full overflow-hidden border-3 border-gray-200 bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white text-3xl font-bold flex-shrink-0">
                  {resident.avatar ? (
                    <img
                      src={userAPI.getAvatarUrl(resident.avatar)}
                      alt={`Avatar của ${resident.name}`}
                      className="w-full h-full object-cover"
                      onError={(e) => {
                        e.currentTarget.style.display = 'none';
                        const parent = e.currentTarget.parentElement;
                        if (parent) {
                          parent.textContent = resident.name ? resident.name.charAt(0).toUpperCase() : 'U';
                        }
                      }}
                    />
                  ) : (
                    <img
                      src="/default-avatar.svg"
                      alt="Default avatar"
                      className="w-full h-full object-cover"
                      onError={(e) => {
                        e.currentTarget.style.display = 'none';
                        const parent = e.currentTarget.parentElement;
                        if (parent) {
                          parent.textContent = resident.name ? resident.name.charAt(0).toUpperCase() : 'U';
                        }
                      }}
                    />
                  )}
                </div>
                
                <div className="flex-1">
                  <div className="mb-2">
                    <span className="text-sm font-medium text-slate-600 block mb-1">
                      Tên người cao tuổi:
                    </span>
                    <h1 className="text-3xl font-bold m-0 text-slate-800">
                      {resident.name}
                    </h1>
                  </div>
                  <div className="flex items-center gap-4 mt-2 flex-wrap">
                    <span className="inline-flex items-center gap-1 text-base text-slate-600 bg-gray-100 rounded-lg px-3 py-1 font-medium">
                      <UserIcon className="w-4 h-4" />
                      <span>Tuổi:</span>
                      <span>{resident.age} tuổi</span>
                    </span>
                    <span className="inline-flex items-center gap-1 text-base text-slate-600 bg-gray-100 rounded-lg px-3 py-1 font-medium">
                      <CalendarIcon className="w-4 h-4" />
                      <span>Phòng:</span>
                      <span>{roomLoading ? 'Đang tải...' : roomNumber}</span>
                    </span>
                    <span className="inline-flex items-center gap-1 text-base text-slate-600 bg-gray-100 rounded-lg px-3 py-1 font-medium">
                      <CalendarIcon className="w-4 h-4" />
                      <span>Giường:</span>
                      <span>{bedLoading ? 'Đang tải...' : bedNumber}</span>
                    </span>
                    
                    <span className={`inline-flex items-center px-4 py-2 rounded-full text-sm font-semibold ml-2 ${
                      !vitalSigns || vitalSigns?.notes === 'Ổn định' 
                        ? 'bg-gradient-to-r from-green-100 to-green-200 text-green-800 border border-green-300' 
                        : 'bg-gradient-to-r from-amber-100 to-amber-200 text-amber-800 border border-amber-300'
                    }`}>
                      <div className={`w-2 h-2 rounded-full mr-2 ${
                        !vitalSigns || vitalSigns?.notes === 'Ổn định' 
                          ? 'bg-gradient-to-r from-green-500 to-green-600' 
                          : 'bg-gradient-to-r from-amber-500 to-amber-600'
                      }`}></div>
                      Trạng thái sức khỏe: {vitalLoading ? 'Đang tải...' : vitalSigns?.notes ?? 'Chưa hoàn tất đăng kí'}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
          
          <div className="flex gap-2 border-t border-slate-200 pt-6">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-2 px-4 py-3 rounded-lg text-sm font-medium transition-all duration-200 ${
                  activeTab === tab.id 
                    ? 'bg-gradient-to-r from-blue-500 to-blue-600 text-white border border-blue-600' 
                    : 'bg-slate-50/80 text-slate-600 border border-slate-200 hover:bg-slate-100'
                }`}
              >
                <tab.icon className="w-4 h-4" />
                {tab.label}
              </button>
            ))}
          </div>
        </div>
        
        <div className="bg-gradient-to-br from-white to-slate-50 rounded-3xl p-8 shadow-lg border border-white/20">
          {activeTab === 'overview' && (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div className="bg-blue-50/50 rounded-2xl p-6 border border-blue-200/50">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-blue-600 rounded-lg flex items-center justify-center">
                    <UserIcon className="w-4 h-4 text-white" />
                  </div>
                  <h3 className="text-base font-semibold m-0 text-slate-800">
                    Thông tin cá nhân
                  </h3>
                </div>
                <div className="grid gap-3">
                  <div>
                    <p className="text-xs font-medium text-slate-600 mb-1">
                      Ngày sinh
                    </p>
                    <p className="text-sm text-slate-800 m-0 font-medium">
                      {resident.date_of_birth ? formatDateDDMMYYYY(resident.date_of_birth) : 'Chưa hoàn tất đăng kí'}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs font-medium text-slate-600 mb-1">
                      Giới tính
                    </p>
                    <p className="text-sm text-slate-800 m-0 font-medium">
                      {resident.gender === 'male' ? 'Nam' : resident.gender === 'female' ? 'Nữ' : 'Khác'}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs font-medium text-slate-600 mb-1">
                      Ngày nhập viện
                    </p>
                    <p className="text-sm text-slate-800 m-0 font-medium">
                      {resident.admission_date ? formatDateDDMMYYYY(resident.admission_date) : 'Chưa hoàn tất đăng kí'}
                    </p>
                  </div>
                </div>
              </div>

              <div className="bg-green-50/50 rounded-2xl p-6 border border-green-200/50">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-8 h-8 bg-gradient-to-br from-green-500 to-green-600 rounded-lg flex items-center justify-center">
                    <ShieldCheckIcon className="w-4 h-4 text-white" />
                  </div>
                  <h3 className="text-base font-semibold m-0 text-slate-800">
                    Gói dịch vụ đang sử dụng
                    {activeAssignments.length > 0 && (
                      <span className="ml-2 text-sm font-normal text-gray-500">
                        ({activeAssignments.reduce((total, assignment) => 
                          total + (assignment.care_plan_ids?.length || 0), 0
                        )} gói)
                      </span>
                    )}
                  </h3>
                </div>
                {activeAssignments.length > 0 ? (
                  <div className="grid gap-3">
                    {activeAssignments.map((assignment: any, assignmentIdx: number) => (
                      assignment.care_plan_ids && assignment.care_plan_ids.length > 0 ? (
                        assignment.care_plan_ids.map((plan: any, planIdx: number) => (
                          <div
                            key={`${assignment._id}-${plan._id || planIdx}`}
                            className="bg-white/80 rounded-lg p-4 border border-green-200 mb-2"
                          >
                            <div className="font-semibold text-base text-green-700">
                              <span>{plan.plan_name || 'Gói dịch vụ'}</span>
                            </div>
                            <div className="text-sm text-gray-700 mb-2">
                              Giá: {plan.monthly_price !== undefined ? new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(plan.monthly_price) : '---'}
                            </div>
                            
                          </div>
                        ))
                      ) : (
                        <div key={`empty-assignment-${assignmentIdx}`} className="bg-white/80 rounded-lg p-4 border border-gray-200 text-sm text-gray-500">
                          Assignment {assignmentIdx + 1}: Không có gói dịch vụ được gán
                        </div>
                      )
                    ))}
                    
                    <Link
                      href={`/staff/residents/${residentId}/services`}
                      className="bg-gradient-to-r from-green-500 to-green-600 text-white rounded-lg p-4 text-center font-medium no-underline transition-all duration-200 hover:from-green-600 hover:to-green-700 hover:-translate-y-0.5 hover:shadow-md"
                    >
                      Xem chi tiết →
                    </Link>
                  </div>
                ) : (
                  <div>
                    <p className="text-sm text-slate-600 mb-4">
                      Chưa đăng ký gói dịch vụ nào
                    </p>
                    <Link
                      href="/services"
                      className="inline-flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-green-500 to-green-600 text-white rounded-lg text-sm font-medium no-underline"
                    >
                      Xem các gói dịch vụ
                    </Link>
                  </div>
                )}
                

              </div>
            </div>
          )}

          {activeTab === 'medical' && (
            <div className="grid gap-6">
              <div className="bg-red-50/50 rounded-2xl p-6 border border-red-200/50">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-8 h-8 bg-gradient-to-br from-red-500 to-red-600 rounded-lg flex items-center justify-center">
                    <HeartIcon className="w-4 h-4 text-white" />
                  </div>
                  <h3 className="text-base font-semibold m-0 text-slate-800">
                    Tình trạng sức khỏe
                  </h3>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {resident.medical_history ? (
                    <div className="p-3 bg-white/80 rounded-lg border border-red-200/50">
                      <p className="text-sm text-slate-800 m-0 font-medium">
                        {resident.medical_history}
                      </p>
                    </div>
                  ) : (
                    <p className="text-sm text-slate-600 m-0">
                      Không có tình trạng sức khỏe đặc biệt
                    </p>
                  )}
                </div>
              </div>

              <div className="bg-green-50/50 rounded-2xl p-6 border border-green-200/50">
                <h3 className="text-base font-semibold mb-4 text-slate-800">
                  Thuốc đang sử dụng
                </h3>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {(resident.current_medications || []).length > 0 ? (
                    (resident.current_medications || []).map((med: any, index: number) => (
                      <div key={index} className="p-3 bg-white/80 rounded-lg border border-green-200/50">
                        <p className="text-sm text-slate-800 m-0 font-medium">
                          {med.medication_name} - {med.dosage} - {med.frequency}
                        </p>
                      </div>
                    ))
                  ) : (
                    <p className="text-sm text-slate-600 m-0">
                      Không có thuốc đang sử dụng
                    </p>
                  )}
                </div>
              </div>

              <div className="bg-amber-50/50 rounded-2xl p-6 border border-amber-200/50">
                <h3 className="text-base font-semibold mb-4 text-slate-800">
                  Dị ứng
                </h3>
                
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                  {(resident.allergies || []).length > 0 ? (
                    (resident.allergies || []).map((allergy: string, index: number) => (
                      <div key={index} className="px-3 py-2 bg-white/80 rounded-lg border border-amber-200/50 text-sm text-slate-800 font-medium">
                        {allergy}
                      </div>
                    ))
                  ) : (
                    <p className="text-sm text-slate-600 m-0">
                      Không có dị ứng đã biết
                    </p>
                  )}
                </div>
              </div>
            </div>
          )}

          {activeTab === 'contact' && (
            <div className="bg-green-50/50 rounded-2xl p-6 border border-green-200/50">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-8 h-8 bg-gradient-to-br from-green-500 to-green-600 rounded-lg flex items-center justify-center">
                  <PhoneIcon className="w-4 h-4 text-white" />
                </div>
                <h3 className="text-base font-semibold m-0 text-slate-800">
                  Thông tin liên hệ khẩn cấp
                </h3>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <p className="text-xs font-medium text-slate-600 mb-2">
                    Người liên hệ khẩn cấp
                  </p>
                  <p className="text-lg text-slate-800 m-0 font-semibold">
                    {resident.emergencyContact && typeof resident.emergencyContact === 'object'
                      ? `${resident.emergencyContact.name || ''}${resident.emergencyContact.relationship ? ' (' + resident.emergencyContact.relationship + ')' : ''}`
                      : (resident.emergencyContact || 'Chưa hoàn tất đăng kí')}
                  </p>
                </div>
                <div>
                  <p className="text-xs font-medium text-slate-600 mb-2">
                    Số điện thoại liên hệ
                  </p>
                  <p className="text-lg text-slate-800 m-0 font-semibold">
                    {resident.emergencyContact?.phone || 'Chưa hoàn tất đăng kí'}
                  </p>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'notes' && (
            <div className="grid gap-6">
              <div className="bg-amber-50/50 rounded-2xl p-6 border border-amber-200/50">
                <h3 className="text-base font-semibold mb-4 text-slate-800">
                  Ghi chú chăm sóc
                </h3>
                <CareNotesDisplay
                  careNotes={careNotes}
                  isStaff={user?.role === 'staff'}
                />
              </div>
          
              {resident.personalNotes && (
                <div className="bg-blue-50/50 rounded-2xl p-6 border border-blue-200/50">
                  <h3 className="text-base font-semibold mb-4 text-slate-800">
                    Ghi chú cá nhân
                  </h3>
                  <div className="p-4 bg-white/80 rounded-lg border border-blue-200/50">
                    <p className="text-sm text-slate-800 m-0 leading-relaxed">
                      {resident.personalNotes}
                    </p>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
} 