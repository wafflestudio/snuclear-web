import { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { useQuery } from '@tanstack/react-query';
import { useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '@features/auth';
import { WarningModal } from '@shared/ui/Warning';
import { completeTourApi, getTourStatusApi } from '../api/tourApi';
import { useIsDesktop } from '../model/useIsDesktop';
import { TOUR_KEYWORD } from '../model/tutorialCourse';
import { useTourStore } from '../model/tourStore';
import type { TourStep } from '../model/types';
import './tour.css';

const TOUR_STEP_META: Record<
  TourStep,
  {
    targetId: string;
    message: string;
    placement?: 'top' | 'bottom' | 'left' | 'right';
  }
> = {
  searchIntro: {
    targetId: 'header-search-input',
    message: '검색창을 통해 과목을 검색할 수 있습니다.',
    placement: 'bottom',
  },
  searchType: {
    targetId: 'header-search-box',
    message: `'${TOUR_KEYWORD}'이라고 검색해보세요`,
    placement: 'bottom',
  },
  searchCheck: {
    targetId: 'search-course-check',
    message: '체크표시를 누르세요',
    placement: 'right',
  },
  searchAddToCart: {
    targetId: 'search-add-cart',
    message: '장바구니 담기를 클릭하세요',
    placement: 'left',
  },
  searchGoToCart: {
    targetId: 'search-go-cart',
    message: '장바구니로 이동을 누르세요',
    placement: 'right',
  },
  cartCount: {
    targetId: 'cart-count',
    message:
      '이곳을 눌러 담은 수를 변경하세요. 담은 수가 정원을 초과하면 수강신청 탭에서 수강신청 할 수 있습니다.',
    placement: 'left',
  },
  cartGoRegistration: {
    targetId: 'nav-registration',
    message: '이곳을 눌러 수강신청 탭으로 이동하세요.',
    placement: 'bottom',
  },
  registrationTimer: {
    targetId: 'registration-timer',
    message: '연습 시작 시간을 선택하세요',
    placement: 'left',
  },
  registrationStart: {
    targetId: 'registration-start',
    message: '연습 시작 버튼을 누르세요',
    placement: 'left',
  },
  registrationWaiting: {
    targetId: 'registration-start',
    message: '수신 시간이 될 때까지 기다리세요',
    placement: 'left',
  },
  registrationCheck: {
    targetId: 'registration-course-check',
    message: '체크표시를 누르세요',
    placement: 'right',
  },
  registrationCaptcha: {
    targetId: 'registration-captcha-input',
    message: '숫자를 입력하세요',
    placement: 'top',
  },
  registrationSubmit: {
    targetId: 'registration-submit',
    message: '수강신청 버튼을 누르세요',
    placement: 'left',
  },
  registrationGoHistory: {
    targetId: 'nav-enrollment-history',
    message: '이곳을 누르면 결과를 확인 하실 수 있습니다.',
    placement: 'bottom',
  },
  historyResult: {
    targetId: 'enrollment-result',
    message: '해당 페이지에서 수강신청 내역을 확인할 수 있습니다.',
    placement: 'top',
  },
};

interface TargetRect {
  top: number;
  left: number;
  width: number;
  height: number;
}

export function TourController() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const isDesktop = useIsDesktop();
  const [isIntroOpen, setIntroOpen] = useState(false);
  const [doNotShowAgain, setDoNotShowAgain] = useState(false);
  const [isDismissNoticeOpen, setDismissNoticeOpen] = useState(false);
  const [isDismissErrorOpen, setDismissErrorOpen] = useState(false);
  const [isExitConfirmOpen, setExitConfirmOpen] = useState(false);
  const completionSentRef = useRef(false);
  const completionTimerRef = useRef<number | null>(null);

  const {
    isActive,
    currentStep,
    publishedAt,
    hasPrompted,
    start,
    stop,
    complete,
    markPrompted,
    setPublishedAt,
  } = useTourStore();

  const statusQuery = useQuery({
    queryKey: ['tour', 'status', user?.id],
    queryFn: async () => {
      const response = await getTourStatusApi();
      return response.data;
    },
    enabled: !!user && !user.admin && isDesktop,
    retry: 1,
    refetchOnWindowFocus: false,
  });

  useEffect(() => {
    if (!statusQuery.data) return;
    setPublishedAt(statusQuery.data.publishedAt);
    if (statusQuery.data.shouldShow && !hasPrompted && !isActive) {
      markPrompted();
      const timerId = window.setTimeout(() => setIntroOpen(true), 0);
      return () => window.clearTimeout(timerId);
    }
  }, [
    hasPrompted,
    isActive,
    markPrompted,
    setPublishedAt,
    statusQuery.data,
  ]);

  useEffect(() => {
    if (!isDesktop && isActive) {
      stop();
    }
  }, [isActive, isDesktop, stop]);

  useEffect(() => {
    if (!isActive || !currentStep) return;

    const targetPathByStep: Partial<Record<TourStep, string>> = {
      searchIntro: '/',
      searchType: '/',
      searchCheck: '/search',
      searchAddToCart: '/search',
      searchGoToCart: '/search',
      cartCount: '/cart',
      cartGoRegistration: '/cart',
      registrationTimer: '/registration',
      registrationStart: '/registration',
      registrationWaiting: '/registration',
      registrationCheck: '/registration',
      registrationCaptcha: '/registration',
      registrationSubmit: '/registration',
      registrationGoHistory: '/registration',
      historyResult: '/enrollment-history',
    };
    const targetPath = targetPathByStep[currentStep];

    if (targetPath && location.pathname !== targetPath) {
      if (targetPath === '/search') {
        navigate(`/search?query=${encodeURIComponent(TOUR_KEYWORD)}&tour=1`);
      } else {
        navigate(targetPath);
      }
    }
  }, [currentStep, isActive, location.pathname, navigate]);

  useEffect(() => {
    if (
      statusQuery.isError &&
      import.meta.env.DEV &&
      user &&
      !hasPrompted &&
      !isActive
    ) {
      setPublishedAt(new Date().toISOString());
      markPrompted();
      const timerId = window.setTimeout(() => setIntroOpen(true), 0);
      return () => window.clearTimeout(timerId);
    }
  }, [
    hasPrompted,
    isActive,
    markPrompted,
    setPublishedAt,
    statusQuery.isError,
    user,
  ]);

  useEffect(() => {
    return () => {
      if (completionTimerRef.current !== null) {
        window.clearTimeout(completionTimerRef.current);
      }
    };
  }, []);

  useEffect(() => {
    if (!isActive || currentStep !== 'historyResult') return;
    if (completionSentRef.current) return;

    completionSentRef.current = true;
    const finish = async () => {
      if (publishedAt) {
        try {
          await completeTourApi({ publishedAt });
        } catch (error) {
          console.error('[Tour] completion failed:', error);
        }
      }
      complete();
    };

    completionTimerRef.current = window.setTimeout(() => {
      completionTimerRef.current = null;
      void finish();
    }, 2500);
  }, [complete, currentStep, isActive, publishedAt]);

  const handleStart = () => {
    completionSentRef.current = false;
    setIntroOpen(false);
    setDoNotShowAgain(false);
    navigate('/');
    window.scrollTo(0, 0);
    start(publishedAt);
  };

  const handleDismiss = async () => {
    setIntroOpen(false);

    if (doNotShowAgain && publishedAt) {
      try {
        await completeTourApi({ publishedAt });
        setDismissNoticeOpen(true);
      } catch (error) {
        console.error('[Tour] dismiss completion failed:', error);
        setDismissErrorOpen(true);
      }
    }

    setDoNotShowAgain(false);
  };

  const handleExitConfirm = () => {
    setExitConfirmOpen(false);
    stop();

    const params = new URLSearchParams(location.search);
    if (params.has('tour')) {
      params.delete('tour');
      const nextSearch = params.toString();
      navigate(
        {
          pathname: location.pathname,
          search: nextSearch ? `?${nextSearch}` : '',
        },
        { replace: true }
      );
    }
  };

  if (!isDesktop || !user || user.admin) return null;

  return (
    <>
      <WarningModal.Confirm
        isOpen={isIntroOpen}
        onCancel={handleDismiss}
        onConfirm={handleStart}
        icon="question"
        title="튜토리얼을 시작하시겠습니까?"
        subtitle="수강신청 연습사이트 이용 방법을 단계별로 안내합니다."
        cancelLabel="닫기"
        confirmLabel="진행하기"
      >
        <label className="tourIntroCheck">
          <input
            type="checkbox"
            checked={doNotShowAgain}
            onChange={(event) => setDoNotShowAgain(event.target.checked)}
          />
          <span>다시보지 않기</span>
        </label>
      </WarningModal.Confirm>

      <WarningModal.Alert
        isOpen={isDismissNoticeOpen}
        onClose={() => setDismissNoticeOpen(false)}
        icon="warning"
      >
        <p className="warningText">
          튜토리얼은 홈 화면 '튜토리얼'을 통해 진행할 수 있습니다.
        </p>
      </WarningModal.Alert>

      <WarningModal.Alert
        isOpen={isDismissErrorOpen}
        onClose={() => setDismissErrorOpen(false)}
        icon="warning"
      >
        <p className="warningText">
          다시보지 않기 저장에 실패했습니다. 다음 로그인 시 튜토리얼 안내가
          다시 표시될 수 있습니다.
        </p>
      </WarningModal.Alert>

      {isActive &&
        currentStep &&
        !isExitConfirmOpen &&
        createPortal(
          <TourOverlay
            step={currentStep}
            onExitRequest={() => setExitConfirmOpen(true)}
          />,
          document.body
        )}

      {isExitConfirmOpen &&
        createPortal(
          <WarningModal.Confirm
            isOpen={isExitConfirmOpen}
            onCancel={() => setExitConfirmOpen(false)}
            onConfirm={handleExitConfirm}
            icon="question"
            title="튜토리얼을 종료하시겠습니까?"
            subtitle="튜토리얼 탭에서 언제든지 다시 하실 수 있습니다"
            cancelLabel="계속하기"
            confirmLabel="종료하기"
          />,
          document.body
        )}
    </>
  );
}

function TourOverlay({
  step,
  onExitRequest,
}: {
  step: TourStep;
  onExitRequest: () => void;
}) {
  const meta = TOUR_STEP_META[step];
  const [rect, setRect] = useState<TargetRect | null>(null);

  useEffect(() => {
    let frameId = 0;
    let retryId = 0;

    const updateRect = () => {
      const target = document.querySelector<HTMLElement>(
        `[data-tour-id="${meta.targetId}"]`
      );

      if (!target) {
        setRect(null);
        retryId = window.setTimeout(updateRect, 100);
        return;
      }

      target.scrollIntoView({
        behavior: 'smooth',
        block: 'center',
        inline: 'center',
      });

      frameId = window.requestAnimationFrame(() => {
        const nextRect = target.getBoundingClientRect();
        if (nextRect.width === 0 || nextRect.height === 0) {
          setRect(null);
          retryId = window.setTimeout(updateRect, 100);
          return;
        }

        setRect({
          top: Math.max(0, nextRect.top),
          left: Math.max(0, nextRect.left),
          width: nextRect.width,
          height: nextRect.height,
        });
      });
    };

    updateRect();
    window.addEventListener('resize', updateRect);
    window.addEventListener('scroll', updateRect, true);

    return () => {
      window.cancelAnimationFrame(frameId);
      window.clearTimeout(retryId);
      window.removeEventListener('resize', updateRect);
      window.removeEventListener('scroll', updateRect, true);
    };
  }, [meta.targetId]);

  if (!rect) {
    return (
      <div className="tourLayer" data-tour-step={step}>
        <button
          type="button"
          className="tourExitBtn"
          aria-label="튜토리얼 종료"
          onClick={onExitRequest}
        >
          x
        </button>
      </div>
    );
  }

  const tooltipStyle = getTooltipStyle(rect, meta.placement ?? 'bottom');

  return (
    <div className="tourLayer" aria-live="polite" data-tour-step={step}>
      <div className="tourBlocker top" style={{ height: rect.top }} />
      <div
        className="tourBlocker left"
        style={{
          top: rect.top,
          width: rect.left,
          height: rect.height,
        }}
      />
      <div
        className="tourBlocker right"
        style={{
          top: rect.top,
          left: rect.left + rect.width,
          height: rect.height,
        }}
      />
      <div
        className="tourBlocker bottom"
        style={{ top: rect.top + rect.height }}
      />

      <div
        className="tourFocusRing"
        style={{
          top: rect.top,
          left: rect.left,
          width: rect.width,
          height: rect.height,
        }}
      />

      <div
        className={`tourTooltip ${meta.placement ?? 'bottom'}`}
        style={tooltipStyle}
      >
        <span className="tourTooltipArrow" />
        <p>{meta.message}</p>
      </div>

      <button
        type="button"
        className="tourExitBtn"
        aria-label="튜토리얼 종료"
        onClick={onExitRequest}
      >
        x
      </button>
    </div>
  );
}

function getTooltipStyle(
  rect: TargetRect,
  placement: 'top' | 'bottom' | 'left' | 'right'
) {
  const gap = 18;
  const width = Math.min(320, window.innerWidth - 32);
  const horizontalCenter = rect.left + rect.width / 2;
  const verticalCenter = rect.top + rect.height / 2;

  if (placement === 'top') {
    return {
      left: Math.min(
        window.innerWidth - width - 16,
        Math.max(16, horizontalCenter - width / 2)
      ),
      top: Math.max(16, rect.top - gap),
      transform: 'translateY(-100%)',
      width,
    };
  }

  if (placement === 'left') {
    return {
      left: Math.max(16, rect.left - width - gap),
      top: Math.max(16, verticalCenter),
      transform: 'translateY(-50%)',
      width,
    };
  }

  if (placement === 'right') {
    return {
      left: Math.min(
        window.innerWidth - width - 16,
        rect.left + rect.width + gap
      ),
      top: Math.max(16, verticalCenter),
      transform: 'translateY(-50%)',
      width,
    };
  }

  return {
    left: Math.min(
      window.innerWidth - width - 16,
      Math.max(16, horizontalCenter - width / 2)
    ),
    top: Math.min(window.innerHeight - 120, rect.top + rect.height + gap),
    width,
  };
}
