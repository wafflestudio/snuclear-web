import { useState, useMemo } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';

import {
  getLeaderboardApi,
  getWeeklyLeaderboardApi,
  getMyLeaderboardApi,
  getMyWeeklyLeaderboardApi,
} from '@features/leaderboard';
import { useAuth } from '@features/auth';
import { useNoticesQuery } from '@features/notice';
import { useSugangPeriodQuery } from '@features/course-sync';
import { useMyPageQuery } from '@entities/user';
import type {
  LeaderboardEntryResponse,
  LeaderboardResponse,
  MyLeaderboardResponse,
} from '@features/leaderboard';
import { DEFAULT_AVATAR } from '@shared/lib/defaultAvatar';
import './home.css';

type FilterType = 'all' | 'weekly';
type CategoryType = 'firstReaction' | 'secondReaction' | 'competitionRate';

const getCategoryData = (data: LeaderboardResponse, category: CategoryType) => {
  switch (category) {
    case 'firstReaction':
      return data.topFirstReactionTime;
    case 'secondReaction':
      return data.topSecondReactionTime;
    case 'competitionRate':
      return data.topCompetitionRate;
  }
};

const formatValue = (value: number, category: CategoryType): string => {
  if (category === 'competitionRate') {
    return `${value.toFixed(2)}:1`;
  }
  return `${value}ms`;
};

const formatNoticeDate = (dateString: string): string => {
  const date = new Date(dateString);
  const month = (date.getMonth() + 1).toString().padStart(2, '0');
  const day = date.getDate().toString().padStart(2, '0');
  return `${month}.${day}`;
};

function parseHeaderParts(header: string) {
  // "2026학년도 1학기 수강신청 기간안내 ※ 장바구니는 선착순이 아닙니다."
  const noteMatch = header.match(/※.*/);
  const note = noteMatch ? noteMatch[0] : '';
  const withoutNote = header.replace(/\s*※.*/, '').trim();
  // "2026학년도 1학기 수강신청 기간안내"
  const periodTextMatch = withoutNote.match(/수강신청\s*기간안내/);
  const periodText = periodTextMatch ? periodTextMatch[0] : '수강신청 기간안내';
  const year = withoutNote.replace(/\s*수강신청\s*기간안내/, '').trim();
  return { year, periodText, note };
}

function parseDateRange(dateStr: string): { start: string; end: string } | null {
  // "2026-02-24(화) ~ 2026-02-24(화)" or "2026-03-10(화) ~ 2026-04-21(화)"
  const matches = dateStr.match(/(\d{4}-\d{2}-\d{2})/g);
  if (!matches || matches.length < 2) return null;
  return { start: matches[0], end: matches[1] };
}

function isCurrentPeriod(dateStr: string): boolean {
  const range = parseDateRange(dateStr);
  if (!range) return false;
  const today = new Date().toISOString().slice(0, 10);
  return today >= range.start && today <= range.end;
}

