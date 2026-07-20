import React, { useEffect, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useAuth, useTimer } from '@features/auth';
import { Header } from '@widgets/header';
import { Footer } from '@widgets/footer';
import { SideMenu } from '@widgets/side-menu';
import { WarningModal } from '@shared/ui/Warning';
import { TourController } from '@features/tour';
import { AppRoutes } from './routes';
import './styles/global.css';

export default function App() {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const { timeLeft, extendLogin } = useTimer();
  const [showLoginWarningOpen, setShowLoginWarningOpen] = useState(false);
  const [isSideMenuOpen, setIsSideMenuOpen] = useState(false);
  const searchParams = new URLSearchParams(location.search);
  const fromHome = searchParams.get('from') === 'home';
  const isAuthPage =
    location.pathname === '/login' ||
    location.pathname === '/register' ||
    location.pathname === '/mypage' ||
    location.pathname === '/admin' ||
    (location.pathname.startsWith('/practice-session/') && !fromHome);

  const handleLogout = async () => {
    setShowLoginWarningOpen(false);
    await logout();
    navigate('/');
  };

  useEffect(() => {
    window.scrollTo(0, 0);
  }, [location.pathname]);

  // 로그인 직후 랜딩 페이지에서만 뒤로가기 방지
  useEffect(() => {
    const isFreshLogin = sessionStorage.getItem('freshLogin') === 'true';
    const isLandingPage = location.pathname === '/' || location.pathname === '/admin';

    // 로그인 직후 + 랜딩 페이지에서만 뒤로가기 차단
    if (user && isFreshLogin && isLandingPage) {
      window.history.pushState(null, '', window.location.href);

      const handlePopState = () => {
        window.history.pushState(null, '', window.location.href);
      };

      window.addEventListener('popstate', handlePopState);

      return () => {
        window.removeEventListener('popstate', handlePopState);
      };
    }

    // 랜딩 페이지를 벗어나면 플래그 제거
    if (isFreshLogin && !isLandingPage) {
      sessionStorage.removeItem('freshLogin');
    }
  }, [user, location.pathname]);

  useEffect(() => {
    document.body.style.overflow = showLoginWarningOpen ? 'hidden' : 'auto';
    return () => {
      document.body.style.overflow = 'auto';
    };
  }, [showLoginWarningOpen]);

  return (
    <div className={`app ${!isAuthPage ? 'withHeader' : ''}`}>
      {!isAuthPage && (
        <Header
          handleLogout={handleLogout}
          onToggleSideMenu={() => setIsSideMenuOpen(true)}
        />
      )}
      <div id="main">
        <AppRoutes />
      </div>
      {!isAuthPage && (
        <Footer onOpenModal={() => setShowLoginWarningOpen(true)} />
      )}
      {!isAuthPage && (
        <SideMenu
          isOpen={isSideMenuOpen}
          onClose={() => setIsSideMenuOpen(false)}
          onLogout={handleLogout}
        />
      )}
      {user && (timeLeft <= 60 || showLoginWarningOpen) && timeLeft > 0 && (
        <SessionWarningModal
          timeLeft={timeLeft}
          onExtend={extendLogin}
          onLogout={handleLogout}
          setShowLoginWarningOpen={setShowLoginWarningOpen}
        />
      )}
      <TourController />
    </div>
  );
}

function SessionWarningModal({
  timeLeft,
  onExtend,
  onLogout,
  setShowLoginWarningOpen,
}: {
  timeLeft: number;
  onExtend: () => void;
  onLogout: () => void;
  setShowLoginWarningOpen: React.Dispatch<React.SetStateAction<boolean>>;
}) {
  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m}:${s < 10 ? '0' : ''}${s}`;
  };

  return (
    <WarningModal.Confirm
      isOpen={true}
      onCancel={onLogout}
      onConfirm={() => {
        onExtend();
        setShowLoginWarningOpen(false);
      }}
      title="로그인 연장"
      cancelLabel="로그아웃"
      confirmLabel="로그인 연장"
    >
      <p className="sessionMsg">
        로그인 연장을 원하지 않으실 경우,
        <br />
        자동로그아웃 됩니다.
      </p>
      <div className="sessionTimerBox">
        <svg
          width="18"
          height="18"
          viewBox="0 0 24 24"
          fill="none"
          stroke="#ff5722"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          style={{ marginRight: '4px', verticalAlign: 'middle' }}
        >
          <circle cx="12" cy="12" r="10"></circle>
          <polyline points="12 6 12 12 16 14"></polyline>
        </svg>
        <span className="sessionTimerText">{formatTime(timeLeft)}</span>
      </div>
    </WarningModal.Confirm>
  );
}
