export interface SnuttImportButtonProps {
  onClick: () => void;
  /** 'compact' = 목록 상단 버튼줄, 'cta' = 빈 상태 강조 버튼 */
  variant?: 'compact' | 'cta';
}

export function SnuttImportButton({
  onClick,
  variant = 'compact',
}: SnuttImportButtonProps) {
  return (
    <button
      type="button"
      className={
        variant === 'cta' ? 'snuttImportCtaBtn' : 'snuttImportCompactBtn'
      }
      onClick={onClick}
    >
      <svg viewBox="0 0 16 16" aria-hidden="true">
        <path
          d="M8 2v8m0 0L4.8 6.8M8 10l3.2-3.2"
          stroke="currentColor"
          strokeWidth="1.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <path
          d="M2.5 11v1.5A1.5 1.5 0 0 0 4 14h8a1.5 1.5 0 0 0 1.5-1.5V11"
          stroke="currentColor"
          strokeWidth="1.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
      SNUTT에서 불러오기
    </button>
  );
}
