import type { ReactNode } from 'react';
import { useModalEffects } from '../hooks/useModalEffects';
import '../warning.css';

type IconType = 'question' | 'warning' | 'none';

interface ConfirmProps {
  isOpen: boolean;
  onCancel: () => void;
  onConfirm: () => void;
  icon?: IconType;
  title?: string;
  subtitle?: string;
  cancelLabel?: string;
  confirmLabel?: string;
  confirmButtonDataTourId?: string;
  children?: ReactNode;
  enterAction?: 'confirm' | 'cancel';
}

function QuestionIcon() {
  return (
    <div className="icon-wrapper">
      <span className="question-mark">?</span>
    </div>
  );
}

function WarningIcon() {
  return (
    <svg
      width="38"
      height="38"
      viewBox="0 0 50 50"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className="warningIcon"
    >
      <circle cx="25" cy="25" r="25" fill="#FFF3E0" />
      <rect x="23.5" y="12" width="2" height="18" rx="1.5" fill="#FF9800" />
      <circle cx="25" cy="36" r="2" fill="#FF9800" />
    </svg>
  );
}

export function Confirm({
  isOpen,
  onCancel,
  onConfirm,
  icon = 'none',
  title,
  subtitle,
  cancelLabel = '취소',
  confirmLabel = '확인',
  confirmButtonDataTourId,
  children,
  enterAction = 'confirm',
}: ConfirmProps) {
  const enterHandler = enterAction === 'cancel' ? onCancel : onConfirm;
  useModalEffects({ isOpen, variant: 'double', onClose: onCancel, onConfirm: enterHandler });

  if (!isOpen) return null;

  const renderIcon = () => {
    switch (icon) {
      case 'question':
        return <QuestionIcon />;
      case 'warning':
        return <WarningIcon />;
      default:
        return null;
    }
  };

  return (
    <div className="background">
      <div className="warningContainer" onClick={(e) => e.stopPropagation()}>
        <div className="contentWrapper">
          {renderIcon()}
          {title && <h2 className="modal-title">{title}</h2>}
          {subtitle && <p className="modal-subtitle">{subtitle}</p>}
          {children}
        </div>
        <div className="success-btn-row">
          <button className="success-btn gray" onClick={onCancel}>
            {cancelLabel}
          </button>
          <button
            className="success-btn blue"
            onClick={onConfirm}
            data-tour-id={confirmButtonDataTourId}
          >
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}
