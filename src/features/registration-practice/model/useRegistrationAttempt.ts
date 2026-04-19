import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQueryClient } from '@tanstack/react-query';
import { isApiError } from '@shared/api/fetch';

import { practiceAttemptApi } from '../api/registrationApi';
import { calculateQueueInfo } from '../lib/registrationUtils';
import { enrolledCoursesKeys } from './useEnrolledCoursesQuery';
import type { WarningType } from '../ui/RegistrationWarning';
import type { SelectedCourseInfo, WaitingInfo } from './types';

export interface UseRegistrationAttemptOptions {
  isPracticeRunning: boolean;
  currentTime: Date;
  selectedCourseId: number | null;
  selectedCourseInfo: SelectedCourseInfo | null;
  validateCaptcha: () => boolean;
  onCaptchaReset: () => void;
  onSelectionClear: () => void;
}

export interface UseRegistrationAttemptReturn {
  warningType: WarningType;
  setWarningType: (type: WarningType) => void;
  waitingInfo: WaitingInfo | null;
  showSuccessModal: boolean;
  succeededCourseIds: Set<number>;
  fullCourseIds: Set<number>;
  handleRegisterAttempt: () => Promise<void>;
  proceedToApiCall: () => Promise<void>;
  handleSuccessClose: (moveToHistory: boolean) => void;
  resetAttemptState: () => void;
}

export function useRegistrationAttempt({
  isPracticeRunning,
  currentTime,
  selectedCourseId,
  selectedCourseInfo,
  validateCaptcha,
  onCaptchaReset,
  onSelectionClear,
}: UseRegistrationAttemptOptions): UseRegistrationAttemptReturn {
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const [warningType, setWarningType] = useState<WarningType>('none');
  const [waitingInfo, setWaitingInfo] = useState<WaitingInfo | null>(null);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [succeededCourseIds, setSucceededCourseIds] = useState<Set<number>>(
    new Set()
  );
  const [fullCourseIds, setFullCourseIds] = useState<Set<number>>(new Set());

  const handleRegisterAttempt = async () => {
    if (!isPracticeRunning) {
      setWarningType('practiceNotStarted');
      onCaptchaReset();
      onSelectionClear();
      return;
    }

    if (selectedCourseId === null) {
      setWarningType('notChosen');
      onCaptchaReset();
      return;
    }

    onCaptchaReset();
    if (!validateCaptcha()) {
      setWarningType('captchaError');
      onSelectionClear();
      return;
    }

    const targetTime = new Date(currentTime);
    targetTime.setHours(8, 30, 0, 0);

    const diffMs = currentTime.getTime() - targetTime.getTime();

    if (diffMs < 0) {
      setWarningType('beforeTime');
      onSelectionClear();
      return;
    }

    if (succeededCourseIds.has(selectedCourseId)) {
      setWarningType('alreadyAttempted');
      onSelectionClear();
      return;
    }

    if (fullCourseIds.has(selectedCourseId)) {
      setWarningType('quotaOver');
      onSelectionClear();
      return;
    }

    const queueData = calculateQueueInfo(diffMs);

    if (queueData.queueCount > 0) {
      setWaitingInfo({
        count: queueData.queueCount,
        seconds: queueData.waitSeconds,
      });
    } else {
      await proceedToApiCall();
    }
  };

  const proceedToApiCall = async () => {
    setWaitingInfo(null);

    const currentCourseId = selectedCourseId!;
    const currentCourseInfo = selectedCourseInfo!;

    try {
      const payload = {
        courseId: currentCourseId,
        totalCompetitors: currentCourseInfo.totalCompetitors,
        capacity: currentCourseInfo.capacity,
      };

      const response = await practiceAttemptApi(payload);

      if (!response.data.isSuccess) {
        setWarningType('quotaOver');
        setFullCourseIds((prev) => new Set(prev).add(currentCourseId));
      } else {
        onSelectionClear();
        setShowSuccessModal(true);
        setSucceededCourseIds((prev) => new Set(prev).add(currentCourseId));
        queryClient.invalidateQueries({ queryKey: enrolledCoursesKeys.all });
      }
    } catch (error) {
      if (isApiError(error)) {
        alert(error.data.message || '수강신청에 실패했습니다.');
      } else {
        alert('수강신청 요청 중 오류가 발생했습니다.');
      }
    }
  };

  const handleSuccessClose = (moveToHistory: boolean) => {
    setShowSuccessModal(false);
    if (moveToHistory) {
      navigate('/enrollment-history');
    }
    onSelectionClear();
  };

  const resetAttemptState = () => {
    setSucceededCourseIds(new Set());
    setFullCourseIds(new Set());
  };

  return {
    warningType,
    setWarningType,
    waitingInfo,
    showSuccessModal,
    succeededCourseIds,
    fullCourseIds,
    handleRegisterAttempt,
    proceedToApiCall,
    handleSuccessClose,
    resetAttemptState,
  };
}
