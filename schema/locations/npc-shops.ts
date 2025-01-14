import {
  InventoryItemType,
  SpecialLocation,
  NpcShop,
  Hero,
  MonsterInstance,
  AttackType,
  InventoryItem,
  EnchantmentType,
  NpcShopItems,
} from "types/graphql";
import { LocationData, MapNames } from "../../constants";
import {
  giveQuestItemNotification,
  takeQuestItem,
  hasQuestItem,
} from "../quests/helpers";
import { createItemInstance } from "../items/helpers";
import { BaseItems } from "../items/base-items";
import { getQuestRewards } from "../quests/items";
import { AberrationStats } from "../monster/aberration-stats";
import { BaseContext } from "../context";

type NpcTradeResult = { success: boolean; message: string };

export async function executeNpcTrade(
  context: BaseContext,
  hero: Hero,
  tradeId: string
): Promise<NpcTradeResult> {
  // aberration spawns
  if (tradeId.startsWith("domari")) {
    return executeDomariTrade(context, hero, tradeId);
  }
  // crafting quest items
  if (tradeId.startsWith("naxxremis")) {
    return executeNaxxremisTrade(context, hero, tradeId);
  }
  // enchantment shop
  if (tradeId.startsWith("trimarim")) {
    return executeTrimarimTrade(context, hero, tradeId);
  }
  if (tradeId.startsWith("amixea")) {
    return executeAmixeaTrade(context, hero, tradeId);
  }
  if (tradeId.startsWith("transcendence")) {
    return executeTranscendenceTrade(context, hero, tradeId);
  }

  return { success: false, message: "not implemented" };
}
export function getShopData(
  context: BaseContext,
  hero: Hero,
  location: SpecialLocation
): NpcShop | null {
  if (location.name === "Domari's Hut") {
    return getDomariTrades(context, hero);
  } else if (location.name === "Naxxremis's Grotto") {
    return getNaxxremisTrades(context, hero);
  } else if (location.name === "The Hellhound's Fur") {
    return getTrimarimTrades(context, hero);
  } else if (location.name === "Amixea's Hut") {
    return getAmixeaTrades(context, hero);
  } else if (location.name === "Altar of Transcendence") {
    return getTranscendenceTrades(context, hero);
  }

  return null;
}

function getTranscendenceTrades(
  context: BaseContext,
  hero: Hero
): NpcShop | null {
  // Amixea is a old small quiet witch who radiates with a magical aura.
  const shop: NpcShop = {
    name: "Altar of Transcendence",

    trades: [],
  };
  const questItems = getQuestRewards();
  // (0x01 << 0) + (0x01 << 1) + (0x01 << 2) + (0x01 << 3) + (0x01 << 4) + (0x01 << 5) + (0x01 << 6) + (0x01 << 7) + (0x01 << 8) + (0x01 << 9) + (0x01 << 10) + (0x01 << 11) + (0x01 << 12) + (0x01 << 13) + (0x01 << 14)
  if (
    hasQuestItem(hero, "essence-of-ash") &&
    hasQuestItem(hero, "essence-of-thorns") &&
    hasQuestItem(hero, "essence-of-darkness")
  ) {
    shop.trades.push({
      id: "transcendence-essence-upgrade",
      price: {
        dust: 1000,
        description: "the three great essences",
        questItems: [
          questItems["essence-of-ash"].name,
          questItems["essence-of-thorns"].name,
          questItems["essence-of-darkness"].name,
          "Non-Enchanted Ascended Gear",
        ],
      },
      offer: {
        questItems: ["Transcended Gear"],
        description: "great power",
      },
    });
  }

  if (!shop.trades.length) {
    // amixea does not care for you
    return null;
  }
  return shop;
}

