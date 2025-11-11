import mongoose, { Schema, Document } from 'mongoose';

type AlertPreferences = {
  sandwich: boolean;
  frontrun: boolean;
  backrun: boolean;
  highGas: boolean;
  highSlippage: boolean;
};

type RewardEntry = {
  type: string;
  description?: string;
  points: number;
  awardedAt: Date;
};

export interface UserProfileDocument extends Document {
  address?: string;
  did?: string;
  email?: string;
  alias: string;
  points: number;
  level: number;
  badges: string[];
  rewards: RewardEntry[];
  protectedTransactions: number;
  alerts: AlertPreferences;
  leaderboardRank?: number;
  createdAt: Date;
  updatedAt: Date;
}

const alertPreferencesSchema = new Schema<AlertPreferences>(
  {
    sandwich: { type: Boolean, default: false },
    frontrun: { type: Boolean, default: false },
    backrun: { type: Boolean, default: false },
    highGas: { type: Boolean, default: false },
    highSlippage: { type: Boolean, default: false },
  },
  { _id: false }
);

const rewardEntrySchema = new Schema<RewardEntry>(
  {
    type: { type: String, required: true },
    description: { type: String },
    points: { type: Number, default: 0 },
    awardedAt: { type: Date, default: () => new Date() },
  },
  { _id: false }
);

const userProfileSchema = new Schema<UserProfileDocument>(
  {
    address: { type: String, index: true, sparse: true, lowercase: true },
    did: { type: String, index: true, sparse: true },
    email: { type: String, lowercase: true, sparse: true },
    alias: { type: String, required: true },
    points: { type: Number, default: 0 },
    level: { type: Number, default: 1 },
    badges: { type: [String], default: [] },
    rewards: { type: [rewardEntrySchema], default: [] },
    protectedTransactions: { type: Number, default: 0 },
    alerts: { type: alertPreferencesSchema, default: () => ({}) },
    leaderboardRank: { type: Number, index: true },
  },
  {
    timestamps: true,
  }
);

userProfileSchema.index({ points: -1 });
userProfileSchema.index({ level: -1 });

export default mongoose.model<UserProfileDocument>('UserProfile', userProfileSchema);
