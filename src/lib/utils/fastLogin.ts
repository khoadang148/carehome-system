import { clientStorage } from './clientStorage';
import { redirectByRole } from './navigation';

/**
 * Fast login utility - tối ưu hóa quá trình đăng nhập
 */
export const fastLogin = {
  /**
   * Khởi tạo session nhanh chóng
   */
  initializeSession: (token: string, userData: any) => {
    const currentTime = Date.now().toString();
    
    // Lưu token ngay lập tức
    clientStorage.setItem('access_token', token);
    clientStorage.setItem('user', JSON.stringify(userData));
    clientStorage.setItem('session_start', currentTime);
  },

  /**
   * Redirect ngay lập tức sau khi đăng nhập thành công
   */
  redirectImmediately: (router: any, role: string) => {
    // Redirect ngay lập tức, không chờ preload
    redirectByRole(router, role);
  },

  /**
   * Preload trang trong background
   */
  preloadInBackground: (router: any, role: string) => {
    // Preload trong background để không block UI
    setTimeout(() => {
      const rolePages = {
        admin: ['/admin'],
        staff: ['/staff'], 
        family: ['/family']
      };
      
      const pages = rolePages[role as keyof typeof rolePages] || [];
      pages.forEach(page => {
        router.prefetch(page);
      });
    }, 100);
  },

  /**
   * Xử lý đăng nhập hoàn chỉnh
   */
  handleLogin: (router: any, token: string, userData: any, role: string) => {
    // 1. Khởi tạo session ngay lập tức
    fastLogin.initializeSession(token, userData);
    
    // 2. Lưu thông báo thành công để hiển thị modal
    clientStorage.setItem('login_success', userData.name || userData.email || 'bạn');
    
    // 3. Redirect ngay lập tức
    fastLogin.redirectImmediately(router, role);
    
    // 4. Preload trong background
    fastLogin.preloadInBackground(router, role);
  }
}; 