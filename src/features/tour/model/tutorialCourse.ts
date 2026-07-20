import type { CourseDetailResponse } from '@entities/course';
import type { PreEnrollCourseResponse } from '@features/cart-management';

export const TOUR_KEYWORD = '미시경제이론';
export const TOUR_PRE_ENROLL_ID = 9260720;

export const tutorialCourse: CourseDetailResponse = {
  id: 260720,
  year: 2026,
  semester: 'SPRING',
  classification: '전공선택',
  college: '사회과학대학',
  department: '경제학부',
  academicCourse: '학사',
  academicYear: '2학년',
  courseNumber: 'M1314.000100',
  lectureNumber: '001',
  courseTitle: TOUR_KEYWORD,
  credit: 3,
  instructor: '경제학부',
  placeAndTime: JSON.stringify({
    time: '월(09:30~10:45)/수(09:30~10:45)',
    place: '16동 349호',
  }),
  quota: 60,
  freshmanQuota: 0,
  registrationCount: 59,
};

export const createTutorialPreEnroll = (
  cartCount: number
): PreEnrollCourseResponse => ({
  preEnrollId: TOUR_PRE_ENROLL_ID,
  course: tutorialCourse,
  cartCount,
});

export const getTutorialOverQuotaCount = () => tutorialCourse.quota + 1;
