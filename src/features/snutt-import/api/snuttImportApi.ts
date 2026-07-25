import { searchCoursesApi } from '@features/course-search';
import { addPreEnrollApi } from '@features/cart-management';
import { isApiError } from '@shared/api/fetch';
import { hasCourseIdentifier } from '../model/snuttMapper';
import type {
  SnuttLecture,
  SnuttMatchResult,
  SnuttMatchedCourse,
  SnuttUnmatchedCourse,
} from '../model/types';

/**
 * 동시 요청 수 제한.
 * 아래 매칭/담기는 강좌 1건당 요청 1개를 보내는 임시 구현이라
 * 한 번에 몰아치지 않도록 제한한다.
 */
const CONCURRENCY = 4;

async function mapWithConcurrency<T, R>(
  items: T[],
  limit: number,
  worker: (item: T) => Promise<R>
): Promise<R[]> {
  const results: R[] = new Array(items.length);
  let cursor = 0;

  const runners = Array.from({ length: Math.min(limit, items.length) }, () =>
    (async () => {
      while (cursor < items.length) {
        const index = cursor++;
        results[index] = await worker(items[index]);
      }
    })()
  );

  await Promise.all(runners);
  return results;
}

/**
 * SNUTT 강의 목록을 우리 DB 강좌와 매칭한다.
 *
 * TODO: 백엔드에 `POST /api/v1/courses/match` 가 추가되면 이 함수 내부를
 * 단일 호출로 교체한다. 현재는 강좌 1건당 검색 API를 호출하는 임시 구현이라
 * 강좌 수만큼 요청이 발생한다.
 */
export async function matchSnuttLecturesApi(
  lectures: SnuttLecture[]
): Promise<SnuttMatchResult> {
  const matched: SnuttMatchedCourse[] = [];
  const unmatched: SnuttUnmatchedCourse[] = [];

  const identifiable: SnuttLecture[] = [];

  for (const lecture of lectures) {
    if (hasCourseIdentifier(lecture)) {
      identifiable.push(lecture);
    } else {
      unmatched.push({ lecture, reason: 'NO_COURSE_NUMBER' });
    }
  }

  const searched = await mapWithConcurrency(
    identifiable,
    CONCURRENCY,
    async (lecture) => {
      try {
        const response = await searchCoursesApi({
          courseNumber: lecture.course_number,
          page: 0,
          size: 100,
        });

        const course = response.data.items.find(
          (item) =>
            item.courseNumber === lecture.course_number &&
            item.lectureNumber === lecture.lecture_number
        );

        return { lecture, course };
      } catch {
        return { lecture, course: undefined };
      }
    }
  );

  for (const { lecture, course } of searched) {
    if (course) {
      matched.push({ lecture, course });
    } else {
      unmatched.push({ lecture, reason: 'NOT_FOUND' });
    }
  }

  return { matched, unmatched };
}

export interface BulkAddResult {
  addedCount: number;
  /** 이미 담겨 있어 건너뛴 강좌 */
  skippedCount: number;
  failedTitles: string[];
}

/**
 * 매칭된 강좌를 장바구니에 담는다.
 *
 * TODO: 백엔드에 `POST /api/v1/pre-enrolls/bulk` 가 추가되면 단일 호출로
 * 교체한다. 현재는 강좌 1건당 요청을 보내며, 일부 실패해도 나머지는 계속
 * 진행한다(부분 성공 허용).
 */
export async function addSnuttCoursesToCartApi(
  courses: SnuttMatchedCourse[]
): Promise<BulkAddResult> {
  let addedCount = 0;
  let skippedCount = 0;
  const failedTitles: string[] = [];

  await mapWithConcurrency(courses, CONCURRENCY, async ({ course }) => {
    try {
      await addPreEnrollApi({ courseId: course.id });
      addedCount += 1;
    } catch (error) {
      // 이미 담긴 강좌는 실패가 아니라 건너뛴 것으로 센다
      if (isApiError(error) && error.status === 409) {
        skippedCount += 1;
        return;
      }
      failedTitles.push(course.courseTitle);
    }
  });

  return { addedCount, skippedCount, failedTitles };
}
