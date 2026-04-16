import React, { useEffect, useMemo, useState } from 'react';
import { Link, useParams, useNavigate, useSearchParams } from 'react-router-dom';
import QRCode from 'qrcode';
import { usePracticeSessionDetailQuery } from '@entities/user';
import type { PracticeAttemptResult } from '@entities/user';
import { drawSessionCard } from '@shared/lib/sessionCardUtils';
import '@pages/mypage/mypage.css';
import '@pages/practice-results/practice-results.css';

// 헤더 컴포넌트
const MyPageHeader: React.FC = () => {
  return (
    <header className="mypage-header">
      <div className="mypage-header-content">
        <Link to="/" className="mypage-logo">
          <img src="/assets/logo.png" alt="All Clear Logo" />
          <span className="mypage-logo-text">ALL CLEAR</span>
        </Link>
        <Link to="/mypage" className="mypage-back-btn">
          마이페이지
        </Link>
      </div>
    </header>
  );
};

function encodeShareData(data: object): string {
  const json = JSON.stringify(data);
  const encoder = new TextEncoder();
  const bytes = encoder.encode(json);
  let binary = '';
  bytes.forEach((b) => (binary += String.fromCharCode(b)));
  return btoa(binary).replace(/\+/g, '-').replace(/\//g, '_').replace(/=/g, '');
}

const PracticeSessionDetail: React.FC = () => {
  const { sessionId } = useParams<{ sessionId: string }>();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const fromHome = searchParams.get('from') === 'home';
  const [qrDataUrl, setQrDataUrl] = useState<string | null>(null);
  const [copyStatus, setCopyStatus] = useState<'idle' | 'copied' | 'error'>('idle');

  const { data: sessionDetail, isLoading } = usePracticeSessionDetailQuery(
    Number(sessionId)
  );

  const compactData = useMemo(() => {
    if (!sessionDetail) return null;
    return {
      d: sessionDetail.practiceAt,
      t: sessionDetail.totalAttempts,
      s: sessionDetail.successCount,
      a: sessionDetail.attempts.map((a) => ({
        c: a.courseTitle,
        r: a.reactionTime,
        p: a.percentile,
        ok: a.isSuccess,
      })),
    };
  }, [sessionDetail]);

  useEffect(() => {
    if (!compactData) return;

    const encoded = encodeShareData(compactData);
    const shareUrl = `${window.location.origin}/session-share?d=${encoded}`;

    QRCode.toDataURL(shareUrl, {
      width: 240,
      margin: 2,
      errorCorrectionLevel: 'L',
      color: { dark: '#111827', light: '#ffffff' },
    })
      .then(setQrDataUrl)
      .catch(console.error);

    return () => {
      setQrDataUrl(null);
    };
  }, [compactData]);

  const handleCopyImage = async () => {
    if (!compactData) return;

    try {
      const dataUrl = drawSessionCard(compactData);
      const blobPromise = fetch(dataUrl).then((r) => r.blob());
      await navigator.clipboard.write([
        new ClipboardItem({ 'image/png': blobPromise }),
      ]);
      setCopyStatus('copied');
      setTimeout(() => setCopyStatus('idle'), 2000);
    } catch {
      setCopyStatus('error');
      setTimeout(() => setCopyStatus('idle'), 2000);
    }
  };

  if (isLoading) {
    return (
      <div className={fromHome ? 'containerX' : 'mypage-page'}>
        {!fromHome && <MyPageHeader />}
        <div className="loading-spinner">
          <div className="spinner"></div>
        </div>
      </div>
    );
  }

  if (!sessionDetail) {
    return (
      <div className={fromHome ? 'containerX' : 'mypage-page'}>
        {!fromHome && <MyPageHeader />}
        <div className={fromHome ? '' : 'mypage-container'}>
          <div className="error-message">데이터를 불러올 수 없습니다.</div>
          <button
            className="profile-action-btn"
            onClick={() => navigate(fromHome ? '/practice-results' : '/mypage')}
            style={{ marginTop: '20px' }}
          >
            {fromHome ? '연습 결과 상세로 돌아가기' : '마이페이지로 돌아가기'}
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className={fromHome ? 'containerX' : 'mypage-page'}>
      {!fromHome && <MyPageHeader />}

      <div className={fromHome ? 'practice-results-page' : 'mypage-container'}>
        {/* 연습 세션 상세 조회 섹션 */}
        <section className="results-section">
          <div className="results-header">
            <h2 className="results-title">연습 세션 상세 조회</h2>
            <div className="session-detail-header-right">
              <div className="session-copy-box">
                  <button
                    className={`session-copy-btn ${copyStatus !== 'idle' ? copyStatus : ''}`}
                    onClick={handleCopyImage}
                    aria-label="사진 클립보드에 복사"
                  >
                    {copyStatus === 'copied' ? (
                      <svg viewBox="0 0 24 24" width="28" height="28" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                        <polyline points="20 6 9 17 4 12" />
                      </svg>
                    ) : copyStatus === 'error' ? (
                      <svg viewBox="0 0 24 24" width="28" height="28" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                        <line x1="18" y1="6" x2="6" y2="18" />
                        <line x1="6" y1="6" x2="18" y2="18" />
                      </svg>
                    ) : (
                      <svg viewBox="0 0 24 24" width="28" height="28" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <rect x="9" y="9" width="13" height="13" rx="2" ry="2" />
                        <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
                      </svg>
                    )}
                  </button>
                  <span className="session-qr-label">
                    {copyStatus === 'copied' ? '복사 완료!' : copyStatus === 'error' ? '복사 실패' : '사진 복사'}
                  </span>
                </div>
              {qrDataUrl && (
                <div className="session-qr-box">
                  <img
                    src={qrDataUrl}
                    alt="공유 QR 코드"
                    className="session-qr-img"
                  />
                  <span className="session-qr-label">사진 다운로드</span>
                </div>
              )}
            </div>
          </div>

          <div className="session-detail-info">
            <span>
              {new Date(sessionDetail.practiceAt).toLocaleDateString('ko-KR')}{' '}
              연습
            </span>
            <span>총 시도: {sessionDetail.totalAttempts}회</span>
            <span>성공: {sessionDetail.successCount}회</span>
            <span>
              실패: {sessionDetail.totalAttempts - sessionDetail.successCount}회
            </span>
          </div>

          {sessionDetail.attempts && sessionDetail.attempts.length > 0 && (
            <>
              <div className="session-detail-list-header">
                <span>과목이름</span>
                <span className="session-detail-col-reaction">반응속도</span>
                <span className="session-detail-col-percentile">상위%</span>
              </div>
              <div className="session-detail-list">
                {sessionDetail.attempts.map((detail: PracticeAttemptResult, index: number) => {
                  const isSuccess = detail.isSuccess === true;
                  return (
                    <div key={index} className="session-detail-item">
                      <div className="session-detail-course">
                        <span className="session-detail-course-title">
                          {detail.courseTitle}
                        </span>
                        <span
                          className={`session-detail-badge ${isSuccess ? 'success' : 'fail'}`}
                        >
                          {isSuccess ? '성공' : '실패'}
                        </span>
                      </div>
                      <span className="session-detail-col-reaction session-detail-value">
                        {detail.reactionTime}ms
                      </span>
                      <span className="session-detail-col-percentile session-detail-value">
                        {detail.percentile
                          ? `상위 ${(detail.percentile * 100).toFixed(1)}%`
                          : '-'}
                      </span>
                    </div>
                  );
                })}
              </div>
            </>
          )}
        </section>
      </div>
    </div>
  );
};

export default PracticeSessionDetail;
