import { useState, useCallback } from 'react';

// Hook để quản lý lazy loading
export const useLazyLoading = <T>(
  loader: () => Promise<T>,
  initialData: T[] = []
) => {
  const [data, setData] = useState<T[]>(initialData);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loaded, setLoaded] = useState(false);

  const loadData = useCallback(async () => {
    if (loading || loaded) return;

    setLoading(true);
    setError(null);

    try {
      const result = await loader();
      setData(Array.isArray(result) ? result : [result]);
      setLoaded(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Có lỗi xảy ra');
    } finally {
      setLoading(false);
    }
  }, [loader, loading, loaded]);

  const refresh = useCallback(async () => {
    setLoaded(false);
    await loadData();
  }, [loadData]);

  return {
    data,
    loading,
    error,
    loaded,
    loadData,
    refresh
  };
};

// Hook để quản lý conditional loading
export const useConditionalLoading = <T>(
  loader: () => Promise<T>,
  condition: boolean,
  initialData: T[] = []
) => {
  const [data, setData] = useState<T[]>(initialData);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadData = useCallback(async () => {
    if (!condition || loading) return;

    setLoading(true);
    setError(null);

    try {
      const result = await loader();
      setData(Array.isArray(result) ? result : [result]);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Có lỗi xảy ra');
    } finally {
      setLoading(false);
    }
  }, [loader, condition, loading]);

  return {
    data,
    loading,
    error,
    loadData
  };
};
