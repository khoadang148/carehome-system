"use client";

import { Suspense, lazy, ComponentType } from 'react';
import LoadingSpinner from './shared/LoadingSpinner';

interface LazyPageProps {
  fallback?: React.ReactNode;
}

// Higher-order component để lazy load pages
export function withLazyLoading<T extends object>(
  importFunc: () => Promise<{ default: ComponentType<T> }>,
  fallback?: React.ReactNode
) {
  const LazyComponent = lazy(importFunc);

  return function LazyWrapper(props: T) {
    return (
      <Suspense fallback={fallback || <LoadingSpinner />}>
        <LazyComponent {...props} />
      </Suspense>
    );
  };
}

// Component wrapper cho lazy loading
export default function LazyPage({ 
  children, 
  fallback 
}: LazyPageProps & { children: React.ReactNode }) {
  return (
    <Suspense fallback={fallback || <LoadingSpinner />}>
      {children}
    </Suspense>
  );
}
