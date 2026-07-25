import { useState, useMemo } from 'react';
import { isApiError } from '@shared/api/fetch';
import {
  useCartQuery,
  useDeleteFromCartMutation,
  useUpdateCartCountMutation,
} from '@features/cart-management';
import { SnuttImportButton, SnuttImportModal } from '@features/snutt-import';
import { useModalStore } from '@shared/model/modalStore';
import { WarningModal } from '@shared/ui/Warning';
import { TimeTable } from '@widgets/timetable';
import { formatSchedule } from '@shared/lib/timeUtils';
import './cart.css';

export default function Cart() {
  const { data, isLoading } = useCartQuery();
  const cartCourses = Array.isArray(data) ? data : [];
  const deleteFromCartMutation = useDeleteFromCartMutation();
  const updateCartCountMutation = useUpdateCartCountMutation();
  const {
    showDeleteSuccess,
    openDeleteSuccess,
    closeDeleteSuccess,
    openModal,
    closeModal,
  } = useModalStore();
  const isNoCourseSelectedOpen = useModalStore(
    (state) => state.openModals.has('cart/noCourseSelected')
  );

  const [selectedCourses, setSelectedCourses] = useState<Set<number>>(
    new Set()
  );
  const [draftCounts, setDraftCounts] = useState<Record<number, string>>({});
  const [isSnuttImportOpen, setSnuttImportOpen] = useState(false);

  const getDraftCount = (courseId: number, cartCount: number) =>
    draftCounts[courseId] ?? String(cartCount);

  const setDraftCount = (courseId: number, value: string) => {
    setDraftCounts((prev) => ({ ...prev, [courseId]: value }));
  };

  const clearDraftCount = (courseId: number) => {
    setDraftCounts((prev) => {
      const next = { ...prev };
      delete next[courseId];
      return next;
    });
  };

  const toggleCourseSelection = (courseId: number) => {
    setSelectedCourses((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(courseId)) {
        newSet.delete(courseId);
      } else {
        newSet.add(courseId);
      }
      return newSet;
    });
  };

  const handleDeleteSelected = async () => {
    if (selectedCourses.size === 0) {
      openModal('cart/noCourseSelected');
      return;
    }

    try {
      const promises = Array.from(selectedCourses).map((courseId) =>
        deleteFromCartMutation.mutateAsync(courseId)
      );
      await Promise.all(promises);
      openDeleteSuccess();
      setSelectedCourses(new Set());
    } catch (error) {
      console.error('[Cart] 장바구니 삭제 실패:', error);
      if (isApiError(error)) {
        alert(`삭제 실패: ${error.data.message || '알 수 없는 오류'}`);
      } else {
        alert('삭제 중 네트워크 오류가 발생했습니다.');
      }
    }
  };

  const handleCartCountChange = async (courseId: number, newValue: string) => {
    const newCount = parseInt(newValue);
    if (isNaN(newCount) || newCount < 0) {
      return;
    }

    try {
      await updateCartCountMutation.mutateAsync({
        courseId,
        data: { cartCount: newCount },
      });
    } catch (error) {
      console.error('[Cart] cartCount 수정 실패:', error);
      if (isApiError(error)) {
        alert(`수정 실패: ${error.data.message || '알 수 없는 오류'}`);
      }
    }
  };

  const commitCartCount = async (courseId: number, rawValue: string) => {
    const parsed = parseInt(rawValue, 10);
    const nextCount = Number.isNaN(parsed) || parsed < 0 ? 0 : parsed;

    setDraftCount(courseId, String(nextCount));
    await handleCartCountChange(courseId, String(nextCount));
    clearDraftCount(courseId);
  };

  const stepCartCount = (courseId: number, cartCount: number, delta: number) => {
    const current = parseInt(getDraftCount(courseId, cartCount), 10);
    const base = Number.isNaN(current) ? cartCount : current;
    void commitCartCount(courseId, String(Math.max(0, base + delta)));
  };

  const totalCredit = cartCourses.reduce(
    (sum, item) => sum + (item.course.credit ?? 0),
    0
  );

  const coursesForTimeTable = useMemo(
    () =>
      cartCourses.map((item) => ({
        id: item.course.id,
        courseTitle: item.course.courseTitle,
        courseNumber: item.course.courseNumber,
        lectureNumber: item.course.lectureNumber,
        placeAndTime: item.course.placeAndTime,
      })),
    [cartCourses]
  );

  return (
    <main className="page">
      <div className="containerX">
        <h1 className="cart-page-title">장바구니</h1>

        <div className="cart-notice-box" style={{ flexDirection: 'column', alignItems: 'flex-start', gap: '4px' }}>
          <p className="cart-notice-date">※ 담은 수는 화살표 또는 직접 입력으로 수정할 수 있습니다.</p>
          <p className="cart-notice-date">※ <strong>담은 수가 정원을 초과한 강의만 선착순 수강신청 가능합니다.</strong></p>
        </div>

        <div className="cart-content-wrapper">
        <div className="cart-left-section">
          <div className="cart-tabs-container">
            <button
              className="cart-tab-button active"
              onClick={handleDeleteSelected}
            >
              선택삭제
            </button>
            <SnuttImportButton onClick={() => setSnuttImportOpen(true)} />
            <span className="cart-credit-info">
              신청가능학점 <span className="cart-credit-number">21</span>
              학점 / 담은 학점{' '}
              <span className="cart-credit-number">{totalCredit}</span>
              학점
            </span>
          </div>

          <div className={`cart-content-box${cartCourses.length > 0 ? ' has-items' : ''}`}>
            {isLoading ? (
              <div className="cart-empty-state">
                <p className="cart-empty-title">로딩 중...</p>
              </div>
            ) : cartCourses.length === 0 ? (
              <div className="cart-empty-state">
                <p className="cart-empty-title">
                  장바구니가 비었습니다.
                  <br />
                  검색으로 담거나, SNUTT 시간표를 그대로 불러올 수 있어요.
                </p>
                <SnuttImportButton
                  variant="cta"
                  onClick={() => setSnuttImportOpen(true)}
                />
              </div>
            ) : (
              <div className="resultListArea">
                {cartCourses.map((item) => {
                  const isSelected = selectedCourses.has(item.course.id);

                  return (
                    <div
                      key={item.preEnrollId}
                      className="courseItem"
                      onClick={(event) => {
                        const infoArea =
                          event.currentTarget.querySelector<HTMLElement>(
                            '.courseInfoArea'
                          );
                        if (
                          infoArea &&
                          event.clientX < infoArea.getBoundingClientRect().left
                        ) {
                          toggleCourseSelection(item.course.id);
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
                            {item.course.academicCourse === '학사'
                              ? '학사'
                              : '대학원'}
                            ] [{item.course.classification}]
                          </span>
                          <span className="c-title">
                            {item.course.courseTitle}
                          </span>
                        </div>
                        <div className="infoRow">
                          <span className="c-prof">
                            {item.course.instructor}
                          </span>
                          <span className="c-divider">|</span>
                          <span className="c-dept">
                            {item.course.department}
                          </span>
                        </div>
                        <div className="infoRow">
                          <span className="c-label">
                            수강신청인원/정원(재학생)
                          </span>
                          <span className="c-val-blue">
                            {item.course.registrationCount}/{item.course.quota}({item.course.quota - item.course.freshmanQuota})
                          </span>
                          <span className="c-divider-light">|</span>

                          <span className="c-label">학점</span>
                          <span className="c-val-blue">
                            {item.course.credit}
                          </span>
                          <span className="c-divider-light">|</span>
                          <div className="infoRow">
                            <span className="c-schedule">
                              {formatSchedule(item.course.placeAndTime, '시간 미정')}
                            </span>
                          </div>
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
                          <div
                            className="cartCountControl"
                            onClick={(e) => e.stopPropagation()}
                          >
                            <input
                              type="number"
                              value={getDraftCount(item.course.id, item.cartCount)}
                              onChange={(e) => {
                                e.stopPropagation();
                                setDraftCount(item.course.id, e.target.value);
                              }}
                              onBlur={(e) => {
                                e.stopPropagation();
                                commitCartCount(item.course.id, e.target.value);
                              }}
                              onKeyDown={(e) => {
                                if (e.key === 'Enter') {
                                  e.preventDefault();
                                  e.currentTarget.blur();
                                }
                              }}
                              className="cartCountInput"
                              min="0"
                              aria-label={`${item.course.courseTitle} 담은 수`}
                            />
                            <span className="cartCountStepper">
                              <button
                                type="button"
                                className="cartCountStepBtn"
                                aria-label="담은 수 1 증가"
                                onClick={() =>
                                  stepCartCount(item.course.id, item.cartCount, 1)
                                }
                              >
                                <svg viewBox="0 0 10 6" aria-hidden="true">
                                  <path
                                    d="M1 4.5L5 1.5L9 4.5"
                                    stroke="currentColor"
                                    strokeWidth="1.5"
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                  />
                                </svg>
                              </button>
                              <button
                                type="button"
                                className="cartCountStepBtn"
                                aria-label="담은 수 1 감소"
                                disabled={
                                  Number(
                                    getDraftCount(item.course.id, item.cartCount)
                                  ) <= 0
                                }
                                onClick={() =>
                                  stepCartCount(item.course.id, item.cartCount, -1)
                                }
                              >
                                <svg viewBox="0 0 10 6" aria-hidden="true">
                                  <path
                                    d="M1 1.5L5 4.5L9 1.5"
                                    stroke="currentColor"
                                    strokeWidth="1.5"
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                  />
                                </svg>
                              </button>
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        <div className="cart-right-section">
          <TimeTable title="장바구니 시간표" courses={coursesForTimeTable} />
        </div>
        </div>
      </div>

      {isSnuttImportOpen && (
        <SnuttImportModal onClose={() => setSnuttImportOpen(false)} />
      )}

      <WarningModal.Alert
        isOpen={showDeleteSuccess}
        onClose={closeDeleteSuccess}
        icon="warning"
        title="삭제되었습니다."
      />

      <WarningModal.Alert
        isOpen={isNoCourseSelectedOpen}
        onClose={() => closeModal('cart/noCourseSelected')}
        icon="warning"
      >
        <p className="warningText">삭제할 강좌를 선택해주십시오.</p>
      </WarningModal.Alert>

    </main>
  );
}