async function executeTranscendenceTrade(
  context: BaseContext,
  hero: Hero,
  tradeId: string
): Promise<NpcTradeResult> {
  if (tradeId === "transcendence-essence-upgrade") {
    if (
      !hasQuestItem(hero, "essence-of-ash") ||
      !hasQuestItem(hero, "essence-of-thorns") ||
      !hasQuestItem(hero, "essence-of-darkness")
    ) {
      return {
        success: false,
        message: "You lack the essences needed to activate the altar",
      };
    }
    const pureAscendedItem = hero.inventory.find(
      (item) =>
        item.level === 33 &&
        item.type !== InventoryItemType.Quest &&
        !item.enchantment
    );
    if (!pureAscendedItem) {
      return {
        success: false,
        message: "You need a non-enchanted Ascended tier equipment to upgrade",
      };
    }
    if (hero.enchantingDust < 1000) {
      return {
        success: false,
        message: "You do not have enough enchanting dust to activate the altar",
      };
    }
    hero.enchantingDust -= 1000;
    hero = takeQuestItem(hero, "essence-of-ash");
    hero = takeQuestItem(hero, "essence-of-thorns");
    hero = takeQuestItem(hero, "essence-of-darkness");
    hero.inventory = hero.inventory.filter(
      (item) => item.id !== pureAscendedItem.id
    );

    const baseItem = Object.values(BaseItems).find(
      (base) => base.level === 34 && base.type === pureAscendedItem.type
    );
    if (!baseItem) {
      return {
        success: false,
        message: "Failed to find an upgrade for that item.",
      };
    }
    console.log(
      hero.name,
      "is upgrading",
      pureAscendedItem.name,
      "to",
      baseItem.name
    );

    const newItem = createItemInstance(baseItem, hero);
    hero.inventory.push(newItem);
    await context.db.hero.put(hero);

    context.io.sendGlobalNotification({
      message: `${hero.name} holds transcended power`,
      type: "quest",
    });

    return {
      success: true,
      message: `Your ${pureAscendedItem.name} fuses with the essences and transforms into ${newItem.name}`,
    };
  }
  return { success: false, message: "not implemented" };
}

async function executeAmixeaTrade(
  context: BaseContext,
  hero: Hero,
  tradeId: string
): Promise<NpcTradeResult> {
  if (tradeId === "amixea-heroes-guidance") {
    if (
      !hero.questLog.minorClassUpgrades ||
      hero.questLog.minorClassUpgrades.finished ||
      hero.questLog.minorClassUpgrades.progress !== 32767 ||
      !hasQuestItem(hero, "archers-balance") ||
      !hasQuestItem(hero, "attackers-warbanner") ||
      !hasQuestItem(hero, "casters-destiny") ||
      !hasQuestItem(hero, "smiters-light") ||
      !hasQuestItem(hero, "vampires-darkness")
    ) {
      return { success: false, message: "You do not have the required items" };
    }

    if (hero.enchantingDust < 500) {
      return { success: false, message: "You do not have the required items" };
    }

    hero.enchantingDust -= 500;

    takeQuestItem(hero, "archers-balance");
    takeQuestItem(hero, "attackers-warbanner");
    takeQuestItem(hero, "casters-destiny");
    takeQuestItem(hero, "smiters-light");
    takeQuestItem(hero, "vampires-darkness");

    context.io.sendNotification(hero.id, {
      message: `Amixea takes the 5 items and places them upon her might witchforge`,
      type: "quest",
    });

    giveQuestItemNotification(context, hero, "heros-guidance");
    hero.questLog.minorClassUpgrades.progress =
      hero.questLog.minorClassUpgrades.progress | (0x01 << 15);
    hero.questLog.minorClassUpgrades.finished = true;

    context.io.sendGlobalNotification({
      message: `${hero.name} has found guidance`,
      type: "quest",
    });

    await context.db.hero.put(hero);
    return { success: true, message: "Amixea combines the items into one" };
  }

  if (tradeId === "amixea-orb-of-forbidden-power") {
    if (
      !hero.questLog.minorClassUpgrades?.finished ||
      !hero.questLog.nagaScale?.finished ||
      !hero.questLog.washedUp?.finished ||
      !hero.questLog.droop?.finished ||
      hero.questLog.tavernChampion?.progress !== 15 ||
      !hasQuestItem(hero, "totem-of-hero-rebirth")
    ) {
      return { success: false, message: "You do not have the required items" };
    }

    if (hero.enchantingDust < 2000) {
      return { success: false, message: "You do not have the required items" };
    }

    hero.enchantingDust -= 2000;

    takeQuestItem(hero, "totem-of-hero-rebirth");
    takeQuestItem(hero, "heros-guidance");
    takeQuestItem(hero, "dont-get-hit");
    takeQuestItem(hero, "naga-scale");
    takeQuestItem(hero, "aqua-lungs");
    takeQuestItem(hero, "trophy-hellhound");
    takeQuestItem(hero, "trophy-drowning");
    takeQuestItem(hero, "trophy-steamgear");
    takeQuestItem(hero, "trophy-hiddenstump");

    context.io.sendNotification(hero.id, {
      message: `Amixea's witchforge roars with energy`,
      type: "quest",
    });

    giveQuestItemNotification(context, hero, "orb-of-forbidden-power");
    hero.questLog.tavernChampion.progress =
      hero.questLog.tavernChampion.progress | (0x01 << 4);
    hero.questLog.tavernChampion.finished = true;

    context.io.sendGlobalNotification({
      message: `${hero.name} has transcended the ranks of hero`,
      type: "quest",
    });

    await context.db.hero.put(hero);
    return { success: true, message: "Amixea combines the items into one" };
  }
  return { success: false, message: "not implemented" };
}

