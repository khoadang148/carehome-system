"use client";

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/contexts/auth-context';
import { 
  ArrowLeftIcon,
  DocumentPlusIcon,
  CheckCircleIcon,
  ExclamationTriangleIcon,
  InformationCircleIcon,
  ShieldCheckIcon,
  ClockIcon,
  CurrencyDollarIcon,
  UserGroupIcon,
  HeartIcon
} from '@heroicons/react/24/outline';

// Business rules data
const termsData = [
  {
    id: 'services',
    title: 'Dịch Vụ Chăm Sóc',
    icon: 'medical-services',
    color: 'from-blue-500 to-cyan-500',
    bgColor: 'from-blue-50 to-cyan-50',
    content: [
      {
        subtitle: 'Gói dịch vụ chăm sóc',
        text: 'Viện cung cấp các gói dịch vụ chăm sóc khác nhau phù hợp với tình trạng sức khỏe của người cao tuổi. Mỗi gói bao gồm dịch vụ ăn uống, thuốc men cơ bản, và các hoạt động giải trí.',
        icon: HeartIcon
      },
      {
        subtitle: 'Dịch vụ bao gồm',
        text: 'Tất cả dịch vụ ăn uống, thuốc men theo đơn bác sĩ, và các hoạt động sinh hoạt đã được bao gồm trong gói dịch vụ mà không tính phí thêm.',
        icon: CheckCircleIcon
      },
      {
        subtitle: 'Dịch vụ bổ sung',
        text: 'Người nhà có thể tự do mang thuốc, thực phẩm chức năng hoặc thức ăn cho người thân. Các yêu cầu thêm thuốc từ bệnh viện sẽ được tính phí riêng.',
        icon: InformationCircleIcon
      }
    ]
  },
  {
    id: 'pricing',
    title: 'Chính Sách Tính Phí',
    icon: 'attach-money',
    color: 'from-green-500 to-emerald-500',
    bgColor: 'from-green-50 to-emerald-50',
    content: [
      {
        subtitle: 'Cơ sở tính phí',
        text: 'Chi phí được tính dựa trên gói dịch vụ chăm sóc và loại phòng được chọn. Giá cả tính theo số ngày thực tế người cao tuổi lưu trú tại viện.',
        icon: CurrencyDollarIcon
      },
      {
        subtitle: 'Công thức tính',
        text: 'Phí tháng = (Tổng phí gói dịch vụ ÷ 30 ngày) × Số ngày thực tế ở viện',
        icon: InformationCircleIcon
      },
      {
        subtitle: 'Đăng ký lần đầu',
        text: 'Khi đăng ký, người nhà cần thanh toán cọc trước 1 tháng cộng với tiền phí tháng đầu tiên.',
        icon: CheckCircleIcon
      }
    ]
  },
  {
    id: 'payment',
    title: 'Thanh Toán',
    icon: 'payment',
    color: 'from-purple-500 to-indigo-500',
    bgColor: 'from-purple-50 to-indigo-50',
    content: [
      {
        subtitle: 'Chu kỳ thanh toán',
        text: 'Thanh toán được thực hiện hàng tháng từ ngày 1 đến ngày 5 của mỗi tháng.',
        icon: ClockIcon
      },
      {
        subtitle: 'Phương thức thanh toán',
        text: 'Đợt đăng ký đầu tiên: Thanh toán tại quầy nhân viên bằng chuyển khoản. Các tháng tiếp theo: Có thể thanh toán online hoặc tại quầy.',
        icon: CheckCircleIcon
      },
      {
        subtitle: 'Quá hạn thanh toán',
        text: 'Nếu quá ngày 5 mà chưa thanh toán, viện sẽ thông báo và trao đổi với người nhà để đưa người cao tuổi về nhà.',
        icon: ExclamationTriangleIcon
      }
    ]
  },
  {
    id: 'service_change',
    title: 'Thay Đổi Gói Dịch Vụ',
    icon: 'swap-horizontal-circle',
    color: 'from-orange-500 to-amber-500',
    bgColor: 'from-orange-50 to-amber-50',
    content: [
      {
        subtitle: 'Điều kiện thay đổi',
        text: 'Khi người cao tuổi có thay đổi về tình trạng sức khỏe và cần chuyển sang gói dịch vụ khác, việc thay đổi sẽ có hiệu lực từ tháng tiếp theo.',
        icon: InformationCircleIcon
      },
      {
        subtitle: 'Quy trình thay đổi',
        text: 'Hoàn thành hợp đồng hiện tại đến hết tháng, sau đó đăng ký gói dịch vụ mới cho tháng tiếp theo.',
        icon: CheckCircleIcon
      }
    ]
  },
  {
    id: 'termination',
    title: 'Chấm Dứt Dịch Vụ',
    icon: 'exit-to-app',
    color: 'from-red-500 to-pink-500',
    bgColor: 'from-red-50 to-pink-50',
    content: [
      {
        subtitle: 'Do người nhà yêu cầu',
        text: 'Nếu người nhà muốn đón người cao tuổi về, phí sẽ được tính theo công thức: (Tổng phí gói ÷ 30 ngày) × Số ngày thực tế ở viện.',
        icon: InformationCircleIcon
      },
      {
        subtitle: 'Hoàn tiền',
        text: 'Số tiền dư sẽ được hoàn lại cho người nhà vì tiền được thu trước vào đầu mỗi tháng.',
        icon: CheckCircleIcon
      },
      {
        subtitle: 'Do vi phạm thanh toán',
        text: 'Khi không thanh toán đúng hạn sau thông báo, viện có quyền chấm dứt dịch vụ và yêu cầu người nhà đón về.',
        icon: ExclamationTriangleIcon
      }
    ]
  },
  {
    id: 'responsibilities',
    title: 'Trách Nhiệm Các Bên',
    icon: 'handshake',
    color: 'from-teal-500 to-cyan-500',
    bgColor: 'from-teal-50 to-cyan-50',
    content: [
      {
        subtitle: 'Trách nhiệm của viện',
        text: 'Cung cấp dịch vụ chăm sóc chất lượng, đảm bảo an toàn và sức khỏe cho người cao tuổi theo gói dịch vụ đã đăng ký.',
        icon: ShieldCheckIcon
      },
      {
        subtitle: 'Trách nhiệm của người nhà',
        text: 'Thanh toán đúng hạn, cung cấp thông tin sức khỏe chính xác, tuân thủ các quy định của viện.',
        icon: UserGroupIcon
      },
      {
        subtitle: 'Thăm viếng',
        text: 'Người nhà được quyền thăm viếng theo lịch đã đăng ký và phải tuân thủ các quy định về giờ thăm viếng.',
        icon: CheckCircleIcon
      }
    ]
  },
  {
    id: 'privacy',
    title: 'Bảo Mật Thông Tin',
    icon: 'privacy-tip',
    color: 'from-indigo-500 to-purple-500',
    bgColor: 'from-indigo-50 to-purple-50',
    content: [
      {
        subtitle: 'Thu thập thông tin',
        text: 'Viện chỉ thu thập thông tin cần thiết để cung cấp dịch vụ chăm sóc tốt nhất.',
        icon: ShieldCheckIcon
      },
      {
        subtitle: 'Bảo vệ thông tin',
        text: 'Mọi thông tin cá nhân và y tế của người cao tuổi được bảo mật tuyệt đối và chỉ chia sẻ với nhân viên y tế có liên quan.',
        icon: ShieldCheckIcon
      },
      {
        subtitle: 'Quyền truy cập',
        text: 'Người nhà có quyền truy cập và yêu cầu cập nhật thông tin của người thân mình.',
        icon: CheckCircleIcon
      }
    ]
  },
  {
    id: 'emergency',
    title: 'Tình Huống Khẩn Cấp',
    icon: 'local-hospital',
    color: 'from-rose-500 to-red-500',
    bgColor: 'from-rose-50 to-red-50',
    content: [
      {
        subtitle: 'Xử lý khẩn cấp',
        text: 'Trong trường hợp khẩn cấp, viện sẽ liên hệ ngay với người nhà và thực hiện các biện pháp cấp cứu cần thiết.',
        icon: ExclamationTriangleIcon
      },
      {
        subtitle: 'Chi phí phát sinh',
        text: 'Chi phí cấp cứu và điều trị đặc biệt ngoài gói dịch vụ sẽ được thông báo và tính riêng.',
        icon: InformationCircleIcon
      }
    ]
  }
];

