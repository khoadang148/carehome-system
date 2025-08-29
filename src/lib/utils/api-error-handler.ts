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


export const handleAPIError = (
  error: APIError | any,
  defaultMessage: string = 'Có lỗi xảy ra. Vui lòng thử lại.',
  showToast: boolean = true
): string => {
  let errorMessage = defaultMessage;
  
  
  console.error('API Error:', error);
  
  
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
  
  else if (error.request) {
    console.error('Error request:', error.request);
    errorMessage = 'Không thể kết nối đến máy chủ. Vui lòng kiểm tra kết nối mạng.';
  } 
  
  else if (error.message) {
    console.error('Error message:', error.message);
    errorMessage = formatErrorMessage(error.message);
  }
  
  
  if (showToast) {
    toast.error(errorMessage);
  }
  
  return errorMessage;
};


export const getErrorMessage = (
  error: APIError | any,
  defaultMessage: string = 'Có lỗi xảy ra. Vui lòng thử lại.'
): string => {
  return handleAPIError(error, defaultMessage, false);
};


export const handleValidationError = (
  error: APIError | any,
  fieldName?: string
): string => {
  const errorMessage = handleAPIError(error, 'Dữ liệu không hợp lệ', false);
  
  
  if (fieldName) {
    return `${fieldName}: ${errorMessage}`;
  }
  
  return errorMessage;
};


export const handleUploadError = (error: APIError | any): string => {
  const defaultMessage = 'Tải lên file thất bại. Vui lòng thử lại.';
  return handleAPIError(error, defaultMessage, true);
};


export const handleAuthError = (error: APIError | any): string => {
  const defaultMessage = 'Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại.';
  return handleAPIError(error, defaultMessage, true);
};


export const handleNetworkError = (error: APIError | any): string => {
  const defaultMessage = 'Không thể kết nối đến máy chủ. Vui lòng kiểm tra kết nối mạng.';
  return handleAPIError(error, defaultMessage, true);
};


export const isNetworkError = (error: APIError | any): boolean => {
  return !error.response && error.request;
};


export const isValidationError = (error: APIError | any): boolean => {
  return error.response?.status === 400 || error.response?.status === 422;
};


export const isAuthError = (error: APIError | any): boolean => {
  return error.response?.status === 401 || error.response?.status === 403;
};

    
export const isServerError = (error: APIError | any): boolean => {
  return error.response?.status >= 500;
};