function getAmixeaTrades(context: BaseContext, hero: Hero): NpcShop | null {
  // Amixea is a old small quiet witch who radiates with a magical aura.
  const shop: NpcShop = {
    name: "Amixea's Witchforge",

    trades: [],
  };
  const questItems = getQuestRewards();
  // (0x01 << 0) + (0x01 << 1) + (0x01 << 2) + (0x01 << 3) + (0x01 << 4) + (0x01 << 5) + (0x01 << 6) + (0x01 << 7) + (0x01 << 8) + (0x01 << 9) + (0x01 << 10) + (0x01 << 11) + (0x01 << 12) + (0x01 << 13) + (0x01 << 14)
  if (
    hero.questLog.minorClassUpgrades &&
    hero.questLog.minorClassUpgrades.progress === 32767
  ) {
    shop.trades.push({
      id: "amixea-heroes-guidance",
      price: {
        dust: 500,
        description: "five",
        questItems: [
          questItems["archers-balance"].name,
          questItems["attackers-warbanner"].name,
          questItems["casters-destiny"].name,
          questItems["smiters-light"].name,
          questItems["vampires-darkness"].name,
        ],
      },
      offer: {
        questItems: [questItems["heros-guidance"].name],
        description: "guidance",
      },
    });
  }
  if (
    hero.questLog.minorClassUpgrades?.finished &&
    hero.questLog.nagaScale?.finished &&
    hero.questLog.washedUp?.finished &&
    hero.questLog.droop?.finished &&
    hero.questLog.tavernChampion?.progress === 15 &&
    !hero.questLog.tavernChampion?.finished &&
    hasQuestItem(hero, "totem-of-hero-rebirth")
  ) {
    shop.trades.push({
      id: "amixea-orb-of-forbidden-power",
      price: {
        dust: 2000,
        description: "all that you've worked for",
        questItems: [
          questItems["totem-of-hero-rebirth"].name,
          questItems["heros-guidance"].name,
          questItems["dont-get-hit"].name,
          questItems["naga-scale"].name,
          questItems["aqua-lungs"].name,
          questItems["trophy-hellhound"].name,
          questItems["trophy-drowning"].name,
          questItems["trophy-steamgear"].name,
          questItems["trophy-hiddenstump"].name,
        ],
      },
      offer: {
        questItems: [questItems["orb-of-forbidden-power"].name],
        description: "fobidden power",
      },
    });
  }

  if (!shop.trades.length) {
    // amixea does not care for you
    return null;
  }
  return shop;
}

function hasEnchantmentsForTrimarim(
  hero: Hero,
  price: NpcShopItems
): false | EnchantmentType[] {
  const enchantmentsFound: { [x in EnchantmentType]?: number } = {};

  if (price.enchantments) {
    price.enchantments.forEach((ench) => {
      enchantmentsFound[ench] = (enchantmentsFound[ench] ?? 0) + 1;
    });
  }

  const filteredEnchantments = hero.enchantments.filter((enchantment) => {
    const found = enchantmentsFound[enchantment];
    if (found) {
      if (found > 0) {
        enchantmentsFound[enchantment] = found - 1;
        return false;
      }
    }
    return true;
  });

  let metCosts =
    Object.values(enchantmentsFound).filter((val) => val > 0).length === 0;

  if (metCosts) {
    return filteredEnchantments;
  }

  return false;
}

