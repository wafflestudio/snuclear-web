import { useState, useMemo } from 'react';
import { useEnrolledCoursesQuery } from '@features/registration-practice';
import { useCartQuery } from '@features/cart-management';
import { tutorialCourse, useTourStore } from '@features/tour';
import { useModalStore } from '@shared/model/modalStore';
import { TimeTable } from '@widgets/timetable';
import { formatSchedule } from '@shared/lib/timeUtils';
import './enrollmentHistory.css';

export default function EnrollmentHistory() {
  const tour = useTourStore();
  const isTourResult = tour.isActive && tour.currentStep === 'historyResult';
  const { data: enrolledData, isLoading: isEnrolledLoading } = useEnrolledCoursesQuery();
  const { data: cartData, isLoading: isCartLoading } = useCartQuery();

  const isLoading = isTourResult ? false : isEnrolledLoading || isCartLoading;

  const enrolledCourses = useMemo(() => {
    if (isTourResult) return [tutorialCourse];

    const enrolled = Array.isArray(enrolledData) ? enrolledData : [];
    const cartCourses = Array.isArray(cartData) ? cartData : [];

    // 담은 수가 정원 이하인 강의는 경쟁 없이 자동 수강 확정
    const autoEnrolled = cartCourses
      .filter((item) => item.cartCount <= item.course.quota)
      .map((item) => item.course);

    const enrolledIds = new Set(enrolled.map((c) => c.id));
    const merged = [...enrolled];
    for (const course of autoEnrolled) {
      if (!enrolledIds.has(course.id)) {
        merged.push(course);
      }
    }

    return merged;
  }, [cartData, enrolledData, isTourResult]);
  const [selectedCourseId, setSelectedCourseId] = useState<number | null>(null);
  const { openNotSupported } = useModalStore();

  const toggleCourseSelection = (courseId: number) => {
    setSelectedCourseId((prev) => (prev === courseId ? null : courseId));
  };

  const totalCredit = enrolledCourses.reduce(
    (sum, course) => sum + (course?.credit || 0),
    0
  );

  const coursesForTimeTable = useMemo(
    () =>
      enrolledCourses.map((course) => ({
        id: course.id,
        courseTitle: course.courseTitle,
        courseNumber: course.courseNumber,
        lectureNumber: course.lectureNumber,
        placeAndTime: course.placeAndTime,
      })),
    [enrolledCourses]
  );

  return (
    <main className="page">
      <div className="containerX">
        <h1 className="enrollment-page-title">수강신청내역</h1>

        <div className="enrollment-left-section">
          <p className="enrollment-notice-text">
            ※ 가장 최근의 수강신청 결과만 표시함
          </p>

          <div className="enrollment-content-wrapper">
            <div className="enrollment-left-column">
              <div className="enrollment-tabs-container">
                <button
                  className="enrollment-tab-button active"
                  onClick={() => openNotSupported()}
                >
                  선택삭제
                </button>
                <span className="enrollment-credit-info">
                  신청가능학점{' '}
                  <span className="enrollment-credit-number">21</span>
                  학점 / 신청학점{' '}
                  <span className="enrollment-credit-number">
                    {totalCredit}
                  </span>
                  학점 / 신청과목{' '}
                  <span className="enrollment-credit-number">
                    {enrolledCourses.length}
                  </span>
                  강좌
                </span>
              </div>

              <div className="enrollment-content-box">
                {isLoading ? (
                  <div className="enrollment-empty-state">
                    <p className="enrollment-empty-text">로딩 중...</p>
                  </div>
                ) : enrolledCourses.length === 0 ? (
                  <div className="enrollment-empty-state">
                    <p className="enrollment-empty-text">
                      수강신청 내역이 없습니다.
                    </p>
                  </div>
                ) : (
                  <div className="resultListArea">
                    {enrolledCourses.map((course) => {
                      const isSelected = selectedCourseId === course.id;

                      return (
                        <div
                          key={course.id}
                          className="courseItem"
                          data-tour-id={
                            isTourResult ? 'enrollment-result' : undefined
                          }
                          onClick={(event) => {
                            const infoArea =
                              event.currentTarget.querySelector<HTMLElement>(
                                '.courseInfoArea'
                              );
                            if (
                              infoArea &&
                              event.clientX <
                                infoArea.getBoundingClientRect().left
                            ) {
                              toggleCourseSelection(course.id);
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
                                [
                                {course.academicCourse === '학사'
                                  ? '학사'
                                  : '대학원'}
                                ] [{course.classification}]
                              </span>
                              <span className="c-title">
                                {course.courseTitle}
                              </span>
                            </div>
                            <div className="infoRow">
                              <span className="c-prof">
                                {course.instructor}
                              </span>
                              <span className="c-divider">|</span>
                              <span className="c-dept">
                                {course.department}
                              </span>
                              <span className="c-divider">|</span>
                              <span className="c-coursenum">
                                {course.courseNumber}
                                {course.lectureNumber &&
                                  `(${course.lectureNumber})`}
                              </span>
                            </div>
                            <div className="infoRow">
                              <span className="c-label">
                                수강신청인원/정원(재학생)
                              </span>
                              <span className="c-val-blue">
                                {course.registrationCount}/{course.quota}(
                                {course.quota - course.freshmanQuota})
                              </span>
                              <span className="c-divider-light">|</span>
                              <span className="c-label">학점</span>
                              <span className="c-val-blue">
                                {course.credit}
                              </span>
                              <span className="c-divider-light">|</span>
                              <span className="c-schedule">
                                {formatSchedule(course.placeAndTime, '시간 미정')}
                              </span>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>

            <div className="enrollment-right-column">
              <TimeTable
                title="수강신청 시간표"
                courses={coursesForTimeTable}
              />
            </div>
          </div>
        </div>
      </div>

    </main>
  );
}
