"use client";

import { useState, useEffect, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/contexts/auth-context';
import { DocumentPlusIcon, MagnifyingGlassIcon, FunnelIcon, ArrowsUpDownIcon } from '@heroicons/react/24/outline';
import { carePlansAPI, residentAPI } from '@/lib/api';
import { formatDisplayCurrency } from '@/lib/utils/currencyUtils';

export default function ServicesPage() {
  const router = useRouter();
  const { user } = useAuth();

  const [carePlans, setCarePlans] = useState<any[]>([]);
  const [loadingCarePlans, setLoadingCarePlans] = useState(true);
  const [carePlansError, setCarePlansError] = useState<string | null>(null);

  const [relatives, setRelatives] = useState<any[]>([]);

  // Filtering and sorting state
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [priceSort, setPriceSort] = useState<'none' | 'asc' | 'desc'>('none');

  // Filtered and sorted care plans
  const filteredCarePlans = useMemo(() => {
    let filtered = carePlans.filter((pkg: any) => {
      // Search filter
      const matchesSearch = !searchTerm || 
        pkg.plan_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        pkg.description?.toLowerCase().includes(searchTerm.toLowerCase());

      // Category filter
      const matchesCategory = categoryFilter === 'all' || pkg.category === categoryFilter;

      return matchesSearch && matchesCategory;
    });

    // Sort: Main packages first, then supplementary packages
    filtered.sort((a: any, b: any) => {
      // Ưu tiên gói chính lên đầu
      if (a.category === 'main' && b.category !== 'main') return -1;
      if (a.category !== 'main' && b.category === 'main') return 1;
      
      // Nếu cùng loại, sắp xếp theo giá
      if (priceSort !== 'none') {
        const priceA = a.monthly_price || 0;
        const priceB = b.monthly_price || 0;
        return priceSort === 'asc' ? priceA - priceB : priceB - priceA;
      }
      
      return 0;
    });

    return filtered;
  }, [carePlans, searchTerm, categoryFilter, priceSort]);

  useEffect(() => {
    if (!user) {
      router.push('/login');
      return;
    }

    if (user?.role !== 'family') {
      router.push('/');
      return;
    }
  }, [user, router]);

  useEffect(() => {
    setLoadingCarePlans(true);
    setCarePlansError(null);
    carePlansAPI.getAll()
      .then((data) => {
        setCarePlans(data);
      })
      .catch(() => {
        setCarePlansError('Không thể tải danh sách gói dịch vụ.');
      })
      .finally(() => {
        setLoadingCarePlans(false);
      });
  }, []);

  useEffect(() => {
    if (!user?.id) return;
    residentAPI.getByFamilyMemberId(user.id)
      .then((data) => {
        setRelatives(Array.isArray(data) ? data : []);
      })
      .catch(() => setRelatives([]));
  }, [user]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-500 via-purple-500 to-purple-600">
      <div className="bg-gradient-to-br from-indigo-600/90 to-purple-600/90 text-white py-16 px-4 text-center">
        <div className="max-w-6xl mx-auto">
          <h1 className="text-5xl font-bold mb-4 text-shadow-lg">
            {user?.role === 'family' ? 'Gói Chăm Sóc Cho Người Thân' : 'Gói Dịch Vụ Chăm Sóc'}
          </h1>
          <p className="text-xl opacity-90 max-w-3xl mx-auto leading-relaxed mb-8">
            {user?.role === 'family'
              ? 'Lựa chọn gói chăm sóc phù hợp nhất cho người thân yêu của bạn. Chúng tôi cam kết mang lại sự an tâm và chất lượng chăm sóc tốt nhất.'
              : 'Chọn gói dịch vụ phù hợp để mang lại sự chăm sóc tốt nhất cho người thân của bạn'
            }
          </p>

          <div className="flex gap-4 justify-center flex-wrap mt-8">
            <button
              onClick={() => router.push('/family/services/terms')}
              className="inline-flex items-center gap-3 px-8 py-4 bg-white/20 text-white border-2 border-white/30 rounded-full text-base font-semibold cursor-pointer transition-all duration-300 backdrop-blur-md shadow-lg hover:bg-white/25 hover:-translate-y-0.5 hover:shadow-xl"
            >
              Điều Khoản & Quy Định
            </button>

            <button
              onClick={() => {
                if (relatives.length > 0) {
                  router.push(`/family/services/${relatives[0]._id}`);
                }
              }}
              className="inline-flex items-center gap-3 px-8 py-4 bg-white/20 text-white border-2 border-white/30 rounded-full text-base font-semibold cursor-pointer transition-all duration-300 backdrop-blur-md shadow-lg hover:bg-white/25 hover:-translate-y-0.5 hover:shadow-xl"
            >
              Xem gói dịch vụ đã đăng ký
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-8 py-16 -mt-8">
        {user?.role === 'family' && (
          <div className="bg-gradient-to-br from-blue-50 to-cyan-50 border border-blue-500 rounded-xl p-6 mb-8 text-center">
            <div className="flex items-center justify-center gap-2 mb-2">
              <svg className="w-5 h-5 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <span className="font-semibold text-blue-900">Thông báo</span>
            </div>
            <p className="text-blue-900 text-sm leading-relaxed">
              Bạn có thể xem thông tin các gói dịch vụ hiện có. Để đăng ký gói dịch vụ mới, vui lòng liên hệ nhân viên chăm sóc hoặc sử dụng nút "Xem gói dịch vụ đã đăng ký" để kiểm tra tình trạng hiện tại.
            </p>
          </div>
        )}

        {/* Filtering and Sorting Section */}
        <div className="bg-gradient-to-br from-white to-slate-50 rounded-2xl shadow-xl border border-white/20 p-6 mb-8">
          <h3 className="text-xl font-bold text-gray-800 mb-6 text-center flex items-center justify-center gap-3">
            <FunnelIcon className="w-6 h-6 text-indigo-600" />
            Tìm kiếm & Lọc gói dịch vụ
          </h3>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
            {/* Search Input */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2 flex items-center gap-2">
                <MagnifyingGlassIcon className="w-4 h-4 text-indigo-600" />
                Tìm kiếm:
              </label>
              <input
                type="text"
                placeholder="Tìm theo tên gói hoặc mô tả..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full px-4 py-3 rounded-xl border-2 border-indigo-200 bg-white text-gray-700 placeholder-gray-400 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 transition-all duration-200"
              />
            </div>

            {/* Category Filter */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2 flex items-center gap-2">
                <FunnelIcon className="w-4 h-4 text-indigo-600" />
                Loại gói:
              </label>
              <select
                value={categoryFilter}
                onChange={(e) => setCategoryFilter(e.target.value)}
                className="w-full px-4 py-3 rounded-xl border-2 border-indigo-200 bg-white text-gray-700 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 transition-all duration-200 cursor-pointer"
              >
                <option value="all">Tất cả gói</option>
                <option value="main">Gói chính</option>
                <option value="supplementary">Gói bổ sung</option>
              </select>
            </div>

            {/* Price Sort */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2 flex items-center gap-2">
                <ArrowsUpDownIcon className="w-4 h-4 text-indigo-600" />
                Sắp xếp theo giá:
              </label>
              <select
                value={priceSort}
                onChange={(e) => setPriceSort(e.target.value as 'none' | 'asc' | 'desc')}
                className="w-full px-4 py-3 rounded-xl border-2 border-indigo-200 bg-white text-gray-700 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 transition-all duration-200 cursor-pointer"
              >
                <option value="none">Không sắp xếp</option>
                <option value="asc">Giá tăng dần</option>
                <option value="desc">Giá giảm dần</option>
              </select>
            </div>
          </div>

          {/* Clear Filters Button */}
          {(searchTerm || categoryFilter !== 'all' || priceSort !== 'none') && (
            <div className="text-center">
              <button
                onClick={() => {
                  setSearchTerm('');
                  setCategoryFilter('all');
                  setPriceSort('none');
                }}
                className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-red-500 to-red-600 text-white border-2 border-red-500 rounded-xl font-semibold cursor-pointer transition-all duration-200 hover:from-red-600 hover:to-red-700 hover:-translate-y-1 hover:shadow-lg"
              >
                <FunnelIcon className="w-4 h-4" />
                Xóa bộ lọc
              </button>
            </div>
          )}

          {/* Results Count */}
          <div className="text-center mt-6 p-4 bg-gradient-to-br from-indigo-50 to-blue-50 rounded-xl border border-indigo-200">
            <span className="text-sm text-indigo-700 font-semibold">
              Hiển thị {filteredCarePlans.length} / {carePlans.length} gói dịch vụ
            </span>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-8">
          {loadingCarePlans ? (
            <div className="col-span-full text-center py-16">
              <div className="inline-flex flex-col items-center gap-6 bg-white/90 rounded-2xl p-12 shadow-2xl backdrop-blur-md border border-white/20">
                <div className="w-16 h-16 border-4 border-gray-200 border-t-indigo-500 rounded-full animate-spin" />
                <div className="text-xl text-gray-700 font-semibold">
                  Đang tải danh sách gói dịch vụ...
                </div>
                <div className="text-gray-500 text-sm">
                  Vui lòng chờ trong giây lát
                </div>
              </div>
            </div>
          ) : carePlansError ? (
            <div className="col-span-full text-center py-16">
              <div className="inline-flex flex-col items-center gap-6 bg-gradient-to-br from-red-50 to-red-100 border-2 border-red-200 rounded-2xl p-12 shadow-2xl max-w-lg">
                <div className="w-16 h-16 bg-gradient-to-br from-red-500 to-red-600 rounded-full flex items-center justify-center shadow-lg">
                  <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
                  </svg>
                </div>
                <div className="text-xl text-red-700 font-bold">
                  {carePlansError}
                </div>
                <div className="text-red-600 text-sm text-center">
                  Vui lòng thử lại sau hoặc liên hệ hỗ trợ
                </div>
              </div>
            </div>
          ) : filteredCarePlans.length === 0 ? (
            <div className="col-span-full text-center py-16">
              <div className="inline-flex flex-col items-center gap-6 bg-gradient-to-br from-blue-50 to-cyan-50 border-2 border-blue-200 rounded-2xl p-12 shadow-2xl max-w-lg">
                <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-blue-600 rounded-full flex items-center justify-center shadow-lg">
                  <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
                  </svg>
                </div>
                <div className="text-xl text-blue-900 font-bold">
                  {searchTerm || categoryFilter !== 'all' || priceSort !== 'none' 
                    ? 'Không tìm thấy gói dịch vụ phù hợp' 
                    : 'Không có gói dịch vụ nào'
                  }
                </div>
                <div className="text-blue-700 text-sm text-center">
                  {searchTerm || categoryFilter !== 'all' || priceSort !== 'none'
                    ? 'Thử thay đổi bộ lọc để xem thêm kết quả'
                    : 'Vui lòng liên hệ quản trị viên để thêm gói dịch vụ mới'
                  }
                </div>
              </div>
            </div>
          ) : filteredCarePlans.map((pkg: any) => (
            <div
              key={pkg._id}
              className={`bg-gradient-to-br from-white to-gray-50 rounded-3xl shadow-lg border-2 p-8 max-w-full flex flex-col items-stretch font-sans transition-all duration-300 relative overflow-hidden backdrop-blur-md min-h-[600px] cursor-default ${pkg.category === 'main'
                  ? 'border-red-500'
                  : 'border-gray-200/80'
                }`}
            >
              <div className={`absolute -top-12 -right-12 w-36 h-36 rounded-full z-0 ${pkg.category === 'main'
                  ? 'bg-gradient-to-br from-red-500/10 to-red-600/5'
                  : 'bg-gradient-to-br from-blue-500/10 to-blue-600/5'
                }`} />

              <div className={`absolute top-0 left-0 right-0 h-1 rounded-t-3xl ${pkg.category === 'main'
                  ? 'bg-gradient-to-r from-red-500 to-red-600'
                  : 'bg-gradient-to-r from-blue-500 to-blue-600'
                }`} />

              <div className="flex items-start gap-4 mb-6 pt-2 relative z-10">
                <div className={`w-14 h-14 rounded-2xl flex items-center justify-center shadow-lg relative ${pkg.category === 'main'
                    ? 'bg-gradient-to-br from-red-500 to-red-600'
                    : 'bg-gradient-to-br from-blue-500 to-blue-600'
                  }`}>
                  <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <div className="absolute top-0.5 left-0.5 w-5 h-5 bg-white/30 rounded-full blur-sm" />
                </div>
                <div className="flex-1">
                  <h2 className="text-2xl font-bold text-gray-800 mb-1 leading-tight">
                    {pkg.plan_name}
                  </h2>
                  <div className="text-sm text-gray-500 font-medium flex items-center gap-2">
                    <div className={`w-1.5 h-1.5 rounded-full ${pkg.category === 'main' ? 'bg-red-500' : 'bg-blue-500'
                      }`} />
                    {pkg.category === 'main' ? 'Gói dịch vụ chính' : 'Gói dịch vụ bổ sung'}
                  </div>
                </div>
              </div>

              <div className={`rounded-2xl p-4 mb-5 text-center relative overflow-hidden ${pkg.category === 'main'
                  ? 'bg-gradient-to-br from-red-50 to-red-100 border border-red-200'
                  : 'bg-gradient-to-br from-blue-50 to-blue-100 border border-blue-200'
                }`}>

                <div className={`absolute -top-4 -right-4 w-15 h-15 rounded-full ${pkg.category === 'main'
                    ? 'bg-red-500/8'
                    : 'bg-blue-500/8'
                  }`} />

                <div className={`text-xs font-semibold mb-2 uppercase tracking-wider relative z-10 ${pkg.category === 'main' ? 'text-red-800' : 'text-blue-800'
                  }`}>
                  Giá hàng tháng
                </div>
                <div className={`text-3xl font-extrabold leading-none mb-0.5 relative z-10 ${pkg.category === 'main' ? 'text-red-600' : 'text-blue-700'
                  }`}>
                  {formatDisplayCurrency(pkg.monthly_price)}
                  <span className="text-base font-semibold ml-1">đ</span>
                </div>
                <div className={`text-sm font-medium relative z-10 ${pkg.category === 'main' ? 'text-red-700' : 'text-blue-600'
                  }`}>
                  Thanh toán hàng tháng
                </div>
              </div>

              <div className="text-sm text-gray-600 leading-relaxed mb-6 p-4 bg-gray-50/80 rounded-xl border border-gray-200/50">
                {pkg.description}
              </div>

              <div className="flex-1 mb-6">
                <div className="font-bold text-gray-800 mb-3 text-sm flex items-center gap-2 p-2 bg-gradient-to-br from-blue-50 to-cyan-50 rounded-lg border border-blue-200">
                  Dịch vụ bao gồm:
                </div>
                <div className="grid gap-2">
                  {pkg.services_included?.map((feature: string, i: number) => (
                    <div key={i} className="flex items-center gap-2 p-2 bg-gray-50/80 rounded-lg border border-gray-200 transition-all duration-200 hover:translate-x-1 hover:bg-blue-50/90 hover:border-blue-200">
                      <div className="w-4 h-4 bg-gradient-to-br from-green-500 to-green-600 rounded-full flex items-center justify-center flex-shrink-0 shadow-sm">
                        <svg className="w-2 h-2 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                        </svg>
                      </div>
                      <span className="text-gray-700 font-medium text-sm leading-relaxed">
                        {feature}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              {pkg.category === 'main' ? (
                <div className="absolute top-2 right-3 bg-gradient-to-r from-red-500 to-red-600 text-white px-3 py-1.5 rounded-full text-xs font-bold shadow-lg z-10 border-2 border-white uppercase tracking-wide max-w-24 text-center leading-tight truncate">
                  Gói chính
                </div>
              ) : (
                <div className="absolute top-2 right-4 bg-gradient-to-r from-amber-500 to-amber-600 text-white px-3 py-1.5 rounded-full text-xs font-bold shadow-lg z-10 border-2 border-white uppercase tracking-wide max-w-36 text-center leading-tight truncate">
                  Gói bổ sung
                </div>
              )}
            </div>
          ))}
        </div>

        <div className="mt-16 text-center p-12 bg-gradient-to-br from-white/95 to-gray-50/95 rounded-3xl backdrop-blur-xl border border-white/20 shadow-2xl relative overflow-hidden">
          <div className="absolute -top-24 -left-24 w-48 h-48 bg-gradient-to-br from-indigo-500/10 to-transparent rounded-full" />
          <div className="absolute -bottom-20 -right-20 w-40 h-40 bg-gradient-to-br from-purple-500/10 to-transparent rounded-full" />

          <div className="relative z-10">
            <h3 className="text-4xl font-bold text-gray-800 mb-4 bg-gradient-to-r from-indigo-500 to-purple-600 bg-clip-text text-transparent">
              Tại sao chọn chúng tôi?
            </h3>
            <p className="text-lg text-gray-600 mb-12 max-w-2xl mx-auto leading-relaxed">
              Chúng tôi cam kết mang lại dịch vụ chăm sóc chất lượng cao nhất với đội ngũ chuyên gia giàu kinh nghiệm
            </p>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-10 mt-8">
              <div className="text-center p-8 bg-gradient-to-br from-white/80 to-gray-50/80 rounded-2xl border border-white/30 transition-all duration-300 cursor-pointer hover:-translate-y-2 hover:shadow-xl">
                <div className="w-20 h-20 bg-gradient-to-br from-amber-400 to-amber-500 rounded-full mx-auto mb-6 flex items-center justify-center shadow-lg relative">
                  <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
                  </svg>
                  <div className="absolute top-2 left-2 w-5 h-5 bg-white/30 rounded-full blur-sm" />
                </div>
                <h4 className="font-bold mb-3 text-gray-800 text-xl">
                  Chất lượng cao
                </h4>
                <p className="text-gray-600 text-sm leading-relaxed">
                  Đội ngũ chuyên gia giàu kinh nghiệm với chứng chỉ quốc tế
                </p>
              </div>

              <div className="text-center p-8 bg-gradient-to-br from-white/80 to-gray-50/80 rounded-2xl border border-white/30 transition-all duration-300 cursor-pointer hover:-translate-y-2 hover:shadow-xl">
                <div className="w-20 h-20 bg-gradient-to-br from-blue-500 to-blue-600 rounded-full mx-auto mb-6 flex items-center justify-center shadow-lg relative">
                  <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                  </svg>
                  <div className="absolute top-2 left-2 w-5 h-5 bg-white/30 rounded-full blur-sm" />
                </div>
                <h4 className="font-bold mb-3 text-gray-800 text-xl">
                  Cơ sở hiện đại
                </h4>
                <p className="text-gray-600 text-sm leading-relaxed">
                  Trang thiết bị y tế tiên tiến và môi trường sống tiện nghi
                </p>
              </div>

              <div className="text-center p-8 bg-gradient-to-br from-white/80 to-gray-50/80 rounded-2xl border border-white/30 transition-all duration-300 cursor-pointer hover:-translate-y-2 hover:shadow-xl">
                <div className="w-20 h-20 bg-gradient-to-br from-green-500 to-green-600 rounded-full mx-auto mb-6 flex items-center justify-center shadow-lg relative">
                  <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                  </svg>
                  <div className="absolute top-2 left-2 w-5 h-5 bg-white/30 rounded-full blur-sm" />
                </div>
                <h4 className="font-bold mb-3 text-gray-800 text-xl">
                  Chăm sóc tận tâm
                </h4>
                <p className="text-gray-600 text-sm leading-relaxed">
                  Sự quan tâm chu đáo 24/7 với tình yêu thương như gia đình
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="mt-12 max-w-4xl mx-auto bg-gradient-to-br from-white to-gray-50 rounded-3xl shadow-2xl p-10 border border-gray-200 text-base text-gray-700 relative overflow-hidden">
        <div className="absolute -top-12 -right-12 w-48 h-48 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-full opacity-5 z-0" />
        <div className="absolute -bottom-8 -left-8 w-36 h-36 bg-gradient-to-br from-green-500 to-green-600 rounded-full opacity-5 z-0" />

        <div className="relative z-10">
          <div className="text-center mb-8 pb-6 border-b-2 border-gray-200">
            <h3 className="font-bold text-2xl mb-2 text-gray-800 bg-gradient-to-r from-indigo-500 to-purple-600 bg-clip-text text-transparent">
              Quy Tắc & Điều Khoản Dịch Vụ
            </h3>
            <p className="text-gray-600 text-base max-w-2xl mx-auto leading-relaxed">
              Để đảm bảo chất lượng dịch vụ tốt nhất và quyền lợi của tất cả khách hàng,
              chúng tôi yêu cầu tuân thủ các quy tắc sau
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
            <div className="bg-gradient-to-br from-blue-50 to-cyan-50 border border-blue-500 rounded-2xl p-6 relative">
              <div className="absolute -top-2.5 left-5 bg-gradient-to-r from-blue-500 to-blue-600 text-white px-3 py-1 rounded-full text-xs font-semibold shadow-lg">
                Quy tắc 1
              </div>
              <h4 className="text-lg font-semibold text-blue-900 mt-2 mb-4 flex items-center gap-2">
                Đăng ký dịch vụ
              </h4>
              <p className="text-blue-900 leading-relaxed">
                Mỗi người cao tuổi chỉ có thể đăng ký 1 gói dịch vụ chính và có thể đăng ký thêm nhiều gói dịch vụ bổ sung.
                Việc đăng ký được thực hiện sau khi đội ngũ nhân viên đã tư vấn kỹ lưỡng,
                dựa trên tình trạng sức khỏe và nhu cầu cá nhân của người cao tuổi,
                nhằm đảm bảo lựa chọn phù hợp và tối ưu nhất.
              </p>
            </div>

            <div className="bg-gradient-to-br from-green-50 to-emerald-50 border border-green-500 rounded-2xl p-6 relative">
              <div className="absolute -top-2.5 left-5 bg-gradient-to-r from-green-500 to-green-600 text-white px-3 py-1 rounded-full text-xs font-semibold shadow-lg">
                Quy tắc 2
              </div>
              <h4 className="text-lg font-semibold text-green-900 mt-2 mb-4 flex items-center gap-2">
                Hủy dịch vụ
              </h4>
              <p className="text-green-900 leading-relaxed">
                Dịch vụ sẽ được hủy trực tiếp tại viện sau khi hoàn tất thủ tục.
                Tiền đặt cọc sẽ được hoàn lại (nếu có), và quá trình bàn giao người cao tuổi sẽ được thực hiện với gia đình.
              </p>
            </div>

            <div className="bg-gradient-to-br from-amber-50 to-yellow-50 border border-amber-500 rounded-2xl p-6 relative">
              <div className="absolute -top-2.5 left-5 bg-gradient-to-r from-amber-500 to-amber-600 text-white px-3 py-1 rounded-full text-xs font-semibold shadow-lg">
                Quy tắc 3
              </div>
              <h4 className="text-lg font-semibold text-amber-900 mt-2 mb-4 flex items-center gap-2">
                Hoàn tiền
              </h4>
              <p className="text-amber-900 leading-relaxed">
                Khi hủy gói đã được duyệt, số tiền hoàn lại = <strong>Tiền đã trả - (Số ngày đã sử dụng × Giá gói ÷ 30)</strong>.
              </p>
            </div>

            <div className="bg-gradient-to-br from-red-50 to-pink-50 border border-red-500 rounded-2xl p-6 relative">
              <div className="absolute -top-2.5 left-5 bg-gradient-to-r from-red-500 to-red-600 text-white px-3 py-1 rounded-full text-xs font-semibold shadow-lg">
                Quy tắc 4
              </div>
              <h4 className="text-lg font-semibold text-red-900 mt-2 mb-4 flex items-center gap-2">
                Lưu ý quan trọng
              </h4>
              <p className="text-red-900 leading-relaxed">
                Thông tin đăng ký cần được cung cấp một cách đầy đủ và chính xác. Việc hủy gói dịch vụ sẽ dẫn đến việc chấm dứt ngay lập tức toàn bộ các dịch vụ chăm sóc đang được triển khai.
              </p>
            </div>
          </div>

          <div className="text-center p-8 bg-gradient-to-br from-blue-50 to-cyan-50 rounded-2xl border-2 border-blue-500 relative overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-br from-blue-500/10 to-blue-600/10 z-0" />
            <div className="relative z-10">
              <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-blue-600 rounded-full mx-auto mb-4 flex items-center justify-center shadow-lg">
                <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
              </div>
              <h4 className="text-blue-900 text-xl font-semibold mb-2">
                Điều Khoản & Quy Định Chi Tiết
              </h4>
              <p className="text-blue-900 text-sm mb-7 opacity-80">
                Tìm hiểu đầy đủ các điều khoản, quy định và cam kết dịch vụ của chúng tôi
              </p>
              <button
                onClick={() => router.push('/family/services/terms')}
                className="group bg-gradient-to-r from-blue-500 to-blue-600 text-white border-2 border-blue-500 rounded-xl px-8 py-3 font-semibold cursor-pointer transition-all duration-300 inline-flex items-center gap-3 text-base shadow-lg hover:shadow-xl hover:-translate-y-1 hover:from-blue-600 hover:to-blue-700 active:translate-y-0 active:shadow-md"
              >
                <div className="w-5 h-5 bg-white/20 rounded-full flex items-center justify-center group-hover:bg-white/30 transition-colors duration-300">
                  <DocumentPlusIcon className="w-3 h-3" />
                </div>
                <span className="tracking-wide">Xem Chi Tiết</span>
                <div className="w-2 h-2 bg-white/60 rounded-full group-hover:bg-white/80 transition-colors duration-300"></div>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
