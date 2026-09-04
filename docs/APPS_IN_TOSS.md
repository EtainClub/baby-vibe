# Apps in Toss (앱인토스)

Baby Vibe ships twice from one codebase:

| | 웹 (Firebase Hosting) | 앱인토스 미니앱 |
| --- | --- | --- |
| 빌드 | `pnpm build` | `pnpm build:ait` |
| 출력 | Next.js 서버 + 라우트 핸들러 | `out/` 정적 번들 → `baby-vibe.ait` |
| 인증 | Google 로그인 + `__session` 쿠키 | 익명 계정 + 복구 키, `Authorization: Bearer <ID token>` |
| API | 같은 오리진 (`/api/...`) | `NEXT_PUBLIC_API_BASE_URL`의 배포된 API |

빌드 시점 상수 `IS_TOSS_APP` (`src/lib/platform.ts`) 하나로 두 갈래가 갈립니다.
런타임 감지는 하지 않습니다 — 토스 번들은 토스 안에서만 실행되니까요.

## 빌드

```bash
pnpm build:toss   # 정적 export만
pnpm build:ait    # 정적 export + ait 패키징 (baby-vibe.ait)
pnpm dev:toss     # 토스 모드로 로컬 개발
```

`appName`은 앱인토스 콘솔에 등록된 이름과 정확히 같아야 합니다
(`apps-in-toss.config.ts`의 `baby-vibe`).

### 번들이 바라보는 오리진

미니앱에는 자기 서버가 없어서 API 호출·공유 링크·프로필 URL이 전부
절대 주소입니다. `.env.local`의 `NEXT_PUBLIC_APP_URL`은 `next dev`용
`http://localhost:3000`이라 토스 웹뷰에서는 절대 열리지 않습니다.

`scripts/build-toss.mjs`가 `NEXT_PUBLIC_API_BASE_URL`(없으면
`https://baby.etain.club`)을 `NEXT_PUBLIC_APP_URL`과 함께 빌드 프로세스
환경변수로 넘겨 dotenv 파일을 덮어씁니다 — Next.js는 이미 설정된 변수를
다시 쓰지 않기 때문입니다. localhost가 들어오면 빌드가 즉시 실패합니다.

```bash
NEXT_PUBLIC_API_BASE_URL=https://staging.example.com pnpm build:toss
```

### 정적 export가 감당하지 못하는 것

`scripts/build-toss.mjs`가 빌드 동안 서버 전용 경로를 잠시 옆으로 치웠다가
빌드가 끝나면 (실패했더라도) 되돌려 놓습니다.

- `src/app/api` — 라우트 핸들러
- `src/app/go` — 클릭 집계 리다이렉트
- `src/app/[username]` — `generateStaticParams`가 없는 동적 세그먼트
- `src/proxy.ts` — 정적 export에서 지원되지 않음

토스 번들은 이 엔드포인트들을 네트워크로 호출합니다. 공개 프로필은
`/[username]` 대신 클라이언트 렌더링 라우트 `/u?u=<username>`을 씁니다
(`src/lib/routes.ts`의 `profileHref()`가 자동으로 갈라 줍니다).

## 인증

토스 웹뷰는 OAuth 팝업/리다이렉트를 막기 때문에 Google 로그인을 쓸 수 없습니다.
대신:

1. 앱을 열면 익명 계정으로 로그인합니다 (`ensureAnonymousUser()`).
2. 기기를 옮기려면 **복구 키**를 발급받습니다 — 31자 알파벳 16자리(≈79비트).
   평문은 발급 직후 한 번만 보여 주고 저장하지 않습니다. 서버에는 SHA-256만
   `recoveryKeys/{hash}` 에 남고, 이 컬렉션은 클라이언트가 읽지도 쓰지도
   못합니다 (`firestore.rules`).
3. 다른 기기에서 키를 입력하면 커스텀 토큰을 발급해 그 계정으로 전환합니다.
   새로 발급하면 이전 키는 즉시 무효화됩니다.

