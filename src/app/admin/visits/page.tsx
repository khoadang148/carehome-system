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
import { format, isToday, isYesterday, isTomorrow, isAfter, isBefore, startOfDay } from 'date-fns';
import { vi } from 'date-fns/locale';
import { visitsAPI, userAPI } from '@/lib/api';
import { getAvatarUrlWithFallback } from '@/lib/utils/avatarUtils';

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

  useEffect(() => {
    loadVisits();
  }, []);

  const filteredVisits = useMemo(() => {
    let filtered = visits;

    if (searchTerm) {
      filtered = filtered.filter(visit =>
        visit.family_member_id?.full_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        visit.purpose.toLowerCase().includes(searchTerm.toLowerCase()) ||
        visit.residents_name.some(name => name.toLowerCase().includes(searchTerm.toLowerCase()))
      );
    }

    if (timeStatusFilter !== 'all') {
      filtered = filtered.filter(visit => {
        const timeStatus = getTimeBasedStatus(visit);
        return timeStatus === timeStatusFilter;
      });
    }

    if (dateFilter) {
      const filterDate = format(dateFilter, 'yyyy-MM-dd');
      filtered = filtered.filter(visit => {
        const visitDate = format(new Date(visit.visit_date), 'yyyy-MM-dd');
        return visitDate === filterDate;
      });
    }

    filtered.sort((a, b) => {
      const dateA = new Date(a.visit_date);
      const dateB = new Date(b.visit_date);
      if (dateA.getTime() !== dateB.getTime()) {
        return dateB.getTime() - dateA.getTime();
      }
      const createdA = new Date(a.created_at || a.visit_date);
      const createdB = new Date(b.created_at || b.visit_date);
      return createdB.getTime() - createdA.getTime();
    });

    return filtered;
  }, [visits, searchTerm, timeStatusFilter, dateFilter]);

  const currentVisits = useMemo(() => {
    const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
    const endIndex = startIndex + ITEMS_PER_PAGE;
    return filteredVisits.slice(startIndex, endIndex);
  }, [filteredVisits, currentPage]);

  const loadVisits = async () => {
    setLoading(true);
    try {
      const data = await visitsAPI.getAll();
      let visitsWithFullData = Array.isArray(data) ? data : [];

      const visitsNeedingFamilyData = visitsWithFullData.filter(visit => {
        if (!visit.family_member_id) return false;

        return true;
      });

      if (visitsNeedingFamilyData.length > 0) {
        const familyMemberPromises = visitsNeedingFamilyData.map(async (visit) => {
          try {
            let familyMemberId;

            if (typeof visit.family_member_id === 'string') {
              familyMemberId = visit.family_member_id;
            } else if (visit.family_member_id && visit.family_member_id._id) {
              familyMemberId = visit.family_member_id._id;
            } else {
              return { visitId: visit._id, familyData: null };
            }

            if (familyMemberId) {
              const familyData = await userAPI.getById(familyMemberId);
              return { visitId: visit._id, familyData };
            }
          } catch (error) {
            return { visitId: visit._id, familyData: null };
          }
        });

        const results = await Promise.all(familyMemberPromises);

        results.forEach((result) => {
          if (result && result.familyData) {
            const visit = visitsWithFullData.find(v => v._id === result.visitId);
            if (visit) {
              visit.family_member_id = result.familyData;
            }
          }
        });
      }

      setVisits(visitsWithFullData);
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
        icon: CheckCircleIcon
      },
      today: {
        label: 'Trạng thái: Hôm nay',
        color: 'text-amber-600',
        bg: 'bg-amber-50',
        border: 'border-amber-200',
        icon: CalendarDaysIcon
      },
      upcoming: {
        label: 'Trạng thái: Sắp tới',
        color: 'text-blue-600',
        bg: 'bg-blue-50',
        border: 'border-blue-200',
        icon: ClockIcon
      }
    };
    return configs[timeStatus] || configs.upcoming;
  };



  const totalPages = Math.ceil(filteredVisits.length / ITEMS_PER_PAGE);
  const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
  const endIndex = startIndex + ITEMS_PER_PAGE;

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
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-200 p-6">
      <div className="max-w-6xl mx-auto">
        <button
          onClick={() => router.push('/')}
          className="flex items-center gap-2 px-3 py-2 bg-white text-gray-700 border border-gray-300 rounded-lg text-sm font-medium cursor-pointer mb-3 shadow-sm hover:bg-gray-50 transition-colors"
        >
          <ArrowLeftIcon className="w-4 h-4" />
          Quay lại
        </button>

        <div className="bg-white rounded-2xl p-6 mb-6 shadow-xl shadow-gray-500/10 border border-gray-100 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-64 h-64 bg-gradient-to-br from-amber-400/5 to-orange-500/5 rounded-full blur-3xl"></div>
          <div className="absolute bottom-0 left-0 w-48 h-48 bg-gradient-to-tr from-blue-400/5 to-indigo-500/5 rounded-full blur-3xl"></div>

          <div className="flex justify-between items-center relative z-10">
            <div>
              <div className="flex items-center gap-4">
                <div className="bg-gradient-to-br from-amber-500 via-orange-500 to-red-500 rounded-2xl p-4 flex items-center justify-center shadow-xl shadow-amber-500/40 relative overflow-hidden group">
                  <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent transform -skew-x-12 -translate-x-full group-hover:translate-x-full transition-transform duration-1000"></div>
                  <CalendarDaysIconSolid className="w-8 h-8 text-white relative z-10" />
                </div>
                <div>
                  <h1 className="text-3xl font-black bg-gradient-to-r from-amber-600 via-orange-600 to-red-600 bg-clip-text text-transparent mb-2 tracking-tight">
                    Quản Lý Lịch Thăm
                  </h1>
                  <p className="text-base text-gray-600 font-medium leading-relaxed">
                    Theo dõi và quản lý các lịch hẹn thăm viếng của gia đình
                  </p>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-4 bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 p-4 rounded-xl border border-blue-200/50 shadow-lg shadow-blue-500/20 relative overflow-hidden">
              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent transform -skew-x-12 -translate-x-full animate-pulse"></div>
              <div className="text-center relative z-10">
                <div className="text-sm font-semibold text-blue-700 mb-1">
                  Tổng lịch thăm
                </div>
                <div className="text-2xl font-black text-blue-800">
                  {filteredVisits.length}
                </div>
                {totalPages > 1 && (
                  <div className="text-xs text-blue-600 mt-1 font-medium">
                    Trang {currentPage}/{totalPages}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        <div className="bg-gradient-to-br from-white via-slate-50/50 to-gray-50/50 rounded-2xl p-6 mb-6 shadow-lg shadow-gray-500/10 border border-white/50 backdrop-blur-sm relative z-10">
          <div className="flex items-end gap-4">
            <div className="flex-1">
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Tìm kiếm
              </label>
              <div className="relative group">
                <MagnifyingGlassIcon className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400 group-focus-within:text-amber-500 transition-colors duration-200" />
                <input
                  type="text"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder="Tìm theo tên người thăm, mục đích, người được thăm..."
                  className="w-full pl-12 pr-4 py-3 border-2 border-gray-200 rounded-xl text-base outline-none focus:ring-4 focus:ring-amber-500/20 focus:border-amber-500 transition-all duration-300 bg-white/80 backdrop-blur-sm shadow-md shadow-gray-500/5"
                />
              </div>
            </div>

            <div className="w-40">
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Trạng thái thời gian
              </label>
              <select
                value={timeStatusFilter}
                onChange={(e) => setTimeStatusFilter(e.target.value)}
                className="w-full px-3 py-3 border-2 border-gray-200 rounded-xl text-sm outline-none focus:ring-4 focus:ring-amber-500/20 focus:border-amber-500 transition-all duration-300 bg-white shadow-md shadow-gray-500/5"
              >
                <option value="all">Tất cả</option>
                <option value="past">Đã qua</option>
                <option value="today">Hôm nay</option>
                <option value="upcoming">Sắp tới</option>
              </select>
            </div>

            <div className="w-40">
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Lọc theo ngày
              </label>
              <DatePicker
                selected={dateFilter}
                onChange={(date) => setDateFilter(date)}
                placeholderText="Chọn ngày..."
                dateFormat="dd/MM/yyyy"
                locale={vi}
                isClearable
                popperClassName="z-50"
                popperPlacement="bottom-start"
                customInput={
                  <input className="w-full px-3 py-3 border-2 border-gray-200 rounded-xl text-sm outline-none focus:ring-4 focus:ring-amber-500/20 focus:border-amber-500 transition-all duration-300 bg-white shadow-md shadow-gray-500/5" />
                }
              />
            </div>

            <div className="flex-shrink-0">
              <button
                onClick={() => {
                  setSearchTerm('');
                  setTimeStatusFilter('all');
                  setDateFilter(null);
                }}
                title="Xóa tất cả bộ lọc"
                className="p-3 bg-white text-gray-500 border border-gray-300 rounded-xl cursor-pointer flex items-center justify-center transition-all hover:bg-gray-50 hover:text-gray-700 shadow-md shadow-gray-500/5"
              >
                <FunnelIcon className="w-5 h-5" />
              </button>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl overflow-hidden shadow-md">
          <div className="p-4 border-b border-gray-200 bg-gray-50 flex justify-between items-center">
            <h2 className="text-xl font-bold text-indigo-600 m-0 flex items-center gap-2">
              Danh sách lịch thăm
            </h2>
            {totalPages > 1 && (
              <div className="text-sm text-gray-500">
                Hiển thị {startIndex + 1}-{Math.min(endIndex, filteredVisits.length)} trong tổng số {filteredVisits.length} lịch thăm
              </div>
            )}
          </div>

          {filteredVisits.length === 0 ? (
            <div className="p-16 text-center relative overflow-hidden">
              <div className="absolute inset-0 bg-gradient-to-br from-blue-50/50 via-indigo-50/30 to-purple-50/50 rounded-3xl"></div>
              <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-64 h-64 bg-gradient-to-br from-blue-400/10 to-purple-400/10 rounded-full blur-3xl"></div>

              <div className="relative z-10">
                <div className="w-24 h-24 bg-gradient-to-br from-amber-500 to-orange-500 rounded-3xl flex items-center justify-center mx-auto mb-6 shadow-2xl shadow-amber-500/30">
                  <CalendarDaysIcon className="w-12 h-12 text-white" />
                </div>
                <h3 className="text-2xl font-bold text-gray-800 mb-3">
                  {searchTerm || timeStatusFilter !== 'all' || dateFilter ? '🔍 Không tìm thấy lịch thăm nào' : '📅 Chưa có lịch thăm nào'}
                </h3>
                <p className="text-lg text-gray-600 font-medium leading-relaxed max-w-md mx-auto">
                  {searchTerm || timeStatusFilter !== 'all' || dateFilter
                    ? 'Thử thay đổi bộ lọc hoặc từ khóa tìm kiếm để xem thêm kết quả'
                    : 'Các lịch hẹn thăm viếng sẽ được hiển thị tại đây khi có dữ liệu'
                  }
                </p>
              </div>
            </div>
          ) : (
            <>
              <div className="p-3">
                <div className="grid gap-3">
                  {currentVisits.map((visit, index) => {
                    const statusConfig = getStatusConfig(visit);
                    const StatusIcon = statusConfig.icon;

                    const cardColors = [
                      'from-blue-50 via-indigo-50/50 to-purple-50/30 border-blue-200/50',
                      'from-emerald-50 via-teal-50/50 to-cyan-50/30 border-emerald-200/50',
                      'from-amber-50 via-orange-50/50 to-red-50/30 border-amber-200/50',
                      'from-rose-50 via-pink-50/50 to-purple-50/30 border-rose-200/50',
                      'from-violet-50 via-purple-50/50 to-indigo-50/30 border-violet-200/50',
                      'from-sky-50 via-blue-50/50 to-cyan-50/30 border-sky-200/50'
                    ];

                    const cardColor = cardColors[index % cardColors.length];

                    return (
                      <div
                        key={visit._id}
                        className={`bg-gradient-to-br ${cardColor} rounded-2xl p-6 transition-all duration-500 cursor-pointer hover:shadow-xl hover:-translate-y-1 hover:scale-[1.01] group relative overflow-hidden backdrop-blur-sm border`}
                      >
                        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent transform -skew-x-12 -translate-x-full group-hover:translate-x-full transition-transform duration-1000"></div>

                        <div className="flex justify-between items-start mb-4 relative z-10">
                          <div className="flex-1">
                            <div className="flex items-center gap-3 mb-2">
                              <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-blue-500 via-indigo-500 to-purple-600 flex items-center justify-center text-white text-base font-bold shadow-lg shadow-blue-500/30 relative overflow-hidden group-hover:shadow-xl group-hover:shadow-blue-500/50 transition-all duration-300">
                                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent transform -skew-x-12 -translate-x-full group-hover:translate-x-full transition-transform duration-700"></div>
                                {visit.family_member_id?.avatar ? (
                                  <img
                                    src={userAPI.getAvatarUrl(visit.family_member_id.avatar)}
                                    alt={visit.family_member_id.full_name || 'Family Member'}
                                    className="w-full h-full rounded-xl object-cover relative z-10"
                                    onError={(e) => {
                                      e.currentTarget.style.display = 'none';
                                      e.currentTarget.nextElementSibling?.classList.remove('hidden');
                                    }}
                                  />
                                ) : (
                                  <img
                                    src="/default-avatar.svg"
                                    alt="Default Avatar"
                                    className="w-full h-full rounded-xl object-cover relative z-10"
                                  />
                                )}
                                <span className="relative z-10 hidden">
                                  {visit.family_member_id?.full_name?.charAt(0) || '?'}
                                </span>
                              </div>
                              <div>
                                <div className="text-xs text-blue-600 font-bold uppercase tracking-wider mb-2 bg-blue-100 px-3 py-1 rounded-full inline-block">
                                  Người đặt lịch
                                </div>
                                <h3 className="text-lg font-bold text-gray-800 mb-2 group-hover:text-blue-600 transition-colors duration-300">
                                  {visit.family_member_id?.full_name}
                                </h3>
                                <p className="text-sm text-gray-600 m-0 flex items-center gap-2 font-medium">
                                  <UsersIcon className="w-4 h-4 text-blue-500" />
                                  Thăm người thân: <span className="font-semibold text-blue-700">{visit.residents_name.join(', ')}</span>
                                </p>
                              </div>
                            </div>
                          </div>

                          <div className="flex items-center gap-4">
                            <span className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-xl text-sm font-bold shadow-md ${statusConfig.bg} ${statusConfig.color} border-2 ${statusConfig.border} transform group-hover:scale-105 transition-all duration-300`}>
                              <StatusIcon className="w-4 h-4" />
                              {statusConfig.label}
                            </span>
                          </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 relative z-10">
                          <div className="flex items-center gap-3 p-3 bg-gradient-to-br from-amber-50 to-orange-50 rounded-xl border-2 border-amber-200 shadow-md shadow-amber-500/10 group-hover:shadow-lg group-hover:shadow-amber-500/20 transition-all duration-300">
                            <div className="w-10 h-10 bg-gradient-to-br from-amber-500 to-orange-500 rounded-lg flex items-center justify-center shadow-md">
                              <CalendarDaysIcon className="w-5 h-5 text-white" />
                            </div>
                            <div>
                              <div className="text-xs text-amber-700 font-bold uppercase tracking-wider mb-1">Ngày & Giờ</div>
                              <div className="text-base font-bold text-gray-800">
                                {format(new Date(visit.visit_date), 'dd/MM/yyyy', { locale: vi })} - {visit.visit_time}
                              </div>
                            </div>
                          </div>

                          <div className="flex items-center gap-3 p-3 bg-gradient-to-br from-blue-50 to-indigo-50 rounded-xl border-2 border-blue-200 shadow-md shadow-blue-500/10 group-hover:shadow-lg group-hover:shadow-blue-500/20 transition-all duration-300">
                            <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-indigo-500 rounded-lg flex items-center justify-center shadow-md">
                              <ClockIcon className="w-5 h-5 text-white" />
                            </div>
                            <div>
                              <div className="text-xs text-blue-700 font-bold uppercase tracking-wider mb-1">Thời gian</div>
                              <div className="text-base font-bold text-gray-800">
                                {visit.duration} phút
                              </div>
                            </div>
                          </div>
                          <div className="flex items-center gap-3 p-3 bg-gradient-to-br from-purple-50 to-pink-50 rounded-xl border-2 border-purple-200 shadow-md shadow-purple-500/10 group-hover:shadow-lg group-hover:shadow-purple-500/20 transition-all duration-300">
                            <div className="w-10 h-10 bg-gradient-to-br from-purple-500 to-pink-500 rounded-lg flex items-center justify-center shadow-md">
                              <DocumentTextIcon className="w-5 h-5 text-white" />
                            </div>
                            <div>
                              <div className="text-xs text-purple-700 font-bold uppercase tracking-wider mb-1">Mục đích</div>
                              <div className="text-base font-bold text-gray-800 truncate">
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
                            className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors ${page === currentPage
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