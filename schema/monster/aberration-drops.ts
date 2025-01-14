import { Hero, HeroClasses } from "types/graphql";
import { BaseContext } from "../context";
import {
  hasQuestItem,
  giveQuestItemNotification,
  takeQuestItem,
} from "../quests/helpers";
import { giveHeroRandomDrop, randomEnchantment } from "../items/helpers";

export async function checkAberrationDrop(
  context: BaseContext,
  hero: Hero,
  aberration: string
): Promise<void> {
  switch (aberration) {
    case "domari-aberration-1":
      // Burnt Harlequin
      return burntHarlequinReward(context, hero);
      break;
    case "random-aberration-thornbrute":
      return thornbruteReward(context, hero);
      break;
    case "random-aberration-unholy-paladin":
      return unholyPaladinReward(context, hero);
      break;
    default:
      break;
  }
}

async function thornbruteReward(
  context: BaseContext,
  hero: Hero
): Promise<void> {
  context.io.sendGlobalNotification({
    message: `The terrible aberration in ${hero.location.x}, ${hero.location.y} has been slain by ${hero.name}`,
    type: "quest",
  });
  genericAberrationReward(context, hero);

  if (Math.random() < 1 / 3) {
    context.io.sendGlobalNotification({
      message: `${hero.name} has harvested an essence from the aberration`,
      type: "quest",
    });
    hero = giveQuestItemNotification(context, hero, "essence-of-thorns");
  }
}

async function unholyPaladinReward(
  context: BaseContext,
  hero: Hero
): Promise<void> {
  context.io.sendGlobalNotification({
    message: `${hero.name} has ended the unholy aberration in ${hero.location.x}, ${hero.location.y}`,
    type: "quest",
  });
  genericAberrationReward(context, hero);

  if (Math.random() < 1 / 3) {
    context.io.sendGlobalNotification({
      message: `${hero.name} has harvested an essence from the aberration`,
      type: "quest",
    });
    hero = giveQuestItemNotification(context, hero, "essence-of-darkness");
  }
}

async function genericAberrationReward(
  context: BaseContext,
  hero: Hero
): Promise<void> {
  const enchantmentTier = Math.random() > 0.5 ? 3 : 2;

  // random garbo base with a high tier enchant
  giveHeroRandomDrop(context, hero, 1, enchantmentTier, false, false);

  if (Math.random() < 1 / 10) {
    let dustAmount = 100 + Math.ceil(Math.random() * 400);
    hero.enchantingDust += dustAmount;

    if (Math.random() < 1 / 20) {
      // crit
      dustAmount *= 10;
      context.io.sendNotification(hero.id, {
        message: `Unbelievable!! You find a stash of ${dustAmount} enchanting dust!`,
        type: "quest",
      });
      context.io.sendGlobalNotification({
        message: `${hero.name} was blessed with godly enchanting powers`,
        type: "quest",
      });
    } else {
      context.io.sendNotification(hero.id, {
        message: `You find ${dustAmount} enchanting dust while looting`,
        type: "quest",
      });
      context.io.sendGlobalNotification({
        message: `${hero.name} found additional enchanting powers`,
        type: "quest",
      });
    }
  }
}

