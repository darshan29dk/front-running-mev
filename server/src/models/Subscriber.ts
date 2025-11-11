import mongoose, { Schema, Document } from 'mongoose';

type AlertPreferences = {
  sandwich: boolean;
  frontrun: boolean;
  backrun: boolean;
  highGas: boolean;
  highSlippage: boolean;
};

export interface SubscriberDocument extends Document {
  email: string;
  alerts: AlertPreferences;
  subscribedAt: Date;
  lastNotifiedAt?: Date;
}

const alertPreferencesSchema = new Schema<AlertPreferences>(
  {
    sandwich: { type: Boolean, default: true },
    frontrun: { type: Boolean, default: true },
    backrun: { type: Boolean, default: true },
    highGas: { type: Boolean, default: true },
    highSlippage: { type: Boolean, default: true },
  },
  { _id: false }
);

const subscriberSchema = new Schema<SubscriberDocument>(
  {
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    alerts: { type: alertPreferencesSchema, default: () => ({}) },
    subscribedAt: { type: Date, default: () => new Date() },
    lastNotifiedAt: { type: Date },
  },
  {
    timestamps: true,
  }
);

export default mongoose.model<SubscriberDocument>('Subscriber', subscriberSchema);
