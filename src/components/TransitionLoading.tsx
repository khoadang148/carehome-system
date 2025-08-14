import React from 'react';
import LoadingSpinner from './LoadingSpinner';

interface TransitionLoadingProps {
  userName?: string;
  destination?: string;
}

export const TransitionLoading: React.FC<TransitionLoadingProps> = ({ 
  userName, 
  destination 
}) => {
  const getDestinationText = (dest?: string) => {
    switch (dest) {
      case '/family':
        return 'Cổng thông tin Gia đình';
      case '/admin':
        return 'Trung tâm Điều hành';
      case '/staff':
        return 'Hệ thống Quản lý Chăm sóc';
      default:
        return 'Trang chính';
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-200 flex items-center justify-center">
      <div className="text-center max-w-md mx-auto px-6">
        <LoadingSpinner size="large" />
        
        <div className="mt-8 space-y-4">
          
          
          {userName && (
            <p className="text-lg text-gray-600">
              Xin chào, <span className="font-semibold text-purple-600">{userName}</span>
            </p>
          )}
          
          <div className="bg-white rounded-xl p-6 shadow-lg border border-gray-200">
            <div className="flex items-center justify-center gap-3 mb-4">
              <div className="w-8 h-8 bg-purple-500 rounded-full flex items-center justify-center">
                <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                </svg>
              </div>
              <span className="text-sm font-medium text-gray-600">
                Đang chuyển đến
              </span>
            </div>
            
            <p className="text-lg font-semibold text-purple-600">
              {getDestinationText(destination)}
            </p>
            
            <p className="text-sm text-gray-500 mt-2">
              Vui lòng chờ trong giây lát...
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TransitionLoading; 