import {api} from '@shared/api/fetch';
import type {
  PreEnrollAddRequest,
  PreEnrollCourseResponse,
  PreEnrollUpdateCartCountRequest,
} from '../model/types';

export const getPreEnrollsApi = async (overQuotaOnly = false) => {
  return await api.get<PreEnrollCourseResponse[]>('/api/pre-enrolls', {
    params: {overQuotaOnly},
  });
};

export const addPreEnrollApi = async (data: PreEnrollAddRequest) => {
  return await api.post<PreEnrollCourseResponse>('/api/pre-enrolls', data);
};

export const updateCartCountApi = async (
  courseId: number,
  data: PreEnrollUpdateCartCountRequest
) => {
  return await api.patch<PreEnrollCourseResponse>(
    `/api/pre-enrolls/${courseId}/cart-count`,
    data
  );
};

export const deletePreEnrollApi = async (courseId: number) => {
  return await api.delete<void>(`/api/pre-enrolls/${courseId}`);
};
