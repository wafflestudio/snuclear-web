import {api} from '@shared/api/fetch';
import type {
  LoginRequest,
  LoginResponse,
  SocialLoginRequest,
  SignupRequest,
  SignupResponse,
} from '../model/types';

export const loginApi = async (data: LoginRequest) => {
  return await api.post<LoginResponse>('/api/auth/login', data);
};

export const logoutApi = async () => {
  return await api.post<void>('/api/auth/logout');
};

export const signupApi = (data: SignupRequest) => {
  return api.post<SignupResponse>('/api/auth/signup', data);
};

export type socialProvider = 'kakao' | 'google';

export const socialLoginApi = (
  provider: socialProvider,
  data: SocialLoginRequest
) => {
  return api.post<LoginResponse>(`/api/auth/${provider}/login`, data);
};
