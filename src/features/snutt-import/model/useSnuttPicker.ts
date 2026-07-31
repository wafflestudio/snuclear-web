import { useCallback, useEffect, useRef, useState } from 'react';
import { isSnuttTimetableMessage } from './snuttMapper';
import type { SnuttSharedTimetable } from './types';

const SNUTT_ORIGIN = import.meta.env.VITE_SNUTT_ORIGIN as string | undefined;

const POPUP_WIDTH = 1000;
const POPUP_HEIGHT = 800;
const POPUP_POLL_INTERVAL = 500;

export type SnuttPickerStatus =
  | 'idle'
  /** 팝업이 열려 있고 사용자의 선택을 기다리는 중 */
  | 'waiting'
  | 'received'
  | 'error';

export interface UseSnuttPickerResult {
  status: SnuttPickerStatus;
  timetable: SnuttSharedTimetable | null;
  errorMessage: string | null;
  open: () => void;
  reset: () => void;
}

/**
 * SNUTT 시간표 피커를 팝업으로 열고 postMessage로 결과를 수신한다.
 *
 * 보안: 수신 메시지는 반드시 event.origin이 SNUTT 도메인과 일치하는지
 * 확인한 뒤에만 처리한다. 검증이 없으면 임의의 창이 시간표 데이터를
 * 주입할 수 있다.
 */
export function useSnuttPicker(): UseSnuttPickerResult {
  const [status, setStatus] = useState<SnuttPickerStatus>('idle');
  const [timetable, setTimetable] = useState<SnuttSharedTimetable | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const popupRef = useRef<Window | null>(null);
  const pollRef = useRef<number | null>(null);

  const cleanupPoll = useCallback(() => {
    if (pollRef.current !== null) {
      window.clearInterval(pollRef.current);
      pollRef.current = null;
    }
  }, []);

  const closePopup = useCallback(() => {
    cleanupPoll();
    if (popupRef.current && !popupRef.current.closed) {
      popupRef.current.close();
    }
    popupRef.current = null;
  }, [cleanupPoll]);

  const reset = useCallback(() => {
    closePopup();
    setStatus('idle');
    setTimetable(null);
    setErrorMessage(null);
  }, [closePopup]);

  const open = useCallback(() => {
    if (!SNUTT_ORIGIN) {
      setStatus('error');
      setErrorMessage(
        'SNUTT 연동 주소가 설정되지 않았습니다. 관리자에게 문의해 주세요.'
      );
      return;
    }

    setTimetable(null);
    setErrorMessage(null);

    const url = `${SNUTT_ORIGIN}/timetable-picker?origin=${encodeURIComponent(
      window.location.origin
    )}`;

    const left = window.screenX + (window.outerWidth - POPUP_WIDTH) / 2;
    const top = window.screenY + (window.outerHeight - POPUP_HEIGHT) / 2;

    const popup = window.open(
      url,
      'snutt-timetable-picker',
      `width=${POPUP_WIDTH},height=${POPUP_HEIGHT},left=${left},top=${top}`
    );

    if (!popup) {
      setStatus('error');
      setErrorMessage(
        '팝업이 차단되었습니다. 브라우저의 팝업 차단을 해제한 뒤 다시 시도해 주세요.'
      );
      return;
    }

    popupRef.current = popup;
    setStatus('waiting');

    // 사용자가 시간표를 고르지 않고 팝업을 닫은 경우를 감지
    cleanupPoll();
    pollRef.current = window.setInterval(() => {
      if (popupRef.current?.closed) {
        cleanupPoll();
        popupRef.current = null;
        setStatus((prev) => (prev === 'waiting' ? 'idle' : prev));
      }
    }, POPUP_POLL_INTERVAL);
  }, [cleanupPoll]);

  useEffect(() => {
    const handleMessage = (event: MessageEvent) => {
      // origin 검증 — 반드시 먼저 확인한다
      if (!SNUTT_ORIGIN || event.origin !== SNUTT_ORIGIN) return;
      if (!isSnuttTimetableMessage(event.data)) return;

      setTimetable(event.data.payload);
      setStatus('received');
      closePopup();
    };

    window.addEventListener('message', handleMessage);
    return () => window.removeEventListener('message', handleMessage);
  }, [closePopup]);

  // 언마운트 시 팝업/폴링 정리
  useEffect(() => closePopup, [closePopup]);

  return { status, timetable, errorMessage, open, reset };
}
