"use client";

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth-context';
import { 
  BanknotesIcon,
  ArrowTrendingUpIcon,
  ArrowTrendingDownIcon, 
  DocumentPlusIcon,
  FunnelIcon, 
  MagnifyingGlassIcon,
  ChartBarIcon,
  EyeIcon,
  PencilIcon,
  CreditCardIcon,
  CalendarDaysIcon,
  UserGroupIcon,
  XMarkIcon,
  CheckCircleIcon,
  BuildingLibraryIcon,
  DevicePhoneMobileIcon,
  ClockIcon,
  PlusCircleIcon,
  QrCodeIcon
} from '@heroicons/react/24/outline';
import dynamic from 'next/dynamic';
import { Dialog, Transition } from '@headlessui/react';
import { Fragment } from 'react';
import QRCode from 'react-qr-code';

// Dynamic import for QR Scanner
const QrScanner = dynamic(() => import('react-qr-scanner'), {
  ssr: false,
  loading: () => <p>Loading QR Scanner...</p>
});

// Mock financial transactions data (for admin)
const adminTransactions = [
  { 
    id: 1, 
    description: 'Chi phí nhân sự tháng 5', 
    category: 'Chi phí',
    amount: 24500000,
    date: '2023-05-15',
    paymentMethod: 'Chuyển khoản',
    reference: 'HR-2023-05',
    status: 'Đã xử lý'
  },
  { 
    id: 2, 
    description: 'Thanh toán dịch vụ từ gia đình Johnson', 
    category: 'Thu nhập',
    amount: 7800000,
    date: '2023-05-12',
    paymentMethod: 'Thẻ tín dụng',
    reference: 'PMT-10045',
    status: 'Đã xử lý'
  },
  { 
    id: 3, 
    description: 'Chi phí thuốc và vật tư y tế', 
    category: 'Chi phí',
    amount: 4200000,
    date: '2023-05-10',
    paymentMethod: 'Chuyển khoản',
    reference: 'MED-2023-05-A',
    status: 'Đã xử lý'
  },
  { 
    id: 4, 
    description: 'Thanh toán dịch vụ từ gia đình Smith', 
    category: 'Thu nhập',
    amount: 8500000,
    date: '2023-05-08',
    paymentMethod: 'Thẻ tín dụng',
    reference: 'PMT-10046',
    status: 'Đang xử lý'
  },
  { 
    id: 5, 
    description: 'Tiện ích và dịch vụ', 
    category: 'Chi phí',
    amount: 3150000,
    date: '2023-05-05',
    paymentMethod: 'Chuyển khoản',
    reference: 'UTIL-2023-05',
    status: 'Đã xử lý'
  },
];

// Enhanced business logic data structure
const familyFinancialData = [
  {
    id: 1,
    residentName: 'Nguyễn Văn Nam',
    relationship: 'Cha',
    residentId: 'RES001',
    contractId: 'CT2024001',
    monthlyFee: 15000000,
    contractStartDate: '2024-01-01',
    paymentSchedule: 'monthly', // monthly, quarterly, yearly
    lateFeeRate: 0.02, // 2% per day
    gracePeriodDays: 5,
    additionalServices: [
      { 
        id: 'SV001',
        name: 'Vật lý trị liệu', 
        amount: 2000000, 
        frequency: 'Hàng tuần',
        startDate: '2024-01-01',
        isActive: true
      },
      { 
        id: 'SV002',
        name: 'Chăm sóc y tế đặc biệt', 
        amount: 1500000, 
        frequency: 'Hàng tháng',
        startDate: '2024-01-01',
        isActive: true
      },
    ],
    payments: [
      { 
        id: 1, 
        transactionId: 'TXN202405001',
        invoiceId: 'INV202405001',
        description: 'Phí chăm sóc tháng 5/2024', 
        amount: 15000000,
        originalAmount: 15000000,
        lateFee: 0,
        discount: 0,
        totalAmount: 15000000,
        dueDate: '2024-05-01',
        paidDate: '2024-05-01',
        status: 'paid', // pending, processing, paid, overdue, cancelled, refunded
        method: 'bank_transfer',
        bankReference: 'VCB20240501123456',
        paymentType: 'full', // full, partial
        verificationStatus: 'verified', // pending, verified, failed
        createdAt: '2024-04-25T00:00:00Z',
        updatedAt: '2024-05-01T10:30:00Z'
      },
      { 
        id: 2, 
        transactionId: 'TXN202405002',
        invoiceId: 'INV202405002',
        description: 'Vật lý trị liệu tuần 3/5', 
        amount: 500000,
        originalAmount: 500000,
        lateFee: 0,
        discount: 50000, // 10% discount for early payment
        totalAmount: 450000,
        dueDate: '2024-05-15',
        paidDate: '2024-05-14',
        status: 'paid',
        method: 'bank_transfer',
        bankReference: 'VCB20240514789012',
        paymentType: 'full',
        verificationStatus: 'verified',
        createdAt: '2024-05-10T00:00:00Z',
        updatedAt: '2024-05-14T15:20:00Z'
      },
      { 
        id: 3, 
        transactionId: 'TXN202406001',
        invoiceId: 'INV202406001',
        description: 'Phí chăm sóc tháng 6/2024', 
        amount: 15000000,
        originalAmount: 15000000,
        lateFee: 600000, // Late fee calculated
        discount: 0,
        totalAmount: 15600000,
        dueDate: '2024-06-01',
        paidDate: null,
        status: 'overdue', // Overdue since it's past due date
        method: '',
        bankReference: '',
        paymentType: 'pending',
        verificationStatus: 'pending',
        createdAt: '2024-05-25T00:00:00Z',
        updatedAt: '2024-06-01T00:00:00Z',
        overdueDate: '2024-06-06', // Grace period ended
        remindersSent: 2,
        lastReminderDate: '2024-06-10T00:00:00Z'
      },
      {
        id: 4,
        transactionId: 'TXN202407001',
        invoiceId: 'INV202407001',
        description: 'Phí chăm sóc tháng 7/2024',
        amount: 15000000,
        originalAmount: 15000000,
        lateFee: 0,
        discount: 0,
        totalAmount: 15000000,
        dueDate: '2024-07-01',
        paidDate: null,
        status: 'pending',
        method: '',
        bankReference: '',
        paymentType: 'pending',
        verificationStatus: 'pending',
        createdAt: '2024-06-25T00:00:00Z',
        updatedAt: '2024-06-25T00:00:00Z'
      }
    ],
    totalPaid: 15950000, // Adjusted for discounts
    totalDue: 15600000, // Including late fees
    nextPaymentDate: '2024-07-01',
    paymentHistory: {
      totalTransactions: 4,
      successfulPayments: 2,
      overduePayments: 1,
      averagePaymentDelay: 1.5, // days
      totalLateFees: 600000,
      totalDiscounts: 50000
    }
  },
  {
    id: 2,
    residentName: 'Lê Thị Hoa',
    relationship: 'Mẹ',
    monthlyFee: 18000000,
    additionalServices: [
      { name: 'Liệu pháp âm nhạc', amount: 800000, frequency: 'Hai lần/tuần' },
    ],
    payments: [
      { id: 4, description: 'Phí chăm sóc tháng 5/2024', amount: 18000000, date: '2024-05-01', status: 'Đã thanh toán', method: 'Chuyển khoản' },
      { id: 5, description: 'Liệu pháp âm nhạc tuần 2/5', amount: 400000, date: '2024-05-10', status: 'Đã thanh toán', method: 'Tiền mặt' },
    ],
    totalPaid: 18400000,
    totalDue: 0,
    nextPaymentDate: '2024-06-01'
  }
];

