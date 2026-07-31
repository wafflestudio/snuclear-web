import { useCallback, useEffect, useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { isApiError } from '@shared/api/fetch';
import {
  useAuth,
  loginApi,
  socialLoginApi,
  type socialProvider,
} from '@features/auth';
import './login.css';

const KAKAO_REST_API_KEY = import.meta.env.VITE_KAKAO_REST_API_KEY;
const GOOGLE_CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID;

const SAVED_EMAIL_KEY = 'savedEmail';

interface LoginFormData {
  email: string;
  password: string;
  rememberMe: boolean;
}

export default function Login() {
  const { user, login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  // 이미 로그인된 사용자는 홈으로 리다이렉트
  useEffect(() => {
    if (user) {
      navigate('/', { replace: true });
    }
  }, [user, navigate]);

  const savedEmail = localStorage.getItem(SAVED_EMAIL_KEY) ?? '';

  const {
    register,
    handleSubmit,
    formState: { errors },
    setError,
  } = useForm<LoginFormData>({
    defaultValues: {
      email: savedEmail,
      password: '',
      rememberMe: !!savedEmail,
    },
  });

  const [showPassword, setShowPassword] = useState(false);
  const [socialErrorMessage, setSocialErrorMessage] = useState<string | null>(
    null
  );

  const redirectUri = `${window.location.origin}/login`;

  const onSubmit = async (data: LoginFormData) => {
    setSocialErrorMessage(null);

    try {
      const response = await loginApi({
        email: data.email,
        password: data.password,
      });

      const responseData = response.data;
      const userData =
        'user' in responseData ? responseData.user : responseData;
      const accessToken =
        'accessToken' in responseData ? responseData.accessToken : '';

      if (!userData || !('id' in userData) || !('nickname' in userData)) {
        console.error(
          '[Login] Unexpected login response format:',
          responseData
        );
        setError('root', {
          message: '로그인 중 알 수 없는 오류가 발생했습니다.',
        });
        return;
      }

      login(
        {
          id: userData.id.toString(),
          nickname: userData.nickname,
          email: data.email,
          provider: 'local',
          admin: userData.isAdmin ?? false,
        },
        accessToken || ''
      );

      // 아이디 저장 처리
      if (data.rememberMe) {
        localStorage.setItem(SAVED_EMAIL_KEY, data.email);
      } else {
        localStorage.removeItem(SAVED_EMAIL_KEY);
      }

      // 로그인 후 뒤로가기 방지를 위한 플래그 설정
      sessionStorage.setItem('freshLogin', 'true');

      if (userData.isAdmin) {
        window.location.replace('/admin');
      } else {
        window.location.replace('/');
      }
    } catch (error) {
      if (isApiError(error)) {
        switch (error.status) {
          case 400:
            setError('email', { message: '올바른 이메일 형식이 아닙니다' });
            break;

          case 401:
            setError('root', {
              message: '이메일 또는 비밀번호가 올바르지 않습니다',
            });
            break;

          default:
            setError('root', {
              message: '로그인 중 알 수 없는 오류가 발생했습니다.',
            });
            console.error('[Login] Login Failed:', error.data);
        }
      } else {
        console.error('[Login] Unexpected Error:', error);
        setError('root', { message: '네트워크 오류가 발생했습니다.' });
      }
    }
  };

  const handleSocialStart = (provider: socialProvider) => {
    sessionStorage.setItem('pendingSocialProvider', provider);

    if (provider === 'kakao') {
      const url = `https://kauth.kakao.com/oauth/authorize?client_id=${KAKAO_REST_API_KEY}&redirect_uri=${redirectUri}&response_type=code`;
      window.location.href = url;
    } else if (provider === 'google') {
      const url = `https://accounts.google.com/o/oauth2/v2/auth?client_id=${GOOGLE_CLIENT_ID}&redirect_uri=${redirectUri}&response_type=code&access_type=offline&prompt=consent&scope=email profile`;
      window.location.href = url;
    }
  };

  const handleSocialLogin = useCallback(
    async (provider: socialProvider, code: string) => {
      setSocialErrorMessage(null);

      try {
        const response = await socialLoginApi(provider, { code, redirectUri });
        const { user, accessToken } = response.data;

        login(
          {
            id: user.id.toString(),
            nickname: user.nickname,
            provider: provider,
            admin: user.isAdmin ?? false,
          },
          accessToken
        );

        // 로그인 후 뒤로가기 방지를 위한 플래그 설정
        sessionStorage.setItem('freshLogin', 'true');

        if (user.isAdmin) {
          window.location.replace('/admin');
        } else {
          window.location.replace('/');
        }
      } catch (error) {
        if (isApiError(error)) {
          switch (error.status) {
            case 400:
              setSocialErrorMessage('입력 값이 유효하지 않습니다.');
              break;
            case 401:
              setSocialErrorMessage('소셜 인증에 실패했습니다.');
              break;
            default:
              setSocialErrorMessage(
                '소셜 로그인 중 알 수 없는 오류가 발생했습니다.'
              );
              console.error(
                '[Login] Social Login Failed:',
                error.data
              );
          }
        } else {
          console.error('[Login] Unexpected Error:', error);
          setSocialErrorMessage('네트워크 오류가 발생했습니다.');
        }
      } finally {
        sessionStorage.removeItem('pendingSocialProvider');
      }
    },
    [login, redirectUri]
  );

  useEffect(() => {
    const searchParams = new URLSearchParams(location.search);
    const code = searchParams.get('code');
    const provider = sessionStorage.getItem(
      'pendingSocialProvider'
    ) as socialProvider | null;

    if (code && provider) {
      handleSocialLogin(provider, code);
      window.history.replaceState({}, document.title, window.location.pathname);
    }
  }, [location, handleSocialLogin]);

  return (
    <div className="login-page">
      <header className="login-header">
        <div className="login-header-content">
          <Link to="/" className="login-logo">
            <img
              src="/assets/logo.png"
              alt="SnuClear Logo"
              onError={(e) => {
                (e.currentTarget as HTMLImageElement).style.display = 'none';
              }}
            />
            <span className="login-logo-text">SNUCLEAR</span>
          </Link>
        </div>
      </header>

      <main className="login-main">
        <div className="login-container">
          <h1 className="login-title">아이디 로그인</h1>
          {errors.root && (
            <div
              style={{
                color: 'red',
                marginBottom: '10px',
                textAlign: 'center',
              }}
            >
              {errors.root.message}
            </div>
          )}

          <form className="login-form" onSubmit={handleSubmit(onSubmit)}>
            <div className="form-group">
              <input
                type="text"
                className="form-input"
                placeholder="이메일"
                {...register('email', { required: true })}
              />
              {errors.email && (
                <span
                  style={{
                    color: 'red',
                    fontSize: '16px',
                    marginLeft: '8px',
                  }}
                >
                  {errors.email.message}
                </span>
              )}
            </div>

            <div className="form-group">
              <div className="password-input-wrapper">
                <input
                  type={showPassword ? 'text' : 'password'}
                  className="form-input password-input"
                  placeholder="비밀번호 입력"
                  {...register('password', { required: true })}
                />
                <button
                  type="button"
                  className="password-toggle"
                  onClick={() => setShowPassword(!showPassword)}
                >
                  <img
                    src={showPassword ? '/assets/hide.png' : '/assets/view.png'}
                    alt={showPassword ? '비밀번호 숨기기' : '비밀번호 보기'}
                  />
                </button>
              </div>
            </div>

            <div className="form-checkbox">
              <label>
                <input type="checkbox" {...register('rememberMe')} />
                <span>아이디 저장</span>
              </label>
            </div>

            <button type="submit" className="login-button">
              로그인
            </button>
          </form>

          <div className="social-login">
            {socialErrorMessage && (
              <div
                style={{
                  color: 'red',
                  marginBottom: '10px',
                  textAlign: 'center',
                }}
              >
                {socialErrorMessage}
              </div>
            )}
            <button
              className="kakao-login-button"
              onClick={() => handleSocialStart('kakao')}
            >
              <div className="kakao-icon-wrapper">
                <img src="/assets/kakao_logo.png" alt="Kakao Symbol" />
              </div>
              <span className="kakao-label">카카오 로그인</span>
            </button>
            <button
              className="gsi-material-button"
              onClick={() => handleSocialStart('google')}
            >
              <div className="gsi-material-button-state"></div>
              <div className="gsi-material-button-content-wrapper">
                <div className="gsi-material-button-icon">
                  <svg
                    version="1.1"
                    xmlns="http://www.w3.org/2000/svg"
                    viewBox="0 0 48 48"
                    xmlnsXlink="http://www.w3.org/1999/xlink"
                    style={{ display: 'block' }}
                  >
                    <path
                      fill="#EA4335"
                      d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"
                    ></path>
                    <path
                      fill="#4285F4"
                      d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"
                    ></path>
                    <path
                      fill="#FBBC05"
                      d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"
                    ></path>
                    <path
                      fill="#34A853"
                      d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"
                    ></path>
                    <path fill="none" d="M0 0h48v48H0z"></path>
                  </svg>
                </div>
                <span className="gsi-material-button-contents">
                  Google 계정으로 로그인
                </span>
                <span style={{ display: 'none' }}>Google 계정으로 로그인</span>
              </div>
            </button>
          </div>

          <div className="login-footer">
            <Link to="/register" className="register-link">
              회원가입하기
            </Link>
          </div>
        </div>
      </main>
    </div>
  );
}
