import {api} from '@shared/api/fetch';
import type {
  CourseDetailResponse,
  PracticeStartRequest,
  PracticeStartResponse,
  PracticeEndResponse,
  PracticeAttemptRequest,
  PracticeAttemptResponse,
} from '../model/types';

export const practiceStartApi = async (data?: PracticeStartRequest) => {
  return await api.post<PracticeStartResponse>('/api/practice/start', data);
};

export const practiceEndApi = async () => {
  return await api.post<PracticeEndResponse>('/api/practice/end');
};

export const practiceAttemptApi = async (data: PracticeAttemptRequest) => {
  return await api.post<PracticeAttemptResponse>('/api/practice/attempt', data);
};

export const getEnrolledCoursesApi = async () => {
  return await api.get<CourseDetailResponse[]>('/api/practice/enrolled-courses');
};