const categories = ['Tất cả', 'Thu nhập', 'Chi phí'];
const statuses = ['Tất cả', 'Đã xử lý', 'Đang xử lý'];

// Helper function to format currency
const formatCurrency = (amount: number) => {
  return new Intl.NumberFormat('vi-VN', { 
    style: 'currency', 
    currency: 'VND',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0
  }).format(amount);
};

// Payment methods configuration
const paymentMethods = [
  {
    id: 'bank_transfer',
    name: 'Chuyển khoản ngân hàng',
    icon: BuildingLibraryIcon,
    description: 'Chuyển khoản trực tiếp qua ngân hàng',
    isPopular: true
  },
  {
    id: 'qr_code',
    name: 'Quét mã QR',
    icon: QrCodeIcon,
    description: 'Quét mã QR để thanh toán',
    isPopular: true
  },
  {
    id: 'credit_card',
    name: 'Thẻ tín dụng',
    icon: CreditCardIcon,
    description: 'Thanh toán bằng thẻ tín dụng',
    isPopular: true
  },
  {
    id: 'momo',
    name: 'Ví MoMo',
    icon: DevicePhoneMobileIcon,
    description: 'Thanh toán qua ví MoMo',
    isPopular: false
  },
  {
    id: 'zalopay',
    name: 'ZaloPay',
    icon: DevicePhoneMobileIcon,
    description: 'Thanh toán qua ZaloPay',
    isPopular: false
  }
];