function payForTrimarim(hero: Hero, price: NpcShopItems): NpcTradeResult {
  const filteredEnchantments = hasEnchantmentsForTrimarim(hero, price);
  if (!filteredEnchantments) {
    return {
      success: false,
      message: "You lack the pure enchantments for this.",
    };
  }
  price.gold = price.gold ?? 0;
  price.dust = price.dust ?? 0;
  if (hero.gold < price.gold) {
    return { success: false, message: "You lack the gold for this." };
  }
  if (hero.enchantingDust < price.dust) {
    return { success: false, message: "You lack the gold for this." };
  }
  // pay fee's
  hero.gold -= price.gold;
  hero.enchantingDust -= price.dust;
  hero.enchantments = filteredEnchantments;

  return { success: true, message: "" };
}

const TrimarimTrades: {
  [x in string]?: {
    price: NpcShopItems;
    offer: EnchantmentType;
    message: string;
    description: string;
  };
} = {
  "trimarim-enchantment-combiner": {
    price: {
      gold: 1000000,
      dust: 50,
      enchantments: [
        EnchantmentType.BonusStrength,
        EnchantmentType.BonusDexterity,
        EnchantmentType.BonusConstitution,
        EnchantmentType.BonusIntelligence,
        EnchantmentType.BonusWisdom,
        EnchantmentType.BonusWillpower,
        EnchantmentType.BonusLuck,
      ],
      description: "one of each normal enchantment and a small fee",
    },
    offer: EnchantmentType.BonusAllStats,
    message: "You shall know power like none before",
    description: "a combination of all of them",
  },
  "trimarim-enchantment-combiner-minus-enemy": {
    price: {
      gold: 1000000,
      dust: 50,
      enchantments: [
        EnchantmentType.MinusEnemyStrength,
        EnchantmentType.MinusEnemyDexterity,
        EnchantmentType.MinusEnemyConstitution,
        EnchantmentType.MinusEnemyIntelligence,
        EnchantmentType.MinusEnemyWisdom,
        EnchantmentType.MinusEnemyWillpower,
      ],
      description: "one of each destructive enchantment and a small fee",
    },
    offer: EnchantmentType.MinusEnemyAllStats,
    message: "Your enemies will melt before you",
    description: "a combination of all of them",
  },
  "trimarim-enchantment-make-sa": {
    price: {
      gold: 2000000000,
      dust: 500,
      enchantments: [
        EnchantmentType.StrengthSteal,
        EnchantmentType.DexteritySteal,
        EnchantmentType.ConstitutionSteal,
        EnchantmentType.IntelligenceSteal,
        EnchantmentType.WisdomSteal,
        EnchantmentType.WillpowerSteal,
        EnchantmentType.LuckSteal,
      ],
      description: "the seven greedy enchantments",
    },
    offer: EnchantmentType.AllStatsSteal,
    message: "The power is overwhelming",
    description: "something far far greater",
  },

  // tier 4 recipes

  "trimarim-enchantment-tier4-superdexterity": {
    price: {
      gold: 2000000000,
      dust: 4000,
      enchantments: [
        EnchantmentType.AllStatsSteal,
        EnchantmentType.AllStatsSteal,
        EnchantmentType.AllStatsSteal,
        EnchantmentType.WisDexWill,
        EnchantmentType.DexteritySteal,
      ],
      description: "only the rarest",
    },
    offer: EnchantmentType.SuperDexterity,
    message: "The enchantments are fused into one",
    description: "unbelievable power",
  },
  "trimarim-enchantment-tier4-superwillpower": {
    price: {
      gold: 2000000000,
      dust: 4000,
      enchantments: [
        EnchantmentType.AllStatsSteal,
        EnchantmentType.AllStatsSteal,
        EnchantmentType.AllStatsSteal,
        EnchantmentType.WisDexWill,
        EnchantmentType.WillpowerSteal,
      ],
      description: "only the rarest",
    },
    offer: EnchantmentType.SuperWillpower,
    message: "The enchantments are fused into one",
    description: "unbelievable power",
  },
  "trimarim-enchantment-tier4-superwisdom": {
    price: {
      gold: 2000000000,
      dust: 4000,
      enchantments: [
        EnchantmentType.AllStatsSteal,
        EnchantmentType.AllStatsSteal,
        EnchantmentType.AllStatsSteal,
        EnchantmentType.WisDexWill,
        EnchantmentType.WisdomSteal,
      ],
      description: "only the rarest",
    },
    offer: EnchantmentType.SuperWisdom,
    message: "The enchantments are fused into one",
    description: "unbelievable power",
  },
  "trimarim-enchantment-tier4-supervamp": {
    price: {
      gold: 2000000000,
      dust: 4000,
      enchantments: [
        EnchantmentType.AllStatsSteal,
        EnchantmentType.Vampirism,
        EnchantmentType.Vampirism,
        EnchantmentType.Vampirism,
      ],
      description: "only the rarest",
    },
    offer: EnchantmentType.SuperVamp,
    message: "The enchantments are fused into one",
    description: "unbelievable power",
  },
  "trimarim-enchantment-tier4-supermelee": {
    price: {
      gold: 2000000000,
      dust: 4000,
      enchantments: [
        EnchantmentType.AllStatsSteal,
        EnchantmentType.BigMelee,
        EnchantmentType.BigMelee,
        EnchantmentType.BigMelee,
      ],
      description: "only the rarest",
    },
    offer: EnchantmentType.SuperMelee,
    message: "The enchantments are fused into one",
    description: "unbelievable power",
  },
  "trimarim-enchantment-tier4-supercaster": {
    price: {
      gold: 2000000000,
      dust: 4000,
      enchantments: [
        EnchantmentType.AllStatsSteal,
        EnchantmentType.BigCaster,
        EnchantmentType.BigCaster,
        EnchantmentType.BigCaster,
      ],
      description: "only the rarest",
    },
    offer: EnchantmentType.SuperCaster,
    message: "The enchantments are fused into one",
    description: "unbelievable power",
  },
  "trimarim-enchantment-tier4-superbattlemage": {
    price: {
      gold: 2000000000,
      dust: 4000,
      enchantments: [
        EnchantmentType.AllStatsSteal,
        EnchantmentType.BigMelee,
        EnchantmentType.BigCaster,
        EnchantmentType.BigCaster,
      ],
      description: "only the rarest",
    },
    offer: EnchantmentType.SuperBattleMage,
    message: "The enchantments are fused into one",
    description: "unbelievable power",
  },
  "trimarim-enchantment-tier4-superbattlemage-2": {
    price: {
      gold: 2000000000,
      dust: 4000,
      enchantments: [
        EnchantmentType.AllStatsSteal,
        EnchantmentType.BigMelee,
        EnchantmentType.BigMelee,
        EnchantmentType.BigCaster,
      ],
      description: "only the rarest",
    },
    offer: EnchantmentType.SuperBattleMage,
    message: "The enchantments are fused into one",
    description: "unbelievable power",
  },
  "trimarim-enchantment-tier4-superallstats": {
    price: {
      gold: 2000000000,
      dust: 4000,
      enchantments: [
        EnchantmentType.AllStatsSteal,
        EnchantmentType.BigMelee,
        EnchantmentType.BigCaster,
        EnchantmentType.Vampirism,
      ],
      description: "only the rarest",
    },
    offer: EnchantmentType.SuperAllStats,
    message: "The enchantments are fused into one",
    description: "unbelievable power",
  },
  "trimarim-enchantment-tier4-supervampmelee": {
    price: {
      gold: 2000000000,
      dust: 4000,
      enchantments: [
        EnchantmentType.AllStatsSteal,
        EnchantmentType.Vampirism,
        EnchantmentType.Vampirism,
        EnchantmentType.BigMelee,
      ],
      description: "only the rarest",
    },
    offer: EnchantmentType.SuperVampMelee,
    message: "The enchantments are fused into one",
    description: "unbelievable power",
  },
  "trimarim-enchantment-tier4-supervampsorc": {
    price: {
      gold: 2000000000,
      dust: 4000,
      enchantments: [
        EnchantmentType.AllStatsSteal,
        EnchantmentType.Vampirism,
        EnchantmentType.Vampirism,
        EnchantmentType.BigCaster,
      ],
      description: "only the rarest",
    },
    offer: EnchantmentType.SuperVampSorc,
    message: "The enchantments are fused into one",
    description: "unbelievable power",
  },
  "trimarim-enchantment-tier4-supermeleevamp": {
    price: {
      gold: 2000000000,
      dust: 4000,
      enchantments: [
        EnchantmentType.AllStatsSteal,
        EnchantmentType.BigMelee,
        EnchantmentType.BigMelee,
        EnchantmentType.Vampirism,
      ],
      description: "only the rarest",
    },
    offer: EnchantmentType.SuperMeleeVamp,
    message: "The enchantments are fused into one",
    description: "unbelievable power",
  },
  "trimarim-enchantment-tier4-supersorcvamp": {
    price: {
      gold: 2000000000,
      dust: 4000,
      enchantments: [
        EnchantmentType.AllStatsSteal,
        EnchantmentType.BigCaster,
        EnchantmentType.BigCaster,
        EnchantmentType.Vampirism,
      ],
      description: "only the rarest",
    },
    offer: EnchantmentType.SuperSorcVamp,
    message: "The enchantments are fused into one",
    description: "unbelievable power",
  },
};

