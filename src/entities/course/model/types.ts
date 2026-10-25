import type { PageInfo } from '@shared/types';

export type Semester = 'SPRING' | 'SUMMER' | 'FALL' | 'WINTER';

export type VirtualStartTimeOption =
  | 'TIME_08_29_00'
  | 'TIME_08_29_30'
  | 'TIME_08_29_45';

export interface CourseDetailResponse {
  id: number;
  year: number;
  semester: Semester;
  classification?: string;
  college?: string;
  department?: string;
  academicCourse?: string;
  academicYear?: string;
  courseNumber: string;
  lectureNumber: string;
  courseTitle: string;
  credit?: number;
  instructor?: string;
  placeAndTime?: string;
  quota: number;
  freshmanQuota: number;
  registrationCount: number;
}

export type CourseSearchRequest = {
  query?: string;
  courseNumber?: string;
  academicCourse?: string;
  academicYear?: number;
  college?: string;
  department?: string;
  classification?: string;
  page: number;
  size: number;
};

export interface CourseSearchResponse {
  items: CourseDetailResponse[];
  pageInfo: PageInfo;
}
