import { test, beforeEach } from 'node:test';
import assert from 'node:assert/strict';
import { CHARACTER_CATALOG, getPartOptions, getPartName, getRaceBodyIndex, getItemRaceRestriction, getEquippedItemRaceRestriction, EQUIPMENT_FIT_RULES, ELF_RACE_IDS } from '../src/shared/lib/character/catalog';
import { useAppearanceStore, type CharacterState, type SpriteNames } from '../src/application/stores/appearanceStore';
import { RACES } from '../src/features/character/types/presets';
import items from '../public/data/items/equipment.json';
import all from '../public/data/sprites/all-sprites.json';
import { useEquipmentStore, type EquippedItem } from '../src/application/stores/equipmentStore';

useEquipmentStore.persist.setOptions({ storage: {getItem: () => null, setItem: () => {}, removeItem: () => {}} });

let calls: {method: string; param?: string}[];
const names = all as SpriteNames;
const state = (bodyIndex = 11, helmetIndex = -1) => ({bodyIndex,helmetIndex,leftWeaponType:'',rightWeaponType:'',leftWeaponIndex:-1,rightWeaponIndex:-1} as CharacterState);
beforeEach(() => {
  calls = [];
  useAppearanceStore.setState({isUnityLoaded:true, spriteNames:names, spriteCounts:all, characterState:state(), pendingBodyIndex:null,
    leftHandWeapon:{weaponType:null,index:-1},rightHandWeapon:{weaponType:null,index:-1},unityObjectName:'test',
    sendMessage:(_object,method,param)=>{calls.push({method,param});}});
  useEquipmentStore.getState().resetEquipment();
  useEquipmentStore.getState().setRaceContext(null);
});

test('all 614 names resolve by filename even when runtime sprite order changes', () => {
  let total=0;
  for (const [category, rows] of Object.entries(CHARACTER_CATALOG)) {
    const part = category as keyof typeof CHARACTER_CATALOG;
    for (const row of rows) { assert.notEqual(getPartName(part,row.sprite),'미등록 외형'); total++; }
    const reversed = [...rows].reverse();
    const options = getPartOptions(part,reversed.map(row=>row.sprite),true);
    assert.deepEqual(options.map(option=>option.name),reversed.map(row=>row.name));
  }
  assert.equal(total,614);
});
test('14 playable races use their actual body sprite and retained aliases resolve correctly',()=>{
  assert.equal(RACES.length,14);
  for (const race of RACES) assert.equal(race.bodyTypes[0].index,getRaceBodyIndex(race.id));
  assert.equal(getRaceBodyIndex('eastern_human'),11);
  assert.equal(getRaceBodyIndex('wood_elf'),9);
  assert.equal(getRaceBodyIndex('dark_elf'),0);
  assert.equal(getRaceBodyIndex('elf'),9);
});
test('10 reviewed helmets restrict every item alias; elf weapons and open tiaras stay universal',()=>{
  assert.equal(EQUIPMENT_FIT_RULES.length,10);
  for (const item of items.items) {
    const restriction = getItemRaceRestriction(item,'eastern_human');
    assert.equal(!!getEquippedItemRaceRestriction(item.id,'eastern_human'),!!restriction);
    if (restriction) for (const race of ELF_RACE_IDS) assert.equal(getItemRaceRestriction(item,race),undefined);
  }
  assert.equal(getItemRaceRestriction({slot:'helmet',spriteId:'elf_helmet_01'},'orc'),undefined);
  assert.equal(getItemRaceRestriction({slot:'sword',spriteId:'elf_weapon_03'},'human'),undefined);
});
test('human cannot select elf helmets through dropdown actions, low-level calls, or next/previous',()=>{
  const store=useAppearanceStore.getState();
  store.selectPart('helmet',4); store.callUnity('JS_SetHelmet','4');
  assert.equal(calls.length,0);
  useAppearanceStore.setState({characterState:state(11,3)});
  store.nextPart('helmet');assert.equal(calls.at(-1)?.param,'5');
  store.prevPart('helmet');assert.equal(calls.at(-1)?.param,'1');
});
test('elf equips; body change or a random Unity event removes incompatible helmet',()=>{
  const store=useAppearanceStore.getState();
  store.setCharacterState(state(9)); store.selectPart('helmet',4);
  assert.equal(calls.at(-1)?.param,'4');
  store.setCharacterState(state(11,4));
  assert.equal(useAppearanceStore.getState().characterState?.helmetIndex,-1);
  assert.deepEqual(calls.at(-1),{method:'JS_SetHelmet',param:'-1'});
});
test('invalid indices and required-part clear do not reach Unity; body selection survives loading',()=>{
  const store=useAppearanceStore.getState();
  for (const index of [-2,-1,1.5,10000,NaN]) store.selectPart('body',index);
  assert.equal(calls.length,0);
  useAppearanceStore.setState({isUnityLoaded:false});store.selectPart('body',9);
  assert.equal(useAppearanceStore.getState().pendingBodyIndex,9);
  assert.equal(calls.length,0);
});
test('rapid weapon type changes and clear never re-equip an older delayed selection',async()=>{
  const store=useAppearanceStore.getState();store.setHandWeaponType('right','sword');store.selectHandWeapon('right',3);
  store.setHandWeaponType('right','wand');store.clearHandWeapon('right');
  const count=calls.length;
  await new Promise(resolve=>setTimeout(resolve,80));
  assert.equal(calls.length,count);
  assert.deepEqual(useAppearanceStore.getState().rightHandWeapon,{weaponType:null,index:-1});
});
test('equipment store rejects persisted IDs even without client requirement metadata',()=>{
  const item = items.items.find(item=>getEquippedItemRaceRestriction(item.id,'human'))!;
  const equipped={itemId:item.id,itemName:item.nameKo,itemType:'armor',icon:'',stats:{physicalDefense:10}} as EquippedItem;
  const store=useEquipmentStore.getState();store.setRaceContext('eastern_human');store.equipItem('helmet',equipped);
  assert.equal(useEquipmentStore.getState().helmet,null);
  assert.equal(store.canEquipToSlot('helmet',equipped).canEquip,false);
  store.setRaceContext('wood_elf');store.equipItem('helmet',equipped);assert.equal(useEquipmentStore.getState().helmet?.itemId,item.id);
  store.setRaceContext('green_orc');assert.equal(useEquipmentStore.getState().helmet,null);
});

test('reset keeps the selected body and clears equipment without changing its fit category',()=>{
  const store=useAppearanceStore.getState();store.setCharacterState(state(9,4));store.clearAll();
  assert.equal(useAppearanceStore.getState().characterState?.bodyIndex,9);
  assert.equal(useAppearanceStore.getState().characterState?.helmetIndex,-1);
  assert.equal(store.getOptions('helmet').find(option=>option.index===4)?.disabled,false);
});
