import { useState, useMemo } from 'react';
import { isApiError } from '@shared/api/fetch';
import {
  useCartQuery,
  useDeleteFromCartMutation,
  useUpdateCartCountMutation,
} from '@features/cart-management';
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
    openNotSupported,
    openModal,
    closeModal,
  } = useModalStore();
  const isNoCourseSelectedOpen = useModalStore(
    (state) => state.openModals.has('cart/noCourseSelected')
  );

  const [selectedCourses, setSelectedCourses] = useState<Set<number>>(
    new Set()
  );
  const [editingCourseId, setEditingCourseId] = useState<number | null>(null);
  const [editingValue, setEditingValue] = useState<string>('');

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
          <p className="cart-notice-date">※ 장바구니 숫자를 클릭하여 수정할 수 있습니다.</p>
          <p className="cart-notice-date">※ 담은 수가 정원을 초과한 강의만 선착순 수강신청 가능합니다.</p>
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
            <button className="cart-tab-button" onClick={() => openNotSupported()}>
              관심강좌
              <img
                src="/assets/btn_arrow_view_gray.png"
                alt=""
                className="cart-btn-arrow"
              />
            </button>
            <button className="cart-tab-button" onClick={() => openNotSupported()}>
              전공이수내역조회
              <img
                src="/assets/btn_arrow_view_gray.png"
                alt=""
                className="cart-btn-arrow"
              />
            </button>
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
                  검색 또는 관심강좌에서 수강신청 하실 강좌를 장바구니에
                  담으세요.
                </p>
              </div>
            ) : (
              <div className="resultListArea">
                {cartCourses.map((item) => {
                  const isSelected = selectedCourses.has(item.course.id);

                  return (
                    <div
                      key={item.preEnrollId}
                      className="courseItem"
                      onClick={() => toggleCourseSelection(item.course.id)}
                    >
                      <div className="courseCheckArea">
                        <button
                          className={`customCheckBtn ${isSelected ? 'checked' : ''}`}
                          onClick={(e) => {
                            e.stopPropagation();
                            toggleCourseSelection(item.course.id);
                          }}
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
                          {editingCourseId === item.course.id ? (
                            <input
                              type="number"
                              value={editingValue}
                              onChange={(e) => {
                                e.stopPropagation();
                                setEditingValue(e.target.value);
                              }}
                              onBlur={(e) => {
                                e.stopPropagation();
                                const finalValue =
                                  editingValue === '' ? '0' : editingValue;
                                handleCartCountChange(
                                  item.course.id,
                                  finalValue
                                );
                                setEditingCourseId(null);
                                setEditingValue('');
                              }}
                              onKeyDown={(e) => {
                                if (e.key === 'Enter') {
                                  e.preventDefault();
                                  e.stopPropagation();
                                  const finalValue =
                                    editingValue === '' ? '0' : editingValue;
                                  handleCartCountChange(
                                    item.course.id,
                                    finalValue
                                  );
                                  setEditingCourseId(null);
                                  setEditingValue('');
                                }
                              }}
                              onClick={(e) => e.stopPropagation()}
                              className="cartCountInput"
                              min="0"
                              autoFocus
                            />
                          ) : (
                            <span
                              className="cartCountDisplay"
                              onClick={(e) => {
                                e.stopPropagation();
                                setEditingCourseId(item.course.id);
                                setEditingValue(String(item.cartCount));
                              }}
                            >
                              {item.cartCount}
                            </span>
                          )}
                        </div>
                        <div className="arrowBox">
                          <svg
                            width="10"
                            height="16"
                            viewBox="0 0 10 16"
                            fill="none"
                          >
                            <path
                              d="M1 1L8 8L1 15"
                              stroke="#aaa"
                              strokeWidth="2"
                              strokeLinecap="round"
                              strokeLinejoin="round"
                            />
                          </svg>
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
          <TimeTable title="장바구니 시간표" courses={coursesForTimeTable} onPrintClick={() => openNotSupported()} />
        </div>
        </div>
      </div>

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
