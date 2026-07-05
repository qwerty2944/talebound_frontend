# MUD Web - 게임 기획서

> Fantasy MUD 스타일 웹 게임. Unity WebGL 캐릭터 + Supabase 백엔드

---

## 1. 게임 개요

### 1.1 컨셉
- **장르**: 텍스트 기반 MUD (Multi-User Dungeon) + 2D 캐릭터 비주얼
- **플랫폼**: 웹 브라우저 (모바일 반응형)
- **핵심 루프**: 캐릭터 육성 → 사냥 → 장비/스킬 강화 → 더 강한 적 도전

### 1.2 차별점
- Unity WebGL로 구현된 2D 스프라이트 캐릭터 커스터마이징
- 클래식 MUD의 텍스트 기반 전투 + 현대적 UI
- 숙련도 시스템 (사용할수록 강해지는 무기/마법)
- 요일별 마법 속성 강화 시스템

---

## 2. 기술 스택

| 영역 | 기술 |
|------|------|
| 프론트엔드 | Next.js 16 (App Router), React, TypeScript |
| 상태관리 | Zustand (클라이언트), React Query (서버) |
| 백엔드 | Supabase (Auth, Database, Realtime, Storage) |
| 캐릭터 렌더링 | Unity WebGL (SPUM 에셋) |
| 스타일링 | Tailwind CSS + 테마 시스템 |
| 아키텍처 | FSD (Feature-Sliced Design) |

---

## 3. 데이터베이스 구조

### 3.1 테이블 목록

| 테이블 | 설명 | 행 수 |
|--------|------|-------|
| `profiles` | 유저 프로필 (레벨, 재화, 캐릭터) | 6 |
| `proficiencies` | 유저별 숙련도 (14종) | 0 |
| `inventory` | 유저 인벤토리 | 0 |
| `maps` | 맵 정보 | 8 |
| `chat_messages` | 채팅 메시지 | 49 |
| `user_locations` | 유저 현재 위치 | 6 |
| `shop_products` | 상점 상품 | 6 |
| `purchases` | 결제 내역 | 0 |

### 3.2 profiles 테이블 상세
```sql
id              UUID (PK, FK → auth.users)
email           TEXT (unique)
level           INT (default: 1)
experience      INT (default: 0)
gold            INT (default: 0)
gems            INT (default: 0)
stamina         INT (default: 100)  -- 피로도
max_stamina     INT (default: 100)
stamina_updated_at  TIMESTAMPTZ
is_premium      BOOL (default: false)
premium_until   TIMESTAMPTZ
characters      JSONB  -- [{id, name, isMain, appearance, colors, stats}]
buffs           JSONB  -- [{type, value, expiresAt}]
created_at, updated_at, last_login_at
```

### 3.3 proficiencies 테이블 상세
```sql
id          UUID (PK)
user_id     UUID (FK → profiles, unique)
-- 무기 숙련도 (0-100)
sword, axe, mace, dagger, spear, bow, crossbow, staff
-- 마법 숙련도 (0-100)
fire, ice, lightning, earth, holy, dark
created_at, updated_at
```

---

## 4. 스토리지 구조

### 4.1 Supabase Storage
- **버킷**: `game-data` (public)
- **용도**: 게임 데이터 JSON 파일 저장

### 4.2 로컬 데이터 (public/data/)
| 파일 | 설명 |
|------|------|
| `monsters.json` | 몬스터 데이터 (3종) |
| `maps.json` | 맵 데이터 (fallback) |
| `body-mapping.json` | 캐릭터 몸 스프라이트 매핑 |
| `eye-mapping.json` | 눈 스프라이트 매핑 |
| `hair-mapping.json` | 머리카락 스프라이트 매핑 |
| `facehair-mapping.json` | 수염 스프라이트 매핑 |
| `all-sprites.json` | 전체 스프라이트 목록 |

---

## 5. 맵 시스템

### 5.1 맵 목록

