import dotenv from "dotenv";
dotenv.config({ path: "./.env" });

import dns from "dns";
dns.setServers(["8.8.8.8", "1.1.1.1"]);
dns.setDefaultResultOrder("ipv4first");

import mongoose from "mongoose";
import bcrypt from "bcrypt";
import { v4 as uuidv4 } from "uuid";
import { Redis } from "./config/redis-config/redis-connection";
import { Auth } from "./services/auth-services/auth-model";
import { Wallet } from "./services/wallet-services/wallet-model";
import { Order } from "./services/order-services/place-orders/order-model";
import { getLatestPrice } from "./websockets/price-fetch";

const seed = async () => {
  try {
    const directUri = "mongodb://itsashkatiyar07:RwaCV64nEj9hZrn1@ac-rqdo7ed-shard-00-00.nixcytd.mongodb.net:27017,ac-rqdo7ed-shard-00-01.nixcytd.mongodb.net:27017,ac-rqdo7ed-shard-00-02.nixcytd.mongodb.net:27017/?ssl=true&replicaSet=atlas-y6u59q-shard-0&authSource=admin&retryWrites=true&w=majority&appName=auth";
    console.log("Connecting to MongoDB via direct URI...");
    await mongoose.connect(directUri);
    console.log("MongoDB connected successfully.");
    await Redis.connect();
    const redis = Redis.getClient();

    const email = "admin1@gmail.com";
    console.log(`Checking for user: ${email}...`);

    // 2. Find or create the user
    let user = await Auth.findOne({ email });
    if (!user) {
      const hashedPassword = await bcrypt.hash("password123", 10);
      user = await Auth.create({
        fullName: "Admin One",
        email,
        password: hashedPassword,
      });
      console.log(`User created with ID: ${user._id}`);
    } else {
      console.log(`User already exists with ID: ${user._id}`);
    }

    const userId = user._id.toString();

    // 3. Setup wallets (USDT and BTC)
    console.log("Setting up wallets for the admin user...");
    await Wallet.findOneAndUpdate(
      { user: user._id, asset: "USDT" },
      { balance: 1000000 },
      { upsert: true, new: true }
    );
    await Wallet.findOneAndUpdate(
      { user: user._id, asset: "BTC" },
      { balance: 100 },
      { upsert: true, new: true }
    );

    // Seed Redis wallet cache
    const walletKey = `wallet:${userId}`;
    await redis.hSet(walletKey, {
      USDT: 1000000,
      BTC: 100,
    });
    console.log("Wallets configured in DB and Redis.");

    // 4. Clean up any existing open orders for admin1
    console.log("Cleaning up previous open orders for admin1...");
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

    // 5. Get current price of BTCUSDT
    let currentPrice = 95000;
    try {
      currentPrice = await getLatestPrice("BTCUSDT");
      console.log(`Latest BTCUSDT price: $${currentPrice}`);
    } catch (err) {
      console.log(`Could not fetch live price, falling back to $${currentPrice}. Error: ${err}`);
    }

    // 6. Define dummy orders (3 BUYs below currentPrice, 3 SELLs above currentPrice)
    const orderTemplates = [
      // BUY side
      { side: "BUY", price: Math.round(currentPrice * 0.99), qty: 0.05 },
      { side: "BUY", price: Math.round(currentPrice * 0.98), qty: 0.08 },
      { side: "BUY", price: Math.round(currentPrice * 0.97), qty: 0.12 },
      // SELL side
      { side: "SELL", price: Math.round(currentPrice * 1.01), qty: 0.05 },
      { side: "SELL", price: Math.round(currentPrice * 1.02), qty: 0.08 },
      { side: "SELL", price: Math.round(currentPrice * 1.03), qty: 0.12 },
    ];

    console.log("Inserting dummy orders...");
    for (const template of orderTemplates) {
      const orderId = uuidv4();
      const amount = template.price * template.qty;

      // Write to DB
      await Order.create({
        user: user._id,
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
        user: userId,
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
      pipeline.sAdd(`openOrders:userId:${userId}`, orderId);
      pipeline.expire(`openOrders:userId:${userId}`, 50000);
      await pipeline.exec();

      // Add to Orderbook Sorted Set
      const orderbookKey = `orderbook:BTCUSDT:${template.side}`;
      const memberValue = `${userId}|${orderId}|${template.qty}`;
      await redis.zAdd(orderbookKey, {
        score: template.price,
        value: memberValue,
      });

      console.log(`Placed ${template.side} limit order for ${template.qty} BTC at $${template.price} (ID: ${orderId})`);
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
