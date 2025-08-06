import { useState } from 'react';
import {
  MagnifyingGlassIcon,
  XMarkIcon,
  CheckIcon,
  ExclamationTriangleIcon,
} from '@heroicons/react/24/outline';

interface Resident {
  _id: string;
  full_name: string;
  date_of_birth?: string;
  room_number?: string;
  bed_id?: {
    room_id?: {
      room_number?: string;
    };
  };
}

interface Assignment {
  _id: string;
  resident_id: Resident;
  assigned_date: string;
  end_date?: string;
  status: string;
  notes?: string;
}

interface ResidentAssignmentListProps {
  assignments: Assignment[];
  onEdit: (assignment: Assignment) => void;
  onDelete: (assignment: Assignment) => void;
}

export default function ResidentAssignmentList({
  assignments,
  onEdit,
  onDelete,
}: ResidentAssignmentListProps) {
  const [searchTerm, setSearchTerm] = useState('');

  // Filter assignments
  const filteredAssignments = assignments.filter((assignment) => {
    return assignment.resident_id.full_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (assignment.resident_id.bed_id?.room_id?.room_number && assignment.resident_id.bed_id.room_id.room_number.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (assignment.resident_id.room_number && assignment.resident_id.room_number.toLowerCase().includes(searchTerm.toLowerCase()));
  });

  // Get status badge
  const getStatusBadge = (status: string) => {
    return <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
      <CheckIcon className="w-3 h-3 mr-1" />
      Đang hoạt động
    </span>;
  };

  // Format date
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('vi-VN');
  };

  // Calculate age
  const calculateAge = (dateOfBirth: string) => {
    return new Date().getFullYear() - new Date(dateOfBirth).getFullYear();
  };

  return (
    <div className="space-y-6">
      {/* Search and Filter */}
      <div className="flex flex-col md:flex-row gap-4">
        <div className="flex-1">
          <div className="relative">
            <MagnifyingGlassIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
            <input
              type="text"
              placeholder="Tìm kiếm theo tên cư dân hoặc số phòng..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
        </div>
      </div>

      {/* Results Count */}
      <div className="flex items-center justify-between">
        <p className="text-sm text-gray-600">
          Hiển thị {filteredAssignments.length} trong tổng số {assignments.length} phân công
        </p>
        {searchTerm && (
          <button
            onClick={() => setSearchTerm('')}
            className="text-sm text-gray-500 hover:text-gray-700 flex items-center"
          >
            <XMarkIcon className="w-4 h-4 mr-1" />
            Xóa tìm kiếm
          </button>
        )}
      </div>

      {/* Assignments Grid */}
      {filteredAssignments.length === 0 ? (
        <div className="text-center py-12 bg-gray-50 rounded-lg">
          <div className="text-gray-500">
            <p className="text-lg font-medium">Không tìm thấy phân công nào</p>
            <p className="text-sm">Thử thay đổi từ khóa tìm kiếm</p>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredAssignments.map((assignment) => (
            <div
              key={assignment._id}
              className="bg-white rounded-lg shadow-sm border hover:shadow-md transition-shadow"
            >
              {/* Resident Info */}
              <div className="p-6 border-b border-gray-100">
                <div className="flex items-center justify-between">
                  <div className="flex items-center">
                    <div className="h-12 w-12 rounded-full bg-green-100 flex items-center justify-center">
                      <span className="text-lg font-semibold text-green-800">
                        {assignment.resident_id.full_name.charAt(0)}
                      </span>
                    </div>
                    <div className="ml-4">
                      <h3 className="text-lg font-semibold text-gray-900">
                        {assignment.resident_id.full_name}
                      </h3>
                      <div className="text-sm text-gray-500 space-y-1">
                        {assignment.resident_id.date_of_birth && (
                          <p>{calculateAge(assignment.resident_id.date_of_birth)} tuổi</p>
                        )}
                        {assignment.resident_id.bed_id?.room_id?.room_number || assignment.resident_id.room_number && (
                          <p>Phòng {assignment.resident_id.bed_id?.room_id?.room_number || assignment.resident_id.room_number}</p>
                        )}
                      </div>
                    </div>
                  </div>
                  <div className="text-right">
                    {getStatusBadge(assignment.status)}
                  </div>
                </div>
              </div>

              {/* Assignment Details */}
              <div className="p-4">
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-500">Ngày phân công:</span>
                    <span className="font-medium">{formatDate(assignment.assigned_date)}</span>
                  </div>
                  {assignment.end_date && (
                    <div className="flex justify-between">
                      <span className="text-gray-500">Kết thúc:</span>
                      <span className="font-medium">{formatDate(assignment.end_date)}</span>
                    </div>
                  )}
                  {assignment.notes && (
                    <div className="pt-2 border-t border-gray-100">
                      <p className="text-gray-500 text-xs">Ghi chú:</p>
                      <p className="text-sm text-gray-700 mt-1">{assignment.notes}</p>
                    </div>
                  )}
                </div>

                {/* Actions */}
                <div className="mt-4 pt-4 border-t border-gray-100">
                  <div className="flex space-x-2">
                    <button
                      onClick={() => onEdit(assignment)}
                      className="flex-1 bg-blue-50 text-blue-600 px-3 py-2 rounded-lg text-sm font-medium hover:bg-blue-100 transition-colors"
                    >
                      Chỉnh sửa
                    </button>
                    <button
                      onClick={() => onDelete(assignment)}
                      className="flex-1 bg-red-50 text-red-600 px-3 py-2 rounded-lg text-sm font-medium hover:bg-red-100 transition-colors"
                    >
                      Xóa
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
} 