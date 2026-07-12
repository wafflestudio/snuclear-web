import { useMemo } from 'react';
import {
  extractTimeFromPlaceAndTime,
  parseTimeString,
} from '@shared/lib/timeUtils';
import './timetable.css';

interface CourseForTimeTable {
  id: number;
  courseTitle: string;
  courseNumber: string;
  lectureNumber?: string;
  placeAndTime?: string | null;
}

interface TimeTableProps {
  title: string;
  courses: CourseForTimeTable[];
  onPrintClick?: () => void;
}

const DAYS = ['월', '화', '수', '목', '금', '토'] as const;
const START_HOUR = 8;
const END_HOUR = 23;
const HOURS = Array.from(
  { length: END_HOUR - START_HOUR },
  (_, i) => START_HOUR + i
);
const ROW_HEIGHT = 60;

const COURSE_COLORS = [
  '#00b147',
  '#f5b903',
  '#0598f7',
  '#fe5a59',
  '#d9832e',
  '#736aff',
  '#e9ff47',
  '#31ffff',
];

interface TimeBlock {
  courseId: number;
  courseTitle: string;
  courseCode: string;
  day: string;
  dayIndex: number;
  startHour: number;
  startMinutes: number;
  endMinutes: number;
  color: string;
}

export default function TimeTable({ title, courses, onPrintClick }: TimeTableProps) {
  const timeBlocks = useMemo(() => {
    const blocks: TimeBlock[] = [];
    const colorMap = new Map<number, string>();

    courses.forEach((course, index) => {
      if (!colorMap.has(course.id)) {
        colorMap.set(course.id, COURSE_COLORS[index % COURSE_COLORS.length]);
      }

      const timeStr = extractTimeFromPlaceAndTime(course.placeAndTime);
      const slots = parseTimeString(timeStr);

      slots.forEach((slot) => {
        const dayIndex = DAYS.indexOf(slot.day as (typeof DAYS)[number]);
        if (dayIndex === -1) return;

        const startHour = Math.floor(slot.startMinutes / 60);

        blocks.push({
          courseId: course.id,
          courseTitle: course.courseTitle,
          courseCode: `${course.courseNumber}${course.lectureNumber ? `-${course.lectureNumber}` : ''}`,
          day: slot.day,
          dayIndex,
          startHour,
          startMinutes: slot.startMinutes,
          endMinutes: slot.endMinutes,
          color: colorMap.get(course.id)!,
        });
      });
    });

    return blocks;
  }, [courses]);

  const getBlocksForDay = (dayIndex: number): TimeBlock[] => {
    return timeBlocks.filter((block) => block.dayIndex === dayIndex);
  };

  const isOddDay = (dayIndex: number): boolean => {
    return dayIndex === 1 || dayIndex === 3 || dayIndex === 5;
  };

  const calculateBlockStyle = (block: TimeBlock) => {
    const snappedStartMinutes = Math.floor(block.startMinutes / 30) * 30;
    const snappedEndMinutes = Math.ceil(block.endMinutes / 30) * 30;
    const startOffset =
      ((snappedStartMinutes - START_HOUR * 60) / 60) * ROW_HEIGHT;
    const duration =
      ((snappedEndMinutes - snappedStartMinutes) / 60) * ROW_HEIGHT;
    return {
      top: `${startOffset}px`,
      height: `${duration}px`,
      backgroundColor: block.color,
    };
  };

  return (
    <div className="timetable-container">
      <div className="timetable-header">
        <h2 className="timetable-title">{title}</h2>
        {onPrintClick && (
          <button className="timetable-print-btn" onClick={onPrintClick}>
            시간표 인쇄{' '}
            <img
              src="/assets/btn_arrow_view_gray.png"
              alt=""
              className="cart-btn-arrow"
            />
          </button>
        )}
      </div>

      <div className="timetable-wrapper">
        <div className="timetable-grid">
          {/* Header row */}
          <div className="timetable-corner"></div>
          {DAYS.map((day, idx) => (
            <div
              key={day}
              className={`timetable-day-header ${isOddDay(idx) ? 'odd-day' : ''}`}
            >
              {day}
            </div>
          ))}

          {/* Hour rows */}
          {HOURS.map((hour) => (
            <div key={hour} className="timetable-row">
              <div className="timetable-hour-cell">{hour}</div>
              {DAYS.map((day, dayIdx) => (
                <div
                  key={`${day}-${hour}`}
                  className={`timetable-cell ${isOddDay(dayIdx) ? 'odd-day' : ''}`}
                />
              ))}
            </div>
          ))}
        </div>

        {/* Course blocks overlay */}
        <div className="timetable-blocks-overlay">
          {DAYS.map((_, dayIdx) => (
            <div key={dayIdx} className="timetable-day-column">
              {getBlocksForDay(dayIdx).map((block, blockIdx) => (
                <div
                  key={`${block.courseId}-${blockIdx}`}
                  className="timetable-block"
                  style={calculateBlockStyle(block)}
                >
                  <span className="timetable-block-title">
                    {block.courseTitle}
                  </span>
                  <span className="timetable-block-code">
                    {block.courseCode}
                  </span>
                </div>
              ))}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
