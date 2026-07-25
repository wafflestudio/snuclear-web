import {useQuery} from '@tanstack/react-query';
import {getEnrolledCoursesApi} from '../api/registrationApi';

export const enrolledCoursesKeys = {
  all: ['enrolledCourses'] as const,
  list: () => [...enrolledCoursesKeys.all, 'list'] as const,
};

export function useEnrolledCoursesQuery() {
  return useQuery({
    queryKey: enrolledCoursesKeys.list(),
    queryFn: async () => {
      const response = await getEnrolledCoursesApi();
      return response.data;
    },
  });
}
