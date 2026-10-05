export interface Transaction {
  id: string;
  targetUsername: string;
  coins: number;
  usdRate: number;
  totalUsd: number;
  senderName?: string;
  status: 'completed' | 'pending' | 'cancelled';
  note?: string;
  createdAt: string;
}

export interface PresetPackage {
  id: string;
  coins: number;
  popular?: boolean;
  bonus?: string;
  tag?: string;
}

export interface CreatorProfile {
  username: string;
  displayName: string;
  avatarUrl: string;
  followers: string;
  verified: boolean;
  bio: string;
}

export interface SystemSettings {
  coinRateUsd: number;
  presets: number[];
}
