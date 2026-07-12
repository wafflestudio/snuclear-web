import type { CourseDetailResponse, CourseSearchRequest, CourseSearchResponse } from '@entities/course';
import type { PreEnrollCourseResponse } from '@features/cart-management';

const placeAndTime = (time: string, place: string) =>
  JSON.stringify({ time, place });

export const devCourses: CourseDetailResponse[] = [
  {
    id: 1001,
    year: 2026,
    semester: 'SPRING',
    classification: '전공필수',
    college: '공과대학',
    department: '컴퓨터공학부',
    academicCourse: '학사',
    academicYear: '2학년',
    courseNumber: 'M1522.000100',
    lectureNumber: '001',
    courseTitle: '자료구조',
    credit: 3,
    instructor: '김교수',
    placeAndTime: placeAndTime('월(09:30~10:45)/수(09:30~10:45)', '302동 105호'),
    quota: 60,
    freshmanQuota: 0,
    registrationCount: 57,
  },
  {
    id: 1002,
    year: 2026,
    semester: 'SPRING',
    classification: '전공선택',
    college: '공과대학',
    department: '컴퓨터공학부',
    academicCourse: '학사',
    academicYear: '3학년',
    courseNumber: 'M1522.000200',
    lectureNumber: '001',
    courseTitle: '컴퓨터구조',
    credit: 3,
    instructor: '이교수',
    placeAndTime: placeAndTime('화(11:00~12:15)/목(11:00~12:15)', '301동 203호'),
    quota: 45,
    freshmanQuota: 0,
    registrationCount: 44,
  },
  {
    id: 1003,
    year: 2026,
    semester: 'SPRING',
    classification: '교양',
    college: '자연과학대학',
    department: '수리과학부',
    academicCourse: '학사',
    academicYear: '1학년',
    courseNumber: 'L0444.000100',
    lectureNumber: '002',
    courseTitle: '미적분학 및 연습 1',
    credit: 4,
    instructor: '박교수',
    placeAndTime: placeAndTime('월(13:00~14:15)/수(13:00~14:15)', '25동 110호'),
    quota: 80,
    freshmanQuota: 20,
    registrationCount: 75,
  },
  {
    id: 1004,
    year: 2026,
    semester: 'SPRING',
    classification: '전공선택',
    college: '사회과학대학',
    department: '경제학부',
    academicCourse: '학사',
    academicYear: '2학년',
    courseNumber: 'M1314.000300',
    lectureNumber: '001',
    courseTitle: '경제통계학',
    credit: 3,
    instructor: '최교수',
    placeAndTime: placeAndTime('금(10:00~12:50)', '16동 349호'),
    quota: 50,
    freshmanQuota: 0,
    registrationCount: 49,
  },
];

export const devCartCourses: PreEnrollCourseResponse[] = [
  { preEnrollId: 9001, course: devCourses[0], cartCount: 72 },
  { preEnrollId: 9002, course: devCourses[1], cartCount: 53 },
  { preEnrollId: 9003, course: devCourses[2], cartCount: 41 },
];

export const devEnrolledCourses: CourseDetailResponse[] = [
  devCourses[0],
  devCourses[3],
];

export function getDevCartCourses(overQuotaOnly = false) {
  if (!overQuotaOnly) return devCartCourses;
  return devCartCourses.filter((item) => item.cartCount > item.course.quota);
}

export function getDevCourseSearchResponse(params: CourseSearchRequest): CourseSearchResponse {
  const query = params.query?.trim().toLowerCase() ?? '';
  const filtered = query
    ? devCourses.filter((course) =>
        [
          course.courseTitle,
          course.courseNumber,
          course.lectureNumber,
          course.instructor,
          course.department,
        ]
          .filter(Boolean)
          .some((value) => value!.toLowerCase().includes(query))
      )
    : devCourses;

  const start = params.page * params.size;
  const items = filtered.slice(start, start + params.size);

  return {
    items,
    pageInfo: {
      page: params.page,
      size: params.size,
      totalElements: filtered.length,
      totalPages: Math.ceil(filtered.length / params.size),
      hasNext: start + params.size < filtered.length,
    },
  };
}
