import { Link } from 'react-router-dom';

interface AdminHeaderProps {
  onPasswordChange: () => void;
  onLogout: () => void;
}

export function AdminHeader({ onPasswordChange, onLogout }: AdminHeaderProps) {
  return (
    <header className="admin-header">
      <div className="admin-header-content">
        <Link to="/admin" className="admin-logo">
          <img
            src="/assets/logo.png"
            alt="All Clear Logo"
            onError={(e) => {
              (e.currentTarget as HTMLImageElement).style.display = 'none';
            }}
          />
          <span className="admin-logo-text">
            SNUCLEAR<span>Admin</span>
          </span>
        </Link>

        <div className="admin-header-actions">
          <button
            className="admin-header-btn outline"
            onClick={onPasswordChange}
          >
            비밀번호 변경
          </button>
          <button className="admin-header-btn danger" onClick={onLogout}>
            로그아웃
          </button>
        </div>
      </div>
    </header>
  );
}
