import type { Semester } from '@entities/course';
import {
  SNUTT_MESSAGE_TYPE,
  type SnuttFullTimetable,
  type SnuttLecture,
  type SnuttSemester,
  type SnuttTimetableMessage,
} from './types';

/**
 * 현재 서비스가 대상으로 하는 학기.
 * 헤더의 "2026-1학기" 표기와 동일해야 한다 (widgets/header/Header.tsx).
 */
export const TARGET_YEAR = 2026;
export const TARGET_SEMESTER: Semester = 'SPRING';

/** SNUTT 숫자 학기 → 우리 문자열 학기 (3이 2학기=FALL인 점 주의) */
const SEMESTER_MAP: Record<SnuttSemester, Semester> = {
  1: 'SPRING',
  2: 'SUMMER',
  3: 'FALL',
  4: 'WINTER',
};

const SEMESTER_LABEL: Record<Semester, string> = {
  SPRING: '1학기',
  SUMMER: '여름학기',
  FALL: '2학기',
  WINTER: '겨울학기',
};

export function toSemester(snuttSemester: SnuttSemester): Semester {
  return SEMESTER_MAP[snuttSemester];
}

export function formatSemester(year: number, semester: Semester): string {
  return `${year}-${SEMESTER_LABEL[semester]}`;
}

/** 우리 서비스가 다루는 학기의 시간표인지 */
export function isTargetSemester(timetable: SnuttFullTimetable): boolean {
  return (
    timetable.year === TARGET_YEAR &&
    toSemester(timetable.semester) === TARGET_SEMESTER
  );
}

/** SNU 원본 교과목번호/분반을 가진 강의만 우리 DB와 매칭할 수 있다 */
export function hasCourseIdentifier(
  lecture: SnuttLecture
): lecture is SnuttLecture & { course_number: string; lecture_number: string } {
  return Boolean(lecture.course_number && lecture.lecture_number);
}

/**
 * postMessage 이벤트 데이터가 SNUTT 시간표 메시지인지 검증한다.
 * origin 검증은 호출부에서 별도로 수행한다.
 */
export function isSnuttTimetableMessage(
  data: unknown
): data is SnuttTimetableMessage {
  if (typeof data !== 'object' || data === null) return false;

  const message = data as Record<string, unknown>;
  if (message.type !== SNUTT_MESSAGE_TYPE) return false;

  const payload = message.payload as Record<string, unknown> | undefined;
  if (typeof payload !== 'object' || payload === null) return false;

  return (
    typeof payload.year === 'number' &&
    typeof payload.semester === 'number' &&
    Array.isArray(payload.lecture_list)
  );
}

/** 요일 인덱스(0=월) → 라벨 */
const DAY_LABEL = ['월', '화', '수', '목', '금', '토', '일'];

function formatMinute(minute: number): string {
  const hour = Math.floor(minute / 60);
  const min = minute % 60;
  return `${String(hour).padStart(2, '0')}:${String(min).padStart(2, '0')}`;
}

/** SNUTT 강의 시간을 "월(09:00~11:50) 수(09:00~11:50)" 형태로 */
export function formatSnuttClassTime(lecture: SnuttLecture): string {
  if (!lecture.class_time_json?.length) return '시간 미정';

  return lecture.class_time_json
    .map(
      (time) =>
        `${DAY_LABEL[time.day] ?? '?'}(${formatMinute(time.startMinute)}~${formatMinute(time.endMinute)})`
    )
    .join(' ');
}
