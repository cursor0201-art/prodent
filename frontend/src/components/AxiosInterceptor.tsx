"use client";

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import axios from 'axios';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

export function AxiosInterceptor({ children }: { children: React.ReactNode }) {
  const router = useRouter();

  useEffect(() => {
    const reqInterceptor = axios.interceptors.request.use(
      (config) => {
        const token = localStorage.getItem('access_token');
        if (token && config.url?.startsWith(API_URL)) {
          config.headers['Authorization'] = `Bearer ${token}`;
        }
        return config;
      },
      (error) => Promise.reject(error)
    );

    const resInterceptor = axios.interceptors.response.use(
      (response) => response,
      async (error) => {
        const originalRequest = error.config;
        
        // If the error is 401 and we haven't retried yet and it's not the refresh endpoint itself
        if (error.response?.status === 401 && !originalRequest._retry && !originalRequest.url?.includes('/token/refresh/')) {
          originalRequest._retry = true;
          try {
            const refreshToken = localStorage.getItem('refresh_token');
            if (!refreshToken) {
              throw new Error("No refresh token available");
            }
            
            // Try to refresh the token
            const res = await axios.post(`${API_URL}/api/token/refresh/`, {
              refresh: refreshToken
            });
            
            const newAccessToken = res.data.access;
            localStorage.setItem('access_token', newAccessToken);
            
            // Update the failed request and retry it
            originalRequest.headers['Authorization'] = `Bearer ${newAccessToken}`;
            return axios(originalRequest);
            
          } catch (err) {
            // Refresh failed, logout user
            localStorage.removeItem('access_token');
            localStorage.removeItem('refresh_token');
            localStorage.removeItem('user');
            router.push('/login');
            return Promise.reject(err);
          }
        }
        return Promise.reject(error);
      }
    );

    return () => {
      axios.interceptors.request.eject(reqInterceptor);
      axios.interceptors.response.eject(resInterceptor);
    };
  }, [router]);

  return <>{children}</>;
}
