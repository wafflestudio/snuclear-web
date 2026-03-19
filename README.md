# SNUClear

서울대학교 수강신청 시스템을 모방한 시뮬레이션 플랫폼입니다. 실제와 유사한 환경에서 수강신청을 연습하고, 반응속도를 측정하여 랭킹에 도전할 수 있습니다.

**배포:** https://snuclear.com/

현재 레포는 front(web) 레포지토리이고 백엔드 레포는 https://github.com/wafflestudio/23-5-team8-server 에서 확인하실 수 있습니다.

모바일을 위한 반응형 디자인이 구현되어 있습니다.

---

## 기술 스택


| 카테고리  | 기술                                                           |
| --------- | -------------------------------------------------------------- |
| Core      | React 19.2 (React Compiler), TypeScript 5.9, Vite 7.2          |
| 상태 관리 | TanStack Query, Zustand, React Hook Form                       |
| UI/라우팅 | React Router DOM 7, TanStack Virtual, @dnd-kit                 |
| 인프라    | Axios, Kakao/Google OAuth, Playwright, ESLint, Prettier, Husky |


---

## 서비스 소개

### 홈

| <img alt="home1" src="https://github.com/user-attachments/assets/5ecb6b3e-e6ff-4209-b0b1-d75c57de34cf" /> | <img alt="home2" src="https://github.com/user-attachments/assets/61f1770f-5ab3-414b-bbde-4c42633985ed" /> |

| :--: | :--: |


서비스의 메인 화면입니다. Header와 Footer는 로그인/회원가입/마이페이지를 제외하고는 유지가 됩니다. Header에서는 강의 검색, 탭 이동, 유저메뉴가 표시되며 Footer에서는 로그인 타이머가 표시됩니다. 로그인 타이머가 1분 이하로 남으면 팝업이 뜹니다.

---

### 로그인 / 회원가입

<img width="2850" height="1466" alt="login" src="https://github.com/user-attachments/assets/884dc21e-28ee-438e-aeb5-ccb7a1edb532" />

이메일 로그인과 카카오, 구글 소셜 로그인을 지원합니다. 아이디 저장 시 다음 접속에 입력했던 이메일 정보가 자동입력됩니다.

---

### 강좌 검색

<img width="2880" height="1466" alt="search" src="https://github.com/user-attachments/assets/b6d2e2fe-3090-4fac-8ea7-c092157a2c20" />

강좌명, 교수명으로 강좌를 검색할 수 있습니다. 장바구니에 담기 전 시간표 충돌 여부를 자동으로 검사하여 겹치는 강좌가 있으면 경고를 표시합니다.

---

### 장바구니

<img width="2880" height="1466" alt="cart" src="https://github.com/user-attachments/assets/4cca6fcb-d13b-4928-a85b-6cfe16926ec1" />

수강신청할 강좌를 미리 담아둘 수 있습니다. 장바구니 담은 수 숫자를 클릭하면 유저가 담은 수를 수정할 수 있습니다. 우측 시간표에서 담은 강좌들의 시간 배치를 미리 확인할 수 있습니다.

---

### 수강신청 시뮬레이터

<img width="2880" height="1468" alt="registration" src="https://github.com/user-attachments/assets/d78aad35-9826-4334-bd41-dbb010efc3a9" />

실제 수강신청과 동일한 긴장감을 느낄 수 있는 핵심 기능입니다.

- 설정한 시간에 맞춰 타이머가 시작됩니다 (60초전, 30초전, 15초전)
- Picture-in-Picture(PiP) 기능으로 다른 작업 중에도 타이머를 확인할 수 있습니다 (always-on-top timer)
- CAPTCHA 입력 후 신청을 완료합니다
- 경쟁자 수와 수용 인원을 기반으로 대기열을 시뮬레이션합니다
- 수강신청 성공 / 실패 로직은 그동안 쌓은 로그를 바탕으로 해당 시도의 반응속도 백분율을 기반으로 백엔드에서 판단합니다.

<img width="2878" height="1426" alt="registration_pip" src="https://github.com/user-attachments/assets/18fadb95-b231-4fb2-96eb-c6675e1e3fef" />

---

### 리더보드

<img width="2880" height="1462" alt="leaderboard" src="https://github.com/user-attachments/assets/755775d5-77d2-476a-ab17-3c7508a6cf09" />

수강신청 연습 결과를 바탕으로 랭킹을 확인할 수 있습니다.

