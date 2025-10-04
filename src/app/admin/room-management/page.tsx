"use client";
import { useEffect, useState } from "react";
import { useRouter } from 'next/navigation';
import { roomsAPI, bedsAPI, roomTypesAPI, bedAssignmentsAPI, carePlanAssignmentsAPI } from "@/lib/api";
import { clearCached } from "@/lib/utils/apiCache";
import { BuildingOfficeIcon, MagnifyingGlassIcon, EyeIcon, ChevronDownIcon, ChevronUpIcon, ArrowLeftIcon, HomeIcon, UsersIcon, MapPinIcon, ClockIcon, ArrowPathIcon, FunnelIcon, ChartBarIcon, UserGroupIcon, CalendarDaysIcon, CurrencyDollarIcon, PencilIcon, PlusIcon, TrashIcon, XMarkIcon, CheckIcon } from '@heroicons/react/24/outline';
import { BuildingOfficeIcon as BuildingOfficeIconSolid, HomeIcon as HomeIconSolid, UsersIcon as UsersIconSolid, MapPinIcon as MapPinIconSolid } from '@heroicons/react/24/solid';
import { formatDisplayCurrency, formatActualCurrency, isDisplayMultiplierEnabled } from '@/lib/utils/currencyUtils';

interface Room {
  _id: string;
  room_number: string;
  bed_count: number;
  room_type: string;
  gender: string;
  floor: number;
  status: string;
}

interface Bed {
  _id: string;
  bed_number: string;
  room_id: string;
  bed_type: string;
  status: string;
}

interface BedAssignment {
  _id: string;
  resident_id: { _id: string; full_name: string } | null;
  bed_id: {
    _id: string;
    bed_number: string;
    bed_type?: string;
    room_id: { _id: string; room_number: string }
  };
  assigned_date: string;
  unassigned_date: string | null;
  assigned_by: { _id: string; full_name: string };
}

interface RoomType {
  _id: string;
  room_type: string;
  type_name: string;
  bed_count: string;
  monthly_price: number;
  description: string;
  amenities: string[];
}



