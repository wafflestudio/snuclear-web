import { api } from '@shared/api/fetch';
import type {
  AdminDbStatsResponse,
  ReactionTimeHistogramResponse,
  DailyStatsResponse,
} from '../model/types';

export const getAdminStatsApi = async () => {
  return await api.get<AdminDbStatsResponse>('/api/admin/stats');
};

export const getReactionTimeHistogramApi = async () => {
  return await api.get<ReactionTimeHistogramResponse>(
    '/api/admin/stats/reaction-times/histogram',
  );
};

export const getDailyStatsApi = async (from: string, to: string) => {
  return await api.get<DailyStatsResponse>('/api/admin/stats/daily', {
    params: { from, to },
  });
};
