import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useQueryClient } from '@tanstack/react-query';
import { AuthContext, TimerContext, type User, logoutApi, useAuth } from '@features/auth';
import { setAuthToken, clearAuthToken } from '@shared/api/fetch';

const MAX_LOGIN_TIME = 10 * 60;

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const queryClient = useQueryClient();
  const [user, setUser] = useState<User | null>(() => {
    const storedUser = sessionStorage.getItem('userInfo');
    if (!storedUser) return null;
    try {
      return JSON.parse(storedUser) as User;
    } catch {
      sessionStorage.removeItem('userInfo');
      return null;
    }
  });

  const login = (userData: User, accessToken: string) => {
    setUser(userData);
    sessionStorage.setItem('userInfo', JSON.stringify(userData));
    setAuthToken(accessToken);
  };

  const logout = useCallback(async () => {
    try {
      await logoutApi();
    } catch (error) {
      console.error('[AuthProvider] Logout API failed:', error);
    } finally {
      setUser(null);
      sessionStorage.removeItem('userInfo');
      clearAuthToken();
      queryClient.clear();
    }
  }, [queryClient]);

  return (
    <AuthContext.Provider value={{ user, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function TimerProvider({ children }: { children: React.ReactNode }) {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, logout } = useAuth();

  const timeLeftRef = useRef<number>(MAX_LOGIN_TIME);
  const [timeLeft, setTimeLeft] = useState<number>(MAX_LOGIN_TIME);
  const prevLocationRef = useRef(location.pathname);

  const extendLogin = useCallback(() => {
    if (user) {
      timeLeftRef.current = MAX_LOGIN_TIME;
      setTimeLeft(MAX_LOGIN_TIME);
    }
  }, [user]);

  useEffect(() => {
    if (!user) return;

    timeLeftRef.current = MAX_LOGIN_TIME;

    const timer = setInterval(() => {
      // 페이지 이동 시 타이머 리셋 (location 변경 감지)
      if (prevLocationRef.current !== location.pathname) {
        prevLocationRef.current = location.pathname;
        timeLeftRef.current = MAX_LOGIN_TIME;
      }

      timeLeftRef.current -= 1;
      const currentTime = timeLeftRef.current;

      if (currentTime <= 0) {
        clearInterval(timer);
        setTimeLeft(0);
        logout();
        navigate('/');
        return;
      }

      setTimeLeft(currentTime);
    }, 1000);

    return () => clearInterval(timer);
  }, [user, logout, navigate, location.pathname]);

  return (
    <TimerContext.Provider value={{ timeLeft, extendLogin }}>
      {children}
    </TimerContext.Provider>
  );
}
