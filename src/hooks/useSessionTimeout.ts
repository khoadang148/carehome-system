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

    const remainingTime = getRemainingSessionTime();
    
    if (remainingTime <= 0) {
      logout();
      return;
    }

    if (remainingTime > WARNING_TIME) {
      const warningTime = remainingTime - WARNING_TIME;
      warningTimeoutRef.current = setTimeout(() => {
        setShowWarning(true);
        setRemainingTime(WARNING_TIME);
      }, warningTime);
    } else {
      setShowWarning(true);
      setRemainingTime(remainingTime);
    }

    timeoutRef.current = setTimeout(() => {
      logout();
    }, remainingTime);

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

  useEffect(() => {
    if (!user) return;

    const resetSessionTimer = () => {
      const remainingTime = getRemainingSessionTime();
      
      if (remainingTime > 0) {
        extendSessionUtil();
        
        if (timeoutRef.current) {
          clearTimeout(timeoutRef.current);
        }
        if (warningTimeoutRef.current) {
          clearTimeout(warningTimeoutRef.current);
        }

        setShowWarning(false);

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
    extendSessionUtil();
    
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }
    if (warningTimeoutRef.current) {
      clearTimeout(warningTimeoutRef.current);
    }

    setShowWarning(false);

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
    handleLogout,
  };
} 