async function burntHarlequinReward(
  context: BaseContext,
  hero: Hero
): Promise<void> {
  context.io.sendGlobalNotification({
    message: `ash sits still in the air around ${hero.name}`,
    type: "quest",
  });

  // ascended gear piece with a forced tier 3 enchantment on it
  giveHeroRandomDrop(context, hero, 33, 3, true, false);

  let gotReward = false;

  // plus fuse class uppgrade if available
  switch (hero.class) {
    case HeroClasses.Gambler:
      if (
        hasQuestItem(hero, "loaded-dice") &&
        hasQuestItem(hero, "fishermans-luck")
      ) {
        hero = giveQuestItemNotification(context, hero, "gambling-kit");
        hero = takeQuestItem(hero, "loaded-dice");
        hero = takeQuestItem(hero, "fishermans-luck");

        context.io.sendGlobalNotification({
          message: `${hero.name} has mastered their skills and transcended`,
          type: "quest",
        });
        gotReward = true;
      }

      break;
    case HeroClasses.Fighter:
    case HeroClasses.Berserker:
      if (
        hasQuestItem(hero, "warrior-plate") &&
        hasQuestItem(hero, "fishermans-strength")
      ) {
        hero = giveQuestItemNotification(context, hero, "warriors-armlette");
        hero = takeQuestItem(hero, "warrior-plate");
        hero = takeQuestItem(hero, "fishermans-strength");

        context.io.sendGlobalNotification({
          message: `${hero.name} has mastered their skills and transcended`,
          type: "quest",
        });
        gotReward = true;
      }

      break;
    case HeroClasses.Wizard:
    case HeroClasses.Warlock:
      if (
        hasQuestItem(hero, "secret-codex") &&
        hasQuestItem(hero, "fishermans-intelligence")
      ) {
        hero = giveQuestItemNotification(context, hero, "tome-of-knowledge");
        hero = takeQuestItem(hero, "secret-codex");
        hero = takeQuestItem(hero, "fishermans-intelligence");

        context.io.sendGlobalNotification({
          message: `${hero.name} has mastered their skills and transcended`,
          type: "quest",
        });
        gotReward = true;
      }

      break;
    case HeroClasses.BattleMage:
      if (
        hasQuestItem(hero, "patrons-mark") &&
        hasQuestItem(hero, "fishermans-wisdom")
      ) {
        hero = giveQuestItemNotification(context, hero, "patrons-wisdom");
        hero = takeQuestItem(hero, "patrons-mark");
        hero = takeQuestItem(hero, "fishermans-wisdom");

        context.io.sendGlobalNotification({
          message: `${hero.name} has mastered their skills and transcended`,
          type: "quest",
        });
        gotReward = true;
      }

      break;
    case HeroClasses.Paladin:
      if (
        hasQuestItem(hero, "righteous-incense") &&
        hasQuestItem(hero, "fishermans-willpower")
      ) {
        hero = giveQuestItemNotification(context, hero, "liturgical-censer");
        hero = takeQuestItem(hero, "righteous-incense");
        hero = takeQuestItem(hero, "fishermans-willpower");

        context.io.sendGlobalNotification({
          message: `${hero.name} has mastered their skills and transcended`,
          type: "quest",
        });
        gotReward = true;
      }

      break;
    case HeroClasses.Ranger:
      if (
        hasQuestItem(hero, "fletching-leather") &&
        hasQuestItem(hero, "fishermans-dexterity")
      ) {
        hero = giveQuestItemNotification(context, hero, "quiver-of-speed");
        hero = takeQuestItem(hero, "fletching-leather");
        hero = takeQuestItem(hero, "fishermans-dexterity");

        context.io.sendGlobalNotification({
          message: `${hero.name} has mastered their skills and transcended`,
          type: "quest",
        });
        gotReward = true;
      }

      break;
    case HeroClasses.BloodMage:
      if (
        hasQuestItem(hero, "blood-stone") &&
        hasQuestItem(hero, "fishermans-constitution")
      ) {
        hero = giveQuestItemNotification(context, hero, "vampire-ring");
        hero = takeQuestItem(hero, "blood-stone");
        hero = takeQuestItem(hero, "fishermans-constitution");

        context.io.sendGlobalNotification({
          message: `${hero.name} has mastered their skills and transcended`,
          type: "quest",
        });
        gotReward = true;
      }

      break;
    case HeroClasses.Daredevil:
    case HeroClasses.Gladiator:
    case HeroClasses.EnragedBerserker:
    case HeroClasses.MasterWizard:
    case HeroClasses.MasterWarlock:
    case HeroClasses.DemonHunter:
    case HeroClasses.Zealot:
    case HeroClasses.Archer:
    case HeroClasses.Vampire:
      // has class upgrade, reward?

      hero = giveQuestItemNotification(context, hero, "essence-of-ash");
      gotReward = true;
      break;
    default:
      break;
  }

  if (!gotReward) {
    // why did you kill this?
    // get something bonus?
  }
}