복구 키가 있는 계정은 Google 연동 계정과 같은 앱 등록 한도(50개)를 받습니다.

**Firebase 콘솔에서 익명 로그인(Anonymous)을 켜 두어야 합니다.**

### 크로스 오리진

토스가 번들을 자기 도메인에서 서빙하므로 웹뷰의 오리진은 다음 둘 중 하나입니다
(`src/lib/platform.ts`의 `TOSS_APP_ORIGINS`. `baby-vibe`는
`apps-in-toss.config.ts`의 `appName` — 이름을 바꾸면 여기도 같이 바꿔야 합니다):

| 오리진 | 언제 |
| --- | --- |
| `https://baby-vibe.apps.tossmini.com` | 심사 통과 후 실서비스 |
| `https://baby-vibe.private-apps.tossmini.com` | 콘솔의 프라이빗/테스트 빌드 |

따라서 `baby.etain.club` API 호출은 전부 크로스 오리진입니다. 번들은 쿠키를
보낼 수 없으므로 매 요청에 Firebase ID 토큰을 싣고
(`src/lib/api/client.ts`의 `apiFetch()`), 서버는 `getSessionUser()`에서 Bearer
토큰을 먼저 확인합니다. `src/proxy.ts`는 Bearer 요청, 공개 읽기 GET, 그리고 위
두 오리진에서 온 요청에 CORS 헤더를 붙입니다 — 익명 로그인이 실패한 상태의
재시도까지 브라우저 단에서 막히지 않도록. `assertSameOrigin()`도 두 오리진을
허용 목록에 넣습니다.

`Access-Control-Allow-Credentials`는 붙이지 않으므로 쿠키 세션은 여전히 같은
오리진에서만 성립하고, CSRF 표면은 넓어지지 않습니다.

### 콘솔에서 직접 넣어야 하는 곳

코드 밖에서 오리진을 알고 있어야 하는 서비스들입니다. 앱 이름이 바뀌면 전부
같이 갱신해야 합니다.

1. **Firebase Authentication → Settings → Authorized domains**
   `baby-vibe.apps.tossmini.com`, `baby-vibe.private-apps.tossmini.com` 추가.
2. **Google Cloud Console → APIs & Services → Credentials → 웹 API 키**
   HTTP 리퍼러 제한을 걸어 뒀다면 `https://baby-vibe.apps.tossmini.com/*`,
   `https://baby-vibe.private-apps.tossmini.com/*` 추가. 제한이 없으면 그대로 둬도
   됩니다.
3. **App Check (`NEXT_PUBLIC_FIREBASE_APP_CHECK_SITE_KEY`)** — 지금은 비어 있어
   비활성입니다. 켤 때 reCAPTCHA Enterprise 키의 허용 도메인에 두 호스트를
   넣어야 합니다.

Cloud Storage 업로드는 SDK가 `firebasestorage.googleapis.com`으로 보내고 이
엔드포인트는 기본적으로 CORS가 열려 있어서 버킷 CORS 설정은 필요 없습니다.

공유 링크(`publicProfileUrl()`)는 `tossmini.com`이 아니라 계속
`baby.etain.club`을 가리켜야 합니다 — 토스 밖의 사람이 열 수 있어야 하니까요.

## eval 스캔

토스 심사는 번들을 정적으로 훑어 `eval` 계열 코드를 찾습니다.

- Firestore SDK는 클라이언트에서 아예 쓰지 않습니다 (모든 읽기/쓰기가 Admin SDK
  경유). `src/lib/firebase/client.ts`에는 Auth와 Storage만 있습니다.
- 그래도 혹시 모를 전이 import를 막으려고 토스 빌드에서는
  `firebase/firestore` → `firebase/firestore/lite` 별칭을 겁니다.
