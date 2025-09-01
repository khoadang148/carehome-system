'use client';

import React from 'react';

export default function PaymentLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-200 relative">
      <main className="flex-1 relative z-10">
        {children}
      </main>
    </div>
  );
} 