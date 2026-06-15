import mongoose, { Schema, Document, Types } from "mongoose";

export interface IWallet extends Document {
  user: Types.ObjectId;
  asset: string;
  balance: number;
  createdAt?: Date;
  updatedAt?: Date;
}

const walletSchema = new mongoose.Schema<IWallet>(
  {
    user: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    asset: {
      type: String, // BTC, ETH, USDT
      required: true,
    },
    balance: {
      type: Number,
      required: true,
      default: 0,
    },
  },
  { timestamps: true },
);

const Wallet = mongoose.model<IWallet>("Wallet", walletSchema);

export { Wallet };
