import type { EquippedItem } from "@/application/stores";
import type { Item } from "../types";
import type {
  EquipmentSlot,
  EquipmentStats,
  WeaponHandType,
  OffHandItemType,
  AccessoryType,
  ItemRarity,
} from "../types";

/**
 * 실제 items.json 스키마 (TS Item 인터페이스와 필드가 다르다)
 * - subtype: weapon | armor | accessory
 * - weaponType: sword | wand | shield | bow | axe | dagger | spear (무기)
 * - slot: cloth | helmet | pant | armor | back (방어구) / ring | necklace (장신구)
 * - stats: { damage, defense, attackSpeed, range, str, ... }
 */
interface RawEquipItem {
  id: string;
  nameKo: string;
  type: string;
  subtype?: string;
  weaponType?: string;
  slot?: string;
  rarity?: ItemRarity;
  icon?: string;
  stats?: Record<string, number>;
  requirements?: { level?: number } & Record<string, number | undefined>;
}

/** 장착 요구 레벨 (items.json 의 requirements.level) */
export function getEquipRequiredLevel(item: Item): number {
  const raw = item as unknown as RawEquipItem;
  return raw.requirements?.level ?? 1;
}

/** 인벤토리 Item 이 장착 가능한 장비인지 (subtype 기준) */
export function isEquipableItem(item: Item): boolean {
  const raw = item as unknown as RawEquipItem;
  return (
    raw.type === "equipment" &&
    (raw.subtype === "weapon" ||
      raw.subtype === "armor" ||
      raw.subtype === "accessory")
  );
}

// items.json weaponType → 숙련도(ProficiencyType) 매핑
// 숙련도 키: light_sword/medium_sword/great_sword/axe/mace/dagger/spear/bow/crossbow/staff/fist/shield
const WEAPON_TYPE_TO_PROFICIENCY: Record<string, string> = {
  sword: "medium_sword",
  light_sword: "light_sword",
  medium_sword: "medium_sword",
  great_sword: "great_sword",
  wand: "staff",
  staff: "staff",
  bow: "bow",
  crossbow: "crossbow",
  axe: "axe",
  mace: "mace",
  dagger: "dagger",
  spear: "spear",
  shield: "shield",
  fist: "fist",
};

// 양손 무기 (오프핸드 자동 비활성)
const TWO_HANDED = new Set(["bow", "crossbow", "spear", "great_sword"]);

// 마법 무기 (damage → magicAttack)
const MAGIC_WEAPONS = new Set(["wand", "staff"]);

const WEAPON_ICON: Record<string, string> = {
  sword: "⚔️",
  light_sword: "🗡️",
  great_sword: "🗡️",
  axe: "🪓",
  mace: "🔨",
  dagger: "🔪",
  spear: "🔱",
  bow: "🏹",
  crossbow: "🎯",
  wand: "🪄",
  staff: "🪄",
  shield: "🛡️",
};

function iconFor(raw: RawEquipItem): string {
  if (raw.icon) return raw.icon;
  if (raw.subtype === "weapon" && raw.weaponType) {
    return WEAPON_ICON[raw.weaponType] ?? "⚔️";
  }
  if (raw.subtype === "armor") return "🛡️";
  if (raw.subtype === "accessory") return "💍";
  return "📦";
}

/**
 * items.json stats → EquipmentStats 변환 (전투/getTotalStats 반영용)
 * - damage → physicalAttack (마법 무기는 magicAttack)
 * - defense → physicalDefense
 * - attackSpeed/range 는 EquipmentStats 대상 아님 (attackSpeed는 EquippedItem에 별도 보관)
 * - 그 외 능력치(str/dex/hp/mp/critRate 등)는 그대로 통과
 */