| ID | 이름 | 레벨 | 안전 | PvP | 연결 |
|----|------|------|------|-----|------|
| `starting_village` | 시작 마을 | 1 | O | X | 수련장, 숲 입구, 시장 광장 |
| `training_ground` | 수련장 | 1 | O | X | 시작 마을, 숲 입구 |
| `market_square` | 시장 광장 | 1 | O | X | 시작 마을, 투기장 |
| `forest_entrance` | 숲 입구 | 1 | X | X | 시작 마을, 수련장, 깊은 숲 |
| `deep_forest` | 깊은 숲 | 5 | X | X | 숲 입구, 고대 유적 |
| `ancient_ruins` | 고대 유적 | 10 | X | X | 깊은 숲 |
| `arena` | 투기장 | 10 | X | O | 시장 광장 |

**기본 시작 맵**: `starting_village` (시작 마을)

### 5.2 맵 타입
- **안전지대**: 몬스터 없음, 전투 불가
- **사냥터**: 몬스터 출현, PvE 가능
- **PvP존**: 플레이어 간 전투 가능

---

## 6. 몬스터 시스템

### 6.1 현재 몬스터

| ID | 이름 | 맵 | Lv | HP | 공격 | 속성 | 행동 | 보상 |
|----|------|-----|-----|-----|------|------|------|------|
| `scarecrow` | 허수아비 | 수련장 | 1 | 50 | 0 | - | passive | 5 exp |
| `squirrel` | 다람쥐 | 숲 입구 | 2 | 30 | 5 | earth | aggressive | 10 exp, 5 gold |
| `squirrel_elder` | 늙은 다람쥐 | 숲 입구 | 3 | 45 | 8 | earth | defensive | 18 exp, 10 gold |

### 6.2 행동 패턴
- **passive**: 반격하지 않음 (훈련용)
- **aggressive**: 먼저 공격
- **defensive**: 방어 위주, HP 낮으면 도주

### 6.3 드롭 아이템
| 몬스터 | 아이템 | 확률 | 수량 |
|--------|--------|------|------|
| 다람쥐 | 도토리 | 30% | 1-2 |
| 늙은 다람쥐 | 도토리 | 50% | 2-4 |
| 늙은 다람쥐 | 다람쥐 털 | 10% | 1 |

---

## 7. 전투 시스템

### 7.1 PvE 전투 흐름
```
1. 맵에서 몬스터 선택
2. 전투 시작 (BattlePanel 표시)
3. 턴제 진행:
   - 플레이어: 무기 선택 → 공격
   - 몬스터: 반격 (passive 제외)
4. 승리/패배/도주
5. 보상 지급 (승리 시)
```

### 7.2 데미지 계산

**물리 데미지**
```
damage = (baseDamage + STR * 0.5) * proficiencyBonus - targetDefense
```

**마법 데미지**
```
damage = (baseDamage + INT * 0.8)
       * proficiencyBonus
       * elementEffectiveness  // 상성
       * dayBoost              // 요일 보너스
       - (targetDefense * 0.3)
```

**치명타**
- 확률: DEX * 0.5% (최대 25%)
- 배율: 1.5x

### 7.3 도주
- 성공률: 50%
- 실패 시 몬스터 추가 공격

---

## 8. 숙련도 시스템

### 8.1 무기 숙련도 (8종)
| 무기 | 관련 스탯 |
|------|----------|
| 검 (Sword) | STR/DEX |
| 도끼 (Axe) | STR |
| 둔기 (Mace) | STR |
| 단검 (Dagger) | DEX |
| 창 (Spear) | STR/DEX |
| 활 (Bow) | DEX |
| 석궁 (Crossbow) | DEX |
| 지팡이 (Staff) | INT/WIS |

### 8.2 마법 숙련도 (6종)
| 속성 | 강함 | 약함 |
|------|------|------|
| 화염 (Fire) | Ice | Earth |
| 냉기 (Ice) | Lightning | Fire |
| 번개 (Lightning) | Earth | Ice |
| 대지 (Earth) | Fire | Lightning |
| 신성 (Holy) | Dark | - |
| 암흑 (Dark) | Holy | - |

