import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  getAutoSyncStatusApi,
  runCourseSyncApi,
  enableAutoSyncApi,
  disableAutoSyncApi,
  getEnrollmentPeriodApi,
  updateEnrollmentPeriodApi,
  getSugangPeriodApi,
  runSugangPeriodSyncApi,
  enableSugangPeriodAutoSyncApi,
  disableSugangPeriodAutoSyncApi,
  getSugangPeriodAutoSyncStatusApi,
} from '../api/courseSyncApi';
import type { CourseSyncRunRequest, EnrollmentPeriodUpdateRequest } from './types';

export const courseSyncKeys = {
  all: ['courseSync'] as const,
  status: () => [...courseSyncKeys.all, 'status'] as const,
};

export function useAutoSyncStatusQuery() {
  return useQuery({
    queryKey: courseSyncKeys.status(),
    queryFn: async () => {
      const response = await getAutoSyncStatusApi();
      return response.data;
    },
    retry: false,
  });
}

export function useRunSyncMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: CourseSyncRunRequest) => runCourseSyncApi(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: courseSyncKeys.all });
    },
  });
}

export function useToggleAutoSyncMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (enable: boolean) => {
      if (enable) {
        return await enableAutoSyncApi();
      } else {
        return await disableAutoSyncApi();
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: courseSyncKeys.all });
    },
  });
}

export const enrollmentPeriodKeys = {
  all: ['enrollmentPeriod'] as const,
};

export function useEnrollmentPeriodQuery() {
  return useQuery({
    queryKey: enrollmentPeriodKeys.all,
    queryFn: async () => {
      const response = await getEnrollmentPeriodApi();
      return response.data;
    },
    retry: false,
  });
}

export function useUpdateEnrollmentPeriodMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: EnrollmentPeriodUpdateRequest) => updateEnrollmentPeriodApi(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: enrollmentPeriodKeys.all });
    },
  });
}

// SugangPeriod (수강신청 기간 동기화) hooks
export const sugangPeriodKeys = {
  all: ['sugangPeriod'] as const,
  data: () => [...sugangPeriodKeys.all, 'data'] as const,
  syncStatus: () => [...sugangPeriodKeys.all, 'syncStatus'] as const,
};

export function useSugangPeriodQuery() {
  return useQuery({
    queryKey: sugangPeriodKeys.data(),
    queryFn: async () => {
      const response = await getSugangPeriodApi();
      return response.data;
    },
    staleTime: 1000 * 60 * 30,
  });
}

export function useSugangPeriodSyncStatusQuery() {
  return useQuery({
    queryKey: sugangPeriodKeys.syncStatus(),
    queryFn: async () => {
      const response = await getSugangPeriodAutoSyncStatusApi();
      return response.data;
    },
    retry: false,
  });
}

export function useRunSugangPeriodSyncMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: () => runSugangPeriodSyncApi(),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: sugangPeriodKeys.all });
    },
  });
}

export function useToggleSugangPeriodAutoSyncMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (enable: boolean) => {
      if (enable) {
        return await enableSugangPeriodAutoSyncApi();
      } else {
        return await disableSugangPeriodAutoSyncApi();
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: sugangPeriodKeys.all });
    },
  });
}
