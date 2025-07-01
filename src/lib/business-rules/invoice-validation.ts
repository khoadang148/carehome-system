// Business Rules for Invoice Validation and Compliance
export interface InvoiceValidationResult {
  isValid: boolean;
  errors: string[];
  warnings: string[];
  complianceChecks: ComplianceCheck[];
  auditTrail: AuditEntry[];
}

export interface ComplianceCheck {
  id: string;
  name: string;
  status: 'passed' | 'failed' | 'warning';
  description: string;
  required: boolean;
  timestamp: string;
}

export interface AuditEntry {
  id: string;
  action: string;
  timestamp: string;
  userId: string;
  userRole: string;
  details: any;
  ipAddress?: string;
}

export interface InvoiceData {
  id: string;
  invoiceId: string;
  transactionId: string;
  description: string;
  amount: number;
  originalAmount: number;
  lateFee: number;
  discount: number;
  totalAmount: number;
  dueDate: string;
  paidDate?: string;
  status: string;
  method?: string;
  bankReference?: string;
  verificationStatus: string;
  paymentType: string;
  createdAt: string;
  updatedAt: string;
  residentId: string;
  contractId: string;
}

export interface ResidentData {
  id: string;
  residentName: string;
  contractId: string;
  monthlyFee: number;
  contractStartDate: string;
  lateFeeRate: number;
  gracePeriodDays: number;
  additionalServices: any[];
}

// Business Rules Constants
export const BUSINESS_RULES = {
  // Tax Compliance
  VAT_RATE: 0.10, // 10% VAT
  MIN_INVOICE_AMOUNT: 100000, // 100,000 VND
  MAX_INVOICE_AMOUNT: 1000000000, // 1 billion VND
  
  // Payment Rules
  MAX_LATE_FEE_RATE: 0.05, // 5% per day maximum
  MIN_GRACE_PERIOD: 3, // 3 days minimum
  MAX_GRACE_PERIOD: 15, // 15 days maximum
  
  // Compliance Rules
  REQUIRED_FIELDS: [
    'invoiceId', 'transactionId', 'description', 'amount', 
    'dueDate', 'residentId', 'contractId'
  ],
  
  // Audit Requirements
  AUDIT_RETENTION_DAYS: 2555, // 7 years
  MAX_AUDIT_ENTRIES: 1000,
  
  // Legal Requirements
  LEGAL_ENTITY_NAME: 'TRUNG TÂM CHĂM SÓC NGƯỜI CAO TUỔI',
  TAX_CODE: '0123456789',
  BUSINESS_LICENSE: 'GP123456789',
  ADDRESS: '123 Đường ABC, Quận XYZ, TP.HCM',
  PHONE: '1900-xxxx',
  EMAIL: 'support@carehome.vn'
};

// Core Validation Functions
export function validateInvoice(invoice: InvoiceData, resident: ResidentData): InvoiceValidationResult {
  const result: InvoiceValidationResult = {
    isValid: true,
    errors: [],
    warnings: [],
    complianceChecks: [],
    auditTrail: []
  };

  // 1. Required Fields Validation
  validateRequiredFields(invoice, result);
  
  // 2. Amount Validation
  validateAmounts(invoice, result);
  
  // 3. Date Validation
  validateDates(invoice, result);
  
  // 4. Business Logic Validation
  validateBusinessLogic(invoice, resident, result);
  
  // 5. Compliance Checks
  performComplianceChecks(invoice, resident, result);
  
  // 6. Legal Requirements
  validateLegalRequirements(invoice, result);
  
  // 7. Audit Trail
  createAuditTrail(invoice, result);

  return result;
}

function validateRequiredFields(invoice: InvoiceData, result: InvoiceValidationResult): void {
  BUSINESS_RULES.REQUIRED_FIELDS.forEach(field => {
    if (!invoice[field as keyof InvoiceData]) {
      result.errors.push(`Thiếu thông tin bắt buộc: ${field}`);
      result.isValid = false;
    }
  });

  result.complianceChecks.push({
    id: 'required_fields',
    name: 'Kiểm tra thông tin bắt buộc',
    status: result.errors.length === 0 ? 'passed' : 'failed',
    description: result.errors.length === 0 ? 'Tất cả thông tin bắt buộc đã được cung cấp' : 'Thiếu thông tin bắt buộc',
    required: true,
    timestamp: new Date().toISOString()
  });
}

