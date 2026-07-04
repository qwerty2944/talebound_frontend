# 통신용 크리스탈 시스템 (Whisper Crystal)

귓속말(/w) 기능을 사용하기 위한 크리스탈 충전 시스템.

## 크리스탈 등급

| ID | 이름 | 충전량 | 기능 |
|---|------|--------|------|
| `crystal_basic` | 기본 크리스탈 | 10회 | 귓속말 /w |
| `crystal_advanced` | 고급 크리스탈 | 30회 | 귓속말 /w, 빠른 답장 /r |
| `crystal_superior` | 최고급 크리스탈 | 100회 | 귓속말 /w, 빠른 답장 /r |

## 채팅 명령어

| 명령어 | 설명 | 필요 등급 |
|--------|------|----------|
| `/w 닉네임 메시지` | 해당 유저에게 귓속말 | basic 이상 |
| `/r 메시지` | 마지막 귓말 상대에게 답장 | advanced 이상 |

## DB 컬럼 (profiles)

| 컬럼 | 타입 | 설명 |
|------|------|------|
| `whisper_charges` | INTEGER | 남은 충전 횟수 |
| `crystal_tier` | TEXT | 현재 크리스탈 등급 (basic/advanced/superior/null) |

## DB 함수

| 함수 | 설명 |
|------|------|
| `use_crystal(user_id, tier, charges)` | 크리스탈 활성화 → 새 충전량 반환 |
| `consume_whisper_charge(user_id)` | 귓말 1회 소모 → `{success, remaining, tier}` |

## 아이템 데이터

`/public/data/items.json`에 정의:
- `crystal_basic`: 기본 통신용 크리스탈 (10회)
- `crystal_advanced`: 고급 통신용 크리스탈 (30회)
- `crystal_superior`: 최고급 통신용 크리스탈 (100회)

## 구현 상태

⚠️ **현재 비활성화됨** - Realtime 연결 문제로 크리스탈 체크 로직 임시 제거

### TODO
- [ ] Realtime 연결 안정화 후 크리스탈 체크 로직 재활성화
- [ ] 크리스탈 없을 때 UI 경고 표시

## 관련 파일

- `src/entities/user/api/index.ts` - useCrystal(), consumeWhisperCharge()
- `src/entities/user/types/index.ts` - CrystalTier 타입
- `src/features/inventory/use-crystal/` - useUseCrystal 훅
- `src/features/game/lib/useRealtimeChat.ts` - 귓말 시 충전 체크/소모 (현재 비활성화)
