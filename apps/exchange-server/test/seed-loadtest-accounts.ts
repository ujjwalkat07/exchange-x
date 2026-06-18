import dotenv from "dotenv";
dotenv.config({ path: "./.env" });

import mongoose from "mongoose";
import fs from "fs";
import path from "path";
import { Redis } from "../src/config/redis-config/redis-connection";
import { Auth } from "../src/services/auth-services/auth-model";
import { Wallet } from "../src/services/wallet-services/wallet-model";
import { Order } from "../src/services/order-services/place-orders/order-model";
import { getAccessAndRefreshToken } from "../src/utils/get-access-and-refresh-token";
import { config } from "../src/config/env-config/config";

const seedLoadtestAccounts = async () => {
  try {
    const directUri = String(config.MONGO_DB_URI);
    console.log("Connecting to MongoDB...");
    await mongoose.connect(directUri);
    console.log("MongoDB connected successfully.");
    await Redis.connect();
    const redis = Redis.getClient();

    const NUM_ACCOUNTS = 1000;
    const tokens: string[] = [];

    console.log(`\nStarting cleanup of previous loadtest accounts...`);
    
    // Find all users matching loadtest pattern
    const existingUsers = await Auth.find({ email: /^loadtest.*@gmail\.com$/ });
    const existingUserIds = existingUsers.map(u => u._id);

    if (existingUserIds.length > 0) {
      console.log(`Cleaning up ${existingUserIds.length} existing loadtest users and their data...`);
      
      // Clear wallets in MongoDB
      await Wallet.deleteMany({ user: { $in: existingUserIds } });
      
      // Clear open orders in MongoDB
      const openOrders = await Order.find({ user: { $in: existingUserIds }, positionStatus: "Open" });
      const openOrderIds = openOrders.map(o => o.orderId);
      
      if (openOrderIds.length > 0) {
        await Order.deleteMany({ orderId: { $in: openOrderIds } });
      }

      // Clear Redis keys for each existing user
      const pipeline = redis.multi();
      for (const user of existingUsers) {
        const userIdStr = user._id.toString();
        pipeline.del(`wallet:${userIdStr}`);
        pipeline.del(`openOrders:userId:${userIdStr}`);
      }
      
      for (const orderId of openOrderIds) {
        pipeline.del(`orderdetail:orderID:${orderId}`);
      }
      await pipeline.exec();

      // Clear Orderbooks in Redis
      for (const side of ["BUY", "SELL"]) {
        const bookKey = `orderbook:BTCUSDT:${side}`;
        const members = await redis.zRange(bookKey, 0, -1);
        for (const member of members) {
          const parts = member.split("|");
          if (parts[0] && existingUserIds.some(id => id.toString() === parts[0])) {
            await redis.zRem(bookKey, member);
          }
        }
      }

      // Delete users from MongoDB
      await Auth.deleteMany({ _id: { $in: existingUserIds } });
      console.log("Cleanup completed.");
    }

    console.log(`\nSeeding ${NUM_ACCOUNTS} loadtest accounts...`);
    const usdtBalance = 1000000;
    const btcBalance = 100;

    // We seed in chunks of 50 to prevent connection issues or overhead
    const chunkSize = 50;
    for (let i = 1; i <= NUM_ACCOUNTS; i += chunkSize) {
      const chunkPromises = [];
      const end = Math.min(i + chunkSize - 1, NUM_ACCOUNTS);

      for (let j = i; j <= end; j++) {
        chunkPromises.push((async (index) => {
          const email = `loadtest${index}@gmail.com`;
          const fullName = `Loadtest User ${index}`;
          const password = "password123";

          // Create User
          const user = await Auth.create({
            fullName,
            email,
            password,
          });
          const userIdStr = user._id.toString();

          // Create Wallets
          await Wallet.findOneAndUpdate(
            { user: user._id, asset: "USDT" },
            { balance: usdtBalance },
            { upsert: true, new: true }
          );
          await Wallet.findOneAndUpdate(
            { user: user._id, asset: "BTC" },
            { balance: btcBalance },
            { upsert: true, new: true }
          );

          // Seed Redis Wallet Cache
          await redis.hSet(`wallet:${userIdStr}`, {
            USDT: usdtBalance.toString(),
            BTC: btcBalance.toString(),
          });

          // Generate Token
          const { accessToken } = await getAccessAndRefreshToken(userIdStr);
          tokens.push(accessToken);
        })(j));
      }

      await Promise.all(chunkPromises);
      console.log(`Progress: seeded accounts ${i} to ${end}`);
    }

    // Write tokens to JSON file
    const tokenFilePath = path.join(__dirname, "../test/loadtest-tokens.json");
    fs.mkdirSync(path.dirname(tokenFilePath), { recursive: true });
    fs.writeFileSync(tokenFilePath, JSON.stringify(tokens, null, 2));
    
    console.log(`\nSuccessfully seeded ${NUM_ACCOUNTS} accounts!`);
    console.log(`Access tokens written to: ${tokenFilePath}`);
  } catch (error) {
    console.error("Seeding loadtest accounts failed:", error);
  } finally {
    await mongoose.disconnect();
    setTimeout(() => {
      process.exit(0);
    }, 1000);
  }
};

seedLoadtestAccounts();
