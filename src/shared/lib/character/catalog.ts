import data from './catalog.json';
import fit from './equipment-fit.json';
import races from '../../../../public/data/appearance/races/races.json';
import type { PartType } from '@/shared/types/character-panel';

export interface FitRule { category: string; sprite: string; allowedRaceCategories: string[]; reason: string }
export const EQUIPMENT_FIT_RULES = fit.rules as FitRule[];
export const CHARACTER_CATALOG = data;
export const DEFAULT_BODY_INDEX = data.body.findIndex(row => row.sprite === 'Human_1');
export const ELF_RACE_IDS = ['elf', 'darkelf', ...races.races.filter(r => r.category === 'elf').map(r => r.id)];
export function isElfRace(raceId?: string | null): boolean {
  return !!raceId && ELF_RACE_IDS.includes(raceId);
}
export function isElfBody(sprite?: string): boolean {
  return ['Elf_1', 'Elf_2', 'New_Elf_1', 'New_Elf_2'].includes(sprite ?? '');
}
export function getFitRule(category: string, sprite?: string): FitRule | undefined {
  return EQUIPMENT_FIT_RULES.find(rule => rule.category === category && rule.sprite.toLowerCase() === sprite?.toLowerCase());
}
export function getPartName(category: PartType, sprite?: string): string {
  if (!sprite) return '없음';
  return data[category].find(row => row.sprite === sprite)?.name ?? '미등록 외형';
}
export function getPartOptions(category: PartType, names: string[], elf: boolean) {
  return names.map((sprite, index) => {
    const rule = getFitRule(category, sprite);
    return { index, name: getPartName(category, sprite), disabled: !!rule && !elf, restriction: rule ? '엘프 전용 · 귀가 드러나는 전용 재단' : undefined };
  });
}
export function getItemRaceRestriction(item: {slot?: string; spriteId?: string; requirements?: {raceCategories?: string[]}}, raceId?: string | null): string | undefined {
  const restricted = item.requirements?.raceCategories?.includes('elf') || !!getFitRule(item.slot ?? '', item.spriteId);
  return restricted && !isElfRace(raceId) ? '엘프 전용 장비입니다. 엘프 종족만 착용할 수 있습니다.' : undefined;
}

/** Uses canonical item IDs, so persisted equipment cannot omit its race requirement. */
export function getEquippedItemRaceRestriction(itemId: string, raceId?: string | null): string | undefined {
  return !isElfRace(raceId) && fit.rules.some(rule => rule.itemIds.includes(itemId))
    ? '엘프 전용 장비입니다. 엘프 종족만 착용할 수 있습니다.' : undefined;
}

export function getRaceBodyIndex(raceId?: string | null): number {
  const legacy: Record<string, string> = { human: 'Human_1', elf: 'Elf_1', orc: 'Orc_1', dwarf: 'Human_2', darkelf: 'New_Elf_1' };
  const sprite = races.races.find(race => race.id === raceId)?.appearance.body.spriteId ?? legacy[raceId ?? ''];
  const index = data.body.findIndex(body => body.sprite === sprite);
  return index >= 0 ? index : DEFAULT_BODY_INDEX;
}
