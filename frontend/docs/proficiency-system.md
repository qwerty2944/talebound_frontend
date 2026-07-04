# 숙련도 시스템 (Proficiency)

경험치와 별개로 동작하는 사용 기반 숙련 시스템. 무기/마법을 사용할수록 해당 숙련도가 상승.

## 무기 숙련 (8종)

| ID | 이름 | 영문 | 관련 스탯 |
|----|------|------|----------|
| sword | 검 | Sword | STR/DEX |
| axe | 도끼 | Axe | STR |
| mace | 둔기 | Mace | STR |
| dagger | 단검 | Dagger | DEX |
| spear | 창 | Spear | STR/DEX |
| bow | 활 | Bow | DEX |
| crossbow | 석궁 | Crossbow | DEX |
| staff | 지팡이 | Staff | INT/WIS |

## 마법 숙련 (6속성)

| ID | 이름 | 영문 | 상성 (강함→약함) |
|----|------|------|-----------------|
| fire | 화염 | Fire | ice에 강함, earth에 약함 |
| ice | 냉기 | Ice | lightning에 강함, fire에 약함 |
| lightning | 번개 | Lightning | earth에 강함, ice에 약함 |
| earth | 대지 | Earth | fire에 강함, lightning에 약함 |
| holy | 신성 | Holy | dark에 강함 |
| dark | 암흑 | Dark | holy에 강함 |

## 숙련도 등급 (0-100)

| 레벨 | 등급 | 데미지 보너스 | 속도 보너스 |
|------|------|--------------|------------|
| 0-19 | 초보 (Novice) | 0% | 0% |
| 20-39 | 견습 (Apprentice) | +5% | 0% |
| 40-59 | 숙련 (Journeyman) | +10% | +5% |
| 60-79 | 전문가 (Expert) | +15% | +10% |
| 80-99 | 달인 (Master) | +20% | +15% |
| 100 | 대가 (Grandmaster) | +25% | +20% |

## 요일별 속성 강화

한국어 요일 한자를 기반으로 매일 특정 마법 속성이 +20% 강화.

| 요일 | 한자 | 속성 | 배율 |
|------|------|------|------|
| 월 | 月 (달) | ice ❄️ | +20% |
| 화 | 火 (불) | fire 🔥 | +20% |
| 수 | 水 (물) | lightning ⚡ | +20% |
| 목 | 木 (나무) | earth 🪨 | +20% |
| 금 | 金 (금) | holy ✨ | +20% |
| 토 | 土 (흙) | dark 🌑 | +20% |
| 일 | 日 (해) | - | 휴식 |

## 사용법

```typescript
// 숙련도 조회
import { useProficiencies, getRankInfo, getDamageBonus } from "@/entities/proficiency";

const { data: proficiencies } = useProficiencies(userId);
const swordLevel = proficiencies?.sword ?? 0;
const rank = getRankInfo(swordLevel); // { id: "novice", nameKo: "초보", ... }
const bonus = getDamageBonus(swordLevel); // 0

// 숙련도 증가 (전투 시)
import { useGainProficiency } from "@/features/proficiency";

const gainProficiency = useGainProficiency(userId);
gainProficiency.mutate({ type: "sword", amount: 1 });

// 마법 상성 계산
import { getMagicEffectiveness } from "@/entities/proficiency";

const multiplier = getMagicEffectiveness("fire", "ice"); // 1.5 (강함)
```

## DB 테이블

- `proficiencies`: user_id별 14개 숙련도 값 (0-100)
- RPC `increase_proficiency(p_user_id, p_type, p_amount)`: 감소율 적용된 숙련도 증가

## 관련 파일

- `src/entities/proficiency/` - 숙련도 엔티티
- `src/features/proficiency/gain-proficiency/` - 숙련도 증가 액션
