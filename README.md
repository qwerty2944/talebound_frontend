# MUD Web (모노레포)

Fantasy MUD 게임. Next.js 프론트엔드 + Colyseus 게임 서버.

```
frontend/   # Next.js 16 클라이언트 (@mud/frontend)
backend/    # Express + Colyseus 게임 백엔드 (@mud/backend)
app/        # Flutter 앱 (Riverpod + Clean Architecture)
```

## 아키텍처

- **DB**: Supabase PostgreSQL (서버가 직접 연결, Supabase Auth/Realtime/Storage는 사용하지 않음)
- **인증**: 자체 JWT (bcrypt). 기존 Supabase 계정은 백필 후 최초 로그인 시 비밀번호 재설정
- **실시간**: Colyseus MapRoom (맵별 프레즌스/채팅/귓속말/결투 릴레이)
- **CRUD**: Express REST (`/api/*`). 기존 Postgres 함수는 `/api/rpc/:fn` 프록시로 호출

## 최초 설정

1. `backend/.env` 작성 (`.env.example` 참고):
   - `DATABASE_URL`: Supabase 대시보드 → Settings → Database → Connection string (Session pooler)
   - `JWT_SECRET`: `openssl rand -hex 32`
2. 의존성 설치: 루트에서 `npm install`
3. 기존 유저 백필 (1회): `npm run backfill-users -w backend`
   - auth.users의 이메일을 app_users로 복사. 해당 유저는 로그인 시 비밀번호 재설정 필요.

## 실행

```bash
npm run dev          # 프론트(3000) + 서버(2567) 동시 실행
npm run dev:web      # 프론트만
npm run dev:backend  # 백엔드만
```

- Colyseus 모니터: http://localhost:2567/colyseus
- 헬스체크: http://localhost:2567/health

## 프론트 환경 변수 (선택)

기본값은 localhost. 배포 시 `frontend/.env.local`:

```
NEXT_PUBLIC_API_URL=https://api.example.com
NEXT_PUBLIC_WS_URL=wss://api.example.com
```
