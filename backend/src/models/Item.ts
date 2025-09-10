export type Trend = "positive" | "negative" | "neutral";

export interface ItemStatic {
  id: number;
  name: string;
  members: boolean;
  limit: number;
  value: number;
  highalch: number;
  lowalch: number;
  icon?: string;
}

export interface ItemDynamic extends ItemStatic {
  current: {
    price: number;
    trend: Trend;
  };
  today: {
    price: number;
    trend: Trend;
  };
  volume?: number;
}