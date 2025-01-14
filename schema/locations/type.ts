import { gql } from "apollo-server";

export default gql`
  type Query {
    locationDetails(location: LocationInput): LocationDetails! @auth
    docks(map: String): [SpecialLocation!]! @auth
    availableUpgrades: [PlayerLocationUpgradeDescription!]! @auth
  }
  type Mutation {
    teleport(x: Int!, y: Int!): MoveResponse! @auth @delay(delay: 5000)
    sail(x: Int!, y: Int!): MoveResponse! @auth @delay(delay: 10000)
    move(direction: MoveDirection!): MoveResponse! @auth @delay(delay: 500)
    npcTrade(trade: ID!): NpcShopTradeResponse! @auth @delay(delay: 2000)

    # camps
    settleCamp: ExtendedLocationResponse! @auth @delay(delay: 10000)
    buyResource(resource: String!, amount: Int!): LevelUpResponse!
      @auth
      @delay(delay: 1000)
    sellResource(resource: String!, amount: Int!): LevelUpResponse!
      @auth
      @delay(delay: 1000)
    upgradeCamp(upgrade: PlayerLocationUpgrades!): ExtendedLocationResponse!
      @auth
      @delay(delay: 1000)
  }

  type ExtendedLocationResponse {
    account: BaseAccount!
    hero: Hero!
    camp: PlayerLocation
  }

  type PlayerLocationUpgradeDescription {
    type: PlayerLocationUpgrades!
    name: String!
    cost: [CampResources!]!
  }

  # will i use these? probably not...
  type LocationBuilding {
    id: ID!
    location: Location!
    owner: ID!
    publicOwner: PublicHero
  }

  # camps have the hero id as the id
  # buildings (anything mutually exclusive) id is location
  type PlayerLocation {
    id: ID!
    location: Location!
    owner: ID!
    publicOwner: PublicHero
    type: PlayerLocationType!
    upgrades: [PlayerLocationUpgrades!]!
    resources: [CampResources!]!
    lastUpkeep: String
  }

  type CampResources {
    name: String!
    value: Float!
    maximum: Float
  }

  enum PlayerLocationUpgrades {
    Tent
    FirePit
    ChoppingBlock
    RainCollectionUnit
    WoodStorage
    StoneStorage
    ImprovedCamp
    Garden
    HiredHelp

    TradingPost
    StorageCache
    Settlement
  }

  enum PlayerLocationType {
    Camp
    Settlement
  }

  type LocationDetails {
    location: Location!
    specialLocations: [SpecialLocation!]!
    terrain: TerrainData!
    shop: NpcShop
    players: [PublicHero!]
    playerLocations: [PlayerLocation!]
  }
  type SpecialLocation {
    location: Location!
    name: String!
    type: String!
    description: [String!]
  }
  type NpcShop {
    name: String!
    trades: [NpcShopTrade!]!
  }
  type NpcShopTrade {
    id: ID!
    price: NpcShopItems!
    offer: NpcShopItems!
  }
  type NpcShopItems {
    gold: Int
    dust: Int
    baseItems: [String!]
    enchantments: [EnchantmentType!]
    questItems: [String!]
    description: String
  }
  type NpcShopTradeResponse {
    success: Boolean!
    message: String!
    hero: Hero!
    account: BaseAccount!
  }

  type TerrainData {
    terrain: String!
  }

  type Location {
    x: Int!
    y: Int!
    map: ID!
  }
  input LocationInput {
    x: Int!
    y: Int!
    map: ID!
  }

  type MoveResponse {
    hero: Hero!
    account: BaseAccount!
    monsters: [MonsterInstance!]!
  }
`;
