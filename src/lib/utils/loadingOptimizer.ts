/**
 * Loading Optimizer - Tối ưu hóa loading state để giảm thời gian chờ
 */
export const loadingOptimizer = {
  /**
   * Giảm thời gian loading tối thiểu để tránh flash
   */
  minLoadingTime: 300, // 300ms thay vì chờ hoàn toàn

  /**
   * Loading với thời gian tối thiểu
   */
  async withMinLoading<T>(
    loadingFn: () => Promise<T>,
    setLoading: (loading: boolean) => void
  ): Promise<T> {
    const startTime = Date.now();
    
    setLoading(true);
    
    try {
      const result = await loadingFn();
      
      // Đảm bảo loading ít nhất minLoadingTime
      const elapsed = Date.now() - startTime;
      if (elapsed < this.minLoadingTime) {
        await new Promise(resolve => 
          setTimeout(resolve, this.minLoadingTime - elapsed)
        );
      }
      
      return result;
    } finally {
      setLoading(false);
    }
  },

  /**
   * Loading nhanh - không có thời gian tối thiểu
   */
  async fastLoading<T>(
    loadingFn: () => Promise<T>,
    setLoading: (loading: boolean) => void
  ): Promise<T> {
    setLoading(true);
    
    try {
      return await loadingFn();
    } finally {
      setLoading(false);
    }
  },

  /**
   * Loading với timeout
   */
  async withTimeout<T>(
    loadingFn: () => Promise<T>,
    setLoading: (loading: boolean) => void,
    timeout: number = 5000
  ): Promise<T> {
    setLoading(true);
    
    try {
      const timeoutPromise = new Promise<never>((_, reject) => {
        setTimeout(() => reject(new Error('Timeout')), timeout);
      });
      
      return await Promise.race([loadingFn(), timeoutPromise]);
    } finally {
      setLoading(false);
    }
  }
}; 