- **1픽 반응속도**: 첫 번째 강좌 신청까지 걸린 시간
- **2픽 반응속도**: 두 번째 강좌 신청까지 걸린 시간
- **경쟁률**: 수강신청 성공한 강의 중 가장 높은 경쟁률
- 주간 랭킹과 전체 랭킹을 필터링할 수 있습니다
- 로그인한 사용자는 자신의 순위를 확인할 수 있습니다

---

### 마이페이지

<img width="2878" height="1466" alt="mypage" src="https://github.com/user-attachments/assets/3a9130fa-857e-4f66-bcc4-43d8a79cdc0c" />

자신의 연습 기록과 통계를 확인할 수 있습니다. 각 연습 세션별 상세 결과를 조회할 수 있으며, 평균 반응속도와 성공률을 통해 실력 향상을 추적할 수 있습니다.
연습 기록 통계는 '연습결과상세'탭에서도 같은 내용을 확인할 수 있습니다.

---

### 관리자 페이지

<img width="2850" height="1466" alt="image" src="https://github.com/user-attachments/assets/ef6040c9-15e3-4f99-b670-117f28203656" />

관리자 전용 페이지입니다. 공지사항 작성/수정/삭제와 강좌 데이터 동기화 기능을 제공하고 백엔드에서 여러 지표를 받아와 표시합니다.

---

## 아키텍처

### Feature-Sliced Design (FSD)

이 프로젝트는 **Feature-Sliced Design** 아키텍처를 적용하여 코드를 구조화했습니다.

**선택 이유:**

- 기능 단위로 코드를 격리하여 확장성 확보
- 레이어 간 단방향 의존성으로 순환 참조 방지
- 새로운 기능 추가 시 영향 범위 최소화

### 레이어 구조

```
src/
├── app/        # 앱 초기화, 라우팅, 전역 Provider
├── pages/      # 라우트별 페이지 컴포넌트
├── widgets/    # 독립적인 UI 블록 (Header, Footer, TimeTable)
├── features/   # 사용자 인터랙션 단위 (auth, cart, search...)
├── entities/   # 비즈니스 도메인 모델 (Course, User)
└── shared/     # 공용 유틸, UI 컴포넌트, API 설정
```

### 의존성 규칙

```
app → pages → widgets → features → entities → shared
```

상위 레이어는 하위 레이어만 import할 수 있습니다. 역방향 참조는 금지됩니다.

### Path Aliases

| Alias         | Path             |
| ------------- | ---------------- |
| `@app/*`      | `src/app/*`      |
| `@pages/*`    | `src/pages/*`    |
| `@widgets/*`  | `src/widgets/*`  |
| `@features/*` | `src/features/*` |
| `@entities/*` | `src/entities/*` |
| `@shared/*`   | `src/shared/*`   |

---

### 상태 관리 전략

상태의 성격에 따라 적합한 도구를 분리하여 사용합니다.

| Layer             | Tool            | 사용처                            |
| ----------------- | --------------- | --------------------------------- |
| **Server State**  | TanStack Query  | API 데이터 (강좌, 장바구니, 랭킹) |
| **Client Global** | Zustand         | 모달 상태, 인증 상태              |
| **URL State**     | useSearchParams | 검색 필터, 페이지네이션           |
| **Form State**    | React Hook Form | 로그인, 회원가입 폼               |
| **Local State**   | useState        | 드롭다운, 토글 등 컴포넌트 내부   |

**분리 이유:**

- 서버 데이터를 전역 상태에 넣으면 캐싱과 동기화를 직접 구현해야 합니다
- URL에 필터를 저장하면 링크 공유와 북마크가 가능합니다
- 각 도구가 잘하는 영역에 집중하여 복잡성을 줄입니다

---

## 기여자


| <img src="https://github.com/user983740.png" width="120" /> | <img src="https://github.com/ohsemin2.png" width="120" /> |
| :---------------------------------------------------------: | :-------------------------------------------------------: |
|                         **서민석**                          |                        **오세민**                         |
|        [@user983740](https://github.com/user983740)         |         [@ohsemin2](https://github.com/ohsemin2)          |
| 홈, 수강신청 시뮬레이터, 리더보드, 관리자 페이지, 상태 관리 설계 | 로그인/회원가입, 강좌 검색, 장바구니, 수강신청 내역, 마이페이지 |

