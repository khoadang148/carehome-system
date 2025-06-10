"use client";

import { useAuth } from '@/lib/auth-context';
import { useMemo } from 'react';

export interface PermissionConfig {
  canView: boolean;
  canEdit: boolean;
  canDelete: boolean;
  canCreate: boolean;
}

export const usePermissions = (page?: string) => {
  const { user } = useAuth();
  
  return useMemo(() => {
    if (!user) {
      return {
        canView: false,
        canEdit: false,
        canDelete: false,
        canCreate: false,
        hasAccess: false
      };
    }

    const role = user.role;
    
    // Define permissions based on role and page
    const getPermissions = (): PermissionConfig & { hasAccess: boolean } => {
      switch (role) {
        case 'admin':
          return {
            canView: true,
            canEdit: true,
            canDelete: true,
            canCreate: true,
            hasAccess: true
          };
          
        case 'staff':
          // Staff has limited access
          switch (page) {
            case 'staff':
            case 'permissions':
            case 'settings':
              return {
                canView: false,
                canEdit: false,
                canDelete: false,
                canCreate: false,
                hasAccess: false
              };
            case 'compliance':
              return {
                canView: true,
                canEdit: false,
                canDelete: false,
                canCreate: false,
                hasAccess: true
              };
            default:
              return {
                canView: true,
                canEdit: true,
                canDelete: false,
                canCreate: true,
                hasAccess: true
              };
          }
          
        case 'family':
          // Family has very limited access
          switch (page) {
            case 'family':
            case 'services':
            case 'finance':
              return {
                canView: true,
                canEdit: false,
                canDelete: false,
                canCreate: false,
                hasAccess: true
              };
            default:
              return {
                canView: false,
                canEdit: false,
                canDelete: false,
                canCreate: false,
                hasAccess: false
              };
          }
          
        default:
          return {
            canView: false,
            canEdit: false,
            canDelete: false,
            canCreate: false,
            hasAccess: false
          };
      }
    };

    return getPermissions();
  }, [user, page]);
};

export default usePermissions; 