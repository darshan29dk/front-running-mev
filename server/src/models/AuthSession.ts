import mongoose, { Schema, Document } from 'mongoose';

export interface AuthSessionDocument extends Document {
  userId: mongoose.Types.ObjectId;
  walletAddress?: string;
  did?: string;
  jwtId: string;
  expiresAt: Date;
  createdAt: Date;
  updatedAt: Date;
}

const authSessionSchema = new Schema<AuthSessionDocument>(
  {
    userId: { type: Schema.Types.ObjectId, ref: 'UserProfile', required: true, index: true },
    walletAddress: { type: String, lowercase: true, sparse: true },
    did: { type: String, sparse: true },
    jwtId: { type: String, required: true, unique: true },
    expiresAt: { type: Date, required: true },
  },
  {
    timestamps: true,
  }
);

authSessionSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

export default mongoose.model<AuthSessionDocument>('AuthSession', authSessionSchema);