- webpack 런타임과 core-js가 남기는 `Function("return this")()` 전역 탐색
  코드는 빌드 후 `globalThis`로 치환합니다 (`scrubGlobalThisProbe()`).

빌드 결과 확인:

```bash
pnpm build:ait
grep -rlE 'eval\(|new Function\(|WebChannel' out/   # 아무것도 안 나와야 함
```

## 네이티브 브리지

`src/lib/toss/bridge.ts`가 SDK를 동적 `import()`로 감싸서, 웹 번들에는 SDK가
들어가지 않고 브리지가 없을 때는 항상 웹 API로 폴백합니다.

| 하는 일 | 토스 | 웹 |
| --- | --- | --- |
| 복사 | `Clipboard.setText` | `navigator.clipboard` |
| 공유 | `Share.sendMessage` | `navigator.share` → 링크 복사 |
| 외부 링크 | `openURL` | `target="_blank"` |
| 네트워크 상태 | `Environment.getNetworkStatus` | `navigator.onLine` |

토스 웹뷰에서는 `target="_blank"`와 페이지가 스스로 시작하는 다운로드가 동작하지
않습니다. 그래서 앱 열기 버튼은 `openURL`로 클릭 추적 리다이렉트를 시스템
브라우저에 넘기고, QR 저장 버튼은 링크 복사로 바뀝니다.

`apps-in-toss.config.ts`의 `permissions`에 `clipboard/write`가 선언되어 있어야
복사가 동작합니다.

### 진입 화면과 라우팅

미니앱도 첫 화면은 웹과 같은 랜딩 페이지입니다. 곧바로 앱 등록 폼을 띄우면
빠져나갈 곳이 없었기 때문입니다.

| 경로 | 조건 | 결과 |
| --- | --- | --- |
| `/` | 프로필 있음 | `/home` (헤더 로고도 여기로) |
| `/` | 프로필 없음 | 랜딩 페이지 (`TossEntry`) |
| `/home` | 프로필 없음 | `/start` |
| `/start` | 온보딩 완료 | `/home` |

"등록했다"의 기준은 **온보딩 완료가 아니라 프로필 존재**입니다. 앱을 건너뛴
사람도 대시보드에 있어야 하고, 대시보드는 빈 목록에서 첫 앱을 추가할 수
있습니다. 온보딩의 "나중에 하기"는 그래서 `/`(또는 프로필 저장 후 `/home`)로
빠져나갑니다.

토스에는 Google 로그인이 없으므로 랜딩의 CTA는 `/start`로 바로 가고,
`/login`은 복구 키로 기존 페이지를 불러오는 화면만 담당합니다
(`landing-page.tsx`의 `startHref` / `signInLabel`).

### 마케팅 페이지 대체

`scripts/build-toss.mjs`는 빌드 동안 `toss-overrides/app/**`의 파일로
`src/app/page.tsx`와 `src/app/login/page.tsx`를 갈아끼웁니다. `IS_TOSS_APP`
분기 + 동적 `import()`만으로는 부족한데, Next.js가 await된 동적 import의 CSS와
JS를 그 라우트에 귀속시키기 때문입니다 — Google 로그인 버튼이 계속 미니앱에
실렸습니다.

랜딩 전용 CSS는 `src/app/marketing.css`로 분리되어 `landing-page.tsx`만
import합니다. 미니앱도 랜딩을 쓰게 되면서 이 스타일시트는 이제 토스 번들에도
들어갑니다. 공용 프리미티브(`.button`, `.brand-logo`, `.app-cover` 등)는
`globals.css`에 그대로 있습니다.

## 배포 전 체크

새 쿼리에 복합 인덱스가 필요합니다. 배포하지 않으면 `/people`의 "방금 올라온 앱"
섹션이 조용히 비어 있습니다 (500이 나지는 않습니다).

```bash
firebase deploy --only firestore:indexes
```

Firebase 콘솔에서 **익명 로그인(Anonymous)** 도 켜 두어야 토스 빌드가 동작합니다.
