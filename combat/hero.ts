import {
  InventoryItemType,
  InventoryItem,
  HeroClasses,
  AttackType,
  Hero,
} from "types/graphql";
import { Combatant } from "./types";
import { createLuck } from "./helpers";

export function addItemToCombatant(
  combatant: Combatant,
  item: InventoryItem
): Combatant {
  const { attackType } = combatant;
  let itemLevel = item.level;
  // affectsAttackType ? item.level : 1
  if (!doesWeaponAffectAttack(item, attackType)) {
    itemLevel = 0;
  }
  if (
    combatant.class === HeroClasses.BattleMage ||
    combatant.class === HeroClasses.DemonHunter
  ) {
    if (
      attackType === AttackType.Cast &&
      item.type === InventoryItemType.MeleeWeapon
    ) {
      itemLevel = item.level / 2;
    }
    if (
      attackType === AttackType.Melee &&
      item.type === InventoryItemType.SpellFocus
    ) {
      itemLevel = item.level / 2;
    }
  }

  if (
    item.type === InventoryItemType.MeleeWeapon ||
    item.type === InventoryItemType.SpellFocus ||
    item.type === InventoryItemType.RangedWeapon ||
    (item.type === InventoryItemType.Shield &&
      (combatant.class === HeroClasses.Paladin ||
        combatant.class === HeroClasses.Zealot))
  ) {
    if (
      item.type === InventoryItemType.RangedWeapon &&
      combatant.equipment.weapons.length
    ) {
      return combatant;
    }
    combatant.equipment.weapons.push({
      level: itemLevel,
      baseItem: item.baseItem,
      enchantment: item.enchantment,
      type: item.type,
    });
  } else {
    combatant.equipment.armor.push({
      level: item.level,
      baseItem: item.baseItem,
      enchantment: item.enchantment,
      type: item.type,
    });
  }

  return combatant;
}

export function doesWeaponAffectAttack(
  weapon: InventoryItem,
  attackType: AttackType
): boolean {
  switch (attackType) {
    case AttackType.Blood:
      if (
        weapon.type === InventoryItemType.RangedWeapon ||
        weapon.type === InventoryItemType.MeleeWeapon
      ) {
        return false;
      }
      break;
    case AttackType.Smite:
      if (weapon.type === InventoryItemType.RangedWeapon) {
        return false;
      }
      break;
    case AttackType.Cast:
      if (
        weapon.type === InventoryItemType.MeleeWeapon ||
        weapon.type === InventoryItemType.RangedWeapon
      ) {
        return false;
      }
      break;
    case AttackType.Ranged:
      if (
        weapon.type === InventoryItemType.MeleeWeapon ||
        weapon.type === InventoryItemType.SpellFocus
      ) {
        return false;
      }
      break;
    case AttackType.Melee:
      if (
        weapon.type === InventoryItemType.SpellFocus ||
        weapon.type === InventoryItemType.RangedWeapon
      ) {
        return false;
      }
      break;
    default:
      break;
  }
  return true;
}

export function createHeroCombatant(
  hero: Hero,
  attackType: AttackType
): Combatant {
  const heroCombatant: Combatant = {
    class: hero.class,
    attackType,
    level: hero.level,
    name: hero.name,
    health: hero.combat.health,
    maxHealth: hero.combat.maxHealth,
    equipment: {
      armor: [],
      weapons: [],
      quests: hero.inventory.filter((i) => i.type === InventoryItemType.Quest),
    },
    damageReduction: hero.level,
    attributes: hero.stats,
    luck: createLuck(hero.stats.luck),
  };

  if (hero.equipment.leftHand) {
    addItemToCombatant(heroCombatant, hero.equipment.leftHand);
  }
  if (hero.equipment.rightHand) {
    addItemToCombatant(heroCombatant, hero.equipment.rightHand);
  }
  if (hero.equipment.bodyArmor) {
    addItemToCombatant(heroCombatant, hero.equipment.bodyArmor);
  }
  if (hero.equipment.handArmor) {
    addItemToCombatant(heroCombatant, hero.equipment.handArmor);
  }
  if (hero.equipment.legArmor) {
    addItemToCombatant(heroCombatant, hero.equipment.legArmor);
  }
  if (hero.equipment.headArmor) {
    addItemToCombatant(heroCombatant, hero.equipment.headArmor);
  }
  if (hero.equipment.footArmor) {
    addItemToCombatant(heroCombatant, hero.equipment.footArmor);
  }

  heroCombatant.equipment.weapons = heroCombatant.equipment.weapons.sort(
    (a, b) => b.level - a.level
  );

  return heroCombatant;
}
