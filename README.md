# MUD Web (프론트엔드)

Fantasy MUD 게임 Next.js 16 웹 클라이언트.

## 관련 레포

| 레포 | 설명 |
|------|------|
| [mud_web](https://github.com/qwerty2944/mud_web) | Next.js 16 웹 클라이언트 (이 레포) |
| [mud_backend](https://github.com/qwerty2944/mud_backend) | Express + Colyseus 게임 백엔드 |
| [mud_app](https://github.com/qwerty2944/mud_app) | Flutter 앱 (Riverpod + Clean Architecture) |

## 아키텍처

- **백엔드**: mud_backend (Express REST `/api/*` + Colyseus MapRoom, 포트 2567)
- **인증**: 자체 JWT (bcrypt)
- **실시간**: Colyseus MapRoom (맵별 프레즌스/채팅/귓속말/결투 릴레이)
- **배포**: Vercel (Root Directory: `frontend`)

## 실행

```bash
npm run dev   # 프론트 (localhost:3000) — 백엔드는 mud_backend 레포에서 별도 실행
```

## 프론트 환경 변수 (선택)

기본값은 localhost. 배포 시 `frontend/.env.local`:

```
NEXT_PUBLIC_API_URL=https://api.example.com
NEXT_PUBLIC_WS_URL=wss://api.example.com
```