async function executeTrimarimTrade(
  context: BaseContext,
  hero: Hero,
  tradeId: string
): Promise<NpcTradeResult> {
  const trade = TrimarimTrades[tradeId];
  if (!trade) {
    return { success: false, message: "not implemented" };
  }

  const priceResult = payForTrimarim(hero, trade.price);
  if (!priceResult.success) {
    return priceResult;
  }

  hero.enchantments.push(trade.offer);
  await context.db.hero.put(hero);
  return { success: true, message: trade.message };
}

function getTrimarimTrades(context: BaseContext, hero: Hero): NpcShop | null {
  const shop: NpcShop = {
    name: "Trimarim's Enchantment Shop",

    trades: [],
  };

  Object.keys(TrimarimTrades).forEach((tradeId) => {
    const trade = TrimarimTrades[tradeId];
    if (!trade) {
      return;
    }
    if (hasEnchantmentsForTrimarim(hero, trade.price)) {
      shop.trades.push({
        id: tradeId,
        price: trade.price,
        offer: {
          enchantments: [trade.offer],
          description: trade.description,
        },
      });
    }
  });

  if (shop.trades.length) {
    return shop;
  }
  return null;
}

function getUnupgradedItems(hero: Hero): InventoryItem[] {
  return hero.inventory.filter(
    (item) =>
      item.baseItem === "fishermans-luck" ||
      item.baseItem === "fishermans-strength" ||
      item.baseItem === "fishermans-intelligence" ||
      item.baseItem === "fishermans-wisdom" ||
      item.baseItem === "fishermans-willpower" ||
      item.baseItem === "fishermans-dexterity" ||
      item.baseItem === "fishermans-constitution"
  );
}

