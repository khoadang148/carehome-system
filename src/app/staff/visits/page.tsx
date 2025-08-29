"use client";

import React, { useState, useEffect, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/contexts/auth-context';
import { 
  CalendarDaysIcon,
  ClockIcon,
  UserGroupIcon,
  CheckCircleIcon,
  ExclamationTriangleIcon,
  FunnelIcon,
  MagnifyingGlassIcon,
  ArrowLeftIcon,
  UsersIcon,
  DocumentTextIcon,
  ChevronLeftIcon,
  ChevronRightIcon
} from '@heroicons/react/24/outline';
import { 
  CalendarDaysIcon as CalendarDaysIconSolid,
  CheckCircleIcon as CheckCircleIconSolid,
  ClockIcon as ClockIconSolid
} from '@heroicons/react/24/solid';
import DatePicker from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';
import { format, isToday, isYesterday, isTomorrow, isAfter, isBefore, startOfDay, addMinutes } from 'date-fns';
import { vi } from 'date-fns/locale';
import { visitsAPI, userAPI, API_BASE_URL } from '@/lib/api';

interface Visit {
  _id: string;
  family_member_id: {
    _id: string;
    full_name: string;
    avatar?: string;
  };
  visit_date: string;
  visit_time: string;
  duration: number;
  status: 'scheduled' | 'completed' | 'cancelled' | 'pending';
  purpose: string;
  numberOfVisitors: number;
  notes?: string;
  residents_name: string[];
  created_at?: string;
  updated_at?: string;
}

const ITEMS_PER_PAGE = 10;

export default function StaffVisitsPage() {
  const router = useRouter();
  const { user } = useAuth();
  const [visits, setVisits] = useState<Visit[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [timeStatusFilter, setTimeStatusFilter] = useState<string>('all');
  const [dateFilter, setDateFilter] = useState<Date | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [expandedNames, setExpandedNames] = useState<Record<string, boolean>>({});

  useEffect(() => {
    loadVisits();
  }, []);

  const loadVisits = async () => {
    setLoading(true);
    try {
      const data = await visitsAPI.getAll();
      setVisits(Array.isArray(data) ? data : []);
    } catch (error) {
      setVisits([]);
    } finally {
      setLoading(false);
    }
  };

  const getTimeBasedStatus = (visit: Visit) => {
    const visitDate = new Date(visit.visit_date);
    const today = startOfDay(new Date());
    const visitDay = startOfDay(visitDate);

    if (isBefore(visitDay, today)) {
      return 'past';
    } else if (isToday(visitDate)) {
      return 'today';
    } else if (isAfter(visitDay, today)) {
      return 'upcoming';
    }
    return 'today';
  };

  const getStatusConfig = (visit: Visit) => {
    const timeStatus = getTimeBasedStatus(visit);
    
    const configs = {
      past: {
        label: 'Trạng thái: Đã qua',
        color: 'text-gray-500',
        bg: 'bg-gray-100',
        border: 'border-gray-300',
        icon: CheckCircleIcon,
        accentBg: 'bg-gray-400'
      },
      today: {
        label: 'Trạng thái: Hôm nay',
        color: 'text-amber-600',
        bg: 'bg-amber-50',
        border: 'border-amber-200',
        icon: CalendarDaysIcon,
        accentBg: 'bg-amber-500'
      },
      upcoming: {
        label: 'Trạng thái: Sắp tới',
        color: 'text-blue-600',
        bg: 'bg-blue-50',
        border: 'border-blue-200',
        icon: ClockIcon,
        accentBg: 'bg-blue-500'
      }
    };
    return configs[timeStatus] || configs.upcoming;
  };

  const getEndTimeString = (visit: Visit): string => {
    try {
      const [hoursStr, minutesStr] = (visit.visit_time || '00:00').split(':');
      const startDate = new Date(visit.visit_date);
      const hours = Number(hoursStr);
      const minutes = Number(minutesStr);
      if (!isNaN(hours) && !isNaN(minutes)) {
        startDate.setHours(hours, minutes, 0, 0);
      }
      const endDate = addMinutes(startDate, Number(visit.duration || 0));
      return format(endDate, 'HH:mm');
    } catch {
      return '';
    }
  };

  const getFamilyAvatarUrl = (family: Visit['family_member_id']): string => {
    try {
      const anyFm: any = family as any;
      const a: any = anyFm?.avatar;
      let rawPath = '' as string;
      if (typeof a === 'string' && a.trim()) {
        rawPath = a;
      } else if (Array.isArray(a) && a.length > 0) {
        const first = a[0];
        if (typeof first === 'string') rawPath = first;
        else if (first && typeof first === 'object') rawPath = first.file_path || first.url || first.path || '';
      } else if (a && typeof a === 'object') {
        rawPath = a.file_path || a.url || a.path || '';
      }

      if (rawPath) return userAPI.getAvatarUrl(rawPath);

      if (family?._id) {
        return `${API_BASE_URL}/family-members/${family._id}/avatar`;
      }
      if (family?._id) {
        return userAPI.getAvatarUrlById(family._id);
      }
      return '';
    } catch {
      return '';
    }
  };

  const FamilyAvatar = ({ family }: { family: Visit['family_member_id'] }) => {
    const [imgError, setImgError] = useState(false);
    const src = getFamilyAvatarUrl(family);
    if (imgError || !src) {
      return (
        <div className="w-10 h-10 rounded-full bg-gray-200 flex items-center justify-center text-gray-500">
          <UsersIcon className="w-5 h-5" />
        </div>
      );
    }
    return (
      <img
        src={src}
        alt={family?.full_name || 'Avatar'}
        className="w-10 h-10 rounded-full object-cover border border-gray-200"
        onError={() => setImgError(true)}
      />
    );
  };

  const filteredVisits = useMemo(() => {
    return visits
      .filter(visit => {
        const matchesSearch = 
          (visit.family_member_id?.full_name?.toLowerCase().includes(searchTerm.toLowerCase()) || false) ||
          visit.purpose.toLowerCase().includes(searchTerm.toLowerCase()) ||
          visit.residents_name.some(name => name.toLowerCase().includes(searchTerm.toLowerCase()));
        
        const matchesTimeStatus = timeStatusFilter === 'all' || getTimeBasedStatus(visit) === timeStatusFilter;
        
        const matchesDate = !dateFilter || 
          new Date(visit.visit_date).toDateString() === dateFilter.toDateString();
        
        return matchesSearch && matchesTimeStatus && matchesDate;
      })
      .sort((a, b) => {
        const dateA = new Date(a.visit_date);
        const dateB = new Date(b.visit_date);
        if (dateA.getTime() !== dateB.getTime()) {
          return dateB.getTime() - dateA.getTime();
        }
        const createdA = new Date(a.created_at || a.visit_date);
        const createdB = new Date(b.created_at || b.visit_date);
        return createdB.getTime() - createdA.getTime();
      });
  }, [visits, searchTerm, timeStatusFilter, dateFilter]);

  const totalPages = Math.ceil(filteredVisits.length / ITEMS_PER_PAGE);
  const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
  const endIndex = startIndex + ITEMS_PER_PAGE;
  const currentVisits = filteredVisits.slice(startIndex, endIndex);

  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, timeStatusFilter, dateFilter]);

  const getPageNumbers = (): (number | string)[] => {
    const pages: (number | string)[] = [];
    const maxVisiblePages = 5;
    
    if (totalPages <= maxVisiblePages) {
      for (let i = 1; i <= totalPages; i++) {
        pages.push(i);
      }
    } else {
      if (currentPage <= 3) {
        for (let i = 1; i <= 4; i++) {
          pages.push(i);
        }
        pages.push('...');
        pages.push(totalPages);
      } else if (currentPage >= totalPages - 2) {
        pages.push(1);
        pages.push('...');
        for (let i = totalPages - 3; i <= totalPages; i++) {
          pages.push(i);
        }
      } else {
        pages.push(1);
        pages.push('...');
        for (let i = currentPage - 1; i <= currentPage + 1; i++) {
          pages.push(i);
        }
        pages.push('...');
        pages.push(totalPages);
      }
    }
    
    return pages;
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-200 flex items-center justify-center">
        <div className="w-12 h-12 border-3 border-gray-200 border-t-amber-500 rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-200 p-8">
      <div className="max-w-7xl mx-auto">

        <div className="bg-white rounded-2xl p-8 mb-8 shadow-lg">
          <div className="flex justify-between items-center">
            <div>
              <div className="flex items-center gap-4">
              <button
              onClick={() => router.back()}
              className="group p-3.5 rounded-full bg-gradient-to-r from-slate-100 to-slate-200 hover:from-red-100 hover:to-orange-100 text-slate-700 hover:text-red-700 hover:shadow-lg hover:shadow-red-200/50 hover:-translate-x-0.5 transition-all duration-300"
              title="Quay lại trang trước"
            >
              <ArrowLeftIcon className="w-5 h-5 group-hover:scale-110 transition-transform duration-200" />
            </button>
                <div className="bg-gradient-to-br from-amber-500 to-amber-600 rounded-2xl p-4 flex items-center justify-center shadow-lg shadow-amber-500/30">
                  <CalendarDaysIconSolid className="w-8 h-8 text-white" />
                </div>
                <div>
                  <h1 className="text-3xl font-bold bg-gradient-to-r from-amber-500 to-amber-600 bg-clip-text text-transparent mb-2">
                    Danh Sách Lịch Thăm
                  </h1>
                  <p className="text-gray-500 m-0">
                    Theo dõi và quản lý các lịch hẹn thăm của gia đình
                  </p>
                </div>
              </div>
            </div>
            
            <div className="flex items-center gap-4 bg-slate-50 p-4 rounded-xl border border-slate-200">
              <div className="text-center">
                <div className="text-sm text-gray-500">
                  Tổng lịch thăm:
                </div>
                <div className="text-2xl font-bold text-gray-800">
                  {filteredVisits.length}
                </div>
                {totalPages > 1 && (
                  <div className="text-xs text-gray-400 mt-1">
                    Trang {currentPage}/{totalPages}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-2xl p-6 mb-8 shadow-lg">
          <div className="grid grid-cols-4 gap-4 items-end">
            <div className="col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Tìm kiếm
              </label>
              <div className="relative">
                <MagnifyingGlassIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  type="text"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder="Tìm theo tên người thăm, mục đích, người được thăm..."
                  className="w-full pl-10 pr-3 py-3 border border-gray-300 rounded-lg text-sm outline-none focus:ring-2 focus:ring-amber-500 focus:border-transparent"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Trạng thái thời gian
              </label>
              <select
                value={timeStatusFilter}
                onChange={(e) => setTimeStatusFilter(e.target.value)}
                className="w-full px-3 py-3 border border-gray-300 rounded-lg text-sm outline-none focus:ring-2 focus:ring-amber-500 focus:border-transparent bg-white"
              >
                <option value="all">Tất cả</option>
                <option value="past">Đã qua</option>
                <option value="today">Hôm nay</option>
                <option value="upcoming">Sắp tới</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Lọc theo ngày
              </label>
              <DatePicker
                selected={dateFilter}
                onChange={(date) => setDateFilter(date)}
                placeholderText="Chọn ngày..."
                dateFormat="dd/MM/yyyy"
                locale={vi}
                isClearable
                customInput={
                  <input className="w-full px-3 py-3 border border-gray-300 rounded-lg text-sm outline-none focus:ring-2 focus:ring-amber-500 focus:border-transparent" />
                }
              />
            </div>
          </div>

          <div className="flex justify-end mt-4">
            <button
              onClick={() => {
                setSearchTerm('');
                setTimeStatusFilter('all');
                setDateFilter(null);
              }}
              title="Xóa tất cả bộ lọc"
              className="p-3 bg-white text-gray-500 border border-gray-300 rounded-lg cursor-pointer flex items-center justify-center transition-all hover:bg-gray-50 hover:text-gray-700"
            >
              <FunnelIcon className="w-4 h-4" />
            </button>
          </div>
        </div>

        <div className="bg-white rounded-2xl overflow-hidden shadow-lg">
          <div className="p-6 border-b border-gray-200 bg-gray-50 flex justify-between items-center">
            <h2 className="text-2xl font-bold text-indigo-600 m-0 flex items-center gap-2">
              Danh sách lịch thăm
            </h2>
            {totalPages > 1 && (
              <div className="text-sm text-gray-500">
                Hiển thị {startIndex + 1}-{Math.min(endIndex, filteredVisits.length)} trong tổng số {filteredVisits.length} lịch thăm
              </div>
            )}
          </div>

          {filteredVisits.length === 0 ? (
            <div className="p-12 text-center text-gray-500">
              <CalendarDaysIcon className="w-12 h-12 mx-auto mb-4 opacity-50" />
              <p className="text-lg font-medium mb-2">
                {searchTerm || timeStatusFilter !== 'all' || dateFilter ? 'Không tìm thấy lịch thăm nào' : 'Chưa có lịch thăm nào'}
              </p>
              <p className="m-0">
                {searchTerm || timeStatusFilter !== 'all' || dateFilter ? 'Thử thay đổi bộ lọc để xem thêm kết quả' : 'Các lịch hẹn thăm viếng sẽ được hiển thị tại đây'}
              </p>
            </div>
          ) : (
            <>
              <div className="p-4">
                <div className="grid gap-3">
                  {currentVisits.map((visit, idx) => {
                    const statusConfig = getStatusConfig(visit);
                    const StatusIcon = statusConfig.icon;
                    
                    return (
                      <div
                        key={visit._id}
                        className={`relative bg_white odd:bg-white even:bg-slate-50 border border-gray-200 rounded-xl p-4 transition-all duration-200 cursor-pointer hover:shadow-md`}
                      >
                        <div className={`absolute left-0 top-0 h-full w-1 ${statusConfig.accentBg} rounded-l-xl`} />
                        <div className="flex justify-between items-start mb-3">
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-1.5">
                              <FamilyAvatar family={visit.family_member_id} />
                              <div>
                                <div className="text-[11px] text-gray-500 font-medium uppercase tracking-wide mb-0.5">
                                  Người đặt lịch
                                </div>
                                <h3 className="text-sm font-semibold text-gray-800 m-0">
                                  {visit.family_member_id?.full_name}
                                </h3>
                                <p className="text-xs text-gray-500 m-0 flex items-center gap-1.5">
                                  <span className="inline-flex items-center gap-1">
                                    <UsersIcon className="w-3 h-3" />
                                    {(() => {
                                      const names = visit.residents_name.join(', ');
                                      const tooLong = names.length > 80;
                                      const isExpanded = !!expandedNames[visit._id];
                                      const display = isExpanded || !tooLong ? names : names.slice(0, 80) + '...';
                                      return (
                                        <>
                                          <span>Thăm người thân: {display}</span>
                                          {tooLong && (
                                            <button
                                              type="button"
                                              onClick={() => setExpandedNames(prev => ({ ...prev, [visit._id]: !isExpanded }))}
                                              className="ml-1 text-[11px] text-amber-600 hover:text-amber-700 underline underline-offset-2"
                                            >
                                              {isExpanded ? 'Thu gọn' : 'Xem thêm'}
                                            </button>
                                          )}
                                        </>
                                      );
                                    })()}
                                  </span>
                                </p>
                              </div>
                            </div>
                          </div>
                          
                          <div className="flex items-center gap-4">
                            <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-medium ${statusConfig.bg} ${statusConfig.color} border ${statusConfig.border}`}>
                              <StatusIcon className="w-3 h-3" />
                              {statusConfig.label}
                            </span>
                          </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                          <div className="flex items-center gap-2 p-2 bg-yellow-50 rounded-lg border border-gray-200">
                            <CalendarDaysIcon className="w-3.5 h-3.5 text-amber-500" />
                            <div>
                              <div className="text-[11px] text-gray-500 font-medium">Ngày & Giờ</div>
                              <div className="text-xs font-semibold text-gray-800">
                                {format(new Date(visit.visit_date), 'dd/MM/yyyy', { locale: vi })} & {visit.visit_time} - {getEndTimeString(visit)}
                              </div>
                            </div>
                          </div>

                          <div className="flex items-center gap-2 p-2 bg-blue-50 rounded-lg border border-gray-200">
                            <ClockIcon className="w-3.5 h-3.5 text-blue-500" />
                            <div>
                              <div className="text-[11px] text-gray-500 font-medium">Thời gian</div>
                              <div className="text-xs font-semibold text-gray-800">
                                {visit.duration} phút
                              </div>
                            </div>
                          </div>

                          <div className="flex items-center gap-2 p-2 bg-red-50 rounded-lg border border-gray-200">
                            <DocumentTextIcon className="w-3.5 h-3.5 text-indigo-500" />
                            <div>
                              <div className="text-[11px] text-gray-500 font-medium">Mục đích</div>
                              <div className="text-xs font-semibold text-gray-800 truncate">
                                {visit.purpose}
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {totalPages > 1 && (
                <div className="px-6 py-4 border-t border-gray-200 bg-gray-50">
                  <div className="flex items-center justify-between">
                    <div className="text-sm text-gray-500">
                      Hiển thị {startIndex + 1}-{Math.min(endIndex, filteredVisits.length)} trong tổng số {filteredVisits.length} lịch thăm
                    </div>
                    
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                        disabled={currentPage === 1}
                        className="p-2 rounded-lg border border-gray-300 bg-white text-gray-500 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                      >
                        <ChevronLeftIcon className="w-4 h-4" />
                      </button>

                      <div className="flex items-center gap-1">
                        {getPageNumbers().map((page, index) => (
                          <button
                            key={index}
                            onClick={() => typeof page === 'number' && setCurrentPage(page)}
                            disabled={page === '...'}
                            className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                              page === currentPage
                                ? 'bg-amber-500 text-white'
                                : page === '...'
                                ? 'text-gray-400 cursor-default'
                                : 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-50'
                            }`}
                          >
                            {page}
                          </button>
                        ))}
                      </div>

                      <button
                        onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                        disabled={currentPage === totalPages}
                        className="p-2 rounded-lg border border-gray-300 bg-white text-gray-500 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                      >
                        <ChevronRightIcon className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
} 