export function itemToEquipmentStats(item: Item): EquipmentStats {
  const raw = item as unknown as RawEquipItem;
  const stats = raw.stats ?? {};
  const isMagic = raw.weaponType ? MAGIC_WEAPONS.has(raw.weaponType) : false;
  const out: EquipmentStats = {};

  for (const [key, value] of Object.entries(stats)) {
    if (typeof value !== "number") continue;
    if (key === "damage") {
      const target = isMagic ? "magicAttack" : "physicalAttack";
      out[target] = (out[target] ?? 0) + value;
    } else if (key === "defense") {
      out.physicalDefense = (out.physicalDefense ?? 0) + value;
    } else if (key === "attackSpeed" || key === "range") {
      // 스킵 (attackSpeed는 EquippedItem에 별도 저장)
    } else {
      const k = key as keyof EquipmentStats;
      out[k] = ((out[k] as number) ?? 0) + value;
    }
  }

  return out;
}

/**
 * 인벤토리 Item → 장착 슬롯 자동 판정
 * - 무기: shield → offHand, 그 외 → mainHand
 * - 방어구: slot(cloth/helmet/pant/armor) → 대응 슬롯 (back 등은 장착 슬롯 없음 → null)
 * - 장신구: ring/earring 은 빈 슬롯 우선 (occupied 맵으로 판정)
 * @param occupied 현재 착용중인 슬롯 여부 맵 (ring1/ring2/earring1/earring2 만 참조)
 */
export function resolveEquipSlot(
  item: Item,
  occupied: Partial<Record<EquipmentSlot, boolean>> = {}
): EquipmentSlot | null {
  const raw = item as unknown as RawEquipItem;

  if (raw.subtype === "weapon") {
    if (raw.weaponType === "shield") return "offHand";
    return "mainHand";
  }

  if (raw.subtype === "armor") {
    switch (raw.slot) {
      case "helmet":
        return "helmet";
      case "armor":
        return "armor";
      case "cloth":
        return "cloth";
      case "pant":
      case "pants":
        return "pants";
      default:
        return null; // back(망토) 등 12슬롯에 없는 부위
    }
  }

  if (raw.subtype === "accessory") {
    switch (raw.slot) {
      case "necklace":
        return "necklace";
      case "bracelet":
        return "bracelet";
      case "ring":
        return !occupied.ring1 ? "ring1" : !occupied.ring2 ? "ring2" : "ring1";
      case "earring":
        return !occupied.earring1
          ? "earring1"
          : !occupied.earring2
          ? "earring2"
          : "earring1";
      default:
        return null;
    }
  }

  return null;
}

/**
 * 인벤토리 Item → EquippedItem 변환 (장착 스토어용)
 */
export function itemToEquippedItem(item: Item): EquippedItem {
  const raw = item as unknown as RawEquipItem;
  const isShield = raw.weaponType === "shield";
  const isWeapon = raw.subtype === "weapon";

  const itemType = raw.weaponType
    ? WEAPON_TYPE_TO_PROFICIENCY[raw.weaponType] ?? raw.weaponType
    : raw.subtype ?? "misc";

  let handType: WeaponHandType | undefined;
  let offHandType: OffHandItemType | undefined;
  if (isWeapon) {
    if (isShield) {
      offHandType = "shield";
    } else {
      handType = raw.weaponType && TWO_HANDED.has(raw.weaponType)
        ? "two_handed"
        : "one_handed";
    }
  }

  let accessoryType: AccessoryType | undefined;
  if (raw.subtype === "accessory") {
    const s = raw.slot;
    if (s === "ring" || s === "necklace" || s === "earring" || s === "bracelet") {
      accessoryType = s;
    }
  }

  const attackSpeed =
    typeof raw.stats?.attackSpeed === "number" ? raw.stats.attackSpeed : undefined;

  return {
    itemId: raw.id,
    itemName: raw.nameKo,
    itemType,
    icon: iconFor(raw),
    rarity: raw.rarity,
    handType,
    offHandType,
    attackSpeed,
    accessoryType,
    stats: itemToEquipmentStats(item),
  };
}
