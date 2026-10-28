import { useState, useEffect, useCallback } from 'react';
import api from '../config/api';

export const useAPI = (endpoint, options = {}) => {
  const [data, setData] = useState(options.defaultValue ?? null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetch = useCallback(async (params = {}) => {
    setLoading(true);
    setError(null);
    try {
      const res = await api.get(endpoint, { params });
      setData(res.data);
      return res.data;
    } catch (err) {
      setError(err.response?.data?.detail || err.message);
    } finally {
      setLoading(false);
    }
  }, [endpoint]);

  useEffect(() => {
    if (options.skip) { setLoading(false); return; }
    fetch(options.params);
  }, []);

  return { data, loading, error, refetch: fetch };
};

export const usePost = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const post = useCallback(async (endpoint, payload) => {
    setLoading(true);
    setError(null);
    try {
      const res = await api.post(endpoint, payload);
      return { success: true, data: res.data };
    } catch (err) {
      const msg = err.response?.data?.detail || err.message;
      setError(msg);
      return { success: false, error: msg };
    } finally {
      setLoading(false);
    }
  }, []);

  return { post, loading, error };
};
