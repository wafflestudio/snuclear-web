import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { isApiError } from '@shared/api/fetch';
import { signupApi, loginApi, useAuth } from '@features/auth';
import '@pages/login/login.css';

interface RegisterFormData {
  name: string;
  email: string;
  password: string;
  confirmPassword: string;
}

export default function Register() {
  const navigate = useNavigate();
  const { user, login } = useAuth();

  // 이미 로그인된 사용자는 홈으로 리다이렉트
  useEffect(() => {
    if (user) {
      navigate('/', { replace: true });
    }
  }, [user, navigate]);

  const {
    register,
    handleSubmit,
    formState: { errors },
    setError,
    watch,
  } = useForm<RegisterFormData>({
    defaultValues: {
      name: '',
      email: '',
      password: '',
      confirmPassword: '',
    },
    mode: 'onBlur',
  });

  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [globalError, setGlobalError] = useState<string | null>(null);

  const password = watch('password');

  const onSubmit = async (data: RegisterFormData) => {
    setGlobalError(null);

    try {
      await signupApi({
        email: data.email,
        password: data.password,
        ...(data.name ? { nickname: data.name } : {}),
      });

      // 자동 로그인
      const loginResponse = await loginApi({
        email: data.email,
        password: data.password,
      });

      const responseData = loginResponse.data;
      const userData =
        'user' in responseData ? responseData.user : responseData;
      const accessToken =
        'accessToken' in responseData ? responseData.accessToken : '';

      login(
        {
          id: userData.id.toString(),
          nickname: userData.nickname,
          email: data.email,
          provider: 'local',
          admin: false,
        },
        accessToken || ''
      );

      navigate('/', { replace: true });
    } catch (error) {
      if (isApiError(error)) {
        const responseData = error.data;

        switch (error.status) {
          case 409:
            setError('email', { message: '이미 사용 중인 이메일입니다.' });
            break;

          case 400:
            if (responseData.validationErrors) {
              const validationErrors = responseData.validationErrors as Record<string, string>;
              if (validationErrors.email) {
                setError('email', {
                  message: validationErrors.email,
                });
              }
              if (validationErrors.password) {
                setError('password', {
                  message: validationErrors.password,
                });
              }
              if (validationErrors.nickname) {
                setError('name', {
                  message: validationErrors.nickname,
                });
              }
            } else {
              setGlobalError(
                (responseData.message as string) || '입력 정보를 확인해주세요.'
              );
            }
            break;

          default:
            setGlobalError('회원가입 중 알 수 없는 오류가 발생했습니다.');
            console.error('[Register] Register Failed:', responseData);
        }
      } else {
        setGlobalError('네트워크 오류가 발생했습니다.');
        console.error('[Register] Unexpected Error:', error);
      }
    }
  };

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
          <h1 className="login-title">회원가입</h1>

          {globalError && (
            <div
              style={{
                color: 'red',
                marginBottom: '16px',
                textAlign: 'center',
              }}
            >
              {globalError}
            </div>
          )}

          <form className="login-form" onSubmit={handleSubmit(onSubmit)}>
            <div className="form-group">
              <input
                type="text"
                className="form-input"
                placeholder="닉네임 (선택)"
                {...register('name', {
                  validate: (value) =>
                    !value ||
                    (value.length >= 2 && value.length <= 20) ||
                    '닉네임은 2자 이상 20자 이하여야 합니다.',
                })}
              />
              {errors.name && (
                <span className="error-message">{errors.name.message}</span>
              )}
            </div>

            <div className="form-group">
              <input
                type="text"
                className="form-input"
                placeholder="이메일"
                {...register('email', {
                  required: '이메일을 입력해주세요.',
                  pattern: {
                    value: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
                    message: '올바른 이메일 형식이 아닙니다.',
                  },
                })}
              />
              {errors.email && (
                <span className="error-message">{errors.email.message}</span>
              )}
            </div>

            <div className="form-group">
              <div className="password-input-wrapper">
                <input
                  type={showPassword ? 'text' : 'password'}
                  className="form-input password-input"
                  placeholder="비밀번호"
                  {...register('password', {
                    required: '비밀번호를 입력해주세요.',
                    minLength: {
                      value: 8,
                      message: '비밀번호는 8글자 이상이어야 합니다.',
                    },
                    validate: {
                      hasLetter: (value) =>
                        /[a-zA-Z]/.test(value) ||
                        '비밀번호에 영어가 포함되어야 합니다.',
                      hasNumber: (value) =>
                        /[0-9]/.test(value) ||
                        '비밀번호에 숫자가 포함되어야 합니다.',
                      hasSpecial: (value) =>
                        /[!@#$%^&*(),.?":{}|<>]/.test(value) ||
                        '비밀번호에 특수문자가 포함되어야 합니다.',
                    },
                  })}
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
              {errors.password && (
                <span className="error-message">{errors.password.message}</span>
              )}
            </div>

            <div className="form-group">
              <div className="password-input-wrapper">
                <input
                  type={showConfirmPassword ? 'text' : 'password'}
                  className="form-input password-input"
                  placeholder="비밀번호 확인"
                  {...register('confirmPassword', {
                    required: '비밀번호 확인을 입력해주세요.',
                    validate: (value) =>
                      value === password || '비밀번호가 일치하지 않습니다.',
                  })}
                />
                <button
                  type="button"
                  className="password-toggle"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                >
                  <img
                    src={
                      showConfirmPassword
                        ? '/assets/hide.png'
                        : '/assets/view.png'
                    }
                    alt={
                      showConfirmPassword ? '비밀번호 숨기기' : '비밀번호 보기'
                    }
                  />
                </button>
              </div>
              {errors.confirmPassword && (
                <span className="error-message">
                  {errors.confirmPassword.message}
                </span>
              )}
            </div>

            <button type="submit" className="login-button">
              회원가입
            </button>
          </form>

          <div className="login-footer">
            <Link to="/login" className="register-link">
              이미 계정이 있으신가요? 로그인하기
            </Link>
          </div>
        </div>
      </main>
    </div>
  );
}