export default function FinancePage() {
  // Add CSS for animations
  React.useEffect(() => {
    const style = document.createElement('style');
    style.textContent = `
      @keyframes spin {
        from {
          transform: rotate(0deg);
        }
        to {
          transform: rotate(360deg);
        }
      }
    `;
    document.head.appendChild(style);
    
    return () => {
      document.head.removeChild(style);
    };
  }, []);

  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState('Tất cả');
  const [filterStatus, setFilterStatus] = useState('Tất cả');
  const [selectedResident, setSelectedResident] = useState(0);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [showInvoiceModal, setShowInvoiceModal] = useState(false);
  const [showQrScanner, setShowQrScanner] = useState(false);
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState('');
  const [currentPayment, setCurrentPayment] = useState(null);

  // Hide header when modals are open
  useEffect(() => {
    if (showPaymentModal || showInvoiceModal || showQrScanner) {
      document.body.classList.add('hide-header');
    } else {
      document.body.classList.remove('hide-header');
    }

    // Cleanup on unmount
    return () => {
      document.body.classList.remove('hide-header');
    };
  }, [showPaymentModal, showInvoiceModal, showQrScanner]);
  const [showServiceModal, setShowServiceModal] = useState(false);
  const [selectedPayment, setSelectedPayment] = useState<any>(null);
  const [paymentMethod, setPaymentMethod] = useState('bank_transfer');
  const [isProcessingPayment, setIsProcessingPayment] = useState(false);
  const router = useRouter();
  const { user } = useAuth();

  // Check access permissions
  useEffect(() => {
    if (!user) {
      router.push('/login');
      return;
    }
    
    if (!['admin', 'family'].includes(user.role)) {
      router.push('/');
      return;
    }
  }, [user, router]);

  // Handler functions for button actions
  const handleViewTransaction = (transactionId: number) => {
    router.push(`/finance/${transactionId}`);
  };

  const handleEditTransaction = (transactionId: number) => {
    router.push(`/finance/${transactionId}/edit`);
  };

  // Payment handling functions
  const handlePayNow = (payment: any) => {
    setSelectedPayment(payment);
    setShowPaymentModal(true);
  };

  const handleViewInvoice = (payment: any) => {
    setSelectedPayment(payment);
    setShowInvoiceModal(true);
  };

  const handleViewServicePackage = () => {
    setShowServiceModal(true);
  };

  const getRegisteredServicePackage = () => {
    try {
      const savedResidents = localStorage.getItem('nurseryHomeResidents');
      if (savedResidents) {
        const residents = JSON.parse(savedResidents);
        const currentResident = residents.find((r: any) => r.id.toString() === selectedResident);
        return currentResident?.carePackage || null;
      }
    } catch (error) {
      console.error('Error getting registered service package:', error);
    }
    return null;
  };

  const handleProcessPayment = async () => {
    setIsProcessingPayment(true);
    
    try {
      // Step 1: Create audit log for payment initiation
      const auditLog = createAuditLog('payment_initiated', selectedPayment, {
        step: 'validation_started'
      });
      console.log('🔍 Payment initiated:', auditLog);

      // Step 2: Validate payment amount
      const validation = validatePaymentAmount(selectedPayment, selectedPayment.totalAmount);
      if (!validation.isValid) {
        throw new Error(validation.errors.join(', '));
      }

      // Step 3: Calculate final amounts with business rules
      const currentDate = new Date().toISOString();
      const lateFee = calculateLateFee(
        selectedPayment.originalAmount, 
        selectedPayment.dueDate, 
        currentDate,
        familyFinancialData[selectedResident].lateFeeRate,
        familyFinancialData[selectedResident].gracePeriodDays
      );

      const discount = calculateEarlyPaymentDiscount(
        selectedPayment.originalAmount,
        selectedPayment.dueDate,
        currentDate
      );

      const finalAmount = selectedPayment.originalAmount + lateFee - discount;

      // Step 4: Simulate bank API call with retry logic
      let retryCount = 0;
      const maxRetries = 3;
      let bankResponse = null;

      while (retryCount < maxRetries) {
        try {
          console.log(`🏦 Attempting bank verification (attempt ${retryCount + 1}/${maxRetries})`);
          
          // Simulate bank API delay
          await new Promise(resolve => setTimeout(resolve, 1000 + retryCount * 500));
          
          // Simulate bank verification (90% success rate)
          if (Math.random() > 0.1) {
            bankResponse = {
              success: true,
              bankReference: `VCB${Date.now()}${Math.floor(Math.random() * 1000)}`,
              verificationCode: generateTransactionId(),
              processedAt: new Date().toISOString(),
              fee: 11000 // Bank transfer fee
            };
            break;
          } else {
            throw new Error('Bank verification temporarily unavailable');
          }
        } catch (bankError) {
          retryCount++;
          if (retryCount >= maxRetries) {
            throw new Error('Không thể xác minh với ngân hàng sau 3 lần thử. Vui lòng thử lại sau.');
          }
          console.warn(`⚠️ Bank verification failed, retrying... (${retryCount}/${maxRetries})`);
          await new Promise(resolve => setTimeout(resolve, 1000));
        }
      }

      // Step 5: Update payment data with comprehensive information
      const updatedData = [...familyFinancialData];
      const residentData = updatedData[selectedResident];
      const paymentIndex = residentData.payments.findIndex(p => p.id === selectedPayment.id);
      
      if (paymentIndex !== -1) {
        const now = new Date().toISOString();
        const payment = residentData.payments[paymentIndex];
        
        // Update payment with business logic results
        payment.status = 'paid';
        payment.verificationStatus = 'verified';
        payment.method = 'bank_transfer';
        payment.paidDate = now;
        payment.updatedAt = now;
        payment.lateFee = lateFee;
        payment.discount = discount;
        payment.totalAmount = finalAmount;
        payment.bankReference = bankResponse.bankReference;
        payment.paymentType = 'full';
        payment.processingFee = bankResponse.fee;
        payment.verificationCode = bankResponse.verificationCode;

        // Update resident totals
        residentData.totalPaid += payment.amount;
        residentData.totalDue = Math.max(0, residentData.totalDue - payment.amount);
        
        // Update payment history analytics
        residentData.paymentHistory.successfulPayments += 1;
        residentData.paymentHistory.totalLateFees += lateFee;
        residentData.paymentHistory.totalDiscounts += discount;
        
        // Calculate payment delay for analytics
        const paymentDelay = Math.max(0, Math.ceil(
          (new Date(now).getTime() - new Date(payment.dueDate).getTime()) / (1000 * 60 * 60 * 24)
        ));
        residentData.paymentHistory.averagePaymentDelay = 
          (residentData.paymentHistory.averagePaymentDelay * (residentData.paymentHistory.successfulPayments - 1) + paymentDelay) / 
          residentData.paymentHistory.successfulPayments;
      }

      // Step 6: Generate receipt
      const receipt = generateReceipt(selectedPayment, residentData);
      console.log('🧾 Receipt generated:', receipt);

      // Step 7: Send notification
      await sendNotification('payment_success', selectedPayment, {
        email: 'family@example.com', // In real app, get from user profile
        phone: '+84901234567'
      });

      // Step 8: Create final audit log
      createAuditLog('payment_completed', selectedPayment, {
        finalAmount,
        lateFee,
        discount,
        bankReference: bankResponse.bankReference,
        processingTime: Date.now() - parseInt(auditLog.id.slice(-6)),
        receipt: receipt.receiptId
      });

      // Step 9: Show success with detailed information
      const successMessage = `
        ✅ THANH TOÁN THÀNH CÔNG!
        
        📋 Thông tin giao dịch:
        • Mã giao dịch: ${selectedPayment.transactionId}
        • Mã ngân hàng: ${bankResponse.bankReference}
        • Số tiền: ${formatCurrency(finalAmount)}
        ${lateFee > 0 ? `• Phí trễ hạn: ${formatCurrency(lateFee)}` : ''}
        ${discount > 0 ? `• Giảm giá: -${formatCurrency(discount)}` : ''}
        • Phí giao dịch: ${formatCurrency(bankResponse.fee)}
        
        📧 Email xác nhận đã được gửi
        🧾 Biên lai: ${receipt.receiptId}
      `;

      alert(successMessage);
      setShowPaymentModal(false);
      setSelectedPayment(null);

    } catch (error: any) {
      // Enhanced error handling with business context
      console.error('❌ Payment processing failed:', error);
      
      // Create error audit log
      createAuditLog('payment_failed', selectedPayment, {
        error: error.message,
        step: 'processing'
      });

      // Send failure notification
      await sendNotification('payment_failed', selectedPayment, {
        error: error.message
      });

      // Show user-friendly error message
      const errorMessage = `
        ❌ THANH TOÁN KHÔNG THÀNH CÔNG
        
        Lỗi: ${error.message}
        
        📞 Vui lòng liên hệ bộ phận hỗ trợ:
        • Hotline: 1900-xxxx
        • Email: support@carehome.vn
        
        Mã tham chiếu: ${selectedPayment.transactionId}
      `;
      
      alert(errorMessage);
    } finally {
      setIsProcessingPayment(false);
    }
  };

  const getPaymentMethodName = (method: string) => {
    return 'Chuyển khoản ngân hàng';
  };

  // Advanced Business Logic Functions
  const calculateLateFee = (originalAmount: number, dueDate: string, currentDate: string = new Date().toISOString(), lateFeeRate: number = 0.02, gracePeriodDays: number = 5) => {
    const due = new Date(dueDate);
    const current = new Date(currentDate);
    const diffTime = current.getTime() - due.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffDays <= gracePeriodDays) return 0;
    
    const overdueDays = diffDays - gracePeriodDays;
    return Math.floor(originalAmount * lateFeeRate * overdueDays / 100) * 100; // Round to nearest 100
  };

  const calculateEarlyPaymentDiscount = (amount: number, dueDate: string, paymentDate: string) => {
    const due = new Date(dueDate);
    const payment = new Date(paymentDate);
    const diffTime = due.getTime() - payment.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffDays >= 7) return Math.floor(amount * 0.05); // 5% discount for 7+ days early
    if (diffDays >= 3) return Math.floor(amount * 0.02); // 2% discount for 3+ days early
    return 0;
  };

  const getPaymentStatus = (payment: any) => {
    const today = new Date();
    const dueDate = new Date(payment.dueDate);
    const gracePeriodEnd = new Date(dueDate.getTime() + (payment.gracePeriodDays || 5) * 24 * 60 * 60 * 1000);
    
    if (payment.status === 'paid') return 'paid';
    if (payment.status === 'processing') return 'processing';
    if (today > gracePeriodEnd) return 'overdue';
    if (today > dueDate) return 'grace_period';
    return 'pending';
  };

  const generateTransactionId = () => {
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const day = String(now.getDate()).padStart(2, '0');
    const time = String(now.getTime()).slice(-6);
    return `TXN${year}${month}${day}${time}`;
  };

  const validatePaymentAmount = (payment: any, inputAmount: number) => {
    const errors = [];
    
    if (inputAmount <= 0) {
      errors.push('Số tiền phải lớn hơn 0');
    }
    
    if (inputAmount > payment.totalAmount * 2) {
      errors.push('Số tiền vượt quá 200% số tiền cần thanh toán');
    }
    
    return {
      isValid: errors.length === 0,
      errors,
      warnings: inputAmount < payment.totalAmount ? ['Thanh toán một phần sẽ được ghi nhận'] : []
    };
  };

  const createAuditLog = (action: string, payment: any, details: any = {}) => {
    return {
      id: generateTransactionId(),
      action, // payment_initiated, payment_completed, payment_failed, etc.
      paymentId: payment.id,
      transactionId: payment.transactionId,
      userId: user?.id || 'anonymous',
      userRole: user?.role,
      timestamp: new Date().toISOString(),
      details: {
        amount: payment.amount,
        method: paymentMethod,
        ipAddress: '192.168.1.1', // In real app, get from request
        userAgent: navigator.userAgent,
        ...details
      }
    };
  };

  const sendNotification = async (type: string, payment: any, recipient: any) => {
    // In real application, this would call email/SMS service
    const notifications = {
      payment_reminder: {
        subject: `Nhắc nhở thanh toán - ${payment.description}`,
        message: `Kính gửi gia đình, hóa đơn ${payment.invoiceId} đến hạn thanh toán vào ${new Date(payment.dueDate).toLocaleDateString('vi-VN')}. Số tiền: ${formatCurrency(payment.totalAmount)}`
      },
      payment_success: {
        subject: `Xác nhận thanh toán thành công - ${payment.description}`,
        message: `Cảm ơn bạn đã thanh toán thành công. Mã giao dịch: ${payment.transactionId}. Số tiền: ${formatCurrency(payment.amount)}`
      },
      payment_overdue: {
        subject: `Thông báo quá hạn thanh toán - ${payment.description}`,
        message: `Hóa đơn ${payment.invoiceId} đã quá hạn. Phí trễ hạn sẽ được tính thêm. Vui lòng thanh toán sớm nhất có thể.`
      }
    };
    
    console.log(`📧 Sending ${type} notification:`, notifications[type]);
    return Promise.resolve({ success: true, messageId: generateTransactionId() });
  };

  const generateReceipt = (payment: any, resident: any) => {
    return {
      receiptId: `RCP${payment.transactionId}`,
      issueDate: new Date().toISOString(),
      payment: {
        ...payment,
        residentName: resident.residentName,
        contractId: resident.contractId
      },
      totals: {
        originalAmount: payment.originalAmount,
        discount: payment.discount,
        lateFee: payment.lateFee,
        totalAmount: payment.totalAmount,
        paidAmount: payment.amount
      },
      bankDetails: {
        bank: 'Vietcombank',
        accountNumber: '1234567890',
        accountHolder: 'TRUNG TÂM CHĂM SÓC NGƯỜI CAO TUỔI'
      }
    };
  };

  // Get appropriate data based on user role
  const transactions = user?.role === 'family' ? 
    familyFinancialData[selectedResident]?.payments || [] : 
    adminTransactions;

  // Financial summary calculations
  const totalIncome = user?.role === 'family' ? 
    familyFinancialData[selectedResident]?.totalPaid || 0 :
    adminTransactions
      .filter((t: any) => t.category === 'Thu nhập')
      .reduce((sum: number, t: any) => sum + t.amount, 0);
    
  const totalExpenses = user?.role === 'family' ? 
    familyFinancialData[selectedResident]?.totalDue || 0 :
    adminTransactions
      .filter((t: any) => t.category === 'Chi phí')
      .reduce((sum: number, t: any) => sum + t.amount, 0);
    
  const balance = totalIncome - totalExpenses;
  
  // Filter transactions based on search term, category and status
  const filteredTransactions = transactions.filter((transaction: any) => {
    const matchesSearch = transaction.description.toLowerCase().includes(searchTerm.toLowerCase());
    
    // For family role, ignore category filter since payments don't have categories
    const matchesCategory = user?.role === 'family' ? true : 
                           (filterType === 'Tất cả' || transaction.category === filterType);
    const matchesStatus = filterStatus === 'Tất cả' || transaction.status === filterStatus;
    
    return matchesSearch && matchesCategory && matchesStatus;
  });
  
  let content = null;
  if (user?.role === 'family') {
    content = (
      <div style={{
        minHeight: '100vh',
        background: 'linear-gradient(135deg, #f8fafc 0%, #e2e8f0 100%)',
        position: 'relative'
      }}>
        {/* Background decorations */}
        <div style={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: `
            radial-gradient(circle at 20% 80%, rgba(34, 197, 94, 0.05) 0%, transparent 50%),
            radial-gradient(circle at 80% 20%, rgba(239, 68, 68, 0.05) 0%, transparent 50%),
            radial-gradient(circle at 40% 40%, rgba(59, 130, 246, 0.03) 0%, transparent 50%)
          `,
          pointerEvents: 'none'
        }} />
        
        <div style={{
          maxWidth: '1300px', 
          margin: '0 auto', 
          padding: '1.5rem 1rem',
          position: 'relative',
          zIndex: 1
        }}>
          {/* Header Section for Family */}
          <div style={{
            background: 'linear-gradient(135deg, #ffffff 0%, #f8fafc 100%)',
            borderRadius: '1rem',
            padding: '1.5rem',
            marginBottom: '1.5rem',
            boxShadow: '0 4px 12px -2px rgba(0, 0, 0, 0.08)',
            border: '1px solid rgba(255, 255, 255, 0.3)'
          }}>
            <div style={{display: 'flex', alignItems: 'center', gap: '0.875rem'}}>
              <div style={{
                width: '2.75rem',
                height: '2.75rem',
                background: 'linear-gradient(135deg, #16a34a 0%, #15803d 100%)',
                borderRadius: '0.75rem',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                boxShadow: '0 2px 8px rgba(22, 163, 74, 0.25)'
              }}>
                <BanknotesIcon style={{width: '1.5rem', height: '1.5rem', color: 'white'}} />
              </div>
              <div>
                <h1 style={{
                  fontSize: '1.5rem', 
                  fontWeight: 700, 
                  margin: 0,
                  background: 'linear-gradient(135deg, #16a34a 0%, #15803d 100%)',
                  WebkitBackgroundClip: 'text',
                  WebkitTextFillColor: 'transparent',
                  letterSpacing: '-0.025em',
                  lineHeight: 1.2
                }}>
                  Thông tin tài chính
                </h1>
                <p style={{
                  fontSize: '0.875rem',
                  color: '#64748b',
                  margin: '0.125rem 0 0 0',
                  fontWeight: 500
                }}>
                  Theo dõi chi phí chăm sóc người thân
                </p>
              </div>
            </div>
          </div>

          {/* Family Member Selector */}
          <div style={{
            background: 'linear-gradient(135deg, #ffffff 0%, #f8fafc 100%)',
            borderRadius: '1rem',
            padding: '1.25rem',
            marginBottom: '1.5rem',
            boxShadow: '0 4px 12px -2px rgba(0, 0, 0, 0.08)',
            border: '1px solid rgba(255, 255, 255, 0.3)'
          }}>
            <h3 style={{
              fontSize: '0.9rem',
              fontWeight: 600,
              color: '#374151',
              marginBottom: '1rem',
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem'
            }}>
              <UserGroupIcon style={{width: '1.125rem', height: '1.125rem', color: '#8b5cf6'}} />
              Chọn người thân để xem thông tin tài chính
            </h3>
            
            <div style={{display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '1rem'}}>
              {familyFinancialData.map((resident, index) => (
                <div
                  key={resident.id}
                  onClick={() => setSelectedResident(index)}
                  style={{
                    background: selectedResident === index ? '#eff6ff' : 'white',
                    border: selectedResident === index ? '2px solid #3b82f6' : '1px solid #e5e7eb',
                    borderRadius: '12px',
                    padding: '1.5rem',
                    cursor: 'pointer',
                    transition: 'all 0.2s ease',
                    position: 'relative'
                  }}
                >
                  <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start'}}>
                    <div>
                      <h4 style={{fontSize: '1.125rem', fontWeight: 600, color: '#111827', margin: '0 0 0.5rem 0'}}>
                        {resident.residentName}
                      </h4>
                      <p style={{fontSize: '0.875rem', color: '#6b7280', margin: '0 0 1rem 0'}}>
                        {resident.relationship}
                      </p>
                      <div style={{fontSize: '0.875rem', color: '#374151'}}>
                        <p style={{margin: '0 0 0.25rem 0'}}>
                          Phí hàng tháng: <strong>{formatCurrency(resident.monthlyFee)}</strong>
                        </p>
                        <p style={{margin: '0'}}>
                          Còn phải trả: <strong style={{color: resident.totalDue > 0 ? '#dc2626' : '#16a34a'}}>
                            {formatCurrency(resident.totalDue)}
                          </strong>
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Financial Summary for selected resident */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
            gap: '1rem',
            marginBottom: '1.5rem'
          }}>
            <div style={{
              background: 'linear-gradient(135deg, #ffffff 0%, #f8fafc 100%)',
              borderRadius: '1rem',
              padding: '1.5rem',
              boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
              border: '1px solid rgba(34, 197, 94, 0.2)'
            }}>
              <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start'}}>
                <div>
                  <p style={{fontSize: '0.875rem', color: '#6b7280', margin: '0 0 0.5rem 0', fontWeight: 500}}>
                    Đã thanh toán
                  </p>
                  <p style={{fontSize: '1.875rem', fontWeight: 700, color: '#16a34a', margin: 0}}>
                    {formatCurrency(familyFinancialData[selectedResident]?.totalPaid || 0)}
                  </p>
                </div>
                <div style={{
                  width: '3rem',
                  height: '3rem',
                  background: 'rgba(34, 197, 94, 0.1)',
                  borderRadius: '0.75rem',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}>
                  <ArrowTrendingUpIcon style={{width: '1.5rem', height: '1.5rem', color: '#16a34a'}} />
                </div>
              </div>
            </div>

            <div style={{
              background: 'linear-gradient(135deg, #ffffff 0%, #f8fafc 100%)',
              borderRadius: '1rem',
              padding: '1.5rem',
              boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
              border: '1px solid rgba(239, 68, 68, 0.2)'
            }}>
              <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start'}}>
                <div>
                  <p style={{fontSize: '0.875rem', color: '#6b7280', margin: '0 0 0.5rem 0', fontWeight: 500}}>
                    Còn phải trả
                  </p>
                  <p style={{fontSize: '1.875rem', fontWeight: 700, color: '#dc2626', margin: 0}}>
                    {formatCurrency(familyFinancialData[selectedResident]?.totalDue || 0)}
                  </p>
                </div>
                <div style={{
                  width: '3rem',
                  height: '3rem',
                  background: 'rgba(239, 68, 68, 0.1)',
                  borderRadius: '0.75rem',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}>
                  <ArrowTrendingDownIcon style={{width: '1.5rem', height: '1.5rem', color: '#dc2626'}} />
                </div>
              </div>
            </div>

            <div style={{
              background: 'linear-gradient(135deg, #ffffff 0%, #f8fafc 100%)',
              borderRadius: '1rem',
              padding: '1.5rem',
              boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
              border: '1px solid rgba(59, 130, 246, 0.2)'
            }}>
              <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start'}}>
                <div>
                  <p style={{fontSize: '0.875rem', color: '#6b7280', margin: '0 0 0.5rem 0', fontWeight: 500}}>
                    Lần thanh toán tiếp theo
                  </p>
                  <p style={{fontSize: '1.125rem', fontWeight: 600, color: '#3b82f6', margin: 0}}>
                    {new Date(familyFinancialData[selectedResident]?.nextPaymentDate || '').toLocaleDateString('vi-VN')}
                  </p>
                </div>
                <div style={{
                  width: '3rem',
                  height: '3rem',
                  background: 'rgba(59, 130, 246, 0.1)',
                  borderRadius: '0.75rem',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}>
                  <CalendarDaysIcon style={{width: '1.5rem', height: '1.5rem', color: '#3b82f6'}} />
                </div>
              </div>
            </div>


          </div>

          {/* Payment History for Family */}
          <div style={{
            background: 'linear-gradient(135deg, #ffffff 0%, #f8fafc 100%)',
            borderRadius: '1rem',
            padding: '1.25rem',
            boxShadow: '0 4px 12px -2px rgba(0, 0, 0, 0.08)',
            border: '1px solid rgba(255, 255, 255, 0.3)'
          }}>
            <h3 style={{fontSize: '1rem', fontWeight: 600, color: '#111827', marginBottom: '1.25rem'}}>
              Lịch sử thanh toán - {familyFinancialData[selectedResident]?.residentName}
            </h3>

            <div style={{overflowX: 'auto'}}>
              <table style={{width: '100%', borderCollapse: 'collapse'}}>
                <thead>
                  <tr style={{borderBottom: '1px solid #e5e7eb'}}>
                    <th style={{textAlign: 'left', padding: '0.875rem 0.75rem', fontSize: '0.8rem', fontWeight: 600, color: '#374151', width: '25%'}}>
                      Mô tả dịch vụ
                    </th>
                    <th style={{textAlign: 'center', padding: '0.875rem 0.75rem', fontSize: '0.8rem', fontWeight: 600, color: '#374151', width: '12%'}}>
                      Số tiền
                    </th>
                    <th style={{textAlign: 'center', padding: '0.875rem 0.75rem', fontSize: '0.8rem', fontWeight: 600, color: '#374151', width: '12%'}}>
                      Hạn thanh toán
                    </th>
                    <th style={{textAlign: 'center', padding: '0.875rem 0.75rem', fontSize: '0.8rem', fontWeight: 600, color: '#374151', width: '12%'}}>
                      Phương thức
                    </th>
                    <th style={{textAlign: 'center', padding: '0.875rem 0.75rem', fontSize: '0.8rem', fontWeight: 600, color: '#374151', width: '15%'}}>
                      Trạng thái
                    </th>
                    <th style={{textAlign: 'center', padding: '0.875rem 0.75rem', fontSize: '0.8rem', fontWeight: 600, color: '#374151', width: '24%'}}>
                      Thao tác
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {familyFinancialData[selectedResident]?.payments.map((payment) => (
                    <tr key={payment.id} style={{borderBottom: '1px solid #f3f4f6'}}>
                      <td style={{padding: '1rem 0.75rem', fontSize: '0.875rem', color: '#111827'}}>
                        {payment.description}
                      </td>
                      <td style={{padding: '1rem 0.75rem', fontSize: '0.875rem', fontWeight: 600, color: '#111827', textAlign: 'center'}}>
                        {formatCurrency(payment.amount)}
                      </td>
                      <td style={{padding: '1rem 0.75rem', fontSize: '0.875rem'}}>
                        <div style={{display: 'flex', flexDirection: 'column', gap: '0.25rem'}}>
                          <span style={{color: '#111827', fontWeight: 500}}>
                            {new Date(payment.dueDate || payment.date).toLocaleDateString('vi-VN')}
                          </span>
                          {payment.dueDate && new Date(payment.dueDate) < new Date() && payment.status !== 'paid' && (
                            <div style={{
                              fontSize: '0.75rem',
                              color: '#991b1b',
                              fontWeight: 600,
                              background: 'linear-gradient(135deg, #fef2f2 0%, #fee2e2 100%)',
                              padding: '0.375rem 0.75rem',
                              borderRadius: '1rem',
                              border: '1px solid #fecaca',
                              width: 'fit-content',
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: '0.375rem',
                              boxShadow: '0 1px 3px rgba(220, 38, 38, 0.1)',
                              textTransform: 'uppercase',
                              letterSpacing: '0.025em'
                            }}>
                              <XMarkIcon style={{
                                width: '0.875rem', 
                                height: '0.875rem',
                                color: '#dc2626',
                                strokeWidth: 2
                              }} />
                              Quá hạn {Math.ceil((new Date().getTime() - new Date(payment.dueDate).getTime()) / (1000 * 60 * 60 * 24))} ngày
                            </div>
                          )}
                        </div>
                      </td>
                      <td style={{padding: '1rem 0.75rem', fontSize: '0.875rem', textAlign: 'center'}}>
                        <div style={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '0.375rem',
                          padding: '0.25rem 0.75rem',
                          background: '#f3f4f6',
                          borderRadius: '1rem',
                          fontSize: '0.75rem',
                          fontWeight: 500,
                          color: '#374151'
                        }}>
                          <BuildingLibraryIcon style={{width: '0.875rem', height: '0.875rem'}} />
                          Chuyển khoản
                        </div>
                      </td>
                      <td style={{padding: '1rem 0.75rem'}}>
                        {(() => {
                          const status = getPaymentStatus(payment);
                          const statusConfig = {
                            paid: { 
                              text: 'Đã thanh toán', 
                              bg: '#dcfce7', 
                              color: '#166534',
                              icon: <CheckCircleIcon style={{width: '0.875rem', height: '0.875rem'}} />
                            },
                            processing: { 
                              text: 'Đang xử lý', 
                              bg: '#dbeafe', 
                              color: '#1d4ed8',
                              icon: <ClockIcon style={{width: '0.875rem', height: '0.875rem'}} />
                            },
                            pending: { 
                              text: 'Chờ thanh toán', 
                              bg: '#fef3c7', 
                              color: '#d97706',
                              icon: <ClockIcon style={{width: '0.875rem', height: '0.875rem'}} />
                            },
                            grace_period: { 
                              text: 'Trong thời hạn gia hạn', 
                              bg: '#fed7aa', 
                              color: '#ea580c',
                              icon: <ClockIcon style={{width: '0.875rem', height: '0.875rem'}} />
                            },
                            overdue: { 
                              text: 'Quá hạn', 
                              bg: '#fecaca', 
                              color: '#dc2626',
                              icon: <XMarkIcon style={{width: '0.875rem', height: '0.875rem'}} />
                            }
                          };
                          
                          const config = statusConfig[status];
                          
                          return (
                            <div style={{display: 'flex', justifyContent: 'center'}}>
                              <span style={{
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: '0.375rem',
                                padding: '0.5rem 1rem',
                                borderRadius: '1.5rem',
                                fontSize: '0.75rem',
                                fontWeight: 700,
                                background: status === 'overdue' 
                                  ? 'linear-gradient(135deg, #fee2e2 0%, #fecaca 100%)'
                                  : status === 'grace_period'
                                  ? 'linear-gradient(135deg, #fed7aa 0%, #fdba74 100%)'
                                  : config.bg,
                                color: status === 'overdue' 
                                  ? '#991b1b'
                                  : status === 'grace_period'
                                  ? '#9a3412'
                                  : config.color,
                                border: status === 'overdue' 
                                  ? '1.5px solid #f87171'
                                  : status === 'grace_period'
                                  ? '1.5px solid #fb923c'
                                  : `1px solid ${config.color}30`,
                                boxShadow: status === 'overdue' 
                                  ? '0 3px 6px rgba(220, 38, 38, 0.2)'
                                  : status === 'grace_period'
                                  ? '0 3px 6px rgba(234, 88, 12, 0.2)'
                                  : '0 1px 3px rgba(0, 0, 0, 0.1)',
                                textTransform: status === 'overdue' || status === 'grace_period' ? 'uppercase' : 'none',
                                letterSpacing: status === 'overdue' || status === 'grace_period' ? '0.025em' : 'normal',
                                minWidth: '120px',
                                justifyContent: 'center'
                              }}>
                                <span style={{
                                  display: 'flex',
                                  alignItems: 'center',
                                  strokeWidth: status === 'overdue' || status === 'grace_period' ? 2.5 : 2
                                }}>
                                  {config.icon}
                                </span>
                                <span style={{whiteSpace: 'nowrap'}}>
                                  {config.text}
                                  {status === 'overdue' && payment.lateFee > 0 && (
                                    <span style={{
                                      marginLeft: '0.375rem', 
                                      fontSize: '0.625rem',
                                      fontWeight: 800,
                                      color: '#dc2626',
                                      background: '#ffffff',
                                      padding: '0.125rem 0.375rem',
                                      borderRadius: '0.75rem',
                                      border: '1px solid #fca5a5'
                                    }}>
                                      +{formatCurrency(payment.lateFee).replace('.000', 'K')}
                                    </span>
                                  )}
                                </span>
                              </span>
                            </div>
                          );
                        })()}
                      </td>
                      <td style={{padding: '1rem 0.75rem', textAlign: 'center'}}>
                        {(() => {
                          const status = getPaymentStatus(payment);
                          
                          if (status === 'paid') {
                            return (
                              <div style={{display: 'flex', flexDirection: 'column', gap: '0.375rem', alignItems: 'center'}}>
                                <button
                                  onClick={() => handleViewInvoice(payment)}
                                  style={{
                                    display: 'inline-flex',
                                    alignItems: 'center',
                                    gap: '0.375rem',
                                    padding: '0.375rem 0.75rem',
                                    background: 'rgba(59, 130, 246, 0.1)',
                                    color: '#3b82f6',
                                    border: '1px solid rgba(59, 130, 246, 0.3)',
                                    borderRadius: '0.5rem',
                                    fontSize: '0.75rem',
                                    fontWeight: 600,
                                    cursor: 'pointer',
                                    transition: 'all 0.2s ease',
                                    minWidth: '90px'
                                  }}
                                  onMouseOver={(e) => {
                                    e.currentTarget.style.background = 'rgba(59, 130, 246, 0.2)';
                                    e.currentTarget.style.transform = 'translateY(-1px)';
                                  }}
                                  onMouseOut={(e) => {
                                    e.currentTarget.style.background = 'rgba(59, 130, 246, 0.1)';
                                    e.currentTarget.style.transform = 'translateY(0)';
                                  }}
                                >
                                  <EyeIcon style={{width: '0.875rem', height: '0.875rem'}} />
                                  Chi tiết
                                </button>
                                
                                <div style={{
                                  display: 'inline-flex',
                                  alignItems: 'center',
                                  gap: '0.375rem',
                                  padding: '0.25rem 0.75rem',
                                  background: 'rgba(34, 197, 94, 0.1)',
                                  color: '#16a34a',
                                  borderRadius: '0.5rem',
                                  fontSize: '0.75rem',
                                  fontWeight: 600,
                                  border: '1px solid rgba(34, 197, 94, 0.3)'
                                }}>
                                  <CheckCircleIcon style={{width: '0.875rem', height: '0.875rem'}} />
                                  Hoàn thành
                                </div>
                              </div>
                            );
                          }
                          
                          if (status === 'processing') {
                            return (
                              <span style={{
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: '0.375rem',
                                padding: '0.5rem 1rem',
                                background: 'rgba(59, 130, 246, 0.1)',
                                color: '#3b82f6',
                                borderRadius: '0.5rem',
                                fontSize: '0.75rem',
                                fontWeight: 600
                              }}>
                                <div style={{
                                  width: '0.875rem',
                                  height: '0.875rem',
                                  border: '2px solid rgba(59, 130, 246, 0.3)',
                                  borderTop: '2px solid #3b82f6',
                                  borderRadius: '50%',
                                  animation: 'spin 1s linear infinite'
                                }} />
                                Đang xử lý
                              </span>
                            );
                          }
                          
                          if (status === 'pending' || status === 'grace_period' || status === 'overdue') {
                            const isUrgent = status === 'overdue';
                            const isWarning = status === 'grace_period';
                            
                            return (
                              <div style={{display: 'flex', flexDirection: 'column', gap: '0.375rem', alignItems: 'center'}}>
                                <button
                                  onClick={() => handleViewInvoice(payment)}
                                  style={{
                                    display: 'inline-flex',
                                    alignItems: 'center',
                                    gap: '0.375rem',
                                    padding: '0.375rem 0.75rem',
                                    background: 'rgba(59, 130, 246, 0.1)',
                                    color: '#3b82f6',
                                    border: '1px solid rgba(59, 130, 246, 0.3)',
                                    borderRadius: '0.5rem',
                                    fontSize: '0.75rem',
                                    fontWeight: 600,
                                    cursor: 'pointer',
                                    transition: 'all 0.2s ease',
                                    minWidth: '90px'
                                  }}
                                  onMouseOver={(e) => {
                                    e.currentTarget.style.background = 'rgba(59, 130, 246, 0.2)';
                                    e.currentTarget.style.transform = 'translateY(-1px)';
                                  }}
                                  onMouseOut={(e) => {
                                    e.currentTarget.style.background = 'rgba(59, 130, 246, 0.1)';
                                    e.currentTarget.style.transform = 'translateY(0)';
                                  }}
                                >
                                  <EyeIcon style={{width: '0.875rem', height: '0.875rem'}} />
                                  Chi tiết
                                </button>
                                
                                <button
                                  onClick={() => handlePayNow(payment)}
                                  style={{
                                    display: 'inline-flex',
                                    alignItems: 'center',
                                    gap: '0.375rem',
                                    padding: '0.375rem 0.75rem',
                                    background: isUrgent 
                                      ? 'linear-gradient(135deg, #dc2626 0%, #b91c1c 100%)'
                                      : isWarning
                                      ? 'linear-gradient(135deg, #ea580c 0%, #c2410c 100%)'
                                      : 'linear-gradient(135deg, #16a34a 0%, #15803d 100%)',
                                    color: 'white',
                                    border: 'none',
                                    borderRadius: '0.5rem',
                                    fontSize: '0.75rem',
                                    fontWeight: 600,
                                    cursor: 'pointer',
                                    transition: 'all 0.2s ease',
                                    minWidth: '90px'
                                  }}
                                  onMouseOver={(e) => {
                                    e.currentTarget.style.transform = 'translateY(-1px)';
                                  }}
                                  onMouseOut={(e) => {
                                    e.currentTarget.style.transform = 'translateY(0)';
                                  }}
                                >
                                  <BanknotesIcon style={{width: '0.875rem', height: '0.875rem'}} />
                                  {isUrgent ? 'Thanh toán' : 'Thanh toán'}
                                </button>
                              </div>
                            );
                          }
                          
                          return null;
                        })()}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
                  </div>
    );
  } else {
    // Giao diện ADMIN: Quản lý tài chính
    content = (
                <div style={{
        minHeight: '100vh',
        background: 'linear-gradient(135deg, #f8fafc 0%, #e2e8f0 100%)',
        position: 'relative',
        padding: '2rem 0',
                }}>
                  <div style={{
          maxWidth: 1300,
          margin: '0 auto',
          padding: '0 1rem',
        }}>
          {/* Header tổng quan */}
              <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
            gap: '1.5rem',
            marginBottom: '2rem',
          }}>
                <div style={{
              background: 'linear-gradient(135deg, #dcfce7 0%, #bbf7d0 100%)',
              borderRadius: '1rem',
                padding: '1.5rem',
              boxShadow: '0 4px 12px -2px rgba(16,185,129,0.08)',
              border: '1px solid #bbf7d0',
                  display: 'flex',
                  alignItems: 'center',
              gap: '1rem',
                }}>
              <ArrowTrendingUpIcon style={{width: '2rem', height: '2rem', color: '#16a34a'}} />
              <div>
                <div style={{fontSize: '0.95rem', color: '#166534', fontWeight: 600}}>Tổng thu</div>
                <div style={{fontSize: '1.5rem', fontWeight: 700, color: '#166534'}}>{formatCurrency(totalIncome)}</div>
                    </div>
                  </div>
  <div style={{
              background: 'linear-gradient(135deg, #fee2e2 0%, #fecaca 100%)',
              borderRadius: '1rem',
                padding: '1.5rem',
              boxShadow: '0 4px 12px -2px rgba(239,68,68,0.08)',
              border: '1px solid #fecaca',
                  display: 'flex',
                      alignItems: 'center',
              gap: '1rem',
            }}>
              <ArrowTrendingDownIcon style={{width: '2rem', height: '2rem', color: '#dc2626'}} />
              <div>
                <div style={{fontSize: '0.95rem', color: '#dc2626', fontWeight: 600}}>Tổng chi</div>
                <div style={{fontSize: '1.5rem', fontWeight: 700, color: '#dc2626'}}>{formatCurrency(totalExpenses)}</div>
                  </div>
                </div>
          <div style={{
              background: 'linear-gradient(135deg, #dbeafe 0%, #a5b4fc 100%)',
              borderRadius: '1rem',
              padding: '1.5rem',
              boxShadow: '0 4px 12px -2px rgba(59,130,246,0.08)',
              border: '1px solid #a5b4fc',
                display: 'flex',
                alignItems: 'center',
              gap: '1rem',
              }}>
              <ChartBarIcon style={{width: '2rem', height: '2rem', color: '#2563eb'}} />
                  <div>
                <div style={{fontSize: '0.95rem', color: '#2563eb', fontWeight: 600}}>Số dư</div>
                <div style={{fontSize: '1.5rem', fontWeight: 700, color: '#2563eb'}}>{formatCurrency(balance)}</div>
                  </div>
                </div>
              </div>

          {/* Bộ lọc và tìm kiếm */}
                <div style={{
                  display: 'flex',
            flexWrap: 'wrap',
            gap: '1.5rem',
                  alignItems: 'center',
            marginBottom: '1.5rem',
                }}>
            <div style={{display: 'flex', gap: '1rem', alignItems: 'center'}}>
              <label style={{fontWeight: 600, color: '#374151', marginRight: 6}}>Loại giao dịch:</label>
              <select value={filterType} onChange={e => setFilterType(e.target.value)} style={{
                padding: '0.5rem 1rem', borderRadius: '0.5rem', border: '1px solid #e5e7eb', fontSize: '1rem', color: '#374151', background: '#fff', fontWeight: 500
                  }}>
                {categories.map(c => <option key={c} value={c}>{c}</option>)}
              </select>
                </div>
            <div style={{display: 'flex', gap: '1rem', alignItems: 'center'}}>
              <label style={{fontWeight: 600, color: '#374151', marginRight: 6}}>Trạng thái:</label>
              <select value={filterStatus} onChange={e => setFilterStatus(e.target.value)} style={{
                padding: '0.5rem 1rem', borderRadius: '0.5rem', border: '1px solid #e5e7eb', fontSize: '1rem', color: '#374151', background: '#fff', fontWeight: 500
              }}>
                {statuses.map(s => <option key={s} value={s}>{s}</option>)}
              </select>
                    </div>
            <div style={{flex: 1, minWidth: 220, display: 'flex', alignItems: 'center', background: '#fff', borderRadius: '0.5rem', border: '1px solid #e5e7eb', padding: '0.25rem 0.75rem'}}>
              <MagnifyingGlassIcon style={{width: '1.25rem', height: '1.25rem', color: '#64748b', marginRight: 8}} />
              <input
                type="text"
                placeholder="Tìm kiếm giao dịch..."
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
                style={{border: 'none', outline: 'none', fontSize: '1rem', flex: 1, background: 'transparent', color: '#374151'}}
              />
                  </div>
            <Link href="/finance/new-transaction" style={{
              display: 'inline-flex', alignItems: 'center', gap: '0.5rem', background: 'linear-gradient(135deg, #16a34a 0%, #15803d 100%)', color: 'white', padding: '0.75rem 1.25rem', borderRadius: '0.75rem', fontWeight: 600, fontSize: '1rem', boxShadow: '0 4px 12px rgba(22,163,74,0.15)', border: 'none', textDecoration: 'none', transition: 'all 0.2s', marginLeft: 'auto'
            }}>
              <PlusCircleIcon style={{width: '1.25rem', height: '1.25rem'}} /> Thêm giao dịch
            </Link>
              </div>

          {/* Bảng giao dịch */}
              <div style={{
            background: 'linear-gradient(135deg, #fff 0%, #f8fafc 100%)',
                borderRadius: '1rem',
            boxShadow: '0 4px 12px -2px rgba(0,0,0,0.08)',
            border: '1px solid #e5e7eb',
            overflowX: 'auto',
          }}>
            <table style={{width: '100%', borderCollapse: 'collapse', minWidth: 900}}>
              <thead>
                <tr style={{borderBottom: '2px solid #e5e7eb'}}>
                  <th style={{padding: '1rem', fontWeight: 700, color: '#374151', fontSize: '1rem', textAlign: 'left'}}>Mô tả</th>
                  <th style={{padding: '1rem', fontWeight: 700, color: '#374151', fontSize: '1rem'}}>Loại</th>
                  <th style={{padding: '1rem', fontWeight: 700, color: '#374151', fontSize: '1rem'}}>Số tiền</th>
                  <th style={{padding: '1rem', fontWeight: 700, color: '#374151', fontSize: '1rem'}}>Ngày</th>
                  <th style={{padding: '1rem', fontWeight: 700, color: '#374151', fontSize: '1rem'}}>Phương thức</th>
                  <th style={{padding: '1rem', fontWeight: 700, color: '#374151', fontSize: '1rem'}}>Trạng thái</th>
                  <th style={{padding: '1rem', fontWeight: 700, color: '#374151', fontSize: '1rem'}}>Thao tác</th>
                </tr>
              </thead>
              <tbody>
                {filteredTransactions.length === 0 ? (
                  <tr><td colSpan={7} style={{textAlign: 'center', padding: '2rem', color: '#64748b'}}>Không có giao dịch phù hợp.</td></tr>
                ) : filteredTransactions.map((t: any) => (
                  <tr key={t.id} style={{borderBottom: '1px solid #f3f4f6', background: '#fff'}}>
                    <td style={{padding: '1rem', color: '#111827', fontWeight: 500}}>{t.description}</td>
                    <td style={{padding: '1rem', textAlign: 'center'}}>
                      <span style={{
                        display: 'inline-block',
                        padding: '0.375rem 0.75rem',
                        borderRadius: '0.75rem',
                  fontWeight: 600,
                        background: t.category === 'Thu nhập' ? '#dcfce7' : '#fee2e2',
                        color: t.category === 'Thu nhập' ? '#16a34a' : '#dc2626',
                        fontSize: '0.95rem',
                      }}>{t.category}</span>
                    </td>
                    <td style={{padding: '1rem', textAlign: 'right', fontWeight: 700, color: t.category === 'Thu nhập' ? '#16a34a' : '#dc2626'}}>{formatCurrency(t.amount)}</td>
                    <td style={{padding: '1rem', textAlign: 'center', color: '#374151'}}>{new Date(t.date).toLocaleDateString('vi-VN')}</td>
                    <td style={{padding: '1rem', textAlign: 'center', color: '#374151'}}>{t.paymentMethod}</td>
                    <td style={{padding: '1rem', textAlign: 'center'}}>
                      <span style={{
                        display: 'inline-flex',
                  alignItems: 'center',
                        gap: '0.5rem',
                        padding: '0.375rem 0.75rem',
                        borderRadius: '0.75rem',
                    fontWeight: 600,
                        background: t.status === 'Đã xử lý' ? '#dcfce7' : '#fef3c7',
                        color: t.status === 'Đã xử lý' ? '#16a34a' : '#d97706',
                        fontSize: '0.95rem',
                        border: t.status === 'Đã xử lý' ? '1px solid #bbf7d0' : '1px solid #fde68a',
                      }}>
                        {t.status === 'Đã xử lý' ? <CheckCircleIcon style={{width: '1rem', height: '1rem'}} /> : <ClockIcon style={{width: '1rem', height: '1rem'}} />}
                        {t.status}
                      </span>
                    </td>
                    <td style={{padding: '1rem', textAlign: 'center'}}>
                      <div style={{display: 'flex', gap: '0.5rem', justifyContent: 'center'}}>
                        <button onClick={() => handleViewTransaction(t.id)} style={{
                          background: 'linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)', color: 'white', border: 'none', borderRadius: '0.5rem', padding: '0.5rem 1rem', fontWeight: 600, fontSize: '0.95rem', display: 'inline-flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer', boxShadow: '0 2px 8px rgba(59,130,246,0.10)'
                        }}><EyeIcon style={{width: '1rem', height: '1rem'}} />Chi tiết</button>
                        <button onClick={() => handleEditTransaction(t.id)} style={{
                          background: 'linear-gradient(135deg, #fbbf24 0%, #f59e42 100%)', color: '#78350f', border: 'none', borderRadius: '0.5rem', padding: '0.5rem 1rem', fontWeight: 600, fontSize: '0.95rem', display: 'inline-flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer', boxShadow: '0 2px 8px rgba(251,191,36,0.10)'
                        }}><PencilIcon style={{width: '1rem', height: '1rem'}} />Chỉnh sửa</button>
                    </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
                      </div>
                    </div>
    </div>
  );
  }
  return content;
} 
