"use client";

import React, { useEffect, useMemo, useState, useRef } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useAuth } from '@/lib/contexts/auth-context';
import { carePlansAPI, residentAPI, roomsAPI, bedsAPI, roomTypesAPI, bedAssignmentsAPI, userAPI, apiClient } from '@/lib/api';
import { useOptimizedCarePlansAll, useOptimizedResidentsByRole, useOptimizedRooms, useOptimizedBeds, useOptimizedRoomTypes, useResidentsAssignmentStatus } from '@/hooks/useOptimizedData';
import { ArrowLeftIcon, CheckCircleIcon, UserIcon, MagnifyingGlassIcon, FunnelIcon, CalendarIcon, PhoneIcon, MapPinIcon, GiftIcon, PlusIcon } from '@heroicons/react/24/outline';
import DatePicker from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';

export default function SelectPackagesPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { user } = useAuth();

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [carePlans, setCarePlans] = useState<any[]>([]);
  const [mainPackageId, setMainPackageId] = useState<string>('');
  const [supplementaryIds, setSupplementaryIds] = useState<string[]>([]);
  const [residents, setResidents] = useState<any[]>([]);
  const [selectedResidentId, setSelectedResidentId] = useState<string>('');
  
  // State cho search và filter
  const [searchTerm, setSearchTerm] = useState('');
  const [sortBy, setSortBy] = useState('name'); // 'name', 'age', 'gender'
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(6);
  
  // State cho search và filter gói dịch vụ
  const [packageSearchTerm, setPackageSearchTerm] = useState('');
  const [packageSortBy, setPackageSortBy] = useState('name'); // 'name', 'price', 'type'
  const [packageCurrentPage, setPackageCurrentPage] = useState(1);
  const [packageItemsPerPage] = useState(4);
  
  // Thêm state cho phòng và giường
  const [step, setStep] = useState(1);
  const [roomType, setRoomType] = useState('');
  const [selectedRoomId, setSelectedRoomId] = useState('');
  const [selectedBedId, setSelectedBedId] = useState('');
  const [rooms, setRooms] = useState<any[]>([]);
  const [beds, setBeds] = useState<any[]>([]);
  const [roomTypes, setRoomTypes] = useState<any[]>([]);
  const [loadingRooms, setLoadingRooms] = useState(false);
  const [loadingBeds, setLoadingBeds] = useState(false);
  const [loadingRoomTypes, setLoadingRoomTypes] = useState(false);
  
  // State cho thông tin bổ sung
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [registrationPeriod, setRegistrationPeriod] = useState('6'); // 6 tháng hoặc 12 tháng
  const [medicalNotes, setMedicalNotes] = useState('');
  const [familyPreferences, setFamilyPreferences] = useState({ 
    preferred_room_gender: '', 
    preferred_floor: '', 
    special_requests: '' 
  });
  
  // State cho validation
  const [validationErrors, setValidationErrors] = useState<{[key: string]: string}>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showSupplementaryDetails, setShowSupplementaryDetails] = useState(false);
  const [showTimeDetails, setShowTimeDetails] = useState(false);

  const residentId = searchParams.get('residentId') || '';

  // Filter và sort residents - chỉ hiển thị những resident chưa đăng ký dịch vụ
  const [residentsWithAssignmentStatus, setResidentsWithAssignmentStatus] = useState<{[key: string]: boolean}>({});
  const [loadingAssignmentStatus, setLoadingAssignmentStatus] = useState(false);

  // Tự động tính ngày kết thúc khi thay đổi ngày bắt đầu hoặc thời gian đăng ký
  useEffect(() => {
    if (startDate && registrationPeriod) {
      const start = new Date(startDate);
      const end = new Date(start);
      end.setMonth(end.getMonth() + parseInt(registrationPeriod));
      setEndDate(end.toISOString().split('T')[0]);
    }
  }, [startDate, registrationPeriod]);

  const { data: assignmentMap, fetch: fetchAssignmentMap } = useResidentsAssignmentStatus(residents);
  
  // Use a ref to track if we've already fetched for the current residents
  const residentsRef = useRef<string>('');
  const currentResidentsKey = residents.map(r => r._id || r.id).join('_');
  
  useEffect(() => {
    if (residents.length === 0) return;
    if (residentsRef.current === currentResidentsKey) return; // Already fetched for these residents
    
    setLoadingAssignmentStatus(true);
    fetchAssignmentMap()
      .finally(() => {
        setLoadingAssignmentStatus(false);
        residentsRef.current = currentResidentsKey;
      });
  }, [currentResidentsKey, fetchAssignmentMap]);

  useEffect(() => {
    setResidentsWithAssignmentStatus(assignmentMap || {});
  }, [assignmentMap]);

  const filteredAndSortedResidents = useMemo(() => {
    console.log('🔍 Filtering residents...');
    console.log('📊 Assignment status map:', residentsWithAssignmentStatus);
    console.log('👥 Total residents:', residents.length);
    console.log('⏳ Loading assignment status:', loadingAssignmentStatus);
    
    // Nếu đang loading assignment status, hiển thị tất cả residents
    if (loadingAssignmentStatus) {
      console.log('⏳ Still loading assignment status, showing all residents');
      return residents.filter(resident => {
        const name = (resident.full_name || resident.name || '').toLowerCase();
        const searchLower = searchTerm.toLowerCase();
        return name.includes(searchLower);
      });
    }
    
    // Chỉ filter khi đã có assignment status
    let filtered = residents.filter(resident => {
      const residentId = resident._id || resident.id;
      
      // Kiểm tra resident chưa có phòng giường (chưa đăng ký dịch vụ)
      const hasAssignment = residentsWithAssignmentStatus[residentId];
      
      console.log(`👤 Resident ${resident.full_name || resident.name} (${residentId}):`, {
        hasAssignment: hasAssignment,
        willShow: !hasAssignment
      });
      
      // Nếu có assignment thì loại bỏ
      if (hasAssignment) {
        console.log(`❌ Excluding ${resident.full_name || resident.name} - has assignment`);
        return false;
      }
      
      // Filter theo search term
      const name = (resident.full_name || resident.name || '').toLowerCase();
      const searchLower = searchTerm.toLowerCase();
      const matchesSearch = name.includes(searchLower);
      
      console.log(`✅ Including ${resident.full_name || resident.name} - no assignment, search match: ${matchesSearch}`);
      return matchesSearch;
    });
    
    console.log('📋 Final filtered count:', filtered.length);
    return filtered;

    // Sort
    filtered.sort((a, b) => {
      switch (sortBy) {
        case 'name':
          return (a.full_name || a.name || '').localeCompare(b.full_name || b.name || '');
        case 'age':
          return (b.age || 0) - (a.age || 0);
        case 'gender':
          return (a.gender || '').localeCompare(b.gender || '');
        default:
          return 0;
      }
    });

    return filtered;
  }, [residents, searchTerm, sortBy, residentsWithAssignmentStatus, loadingAssignmentStatus]);

  // Pagination
  const totalPages = Math.ceil(filteredAndSortedResidents.length / itemsPerPage);
  const paginatedResidents = filteredAndSortedResidents.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  // Steps array
  const steps = [
    'Chọn người thụ hưởng',
    'Chọn gói dịch vụ',
    'Chọn loại phòng',
    'Chọn phòng',
    'Chọn giường',
    'Thông tin bổ sung',
    'Xem lại & xác nhận',
    'Hoàn tất'
  ];

  useEffect(() => {
    if (!user) {
      router.push('/login');
      return;
    }
    if (!user.role || !['admin', 'staff', 'family'].includes(user.role)) {
      router.push('/');
      return;
    }
  }, [user, router]);

  const { data: carePlansData, fetch: fetchCarePlans } = useOptimizedCarePlansAll();
  useEffect(() => {
    setLoading(true);
    setError(null);
    fetchCarePlans()
      .then((data) => {
        const next = Array.isArray(data) ? data : Array.isArray(carePlansData) ? carePlansData : [];
        setCarePlans(next);
      })
      .catch(() => setError('Không thể tải danh sách gói dịch vụ'))
      .finally(() => setLoading(false));
  }, [fetchCarePlans]);

  // Load residents when user is available and residentId is not preselected
  const { data: residentsData, fetch: fetchResidents } = useOptimizedResidentsByRole(user?.role, user?.id);
  useEffect(() => {
    if (!user) return;
    if (residentId) {
      setSelectedResidentId(residentId);
      setStep(2);
      return;
    }
    fetchResidents()
      .then((data) => {
        const next = Array.isArray(data) ? data : Array.isArray(residentsData) ? residentsData : [];
        setResidents(next);
      })
      .catch(() => setResidents([]));
  }, [user, residentId, fetchResidents]);

  // Load rooms, beds, room types
  const { data: roomTypesData, fetch: fetchRoomTypes } = useOptimizedRoomTypes();
  useEffect(() => {
    setLoadingRoomTypes(true);
    fetchRoomTypes()
      .then((data) => {
        const next = Array.isArray(data) ? data : Array.isArray(roomTypesData) ? roomTypesData : [];
        setRoomTypes(next);
      })
      .catch(() => setRoomTypes([]))
      .finally(() => setLoadingRoomTypes(false));
  }, [fetchRoomTypes]);

  const { data: roomsData, fetch: fetchRooms } = useOptimizedRooms();
  useEffect(() => {
    setLoadingRooms(true);
    fetchRooms()
      .then((data) => {
        const next = Array.isArray(data) ? data : Array.isArray(roomsData) ? roomsData : [];
        setRooms(next);
      })
      .catch(() => setRooms([]))
      .finally(() => setLoadingRooms(false));
  }, [fetchRooms]);

  const { data: bedsData, fetch: fetchBeds } = useOptimizedBeds();
  useEffect(() => {
    setLoadingBeds(true);
    fetchBeds()
      .then((data) => {
        const next = Array.isArray(data) ? data : Array.isArray(bedsData) ? bedsData : [];
        setBeds(next);
      })
      .catch(() => setBeds([]))
      .finally(() => setLoadingBeds(false));
  }, [fetchBeds]);

  const mainPlans = useMemo(() => carePlans.filter((p) => p?.category === 'main' && p?.is_active !== false), [carePlans]);
  const supplementaryPlans = useMemo(() => carePlans.filter((p) => p?.category !== 'main' && p?.is_active !== false), [carePlans]);

  // Filter và sort packages
  const filteredAndSortedMainPlans = useMemo(() => {
    let filtered = mainPlans.filter(plan => 
      plan.plan_name?.toLowerCase().includes(packageSearchTerm.toLowerCase()) ||
      plan.description?.toLowerCase().includes(packageSearchTerm.toLowerCase())
    );

    switch (packageSortBy) {
      case 'name':
        filtered.sort((a, b) => (a.plan_name || '').localeCompare(b.plan_name || ''));
        break;
      case 'price':
        filtered.sort((a, b) => (a.monthly_price || 0) - (b.monthly_price || 0));
        break;
      case 'type':
        filtered.sort((a, b) => (a.plan_type || '').localeCompare(b.plan_type || ''));
        break;
    }

    return filtered;
  }, [mainPlans, packageSearchTerm, packageSortBy]);

  const filteredAndSortedSupplementaryPlans = useMemo(() => {
    let filtered = supplementaryPlans.filter(plan => 
      plan.plan_name?.toLowerCase().includes(packageSearchTerm.toLowerCase()) ||
      plan.description?.toLowerCase().includes(packageSearchTerm.toLowerCase())
    );

    switch (packageSortBy) {
      case 'name':
        filtered.sort((a, b) => (a.plan_name || '').localeCompare(b.plan_name || ''));
        break;
      case 'price':
        filtered.sort((a, b) => (a.monthly_price || 0) - (b.monthly_price || 0));
        break;
      case 'type':
        filtered.sort((a, b) => (a.plan_type || '').localeCompare(b.plan_type || ''));
        break;
    }

    return filtered;
  }, [supplementaryPlans, packageSearchTerm, packageSortBy]);

  // Pagination cho packages
  const paginatedMainPlans = useMemo(() => {
    const startIndex = (packageCurrentPage - 1) * packageItemsPerPage;
    return filteredAndSortedMainPlans.slice(startIndex, startIndex + packageItemsPerPage);
  }, [filteredAndSortedMainPlans, packageCurrentPage, packageItemsPerPage]);

  const paginatedSupplementaryPlans = useMemo(() => {
    const startIndex = (packageCurrentPage - 1) * packageItemsPerPage;
    return filteredAndSortedSupplementaryPlans.slice(startIndex, startIndex + packageItemsPerPage);
  }, [filteredAndSortedSupplementaryPlans, packageCurrentPage, packageItemsPerPage]);

  const totalMainPages = Math.ceil(filteredAndSortedMainPlans.length / packageItemsPerPage);
  const totalSupplementaryPages = Math.ceil(filteredAndSortedSupplementaryPlans.length / packageItemsPerPage);

  // Function to validate avatar URL
  const isValidAvatarUrl = (avatar: string) => {
    if (!avatar || avatar === '' || avatar === 'null') return false;
    if (avatar.includes('default') || avatar.includes('placeholder') || avatar.includes('generic')) return false;
    if (avatar.startsWith('data:')) return true;
    
    // Check if it's a valid URL format
    try {
      const url = new URL(avatar);
      return url.protocol === 'http:' || url.protocol === 'https:';
    } catch {
      // If it's not a valid URL, it might be a relative path
      return avatar.startsWith('/') || avatar.startsWith('./');
    }
  };

  // Function to get beds for a specific room with gender filtering
  const getBedsForRoom = (roomId: string, residentGender?: string) => {
    console.log('Getting beds for room:', roomId, 'with gender:', residentGender);
    console.log('All beds:', beds);
    console.log('All rooms:', rooms);
    
    const selectedRoom = rooms.find(r => r._id === roomId);
    console.log('Selected room:', selectedRoom);
    
    // First try to get beds from API by room_id
    let apiBeds = beds.filter(b => b.room_id === roomId);
    console.log('API beds for room by room_id:', roomId, apiBeds);
    
    // If no beds found in API, try matching by room_number
    if (apiBeds.length === 0 && selectedRoom?.room_number) {
      apiBeds = beds.filter(b => b.room_number === selectedRoom.room_number);
      console.log('API beds by room_number:', selectedRoom.room_number, apiBeds);
    }
    
    // If still no beds from API, use room data as fallback
    if (apiBeds.length === 0 && selectedRoom?.bed_info) {
      console.log('Using room data as fallback for beds');
      const totalBeds = selectedRoom.bed_info.total_beds || selectedRoom.bed_count || 0;
      const availableBeds = selectedRoom.bed_info.available_beds || totalBeds;
      
      // Generate bed objects from room data
      const generatedBeds: any[] = [];
      for (let i = 1; i <= totalBeds; i++) {
        generatedBeds.push({
          _id: `${roomId}_bed_${i}`,
          bed_number: i,
          room_id: roomId,
          room_number: selectedRoom.room_number,
          status: i <= availableBeds ? 'available' : 'occupied'
        });
      }
      
      console.log('Generated beds from room data:', generatedBeds);
      return generatedBeds.filter((b: any) => b.status === 'available');
    }
    
    // Filter by gender if specified
    let filteredBeds = apiBeds.filter(b => b.status === 'available');
    
    if (residentGender && selectedRoom?.gender) {
      console.log('Filtering beds by gender:', residentGender, 'vs room gender:', selectedRoom.gender);
      
      // Only show beds if resident gender matches room gender
      if (residentGender.toLowerCase() !== selectedRoom.gender.toLowerCase()) {
        console.log('Gender mismatch - no beds available');
        return [];
      }
    }
    
    console.log('Final filtered beds:', filteredBeds);
    return filteredBeds;
  };

  // Function to format bed name properly
  const formatBedName = (bed: any, roomNumber?: string) => {
    // If bed_number is already in the correct format (like '101-A'), use it directly
    if (bed.bed_number && typeof bed.bed_number === 'string' && bed.bed_number.includes('-')) {
      return bed.bed_number;
    }
    
    // If bed_name exists, use it
    if (bed.bed_name) {
      return bed.bed_name;
    }
    
    // If we have room number and bed number, format it properly
    if (roomNumber && bed.bed_number) {
      const roomNum = roomNumber.replace(/\D/g, ''); // Extract only numbers from room number
      const bedLetter = String.fromCharCode(64 + parseInt(bed.bed_number)); // Convert 1->A, 2->B, etc.
      return `${roomNum}-${bedLetter}`;
    }
    
    // Fallback to bed_number or bed._id
    return bed.bed_number || `Giường ${bed._id}`;
  };

  const toggleSupplementary = (id: string) => {
    setSupplementaryIds((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]));
  };

  // Hàm handleContinue không còn cần thiết vì mỗi step có logic riêng

  const handleSubmit = async () => {
    if (!mainPackageId || (!residentId && !selectedResidentId)) return;
    
    setIsSubmitting(true);
    try {
      const finalResidentId = residentId || selectedResidentId;
      
      // Xử lý assigned_bed_id - chỉ gửi MongoDB ID thực tế
      let assignedBedId: string | null = null;
      
      // Kiểm tra xem selectedBedId có phải là MongoDB ID thực tế không
      if (selectedBedId && !selectedBedId.includes('_bed_')) {
        // Đây là MongoDB ID thực tế
        assignedBedId = selectedBedId;
      } else if (selectedBedId && selectedBedId.includes('_bed_')) {
        // Đây là generated bed ID, cần tìm MongoDB ID thực tế
        const selectedRoom = rooms.find(r => r._id === selectedRoomId);
        const resident = residents.find(r => r._id === finalResidentId);
        const residentGender = resident?.gender;
        
        // Lấy beds cho room này từ API
        const availableBeds = getBedsForRoom(selectedRoomId, residentGender);
        
        // Tìm bed có cùng bed_number
        const bedNumber = selectedBedId.split('_bed_')[1];
        const actualBed = availableBeds.find(b => b.bed_number == bedNumber && !b._id.includes('_bed_'));
        
        if (actualBed && actualBed._id) {
          assignedBedId = actualBed._id;
        } else {
          console.warn('No MongoDB ID found for bed:', selectedBedId);
        }
      }
      
      // Lấy thông tin resident để xác định gender
      const resident = residents.find(r => r._id === finalResidentId);
      const residentGender = resident?.gender || '';

      // Lấy room type từ selected room
      const selectedRoom = rooms.find(r => r._id === selectedRoomId);
      const selectedRoomType = selectedRoom?.room_type || '';

      const payload = {
        care_plan_ids: [mainPackageId, ...supplementaryIds],
        resident_id: finalResidentId,
        start_date: startDate,
        end_date: endDate,
        consultation_notes: medicalNotes || "",
        family_preferences: {
          preferred_room_gender: residentGender || "any", // Sử dụng gender của resident hoặc "any"
          preferred_floor: Number(familyPreferences.preferred_floor) || 0,
          special_requests: familyPreferences.special_requests || ""
        },
        assigned_room_id: selectedRoomId,
        selected_room_type: selectedRoomType, // Thêm room type
        ...(assignedBedId ? { assigned_bed_id: assignedBedId } : {}), // Chỉ gửi nếu có MongoDB ID thực tế
        status: "active"
      };

      console.log('Submitting payload:', payload);
      await apiClient.post('/care-plan-assignments', payload);
      setStep(8); // Hoàn tất
    } catch (error: any) {
      console.error('Error submitting:', error);
      // Handle error
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-200">
      <div className="max-w-6xl mx-auto p-8">
        {/* Stepper Header */}
        <div className="bg-gradient-to-br from-white to-slate-50 rounded-2xl border border-white/20 p-8 mb-8 shadow-lg">
          <div className="flex justify-between items-center max-w-5xl mx-auto">
            {steps.map((label, idx) => (
              <div key={label} className="text-center flex-1 relative">
                {/* Step Number */}
                <div className={`
                  w-14 h-14 rounded-full inline-flex items-center justify-center font-bold text-lg mb-4 transition-all duration-300 shadow-md
                  ${idx + 1 === step 
                    ? 'bg-gradient-to-r from-indigo-500 to-purple-600 text-white shadow-lg shadow-indigo-500/30' 
                    : idx + 1 < step 
                    ? 'bg-emerald-500 text-white shadow-lg shadow-emerald-500/30' 
                    : 'bg-white text-gray-400 border-2 border-gray-200'
                  }
                `}>
                  {idx + 1 < step ? '✓' : idx + 1}
                </div>
                
                {/* Step Label */}
                <div className={`
                  text-sm font-semibold leading-tight min-h-[2.5rem] flex items-center justify-center px-1
                  ${idx + 1 === step 
                    ? 'text-indigo-600' 
                    : idx + 1 < step 
                    ? 'text-emerald-600' 
                    : 'text-gray-500'
                  }
                `}>
                  {label}
                </div>
                
                {/* Connector Line */}
                {idx < steps.length - 1 && (
                  <div className={`
                    absolute top-7 left-full w-full h-0.5 transform -translate-y-1/2 z-0
                    ${idx + 1 < step ? 'bg-emerald-500' : 'bg-gray-200'}
                  `} />
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Step Content */}
        {step === 1 && (
          <div>
            {/* Header Section */}
            <div className="bg-gradient-to-br from-white to-slate-50 rounded-3xl p-8 mb-8 shadow-lg border border-white/20 backdrop-blur-sm">
              <div className="flex items-center gap-4">
                <button
                  onClick={() => router.push('/services')}
                  className="text-indigo-500 flex items-center justify-center w-12 h-12 rounded-xl bg-indigo-50 hover:bg-indigo-100 transition-colors duration-200 border-none cursor-pointer shadow-md"
                >
                  <ArrowLeftIcon className="h-6 w-6" />
                </button>
                <div className="flex items-center gap-4">
                  <div className="w-14 h-14 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-2xl flex items-center justify-center shadow-lg">
                    <UserIcon className="w-8 h-8 text-white" />
                  </div>
                  <div>
                    <h1 className="text-3xl font-bold m-0 bg-gradient-to-br from-indigo-500 to-purple-600 bg-clip-text text-transparent tracking-tight">
                      Chọn người thụ hưởng
                    </h1>
                    <p className="text-base text-slate-600 mt-1 font-medium">
                      Chọn người thân cần đăng ký dịch vụ
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {error && (
              <div className="bg-red-50 border border-red-200 text-red-600 p-4 rounded-lg mb-8">
                {error}
              </div>
            )}

            {!residentId && (
              <>
                {/* Search and Filter Section */}
                <div className="bg-gradient-to-br from-white to-slate-50 rounded-2xl p-6 mb-8 shadow-md border border-white/20">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 items-end">
                    {/* Search Input */}
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-2">
                        Tìm kiếm
                      </label>
                      <div className="relative">
                        <input
                          type="text"
                          placeholder="Tìm theo tên..."
                          value={searchTerm}
                          onChange={(e) => {
                            setSearchTerm(e.target.value);
                            setCurrentPage(1);
                          }}
                          className="w-full px-4 py-3 pl-10 rounded-lg border border-gray-300 text-sm bg-white"
                        />
                        <MagnifyingGlassIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                      </div>
                    </div>

                    {/* Sort Dropdown */}
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-2">
                        Sắp xếp
                      </label>
                      <select
                        value={sortBy}
                        onChange={(e) => setSortBy(e.target.value)}
                        className="w-full px-4 py-3 rounded-lg border border-gray-300 text-sm bg-white"
                      >
                        <option value="name">Sắp xếp theo tên</option>
                        <option value="age">Sắp xếp theo tuổi</option>
                        <option value="gender">Sắp xếp theo giới tính</option>
                      </select>
                    </div>
                  </div>
                  
                  {/* Results Count */}
                  <div className="mt-4 bg-indigo-50 p-3 rounded-lg border border-indigo-200">
                    <p className="text-sm text-indigo-600 m-0 font-semibold">
                      Hiển thị: {paginatedResidents.length} trong tổng số {filteredAndSortedResidents.length} người thụ hưởng chưa đăng ký dịch vụ
                    </p>
                  </div>
                </div>

                {/* Residents List */}
                <div className="bg-gradient-to-br from-white to-slate-50 rounded-2xl overflow-hidden shadow-md border border-white/20">
                  <div className="p-6">
                                      {loadingAssignmentStatus ? (
                    <div className="text-center py-12">
                      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto mb-4"></div>
                      <h3 className="text-lg font-semibold mb-2 text-gray-700">
                        Đang kiểm tra trạng thái đăng ký...
                      </h3>
                      <p className="m-0 text-sm text-gray-500">
                        Vui lòng chờ trong giây lát.
                      </p>
                    </div>
                  ) : residents.length === 0 ? (
                    <div className="text-center py-12">
                      <UserIcon className="w-12 h-12 mx-auto mb-4 text-gray-300" />
                      <h3 className="text-lg font-semibold mb-2 text-gray-700">
                        Không có người thụ hưởng
                      </h3>
                      <p className="m-0 text-sm text-gray-500">
                        Vui lòng liên hệ quản trị viên để thêm người thụ hưởng.
                      </p>
                    </div>
                  ) : filteredAndSortedResidents.length === 0 ? (
                        <div className="text-center py-12">
                          {searchTerm ? (
                            <>
                              <MagnifyingGlassIcon className="w-12 h-12 mx-auto mb-4 text-gray-300" />
                              <h3 className="text-lg font-semibold mb-2 text-gray-700">
                                Không tìm thấy kết quả
                              </h3>
                              <p className="m-0 text-sm text-gray-500">
                                Thử thay đổi từ khóa tìm kiếm.
                              </p>
                            </>
                          ) : (
                            <>
                              <UserIcon className="w-12 h-12 mx-auto mb-4 text-gray-300" />
                              <h3 className="text-lg font-semibold mb-2 text-gray-700">
                                Tất cả người thụ hưởng đã được đăng ký dịch vụ
                              </h3>
                              <p className="m-0 text-sm text-gray-500">
                                Không có người thụ hưởng nào chưa được phân phòng giường.
                              </p>
                            </>
                          )}
                        </div>
                    ) : (
                      <>
                        <div className="space-y-3">
                          {paginatedResidents.map((r) => (
                            <label 
                              key={r._id || r.id} 
                              className={`
                                group relative border rounded-xl p-4 cursor-pointer transition-all duration-200 hover:shadow-md block w-full
                                ${selectedResidentId === (r._id || r.id) 
                                  ? 'border-indigo-500 bg-indigo-50 shadow-lg' 
                                  : 'border-gray-200 bg-white hover:border-indigo-300'
                                }
                              `}
                              style={{ minHeight: '60px' }}
                            >
                              <input 
                                type="radio" 
                                name="resident" 
                                checked={selectedResidentId === (r._id || r.id)} 
                                onChange={() => setSelectedResidentId(r._id || r.id)}
                                className="sr-only"
                              />
                              
                                                             <div className="flex items-center gap-3 w-full">
                                 {/* Avatar */}
                                 <div className="relative">
                                   {isValidAvatarUrl(r.avatar) ? (
                                     <img 
                                       src={r.avatar.startsWith('data:') ? r.avatar : r.avatar}
                                       alt={r.full_name || r.name || 'Avatar'}
                                       className="w-10 h-10 rounded-full object-cover flex-shrink-0 shadow-md"
                                       onError={(e) => {
                                         // Fallback to default avatar if image fails to load
                                         const target = e.target as HTMLImageElement;
                                         target.style.display = 'none';
                                         target.nextElementSibling?.classList.remove('hidden');
                                       }}
                                       onLoad={(e) => {
                                         // Hide default avatar when image loads successfully
                                         const target = e.target as HTMLImageElement;
                                         target.nextElementSibling?.classList.add('hidden');
                                       }}
                                     />
                                   ) : null}
                                   <div className={`w-10 h-10 bg-gray-200 rounded-full flex items-center justify-center flex-shrink-0 shadow-md ${isValidAvatarUrl(r.avatar) ? 'hidden' : ''}`}>
                                     <UserIcon className="w-6 h-6 text-gray-500" />
                                   </div>
                                 </div>
                                 
                                 {/* Main Info */}
                                 <div className="flex-1 min-w-0 overflow-hidden">
                                   <div className="flex items-center gap-2">
                                     <div className="font-semibold text-gray-900 text-base truncate">{r.full_name || r.name}</div>
                                   </div>
                                   
                                   {/* Date of Birth, Gender & Age */}
                                   <div className="flex items-center gap-3 text-xs text-gray-600 mt-1">
                                     {r.date_of_birth && (
                                       <div className="flex items-center gap-1">
                                         <CalendarIcon className="w-3 h-3 flex-shrink-0" />
                                         <span>{new Date(r.date_of_birth).toLocaleDateString('vi-VN')}</span>
                                       </div>
                                     )}
                                     {r.gender && (
                                       <div className="flex items-center gap-1">
                                         <UserIcon className="w-3 h-3 flex-shrink-0" />
                                         <span>{r.gender === 'male' ? 'Nam' : r.gender === 'female' ? 'Nữ' : r.gender}</span>
                                       </div>
                                     )}
                                     {r.age && (
                                       <span className="px-2 py-0.5 text-xs font-medium bg-blue-100 text-blue-600 rounded-full">
                                         {r.age} tuổi
                                       </span>
                                     )}
                                   </div>
                                   
                                   {/* Contact Info - Compact */}
                                   {r.phone && (
                                     <div className="flex items-center gap-1 text-xs text-gray-500 mt-1">
                                       <PhoneIcon className="w-3 h-3 flex-shrink-0" />
                                       <span className="truncate">{r.phone}</span>
                                     </div>
                                   )}
                                 </div>
                                 
                                 {/* Selection indicator */}
                                 <div className={`
                                   w-5 h-5 rounded-full border-2 flex items-center justify-center flex-shrink-0
                                   ${selectedResidentId === (r._id || r.id)
                                     ? 'border-indigo-500 bg-indigo-500'
                                     : 'border-gray-300 group-hover:border-indigo-300'
                                   }
                                 `}>
                                   {selectedResidentId === (r._id || r.id) && (
                                     <CheckCircleIcon className="w-3 h-3 text-white" />
                                   )}
                                 </div>
                               </div>
                            </label>
                          ))}
                        </div>

                        {/* Pagination */}
                        {totalPages > 1 && (
                          <div className="mt-6 flex justify-center">
                            <nav className="flex items-center gap-2">
                              <button
                                onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                                disabled={currentPage === 1}
                                className="px-4 py-2 text-sm border border-gray-300 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50 transition-colors"
                              >
                                Trước
                              </button>
                              
                              {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                                <button
                                  key={page}
                                  onClick={() => setCurrentPage(page)}
                                  className={`
                                    px-4 py-2 text-sm border rounded-lg transition-colors
                                    ${currentPage === page
                                      ? 'bg-indigo-500 text-white border-indigo-500'
                                      : 'border-gray-300 text-gray-700 hover:bg-gray-50'
                                    }
                                  `}
                                >
                                  {page}
                                </button>
                              ))}
                              
                              <button
                                onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
                                disabled={currentPage === totalPages}
                                className="px-4 py-2 text-sm border border-gray-300 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50 transition-colors"
                              >
                                Sau
                              </button>
                            </nav>
                          </div>
                        )}
                      </>
                    )}
                  </div>
                </div>
              </>
            )}

            {/* Action Buttons */}
            <div className="flex justify-end mt-8 gap-4">
              <button
                onClick={() => router.push('/services')}
                className="px-6 py-3 bg-white text-gray-500 border border-gray-200 rounded-xl cursor-pointer hover:bg-gray-50 transition-all duration-200 shadow-md"
              >
                Hủy
              </button>
              <button
                disabled={!residentId && !selectedResidentId}
                onClick={() => setStep(2)}
                className={`
                  px-6 py-3 rounded-xl border-none flex items-center gap-2 transition-all duration-200 shadow-md
                  ${(!residentId && !selectedResidentId)
                    ? 'bg-gray-400 text-white cursor-not-allowed'
                    : 'bg-gradient-to-r from-indigo-500 to-purple-600 text-white cursor-pointer hover:shadow-lg hover:scale-105'
                  }
                `}
              >
                <CheckCircleIcon className="w-5 h-5" />
                Tiếp tục
              </button>
            </div>
          </div>
        )}

        {/* Step 2: Chọn gói dịch vụ */}
        {step === 2 && (
          <div>
            {/* Header Section */}
            <div className="bg-gradient-to-br from-white to-slate-50 rounded-3xl p-8 mb-8 shadow-lg border border-white/20 backdrop-blur-sm">
              <div className="flex items-center gap-4">
                <button
                  onClick={() => setStep(1)}
                  className="text-indigo-500 flex items-center justify-center w-12 h-12 rounded-xl bg-indigo-50 hover:bg-indigo-100 transition-colors duration-200 border-none cursor-pointer shadow-md"
                >
                  <ArrowLeftIcon className="h-6 w-6" />
                </button>
                <div className="flex items-center gap-4">
                  <div className="w-14 h-14 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-2xl flex items-center justify-center shadow-lg">
                    <GiftIcon className="w-8 h-8 text-white" />
                  </div>
                  <div>
                    <h1 className="text-3xl font-bold m-0 bg-gradient-to-br from-indigo-500 to-purple-600 bg-clip-text text-transparent tracking-tight">
                      Chọn gói dịch vụ
                    </h1>
                    <p className="text-base text-slate-600 mt-1 font-medium">
                      Chọn 1 gói chính và các gói bổ sung (nếu cần)
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {error && (
              <div className="bg-red-50 border border-red-200 text-red-600 p-4 rounded-lg mb-8">
                {error}
              </div>
            )}

            {/* Search and Statistics Section */}
            <div className="bg-gradient-to-br from-white to-slate-50 rounded-2xl p-6 mb-8 shadow-lg border border-white/20 backdrop-blur-sm">
              {/* Search Bar */}
              <div className="relative mb-4">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                  <MagnifyingGlassIcon className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  type="text"
                  placeholder="Tìm kiếm gói dịch vụ theo tên, mô tả hoặc từ khóa..."
                  value={packageSearchTerm}
                  onChange={(e) => {
                    setPackageSearchTerm(e.target.value);
                    setPackageCurrentPage(1);
                  }}
                  className="w-full pl-12 pr-4 py-3 text-base border-2 border-gray-200 rounded-xl bg-white shadow-sm focus:border-indigo-500 focus:ring-4 focus:ring-indigo-100 transition-all duration-200 placeholder-gray-400"
                />
                {packageSearchTerm && (
                  <button
                    onClick={() => {
                      setPackageSearchTerm('');
                      setPackageCurrentPage(1);
                    }}
                    className="absolute inset-y-0 right-0 pr-4 flex items-center text-gray-400 hover:text-gray-600 transition-colors"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                )}
              </div>
              
              {/* Statistics */}
              <div className="bg-gradient-to-r from-indigo-50 to-purple-50 p-4 rounded-xl border border-indigo-200">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-3 bg-indigo-500 rounded-full"></div>
                      <span className="text-sm font-semibold text-indigo-700">
                        {paginatedMainPlans.length} gói chính
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-3 bg-emerald-500 rounded-full"></div>
                      <span className="text-sm font-semibold text-emerald-700">
                        {paginatedSupplementaryPlans.length} gói bổ sung
                      </span>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-sm text-gray-600 m-0">
                      Tổng cộng: <span className="font-bold text-indigo-600">{filteredAndSortedMainPlans.length + filteredAndSortedSupplementaryPlans.length}</span> gói
                    </p>
                    {packageSearchTerm && (
                      <p className="text-xs text-gray-500 m-0 mt-1">
                        Kết quả cho: "{packageSearchTerm}"
                      </p>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* Main Package Section */}
            <div className="bg-gradient-to-br from-white to-slate-50 rounded-2xl overflow-hidden shadow-md border border-white/20 mb-6">
              <div className="bg-gradient-to-r from-indigo-500 to-purple-600 px-6 py-4">
                <h2 className="text-xl font-bold text-white m-0">Gói chính</h2>
                <p className="text-indigo-100 text-sm mt-1 m-0">Chọn 1 gói dịch vụ chính</p>
              </div>
              <div className="p-6">
                {loading ? (
                  <div className="text-center py-8">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600 mx-auto mb-3"></div>
                    <p className="text-gray-500 text-sm m-0">Đang tải gói dịch vụ...</p>
                  </div>
                ) : mainPlans.length === 0 ? (
                  <div className="text-center py-8">
                    <GiftIcon className="w-12 h-12 mx-auto mb-4 text-gray-300" />
                    <h3 className="text-lg font-semibold mb-2 text-gray-700">Không có gói chính khả dụng</h3>
                    <p className="text-sm text-gray-500 m-0">Vui lòng liên hệ quản trị viên để thêm gói dịch vụ.</p>
                  </div>
                ) : filteredAndSortedMainPlans.length === 0 ? (
                  <div className="text-center py-8">
                    <MagnifyingGlassIcon className="w-12 h-12 mx-auto mb-4 text-gray-300" />
                    <h3 className="text-lg font-semibold mb-2 text-gray-700">Không tìm thấy gói chính</h3>
                    <p className="text-sm text-gray-500 m-0">Thử thay đổi từ khóa tìm kiếm.</p>
                  </div>
                ) : (
                  <>
                                      <div className="space-y-2">
                    {paginatedMainPlans.map((plan) => (
                      <label 
                        key={plan._id} 
                        className={`
                          group relative border rounded-lg p-3 cursor-pointer transition-all duration-200 hover:shadow-sm block w-full
                          ${mainPackageId === plan._id 
                            ? 'border-indigo-500 bg-indigo-50 shadow-md' 
                            : 'border-gray-200 bg-white hover:border-indigo-300'
                          }
                        `}
                        style={{ minHeight: '60px' }}
                      >
                        <input
                          type="radio"
                          name="mainPlan"
                          checked={mainPackageId === plan._id}
                          onChange={() => setMainPackageId(plan._id)}
                          className="sr-only"
                        />
                        
                        <div className="flex items-center gap-3 w-full">
                          {/* Package Icon */}
                          <div className="w-8 h-8 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-lg flex items-center justify-center flex-shrink-0 shadow-sm">
                            <GiftIcon className="w-4 h-4 text-white" />
                          </div>
                          
                          {/* Package Info */}
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center justify-between mb-1">
                              <h3 className="font-semibold text-gray-900 text-base truncate">{plan.plan_name}</h3>
                              <div className="text-indigo-600 font-bold text-base">
                                {new Intl.NumberFormat('vi-VN').format(plan.monthly_price)} đ/tháng
                              </div>
                            </div>
                            <p className="text-gray-600 text-xs leading-tight line-clamp-2">{plan.description}</p>
                          </div>
                          
                          {/* Selection indicator */}
                          <div className={`
                            w-4 h-4 rounded-full border-2 flex items-center justify-center flex-shrink-0
                            ${mainPackageId === plan._id
                              ? 'border-indigo-500 bg-indigo-500'
                              : 'border-gray-300 group-hover:border-indigo-300'
                            }
                          `}>
                            {mainPackageId === plan._id && (
                              <CheckCircleIcon className="w-2.5 h-2.5 text-white" />
                            )}
                          </div>
                        </div>
                      </label>
                    ))}
                  </div>

                  {/* Pagination for Main Plans */}
                  {totalMainPages > 1 && (
                    <div className="mt-6 flex justify-center">
                      <nav className="flex items-center gap-2">
                        <button
                          onClick={() => setPackageCurrentPage(Math.max(1, packageCurrentPage - 1))}
                          disabled={packageCurrentPage === 1}
                          className="px-4 py-2 text-sm border border-gray-300 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50 transition-colors"
                        >
                          Trước
                        </button>
                        
                        {Array.from({ length: totalMainPages }, (_, i) => i + 1).map((page) => (
                          <button
                            key={page}
                            onClick={() => setPackageCurrentPage(page)}
                            className={`
                              px-4 py-2 text-sm border rounded-lg transition-colors
                              ${packageCurrentPage === page
                                ? 'bg-indigo-500 text-white border-indigo-500'
                                : 'border-gray-300 text-gray-700 hover:bg-gray-50'
                              }
                            `}
                          >
                            {page}
                          </button>
                        ))}
                        
                        <button
                          onClick={() => setPackageCurrentPage(Math.min(totalMainPages, packageCurrentPage + 1))}
                          disabled={packageCurrentPage === totalMainPages}
                          className="px-4 py-2 text-sm border border-gray-300 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50 transition-colors"
                        >
                          Sau
                        </button>
                      </nav>
                    </div>
                  )}
                </>
              )}
            </div>
          </div>

            {/* Supplementary Package Section */}
            <div className="bg-gradient-to-br from-white to-slate-50 rounded-2xl overflow-hidden shadow-md border border-white/20 mb-6">
              <div className={`px-6 py-4 ${mainPackageId ? 'bg-gradient-to-r from-emerald-500 to-teal-600' : 'bg-gray-100'}`}>
                <h2 className={`text-xl font-bold m-0 ${mainPackageId ? 'text-white' : 'text-gray-700'}`}>Gói bổ sung (tuỳ chọn)</h2>
                <p className={`text-sm mt-1 m-0 ${mainPackageId ? 'text-emerald-100' : 'text-gray-500'}`}>
                  {mainPackageId ? 'Chọn các gói dịch vụ bổ sung' : 'Vui lòng chọn gói chính trước'}
                </p>
              </div>
              <div className={`p-6 ${mainPackageId ? 'opacity-100' : 'opacity-60'}`}>
                {loading ? (
                  <div className="text-center py-8">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-600 mx-auto mb-3"></div>
                    <p className="text-gray-500 text-sm m-0">Đang tải gói bổ sung...</p>
                  </div>
                ) : filteredAndSortedSupplementaryPlans.length === 0 ? (
                  <div className="text-center py-8">
                    {packageSearchTerm ? (
                      <>
                        <MagnifyingGlassIcon className="w-12 h-12 mx-auto mb-4 text-gray-300" />
                        <h3 className="text-lg font-semibold mb-2 text-gray-700">Không tìm thấy gói bổ sung</h3>
                        <p className="text-sm text-gray-500 m-0">Thử thay đổi từ khóa tìm kiếm.</p>
                      </>
                    ) : (
                      <>
                        <PlusIcon className="w-12 h-12 mx-auto mb-4 text-gray-300" />
                        <h3 className="text-lg font-semibold mb-2 text-gray-700">Không có gói bổ sung khả dụng</h3>
                        <p className="text-sm text-gray-500 m-0">Tất cả gói dịch vụ đã được bao gồm trong gói chính.</p>
                      </>
                    )}
                  </div>
                ) : (
                  <>
                                      <div className="space-y-2">
                    {paginatedSupplementaryPlans.map((plan) => (
                      <label 
                        key={plan._id} 
                        className={`
                          group relative border rounded-lg p-3 transition-all duration-200 hover:shadow-sm block w-full
                          ${mainPackageId ? 'cursor-pointer' : 'cursor-not-allowed'}
                          ${supplementaryIds.includes(plan._id)
                            ? 'border-emerald-500 bg-emerald-50 shadow-md' 
                            : 'border-gray-200 bg-white hover:border-emerald-300'
                          }
                        `}
                        style={{ minHeight: '60px' }}
                      >
                        <input
                          type="checkbox"
                          checked={supplementaryIds.includes(plan._id)}
                          onChange={() => mainPackageId && toggleSupplementary(plan._id)}
                          disabled={!mainPackageId}
                          className="sr-only"
                        />
                        
                        <div className="flex items-center gap-3 w-full">
                          {/* Package Icon */}
                          <div className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 shadow-sm ${
                            supplementaryIds.includes(plan._id) 
                              ? 'bg-gradient-to-br from-emerald-500 to-teal-600' 
                              : 'bg-gray-200'
                          }`}>
                            <PlusIcon className={`w-4 h-4 ${supplementaryIds.includes(plan._id) ? 'text-white' : 'text-gray-500'}`} />
                          </div>
                          
                          {/* Package Info */}
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center justify-between mb-1">
                              <h3 className="font-semibold text-gray-900 text-base truncate">{plan.plan_name}</h3>
                              <div className="text-emerald-600 font-bold text-base">
                                {new Intl.NumberFormat('vi-VN').format(plan.monthly_price)} đ/tháng
                              </div>
                            </div>
                            <p className="text-gray-600 text-xs leading-tight line-clamp-2">{plan.description}</p>
                          </div>
                          
                          {/* Selection indicator */}
                          <div className={`
                            w-4 h-4 rounded-full border-2 flex items-center justify-center flex-shrink-0
                            ${supplementaryIds.includes(plan._id)
                              ? 'border-emerald-500 bg-emerald-500'
                              : 'border-gray-300 group-hover:border-emerald-300'
                            }
                          `}>
                            {supplementaryIds.includes(plan._id) && (
                              <CheckCircleIcon className="w-2.5 h-2.5 text-white" />
                            )}
                          </div>
                        </div>
                      </label>
                    ))}
                  </div>

                  {/* Pagination for Supplementary Plans */}
                  {totalSupplementaryPages > 1 && (
                    <div className="mt-6 flex justify-center">
                      <nav className="flex items-center gap-2">
                        <button
                          onClick={() => setPackageCurrentPage(Math.max(1, packageCurrentPage - 1))}
                          disabled={packageCurrentPage === 1}
                          className="px-4 py-2 text-sm border border-gray-300 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50 transition-colors"
                        >
                          Trước
                        </button>
                        
                        {Array.from({ length: totalSupplementaryPages }, (_, i) => i + 1).map((page) => (
                          <button
                            key={page}
                            onClick={() => setPackageCurrentPage(page)}
                            className={`
                              px-4 py-2 text-sm border rounded-lg transition-colors
                              ${packageCurrentPage === page
                                ? 'bg-emerald-500 text-white border-emerald-500'
                                : 'border-gray-300 text-gray-700 hover:bg-gray-50'
                              }
                            `}
                          >
                            {page}
                          </button>
                        ))}
                        
                        <button
                          onClick={() => setPackageCurrentPage(Math.min(totalSupplementaryPages, packageCurrentPage + 1))}
                          disabled={packageCurrentPage === totalSupplementaryPages}
                          className="px-4 py-2 text-sm border border-gray-300 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50 transition-colors"
                        >
                          Sau
                        </button>
                      </nav>
                    </div>
                  )}
                </>
              )}
            </div>
          </div>

            {/* Action Buttons */}
            <div className="flex justify-end mt-8 gap-4">
              <button
                onClick={() => setStep(1)}
                className="px-6 py-3 bg-white text-gray-500 border border-gray-200 rounded-xl cursor-pointer hover:bg-gray-50 transition-all duration-200 shadow-md"
              >
                Quay lại
              </button>
              <button
                disabled={!mainPackageId}
                onClick={() => setStep(3)}
                className={`
                  px-6 py-3 rounded-xl border-none flex items-center gap-2 transition-all duration-200 shadow-md
                  ${!mainPackageId
                    ? 'bg-gray-400 text-white cursor-not-allowed'
                    : 'bg-gradient-to-r from-indigo-500 to-purple-600 text-white cursor-pointer hover:shadow-lg hover:scale-105'
                  }
                `}
              >
                <CheckCircleIcon className="w-5 h-5" />
                Tiếp tục
              </button>
            </div>
          </div>
        )}

        {/* Step 3: Chọn loại phòng */}
        {step === 3 && (
          <div>
            {/* Header Section */}
            <div className="bg-gradient-to-br from-white to-slate-50 rounded-3xl p-8 mb-8 shadow-lg border border-white/20 backdrop-blur-sm">
              <div className="flex items-center gap-4">
                <button
                  onClick={() => setStep(2)}
                  className="text-indigo-500 flex items-center justify-center w-12 h-12 rounded-xl bg-indigo-50 hover:bg-indigo-100 transition-colors duration-200 border-none cursor-pointer shadow-md"
                >
                  <ArrowLeftIcon className="h-6 w-6" />
                </button>
                <div className="flex items-center gap-4">
                  <div className="w-14 h-14 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-2xl flex items-center justify-center shadow-lg">
                    <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                    </svg>
                  </div>
                  <div>
                    <h1 className="text-3xl font-bold m-0 bg-gradient-to-br from-indigo-500 to-purple-600 bg-clip-text text-transparent tracking-tight">
                      Chọn loại phòng
                    </h1>
                    <p className="text-base text-slate-600 mt-1 font-medium">
                      Lựa chọn loại phòng phù hợp với nhu cầu
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Room Type Selection */}
            <div className="bg-gradient-to-br from-white to-slate-50 rounded-2xl p-6 mb-8 shadow-lg border border-white/20">
              <div className="mb-4">
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  🏠 Loại phòng
                </label>
                <select 
                  value={roomType} 
                  onChange={e => setRoomType(e.target.value)} 
                  className="w-full px-4 py-3 rounded-xl border-2 border-gray-200 text-base bg-white shadow-sm focus:border-indigo-500 focus:ring-4 focus:ring-indigo-100 transition-all duration-200"
                >
                  <option value=''>-- Chọn loại phòng --</option>
                  {roomTypes.map(rt => (
                    <option key={rt._id} value={rt.room_type}>
                      {rt.type_name || rt.room_type}
                    </option>
                  ))}
                </select>
              </div>
              
              {roomType && (
                <div className="bg-indigo-50 p-4 rounded-xl border border-indigo-200">
                  {(() => {
                    const selectedResident = residents.find(r => r._id === (residentId || selectedResidentId));
                    const residentGender = selectedResident?.gender;
                    
                    const availableRooms = rooms.filter(r => {
                      if (r.room_type !== roomType || r.status !== 'available') {
                        return false;
                      }
                      
                      // Kiểm tra giới tính phòng phù hợp với resident
                      if (residentGender && r.gender && residentGender.toLowerCase() !== r.gender.toLowerCase()) {
                        return false;
                      }
                      
                      const availableBedsInRoom = getBedsForRoom(r._id, residentGender);
                      return availableBedsInRoom.length > 0;
                    });
                    
                    const totalAvailableBeds = availableRooms.reduce((total, room) => {
                      return total + getBedsForRoom(room._id, residentGender).length;
                    }, 0);
                    
                    const genderText = residentGender === 'male' ? 'nam' : residentGender === 'female' ? 'nữ' : 'tất cả';
                    
                    return (
                      <div>
                        <p className="text-sm text-indigo-600 m-0 font-medium">
                          ✅ Đã chọn: <span className="font-semibold">{roomTypes.find(rt => rt.room_type === roomType)?.type_name || roomType}</span>
                        </p>
                        <p className="text-sm text-indigo-500 m-0 mt-1">
                          📊 Có {availableRooms.length} phòng trống cho {genderText} với {totalAvailableBeds} giường có sẵn
                        </p>
                      </div>
                    );
                  })()}
                </div>
              )}
            </div>

            {/* Action Buttons */}
            <div className="flex justify-end mt-8 gap-4">
              <button
                onClick={() => setStep(2)}
                className="px-6 py-3 bg-white text-gray-500 border border-gray-200 rounded-xl cursor-pointer hover:bg-gray-50 transition-all duration-200 shadow-md"
              >
                Quay lại
              </button>
              <button
                disabled={!roomType}
                onClick={() => setStep(4)}
                className={`
                  px-6 py-3 rounded-xl border-none flex items-center gap-2 transition-all duration-200 shadow-md
                  ${!roomType
                    ? 'bg-gray-400 text-white cursor-not-allowed'
                    : 'bg-gradient-to-r from-indigo-500 to-purple-600 text-white cursor-pointer hover:shadow-lg hover:scale-105'
                  }
                `}
              >
                <CheckCircleIcon className="w-5 h-5" />
                Tiếp tục
              </button>
            </div>
          </div>
        )}

        {/* Step 4: Chọn phòng */}
        {step === 4 && (
          <div>
            {/* Header Section */}
            <div className="bg-gradient-to-br from-white to-slate-50 rounded-3xl p-8 mb-8 shadow-lg border border-white/20 backdrop-blur-sm">
              <div className="flex items-center gap-4">
                <button
                  onClick={() => setStep(3)}
                  className="text-indigo-500 flex items-center justify-center w-12 h-12 rounded-xl bg-indigo-50 hover:bg-indigo-100 transition-colors duration-200 border-none cursor-pointer shadow-md"
                >
                  <ArrowLeftIcon className="h-6 w-6" />
                </button>
                <div className="flex items-center gap-4">
                  <div className="w-14 h-14 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-2xl flex items-center justify-center shadow-lg">
                    <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2H5a2 2 0 00-2-2z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 5a2 2 0 012-2h4a2 2 0 012 2v2H8V5z" />
                    </svg>
                  </div>
                  <div>
                    <h1 className="text-3xl font-bold m-0 bg-gradient-to-br from-indigo-500 to-purple-600 bg-clip-text text-transparent tracking-tight">
                      Chọn phòng cụ thể
                    </h1>
                    <p className="text-base text-slate-600 mt-1 font-medium">
                      Lựa chọn phòng phù hợp trong loại đã chọn
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Room Selection */}
            <div className="bg-gradient-to-br from-white to-slate-50 rounded-2xl p-6 mb-8 shadow-lg border border-white/20">
              <div className="mb-4">
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  🚪 Phòng
                </label>
                <select 
                  value={selectedRoomId} 
                  onChange={e => setSelectedRoomId(e.target.value)} 
                  className="w-full px-4 py-3 rounded-xl border-2 border-gray-200 text-base bg-white shadow-sm focus:border-indigo-500 focus:ring-4 focus:ring-indigo-100 transition-all duration-200"
                >
                  <option value=''>-- Chọn phòng --</option>
                  {(() => {
                    const selectedResident = residents.find(r => r._id === (residentId || selectedResidentId));
                    const residentGender = selectedResident?.gender;
                    
                    return rooms.filter(r => {
                      // Chỉ hiển thị phòng có loại đúng và status available
                      if (r.room_type !== roomType || r.status !== 'available') {
                        return false;
                      }
                      
                      // Kiểm tra giới tính phòng phù hợp với resident
                      if (residentGender && r.gender && residentGender.toLowerCase() !== r.gender.toLowerCase()) {
                        return false;
                      }
                      
                      // Kiểm tra xem phòng có giường trống không
                      const availableBedsInRoom = getBedsForRoom(r._id, residentGender);
                      return availableBedsInRoom.length > 0;
                    }).map(room => {
                      const availableBedsCount = getBedsForRoom(room._id, residentGender).length;
                      const genderText = room.gender === 'male' ? 'Nam' : room.gender === 'female' ? 'Nữ' : 'Khác';
                      return (
                        <option key={room._id} value={room._id}>
                          Phòng {room.room_number} ({genderText}) - {availableBedsCount} giường trống
                        </option>
                      );
                    });
                  })()}
                </select>
              </div>
              
                             {(() => {
                 const selectedResident = residents.find(r => r._id === (residentId || selectedResidentId));
                 const residentGender = selectedResident?.gender;
                 
                 const availableRooms = rooms.filter(r => {
                   if (r.room_type !== roomType || r.status !== 'available') {
                     return false;
                   }
                   
                   // Kiểm tra giới tính phòng phù hợp với resident
                   if (residentGender && r.gender && residentGender.toLowerCase() !== r.gender.toLowerCase()) {
                     return false;
                   }
                   
                   const availableBedsInRoom = getBedsForRoom(r._id, residentGender);
                   return availableBedsInRoom.length > 0;
                 });
                 
                 if (availableRooms.length === 0) {
                   const genderText = residentGender === 'male' ? 'nam' : residentGender === 'female' ? 'nữ' : '';
                   return (
                     <div className="bg-yellow-50 p-4 rounded-xl border border-yellow-200">
                       <p className="text-sm text-yellow-700 m-0 font-medium">
                         ⚠️ Không có phòng nào có giường trống cho {genderText} trong loại phòng này
                       </p>
                     </div>
                   );
                 }
                 
                 if (selectedRoomId) {
                   const selectedRoom = rooms.find(r => r._id === selectedRoomId);
                   const availableBedsCount = getBedsForRoom(selectedRoomId, residentGender).length;
                   const genderText = selectedRoom?.gender === 'male' ? 'Nam' : selectedRoom?.gender === 'female' ? 'Nữ' : 'Khác';
                   return (
                     <div className="bg-indigo-50 p-4 rounded-xl border border-indigo-200">
                       <p className="text-sm text-indigo-600 m-0 font-medium">
                         ✅ Đã chọn: <span className="font-semibold">Phòng {selectedRoom?.room_number} ({genderText})</span> 
                         <span className="text-indigo-500 ml-2">({availableBedsCount} giường trống)</span>
                       </p>
                     </div>
                   );
                 }
                 
                 return null;
               })()}
            </div>

            {/* Action Buttons */}
            <div className="flex justify-end mt-8 gap-4">
              <button
                onClick={() => setStep(3)}
                className="px-6 py-3 bg-white text-gray-500 border border-gray-200 rounded-xl cursor-pointer hover:bg-gray-50 transition-all duration-200 shadow-md"
              >
                Quay lại
              </button>
              {(() => {
                const availableRooms = rooms.filter(r => {
                  if (r.room_type !== roomType || r.status !== 'available') {
                    return false;
                  }
                  const availableBedsInRoom = getBedsForRoom(r._id);
                  return availableBedsInRoom.length > 0;
                });
                
                const hasAvailableRooms = availableRooms.length > 0;
                
                return (
                  <button
                    disabled={!selectedRoomId || !hasAvailableRooms}
                    onClick={() => setStep(5)}
                    className={`
                      px-6 py-3 rounded-xl border-none flex items-center gap-2 transition-all duration-200 shadow-md
                      ${(!selectedRoomId || !hasAvailableRooms)
                        ? 'bg-gray-400 text-white cursor-not-allowed'
                        : 'bg-gradient-to-r from-indigo-500 to-purple-600 text-white cursor-pointer hover:shadow-lg hover:scale-105'
                      }
                    `}
                  >
                    <CheckCircleIcon className="w-5 h-5" />
                    {!hasAvailableRooms ? 'Không có phòng trống' : 'Tiếp tục'}
                  </button>
                );
              })()}
            </div>
          </div>
        )}

        {/* Step 5: Chọn giường */}
        {step === 5 && (
          <div>
            {/* Header Section */}
            <div className="bg-gradient-to-br from-white to-slate-50 rounded-3xl p-8 mb-8 shadow-lg border border-white/20 backdrop-blur-sm">
              <div className="flex items-center gap-4">
                <button
                  onClick={() => setStep(4)}
                  className="text-indigo-500 flex items-center justify-center w-12 h-12 rounded-xl bg-indigo-50 hover:bg-indigo-100 transition-colors duration-200 border-none cursor-pointer shadow-md"
                >
                  <ArrowLeftIcon className="h-6 w-6" />
                </button>
                <div className="flex items-center gap-4">
                  <div className="w-14 h-14 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-2xl flex items-center justify-center shadow-lg">
                    <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2H5a2 2 0 00-2-2z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 5a2 2 0 012-2h4a2 2 0 012 2v2H8V5z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 12h.01M8 12h.01M16 12h.01" />
                    </svg>
                  </div>
                  <div>
                    <h1 className="text-3xl font-bold m-0 bg-gradient-to-br from-indigo-500 to-purple-600 bg-clip-text text-transparent tracking-tight">
                      Chọn giường
                    </h1>
                    <p className="text-base text-slate-600 mt-1 font-medium">
                      Lựa chọn giường cụ thể trong phòng đã chọn
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Bed Selection */}
            <div className="bg-gradient-to-br from-white to-slate-50 rounded-2xl p-6 mb-8 shadow-lg border border-white/20">
              <div className="mb-4">
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  🛏️ Giường
                </label>
                                  <select 
                    value={selectedBedId} 
                    onChange={e => setSelectedBedId(e.target.value)} 
                    className="w-full px-4 py-3 rounded-xl border-2 border-gray-200 text-base bg-white shadow-sm focus:border-indigo-500 focus:ring-4 focus:ring-indigo-100 transition-all duration-200"
                  >
                    <option value=''>-- Chọn giường --</option>
                    {(() => {
                      const selectedResident = residents.find(r => r._id === (residentId || selectedResidentId));
                      const residentGender = selectedResident?.gender;
                      
                      return getBedsForRoom(selectedRoomId, residentGender).map(bed => {
                        const selectedRoom = rooms.find(r => r._id === selectedRoomId);
                        const roomNumber = selectedRoom?.room_number;
                        return (
                          <option key={bed._id} value={bed._id}>
                            {formatBedName(bed, roomNumber)}
                          </option>
                        );
                      });
                    })()}
                  </select>
              </div>
              
              {(() => {
                const selectedResident = residents.find(r => r._id === (residentId || selectedResidentId));
                const residentGender = selectedResident?.gender;
                
                if (selectedBedId) {
                  console.log('Debug - selectedBedId:', selectedBedId);
                  console.log('Debug - all beds:', beds);
                  
                  // Tìm bed từ beds array
                  let selectedBed = beds.find(b => b._id === selectedBedId);
                  
                  // Nếu không tìm thấy trong beds array, có thể là generated bed
                  if (!selectedBed && selectedRoomId) {
                    const selectedRoom = rooms.find(r => r._id === selectedRoomId);
                    if (selectedRoom?.bed_info) {
                      // Tạo bed object từ room data
                      const bedNumber = selectedBedId.split('_bed_')[1]; // Lấy số từ ID
                      if (bedNumber) {
                        selectedBed = {
                          _id: selectedBedId,
                          bed_number: parseInt(bedNumber),
                          room_id: selectedRoomId,
                          room_number: selectedRoom.room_number,
                          status: 'available'
                        };
                      }
                    }
                  }
                  
                  console.log('Debug - selectedBed found:', selectedBed);
                  
                  const selectedRoom = rooms.find(r => r._id === selectedRoomId);
                  const genderText = residentGender === 'male' ? 'Nam' : residentGender === 'female' ? 'Nữ' : '';
                  
                  if (selectedBed) {
                    return (
                      <div className="bg-indigo-50 p-4 rounded-xl border border-indigo-200">
                        <p className="text-sm text-indigo-600 m-0 font-medium">
                          ✅ Đã chọn: <span className="font-semibold">{formatBedName(selectedBed, selectedRoom?.room_number)} ({genderText})</span>
                        </p>
                      </div>
                    );
                  } else {
                    console.log('Debug - selectedBed not found for ID:', selectedBedId);
                  }
                }
                
                // Hiển thị thông báo khi chưa chọn giường
                return (
                  <div className="bg-gray-50 p-4 rounded-xl border border-gray-200">
                    <p className="text-sm text-gray-600 m-0 font-medium">
                      ⚠️ Vui lòng chọn giường
                    </p>
                  </div>
                );
              })()}
            </div>

            {/* Action Buttons */}
            <div className="flex justify-end mt-8 gap-4">
              <button
                onClick={() => setStep(4)}
                className="px-6 py-3 bg-white text-gray-500 border border-gray-200 rounded-xl cursor-pointer hover:bg-gray-50 transition-all duration-200 shadow-md"
              >
                Quay lại
              </button>
              <button
                disabled={!selectedBedId}
                onClick={() => setStep(6)}
                className={`
                  px-6 py-3 rounded-xl border-none flex items-center gap-2 transition-all duration-200 shadow-md
                  ${!selectedBedId
                    ? 'bg-gray-400 text-white cursor-not-allowed'
                    : 'bg-gradient-to-r from-indigo-500 to-purple-600 text-white cursor-pointer hover:shadow-lg hover:scale-105'
                  }
                `}
              >
                <CheckCircleIcon className="w-5 h-5" />
                Tiếp tục
              </button>
            </div>
          </div>
        )}

        {/* Step 6: Thông tin bổ sung */}
        {step === 6 && (
          <div>
            {/* Header Section */}
            <div className="bg-gradient-to-br from-white to-slate-50 rounded-3xl p-8 mb-8 shadow-lg border border-white/20 backdrop-blur-sm">
              <div className="flex items-center gap-4">
                <button
                  onClick={() => setStep(5)}
                  className="text-indigo-500 flex items-center justify-center w-12 h-12 rounded-xl bg-indigo-50 hover:bg-indigo-100 transition-colors duration-200 border-none cursor-pointer shadow-md"
                >
                  <ArrowLeftIcon className="h-6 w-6" />
                </button>
                <div className="flex items-center gap-4">
                  <div className="w-14 h-14 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-2xl flex items-center justify-center shadow-lg">
                    <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                    </svg>
                  </div>
                  <div>
                    <h1 className="text-3xl font-bold m-0 bg-gradient-to-br from-indigo-500 to-purple-600 bg-clip-text text-transparent tracking-tight">
                      Thông tin bổ sung
                    </h1>
                    <p className="text-base text-slate-600 mt-1 font-medium">
                      Cung cấp thêm thông tin đăng ký
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Registration Information Card */}
            <div className="bg-gradient-to-br from-white to-slate-50 rounded-2xl p-8 mb-8 shadow-lg border border-white/20 backdrop-blur-sm">
              <h3 className="text-2xl font-bold text-gray-900 mb-6 flex items-center gap-3">
                <svg className="w-6 h-6 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
                Thông tin đăng ký
              </h3>
              
              <div className="space-y-6">
                {/* Thời gian đăng ký */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-3">Thời gian đăng ký:</label>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <label className="relative cursor-pointer">
                      <input
                        type="radio"
                        name="registrationPeriod"
                        value="6"
                        checked={registrationPeriod === '6'}
                        onChange={(e) => setRegistrationPeriod(e.target.value)}
                        className="sr-only"
                      />
                      <div className={`p-4 border-2 rounded-xl transition-all duration-200 ${
                        registrationPeriod === '6' 
                          ? 'border-indigo-500 bg-indigo-50 shadow-md' 
                          : 'border-gray-200 bg-white hover:border-gray-300'
                      }`}>
                        <div className="flex items-center gap-3">
                          <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${
                            registrationPeriod === '6' 
                              ? 'border-indigo-500 bg-indigo-500' 
                              : 'border-gray-300'
                          }`}>
                            {registrationPeriod === '6' && (
                              <div className="w-2 h-2 bg-white rounded-full"></div>
                            )}
                          </div>
                          <div>
                            <div className="font-semibold text-gray-900">6 tháng</div>
                            <div className="text-sm text-gray-500">Đăng ký nửa năm</div>
                          </div>
                        </div>
                      </div>
                    </label>
                    
                    <label className="relative cursor-pointer">
                      <input
                        type="radio"
                        name="registrationPeriod"
                        value="12"
                        checked={registrationPeriod === '12'}
                        onChange={(e) => setRegistrationPeriod(e.target.value)}
                        className="sr-only"
                      />
                      <div className={`p-4 border-2 rounded-xl transition-all duration-200 ${
                        registrationPeriod === '12' 
                          ? 'border-indigo-500 bg-indigo-50 shadow-md' 
                          : 'border-gray-200 bg-white hover:border-gray-300'
                      }`}>
                        <div className="flex items-center gap-3">
                          <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${
                            registrationPeriod === '12' 
                              ? 'border-indigo-500 bg-indigo-500' 
                              : 'border-gray-300'
                          }`}>
                            {registrationPeriod === '12' && (
                              <div className="w-2 h-2 bg-white rounded-full"></div>
                            )}
                          </div>
                          <div>
                            <div className="font-semibold text-gray-900">1 năm</div>
                            <div className="text-sm text-gray-500">Đăng ký trọn năm</div>
                          </div>
                        </div>
                      </div>
                    </label>
                  </div>
                </div>

                {/* Ngày bắt đầu */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Ngày bắt đầu:</label>
                  <DatePicker
                    selected={startDate ? new Date(startDate) : null}
                    onChange={(date) => setStartDate(date ? date.toISOString().split('T')[0] : '')}
                    dateFormat="dd/MM/yyyy"
                    minDate={new Date()}
                    placeholderText="Chọn ngày bắt đầu"
                    className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                  />
                </div>

                {/* Ngày kết thúc - tự động tính */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Ngày kết thúc:</label>
                  <div className="relative">
                    <input
                      type="text"
                      value={endDate ? new Date(endDate).toLocaleDateString('vi-VN') : ''}
                      readOnly
                      className="w-full p-3 border border-gray-300 rounded-lg bg-gray-50 text-gray-700 cursor-not-allowed"
                      placeholder="Sẽ tự động tính dựa trên ngày bắt đầu"
                    />
                    <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                      <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                    </div>
                  </div>
                  <p className="text-sm text-gray-500 mt-1">
                    Tự động tính: {registrationPeriod} tháng từ ngày bắt đầu
                  </p>
                </div>

                {/* Ghi chú */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Ghi chú y tế (tùy chọn):</label>
                  <textarea 
                    value={medicalNotes} 
                    onChange={e => setMedicalNotes(e.target.value)} 
                    placeholder="Nhập thông tin y tế, yêu cầu đặc biệt hoặc ghi chú khác..."
                    className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 min-h-[100px] resize-vertical"
                  />
                </div>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex justify-end mt-8 gap-4">
              <button
                onClick={() => setStep(5)}
                className="px-6 py-3 bg-white text-gray-500 border border-gray-200 rounded-xl cursor-pointer hover:bg-gray-50 transition-all duration-200 shadow-md"
              >
                Quay lại
              </button>
              <button
                disabled={!startDate}
                onClick={() => setStep(7)}
                className={`
                  px-6 py-3 rounded-xl border-none flex items-center gap-2 transition-all duration-200 shadow-md
                  ${!startDate
                    ? 'bg-gray-400 text-white cursor-not-allowed'
                    : 'bg-gradient-to-r from-indigo-500 to-purple-600 text-white cursor-pointer hover:shadow-lg hover:scale-105'
                  }
                `}
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                Tiếp tục
              </button>
            </div>
          </div>
        )}

        {/* Step 7: Xem lại & xác nhận */}
        {step === 7 && (
          <div>
            {/* Header Section */}
            <div className="bg-gradient-to-br from-white to-slate-50 rounded-3xl p-8 mb-8 shadow-lg border border-white/20 backdrop-blur-sm">
              <div className="flex items-center gap-4">
                <button
                  onClick={() => setStep(6)}
                  className="text-indigo-500 flex items-center justify-center w-12 h-12 rounded-xl bg-indigo-50 hover:bg-indigo-100 transition-colors duration-200 border-none cursor-pointer shadow-md"
                >
                  <ArrowLeftIcon className="h-6 w-6" />
                </button>
                <div className="flex items-center gap-4">
                  <div className="w-14 h-14 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-2xl flex items-center justify-center shadow-lg">
                    <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                  <div>
                    <h1 className="text-3xl font-bold m-0 bg-gradient-to-br from-indigo-500 to-purple-600 bg-clip-text text-transparent tracking-tight">
                      Xem lại & xác nhận
                    </h1>
                    <p className="text-base text-slate-600 mt-1 font-medium">
                      Kiểm tra thông tin trước khi hoàn tất đăng ký
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Registration Information Card */}
            <div className="bg-gradient-to-br from-white to-slate-50 rounded-2xl p-8 mb-8 shadow-lg border border-white/20 backdrop-blur-sm">
              <h3 className="text-2xl font-bold text-gray-900 mb-6 flex items-center gap-3">
                <svg className="w-6 h-6 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
                Thông tin đăng ký
              </h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-base">
                <div className="space-y-4">
                  <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                    <div className="w-8 h-8 bg-indigo-100 rounded-lg flex items-center justify-center">
                      <UserIcon className="w-4 h-4 text-indigo-600" />
                    </div>
                    <div>
                      <div className="text-sm text-gray-500 font-medium">Người thụ hưởng</div>
                      <div className="font-semibold text-gray-900">{residents.find(r => r._id === (residentId || selectedResidentId))?.full_name || residents.find(r => r._id === (residentId || selectedResidentId))?.name || 'Chưa chọn'}</div>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                    <div className="w-8 h-8 bg-emerald-100 rounded-lg flex items-center justify-center">
                      <GiftIcon className="w-4 h-4 text-emerald-600" />
                    </div>
                    <div>
                      <div className="text-sm text-gray-500 font-medium">Gói chính</div>
                      <div className="font-semibold text-gray-900">{mainPlans.find(p => p._id === mainPackageId)?.plan_name}</div>
                    </div>
                  </div>
                  
                  {supplementaryIds.length > 0 && (
                    <div className="space-y-3">
                      <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                        <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center">
                          <PlusIcon className="w-4 h-4 text-blue-600" />
                        </div>
                        <div className="flex-1">
                          <div className="text-sm text-gray-500 font-medium">Gói bổ sung ({supplementaryIds.length})</div>
                          <div className="font-semibold text-gray-900">
                            {supplementaryPlans.filter(p => supplementaryIds.includes(p._id)).length > 2 
                              ? `${supplementaryPlans.filter(p => supplementaryIds.includes(p._id))[0].plan_name} +${supplementaryPlans.filter(p => supplementaryIds.includes(p._id)).length - 1} gói khác`
                              : supplementaryPlans.filter(p => supplementaryIds.includes(p._id)).map(p => p.plan_name).join(', ')
                            }
                          </div>
                        </div>
                        <button
                          onClick={() => setShowSupplementaryDetails(!showSupplementaryDetails)}
                          className="text-blue-600 hover:text-blue-800 transition-colors"
                        >
                          <svg className={`w-5 h-5 transform transition-transform ${showSupplementaryDetails ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                          </svg>
                        </button>
                      </div>
                      
                      {/* Detailed Supplementary Packages */}
                      {showSupplementaryDetails && (
                        <div className="ml-11 space-y-2">
                          {supplementaryPlans.filter(p => supplementaryIds.includes(p._id)).map((plan, index) => (
                            <div key={plan._id} className="flex items-center gap-3 p-2 bg-blue-50 rounded-lg border border-blue-100">
                              <div className="w-6 h-6 bg-blue-200 rounded-full flex items-center justify-center text-xs font-bold text-blue-700">
                                {index + 1}
                              </div>
                              <div className="flex-1">
                                <div className="font-medium text-gray-900 text-sm">{plan.plan_name}</div>
                                <div className="text-xs text-gray-500">{plan.description}</div>
                              </div>
                              <div className="text-sm font-semibold text-blue-700">
                                {new Intl.NumberFormat('vi-VN').format(plan.monthly_price || 0)} đ/tháng
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  )}
                </div>
                
                <div className="space-y-4">
                  <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                    <div className="w-8 h-8 bg-purple-100 rounded-lg flex items-center justify-center">
                      <svg className="w-4 h-4 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                      </svg>
                    </div>
                    <div>
                      <div className="text-sm text-gray-500 font-medium">Phòng</div>
                      <div className="font-semibold text-gray-900">{rooms.find(r => r._id === selectedRoomId)?.room_number}</div>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                    <div className="w-8 h-8 bg-orange-100 rounded-lg flex items-center justify-center">
                      <svg className="w-4 h-4 text-orange-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2H5a2 2 0 00-2-2z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 5a2 2 0 012-2h4a2 2 0 012 2v2H8V5z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 12h.01M8 12h.01M16 12h.01" />
                      </svg>
                    </div>
                    <div>
                      <div className="text-sm text-gray-500 font-medium">Giường</div>
                      <div className="font-semibold text-gray-900">{(() => {
                        // Tìm bed từ beds array
                        let selectedBed = beds.find(b => b._id === selectedBedId);
                        
                        // Nếu không tìm thấy trong beds array, có thể là generated bed
                        if (!selectedBed && selectedRoomId) {
                          const selectedRoom = rooms.find(r => r._id === selectedRoomId);
                          if (selectedRoom?.bed_info) {
                            // Tạo bed object từ room data
                            const bedNumber = selectedBedId.split('_bed_')[1]; // Lấy số từ ID
                            if (bedNumber) {
                              selectedBed = {
                                _id: selectedBedId,
                                bed_number: parseInt(bedNumber),
                                room_id: selectedRoomId,
                                room_number: selectedRoom.room_number,
                                status: 'available'
                              };
                            }
                          }
                        }
                        
                        const selectedRoom = rooms.find(r => r._id === selectedRoomId);
                        return selectedBed ? formatBedName(selectedBed, selectedRoom?.room_number) : 'Chưa chọn';
                      })()}</div>
                    </div>
                  </div>
                  
                  <div className="space-y-3">
                    <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                      <div className="w-8 h-8 bg-green-100 rounded-lg flex items-center justify-center">
                        <svg className="w-4 h-4 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                        </svg>
                      </div>
                      <div className="flex-1">
                        <div className="text-sm text-gray-500 font-medium">Thời gian đăng ký</div>
                        <div className="font-semibold text-gray-900">
                          {registrationPeriod} tháng
                          {showTimeDetails ? '' : ` (${startDate ? new Date(startDate).toLocaleDateString('vi-VN') : 'Chưa chọn'} - ${endDate ? new Date(endDate).toLocaleDateString('vi-VN') : 'Chưa chọn'})`}
                        </div>
                      </div>
                      <button
                        onClick={() => setShowTimeDetails(!showTimeDetails)}
                        className="text-green-600 hover:text-green-800 transition-colors"
                      >
                        <svg className={`w-5 h-5 transform transition-transform ${showTimeDetails ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                        </svg>
                      </button>
                    </div>
                    
                    {/* Detailed Time Information */}
                    {showTimeDetails && (
                      <div className="ml-11 space-y-2">
                        <div className="flex items-center gap-3 p-2 bg-green-50 rounded-lg border border-green-100">
                          <div className="w-6 h-6 bg-green-200 rounded-full flex items-center justify-center text-xs font-bold text-green-700">
                            BĐ
                          </div>
                          <div className="flex-1">
                            <div className="text-xs text-gray-500 font-medium">Ngày bắt đầu</div>
                            <div className="font-medium text-gray-900">{startDate ? new Date(startDate).toLocaleDateString('vi-VN') : 'Chưa chọn'}</div>
                          </div>
                        </div>
                        
                        <div className="flex items-center gap-3 p-2 bg-green-50 rounded-lg border border-green-100">
                          <div className="w-6 h-6 bg-green-200 rounded-full flex items-center justify-center text-xs font-bold text-green-700">
                            KT
                          </div>
                          <div className="flex-1">
                            <div className="text-xs text-gray-500 font-medium">Ngày kết thúc</div>
                            <div className="font-medium text-gray-900">{endDate ? new Date(endDate).toLocaleDateString('vi-VN') : 'Chưa chọn'}</div>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
              
              {/* Pricing Information */}
              <div className="mt-8 p-6 bg-gradient-to-r from-indigo-50 to-purple-50 rounded-xl border border-indigo-200">
                <h4 className="text-lg font-bold text-indigo-900 mb-4 flex items-center gap-2">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
                  </svg>
                  Chi tiết thanh toán
                </h4>
                
                {(() => {
                  const mainPlan = mainPlans.find(p => p._id === mainPackageId);
                  const supplementaryPlansList = supplementaryPlans.filter(p => supplementaryIds.includes(p._id));
                  
                  // Tính giá gói dịch vụ
                  const mainPlanPrice = mainPlan?.monthly_price || 0;
                  const supplementaryPlansPrice = supplementaryPlansList.reduce((total, plan) => total + (plan.monthly_price || 0), 0);
                  const totalServicePrice = mainPlanPrice + supplementaryPlansPrice;
                  
                  // Tính giá phòng
                  const selectedRoom = rooms.find(r => r._id === selectedRoomId);
                  const roomTypeObj = roomTypes.find(rt => rt.room_type === selectedRoom?.room_type);
                  const roomPrice = roomTypeObj?.monthly_price || 0;
                  
                  // Tổng cộng
                  const totalPrice = totalServicePrice + roomPrice;
                  
                  return (
                    <div className="space-y-3">
                      <div className="flex justify-between items-center py-2 border-b border-indigo-100">
                        <span className="text-gray-700">Giá gói chính</span>
                        <span className="font-semibold text-gray-900">{new Intl.NumberFormat('vi-VN').format(mainPlanPrice)} đ/tháng</span>
                      </div>
                      
                      {supplementaryPlansList.length > 0 && (
                        <div className="space-y-2">
                          <div className="flex justify-between items-center py-2 border-b border-indigo-100">
                            <span className="text-gray-700">Giá gói bổ sung ({supplementaryPlansList.length})</span>
                            <span className="font-semibold text-gray-900">{new Intl.NumberFormat('vi-VN').format(supplementaryPlansPrice)} đ/tháng</span>
                          </div>
                          
                          {/* Chi tiết từng gói bổ sung */}
                          {supplementaryPlansList.map((plan, index) => (
                            <div key={plan._id} className="flex justify-between items-center py-1 px-3 bg-indigo-50 rounded-lg">
                              <div className="flex items-center gap-2">
                                <div className="w-4 h-4 bg-indigo-200 rounded-full flex items-center justify-center text-xs font-bold text-indigo-700">
                                  {index + 1}
                                </div>
                                <span className="text-sm text-gray-600">{plan.plan_name}</span>
                              </div>
                              <span className="text-sm font-medium text-indigo-700">{new Intl.NumberFormat('vi-VN').format(plan.monthly_price || 0)} đ/tháng</span>
                            </div>
                          ))}
                        </div>
                      )}
                      
                      <div className="flex justify-between items-center py-2 border-b border-indigo-100">
                        <span className="text-gray-700">Giá phòng</span>
                        <span className="font-semibold text-gray-900">{new Intl.NumberFormat('vi-VN').format(roomPrice)} đ/tháng</span>
                      </div>
                      
                      <div className="flex justify-between items-center py-3 bg-gradient-to-r from-indigo-500 to-purple-600 rounded-lg px-4">
                        <span className="text-white font-bold text-lg">Tổng cộng</span>
                        <span className="text-white font-bold text-lg">{new Intl.NumberFormat('vi-VN').format(totalPrice)} đ/tháng</span>
                      </div>
                    </div>
                  );
                })()}
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex justify-end mt-8 gap-4">
              <button
                onClick={() => setStep(6)}
                className="px-6 py-3 bg-white text-gray-500 border border-gray-200 rounded-xl cursor-pointer hover:bg-gray-50 transition-all duration-200 shadow-md"
              >
                Quay lại
              </button>
              <button
                onClick={handleSubmit}
                disabled={isSubmitting}
                className={`
                  px-6 py-3 rounded-xl border-none flex items-center gap-2 transition-all duration-200 shadow-md
                  ${isSubmitting
                    ? 'bg-gray-400 text-white cursor-not-allowed'
                    : 'bg-gradient-to-r from-emerald-500 to-emerald-600 text-white cursor-pointer hover:shadow-lg hover:scale-105'
                  }
                `}
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                {isSubmitting ? 'Đang xử lý...' : 'Hoàn tất đăng ký'}
              </button>
            </div>
          </div>
        )}

        {/* Step 8: Hoàn tất */}
        {step === 8 && (
          <div>
            {/* Header Section */}
            <div className="bg-gradient-to-br from-white to-slate-50 rounded-3xl p-8 mb-8 shadow-lg border border-white/20 backdrop-blur-sm">
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-4">
                  <div className="w-14 h-14 bg-gradient-to-br from-emerald-500 to-green-600 rounded-2xl flex items-center justify-center shadow-lg">
                    <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                  </div>
                  <div>
                    <h1 className="text-3xl font-bold m-0 bg-gradient-to-br from-emerald-500 to-green-600 bg-clip-text text-transparent tracking-tight">
                      Hoàn tất đăng ký
                    </h1>
                    <p className="text-base text-slate-600 mt-1 font-medium">
                      Đăng ký dịch vụ đã được xử lý thành công
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Success Card */}
            <div className="bg-gradient-to-br from-white to-slate-50 rounded-2xl p-8 mb-8 shadow-xl border border-white/20 backdrop-blur-sm">
              <div className="text-center max-w-2xl mx-auto">
                {/* Success Icon */}
                <div className="relative mb-6">
                  <div className="w-20 h-20 bg-gradient-to-br from-emerald-400 to-emerald-600 rounded-full flex items-center justify-center mx-auto shadow-lg shadow-emerald-500/20">
                    <svg className="w-10 h-10 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                  </div>
                  {/* Animated rings */}
                  <div className="absolute inset-0 w-20 h-20 border-2 border-emerald-200 rounded-full mx-auto animate-ping opacity-20"></div>
                </div>
                
                {/* Success Title */}
                <h2 className="text-3xl font-bold bg-gradient-to-r from-emerald-600 to-green-600 bg-clip-text text-transparent mb-4">
                  Đăng ký thành công!
                </h2>
                
                {/* Success Message */}
                <div className="text-gray-600 text-base leading-relaxed mb-6 max-w-xl mx-auto">
                  <p className="mb-2 font-medium">
                    Thông tin đăng ký dịch vụ đã được gửi thành công.
                  </p>
                  <p className="text-sm text-gray-500">
                    Gói dịch vụ đã được đăng kí thành công và lưu vào hệ thống.
                  </p>
                </div>
                

                
                {/* Action Buttons */}
                <div className="flex flex-col sm:flex-row gap-4 justify-center">
                  <button 
                    onClick={() => router.push('/services')} 
                    className="group px-6 py-3 bg-gradient-to-r from-indigo-500 to-purple-600 text-white border-none rounded-xl font-semibold text-base cursor-pointer hover:shadow-lg hover:scale-105 transition-all duration-200 shadow-md flex items-center gap-2"
                  >
                    <svg className="w-5 h-5 group-hover:animate-bounce" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                    </svg>
                    Về trang dịch vụ
                  </button>
                  
                  <button 
                    onClick={() => router.push('/staff')} 
                    className="group px-6 py-3 bg-gradient-to-r from-gray-50 to-gray-100 text-gray-700 border border-gray-200 rounded-xl font-semibold text-base cursor-pointer hover:shadow-md hover:scale-105 hover:border-gray-300 transition-all duration-200 shadow-sm flex items-center gap-2"
                  >
                    <svg className="w-5 h-5 group-hover:animate-pulse" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                    Về trang chủ
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        <style jsx>{`
          .date-picker-input {
            width: 100%;
            padding: 0.75rem;
            border-radius: 0.5rem;
            border: 1px solid #d1d5db;
            font-size: 1rem;
          }
        `}</style>
      </div>
    </div>
  );
}

