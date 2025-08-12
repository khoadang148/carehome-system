import { AppRouterInstance } from 'next/dist/shared/lib/app-router-context.shared-runtime';

export const redirectByRole = (router: AppRouterInstance, role: string) => {
  // Preload trang đích trước khi redirect
  const targetPath = getTargetPath(role);
  
  // Prefetch để tăng tốc độ chuyển trang
  router.prefetch(targetPath);
  
  // Redirect ngay lập tức
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