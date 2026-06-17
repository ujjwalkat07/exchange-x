import dotenv from "dotenv";
dotenv.config({ path: "./.env" });

// import dns from "dns";
// dns.setServers(["8.8.8.8", "1.1.1.1"]);
// dns.setDefaultResultOrder("ipv4first");

import mongoose from "mongoose";
import bcrypt from "bcrypt";
import { v4 as uuidv4 } from "uuid";
import { Redis } from "./config/redis-config/redis-connection";
import { Auth } from "./services/auth-services/auth-model";
import { Wallet } from "./services/wallet-services/wallet-model";
import { Order } from "./services/order-services/place-orders/order-model";
import { getLatestPrice } from "./websockets/price-fetch";
import { config } from "./config/env-config/config";

const seed = async () => {
  try {
    const directUri = String(config.MONGO_DB_URI)
    console.log("Connecting to MongoDB via direct URI...");
    await mongoose.connect(directUri);
    console.log("MongoDB connected successfully.");
    await Redis.connect();
    const redis = Redis.getClient();

    const admins = [
      { email: "admin1@gmail.com", fullName: "Admin One", usdt: 1000000, btc: 100 },
      { email: "admin2@gmail.com", fullName: "Admin Two", usdt: 1000000, btc: 100 },
    ];

    for (const adminInfo of admins) {
      const { email, fullName, usdt, btc } = adminInfo;
      console.log(`Checking for user: ${email}...`);

      let user = await Auth.findOne({ email });
      if (!user) {
        user = await Auth.create({
          fullName,
          email,
          password: "password123",
        });
        console.log(`User created with ID: ${user._id}`);
      } else {
        console.log(`User already exists with ID: ${user._id}`);
        user.password = "password123";
        await user.save();
      }

      const userId = user._id.toString();

      // Setup wallets (USDT and BTC)
      console.log(`Setting up wallets for ${fullName}...`);
      await Wallet.findOneAndUpdate(
        { user: user._id, asset: "USDT" },
        { balance: usdt },
        { upsert: true, new: true }
      );
      await Wallet.findOneAndUpdate(
        { user: user._id, asset: "BTC" },
        { balance: btc },
        { upsert: true, new: true }
      );

      // Seed Redis wallet cache
      const walletKey = `wallet:${userId}`;
      await redis.hSet(walletKey, {
        USDT: usdt.toString(),
        BTC: btc.toString(),
      });
      console.log(`Wallets configured in DB and Redis for ${fullName}.`);

      // Clean up any existing open orders
      console.log(`Cleaning up previous open orders for ${fullName}...`);
      const oldOrders = await Order.find({ user: user._id, positionStatus: "Open" });
      const oldOrderIds = oldOrders.map((o) => o.orderId);

      if (oldOrderIds.length > 0) {
        const pipeline = redis.multi();
        for (const orderId of oldOrderIds) {
          pipeline.del(`orderdetail:orderID:${orderId}`);
          pipeline.sRem(`openOrders:userId:${userId}`, orderId);
        }
        await pipeline.exec();

        // Clean up the orderbooks for BTCUSDT
        for (const order of oldOrders) {
          const orderbookKey = `orderbook:BTCUSDT:${order.orderSide}`;
          const memberValue = `${userId}|${order.orderId}|${order.orderQuantity}`;
          await redis.zRem(orderbookKey, memberValue);
        }

        await Order.deleteMany({ user: user._id, positionStatus: "Open" });
        console.log(`Cleared ${oldOrderIds.length} existing open orders.`);
      }
    }

    // 5. Get current price of BTCUSDT
    let currentPrice = 95000;
    try {
      currentPrice = await getLatestPrice("BTCUSDT");
      console.log(`Latest BTCUSDT price: $${currentPrice}`);
    } catch (err) {
      console.log(`Could not fetch live price, falling back to $${currentPrice}. Error: ${err}`);
    }

    // 6. Define dummy orders for admin1 and admin2
    const user1 = await Auth.findOne({ email: "admin1@gmail.com" });
    const user2 = await Auth.findOne({ email: "admin2@gmail.com" });

    if (!user1 || !user2) {
      throw new Error("Admin users could not be found/created.");
    }

    const orderTemplates = [
      // Admin 1 Orders
      { user: user1, side: "BUY", price: Math.round(currentPrice * 0.99), qty: 0.05 },
      { user: user1, side: "BUY", price: Math.round(currentPrice * 0.97), qty: 0.12 },
      { user: user1, side: "SELL", price: Math.round(currentPrice * 1.01), qty: 0.05 },
      { user: user1, side: "SELL", price: Math.round(currentPrice * 1.03), qty: 0.12 },

      // Admin 2 Orders
      { user: user2, side: "BUY", price: Math.round(currentPrice * 0.98), qty: 0.08 },
      { user: user2, side: "BUY", price: Math.round(currentPrice * 0.96), qty: 0.15 },
      { user: user2, side: "SELL", price: Math.round(currentPrice * 1.02), qty: 0.08 },
      { user: user2, side: "SELL", price: Math.round(currentPrice * 1.04), qty: 0.15 },
    ];

    console.log("Inserting dummy orders...");
    for (const template of orderTemplates) {
      const orderId = uuidv4();
      const amount = template.price * template.qty;
      const uId = template.user._id.toString();

      // Write to DB
      await Order.create({
        user: template.user._id,
        orderId,
        currencyPair: "BTCUSDT",
        orderQuantity: template.qty,
        orderAmount: amount,
        orderSide: template.side,
        orderType: "Limit",
        entryPrice: template.price,
        positionStatus: "Open",
      });

      // Write detail to Redis
      const orderDetail = {
        user: uId,
        orderId,
        orderSide: template.side,
        currencyPair: "BTCUSDT",
        orderType: "Limit",
        entryPrice: template.price.toString(),
        positionStatus: "Open",
        orderAmount: amount.toString(),
        orderQuantity: template.qty.toString(),
      };

      const pipeline = redis.multi();
      pipeline.hSet(`orderdetail:orderID:${orderId}`, orderDetail);
      pipeline.expire(`orderdetail:orderID:${orderId}`, 50000);
      pipeline.sAdd(`openOrders:userId:${uId}`, orderId);
      pipeline.expire(`openOrders:userId:${uId}`, 50000);
      await pipeline.exec();

      // Add to Orderbook Sorted Set
      const orderbookKey = `orderbook:BTCUSDT:${template.side}`;
      const memberValue = `${uId}|${orderId}|${template.qty}`;
      await redis.zAdd(orderbookKey, {
        score: template.price,
        value: memberValue,
      });

      console.log(`Placed ${template.side} limit order for ${template.qty} BTC at $${template.price} for user ${template.user.email} (ID: ${orderId})`);
    }

    console.log("Dummy orders successfully seeded!");
  } catch (error) {
    console.error("Seeding failed:", error);
  } finally {
    await mongoose.disconnect();
    // Wait slightly to let Redis connection disconnect cleanly
    setTimeout(() => {
      process.exit(0);
    }, 1000);
  }
};

seed();
