import { useState, useRef, useEffect } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { isApiError } from '@shared/api/fetch';

import { practiceStartApi, practiceEndApi } from '../api/registrationApi';
import { enrolledCoursesKeys } from './useEnrolledCoursesQuery';
import type { VirtualStartTimeOption } from './types';

export interface UsePracticeTimerOptions {
  pipWindow: Window | null;
  openWindow: () => Promise<Window | null>;
  closeWindow: () => void;
  onPracticeEnd?: () => void;
}

export interface UsePracticeTimerReturn {
  currentTime: Date;
  startOffset: number;
  setStartOffset: (offset: number) => void;
  isRunning: boolean;
  isCooldown: boolean;
  handleStartPractice: () => Promise<void>;
  handleStopPractice: (isManual?: boolean) => Promise<void>;
  handleToggleWithCooldown: () => void;
  resetPracticeState: () => void;
}

interface PracticeState {
  timerId: number | undefined;
  isRunning: boolean;
  startTime: number;
  virtualOffset: number;
}

const getTimeOption = (offset: number): VirtualStartTimeOption => {
  const optionMap: Record<number, VirtualStartTimeOption> = {
    60: 'TIME_08_29_00',
    30: 'TIME_08_29_30',
    15: 'TIME_08_29_45',
  };
  return optionMap[offset] || 'TIME_08_29_30';
};

const createInitialTime = (): Date => {
  const now = new Date();
  now.setHours(8, 29, 30, 0);
  return now;
};

export function usePracticeTimer({
  pipWindow,
  openWindow,
  closeWindow,
  onPracticeEnd,
}: UsePracticeTimerOptions): UsePracticeTimerReturn {
  const queryClient = useQueryClient();
  const [currentTime, setCurrentTime] = useState<Date>(createInitialTime);
  const [startOffset, setStartOffset] = useState<number>(0);
  const [isCooldown, setIsCooldown] = useState(false);

  const practiceState = useRef<PracticeState>({
    timerId: undefined,
    isRunning: false,
    startTime: 0,
    virtualOffset: 0,
  });

  const startTimerAndPip = async () => {
    const offsetSeconds = startOffset === 0 ? 30 : startOffset;
    const virtualStart = new Date();
    virtualStart.setHours(8, 30, 0, 0);
    virtualStart.setSeconds(virtualStart.getSeconds() - offsetSeconds);

    practiceState.current.startTime = Date.now();
    practiceState.current.virtualOffset = virtualStart.getTime();

    setCurrentTime(virtualStart);
    practiceState.current.isRunning = true;
    openWindow();
  };

  const handleStopPractice = async (isManual = false) => {
    if (!practiceState.current.isRunning) return;
    practiceState.current.isRunning = false;

    if (practiceState.current.timerId) {
      clearTimeout(practiceState.current.timerId);
      practiceState.current.timerId = undefined;
    }

    closeWindow();

    try {
      await practiceEndApi();
      queryClient.invalidateQueries({ queryKey: enrolledCoursesKeys.all });
      if (!isManual && onPracticeEnd) {
        onPracticeEnd();
      }
    } catch (error) {
      if (isApiError(error)) {
        alert(
          `연습 종료 실패: ${error.data.message || '알 수 없는 오류'}`
        );
      } else {
        alert('연습 종료 중 네트워크 오류가 발생했습니다.');
      }
    }
  };

  const handleStartPractice = async () => {
    // 매크로 방지용 랜덤 offset 생성 (0~999ms)
    const randomOffsetMs = Math.floor(Math.random() * 1000);

    const startPracticeWithOffset = async () => {
      const virtualStartTimeOption = getTimeOption(startOffset);
      await practiceStartApi({ virtualStartTimeOption, randomOffsetMs });

      // 백엔드와 시간 동기화를 위해 offset만큼 delay 후 PIP 창 열기
      setTimeout(() => {
        startTimerAndPip();
      }, randomOffsetMs);
    };

    try {
      await startPracticeWithOffset();
    } catch (error) {
      if (isApiError(error)) {
        if (error.status === 409) {
          try {
            await practiceEndApi();
            await startPracticeWithOffset();
          } catch {
            alert('이미 연습 중인 상태를 종료하는 데 실패했습니다.');
          }
        } else {
          alert(
            `연습 시작 실패: ${error.data.message || '알 수 없는 오류'}`
          );
        }
      } else {
        alert('연습 시작 중 네트워크 오류가 발생했습니다.');
      }
    }
  };

  const handleToggleWithCooldown = () => {
    if (isCooldown) return;

    if (pipWindow) {
      handleStopPractice(true);
    } else {
      handleStartPractice();
    }

    setIsCooldown(true);

    setTimeout(() => {
      setIsCooldown(false);
    }, 1500);
  };

  const resetPracticeState = () => {
    setCurrentTime(createInitialTime());
  };

  // Timer effect — 매 정초에 맞춰 자기 보정하는 setTimeout 체인
  useEffect(() => {
    if (!pipWindow) return;

    const state = practiceState.current;

    if (state.timerId) clearTimeout(state.timerId);

    const tick = () => {
      const now = Date.now();
      const elapsed = now - state.startTime;
      const nextTime = new Date(state.virtualOffset + elapsed);

      setCurrentTime(nextTime);

      if (nextTime.getHours() === 8 && nextTime.getMinutes() >= 33) {
        handleStopPractice(false);
        return;
      }

      const msUntilNextSecond = 1000 - (elapsed % 1000);
      state.timerId = window.setTimeout(tick, msUntilNextSecond);
    };

    const initialElapsed = Date.now() - state.startTime;
    const initialDelay = 1000 - (initialElapsed % 1000);
    state.timerId = window.setTimeout(tick, initialDelay);

    return () => {
      if (state.timerId) {
        clearTimeout(state.timerId);
      }
      if (!pipWindow.closed) {
        pipWindow.close();
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pipWindow]);

  // Cleanup on unmount
  useEffect(() => {
    const state = practiceState.current;
    return () => {
      if (state.isRunning) {
        if (state.timerId) {
          clearTimeout(state.timerId);
        }

        state.isRunning = false;

        practiceEndApi().catch((error) => {
          console.error('세션 자동 종료 실패:', error);
        });
      }
    };
  }, []);

  return {
    currentTime,
    startOffset,
    setStartOffset,
    isRunning: practiceState.current.isRunning,
    isCooldown,
    handleStartPractice,
    handleStopPractice,
    handleToggleWithCooldown,
    resetPracticeState,
  };
}
