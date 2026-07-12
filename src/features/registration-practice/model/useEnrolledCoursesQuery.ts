import {useQuery} from '@tanstack/react-query';
import {getEnrolledCoursesApi} from '../api/registrationApi';
import { devEnrolledCourses } from '@shared/mock/devCourses';

export const enrolledCoursesKeys = {
  all: ['enrolledCourses'] as const,
  list: () => [...enrolledCoursesKeys.all, 'list'] as const,
};

export function useEnrolledCoursesQuery() {
  return useQuery({
    queryKey: enrolledCoursesKeys.list(),
    queryFn: async () => {
      if (import.meta.env.DEV) {
        return devEnrolledCourses;
      }

      const response = await getEnrolledCoursesApi();
      return response.data;
    },
  });
}
