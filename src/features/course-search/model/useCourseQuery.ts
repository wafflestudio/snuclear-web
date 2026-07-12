import {useQuery} from '@tanstack/react-query';
import {searchCoursesApi} from '../api/coursesApi';
import { getDevCourseSearchResponse } from '@shared/mock/devCourses';
import type {CourseSearchRequest} from '@entities/course';

export const courseKeys = {
  all: ['courses'] as const,
  search: (params: CourseSearchRequest) => [...courseKeys.all, 'search', params] as const,
};

export function useCourseSearchQuery(params: CourseSearchRequest, enabled = true) {
  return useQuery({
    queryKey: courseKeys.search(params),
    queryFn: async () => {
      if (import.meta.env.DEV) {
        return getDevCourseSearchResponse(params);
      }

      const response = await searchCoursesApi(params);
      return response.data;
    },
    enabled,
  });
}