### 8.3 등급 시스템
| 레벨 | 등급 | 데미지 | 속도 |
|------|------|--------|------|
| 0-19 | 초보 (Novice) | +0% | +0% |
| 20-39 | 견습 (Apprentice) | +5% | +0% |
| 40-59 | 숙련 (Journeyman) | +10% | +5% |
| 60-79 | 전문가 (Expert) | +15% | +10% |
| 80-99 | 달인 (Master) | +20% | +15% |
| 100 | 대가 (Grandmaster) | +25% | +20% |

### 8.4 요일별 속성 강화
| 요일 | 한자 | 속성 | 보너스 |
|------|------|------|--------|
| 월 | 月 (달) | Ice | +20% |
| 화 | 火 (불) | Fire | +20% |
| 수 | 水 (물) | Lightning | +20% |
| 목 | 木 (나무) | Earth | +20% |
| 금 | 金 (금) | Holy | +20% |
| 토 | 土 (흙) | Dark | +20% |
| 일 | 日 (해) | - | 휴식 |

---

## 9. PvP 시스템

### 9.1 결투 흐름
```
1. PlayerList에서 상대 클릭 → "결투 신청"
2. 상대방에게 모달 표시 (30초 제한)
3. 수락 시:
   - DEX 비교로 선공 결정
   - 턴제 전투 진행
4. HP 0 → 결투 종료
5. 양측 모두 숙련도 증가
```

### 9.2 PvP 방어력
- 물리 방어: `CON * 0.5`
- 마법 방어: `WIS * 0.3`

### 9.3 패배 페널티
- **없음** (친선 경기)

---

## 10. 캐릭터 시스템

### 10.1 스탯 (6종)
| 스탯 | 약자 | 효과 |
|------|------|------|
| 힘 | STR | 물리 데미지 |
| 민첩 | DEX | 치명타, 선공, 회피 |
| 체력 | CON | HP, 물리 방어 |
| 지능 | INT | 마법 데미지 |
| 지혜 | WIS | 마법 방어, MP |
| 매력 | CHA | 상점 할인, NPC 호감 |

### 10.2 종족
- Human, Elf, Orc, Undead 등 (SPUM 에셋 기반)

### 10.3 외형 커스터마이징
- **파츠**: Body, Eye, Hair, FaceHair, Cloth, Armor, Pant, Helmet, Back
- **색상**: Body, Eye, Hair, FaceHair, Cloth, Armor, Pant
- **프리셋**: 전사, 마법사, 궁수, 도적 (초기 장비 자동 설정)

---

## 11. 경제 시스템

### 11.1 재화
| 재화 | 용도 | 획득 방법 |
|------|------|----------|
| Gold | 장비, 소비템 구매 | 몬스터 사냥, 퀘스트 |
| Gems | 프리미엄 아이템 | 현금 결제, 이벤트 |

### 11.2 상점 상품
| 상품 | 가격 (KRW) | 내용 |
|------|-----------|------|
| 보석 100개 | ₩1,100 | 100 Gems |
| 보석 500개 (+50) | ₩5,500 | 550 Gems |
| 보석 1200개 (+200) | ₩11,000 | 1,400 Gems |
| 보석 3000개 (+600) | ₩27,500 | 3,600 Gems |
| 프리미엄 30일 | ₩9,900 | 프리미엄 구독 |
| 프리미엄 1년 | ₩59,000 | 프리미엄 구독 |

### 11.3 프리미엄 혜택 (예정)
- 피로도 회복 속도 2배
- 경험치 보너스 +20%
- 전용 스킨/이모티콘
- 광고 제거

---

## 12. 피로도 시스템

### 12.1 개요
- 기본 피로도: 100
- 전투 시 소모 (예정)
- 자동 회복: 시간당 10 (예정)

### 12.2 피로도 0 시
- 경험치 획득 50% 감소 (예정)
- 드롭률 50% 감소 (예정)

---

## 13. 채팅 시스템

### 13.1 메시지 타입
- **normal**: 일반 채팅 (맵 내 전체)
- **whisper**: 귓속말 (1:1)
- **system**: 시스템 메시지

