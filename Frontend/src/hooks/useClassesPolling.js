import { useState, useEffect, useCallback, useRef } from 'react';
import { admissionClient } from '../services/admissionClient';

/**
 * Polls the classes endpoint every few seconds to keep seat numbers updated
 * in real-time without reloading the page (§1.5).
 */
export function useClassesPolling(intervalMs = 4000) {
  const [classes, setClasses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState(null);
  const [lastUpdated, setLastUpdated] = useState(null);

  const isMountedRef = useRef(true);

  const fetchClasses = useCallback(async (isManual = false) => {
    if (isManual) {
      setRefreshing(true);
    }
    try {
      const data = await admissionClient.getClasses();
      if (isMountedRef.current) {
        setClasses(Array.isArray(data) ? data : []);
        setError(null);
        setLastUpdated(new Date());
      }
    } catch (err) {
      if (isMountedRef.current) {
        console.error('Error fetching classes:', err);
        setError(err.message || 'ক্লাসের তথ্য লোড করা যায়নি');
      }
    } finally {
      if (isMountedRef.current) {
        setLoading(false);
        if (isManual) {
          setRefreshing(false);
        }
      }
    }
  }, []);

  useEffect(() => {
    isMountedRef.current = true;
    fetchClasses();

    const intervalId = setInterval(() => {
      fetchClasses(false);
    }, intervalMs);

    return () => {
      isMountedRef.current = false;
      clearInterval(intervalId);
    };
  }, [fetchClasses, intervalMs]);

  return {
    classes,
    loading,
    refreshing,
    error,
    lastUpdated,
    refresh: () => fetchClasses(true),
  };
}

