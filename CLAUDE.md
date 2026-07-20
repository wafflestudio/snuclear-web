# 프로젝트 개요

수강신청 연습 사이트 (SnuClear) 프론트엔드.
React 19 + Vite + TypeScript, FSD(Feature-Sliced Design) 아키텍처.

## 기술 스택

- **빌드**: Vite 7, TypeScript 5.9
- **UI**: React 19, React Router DOM 7, Recharts
- **상태관리**: TanStack Query 5, Zustand 5
- **스타일**: CSS Modules (컴포넌트별 `.css` 파일)
- **HTTP**: 네이티브 fetch 래퍼 (`src/shared/api/fetch.ts`, Bearer 토큰, sessionStorage에 저장)
- **API 베이스**: `https://snuclear-server.wafflestudio.com/` (개발 시 vite proxy `/api` 사용)

## 디렉토리 구조 (FSD)

```
src/
├── app/          # 앱 진입점, 라우터, 프로바이더
├── pages/        # 페이지 컴포넌트 (라우트별)
├── widgets/      # 복합 UI 블록
├── features/     # 비즈니스 기능 단위
├── entities/     # 도메인 엔티티 (user 등)
└── shared/       # 공통 유틸, fetch API 래퍼 등
```

## 주요 경로

| 경로 | 설명 |
|------|------|
| `/practice-session/:sessionId` | 연습 세션 상세 조회 |
| `/practice-results` | 연습 세션 목록 |
| `/session-share?d=<base64>` | QR 공유 이미지 페이지 (인증 불필요) |
| `/mypage` | 마이페이지 |

## 개발 환경

```bash
npm run dev          # 개발 서버
npm run dev -- --host  # 핸드폰 테스트용 (로컬 IP 노출)
npm run typecheck    # 타입 체크
npm run build        # 프로덕션 빌드
```

> **핸드폰 테스트**: 백엔드가 특정 IP만 허용하므로 `snuclear.wafflestudio.com` 프로덕션에서 테스트.
> 롤백 필요 시 GitHub PR 페이지의 Revert 버튼 사용.

## 인증

- JWT Bearer 토큰을 `sessionStorage`에 저장 (`authToken` 키)
- `src/shared/api/fetch.ts`에서 요청 시 자동 첨부
- 토큰은 탭/브라우저 세션 단위로 유지 (창 닫으면 만료)

### 라우트 가드

`src/features/auth/ui/` 의 컴포넌트로 라우트 레벨 보호. 비권한 시 `/`로 리다이렉트.
- `<RequireAuth>` — 로그인 필요 (`/cart`, `/registration`, `/enrollment-history`, `/mypage`, `/practice-results`, `/practice-session/:id`)
- `<RequireAdmin>` — 어드민 권한 필요 (`/admin`)

어드민 유저도 일반 페이지 자유 접근 가능 (AuthProvider에서 강제 리다이렉트 제거됨).

## QR 공유 기능 (session-share)

- `src/pages/practice-session/index.tsx`: 세션 데이터를 base64 인코딩 → QR 생성 (`qrcode` 라이브러리)
- `src/pages/session-share/index.tsx`: URL 파라미터 디코딩 → Canvas API로 카드 이미지 생성 → `<img>` 표시
- 인증 불필요, 데이터가 URL에 포함되어 있음

## GitHub

- **push/PR 시 반드시 `user983740` 계정 사용** (`gh auth status`로 확인 후 진행)
- 계정이 다르면: `gh auth switch --user user983740`

## 컨벤션

- 컴포넌트: PascalCase, 파일명 `index.tsx`
- CSS: 컴포넌트 옆에 동명 `.css` 파일
- API 함수: `src/entities/{domain}/api/` 또는 `src/features/{feature}/api/`
- 타입: `src/entities/{domain}/model/types.ts`
