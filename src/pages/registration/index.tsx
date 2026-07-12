import { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import {
  DndContext,
  closestCenter,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import {
  usePracticeWindow,
  useCaptcha,
  useCourseSelection,
  usePracticeTimer,
  useRegistrationAttempt,
  PracticeClock,
  WarningModal as RegistrationWarningModal,
  WaitingModal,
  SuccessModal,
  SortableCourseItem,
  type CourseData,
} from '@features/registration-practice';
import { useCartQuery } from '@features/cart-management';
import { useModalStore } from '@shared/model/modalStore';
import { WarningModal } from '@shared/ui/Warning';
import './registration.css';

export default function Registration() {
  const { pipWindow, openWindow, closeWindow } = usePracticeWindow();
  const { openModal, closeModal } = useModalStore();
  const isPracticeEndOpen = useModalStore((s) => s.openModals.has('registration/practiceEnd'));

  // Custom hooks
  const captcha = useCaptcha();
  const courseSelection = useCourseSelection();

  const timer = usePracticeTimer({
    pipWindow,
    openWindow,
    closeWindow,
    onPracticeEnd: () => openModal('registration/practiceEnd'),
  });

  const attempt = useRegistrationAttempt({
    isPracticeRunning: !!pipWindow,
    currentTime: timer.currentTime,
    selectedCourseId: courseSelection.selectedCourseId,
    selectedCourseInfo: courseSelection.selectedCourseInfo,
    validateCaptcha: captcha.validate,
    onCaptchaReset: captcha.reset,
    onSelectionClear: courseSelection.clear,
  });

  // Cart data and local course list management
  const { data: cartData } = useCartQuery(true);
  const [localCourseList, setLocalCourseList] = useState<CourseData[]>([]);
  const [isDraggingActive, setIsDraggingActive] = useState(false);
  const [isMobileWarningOpen, setMobileWarningOpen] = useState(false);

  const handlePracticeToggle = () => {
    if (!pipWindow && /Android|iPhone|iPad|iPod/i.test(navigator.userAgent)) {
      setMobileWarningOpen(true);
      return;
    }
    timer.handleToggleWithCooldown();
  };
  const hasUserReordered = useRef(false);

  useEffect(() => {
    if (!cartData || isDraggingActive) return;

    setLocalCourseList((prevList) => {
      if (prevList.length === 0) {
        return cartData.map((item) => ({
          preEnrollId: item.preEnrollId,
          course: item.course,
          cartCount: item.cartCount,
        }));
      }

      if (!hasUserReordered.current) {
        return cartData.map((item) => ({
          preEnrollId: item.preEnrollId,
          course: item.course,
          cartCount: item.cartCount,
        }));
      }

      const serverDataMap = new Map(
        cartData.map((item) => [item.course.id, item])
      );

      const updatedList = prevList
        .filter((local) => serverDataMap.has(local.course.id))
        .map((local) => {
          const serverItem = serverDataMap.get(local.course.id)!;
          return {
            preEnrollId: serverItem.preEnrollId,
            course: serverItem.course,
            cartCount: serverItem.cartCount,
          };
        });

      const existingIds = new Set(updatedList.map((item) => item.course.id));
      const newItems = cartData
        .filter((item) => !existingIds.has(item.course.id))
        .map((item) => ({
          preEnrollId: item.preEnrollId,
          course: item.course,
          cartCount: item.cartCount,
        }));

      return [...updatedList, ...newItems];
    });
  }, [cartData, isDraggingActive]);

  // Reset attempt state when practice starts
  useEffect(() => {
    if (pipWindow) {
      attempt.resetAttemptState();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pipWindow]);

  const courseList = localCourseList.length > 0 ? localCourseList : null;

  // Drag and drop
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: { distance: 5 },
    })
  );

  const handleDragStart = () => setIsDraggingActive(true);

  const handleDragEnd = (event: DragEndEvent) => {
    setIsDraggingActive(false);
    const { active, over } = event;

    if (over && active.id !== over.id) {
      hasUserReordered.current = true;
      setLocalCourseList((items) => {
        const oldIndex = items.findIndex(
          (item) => item.course.id === active.id
        );
        const newIndex = items.findIndex((item) => item.course.id === over.id);
        return arrayMove(items, oldIndex, newIndex);
      });
    }
  };

  return (
    <div className="registrationPage">
      <div className="containerX">
        <div className="regHeader">
          <h2 className="regTitle">수강신청</h2>
        </div>

        <div className="regTabs">
          <button className="regTabItem active">장바구니 보류강좌</button>
          <p className="regTabInfoText">
            ※ 장바구니 탭에서 담은 수를 수정할 수 있습니다.
            <br />※ 마우스 드래그를 통해 강의 순서를 변경할 수 있습니다.
            <br />※ 변경한 강의 순서는 페이지를 새로고침 하면 리셋됩니다.
          </p>
        </div>

        <div className="regMobilePracticeArea">
          <div className="mobilePracticeControls">
            <button
              className={`mobilePracticeToggleBtn ${pipWindow ? 'active' : ''}`}
              onClick={handlePracticeToggle}
              disabled={timer.isCooldown}
              style={{
                cursor: timer.isCooldown ? 'not-allowed' : 'pointer',
                opacity: timer.isCooldown ? 0.6 : 1,
              }}
            >
              {timer.isCooldown
                ? '잠시 대기... (1.5s)'
                : pipWindow
                  ? '연습 종료 (Stop)'
                  : '연습 모드 (Start)'}
            </button>
            <select
              className="mobilePracticeDropdown"
              value={timer.startOffset}
              onChange={(e) => timer.setStartOffset(Number(e.target.value))}
            >
              <option value={0} disabled hidden>연습 시작 설정</option>
              <option value={60}>60초 전</option>
              <option value={30}>30초 전</option>
              <option value={15}>15초 전</option>
            </select>
          </div>
          <p className="mobilePracticeInfo">
            ※ 타이머 기본값: 30초전 (8시 29분 30초)
          </p>
        </div>

        <div className="regInfoLine">
          신청가능학점 <span className="infoNum">21</span>학점 / 신청학점{' '}
          <span className="infoNum">0</span>학점 / 신청강좌{' '}
          <span className="infoNum">0</span>강좌
        </div>

        <div className="regContent">
          <div className="regLeftColumn">
            <hr className="regDarkSeparator" />
            {courseList?.length === 0 ? (
              <div className="stateMessage">
                장바구니에 남은 보류강좌가 없습니다.
              </div>
            ) : (
              <DndContext
                sensors={sensors}
                collisionDetection={closestCenter}
                onDragStart={handleDragStart}
                onDragEnd={handleDragEnd}
              >
                <SortableContext
                  items={courseList?.map((c) => c.course.id) ?? []}
                  strategy={verticalListSortingStrategy}
                >
                  <div className="courseListContainer">
                    {courseList?.map((c) => (
                      <SortableCourseItem
                        key={c.course.id}
                        courseData={c}
                        isSelected={
                          courseSelection.selectedCourseId === c.course.id
                        }
                        onSelect={() =>
                          courseSelection.handleSelectCourse(
                            c.course.id,
                            0,
                            c.course.quota,
                            c.cartCount,
                            c.course.courseTitle,
                            c.course.courseNumber,
                            c.course.lectureNumber || ''
                          )
                        }
                      />
                    ))}
                  </div>
                </SortableContext>
              </DndContext>
            )}
          </div>

          <div className="regRightColumn">
            <div className="regFloatingBox">
              <div className="regCaptchaRow">
                <div className="regCaptchaDisplay">
                  {captcha.captchaDigits.map((digit, index) => (
                    <span
                      key={index}
                      className="regCaptchaDigit"
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
                <div className="regInputWrapper">
                  <input
                    className="regCaptchaInput"
                    placeholder="입 력"
                    name="captchaInput"
                    autoComplete="off"
                    value={captcha.captchaInput}
                    onChange={(e) => captcha.setCaptchaInput(e.target.value)}
                  />
                </div>
              </div>

              <button
                className="regSubmitBtn"
                onClick={attempt.handleRegisterAttempt}
              >
                수강신청
              </button>
            </div>

            <div className="practiceArea">
              <button
                className={`practiceToggleBtn ${pipWindow ? 'active' : ''}`}
                onClick={handlePracticeToggle}
                disabled={timer.isCooldown}
                aria-label="연습 시작 시간 설정"
                style={{
                  cursor: timer.isCooldown ? 'not-allowed' : 'pointer',
                  opacity: timer.isCooldown ? 0.6 : 1,
                  transition: 'all 0.2s ease',
                }}
              >
                {timer.isCooldown
                  ? '잠시 대기... (1.5s)'
                  : pipWindow
                    ? '연습 종료 (Stop)'
                    : '연습 모드 (Start)'}
              </button>
              <select
                className="timeSettingDropdown"
                value={timer.startOffset}
                onChange={(e) => timer.setStartOffset(Number(e.target.value))}
              >
                <option value={0} disabled hidden>
                  연습 시작 설정
                </option>
                <option value={60}>60초 전</option>
                <option value={30}>30초 전</option>
                <option value={15}>15초 전</option>
              </select>
              <p className="timeSettingInfo">
                ※ 타이머 기본값: 30초전
                <br />
                (8시 29분 30초)
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="regMobileBottomBar">
        <div className="regMobileCaptchaGroup">
          <div className="regMobileCaptcha">
            {captcha.captchaDigits.map((digit, index) => (
              <span
                key={index}
                className="regCaptchaDigit"
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
          <div className="regMobileInput">
            <input
              className="regMobileCaptchaInput"
              placeholder="입 력"
              name="mobileCaptchaInput"
              autoComplete="off"
              value={captcha.captchaInput}
              onChange={(e) => captcha.setCaptchaInput(e.target.value)}
            />
          </div>
        </div>
        <button
          className="regMobileSubmitBtn"
          onClick={attempt.handleRegisterAttempt}
        >
          수강신청
        </button>
      </div>

      {pipWindow &&
        createPortal(
          <PracticeClock currentTime={timer.currentTime} />,
          pipWindow.document.body
        )}

      {attempt.waitingInfo &&
        createPortal(
          <WaitingModal
            initialQueueCount={attempt.waitingInfo.count}
            initialWaitSeconds={attempt.waitingInfo.seconds}
            onComplete={attempt.proceedToApiCall}
          />,
          document.body
        )}

      {attempt.showSuccessModal &&
        createPortal(
          <SuccessModal
            onKeep={() => attempt.handleSuccessClose(false)}
            onGoToHistory={() => attempt.handleSuccessClose(true)}
          />,
          document.body
        )}

      {attempt.warningType !== 'none' &&
        createPortal(
          <RegistrationWarningModal
            warningType={attempt.warningType}
            onClose={() => {
              attempt.setWarningType('none');
              courseSelection.clear();
            }}
            courseTitle={courseSelection.selectedCourseInfo?.title ?? null}
            courseNumber={
              courseSelection.selectedCourseInfo?.courseNumber ?? null
            }
            lectureNumber={
              courseSelection.selectedCourseInfo?.lectureNumber ?? null
            }
          />,
          document.body
        )}

      {isPracticeEndOpen &&
        createPortal(
          <WarningModal.Alert
            isOpen={isPracticeEndOpen}
            onClose={() => closeModal('registration/practiceEnd')}
            icon="warning"
            title="연습 시간이 종료되었습니다! (08:33)"
          />,
          document.body
        )}

      {isMobileWarningOpen &&
        createPortal(
          <WarningModal.Alert
            isOpen={isMobileWarningOpen}
            onClose={() => setMobileWarningOpen(false)}
            icon="warning"
            title="모바일 환경에서는 수강신청 연습을 지원하지 않습니다."
            subtitle="PC 환경에서 시도해주세요"
          />,
          document.body
        )}
    </div>
  );
}
