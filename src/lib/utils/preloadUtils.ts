import { AppRouterInstance } from 'next/dist/shared/lib/app-router-context.shared-runtime';

// Preload các trang quan trọng để tăng tốc độ chuyển trang
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

// Preload trang dựa trên role
export const preloadRolePages = (router: AppRouterInstance, role: string) => {
  const rolePages = {
    admin: ['/admin', '/admin/residents', '/admin/staff-management'],
    staff: ['/staff', '/staff/residents', '/staff/activities'],
    family: ['/family', '/family/finance', '/family/photos']
  };
  
  const pages = rolePages[role as keyof typeof rolePages] || [];
  pages.forEach(page => {
    router.prefetch(page);
  });
};
