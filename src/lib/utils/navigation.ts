import { AppRouterInstance } from 'next/dist/shared/lib/app-router-context.shared-runtime';

/**
 * Utility function to navigate to login page
 * This ensures consistent navigation behavior across the app
 */
export const navigateToLogin = (router: AppRouterInstance) => {
  // Use replace instead of push to prevent back navigation to protected pages
  router.replace('/login');
};

/**
 * Utility function to navigate to login page with push (allows back navigation)
 * Use this when you want to allow users to go back to the previous page
 */
export const pushToLogin = (router: AppRouterInstance) => {
  router.push('/login');
};

/**
 * Redirect user based on their role
 */
export const redirectByRole = (router: AppRouterInstance, role: string) => {
  // Tối ưu: Redirect ngay lập tức, không cần prefetch vì đã preload trước đó
  const targetPath = getTargetPath(role);
  router.push(targetPath);
};

const getTargetPath = (role: string): string => {
  switch (role) {
    case 'admin':
      return '/admin';
    case 'staff':
      return '/staff';
    case 'family':
      return '/family';
    default:
      return '/login';
  }
};

/**
 * Check if current path matches user role
 */
export const isPathForRole = (pathname: string, role: string): boolean => {
  const rolePath = getTargetPath(role);
  return pathname.startsWith(rolePath);
};

/**
 * Get role from pathname
 */
export const getRoleFromPath = (pathname: string): string | null => {
  if (pathname.startsWith('/family')) return 'family';
  if (pathname.startsWith('/staff')) return 'staff';
  if (pathname.startsWith('/admin')) return 'admin';
  return null;
};

/**
 * Preload important pages for better performance
 */
export const preloadImportantPages = (router: AppRouterInstance) => {
  const importantPages = [
    '/admin',
    '/staff', 
    '/family',
    '/profile',
    '/settings'
  ];
  
  // Preload tất cả trang quan trọng
  importantPages.forEach(page => {
    router.prefetch(page);
  });
};

/**
 * Preload pages based on user role
 */
export const preloadRolePages = (router: AppRouterInstance, role: string) => {
  const rolePages = {
    admin: ['/admin'], // Chỉ preload trang chính để tăng tốc
    staff: ['/staff'], 
    family: ['/family']
  };
  
  const pages = rolePages[role as keyof typeof rolePages] || [];
  
  // Tối ưu: Chỉ preload trang chính, các trang khác sẽ load khi cần
  pages.forEach(page => {
    router.prefetch(page);
  });
};
