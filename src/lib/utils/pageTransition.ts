// Page transition performance monitoring and optimization

interface TransitionMetrics {
  startTime: number;
  endTime?: number;
  duration?: number;
  destination: string;
  userRole: string;
}

class PageTransitionMonitor {
  private static instance: PageTransitionMonitor;
  private transitions: Map<string, TransitionMetrics> = new Map();
  private observers: PerformanceObserver[] = [];

  static getInstance(): PageTransitionMonitor {
    if (!PageTransitionMonitor.instance) {
      PageTransitionMonitor.instance = new PageTransitionMonitor();
    }
    return PageTransitionMonitor.instance;
  }

  startTransition(destination: string, userRole: string): string {
    const transitionId = `transition_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    this.transitions.set(transitionId, {
      startTime: performance.now(),
      destination,
      userRole
    });

    // Mark navigation start
    if (performance.mark) {
      performance.mark(`navigation-start-${transitionId}`);
    }

    console.log(`🚀 Starting transition to ${destination} for ${userRole}`);
    return transitionId;
  }

  endTransition(transitionId: string): void {
    const transition = this.transitions.get(transitionId);
    if (!transition) return;

    transition.endTime = performance.now();
    transition.duration = transition.endTime - transition.startTime;

    // Mark navigation end
    if (performance.mark) {
      performance.mark(`navigation-end-${transitionId}`);
      performance.measure(`navigation-${transitionId}`, 
        `navigation-start-${transitionId}`, 
        `navigation-end-${transitionId}`
      );
    }

    console.log(`✅ Transition completed in ${transition.duration.toFixed(2)}ms`);

    // Log slow transitions
    if (transition.duration > 3000) {
      console.warn(`⚠️ Slow transition detected: ${transition.duration.toFixed(2)}ms to ${transition.destination}`);
    }

    // Clean up old transitions
    this.cleanup();
  }

  getTransitionMetrics(transitionId: string): TransitionMetrics | undefined {
    return this.transitions.get(transitionId);
  }

  getAverageTransitionTime(destination?: string): number {
    const transitions = Array.from(this.transitions.values());
    const filtered = destination 
      ? transitions.filter(t => t.destination === destination)
      : transitions;
    
    if (filtered.length === 0) return 0;
    
    const total = filtered.reduce((sum, t) => sum + (t.duration || 0), 0);
    return total / filtered.length;
  }

  private cleanup(): void {
    const now = Date.now();
    const maxAge = 5 * 60 * 1000; // 5 minutes

    for (const [id, transition] of this.transitions.entries()) {
      if (transition.endTime && (now - transition.endTime) > maxAge) {
        this.transitions.delete(id);
      }
    }
  }

  // Preload optimization
  preloadDestination(destination: string): void {
    // Preload critical resources for the destination
    const preloadLinks = [
      { rel: 'prefetch', href: destination },
      { rel: 'dns-prefetch', href: destination }
    ];

    preloadLinks.forEach(link => {
      const linkElement = document.createElement('link');
      Object.assign(linkElement, link);
      document.head.appendChild(linkElement);
    });

    console.log(`🔗 Preloading ${destination}`);
  }

  // Optimize based on user role
  optimizeForRole(userRole: string): void {
    const optimizations = {
      family: () => {
        // Preload family-specific resources
        this.preloadDestination('/family');
        this.preloadDestination('/family/photos');
        this.preloadDestination('/family/schedule-visit');
      },
      admin: () => {
        // Preload admin-specific resources
        this.preloadDestination('/admin');
        this.preloadDestination('/admin/staff-management');
        this.preloadDestination('/admin/room-management');
      },
      staff: () => {
        // Preload staff-specific resources
        this.preloadDestination('/staff');
        this.preloadDestination('/staff/vital-signs');
        this.preloadDestination('/staff/residents');
      }
    };

    const optimization = optimizations[userRole as keyof typeof optimizations];
    if (optimization) {
      optimization();
    }
  }
}

// Export singleton instance
export const pageTransitionMonitor = PageTransitionMonitor.getInstance();

// Utility functions for page transitions
export const optimizePageTransition = (destination: string, userRole: string): string => {
  // Start monitoring
  const transitionId = pageTransitionMonitor.startTransition(destination, userRole);
  
  // Apply optimizations
  pageTransitionMonitor.optimizeForRole(userRole);
  pageTransitionMonitor.preloadDestination(destination);
  
  return transitionId;
};

export const completePageTransition = (transitionId: string): void => {
  pageTransitionMonitor.endTransition(transitionId);
};

// Hook for React components
export const usePageTransition = () => {
  const startTransition = (destination: string, userRole: string) => {
    return optimizePageTransition(destination, userRole);
  };

  const endTransition = (transitionId: string) => {
    completePageTransition(transitionId);
  };

  return { startTransition, endTransition };
}; 