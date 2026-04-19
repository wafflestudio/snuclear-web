import { api } from "@shared/api/fetch";
import type {
  CourseSearchRequest,
  CourseSearchResponse,
} from "@entities/course";

export const searchCoursesApi = async (
  params: CourseSearchRequest,
) => {
  return await api.get<CourseSearchResponse>(
    "/api/courses/search",
    {
      params,
    },
  );
};
