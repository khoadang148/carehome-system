"use client";

import { Fragment, useState, useEffect } from 'react';
import { Menu, Transition } from '@headlessui/react';
import { UserCircleIcon, HomeIcon } from '@heroicons/react/24/outline';
import { useAuth } from '@/lib/contexts/auth-context';
import { useRouter } from 'next/navigation';
import ClientOnly from '@/components/ClientOnly';

export default function Header() {
  const { user, logout, loading, isLoggingOut } = useAuth();
  const router = useRouter();
  const [mounted, setMounted] = useState(false);
  
  useEffect(() => {
    setMounted(true);
  }, []);
  
  const handleLogout = () => {
    // Immediate logout for better UX
    logout();
  };

  const handleLogin = () => {
    router.push('/login');
  };

  const handleProfileClick = () => {
    router.push('/profile');
  };

  const handleSettingsClick = () => {
    router.push('/settings');
  };

  return (
    <header className="bg-gradient-to-r from-blue-500 to-purple-600 border-b border-white/10 h-18 flex items-center justify-between px-8 shadow-lg backdrop-blur-sm sticky top-0 z-30 flex-shrink-0">
      {/* Logo/Brand area */}
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 bg-gradient-to-br from-white to-gray-50 rounded-xl flex items-center justify-center shadow-md">
          <HomeIcon className="w-6 h-6 text-blue-500" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-white m-0 tracking-tight">
            Viện Dưỡng Lão
          </h1>
          <p className="text-xs text-white/80 m-0 font-medium">
            Chăm sóc tận tâm
          </p>
        </div>
      </div>
      
      <div className="flex items-center gap-5">
        {!mounted ? (
          <div className="flex items-center gap-2 px-5 py-2.5 rounded-lg bg-white/10 text-white">
            <div className="w-4.5 h-4.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            Loading...
          </div>
        ) : loading ? (
          <div className="flex items-center gap-2 px-5 py-2.5 rounded-lg bg-white/10 text-white">
            <div className="w-4.5 h-4.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            Loading...
          </div>
        ) : !user ? (
          <button 
            onClick={handleLogin}
            className="flex items-center gap-2 bg-gradient-to-br from-white to-gray-50 text-blue-500 px-5 py-2.5 rounded-lg border-none font-semibold cursor-pointer shadow-md transition-all duration-200 text-sm hover:shadow-lg hover:-translate-y-0.5"
          >
            <UserCircleIcon className="w-4.5 h-4.5" />
            Đăng nhập
          </button>
        ) : (
          <Menu as="div" className="relative">
            <Menu.Button
              className="bg-white/15 p-0 w-10 h-10 rounded-full border border-white/20 cursor-pointer flex items-center justify-center hover:bg-white/20 transition-colors"
              title="Tài khoản cá nhân"
            >
              <UserCircleIcon className="w-6 h-6 text-white" />
            </Menu.Button>

            <Transition
              as={Fragment}
              enter="transition ease-out duration-100"
              enterFrom="transform opacity-0 scale-95"
              enterTo="transform opacity-100 scale-100"
              leave="transition ease-in duration-75"
              leaveFrom="transform opacity-100 scale-100"
              leaveTo="transform opacity-0 scale-95"
            >
              <Menu.Items className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-xl p-2 z-50">
                <Menu.Item>
                  {({ active }) => (
                    <button
                      onClick={handleProfileClick}
                      className={`w-full text-left p-3 rounded-md cursor-pointer text-sm text-gray-600 border-none ${
                        active ? 'bg-gray-50' : 'bg-transparent'
                      }`}
                    >
                      Thông tin cá nhân
                    </button>
                  )}
                </Menu.Item>

                <Menu.Item>
                  {({ active }) => (
                    <button
                      onClick={handleSettingsClick}
                      className={`w-full text-left p-3 rounded-md cursor-pointer text-sm text-gray-600 border-none ${
                        active ? 'bg-gray-50' : 'bg-transparent'
                      }`}
                    >
                      Cài đặt
                    </button>
                  )}
                </Menu.Item>

                <div className="p-2 border-t border-gray-200">
                  <Menu.Item>
                    {({ active }) => (
                      <button
                        onClick={handleLogout}
                        className={`w-full text-left p-3 rounded-md cursor-pointer text-sm text-red-600 border-none ${
                          active ? 'bg-red-50' : 'bg-red-50'
                        }`}
                      >
                        {isLoggingOut ? (
                          <div className="flex items-center gap-2 text-red-600">
                            <div className="w-4 h-4 border-2 border-red-300 border-t-red-600 rounded-full animate-spin" />
                            Đang đăng xuất...
                          </div>
                        ) : (
                          'Đăng xuất'
                        )}
                      </button>
                    )}
                  </Menu.Item>
                </div>
              </Menu.Items>
            </Transition>
          </Menu>
        )}
      </div>
    </header>
  );
} 
