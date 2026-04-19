import { api } from '@shared/api/fetch';
import type {
  CourseSyncRunRequest,
  CourseSyncRunResponse,
  CourseSyncAutoStatusResponse,
  EnrollmentPeriodResponse,
  EnrollmentPeriodUpdateRequest,
  SugangPeriodResponse,
  SugangPeriodSyncStatusResponse,
} from '../model/types';

export const runCourseSyncApi = async (data: CourseSyncRunRequest) => {
  return await api.post<CourseSyncRunResponse>('/api/courses/course-sync/run', data);
};

export const enableAutoSyncApi = async () => {
  return await api.post('/api/courses/course-sync/auto/enable');
};

export const disableAutoSyncApi = async () => {
  return await api.post('/api/courses/course-sync/auto/disable');
};

export const getAutoSyncStatusApi = async () => {
  return await api.get<CourseSyncAutoStatusResponse>('/api/courses/course-sync/auto');
};

export const getEnrollmentPeriodApi = async () => {
  return await api.get<EnrollmentPeriodResponse>('/api/admin/enrollment-period');
};

export const updateEnrollmentPeriodApi = async (data: EnrollmentPeriodUpdateRequest) => {
  return await api.put<EnrollmentPeriodResponse>('/api/admin/enrollment-period', data);
};

// SugangPeriod (수강신청 기간 동기화) APIs
export const getSugangPeriodApi = async () => {
  return await api.get<SugangPeriodResponse>('/api/v1/syncwithsite/sugang-period');
};

export const runSugangPeriodSyncApi = async () => {
  return await api.post('/api/v1/syncwithsite/run');
};

export const enableSugangPeriodAutoSyncApi = async () => {
  return await api.post('/api/v1/syncwithsite/auto/enable');
};

export const disableSugangPeriodAutoSyncApi = async () => {
  return await api.post('/api/v1/syncwithsite/auto/disable');
};

export const getSugangPeriodAutoSyncStatusApi = async () => {
  return await api.get<SugangPeriodSyncStatusResponse>('/api/v1/syncwithsite/auto');
};
