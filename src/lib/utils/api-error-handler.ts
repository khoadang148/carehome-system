import { toast } from 'react-toastify';
import { formatErrorMessage } from './error-translations';

export interface APIError {
  response?: {
    status: number;
    data?: {
      detail?: string;
      message?: string;
      error?: string;
    };
  };
  request?: any;
  message?: string;
}

/**
 * Xử lý lỗi API và hiển thị thông báo lỗi bằng tiếng Việt
 * @param error - Lỗi từ API call
 * @param defaultMessage - Thông báo mặc định nếu không thể xác định lỗi
 * @param showToast - Có hiển thị toast notification không (mặc định: true)
 * @returns Thông báo lỗi đã được dịch
 */
export const handleAPIError = (
  error: APIError | any,
  defaultMessage: string = 'Có lỗi xảy ra. Vui lòng thử lại.',
  showToast: boolean = true
): string => {
  let errorMessage = defaultMessage;
  
  // Log lỗi để debug
  console.error('API Error:', error);
  
  // Xử lý lỗi response từ server
  if (error.response) {
    console.error('Error response:', error.response);
    console.error('Error status:', error.response.status);
    console.error('Error data:', error.response.data);
    
    if (error.response.data?.detail) {
      errorMessage = formatErrorMessage(error.response.data.detail);
    } else if (error.response.data?.message) {
      errorMessage = formatErrorMessage(error.response.data.message);
    } else if (error.response.data?.error) {
      errorMessage = formatErrorMessage(error.response.data.error);
    } else {
      // Tạo thông báo lỗi dựa trên status code
      switch (error.response.status) {
        case 400:
          errorMessage = 'Dữ liệu không hợp lệ. Vui lòng kiểm tra lại thông tin.';
          break;
        case 401:
          errorMessage = 'Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại.';
          break;
        case 403:
          errorMessage = 'Bạn không có quyền thực hiện thao tác này.';
          break;
        case 404:
          errorMessage = 'Không tìm thấy dữ liệu yêu cầu.';
          break;
        case 409:
          errorMessage = 'Dữ liệu đã tồn tại trong hệ thống.';
          break;
        case 422:
          errorMessage = 'Dữ liệu không hợp lệ. Vui lòng kiểm tra lại.';
          break;
        case 500:
          errorMessage = 'Lỗi máy chủ. Vui lòng thử lại sau.';
          break;
        case 502:
          errorMessage = 'Máy chủ tạm thời không khả dụng. Vui lòng thử lại sau.';
          break;
        case 503:
          errorMessage = 'Dịch vụ đang bảo trì. Vui lòng thử lại sau.';
          break;
        default:
          errorMessage = `Lỗi ${error.response.status}: ${defaultMessage}`;
      }
    }
  } 
  // Xử lý lỗi network
  else if (error.request) {
    console.error('Error request:', error.request);
    errorMessage = 'Không thể kết nối đến máy chủ. Vui lòng kiểm tra kết nối mạng.';
  } 
  // Xử lý lỗi khác
  else if (error.message) {
    console.error('Error message:', error.message);
    errorMessage = formatErrorMessage(error.message);
  }
  
  // Hiển thị toast notification nếu được yêu cầu
  if (showToast) {
    toast.error(errorMessage);
  }
  
  return errorMessage;
};

/**
 * Xử lý lỗi API và trả về thông báo lỗi (không hiển thị toast)
 * @param error - Lỗi từ API call
 * @param defaultMessage - Thông báo mặc định
 * @returns Thông báo lỗi đã được dịch
 */
export const getErrorMessage = (
  error: APIError | any,
  defaultMessage: string = 'Có lỗi xảy ra. Vui lòng thử lại.'
): string => {
  return handleAPIError(error, defaultMessage, false);
};

/**
 * Xử lý lỗi validation và hiển thị thông báo cụ thể
 * @param error - Lỗi validation
 * @param fieldName - Tên trường bị lỗi
 * @returns Thông báo lỗi đã được format
 */
export const handleValidationError = (
  error: APIError | any,
  fieldName?: string
): string => {
  const errorMessage = handleAPIError(error, 'Dữ liệu không hợp lệ', false);
  
  // Nếu có tên trường, thêm vào thông báo
  if (fieldName) {
    return `${fieldName}: ${errorMessage}`;
  }
  
  return errorMessage;
};

/**
 * Xử lý lỗi upload file
 * @param error - Lỗi upload
 * @returns Thông báo lỗi upload
 */
export const handleUploadError = (error: APIError | any): string => {
  const defaultMessage = 'Tải lên file thất bại. Vui lòng thử lại.';
  return handleAPIError(error, defaultMessage, true);
};

/**
 * Xử lý lỗi authentication
 * @param error - Lỗi authentication
 * @returns Thông báo lỗi authentication
 */
export const handleAuthError = (error: APIError | any): string => {
  const defaultMessage = 'Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại.';
  return handleAPIError(error, defaultMessage, true);
};

/**
 * Xử lý lỗi network
 * @param error - Lỗi network
 * @returns Thông báo lỗi network
 */
export const handleNetworkError = (error: APIError | any): string => {
  const defaultMessage = 'Không thể kết nối đến máy chủ. Vui lòng kiểm tra kết nối mạng.';
  return handleAPIError(error, defaultMessage, true);
};

/**
 * Kiểm tra xem lỗi có phải là lỗi network không
 * @param error - Lỗi cần kiểm tra
 * @returns true nếu là lỗi network
 */
export const isNetworkError = (error: APIError | any): boolean => {
  return !error.response && error.request;
};

/**
 * Kiểm tra xem lỗi có phải là lỗi validation không
 * @param error - Lỗi cần kiểm tra
 * @returns true nếu là lỗi validation
 */
export const isValidationError = (error: APIError | any): boolean => {
  return error.response?.status === 400 || error.response?.status === 422;
};

/**
 * Kiểm tra xem lỗi có phải là lỗi authentication không
 * @param error - Lỗi cần kiểm tra
 * @returns true nếu là lỗi authentication
 */
export const isAuthError = (error: APIError | any): boolean => {
  return error.response?.status === 401 || error.response?.status === 403;
};

/**
 * Kiểm tra xem lỗi có phải là lỗi server không
 * @param error - Lỗi cần kiểm tra
 * @returns true nếu là lỗi server
 */
export const isServerError = (error: APIError | any): boolean => {
  return error.response?.status >= 500;
};
