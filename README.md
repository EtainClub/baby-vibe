# 모아

바이브 코딩으로 만든 작은 앱을 한곳에 모아 보여주는 개인 앱 허브입니다. 처음 앱을 만든 사람이 GitHub나 전문 개발 지식 없이도 앱 주소만으로 자기 페이지를 만들고, 앱 열기와 응원을 확인할 수 있도록 설계했습니다.

## 실행

```bash
pnpm install
cp .env.example .env.local
pnpm dev
```

환경값 없이 실행하면 랜딩, `/etime`, `/start`, `/home`, `/settings`를 디자인 데모 모드로 둘러볼 수 있습니다.

검증 명령:

```bash
pnpm lint
pnpm build
```

## Firebase 연결

1. Firebase 프로젝트에서 Web App을 만들고 `.env.example`의 `NEXT_PUBLIC_FIREBASE_*` 값을 채웁니다.
2. Authentication에서 Google 공급자를 활성화합니다.
3. Firestore와 Storage를 생성합니다.
4. 서비스 계정의 프로젝트 ID, 클라이언트 이메일, 비밀키를 `FIREBASE_ADMIN_*` 환경값에 추가합니다. 비밀키 파일이나 실제 `.env.local`은 커밋하지 않습니다.
5. Firebase CLI로 규칙과 인덱스를 배포합니다.

```bash
firebase use <project-id>
firebase deploy --only firestore:rules,firestore:indexes,storage
```

6. 운영 공개 전에 reCAPTCHA Enterprise 기반 App Check를 만들고 `NEXT_PUBLIC_FIREBASE_APP_CHECK_SITE_KEY`를 설정한 뒤 Firebase 콘솔에서 Firestore와 Storage 강제 적용을 켭니다.

Vercel에는 동일한 환경값과 `NEXT_PUBLIC_APP_URL=https://실제도메인`을 등록합니다.

## 주요 경로

- `/` — 서비스 소개
- `/login` — Google 로그인
- `/start` — 프로필과 첫 앱 등록
- `/home` — 앱 관리, 반응, 순서 변경, 크로스 프로모션
- `/settings` — 공개 프로필 수정
- `/{username}` — 공개 개인 앱 페이지
- `/go/{appId}` — 앱 열기 기록 후 외부 이동
- `/api/inspect` — SSRF 방어가 적용된 URL 메타데이터 확인
- `/api/cheer/{appId}` — 브라우저별 한 번의 응원

## 보안 경계

- Firebase Admin SDK와 서비스 계정은 `server-only` 데이터 접근 계층에서만 사용합니다.
- 프로필과 앱 쓰기, 통계 증가는 Route Handler를 통해서만 수행합니다.
- 앱 열기와 응원 수는 Firestore 클라이언트에서 직접 수정할 수 없습니다.
- URL 검사는 사설·루프백·메타데이터 주소, 비웹 프로토콜, 과도한 리다이렉트, 대용량·비HTML 응답과 시간 초과를 차단합니다.
- URL 검사에서 확인한 공개 IP로 실제 연결을 고정해 DNS 재바인딩도 차단합니다.
- 응원 원본 방문자 ID는 저장하지 않고 앱 ID와 결합한 SHA-256 문서 키만 사용합니다.

내 홈의 공유 화면에서는 문구 편집, Web Share, X, 카카오톡을 포함한 모바일 공유, QR 코드 저장을 제공하며 앱 순서는 데스크톱 드래그 또는 모바일 더보기 메뉴의 위·아래 이동으로 바꿀 수 있습니다.

## 디자인

Apple식 인터페이스 원칙을 웹에 맞게 적용했습니다. 눌림 순간의 피드백, 공간적으로 일관된 전환, 절제된 반투명 소재, 시스템 글꼴과 크기별 자간, `prefers-reduced-motion`, `prefers-reduced-transparency`, `prefers-contrast` 대응을 포함합니다.
