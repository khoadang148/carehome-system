// Shared residents data to ensure consistency across all pages
export const RESIDENTS_DATA = [
  { 
    id: 1, 
    name: 'Nguyễn Văn Nam', 
    age: 78, 
    room: 'A01', 
    careLevel: 'Cơ bản',
    relationship: 'Cha',

    medicalConditions: ['Tăng huyết áp', 'Viêm khớp'],
    medications: ['Lisinopril', 'Ibuprofen'],
    allergies: ['Penicillin'],
    emergencyContact: 'Nguyễn Thị Lan (Con gái)',
    contactPhone: '(028) 1234-5678',
    personalNotes: 'Thích đọc sách và làm vườn. Cần hỗ trợ tắm rửa.',
    dietaryRestrictions: 'Ít muối',
    mobilityStatus: 'Sử dụng khung đi bộ',
    healthCondition: 'Tình trạng sức khỏe ổn định',
    medicalHistory: 'Tiền sử tăng huyết áp, viêm khớp',
    medications_detail: 'Lisinopril 10mg/ngày, Vitamin D',
    allergyInfo: 'Dị ứng Penicillin',
    specialNeeds: 'Cần hỗ trợ đi lại',
    carePackage: {
      id: 1,
      name: 'Gói Cơ Bản',
      description: 'Dịch vụ chăm sóc toàn diện cho người cao tuổi',
      price: 15000000,
      finalPrice: 15000000,
      discount: 0,
      discountAmount: 0,
      purchaseDate: '2024-06-07T10:30:00.000Z',
      startDate: '2024-06-07',
      paymentMethod: 'bank_transfer',
      emergencyContact: 'Nguyễn Thị Lan (Con gái) - (028) 1234-5678',
      medicalNotes: 'Cần theo dõi huyết áp hàng ngày',
      features: [
        'Tất cả dịch vụ của gói Cơ Bản',
        'Chăm sóc cơ thể chuyên sâu',
        'Theo dõi sức khỏe 24/7',
        'Hoạt động giải trí đa dạng',
        'Chế độ ăn dinh dưỡng cao cấp'
      ],
      status: 'active',
      registrationId: 'REG-1717423258-1'
    }
  },
  { 
    id: 2, 
    name: 'Lê Thị Hoa', 
    age: 75, 
    room: 'A02', 
    careLevel: 'Nâng cao',
    relationship: 'Mẹ',

    medicalConditions: ['Tiểu đường', 'Bệnh tim'],
    medications: ['Metformin', 'Atorvastatin'],
    allergies: ['Thuốc Sulfa'],
    emergencyContact: 'Nguyễn Thị Lan (Con gái)',
    contactPhone: '(028) 1234-5678',
    personalNotes: 'Cựu giáo viên. Thích chơi cờ và nghe nhạc cổ điển.',
    dietaryRestrictions: 'Chế độ ăn tiểu đường',
    mobilityStatus: 'Độc lập',
    healthCondition: 'Tình trạng sức khỏe khá tốt',
    medicalHistory: 'Tiền sử tiểu đường type 2, bệnh tim',
    medications_detail: 'Metformin 500mg, Atorvastatin 20mg',
    allergyInfo: 'Dị ứng thuốc Sulfa',
    specialNeeds: 'Cần kiểm soát đường huyết',
    carePackage: {
      id: 2,
      name: 'Gói Nâng Cao',
      description: 'Dịch vụ chăm sóc toàn diện cho người cao tuổi',
      price: 22500000,
      finalPrice: 22500000,
      discount: 0,
      discountAmount: 0,
      purchaseDate: '2024-06-01T14:15:00.000Z',
      startDate: '2024-06-01',
      paymentMethod: 'credit_card',
      emergencyContact: 'Nguyễn Thị Lan (Con gái) - (028) 1234-5678',
      medicalNotes: 'Cần kiểm soát đường huyết và theo dõi tim mạch',
      features: [
        'Chăm sóc y tế chuyên nghiệp',
        'Dinh dưỡng đặc biệt cho người tiểu đường',
        'Vật lý trị liệu',
        'Hoạt động nhận thức',
        'Theo dõi sức khỏe 24/7',
        'Dịch vụ tư vấn tâm lý'
      ],
      status: 'pending_approval',
      registrationId: 'REG-1717235258-2'
    }
  }
]; 