export default function RoomManagementPage() {
  const router = useRouter();
  const [rooms, setRooms] = useState<Room[]>([]);
  const [beds, setBeds] = useState<Bed[]>([]);
  const [bedAssignments, setBedAssignments] = useState<BedAssignment[]>([]);
  const [roomTypes, setRoomTypes] = useState<RoomType[]>([]);
  const [selectedRoomId, setSelectedRoomId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  
  // Modal states
  const [showRoomEditModal, setShowRoomEditModal] = useState(false);
  const [showBedEditModal, setShowBedEditModal] = useState(false);
  const [showAddBedModal, setShowAddBedModal] = useState(false);
  const [editingRoom, setEditingRoom] = useState<Room | null>(null);
  const [editingBed, setEditingBed] = useState<any>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');
  const [showSuccessModal, setShowSuccessModal] = useState(false);



  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      try {
        console.log('Loading room management data..');
        
        const [roomsData, bedsData, assignmentsData, typesData] = await Promise.all([
          roomsAPI.getAll(),
          bedsAPI.getAll(),
          bedAssignmentsAPI.getAll(),
          roomTypesAPI.getAll(),
        ]);
        
        console.log('Rooms data received:', roomsData);
        console.log('Beds data received:', bedsData);
        console.log('Assignments data received:', assignmentsData);
        console.log('Room types data received:', typesData);
        
        // Xử lý trường hợp API trả về empty array do timeout
        if (Array.isArray(roomsData) && roomsData.length === 0) {
          console.warn('Rooms API returned empty array - possible timeout or server issue');
        }
        
        setRooms(roomsData || []);
        setBeds(bedsData || []);
        setBedAssignments(assignmentsData || []);
        setRoomTypes(typesData || []);
        
        setLoading(false);
      } catch (error) {
        console.error('Error loading data:', error);
        setError("Không thể tải dữ liệu phòng/giường.");
        setLoading(false);
      }
    };

    loadData();
  }, []);

  const refreshData = async () => {
    setLoading(true);
    try {
      console.log('Refreshing data...');
      clearCached(); // Clear API cache
      
      const [roomsData, bedsData, assignmentsData, typesData] = await Promise.all([
        roomsAPI.getAll(),
        bedsAPI.getAll(),
        bedAssignmentsAPI.getAll(),
        roomTypesAPI.getAll(),
      ]);
      
      console.log('Refreshed - Rooms data received:', roomsData);
      console.log('Refreshed - Beds data received:', bedsData);
      
      setRooms(roomsData || []);
      setBeds(bedsData || []);
      setBedAssignments(assignmentsData || []);
      setRoomTypes(typesData || []);
      
      setLoading(false);
    } catch (error) {
      console.error('Error refreshing data:', error);
      setError("Không thể tải dữ liệu phòng/giường.");
      setLoading(false);
    }
  };

  const getRoomType = (room_type: string) =>
    roomTypes.find((t) => t.room_type === room_type);

  // Helper function to check if assignment is active
  const isAssignmentActive = (assignment: any) => {
    if (!assignment) return false;
    if (!assignment.unassigned_date) return true; // null = active
    const unassignedDate = new Date(assignment.unassigned_date);
    const now = new Date();
    const isActive = unassignedDate > now; // ngày trong tương lai = active
    
    // Debug logging
    console.log('Checking assignment active status:', {
      assignmentId: assignment._id,
      unassigned_date: assignment.unassigned_date,
      unassignedDate: unassignedDate.toISOString(),
      now: now.toISOString(),
      isActive: isActive
    });
    
    return isActive;
  };

  const bedsOfRoom = (roomId: string) => {
    console.log('bedsOfRoom called for roomId:', roomId);
    console.log('All bedAssignments:', bedAssignments);
    
    // Lọc các assignment của phòng này
    const roomAssignments = bedAssignments.filter(assignment => {
      if (!assignment.bed_id || !assignment.bed_id.room_id) return false;

      const assignmentRoomId = typeof assignment.bed_id.room_id === 'string'
        ? assignment.bed_id.room_id
        : assignment.bed_id.room_id._id;

      return assignmentRoomId === roomId;
    });
    
    console.log('Room assignments for room', roomId, ':', roomAssignments);

    // Gom theo bed và chọn assignment đang active, nếu không có thì chọn mới nhất
    const bedIdToAssignments = roomAssignments.reduce((map, assignment) => {
      const bedId = assignment.bed_id._id;
      if (!map[bedId]) map[bedId] = [] as typeof roomAssignments;
      map[bedId].push(assignment);
      return map;
    }, {} as Record<string, typeof roomAssignments>);

    const uniqueBeds = Object.entries(bedIdToAssignments).map(([bedId, assignments]) => {
      console.log('Processing bed:', bedId, 'with assignments:', assignments);
      
      // Kiểm tra assignment active
      const active = assignments.find(a => isAssignmentActive(a)) || null;
      console.log('Active assignment for bed', bedId, ':', active);
      
      // Nếu không có active, lấy assignment mới nhất theo assigned_date để lấy metadata giường
      const latest = assignments.slice().sort((a, b) => (
        new Date(b.assigned_date).getTime() - new Date(a.assigned_date).getTime()
      ))[0];

      const base = active || latest;
      console.log('Base assignment for bed', bedId, ':', base);

      const bedInfo = {
        _id: bedId,
        bed_number: base?.bed_id.bed_number,
        room_id: roomId,
        bed_type: base?.bed_id.bed_type || 'standard',
        status: active ? 'occupied' : 'available',
        assignment: active, // chỉ đính kèm assignment đang active, nếu có
      } as any;
      
      console.log('Final bed info for bed', bedId, ':', bedInfo);
      return bedInfo;
    });

    console.log('Final uniqueBeds for room', roomId, ':', uniqueBeds);
    return uniqueBeds;
  };

  const getResidentOfBed = (bed: any) => {
    // Chỉ hiển thị tên khi có assignment đang active
    if (bed.status === 'occupied' && bed.assignment && bed.assignment.resident_id) {
      if (isAssignmentActive(bed.assignment)) {
        const residentName = bed.assignment.resident_id.full_name;
        return residentName;
      }
    }

    const assignment = bedAssignments.find(
      (a) => {
        if (!a || !a.bed_id) return false;

        const assignmentBedId = a.bed_id._id;
        return assignmentBedId === bed._id && isAssignmentActive(a);
      }
    );

    if (assignment && assignment.resident_id) {
      const residentName = assignment.resident_id.full_name;
      return residentName;
    }

    return null;
  };

  // Tính toán trạng thái phòng dựa trên số giường thực tế đang được sử dụng
  const getRoomStatus = (room: Room) => {
    const roomBeds = bedsOfRoom(room._id);
    const occupiedBedsInRoom = roomBeds.filter(bed => bed.status === "occupied").length;
    
    // Nếu tất cả giường đều được sử dụng
    if (occupiedBedsInRoom >= room.bed_count) {
      return "occupied";
    }
    
    // Nếu còn ít nhất 1 giường trống
    return "available";
  };

  // Lấy thông tin chi tiết về trạng thái phòng
  const getRoomStatusInfo = (room: Room) => {
    const roomBeds = bedsOfRoom(room._id);
    const occupiedBedsInRoom = roomBeds.filter(bed => bed.status === "occupied").length;
    const availableBedsInRoom = room.bed_count - occupiedBedsInRoom;
    
    return {
      occupied: occupiedBedsInRoom,
      available: availableBedsInRoom,
      total: room.bed_count,
      status: getRoomStatus(room)
    };
  };

  const openTransferPage = (bed: any, room: any) => {
    router.push(`/admin/room-management/transfer?bedId=${bed._id}&roomId=${room._id}`);
  };

  // Room management functions
  const handleEditRoom = (room: Room) => {
    setEditingRoom(room);
    setShowRoomEditModal(true);
  };

  const handleEditBed = (bed: any) => {
    setEditingBed(bed);
    setShowBedEditModal(true);
  };

  const handleAddBed = (roomId: string) => {
    setEditingRoom(rooms.find(r => r._id === roomId) || null);
    setShowAddBedModal(true);
  };

  const handleUpdateRoom = async (formData: any) => {
    if (!editingRoom) return;
    
    // Validate bed count against room type
    const selectedRoomType = roomTypes.find(type => type.room_type === formData.room_type);
    if (selectedRoomType) {
      // Function to get max beds from room type
      const getMaxBedsFromRoomType = (roomType: string): number => {
        switch (roomType) {
          case '2_bed': return 2;
          case '3_bed': return 3;
          case '4_5_bed': return 5;
          case '6_8_bed': return 8;
          default: return 10;
        }
      };
      
      const maxBeds = getMaxBedsFromRoomType(formData.room_type);
      const requestedBeds = typeof formData.bed_count === 'number' ? formData.bed_count : parseInt(formData.bed_count);
      
      if (requestedBeds > maxBeds) {
        setError(`Số lượng giường không được vượt quá ${maxBeds} giường (theo loại phòng ${selectedRoomType.type_name})`);
      return;
      }
    }
    
    // Validate bed reduction - check if any beds are occupied or have pending requests
    const currentBeds = bedsOfRoom(editingRoom._id);
    const newBedCount = parseInt(formData.bed_count);
    const currentBedCount = currentBeds.length;
    
    if (newBedCount < currentBedCount) {
      // Check if any beds that would be removed are occupied
      const bedsToRemove = currentBeds.slice(newBedCount);
      const occupiedBeds = bedsToRemove.filter(bed => bed.status === 'occupied');
      
      if (occupiedBeds.length > 0) {
        const occupiedBedNumbers = occupiedBeds.map(bed => bed.bed_number).join(', ');
        setError(`Không thể giảm số giường vì có ${occupiedBeds.length} giường đang được sử dụng: ${occupiedBedNumbers}. Vui lòng chuyển resident ra khỏi các giường này trước.`);
        return;
      }
      
      // TODO: Check for pending room change requests
      // This would require checking service requests or room change requests
      // For now, we'll add a warning but allow the operation
      console.warn('Bed reduction requested - consider checking for pending room change requests');
    }
    
    setIsSubmitting(true);
    try {
      // Update room
      await roomsAPI.update(editingRoom._id, formData);
      
      // If bed count changed, handle beds
      if (formData.bed_count !== editingRoom.bed_count) {
        const currentBeds = bedsOfRoom(editingRoom._id);
        const newBedCount = parseInt(formData.bed_count);
        const currentBedCount = currentBeds.length;
        
        if (newBedCount > currentBedCount) {
          // Add new beds
          console.log(`Adding ${newBedCount - currentBedCount} new beds for room ${editingRoom.room_number}`);
          
          // Get existing bed numbers to avoid duplicates
          const existingBedNumbers = currentBeds.map(bed => bed.bed_number);
          
          // Also check all beds in the system to avoid any potential conflicts
          const allBeds = beds.filter(bed => bed.room_id === editingRoom._id);
          const allBedNumbers = allBeds.map(bed => bed.bed_number);
          const combinedExistingNumbers = [...new Set([...existingBedNumbers, ...allBedNumbers])];
          
          console.log('Existing bed numbers:', existingBedNumbers);
          console.log('All bed numbers in room:', allBedNumbers);
          
          // Find the next available bed numbers
          const newBedNumbers: string[] = [];
          let bedIndex = 1;
          
          for (let i = currentBedCount; i < newBedCount; i++) {
            let bedNumber: string;
            do {
              // Try different naming patterns
              if (bedIndex <= 26) {
                // Use letters A-Z for first 26 beds
                bedNumber = `${editingRoom.room_number}-${String.fromCharCode(64 + bedIndex)}`;
              } else {
                // Use numbers for beds beyond 26
                bedNumber = `${editingRoom.room_number}-${bedIndex}`;
              }
              bedIndex++;
            } while (combinedExistingNumbers.includes(bedNumber) || newBedNumbers.includes(bedNumber));
            
            newBedNumbers.push(bedNumber);
            console.log(`Creating bed: ${bedNumber}`);
            
            await bedsAPI.create({
              bed_number: bedNumber,
              room_id: editingRoom._id,
              bed_type: 'standard',
              status: 'available'
            });
          }
        } else if (newBedCount < currentBedCount) {
          // Remove excess beds (only if not occupied)
          const bedsToRemove = currentBeds.slice(newBedCount);
          console.log(`Removing ${bedsToRemove.length} beds for room ${editingRoom.room_number}`);
          
          for (const bed of bedsToRemove) {
            if (bed.status === 'available') {
              console.log(`Deleting available bed: ${bed.bed_number}`);
              await bedsAPI.delete(bed._id);
      } else {
              console.warn(`Cannot delete occupied bed: ${bed.bed_number} (status: ${bed.status})`);
            }
          }
        }
      }
      
      // Refresh data
      await refreshData();
      
      setShowRoomEditModal(false);
      setEditingRoom(null);
      
      // Create success message with bed count info
      let successMsg = 'Cập nhật thông tin phòng thành công!';
      if (formData.bed_count !== editingRoom.bed_count) {
        const bedDiff = parseInt(formData.bed_count) - editingRoom.bed_count;
        if (bedDiff > 0) {
          successMsg += ` Đã thêm ${bedDiff} giường mới.`;
        } else if (bedDiff < 0) {
          const bedsToRemove = currentBeds.slice(parseInt(formData.bed_count));
          const occupiedBeds = bedsToRemove.filter(bed => bed.status === 'occupied');
          const deletedBeds = Math.abs(bedDiff) - occupiedBeds.length;
          
          if (deletedBeds > 0) {
            successMsg += ` Đã xóa ${deletedBeds} giường trống.`;
          }
          if (occupiedBeds.length > 0) {
            successMsg += ` ${occupiedBeds.length} giường đang sử dụng không thể xóa.`;
          }
        }
      }
      
      setSuccessMessage(successMsg);
      setShowSuccessModal(true);
    } catch (error: any) {
      console.error('Error updating room:', error);
      setError('Không thể cập nhật thông tin phòng. Vui lòng thử lại.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleUpdateBed = async (formData: any) => {
    if (!editingBed) return;
    
    setIsSubmitting(true);
    try {
      await bedsAPI.update(editingBed._id, formData);
      
      // Refresh data
      await refreshData();
      
      setShowBedEditModal(false);
      setEditingBed(null);
      setSuccessMessage('Cập nhật thông tin giường thành công!');
      setShowSuccessModal(true);
    } catch (error: any) {
      console.error('Error updating bed:', error);
      setError('Không thể cập nhật thông tin giường. Vui lòng thử lại.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleAddNewBed = async (formData: any) => {
    if (!editingRoom) return;
    
    // Check if room has reached maximum bed capacity
    const currentBeds = bedsOfRoom(editingRoom._id);
    const currentBedCount = currentBeds.length;
    
    // Get room type info to check max beds
    const roomType = roomTypes.find(type => type.room_type === editingRoom.room_type);
    if (roomType) {
      // Function to get max beds from room type
      const getMaxBedsFromRoomType = (roomType: string): number => {
        switch (roomType) {
          case '2_bed': return 2;
          case '3_bed': return 3;
          case '4_5_bed': return 5;
          case '6_8_bed': return 8;
          default: return 10;
        }
      };
      
      const maxBeds = getMaxBedsFromRoomType(editingRoom.room_type);
      
      if (currentBedCount >= maxBeds) {
        setError(`Phòng ${editingRoom.room_number} đã đạt tối đa ${maxBeds} giường (loại phòng ${roomType.type_name}). Không thể thêm giường mới.`);
        return;
      }
    }
    
    setIsSubmitting(true);
    try {
      // Get existing bed numbers to avoid duplicates
      const existingBedNumbers = currentBeds.map(bed => bed.bed_number);
      
      // Also check all beds in the system to avoid any potential conflicts
      const allBeds = beds.filter(bed => bed.room_id === editingRoom._id);
      const allBedNumbers = allBeds.map(bed => bed.bed_number);
      const combinedExistingNumbers = [...new Set([...existingBedNumbers, ...allBedNumbers])];
      
      // If no bed number provided, generate one
      let bedNumber = formData.bed_number;
      if (!bedNumber || bedNumber.trim() === '') {
        // Find next available bed number
        let bedIndex = 1;
        do {
          if (bedIndex <= 26) {
            bedNumber = `${editingRoom.room_number}-${String.fromCharCode(64 + bedIndex)}`;
          } else {
            bedNumber = `${editingRoom.room_number}-${bedIndex}`;
          }
          bedIndex++;
        } while (combinedExistingNumbers.includes(bedNumber));
      } else {
        // Check if provided bed number already exists
        if (combinedExistingNumbers.includes(bedNumber)) {
          setError(`Giường ${bedNumber} đã tồn tại. Vui lòng chọn tên khác.`);
          setIsSubmitting(false);
          return;
        }
      }
      
      console.log(`Creating new bed: ${bedNumber}`);
      
      await bedsAPI.create({
        bed_number: bedNumber,
        bed_type: formData.bed_type,
        room_id: editingRoom._id,
          status: 'available'
        });
      
      // Refresh data
      await refreshData();
      
      setShowAddBedModal(false);
      setEditingRoom(null);
      setSuccessMessage(`Thêm giường ${bedNumber} thành công!`);
      setShowSuccessModal(true);
    } catch (error: any) {
      console.error('Error adding bed:', error);
      setError('Không thể thêm giường mới. Vui lòng thử lại.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteBed = async (bedId: string) => {
    if (!confirm('Bạn có chắc chắn muốn xóa giường này? Hành động này không thể hoàn tác.')) {
      return;
    }

    setIsSubmitting(true);
    try {
      await bedsAPI.delete(bedId);
      
      // Refresh data
      await refreshData();
      
      setSuccessMessage('Xóa giường thành công!');
      setShowSuccessModal(true);
    } catch (error: any) {
      console.error('Error deleting bed:', error);
      setError('Không thể xóa giường. Vui lòng thử lại.');
    } finally {
      setIsSubmitting(false);
    }
  };





  const filteredRooms = rooms
    .filter((room) => {
      const type = getRoomType(room.room_type);
      const search = searchTerm.toLowerCase();
      return (
        room.room_number.toLowerCase().includes(search) ||
        (type?.type_name?.toLowerCase() || '').includes(search) ||
        (room.floor + '').includes(search)
      );
    })
    .sort((a, b) => a.room_number.localeCompare(b.room_number, undefined, { numeric: true, sensitivity: 'base' }));

  const totalRooms = rooms.length;
  const availableRooms = rooms.filter(room => getRoomStatus(room) === "available").length;
  const occupiedRooms = rooms.filter(room => getRoomStatus(room) === "occupied").length;
  const totalBeds = beds.length;
  const occupiedBeds = beds.filter(bed => bed.status === "occupied").length;

  if (loading) return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-200 flex items-center justify-center">
      <div className="text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
        <p className="text-gray-600 font-medium">Đang tải dữ liệu...</p>
      </div>
    </div>
  );

  if (error) return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-200 flex items-center justify-center">
      <div className="text-center p-8 bg-white rounded-2xl shadow-lg">
        <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <BuildingOfficeIcon className="w-8 h-8 text-red-600" />
        </div>
        <h3 className="text-lg font-semibold text-gray-900 mb-2">Lỗi tải dữ liệu</h3>
        <p className="text-red-600">{error}</p>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100">
      <div className="max-w-7xl mx-auto px-6 py-8">

        {/* Header Section */}
        <div className="bg-gradient-to-br from-white via-white to-blue-50 rounded-2xl p-6 mb-6 shadow-lg border border-white/50 backdrop-blur-sm">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-4">
            <button
              onClick={() => router.push('/admin')}
                className="group p-3 rounded-xl bg-gradient-to-r from-slate-100 to-slate-200 hover:from-blue-100 hover:to-indigo-100 text-slate-700 hover:text-blue-700 hover:shadow-lg hover:shadow-blue-200/50 hover:-translate-y-0.5 transition-all duration-300"
              title="Quay lại"
            >
              <ArrowLeftIcon className="w-5 h-5 group-hover:scale-110 transition-transform duration-200" />
            </button>
              <div className="w-14 h-14 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-2xl flex items-center justify-center shadow-lg shadow-blue-500/25">
                <BuildingOfficeIconSolid className="w-7 h-7 text-white" />
            </div>
              <div>
                <h1 className="text-3xl font-black text-transparent bg-clip-text bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 mb-2 tracking-tight">
                  Quản Lý Phòng & Giường
              </h1>
                <p className="text-base text-slate-600 font-semibold flex items-center gap-2">
                  <ChartBarIcon className="w-4 h-4 text-blue-500" />
                Quản lý và theo dõi tình trạng phòng và giường bệnh
              </p>
              </div>
            </div>

            {/* Statistics Summary */}
            <div className="flex items-center gap-4">
              <div className="bg-gradient-to-br from-blue-50 to-indigo-50 px-6 py-4 rounded-2xl border border-blue-200/50 shadow-md">
                <div className="text-center">
                  <div className="text-xs text-blue-600 font-bold mb-1 uppercase tracking-wide">
                    Tổng phòng
                  </div>
                  <div className="text-2xl font-black text-blue-700 mb-1">
                    {totalRooms}
                  </div>
                  <div className="text-xs text-blue-600 font-semibold">
                    phòng
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

       

        {/* Statistics Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          <div className="bg-gradient-to-br from-blue-50 via-blue-100 to-indigo-100 rounded-2xl p-6 text-blue-800 shadow-lg border border-blue-200/50 backdrop-blur-sm">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-blue-600 text-xs font-bold uppercase tracking-wide mb-1">Tổng phòng</p>
                <p className="text-2xl font-black text-blue-900 mb-1">{totalRooms}</p>
                <p className="text-blue-600 text-xs font-bold">phòng</p>
              </div>
              <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-xl flex items-center justify-center shadow-md shadow-blue-500/25">
                <HomeIconSolid className="w-6 h-6 text-white" />
              </div>
            </div>
          </div>

          <div className="bg-gradient-to-br from-purple-50 via-purple-100 to-violet-100 rounded-2xl p-6 text-purple-800 shadow-lg border border-purple-200/50 backdrop-blur-sm">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-purple-600 text-xs font-bold uppercase tracking-wide mb-1">Tổng giường</p>
                <p className="text-2xl font-black text-purple-900 mb-1">{totalBeds}</p>
                <p className="text-purple-600 text-xs font-bold">giường</p>
              </div>
              <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-violet-600 rounded-xl flex items-center justify-center shadow-md shadow-purple-500/25">
                <BuildingOfficeIconSolid className="w-6 h-6 text-white" />
              </div>
            </div>
          </div>

          <div className="bg-gradient-to-br from-orange-50 via-orange-100 to-amber-100 rounded-2xl p-6 text-orange-800 shadow-lg border border-orange-200/50 backdrop-blur-sm">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-orange-600 text-xs font-bold uppercase tracking-wide mb-1">Giường đã sử dụng</p>
                <p className="text-2xl font-black text-orange-900 mb-1">{occupiedBeds}</p>
                <p className="text-orange-600 text-xs font-bold">giường</p>
              </div>
              <div className="w-12 h-12 bg-gradient-to-br from-orange-500 to-amber-600 rounded-xl flex items-center justify-center shadow-md shadow-orange-500/25">
                <MapPinIconSolid className="w-6 h-6 text-white" />
              </div>
            </div>
          </div>

          <div className="bg-gradient-to-br from-emerald-50 via-emerald-100 to-green-100 rounded-2xl p-6 text-emerald-800 shadow-lg border border-emerald-200/50 backdrop-blur-sm">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-emerald-600 text-xs font-bold uppercase tracking-wide mb-1">Phòng trống</p>
                <p className="text-2xl font-black text-emerald-900 mb-1">{availableRooms}</p>
                <p className="text-emerald-600 text-xs font-bold">phòng</p>
              </div>
              <div className="w-12 h-12 bg-gradient-to-br from-emerald-500 to-green-600 rounded-xl flex items-center justify-center shadow-md shadow-emerald-500/25">
                <UsersIconSolid className="w-6 h-6 text-white" />
              </div>
            </div>
          </div>
        </div>

        {/* Search and Filter Section */}
        <div className="bg-gradient-to-br from-white via-white to-slate-50 rounded-2xl p-6 mb-6 shadow-lg border border-white/50 backdrop-blur-sm">
          <div className="mb-4">
            <h2 className="text-lg font-bold text-slate-800 mb-2 flex items-center gap-2">
              <div className="w-6 h-6 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-md flex items-center justify-center">
                <FunnelIcon className="w-4 h-4 text-white" />
              </div>
              Tìm kiếm và lọc
            </h2>
            <p className="text-sm text-slate-600 font-medium">Tìm kiếm phòng theo số phòng, loại phòng, tầng</p>
          </div>
          
          <div className="flex flex-col lg:flex-row gap-4 items-end">
            <div className="flex-1 relative group">
              <MagnifyingGlassIcon className="w-5 h-5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 group-hover:text-blue-500 transition-colors" />
              <input
                type="text"
                placeholder="Tìm theo số phòng, loại phòng, tầng..."
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-3 border-2 border-slate-200 rounded-xl text-sm outline-none bg-white transition-all duration-300 focus:border-blue-500 focus:ring-4 focus:ring-blue-100 shadow-md hover:shadow-lg font-medium text-slate-700 group-hover:border-blue-300"
              />
            </div>
            
            <div className="bg-gradient-to-r from-blue-50 to-indigo-50 px-4 py-3 rounded-xl border border-blue-200/50 shadow-md">
              <p className="text-blue-700 font-bold text-sm">
                Hiển thị: {filteredRooms.length} phòng
              </p>
            </div>
          </div>
        </div>

        {/* Data Table Section */}
        <div className="bg-gradient-to-br from-white via-white to-slate-50 rounded-2xl overflow-hidden shadow-lg border border-white/50 backdrop-blur-sm">
          <div className="p-6 border-b border-slate-200/50 bg-gradient-to-r from-slate-50 to-blue-50/30">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-slate-700 to-blue-700 mb-2 flex items-center gap-2">
                  <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-lg flex items-center justify-center">
                    <BuildingOfficeIcon className="w-5 h-5 text-white" />
                  </div>
                  Danh sách phòng
              </h2>
                <p className="text-sm text-slate-600 font-semibold flex items-center gap-2">
                  <ChartBarIcon className="w-4 h-4 text-blue-500" />
                  Hiển thị {filteredRooms.length} trong tổng số {totalRooms} phòng
                </p>
            </div>
              <div className="text-xs text-slate-600 bg-gradient-to-r from-blue-100 to-indigo-100 px-3 py-2 rounded-xl border border-blue-200/50 font-semibold shadow-md">
                <UserGroupIcon className="w-4 h-4 text-blue-500 inline mr-1" />
                Quản lý phòng
          </div>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full min-w-[1000px]">
              <thead>
                <tr className="bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600">
                  <th className="px-4 py-3 text-left text-white font-bold text-xs uppercase tracking-wider min-w-[120px]">
                    <div className="flex items-center gap-2">
                      <HomeIcon className="w-4 h-4" />
                    Số phòng
                    </div>
                  </th>
                  <th className="px-3 py-3 text-left text-white font-bold text-xs uppercase tracking-wider min-w-[150px]">
                    <div className="flex items-center gap-2">
                      <CalendarDaysIcon className="w-4 h-4" />
                    Loại phòng
                    </div>
                  </th>
                  <th className="px-3 py-3 text-center text-white font-bold text-xs uppercase tracking-wider min-w-[100px]">
                    <div className="flex items-center justify-center gap-2">
                      <BuildingOfficeIcon className="w-4 h-4" />
                    Số giường
                    </div>
                  </th>
                  <th className="px-3 py-3 text-center text-white font-bold text-xs uppercase tracking-wider min-w-[100px]">
                    <div className="flex items-center justify-center gap-2">
                      <UserGroupIcon className="w-4 h-4" />
                    Giới tính
                    </div>
                  </th>
                  <th className="px-3 py-3 text-center text-white font-bold text-xs uppercase tracking-wider min-w-[80px]">
                    <div className="flex items-center justify-center gap-2">
                      <MapPinIcon className="w-4 h-4" />
                    Tầng
                    </div>
                  </th>
                  <th className="px-3 py-3 text-center text-white font-bold text-xs uppercase tracking-wider min-w-[120px]">
                    <div className="flex items-center justify-center gap-2">
                      <ClockIcon className="w-4 h-4" />
                    Trạng thái
                    </div>
                  </th>
                  <th className="px-3 py-3 text-center text-white font-bold text-xs uppercase tracking-wider min-w-[140px]">
                    <div className="flex items-center justify-center gap-2">
                      <EyeIcon className="w-4 h-4" />
                    Thao tác
                    </div>
                  </th>
                </tr>
              </thead>
              <tbody>
                {filteredRooms.map((room, index) => {
                  const type = getRoomType(room.room_type);
                  return (
                    <tr
                      key={room._id}
                      className={`border-b border-slate-200/50 transition-all duration-300 hover:bg-gradient-to-r hover:from-blue-50/50 hover:to-indigo-50/50 hover:shadow-lg hover:shadow-blue-100/50 ${
                        index % 2 === 0 ? 'bg-white' : 'bg-slate-50/30'
                        }`}
                    >
                      <td className="px-4 py-4">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-xl flex items-center justify-center text-white font-bold text-sm shadow-md">
                            {room.room_number}
                          </div>
                        </div>
                      </td>
                      <td className="px-3 py-4">
                        <div className="flex items-center gap-2">
                          <span className="px-3 py-1 bg-gradient-to-r from-blue-100 to-indigo-100 text-blue-800 rounded-lg text-xs font-bold shadow-sm border border-blue-200">
                          {type ? type.type_name : room.room_type}
                        </span>
                        </div>
                      </td>
                      <td className="px-3 py-4 text-center">
                        <span className="font-bold text-slate-800 text-sm">{room.bed_count}</span>
                      </td>
                      <td className="px-3 py-4 text-center">
                        <span className={`px-3 py-1 rounded-lg text-xs font-bold shadow-sm ${room.gender === "male"
                            ? "bg-gradient-to-r from-blue-100 to-blue-200 text-blue-800 border border-blue-300"
                            : room.gender === "female"
                              ? "bg-gradient-to-r from-pink-100 to-pink-200 text-pink-800 border border-pink-300"
                              : "bg-gradient-to-r from-gray-100 to-gray-200 text-gray-800 border border-gray-300"
                        }`}>
                          {room.gender === "male" ? "Nam" : room.gender === "female" ? "Nữ" : "Hỗn hợp"}
                        </span>
                      </td>
                      <td className="px-3 py-4 text-center">
                        <span className="font-bold text-slate-800 text-sm">Tầng {room.floor}</span>
                      </td>
                        <td className="px-3 py-4 text-center">
                          {(() => {
                            const statusInfo = getRoomStatusInfo(room);
                            return (
                        <div className="flex flex-col items-center gap-1">
                                <span className={`px-3 py-1 rounded-lg text-xs font-bold shadow-sm ${statusInfo.status === "available"
                                    ? "bg-gradient-to-r from-emerald-100 to-emerald-200 text-emerald-800 border border-emerald-300"
                                    : "bg-gradient-to-r from-red-100 to-red-200 text-red-800 border border-red-300"
                          }`}>
                            {statusInfo.status === "available" ? "Còn trống" : "Hết giường"}
                          </span>
                                <span className="text-xs text-slate-500 font-medium">
                                  {statusInfo.occupied}/{statusInfo.total} giường
                          </span>
                        </div>
                            );
                          })()}
                      </td>
                      <td className="px-3 py-4 text-center">
                        <div className="flex items-center justify-center gap-2">
                          <button
                            onClick={() => handleEditRoom(room)}
                            className="px-3 py-2 bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white rounded-lg text-xs font-bold transition-all duration-300 flex items-center gap-1 shadow-md shadow-amber-500/25 hover:shadow-amber-600/40 hover:-translate-y-0.5"
                            title="Chỉnh sửa phòng"
                          >
                            <PencilIcon className="w-3 h-3" />
                            Sửa
                          </button>
                          <button
                            className={`px-3 py-2 rounded-xl font-bold text-xs transition-all duration-300 flex items-center gap-1 shadow-md hover:shadow-lg hover:-translate-y-0.5 ${selectedRoomId === room._id
                                ? "bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 text-white shadow-red-500/25"
                                : "bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700 text-white shadow-blue-500/25"
                              }`}
                            onClick={() => setSelectedRoomId(selectedRoomId === room._id ? null : room._id)}
                          >
                            <EyeIcon className="w-4 h-4" />
                            {selectedRoomId === room._id ? "Ẩn giường" : "Xem giường"}
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>

        {selectedRoomId && (
          <div className="mt-6 bg-gradient-to-br from-white via-white to-blue-50 rounded-2xl p-6 shadow-lg border border-white/50 backdrop-blur-sm">
            <div className="mb-6">
              <h2 className="text-xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-slate-700 to-blue-700 mb-4 flex items-center gap-3">
                <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-xl flex items-center justify-center text-white font-bold text-lg shadow-md shadow-blue-500/25">
                  {rooms.find((r) => r._id === selectedRoomId)?.room_number}
                </div>
                Danh sách giường phòng {rooms.find((r) => r._id === selectedRoomId)?.room_number}
              </h2>

              {(() => {
                const room = rooms.find((r) => r._id === selectedRoomId);
                const type = room ? getRoomType(room.room_type) : null;
                if (!type) return null;
                return (
                  <div className="bg-gradient-to-br from-white via-white to-slate-50 rounded-2xl p-6 shadow-lg border border-white/50 backdrop-blur-sm mb-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="flex items-center gap-4 p-4 bg-gradient-to-r from-blue-50 via-blue-100 to-indigo-50 rounded-xl border border-blue-200/50 shadow-md">
                        <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-xl flex items-center justify-center text-white font-bold text-sm shadow-md shadow-blue-500/25">
                          LG
                        </div>
                        <div>
                          <div className="text-xs text-blue-600 font-bold uppercase tracking-wide mb-1">Loại phòng</div>
                          <div className="text-base font-black text-blue-800">{type.type_name}</div>
                        </div>
                      </div>

                      <div className="flex items-center gap-4 p-4 bg-gradient-to-r from-emerald-50 via-emerald-100 to-green-50 rounded-xl border border-emerald-200/50 shadow-md">
                        <div className="w-12 h-12 bg-gradient-to-br from-emerald-500 to-green-600 rounded-xl flex items-center justify-center text-white font-bold text-sm shadow-md shadow-emerald-500/25">
                          <CurrencyDollarIcon className="w-6 h-6" />
                        </div>
                        <div>
                          <div className="text-xs text-emerald-600 font-bold uppercase tracking-wide mb-1">Giá phòng</div>
                          <div className="text-base font-black text-emerald-800">{formatDisplayCurrency(type.monthly_price)}/tháng</div>
                        </div>
                      </div>
                    </div>

                    <div className="mt-6">
                      <div className="bg-gradient-to-r from-slate-50 to-blue-50 rounded-xl p-4 border border-slate-200/50 shadow-md">
                        <div className="text-xs text-slate-600 font-bold uppercase tracking-wide mb-2">Mô tả</div>
                        <div className="text-slate-800 leading-relaxed text-sm font-medium">{type.description}</div>
                      </div>
                    </div>

                    {type.amenities && type.amenities.length > 0 && (
                      <div className="mt-6">
                        <div className="text-xs text-slate-600 font-bold uppercase tracking-wide mb-3">Tiện ích</div>
                        <div className="flex flex-wrap gap-2">
                          {type.amenities.map((amenity, index) => (
                            <span
                              key={index}
                              className="px-3 py-1 bg-gradient-to-r from-blue-100 to-indigo-100 text-blue-800 rounded-lg text-xs font-bold border border-blue-200 shadow-sm"
                            >
                              {amenity}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                );
              })()}
            </div>

            <div className="overflow-x-auto">
              {bedsOfRoom(selectedRoomId).length === 0 ? (
                <div className="text-center py-12 bg-gradient-to-br from-slate-50 to-blue-50/30 rounded-2xl shadow-lg border border-white/50 backdrop-blur-sm">
                  <div className="w-16 h-16 bg-gradient-to-br from-slate-200 to-blue-200 rounded-full flex items-center justify-center mx-auto mb-4 shadow-md">
                    <BuildingOfficeIcon className="w-8 h-8 text-slate-500" />
                  </div>
                  <h3 className="text-lg font-bold text-slate-700 mb-2">Chưa có người cao tuổi ở phòng này</h3>
                  <p className="text-slate-600 leading-relaxed max-w-md mx-auto text-sm font-medium">Phòng này hiện chưa có người cao tuổi nào được thiết lập.</p>
                </div>
              ) : (
                <div className="bg-gradient-to-br from-white via-white to-slate-50 rounded-2xl overflow-hidden shadow-lg border border-white/50 backdrop-blur-sm">
                  <div className="p-4 border-b border-slate-200/50 bg-gradient-to-r from-slate-50 to-indigo-50/30">
                    <div className="flex items-center justify-between">
                    <h3 className="text-lg font-bold text-transparent bg-clip-text bg-gradient-to-r from-slate-700 to-indigo-700 flex items-center gap-2">
                      <div className="w-6 h-6 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-md flex items-center justify-center">
                        <BuildingOfficeIcon className="w-4 h-4 text-white" />
                      </div>
                      Chi tiết giường
                    </h3>
                      <button
                        onClick={() => handleAddBed(selectedRoomId)}
                        disabled={(() => {
                          const room = rooms.find(r => r._id === selectedRoomId);
                          if (!room) return true;
                          const roomType = roomTypes.find(type => type.room_type === room.room_type);
                          if (!roomType) return true;
                          const getMaxBedsFromRoomType = (roomType: string): number => {
                            switch (roomType) {
                              case '2_bed': return 2;
                              case '3_bed': return 3;
                              case '4_5_bed': return 5;
                              case '6_8_bed': return 8;
                              default: return 10;
                            }
                          };
                          const maxBeds = getMaxBedsFromRoomType(room.room_type);
                          const currentBeds = bedsOfRoom(selectedRoomId);
                          return currentBeds.length >= maxBeds;
                        })()}
                        className={`px-4 py-2 rounded-lg text-sm font-bold transition-all duration-300 flex items-center gap-2 shadow-md hover:-translate-y-0.5 ${
                          (() => {
                            const room = rooms.find(r => r._id === selectedRoomId);
                            if (!room) return 'bg-slate-400 text-slate-200 cursor-not-allowed';
                            const roomType = roomTypes.find(type => type.room_type === room.room_type);
                            if (!roomType) return 'bg-slate-400 text-slate-200 cursor-not-allowed';
                            const getMaxBedsFromRoomType = (roomType: string): number => {
                              switch (roomType) {
                                case '2_bed': return 2;
                                case '3_bed': return 3;
                                case '4_5_bed': return 5;
                                case '6_8_bed': return 8;
                                default: return 10;
                              }
                            };
                            const maxBeds = getMaxBedsFromRoomType(room.room_type);
                            const currentBeds = bedsOfRoom(selectedRoomId);
                            return currentBeds.length >= maxBeds 
                              ? 'bg-slate-400 text-slate-200 cursor-not-allowed' 
                              : 'bg-gradient-to-r from-emerald-500 to-green-500 hover:from-emerald-600 hover:to-green-600 text-white shadow-emerald-500/25 hover:shadow-emerald-600/40';
                          })()
                        }`}
                        title={(() => {
                          const room = rooms.find(r => r._id === selectedRoomId);
                          if (!room) return 'Không tìm thấy phòng';
                          const roomType = roomTypes.find(type => type.room_type === room.room_type);
                          if (!roomType) return 'Không tìm thấy loại phòng';
                          const getMaxBedsFromRoomType = (roomType: string): number => {
                            switch (roomType) {
                              case '2_bed': return 2;
                              case '3_bed': return 3;
                              case '4_5_bed': return 5;
                              case '6_8_bed': return 8;
                              default: return 10;
                            }
                          };
                          const maxBeds = getMaxBedsFromRoomType(room.room_type);
                          const currentBeds = bedsOfRoom(selectedRoomId);
                          return currentBeds.length >= maxBeds 
                            ? `Phòng đã đạt tối đa ${maxBeds} giường` 
                            : 'Thêm giường mới';
                        })()}
                      >
                        <PlusIcon className="w-4 h-4" />
                        Thêm giường
                      </button>
                    </div>
                  </div>
                  <table className="w-full">
                    <thead>
                      <tr className="bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600">
                        <th className="px-4 py-3 text-left text-white font-bold text-xs uppercase tracking-wider min-w-[100px]">
                          <div className="flex items-center gap-2">
                            <BuildingOfficeIcon className="w-4 h-4" />
                            Số giường
                          </div>
                        </th>
                        <th className="px-3 py-3 text-left text-white font-bold text-xs uppercase tracking-wider min-w-[120px]">
                          <div className="flex items-center gap-2">
                            <CalendarDaysIcon className="w-4 h-4" />
                            Loại giường
                          </div>
                        </th>
                        <th className="px-3 py-3 text-center text-white font-bold text-xs uppercase tracking-wider min-w-[100px]">
                          <div className="flex items-center justify-center gap-2">
                            <ClockIcon className="w-4 h-4" />
                            Trạng thái
                          </div>
                        </th>
                        <th className="px-3 py-3 text-left text-white font-bold text-xs uppercase tracking-wider min-w-[160px]">
                          <div className="flex items-center gap-2">
                            <UserGroupIcon className="w-4 h-4" />
                            Người cao tuổi đang ở
                          </div>
                        </th>
                        <th className="px-3 py-3 text-center text-white font-bold text-xs uppercase tracking-wider min-w-[120px]">
                          <div className="flex items-center justify-center gap-2">
                            <ArrowPathIcon className="w-4 h-4" />
                            Thao tác
                          </div>
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {bedsOfRoom(selectedRoomId).map((bed, idx) => (
                        <tr key={bed._id} className={`border-b border-slate-200/50 transition-all duration-300 hover:bg-gradient-to-r hover:from-indigo-50/50 hover:to-purple-50/50 hover:shadow-lg hover:shadow-indigo-100/50 ${
                          idx % 2 === 0 ? 'bg-white' : 'bg-slate-50/30'
                          }`}>
                          <td className="px-4 py-4">
                            <div className="flex items-center gap-3">
                              <div className="inline-flex items-center justify-center h-10 px-3 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-xl text-white font-bold text-sm shadow-md whitespace-nowrap">
                                {bed.bed_number}
                              </div>
                            </div>
                          </td>
                          <td className="px-3 py-4">
                            <span className="px-3 py-1 bg-gradient-to-r from-indigo-100 to-purple-100 text-indigo-800 rounded-lg text-xs font-bold shadow-sm border border-indigo-200">
                              {bed.bed_type === "standard" ? "Tiêu chuẩn" :
                                bed.bed_type === "electric" ? "Giường điện" :
                                  bed.bed_type}
                            </span>
                          </td>
                          <td className="px-3 py-4 text-center">
                            <span className={`px-3 py-1 rounded-lg text-xs font-bold shadow-sm ${bed.status === "occupied"
                                ? "bg-gradient-to-r from-red-100 to-red-200 text-red-800 border border-red-300"
                                : "bg-gradient-to-r from-emerald-100 to-emerald-200 text-emerald-800 border border-emerald-300"
                              }`}>
                              {bed.status === "occupied" ? "Đang sử dụng" : "Còn trống"}
                            </span>
                          </td>
                          <td className="px-3 py-4">
                            {(() => {
                              const residentName = getResidentOfBed(bed);

                              if (residentName) {
                                return (
                                  <div className="flex items-center gap-2">
                                    <div className="w-2 h-2 bg-emerald-500 rounded-full shadow-sm"></div>
                                    <span className="font-bold text-slate-800 text-sm">{residentName}</span>
                                  </div>
                                );
                              } else if (bed.status === "occupied") {
                                return (
                                  <div className="flex items-center gap-2">
                                    <div className="w-2 h-2 bg-orange-500 rounded-full shadow-sm"></div>
                                    <span className="text-orange-700 font-bold text-sm">Có người ở (chưa có thông tin)</span>
                                  </div>
                                );
                              } else {
                                return (
                                  <div className="flex items-center gap-2">
                                    <div className="w-2 h-2 bg-slate-400 rounded-full shadow-sm"></div>
                                    <span className="text-slate-600 font-bold text-sm">Chưa có người</span>
                                  </div>
                                );
                              }
                            })()}
                          </td>
                          <td className="px-3 py-4 text-center">
                            <div className="flex items-center justify-center gap-1">
                              <button
                                onClick={() => handleEditBed(bed)}
                                className="px-2 py-1 bg-gradient-to-r from-blue-500 to-indigo-500 hover:from-blue-600 hover:to-indigo-600 text-white rounded-lg text-xs font-bold transition-all duration-300 flex items-center gap-1 shadow-md shadow-blue-500/25 hover:shadow-blue-600/40 hover:-translate-y-0.5"
                                title="Chỉnh sửa giường"
                              >
                                <PencilIcon className="w-3 h-3" />
                              </button>
                              {bed.status === "available" && (
                                <button
                                  onClick={() => handleDeleteBed(bed._id)}
                                  className="px-2 py-1 bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 text-white rounded-lg text-xs font-bold transition-all duration-300 flex items-center gap-1 shadow-md shadow-red-500/25 hover:shadow-red-600/40 hover:-translate-y-0.5"
                                  title="Xóa giường"
                                >
                                  <TrashIcon className="w-3 h-3" />
                                </button>
                              )}
                            {bed.status === "occupied" && bed.assignment && (
                              <button
                                onClick={() => openTransferPage(bed, rooms.find(r => r._id === selectedRoomId))}
                                  className="px-2 py-1 bg-gradient-to-r from-orange-500 to-red-500 hover:from-orange-600 hover:to-red-600 text-white rounded-lg text-xs font-bold transition-all duration-300 flex items-center gap-1 shadow-md shadow-orange-500/25 hover:shadow-orange-600/40 hover:-translate-y-0.5"
                                title="Chuyển đổi phòng/giường"
                              >
                                <ArrowPathIcon className="w-3 h-3" />
                              </button>
                            )}
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        )}

        {filteredRooms.length === 0 && (
          <div className="text-center py-16 bg-gradient-to-br from-slate-50 to-blue-50/30 rounded-2xl shadow-lg border border-white/50 backdrop-blur-sm">
            <div className="w-20 h-20 bg-gradient-to-br from-slate-200 to-blue-200 rounded-full flex items-center justify-center mx-auto mb-6 shadow-md">
              <BuildingOfficeIcon className="w-10 h-10 text-slate-500" />
            </div>
            <h3 className="text-xl font-bold text-slate-700 mb-3">Không tìm thấy phòng phù hợp</h3>
            <p className="text-slate-600 leading-relaxed max-w-lg mx-auto text-sm font-medium mb-6">Thử thay đổi tiêu chí tìm kiếm hoặc bộ lọc để tìm phòng phù hợp</p>
            <button
              onClick={() => setSearchTerm('')}
              className="px-6 py-3 bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700 text-white rounded-xl font-bold transition-all duration-300 shadow-md shadow-blue-500/25 hover:shadow-blue-600/40 hover:-translate-y-0.5"
            >
              Xóa bộ lọc
            </button>
          </div>
        )}

        {/* Room Edit Modal */}
        {showRoomEditModal && editingRoom && (
          <RoomEditModal
            room={editingRoom}
            roomTypes={roomTypes}
            onClose={() => {
              setShowRoomEditModal(false);
              setEditingRoom(null);
            }}
            onSave={handleUpdateRoom}
            isSubmitting={isSubmitting}
          />
        )}

        {/* Bed Edit Modal */}
        {showBedEditModal && editingBed && (
          <BedEditModal
            bed={editingBed}
            onClose={() => {
              setShowBedEditModal(false);
              setEditingBed(null);
            }}
            onSave={handleUpdateBed}
            isSubmitting={isSubmitting}
          />
        )}

        {/* Add Bed Modal */}
        {showAddBedModal && editingRoom && (
          <AddBedModal
            room={editingRoom}
            onClose={() => {
              setShowAddBedModal(false);
              setEditingRoom(null);
            }}
            onSave={handleAddNewBed}
            isSubmitting={isSubmitting}
            roomTypes={roomTypes}
            bedsOfRoom={bedsOfRoom}
          />
        )}

        {/* Success Modal */}
        {showSuccessModal && (
          <SuccessModal
            message={successMessage}
            onClose={() => setShowSuccessModal(false)}
          />
        )}
              </div>
            </div>
  );
}

// Room Edit Modal Component
function RoomEditModal({ room, roomTypes, onClose, onSave, isSubmitting }: {
  room: Room;
  roomTypes: RoomType[];
  onClose: () => void;
  onSave: (data: any) => void;
  isSubmitting: boolean;
}) {
  const [formData, setFormData] = useState({
    room_type: room.room_type,
    bed_count: room.bed_count,
    gender: room.gender,
    floor: room.floor,
    status: room.status
  });

  const [validationError, setValidationError] = useState('');

  // Get current room type info
  const currentRoomType = roomTypes.find(type => type.room_type === formData.room_type);
  
  // Function to get max beds from room type
  const getMaxBedsFromRoomType = (roomType: string): number => {
    switch (roomType) {
      case '2_bed': return 2;
      case '3_bed': return 3;
      case '4_5_bed': return 5;
      case '6_8_bed': return 8;
      default: return 10;
    }
  };
  
  const maxBeds = getMaxBedsFromRoomType(formData.room_type);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Clear previous validation error
    setValidationError('');
    
    // Validate bed count
    const requestedBeds = typeof formData.bed_count === 'number' ? formData.bed_count : parseInt(formData.bed_count);
    if (requestedBeds > maxBeds) {
      setValidationError(`Số lượng giường không được vượt quá ${maxBeds} giường (theo loại phòng ${currentRoomType?.type_name})`);
      return;
    }
    
    // Validate bed reduction - check if any beds are occupied
    // Note: We need to pass bedsOfRoom function to this component or restructure
    // For now, we'll skip this validation in the modal and rely on the main function
    
    onSave(formData);
  };

  const handleRoomTypeChange = (newRoomType: string) => {
    const newMaxBeds = getMaxBedsFromRoomType(newRoomType);
    
    // If current bed count exceeds new max, adjust it
    if (formData.bed_count > newMaxBeds) {
      setFormData({ ...formData, room_type: newRoomType, bed_count: newMaxBeds });
    } else {
      setFormData({ ...formData, room_type: newRoomType });
    }
    
    setValidationError('');
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-in fade-in duration-300">
      <div className="bg-gradient-to-br from-white via-slate-50 to-blue-50 rounded-3xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto border border-white/20 animate-in zoom-in-95 duration-300">
        {/* Header */}
        <div className="relative p-8 border-b border-gradient-to-r from-blue-100 to-indigo-100">
          <div className="absolute inset-0 bg-gradient-to-r from-blue-500/5 via-indigo-500/5 to-purple-500/5 rounded-t-3xl"></div>
          <div className="relative flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-2xl flex items-center justify-center shadow-lg shadow-blue-500/25">
                <PencilIcon className="w-7 h-7 text-white" />
              </div>
              <div>
                <h2 className="text-2xl font-black text-transparent bg-clip-text bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600">
                  Chỉnh sửa phòng
                  </h2>
                <p className="text-lg font-bold text-slate-600">Phòng {room.room_number}</p>
              </div>
            </div>
                  <button
              onClick={onClose}
              className="p-3 hover:bg-red-50 rounded-2xl transition-all duration-300 group"
            >
              <XMarkIcon className="w-6 h-6 text-slate-500 group-hover:text-red-500 transition-colors" />
                  </button>
                </div>
              </div>


        {/* Form */}
        <form onSubmit={handleSubmit} className="p-8 space-y-6">
          {/* Room Type */}
          <div className="space-y-3">
            <label className="block text-sm font-bold text-slate-700 uppercase tracking-wide">
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 bg-gradient-to-r from-blue-500 to-indigo-500 rounded-full"></div>
                Loại phòng
                  </div>
                    </label>
            <div className="relative group">
            <select
              value={formData.room_type}
              onChange={(e) => handleRoomTypeChange(e.target.value)}
              className="w-full px-4 py-4 bg-white border-2 border-slate-200 rounded-2xl text-slate-700 font-semibold focus:ring-4 focus:ring-blue-100 focus:border-blue-500 transition-all duration-300 group-hover:border-blue-300 shadow-lg hover:shadow-xl appearance-none cursor-pointer"
                      required
            >
              {roomTypes.map((type) => {
                const maxBedsForType = getMaxBedsFromRoomType(type.room_type);
                return (
                  <option key={type._id} value={type.room_type}>
                    {type.type_name} 
                    
                  </option>
                );
              })}
            </select>
              <div className="absolute inset-y-0 right-0 flex items-center pr-4 pointer-events-none">
                <ChevronDownIcon className="w-5 h-5 text-slate-400" />
              </div>
            </div>
                  </div>

          {/* Bed Count & Floor */}
          <div className="grid grid-cols-2 gap-6">
            <div className="space-y-3">
              <label className="block text-sm font-bold text-slate-700 uppercase tracking-wide">
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 bg-gradient-to-r from-emerald-500 to-green-500 rounded-full"></div>
                  Số giường
                </div>
                    </label>
                    <input
                      type="number"
                      min="1"
                max={maxBeds}
                value={formData.bed_count}
                onChange={(e) => {
                  const value = parseInt(e.target.value);
                  setFormData({ ...formData, bed_count: value });
                  
                  // Clear previous error
                  setValidationError('');
                  
                  // Validate max beds
                  if (value > maxBeds) {
                    setValidationError(`Số lượng giường không được vượt quá ${maxBeds} giường (theo loại phòng ${currentRoomType?.type_name})`);
                    return;
                  }
                  
                  // Validate bed reduction
                  // Note: We can't access bedsOfRoom from here, so we'll skip this validation in real-time
                  // The validation will be done in handleSubmit instead
                }}
                className={`w-full px-4 py-4 bg-white border-2 rounded-2xl text-slate-700 font-bold text-center focus:ring-4 transition-all duration-300 shadow-lg hover:shadow-xl ${
                  validationError 
                    ? 'border-red-300 focus:border-red-500 focus:ring-red-100' 
                    : 'border-slate-200 focus:border-emerald-500 focus:ring-emerald-100 hover:border-emerald-300'
                }`}
                      required
                    />
              <div className="text-xs text-slate-500 font-medium text-center mt-1">
                Tối đa {maxBeds} giường
                  </div>
            </div>
            <div className="space-y-3">
              <label className="block text-sm font-bold text-slate-700 uppercase tracking-wide">
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 bg-gradient-to-r from-purple-500 to-pink-500 rounded-full"></div>
                  Tầng
                </div>
                    </label>
                    <input
                      type="number"
                min="1"
                max="20"
                value={formData.floor}
                onChange={(e) => setFormData({ ...formData, floor: parseInt(e.target.value) })}
                className="w-full px-4 py-4 bg-white border-2 border-slate-200 rounded-2xl text-slate-700 font-bold text-center focus:ring-4 focus:ring-purple-100 focus:border-purple-500 transition-all duration-300 hover:border-purple-300 shadow-lg hover:shadow-xl"
                      required
                    />
                  </div>
                </div>

          {/* Gender & Status */}
          <div className="grid grid-cols-2 gap-6">
            <div className="space-y-3">
              <label className="block text-sm font-bold text-slate-700 uppercase tracking-wide">
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 bg-gradient-to-r from-pink-500 to-rose-500 rounded-full"></div>
                  Giới tính
                </div>
                  </label>
              <div className="relative group">
                <select
                  value={formData.gender}
                  onChange={(e) => setFormData({ ...formData, gender: e.target.value })}
                  className="w-full px-4 py-4 bg-white border-2 border-slate-200 rounded-2xl text-slate-700 font-semibold focus:ring-4 focus:ring-pink-100 focus:border-pink-500 transition-all duration-300 group-hover:border-pink-300 shadow-lg hover:shadow-xl appearance-none cursor-pointer"
                  required
                >
                  <option value="male">Nam</option>
                  <option value="female">Nữ</option>
                 
                </select>
                <div className="absolute inset-y-0 right-0 flex items-center pr-4 pointer-events-none">
                  <ChevronDownIcon className="w-5 h-5 text-slate-400" />
                  </div>
              </div>
            </div>
            <div className="space-y-3">
              <label className="block text-sm font-bold text-slate-700 uppercase tracking-wide">
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 bg-gradient-to-r from-orange-500 to-amber-500 rounded-full"></div>
                  Trạng thái
                </div>
              </label>
              <div className="relative group">
                <select
                  value={formData.status}
                  onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                  className="w-full px-4 py-4 bg-white border-2 border-slate-200 rounded-2xl text-slate-700 font-semibold focus:ring-4 focus:ring-orange-100 focus:border-orange-500 transition-all duration-300 group-hover:border-orange-300 shadow-lg hover:shadow-xl appearance-none cursor-pointer"
                  required
                >
                  <option value="available">Có sẵn</option>
                  <option value="maintenance">Bảo trì</option>
                  <option value="occupied">Đã sử dụng</option>
                </select>
                <div className="absolute inset-y-0 right-0 flex items-center pr-4 pointer-events-none">
                  <ChevronDownIcon className="w-5 h-5 text-slate-400" />
                </div>
              </div>
                  </div>
                </div>

          {/* Validation Error */}
          {validationError && (
            <div className="bg-red-50 border-2 border-red-200 rounded-2xl p-4 animate-in fade-in duration-300">
              <div className="flex items-center gap-3">
                <div className="w-6 h-6 bg-red-100 rounded-full flex items-center justify-center">
                  <XMarkIcon className="w-4 h-4 text-red-600" />
                </div>
                <p className="text-red-700 font-semibold text-sm">{validationError}</p>
              </div>
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex gap-4 pt-6">
                  <button
                    type="button"
              onClick={onClose}
              className="flex-1 px-6 py-4 bg-gradient-to-r from-slate-100 to-slate-200 hover:from-slate-200 hover:to-slate-300 text-slate-700 font-bold rounded-2xl transition-all duration-300 shadow-lg hover:shadow-xl hover:-translate-y-0.5 border border-slate-300"
            >
              <div className="flex items-center justify-center gap-2">
                <XMarkIcon className="w-5 h-5" />
                Hủy bỏ
              </div>
                  </button>
                  <button
                    type="submit"
              disabled={isSubmitting || !!validationError}
              className="flex-1 px-6 py-4 bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700 disabled:from-slate-400 disabled:to-slate-500 text-white font-bold rounded-2xl transition-all duration-300 shadow-lg hover:shadow-xl hover:-translate-y-0.5 disabled:shadow-none disabled:translate-y-0 flex items-center justify-center gap-2"
            >
              {isSubmitting ? (
                <>
                  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  Đang cập nhật...
                </>
              ) : (
                <>
                  <CheckIcon className="w-5 h-5" />
                  Cập nhật phòng
                </>
              )}
                  </button>
                </div>
              </form>
            </div>
          </div>
  );
}

// Bed Edit Modal Component
function BedEditModal({ bed, onClose, onSave, isSubmitting }: {
  bed: any;
  onClose: () => void;
  onSave: (data: any) => void;
  isSubmitting: boolean;
}) {
  const [formData, setFormData] = useState({
    bed_number: bed.bed_number,
    bed_type: bed.bed_type,
    status: bed.status
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave(formData);
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-in fade-in duration-300">
      <div className="bg-gradient-to-br from-white via-slate-50 to-indigo-50 rounded-3xl shadow-2xl w-full max-w-md border border-white/20 animate-in zoom-in-95 duration-300">
        {/* Header */}
        <div className="relative p-6 border-b border-gradient-to-r from-indigo-100 to-purple-100">
          <div className="absolute inset-0 bg-gradient-to-r from-indigo-500/5 via-purple-500/5 to-pink-500/5 rounded-t-3xl"></div>
          <div className="relative flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-2xl flex items-center justify-center shadow-lg shadow-indigo-500/25">
                <PencilIcon className="w-6 h-6 text-white" />
              </div>
              <div>
                <h2 className="text-xl font-black text-transparent bg-clip-text bg-gradient-to-r from-indigo-600 to-purple-600">
                  Chỉnh sửa giường
                  </h2>
                <p className="text-sm font-bold text-slate-600">Giường {bed.bed_number}</p>
              </div>
            </div>
                  <button
              onClick={onClose}
              className="p-2 hover:bg-red-50 rounded-xl transition-all duration-300 group"
            >
              <XMarkIcon className="w-5 h-5 text-slate-500 group-hover:text-red-500 transition-colors" />
                  </button>
                </div>
              </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-5">
          {/* Bed Number */}
          <div className="space-y-3">
            <label className="block text-sm font-bold text-slate-700 uppercase tracking-wide">
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 bg-gradient-to-r from-indigo-500 to-purple-500 rounded-full"></div>
                Số giường
              </div>
                    </label>
                    <input
                      type="text"
              value={formData.bed_number}
              onChange={(e) => setFormData({ ...formData, bed_number: e.target.value })}
              className="w-full px-4 py-4 bg-white border-2 border-slate-200 rounded-2xl text-slate-700 font-bold text-center focus:ring-4 focus:ring-indigo-100 focus:border-indigo-500 transition-all duration-300 hover:border-indigo-300 shadow-lg hover:shadow-xl"
                      required
                    />
                  </div>

          {/* Bed Type & Status */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-3">
              <label className="block text-sm font-bold text-slate-700 uppercase tracking-wide">
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 bg-gradient-to-r from-emerald-500 to-green-500 rounded-full"></div>
                  Loại giường
                </div>
                    </label>
              <div className="relative group">
                      <select
              value={formData.bed_type}
              onChange={(e) => setFormData({ ...formData, bed_type: e.target.value })}
              className="w-full px-4 py-4 bg-white border-2 border-slate-200 rounded-2xl text-slate-700 font-semibold focus:ring-4 focus:ring-emerald-100 focus:border-emerald-500 transition-all duration-300 group-hover:border-emerald-300 shadow-lg hover:shadow-xl appearance-none cursor-pointer"
              required
            >
                  <option value="standard">Tiêu chuẩn</option>
                  <option value="electric">Giường điện</option>
                  <option value="hospital">Giường bệnh viện</option>
                    </select>
                <div className="absolute inset-y-0 right-0 flex items-center pr-4 pointer-events-none">
                  <ChevronDownIcon className="w-4 h-4 text-slate-400" />
                  </div>
              </div>
            </div>
            <div className="space-y-3">
              <label className="block text-sm font-bold text-slate-700 uppercase tracking-wide">
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 bg-gradient-to-r from-orange-500 to-amber-500 rounded-full"></div>
                  Trạng thái
                </div>
                    </label>
              <div className="relative group">
                    <select
                  value={formData.status}
                  onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                  className="w-full px-4 py-4 bg-white border-2 border-slate-200 rounded-2xl text-slate-700 font-semibold focus:ring-4 focus:ring-orange-100 focus:border-orange-500 transition-all duration-300 group-hover:border-orange-300 shadow-lg hover:shadow-xl appearance-none cursor-pointer"
                  required
                >
                  <option value="available">Có sẵn</option>
                  <option value="occupied">Đang sử dụng</option>
                  <option value="maintenance">Bảo trì</option>
                    </select>
                <div className="absolute inset-y-0 right-0 flex items-center pr-4 pointer-events-none">
                  <ChevronDownIcon className="w-4 h-4 text-slate-400" />
                  </div>
              </div>
                  </div>
                </div>

          {/* Action Buttons */}
          <div className="flex gap-3 pt-4">
                  <button
                    type="button"
              onClick={onClose}
              className="flex-1 px-5 py-3 bg-gradient-to-r from-slate-100 to-slate-200 hover:from-slate-200 hover:to-slate-300 text-slate-700 font-bold rounded-xl transition-all duration-300 shadow-lg hover:shadow-xl hover:-translate-y-0.5 border border-slate-300"
            >
              <div className="flex items-center justify-center gap-2">
                <XMarkIcon className="w-4 h-4" />
                Hủy
              </div>
                  </button>
                  <button
                    type="submit"
              disabled={isSubmitting}
              className="flex-1 px-5 py-3 bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700 disabled:from-slate-400 disabled:to-slate-500 text-white font-bold rounded-xl transition-all duration-300 shadow-lg hover:shadow-xl hover:-translate-y-0.5 disabled:shadow-none disabled:translate-y-0 flex items-center justify-center gap-2"
            >
              {isSubmitting ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  Đang cập nhật...
                </>
              ) : (
                <>
                  <CheckIcon className="w-4 h-4" />
                  Cập nhật
                </>
              )}
                  </button>
                </div>
              </form>
            </div>
          </div>
  );
}

// Add Bed Modal Component
function AddBedModal({ room, onClose, onSave, isSubmitting, roomTypes, bedsOfRoom }: {
  room: Room;
  onClose: () => void;
  onSave: (data: any) => void;
  isSubmitting: boolean;
  roomTypes: RoomType[];
  bedsOfRoom: (roomId: string) => any[];
}) {
  const [formData, setFormData] = useState({
    bed_number: '',
    bed_type: 'standard'
  });

  // Get room type info to check max beds
  const roomType = roomTypes.find(type => type.room_type === room.room_type);
  const getMaxBedsFromRoomType = (roomType: string): number => {
    switch (roomType) {
      case '2_bed': return 2;
      case '3_bed': return 3;
      case '4_5_bed': return 5;
      case '6_8_bed': return 8;
      default: return 10;
    }
  };
  
  const maxBeds = roomType ? getMaxBedsFromRoomType(room.room_type) : 10;
  const currentBeds = bedsOfRoom(room._id);
  const currentBedCount = currentBeds.length;
  const canAddBed = currentBedCount < maxBeds;

  // Generate suggested bed number
  const getSuggestedBedNumber = () => {
    // This is a simplified version - in real implementation, 
    // we'd need to get existing beds from parent component
    return `${room.room_number}-A`;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!canAddBed) return;
    onSave(formData);
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-in fade-in duration-300">
      <div className="bg-gradient-to-br from-white via-slate-50 to-emerald-50 rounded-3xl shadow-2xl w-full max-w-md border border-white/20 animate-in zoom-in-95 duration-300">
        {/* Header */}
        <div className="relative p-6 border-b border-gradient-to-r from-emerald-100 to-green-100">
          <div className="absolute inset-0 bg-gradient-to-r from-emerald-500/5 via-green-500/5 to-teal-500/5 rounded-t-3xl"></div>
          <div className="relative flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className={`w-12 h-12 rounded-2xl flex items-center justify-center shadow-lg ${
                canAddBed 
                  ? 'bg-gradient-to-br from-emerald-500 to-green-600 shadow-emerald-500/25' 
                  : 'bg-gradient-to-br from-red-500 to-red-600 shadow-red-500/25'
              }`}>
                {canAddBed ? (
                  <PlusIcon className="w-6 h-6 text-white" />
                ) : (
                  <XMarkIcon className="w-6 h-6 text-white" />
                )}
              </div>
              <div>
                <h2 className={`text-xl font-black text-transparent bg-clip-text ${
                  canAddBed 
                    ? 'bg-gradient-to-r from-emerald-600 to-green-600' 
                    : 'bg-gradient-to-r from-red-600 to-red-700'
                }`}>
                  {canAddBed ? 'Thêm giường mới' : 'Không thể thêm giường'}
                </h2>
                <p className="text-sm font-bold text-slate-600">Phòng {room.room_number}</p>
                <p className="text-xs text-slate-500">
                  {currentBedCount}/{maxBeds} giường ({roomType?.type_name || 'Unknown'})
                </p>
              </div>
            </div>
                  <button
              onClick={onClose}
              className="p-2 hover:bg-red-50 rounded-xl transition-all duration-300 group"
            >
              <XMarkIcon className="w-5 h-5 text-slate-500 group-hover:text-red-500 transition-colors" />
                  </button>
                </div>
              </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-5">
          {/* Bed Number */}
          <div className="space-y-3">
            <label className="block text-sm font-bold text-slate-700 uppercase tracking-wide">
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 bg-gradient-to-r from-emerald-500 to-green-500 rounded-full"></div>
                Số giường
                  </div>
                      </label>
                      <input
              type="text"
              value={formData.bed_number}
              onChange={(e) => setFormData({ ...formData, bed_number: e.target.value })}
              placeholder={getSuggestedBedNumber()}
              disabled={!canAddBed}
              className={`w-full px-4 py-4 rounded-2xl font-bold text-center transition-all duration-300 shadow-lg ${
                canAddBed 
                  ? 'bg-white border-2 border-slate-200 text-slate-700 focus:ring-4 focus:ring-emerald-100 focus:border-emerald-500 hover:border-emerald-300 hover:shadow-xl placeholder-slate-400' 
                  : 'bg-slate-100 border-2 border-slate-300 text-slate-400 cursor-not-allowed placeholder-slate-300'
              }`}
                        required
                      />
                    </div>

          {/* Bed Type */}
          <div className="space-y-3">
            <label className="block text-sm font-bold text-slate-700 uppercase tracking-wide">
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 bg-gradient-to-r from-blue-500 to-indigo-500 rounded-full"></div>
                Loại giường
                    </div>
                      </label>
            <div className="relative group">
                      <select
                value={formData.bed_type}
                onChange={(e) => setFormData({ ...formData, bed_type: e.target.value })}
                className="w-full px-4 py-4 bg-white border-2 border-slate-200 rounded-2xl text-slate-700 font-semibold focus:ring-4 focus:ring-blue-100 focus:border-blue-500 transition-all duration-300 group-hover:border-blue-300 shadow-lg hover:shadow-xl appearance-none cursor-pointer"
                required
              >
                <option value="standard">Tiêu chuẩn</option>
                <option value="electric">Giường điện</option>
                <option value="hospital">Giường bệnh viện</option>
                      </select>
              <div className="absolute inset-y-0 right-0 flex items-center pr-4 pointer-events-none">
                <ChevronDownIcon className="w-4 h-4 text-slate-400" />
                    </div>
                    </div>
                  </div>

          {/* Action Buttons */}
          <div className="flex gap-3 pt-4">
                  <button
                    type="button"
              onClick={onClose}
              className="flex-1 px-5 py-3 bg-gradient-to-r from-slate-100 to-slate-200 hover:from-slate-200 hover:to-slate-300 text-slate-700 font-bold rounded-xl transition-all duration-300 shadow-lg hover:shadow-xl hover:-translate-y-0.5 border border-slate-300"
            >
              <div className="flex items-center justify-center gap-2">
                <XMarkIcon className="w-4 h-4" />
                Hủy
              </div>
                  </button>
                  <button
                    type="submit"
              disabled={isSubmitting || !canAddBed}
              className={`flex-1 px-5 py-3 font-bold rounded-xl transition-all duration-300 shadow-lg flex items-center justify-center gap-2 ${
                canAddBed 
                  ? 'bg-gradient-to-r from-emerald-500 to-green-600 hover:from-emerald-600 hover:to-green-700 hover:shadow-xl hover:-translate-y-0.5 text-white' 
                  : 'bg-gradient-to-r from-slate-400 to-slate-500 text-slate-200 cursor-not-allowed'
              } ${isSubmitting ? 'disabled:from-slate-400 disabled:to-slate-500 disabled:shadow-none disabled:translate-y-0' : ''}`}
            >
              {isSubmitting ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  Đang thêm...
                </>
              ) : (
                <>
                  <PlusIcon className="w-4 h-4" />
                  Thêm giường
                </>
              )}
                  </button>
                </div>
              </form>
            </div>
          </div>
  );
}

// Success Modal Component
function SuccessModal({ message, onClose }: { message: string; onClose: () => void }) {
  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-in fade-in duration-300">
      <div className="bg-gradient-to-br from-white via-slate-50 to-green-50 rounded-3xl shadow-2xl w-full max-w-md border border-white/20 animate-in zoom-in-95 duration-300">
        <div className="p-8 text-center">
          <div className="w-20 h-20 bg-gradient-to-br from-green-400 to-emerald-500 rounded-full flex items-center justify-center mx-auto mb-6 shadow-lg shadow-green-500/25 animate-in zoom-in-110 duration-500">
            <CheckIcon className="w-10 h-10 text-white" />
          </div>
          <h3 className="text-2xl font-black text-transparent bg-clip-text bg-gradient-to-r from-green-600 to-emerald-600 mb-3">
            Thành công!
          </h3>
          <p className="text-slate-600 mb-8 font-semibold text-lg leading-relaxed">{message}</p>
          <button
            onClick={onClose}
            className="px-8 py-4 bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white font-bold rounded-2xl transition-all duration-300 shadow-lg hover:shadow-xl hover:-translate-y-0.5 flex items-center gap-2 mx-auto"
          >
            <CheckIcon className="w-5 h-5" />
            Đóng
          </button>
        </div>
      </div>
    </div>
  );
}