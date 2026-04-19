import { api } from '@shared/api/fetch';
import type {
  NoticeListResponse,
  NoticeResponse,
  NoticeCreateRequest,
  NoticeUpdateRequest,
} from '../model/types';

export const getNoticesApi = async (page: number, size: number) => {
  return await api.get<NoticeListResponse>('/api/notices', {
    params: { page, size },
  });
};

export const getNoticeDetailApi = async (noticeId: number) => {
  return await api.get<NoticeResponse>(`/api/notices/${noticeId}`);
};

export const createNoticeApi = async (data: NoticeCreateRequest) => {
  return await api.post<NoticeResponse>('/api/notices', data);
};

export const updateNoticeApi = async (noticeId: number, data: NoticeUpdateRequest) => {
  console.log('[noticeApi] PUT /api/notices/' + noticeId, data);
  return await api.put<NoticeResponse>(`/api/notices/${noticeId}`, data);
};

export const deleteNoticeApi = async (noticeId: number) => {
  return await api.delete(`/api/notices/${noticeId}`);
};
