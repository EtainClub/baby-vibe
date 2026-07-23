# Firebase 설정 및 후속 구현 로드맵

이 문서는 모아 프로젝트를 디자인 데모 모드에서 실제 Firebase 환경으로 전환하는 방법과 이후 구현 우선순위를 정리한 운영 기준 문서입니다.

마지막 검토일: 2026-07-23

## 1. 현재 구현 상태

애플리케이션 코드는 다음 Firebase 연결을 이미 포함합니다.

- Firebase Web SDK 초기화
- Google 로그인 후 ID 토큰을 서버 세션 쿠키로 교환
- Firebase Admin SDK 기반 서버 전용 데이터 접근
- Firestore 프로필, 사용자명, 앱, 통계, 응원 저장소
- Storage 프로필 이미지 및 앱 커버 업로드
- Firestore 복합 인덱스와 Firestore/Storage 보안 규칙
- Authentication, Firestore, Storage 로컬 에뮬레이터 연결
- reCAPTCHA Enterprise 기반 App Check 초기화
- Firebase 설정이 없을 때 사용하는 디자인 데모 데이터

현재 남은 가장 큰 작업은 실제 Firebase 프로젝트를 생성해 환경값을 연결하고, 운영 프로젝트에서 인증·데이터·Storage·App Check 전체 흐름을 검증하는 것입니다.

## 2. 필요한 준비물

- Firebase 프로젝트를 만들 수 있는 Google 계정
- Node.js와 pnpm
- Firebase CLI
- 배포할 실제 도메인 또는 Vercel 미리보기 주소

Firebase CLI는 전역 설치 없이 다음 형태로 실행할 수 있습니다.

```bash
pnpm dlx firebase-tools --version
pnpm dlx firebase-tools login
```

## 3. Firebase Console 설정

### 3.1 프로젝트와 Web App 생성

