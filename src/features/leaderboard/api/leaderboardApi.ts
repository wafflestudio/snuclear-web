import {api} from '@shared/api/fetch';
import type {LeaderboardResponse, MyLeaderboardResponse, LeaderboardRequest} from '../model/types';

export const getLeaderboardApi = async ({page, size}: LeaderboardRequest) => {
  return await api.get<LeaderboardResponse>('/api/leaderboard', {
    params: {page, size},
  });
};

export const getWeeklyLeaderboardApi = async ({page, size}: LeaderboardRequest) => {
  return await api.get<LeaderboardResponse>('/api/leaderboard/weekly', {
    params: {page, size},
  });
};

export const getMyLeaderboardApi = async () => {
  return await api.get<MyLeaderboardResponse>('/api/leaderboard/me');
};

export const getMyWeeklyLeaderboardApi = async () => {
  return await api.get<MyLeaderboardResponse>('/api/leaderboard/weekly/me');
};
