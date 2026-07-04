// ============ Runeword Logic ============
// 룬워드 조합 판정 로직

import type {
  EquipmentSockets,
  RunewordDefinition,
  RuneData,
} from "@/entities/item/types/socket";
import type { EquipmentSlot, Item } from "@/entities/item";

/**
 * 현재 소켓에 장착된 룬 ID 목록 추출
 */
export function getInsertedRuneIds(
  sockets: EquipmentSockets,
  allItems: Item[]
): string[] {
  return sockets.sockets
    .filter((s) => s.insertedItemId)
    .map((s) => {
      const item = allItems.find((i) => i.id === s.insertedItemId);
      // 룬 데이터에서 runeId 추출 (아이템에 runeData가 있다고 가정)
      const runeData = (item as any)?.runeData as RuneData | undefined;
      return runeData?.runeId ?? null;
    })
    .filter((id): id is string => id !== null);
}

/**
 * 룬워드 완성 여부 확인
 */
export function checkRunewordCompletion(
  sockets: EquipmentSockets,
  slot: EquipmentSlot,
  insertedRuneIds: string[],
  runewordDefinitions: RunewordDefinition[]
): RunewordDefinition | null {
  if (insertedRuneIds.length === 0) return null;

  for (const runeword of runewordDefinitions) {
    // 슬롯 호환성 체크
    if (!runeword.requiredSlots.includes(slot)) continue;

    // 소켓 수 체크
    if (runeword.requiredSockets !== sockets.maxSockets) continue;

    // 룬 순서 체크 (정확히 일치해야 함)
    if (runeword.requiredRunes.length !== insertedRuneIds.length) continue;

    const matches = runeword.requiredRunes.every(
      (runeId, index) => insertedRuneIds[index] === runeId
    );

    if (matches) {
      return runeword;
    }
  }

  return null;
}

/**
 * 특정 룬워드를 만들 수 있는지 확인
 */
export function canCreateRuneword(
  runeword: RunewordDefinition,
  sockets: EquipmentSockets,
  slot: EquipmentSlot,
  availableRunes: string[]
): { canCreate: boolean; missingRunes: string[] } {
  // 슬롯 호환성
  if (!runeword.requiredSlots.includes(slot)) {
    return { canCreate: false, missingRunes: runeword.requiredRunes };
  }

  // 소켓 수 확인
  if (sockets.maxSockets < runeword.requiredSockets) {
    return { canCreate: false, missingRunes: runeword.requiredRunes };
  }

  // 필요한 룬 확인
  const runeCount = new Map<string, number>();
  for (const rune of availableRunes) {
    runeCount.set(rune, (runeCount.get(rune) ?? 0) + 1);
  }

  const missingRunes: string[] = [];
  const requiredCount = new Map<string, number>();
  for (const rune of runeword.requiredRunes) {
    requiredCount.set(rune, (requiredCount.get(rune) ?? 0) + 1);
  }

  for (const [rune, needed] of requiredCount) {
    const have = runeCount.get(rune) ?? 0;
    if (have < needed) {
      for (let i = 0; i < needed - have; i++) {
        missingRunes.push(rune);
      }
    }
  }

  return {
    canCreate: missingRunes.length === 0,
    missingRunes,
  };
}

/**
 * 룬워드 효과 문자열 생성
 */
export function formatRunewordEffects(runeword: RunewordDefinition): string[] {
  const effects: string[] = [];

  // 스탯 효과
  const stats = runeword.stats;
  if (stats.physicalAttack) effects.push(`물리공격력 +${stats.physicalAttack}`);
  if (stats.magicAttack) effects.push(`마법공격력 +${stats.magicAttack}`);
  if (stats.physicalDefense) effects.push(`물리방어력 +${stats.physicalDefense}`);
  if (stats.magicDefense) effects.push(`마법방어력 +${stats.magicDefense}`);
  if (stats.hp) effects.push(`HP +${stats.hp}`);
  if (stats.mp) effects.push(`MP +${stats.mp}`);
  if (stats.critRate) effects.push(`치명타 확률 +${stats.critRate}%`);
  if (stats.critDamage) effects.push(`치명타 피해 +${stats.critDamage}%`);

  // 특수 효과
  if (runeword.specialEffects) {
    for (const effect of runeword.specialEffects) {
      effects.push(effect.description.ko);
    }
  }

  return effects;
}
