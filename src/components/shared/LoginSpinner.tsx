"use client";

interface LoginSpinnerProps {
  isLoading: boolean;
  message?: string;
}

export default function LoginSpinner({ isLoading, message = "Đang đăng nhập..." }: LoginSpinnerProps) {
  if (!isLoading) return null;

  return (
    <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50 animate-in fade-in duration-200">
      <div className="bg-white rounded-2xl p-6 flex flex-col items-center space-y-4 shadow-2xl border border-white/20 animate-in zoom-in-95 duration-200">
        <div className="relative">
          <div className="w-10 h-10 border-3 border-emerald-200 rounded-full animate-spin"></div>
          <div className="absolute top-0 left-0 w-10 h-10 border-3 border-transparent border-t-emerald-500 rounded-full animate-spin"></div>
        </div>
        <p className="text-gray-700 font-medium text-sm animate-pulse">{message}</p>
      </div>
    </div>
  );
} 