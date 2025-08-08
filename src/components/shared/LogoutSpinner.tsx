"use client";

import { useAuth } from '@/lib/contexts/auth-context';

export default function LogoutSpinner() {
  const { isLoggingOut } = useAuth();

  if (!isLoggingOut) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 flex flex-col items-center space-y-4">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        <p className="text-gray-700 font-medium">Đang đăng xuất...</p>
      </div>
    </div>
  );
} 