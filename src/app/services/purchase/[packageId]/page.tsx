"use client";

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth-context';
import Link from 'next/link';

// Sử dụng lại dữ liệu gói từ trang services
const carePackages = [
  {
    id: 1,
    name: 'Gói Cơ Bản',
    price: 15000000,
    features: [
      'Chăm sóc cơ bản hàng ngày',
      'Bữa ăn theo tiêu chuẩn',
      'Kiểm tra sức khỏe định kỳ',
      'Hoạt động giải trí cơ bản'
    ],
    description: 'Phù hợp cho người cao tuổi có sức khỏe tốt, cần hỗ trợ sinh hoạt cơ bản.'
  },
  {
    id: 2,
    name: 'Gói Nâng Cao',
    price: 25000000,
    features: [
      'Tất cả dịch vụ của gói Cơ Bản',
      'Chăm sóc y tế chuyên sâu',
      'Vật lý trị liệu định kỳ',
      'Hoạt động giải trí đa dạng',
      'Chế độ dinh dưỡng cá nhân hóa'
    ],
    description: 'Phù hợp cho người cao tuổi cần được chăm sóc kỹ lưỡng hơn về sức khỏe.'
  },
  {
    id: 3,
    name: 'Gói Cao Cấp',
    price: 35000000,
    features: [
      'Tất cả dịch vụ của gói Nâng Cao',
      'Chăm sóc y tế 24/7',
      'Phòng riêng cao cấp',
      'Dịch vụ trị liệu tâm lý',
      'Hoạt động văn hóa, giải trí cao cấp',
      'Đưa đón khám chuyên khoa'
    ],
    description: 'Dành cho người cao tuổi cần được chăm sóc toàn diện với chất lượng cao cấp nhất.'
  }
];

// Mock data cho residents (trong thực tế sẽ lấy từ API)
const mockResidents = [
  { id: 1, name: 'Nguyễn Văn A', room: '101' },
  { id: 2, name: 'Trần Thị B', room: '102' },
  { id: 3, name: 'Lê Văn C', room: '103' },
];

export default function PurchaseServicePage({ params }: { params: { packageId: string } }) {
  const router = useRouter();
  const { user } = useAuth();
  const [selectedResident, setSelectedResident] = useState('');
  const [loading, setLoading] = useState(false);
  const [residents, setResidents] = useState(mockResidents);

  const packageId = parseInt(params.packageId);
  const selectedPackage = carePackages.find(pkg => pkg.id === packageId);

  useEffect(() => {
    if (!user) {
      router.push('/login');
    }
    // Trong thực tế, sẽ fetch danh sách residents từ API ở đây
  }, [user, router]);

  if (!selectedPackage) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-red-600">Gói dịch vụ không tồn tại</h1>
          <Link href="/services" className="text-blue-600 hover:underline mt-4 inline-block">
            Quay lại danh sách gói dịch vụ
          </Link>
        </div>
      </div>
    );
  }

  const handlePurchase = async () => {
    if (!selectedResident) {
      alert('Vui lòng chọn người cần chăm sóc');
      return;
    }

    setLoading(true);
    try {
      // Lấy thông tin gói dịch vụ được chọn
      const selectedPackage = carePackages.find(pkg => pkg.id === packageId);
      if (!selectedPackage) {
        throw new Error('Không tìm thấy gói dịch vụ');
      }

      // Lấy danh sách residents từ localStorage
      const savedResidents = localStorage.getItem('nurseryHomeResidents');
      let residents = mockResidents;
      if (savedResidents) {
        residents = JSON.parse(savedResidents);
      }

      // Cập nhật thông tin gói dịch vụ cho resident được chọn
      const updatedResidents = residents.map(resident => {
        if (resident.id === parseInt(selectedResident)) {
          return {
            ...resident,
            carePackage: {
              id: selectedPackage.id,
              name: selectedPackage.name,
              price: selectedPackage.price,
              purchaseDate: new Date().toISOString(),
              features: selectedPackage.features
            }
          };
        }
        return resident;
      });

      // Lưu danh sách residents đã cập nhật vào localStorage
      localStorage.setItem('nurseryHomeResidents', JSON.stringify(updatedResidents));

      // Chuyển hướng đến trang chi tiết của resident
      router.push(`/residents/${selectedResident}`);
    } catch (error) {
      console.error('Error purchasing service:', error);
      alert('Có lỗi xảy ra khi đăng ký dịch vụ. Vui lòng thử lại sau.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-2xl mx-auto">
        <h1 className="text-3xl font-bold text-gray-900 mb-8">Xác Nhận Đăng Ký Dịch Vụ</h1>
        
        <div className="bg-white rounded-lg shadow-lg p-6 mb-8">
          <h2 className="text-2xl font-semibold text-gray-900 mb-4">{selectedPackage.name}</h2>
          <p className="text-3xl font-bold text-blue-600 mb-6">
            {new Intl.NumberFormat('vi-VN', {
              style: 'currency',
              currency: 'VND'
            }).format(selectedPackage.price)}
            <span className="text-sm text-gray-600">/tháng</span>
          </p>
          <p className="text-gray-600 mb-6">{selectedPackage.description}</p>
          
          <div className="mb-6">
            <h3 className="text-lg font-semibold mb-3">Dịch vụ bao gồm:</h3>
            <ul className="space-y-3">
              {selectedPackage.features.map((feature, index) => (
                <li key={index} className="flex items-start">
                  <svg
                    className="h-6 w-6 text-green-500 mr-2"
                    fill="none"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path d="M5 13l4 4L19 7"></path>
                  </svg>
                  <span className="text-gray-600">{feature}</span>
                </li>
              ))}
            </ul>
          </div>

          <div className="mb-6">
            <label htmlFor="resident" className="block text-sm font-medium text-gray-700 mb-2">
              Chọn người cần chăm sóc
            </label>
            <select
              id="resident"
              value={selectedResident}
              onChange={(e) => setSelectedResident(e.target.value)}
              className="w-full p-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="">-- Chọn người cần chăm sóc --</option>
              {residents.map((resident) => (
                <option key={resident.id} value={resident.id}>
                  {resident.name} - Phòng {resident.room}
                </option>
              ))}
            </select>
          </div>

          <div className="flex justify-between items-center">
            <Link
              href="/services"
              className="text-gray-600 hover:text-gray-800 font-medium"
            >
              ← Quay lại
            </Link>
            <button
              onClick={handlePurchase}
              disabled={loading || !selectedResident}
              className={`
                px-6 py-3 rounded-lg text-white font-medium
                ${loading || !selectedResident
                  ? 'bg-gray-400 cursor-not-allowed'
                  : 'bg-blue-600 hover:bg-blue-700'}
              `}
            >
              {loading ? 'Đang xử lý...' : 'Xác Nhận Đăng Ký'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
} 