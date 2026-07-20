import { api } from '@shared/api/axios';
import type { TourCompletionRequest, TourStatusResponse } from '../model/types';

export const getTourStatusApi = async () => {
  return api.get<TourStatusResponse>('/api/tour/status');
};

export const completeTourApi = async (data: TourCompletionRequest) => {
  return api.post<void>('/api/tour/completion', data);
};
