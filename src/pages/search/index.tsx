import { useState } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { isApiError } from '@shared/api/fetch';
import {
  useCourseSearchQuery,
  SearchCourseItem,
} from '@features/course-search';
import { useAddToCartMutation, useCartQuery } from '@features/cart-management';
import { useCaptcha } from '@features/registration-practice';
import type { CourseDetailResponse } from '@entities/course';
import { useModalStore } from '@shared/model/modalStore';
import { WarningModal } from '@shared/ui/Warning';
import { Pagination } from '@shared/ui/Pagination';
import {
  hasTimeConflict,
  extractTimeFromPlaceAndTime,
} from '@shared/lib/timeUtils';
import './search.css';

const PAGE_SIZE = 10;

export default function SearchPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();

  const keyword = searchParams.get('query') || '';
  const currentPage = parseInt(searchParams.get('page') || '0', 10);

  const captcha = useCaptcha();
  const { openModal, closeModal } = useModalStore();
  const isCartOpen = useModalStore((s) => s.openModals.has('search/cart'));
  const isConflictOpen = useModalStore((s) =>
    s.openModals.has('search/conflict')
  );
  const isNoCourseSelectedOpen = useModalStore((s) =>
    s.openModals.has('search/noCourseSelected')
  );
  const isTimeOverlapOpen = useModalStore((s) =>
    s.openModals.has('search/timeOverlap')
  );
  const isCapacityFullOpen = useModalStore((s) =>
    s.openModals.has('search/capacityFull')
  );

  const [selectedCourses, setSelectedCourses] = useState<Set<number>>(
    new Set()
  );
  const [isFloatingMenuOpen, setIsFloatingMenuOpen] = useState(false);

  const { data: cartData } = useCartQuery();
  const { data, isLoading, error } = useCourseSearchQuery({
    query: keyword,
    page: currentPage,
    size: PAGE_SIZE,
  });

  const addToCartMutation = useAddToCartMutation();

  const courses = data?.items ?? [];
  const totalCount = data?.pageInfo.totalElements ?? 0;
  const totalPages = data?.pageInfo.totalPages ?? 0;

  const setPage = (page: number) => {
    const newParams = new URLSearchParams(searchParams);
    newParams.set('page', page.toString());
    setSearchParams(newParams);
  };

  const toggleCourseSelection = (courseId: number) => {
    setSelectedCourses((prev) => {
      if (prev.has(courseId)) {
        return new Set();
      } else {
        return new Set([courseId]);
      }
    });
  };

  const handleAddToCart = async () => {
    if (selectedCourses.size === 0) {
      openModal('search/noCourseSelected');
      return;
    }

    const courseId = Array.from(selectedCourses)[0];
    const selectedCourse = courses.find(
      (c: CourseDetailResponse) => c.id === courseId
    );

    if (selectedCourse) {
      if (selectedCourse.registrationCount >= selectedCourse.quota) {
        openModal('search/capacityFull');
        return;
      }

      if (cartData) {
        const selectedTimeStr = extractTimeFromPlaceAndTime(
          selectedCourse.placeAndTime
        );

        for (const cartItem of cartData) {
          const cartTimeStr = extractTimeFromPlaceAndTime(
            cartItem.course.placeAndTime
          );
          if (hasTimeConflict(selectedTimeStr, cartTimeStr)) {
            openModal('search/timeOverlap');
            return;
          }
        }
      }
    }

    try {
      const promises = Array.from(selectedCourses).map((courseId) =>
        addToCartMutation.mutateAsync({ courseId })
      );
      await Promise.all(promises);
      setSelectedCourses(new Set());
      openModal('search/cart');
    } catch (err) {
      console.error('[Search] 장바구니 추가 실패:', err);
      if (isApiError(err)) {
        if (err.status === 409) {
          openModal('search/conflict');
          setSelectedCourses(new Set());
        } else {
          alert(
            `장바구니 추가 실패: ${err.data.message || '알 수 없는 오류'}`
          );
        }
      } else {
        alert('장바구니 추가 중 네트워크 오류가 발생했습니다.');
      }
    }
  };

  return (
    <div className="searchPage">
      <WarningModal.Confirm
        isOpen={isCartOpen}
        onCancel={() => closeModal('search/cart')}
        onConfirm={() => {
          closeModal('search/cart');
          navigate('/cart');
        }}
        title="장바구니에 담겼습니다."
        subtitle="지금 바로 장바구니로 이동하시겠습니까?"
        cancelLabel="아니요, 괜찮습니다."
        confirmLabel="장바구니로 이동"
      />

      <WarningModal.Alert
        isOpen={isConflictOpen}
        onClose={() => closeModal('search/conflict')}
        icon="warning"
      >
        <p className="warningText">
          중복된 강의를 장바구니에
          <br />
          담을 수 없습니다.
        </p>
      </WarningModal.Alert>

      <WarningModal.Alert
        isOpen={isNoCourseSelectedOpen}
        onClose={() => closeModal('search/noCourseSelected')}
        icon="warning"
      >
        <p className="warningText">장바구니 담기할 강좌를 선택해주십시오.</p>
      </WarningModal.Alert>

      <WarningModal.Alert
        isOpen={isTimeOverlapOpen}
        onClose={() => closeModal('search/timeOverlap')}
        icon="warning"
      >
        <p className="warningText">
          중복된 시간대의 강의를
          <br />
          장바구니에 담을 수 없습니다.
        </p>
      </WarningModal.Alert>

      <WarningModal.Alert
        isOpen={isCapacityFullOpen}
        onClose={() => closeModal('search/capacityFull')}
        icon="warning"
      >
        <p className="warningText">정원이 가득 찬 강좌입니다.</p>
      </WarningModal.Alert>

      <div className="containerX">
        <div className="searchHeader">
          <h2 className="searchTitle">
            <span className="quote">'{keyword}'</span> 검색 결과
          </h2>
          <p className="searchCount">
            <span className="countNum">{isLoading ? '...' : totalCount}</span>
            건의 교과목이 검색되었습니다.
          </p>
        </div>

        <div className="searchToolbar">
          <div className="legendList">
            <div className="legendItem">
              <span className="legendIcon">O</span> 원격수업강좌
            </div>
            <div className="legendItem">
              <span className="legendIcon">M</span> 군휴학생 원격수업 강좌
            </div>
            <div className="legendItem">
              <span className="legendIcon">C</span> 크로스리스팅
            </div>
            <div className="legendItem">
              <span className="legendIcon">R</span> 수강반 제한
            </div>
            <div className="legendItem">
              <span className="legendIcon globe">
                <svg
                  viewBox="0 0 24 24"
                  width="14"
                  height="14"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                >
                  <circle cx="12" cy="12" r="10"></circle>
                  <path d="M2 12h20M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"></path>
                </svg>
              </span>{' '}
              외국어강의
            </div>
            <div className="legendItem">
              <span className="legendIcon">K</span> 거점국립대학 원격수업 강좌
            </div>
            <button
              className="excelBtn"
              onClick={() => openModal('notSupported')}
            >
              엑셀저장
            </button>
          </div>
        </div>

        <div className="searchContent">
          <div className="searchLeftColumn">
            <hr className="blackLine" />
            <div className="resultListArea">
              {isLoading && <p className="stateMessage">검색 중...</p>}
              {error && (
                <p className="stateMessage error">강의 검색에 실패했습니다.</p>
              )}
              {!isLoading && !error && courses.length === 0 && keyword && (
                <p className="stateMessage">검색 결과가 없습니다.</p>
              )}
              {!isLoading &&
                courses.map((course: CourseDetailResponse) => (
                  <SearchCourseItem
                    key={course.id}
                    course={course}
                    isSelected={selectedCourses.has(course.id)}
                    cartCount={0}
                    onSelect={() => toggleCourseSelection(course.id)}
                  />
                ))}
            </div>
            <div>
              <p
                style={{
                  fontSize: '14px',
                  marginLeft: '10px',
                }}
              >
                <span className="countNum">{totalCount}</span>건
              </p>
            </div>

            {!isLoading && !error && (
              <Pagination
                currentPage={currentPage}
                totalPages={totalPages}
                onPageChange={setPage}
              />
            )}
          </div>

          <div className="searchRightColumn">
            <div className="searchFloatingMenu">
              <button
                className="floatBtn outlineBtn"
                onClick={() => openModal('notSupported')}
              >
                관심강좌 저장
              </button>
              <button
                className="floatBtn fillBlueBtn"
                onClick={handleAddToCart}
              >
                장바구니 담기
              </button>

              <div className="floatLine"></div>

              <div className="captchaRow">
                <div className="captchaBox">
                  {captcha.captchaDigits.map((digit, index) => (
                    <span
                      key={index}
                      className="captchaDigit"
                      style={{
                        transform: `rotate(${digit.rotation}deg) translateY(${digit.yOffset}px) translateX(${digit.xOffset}px)`,
                        color: digit.color,
                        fontSize: `${digit.fontSize}px`,
                      }}
                    >
                      {digit.value}
                    </span>
                  ))}
                </div>
                <input
                  className="captchaInput"
                  placeholder="입 력"
                  value={captcha.captchaInput}
                  onChange={(e) => captcha.setCaptchaInput(e.target.value)}
                />
              </div>

              <button
                className="floatBtn fillRedBtn"
                onClick={() => openModal('notSupported')}
              >
                수강신청
              </button>
              <button
                className="floatBtn outlineWhiteBtn"
                onClick={() => openModal('notSupported')}
              >
                예비수강신청
              </button>
            </div>
          </div>

          {!isFloatingMenuOpen ? (
            <button
              className="mobile-float-btn"
              onClick={() => setIsFloatingMenuOpen(true)}
            >
              +
            </button>
          ) : (
            <div className="mobile-float-menu">
              <button
                className="floatBtn outlineBtn"
                onClick={() => openModal('notSupported')}
              >
                관심강좌 저장
              </button>
              <button
                className="floatBtn fillBlueBtn"
                onClick={handleAddToCart}
              >
                장바구니 담기
              </button>

              <div className="floatLine"></div>

              <div className="captchaRow">
                <div className="captchaBox">
                  {captcha.captchaDigits.map((digit, index) => (
                    <span
                      key={index}
                      className="captchaDigit"
                      style={{
                        transform: `rotate(${digit.rotation}deg) translateY(${digit.yOffset}px) translateX(${digit.xOffset}px)`,
                        color: digit.color,
                        fontSize: `${digit.fontSize}px`,
                      }}
                    >
                      {digit.value}
                    </span>
                  ))}
                </div>
                <input
                  className="captchaInput"
                  placeholder="입 력"
                  value={captcha.captchaInput}
                  onChange={(e) => captcha.setCaptchaInput(e.target.value)}
                />
              </div>

              <button
                className="floatBtn fillRedBtn"
                onClick={() => openModal('notSupported')}
              >
                수강신청
              </button>
              <button
                className="floatBtn outlineWhiteBtn"
                onClick={() => openModal('notSupported')}
              >
                예비수강신청
              </button>

              <div className="mobile-float-close">
                <button onClick={() => setIsFloatingMenuOpen(false)}>✕</button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
