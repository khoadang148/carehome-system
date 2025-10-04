"use client";

import React, { useState, useRef, useEffect, useCallback } from 'react';
import Image from 'next/image';

interface PerformanceOptimizedImageProps {
  src: string;
  alt: string;
  width?: number;
  height?: number;
  className?: string;
  priority?: boolean;
  fallbackSrc?: string;
  quality?: number;
  placeholder?: 'blur' | 'empty';
  blurDataURL?: string;
  onLoad?: () => void;
  onError?: () => void;
  lazy?: boolean;
  sizes?: string;
}

export default function PerformanceOptimizedImage({
  src,
  alt,
  width = 400,
  height = 300,
  className = '',
  priority = false,
  fallbackSrc = '/default-avatar.svg',
  quality = 75, // Giảm quality để tăng tốc load
  placeholder = 'blur',
  blurDataURL,
  onLoad,
  onError,
  lazy = true,
  sizes = "(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw",
}: PerformanceOptimizedImageProps) {
  const [isLoading, setIsLoading] = useState(true);
  const [hasError, setHasError] = useState(false);
  const [imageSrc, setImageSrc] = useState(src);
  const [isInView, setIsInView] = useState(!lazy);
  const imgRef = useRef<HTMLImageElement>(null);
  const observerRef = useRef<IntersectionObserver | null>(null);

  // Intersection Observer để lazy load
  useEffect(() => {
    if (!lazy || isInView) return;

    const element = imgRef.current;
    if (!element) return;

    observerRef.current = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsInView(true);
          observerRef.current?.disconnect();
        }
      },
      {
        threshold: 0.1,
        rootMargin: '50px',
      }
    );

    observerRef.current.observe(element);

    return () => {
      observerRef.current?.disconnect();
    };
  }, [lazy, isInView]);

  // Update image source when src changes
  useEffect(() => {
    setImageSrc(src);
    setIsLoading(true);
    setHasError(false);
  }, [src]);

  const handleLoad = useCallback(() => {
    setIsLoading(false);
    onLoad?.();
  }, [onLoad]);

  const handleError = useCallback(() => {
    if (imageSrc !== fallbackSrc) {
      setImageSrc(fallbackSrc);
      setHasError(true);
    } else {
      setIsLoading(false);
      setHasError(true);
    }
    onError?.();
  }, [imageSrc, fallbackSrc, onError]);

  // Generate blur data URL if not provided
  const generateBlurDataURL = useCallback((w: number, h: number) => {
    const canvas = document.createElement('canvas');
    canvas.width = w;
    canvas.height = h;
    const ctx = canvas.getContext('2d');
    if (ctx) {
      ctx.fillStyle = '#f3f4f6';
      ctx.fillRect(0, 0, w, h);
    }
    return canvas.toDataURL();
  }, []);

  if (!src) {
    return (
      <div
        className={`bg-gray-200 flex items-center justify-center ${className}`}
        style={{ width, height }}
      >
        <span className="text-gray-400 text-sm">No image</span>
      </div>
    );
  }

  const shouldLoad = !lazy || isInView;
  const finalBlurDataURL = blurDataURL || (placeholder === 'blur' ? generateBlurDataURL(width, height) : undefined);

  return (
    <div className={`relative overflow-hidden ${className}`} style={{ width, height }}>
      {isLoading && shouldLoad && (
        <div className="absolute inset-0 bg-gray-200 animate-pulse flex items-center justify-center">
          <div className="w-8 h-8 border-4 border-gray-300 border-t-blue-600 rounded-full animate-spin"></div>
        </div>
      )}

      {shouldLoad ? (
        <Image
          ref={imgRef}
          src={imageSrc}
          alt={alt}
          width={width}
          height={height}
          className={`transition-opacity duration-300 ${
            isLoading ? 'opacity-0' : 'opacity-100'
          }`}
          priority={priority}
          loading={priority ? 'eager' : 'lazy'}
          quality={quality}
          placeholder={placeholder}
          blurDataURL={finalBlurDataURL}
          onLoad={handleLoad}
          onError={handleError}
          sizes={sizes}
        />
      ) : (
        <div
          ref={imgRef}
          className="bg-gray-200 flex items-center justify-center"
          style={{ width, height }}
        >
          <div className="w-8 h-8 border-4 border-gray-300 border-t-blue-600 rounded-full animate-spin"></div>
        </div>
      )}

      {hasError && imageSrc === fallbackSrc && (
        <div className="absolute inset-0 bg-gray-100 flex items-center justify-center">
          <span className="text-gray-400 text-xs">Image unavailable</span>
        </div>
      )}
    </div>
  );
}

// Memoized version để tránh re-render không cần thiết
export const MemoizedPerformanceOptimizedImage = React.memo(PerformanceOptimizedImage);
