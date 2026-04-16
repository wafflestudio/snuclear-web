import { api } from '@shared/api/fetch';
import type {
  CourseSyncRunRequest,
  CourseSyncRunResponse,
  CourseSyncAutoStatusResponse,
  EnrollmentPeriodResponse,
  EnrollmentPeriodUpdateRequest,
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
