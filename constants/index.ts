import RawLocationData from "./locations.json";

export type TerrainType = "land" | "water" | "forbidden";
export type MapNames = "default";
export type SpecialLocationType = "dock" | "quest" | "city" | "bridge";

export type LocationData = {
  terrain: TerrainType;
};

export type SpecialLocation = {
  x: number;
  y: number;
  name: string;
  type: SpecialLocationType;
};

export type LocationDataType = {
  [x in MapNames]: {
    locations: LocationData[][];
    specialLocations: SpecialLocation[];
  };
};

export const LocationData: LocationDataType =
  RawLocationData as LocationDataType;
