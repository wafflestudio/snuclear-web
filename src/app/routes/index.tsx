import { Route, Routes } from 'react-router-dom';
import HomePage from '@pages/home';
import Login from '@pages/login';
import Register from '@pages/register';
import SearchPage from '@pages/search';
import Cart from '@pages/cart';
import Registration from '@pages/registration';
import EnrollmentHistory from '@pages/enrollment-history';
import LeaderBoard from '@pages/leaderboard';
import MyPage from '@pages/mypage';
import PracticeSessionDetail from '@pages/practice-session';
import PracticeResults from '@pages/practice-results';
import AdminPage from '@pages/admin';
import NoticesPage from '@pages/notices';
import NoticeDetailPage from '@pages/notices/NoticeDetailPage';
import SessionSharePage from '@pages/session-share';
import { RequireAuth, RequireAdmin } from '@features/auth';

export function AppRoutes() {
  return (
    <Routes>
      <Route path="/" element={<HomePage />} />
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />
      <Route path="/search" element={<SearchPage />} />
      <Route
        path="/cart"
        element={
          <RequireAuth>
            <Cart />
          </RequireAuth>
        }
      />
      <Route
        path="/registration"
        element={
          <RequireAuth>
            <Registration />
          </RequireAuth>
        }
      />
      <Route
        path="/enrollment-history"
        element={
          <RequireAuth>
            <EnrollmentHistory />
          </RequireAuth>
        }
      />
      <Route path="/leaderboard" element={<LeaderBoard />} />
      <Route
        path="/mypage"
        element={
          <RequireAuth>
            <MyPage />
          </RequireAuth>
        }
      />
      <Route
        path="/practice-results"
        element={
          <RequireAuth>
            <PracticeResults />
          </RequireAuth>
        }
      />
      <Route
        path="/practice-session/:sessionId"
        element={
          <RequireAuth>
            <PracticeSessionDetail />
          </RequireAuth>
        }
      />
      <Route
        path="/admin"
        element={
          <RequireAdmin>
            <AdminPage />
          </RequireAdmin>
        }
      />
      <Route path="/notices" element={<NoticesPage />} />
      <Route path="/notices/:noticeId" element={<NoticeDetailPage />} />
      <Route path="/session-share" element={<SessionSharePage />} />
    </Routes>
  );
}