function validateAmounts(invoice: InvoiceData, result: InvoiceValidationResult): void {
  // Check minimum amount
  if (invoice.amount < BUSINESS_RULES.MIN_INVOICE_AMOUNT) {
    result.errors.push(`Số tiền hóa đơn phải tối thiểu ${formatCurrency(BUSINESS_RULES.MIN_INVOICE_AMOUNT)}`);
    result.isValid = false;
  }

  // Check maximum amount
  if (invoice.amount > BUSINESS_RULES.MAX_INVOICE_AMOUNT) {
    result.errors.push(`Số tiền hóa đơn không được vượt quá ${formatCurrency(BUSINESS_RULES.MAX_INVOICE_AMOUNT)}`);
    result.isValid = false;
  }

  // Validate total calculation
  const calculatedTotal = invoice.originalAmount + invoice.lateFee - invoice.discount;
  if (Math.abs(calculatedTotal - invoice.totalAmount) > 100) { // Allow 100 VND tolerance
    result.errors.push('Tổng tiền không khớp với tính toán (số tiền gốc + phí trễ hạn - giảm giá)');
    result.isValid = false;
  }

  // Check late fee calculation
  if (invoice.lateFee > 0) {
    const maxLateFee = invoice.originalAmount * BUSINESS_RULES.MAX_LATE_FEE_RATE;
    if (invoice.lateFee > maxLateFee) {
      result.warnings.push(`Phí trễ hạn vượt quá mức tối đa cho phép (${formatCurrency(maxLateFee)})`);
    }
  }

  result.complianceChecks.push({
    id: 'amount_validation',
    name: 'Kiểm tra số tiền',
    status: result.errors.length === 0 ? 'passed' : 'failed',
    description: 'Kiểm tra tính hợp lệ của số tiền hóa đơn',
    required: true,
    timestamp: new Date().toISOString()
  });
}

function validateDates(invoice: InvoiceData, result: InvoiceValidationResult): void {
  const now = new Date();
  const dueDate = new Date(invoice.dueDate);
  const createdAt = new Date(invoice.createdAt);
  const updatedAt = new Date(invoice.updatedAt);

  // Check if due date is in the future
  if (dueDate <= createdAt) {
    result.errors.push('Hạn thanh toán phải sau ngày tạo hóa đơn');
    result.isValid = false;
  }

  // Check if updated date is after created date
  if (updatedAt < createdAt) {
    result.errors.push('Ngày cập nhật không thể trước ngày tạo');
    result.isValid = false;
  }

  // Check if paid date is valid (if exists)
  if (invoice.paidDate) {
    const paidDate = new Date(invoice.paidDate);
    if (paidDate < createdAt) {
      result.errors.push('Ngày thanh toán không thể trước ngày tạo hóa đơn');
      result.isValid = false;
    }
    if (paidDate > now) {
      result.warnings.push('Ngày thanh toán trong tương lai - cần xác minh');
    }
  }

  result.complianceChecks.push({
    id: 'date_validation',
    name: 'Kiểm tra ngày tháng',
    status: result.errors.length === 0 ? 'passed' : 'failed',
    description: 'Kiểm tra tính hợp lệ của các ngày tháng',
    required: true,
    timestamp: new Date().toISOString()
  });
}

function validateBusinessLogic(invoice: InvoiceData, resident: ResidentData, result: InvoiceValidationResult): void {
  // Check grace period compliance
  if (resident.gracePeriodDays < BUSINESS_RULES.MIN_GRACE_PERIOD) {
    result.warnings.push(`Thời hạn gia hạn (${resident.gracePeriodDays} ngày) dưới mức tối thiểu (${BUSINESS_RULES.MIN_GRACE_PERIOD} ngày)`);
  }

  if (resident.gracePeriodDays > BUSINESS_RULES.MAX_GRACE_PERIOD) {
    result.warnings.push(`Thời hạn gia hạn (${resident.gracePeriodDays} ngày) vượt mức tối đa (${BUSINESS_RULES.MAX_GRACE_PERIOD} ngày)`);
  }

  // Check late fee rate
  if (resident.lateFeeRate > BUSINESS_RULES.MAX_LATE_FEE_RATE) {
    result.errors.push(`Tỷ lệ phí trễ hạn (${resident.lateFeeRate * 100}%) vượt quá mức tối đa (${BUSINESS_RULES.MAX_LATE_FEE_RATE * 100}%)`);
    result.isValid = false;
  }

  // Validate contract relationship
  if (invoice.contractId !== resident.contractId) {
    result.errors.push('Mã hợp đồng không khớp với thông tin người được chăm sóc');
    result.isValid = false;
  }

  result.complianceChecks.push({
    id: 'business_logic',
    name: 'Kiểm tra logic nghiệp vụ',
    status: result.errors.length === 0 ? 'passed' : 'warning',
    description: 'Kiểm tra các quy tắc nghiệp vụ',
    required: true,
    timestamp: new Date().toISOString()
  });
}