1. [Firebase Console](https://console.firebase.google.com/)에서 프로젝트를 생성합니다.
2. 프로젝트 개요에서 Web App을 추가합니다.
3. 발급된 Firebase 구성 객체의 값을 `.env.local`의 `NEXT_PUBLIC_FIREBASE_*` 항목에 옮깁니다.
4. 개발, 스테이징, 운영 데이터를 분리하려면 처음부터 Firebase 프로젝트도 각각 분리합니다.

Firebase Web 설정값은 브라우저에 포함되는 공개 식별자입니다. 반면 `FIREBASE_ADMIN_*` 값과 서비스 계정 비밀키는 절대 브라우저 코드나 Git에 포함하면 안 됩니다.

### 3.2 Google 로그인 활성화

1. Firebase Console의 **Authentication → Sign-in method**로 이동합니다.
2. Google 공급자를 활성화하고 지원 이메일을 지정합니다.
3. **Authentication → Settings → Authorized domains**에 다음 주소를 확인하거나 추가합니다.
   - `localhost`
   - Vercel 배포 도메인
   - 실제 서비스 커스텀 도메인
4. 커스텀 인증 도메인을 사용한다면 OAuth 리디렉션 주소도 함께 등록합니다.

현재 구현은 데스크톱과 모바일 모두 팝업 로그인을 사용합니다. 모바일 브라우저의 팝업 차단 대응을 위한 리디렉션 로그인은 후속 로드맵에 포함되어 있습니다.

### 3.3 Firestore 생성

1. **Firestore Database**에서 기본 데이터베이스를 Native 모드로 생성합니다.
2. 주요 사용자와 배포 서버에 가까운 리전을 선택합니다.
3. 리전은 나중에 쉽게 바꿀 수 없으므로 Storage 및 향후 서버 기능의 위치와 함께 결정합니다.
4. Console에서 임시 완화 규칙을 만들지 말고 저장소의 `firestore.rules`를 배포합니다.

### 3.4 Cloud Storage 생성

1. **Storage**에서 기본 버킷을 생성합니다.
2. 버킷 이름을 `.env.local`의 두 Storage 항목에 입력합니다.
3. 저장소의 `storage.rules`를 배포합니다.

클라이언트는 JPG, PNG, WebP 파일만 허용하며, 5MB 이하 이미지를 최대 1600px WebP로 변환한 뒤 업로드합니다. Storage 규칙도 소유자 경로와 이미지 형식을 다시 검사합니다.

### 3.5 Admin SDK 서비스 계정

Firebase Console의 **Project settings → Service accounts**에서 Admin SDK용 서비스 계정 키를 발급합니다.

- `project_id` → `FIREBASE_ADMIN_PROJECT_ID`
- `client_email` → `FIREBASE_ADMIN_CLIENT_EMAIL`
- `private_key` → `FIREBASE_ADMIN_PRIVATE_KEY`
- Storage 버킷 이름 → `FIREBASE_ADMIN_STORAGE_BUCKET`

`.env.local`에 넣을 때 비밀키의 줄바꿈은 `\n` 문자열로 유지합니다.

```dotenv
FIREBASE_ADMIN_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n"
```

서비스 계정 JSON 파일과 `.env.local`은 커밋하지 않습니다. 로컬에서 JSON 파일을 사용해야 한다면 `GOOGLE_APPLICATION_CREDENTIALS`를 사용할 수 있지만, 운영 배포 환경에서는 암호화된 환경 변수 저장소를 사용합니다.

## 4. 환경 변수

`.env.example`을 복사해 시작합니다.

```bash
cp .env.example .env.local
```

| 변수 | 사용 위치 | 필수 여부 | 설명 |
| --- | --- | --- | --- |
| `NEXT_PUBLIC_FIREBASE_API_KEY` | 브라우저 | 필수 | Web App API 키 |
| `NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN` | 브라우저 | 필수 | Firebase Auth 도메인 |
| `NEXT_PUBLIC_FIREBASE_PROJECT_ID` | 브라우저 | 필수 | Firebase 프로젝트 ID |
| `NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET` | 브라우저 | 필수 | 업로드 대상 버킷 |
| `NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID` | 브라우저 | 필수 | Web App 발급값 |
| `NEXT_PUBLIC_FIREBASE_APP_ID` | 브라우저 | 필수 | Web App ID |
| `FIREBASE_ADMIN_PROJECT_ID` | 서버 | 필수 | Admin SDK 프로젝트 ID |
| `FIREBASE_ADMIN_CLIENT_EMAIL` | 서버 | 운영 필수 | 서비스 계정 이메일 |
| `FIREBASE_ADMIN_PRIVATE_KEY` | 서버 | 운영 필수 | 서비스 계정 비밀키 |
| `FIREBASE_ADMIN_STORAGE_BUCKET` | 서버 | 필수 | 기본 Storage 버킷 |
| `NEXT_PUBLIC_APP_URL` | 공통 | 필수 | 공유 링크 및 same-origin 검사 기준 URL |
| `NEXT_PUBLIC_FIREBASE_APP_CHECK_SITE_KEY` | 브라우저 | 운영 권장 | reCAPTCHA Enterprise 사이트 키 |
| `NEXT_PUBLIC_USE_FIREBASE_EMULATORS` | 브라우저 | 로컬 선택 | `true`일 때 클라이언트 에뮬레이터 연결 |
| `FIREBASE_AUTH_EMULATOR_HOST` | 서버 | 로컬 선택 | `127.0.0.1:9099`, 프로토콜 제외 |
| `FIRESTORE_EMULATOR_HOST` | 서버 | 로컬 선택 | `127.0.0.1:8080` |
| `FIREBASE_STORAGE_EMULATOR_HOST` | 서버 | 로컬 선택 | `127.0.0.1:9199` |

운영 예시:

```dotenv
NEXT_PUBLIC_APP_URL=https://moa.example.com
NEXT_PUBLIC_FIREBASE_API_KEY=...
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your-project.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=your-project
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your-project.firebasestorage.app
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=...
NEXT_PUBLIC_FIREBASE_APP_ID=...

FIREBASE_ADMIN_PROJECT_ID=your-project
FIREBASE_ADMIN_CLIENT_EMAIL=firebase-adminsdk-...@your-project.iam.gserviceaccount.com
FIREBASE_ADMIN_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n"
FIREBASE_ADMIN_STORAGE_BUCKET=your-project.firebasestorage.app

NEXT_PUBLIC_FIREBASE_APP_CHECK_SITE_KEY=...
```

Firebase Console에서 표시되는 실제 버킷 이름을 그대로 사용합니다. 프로젝트 생성 시점에 따라 버킷 도메인 형식이 다를 수 있으므로 추측해서 작성하지 않습니다.

## 5. 로컬 에뮬레이터 실행

에뮬레이터용 `.env.local`에는 다음 값을 추가합니다.

```dotenv
NEXT_PUBLIC_FIREBASE_API_KEY=demo-key
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=demo-moa.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=demo-moa
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=demo-moa.appspot.com
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=demo-sender
NEXT_PUBLIC_FIREBASE_APP_ID=demo-app

FIREBASE_ADMIN_PROJECT_ID=demo-moa
FIREBASE_ADMIN_STORAGE_BUCKET=demo-moa.appspot.com

NEXT_PUBLIC_APP_URL=http://localhost:3000
NEXT_PUBLIC_USE_FIREBASE_EMULATORS=true
FIREBASE_AUTH_EMULATOR_HOST=127.0.0.1:9099
FIRESTORE_EMULATOR_HOST=127.0.0.1:8080
FIREBASE_STORAGE_EMULATOR_HOST=127.0.0.1:9199
```

터미널 1:

```bash
pnpm dlx firebase-tools emulators:start --project demo-moa
```

터미널 2:

```bash
pnpm dev
```

에뮬레이터 UI는 `http://127.0.0.1:4000`에서 확인합니다. 현재 `firebase.json`에는 다음 포트가 고정되어 있습니다.

- Authentication: `9099`
- Firestore: `8080`
- Storage: `9199`
- Emulator UI: `4000`

에뮬레이터 데이터가 필요하면 다음처럼 보존할 수 있습니다.

```bash
pnpm dlx firebase-tools emulators:start \
  --project demo-moa \
  --import=.firebase-emulator-data \
  --export-on-exit=.firebase-emulator-data
```

`.firebase-emulator-data`를 사용한다면 개인 데이터나 토큰이 포함되지 않았는지 확인하고 Git 추적 여부를 별도로 결정합니다.

## 6. 규칙과 인덱스 배포

최초 한 번 프로젝트를 연결합니다.

```bash
pnpm dlx firebase-tools use --add
```

배포 전 파일:

- `firebase.json`
- `firestore.rules`
- `firestore.indexes.json`
- `storage.rules`

규칙과 인덱스를 함께 배포합니다.

```bash
pnpm dlx firebase-tools deploy --only firestore,storage
```

CLI 배포는 Firebase Console에서 직접 수정한 규칙을 저장소 파일 내용으로 덮어씁니다. 규칙의 기준 원본은 항상 이 저장소로 유지합니다.

## 7. App Check 적용 순서

현재 클라이언트는 `NEXT_PUBLIC_FIREBASE_APP_CHECK_SITE_KEY`가 있고 에뮬레이터 모드가 아닐 때 `ReCaptchaEnterpriseProvider`를 초기화하며 토큰 자동 갱신을 사용합니다.

1. Firebase Console의 **App Check**에서 Web App을 등록합니다.
2. reCAPTCHA Enterprise 사이트 키를 생성하고 실제 도메인을 등록합니다.
3. 사이트 키를 배포 환경 변수에 넣고 앱을 먼저 배포합니다.
4. App Check 지표에서 정상 요청이 유효한 토큰으로 들어오는지 관찰합니다.
5. 정상 트래픽이 확인된 후 Firestore와 Storage 강제 적용을 켭니다.
6. Authentication App Check 강제 적용은 현재 지원 상태와 로그인 회귀 테스트를 별도로 확인한 뒤 진행합니다.

강제 적용을 먼저 켜면 환경 변수가 누락된 배포와 로컬 개발 요청이 모두 차단될 수 있습니다.

## 8. 데이터 구조

| 컬렉션 | 문서 ID | 주요 내용 |
| --- | --- | --- |
| `users` | Firebase Auth UID | 사용자명, 표시 이름, 소개, 사진, 온보딩 상태 |
| `usernames` | 정규화된 사용자명 | 사용자명에서 UID로 가는 고유 매핑 |
| `apps` | 자동 생성 ID | 소유자, URL, 도구, 상태, 공개 여부, 정렬 순서 |
| `appStats` | 앱 ID | 앱 열기 수, 응원 수와 최초·최근 시각 |
| `appCheers` | 앱 ID와 방문자 값의 해시 | 브라우저별 중복 응원 방지 |

프로필 생성과 사용자명 예약, 앱 생성과 통계 문서 생성, 통계 증가는 Firestore 트랜잭션으로 처리됩니다. 일반 클라이언트는 핵심 문서를 직접 쓰지 못하며 Route Handler와 Admin SDK를 통해서만 변경합니다.

## 9. 실제 Firebase 연결 후 검증 체크리스트

### 인증과 세션

- [ ] Google 로그인 팝업이 열리고 계정 선택이 완료된다.
- [ ] 신규 사용자는 `/start`, 기존 사용자는 `/home`으로 이동한다.
- [ ] `__session` 쿠키가 HttpOnly, SameSite=Lax로 생성된다.
- [ ] 로그아웃 후 보호 API가 401을 반환한다.
- [ ] 허용되지 않은 Origin의 변경 요청이 거부된다.

### 프로필과 사용자명

- [ ] 사용자명 중복 생성이 트랜잭션에서 차단된다.
- [ ] 프로필 이미지가 WebP로 업로드되고 공개 페이지에 표시된다.
- [ ] 표시 이름과 소개 수정이 공개 페이지에 반영된다.

### 앱

- [ ] URL 메타데이터 확인 후 앱을 등록할 수 있다.
- [ ] 주소 없는 `building` 상태 앱을 등록할 수 있다.
- [ ] `live` 상태에는 URL이 필수다.
- [ ] 앱 수정, 공개/숨김, 순서 변경, 삭제가 반영된다.
- [ ] 사용자당 20개 제한이 적용된다.
- [ ] 앱 커버가 소유자 경로에 업로드된다.

### 공개 페이지와 통계

- [ ] 숨긴 앱은 공개 페이지와 `/go/{appId}`에서 접근되지 않는다.
- [ ] 앱 열기 시 카운트가 증가한 뒤 외부 URL로 이동한다.
- [ ] 같은 브라우저에서 같은 앱을 여러 번 응원해도 한 번만 반영된다.
- [ ] 앱 소유자만 전체 통계를 볼 수 있다.

### 규칙과 운영

- [ ] 로그인한 브라우저가 Firestore 핵심 문서를 직접 수정하지 못한다.
- [ ] 다른 사용자의 Storage 경로에 업로드하지 못한다.
- [ ] 5MB 초과 또는 허용되지 않은 이미지 형식이 거부된다.
- [ ] 프로덕션에서 HTTP 앱 URL이 거부된다.
- [ ] App Check 강제 적용 전후 정상 요청 비율을 확인한다.

## 10. 후속 구현 로드맵

아래 순서는 현재 코드 감사 결과를 기준으로 한 제안이며, 제품 우선순위가 바뀌면 이 문서를 함께 갱신합니다.

### P0 — 실제 Firebase 출시 준비

- 개발·스테이징·운영 Firebase 프로젝트 분리
- 운영 환경 변수와 Vercel Secret 등록
- Google 로그인 승인 도메인과 커스텀 도메인 연결
- Firestore/Storage 규칙 및 인덱스 배포
- 운영 Firebase 전체 흐름 수동 E2E 검증
- App Check 관찰 모드 배포 후 단계적 강제 적용

완료 기준: 데모 데이터 없이 신규 가입부터 앱 등록, 공개 페이지, 열기·응원 통계, 로그아웃까지 실제 Firebase에서 동작합니다.

### P1 — 자동화된 통합 테스트와 인증 안정화

- Firebase Emulator Suite 기반 프로필·앱·통계 통합 테스트 추가
- `@firebase/rules-unit-testing` 기반 Firestore 규칙 테스트 추가
- Storage 소유권, 크기, MIME 규칙 테스트 추가
- 로그인 세션 생성·만료·철회 테스트 추가
- 모바일에서 `signInWithRedirect`로 전환하거나 팝업 실패 시 리디렉션 fallback 제공
- URL 검사 SSRF, 리다이렉트, 응답 크기 제한 회귀 테스트 자동화

완료 기준: CI에서 인증, 저장소, 규칙, 핵심 사용자 여정이 반복 가능하게 검증됩니다.

### P2 — 데이터 수명주기와 운영 안전성

- 앱 삭제 시 연결된 Storage 커버 이미지도 정리
- 프로필 이미지 교체 시 이전 파일과 CDN 캐시 정책 점검
- 계정 삭제와 `users`, `usernames`, `apps`, 통계, 이미지 연쇄 정리 구현
- 응원 식별 해시 보존 기간과 개인정보 처리 방침 확정
- Firestore 백업, 복구 훈련과 장애 대응 문서 추가
- 구조화 로그, 오류 추적, 핵심 실패율 알림 도입
- 메타데이터 검사와 공개 반응 API에 분산형 rate limit 적용

완료 기준: 삭제·복구·남용 대응·장애 관찰 절차가 운영 문서와 자동화로 보장됩니다.

### P3 — 제품 기능 확장

- 일별 앱 열기와 응원 추이 저장 및 간단한 기간별 인사이트 제공
- 사용자명 변경과 `usernames` 매핑의 원자적 이전
- 앱 메타데이터 다시 가져오기와 미리보기 수동 편집 강화
- 카카오 JavaScript SDK를 사용하는 직접 공유 옵션 검토
- 앱 컬렉션, 태그, 검색 기능의 사용자 수요 검증
- 공개 프로필 SEO 메타데이터와 공유 이미지 자동 생성

완료 기준: 실제 사용자 데이터와 인터뷰에서 확인된 문제를 해결하며, 초보 사용자에게 불필요한 복잡성을 추가하지 않습니다.

### P4 — 규모 확장

- 개발·스테이징·운영 배포 파이프라인과 승인 절차 자동화
- 대량 앱과 통계 조회를 위한 페이지네이션 및 집계 전략
- 메타데이터 수집을 비동기 작업 큐로 분리
- 비용, 쿼터, Storage 전송량 대시보드와 예산 알림 설정
- 보안 규칙과 의존성의 정기 검토 일정 운영

완료 기준: 트래픽 증가가 응답 속도, 비용, 보안 경계를 예측 불가능하게 훼손하지 않습니다.

## 11. 공식 참고 문서

- [Firebase Web App 설정](https://firebase.google.com/docs/web/setup)
- [Google 로그인 설정](https://firebase.google.com/docs/auth/web/google-signin)
- [Firebase Local Emulator Suite](https://firebase.google.com/docs/emulator-suite)
- [Authentication Emulator 연결](https://firebase.google.com/docs/emulator-suite/connect_auth)
- [Firestore Emulator 차이점](https://firebase.google.com/docs/emulator-suite/connect_firestore)
- [Firebase CLI와 부분 배포](https://firebase.google.com/docs/cli)
- [App Check 개요](https://firebase.google.com/docs/app-check)
- [reCAPTCHA Enterprise App Check 설정](https://firebase.google.com/docs/app-check/web/recaptcha-enterprise-provider)

