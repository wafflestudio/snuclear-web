import React, { useState, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { isApiError } from '@shared/api/fetch';
import {
  useMyPageQuery,
  useUpdateProfileMutation,
  useUpdateProfileImageMutation,
  useUpdatePasswordMutation,
  useDeleteAccountMutation,
  usePracticeSessionsQuery,
} from '@entities/user';
import type { PracticeSessionItem } from '@entities/user';
import { useAuth } from '@features/auth';
import { WarningModal } from '@shared/ui/Warning';
import { DEFAULT_AVATAR } from '@shared/lib/defaultAvatar';
import './mypage.css';

// MyPage 헤더 컴포넌트
const MyPageHeader: React.FC<{ onLogout?: () => void }> = ({ onLogout }) => {
  return (
    <header className="mypage-header">
      <div className="mypage-header-content">
        <Link to="/" className="mypage-logo">
          <img src="/assets/logo.png" alt="SnuClear Logo" />
          <span className="mypage-logo-text">SNUCLEAR</span>
        </Link>
        {onLogout && (
          <button className="logout-btn" onClick={onLogout}>
            로그아웃
          </button>
        )}
      </div>
      <div className="mypage-header-gradient" />
    </header>
  );
};

// 닉네임 변경 모달
const NameChangeModal: React.FC<{
  isOpen: boolean;
  onClose: () => void;
  currentName: string;
  onSave: (newName: string) => void;
}> = ({ isOpen, onClose, currentName, onSave }) => {
  const [newName, setNewName] = useState(currentName);

  if (!isOpen) return null;

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <h2>닉네임 변경</h2>
        <input
          type="text"
          value={newName}
          onChange={(e) => setNewName(e.target.value)}
          placeholder="새 닉네임 입력"
        />
        <div className="modal-buttons">
          <button onClick={() => onSave(newName)}>저장</button>
          <button onClick={onClose}>취소</button>
        </div>
      </div>
    </div>
  );
};

// 비밀번호 변경 모달
const PasswordChangeModal: React.FC<{
  isOpen: boolean;
  onClose: () => void;
  onSave: (
    currentPassword: string,
    newPassword: string,
    confirmPassword: string
  ) => void;
}> = ({ isOpen, onClose, onSave }) => {
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  if (!isOpen) return null;

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <h2>비밀번호 변경</h2>
        <input
          type="password"
          value={currentPassword}
          onChange={(e) => setCurrentPassword(e.target.value)}
          placeholder="현재 비밀번호"
        />
        <input
          type="password"
          value={newPassword}
          onChange={(e) => setNewPassword(e.target.value)}
          placeholder="새 비밀번호"
        />
        <input
          type="password"
          value={confirmPassword}
          onChange={(e) => setConfirmPassword(e.target.value)}
          placeholder="새 비밀번호 확인"
        />
        <div className="modal-buttons">
          <button
            onClick={() => {
              onSave(currentPassword, newPassword, confirmPassword);
              setCurrentPassword('');
              setNewPassword('');
              setConfirmPassword('');
            }}
          >
            저장
          </button>
          <button onClick={onClose}>취소</button>
        </div>
      </div>
    </div>
  );
};

// 계정 삭제 모달
const DeleteAccountModal: React.FC<{
  isOpen: boolean;
  isSocialUser: boolean;
  onClose: () => void;
  onConfirm: (password: string) => void;
}> = ({ isOpen, isSocialUser, onClose, onConfirm }) => {
  const [inputValue, setInputValue] = useState('');

  if (!isOpen) return null;

  const canSubmit = isSocialUser
    ? inputValue === '계정삭제'
    : inputValue.length > 0;

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div
        className="modal-content delete-modal"
        onClick={(e) => e.stopPropagation()}
      >
        <h2>계정 삭제</h2>
        <p>정말로 계정을 삭제하시겠습니까? 이 작업은 되돌릴 수 없습니다.</p>
        {isSocialUser ? (
          <>
            <p style={{ fontSize: '14px', color: '#666', marginBottom: '8px' }}>
              확인을 위해 <strong>계정삭제</strong>를 입력해주세요.
            </p>
            <input
              type="text"
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              placeholder="계정삭제"
            />
          </>
        ) : (
          <input
            type="password"
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            placeholder="비밀번호 입력"
          />
        )}
        <div className="modal-buttons">
          <button
            className="delete-button"
            disabled={!canSubmit}
            onClick={() => {
              onConfirm(inputValue);
              setInputValue('');
            }}
          >
            삭제
          </button>
          <button onClick={onClose}>취소</button>
        </div>
      </div>
    </div>
  );
};