export default function HomePage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [filter, setFilter] = useState<FilterType>('all');
  const [category, setCategory] = useState<CategoryType>('firstReaction');
  const { data: myProfile } = useMyPageQuery();
  const { data: sugangPeriod } = useSugangPeriodQuery();
  const headerParts = useMemo(
    () => sugangPeriod ? parseHeaderParts(sugangPeriod.header) : null,
    [sugangPeriod],
  );

  const { data: noticesData } = useNoticesQuery(0, 10);

  const noticeItems = noticesData?.items;
  const sortedNotices = useMemo(() => {
    if (!noticeItems) return [];
    return [...noticeItems]
      .sort((a, b) => {
        if (a.isPinned !== b.isPinned) return a.isPinned ? -1 : 1;
        return (
          new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
        );
      })
      .slice(0, 5);
  }, [noticeItems]);

  const {
    data: leaderboardData,
    isLoading,
    isError,
  } = useQuery({
    queryKey: ['leaderboard', 'home', filter],
    queryFn: async () => {
      const response =
        filter === 'all'
          ? await getLeaderboardApi({ page: 0, size: 5 })
          : await getWeeklyLeaderboardApi({ page: 0, size: 5 });
      return response.data;
    },
    retry: 1,
  });

  const { data: myData } = useQuery({
    queryKey: ['leaderboard', 'my', filter],
    queryFn: async () => {
      const response =
        filter === 'all'
          ? await getMyLeaderboardApi()
          : await getMyWeeklyLeaderboardApi();
      return response.data;
    },
    enabled: !!user,
    retry: false,
  });

  const getEntries = (): LeaderboardEntryResponse[] => {
    if (!leaderboardData) return [];
    return getCategoryData(leaderboardData, category).items.slice(0, 5);
  };

  const getMyValue = (
    myData: MyLeaderboardResponse | undefined
  ): { value: number | null; rank: number | null } => {
    if (!myData) return { value: null, rank: null };
    switch (category) {
      case 'firstReaction':
        return {
          value: myData.bestFirstReactionTime,
          rank: myData.bestFirstReactionTimeRank,
        };
      case 'secondReaction':
        return {
          value: myData.bestSecondReactionTime,
          rank: myData.bestSecondReactionTimeRank,
        };
      case 'competitionRate':
        return {
          value: myData.bestCompetitionRate,
          rank: myData.bestCompetitionRateRank,
        };
      default:
        return { value: null, rank: null };
    }
  };

  const entries = getEntries();
  const myRank = getMyValue(myData);

  return (
    <main className="page">
      <div className="containerX">
        <div className="homeGrid">
          <div className="homeLeft">
            <section className="panel periodPanel">
              {sugangPeriod ? (
                <>
                  <div className="panelHead">
                    <div className="periodTitle">
                      <span className="periodYear blue">
                        {headerParts?.year}
                      </span>
                      <span className="periodText">
                        {headerParts?.periodText}
                      </span>
                    </div>
                    {headerParts?.note && (
                      <div className="periodNote">
                        {headerParts.note}
                      </div>
                    )}
                  </div>
                  <div className="periodBody">
                    <table className="periodTable">
                      <thead>
                        <tr>
                          <th>수강신청 구분</th>
                          <th>일자</th>
                          <th>시간</th>
                          <th>대상</th>
                        </tr>
                      </thead>
                      <tbody>
                        {sugangPeriod.body.map((row, index) => (
                          <tr
                            key={index}
                            className={isCurrentPeriod(row.date) ? 'currentPeriod' : ''}
                          >
                            <td data-label="수강신청 구분">{row.category}</td>
                            <td data-label="일자">{row.date}</td>
                            <td data-label="시간">{row.time}</td>
                            <td data-label="대상" className="periodTarget">
                              {row.remark}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </>
              ) : (
                <div className="panelHead">
                  <div className="periodTitle">
                    <span className="periodText">수강신청 기간안내</span>
                  </div>
                  <div className="periodNote" style={{ color: '#888' }}>
                    기간 정보를 불러오는 중...
                  </div>
                </div>
              )}
            </section>
          </div>

          <div className="homeRight">
            {!user && (
              <section className="panel loginPanel">
                <div className="loginTop">
                  <div className="loginTitle blue">로그인 하세요.</div>
                  <Link className="loginBtnLink" to="/login">
                    로그인
                  </Link>
                  <div className="loginDesc">
                    아이디 / 비밀번호 찾기 기능을 지원하지 않습니다.
                  </div>
                </div>
              </section>
            )}

            <div className="rightButtons">
              <a
                className={user ? 'rightFilledBtn' : 'rightOutlineBtn'}
                href="https://boulder-argon-568.notion.site/2f30bdb7bbc18009802eccb739810da2?source=copy_link"
                target="_blank"
                rel="noopener noreferrer"
              >
                SNUCLEAR 서비스 이용 방법 안내
              </a>
              <a
                className={user ? 'rightFilledBtn' : 'rightOutlineBtn'}
                href="https://docs.google.com/forms/d/e/1FAIpQLSediDA6u8VTTy9sAJ5VHDsUuLRQLaSJyBypCXz3EuO6kJ6IJQ/viewform"
                target="_blank"
                rel="noopener noreferrer"
              >
                개발자에게 피드백
              </a>
            </div>

            <section className="panel noticePanel">
              <div className="panelHead">
                <div className="panelTitle">공지사항</div>
                <button
                  className="home-notice-detail-btn"
                  onClick={() => navigate('/notices')}
                >
                  상세보기
                  <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                    <path
                      d="M6 4L10 8L6 12"
                      stroke="currentColor"
                      strokeWidth="1"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </svg>
                </button>
              </div>
              <div className="panelBody noticeBody">
                {sortedNotices.length === 0 ? (
                  <div className="home-notice-empty">
                    등록된 공지사항이 없습니다.
                  </div>
                ) : (
                  <ul className="home-notice-list">
                    {sortedNotices.map((notice) => (
                      <li
                        key={notice.id}
                        className="home-notice-item"
                        onClick={() => navigate(`/notices/${notice.id}`)}
                      >
                        <span className="home-notice-pin-wrapper">
                          {notice.isPinned && (
                            <svg
                              width="14"
                              height="14"
                              viewBox="0 0 24 24"
                              fill="currentColor"
                              className="home-notice-pin-icon"
                            >
                              <path d="M16 12V4h1V2H7v2h1v8l-2 2v2h5.2v6h1.6v-6H18v-2l-2-2z" />
                            </svg>
                          )}
                        </span>
                        <span className="home-notice-title">
                          {notice.title}
                        </span>
                        <span className="home-notice-date">
                          {formatNoticeDate(notice.createdAt)}
                        </span>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            </section>

            <section className="panel leaderBoardPanel">
              <div className="panelHead">
                <div className="panelTitle">리더보드</div>
                <button
                  className="home-leaderboard-detail-btn"
                  onClick={() => navigate('/leaderboard')}
                >
                  상세보기
                  <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                    <path
                      d="M6 4L10 8L6 12"
                      stroke="currentColor"
                      strokeWidth="1"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </svg>
                </button>
              </div>
              <div className="panelBody leaderBoardBody">
                <div className="home-leaderboard-filter-tabs">
                  <button
                    className={`home-leaderboard-filter-tab ${filter === 'all' ? 'active' : ''}`}
                    onClick={() => setFilter('all')}
                  >
                    전체
                  </button>
                  <button
                    className={`home-leaderboard-filter-tab ${filter === 'weekly' ? 'active' : ''}`}
                    onClick={() => setFilter('weekly')}
                  >
                    주간
                  </button>
                </div>

                <div className="home-leaderboard-category-tabs">
                  <button
                    className={`home-leaderboard-category-tab ${category === 'firstReaction' ? 'active' : ''}`}
                    onClick={() => setCategory('firstReaction')}
                  >
                    1픽 반응속도
                  </button>
                  <button
                    className={`home-leaderboard-category-tab ${category === 'secondReaction' ? 'active' : ''}`}
                    onClick={() => setCategory('secondReaction')}
                  >
                    2픽 반응속도
                  </button>
                  <button
                    className={`home-leaderboard-category-tab ${category === 'competitionRate' ? 'active' : ''}`}
                    onClick={() => setCategory('competitionRate')}
                  >
                    경쟁률
                  </button>
                </div>

                {isLoading ? (
                  <div className="home-leaderboard-loading">로딩 중…</div>
                ) : isError ? (
                  <div className="home-leaderboard-empty">
                    리더보드를 불러올 수 없습니다.
                  </div>
                ) : entries.length === 0 ? (
                  <div className="home-leaderboard-empty">
                    아직 기록이 없습니다.
                  </div>
                ) : (
                  <div className="home-leaderboard-list">
                    {entries.map((entry, index) => {
                      const rank = index + 1;
                      return (
                        <div
                          key={`${entry.userId}-${index}`}
                          className={`home-leaderboard-item ${rank <= 3 ? 'top-3' : ''}`}
                        >
                          <span
                            className={`home-leaderboard-rank rank-${rank}`}
                          >
                            {rank}
                          </span>
                          <div className="home-leaderboard-user">
                            <img
                              className="home-leaderboard-avatar"
                              src={entry.profileImageUrl || DEFAULT_AVATAR}
                              alt={entry.nickname}
                              width={28}
                              height={28}
                              onError={(e) => {
                                (e.currentTarget as HTMLImageElement).src =
                                  DEFAULT_AVATAR;
                              }}
                            />
                            <span className="home-leaderboard-nickname">
                              {entry.nickname}
                            </span>
                          </div>
                          <span className="home-leaderboard-value">
                            {formatValue(entry.value, category)}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                )}

                {user ? (
                  myRank.rank !== null && myRank.value !== null ? (
                    <div className="home-leaderboard-my-rank">
                      <div className="home-leaderboard-my-rank-title">
                        내 순위
                      </div>
                      <div className="home-leaderboard-item my-rank">
                        <span className="home-leaderboard-rank">
                          {myRank.rank}
                        </span>
                        <div className="home-leaderboard-user">
                          <img
                            className="home-leaderboard-avatar"
                            src={myProfile?.profileImageUrl || DEFAULT_AVATAR}
                            alt={myProfile?.nickname || user.nickname}
                            width={28}
                            height={28}
                            onError={(e) => {
                              (e.currentTarget as HTMLImageElement).src =
                                DEFAULT_AVATAR;
                            }}
                          />
                          <span className="home-leaderboard-nickname">
                            {myProfile?.nickname || user.nickname}
                          </span>
                        </div>
                        <span className="home-leaderboard-value">
                          {formatValue(myRank.value, category)}
                        </span>
                      </div>
                    </div>
                  ) : (
                    <div className="home-leaderboard-my-rank">
                      <div className="home-leaderboard-my-rank-title">
                        내 순위
                      </div>
                      <div className="home-leaderboard-empty">
                        아직 기록이 없습니다.
                      </div>
                    </div>
                  )
                ) : null}
              </div>
            </section>
          </div>
        </div>
      </div>
    </main>
  );
}

