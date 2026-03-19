import { useAuth, useTimer } from '@features/auth';
import './footer.css';

interface FooterProps {
  onOpenModal: () => void;
}

export default function Footer({ onOpenModal }: FooterProps) {
  const { user } = useAuth();
  const { timeLeft } = useTimer();

  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m}:${s < 10 ? '0' : ''}${s}`;
  };

  return (
    <div className="footer">
      <div className="containerX footerInner">
        <div className="footerLeft">
          <div className="footerLinks">
            <a
              href="https://boulder-argon-568.notion.site/AllClear-2f70bdb7bbc1801585bbda989f431714"
              target="_blank"
              rel="noopener noreferrer"
              className="footerLinkItem bold"
            >
              개인정보처리방침
            </a>
          </div>
          <div className="footerCopy">
            Copyright (C) 2020 SNUCLEAR SERVICE. All Rights Reserved.
          </div>
        </div>

        {user ? (
          <div className="footerRight">
            <div className="footerRightLeftColumn">
              <div className="timerInfoUp">
                <span className="timerLabel">자동 로그아웃 남은시간</span>
                <div className="timerDisplay">
                  <svg
                    className="timerIcon"
                    viewBox="0 0 24 24"
                    width="18"
                    height="18"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <circle cx="12" cy="12" r="10"></circle>
                    <polyline points="12 6 12 12 16 14"></polyline>
                  </svg>
                  <span className="timerTime">{formatTime(timeLeft)}</span>
                </div>
              </div>
              <span className="timerInfoDown">
                10분간 사용하지 않을 경우 자동로그아웃 됩니다.
              </span>
            </div>
            <button className="extendBtn" onClick={onOpenModal}>
              지금 로그인 연장
            </button>
          </div>
        ) : (
          <div className="footerRight"></div>
        )}
      </div>
    </div>
  );
}
