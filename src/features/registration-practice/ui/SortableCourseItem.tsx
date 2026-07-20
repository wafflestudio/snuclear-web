import { useMemo } from 'react';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { formatSchedule } from '@shared/lib/timeUtils';

import type { CourseData } from '../model/types';

export interface SortableCourseItemProps {
  courseData: CourseData;
  isSelected: boolean;
  onSelect: () => void;
  checkDataTourId?: string;
}

export function SortableCourseItem({
  courseData,
  isSelected,
  onSelect,
  checkDataTourId,
}: SortableCourseItemProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({
    id: courseData.course.id,
  });

  const style = {
    transform: CSS.Translate.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
    zIndex: isDragging ? 1000 : 'auto',
  };

  const c = courseData;
  const schedule = useMemo(
    () => formatSchedule(c.course.placeAndTime, '시간 미정'),
    [c.course.placeAndTime]
  );

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`courseItem${isDragging ? ' dragging' : ''}`}
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
          aria-label={`${c.course.courseTitle} 선택`}
          data-tour-id={checkDataTourId}
        >
          <svg
            viewBox="0 0 24 24"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
            className="checkIcon"
          >
            <path
              d="M4 12L9 17L20 6"
              strokeWidth="3"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </button>
      </div>

      <div className="courseInfoArea" {...attributes} {...listeners}>
        <div className="infoRow top">
          <span className="c-type">[{c.course.classification}]</span>
          <span className="c-title">{c.course.courseTitle}</span>
        </div>
        <div className="infoRow middle">
          <span className="c-prof">{c.course.instructor}</span>
          <span className="c-divider">|</span>
          <span className="c-dept">{c.course.department}</span>
        </div>
        <div className="infoRow bottom">
          <span className="c-label">수강신청인원/정원(재학생)</span>
          <span className="c-val-blue">
            {c.course.registrationCount}/{c.course.quota}({c.course.quota - c.course.freshmanQuota})
          </span>
          <span className="c-divider-light">|</span>
          <span className="c-label">학점</span>
          <span className="c-val-blue">{c.course.credit}</span>
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
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <circle cx="9" cy="21" r="1"></circle>
            <circle cx="20" cy="21" r="1"></circle>
            <path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6"></path>
          </svg>
          <span className={'cartCountNum red'}>{c.cartCount}</span>
        </div>
        <div className="arrowBox">
          <svg width="12" height="12" viewBox="0 0 10 18" fill="none">
            <path
              d="M1 1L9 9L1 17"
              stroke="#000000"
              strokeWidth="1"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </div>
      </div>
    </div>
  );
}
