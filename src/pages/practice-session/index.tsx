import React, { useState } from 'react';
import { Link, useParams, useNavigate, useSearchParams } from 'react-router-dom';
import { usePracticeSessionDetailQuery } from '@entities/user';
import type { PracticeAttemptResult } from '@entities/user';
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

const PracticeSessionDetail: React.FC = () => {
  const { sessionId } = useParams<{ sessionId: string }>();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const fromHome = searchParams.get('from') === 'home';
  const [showAllAttempts, setShowAllAttempts] = useState(false);

  const { data: sessionDetail, isLoading } = usePracticeSessionDetailQuery(
    Number(sessionId)
  );

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
            {sessionDetail.attempts && sessionDetail.attempts.length > 3 && (
              <button
                className="view-more-btn"
                onClick={() => setShowAllAttempts(!showAllAttempts)}
              >
                {showAllAttempts ? '간단히 보기' : '더보기 +'}
              </button>
            )}
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
                {(showAllAttempts
                  ? sessionDetail.attempts
                  : sessionDetail.attempts.slice(0, 3)
                ).map((detail: PracticeAttemptResult, index: number) => {
                  const isSuccess = detail.isSuccess === true;
                  return (
                  <div
                    key={index}
                    className="session-detail-item"
                  >
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
