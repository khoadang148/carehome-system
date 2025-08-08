import { UserRole } from '@/lib/contexts/auth-context';

/**
 * Get the appropriate redirect path based on user role
 */
export const getRoleRedirectPath = (role: UserRole): string => {
  switch (role) {
    case 'family':
      return '/family';
    case 'staff':
      return '/staff';
    case 'admin':
      return '/admin';
    default:
      return '/';
  }
};

/**
 * Redirect user based on their role
 */
export const redirectByRole = (router: any, role: UserRole): void => {
  const redirectPath = getRoleRedirectPath(role);
  router.push(redirectPath);
};

/**
 * Check if current path matches user role
 */
export const isPathForRole = (pathname: string, role: UserRole): boolean => {
  const rolePath = getRoleRedirectPath(role);
  return pathname.startsWith(rolePath);
};

/**
 * Get role from pathname
 */
export const getRoleFromPath = (pathname: string): UserRole | null => {
  if (pathname.startsWith('/family')) return 'family';
  if (pathname.startsWith('/staff')) return 'staff';
  if (pathname.startsWith('/admin')) return 'admin';
  return null;
}; 