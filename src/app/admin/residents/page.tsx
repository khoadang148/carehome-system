"use client";

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import useSWR from 'swr';
import {
  MagnifyingGlassIcon,
  FunnelIcon,
  PlusCircleIcon,
  PencilIcon,
  EyeIcon,
  TrashIcon,
  UserGroupIcon,
  PhotoIcon,
  ArrowLeftIcon,
  HomeIcon,
  ExclamationTriangleIcon
} from '@heroicons/react/24/outline';
import { residentAPI, bedAssignmentsAPI, carePlanAssignmentsAPI, API_BASE_URL, billsAPI } from '@/lib/api';
import { carePlansAPI } from '@/lib/api';
import { roomsAPI } from '@/lib/api';
import { useAuth } from '@/lib/contexts/auth-context';
import { userAPI } from "@/lib/api";
import Avatar from '@/components/Avatar';


export default function ResidentsPage() {
  const { user } = useAuth();
  const router = useRouter();

  const [searchTerm, setSearchTerm] = useState('');
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [residentToDelete, setResidentToDelete] = useState<number | null>(null);
  const [roomNumbers, setRoomNumbers] = useState<{ [residentId: string]: string }>({});
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');
  const [modalType, setModalType] = useState<'success' | 'error'>('success');
  const [activeTab, setActiveTab] = useState<'admitted' | 'accepted' | 'discharged'>('admitted');


  const [showDischargeModal, setShowDischargeModal] = useState(false);
  const [residentToDischarge, setResidentToDischarge] = useState<any>(null);
  const [discharging, setDischarging] = useState(false);
  const [dischargeReason, setDischargeReason] = useState('');
  const [isDeceased, setIsDeceased] = useState(false);
  const [unpaidBills, setUnpaidBills] = useState<{ [residentId: string]: any[] }>({});

  // Helper: show discharge button on Accepted tab only on the last day of the next month from admission_date
  const isLastDayOfNextMonth = (isoString: string | null | undefined) => {
    if (!isoString) return false;
    const admission = new Date(isoString);
    if (isNaN(admission.getTime())) return false;
    const nextMonthFirst = new Date(admission.getFullYear(), admission.getMonth() + 1, 1);
    const lastDayNextMonth = new Date(nextMonthFirst.getFullYear(), nextMonthFirst.getMonth() + 1, 0);
    const today = new Date();
    const todayLocal = new Date(today.getFullYear(), today.getMonth(), today.getDate());
    const lastLocal = new Date(
      lastDayNextMonth.getFullYear(),
      lastDayNextMonth.getMonth(),
      lastDayNextMonth.getDate()
    );
    return todayLocal.getTime() === lastLocal.getTime();
  };

  // SWR fetcher function
  const fetcher = (url: string) => fetch(url).then(res => res.json());

  // Fetch residents data per tab for speed
  const { data: admittedRes, error: admittedErr, mutate: mutateAdmitted } = useSWR(
    user ? 'residents:admitted' : null,
    () => residentAPI.getAdmitted(),
    { revalidateOnFocus: false, dedupingInterval: 5000 }
  );
  const { data: activeRes, error: activeErr, mutate: mutateActive } = useSWR(
    user ? 'residents:active' : null,
    () => residentAPI.getActive(),
    { revalidateOnFocus: false, dedupingInterval: 5000 }
  );
  // For discharged, fallback to full list then filter (endpoint not provided)
  const { data: allRes, error: allErr, mutate: mutateAll } = useSWR(
    user ? 'residents:all' : null,
    () => residentAPI.getAll(),
    { revalidateOnFocus: false, dedupingInterval: 10000 }
  );

  // Fetch care plans data with SWR
  const { data: carePlansData, error: carePlansError } = useSWR(
    user ? '/api/care-plans' : null,
    () => carePlansAPI.getAll(),
    {
      revalidateOnFocus: false,
      revalidateOnReconnect: true,
      dedupingInterval: 10000,
    }
  );

  // Process residents data
  const residentsData = React.useMemo(() => {
    const source = activeTab === 'admitted' ? admittedRes : activeTab === 'accepted' ? activeRes : allRes;
    if (!source) return [];
    
    let apiData: any[] = [];
    if (Array.isArray(source)) {
      apiData = source;
    } else {
      try {
        apiData = (source as any).data || [];
      } catch (error) {
        apiData = [];
      }
    }

    return apiData.map((r: any) => ({
      id: r._id,
      name: r.full_name || '',
      age: r.date_of_birth ? (new Date().getFullYear() - new Date(r.date_of_birth).getFullYear()) : '',
      careLevel: r.care_level || '',
      emergencyContact: r.emergency_contact?.name || '',
      contactPhone: r.emergency_contact?.phone || '',
      avatar: r.avatar ? `${API_BASE_URL}/${r.avatar}` : null,
      gender: (r.gender || '').toLowerCase(),
      status: (r.status || 'active').toLowerCase(),
      discharge_date: r.discharge_date || null,
      admission_date: r.admission_date || null,
    }));
  }, [admittedRes, activeRes, allRes, activeTab]);

  // Process care plans data
  const carePlanOptions = React.useMemo(() => {
    return Array.isArray(carePlansData) ? carePlansData : [];
  }, [carePlansData]);

  // Đếm số lượng cho từng tab (không phụ thuộc tab đang chọn)
  const admittedCount = React.useMemo(() => {
    if (Array.isArray(admittedRes)) return admittedRes.length;
    try {
      return Array.isArray((admittedRes as any)?.data) ? (admittedRes as any).data.length : 0;
    } catch {
      return 0;
    }
  }, [admittedRes]);

  const activeCount = React.useMemo(() => {
    if (Array.isArray(activeRes)) return activeRes.length;
    try {
      return Array.isArray((activeRes as any)?.data) ? (activeRes as any).data.length : 0;
    } catch {
      return 0;
    }
  }, [activeRes]);

  const dischargedCount = React.useMemo(() => {
    const src = Array.isArray(allRes)
      ? allRes
      : Array.isArray((allRes as any)?.data)
        ? (allRes as any).data
        : [];
    if (!Array.isArray(src)) return 0;
    return src.filter((r: any) => String(r?.status || r?.resident_status || '').toLowerCase() === 'discharged').length;
  }, [allRes]);

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

  // Load room numbers for residents (optimized with useMemo)
  React.useEffect(() => {
    if (!residentsData.length) return;

    const loadRoomNumbers = async () => {
      const roomNumbersMap: { [residentId: string]: string } = {};
      
      // Process all residents in parallel
      const promises = residentsData.map(async (resident: any) => {
        try {
          const bedAssignments = await bedAssignmentsAPI.getByResidentId(resident.id);
          const bedAssignment = Array.isArray(bedAssignments) ? bedAssignments.find((a: any) => a.bed_id?.room_id) : null;

          if (bedAssignment?.bed_id?.room_id) {
            if (typeof bedAssignment.bed_id.room_id === 'object' && bedAssignment.bed_id.room_id.room_number) {
              roomNumbersMap[resident.id] = bedAssignment.bed_id.room_id.room_number;
            } else {
              const roomId = bedAssignment.bed_id.room_id._id || bedAssignment.bed_id.room_id;
              if (roomId) {
                const room = await roomsAPI.getById(roomId);
                roomNumbersMap[resident.id] = room?.room_number || 'Chưa hoàn tất đăng kí';
              } else {
                roomNumbersMap[resident.id] = 'Chưa hoàn tất đăng kí';
              }
            }
          } else {
            const assignments = await carePlansAPI.getByResidentId(resident.id);
            const assignment = Array.isArray(assignments) ? assignments.find((a: any) => a.bed_id?.room_id || a.assigned_room_id) : null;
            const roomId = assignment?.bed_id?.room_id || assignment?.assigned_room_id;
            const roomIdString = typeof roomId === 'object' && roomId?._id ? roomId._id : roomId;
            if (roomIdString) {
              const room = await roomsAPI.getById(roomIdString);
              roomNumbersMap[resident.id] = room?.room_number || 'Chưa hoàn tất đăng kí';
            } else {
              roomNumbersMap[resident.id] = 'Chưa hoàn tất đăng kí';
            }
          }
        } catch (error) {
          roomNumbersMap[resident.id] = 'Chưa hoàn tất đăng kí';
        }
      });

      await Promise.all(promises);
      setRoomNumbers(roomNumbersMap);
    };

    loadRoomNumbers();
  }, [residentsData]);




  // Loading and error states
  const isLoading = (!admittedRes && !admittedErr) || (!activeRes && !activeErr) || (!allRes && !allErr);
  const hasError = admittedErr || activeErr || allErr;

  const filteredResidents = residentsData.filter((resident) => {
    const searchValue = (searchTerm || '').toString().trim();
    
    // If no search term, show all residents
    if (!searchValue) {
      return true;
    }
    
    const residentName = (resident.name || '').toString().toLowerCase();
    const residentRoom = (roomNumbers[resident.id] || '').toString().toLowerCase();
    
    return residentName.includes(searchValue.toLowerCase()) ||
      residentRoom.includes(searchValue.toLowerCase());
  });

  const admittedResidents = filteredResidents.filter(resident => (resident.status || '').toLowerCase() === 'admitted');
  const acceptedResidents = filteredResidents.filter(resident => {
    const s = (resident.status || '').toLowerCase();
    return s === 'accepted' || s === 'active';
  });
  const dischargedResidents = filteredResidents.filter(resident => (resident.status || '').toLowerCase() === 'discharged');

  // Load unpaid bills for residents in "accepted" status
  React.useEffect(() => {
    if (activeTab !== 'accepted' || !acceptedResidents.length) return;

    const loadUnpaidBills = async () => {
      const unpaidBillsMap: { [residentId: string]: any[] } = {};
      
      const promises = acceptedResidents.map(async (resident: any) => {
        try {
          const bills = await billsAPI.getByResidentId(resident.id);
          const unpaidBillsList = Array.isArray(bills) ? bills.filter((bill: any) => bill.status === 'pending') : [];
          if (unpaidBillsList.length > 0) {
            unpaidBillsMap[resident.id] = unpaidBillsList;
          }
        } catch (error) {
          console.error(`Error loading bills for resident ${resident.id}:`, error);
        }
      });

      await Promise.all(promises);
      setUnpaidBills(unpaidBillsMap);
    };

    loadUnpaidBills();
  }, [activeTab, acceptedResidents]);

  const handleViewResident = (residentId: string | number) => {
    console.log('Viewing resident:', residentId);
    router.push(`/admin/residents/${residentId}`);
  };

  const handleEditResident = (residentId: string | number) => {
    router.push(`/admin/residents/${residentId}/edit`);
  };

  const handleDeleteClick = (id: string | number) => {
    setResidentToDelete(Number(id));
    setShowDeleteModal(true);
  };

  const confirmDelete = async () => {
    if (residentToDelete !== null) {
      try {
        await residentAPI.delete(residentToDelete.toString());

        // Refresh data using SWR mutate
        if (activeTab === 'admitted') await mutateAdmitted();
        if (activeTab === 'accepted') await mutateActive();
        if (activeTab === 'discharged') await mutateAll();

        setShowDeleteModal(false);
        setResidentToDelete(null);

        setSuccessMessage('Đã xóa thông tin người cao tuổi thành công! Tài khoản gia đình vẫn được giữ nguyên.');
        setModalType('success');
        setShowSuccessModal(true);
      } catch (error) {
        setShowDeleteModal(false);
        setResidentToDelete(null);

        setSuccessMessage('Có lỗi xảy ra khi xóa người cao tuổi. Vui lòng thử lại.');
        setModalType('error');
        setShowSuccessModal(true);
      }
    }
  };

  const cancelDelete = () => {
    setShowDeleteModal(false);
    setResidentToDelete(null);
  };

  const handleDischargeClick = (resident: any) => {
    setResidentToDischarge(resident);
    setDischargeReason('');
    setIsDeceased(false);
    setShowDischargeModal(true);
  };

  const confirmDischarge = async () => {
    if (!residentToDischarge) return;


    if (!dischargeReason.trim()) {
      setSuccessMessage(`Vui lòng nhập ${isDeceased ? 'lý do qua đời' : 'lý do xuất viện'}.`);
      setModalType('error');
      setShowSuccessModal(true);
      return;
    }

    setDischarging(true);
    try {
      try {
        const assignments = await bedAssignmentsAPI.getByResidentId(residentToDischarge.id);
        const active = Array.isArray(assignments) ? assignments.find((a: any) => !a.unassigned_date) : null;
        if (active) {
          await bedAssignmentsAPI.update(active._id, { unassigned_date: new Date().toISOString() });
        }
      } catch (bedError) {
      }

      try {
        const carePlanAssignments = await carePlanAssignmentsAPI.getByResidentId(residentToDischarge.id);
        const activeCarePlans = Array.isArray(carePlanAssignments) ?
          carePlanAssignments.filter((cpa: any) => !cpa.end_date || new Date(cpa.end_date) > new Date()) : [];

        for (const carePlan of activeCarePlans) {
          await carePlanAssignmentsAPI.update(carePlan._id, {
            end_date: new Date().toISOString(),
            status: 'completed'
          });
        }
      } catch (carePlanError) {
      }

      await residentAPI.discharge(residentToDischarge.id, {
        status: isDeceased ? 'deceased' : 'discharged',
        reason: dischargeReason.trim()
      });

      setRoomNumbers(prev => ({ ...prev, [residentToDischarge.id]: 'Đã xuất viện' }));
      // Refresh data using SWR mutate
      if (activeTab === 'admitted') await mutateAdmitted();
      if (activeTab === 'accepted') await mutateActive();
      if (activeTab === 'discharged') await mutateAll();

      setShowDischargeModal(false);
      setResidentToDischarge(null);
      setDischargeReason('');

      setSuccessMessage(`Đã cập nhật trạng thái: ${isDeceased ? 'Đã qua đời' : 'Xuất viện'} thành công. Người cao tuổi đã được xóa khỏi phòng và giường.`);
      setModalType('success');
      setShowSuccessModal(true);
    } catch (error: any) {
      setShowDischargeModal(false);
      setResidentToDischarge(null);
      setDischargeReason('');
      setSuccessMessage('Có lỗi xảy ra khi cập nhật trạng thái xuất viện: ' + (error.message || 'Lỗi không xác định'));
      setModalType('error');
      setShowSuccessModal(true);
    } finally {
      setDischarging(false);
    }
  };

  const cancelDischarge = () => {
    setShowDischargeModal(false);
    setResidentToDischarge(null);
    setDischargeReason('');
    setIsDeceased(false);
  };

  const renderResidentsTable = (residents: any[], showRoomColumn: boolean = true) => (
    <div style={{
      background: 'linear-gradient(135deg, #ffffff 0%, #f8fafc 100%)',
      borderRadius: '1rem',
      overflow: 'hidden',
      boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
      border: '1px solid rgba(255, 255, 255, 0.2)'
    }}>
      <div style={{ overflowX: 'auto' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr style={{
              background: 'linear-gradient(135deg, #f8fafc 0%, #e2e8f0 100%)',
              borderBottom: '1px solid #e5e7eb'
            }}>
              <th style={{
                padding: '1rem',
                textAlign: 'left',
                fontSize: '0.875rem',
                fontWeight: 600,
                color: '#374151'
              }}>
                Người cao tuổi
              </th>
              {showRoomColumn && (
                <th style={{
                  padding: '1rem',
                  textAlign: 'left',
                  fontSize: '0.875rem',
                  fontWeight: 600,
                  color: '#374151'
                }}>
                  Phòng
                </th>
              )}
              <th style={{
                padding: '1rem',
                textAlign: 'left',
                fontSize: '0.875rem',
                fontWeight: 600,
                color: '#374151'
              }}>
                Tuổi
              </th>
              <th style={{
                padding: '1rem',
                textAlign: 'left',
                fontSize: '0.875rem',
                fontWeight: 600,
                color: '#374151'
              }}>
                Giới tính
              </th>
              <th style={{
                padding: '1rem',
                textAlign: 'left',
                fontSize: '0.875rem',
                fontWeight: 600,
                color: '#374151'
              }}>
                Liên hệ khẩn cấp
              </th>
              <th style={{
                padding: '1rem',
                textAlign: 'center',
                fontSize: '0.875rem',
                fontWeight: 600,
                color: '#374151'
              }}>
                Thao tác
              </th>
            </tr>
          </thead>
          <tbody>
            {residents.map((resident, index) => (
              <tr
                key={resident.id}
                style={{
                  borderBottom: index < residents.length - 1 ? '1px solid #f3f4f6' : 'none',
                  transition: 'all 0.2s ease'
                }}
                onMouseOver={(e) => {
                  e.currentTarget.style.background = 'rgba(102, 126, 234, 0.05)';
                }}
                onMouseOut={(e) => {
                  e.currentTarget.style.background = 'transparent';
                }}
              >
                <td style={{ padding: '1rem' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                    <Avatar
                      src={resident.avatar}
                      alt={resident.name}
                      size="small"
                      className="w-10 h-10"
                      showInitials={false}
                      name={resident.name}
                      fallbackSrc="/default-avatar.svg"
                    />
                    <div>
                      <p style={{
                        fontSize: '0.875rem',
                        fontWeight: 600,
                        color: '#111827',
                        margin: 0
                      }}>
                        {resident.name}
                      </p>

                    </div>
                  </div>
                </td>
                {showRoomColumn && (
                  <td style={{ padding: '1rem' }}>
                    <span style={{
                      background: 'rgba(16, 185, 129, 0.1)',
                      color: '#10b981',
                      padding: '0.25rem 0.75rem',
                      borderRadius: '9999px',
                      fontSize: '0.75rem',
                      fontWeight: 600
                    }}>
                      {roomNumbers[resident.id] || 'Đang tải...'}
                    </span>
                  </td>
                )}
                <td style={{ padding: '1rem' }}>
                  <span style={{
                    fontSize: '0.875rem',
                    color: '#374151',
                    fontWeight: 500
                  }}>
                    {resident.age} tuổi
                  </span>
                </td>
                <td style={{ padding: '1rem' }}>
                  <span style={{
                    fontSize: '0.875rem',
                    color: '#374151',
                    fontWeight: 500
                  }}>
                    {resident.gender === 'male' ? 'Nam' : resident.gender === 'female' ? 'Nữ' : 'Khác'}
                  </span>
                </td>
                <td style={{ padding: '1rem' }}>
                  <div>
                    <p style={{
                      fontSize: '0.875rem',
                      fontWeight: 600,
                      color: '#111827',
                      margin: 0
                    }}>
                      {resident.emergencyContact}
                    </p>
                    <p style={{
                      fontSize: '0.75rem',
                      color: '#6b7280',
                      margin: 0
                    }}>
                      {resident.contactPhone}
                    </p>
                    {activeTab === 'accepted' && unpaidBills[resident.id] && unpaidBills[resident.id].length > 0 && (
                      <div style={{
                        marginTop: '0.5rem',
                        padding: '0.25rem 0.5rem',
                        background: 'rgba(239, 68, 68, 0.1)',
                        border: '1px solid rgba(239, 68, 68, 0.2)',
                        borderRadius: '0.375rem',
                        fontSize: '0.75rem',
                        color: '#dc2626',
                        fontWeight: 500
                      }}>
                         Chưa thanh toán {unpaidBills[resident.id].length} hóa đơn
                      </div>
                    )}
                  </div>
                </td>
                <td style={{ padding: '1rem' }}>
                  {resident.status === 'discharged' ? (
                    <div style={{
                      display: 'flex',
                      justifyContent: 'center',
                      alignItems: 'center',
                      height: '2rem',
                      color: '#9ca3af',
                      fontSize: '0.875rem'
                    }}>—</div>
                  ) : (
                    <div style={{
                      display: 'flex',
                      justifyContent: 'center',
                      gap: '0.5rem'
                    }}>
                      {(resident.status === 'accepted' || resident.status === 'active') && (
                        (() => {
                          // Check if admission date has arrived (date-only, local timezone)
                          const isSameOrAfterLocalDate = (isoString: string | null | undefined) => {
                            if (!isoString) return true;
                            const parsed = new Date(isoString);
                            const admissionLocal = new Date(
                              parsed.getFullYear(),
                              parsed.getMonth(),
                              parsed.getDate()
                            );
                            const todayLocal = new Date();
                            todayLocal.setHours(0, 0, 0, 0);
                            return todayLocal.getTime() >= admissionLocal.getTime();
                          };

                          const admissionDate = resident.admission_date as string | null | undefined;
                          
                          // Check if resident has unpaid bills
                          const hasUnpaidBills = unpaidBills[resident.id] && unpaidBills[resident.id].length > 0;
                          
                          const canAdmit = isSameOrAfterLocalDate(admissionDate) && !hasUnpaidBills;
                          
                          return canAdmit ? (
                            <button
                              onClick={async () => {
                                try {
                                  // Update resident status to admitted using attendance endpoint
                                  await residentAPI.markAttendance(resident.id.toString());

                                  // Activate bed assignment if exists
                                  try {
                                    const bedAssignments = await bedAssignmentsAPI.getByResidentId(resident.id);
                                    const pendingBedAssignment = Array.isArray(bedAssignments) ?
                                      bedAssignments.find((ba: any) => ba.status === 'pending' || ba.status === 'approved') : null;
                                    if (pendingBedAssignment?._id) {
                                      await bedAssignmentsAPI.activateAssignment(pendingBedAssignment._id);
                                    }
                                  } catch (bedError) {
                                    console.error('Error activating bed assignment:', bedError);
                                  }

                                  // Activate care plan assignment if exists
                                  try {
                                    const carePlanAssignments = await carePlanAssignmentsAPI.getByResidentId(resident.id);
                                    const pendingCarePlan = Array.isArray(carePlanAssignments) ?
                                      carePlanAssignments.find((cpa: any) => cpa.status === 'pending' || cpa.status === 'approved') : null;
                                    if (pendingCarePlan?._id) {
                                      await carePlanAssignmentsAPI.activateAssignment(pendingCarePlan._id);
                                    }
                                  } catch (carePlanError) {
                                    console.error('Error activating care plan assignment:', carePlanError);
                                  }

                                  // Refresh data using SWR mutate
                                  if (activeTab === 'admitted') await mutateAdmitted();
                                  if (activeTab === 'accepted') await mutateActive();
                                  if (activeTab === 'discharged') await mutateAll();
                                  setSuccessMessage('Đã xác nhận nhập viện và kích hoạt phòng, dịch vụ thành công.');
                                  setModalType('success');
                                  setShowSuccessModal(true);
                                } catch (e) {
                                  setSuccessMessage('Xác nhận nhập viện thất bại. Vui lòng thử lại.');
                                  setModalType('error');
                                  setShowSuccessModal(true);
                                }
                              }}
                              title="Xác nhận đã nhập viện"
                              style={{
                                padding: '0.5rem',
                                borderRadius: '0.375rem',
                                border: 'none',
                                background: 'rgba(16, 185, 129, 0.1)',
                                color: '#10b981',
                                cursor: 'pointer',
                                transition: 'all 0.2s ease'
                              }}
                              onMouseOver={(e) => {
                                e.currentTarget.style.background = '#10b981';
                                e.currentTarget.style.color = 'white';
                              }}
                              onMouseOut={(e) => {
                                e.currentTarget.style.background = 'rgba(16, 185, 129, 0.1)';
                                e.currentTarget.style.color = '#10b981';
                              }}
                            >
                              <svg style={{ width: '1rem', height: '1rem' }} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                              </svg>
                            </button>
                          ) : (
                            <div
                              title={
                                hasUnpaidBills 
                                  ? `Chưa thanh toán ${unpaidBills[resident.id].length} hóa đơn` 
                                  : `Ngày nhập viện: ${admissionDate ? new Date(admissionDate).toLocaleDateString('vi-VN') : 'Chưa xác định'}`
                              }
                              style={{
                                padding: '0.5rem',
                                borderRadius: '0.375rem',
                                border: 'none',
                                background: hasUnpaidBills ? 'rgba(239, 68, 68, 0.1)' : 'rgba(156, 163, 175, 0.1)',
                                color: hasUnpaidBills ? '#ef4444' : '#9ca3af',
                                cursor: 'not-allowed',
                                transition: 'all 0.2s ease',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center'
                              }}
                            >
                              {hasUnpaidBills ? (
                                <svg style={{ width: '1rem', height: '1rem' }} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
                                </svg>
                              ) : (
                                <svg style={{ width: '1rem', height: '1rem' }} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                                </svg>
                              )}
                            </div>
                          );
                        })()
                      )}
                      <button
                        onClick={(e) => {
                          e.preventDefault();
                          e.stopPropagation();
                          console.log('Button clicked, resident.id:', resident.id);
                          handleViewResident(resident.id);
                        }}
                        title="Xem thông tin chi tiết người cao tuổi"
                        style={{
                          padding: '0.5rem',
                          borderRadius: '0.375rem',
                          border: 'none',
                          background: 'rgba(59, 130, 246, 0.1)',
                          color: '#3b82f6',
                          cursor: 'pointer',
                          transition: 'all 0.2s ease',
                          pointerEvents: 'auto',
                          zIndex: 10,
                          position: 'relative'
                        }}
                        onMouseOver={(e) => {
                          e.currentTarget.style.background = '#3b82f6';
                          e.currentTarget.style.color = 'white';
                        }}
                        onMouseOut={(e) => {
                          e.currentTarget.style.background = 'rgba(59, 130, 246, 0.1)';
                          e.currentTarget.style.color = '#3b82f6';
                        }}
                      >
                        <EyeIcon style={{ width: '1rem', height: '1rem' }} />
                      </button>
                      <button
                        onClick={() => handleEditResident(resident.id)}
                        title="Chỉnh sửa thông tin người cao tuổi"
                        style={{
                          padding: '0.5rem',
                          borderRadius: '0.375rem',
                          border: 'none',
                          background: 'rgba(245, 158, 11, 0.1)',
                          color: '#f59e0b',
                          cursor: 'pointer',
                          transition: 'all 0.2s ease'
                        }}
                        onMouseOver={(e) => {
                          e.currentTarget.style.background = '#f59e0b';
                          e.currentTarget.style.color = 'white';
                        }}
                        onMouseOut={(e) => {
                          e.currentTarget.style.background = 'rgba(245, 158, 11, 0.1)';
                          e.currentTarget.style.color = '#f59e0b';
                        }}
                      >
                        <PencilIcon style={{ width: '1rem', height: '1rem' }} />
                      </button>
                      {user?.role === 'admin' && (
                        resident.status === 'admitted' ||
                        (activeTab === 'accepted' && isLastDayOfNextMonth(resident.admission_date))
                      ) && (
                        <button
                          onClick={() => handleDischargeClick(resident)}
                          title="Xuất viện người cao tuổi"
                          style={{
                            padding: '0.5rem',
                            borderRadius: '0.375rem',
                            border: 'none',
                            background: 'rgba(168, 85, 247, 0.1)',
                            color: '#a855f7',
                            cursor: 'pointer',
                            transition: 'all 0.2s ease'
                          }}
                          onMouseOver={(e) => {
                            e.currentTarget.style.background = '#a855f7';
                            e.currentTarget.style.color = 'white';
                          }}
                          onMouseOut={(e) => {
                            e.currentTarget.style.background = 'rgba(168, 85, 247, 0.1)';
                            e.currentTarget.style.color = '#a855f7';
                          }}
                        >
                          <svg style={{ width: '1rem', height: '1rem' }} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                          </svg>
                        </button>
                      )}
                    </div>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {residents.length === 0 && (
        <div style={{
          padding: '3rem',
          textAlign: 'center',
          color: '#6b7280'
        }}>
          <UserGroupIcon style={{
            width: '3rem',
            height: '3rem',
            margin: '0 auto 1rem',
            color: '#d1d5db'
          }} />
          <h3 style={{
            fontSize: '1.125rem',
            fontWeight: 600,
            margin: '0 0 0.5rem 0',
            color: '#374151'
          }}>
            {activeTab === 'admitted' ? 'Không có người cao tuổi nào đang nằm viện' : activeTab === 'accepted' ? 'Không có người cao tuổi nào ' : 'Không có người cao tuổi nào đã xuất viện'}
          </h3>
          <p style={{ margin: 0, fontSize: '0.875rem' }}>
            {activeTab === 'admitted' ? 'Danh sách đang nằm viện trống' : activeTab === 'accepted' ? 'Danh sách trống' : 'Danh sách đã xuất viện trống'}
          </p>
        </div>
      )}
    </div>
  );

  return (
    <>
      <style jsx>{`
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
      `}</style>
      <div style={{
        minHeight: '100vh',
        background: 'linear-gradient(135deg, #f8fafc 0%, #e2e8f0 100%)',
        position: 'relative'
      }}>

        <div style={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: `
          radial-gradient(circle at 20% 80%, rgba(102, 126, 234, 0.05) 0%, transparent 50%),
          radial-gradient(circle at 80% 20%, rgba(16, 185, 129, 0.05) 0%, transparent 50%),
          radial-gradient(circle at 40% 40%, rgba(245, 158, 11, 0.03) 0%, transparent 50%)
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
                  background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                  borderRadius: '1rem',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  boxShadow: '0 4px 12px rgba(102, 126, 234, 0.3)'
                }}>
                  <UserGroupIcon style={{ width: '2rem', height: '2rem', color: 'white' }} />
                </div>
                <div>
                  <h1 style={{
                    fontSize: '2rem',
                    fontWeight: 700,
                    margin: 0,
                    background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                    WebkitBackgroundClip: 'text',
                    WebkitTextFillColor: 'transparent',
                    letterSpacing: '-0.025em'
                  }}>
                    Danh sách người cao tuổi
                  </h1>

                </div>
              </div>
            </div>
          </div>

          <div style={{
            background: 'linear-gradient(135deg, #ffffff 0%, #f8fafc 100%)',
            borderRadius: '1rem',
            padding: '1.5rem',
            marginBottom: '2rem',
            boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
            border: '1px solid rgba(255, 255, 255, 0.2)'
          }}>
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
              gap: '1rem',
              alignItems: 'end'
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
                <div style={{ position: 'relative' }}>
                  <input
                    type="text"
                    placeholder="Tìm theo tên hoặc phòng..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    style={{
                      width: '100%',
                      padding: '0.75rem 1rem 0.75rem 2.5rem',
                      borderRadius: '0.5rem',
                      border: '1px solid #d1d5db',
                      fontSize: '0.875rem',
                      background: 'white'
                    }}
                  />
                  <MagnifyingGlassIcon style={{
                    position: 'absolute',
                    left: '0.75rem',
                    top: '50%',
                    transform: 'translateY(-50%)',
                    width: '1rem',
                    height: '1rem',
                    color: '#9ca3af'
                  }} />
                </div>
              </div>

              <div style={{
                background: 'rgba(102, 126, 234, 0.1)',
                padding: '0.75rem 1rem',
                borderRadius: '0.5rem',
                border: '1px solid rgba(102, 126, 234, 0.2)'
              }}>
                <p style={{
                  fontSize: '0.875rem',
                  color: '#667eea',
                  margin: 0,
                  fontWeight: 600
                }}>
                  Hiển thị: {activeTab === 'admitted' ? admittedResidents.length : activeTab === 'accepted' ? acceptedResidents.length : dischargedResidents.length} người cao tuổi
                </p>
              </div>
            </div>
          </div>

          <div style={{
            background: 'linear-gradient(135deg, #ffffff 0%, #f8fafc 100%)',
            borderRadius: '1rem',
            padding: '1.5rem',
            marginBottom: '2rem',
            boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
            border: '1px solid rgba(255, 255, 255, 0.2)'
          }}>
            <div style={{
              display: 'flex',
              gap: '0.5rem',
              borderBottom: '1px solid #e5e7eb',
              paddingBottom: '1rem',
              marginBottom: '1rem'
            }}>
              <button
                onClick={() => setActiveTab('admitted')}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.5rem',
                  padding: '0.75rem 1.5rem',
                  borderRadius: '0.5rem',
                  border: 'none',
                  background: activeTab === 'admitted' ? 'linear-gradient(135deg, #10b981 0%, #059669 100%)' : 'transparent',
                  color: activeTab === 'admitted' ? 'white' : '#6b7280',
                  cursor: 'pointer',
                  fontWeight: 600,
                  fontSize: '0.875rem',
                  transition: 'all 0.2s ease',
                  boxShadow: activeTab === 'admitted' ? '0 4px 12px rgba(16, 185, 129, 0.3)' : 'none'
                }}
              >
                <HomeIcon style={{ width: '1.125rem', height: '1.125rem' }} />
                Đang nằm viện ({admittedCount} người)
              </button>
              <button
                onClick={() => setActiveTab('accepted')}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.5rem',
                  padding: '0.75rem 1.5rem',
                  borderRadius: '0.5rem',
                  border: 'none',
                  background: activeTab === 'accepted' ? 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)' : 'transparent',
                  color: activeTab === 'accepted' ? 'white' : '#6b7280',
                  cursor: 'pointer',
                  fontWeight: 600,
                  fontSize: '0.875rem',
                  transition: 'all 0.2s ease',
                  boxShadow: activeTab === 'accepted' ? '0 4px 12px rgba(245, 158, 11, 0.3)' : 'none'
                }}
              >
                <ExclamationTriangleIcon style={{ width: '1.125rem', height: '1.125rem' }} />
                Chưa nhập viện ({activeCount} người)
              </button>
              <button
                onClick={() => setActiveTab('discharged')}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.5rem',
                  padding: '0.75rem 1.5rem',
                  borderRadius: '0.5rem',
                  border: 'none',
                  background: activeTab === 'discharged' ? 'linear-gradient(135deg, #6b7280 0%, #374151 100%)' : 'transparent',
                  color: activeTab === 'discharged' ? 'white' : '#6b7280',
                  cursor: 'pointer',
                  fontWeight: 600,
                  fontSize: '0.875rem',
                  transition: 'all 0.2s ease',
                  boxShadow: activeTab === 'discharged' ? '0 4px 12px rgba(107, 114, 128, 0.3)' : 'none'
                }}
              >
                Đã xuất viện ({dischargedCount} người)
              </button>
            </div>

            {/* Thông báo cho tab "Chưa nhập viện" */}
            {activeTab === 'accepted' && Object.keys(unpaidBills).length > 0 && (
              <div style={{
                background: 'rgba(239, 68, 68, 0.05)',
                border: '1px solid rgba(239, 68, 68, 0.2)',
                borderRadius: '0.75rem',
                padding: '1rem',
                marginBottom: '1rem'
              }}>
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.75rem',
                  marginBottom: '0.5rem'
                }}>
                  <div style={{
                    width: '2rem',
                    height: '2rem',
                    background: 'rgba(239, 68, 68, 0.1)',
                    borderRadius: '50%',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center'
                  }}>
                    <svg style={{ width: '1rem', height: '1rem', color: '#dc2626' }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
                    </svg>
                  </div>
                  <h3 style={{
                    fontSize: '1rem',
                    fontWeight: 600,
                    color: '#dc2626',
                    margin: 0
                  }}>
                    Thông báo thanh toán
                  </h3>
                </div>
                <p style={{
                  fontSize: '0.875rem',
                  color: '#6b7280',
                  margin: 0,
                  lineHeight: '1.5'
                }}>
                  Có {Object.keys(unpaidBills).length} người cao tuổi chưa thanh toán hóa đơn. 
                  Vui lòng liên hệ gia đình để hoàn tất thanh toán trước khi xác nhận nhập viện.
                </p>
              </div>
            )}

          </div>

          {isLoading ? (
            <div style={{
              background: 'linear-gradient(135deg, #ffffff 0%, #f8fafc 100%)',
              borderRadius: '1rem',
              padding: '3rem',
              textAlign: 'center',
              boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
              border: '1px solid rgba(255, 255, 255, 0.2)'
            }}>
              <div style={{
                display: 'inline-block',
                width: '2rem',
                height: '2rem',
                border: '3px solid #e5e7eb',
                borderTop: '3px solid #667eea',
                borderRadius: '50%',
                animation: 'spin 1s linear infinite',
                marginBottom: '1rem'
              }}></div>
              <h3 style={{
                fontSize: '1.125rem',
                fontWeight: 600,
                margin: '0 0 0.5rem 0',
                color: '#374151'
              }}>
                Đang tải dữ liệu...
              </h3>
              <p style={{ margin: 0, fontSize: '0.875rem', color: '#6b7280' }}>
                Vui lòng chờ trong giây lát
              </p>
            </div>
          ) : hasError ? (
            <div style={{
              background: 'linear-gradient(135deg, #ffffff 0%, #f8fafc 100%)',
              borderRadius: '1rem',
              padding: '3rem',
              textAlign: 'center',
              boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
              border: '1px solid rgba(255, 255, 255, 0.2)'
            }}>
              <div style={{
                width: '3rem',
                height: '3rem',
                margin: '0 auto 1rem',
                color: '#ef4444'
              }}>
                <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
                </svg>
              </div>
              <h3 style={{
                fontSize: '1.125rem',
                fontWeight: 600,
                margin: '0 0 0.5rem 0',
                color: '#374151'
              }}>
                Lỗi tải dữ liệu
              </h3>
              <p style={{ margin: '0 0 1rem 0', fontSize: '0.875rem', color: '#6b7280' }}>
                Không thể tải danh sách người cao tuổi
              </p>
              <button
                onClick={() => {
                  if (activeTab === 'admitted') return mutateAdmitted();
                  if (activeTab === 'accepted') return mutateActive();
                  return mutateAll();
                }}
                style={{
                  padding: '0.75rem 1.5rem',
                  background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                  color: 'white',
                  border: 'none',
                  borderRadius: '0.5rem',
                  fontSize: '0.875rem',
                  fontWeight: 500,
                  cursor: 'pointer',
                  transition: 'all 0.2s ease'
                }}
                onMouseOver={(e) => {
                  e.currentTarget.style.background = 'linear-gradient(135deg, #5a67d8 0%, #6b46c1 100%)';
                }}
                onMouseOut={(e) => {
                  e.currentTarget.style.background = 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)';
                }}
              >
                Thử lại
              </button>
            </div>
          ) : (
            activeTab === 'admitted' ? renderResidentsTable(admittedResidents, true) : 
            activeTab === 'accepted' ? renderResidentsTable(acceptedResidents, true) : 
            renderResidentsTable(dischargedResidents, false)
          )}

        </div>

        {showDeleteModal && (
          <div style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: 'rgba(0, 0, 0, 0.6)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1000,
            backdropFilter: 'blur(10px)'
          }}>
            <div style={{
              background: 'white',
              borderRadius: '1rem',
              padding: '2rem',
              maxWidth: '400px',
              width: '90%',
              boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)'
            }}>
              <h3 style={{ fontSize: '1.25rem', fontWeight: 700, margin: '0 0 1rem 0', color: '#111827' }}>
                Xác nhận xóa thông tin người cao tuổi
              </h3>
              <p style={{ margin: '0 0 1.5rem 0', color: '#6b7280' }}>
                Bạn có chắc chắn muốn xóa thông tin người cao tuổi này? Hành động này sẽ chỉ xóa thông tin resident mà không ảnh hưởng đến tài khoản gia đình. Hành động này không thể hoàn tác.
              </p>
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '1rem' }}>
                <button
                  onClick={cancelDelete}
                  style={{
                    padding: '0.75rem 1.5rem',
                    borderRadius: '0.5rem',
                    border: '1px solid #d1d5db',
                    background: 'white',
                    color: '#6b7280',
                    cursor: 'pointer',
                    fontWeight: 600
                  }}
                >
                  Hủy bỏ
                </button>
              </div>
            </div>
          </div>
        )}

        {showDischargeModal && residentToDischarge && (
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
            zIndex: 1000
          }}>
            <div style={{
              background: 'white',
              borderRadius: '1rem',
              padding: '2rem',
              maxWidth: '500px',
              width: '90%',
              boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1)',
              textAlign: 'center'
            }}>
              <div style={{
                width: '3rem',
                height: '3rem',
                borderRadius: '50%',
                background: 'linear-gradient(135deg, #a855f7 0%, #9333ea 100%)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                margin: '0 auto 1rem'
              }}>
                <svg style={{ width: '1.5rem', height: '1.5rem', color: 'white' }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                </svg>
              </div>
              <h3 style={{
                fontSize: '1.25rem',
                fontWeight: 600,
                margin: '0 0 0.5rem 0',
                color: '#1f2937'
              }}>
                {isDeceased ? 'Xác nhận qua đời' : 'Xác nhận xuất viện'}
              </h3>
              <p style={{
                fontSize: '0.875rem',
                color: '#6b7280',
                margin: '0 0 1rem 0',
                lineHeight: '1.5'
              }}>
                Bạn có chắc chắn muốn {isDeceased ? 'đánh dấu' : 'xuất viện'} <strong>{residentToDischarge.name}</strong>?
              </p>

              {/* Checkbox for deceased status */}
              <div style={{
                background: 'rgba(239, 68, 68, 0.05)',
                borderRadius: '0.5rem',
                padding: '1rem',
                margin: '0 0 1rem 0',
                border: '1px solid rgba(239, 68, 68, 0.1)'
              }}>
                <label style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.5rem',
                  fontSize: '0.875rem',
                  fontWeight: 600,
                  color: '#374151',
                  cursor: 'pointer'
                }}>
                  <input
                    type="checkbox"
                    checked={isDeceased}
                    onChange={(e) => setIsDeceased(e.target.checked)}
                    style={{
                      width: '1rem',
                      height: '1rem',
                      accentColor: '#ef4444'
                    }}
                  />
                  <span>Người cao tuổi đã qua đời</span>
                </label>
              </div>

              <div style={{
                background: 'rgba(102, 126, 234, 0.05)',
                borderRadius: '0.5rem',
                padding: '1rem',
                margin: '0 0 1rem 0',
                border: '1px solid rgba(102, 126, 234, 0.1)'
              }}>
                <label style={{
                  display: 'block',
                  fontSize: '0.875rem',
                  fontWeight: 600,
                  color: '#374151',
                  marginBottom: '0.5rem'
                }}>
                  {isDeceased ? 'Lý do qua đời' : 'Lý do xuất viện'} <span style={{ color: '#ef4444' }}>*</span>
                </label>
                <textarea
                  value={dischargeReason}
                  onChange={(e) => setDischargeReason(e.target.value)}
                  placeholder={isDeceased ? "Nhập lý do qua đời..." : "Nhập lý do xuất viện..."}
                  style={{
                    width: '100%',
                    minHeight: '80px',
                    padding: '0.75rem',
                    borderRadius: '0.375rem',
                    border: '1px solid #d1d5db',
                    fontSize: '0.875rem',
                    fontFamily: 'inherit',
                    resize: 'vertical',
                    outline: 'none',
                    transition: 'border-color 0.2s ease'
                  }}
                  onFocus={(e) => {
                    e.currentTarget.style.borderColor = '#667eea';
                  }}
                  onBlur={(e) => {
                    e.currentTarget.style.borderColor = '#d1d5db';
                  }}
                />
                {!dischargeReason.trim() && (
                  <p style={{
                    fontSize: '0.75rem',
                    color: '#ef4444',
                    margin: '0.25rem 0 0 0'
                  }}>
                    Vui lòng nhập {isDeceased ? 'lý do qua đời' : 'lý do xuất viện'}
                  </p>
                )}
              </div>
              <div style={{
                background: 'rgba(168, 85, 247, 0.1)',
                borderRadius: '0.5rem',
                padding: '1rem',
                margin: '0 0 1.5rem 0',
                textAlign: 'left'
              }}>
                <p style={{
                  fontSize: '0.875rem',
                  color: '#7c3aed',
                  margin: '0 0 0.5rem 0',
                  fontWeight: 600
                }}>
                  Hành động này sẽ:
                </p>
                <ul style={{
                  fontSize: '0.875rem',
                  color: '#6b7280',
                  margin: 0,
                  paddingLeft: '1rem'
                }}>
                  <li>Xóa người cao tuổi khỏi phòng và giường hiện tại</li>
                  <li>Kết thúc tất cả các gói dịch vụ đang sử dụng</li>
                  <li>Cập nhật trạng thái thành "{isDeceased ? 'Đã qua đời' : 'Đã xuất viện'}"</li>
                  <li>Ghi nhận ngày {isDeceased ? 'qua đời' : 'xuất viện'}</li>
                </ul>
              </div>
              <div style={{
                display: 'flex',
                gap: '0.75rem',
                justifyContent: 'center'
              }}>
                <button
                  onClick={cancelDischarge}
                  disabled={discharging}
                  style={{
                    padding: '0.75rem 1.5rem',
                    background: 'white',
                    color: '#6b7280',
                    border: '1px solid #d1d5db',
                    borderRadius: '0.5rem',
                    fontSize: '0.875rem',
                    fontWeight: 500,
                    cursor: discharging ? 'not-allowed' : 'pointer',
                    transition: 'all 0.2s ease',
                    opacity: discharging ? 0.6 : 1
                  }}
                  onMouseOver={(e) => {
                    if (!discharging) {
                      e.currentTarget.style.background = '#f9fafb';
                      e.currentTarget.style.borderColor = '#9ca3af';
                    }
                  }}
                  onMouseOut={(e) => {
                    if (!discharging) {
                      e.currentTarget.style.background = 'white';
                      e.currentTarget.style.borderColor = '#d1d5db';
                    }
                  }}
                >
                  Hủy
                </button>
                <button
                  onClick={confirmDischarge}
                  disabled={discharging || !dischargeReason.trim()}
                  style={{
                    padding: '0.75rem 1.5rem',
                    background: (discharging || !dischargeReason.trim()) ? '#9ca3af' : 'linear-gradient(135deg, #a855f7 0%, #9333ea 100%)',
                    color: 'white',
                    border: 'none',
                    borderRadius: '0.5rem',
                    fontSize: '0.875rem',
                    fontWeight: 500,
                    cursor: (discharging || !dischargeReason.trim()) ? 'not-allowed' : 'pointer',
                    transition: 'all 0.2s ease',
                    opacity: (discharging || !dischargeReason.trim()) ? 0.6 : 1
                  }}
                  onMouseOver={(e) => {
                    if (!discharging && dischargeReason.trim()) {
                      e.currentTarget.style.background = 'linear-gradient(135deg, #9333ea 0%, #7c3aed 100%)';
                    }
                  }}
                  onMouseOut={(e) => {
                    if (!discharging && dischargeReason.trim()) {
                      e.currentTarget.style.background = 'linear-gradient(135deg, #a855f7 0%, #9333ea 100%)';
                    }
                  }}
                >
                  {discharging ? (
                    <>
                      <div style={{
                        display: 'inline-block',
                        width: '1rem',
                        height: '1rem',
                        border: '2px solid transparent',
                        borderTop: '2px solid white',
                        borderRadius: '50%',
                        animation: 'spin 1s linear infinite',
                        marginRight: '0.5rem'
                      }}></div>
                      Đang xử lý...
                    </>
                  ) : (
                    isDeceased ? 'Xác nhận qua đời' : 'Xác nhận xuất viện'
                  )}
                </button>
              </div>
            </div>
          </div>
        )}

        {showSuccessModal && (
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
            zIndex: 1000
          }}>
            <div style={{
              background: 'white',
              borderRadius: '1rem',
              padding: '2rem',
              maxWidth: '400px',
              width: '90%',
              boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1)',
              textAlign: 'center'
            }}>
              <div style={{
                width: '3rem',
                height: '3rem',
                borderRadius: '50%',
                background: modalType === 'success' ? 'linear-gradient(135deg, #10b981 0%, #059669 100%)' : 'linear-gradient(135deg, #ef4444 0%, #dc2626 100%)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                margin: '0 auto 1rem'
              }}>
                {modalType === 'success' ? (
                  <svg style={{ width: '1.5rem', height: '1.5rem', color: 'white' }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                ) : (
                  <svg style={{ width: '1.5rem', height: '1.5rem', color: 'white' }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
                  </svg>
                )}
              </div>
              <h3 style={{
                fontSize: '1.125rem',
                fontWeight: 600,
                margin: '0 0 0.5rem 0',
                color: '#1f2937'
              }}>
                {modalType === 'success' ? 'Thành công' : 'Lỗi'}
              </h3>
              <p style={{
                fontSize: '0.875rem',
                color: '#6b7280',
                margin: '0 0 1.5rem 0',
                lineHeight: '1.5'
              }}>
                {successMessage}
              </p>
              <button
                onClick={() => setShowSuccessModal(false)}
                style={{
                  padding: '0.75rem 1.5rem',
                  background: 'linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)',
                  color: 'white',
                  border: 'none',
                  borderRadius: '0.5rem',
                  fontSize: '0.875rem',
                  fontWeight: 500,
                  cursor: 'pointer',
                  transition: 'all 0.2s ease'
                }}
                onMouseOver={(e) => {
                  e.currentTarget.style.background = 'linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%)';
                }}
                onMouseOut={(e) => {
                  e.currentTarget.style.background = 'linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)';
                }}
              >
                OK
              </button>
            </div>
          </div>
        )}
      </div>
    </>
  );
}