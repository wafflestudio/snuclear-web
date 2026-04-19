import { useState } from 'react';
import { WarningModal } from '@shared/ui/Warning';
import {
  useSugangPeriodQuery,
  useSugangPeriodSyncStatusQuery,
  useRunSugangPeriodSyncMutation,
  useToggleSugangPeriodAutoSyncMutation,
} from '@features/course-sync';

export function SugangPeriodSyncSection() {
  const { data: syncStatus, isLoading, isError } = useSugangPeriodSyncStatusQuery();
  const { data: sugangPeriod } = useSugangPeriodQuery();
  const runSync = useRunSugangPeriodSyncMutation();
  const toggleAutoSync = useToggleSugangPeriodAutoSyncMutation();

  const [showToggleConfirm, setShowToggleConfirm] = useState(false);
  const [showSyncConfirm, setShowSyncConfirm] = useState(false);
  const [isToggling, setIsToggling] = useState(false);

  const handleToggleConfirm = async () => {
    setIsToggling(true);
    try {
      await toggleAutoSync.mutateAsync(!syncStatus?.enabled);
    } catch (error) {
      console.error('[SugangPeriodSync] Toggle error:', error);
    } finally {
      setIsToggling(false);
      setShowToggleConfirm(false);
    }
  };

  const handleSyncConfirm = async () => {
    try {
      await runSync.mutateAsync();
    } catch (error) {
      console.error('[SugangPeriodSync] Sync error:', error);
    } finally {
      setShowSyncConfirm(false);
    }
  };

  const formatDateTime = (dateStr: string | null) => {
    if (!dateStr) return '-';
    const date = new Date(dateStr);
    if (isNaN(date.getTime())) return '-';
    return date.toLocaleString('ko-KR', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
    });
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'SUCCESS':
        return <span className="sync-status-badge active">성공</span>;
      case 'FAILED':
        return <span className="sync-status-badge inactive">실패</span>;
      default:
        return <span className="sync-status-badge">{status}</span>;
    }
  };

  if (isLoading) {
    return (
      <div>
        <h2 className="admin-section-title">수강신청 기간 동기화</h2>
        <div className="sync-loading">로딩 중...</div>
      </div>
    );
  }

  if (isError) {
    return (
      <div>
        <h2 className="admin-section-title">수강신청 기간 동기화</h2>
        <div className="sync-loading">동기화 상태를 불러올 수 없습니다.</div>
      </div>
    );
  }

  return (
    <div>
      <h2 className="admin-section-title">수강신청 기간 동기화</h2>

      <div className="sync-section">
        <div className="sync-card">
          <h3 className="sync-card-title">자동 동기화 설정</h3>

          <div className="sync-status-row">
            <span className="sync-status-label">상태</span>
            <span className={`sync-status-badge ${syncStatus?.enabled ? 'active' : 'inactive'}`}>
              {syncStatus?.enabled ? '활성화' : '비활성화'}
            </span>
          </div>

          <div className="sync-actions">
            <button
              className={`sync-toggle-btn ${syncStatus?.enabled ? 'disable' : 'enable'}`}
              onClick={() => setShowToggleConfirm(true)}
              disabled={isToggling}
            >
              {isToggling
                ? '처리 중...'
                : `자동 동기화 ${syncStatus?.enabled ? '비활성화' : '활성화'}`}
            </button>
          </div>
        </div>

        <div className="sync-card">
          <h3 className="sync-card-title">마지막 동기화 기록</h3>

          {runSync.isPending && (
            <div className="sync-status-row">
              <span className="sync-status-label">현재 상태</span>
              <span className="syncing-indicator">
                <span className="syncing-spinner" />
                동기화 진행 중...
              </span>
            </div>
          )}

          {syncStatus?.lastRun ? (
            <>
              <div className="sync-status-row">
                <span className="sync-status-label">실행 결과</span>
                {getStatusBadge(syncStatus.lastRun.status)}
              </div>

              <div className="sync-status-row">
                <span className="sync-status-label">시작 시간</span>
                <span className="sync-status-value">
                  {formatDateTime(syncStatus.lastRun.startedAt)}
                </span>
              </div>

              <div className="sync-status-row">
                <span className="sync-status-label">완료 시간</span>
                <span className="sync-status-value">
                  {formatDateTime(syncStatus.lastRun.finishedAt)}
                </span>
              </div>

              <div className="sync-status-row">
                <span className="sync-status-label">덤프 데이터</span>
                <span className="sync-status-value">
                  {syncStatus.lastRun.hasDumpData ? '있음' : '없음'}
                </span>
              </div>

              {syncStatus.lastRun.message && (
                <div className="sync-status-row">
                  <span className="sync-status-label">메시지</span>
                  <span className="sync-status-value">
                    {syncStatus.lastRun.message}
                  </span>
                </div>
              )}
            </>
          ) : (
            <div className="sync-status-row">
              <span className="sync-status-value">동기화 기록 없음</span>
            </div>
          )}
        </div>

        <div className="sync-card">
          <h3 className="sync-card-title">수동 동기화</h3>

          <p style={{ margin: '0 0 12px', fontSize: '14px', color: '#4b5563' }}>
            서울대학교 수강신청 사이트에서 기간 정보를 즉시 크롤링합니다.
          </p>

          <div className="sync-actions">
            <button
              className="sync-now-btn"
              onClick={() => setShowSyncConfirm(true)}
              disabled={runSync.isPending}
            >
              {runSync.isPending ? '동기화 중...' : '즉시 동기화'}
            </button>
          </div>
        </div>

        {sugangPeriod && sugangPeriod.body.length > 0 && (
          <div className="sync-card">
            <h3 className="sync-card-title">현재 저장된 기간 데이터</h3>
            <div style={{ overflowX: 'auto' }}>
              <table className="periodTable" style={{ fontSize: '13px' }}>
                <thead>
                  <tr>
                    <th>구분</th>
                    <th>일자</th>
                    <th>시간</th>
                    <th>대상</th>
                  </tr>
                </thead>
                <tbody>
                  {sugangPeriod.body.map((row, index) => (
                    <tr key={index}>
                      <td>{row.category}</td>
                      <td>{row.date}</td>
                      <td>{row.time}</td>
                      <td>{row.remark}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        <div className="sync-card">
          <h3 className="sync-card-title">동기화 안내</h3>
          <p style={{ margin: 0, fontSize: '14px', color: '#4b5563', lineHeight: 1.7 }}>
            수강신청 기간 동기화는 서울대학교 수강신청 사이트(sugang.snu.ac.kr)에서
            기간 정보를 크롤링하여 업데이트합니다.
            <br />
            <br />
            <strong>자동 동기화</strong>: 활성화 시 설정된 주기마다 자동으로
            기간 정보를 동기화합니다.
            <br />
            <br />
            <strong>수동 동기화</strong>: 즉시 크롤링을 실행하여 최신 기간 정보를
            가져옵니다.
          </p>
        </div>
      </div>

      <WarningModal.Confirm
        isOpen={showToggleConfirm}
        onCancel={() => setShowToggleConfirm(false)}
        onConfirm={handleToggleConfirm}
        icon="question"
        title="자동 동기화 설정 변경"
        subtitle={
          syncStatus?.enabled
            ? '수강신청 기간 자동 동기화를 비활성화하시겠습니까?'
            : '수강신청 기간 자동 동기화를 활성화하시겠습니까?'
        }
        cancelLabel="취소"
        confirmLabel={isToggling ? '처리 중...' : '확인'}
      />

      <WarningModal.Confirm
        isOpen={showSyncConfirm}
        onCancel={() => setShowSyncConfirm(false)}
        onConfirm={handleSyncConfirm}
        icon="question"
        title="수동 동기화"
        subtitle="수강신청 기간 정보를 즉시 동기화하시겠습니까?"
        cancelLabel="취소"
        confirmLabel={runSync.isPending ? '동기화 중...' : '동기화'}
      />
    </div>
  );
}