export default function TermsPage() {
  const router = useRouter();
  const { user } = useAuth();
  const [expandedTerm, setExpandedTerm] = useState<string | null>(null);

  // Check access permissions - family only
  React.useEffect(() => {
    if (!user) {
      router.push('/login');
      return;
    }
    
    if (user?.role !== 'family') {
      router.push('/');
      return;
    }
  }, [user, router]);

  const toggleTerm = (termId: string) => {
    setExpandedTerm(expandedTerm === termId ? null : termId);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100">
      {/* Hero Section */}
      <div className="relative overflow-hidden bg-gradient-to-br from-blue-600 via-purple-600 to-indigo-700 text-white">
        {/* Background Pattern */}
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-0 left-0 w-full h-full bg-[radial-gradient(circle_at_1px_1px,rgba(255,255,255,0.15)_1px,transparent_0)] bg-[length:20px_20px]"></div>
        </div>
        
        <div className="relative z-10 px-4 py-16 sm:px-6 lg:px-8">
          <div className="max-w-7xl mx-auto">
            <div className="flex items-center justify-center mb-8">
              <button
                onClick={() => router.back()}
                title="Quay lại"
                className="group p-3 bg-white/20 backdrop-blur-sm border border-white/30 rounded-xl text-white hover:bg-white/30 transition-all duration-300 ease-out hover:scale-105 mr-6"
              >
                <ArrowLeftIcon className="w-6 h-6 group-hover:-translate-x-1 transition-transform duration-300" />
              </button>
              <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-center leading-tight">
                Điều Khoản & Quy Định
              </h1>
            </div>
            <p className="text-xl md:text-2xl text-center max-w-4xl mx-auto opacity-90 leading-relaxed">
              Tìm hiểu đầy đủ các điều khoản, quy định và cam kết dịch vụ của chúng tôi
            </p>
          </div>
        </div>
      </div>

      {/* Content Section */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 lg:py-16 -mt-8 relative z-20">
        <div className="bg-white/80 backdrop-blur-sm rounded-3xl shadow-2xl border border-white/20 p-8 lg:p-12">
          {/* Header */}
          <div className="text-center mb-12">
            <div className="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full mb-6 shadow-lg">
              <DocumentPlusIcon className="w-10 h-10 text-white" />
            </div>
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
              Quy Tắc & Điều Khoản Dịch Vụ
            </h2>
            <p className="text-lg text-gray-600 max-w-3xl mx-auto leading-relaxed">
              Để đảm bảo chất lượng dịch vụ tốt nhất và quyền lợi của tất cả khách hàng, 
              chúng tôi yêu cầu tuân thủ các quy tắc sau
            </p>
          </div>

          {/* Terms Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-12">
            {termsData.map((term) => (
              <div
                key={term.id}
                className={`group relative bg-gradient-to-br ${term.bgColor} border border-gray-200 rounded-2xl p-6 transition-all duration-500 ease-out hover:shadow-xl hover:-translate-y-2 cursor-pointer overflow-hidden`}
                onClick={() => toggleTerm(term.id)}
              >
                {/* Background decoration */}
                <div className={`absolute top-0 right-0 w-32 h-32 bg-gradient-to-br ${term.color} opacity-5 rounded-full -translate-y-16 translate-x-16`}></div>
                
                {/* Header */}
                <div className={`inline-flex items-center px-4 py-2 bg-gradient-to-r ${term.color} text-white rounded-full text-sm font-semibold mb-4 shadow-lg`}>
                  {term.title}
                </div>
                
                {/* Content */}
                <div className="space-y-4">
                  {term.content.map((item, itemIndex) => (
                    <div
                      key={itemIndex}
                      className={`transition-all duration-300 ${
                        expandedTerm === term.id ? 'opacity-100 transform translate-y-0' : 'opacity-90'
                      }`}
                    >
                      <div className="flex items-start space-x-3">
                        <div className={`flex-shrink-0 w-8 h-8 bg-gradient-to-br ${term.color} rounded-full flex items-center justify-center shadow-md`}>
                          <item.icon className="w-4 h-4 text-white" />
                        </div>
                        <div className="flex-1">
                          <h4 className="text-lg font-semibold text-gray-900 mb-2">
                            {item.subtitle}
                          </h4>
                          <p className="text-gray-700 leading-relaxed">
                            {item.text}
                          </p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
                
                {/* Expand indicator */}
                <div className={`absolute bottom-4 right-4 transition-transform duration-300 ${
                  expandedTerm === term.id ? 'rotate-180' : ''
                }`}>
                  <div className={`w-8 h-8 bg-gradient-to-br ${term.color} rounded-full flex items-center justify-center shadow-md`}>
                    <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Rules Section */}
          <div className="bg-gradient-to-br from-blue-50 to-indigo-100 rounded-3xl p-8 lg:p-12 border-2 border-blue-200 relative overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-br from-blue-500/5 to-indigo-500/5"></div>
            <div className="relative z-10">
              <div className="text-center mb-8">
                <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-full mb-4 shadow-lg">
                  <ShieldCheckIcon className="w-8 h-8 text-white" />
                </div>
                <h3 className="text-2xl md:text-3xl font-bold text-gray-900 mb-2">
                  Quy Tắc Quan Trọng
                </h3>
                <p className="text-gray-600">
                  Những điều cần lưu ý khi sử dụng dịch vụ
                </p>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {[
                  {
                    title: 'Đăng ký dịch vụ',
                    description: 'Mỗi người cao tuổi chỉ có thể đăng ký 1 gói dịch vụ chính và có thể đăng ký thêm nhiều gói dịch vụ bổ sung. Việc đăng ký được thực hiện sau khi đội ngũ nhân viên đã tư vấn kỹ lưỡng.',
                    color: 'from-blue-500 to-cyan-500',
                    icon: CheckCircleIcon
                  },
                  {
                    title: 'Hủy dịch vụ',
                    description: 'Dịch vụ sẽ được hủy trực tiếp tại viện sau khi hoàn tất thủ tục. Tiền đặt cọc sẽ được hoàn lại (nếu có).',
                    color: 'from-green-500 to-emerald-500',
                    icon: CheckCircleIcon
                  },
                  {
                    title: 'Hoàn tiền',
                    description: 'Khi hủy gói đã được duyệt, số tiền hoàn lại = Tiền đã trả - (Số ngày đã sử dụng × Giá gói ÷ 30).',
                    color: 'from-amber-500 to-orange-500',
                    icon: CurrencyDollarIcon
                  },
                  {
                    title: 'Lưu ý quan trọng',
                    description: 'Thông tin đăng ký cần được cung cấp một cách đầy đủ và chính xác. Việc hủy gói dịch vụ sẽ dẫn đến việc chấm dứt ngay lập tức toàn bộ các dịch vụ chăm sóc.',
                    color: 'from-red-500 to-rose-500',
                    icon: ExclamationTriangleIcon
                  }
                ].map((rule, index) => (
                  <div
                    key={index}
                    className="bg-white rounded-2xl p-6 shadow-lg border border-gray-100 hover:shadow-xl transition-all duration-300 hover:-translate-y-1"
                  >
                    <div className={`inline-flex items-center px-3 py-1 bg-gradient-to-r ${rule.color} text-white rounded-full text-sm font-semibold mb-4`}>
                      Quy tắc {index + 1}
                    </div>
                    <div className="flex items-start space-x-3">
                      <div className={`flex-shrink-0 w-10 h-10 bg-gradient-to-br ${rule.color} rounded-full flex items-center justify-center shadow-md`}>
                        <rule.icon className="w-5 h-5 text-white" />
                      </div>
                      <div className="flex-1">
                        <h4 className="text-lg font-semibold text-gray-900 mb-2">
                          {rule.title}
                        </h4>
                        <p className="text-gray-700 leading-relaxed">
                          {rule.description}
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Footer */}
          <div className="text-center mt-12 pt-8 border-t border-gray-200">
            <div className="bg-gradient-to-r from-green-50 to-blue-50 rounded-2xl p-6 mb-6 border border-green-200">
              <div className="flex items-center justify-center space-x-2 mb-3">
                <CheckCircleIcon className="w-6 h-6 text-green-600" />
                <span className="text-green-800 font-semibold">Cam kết dịch vụ</span>
              </div>
              <p className="text-gray-700 leading-relaxed">
                Bằng việc sử dụng dịch vụ của chúng tôi, bạn đồng ý tuân thủ tất cả các điều khoản và quy định trên.
              </p>
            </div>
            
            <button
              onClick={() => router.back()}
              className="group inline-flex items-center px-8 py-4 bg-gradient-to-r from-blue-600 to-purple-600 text-white font-semibold rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300 hover:-translate-y-1 hover:scale-105"
            >
              <ArrowLeftIcon className="w-5 h-5 mr-2 group-hover:-translate-x-1 transition-transform duration-300" />
              Quay lại
            </button>
          </div>
        </div>
      </div>
    </div>
  );
} 