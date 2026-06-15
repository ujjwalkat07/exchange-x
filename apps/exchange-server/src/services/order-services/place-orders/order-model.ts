import mongoose, { Schema, Document, Types, Model } from "mongoose";

export interface IOrder extends Document {
  user: Types.ObjectId;
  orderId: string;
  currencyPair: string;
  orderQuantity: number;
  orderAmount: number;
  orderType: string;
  orderSide: string;
  entryPrice: number;
  positionStatus: string;

  createdAt?: Date;
  updatedAt?: Date;
}

const orderSchema = new Schema<IOrder>(
  {
    user: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    orderId: {
      type: String,
      required: true,
    },
    currencyPair: {
      type: String,
      required: true,
    },
    orderQuantity: {
      type: Number,
      required: true,
    },
    orderAmount: {
      type: Number,
      required: true,
    },
    entryPrice: {
      type: Number,
      required: true,
      default: 0,
    },
    orderSide: {
      type: String,
      enum: ["BUY", "SELL"],
      required: true,
    },
    orderType: {
      type: String,
      enum: ["Market"],
      required: true,
    },
    positionStatus: {
      type: String,
      enum: ["Open", "Filled", "Closed", "Cancelled"],
      default: "Open",
    },
  },
  {
    timestamps: true,
  },
);

const Order: Model<IOrder> = mongoose.model<IOrder>("Order", orderSchema);

export { Order };