const NaxxremisClassUpgradeCost = 5000;
function getNaxxremisTrades(context: BaseContext, hero: Hero): NpcShop {
  const unupgradedItems = getUnupgradedItems(hero);

  const shop: NpcShop = {
    name: "Naxxremis the Crafter",

    trades: [],
  };

  if (unupgradedItems.length) {
    shop.trades.push({
      id: "naxxremis-class-upgrade",
      price: {
        dust: NaxxremisClassUpgradeCost,
        description: "a little dust",
      },
      offer: {
        questItems: ["A random class upgrade you have not yet unlocked"],
        description: "something you'd otherwise miss",
      },
    });
  }

  return shop;
}
async function executeNaxxremisTrade(
  context: BaseContext,
  hero: Hero,
  tradeId: string
): Promise<NpcTradeResult> {
  if (tradeId === "naxxremis-class-upgrade") {
    if (hero.enchantingDust < NaxxremisClassUpgradeCost) {
      return {
        success: false,
        message: "You do not have enough enchanting dust for this.",
      };
    }
    const unupgradedItems = getUnupgradedItems(hero);
    if (!unupgradedItems.length) {
      return {
        success: false,
        message: "You do not have any items to upgrade.",
      };
    }
    const itemToUpgrade =
      unupgradedItems[Math.floor(unupgradedItems.length * Math.random())];

    if (itemToUpgrade.baseItem === "fishermans-luck") {
      hero = giveQuestItemNotification(context, hero, "gambling-kit");
      hero = takeQuestItem(hero, "loaded-dice");
      hero = takeQuestItem(hero, "fishermans-luck");
    } else if (itemToUpgrade.baseItem === "fishermans-strength") {
      hero = giveQuestItemNotification(context, hero, "warriors-armlette");
      hero = takeQuestItem(hero, "warrior-plate");
      hero = takeQuestItem(hero, "fishermans-strength");
    } else if (itemToUpgrade.baseItem === "fishermans-intelligence") {
      hero = giveQuestItemNotification(context, hero, "tome-of-knowledge");
      hero = takeQuestItem(hero, "secret-codex");
      hero = takeQuestItem(hero, "fishermans-intelligence");
    } else if (itemToUpgrade.baseItem === "fishermans-wisdom") {
      hero = giveQuestItemNotification(context, hero, "patrons-wisdom");
      hero = takeQuestItem(hero, "patrons-mark");
      hero = takeQuestItem(hero, "fishermans-wisdom");
    } else if (itemToUpgrade.baseItem === "fishermans-willpower") {
      hero = giveQuestItemNotification(context, hero, "liturgical-censer");
      hero = takeQuestItem(hero, "righteous-incense");
      hero = takeQuestItem(hero, "fishermans-willpower");
    } else if (itemToUpgrade.baseItem === "fishermans-dexterity") {
      hero = giveQuestItemNotification(context, hero, "quiver-of-speed");
      hero = takeQuestItem(hero, "fletching-leather");
      hero = takeQuestItem(hero, "fishermans-dexterity");
    } else if (itemToUpgrade.baseItem === "fishermans-constitution") {
      hero = giveQuestItemNotification(context, hero, "vampire-ring");
      hero = takeQuestItem(hero, "blood-stone");
      hero = takeQuestItem(hero, "fishermans-constitution");
    }
    hero.enchantingDust -= NaxxremisClassUpgradeCost;
    await context.db.hero.put(hero);
    return {
      success: true,
      message: "His power amazes you.",
    };
  }
  return { success: false, message: "not implemented" };
}

