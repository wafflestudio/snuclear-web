import { useEffect, useMemo, useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { cartKeys } from '@features/cart-management';
import {
  addSnuttCoursesToCartApi,
  matchSnuttLecturesApi,
} from '../api/snuttImportApi';
import {
  formatSemester,
  formatSnuttClassTime,
  isTargetSemester,
  TARGET_SEMESTER,
  TARGET_YEAR,
  toSemester,
} from '../model/snuttMapper';
import { useSnuttPicker } from '../model/useSnuttPicker';
import type { SnuttMatchResult } from '../model/types';
import './snuttImport.css';

type Step = 'picking' | 'matching' | 'review' | 'submitting' | 'done';

const UNMATCHED_REASON_LABEL = {
  NO_COURSE_NUMBER: '교과목번호가 없는 강의',
  NOT_FOUND: `${TARGET_YEAR}-1학기 강좌 목록에 없음`,
} as const;

export interface SnuttImportModalProps {
  onClose: () => void;
}

/**
 * 열릴 때마다 새로 마운트되는 것을 전제로 한다(부모에서 조건부 렌더).
 * 덕분에 별도의 초기화 로직 없이 초기 state가 곧 시작 상태가 된다.
 */
export function SnuttImportModal({ onClose }: SnuttImportModalProps) {
  const queryClient = useQueryClient();
  const picker = useSnuttPicker();
  const { status: pickerStatus, timetable, open: openPicker } = picker;

  const [step, setStep] = useState<Step>('picking');
  const [matchResult, setMatchResult] = useState<SnuttMatchResult | null>(null);
  const [selectedIds, setSelectedIds] = useState<Set<number>>(new Set());
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [addedSummary, setAddedSummary] = useState<string | null>(null);

  // 마운트 시 SNUTT 팝업을 띄운다 (외부 시스템 연동)
  useEffect(() => {
    openPicker();
  }, [openPicker]);

  // 시간표를 수신하면 매칭을 수행한다
  useEffect(() => {
    if (pickerStatus !== 'received' || !timetable) return;

    let cancelled = false;

    const run = async () => {
      await Promise.resolve();
      if (cancelled) return;

      setStep('matching');
      setErrorMessage(null);

      try {
        const result = await matchSnuttLecturesApi(timetable.lecture_list);
        if (cancelled) return;

        setMatchResult(result);
        setSelectedIds(new Set(result.matched.map((item) => item.course.id)));
        setStep('review');
      } catch {
        if (cancelled) return;
        setErrorMessage(
          '강좌를 조회하지 못했습니다. 잠시 후 다시 시도해 주세요.'
        );
        setStep('review');
      }
    };

    void run();
    return () => {
      cancelled = true;
    };
  }, [pickerStatus, timetable]);

  const semesterMismatch = useMemo(
    () => (timetable ? !isTargetSemester(timetable) : false),
    [timetable]
  );

  const toggleCourse = (courseId: number) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(courseId)) {
        next.delete(courseId);
      } else {
        next.add(courseId);
      }
      return next;
    });
  };

  const handleSubmit = async () => {
    if (!matchResult || selectedIds.size === 0) return;

    const targets = matchResult.matched.filter((item) =>
      selectedIds.has(item.course.id)
    );

    setStep('submitting');
    setErrorMessage(null);

    try {
      const result = await addSnuttCoursesToCartApi(targets);
      await queryClient.invalidateQueries({ queryKey: cartKeys.lists });

      const parts = [`${result.addedCount}개를 장바구니에 담았습니다.`];
      if (result.skippedCount > 0) {
        parts.push(`이미 담겨 있던 ${result.skippedCount}개는 건너뛰었습니다.`);
      }
      if (result.failedTitles.length > 0) {
        parts.push(`실패: ${result.failedTitles.join(', ')}`);
      }

      setAddedSummary(parts.join(' '));
      setStep('done');
    } catch {
      setErrorMessage('장바구니에 담지 못했습니다. 다시 시도해 주세요.');
      setStep('review');
    }
  };

  return (
    <div className="snuttOverlay" onClick={onClose}>
      <div
        className="snuttModal"
        role="dialog"
        aria-modal="true"
        aria-label="SNUTT에서 시간표 불러오기"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="snuttHead">
          <h2 className="snuttTitle">SNUTT에서 불러오기</h2>
          <button
            type="button"
            className="snuttCloseBtn"
            aria-label="닫기"
            onClick={onClose}
          >
            <svg viewBox="0 0 14 14" aria-hidden="true">
              <path
                d="M1 1L13 13M13 1L1 13"
                stroke="currentColor"
                strokeWidth="1.6"
                strokeLinecap="round"
              />
            </svg>
          </button>
        </div>

        <div className="snuttBody">
          {picker.errorMessage && (
            <p className="snuttError">{picker.errorMessage}</p>
          )}
          {errorMessage && <p className="snuttError">{errorMessage}</p>}

          {step === 'picking' && !picker.errorMessage && (
            <div className="snuttCenter">
              <p className="snuttCenterText">
                SNUTT 창에서 불러올 시간표를 선택해 주세요.
                <br />
                창이 보이지 않는다면 다른 창에 가려져 있는지 확인해 주세요.
              </p>
              <button
                type="button"
                className="snuttGhostBtn"
                onClick={openPicker}
              >
                SNUTT 창 다시 열기
              </button>
            </div>
          )}

          {step === 'matching' && (
            <div className="snuttCenter">
              <p className="snuttCenterText">강좌를 확인하는 중…</p>
            </div>
          )}

          {(step === 'review' || step === 'submitting') && matchResult && (
            <>
              {timetable && (
                <div className="snuttMeta">
                  <span className="snuttMetaTitle">{timetable.title}</span>
                  <span className="snuttMetaTerm">
                    {formatSemester(
                      timetable.year,
                      toSemester(timetable.semester)
                    )}
                  </span>
                </div>
              )}

              {semesterMismatch && (
                <p className="snuttWarn">
                  현재 연습 중인 학기(
                  {formatSemester(TARGET_YEAR, TARGET_SEMESTER)})와 다른 시간표
                  입니다. 담을 수 있는 강좌가 없을 수 있습니다.
                </p>
              )}

              {matchResult.matched.length > 0 ? (
                <>
                  <div className="snuttSectionHead">
                    <span className="snuttSectionTitle">
                      담을 수 있는 강좌 {matchResult.matched.length}개
                    </span>
                    <button
                      type="button"
                      className="snuttSelectAllBtn"
                      onClick={() =>
                        setSelectedIds((prev) =>
                          prev.size === matchResult.matched.length
                            ? new Set()
                            : new Set(
                                matchResult.matched.map((item) => item.course.id)
                              )
                        )
                      }
                    >
                      {selectedIds.size === matchResult.matched.length
                        ? '전체 해제'
                        : '전체 선택'}
                    </button>
                  </div>

                  <ul className="snuttList">
                    {matchResult.matched.map(({ lecture, course }) => (
                      <li key={course.id}>
                        <label className="snuttItem">
                          <input
                            type="checkbox"
                            checked={selectedIds.has(course.id)}
                            onChange={() => toggleCourse(course.id)}
                          />
                          <span className="snuttItemBody">
                            <span className="snuttItemTitle">
                              {course.courseTitle}
                            </span>
                            <span className="snuttItemSub">
                              {course.instructor ?? '-'} · {course.courseNumber}
                              ({course.lectureNumber}) ·{' '}
                              {formatSnuttClassTime(lecture)}
                            </span>
                          </span>
                        </label>
                      </li>
                    ))}
                  </ul>
                </>
              ) : (
                <p className="snuttCenterText">
                  담을 수 있는 강좌가 없습니다.
                </p>
              )}

              {matchResult.unmatched.length > 0 && (
                <>
                  <div className="snuttSectionHead">
                    <span className="snuttSectionTitle muted">
                      찾을 수 없는 강좌 {matchResult.unmatched.length}개
                    </span>
                  </div>
                  <ul className="snuttList muted">
                    {matchResult.unmatched.map(({ lecture, reason }, index) => (
                      // SharedTimetable에는 강의 식별자(_id)가 없어 인덱스를 함께 쓴다
                      <li
                        key={`${lecture.course_number ?? lecture.course_title}-${
                          lecture.lecture_number ?? index
                        }`}
                      >
                        <span className="snuttItem plain">
                          <span className="snuttItemBody">
                            <span className="snuttItemTitle">
                              {lecture.course_title}
                            </span>
                            <span className="snuttItemSub">
                              {UNMATCHED_REASON_LABEL[reason]}
                            </span>
                          </span>
                        </span>
                      </li>
                    ))}
                  </ul>
                </>
              )}
            </>
          )}

          {step === 'done' && (
            <div className="snuttCenter">
              <p className="snuttCenterText">{addedSummary}</p>
            </div>
          )}
        </div>

        <div className="snuttFoot">
          {step === 'done' ? (
            <button type="button" className="snuttPrimaryBtn" onClick={onClose}>
              확인
            </button>
          ) : (
            <>
              <button
                type="button"
                className="snuttGhostBtn"
                onClick={onClose}
                disabled={step === 'submitting'}
              >
                취소
              </button>
              <button
                type="button"
                className="snuttPrimaryBtn"
                onClick={handleSubmit}
                disabled={step !== 'review' || selectedIds.size === 0}
              >
                {step === 'submitting'
                  ? '담는 중…'
                  : `선택한 ${selectedIds.size}개 담기`}
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
