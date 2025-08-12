import { toast } from 'react-toastify';

// Utility functions to replace all alert() calls with professional toast notifications

export const showError = (message: string) => {
  toast.error(message);
};

export const showSuccess = (message: string) => {
  toast.success(message);
};

export const showWarning = (message: string) => {
  toast.warning(message);
};

export const showInfo = (message: string) => {
  toast.info(message);
};

// Common error messages
export const commonErrors = {
  fileTooLarge: (maxSize: string) => `File quá lớn. Vui lòng chọn file nhỏ hơn ${maxSize}.`,
  invalidFileType: (allowedTypes: string) => `Chỉ chấp nhận file ${allowedTypes}`,
  networkError: 'Không thể kết nối đến máy chủ. Vui lòng kiểm tra kết nối mạng.',
  generalError: 'Có lỗi xảy ra. Vui lòng thử lại.',
  permissionDenied: 'Bạn không có quyền thực hiện thao tác này.',
  requiredField: (fieldName: string) => `${fieldName} là bắt buộc.`,
  validationError: 'Vui lòng kiểm tra lại thông tin nhập vào.',
  saveError: 'Có lỗi xảy ra khi lưu. Vui lòng thử lại.',
  deleteError: 'Có lỗi xảy ra khi xóa. Vui lòng thử lại.',
  updateError: 'Có lỗi xảy ra khi cập nhật. Vui lòng thử lại.',
  createError: 'Có lỗi xảy ra khi tạo. Vui lòng thử lại.',
  loadError: 'Không thể tải dữ liệu. Vui lòng thử lại.',
  uploadError: 'Có lỗi xảy ra khi tải lên. Vui lòng thử lại.',
  downloadError: 'Có lỗi xảy ra khi tải xuống. Vui lòng thử lại.',
  copyError: 'Không thể sao chép. Vui lòng thử lại.',
  shareError: 'Không thể chia sẻ. Vui lòng thử lại.',
  printError: 'Không thể in. Vui lòng thử lại.',
  paymentError: 'Có lỗi xảy ra khi thanh toán. Vui lòng thử lại.',
  capacityFull: (capacity: number) => `Hoạt động này đã đạt sức chứa tối đa (${capacity} người). Không thể thêm thêm cư dân.`,
  alreadyAssigned: (name: string) => `${name} đã được phân công rồi. Vui lòng chọn khác.`,
  duplicateEntry: 'Thông tin này đã tồn tại trong hệ thống.',
  invalidDate: 'Ngày không hợp lệ.',
  futureDate: 'Ngày không thể trong tương lai.',
  pastDate: 'Ngày không thể trong quá khứ.',
  invalidPhone: 'Số điện thoại không đúng định dạng.',
  invalidEmail: 'Email không đúng định dạng.',
  invalidAge: 'Tuổi không hợp lệ.',
  minLength: (field: string, min: number) => `${field} phải có ít nhất ${min} ký tự.`,
  maxLength: (field: string, max: number) => `${field} không được quá ${max} ký tự.`,
  minValue: (field: string, min: number) => `${field} phải lớn hơn hoặc bằng ${min}.`,
  maxValue: (field: string, max: number) => `${field} phải nhỏ hơn hoặc bằng ${max}.`,
  invalidFormat: (field: string) => `${field} không đúng định dạng.`,
  requiredSelection: (field: string) => `Vui lòng chọn ${field}.`,
  requiredInput: (field: string) => `Vui lòng nhập ${field}.`,
  insufficientData: 'Vui lòng điền đầy đủ thông tin bắt buộc.',
  insufficientLength: (field: string, min: number) => `${field} quá ngắn. Tối thiểu ${min} ký tự.`,
  invalidImage: 'Vui lòng chọn file ảnh hợp lệ (JPG, PNG, GIF)',
  imageTooLarge: (maxSize: string) => `File ảnh quá lớn. Vui lòng chọn file nhỏ hơn ${maxSize}`,
  uploadSuccess: 'Tải lên thành công!',
  updateSuccess: 'Cập nhật thành công!',
  saveSuccess: 'Lưu thành công!',
  deleteSuccess: 'Xóa thành công!',
  createSuccess: 'Tạo thành công!',
  copySuccess: 'Đã sao chép vào clipboard!',
  shareSuccess: 'Đã chia sẻ thành công!',
  printSuccess: 'Đã chuẩn bị để in!',
  paymentSuccess: 'Thanh toán thành công!',
  ratingSuccess: (rating: number) => `⭐ Cảm ơn bạn đã đánh giá ${rating}/5 sao cho dịch vụ của chúng tôi!`,
  userDeleted: (name: string) => `Người dùng ${name} đã được xóa thành công!`,
  accountUpdated: (name: string) => `Đã cập nhật tài khoản ${name} thành công!`,
  serviceApproved: '✅ Đã duyệt gói dịch vụ thành công!',
  serviceRejected: '❌ Đã từ chối gói dịch vụ!',
  serviceExists: 'Cư dân đã có gói này đang hoạt động hoặc chờ duyệt!',
  checkServiceError: 'Không thể kiểm tra gói dịch vụ. Vui lòng thử lại!',
  photoLoadError: 'Không thể tải ảnh. Vui lòng thử lại!',
  paymentLinkError: 'Không lấy được link thanh toán online. Vui lòng thử lại.',
  createPaymentError: 'Không thể tạo link thanh toán. Vui lòng thử lại.',
  loadResidentsError: 'Không thể tải danh sách cư dân tham gia hoạt động này.',
  loadActivityError: 'Không thể tải danh sách người cao tuổi tham gia hoạt động này.',
  noteSaveError: 'Lưu ghi chú thất bại. Vui lòng thử lại!',
  activityUpdateError: 'Có lỗi xảy ra khi cập nhật hoạt động. Vui lòng thử lại.',
  staffAddError: 'Có lỗi xảy ra khi thêm nhân viên. Vui lòng thử lại.',
  noteAddError: 'Có lỗi xảy ra khi thêm ghi chú. Vui lòng thử lại.',
  medicationAddError: 'Có lỗi xảy ra khi thêm thuốc. Vui lòng thử lại.',
  appointmentAddError: 'Có lỗi xảy ra khi đặt lịch hẹn. Vui lòng thử lại.',
  generalAddError: 'Có lỗi xảy ra. Vui lòng thử lại.',
  evaluationSaveError: 'Có lỗi xảy ra khi lưu đánh giá.',
  journalContentTooShort: '⚠️ Nội dung nhật ký quá ngắn.\n\nVui lòng mô tả chi tiết:\n• Tình trạng hiện tại\n• Triệu chứng quan sát\n• Hoạt động thực hiện\n• Phản ứng của người cao tuổi\n\n(Tối thiểu 15 ký tự)',
  journalSaveSuccess: '✅ Nhật ký đã được lưu thành công!',
  journalSaveError: '❌ Có lỗi xảy ra khi lưu nhật ký. Vui lòng thử lại.',
  copyManual: (text: string) => `❌ Không thể copy tự động. Vui lòng copy thủ công:\n\n${text}`,
  avatarUpdateSuccess: 'Cập nhật ảnh đại diện thành công!',
  avatarUpdateError: 'Lỗi khi upload ảnh đại diện!',
  statusUpdateError: 'Cập nhật trạng thái thất bại!',
  uploadSuccessNoUrl: 'Upload ảnh thành công nhưng không nhận được URL!',
  uploadFailed: 'Upload ảnh thất bại!',
  selectResident: 'Vui lòng chọn người cần chăm sóc',
  fillRequiredInfo: 'Vui lòng nhập đầy đủ thông tin bắt buộc!',
  selectStaffAndResidents: 'Vui lòng chọn nhân viên và ít nhất một cư dân',
  invalidStaffId: 'ID nhân viên không hợp lệ',
  invalidResidentId: 'ID cư dân không hợp lệ',
  alreadyAssignedResidents: (names: string) => `Các cư dân sau đã được phân công cho nhân viên này rồi: ${names}. Vui lòng bỏ chọn các cư dân này hoặc chọn nhân viên khác.`,
  residentAlreadyAssigned: (name: string) => `Cư dân ${name} đã được phân công cho nhân viên này rồi. Vui lòng chọn cư dân khác hoặc nhân viên khác.`,
  fillRequiredFields: 'Vui lòng điền đầy đủ thông tin bắt buộc',
  loadAccountError: 'Lỗi khi tải dữ liệu tài khoản!',
  cannotDeleteAdmin: 'Không thể xóa tài khoản admin!',
  deleteAccountError: 'Lỗi khi xóa tài khoản!',
  saveAccountError: 'Lỗi khi lưu tài khoản!',
  deleteRegistrationError: (error: string) => `Không thể xóa đăng ký dịch vụ: ${error}`,
  deleteServiceError: (error: string) => `Không thể xóa gói dịch vụ: ${error}`,
};

// Helper function to show appropriate toast based on message content
export const showAppropriateToast = (message: string) => {
  const lowerMessage = message.toLowerCase();
  
  if (lowerMessage.includes('thành công') || lowerMessage.includes('success') || lowerMessage.includes('✅')) {
    toast.success(message);
  } else if (lowerMessage.includes('cảnh báo') || lowerMessage.includes('warning') || lowerMessage.includes('⚠️')) {
    toast.warning(message);
  } else if (lowerMessage.includes('thông báo') || lowerMessage.includes('info') || lowerMessage.includes('📋') || lowerMessage.includes('⭐')) {
    toast.info(message);
  } else {
    toast.error(message);
  }
};