type SummoningCost = {
  gold?: number;
  dust?: number;
};

const domariAberrationCosts: SummoningCost[] = [
  {
    gold: 1000000000,
    dust: 1000,
  },
];

const domariAberrations: Omit<MonsterInstance, "id" | "location">[] = [
  AberrationStats["domari-aberration-1"],
];

// domari the aberration hunter
function getDomariTrades(context: BaseContext, hero: Hero): NpcShop {
  return {
    name: "Domari the Aberration Hunter",
    trades: [
      {
        id: "domari-aberration-1",
        price: {
          ...domariAberrationCosts[0],
          description: "some gold and dust",
        },
        offer: { description: "the location of a forgotten aberration" },
      },
    ],
  };
}
async function executeDomariTrade(
  context: BaseContext,
  hero: Hero,
  tradeId: string
): Promise<NpcTradeResult> {
  console.log("Attempting summon aberration", hero.name, tradeId);
  let tradeIndex = -1;
  switch (tradeId) {
    case "domari-aberration-1":
      tradeIndex = 0;
      break;
  }

  if (tradeIndex === -1) {
    return { success: false, message: `Trade not implemented: ${tradeId}` };
  }
  const costs = domariAberrationCosts[tradeIndex];
  const aberration = domariAberrations[tradeIndex];

  if (costs) {
    if (costs.gold) {
      if (hero.gold < costs.gold) {
        return { success: false, message: "You do not have enough gold!" };
      }
      hero.gold -= costs.gold;
    }
    if (costs.dust) {
      if (hero.enchantingDust < costs.dust) {
        return {
          success: false,
          message: "You do not have enough enchanting dust!",
        };
      }
      hero.enchantingDust -= costs.dust;
    }
  }
  if (aberration) {
    console.log({ aberration });
    let location: [number, number] = getRandomTerrainLocation(
      hero.location.map as MapNames,
      "land"
    );
    const monster = {
      ...aberration,
      location: {
        map: hero.location.map,
        x: location[0],
        y: location[1],
      },
    };

    await context.db.monsterInstances.create(monster);
    await context.db.hero.put(hero);

    return {
      success: true,
      message: `The ${aberration.monster.name} has been summoned at ${location[0]}, ${location[1]}`,
    };
  }
  return { success: false, message: "not implemented" };
}

function getRandomTerrainLocation(
  map: MapNames,
  targetTerrain: string
): [number, number] {
  for (let i = 0, l = 1000; i < l; ++i) {
    const location = getRandomLocation(map);
    const terrain = LocationData[map]?.locations[location[0]][location[1]];
    if (terrain?.terrain === targetTerrain) {
      return location;
    }
  }
  return [0, 0];
}
function getRandomLocation(map: MapNames): [number, number] {
  // floor so they cap out at 127 and 96
  return [Math.floor(Math.random() * 128), Math.floor(Math.random() * 96)];
}
