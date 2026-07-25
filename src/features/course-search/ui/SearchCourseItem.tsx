import { useMemo } from 'react';
import type { CourseDetailResponse } from '@entities/course';
import { formatSchedule } from '@shared/lib/timeUtils';

export interface SearchCourseItemProps {
  course: CourseDetailResponse;
  isSelected: boolean;
  cartCount?: number;
  onSelect: () => void;
}

export function SearchCourseItem({
  course,
  isSelected,
  cartCount = 0,
  onSelect,
}: SearchCourseItemProps) {
  const schedule = useMemo(
    () => formatSchedule(course.placeAndTime, '시간 미정'),
    [course.placeAndTime]
  );

  return (
    <div
      className="courseItem"
      onClick={(event) => {
        const infoArea =
          event.currentTarget.querySelector<HTMLElement>('.courseInfoArea');
        if (infoArea && event.clientX < infoArea.getBoundingClientRect().left) {
          onSelect();
        }
      }}
    >
      <div className="courseCheckArea">
        <button
          type="button"
          className={`customCheckBtn ${isSelected ? 'checked' : ''}`}
        >
          <svg
            className="checkIcon"
            viewBox="0 0 24 24"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
          >
            <polyline points="20 6 9 17 4 12" />
          </svg>
        </button>
      </div>

      <div className="courseInfoArea">
        <div className="infoRow">
          <span className="c-type">
            [{course.academicCourse === '학사' ? '학사' : '대학원'}] [
            {course.classification}]
          </span>
          <span className="c-title">{course.courseTitle}</span>
        </div>
        <div className="infoRow">
          <span className="c-prof">{course.instructor}</span>
          <span className="c-divider">|</span>
          <span className="c-dept">{course.department}</span>
          <span className="c-divider">|</span>
          <span className="c-coursenum">
            {course.courseNumber}({course.lectureNumber})
          </span>
        </div>
        <div className="infoRow">
          <span className="c-label">수강신청인원/정원(재학생)</span>
          <span className="c-val-blue">
            {course.registrationCount}/{course.quota}({course.quota - course.freshmanQuota})
          </span>
          <span className="c-divider-light">|</span>
          <span className="c-label">총수강인원</span>
          <span className="c-val-blue">{course.registrationCount}</span>
          <span className="c-divider-light">|</span>
          <span className="c-label">학점</span>
          <span className="c-val-blue">{course.credit}</span>
          <span className="c-divider-light">|</span>
          <span className="c-schedule">{schedule}</span>
        </div>
      </div>

      <div className="courseActionArea">
        <div className="cartInfoBox">
          <svg
            className="cartIconSvg"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
          >
            <circle cx="9" cy="21" r="1" />
            <circle cx="20" cy="21" r="1" />
            <path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6" />
          </svg>
          <span className={`cartCountNum ${cartCount > 0 ? 'red' : ''}`}>
            {cartCount}
          </span>
        </div>
      </div>
    </div>
  );
}
