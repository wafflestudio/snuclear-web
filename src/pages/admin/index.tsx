import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@features/auth';
import {
  useNoticesQuery,
  useCreateNoticeMutation,
  useUpdateNoticeMutation,
  useDeleteNoticeMutation,
} from '@features/notice';
import type { NoticeCreateRequest, NoticeUpdateRequest } from '@features/notice';
import {
  useAutoSyncStatusQuery,
  useToggleAutoSyncMutation,
  useRunSyncMutation,
} from '@features/course-sync';
import type { CourseSyncRunRequest } from '@features/course-sync';
import { AdminHeader } from './components/AdminHeader';
import { AdminSidebar, type AdminSection } from './components/AdminSidebar';
import { NoticeSection } from './components/NoticeSection';
import { SyncSection } from './components/SyncSection';
import { SugangPeriodSyncSection } from './components/SugangPeriodSyncSection';
import { MetricsSection } from './components/MetricsSection';
import { PasswordChangeModal } from './components/PasswordChangeModal';
import './admin.css';

export default function AdminPage() {
  const navigate = useNavigate();
  const { logout } = useAuth();

  // 뒤로가기 방지
  useEffect(() => {
    sessionStorage.removeItem('freshLogin');
    window.history.pushState(null, '', window.location.href);

    const handlePopState = () => {
      window.history.pushState(null, '', window.location.href);
    };

    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, []);

  const [activeSection, setActiveSection] = useState<AdminSection>('notice');
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [currentPage, setCurrentPage] = useState(0);

  const { data: noticesData, isLoading: noticesLoading } = useNoticesQuery(
    currentPage,
    10
  );
  const createMutation = useCreateNoticeMutation();
  const updateMutation = useUpdateNoticeMutation();
  const deleteMutation = useDeleteNoticeMutation();

  const { data: syncStatus, isLoading: syncLoading, isError: syncError } = useAutoSyncStatusQuery();
  const toggleAutoSyncMutation = useToggleAutoSyncMutation();
  const runSyncMutation = useRunSyncMutation();

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  const handleAddNotice = async (data: NoticeCreateRequest) => {
    await createMutation.mutateAsync(data);
  };

  const handleUpdateNotice = async (id: number, data: NoticeUpdateRequest) => {
    await updateMutation.mutateAsync({ id, data });
  };

  const handleDeleteNotices = async (ids: number[]) => {
    for (const id of ids) {
      await deleteMutation.mutateAsync(id);
    }
  };

  const handleToggleAutoSync = async (enable: boolean) => {
    await toggleAutoSyncMutation.mutateAsync(enable);
  };

  const handleSyncNow = async (year: number, semester: CourseSyncRunRequest['semester']) => {
    await runSyncMutation.mutateAsync({ year, semester });
  };

  return (
    <div className="admin-page">
      <AdminHeader
        onPasswordChange={() => setShowPasswordModal(true)}
        onLogout={handleLogout}
      />

      <div className="admin-layout">
        <AdminSidebar
          activeSection={activeSection}
          onSectionChange={setActiveSection}
        />

        <main className="admin-main">
          {activeSection === 'notice' && (
            <NoticeSection
              notices={noticesData?.items ?? []}
              pageInfo={noticesData?.pageInfo}
              isLoading={noticesLoading}
              currentPage={currentPage}
              onPageChange={setCurrentPage}
              onCreate={handleAddNotice}
              onUpdate={handleUpdateNotice}
              onDelete={handleDeleteNotices}
            />
          )}

          {activeSection === 'sync' && (
            <SyncSection
              syncStatus={syncStatus}
              isLoading={syncLoading}
              isError={syncError}
              isSyncing={runSyncMutation.isPending}
              onToggleAutoSync={handleToggleAutoSync}
              onSyncNow={handleSyncNow}
            />
          )}

          {activeSection === 'sugang-period-sync' && <SugangPeriodSyncSection />}

          {activeSection === 'metrics' && <MetricsSection />}
        </main>
      </div>

      <PasswordChangeModal
        isOpen={showPasswordModal}
        onClose={() => setShowPasswordModal(false)}
      />
    </div>
  );
}
