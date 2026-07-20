import { useState } from 'react';
import { isApiError } from '@shared/api/fetch';
import { WarningModal } from '@shared/ui/Warning';
import { Pagination } from '@shared/ui/Pagination';
import type {
  NoticeResponse,
  NoticeCreateRequest,
  NoticeUpdateRequest,
  PageInfo,
} from '@features/notice';

interface NoticeSectionProps {
  notices: NoticeResponse[];
  pageInfo?: PageInfo;
  isLoading: boolean;
  currentPage: number;
  onPageChange: (page: number) => void;
  onCreate: (data: NoticeCreateRequest) => Promise<void>;
  onUpdate: (id: number, data: NoticeUpdateRequest) => Promise<void>;
  onDelete: (ids: number[]) => Promise<void>;
}

type ModalMode = 'none' | 'detail' | 'form' | 'delete';

export function NoticeSection({
  notices,
  pageInfo,
  isLoading,
  currentPage,
  onPageChange,
  onCreate,
  onUpdate,
  onDelete,
}: NoticeSectionProps) {
  const [selectedIds, setSelectedIds] = useState<number[]>([]);
  const [modalMode, setModalMode] = useState<ModalMode>('none');
  const [selectedNotice, setSelectedNotice] = useState<NoticeResponse | null>(
    null
  );
  const [formData, setFormData] = useState({
    title: '',
    content: '',
    isPinned: false,
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showSuccessAlert, setShowSuccessAlert] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');
  const [errorMessage, setErrorMessage] = useState('');

  const totalPages = pageInfo?.totalPages ?? 1;

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedIds(notices.map((n) => n.id));
    } else {
      setSelectedIds([]);
    }
  };

  const handleSelectOne = (id: number, checked: boolean) => {
    if (checked) {
      setSelectedIds((prev) => [...prev, id]);
    } else {
      setSelectedIds((prev) => prev.filter((i) => i !== id));
    }
  };

  const handleTitleClick = (notice: NoticeResponse) => {
    setSelectedNotice(notice);
    setModalMode('detail');
  };

  const handleNewClick = () => {
    setSelectedNotice(null);
    setFormData({ title: '', content: '', isPinned: false });
    setModalMode('form');
  };

  const handleEditClick = (notice: NoticeResponse) => {
    setSelectedNotice(notice);
    setFormData({
      title: notice.title,
      content: notice.content,
      isPinned: notice.isPinned,
    });
    setModalMode('form');
  };

  const handleDeleteClick = (notice: NoticeResponse) => {
    setSelectedNotice(notice);
    setModalMode('delete');
  };

  const handleBulkDeleteClick = () => {
    if (selectedIds.length === 0) return;
    setSelectedNotice(null);
    setModalMode('delete');
  };

  const handleFormSubmit = async () => {
    if (!formData.title.trim() || !formData.content.trim()) return;

    setIsSubmitting(true);
    setErrorMessage('');
    try {
      if (selectedNotice) {
        console.log('[NoticeSection] Updating notice:', {
          id: selectedNotice.id,
          data: {
            title: formData.title,
            content: formData.content,
            isPinned: formData.isPinned,
          },
        });
        await onUpdate(selectedNotice.id, {
          title: formData.title,
          content: formData.content,
          isPinned: formData.isPinned,
        });
        setSuccessMessage('공지사항이 수정되었습니다.');
      } else {
        await onCreate({
          title: formData.title,
          content: formData.content,
          isPinned: formData.isPinned,
        });
        setSuccessMessage('공지사항이 등록되었습니다.');
      }
      setModalMode('none');
      setFormData({ title: '', content: '', isPinned: false });
      setShowSuccessAlert(true);
    } catch (error) {
      console.error('[NoticeSection] Form submit error:', error);
      if (isApiError(error)) {
        const data = error.data;
        console.error('[NoticeSection] Full server response:', JSON.stringify(data, null, 2));
        let message = (data?.message as string) || (data?.error as string) || '알 수 없는 오류';
        if (data?.fieldErrors) {
          const fieldMessages = Object.entries(data.fieldErrors as Record<string, string>)
            .map(([field, msg]) => `${field}: ${msg}`)
            .join(', ');
          message += ` (${fieldMessages})`;
        }
        setErrorMessage(`오류: ${message}`);
      } else {
        setErrorMessage('저장 중 오류가 발생했습니다. 다시 시도해주세요.');
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteConfirm = async () => {
    setIsSubmitting(true);
    setErrorMessage('');
    try {
      if (selectedNotice) {
        await onDelete([selectedNotice.id]);
        setSuccessMessage('공지사항이 삭제되었습니다.');
      } else {
        await onDelete(selectedIds);
        setSelectedIds([]);
        setSuccessMessage(`${selectedIds.length}개의 공지사항이 삭제되었습니다.`);
      }
      setModalMode('none');
      setShowSuccessAlert(true);
    } catch (error) {
      console.error('[NoticeSection] Delete error:', error);
      setErrorMessage('삭제 중 오류가 발생했습니다. 다시 시도해주세요.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCloseModal = () => {
    setModalMode('none');
    setSelectedNotice(null);
    setFormData({ title: '', content: '', isPinned: false });
    setErrorMessage('');
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('ko-KR', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
    });
  };

  const isAllSelected =
    notices.length > 0 && notices.every((n) => selectedIds.includes(n.id));

  if (isLoading) {
    return (
      <div>
        <h2 className="admin-section-title">공지사항 관리</h2>
        <div className="notice-loading">로딩 중...</div>
      </div>
    );
  }

  return (
    <div>
      <h2 className="admin-section-title">공지사항 관리</h2>

      <div className="notice-toolbar">
        <div className="notice-toolbar-left">
          <label className="notice-select-all">
            <input
              type="checkbox"
              checked={isAllSelected}
              onChange={(e) => handleSelectAll(e.target.checked)}
            />
            <span>전체 선택</span>
          </label>
          <button
            className="admin-btn danger small"
            disabled={selectedIds.length === 0}
            onClick={handleBulkDeleteClick}
          >
            선택 삭제 ({selectedIds.length})
          </button>
        </div>
        <button className="admin-btn primary" onClick={handleNewClick}>
          새 공지 작성
        </button>
      </div>

      <div className="notice-table">
        <div className="notice-table-header">
          <div className="notice-table-cell center">선택</div>
          <div className="notice-table-cell center">고정</div>
          <div className="notice-table-cell">제목</div>
          <div className="notice-table-cell center">작성일</div>
          <div className="notice-table-cell center">관리</div>
        </div>

        {notices.length === 0 ? (
          <div className="notice-empty">등록된 공지사항이 없습니다.</div>
        ) : (
          notices.map((notice) => (
            <div key={notice.id} className="notice-table-row">
              <div className="notice-table-cell center">
                <input
                  type="checkbox"
                  checked={selectedIds.includes(notice.id)}
                  onChange={(e) => handleSelectOne(notice.id, e.target.checked)}
                />
              </div>
              <div className="notice-table-cell center">
                {notice.isPinned && (
                  <span className="notice-pinned-badge pinned">고정</span>
                )}
              </div>
              <div
                className="notice-table-cell title"
                onClick={() => handleTitleClick(notice)}
              >
                {notice.title}
              </div>
              <div className="notice-table-cell center">
                {formatDate(notice.createdAt)}
              </div>
              <div className="notice-table-cell center">
                <div className="notice-actions">
                  <button
                    className="admin-btn outline small"
                    onClick={() => handleEditClick(notice)}
                  >
                    수정
                  </button>
                  <button
                    className="admin-btn danger small"
                    onClick={() => handleDeleteClick(notice)}
                  >
                    삭제
                  </button>
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      <Pagination
        currentPage={currentPage}
        totalPages={totalPages}
        onPageChange={onPageChange}
      />

      {/* Detail Modal */}
      {modalMode === 'detail' && selectedNotice && (
        <div className="admin-modal-backdrop" onClick={handleCloseModal}>
          <div className="admin-modal notice-detail-modal" onClick={(e) => e.stopPropagation()}>
            <div className="admin-modal-header">
              <h3 className="admin-modal-title">공지사항 상세</h3>
              <button className="admin-modal-close" onClick={handleCloseModal}>
                ×
              </button>
            </div>
            <div className="admin-modal-body">
              <div className="notice-detail">
                <div className="notice-detail-meta-row">
                  <span className={`notice-pinned-badge ${selectedNotice.isPinned ? 'pinned' : 'not-pinned'}`}>
                    {selectedNotice.isPinned ? '상단 고정' : '일반'}
                  </span>
                </div>
                <h4 className="notice-detail-title">{selectedNotice.title}</h4>
                <div className="notice-detail-meta">
                  작성일: {formatDate(selectedNotice.createdAt)}
                </div>
                <div className="notice-detail-content">
                  {selectedNotice.content}
                </div>
              </div>
            </div>
            <div className="admin-modal-footer">
              <button className="admin-btn outline" onClick={handleCloseModal}>
                닫기
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Form Modal */}
      {modalMode === 'form' && (
        <div className="admin-modal-backdrop" onClick={handleCloseModal}>
          <div className="admin-modal notice-form-modal" onClick={(e) => e.stopPropagation()}>
            <div className="admin-modal-header">
              <h3 className="admin-modal-title">
                {selectedNotice ? '공지사항 수정' : '새 공지사항 작성'}
              </h3>
              <button className="admin-modal-close" onClick={handleCloseModal}>
                ×
              </button>
            </div>
            <div className="admin-modal-body">
              <div className="notice-form">
                <div className="notice-form-group">
                  <label className="notice-form-label">제목</label>
                  <input
                    type="text"
                    className="notice-form-input"
                    placeholder="공지사항 제목을 입력하세요"
                    value={formData.title}
                    onChange={(e) =>
                      setFormData((prev) => ({ ...prev, title: e.target.value }))
                    }
                  />
                </div>
                <div className="notice-form-group">
                  <label className="notice-form-label">내용</label>
                  <textarea
                    className="notice-form-textarea"
                    placeholder="공지사항 내용을 입력하세요"
                    value={formData.content}
                    onChange={(e) =>
                      setFormData((prev) => ({
                        ...prev,
                        content: e.target.value,
                      }))
                    }
                  />
                </div>
                <div className="notice-form-group">
                  <label className="notice-form-checkbox">
                    <input
                      type="checkbox"
                      checked={formData.isPinned}
                      onChange={(e) =>
                        setFormData((prev) => ({
                          ...prev,
                          isPinned: e.target.checked,
                        }))
                      }
                    />
                    <span>상단 고정</span>
                  </label>
                </div>
                {errorMessage && (
                  <div className="notice-form-error">{errorMessage}</div>
                )}
              </div>
            </div>
            <div className="admin-modal-footer">
              <button className="admin-btn outline" onClick={handleCloseModal}>
                취소
              </button>
              <button
                className="admin-btn primary"
                onClick={handleFormSubmit}
                disabled={
                  !formData.title.trim() ||
                  !formData.content.trim() ||
                  isSubmitting
                }
              >
                {isSubmitting ? '처리 중...' : selectedNotice ? '수정' : '등록'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirm Modal */}
      <WarningModal.Confirm
        isOpen={modalMode === 'delete'}
        onCancel={handleCloseModal}
        onConfirm={handleDeleteConfirm}
        icon="warning"
        title="공지사항 삭제"
        subtitle={
          selectedNotice
            ? `"${selectedNotice.title}"을(를) 삭제하시겠습니까?`
            : `선택한 ${selectedIds.length}개의 공지사항을 삭제하시겠습니까?`
        }
        cancelLabel="취소"
        confirmLabel={isSubmitting ? '삭제 중...' : '삭제'}
      />

      {/* Success Alert Modal */}
      <WarningModal.Alert
        isOpen={showSuccessAlert}
        onClose={() => setShowSuccessAlert(false)}
        title="완료"
        subtitle={successMessage}
        confirmLabel="확인"
      />
    </div>
  );
}