### 13.2 명령어
- `/w [닉네임] [메시지]`: 귓속말
- `/r [메시지]`: 마지막 귓속말 상대에게 답장

### 13.3 실시간 동기화
- Supabase Realtime 사용
- 맵별 채널 분리

---

## 14. 테마 시스템

### 14.1 제공 테마 (5종)
| ID | 이름 | 주요 색상 |
|----|------|----------|
| amber | 골드 | 따뜻한 황금색 |
| green | 터미널 | 클래식 녹색 |
| cyan | 사이버 | 밝은 청색 |
| purple | 마법 | 보라색 |
| red | 지옥 | 붉은색 |

### 14.2 적용 방식
- localStorage에 저장
- CSS 변수로 전역 적용
- 런타임 변경 가능

---

## 15. 개발 로드맵

### Phase 1: 핵심 시스템 (완료)
- [x] 인증 (로그인/회원가입)
- [x] 캐릭터 생성/커스터마이징
- [x] 맵 이동
- [x] 실시간 채팅
- [x] PvE 전투 (기본)
- [x] PvP 결투
- [x] 숙련도 시스템

### Phase 2: 콘텐츠 확장 (진행 중)
- [x] 전투 UI (BattlePanel)
- [x] 몬스터 목록 UI
- [ ] 인벤토리 UI
- [ ] 장비 시스템
- [ ] 퀘스트 시스템
- [ ] 더 많은 몬스터/맵

### Phase 3: 경제/소셜
- [ ] 상점 UI
- [ ] 결제 연동
- [ ] 길드 시스템
- [ ] 파티 시스템
- [ ] 거래소

### Phase 4: 고급 기능
- [ ] 스킬 시스템
- [ ] 던전/보스
- [ ] 랭킹
- [ ] 업적
- [ ] 이벤트 시스템

---

## 16. 폴더 구조 요약

```
mud_web/
├── app/                    # Next.js App Router
│   ├── game/               # 게임 메인
│   ├── login/              # 로그인
│   └── character-create/   # 캐릭터 생성
├── src/
│   ├── application/        # 앱 레이어
│   │   ├── providers/      # React Providers
│   │   └── stores/         # Zustand Stores (9개)
│   ├── features/           # 기능 모듈
│   │   ├── auth/           # 인증
│   │   ├── character/      # 캐릭터
│   │   ├── game/           # 게임플레이
│   │   ├── combat/         # PvE 전투
│   │   ├── pvp/            # PvP 결투
│   │   ├── inventory/      # 인벤토리
│   │   └── proficiency/    # 숙련도
│   ├── entities/           # 비즈니스 엔티티
│   │   ├── user/           # 유저
│   │   ├── character/      # 캐릭터
│   │   ├── monster/        # 몬스터
│   │   ├── map/            # 맵
│   │   ├── inventory/      # 인벤토리
│   │   ├── proficiency/    # 숙련도
│   │   └── chat/           # 채팅
│   ├── widgets/            # 복합 UI
│   └── shared/             # 공용 코드
│       ├── api/            # Supabase 클라이언트
│       ├── ui/             # 공용 컴포넌트
│       ├── types/          # 공용 타입
│       └── config/         # 설정
└── public/
    └── data/               # 게임 데이터 JSON
```

---

## 17. API 엔드포인트 (Supabase)

### 17.1 인증
- `auth.signUp()`, `auth.signIn()`, `auth.signOut()`

### 17.2 데이터베이스
- `profiles`: 프로필 CRUD
- `proficiencies`: 숙련도 CRUD
- `inventory`: 인벤토리 CRUD
- `maps`: 맵 목록 조회
- `chat_messages`: 채팅 CRUD
- `user_locations`: 위치 CRUD

### 17.3 Realtime
- 채팅: `chat:map_id` 채널
- 결투: `duel:map_id` 채널
- 온라인 유저: `presence:map_id` 채널

### 17.4 Storage
- `game-data`: 게임 데이터 파일

---

*최종 업데이트: 2026-01-05*
