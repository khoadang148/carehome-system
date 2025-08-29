'use client';

import React, { useEffect, useState, useCallback } from 'react';
import { performanceMonitor } from '@/lib/utils/performance';

interface PerformanceMetrics {
  fps: number;
  memoryUsage: number;
  loadTime: number;
  renderTime: number;
}

interface PerformanceMonitorProps {
  enabled?: boolean;
  showMetrics?: boolean;
  className?: string;
}

const PerformanceMonitor: React.FC<PerformanceMonitorProps> = ({
  enabled = false,
  showMetrics = false,
  className = ''
}) => {
  const [metrics, setMetrics] = useState<PerformanceMetrics>({
    fps: 0,
    memoryUsage: 0,
    loadTime: 0,
    renderTime: 0
  });

  const [isVisible, setIsVisible] = useState(false);

  const measureFPS = useCallback(() => {
    let frameCount = 0;
    let lastTime = performance.now();

    const countFrames = () => {
      frameCount++;
      const currentTime = performance.now();
      
      if (currentTime - lastTime >= 1000) {
        const fps = Math.round((frameCount * 1000) / (currentTime - lastTime));
        setMetrics(prev => ({ ...prev, fps }));
        frameCount = 0;
        lastTime = currentTime;
      }
      
      requestAnimationFrame(countFrames);
    };

    if (enabled) {
      requestAnimationFrame(countFrames);
    }
  }, [enabled]);

  const measureMemory = useCallback(() => {
    if ('memory' in performance) {
      const memory = (performance as any).memory;
      setMetrics(prev => ({
        ...prev,
        memoryUsage: Math.round(memory.usedJSHeapSize / 1024 / 1024)
      }));
    }
  }, []);

  const measureLoadTime = useCallback(() => {
    if (typeof window !== 'undefined') {
      const loadTime = performance.timing.loadEventEnd - performance.timing.navigationStart;
      setMetrics(prev => ({ ...prev, loadTime }));
    }
  }, []);

  const measureRenderTime = useCallback(() => {
    const startTime = performance.now();
    
    return () => {
      const endTime = performance.now();
      const renderTime = endTime - startTime;
      setMetrics(prev => ({ ...prev, renderTime }));
    };
  }, []);

  useEffect(() => {
    if (!enabled) return;

    measureFPS();
    measureLoadTime();

    const memoryInterval = setInterval(measureMemory, 1000);
    const renderTimer = measureRenderTime();

    return () => {
      clearInterval(memoryInterval);
      renderTimer();
    };
  }, [enabled, measureFPS, measureMemory, measureLoadTime, measureRenderTime]);

  useEffect(() => {
    if (!enabled) return;

    const handleKeyPress = (event: KeyboardEvent) => {
      if (event.ctrlKey && event.shiftKey && event.key === 'P') {
        setIsVisible(prev => !prev);
      }
    };

    window.addEventListener('keydown', handleKeyPress);
    return () => window.removeEventListener('keydown', handleKeyPress);
  }, [enabled]);

  if (!enabled || !isVisible) return null;

  const getPerformanceColor = (value: number, thresholds: { good: number; warning: number }) => {
    if (value <= thresholds.good) return 'text-green-500';
    if (value <= thresholds.warning) return 'text-yellow-500';
    return 'text-red-500';
  };

  const getFPSColor = (fps: number) => getPerformanceColor(fps, { good: 50, warning: 30 });
  const getMemoryColor = (memory: number) => getPerformanceColor(memory, { good: 50, warning: 100 });
  const getLoadTimeColor = (loadTime: number) => getPerformanceColor(loadTime, { good: 2000, warning: 5000 });

  return (
    <div className={`fixed top-4 right-4 bg-black bg-opacity-75 text-white p-4 rounded-lg text-xs font-mono z-50 ${className}`}>
      <div className="mb-2 font-bold text-sm">Performance Monitor</div>
      <div className="space-y-1">
        <div className="flex justify-between">
          <span>FPS:</span>
          <span className={getFPSColor(metrics.fps)}>{metrics.fps}</span>
        </div>
        <div className="flex justify-between">
          <span>Memory:</span>
          <span className={getMemoryColor(metrics.memoryUsage)}>{metrics.memoryUsage}MB</span>
        </div>
        <div className="flex justify-between">
          <span>Load Time:</span>
          <span className={getLoadTimeColor(metrics.loadTime)}>{metrics.loadTime}ms</span>
        </div>
        <div className="flex justify-between">
          <span>Render Time:</span>
          <span>{metrics.renderTime.toFixed(2)}ms</span>
        </div>
      </div>
      <div className="mt-2 text-xs text-gray-400">
        Press Ctrl+Shift+P to toggle
      </div>
    </div>
  );
};

export default PerformanceMonitor;