function performComplianceChecks(invoice: InvoiceData, resident: ResidentData, result: InvoiceValidationResult): void {
  // Tax compliance
  const hasVAT = invoice.totalAmount >= 20000000; // Invoices over 20M VND must have VAT
  if (hasVAT) {
    result.complianceChecks.push({
      id: 'vat_compliance',
      name: 'Tuân thủ thuế GTGT',
      status: 'passed',
      description: 'Hóa đơn tuân thủ quy định thuế GTGT',
      required: true,
      timestamp: new Date().toISOString()
    });
  }

  // Payment verification
  if (invoice.verificationStatus === 'verified') {
    result.complianceChecks.push({
      id: 'payment_verification',
      name: 'Xác minh thanh toán',
      status: 'passed',
      description: 'Thanh toán đã được xác minh',
      required: true,
      timestamp: new Date().toISOString()
    });
  } else {
    result.complianceChecks.push({
      id: 'payment_verification',
      name: 'Xác minh thanh toán',
      status: 'warning',
      description: 'Chờ xác minh thanh toán',
      required: false,
      timestamp: new Date().toISOString()
    });
  }

  // Legal compliance
  result.complianceChecks.push({
    id: 'legal_compliance',
    name: 'Tuân thủ pháp luật',
    status: 'passed',
    description: 'Hóa đơn tuân thủ các quy định pháp luật hiện hành',
    required: true,
    timestamp: new Date().toISOString()
  });
}

function validateLegalRequirements(invoice: InvoiceData, result: InvoiceValidationResult): void {
  // Check invoice format
  if (!invoice.invoiceId.match(/^INV-\d{6,}$/)) {
    result.warnings.push('Định dạng mã hóa đơn không theo chuẩn (INV-XXXXXX)');
  }

  // Check transaction ID format
  if (!invoice.transactionId.match(/^TXN\d{12,}$/)) {
    result.warnings.push('Định dạng mã giao dịch không theo chuẩn (TXNXXXXXXXXXX)');
  }

  // Validate bank reference (if exists)
  if (invoice.bankReference && !invoice.bankReference.match(/^[A-Z]{3,4}\d{10,}$/)) {
    result.warnings.push('Định dạng mã giao dịch ngân hàng không hợp lệ');
  }

  result.complianceChecks.push({
    id: 'legal_format',
    name: 'Định dạng pháp lý',
    status: result.warnings.length === 0 ? 'passed' : 'warning',
    description: 'Kiểm tra định dạng theo quy định pháp luật',
    required: true,
    timestamp: new Date().toISOString()
  });
}

function createAuditTrail(invoice: InvoiceData, result: InvoiceValidationResult): void {
  const auditEntries: AuditEntry[] = [
    {
      id: generateAuditId(),
      action: 'invoice_validation',
      timestamp: new Date().toISOString(),
      userId: 'system',
      userRole: 'validator',
      details: {
        invoiceId: invoice.invoiceId,
        validationResult: result.isValid,
        errorCount: result.errors.length,
        warningCount: result.warnings.length
      },
      ipAddress: '192.168.1.1' // In real app, get from request
    }
  ];

  result.auditTrail = auditEntries;
}

// Utility Functions
export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('vi-VN', { 
    style: 'currency', 
    currency: 'VND',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0
  }).format(amount);
}

function generateAuditId(): string {
  return `AUDIT-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
}

// Business Rules for Payment Processing
export function validatePaymentProcessing(invoice: InvoiceData, paymentAmount: number): {
  isValid: boolean;
  errors: string[];
  warnings: string[];
  lateFee: number;
  discount: number;
  finalAmount: number;
} {
  const result = {
    isValid: true,
    errors: [] as string[],
    warnings: [] as string[],
    lateFee: 0,
    discount: 0,
    finalAmount: paymentAmount
  };

  // Validate payment amount
  if (paymentAmount <= 0) {
    result.errors.push('Số tiền thanh toán phải lớn hơn 0');
    result.isValid = false;
  }

  if (paymentAmount > invoice.totalAmount * 1.1) { // Allow 10% overpayment
    result.errors.push('Số tiền thanh toán vượt quá 110% số tiền hóa đơn');
    result.isValid = false;
  }

  // Calculate late fee if overdue
  const now = new Date();
  const dueDate = new Date(invoice.dueDate);
  const gracePeriodEnd = new Date(dueDate.getTime() + 5 * 24 * 60 * 60 * 1000); // 5 days grace period

  if (now > gracePeriodEnd && invoice.status !== 'paid') {
    const overdueDays = Math.ceil((now.getTime() - gracePeriodEnd.getTime()) / (1000 * 60 * 60 * 24));
    result.lateFee = Math.floor(invoice.originalAmount * 0.02 * overdueDays / 100) * 100; // 2% per day, rounded to 100
  }

  // Calculate early payment discount
  if (now < dueDate) {
    const earlyDays = Math.ceil((dueDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
    if (earlyDays >= 7) {
      result.discount = Math.floor(invoice.originalAmount * 0.05); // 5% discount for 7+ days early
    } else if (earlyDays >= 3) {
      result.discount = Math.floor(invoice.originalAmount * 0.02); // 2% discount for 3+ days early
    }
  }

  result.finalAmount = invoice.originalAmount + result.lateFee - result.discount;

  return result;
}

// Export business rules for use in components
export { BUSINESS_RULES }; 