// 메인 MyPage 컴포넌트
const MyPage: React.FC = () => {
  const navigate = useNavigate();
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [showSocialPasswordWarning, setShowSocialPasswordWarning] =
    useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showNameModal, setShowNameModal] = useState(false);
  const [currentPage, setCurrentPage] = useState(0);
  const [showAllSessions, setShowAllSessions] = useState(false);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');
  const [showErrorModal, setShowErrorModal] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [successModalCallback, setSuccessModalCallback] = useState<
    (() => void) | null
  >(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { user, logout } = useAuth();
  const isSocialUser =
    user?.provider === 'kakao' || user?.provider === 'google';

  // Queries
  const { data: myPageData, isLoading } = useMyPageQuery();
  const { data: sessionsData } = usePracticeSessionsQuery(currentPage);

  // Mutations
  const updateProfileMutation = useUpdateProfileMutation();
  const updateProfileImageMutation = useUpdateProfileImageMutation();
  const updatePasswordMutation = useUpdatePasswordMutation();
  const deleteAccountMutation = useDeleteAccountMutation();

  // 프로필 이미지 변경
  const handleProfileImageChange = async (
    e: React.ChangeEvent<HTMLInputElement>
  ) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      try {
        await updateProfileImageMutation.mutateAsync(file);
        setSuccessMessage('프로필 이미지가 변경되었습니다.');
        setShowSuccessModal(true);
      } catch (error) {
        if (isApiError(error)) {
          setErrorMessage(
            (error.data?.message as string) ||
              '프로필 이미지 변경에 실패했습니다.'
          );
          setShowErrorModal(true);
        }
      }
    }
  };

  // 닉네임 변경
  const handleNameChange = async (newName: string) => {
    try {
      await updateProfileMutation.mutateAsync({ nickname: newName });
      setShowNameModal(false);
      setSuccessMessage('닉네임이 변경되었습니다.');
      setShowSuccessModal(true);
    } catch (error) {
      if (isApiError(error)) {
        setShowNameModal(false);
        setErrorMessage('닉네임은 2자 이상 20자 이하여야 합니다.');
        setShowErrorModal(true);
      }
    }
  };

  // 비밀번호 변경
  const handlePasswordChange = async (
    currentPassword: string,
    newPassword: string,
    confirmPassword: string
  ) => {
    if (newPassword !== confirmPassword) {
      setErrorMessage('새 비밀번호가 일치하지 않습니다.');
      setShowErrorModal(true);
      return;
    }

    try {
      await updatePasswordMutation.mutateAsync({
        currentPassword,
        newPassword,
      });
      setShowPasswordModal(false);
      setSuccessMessage('비밀번호가 변경되었습니다.');
      setShowSuccessModal(true);
    } catch (error) {
      if (isApiError(error)) {
        setErrorMessage(
          (error.data?.message as string) || '비밀번호 변경에 실패했습니다.'
        );
        setShowErrorModal(true);
      }
    }
  };

  // 계정 삭제
  const handleDeleteAccount = async (password: string) => {
    try {
      await deleteAccountMutation.mutateAsync(password);
      setShowDeleteModal(false);
      await logout();
      navigate('/');
    } catch (error) {
      if (isApiError(error)) {
        setErrorMessage(
          (error.data?.message as string) || '계정 삭제에 실패했습니다.'
        );
        setShowErrorModal(true);
      }
    }
  };

  if (isLoading) {
    return (
      <div className="mypage-page">
        <MyPageHeader />
        <div className="loading-spinner">
          <div className="spinner"></div>
        </div>
      </div>
    );
  }

  if (!myPageData) {
    return (
      <div className="mypage-page">
        <MyPageHeader />
        <div className="error-message">데이터를 불러올 수 없습니다.</div>
      </div>
    );
  }

  return (
    <div className="mypage-page">
      <MyPageHeader
        onLogout={() => {
          logout();
          navigate('/login');
        }}
      />

      <div className="mypage-container">
        {/* 프로필 섹션 */}
        <section className="profile-section">
          <h2 className="profile-title">프로필</h2>
          <div className="profile-content">
            <div className="profile-image-wrapper">
              <img
                src={myPageData.profileImageUrl || DEFAULT_AVATAR}
                alt="Profile"
                className="profile-image"
              />
              <button
                className="profile-edit-btn"
                onClick={() => fileInputRef.current?.click()}
              >
                <img src="/assets/pencil.png" alt="Edit" />
              </button>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                style={{ display: 'none' }}
                onChange={handleProfileImageChange}
              />
            </div>
            <div className="profile-info">
              <div className="profile-name-row">
                <span className="profile-name">{myPageData.nickname}</span>
                <button
                  className="name-edit-btn"
                  onClick={() => setShowNameModal(true)}
                >
                  <img src="/assets/pencil.png" alt="Edit" />
                </button>
              </div>
              {/* MyPageResponse 타입에 email이 없으므로 제거함 */}
              {/* <div className="profile-email">
                <label>이메일</label>
                <span>{myPageData.email}</span>
              </div> */}
            </div>
          </div>
          <div className="profile-actions">
            <button
              className="profile-action-btn"
              onClick={() => {
                if (myPageData.canChangePassword) {
                  setShowPasswordModal(true);
                } else {
                  setShowSocialPasswordWarning(true);
                }
              }}
            >
              비밀번호 변경
            </button>
            <button
              className="profile-action-btn delete"
              onClick={() => setShowDeleteModal(true)}
            >
              계정 삭제
            </button>
          </div>
        </section>

        {/* 연습 세션 목록 조회 섹션 */}
        <section className="results-section">
          <div className="results-header">
            <h2 className="results-title">연습 세션 목록 조회</h2>
            {sessionsData &&
              sessionsData.items &&
              sessionsData.items.length > 3 && (
                <button
                  className="view-more-btn"
                  onClick={() => setShowAllSessions(!showAllSessions)}
                >
                  {showAllSessions ? '간단히 보기' : '더보기 +'}
                </button>
              )}
          </div>
          {!sessionsData ||
          !sessionsData.items ||
          sessionsData.items.length === 0 ? (
            <div className="results-empty">아직 연습 세션이 없습니다.</div>
          ) : (
            <>
              <div className="leaderboard-list-header">
                <span>날짜</span>
                <span className="leaderboard-user">성공/시도</span>
                <span style={{ textAlign: 'right' }}>성공률</span>
              </div>
              <div className="leaderboard-list">
                {sessionsData.items
                  .slice(0, showAllSessions ? 8 : 3)
                  .map((session: PracticeSessionItem) => (
                    <div
                      key={session.id}
                      className="leaderboard-item"
                      onClick={() =>
                        navigate(`/practice-session/${session.id}`)
                      }
                      style={{ cursor: 'pointer' }}
                    >
                      <span className="leaderboard-nickname">
                        {new Date(session.practiceAt).toLocaleString('ko-KR', {
                          year: 'numeric',
                          month: '2-digit',
                          day: '2-digit',
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </span>
                      <span className="leaderboard-user">
                        {session.successCount}회 / {session.totalAttempts}회
                      </span>
                      <span className="leaderboard-value">
                        {session.totalAttempts > 0
                          ? `${((session.successCount / session.totalAttempts) * 100).toFixed(1)}%`
                          : '-'}
                      </span>
                    </div>
                  ))}
              </div>
              {showAllSessions && sessionsData.pageInfo.totalPages > 1 && (
                <div className="pagination">
                  {sessionsData.pageInfo.totalPages > 5 && currentPage > 2 && (
                    <button
                      className="pagination-arrow"
                      onClick={() =>
                        setCurrentPage(Math.max(0, currentPage - 5))
                      }
                    >
                      <img src="/assets/btn-arrow-first.png" alt="이전" />
                    </button>
                  )}
                  {(() => {
                    const totalPages = sessionsData.pageInfo.totalPages;
                    const maxVisible = 5;
                    const endPage = Math.min(
                      totalPages,
                      Math.max(0, currentPage - Math.floor(maxVisible / 2)) +
                        maxVisible
                    );
                    const startPage = Math.max(0, endPage - maxVisible);
                    return Array.from(
                      { length: endPage - startPage },
                      (_, i) => startPage + i
                    ).map((pageNum) => (
                      <button
                        key={pageNum}
                        className={currentPage === pageNum ? 'active' : ''}
                        onClick={() => setCurrentPage(pageNum)}
                      >
                        {pageNum + 1}
                      </button>
                    ));
                  })()}
                  {sessionsData.pageInfo.totalPages > 5 &&
                    currentPage < sessionsData.pageInfo.totalPages - 3 && (
                      <button
                        className="pagination-arrow"
                        onClick={() =>
                          setCurrentPage(
                            Math.min(
                              sessionsData.pageInfo.totalPages - 1,
                              currentPage + 5
                            )
                          )
                        }
                      >
                        <img src="/assets/btn-arrow-last.png" alt="다음" />
                      </button>
                    )}
                </div>
              )}
            </>
          )}
        </section>
      </div>

      {/* 모달들 */}
      <NameChangeModal
        isOpen={showNameModal}
        onClose={() => setShowNameModal(false)}
        currentName={myPageData?.nickname || ''}
        onSave={handleNameChange}
      />

      <PasswordChangeModal
        isOpen={showPasswordModal}
        onClose={() => setShowPasswordModal(false)}
        onSave={handlePasswordChange}
      />

      <DeleteAccountModal
        isOpen={showDeleteModal}
        isSocialUser={isSocialUser}
        onClose={() => setShowDeleteModal(false)}
        onConfirm={handleDeleteAccount}
      />

      {/* 소셜 로그인 비밀번호 변경 불가 안내 모달 */}
      <WarningModal.Alert
        isOpen={showSocialPasswordWarning}
        onClose={() => setShowSocialPasswordWarning(false)}
        icon="warning"
        title="소셜 로그인 유저는 비밀번호를 변경할 수 없습니다"
      />

      {/* 성공 안내 모달 */}
      <WarningModal.Alert
        isOpen={showSuccessModal}
        onClose={() => {
          setShowSuccessModal(false);
          if (successModalCallback) {
            successModalCallback();
            setSuccessModalCallback(null);
          }
        }}
        icon="none"
        title={successMessage}
      />

      {/* 에러 안내 모달 */}
      <WarningModal.Alert
        isOpen={showErrorModal}
        onClose={() => setShowErrorModal(false)}
        icon="none"
        title={errorMessage}
      />
    </div>
  );
};

export default MyPage;
