import { useEffect, useRef, useState } from 'react';
import { useAuth } from '@/lib/contexts/auth-context';
import { 
  SESSION_TIMEOUT, 
  WARNING_TIME, 
  extendSession as extendSessionUtil,
  getRemainingSessionTime 
} from '@/lib/utils/session';

export function useSessionTimeout() {
  const { user, logout } = useAuth();
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);
  const warningTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const [showWarning, setShowWarning] = useState(false);
  const [remainingTime, setRemainingTime] = useState(0);

  useEffect(() => {
    if (!user) {
      // Clear timeouts if user is not logged in
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
        timeoutRef.current = null;
      }
      if (warningTimeoutRef.current) {
        clearTimeout(warningTimeoutRef.current);
        warningTimeoutRef.current = null;
      }
      setShowWarning(false);
      return;
    }

    // Get remaining session time
    const remainingTime = getRemainingSessionTime();
    
    if (remainingTime <= 0) {
      // Session has already expired
      logout();
      return;
    }

    // Set warning timeout
    if (remainingTime > WARNING_TIME) {
      const warningTime = remainingTime - WARNING_TIME;
      warningTimeoutRef.current = setTimeout(() => {
        setShowWarning(true);
        setRemainingTime(WARNING_TIME);
      }, warningTime);
    } else {
      // Show warning immediately if less than warning time remains
      setShowWarning(true);
      setRemainingTime(remainingTime);
    }

    // Set timeout for session expiration
    timeoutRef.current = setTimeout(() => {
      logout();
    }, remainingTime);

    // Cleanup function
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
        timeoutRef.current = null;
      }
      if (warningTimeoutRef.current) {
        clearTimeout(warningTimeoutRef.current);
        warningTimeoutRef.current = null;
      }
    };
  }, [user, logout]);

  // Reset session timer on user activity
  useEffect(() => {
    if (!user) return;

    const resetSessionTimer = () => {
      const remainingTime = getRemainingSessionTime();
      
      if (remainingTime > 0) {
        // Extend session
        extendSessionUtil();
        
        // Clear existing timeouts
        if (timeoutRef.current) {
          clearTimeout(timeoutRef.current);
        }
        if (warningTimeoutRef.current) {
          clearTimeout(warningTimeoutRef.current);
        }

        // Hide warning if it was showing
        setShowWarning(false);

        // Set new timeouts
        const newRemainingTime = SESSION_TIMEOUT;
        const warningTime = newRemainingTime - WARNING_TIME;

        warningTimeoutRef.current = setTimeout(() => {
          setShowWarning(true);
          setRemainingTime(WARNING_TIME);
        }, warningTime);

        timeoutRef.current = setTimeout(() => {
          logout();
        }, newRemainingTime);
      }
    };

    // Reset timer on user activity
    const events = ['mousedown', 'mousemove', 'keypress', 'scroll', 'touchstart', 'click'];
    
    events.forEach(event => {
      document.addEventListener(event, resetSessionTimer, true);
    });

    return () => {
      events.forEach(event => {
        document.removeEventListener(event, resetSessionTimer, true);
      });
    };
  }, [user, logout]);

  const extendSession = () => {
    // Extend session using utility function
    extendSessionUtil();
    
    // Clear existing timeouts
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }
    if (warningTimeoutRef.current) {
      clearTimeout(warningTimeoutRef.current);
    }

    // Hide warning
    setShowWarning(false);

    // Set new timeouts
    const newRemainingTime = SESSION_TIMEOUT;
    const warningTime = newRemainingTime - WARNING_TIME;

    warningTimeoutRef.current = setTimeout(() => {
      setShowWarning(true);
      setRemainingTime(WARNING_TIME);
    }, warningTime);

    timeoutRef.current = setTimeout(() => {
      logout();
    }, newRemainingTime);
  };

  const handleLogout = () => {
    logout();
  };

  return {
    showWarning,
    remainingTime,
    extendSession,
    handleLogout
  };
} 