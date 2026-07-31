import type { CourseDetailResponse, Semester } from '@entities/course';

/**
 * SNUTT 시간표 피커에서 postMessage로 전달받는 페이로드 타입.
 *
 * 원본 정의: wafflestudio/snutt-frontend
 *   apps/snutt-webclient/src/usecases/timetablePickerService.ts (SharedTimetable)
 *
 * 주의: 전달되는 값은 FullTimetable 원본이 아니라, SNUTT가 내부 식별자와
 * 색상/테마 정보를 제거한 SharedTimetable 이다.
 *   - 시간표에서 제거: _id, user_id, updated_at, theme
 *   - 강의에서 제거:   _id, color, colorIndex
 * 따라서 강의를 식별할 안정적인 키가 없어, 목록 렌더링 시에는
 * course_number + lecture_number 조합이나 인덱스를 사용해야 한다.
 *
 * course_number / lecture_number 는 SNU 원본 값이라 우리 DB와 직접 매칭된다.
 * 다만 SNUTT에서 사용자가 직접 만든 커스텀 강의는 두 값이 모두 없다.
 */

export const SNUTT_MESSAGE_TYPE = 'SNUTT_TIMETABLE_SELECTED';

/** 0=월 ... 6=일 */
export type SnuttDay = 0 | 1 | 2 | 3 | 4 | 5 | 6;

/** 1=1학기, 2=여름, 3=2학기, 4=겨울 */
export type SnuttSemester = 1 | 2 | 3 | 4;

export interface SnuttClassTime {
  day: SnuttDay;
  place?: string;
  /** 자정 기준 분 (예: 540 = 09:00) */
  startMinute: number;
  endMinute: number;
}

export interface SnuttLecture {
  course_title: string;
  course_number?: string;
  lecture_number?: string;
  instructor?: string;
  credit?: number;
  department?: string;
  classification?: string;
  academic_year?: string;
  quota?: number;
  remark?: string;
  category?: string;
  lecture_id?: string;
  class_time_json: SnuttClassTime[];
  class_time_mask?: number[];
}

export interface SnuttSharedTimetable {
  title: string;
  year: number;
  semester: SnuttSemester;
  lecture_list: SnuttLecture[];
}

export interface SnuttTimetableMessage {
  type: typeof SNUTT_MESSAGE_TYPE;
  payload: SnuttSharedTimetable;
}

/** 우리 DB와 매칭할 수 없는 사유 */
export type SnuttUnmatchedReason =
  /** SNUTT 커스텀 강의 등으로 교과목번호/분반이 없음 */
  | 'NO_COURSE_NUMBER'
  /** 해당 학기 강좌 목록에 없음 (폐강, 타학기 등) */
  | 'NOT_FOUND';

export interface SnuttMatchedCourse {
  lecture: SnuttLecture;
  course: CourseDetailResponse;
}

export interface SnuttUnmatchedCourse {
  lecture: SnuttLecture;
  reason: SnuttUnmatchedReason;
}

export interface SnuttMatchResult {
  matched: SnuttMatchedCourse[];
  unmatched: SnuttUnmatchedCourse[];
}

/** 불러온 시간표의 학기 정보 */
export interface SnuttTimetableInfo {
  title: string;
  year: number;
  semester: Semester;
  lectureCount: number;
}
